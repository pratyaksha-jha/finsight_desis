from sqlalchemy.orm import Session
from app.db_models import HistoricalReport, Company, Holding
from app.services.openai_service import generate_openai_stock_summary
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db_models import DailyPrice

def pct_change(current, previous):
    if current is None or previous is None or previous == 0:
        return None
    return ((current - previous) / previous) * 100


def get_latest_two_reports(db: Session, ticker: str):
    ticker = ticker.strip().upper()
    return (
        db.query(HistoricalReport)
        .filter(HistoricalReport.ticker == ticker)
        .order_by(HistoricalReport.fiscal_year.desc())
        .limit(2)
        .all()
    )


def get_company(db: Session, ticker: str):
    ticker = ticker.strip().upper()
    return db.query(Company).filter(Company.ticker == ticker).first()


def get_user_portfolio(db: Session, user_id: str):
    return (
        db.query(Holding)
        .filter(Holding.user_id == user_id)
        .all()
    )


def analyze_portfolio_fit(db: Session, portfolio, candidate_ticker, risk_free_rate=0.04):
    try:
        if not portfolio:
            return {"fit_label": "Not available", "fit_score": None, "fit_reason": "No portfolio data provided."}

        # Calculate total value using current_price * quantity
        total_value = sum((float(item.current_price) * float(item.quantity)) for item in portfolio if item.current_price and item.quantity)
        
        if total_value <= 0:
            return {"fit_label": "Not available", "fit_score": None, "fit_reason": "Portfolio value is zero."}

        # 1. Extract weights
        current_weights_dict = {}
        for item in portfolio:
            t = (item.ticker or "").upper()
            val = (float(item.current_price) * float(item.quantity)) if (item.current_price and item.quantity) else 0
            current_weights_dict[t] = current_weights_dict.get(t, 0) + (val / total_value)
        
        tickers = list(current_weights_dict.keys())
        candidate_upper = candidate_ticker.upper()
        
        if len(tickers) == 1 and tickers[0] == candidate_upper:
            return {"fit_label": "Poor fit", "fit_score": 20, "fit_reason": "Portfolio is 100% concentrated in this stock already."}

        # 2. Fetch historical data from local database (last 1 year)
        all_tickers = list(set(tickers + [candidate_upper]))
        one_year_ago = datetime.now() - timedelta(days=365)

        price_records = (
            db.query(DailyPrice.date, DailyPrice.ticker, DailyPrice.close)
            .filter(DailyPrice.ticker.in_(all_tickers))
            .filter(DailyPrice.date >= one_year_ago)
            .all()
        )

        if not price_records:
            return {"fit_label": "Not available", "fit_score": 50, "fit_reason": "Not enough historical price data for correlation."}

        # 3. Convert to Pandas DataFrame and Pivot
        df = pd.DataFrame(price_records, columns=['date', 'ticker', 'close_price'])
        
        # Pivot so rows are dates and columns are tickers
        price_matrix = df.pivot(index='date', columns='ticker', values='close_price')
        
        # Ensure data is sorted by date
        price_matrix = price_matrix.sort_index()

        # Calculate daily returns
        returns = price_matrix.pct_change().dropna()

        # Check if we are missing substantial data for any ticker
        if returns.empty or len(returns.columns) < len(all_tickers):
             return {"fit_label": "Not available", "fit_score": 50, "fit_reason": "Incomplete historical data for one or more requested tickers."}

        # 4. Calculate Expected Returns and Covariance (MPT Math)
        mean_returns = returns.mean() * 252
        cov_matrix = returns.cov() * 252

        def get_portfolio_metrics(weights_array, ticker_list):
            # FIX: Use .values to extract raw numpy arrays, preventing Pandas alignment crashes!
            port_return = np.dot(weights_array, mean_returns[ticker_list].values)
            cov_vals = cov_matrix.loc[ticker_list, ticker_list].values
            
            # FIX: Use max(0, ...) to prevent np.sqrt from crashing on floating point rounding errors
            port_volatility = np.sqrt(max(0, np.dot(weights_array.T, np.dot(cov_vals, weights_array))))
            sharpe_ratio = (port_return - risk_free_rate) / port_volatility if port_volatility > 0 else 0
            return sharpe_ratio

        # 5. Evaluate Current Portfolio
        current_weights = np.array([current_weights_dict[t] for t in tickers])
        current_sharpe = get_portfolio_metrics(current_weights, tickers)

        # 6. Evaluate Proposed Portfolio (10% allocation)
        proposed_allocation = 0.10 
        proposed_tickers = tickers.copy()
        
        if candidate_upper not in proposed_tickers:
            proposed_tickers.append(candidate_upper)
            new_weights = [w * (1 - proposed_allocation) for w in current_weights]
            new_weights.append(proposed_allocation)
        else:
            idx = proposed_tickers.index(candidate_upper)
            new_weights = [w * (1 - proposed_allocation) for w in current_weights]
            new_weights[idx] += proposed_allocation
            
        proposed_weights = np.array(new_weights)
        proposed_sharpe = get_portfolio_metrics(proposed_weights, proposed_tickers)

        # 7. Map to Score
        sharpe_delta = proposed_sharpe - current_sharpe
        raw_score = 50 + (sharpe_delta * 100) 
        fit_score = max(0, min(100, int(round(raw_score))))

        if fit_score >= 70:
            fit_label = "Good fit"
            fit_reason = f"Adding this stock mathematically improves the portfolio's risk-adjusted return (Sharpe Ratio increased by {sharpe_delta:.2f})."
        elif fit_score >= 40:
            fit_label = "Moderate fit"
            fit_reason = f"This stock has a neutral impact on portfolio variance (Sharpe Ratio change: {sharpe_delta:.2f})."
        else:
            fit_label = "Poor fit"
            fit_reason = f"Adding this stock decreases the portfolio's risk-adjusted returns (Sharpe Ratio dropped by {abs(sharpe_delta):.2f})."

        return {
            "fit_label": fit_label,
            "fit_score": fit_score,
            "fit_reason": fit_reason
        }
    except Exception as e:
        print(f"Portfolio fit error safely caught: {e}")
        # Guarantees the AI Summary still loads even if the math module fails
        return {
            "fit_label": "Not available",
            "fit_score": None,
            "fit_reason": "Portfolio math error: Could not align historical price data for volatility testing."
        }

def generate_ai_summary(db: Session, ticker: str, user_id: str = None):
    ticker = ticker.strip().upper()
    reports = get_latest_two_reports(db, ticker)
    company = get_company(db, ticker)

    if len(reports) < 2:
        return {
            "ticker": ticker,
            "period": "Latest",
            "summary": "Not enough historical reports are available to generate an AI summary.",
            "impact": "Neutral",
            "recommendation": "Watch",
            "risk_level": "Medium",
            "confidence": 40,
            "positives": [],
            "risks": ["Insufficient historical data"],
            "portfolio_fit": None
        }

    current = reports[0]
    previous = reports[1]

    metrics = {
        "revenue_change_pct": pct_change(current.revenue, previous.revenue),
        "gross_profit_change_pct": pct_change(current.gross_profit, previous.gross_profit),
        "net_income_change_pct": pct_change(current.net_income, previous.net_income),
        "operating_cash_flow_change_pct": pct_change(current.operating_cash_flow, previous.operating_cash_flow),
        "free_cash_flow_change_pct": pct_change(current.free_cash_flow, previous.free_cash_flow),
        "eps_change_pct": pct_change(current.eps, previous.eps),
        "gross_margin_change_points": (
            (current.gross_margin - previous.gross_margin)
            if current.gross_margin is not None and previous.gross_margin is not None
            else None
        ),
        "net_margin_change_points": (
            (current.net_margin - previous.net_margin)
            if current.net_margin is not None and previous.net_margin is not None
            else None
        ),
        "current_values": {
            "revenue": current.revenue,
            "gross_profit": current.gross_profit,
            "net_income": current.net_income,
            "operating_cash_flow": current.operating_cash_flow,
            "free_cash_flow": current.free_cash_flow,
            "gross_margin": current.gross_margin,
            "net_margin": current.net_margin,
            "eps": current.eps,
        }
    }

    portfolio_fit = None
    if user_id:
        portfolio = get_user_portfolio(db, user_id)
        portfolio_fit = analyze_portfolio_fit(db, portfolio, ticker)

    payload = {
        "ticker": ticker,
        "company_name": company.company_name if company else ticker,
        "sector": company.sector if company and company.sector else "Unknown",
        "latest_period": str(current.fiscal_year),
        "metrics": metrics,
        "portfolio_fit": portfolio_fit,
    }

    try:
        ai_result = generate_openai_stock_summary(payload)

        return {
            "ticker": ticker,
            "period": str(current.fiscal_year),
            "summary": ai_result.get("summary", ""),
            "impact": ai_result.get("impact", "Neutral"),
            "recommendation": ai_result.get("recommendation", "Watch"),
            "risk_level": ai_result.get("risk_level", "Medium"),
            "confidence": int(ai_result.get("confidence", 60)),
            "positives": ai_result.get("positives", []),
            "risks": ai_result.get("risks", []),
            "portfolio_fit": {
                "fit_label": ai_result.get("portfolio_fit_label", "Not available"),
                "fit_reason": ai_result.get("portfolio_fit_reason", ""),
                "fit_score": portfolio_fit.get("fit_score") if portfolio_fit else None,
            } if user_id else None
        }
    except Exception as e:
        # Fallback if OpenAI call fails
        fallback_summary = "AI summary is temporarily unavailable, so only raw financial and portfolio signals could be prepared."
        return {
            "ticker": ticker,
            "period": str(current.fiscal_year),
            "summary": fallback_summary,
            "impact": "Neutral",
            "recommendation": "Watch",
            "risk_level": "Medium",
            "confidence": 35,
            "positives": [],
            "risks": [f"OpenAI summary failed: {str(e)}"],
            "portfolio_fit": portfolio_fit
        }