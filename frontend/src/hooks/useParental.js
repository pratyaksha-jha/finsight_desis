const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const headers = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// ── Guardian / Parent ────────────────────────────────────────

// Get all students linked to this guardian
export const getLinkedStudents = (token) =>
  fetch(`${BASE}/parental/students`, { headers: headers(token) }).then(handle);

// Get a specific student's portfolio summary
export const getStudentSummary = (token, studentId) =>
  fetch(`${BASE}/parental/students/${studentId}/summary`, {
    headers: headers(token),
  }).then(handle);

// Get all pending trade requests for guardian's students
export const getPendingTrades = (token) =>
  fetch(`${BASE}/parental/trades/pending`, {
    headers: headers(token),
  }).then(handle);

// Get all resolved trades (approved + rejected) for feedback history
export const getResolvedTrades = (token) =>
  fetch(`${BASE}/parental/trades/resolved`, {
    headers: headers(token),
  }).then(handle);

// Approve a trade request
export const approveTrade = (token, tradeId, comment = '') =>
  fetch(`${BASE}/parental/trades/${tradeId}/approve`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({ comment }),
  }).then(handle);

// Reject a trade request
export const rejectTrade = (token, tradeId, comment = '') =>
  fetch(`${BASE}/parental/trades/${tradeId}/reject`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({ comment }),
  }).then(handle);

// Add or update a comment on any trade (without changing its status)
export const updateComment = (token, tradeId, comment) =>
  fetch(`${BASE}/parental/trades/${tradeId}/comment`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({ comment }),
  }).then(handle);

// ── Budget ───────────────────────────────────────────────────

// Get budget details for a student
export const getStudentBudget = (token, studentId) =>
  fetch(`${BASE}/parental/budget/${studentId}`, {
    headers: headers(token),
  }).then(handle);

// Set or update a student's budget
export const allocateBudget = (token, studentId, amount) =>
  fetch(`${BASE}/parental/budget`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ studentId, amount }),
  }).then(handle);

// ── Student (read-only calls from student's perspective) ─────

// Student submits a new trade request
export const submitTradeRequest = (token, tradeData) =>
  fetch(`${BASE}/parental/trades`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(tradeData),
  }).then(handle);

// Student views their own trade history
export const getMyTrades = (token) =>
  fetch(`${BASE}/parental/trades/mine`, { headers: headers(token) }).then(handle);