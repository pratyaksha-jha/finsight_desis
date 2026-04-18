from sqlalchemy import Column, Integer, String, BigInteger, Float, Date, Numeric
from app.db import Base


class HistoricalReport(Base):
    __tablename__ = "historical_reports"

    ticker = Column(String, primary_key=True)
    fiscal_year = Column(Integer, primary_key=True)
    date = Column(String)
    revenue = Column(BigInteger)
    gross_profit = Column(BigInteger)
    gross_margin = Column(Float)
    net_income = Column(BigInteger)
    net_margin = Column(Float)
    operating_cash_flow = Column(BigInteger)
    free_cash_flow = Column(BigInteger)
    eps = Column(Float)


class Company(Base):
    __tablename__ = "companies"

    ticker = Column(String, primary_key=True, index=True)
    company_name = Column(String)
    sector = Column(String)
    industry = Column(String)


class DailyPrice(Base):
    __tablename__ = "daily_prices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticker = Column(String, index=True, nullable=False)
    date = Column(Date, index=True, nullable=False)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)


class PortfolioHolding(Base):
    """Used by Pratyaksha's AI summary / portfolio fit feature."""
    __tablename__ = "portfolio_holdings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, index=True, nullable=False)
    ticker = Column(String, index=True, nullable=False)
    quantity = Column(Float, nullable=False)
    avg_buy_price = Column(Float, nullable=True)
    sector = Column(String, nullable=True)
    current_price = Column(Float, nullable=True)
    current_value = Column(Float, nullable=True)


class Holding(Base):
    """Used by Garima's diversification / leaderboard feature (CSV upload)."""
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, index=True, nullable=False, default="default")
    ticker = Column(String, nullable=False)
    sector = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    avg_buy_price = Column(Numeric(12, 2), nullable=False)
    current_price = Column(Numeric(12, 2), nullable=False)
