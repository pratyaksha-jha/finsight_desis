// All auth calls go to Node backend via Vite proxy → localhost:3000
const BASE = '/api';

const headers = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};


export const login = (email, password) =>
  fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ email, password }),
  }).then(handle);

export const register = (formData) =>
  fetch(`${BASE}/auth/register`, {
    method: 'POST', headers: headers(), body: JSON.stringify(formData),
  }).then(handle);

export const getMe = (token) =>
  fetch(`${BASE}/auth/me`, { headers: headers(token) }).then(handle);

export const acceptInvite = (token, inviteToken) =>
  fetch(`${BASE}/auth/invite/${inviteToken}`, { headers: headers(token) }).then(handle);

export const submitTradeRequest = (token, tradeData) =>
  fetch(`${BASE}/auth/trades`, { method: 'POST', headers: headers(token), body: JSON.stringify(tradeData) }).then(handle);

export const getMyTrades = (token) =>
  fetch(`${BASE}/auth/trades/mine`, { headers: headers(token) }).then(handle);

export const allocateBudget = (token, studentId, amount) =>
  fetch(`${BASE}/auth/budget`, { method: 'POST', headers: headers(token), body: JSON.stringify({ studentId, amount }) }).then(handle);

export const getPendingTrades = (token) =>
  fetch(`${BASE}/auth/trades/pending`, { headers: headers(token) }).then(handle);

export const approveTrade = (token, tradeId, comment) =>
  fetch(`${BASE}/auth/trades/${tradeId}/approve`, {
    method: 'PUT', headers: headers(token), body: JSON.stringify({ comment }),
  }).then(handle);

export const rejectTrade = (token, tradeId, comment) =>
  fetch(`${BASE}/auth/trades/${tradeId}/reject`, {
    method: 'PUT', headers: headers(token), body: JSON.stringify({ comment }),
  }).then(handle);
