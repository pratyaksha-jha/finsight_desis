const express = require("express");
const router = express.Router();
const pool = require("../config/db");

const { authenticate: authMiddleware } = require("../middleware/auth.middleware");

const formatRow = (row) => ({
  _id: row.id,
  id: row.id,
  symbol: row.symbol,
  name: row.name,
  targetPrice: parseFloat(row.target_price),
  lastPrice: parseFloat(row.last_price) || 0,
  notes: row.notes,
  alertTriggered: row.alert_triggered,
  alertTriggeredAt: row.alert_triggered_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ── GET: Fetch ONLY the logged-in user's watchlist ───────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM watchlist WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id] // req.user.id comes from your auth middleware
    );
    res.json(result.rows.map(formatRow));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch watchlist", error: err.message });
  }
});

// ── POST: Add to watchlist, attached to user_id ──────────────────────────────
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { symbol, name, targetPrice, notes } = req.body;
    if (!symbol || !targetPrice) return res.status(400).json({ message: "Symbol and targetPrice required" });

    const result = await pool.query(
      `INSERT INTO watchlist (user_id, symbol, name, target_price, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, symbol.toUpperCase(), name || null, parseFloat(targetPrice), notes || null]
    );
    res.status(201).json(formatRow(result.rows[0]));
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: `${req.body.symbol?.toUpperCase()} is already in your watchlist` });
    }
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH: Update ONLY if the user owns it ───────────────────────────────────
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { targetPrice, notes, lastPrice } = req.body;
    const sets = [];
    const values = [];
    let i = 1;

    if (targetPrice !== undefined) { sets.push(`target_price = $${i++}`); values.push(parseFloat(targetPrice)); }
    if (notes !== undefined) { sets.push(`notes = $${i++}`); values.push(notes); }
    if (lastPrice !== undefined) { sets.push(`last_price = $${i++}`); values.push(parseFloat(lastPrice)); }

    if (!sets.length) return res.status(400).json({ message: "No valid fields to update" });

    // Ensure they can only update their own row
    values.push(req.params.id, req.user.id);
    const result = await pool.query(
      `UPDATE watchlist SET ${sets.join(", ")} WHERE id = $${i} AND user_id = $${i+1} RETURNING *`,
      values
    );

    if (!result.rows.length) return res.status(404).json({ message: "Stock not found or unauthorized" });
    res.json(formatRow(result.rows[0]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE: Remove ONLY if the user owns it ──────────────────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM watchlist WHERE id = $1 AND user_id = $2 RETURNING symbol",
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Stock not found or unauthorized" });
    res.json({ message: "Removed from watchlist", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;