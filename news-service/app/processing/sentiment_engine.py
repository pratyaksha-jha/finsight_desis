import asyncio
import logging
import re
import time
from collections import deque
from html import unescape

from openai import OpenAI
from transformers import pipeline

from app.core.config import settings

_finbert = None
_logger = logging.getLogger(__name__)
_openai_client = None
_openai_timeout = 25.0
_openai_max_retries = 2
_openai_request_times: deque[float] = deque()
_openai_lock = asyncio.Lock()


def get_finbert():
    """Lazy-load FinBERT to avoid startup delays or download attempts."""
    global _finbert
    if _finbert is None:
        _finbert = pipeline(
            "text-classification",
            model="ProsusAI/finbert",
            tokenizer="ProsusAI/finbert",
            device=-1,  # CPU, use 0 for GPU
            return_all_scores=True,
            max_length=512,
            truncation=True,
        )
    return _finbert


def _get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        kwargs = {"timeout": _openai_timeout}
        if settings.openai_api_key:
            kwargs["api_key"] = settings.openai_api_key
        _openai_client = OpenAI(**kwargs)
    return _openai_client


async def classify_sentiment(text: str):
    """Run FinBERT for sentiment classification."""
    finbert = get_finbert()
    output = finbert(text[:3000])
    # Normalize pipeline output to a list of {label, score} dicts.
    if isinstance(output, dict):
        items = [output]
    elif isinstance(output, list):
        if output and isinstance(output[0], list):
            items = output[0]
        else:
            items = output
    else:
        items = []

    scores = {res["label"].upper(): res["score"] for res in items if isinstance(res, dict)}
    if not scores:
        # Fallback to neutral if model output is unexpected.
        return {
            "label": "NEUTRAL",
            "score": 0.0,
            "positive": 0.0,
            "neutral": 0.0,
            "negative": 0.0,
        }

    label = max(scores, key=scores.get)
    return {
        "label": label,
        "score": scores[label],
        "positive": scores.get("POSITIVE", 0),
        "neutral": scores.get("NEUTRAL", 0),
        "negative": scores.get("NEGATIVE", 0)
    }

async def compute_impact_score(sentiment_score: float, title: str, is_primary: bool, source_credibility: float = 0.5):
    """
    Day 4 Advancement: Advanced Weighted Impact Scoring.
    Combines sentiment strength, keyword urgency, ticker priority, and source credibility.
    """
    # Expanded High-impact keywords with weights
    CRITICAL_KEYWORDS = ["bankruptcy", "fraud", "ceo", "acquisition", "merger", "earnings", "guidance"]
    URGENT_KEYWORDS = ["fda", "lawsuit", "layoff", "dividend", "rating", "sec"]
    
    title_lower = title.lower()
    
    keyword_score = 0.0
    if any(kw in title_lower for kw in CRITICAL_KEYWORDS):
        keyword_score = 0.4
    elif any(kw in title_lower for kw in URGENT_KEYWORDS):
        keyword_score = 0.2
        
    sentiment_strength = abs(sentiment_score - 0.5) * 2
    primary_weight = 0.2 if is_primary else 0.05
    
    # Advanced Weighted Formula
    # 30% Sentiment, 30% Keywords, 20% Source Trust, 20% Ticker Relevance
    raw_score = (
        (0.3 * sentiment_strength) + 
        (0.3 * keyword_score) + 
        (0.2 * source_credibility) + 
        (0.2 * primary_weight)
    )
    
    impact_score = min(1.0, raw_score * 2.0) # Normalized
    
    if impact_score >= 0.75:
        level = "HIGH"
    elif impact_score >= 0.4:
        level = "MEDIUM"
    else:
        level = "LOW"
        
    return impact_score, level


def _explanation_guidance(detail: str, format_style: str) -> tuple[str, int]:
    detail = detail.lower()
    format_style = format_style.lower()

    if detail == "short":
        sentences = 2
        max_tokens = 220
    elif detail == "detailed":
        sentences = 6
        max_tokens = 900
    else:
        sentences = 4
        max_tokens = 520

    if format_style == "bullets":
        style = f"Write {sentences} concise bullet points (one sentence each)."
    else:
        style = f"Write {sentences} concise sentences in a single paragraph."

    style += (
        " Include: (1) key drivers, (2) near-term impact, "
        "(3) potential risks/uncertainties, (4) expected time horizon, "
        "(5) a brief confidence statement."
    )
    if detail == "detailed":
        style += " Add one sentence on what would change the outlook next."
    if format_style == "bullets":
        style += " Output exactly the bullets with no preface or title."

    return style, max_tokens


def _clean_text(value: str) -> str:
    if not value:
        return ""
    text = re.sub(r"<[^>]+>", " ", value)
    text = unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _extract_bullets(text: str) -> list[str]:
    lines = [line.strip() for line in (text or "").splitlines() if line.strip()]
    bullets = []
    for line in lines:
        if line.startswith(("*", "-", "•")):
            bullets.append(line.lstrip("*-• ").strip())

    if not bullets and text:
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        bullets = [s.strip() for s in sentences if s.strip()]

    return bullets


def _ensure_bullets(
    text: str,
    target_count: int,
    title: str,
    ticker: str,
    sentiment: str,
) -> str:
    bullets = _extract_bullets(text)

    bullets = bullets[:target_count]
    return "\n".join(f"* {b}" for b in bullets) if bullets else ""


def _fallback_paragraph(title: str, ticker: str, sentiment: str, detail: str) -> str:
    detail = detail.lower()
    base = (
        f"{title.strip()} signals a {sentiment.lower()} tone for {ticker}. "
        "The headline suggests a near-term market reaction as investors digest the news. "
        "Risks include changes in guidance, demand, or margins that could shift sentiment."
    )
    if detail == "short":
        return (
            f"{title.strip()} suggests a {sentiment.lower()} signal for {ticker}. "
            "Near-term reaction may follow as investors assess the update."
        )
    if detail == "detailed":
        return (
            base
            + " The likely impact horizon is days to weeks, with additional volatility around follow-up data. "
            "Confidence is moderate given limited context beyond the headline."
        )
    return base


def _response_to_text(response) -> str:
    if response is None:
        return ""

    text = getattr(response, "output_text", None)
    if text:
        return text.strip()

    output = None
    if hasattr(response, "output"):
        output = response.output
    elif isinstance(response, dict):
        output = response.get("output")

    if not output:
        return ""

    parts: list[str] = []
    for item in output:
        item_type = getattr(item, "type", None) or (item.get("type") if isinstance(item, dict) else None)
        if item_type != "message":
            continue
        content = getattr(item, "content", None) or (item.get("content") if isinstance(item, dict) else None) or []
        for chunk in content:
            chunk_type = getattr(chunk, "type", None) or (chunk.get("type") if isinstance(chunk, dict) else None)
            if chunk_type == "output_text":
                value = getattr(chunk, "text", None) or (chunk.get("text") if isinstance(chunk, dict) else "")
                if value:
                    parts.append(value.strip())
    return "\n".join(p for p in parts if p).strip()


async def generate_explanation(
    title: str,
    content: str,
    ticker: str,
    sentiment: str,
    detail: str = "medium",
    format_style: str = "paragraph",
) -> tuple[str, bool]:
    """Generate impact explanation using OpenAI."""
    if not settings.openai_api_key:
        return ("", None)
    
    style, max_tokens = _explanation_guidance(detail, format_style)
    safe_title = _clean_text(title)
    safe_content = _clean_text(content)
    content_summary = safe_content[:600]
    prompt = f"""
    You are a senior financial analyst. {style} Explain how this news impacts {ticker}.
    Article Title: {safe_title}
    Content Summary: {content_summary}
    Predicted Sentiment: {sentiment}

    Guidelines: Be factual, quantify impact where possible, do not recommend any action.
    Keep the response structured and complete. Do not end mid-sentence.
    If the content is thin, explicitly say "Limited context" but still complete all sentences.
    Do not include any markdown or headings.
    """
    
    try:
        payload = {
            "model": settings.openai_model,
            "input": prompt,
            "temperature": 0.2,
            "max_output_tokens": max_tokens,
            "top_p": 0.9,
        }
        response = await _post_openai(payload)
        text = _response_to_text(response)
        if not text:
            _logger.warning("OpenAI returned empty text.")
        if text:
            if format_style.lower() == "bullets":
                target_count = 5 if detail.lower() == "detailed" else (2 if detail.lower() == "short" else 3)
                return (_ensure_bullets(text, target_count, title, ticker, sentiment), None)
            return (text, None)
        if format_style.lower() == "bullets":
            target_count = 5 if detail.lower() == "detailed" else (2 if detail.lower() == "short" else 3)
            return (_ensure_bullets("", target_count, title, ticker, sentiment), None)
        return ("", None)
    except Exception as exc:
        _logger.warning("OpenAI request failed. Error: %s", exc)
        if format_style.lower() == "bullets":
            target_count = 5 if detail.lower() == "detailed" else (2 if detail.lower() == "short" else 3)
            return (_ensure_bullets("", target_count, title, ticker, sentiment), None)
        return ("", None)


async def _post_openai(payload: dict):
    backoff = 0.8
    client = _get_openai_client()
    for attempt in range(1, _openai_max_retries + 1):
        try:
            await _respect_openai_rate_limit()
            return await asyncio.to_thread(client.responses.create, **payload)
        except Exception as exc:
            _logger.warning("OpenAI request error attempt %s: %s", attempt, exc)
            if attempt < _openai_max_retries:
                await asyncio.sleep(backoff)
                backoff *= 2
                continue
            raise


async def _respect_openai_rate_limit() -> None:
    rpm = max(settings.openai_rpm, 0)
    if rpm <= 0:
        return

    while True:
        async with _openai_lock:
            now = time.monotonic()
            while _openai_request_times and (now - _openai_request_times[0]) > 60:
                _openai_request_times.popleft()

            if len(_openai_request_times) < rpm:
                _openai_request_times.append(now)
                return

            wait_for = 60 - (now - _openai_request_times[0])

        await asyncio.sleep(max(wait_for, 0.5))
