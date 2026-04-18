const axios = require("axios");

async function fetchStockNews(symbol) {
  try {
    // Calling your ACTUAL Python news microservice instead of using Mocks
    const res = await axios.post("http://localhost:8001/api/v1/news/feed", {
      tickers: [symbol],
      time_window_hours: 48,
      limit: 10,
      analysis_mode: "fast" 
    });
    
    return res.data.articles.map(article => ({
      title: article.title,
      url: article.source_url,
      source: article.source_name,
      publishedAt: article.published_at,
      sentiment: article.sentiment_label || "neutral",
      impact: article.impact_level
    }));
  } catch (err) {
    console.error("Failed to fetch from News Microservice:", err.message);
    throw new Error("Unable to fetch live news at this time.");
  }
}

module.exports = { fetchStockNews };