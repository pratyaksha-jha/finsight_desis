import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "../../hooks/useAuth";
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "../../services/tradeSetup.service";
import { fetchCompanies } from "../../services/stock.service";
import "./WatchlistModule.css";

const API = "/api";

// ─── Real price feed from backend ──────────────────────────────────────
function useLivePrices(symbols) {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    if (!symbols || !symbols.length) return;
    
    const fetchPrices = async () => {
      const next = { ...prices };
      for (const sym of symbols) {
        try {
          const res = await fetch(`http://localhost:8000/api/stock/price/${sym}`);
          
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("Did not receive JSON.");
          }
          
          const data = await res.json();
          if (data.price) {
            const price = parseFloat(data.price);
            
            // Use the prev_close from Python for the math
            const prevClose = data.prev_close ? parseFloat(data.prev_close) : price;
            const change = price - prevClose;
            const changePct = prevClose ? (change / prevClose) * 100 : 0;

            next[sym] = {
              price,
              change: parseFloat(change.toFixed(2)),
              changePct: parseFloat(changePct.toFixed(2)),
              direction: change >= 0 ? "up" : "down",
            };
          }
        } catch (err) {
          console.error(`[Live Price Alert] Failed to fetch ${sym}:`, err.message);
        }
      }
      setPrices(prev => ({...prev, ...next}));
    };

    fetchPrices();
    const id = setInterval(fetchPrices, 10000); 
    return () => clearInterval(id);
  }, [symbols.join(",")]);

  return prices;
}

// ─── Alert Toast ──────────────────────────────────────────────────────────────
function AlertToast({ alerts, onDismiss }) {
  return (
    <div className="alerts-container">
      {alerts.map(a => (
        <div key={a.id} className="alert-toast">
          <div className="alert-header">
            <span className="alert-title">🔔 Price Alert — {a.symbol}</span>
            <button className="alert-close" onClick={() => onDismiss(a.id)}>✕</button>
          </div>
          <div className="alert-body">
            {a.symbol} hit ${a.price} — Target was ${a.target}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Add Stock Modal ──────────────────────────────────────────────────────────
function AddStockModal({ onClose, onAdd }) {
  const { token } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ symbol: "", name: "", targetPrice: "", notes: "" });
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
    if (!form.symbol || !form.targetPrice) { setError("Symbol and target price are required"); return; }
    setLoading(true);
    try {
      const payload = { ...form, targetPrice: parseFloat(form.targetPrice) };
      const data = await addToWatchlist(token, payload);
      onAdd(data);
      onClose();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add to Watchlist</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="error-bar">{error}</div>}
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Stock Symbol *</label>
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
          <div className="form-group">
            <label>Target Price ($) *</label>
            <input type="number" placeholder="e.g. 280" value={form.targetPrice}
              onChange={e => setForm(p => ({ ...p, targetPrice: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input placeholder="Why are you watching this stock?" value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding…" : "Add to Watchlist"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Watchlist Row ────────────────────────────────────────────────────────────
function WatchlistRow({ stock, liveData, onDelete, onShowNews, onEditTarget }) {
  const live = liveData[stock.symbol] || {};
  const price = live.price || stock.lastPrice || 0;
  const targetReached = price >= stock.targetPrice;
  const pctToTarget = stock.targetPrice && price ? (((stock.targetPrice - price) / price) * 100).toFixed(2) : null;

  return (
    <div className={`watchlist-row ${targetReached ? "target-reached" : ""}`}>
      <div className="row-main">
        <div className="stock-info">
          <span className="stock-symbol">{stock.symbol}</span>
          {stock.name && <span className="stock-name">{stock.name}</span>}
          {targetReached && <span className="badge badge-green">🎯 Target Hit</span>}
        </div>

        <div className="price-group">
          <div className="live-price">${price.toFixed(2)}</div>
          {live.changePct !== undefined && (
            <div className={live.direction === "up" ? "tag-up" : "tag-down"}>
              {live.direction === "up" ? "▲" : "▼"} {Math.abs(live.changePct)}%
            </div>
          )}
        </div>

        <div className="target-group">
          <div className="target-label">Target</div>
          <div className="target-price">${stock.targetPrice?.toLocaleString()}</div>
          {pctToTarget && (
            <div className={parseFloat(pctToTarget) <= 0 ? "tag-up" : "tag-down"} style={{ fontSize: 11 }}>
              {parseFloat(pctToTarget) <= 0 ? "▲ Reached" : `${pctToTarget}% away`}
            </div>
          )}
        </div>

        <div className="row-actions">
          {/* Wire up the News button to trigger the redirect prop */}
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => onShowNews(stock.symbol)}>
            📰 News
          </button>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => onEditTarget(stock)}>
            ✏️ Edit
          </button>
          <button className="btn btn-danger" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => onDelete(stock._id || stock.id)}>
            🗑
          </button>
        </div>
      </div>
      {stock.notes && <div className="stock-notes">📝 {stock.notes}</div>}
    </div>
  );
}

// ─── Main Watchlist Module ────────────────────────────────────────────────────
export default function WatchlistModule() {
  const { token } = useAuth();
  const navigate = useNavigate(); // The engine for redirection
  
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toastAlerts, setToastAlerts] = useState([]);
  const [editStock, setEditStock] = useState(null);
  const [editTarget, setEditTarget] = useState("");
  const [filter, setFilter] = useState("all");

  const symbols = stocks.map(s => s.symbol);
  const prices = useLivePrices(symbols);

  useEffect(() => {
    getWatchlist(token)
      .then(d => { setStocks(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!Object.keys(prices).length) return;
    stocks.forEach(stock => {
      const live = prices[stock.symbol];
      if (!live) return;
      if (live.price >= stock.targetPrice) {
        setToastAlerts(prev => {
          if (prev.find(a => a.symbol === stock.symbol)) return prev;
          return [...prev, { id: Date.now(), symbol: stock.symbol, price: live.price, target: stock.targetPrice }];
        });
      }
    });
  }, [prices, stocks]);

  const handleDelete = async (id) => {
    await removeFromWatchlist(token, id);
    setStocks(prev => prev.filter(s => (s._id || s.id) !== id));
  };

  const handleAdd = (stock) => setStocks(prev => [...prev, stock]);

  const handleEditTarget = async () => {
    if (!editTarget) return;
    
    try {
      const res = await fetch(`${API}/watchlist/${editStock._id || editStock.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ targetPrice: parseFloat(editTarget) }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update target price");
      }
      
      const updated = await res.json();
      setStocks(prev => prev.map(s => (s._id || s.id) === (updated._id || updated.id) ? updated : s));
      setEditStock(null); 
      setEditTarget("");
    } catch (err) {
      alert(`Update Error: ${err.message}`);
    }
  };

  // Triggers the redirect dynamically based on user role
  const navigateToNews = (symbol) => {
    // Check if the user object has a role, default to adult if missing
    const isStudent = token && JSON.parse(atob(token.split('.')[1])).role === 'student';
    
    if (isStudent) {
      navigate(`/student/news?symbol=${symbol}`);
    } else {
      navigate(`/adult/news?symbol=${symbol}`);
    }
  };

  const filtered = filter === "hit"
    ? stocks.filter(s => (prices[s.symbol]?.price || 0) >= s.targetPrice)
    : stocks;

  const dismissAlert = id => setToastAlerts(prev => prev.filter(a => a.id !== id));

  if (loading) return <div className="loading-state">Loading watchlist…</div>;

  return (
    <div className="watchlist-module">
      <AlertToast alerts={toastAlerts} onDismiss={dismissAlert} />

      <div className="module-header">
        <div>
          <div className="page-title">Watchlist</div>
          <div className="page-sub">Track stocks • Set price targets • Get alerted</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 160 }}>
            <option value="all">All Stocks ({stocks.length})</option>
            <option value="hit">Target Hit</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + Add Stock
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-value">{stocks.length}</div>
          <div className="stat-label">Watching</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--green)" }}>
            {stocks.filter(s => (prices[s.symbol]?.price || 0) >= s.targetPrice).length}
          </div>
          <div className="stat-label">Targets Hit</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--accent)" }}>
            {stocks.filter(s => {
              const p = prices[s.symbol]?.price || 0;
              return p > 0 && p >= s.targetPrice * 0.95 && p < s.targetPrice;
            }).length}
          </div>
          <div className="stat-label">Near Target</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{toastAlerts.length}</div>
          <div className="stat-label">Active Alerts</div>
        </div>
      </div>

      {/* Watchlist Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◈</div>
          <div className="empty-title">No stocks in watchlist</div>
          <div className="empty-sub">Add stocks you're interested in buying and set price targets</div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add First Stock</button>
        </div>
      ) : (
        <div className="watchlist-list">
          <div className="list-header">
            <span>Stock</span>
            <span>Live Price</span>
            <span>Target</span>
            <span>Actions</span>
          </div>
          {filtered.map(stock => (
            <WatchlistRow
              key={stock._id || stock.id}
              stock={stock}
              liveData={prices}
              onDelete={handleDelete}
              onShowNews={navigateToNews} // Passing the redirect function down to the row
              onEditTarget={s => { setEditStock(s); setEditTarget(s.targetPrice || ""); }}
            />
          ))}
        </div>
      )}

      {/* Edit Target Modal */}
      {editStock && (
        <div className="modal-overlay" onClick={() => setEditStock(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Target — {editStock.symbol}</h2>
              <button className="modal-close" onClick={() => setEditStock(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>New Target Price ($)</label>
                <input 
                  type="number" 
                  value={editTarget} 
                  onChange={e => setEditTarget(e.target.value)} 
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditStock(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEditTarget}>Update Target</button>
            </div>
          </div>
        </div>
      )}

      {showAdd && <AddStockModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  );
}