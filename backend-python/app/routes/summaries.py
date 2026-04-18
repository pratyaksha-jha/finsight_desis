from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.services.summary_service import generate_ai_summary

router = APIRouter(prefix="/summaries", tags=["summaries"])

@router.get("/{ticker}")
def summary(ticker: str, user_id: str = None, db: Session = Depends(get_db)):
    return generate_ai_summary(db, ticker, user_id)