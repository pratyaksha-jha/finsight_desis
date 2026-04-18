const router = require('express').Router();
const ctrl   = require('../controllers/parental.controller');
const { authenticate }                 = require('../middleware/auth.middleware');
const { requireStudent, requireAdult } = require('../middleware/role.middleware');

router.use(authenticate);

// ── Guardian static routes ──────────────────
router.get('/students',                    requireAdult,   ctrl.getLinkedStudents);
router.get('/students/:studentId/summary', requireAdult,   ctrl.getStudentSummary);
router.get('/trades/pending',              requireAdult,   ctrl.getPendingTrades);
router.get('/trades/resolved',             requireAdult,   ctrl.getResolvedTrades);
router.get('/comments/history',            requireAdult,   ctrl.getCommentHistory);
router.post('/budget',                     requireAdult,   ctrl.allocateBudget);

// ── Student static routes ───────────────────
router.post('/trades',                                     ctrl.submitTrade);
router.get('/trades/mine',                                 ctrl.getMyTrades);
router.get('/budget/mine',                 requireStudent, ctrl.getMyBudget);

// ── Parameterised routes LAST ───────────────
router.put('/trades/:tradeId/approve',     requireAdult,   ctrl.approveTrade);
router.put('/trades/:tradeId/reject',      requireAdult,   ctrl.rejectTrade);
router.patch('/trades/:tradeId/comment',   requireAdult,   ctrl.updateComment);
router.get('/trades/:tradeId', requireStudent, ctrl.getTradeDetail);
router.get('/budget/:studentId',           requireAdult,   ctrl.getStudentBudget);

module.exports = router;