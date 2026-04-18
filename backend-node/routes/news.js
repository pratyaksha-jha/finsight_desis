const express = require("express");
const router = express.Router();
const { fetchStockNews } = require("../services/newsService");

// ── GET /api/news/:symbol ─────────────────────────────────────────────────────
router.get("/:symbol", async (req, res) => {
  try {
    const news = await fetchStockNews(req.params.symbol.toUpperCase());
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
