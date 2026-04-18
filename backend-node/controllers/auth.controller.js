const AuthService = require('../services/auth.service');
const GuardianLinkService = require('../services/guardian-link.service');
const GuardianModel = require('../models/Guardian.model');

const AuthController = {
  async register(req, res) {
    try {
      const { name, email, password, role, budget } = req.body;
      if (!name || !email || !password || !role)
        return res.status(400).json({ error: 'Missing required fields' });

      const result = await AuthService.register({ name, email, password, role, budget });

      // If student, auto-generate invite token for parent
      if (role === 'student') {
        const token = await GuardianLinkService.sendInvite(result.user.id);
        return res.status(201).json({ ...result, inviteToken: token });
      }

      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      res.json(result);
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  },

  async me(req, res) {
    // req.user is already set by authenticate middleware
    const { password_hash, ...safe } = req.user;
    res.json(safe);
  },

  // Parent accepts invite link
  async acceptInvite(req, res) {
    try {
      const { token } = req.params;
      const link = await GuardianLinkService.acceptInvite(token, req.user.id);
      res.json({ message: 'Guardian link activated', link });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Parent sets student's budget
  async allocateBudget(req, res) {
    try {
      const { studentId, amount } = req.body;
      const updated = await GuardianLinkService.allocateBudget(
        req.user.id, studentId, amount
      );
      res.json({ message: 'Budget updated', student: updated });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Student submits trade request
  async submitTrade(req, res) {
    try {
      const trade = await GuardianLinkService.submitTradeRequest(req.user, req.body);
      res.status(201).json(trade);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Parent gets pending trades
  async getPendingTrades(req, res) {
    try {
      const trades = await GuardianModel.getPendingForGuardian(req.user.id);
      res.json(trades);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Student gets their own trade history
  async getMyTrades(req, res) {
    try {
      const trades = await GuardianModel.getTradesByStudent(req.user.id);
      res.json(trades);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async approveTrade(req, res) {
    try {
      const { tradeId } = req.params;
      const { comment } = req.body;
      const trade = await GuardianLinkService.approveTrade(req.user.id, tradeId, comment);
      res.json(trade);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async rejectTrade(req, res) {
    try {
      const { tradeId } = req.params;
      const { comment } = req.body;
      const trade = await GuardianLinkService.rejectTrade(req.user.id, tradeId, comment);
      res.json(trade);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

module.exports = AuthController;