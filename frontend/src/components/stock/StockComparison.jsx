import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getComparisons, addComparison, removeComparison } from "../../services/tradeSetup.service";
import { fetchCompanies } from "../../services/stock.service";
import "./StockComparison.css";

// ─── Risk/Return Bar ──────────────────────────────────────────────────────────
function RiskReturnBar({ label, value, max = 100, color }) {
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{
            width: `${Math.min((value / max) * 100, 100)}%`,
            background: color,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
      </div>
      <span className="bar-value" style={{ color }}>{value.toFixed(1)}</span>
    </div>
  );
}

// ─── AI Analysis Badge ────────────────────────────────────────────────────────
function AIBadge({ text }) {
  return (
    <div className="ai-badge">
      <span className="ai-icon">◈</span>
      <span>{text}</span>
    </div>
  );
}

// ─── Stock Card in Comparison ─────────────────────────────────────────────────
function CompareCard({ trade, isWinner, onRemove, rank }) {
  const r = trade.analysis || {};
  const riskScore = r.riskScore || 0;
  const returnScore = r.expectedReturnPct || 0;
  const sharpRatio = r.sharpeRatio || 0;
  const volatility = r.volatility || 0;
  const recommendation = r.recommendation || "";

  return (
    <div className={`compare-card ${isWinner ? "winner" : ""}`}>
      {isWinner && <div className="winner-ribbon">🏆 Best Pick</div>}
      {rank && !isWinner && <div className="rank-tag">#{rank}</div>}

      <div className="card-header-row">
        <div>
          <div className="card-symbol">{trade.symbol}</div>
          {trade.name && <div className="card-name">{trade.name}</div>}
        </div>
        <button className="remove-btn" onClick={() => onRemove(trade._id || trade.id)}>✕</button>
      </div>

      <div className="card-price-row">
        <div>
          <div className="price-label">Entry Price</div>
          <div className="price-val">${trade.entryPrice?.toLocaleString()}</div>
        </div>
        <div>
          <div className="price-label">Target Price</div>
          <div className="price-val target">${trade.targetPrice?.toLocaleString()}</div>
        </div>
        <div>
          <div className="price-label">Stop Loss</div>
          <div className="price-val stop">${trade.stopLoss?.toLocaleString()}</div>
        </div>
      </div>

      <hr className="divider" />

      <div className="metrics-section">
        <div className="metrics-title">Risk vs Return Analysis</div>
        <RiskReturnBar label="Expected Return %" value={returnScore} max={50} color="var(--green)" />
        <RiskReturnBar label="Risk Score" value={riskScore} max={100} color="var(--red)" />
        <RiskReturnBar label="Sharpe Ratio" value={sharpRatio * 10} max={30} color="var(--accent)" />
        <RiskReturnBar label="Volatility %" value={volatility} max={50} color="var(--yellow)" />
      </div>

      <div className="stats-grid">
        <div className="mini-stat">
          <div className="mini-val" style={{ color: "var(--green)" }}>{returnScore.toFixed(1)}%</div>
          <div className="mini-label">Upside</div>
        </div>
        <div className="mini-stat">
          <div className="mini-val" style={{ color: "var(--red)" }}>{r.downsideRisk?.toFixed(1) || "—"}%</div>
          <div className="mini-label">Downside</div>
        </div>
        <div className="mini-stat">
          <div className="mini-val">{sharpRatio.toFixed(2)}</div>
          <div className="mini-label">Sharpe</div>
        </div>
        <div className="mini-stat">
          <div className="mini-val">{r.riskRewardRatio?.toFixed(2) || "—"}</div>
          <div className="mini-label">R:R Ratio</div>
        </div>
      </div>

      {recommendation && (
        <div className="ai-section">
          <AIBadge text={recommendation} />
        </div>
      )}

      {trade.reason && (
        <div className="trade-reason">
          📋 {trade.reason}
        </div>
      )}
    </div>
  );
}

// ─── Add Trade Modal ──────────────────────────────────────────────────────────
function AddTradeModal({ onClose, onAdd }) {
  const { token } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    symbol: "", name: "", entryPrice: "", targetPrice: "", stopLoss: "", reason: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCompanies().then(setCompanies).catch(console.error);
  }, []);

  const handleSymbolChange = (e) => {
    const selectedTicker = e.target.value;
    const selectedCompany = companies.find(c => c.ticker === selectedTicker);
    setForm(p => ({
      ...p,
      symbol: selectedTicker,
      name: selectedCompany ? selectedCompany.company_name : ""
    }));
  };

  const handleSubmit = async () => {
    if (!form.symbol || !form.entryPrice || !form.targetPrice) {
      setError("Symbol, entry price, and target price are required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        entryPrice: parseFloat(form.entryPrice),
        targetPrice: parseFloat(form.targetPrice),
        stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : undefined,
      };
      const data = await addComparison(token, payload);
      onAdd(data);
      onClose();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Trade for Comparison</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="error-bar">{error}</div>}
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Symbol *</label>
              <select 
                value={form.symbol} 
                onChange={handleSymbolChange}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              >
                <option value="" disabled>Select a company...</option>
                {companies.map(c => (
                  <option key={c.ticker} value={c.ticker}>
                    {c.company_name} ({c.ticker})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Company Name</label>
              <input placeholder="Auto-filled" value={form.name} readOnly style={{ backgroundColor: 'var(--surface2)', cursor: 'not-allowed' }} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Entry Price ($) *</label>
              <input type="number" placeholder="e.g. 150" value={form.entryPrice} onChange={e => f("entryPrice", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Target Price ($) *</label>
              <input type="number" placeholder="e.g. 180" value={form.targetPrice} onChange={e => f("targetPrice", e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Stop Loss ($)</label>
            <input type="number" placeholder="e.g. 140" value={form.stopLoss} onChange={e => f("stopLoss", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Reason for Trade</label>
            <input placeholder="Why do you want to make this trade?" value={form.reason} onChange={e => f("reason", e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Analyzing…" : "Add & Analyze"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Summary Panel ─────────────────────────────────────────────────────────
function AISummary({ trades, winner }) {
  if (trades.length < 2) return null;
  const w = trades.find(t => (t._id || t.id) === winner);
  if (!w) return null;

  return (
    <div className="ai-summary">
      <div className="ai-summary-header">
        <span className="ai-icon-big">◈</span>
        <span>AI Recommendation</span>
      </div>
      <div className="ai-summary-body">
        <strong>{w.symbol}</strong> is the best trade out of your {trades.length} options.
        {w.analysis?.recommendation && (
          <span> {w.analysis.recommendation}</span>
        )}
        {w.analysis?.expectedReturnPct && (
          <span> Expected upside of <strong style={{ color: "var(--green)" }}>{w.analysis.expectedReturnPct.toFixed(1)}%</strong> with
          a Sharpe ratio of <strong>{w.analysis?.sharpeRatio?.toFixed(2)}</strong>.</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Comparison Module ───────────────────────────────────────────────────
export default function StockComparison() {
  const { token } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    getComparisons(token)
      .then(d => {
        setTrades(d);
        setLoading(false);
        pickWinner(d);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const pickWinner = (list) => {
    if (!list.length) return;
    const scored = list.map(t => {
      const a = t.analysis || {};
      const score = (a.expectedReturnPct || 0) * 0.4
        + (a.sharpeRatio || 0) * 20 * 0.4
        - (a.riskScore || 0) * 0.2;
      return { ...t, _score: score };
    });
    scored.sort((a, b) => b._score - a._score);
    setWinner(scored[0]?._id || scored[0]?.id);
  };

  const handleAdd = (trade) => {
    setTrades(prev => {
      const next = [...prev, trade];
      pickWinner(next);
      return next;
    });
  };

  const handleRemove = async (id) => {
    await removeComparison(token, id);
    setTrades(prev => {
      const next = prev.filter(t => (t._id || t.id) !== id);
      pickWinner(next);
      return next;
    });
  };

  const ranked = [...trades].sort((a, b) => {
    const sa = (a.analysis?.expectedReturnPct || 0) * 0.4 + (a.analysis?.sharpeRatio || 0) * 20 * 0.4 - (a.analysis?.riskScore || 0) * 0.2;
    const sb = (b.analysis?.expectedReturnPct || 0) * 0.4 + (b.analysis?.sharpeRatio || 0) * 20 * 0.4 - (b.analysis?.riskScore || 0) * 0.2;
    return sb - sa;
  });

  if (loading) return <div className="loading-state">Loading comparison data…</div>;

  return (
    <div className="comparison-module">
      <div className="module-header">
        <div>
          <div className="page-title">Stock Comparison Tool</div>
          <div className="page-sub">Compare possible trades • AI-powered risk/return analysis</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add Trade
        </button>
      </div>

      <AISummary trades={trades} winner={winner} />

      {trades.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚖</div>
          <div className="empty-title">No trades to compare</div>
          <div className="empty-sub">Add 2+ possible trades to get a side-by-side risk/return comparison</div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add First Trade</button>
        </div>
      ) : (
        <>
          {trades.length >= 2 && (
            <div className="summary-table">
              <div className="summary-title">Quick Comparison</div>
              <table>
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Entry</th>
                    <th>Target</th>
                    <th>Upside %</th>
                    <th>Risk Score</th>
                    <th>Sharpe</th>
                    <th>R:R</th>
                    <th>Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((t, i) => (
                    <tr key={t._id || t.id} className={(t._id || t.id) === winner ? "winner-row" : ""}>
                      <td>
                        <span className="sym">{t.symbol}</span>
                        {(t._id || t.id) === winner && <span className="badge badge-green" style={{ marginLeft: 8 }}>Best</span>}
                      </td>
                      <td className="mono">${t.entryPrice?.toLocaleString()}</td>
                      <td className="mono">${t.targetPrice?.toLocaleString()}</td>
                      <td className="mono" style={{ color: "var(--green)" }}>+{t.analysis?.expectedReturnPct?.toFixed(1) || "—"}%</td>
                      <td className="mono" style={{ color: t.analysis?.riskScore > 60 ? "var(--red)" : "var(--yellow)" }}>
                        {t.analysis?.riskScore?.toFixed(0) || "—"}
                      </td>
                      <td className="mono">{t.analysis?.sharpeRatio?.toFixed(2) || "—"}</td>
                      <td className="mono">{t.analysis?.riskRewardRatio?.toFixed(2) || "—"}</td>
                      <td>
                        <span className={`badge ${i === 0 ? "badge-green" : i === 1 ? "badge-blue" : "badge-red"}`}>
                          {i === 0 ? "★ Best" : i === 1 ? "2nd" : `#${i + 1}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className={`cards-grid cols-${Math.min(trades.length, 3)}`}>
            {ranked.map((trade, i) => (
              <CompareCard
                key={trade._id || trade.id}
                trade={trade}
                isWinner={(trade._id || trade.id) === winner}
                rank={i + 1}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </>
      )}

      {showAdd && <AddTradeModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}