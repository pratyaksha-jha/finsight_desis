import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from fastapi import Depends

from app.db import Base, engine, get_db
from app import models
from app.routes import companies, financials, prices, summaries, diversification, leaderboard
from app.services.scheduler_service import start_scheduler, stop_scheduler
import yfinance as yf

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    start_scheduler()
    print("FinSight Python backend started.")
    print("Visit http://localhost:8000/docs to sync data (run sync-all on first launch)")
    yield
    stop_scheduler()


app = FastAPI(
    title="FinSight Stock & Analytics API",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(companies.router)
app.include_router(financials.router)
app.include_router(prices.router)
app.include_router(summaries.router)
app.include_router(diversification.router)
app.include_router(leaderboard.router)


@app.get("/")
def root():
    return {"message": "FinSight Python backend running. Visit /docs to sync data."}

@app.get("/api/stock/price/{ticker}")
def get_live_price(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        
        # Grab both current price and previous close
        current_price = stock.fast_info['last_price']
        prev_close = stock.fast_info['previous_close']
        
        return {
            "price": round(current_price, 2),
            "prev_close": round(prev_close, 2) # Send this to React!
        }
        
    except Exception as e:
        print(f"Failed to fetch {ticker}: {str(e)}")
        return {"error": "Could not fetch price", "price": None}