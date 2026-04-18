from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.db_models import Holding
from app.services.finance_service import compute_leaderboard

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("/")
def get_leaderboard(user_id: str = Query(default="default"), db: Session = Depends(get_db)):
    rows = db.query(Holding).filter(Holding.user_id == user_id).order_by(Holding.ticker).all()
    if not rows:
        return []

    holdings = [
        {
            "ticker": r.ticker,
            "sector": r.sector,
            "quantity": r.quantity,
            "avg_buy_price": float(r.avg_buy_price),
            "current_price": float(r.current_price),
            "value": float(r.current_price) * r.quantity,
        }
        for r in rows
    ]
    return compute_leaderboard(holdings)
