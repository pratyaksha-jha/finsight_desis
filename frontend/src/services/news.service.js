// All news calls go to News service via Vite proxy → localhost:8001

export const fetchNewsFeed = async ({ tickers, companyNames, analysisMode = 'fast', timeWindowHours = 24, limit = 20 }) => {
  try {
    const res = await fetch('/api/v1/news/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tickers,
        company_names: companyNames || null,
        time_window_hours: timeWindowHours,
        limit,
        analysis_mode: analysisMode,
        explanation_detail: 'medium',
        explanation_format: 'paragraph',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('fetchNewsFeed:', e);
    return { articles: [], count: 0 };
  }
};

export const analyzeArticle = async ({ title, content, ticker, analysisMode = 'full' }) => {
  try {
    const res = await fetch('/api/v1/news/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, content, ticker,
        analysis_mode: analysisMode,
        explanation_detail: 'detailed',
        explanation_format: 'paragraph',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('analyzeArticle:', e);
    return null;
  }
};
