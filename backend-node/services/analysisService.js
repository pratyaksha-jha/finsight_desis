function analyzeTradeRisk(trade) {
  const { entryPrice, targetPrice, stopLoss } = trade;
  if (!entryPrice || !targetPrice) return {};

  const expectedReturnPct = ((targetPrice - entryPrice) / entryPrice) * 100;
  const downsideRisk = stopLoss
    ? ((entryPrice - stopLoss) / entryPrice) * 100
    : expectedReturnPct * 0.6;
  const riskRewardRatio = downsideRisk > 0 ? expectedReturnPct / downsideRisk : 0;

  let baseVolatility;
  if (entryPrice < 100) baseVolatility = 35;
  else if (entryPrice < 500) baseVolatility = 25;
  else if (entryPrice < 2000) baseVolatility = 18;
  else baseVolatility = 14;
  const volatility = parseFloat(
    (baseVolatility * (1 + Math.abs(expectedReturnPct) / 100)).toFixed(2)
  );

  const riskFreeRate = 6;
  const annualizedReturn = expectedReturnPct * 2;
  const sharpeRatio = parseFloat(
    ((annualizedReturn - riskFreeRate) / volatility).toFixed(3)
  );

  let riskScore = 50;
  if (downsideRisk > 20) riskScore += 20;
  else if (downsideRisk > 10) riskScore += 10;
  else riskScore -= 10;
  if (riskRewardRatio >= 3) riskScore -= 15;
  else if (riskRewardRatio >= 2) riskScore -= 8;
  else if (riskRewardRatio < 1) riskScore += 20;
  if (expectedReturnPct > 40) riskScore += 10;
  if (sharpeRatio > 1) riskScore -= 10;
  if (sharpeRatio < 0) riskScore += 15;
  if (!stopLoss) riskScore += 10;
  riskScore = Math.max(5, Math.min(95, riskScore));

  let recommendation = "";
  if (riskRewardRatio >= 3 && riskScore < 50)
    recommendation = `Strong risk/reward of ${riskRewardRatio.toFixed(2)}:1 with controlled downside. This is a high-conviction setup.`;
  else if (riskRewardRatio >= 2)
    recommendation = `Decent setup with ${riskRewardRatio.toFixed(2)}:1 risk/reward. Consider sizing based on conviction.`;
  else if (riskRewardRatio >= 1)
    recommendation = `Marginal risk/reward of ${riskRewardRatio.toFixed(2)}:1. Trade only with high conviction and tight stop loss.`;
  else
    recommendation = `Poor risk/reward below 1:1. Risk exceeds potential reward. Consider skipping or finding a better entry.`;

  if (sharpeRatio > 1.5) recommendation += " Excellent risk-adjusted returns expected.";
  else if (sharpeRatio < 0) recommendation += " Risk-adjusted returns are unfavorable.";

  return {
    expectedReturnPct: parseFloat(expectedReturnPct.toFixed(2)),
    downsideRisk: parseFloat(downsideRisk.toFixed(2)),
    riskScore: parseFloat(riskScore.toFixed(1)),
    sharpeRatio,
    riskRewardRatio: parseFloat(riskRewardRatio.toFixed(3)),
    volatility,
    recommendation,
  };
}

function rankTrades(trades) {
  const scored = trades.map((t) => {
    const a = t.analysis || {};
    const score =
      (a.expectedReturnPct || 0) * 0.35 +
      (a.sharpeRatio || 0) * 20 * 0.35 -
      (a.riskScore || 50) * 0.2 +
      (a.riskRewardRatio || 0) * 5 * 0.1;
    return { trade: t, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return {
    winner: scored[0]?.trade,
    ranked: scored.map((s) => ({ ...s.trade, _compositeScore: s.score })),
  };
}

module.exports = { analyzeTradeRisk, rankTrades };
