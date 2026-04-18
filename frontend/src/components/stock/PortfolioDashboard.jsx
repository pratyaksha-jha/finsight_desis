import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from '../../hooks/useAuth';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine,
} from "recharts";

/*Palette*/
const C = {
  bg: "#f5f4f0", surface: "#ffffff", surfaceAlt: "#fafaf8",
  border: "#e4e2db", borderStrong: "#ccc9be",
  accent: "#2563eb", accentSoft: "#eff4ff",
  green: "#16a34a", greenSoft: "#f0fdf4",
  red: "#dc2626", redSoft: "#fff1f1",
  amber: "#d97706", amberSoft: "#fffbeb",
  text: "#1a1917", textSoft: "#6b6860", textMuted: "#a8a49c",
  shadow: "0 1px 3px rgba(0,0,0,0.07)",
};

const SECTOR_COLORS = [
  "#2563eb","#16a34a","#d97706","#dc2626",
  "#7c3aed","#0891b2","#be185d","#65a30d",
];

const S = {
  page: { background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'Syne', sans-serif", padding: "28px 36px" },
  card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, boxShadow: C.shadow },
  label: { fontSize: 10, letterSpacing: "0.1em", color: C.textMuted, textTransform: "uppercase", fontWeight: 600 },
  mono: { fontFamily: "'DM Mono', monospace" },
};

/*CSV Upload Component*/
function UploadButton({ onUploadSuccess, userId }) {
  const [dragging, setDragging]   = useState(false);
  const [status, setStatus]       = useState(null); 
  const [message, setMessage]     = useState("");
  const [showDrop, setShowDrop]   = useState(false);
  const inputRef = useRef();

  const handleFile = useCallback(async (file) => {
    if (!file || !file.name.endsWith(".csv")) {
      setStatus("error"); setMessage("Please upload a .csv file"); return;
    }
    setStatus("uploading"); setMessage("Uploading…"); setShowDrop(false);

    const form = new FormData();
    form.append("file", file);

    try {
      // Passes the userId to the backend
      const res  = await fetch(`/diversification/upload?user_id=${userId}`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.details ? data.details[0] : data.error);
      } else {
        setStatus("success");
        setMessage(data.message);
        setTimeout(() => { setStatus(null); onUploadSuccess(); }, 2000);
      }
    } catch {
      setStatus("error"); setMessage("Network error — is Flask running?");
    }
  }, [onUploadSuccess, userId]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const statusColor = status === "success" ? C.green : status === "error" ? C.red : C.accent;
  const statusBg    = status === "success" ? C.greenSoft : status === "error" ? C.redSoft : C.accentSoft;

  return (
    <>
      {/* Click-outside backdrop — BELOW the panel (zIndex 99 < panel's 200) */}
      {showDrop && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99 }}
          onClick={() => setShowDrop(false)}
        />
      )}

      <div style={{ position: "relative" }}>
        {/* Trigger button */}
        <button
          onClick={() => setShowDrop(v => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 16px", borderRadius: 9,
            border: `1px solid ${C.border}`, background: C.surface,
            cursor: "pointer", fontFamily: "'Syne', sans-serif",
            fontWeight: 600, fontSize: 12, color: C.textSoft,
            boxShadow: C.shadow, transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSoft; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import Portfolio
        </button>

        {/* Dropdown panel — right-anchored so it never overflows the viewport */}
        {showDrop && (
          <div
            style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 320, background: C.surface, borderRadius: 12,
              border: `1px solid ${C.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 200, padding: 16,
            }}
            // Stop clicks inside the panel from bubbling to the backdrop
            onClick={e => e.stopPropagation()}
          >
            {/* Drag-drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? C.accent : C.borderStrong}`,
                borderRadius: 10, padding: "24px 16px", textAlign: "center",
                cursor: "pointer", background: dragging ? C.accentSoft : C.surfaceAlt,
                transition: "all 0.15s", marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>📂</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 4 }}>
                {status === "uploading" ? "Uploading…" : "Drop CSV here or click to browse"}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                Needs: ticker, sector, quantity, avg_buy_price, current_price
              </div>
            </div>

            {/* Status message */}
            {status && (
              <div style={{
                padding: "8px 12px", borderRadius: 8, fontSize: 12,
                background: statusBg, color: statusColor, fontWeight: 600,
                marginBottom: 10,
              }}>
                {status === "success" ? "✓ " : status === "error" ? "✗ " : "⏳ "}{message}
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={e => { handleFile(e.target.files[0]); e.target.value = ""; }}
            />
          </div>
        )}
      </div>
    </>
  );
}

/*Empty State*/
function EmptyState({ onUploadSuccess }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", gap: 16, textAlign: "center",
    }}>
      <div style={{ fontSize: 48 }}>Uh ho!</div>
      <div style={{ fontSize: 30, fontWeight: 800 }}>No portfolio data yet</div>
      <div style={{ fontSize: 13, color: C.textSoft, maxWidth: 340, lineHeight: 1.7 }}>
        Import your portfolio using the <strong>Import Portfolio</strong> button at the top left.
        Upload a CSV with your stock holdings to get started.
      </div>
    </div>
  );
}

/*Score Ring*/
function ScoreRing({ score }) {
  const r = 68, cx = 88, cy = 88;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color   = score >= 65 ? C.green : score >= 40 ? C.amber : C.red;
  const bgColor = score >= 65 ? "#dcfce7" : score >= 40 ? "#fef3c7" : "#fee2e2";
  const label   = score >= 65 ? "Well Diversified" : score >= 40 ? "Moderate" : "Concentrated";

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={176} height={176}>
        <circle cx={cx} cy={cy} r={r} fill={bgColor} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={9} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`} transform={`rotate(-90 ${cx} ${cy})`} />
        <text x={cx} y={cy - 6} textAnchor="middle" fill={color}
          style={{ fontSize: 38, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>{score}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill={C.textMuted}
          style={{ fontSize: 11, fontFamily: "'Syne', sans-serif" }}>out of 100</text>
      </svg>
      <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: bgColor, color, fontWeight: 700, fontSize: 12, marginTop: -6, border: `1px solid ${color}40` }}>
        {label}
      </div>
    </div>
  );
}

/*Significant Correlations*/
function CorrelationList({ matrix, tickers }) {
  const THRESHOLD = 0.35;
  const [hovered, setHovered] = useState(null);
  if (!matrix || !tickers.length) return null;

  const pairs = [];
  for (let i = 0; i < tickers.length; i++)
    for (let j = i + 1; j < tickers.length; j++) {
      const val = matrix[tickers[i]]?.[tickers[j]] ?? 0;
      if (Math.abs(val) >= THRESHOLD) pairs.push({ a: tickers[i], b: tickers[j], val });
    }
  pairs.sort((x, y) => Math.abs(y.val) - Math.abs(x.val));

  function barColor(val) {
    if (val > 0) return `rgb(220,${Math.round(60 - val * 40)},${Math.round(60 - val * 40)})`;
    return `rgb(${Math.round(60 + (1 + val) * 40)},${Math.round(100 + (1 + val) * 20)},235)`;
  }

  function riskLabel(val) {
    if (val > 0.7) return ["Very High", C.red, C.redSoft];
    if (val > 0.5) return ["High", C.amber, C.amberSoft];
    if (val > 0.35) return ["Moderate", "#ca8a04", "#fefce8"];
    if (val < -0.5) return ["Strong Neg", C.green, C.greenSoft];
    return ["Negative", C.accent, C.accentSoft];
  }

  if (pairs.length === 0)
    return <div style={{ textAlign: "center", padding: "32px 0", color: C.green, fontSize: 13, fontWeight: 600 }}>✓ No significant correlations — excellent diversification!</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px 72px 100px", padding: "0 8px 10px", borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>
        {["Stock A", "Stock B", "Strength", "r value", "Risk"].map(h => <div key={h} style={S.label}>{h}</div>)}
      </div>
      {pairs.map(({ a, b, val }) => {
        const [rl, rc, rbg] = riskLabel(val);
        return (
          <div key={`${a}-${b}`}
            onMouseEnter={() => setHovered(`${a}-${b}`)} onMouseLeave={() => setHovered(null)}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px 72px 100px", padding: "10px 8px", borderRadius: 8, alignItems: "center", background: hovered === `${a}-${b}` ? C.surfaceAlt : "transparent", transition: "background 0.12s" }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{a}</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{b}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 10, background: C.border, borderRadius: 5, overflow: "hidden" }}>
                <div style={{ width: `${Math.abs(val) * 100}%`, height: "100%", background: barColor(val), borderRadius: 5, transition: "width 0.6s ease" }} />
              </div>
            </div>
            <div style={{ ...S.mono, fontSize: 12, fontWeight: 700, color: val > 0 ? C.red : C.accent }}>
              {val > 0 ? "+" : ""}{val.toFixed(2)}
            </div>
            <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, background: rbg, color: rc, fontSize: 10, fontWeight: 700 }}>{rl}</div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.textSoft, flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: C.red, display: "inline-block" }} />
          Positive r — stocks move together (concentration risk)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: C.accent, display: "inline-block" }} />
          Negative r — stocks move opposite (good hedge)
        </span>
        <span style={{ color: C.textMuted }}>Only showing |r| ≥ {THRESHOLD}</span>
      </div>
    </div>
  );
}

/*Sector Radar*/
function SectorRadar({ sectors }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={sectors.map(s => ({ subject: s.sector, pct: s.pct }))} cx="50%" cy="50%" outerRadius={75}>
        <PolarGrid stroke={C.border} />
        <PolarAngleAxis dataKey="subject" tick={{ fill: C.textSoft, fontSize: 11 }} />
        <Radar dataKey="pct" stroke={C.accent} fill={C.accent} fillOpacity={0.12} strokeWidth={2} />
        <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={v => [`${v}%`, "Weight"]} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/*Sector Bars*/
function SectorBars({ sectors }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {sectors.map((s, i) => (
        <div key={s.sector}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{s.sector}</span>
            <span style={{ ...S.mono, fontSize: 12, color: C.textSoft }}>{s.pct}%</span>
          </div>
          <div style={{ height: 7, background: C.border, borderRadius: 4 }}>
            <div style={{ width: `${s.pct}%`, height: "100%", background: SECTOR_COLORS[i % SECTOR_COLORS.length], borderRadius: 4, transition: "width 0.8s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/*ROI Bar Chart*/
function RoiChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <XAxis dataKey="ticker" tick={{ fill: C.textSoft, fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: C.textSoft, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
        <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} formatter={v => [`${v}%`, "ROI"]} />
        <ReferenceLine y={0} stroke={C.borderStrong} />
        <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
          {data.map(entry => <Cell key={entry.ticker} fill={entry.roi >= 0 ? C.green : C.red} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/*Leaderboard Table*/
function Leaderboard({ data }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${C.border}` }}>
            {["#", "Stock", "Sector", "Qty", "Buy Avg", "Current", "ROI %", "Gain $", "Weight"].map(h => (
              <th key={h} style={{ ...S.label, padding: "8px 12px", textAlign: "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const isGain = row.roi >= 0;
            return (
              <tr key={row.ticker} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "11px 12px" }}>
                  <span style={{ display: "inline-flex", width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 6, fontSize: 11, fontWeight: 700, background: i === 0 ? "#fef3c7" : i === 1 ? "#f1f5f9" : i === 2 ? "#fdf4ff" : C.bg, color: i === 0 ? "#b45309" : i === 1 ? "#475569" : i === 2 ? "#7e22ce" : C.textMuted }}>
                    {row.rank}
                  </span>
                </td>
                <td style={{ padding: "11px 12px", fontWeight: 700 }}>{row.ticker}</td>
                <td style={{ padding: "11px 12px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: C.accentSoft, color: C.accent }}>{row.sector}</span>
                </td>
                <td style={{ padding: "11px 12px", ...S.mono, color: C.textSoft }}>{row.quantity}</td>
                <td style={{ padding: "11px 12px", ...S.mono }}>${row.avg_buy_price.toLocaleString()}</td>
                <td style={{ padding: "11px 12px", ...S.mono }}>${row.current_price.toLocaleString()}</td>
                <td style={{ padding: "11px 12px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, ...S.mono, background: isGain ? C.greenSoft : C.redSoft, color: isGain ? C.green : C.red }}>
                    {isGain ? "+" : ""}{row.roi}%
                  </span>
                </td>
                <td style={{ padding: "11px 12px", fontWeight: 600, ...S.mono, color: isGain ? C.green : C.red }}>
                  {isGain ? "+" : ""}${row.gain.toLocaleString()}
                </td>
                <td style={{ padding: "11px 12px", minWidth: 110 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ flex: 1, height: 5, background: C.border, borderRadius: 3 }}>
                      <div style={{ width: `${row.weight}%`, height: "100%", background: C.accent, borderRadius: 3 }} />
                    </div>
                    <span style={{ ...S.mono, fontSize: 11, color: C.textSoft, minWidth: 32 }}>{row.weight}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/*Formula Card*/
function FormulaCard() {
  return (
    <div style={{ ...S.card, background: C.accentSoft, borderColor: "#bfdbfe" }}>
      <div style={{ ...S.label, marginBottom: 10 }}>Score Formula</div>
      <div style={{ ...S.mono, fontSize: 12, color: C.accent, fontWeight: 600, background: C.surface, padding: "10px 14px", borderRadius: 8, border: "1px solid #bfdbfe", marginBottom: 12 }}>
        0.5 × corr + 0.3 × sector_entropy + 0.2 × (1 − HHI)
      </div>
      {[
        ["Correlation (50%)", "Mean Pearson r — lower = stocks move independently"],
        ["Sector Entropy (30%)", "Shannon entropy of sector weights — more spread = better"],
        ["Concentration (20%)", "Herfindahl Index — penalizes overweight in any one stock"],
      ].map(([t, d]) => (
        <div key={t} style={{ marginBottom: 7, fontSize: 11 }}>
          <span style={{ fontWeight: 700, color: C.text }}>{t}</span>
          <span style={{ color: C.textSoft }}> — {d}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Scoring helpers (mirrors finance_service.py) ─────────────────────────── */

function pearson(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const meanA = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const meanB = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - meanA, y = b[i] - meanB;
    num += x * y; da += x * x; db += y * y;
  }
  const denom = Math.sqrt(da * db);
  return denom === 0 ? 0 : num / denom;
}

function avgPairwiseCorr(returnsMap) {
  const tickers = Object.keys(returnsMap);
  if (tickers.length < 2) return 0;
  let total = 0, count = 0;
  for (let i = 0; i < tickers.length; i++)
    for (let j = i + 1; j < tickers.length; j++) {
      total += pearson(returnsMap[tickers[i]], returnsMap[tickers[j]]);
      count++;
    }
  return count ? total / count : 0;
}

function sectorDiversityBonus(holdings) {
  const counts = {};
  holdings.forEach(h => { counts[h.sector] = (counts[h.sector] || 0) + 1; });
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  const probs = Object.values(counts).map(c => c / total);
  const n = probs.length;
  if (n === 1) return 0.5;
  const entropy = -probs.filter(p => p > 0).reduce((s, p) => s + p * Math.log(p), 0);
  const maxEntropy = Math.log(n);
  return 0.7 + (entropy / maxEntropy) * 0.5;
}

function concentrationPenalty(holdings) {
  const totalVal = holdings.reduce((s, h) => s + h.value, 0);
  const weights = holdings.map(h => h.value / totalVal);
  const hhi = weights.reduce((s, w) => s + w * w, 0);
  const n = weights.length;
  const minHHI = 1 / n;
  return (hhi - minHHI) / (1 - minHHI + 1e-9);
}

function calcScore(holdings, returnsMap) {
  const avgCorr = avgPairwiseCorr(returnsMap);
  const corrScore = (1 - avgCorr) * 100;
  const bonus = sectorDiversityBonus(holdings);
  const sectorScore = ((bonus - 0.7) / 0.5) * 100;
  const penalty = concentrationPenalty(holdings);
  const concScore = (1 - penalty) * 100;
  const final = 0.5 * corrScore + 0.3 * sectorScore + 0.2 * concScore;
  return Math.round(Math.max(0, Math.min(100, final)) * 10) / 10;
}

/* ─── WatchlistImpact component ─────────────────────────────────────────────── */

function WatchlistImpact({ currentScore, currentHoldings, returnsCache, userId, token }) {
  const [watchlist, setWatchlist] = useState([]);
  const [companies, setCompanies] = useState({});   // ticker → { sector, current_price }
  const [quantities, setQuantities] = useState({});  // ticker → qty (editable)
  const [results, setResults] = useState([]);        // per-stock impact rows
  const [combinedResult, setCombinedResult] = useState(null); // add-all impact
  const [wLoading, setWLoading] = useState(true);
  const [wError, setWError] = useState(null);

  // Fetch watchlist + company metadata
  useEffect(() => {
    if (!token) return;
    setWLoading(true);
    Promise.all([
      fetch('/api/watchlist', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/companies/').then(r => r.json()),
    ])
      .then(([wl, comps]) => {
        setWatchlist(Array.isArray(wl) ? wl : []);
        const map = {};
        (Array.isArray(comps) ? comps : []).forEach(c => {
          map[c.ticker] = { sector: c.sector || 'Unknown', current_price: null };
        });
        setCompanies(map);
        // Default quantity = 10 for each watchlist item
        const qty = {};
        (Array.isArray(wl) ? wl : []).forEach(w => { qty[w.symbol] = 10; });
        setQuantities(qty);
      })
      .catch(() => setWError('Could not load watchlist data.'))
      .finally(() => setWLoading(false));
  }, [token]);

  // Fetch current prices for watchlist symbols from DailyPrice via Python backend
  useEffect(() => {
    if (!watchlist.length) return;
    // Fetch returns data for each watchlist ticker (same endpoint used for portfolio)
    watchlist.forEach(w => {
      fetch(`/prices/${w.symbol}?range_type=1y`)
        .then(r => r.json())
        .then(data => {
          const prices = (data.prices || []).map(p => p.close).filter(Boolean);
          if (prices.length > 1) {
            const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
            returnsCache.current[w.symbol] = returns;
          }
          // Use last price
          const lastPrice = prices[prices.length - 1] || w.targetPrice || 100;
          setCompanies(prev => ({
            ...prev,
            [w.symbol]: { ...(prev[w.symbol] || {}), current_price: lastPrice },
          }));
        })
        .catch(() => {});
    });
  }, [watchlist]);

  // Recalculate impact whenever quantities change
  useEffect(() => {
    if (!currentHoldings.length || !watchlist.length) return;

    const rows = watchlist.map(w => {
      const qty = quantities[w.symbol] || 10;
      const info = companies[w.symbol] || {};
      const price = info.current_price || w.targetPrice || 100;
      const sector = info.sector || 'Unknown';

      // Build merged holdings = current + this watchlist stock
      const merged = [
        ...currentHoldings,
        { ticker: w.symbol, sector, quantity: qty, avg_buy_price: price, current_price: price, value: price * qty },
      ];

      // Build merged returnsMap — use returnsCache for existing, empty for unknown
      const mergedReturns = { ...returnsCache.current };
      if (!mergedReturns[w.symbol]) mergedReturns[w.symbol] = [];

      // Only score if we have ≥2 tickers with returns
      const withReturns = Object.fromEntries(
        Object.entries(mergedReturns).filter(([, v]) => v.length > 1)
      );

      const newScore = Object.keys(withReturns).length >= 2
        ? calcScore(merged, withReturns)
        : calcScore(merged, mergedReturns);

      const delta = Math.round((newScore - currentScore) * 10) / 10;
      return { symbol: w.symbol, sector, price, qty, newScore, delta };
    });

    setResults(rows);

    // Combined: add ALL watchlist stocks at once
    const allMerged = [
      ...currentHoldings,
      ...watchlist.map(w => {
        const qty = quantities[w.symbol] || 10;
        const info = companies[w.symbol] || {};
        const price = info.current_price || w.targetPrice || 100;
        const sector = info.sector || 'Unknown';
        return { ticker: w.symbol, sector, quantity: qty, avg_buy_price: price, current_price: price, value: price * qty };
      }),
    ];
    const allReturns = { ...returnsCache.current };
    const withReturns = Object.fromEntries(Object.entries(allReturns).filter(([, v]) => v.length > 1));
    const combinedScore = Object.keys(withReturns).length >= 2
      ? calcScore(allMerged, withReturns)
      : calcScore(allMerged, allReturns);
    setCombinedResult({
      newScore: combinedScore,
      delta: Math.round((combinedScore - currentScore) * 10) / 10,
    });
  }, [watchlist, quantities, companies, currentHoldings, currentScore]);

  if (wLoading) return (
    <div style={S.card}>
      <div style={{ ...S.label, marginBottom: 12 }}>Watchlist Impact Simulator</div>
      <p style={{ fontSize: 13, color: C.textMuted }}>Loading watchlist…</p>
    </div>
  );

  if (wError) return (
    <div style={S.card}>
      <div style={{ ...S.label, marginBottom: 12 }}>Watchlist Impact Simulator</div>
      <p style={{ fontSize: 13, color: C.red }}>{wError}</p>
    </div>
  );

  if (!watchlist.length) return (
    <div style={S.card}>
      <div style={{ ...S.label, marginBottom: 12 }}>Watchlist Impact Simulator</div>
      <p style={{ fontSize: 13, color: C.textMuted }}>
        Your watchlist is empty. Add stocks to your watchlist to simulate their portfolio impact.
      </p>
    </div>
  );

  const DeltaBadge = ({ delta }) => {
    const pos = delta > 0, neutral = delta === 0;
    const bg    = neutral ? C.surfaceAlt : pos ? C.greenSoft : C.redSoft;
    const color = neutral ? C.textMuted  : pos ? C.green     : C.red;
    const arrow = neutral ? '━' : pos ? '▲' : '▼';
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 20, fontWeight: 700,
        fontSize: 12, background: bg, color,
        fontFamily: "'DM Mono', monospace",
        border: `1px solid ${neutral ? C.border : pos ? '#86efac' : '#fca5a5'}`,
      }}>
        {arrow} {pos ? '+' : ''}{delta}
      </span>
    );
  };

  const ScoreMini = ({ score }) => {
    const color = score >= 65 ? C.green : score >= 40 ? C.amber : C.red;
    return (
      <span style={{
        fontFamily: "'DM Mono', monospace", fontWeight: 800,
        fontSize: 15, color,
      }}>{score}</span>
    );
  };

  return (
    <div style={S.card}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ ...S.label, marginBottom: 6 }}>Watchlist Impact Simulator</div>
          <p style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.6, maxWidth: 520 }}>
            Adjust the quantity for each watchlist stock and see how adding it would shift your
            diversification score. Current score: <strong style={{ color: C.accent }}>{currentScore}</strong>
          </p>
        </div>
        {/* Combined badge */}
        {combinedResult && (
          <div style={{
            ...S.card, padding: '12px 18px', textAlign: 'center',
            border: `1px solid ${combinedResult.delta > 0 ? '#86efac' : combinedResult.delta < 0 ? '#fca5a5' : C.border}`,
            background: combinedResult.delta > 0 ? C.greenSoft : combinedResult.delta < 0 ? C.redSoft : C.surfaceAlt,
            minWidth: 140, flexShrink: 0,
          }}>
            <div style={{ ...S.label, marginBottom: 6 }}>Add All</div>
            <ScoreMini score={combinedResult.newScore} />
            <div style={{ marginTop: 6 }}>
              <DeltaBadge delta={combinedResult.delta} />
            </div>
          </div>
        )}
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '90px 1fr 110px 120px 110px 120px',
        padding: '0 8px 10px', borderBottom: `1px solid ${C.border}`, gap: 8,
      }}>
        {['Symbol', 'Sector', 'Price', 'Qty (editable)', 'New Score', 'Δ Score'].map(h => (
          <div key={h} style={S.label}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {results.map((row, i) => (
        <div
          key={row.symbol}
          style={{
            display: 'grid', gridTemplateColumns: '90px 1fr 110px 120px 110px 120px',
            padding: '12px 8px', borderBottom: `1px solid ${C.border}`,
            background: i % 2 === 0 ? 'transparent' : C.surfaceAlt,
            alignItems: 'center', gap: 8,
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentSoft}
          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : C.surfaceAlt}
        >
          <div style={{ fontWeight: 800, fontSize: 14, color: C.accent }}>{row.symbol}</div>
          <div>
            <span style={{
              padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
              background: C.accentSoft, color: C.accent,
            }}>{row.sector}</span>
          </div>
          <div style={{ ...S.mono, fontSize: 12, color: C.textSoft }}>
            ${row.price ? row.price.toFixed(2) : '—'}
          </div>
          <div>
            <input
              type="number"
              min="1"
              value={quantities[row.symbol] || 10}
              onChange={e => setQuantities(prev => ({
                ...prev, [row.symbol]: Math.max(1, parseInt(e.target.value) || 1),
              }))}
              style={{
                width: 70, padding: '5px 8px', borderRadius: 7,
                border: `1px solid ${C.border}`, background: C.surface,
                fontFamily: "'DM Mono', monospace", fontSize: 12,
                color: C.text, outline: 'none', textAlign: 'center',
              }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 6 }}>shares</span>
          </div>
          <div><ScoreMini score={row.newScore} /></div>
          <div><DeltaBadge delta={row.delta} /></div>
        </div>
      ))}

      {/* Footer note */}
      <div style={{ marginTop: 14, fontSize: 11, color: C.textMuted, lineHeight: 1.7 }}>
        * Score uses the same formula as your portfolio: 50% correlation + 30% sector entropy + 20% concentration (HHI).
        Returns data is fetched from 1-year price history; stocks with no price history use neutral correlation.
      </div>
    </div>
  );
}

/*
 * UploadButton is exported so parent dashboards can place it anywhere.
 * Dashboard accepts:
 *   tab          – active tab string ('diversification' | 'leaderboard' | ...)
 *   registerRefresh – callback(fn) called once on mount; parent stores fn to
 *                     trigger a data refresh after a successful upload
 */
export { UploadButton };

export default function Dashboard({ tab, registerRefresh }) {
  const { user, token } = useAuth();
  const [divData, setDivData]             = useState(null);
  const [leaderboard, setLeaderboard]     = useState([]);
  const [currentHoldings, setCurrentHoldings] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [isEmpty, setIsEmpty]             = useState(false);
  // Cache of ticker → daily returns array, shared with WatchlistImpact
  const returnsCache = useRef({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const uid = user?.id || "default";
      const cacheBuster = `&_t=${Date.now()}`;
      const [div, lb, holdings] = await Promise.all([
        fetch(`/diversification/score?user_id=${uid}${cacheBuster}`).then(r => r.json()),
        fetch(`/leaderboard/?user_id=${uid}${cacheBuster}`).then(r => r.json()),
        fetch(`/diversification/portfolio?user_id=${uid}${cacheBuster}`).then(r => r.json()),
      ]);
      if (div.empty || lb.length === 0) {
        setIsEmpty(true);
      } else {
        setIsEmpty(false);
        setDivData(div);
        setLeaderboard(lb);
        // Build returnsCache from 1-year price history for each holding
        const holdingsArr = Array.isArray(holdings) ? holdings : [];
        setCurrentHoldings(holdingsArr);
        holdingsArr.forEach(h => {
          fetch(`/prices/${h.ticker}?range_type=1y`)
            .then(r => r.json())
            .then(data => {
              const prices = (data.prices || []).map(p => p.close).filter(Boolean);
              if (prices.length > 1) {
                returnsCache.current[h.ticker] = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
              }
            })
            .catch(() => {});
        });
      }
    } catch {
      setIsEmpty(true);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Give parent a handle to trigger refresh (e.g. after CSV upload)
  useEffect(() => {
    if (registerRefresh) registerRefresh(fetchAll);
  }, [registerRefresh, fetchAll]);

  const totalGain = leaderboard.reduce((s, r) => s + r.gain, 0);

  return (
    <div>
      {/*Loading*/}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
          <div style={{ color: C.accent, fontSize: 15, fontWeight: 700 }}>Loading…</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && isEmpty && <EmptyState />}

      {/*DIVERSIFICATION TAB*/}
      {!loading && !isEmpty && tab === "diversification" && divData && (
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "210px 1fr 1fr", gap: 18 }}>
            <div style={{ ...S.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ ...S.label, marginBottom: 16 }}>Diversification Score</div>
              <ScoreRing score={divData.score} />
            </div>
            <div style={S.card}>
              <div style={{ ...S.label, marginBottom: 16 }}>Sector Allocation</div>
              <SectorBars sectors={divData.sectors} />
            </div>
            <div style={S.card}>
              <div style={{ ...S.label, marginBottom: 8 }}>Sector Radar</div>
              <SectorRadar sectors={divData.sectors} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={S.label}>Significant Stock Correlations</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{divData.tickers.length} stocks · pairs with |r| ≥ 0.35 shown</div>
              </div>
              <CorrelationList matrix={divData.correlation_matrix} tickers={divData.tickers} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={S.card}>
                <div style={{ ...S.label, marginBottom: 14 }}>Recommendations</div>
                {divData.recommendations.map((r, i) => (
                  <div key={i} style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 8, background: C.amberSoft, borderLeft: `3px solid ${C.amber}`, fontSize: 12, lineHeight: 1.7 }}>{r}</div>
                ))}
              </div>
              <FormulaCard />
            </div>
          </div>

          {/* Watchlist Impact Simulator — full width */}
          <WatchlistImpact
            currentScore={divData.score}
            currentHoldings={currentHoldings}
            returnsCache={returnsCache}
            userId={user?.id || "default"}
            token={token}
          />
        </div>
      )}

      {/*LEADERBOARD TAB*/}
      {!loading && !isEmpty && tab === "leaderboard" && (
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { label: "Holdings", val: leaderboard.length, sub: "stocks tracked" },
              { label: "Best Performer", val: leaderboard[0]?.ticker, sub: `+${leaderboard[0]?.roi}% ROI`, color: C.green, bg: C.greenSoft },
              { label: "Worst Performer", val: leaderboard[leaderboard.length - 1]?.ticker, sub: `${leaderboard[leaderboard.length - 1]?.roi}% ROI`, color: C.red, bg: C.redSoft },
              { label: "Total Gain / Loss", val: `$${Math.abs(totalGain).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, sub: totalGain >= 0 ? "Overall profit" : "Overall loss", color: totalGain >= 0 ? C.green : C.red, bg: totalGain >= 0 ? C.greenSoft : C.redSoft },
            ].map((stat, i) => (
              <div key={i} style={{ ...S.card, background: stat.bg || C.surface }}>
                <div style={{ ...S.label, marginBottom: 8 }}>{stat.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: stat.color || C.text, ...S.mono }}>{stat.val}</div>
                <div style={{ fontSize: 11, color: C.textSoft, marginTop: 4 }}>{stat.sub}</div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={{ ...S.label, marginBottom: 16 }}>ROI by Stock</div>
            <RoiChart data={[...leaderboard].sort((a, b) => b.roi - a.roi)} />
          </div>
          <div style={S.card}>
            <div style={{ ...S.label, marginBottom: 16 }}>Performance Rankings</div>
            <Leaderboard data={leaderboard} />
          </div>
        </div>
      )}
    </div>
  );
}