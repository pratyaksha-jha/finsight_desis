// All parental calls go to Node backend via Vite proxy → localhost:3000
const BASE = '/api';

const headers = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const getLinkedStudents = (token) =>
  fetch(`${BASE}/parental/students`, { headers: headers(token) }).then(handle);

export const getStudentSummary = (token, studentId) =>
  fetch(`${BASE}/parental/students/${studentId}/summary`, { headers: headers(token) }).then(handle);

export const getPendingTrades = (token) =>
  fetch(`${BASE}/parental/trades/pending`, { headers: headers(token) }).then(handle);

export const getResolvedTrades = (token) =>
  fetch(`${BASE}/parental/trades/resolved`, { headers: headers(token) }).then(handle);

export const approveTrade = (token, tradeId, comment = '') =>
  fetch(`${BASE}/parental/trades/${tradeId}/approve`, {
    method: 'PUT', headers: headers(token), body: JSON.stringify({ comment }),
  }).then(handle);

export const rejectTrade = (token, tradeId, comment = '') =>
  fetch(`${BASE}/parental/trades/${tradeId}/reject`, {
    method: 'PUT', headers: headers(token), body: JSON.stringify({ comment }),
  }).then(handle);

export const updateComment = (token, tradeId, comment) =>
  fetch(`${BASE}/parental/trades/${tradeId}/comment`, {
    method: 'PATCH', headers: headers(token), body: JSON.stringify({ comment }),
  }).then(handle);

export const getStudentBudget = (token, studentId) =>
  fetch(`${BASE}/parental/budget/${studentId}`, { headers: headers(token) }).then(handle);

export const allocateBudget = (token, studentId, amount) =>
  fetch(`${BASE}/parental/budget`, {
    method: 'POST', headers: headers(token), body: JSON.stringify({ studentId, amount }),
  }).then(handle);

export const getMyBudget = (token) =>
  fetch(`${BASE}/parental/budget/mine`, { headers: headers(token) }).then(handle);

export const submitTradeRequest = (token, tradeData) =>
  fetch(`${BASE}/parental/trades`, {
    method: 'POST', headers: headers(token), body: JSON.stringify(tradeData),
  }).then(handle);

export const getMyTrades = (token) =>
  fetch(`${BASE}/parental/trades/mine`, { headers: headers(token) }).then(handle);
