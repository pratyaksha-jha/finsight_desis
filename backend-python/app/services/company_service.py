import yfinance as yf
from sqlalchemy.orm import Session
from app.db_models import Company

TICKERS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'NVDA', 'TSM', 'ADBE', 'TSLA',
    'F', 'GM', 'BA', 'JPM', 'BAC', 'V', 'GS', 'JNJ', 'UNH', 'PFE', 'ABBV', 'WMT',
    'TGT', 'COST', 'KO', 'PEP', 'SBUX', 'NKE', 'XOM', 'CVX', 'VZ', 'T', 'DIS',
    'AMD', 'INTC', 'CSCO', 'UBER', 'PYPL', 'SQ', 'PLTR'
]

def sync_company_metadata(db: Session):
    for ticker in TICKERS:
        try:
            yf_ticker = yf.Ticker(ticker)
            info = yf_ticker.info

            company_name = info.get("longName") or info.get("shortName") or ticker
            sector = info.get("sector")
            industry = info.get("industry")

            existing = db.query(Company).filter(Company.ticker == ticker).first()

            if existing:
                existing.company_name = company_name
                existing.sector = sector
                existing.industry = industry
            else:
                db.add(Company(
                    ticker=ticker,
                    company_name=company_name,
                    sector=sector,
                    industry=industry
                ))

            db.commit()
 
        except Exception as e:
            print(f"Error syncing {ticker}: {e}")

def get_all_companies(db: Session):
    companies = db.query(Company).order_by(Company.company_name.asc()).all()
    return [
        {
            "ticker": c.ticker, 
            "company_name": c.company_name, 
            "sector": c.sector, 
            "industry": c.industry
        } 
        for c in companies
    ]

def get_company(db: Session, ticker: str):
    c = db.query(Company).filter(Company.ticker == ticker).first()
    if not c:
        return None
        
    return {
        "ticker": c.ticker, 
        "company_name": c.company_name, 
        "sector": c.sector, 
        "industry": c.industry
    }