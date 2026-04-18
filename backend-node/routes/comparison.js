const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { analyzeTradeRisk, rankTrades } = require("../services/analysisService");
const { authenticate: authMiddleware } = require("../middleware/auth.middleware");

// Helper: format pg row to camelCase response
const formatRow = (row) => ({
  _id: row.id,
  id: row.id,
  symbol: row.symbol,
  name: row.name,
  entryPrice: parseFloat(row.entry_price),
  targetPrice: parseFloat(row.target_price),
  stopLoss: row.stop_loss ? parseFloat(row.stop_loss) : null,
  reason: row.reason,
  analysis: {
    expectedReturnPct: parseFloat(row.expected_return_pct) || 0,
    downsideRisk: parseFloat(row.downside_risk) || 0,
    riskScore: parseFloat(row.risk_score) || 0,
    sharpeRatio: parseFloat(row.sharpe_ratio) || 0,
    riskRewardRatio: parseFloat(row.risk_reward_ratio) || 0,
    volatility: parseFloat(row.volatility) || 0,
    recommendation: row.recommendation || "",
  },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ── GET /api/comparison (Fetch ONLY the logged-in user's comparisons) ─────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM comparison WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(result.rows.map(formatRow));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/comparison/winner (Calculate winner for the user's trades) ───────
router.get("/winner", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM comparison WHERE user_id = $1",
      [req.user.id]
    );
    if (result.rows.length < 2)
      return res.status(400).json({ message: "Need at least 2 trades to compare" });

    const trades = result.rows.map(formatRow);
    const { winner, ranked } = rankTrades(trades);
    res.json({ winner, ranked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/comparison (Add trade attached to user_id) ──────────────────────
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { symbol, name, entryPrice, targetPrice, stopLoss, reason } = req.body;

    if (!symbol || !entryPrice || !targetPrice)
      return res.status(400).json({ message: "Symbol, entryPrice, and targetPrice are required" });

    if (parseFloat(targetPrice) <= parseFloat(entryPrice))
      return res.status(400).json({ message: "Target price must be higher than entry price" });

    if (stopLoss && parseFloat(stopLoss) >= parseFloat(entryPrice))
      return res.status(400).json({ message: "Stop loss must be lower than entry price" });

    // Run analysis
    const a = analyzeTradeRisk({
      symbol,
      entryPrice: parseFloat(entryPrice),
      targetPrice: parseFloat(targetPrice),
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
    });

    const result = await pool.query(
      `INSERT INTO comparison
        (user_id, symbol, name, entry_price, target_price, stop_loss, reason,
         expected_return_pct, downside_risk, risk_score, sharpe_ratio,
         risk_reward_ratio, volatility, recommendation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        req.user.id, // Injecting the authenticated user's ID
        symbol.toUpperCase(),
        name || null,
        parseFloat(entryPrice),
        parseFloat(targetPrice),
        stopLoss ? parseFloat(stopLoss) : null,
        reason || null,
        a.expectedReturnPct,
        a.downsideRisk,
        a.riskScore,
        a.sharpeRatio,
        a.riskRewardRatio,
        a.volatility,
        a.recommendation,
      ]
    );

    res.status(201).json(formatRow(result.rows[0]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/comparison/:id (Update ONLY if the user owns it) ───────────────
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    // Fetch existing - Ensure it belongs to the user
    const existing = await pool.query(
      "SELECT * FROM comparison WHERE id = $1 AND user_id = $2", 
      [req.params.id, req.user.id]
    );
    
    if (!existing.rows.length)
      return res.status(404).json({ message: "Trade not found or unauthorized" });

    const old = existing.rows[0];
    const entryPrice  = parseFloat(req.body.entryPrice  || old.entry_price);
    const targetPrice = parseFloat(req.body.targetPrice || old.target_price);
    const stopLoss    = req.body.stopLoss ? parseFloat(req.body.stopLoss) : (old.stop_loss ? parseFloat(old.stop_loss) : null);
    const reason      = req.body.reason || old.reason;

    // Recalculate analysis
    const a = analyzeTradeRisk({ symbol: old.symbol, entryPrice, targetPrice, stopLoss });

    const result = await pool.query(
      `UPDATE comparison SET
        entry_price=$1, target_price=$2, stop_loss=$3, reason=$4,
        expected_return_pct=$5, downside_risk=$6, risk_score=$7,
        sharpe_ratio=$8, risk_reward_ratio=$9, volatility=$10, recommendation=$11
       WHERE id=$12 AND user_id=$13 RETURNING *`,
      [
        entryPrice, targetPrice, stopLoss, reason,
        a.expectedReturnPct, a.downsideRisk, a.riskScore,
        a.sharpeRatio, a.riskRewardRatio, a.volatility, a.recommendation,
        req.params.id, 
        req.user.id // Security check
      ]
    );

    res.json(formatRow(result.rows[0]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/comparison/:id (Remove ONLY if the user owns it) ──────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM comparison WHERE id = $1 AND user_id = $2 RETURNING symbol",
      [req.params.id, req.user.id]
    );
    
    if (!result.rows.length)
      return res.status(404).json({ message: "Trade not found or unauthorized" });

    res.json({ message: `${result.rows[0].symbol} removed from comparison`, id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;