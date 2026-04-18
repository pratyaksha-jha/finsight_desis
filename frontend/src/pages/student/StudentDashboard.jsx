import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getMyBudget, getMyTrades } from '../../services/parental.service';
import PortfolioDashboard, { UploadButton } from '../../components/stock/PortfolioDashboard';

const STATUS_STYLE = {
  pending:  { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending' },
  approved: { bg: 'var(--green-soft)', color: 'var(--green)', label: '✓ Approved' },
  rejected: { bg: 'var(--red-soft)',   color: 'var(--red)',   label: '✗ Rejected' },
};

function TradeRow({ trade }) {
  const s = STATUS_STYLE[trade.status] || STATUS_STYLE.pending;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 800 }}>{trade.symbol}</span>
        <span style={{ fontSize: 12, color: 'var(--text-soft)' }}>
          {trade.action?.toUpperCase()} {trade.qty} shares @ ${trade.estimated_price}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>
          ${(trade.qty * trade.estimated_price).toFixed(2)}
        </span>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
          {s.label}
        </span>
      </div>
      {trade.parent_comment && (
        <div style={{
          marginTop: 8, padding: '8px 12px', background: 'var(--accent-soft)',
          borderRadius: 8, fontSize: 12, color: 'var(--text-soft)',
          borderLeft: '3px solid var(--accent)',
        }}>
          <strong>Guardian says:</strong> {trade.parent_comment}
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const [trades, setTrades]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget]   = useState(null);
  const [tab, setTab]         = useState('overview');
  const refreshRef            = useRef(null);

  useEffect(() => {
    if (!token || !user) return;
    getMyTrades(token)
      .then(setTrades)
      .catch(() => setTrades([]))
      .finally(() => setLoading(false));

    getMyBudget(token)
      .then(setBudget)
      .catch(() => setBudget(null));
  }, [token, user]);

  const registerRefresh = (fn) => { refreshRef.current = fn; };

  const pending  = trades.filter(t => t.status === 'pending');
  const resolved = trades.filter(t => t.status !== 'pending');

  const showPortfolio = ['diversification', 'leaderboard'].includes(tab);

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '8px 22px', border: 'none', cursor: 'pointer', borderRadius: 8,
        fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13,
        background: tab === id ? 'var(--accent)' : 'transparent',
        color: tab === id ? '#fff' : 'var(--text-soft)', transition: 'all 0.18s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ padding: '28px 36px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          Welcome, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>
          Your trades require guardian approval before execution.
        </p>
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 28, maxWidth: 600 }}>
        {[
          { to: '/student/news',      icon: '📰', label: 'Market News',    desc: 'News & sentiment for your watchlist' },
          { to: '/student/trades',    icon: '📋', label: 'Submit a Trade',  desc: 'Request a buy or sell with reasoning' },
          { to: '/student/watchlist', icon: '⭐', label: 'My Watchlist',    desc: 'Track stocks with target prices & notes' },
          { to: '/student/compare',   icon: '⚖️', label: 'Compare Trades', desc: 'Calculate risk/reward for trade setups' },
        ].map(item => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              textDecoration: 'none', color: 'var(--text)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow)',
              transition: 'all 0.15s', display: 'block',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* Unified tab bar + Import Portfolio button */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'var(--surface-alt)', padding: 4,
          borderRadius: 10, border: '1px solid var(--border)',
        }}>
          {/* Import Portfolio sits first inside the pill, only on portfolio tabs */}
          {showPortfolio && (
            <UploadButton
              onUploadSuccess={() => refreshRef.current?.()}
              userId={user?.id || 'default'}
            />
          )}
          {showPortfolio && (
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />
          )}

          {tabBtn('overview', 'Overview')}
          {tabBtn('diversification', 'Diversification')}
          {tabBtn('leaderboard', 'Leaderboard')}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <>
          {/* Budget Card */}
          {budget && (
            <div className="card" style={{ marginBottom: 20, maxWidth: 600 }}>
              <div className="card-label">My Budget</div>
              <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Total</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>${Number(budget.budget || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Used</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red)' }}>${Number(budget.budget_used || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Remaining</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>${Number(budget.budget_remaining || 0).toFixed(2)}</div>
                </div>
              </div>
              {/* Budget bar */}
              <div style={{ marginTop: 12, background: 'var(--border)', borderRadius: 99, height: 6 }}>
                <div style={{
                  height: 6, borderRadius: 99, background: 'var(--accent)',
                  width: `${Math.min((budget.budget_used / budget.budget) * 100 || 0, 100)}%`,
                  transition: 'width 0.4s',
                }} />
              </div>
            </div>
          )}
          {!budget && !loading && (
            <div className="card" style={{ marginBottom: 20, maxWidth: 600 }}>
              <div className="card-label">My Budget</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                No budget allocated yet. Ask your guardian to set a budget.
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Pending Transactions */}
            <div className="card">
              <div className="card-label">Pending Transactions</div>
              {loading && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>}
              {!loading && pending.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No pending trade requests.</p>
              )}
              {pending.map(t => <TradeRow key={t.id} trade={t} />)}
            </div>

            {/* Parental Advice */}
            <div className="card">
              <div className="card-label">Parental Advice</div>
              {loading && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>}
              {!loading && resolved.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No feedback from your guardian yet.</p>
              )}
              {resolved.filter(t => t.parent_comment).map(trade => (
                <div key={trade.id} style={{
                  padding: '12px 14px', marginBottom: 10,
                  background: trade.status === 'approved' ? 'var(--green-soft)' : 'var(--red-soft)',
                  borderRadius: 10, borderLeft: `3px solid ${trade.status === 'approved' ? 'var(--green)' : 'var(--red)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{trade.symbol}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {trade.action?.toUpperCase()} {trade.qty} shares
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.6 }}>
                    {trade.parent_comment}
                  </p>
                </div>
              ))}
              {!loading && resolved.filter(t => t.parent_comment).length === 0 && resolved.length > 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No comments left on your trades yet.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* PORTFOLIO TABS (Diversification + Leaderboard) */}
      {showPortfolio && (
        <PortfolioDashboard
          tab={tab}
          registerRefresh={registerRefresh}
        />
      )}
    </div>
  );
}