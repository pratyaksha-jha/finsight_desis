import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../../.env'))

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) 
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def generate_diversification_recommendations(payload: dict) -> list:
    """
    payload contains:
    - score: current diversification score (0-100)
    - sectors: list of {sector, pct} showing current allocation
    - top_correlations: list of {a, b, val} for highest correlated pairs
    - num_holdings: total number of stocks
    - avg_correlation: mean pairwise correlation
    """

    system_prompt = """\
You are a concise portfolio diversification advisor inside an investment dashboard.

Rules:
- Give exactly 3 recommendations, no more.
- Each recommendation must be one sentence, max 20 words.
- Be specific: name sectors or stock types to add/reduce, not generic advice.
- Focus on what would actually raise the diversification score.
- No jargon, no disclaimers, no preamble.
- Return ONLY a valid JSON array of 3 strings, nothing else.
  Example: ["Add Healthcare stocks to offset Tech concentration.", "Reduce AAPL/MSFT overlap — both move together.", "Consider a REIT or commodity ETF for negative correlation."]
"""

    user_prompt = f"""\
Portfolio data:
- Diversification score: {payload['score']}/100
- Holdings: {payload['num_holdings']} stocks
- Average pairwise correlation: {payload['avg_correlation']:.2f} (lower is better)
- Sector breakdown: {', '.join(f"{s['sector']} {s['pct']}%" for s in payload['sectors'])}
- Most correlated pairs: {', '.join(f"{p['a']}&{p['b']} (r={p['val']:.2f})" for p in payload['top_correlations'][:3]) if payload['top_correlations'] else 'none'}

Give 3 specific one-sentence recommendations to improve this portfolio's diversification score.
Return only a JSON array of 3 strings.
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        max_tokens=300,
    )

    text = response.choices[0].message.content.strip()
    if text.startswith("```"):
        text = text.strip("`").replace("json", "", 1).strip()

    parsed = json.loads(text)
    # Model may return {"recommendations": [...]} or directly a list wrapped in a key
    if isinstance(parsed, list):
        return parsed[:3]
    for v in parsed.values():
        if isinstance(v, list):
            return v[:3]
    return ["Could not generate recommendations. Please try again."]


def generate_openai_stock_summary(payload: dict) -> dict:
    """
    payload contains:
    - ticker
    - company_name
    - sector
    - latest_period
    - metrics
    - portfolio_fit
    """

    system_prompt = """
You are a careful financial analysis assistant inside an investment dashboard.

Your job:
1. Summarize the company's latest financial direction clearly.
2. Give an investment recommendation: Invest, Watch, or Avoid.
3. Give a risk level: Low, Medium, or High.
4. Explain positives and risks.
5. If portfolio_fit information is provided, say whether this stock is a good fit for this user's portfolio.
6. Be concise, practical, and neutral.
7. Do not claim certainty. This is an AI-based assessment, not guaranteed financial advice.

Return ONLY valid JSON with this exact shape:
{
  "summary": "string",
  "impact": "Positive|Neutral|Negative",
  "recommendation": "Invest|Watch|Avoid",
  "risk_level": "Low|Medium|High",
  "confidence": 0,
  "positives": ["string"],
  "risks": ["string"],
  "portfolio_fit_label": "Good fit|Moderate fit|Poor fit|Not available",
  "portfolio_fit_reason": "string"
}
"""

    user_prompt = f"""
Analyze this stock for an investor dashboard.

Input data:
{json.dumps(payload, indent=2)}

Instructions:
- Base the recommendation on the provided financial and portfolio data.
- If the portfolio is already highly concentrated in the same sector, mention that.
- Confidence should be an integer from 0 to 100.
- Keep positives and risks short.
- Return only JSON.
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        response_format={"type": "json_object"},
    )

    text = response.choices[0].message.content.strip()

    # Remove accidental markdown fences if the model adds them
    if text.startswith("```"):
        text = text.strip("`")
        text = text.replace("json", "", 1).strip()

    return json.loads(text)