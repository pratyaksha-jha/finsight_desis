from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.services.financial_service import get_financial_history, sync_financial_data, sync_all_financial_data

router = APIRouter(prefix="/financials", tags=["financials"])

@router.post("/{ticker}/sync")
def sync_financials(ticker: str, db: Session = Depends(get_db)):
    return sync_financial_data(db, ticker)

@router.post("/sync-all/now")
def sync_all_financials(db: Session = Depends(get_db)):
    return sync_all_financial_data(db)

@router.get("/{ticker}")
def financials(ticker: str, db: Session = Depends(get_db)):
    return {
        "ticker": ticker,
        "financials": get_financial_history(db, ticker)
    }
