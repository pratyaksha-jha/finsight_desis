import yfinance as yf
import pandas as pd
from sqlalchemy.orm import Session
from app.db_models import DailyPrice
from datetime import datetime, timedelta

def safe_float(value):
    if pd.isna(value):
        return None
    return float(value)

def update_daily_prices(db: Session, ticker: str):
    try:
        ticker = ticker.strip().upper()
        stock = yf.Ticker(ticker)
        hist = stock.history(period="5y")

        if hist.empty:
            return {"message": f"No price data found for {ticker}", "inserted": 0, "updated": 0}

        inserted = 0
        updated = 0

        for idx, row in hist.iterrows():
            price_date = idx.date()

            existing = (
                db.query(DailyPrice)
                .filter(DailyPrice.ticker == ticker, DailyPrice.date == price_date)
                .first()
            )

            if existing:
                existing.open = safe_float(row["Open"])
                existing.high = safe_float(row["High"])
                existing.low = safe_float(row["Low"])
                existing.close = safe_float(row["Close"])
                existing.volume = safe_float(row["Volume"])
                updated += 1
            else:
                db.add(DailyPrice(
                    ticker=ticker,
                    date=price_date,
                    open=safe_float(row["Open"]),
                    high=safe_float(row["High"]),
                    low=safe_float(row["Low"]),
                    close=safe_float(row["Close"]),
                    volume=safe_float(row["Volume"])
                ))
                inserted += 1

        db.commit()

        return {
            "message": f"Updated prices for {ticker}",
            "inserted": inserted,
            "updated": updated
        }

    except Exception as e:
        db.rollback()
        return {
            "message": f"Error updating {ticker}: {str(e)}",
            "inserted": 0,
            "updated": 0
        }

def get_price_history(db: Session, ticker: str, range_type: str = "1y"):
    ticker = ticker.strip().upper()

    rows = (
        db.query(DailyPrice)
        .filter(DailyPrice.ticker == ticker)
        .order_by(DailyPrice.date.asc())
        .all()
    )

    if not rows:
        return []

    today = rows[-1].date

    if range_type == "1m":
        cutoff = today - timedelta(days=30)
    elif range_type == "3m":
        cutoff = today - timedelta(days=90)
    elif range_type == "6m":
        cutoff = today - timedelta(days=180)
    elif range_type == "1y":
        cutoff = today - timedelta(days=365)
    elif range_type == "5y":
        cutoff = today - timedelta(days=5 * 365)
    else:
        cutoff = today - timedelta(days=365)

    filtered = [row for row in rows if row.date >= cutoff]

    return [
        {
            "date": str(row.date),
            "open": row.open,
            "high": row.high,
            "low": row.low,
            "close": row.close,
            "volume": row.volume
        }
        for row in filtered if row.close is not None
    ]