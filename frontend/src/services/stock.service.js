export const fetchCompanies = async () => {
  try {
    const res = await fetch('/companies/');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('fetchCompanies:', e);
    return [];
  }
};

export const fetchFinancials = async (ticker) => {
  try {
    const res = await fetch(`/financials/${ticker}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('fetchFinancials:', e);
    return { financials: [] };
  }
};

export const fetchPrices = async (ticker, rangeType = '1y') => {
  try {
    const res = await fetch(`/prices/${ticker}?range_type=${rangeType}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('fetchPrices:', e);
    return { prices: [] };
  }
};

export const fetchSummary = async (ticker, userId = null) => {
  try {
    const url = userId
      ? `/summaries/${ticker}?user_id=${userId}`
      : `/summaries/${ticker}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('fetchSummary:', e);
    return null;
  }
};

export const fetchDiversification = async (userId = 'default') => {
  try {
    const res = await fetch(`/diversification/score?user_id=${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('fetchDiversification:', e);
    return null;
  }
};

export const fetchLeaderboard = async (userId = 'default') => {
  try {
    const res = await fetch(`/leaderboard/?user_id=${userId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('fetchLeaderboard:', e);
    return [];
  }
};

export const uploadPortfolioCSV = async (file, userId = 'default') => {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/diversification/upload?user_id=${userId}`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || 'Upload failed');
  return data;
};
