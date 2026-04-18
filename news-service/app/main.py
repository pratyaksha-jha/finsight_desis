from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import os
from pathlib import Path
from dotenv import load_dotenv

master_env_path = Path(__file__).resolve().parent.parent.parent / ".env"

load_dotenv(dotenv_path=master_env_path)
from app.api.routes.live_news import router as live_news_router

app = FastAPI(
    title="FinSight News API",
    description="Real-time financial news fetcher with FinBERT sentiment and OpenAI analysis",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(live_news_router, prefix="/api/v1/news", tags=["news"])


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/", include_in_schema=False)
async def root() -> RedirectResponse:
    return RedirectResponse(url="/docs")
