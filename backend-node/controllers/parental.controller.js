const BudgetService          = require('../services/budget.services');
const ParentalCommentService = require('../services/parental-comment.services');
const GuardianModel          = require('../models/Guardian.model');
const GuardianLinkService    = require('../services/guardian-link.service');

const ParentalController = {

  // ── Guardian: student management ──────────────────────────────

  async getLinkedStudents(req, res) {
    try {
      const students = await GuardianLinkService.getMyStudents(req.user.id);
      res.json(students);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getStudentSummary(req, res) {
    try {
      const { studentId } = req.params;
      if (!studentId) return res.status(400).json({ error: 'studentId is required' });
      // Verify guardian owns this student
      const students = await GuardianLinkService.getMyStudents(req.user.id);
      if (!students.find((s) => s.id === studentId)) {
        return res.status(403).json({ error: 'Student not linked to your account' });
      }
      const budget = await BudgetService.getForStudent(studentId);
      const trades = await GuardianModel.getTradesByStudent(studentId);
      res.json({ student: budget, tradeCount: trades.length, trades });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ── Guardian: trade approval ───────────────────────────────────

  async getPendingTrades(req, res) {
    try {
      const trades = await GuardianModel.getPendingForGuardian(req.user.id);
      res.json(trades);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getResolvedTrades(req, res) {
    try {
      const trades = await ParentalCommentService.getResolvedTrades(req.user.id);
      res.json(trades);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async approveTrade(req, res) {
    try {
      const { tradeId } = req.params;
      const { comment = '' } = req.body;

      // Get trade to know cost
      const pending = await GuardianModel.getPendingForGuardian(req.user.id);
      const trade   = pending.find((t) => t.id === tradeId);
      if (!trade) {
        return res.status(404).json({ error: 'Trade not found or already resolved' });
      }

      const totalCost = trade.qty * trade.estimated_price;

      // Check student still has enough budget
      await BudgetService.checkSufficiency(trade.student_id, totalCost);

      // Resolve the request
      const resolved = await GuardianModel.resolveTradeRequest(tradeId, 'approved', comment);

      // Deduct budget
      await BudgetService.deduct(trade.student_id, totalCost);

      res.json(resolved);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async rejectTrade(req, res) {
    try {
      const { tradeId } = req.params;
      const { comment = '' } = req.body;
      const trade = await GuardianLinkService.rejectTrade(req.user.id, tradeId, comment);
      res.json(trade);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // ── Guardian: comments ─────────────────────────────────────────

  async updateComment(req, res) {
    try {
      const { tradeId } = req.params;
      const { comment } = req.body;
      if (!comment?.trim()) {
        return res.status(400).json({ error: 'Comment cannot be empty' });
      }
      const updated = await ParentalCommentService.upsertComment(
        req.user.id, tradeId, comment
      );
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getCommentHistory(req, res) {
    try {
      const history = await ParentalCommentService.getCommentHistory(req.user.id);
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ── Guardian: budget ───────────────────────────────────────────

  async getStudentBudget(req, res) {
    try {
      const { studentId } = req.params;
      if (!studentId) return res.status(400).json({ error: 'studentId is required' });
      const budget = await BudgetService.getForStudent(studentId);
      res.json(budget);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async allocateBudget(req, res) {
    try {
      const { studentId, amount } = req.body;
      if (!studentId || !amount) {
        return res.status(400).json({ error: 'studentId and amount are required' });
      }
      const updated = await BudgetService.allocate(req.user.id, studentId, parseFloat(amount));
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // ── Student: trade submission ──────────────────────────────────

  async submitTrade(req, res) {
    try {
      const trade = await GuardianLinkService.submitTradeRequest(req.user, req.body);
      res.status(201).json(trade);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getMyTrades(req, res) {
    try {
      const trades = await GuardianModel.getTradesByStudent(req.user.id);
      res.json(trades);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getTradeDetail(req, res) {
    try {
      const { tradeId } = req.params;
      const trade = await ParentalCommentService.getTradeWithComment(
        tradeId, req.user.id
      );
      res.json(trade);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },
  async getMyBudget(req, res) {
    try {
      const budget = await BudgetService.getForStudent(req.user.id);
      res.json(budget);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },
};

module.exports = ParentalController;