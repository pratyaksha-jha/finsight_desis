from apscheduler.schedulers.background import BackgroundScheduler
from app.db import SessionLocal
from app.services.market_service import update_daily_prices
from app.services.company_service import TICKERS

scheduler = BackgroundScheduler()

def update_all_prices_job():
    db = SessionLocal()
    try:
        print("Starting scheduled daily price update...")
        for ticker in TICKERS:
            result = update_daily_prices(db, ticker)
            print(result)
        print("Scheduled daily price update completed.")
    except Exception as e:
        print(f"Scheduler error: {e}")
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        # Every day at 6:30 PM
        scheduler.add_job(
            update_all_prices_job,
            trigger="cron",
            hour=18,
            minute=30,
            id="daily_price_update",
            replace_existing=True
        )
        scheduler.start()
        print("Scheduler started.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print("Scheduler stopped.")