from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.services.company_service import sync_company_metadata, get_all_companies, get_company 

router = APIRouter(prefix="/companies", tags=["companies"])

@router.get("/")
def list_companies(db: Session = Depends(get_db)):
    return get_all_companies(db)

@router.get("/{ticker}")
def company_details(ticker: str, db: Session = Depends(get_db)):
    return get_company(db, ticker)

@router.post("/sync")
def sync_companies(db: Session = Depends(get_db)):
    sync_company_metadata(db)
    return {"message": "Company metadata synced"}