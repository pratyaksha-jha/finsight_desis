const cron = require("node-cron");
const axios = require("axios");
const pool = require("../config/db");

async function fetchPrice(symbol) {
  try {
    const res = await axios.get(`http://localhost:8000/api/stock/price/${symbol}`);
    const price = parseFloat(res.data.price);
    return isNaN(price) ? null : price;
  } catch (err) {
    console.error(`Price fetch error for ${symbol}:`, err.message);
    return null;
  }
}

function startAlertCron() {
  console.log("⏰ Price alert cron started (every 5 minutes)");

  cron.schedule("*/5 * * * *", async () => {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM watchlist WHERE alert_triggered = FALSE"
      );
      if (!rows.length) return;

      console.log(`🔍 Checking prices for ${rows.length} watchlist stocks...`);

      for (const stock of rows) {
        const price = await fetchPrice(stock.symbol);
        if (!price) continue;

        // Always update last known price
        await pool.query(
          "UPDATE watchlist SET last_price = $1 WHERE id = $2",
          [price, stock.id]
        );

        // Check if target hit
        if (price >= parseFloat(stock.target_price)) {
          console.log(`🎯 ALERT: ${stock.symbol} hit target ₹${stock.target_price} (current: ₹${price})`);
          await pool.query(
            `UPDATE watchlist
             SET alert_triggered = TRUE, alert_triggered_at = NOW(), last_price = $1
             WHERE id = $2`,
            [price, stock.id]
          );
          // In production: trigger email/push notification here
        }
      }
    } catch (err) {
      console.error("Alert cron error:", err.message);
    }
  });
}

module.exports = { startAlertCron };