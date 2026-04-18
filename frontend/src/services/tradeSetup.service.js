const BASE = '/api';

const headers = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
};

// --- Watchlist ---
export const getWatchlist = (token) => fetch(`${BASE}/watchlist`, { headers: headers(token) }).then(handle);
export const addToWatchlist = (token, data) => fetch(`${BASE}/watchlist`, { method: 'POST', headers: headers(token), body: JSON.stringify(data) }).then(handle);
export const removeFromWatchlist = (token, id) => fetch(`${BASE}/watchlist/${id}`, { method: 'DELETE', headers: headers(token) }).then(handle);

// --- Comparison ---
export const getComparisons = (token) => fetch(`${BASE}/comparison`, { headers: headers(token) }).then(handle);
export const getComparisonWinner = (token) => fetch(`${BASE}/comparison/winner`, { headers: headers(token) }).then(handle);
export const addComparison = (token, data) => fetch(`${BASE}/comparison`, { method: 'POST', headers: headers(token), body: JSON.stringify(data) }).then(handle);
export const removeComparison = (token, id) => fetch(`${BASE}/comparison/${id}`, { method: 'DELETE', headers: headers(token) }).then(handle);