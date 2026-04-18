from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.market_service import get_price_history, update_daily_prices
from app.services.company_service import TICKERS

router = APIRouter(prefix="/prices", tags=["prices"])


@router.get("/{ticker}")
def price_history(ticker: str, range_type: str = "1y", db: Session = Depends(get_db)):
    return {
        "ticker": ticker,
        "range": range_type,
        "prices": get_price_history(db, ticker, range_type)
    }


@router.post("/{ticker}/update")
def update_price(ticker: str, db: Session = Depends(get_db)):
    return update_daily_prices(db, ticker)


@router.post("/update-all")
def update_all_prices(db: Session = Depends(get_db)):
    results = []
    for ticker in TICKERS:
        results.append({
            "ticker": ticker,
            "result": update_daily_prices(db, ticker)
        })
    return results