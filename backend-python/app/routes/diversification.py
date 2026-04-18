import io
import csv
import pandas as pd
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.db_models import Holding
from app.services.finance_service import (
     compute_diversification_score,
    sector_breakdown, compute_correlation_matrix,
    average_pairwise_correlation,
)
from app.db_models import DailyPrice
from app.services.openai_service import generate_diversification_recommendations

router = APIRouter(prefix="/diversification", tags=["diversification"])

REQUIRED_COLS = {"ticker", "sector", "quantity", "avg_buy_price", "current_price"}

def get_actual_returns(db: Session, ticker: str) -> list:
    prices = db.query(DailyPrice.close).filter(DailyPrice.ticker == ticker).order_by(DailyPrice.date.asc()).all()
    if not prices:
        return []
    df = pd.DataFrame(prices, columns=['close'])
    return df['close'].pct_change().dropna().tolist()

def load_holdings(db: Session, user_id: str) -> list:
    rows = db.query(Holding).filter(Holding.user_id == user_id).order_by(Holding.ticker).all()
    result = []
    for r in rows:
        result.append({
            "ticker": r.ticker,
            "sector": r.sector,
            "quantity": r.quantity,
            "avg_buy_price": float(r.avg_buy_price),
            "current_price": float(r.current_price),
            "value": float(r.current_price) * r.quantity,
        })
    return result


@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    user_id: str = Query(default="default"),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    content = (await file.read()).decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))

    headers = set(h.strip().lower() for h in (reader.fieldnames or []))
    missing = REQUIRED_COLS - headers
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(missing)}")

    rows, errors = [], []
    for i, row in enumerate(reader, start=2):
        try:
            ticker        = row["ticker"].strip().upper()
            sector        = row["sector"].strip().title()
            quantity      = int(row["quantity"].strip())
            avg_buy_price = float(row["avg_buy_price"].strip())
            current_price = float(row["current_price"].strip())
            if quantity <= 0 or avg_buy_price <= 0 or current_price <= 0:
                raise ValueError("Values must be positive")
            rows.append((ticker, sector, quantity, avg_buy_price, current_price))
        except Exception as e:
            errors.append(f"Row {i}: {e}")

    if errors:
        raise HTTPException(status_code=400, detail={"error": "Validation failed", "details": errors})

    # Clear old data for this user and insert new
    db.query(Holding).filter(Holding.user_id == user_id).delete()
    for ticker, sector, quantity, avg_buy_price, current_price in rows:
        db.add(Holding(
            user_id=user_id,
            ticker=ticker,
            sector=sector,
            quantity=quantity,
            avg_buy_price=avg_buy_price,
            current_price=current_price,
        ))
    db.commit()
    return {"message": f"Uploaded {len(rows)} holdings successfully"}


@router.get("/score")
def get_diversification(user_id: str = Query(default="default"), db: Session = Depends(get_db)):
    holdings = load_holdings(db, user_id)
    if not holdings:
        return {"empty": True}

    returns = {h["ticker"]: get_actual_returns(db, h["ticker"]) for h in holdings}
    
    score = compute_diversification_score(holdings, returns)
    sectors = sector_breakdown(holdings)
    corr_matrix, tickers = compute_correlation_matrix(returns)

    # Build top correlated pairs for the AI prompt
    top_correlations = []
    for i in range(len(tickers)):
        for j in range(i + 1, len(tickers)):
            val = corr_matrix[tickers[i]].get(tickers[j], 0)
            top_correlations.append({"a": tickers[i], "b": tickers[j], "val": val})
    top_correlations.sort(key=lambda x: abs(x["val"]), reverse=True)

    avg_corr = average_pairwise_correlation(returns)

    # AI-generated recommendations
    try:
        recs = generate_diversification_recommendations({
            "score": score,
            "sectors": sectors,
            "top_correlations": top_correlations[:5],
            "num_holdings": len(holdings),
            "avg_correlation": avg_corr,
        })
    except Exception:
        # Fallback to simple rule-based if OpenAI fails
        recs = []
        top_sector_pct = max(s["pct"] for s in sectors)
        if score < 40:
            recs.append("Portfolio is highly concentrated. Add stocks from uncorrelated sectors.")
        elif score < 65:
            recs.append(f"Moderate diversification. Top sector at {top_sector_pct}% — reduce below 30%.")
            recs.append("Adding Healthcare, FMCG, or defensive stocks can lower overall correlation.")
        else:
            recs.append("Well diversified portfolio. Maintain sector balance as you add more stocks.")
        if len(holdings) < 5:
            recs.append("Portfolio has fewer than 5 stocks — more holdings generally improve diversification.")

    return {
        "score": score,
        "sectors": sectors,
        "correlation_matrix": corr_matrix,
        "tickers": tickers,
        "recommendations": recs,
    }


@router.get("/portfolio")
def get_portfolio(user_id: str = Query(default="default"), db: Session = Depends(get_db)):
    return load_holdings(db, user_id)