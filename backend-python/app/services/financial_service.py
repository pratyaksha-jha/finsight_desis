from sqlalchemy.orm import Session
from app.db_models import HistoricalReport
import yfinance as yf
import pandas as pd
import time

def get_financial_history(db: Session, ticker: str):
    rows = (
        db.query(HistoricalReport)
        .filter(HistoricalReport.ticker == ticker)
        .order_by(HistoricalReport.fiscal_year.asc())
        .all()
    )

    return [
        {
            "year": row.fiscal_year,
            "date": row.date,
            "revenue": row.revenue,
            "gross_profit": row.gross_profit,
            "gross_margin": row.gross_margin,
            "net_income": row.net_income,
            "net_margin": row.net_margin,
            "operating_cash_flow": row.operating_cash_flow,
            "free_cash_flow": row.free_cash_flow,
            "eps": row.eps
        }
        for row in rows
    ]

def get_latest_two_reports(db: Session, ticker: str):
    rows = (
        db.query(HistoricalReport)
        .filter(HistoricalReport.ticker == ticker)
        .order_by(HistoricalReport.fiscal_year.desc())
        .limit(2)
        .all()
    )
    return rows

def safe_float(df, row_name, col):
    """Safely extracts a value from a yfinance DataFrame."""
    try:
        val = df.loc[row_name, col]
        return float(val) if pd.notna(val) else 0.0
    except KeyError:
        return 0.0

def sync_financial_data(db: Session, ticker: str):
    ticker = ticker.strip().upper()
    try:
        stock = yf.Ticker(ticker)
        
        # Fetch income statement and cash flow
        income = stock.income_stmt
        cashflow = stock.cashflow
        
        if income.empty:
            return {"message": f"No financial data found for {ticker}", "inserted": 0}

        inserted = 0
        
        for date_col in income.columns:
            # Extract the year from the timestamp
            fiscal_year = date_col.year
            date_str = date_col.strftime('%Y-%m-%d')
            
            # Extract metrics
            revenue = safe_float(income, "Total Revenue", date_col)
            gross_profit = safe_float(income, "Gross Profit", date_col)
            net_income = safe_float(income, "Net Income", date_col)
            eps = safe_float(income, "Basic EPS", date_col)
            
            operating_cash_flow = safe_float(cashflow, "Operating Cash Flow", date_col) if not cashflow.empty else 0.0
            free_cash_flow = safe_float(cashflow, "Free Cash Flow", date_col) if not cashflow.empty else 0.0
            
            # Calculate margins
            gross_margin = (gross_profit / revenue * 100) if revenue > 0 else 0.0
            net_margin = (net_income / revenue * 100) if revenue > 0 else 0.0

            # Check if this year already exists in the database
            existing = (
                db.query(HistoricalReport)
                .filter(HistoricalReport.ticker == ticker, HistoricalReport.fiscal_year == fiscal_year)
                .first()
            )

            if existing:
                existing.revenue = revenue
                existing.gross_profit = gross_profit
                existing.gross_margin = gross_margin
                existing.net_income = net_income
                existing.net_margin = net_margin
                existing.operating_cash_flow = operating_cash_flow
                existing.free_cash_flow = free_cash_flow
                existing.eps = eps
            else:
                db.add(HistoricalReport(
                    ticker=ticker,
                    fiscal_year=fiscal_year,
                    date=date_str,
                    revenue=revenue,
                    gross_profit=gross_profit,
                    gross_margin=gross_margin,
                    net_income=net_income,
                    net_margin=net_margin,
                    operating_cash_flow=operating_cash_flow,
                    free_cash_flow=free_cash_flow,
                    eps=eps
                ))
                inserted += 1

        db.commit()
        return {"message": f"Synced financials for {ticker}", "inserted": inserted}

    except Exception as e:
        db.rollback()
        print(f"Error syncing financials for {ticker}: {e}")
        return {"message": str(e), "inserted": 0}

from app.services.company_service import TICKERS

def sync_all_financial_data(db: Session):
    results = []
    for ticker in TICKERS:
        try:
            res = sync_financial_data(db, ticker)
            results.append({"ticker": ticker, "result": res})

            time.sleep(2)
        except Exception as e:
            results.append({"ticker": ticker, "error": str(e)})
    return results