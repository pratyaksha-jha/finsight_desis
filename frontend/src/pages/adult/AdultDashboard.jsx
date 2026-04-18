import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPendingTrades } from '../../services/parental.service';
import PortfolioDashboard, { UploadButton } from '../../components/stock/PortfolioDashboard';

export default function AdultDashboard() {
  const { user, token } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [tab, setTab] = useState('portfolio');
  const refreshRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    getPendingTrades(token)
      .then(trades => setPendingCount(trades.length))
      .catch(() => {});
  }, [token]);

  // Called by PortfolioDashboard once it mounts, giving us its fetchAll fn
  const registerRefresh = (fn) => { refreshRef.current = fn; };

  const tabBtn = (id, label, badge) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '8px 22px', border: 'none', cursor: 'pointer', borderRadius: 8,
        fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13,
        background: tab === id ? 'var(--accent)' : 'transparent',
        color: tab === id ? '#fff' : 'var(--text-soft)', transition: 'all 0.18s',
        position: 'relative',
      }}
    >
      {label}
      {badge > 0 && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 18, height: 18, borderRadius: '50%', background: 'var(--red)',
          color: '#fff', fontSize: 10, fontWeight: 700, marginLeft: 6,
        }}>
          {badge}
        </span>
      )}
    </button>
  );

  const showPortfolio = ['portfolio', 'diversification', 'leaderboard'].includes(tab);

  return (
    <div style={{ padding: '28px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>
            Your portfolio analytics and guardian tools in one place.
          </p>
        </div>

        {pendingCount > 0 && (
          <Link to="/parent/approval" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', background: '#fef3c7',
              border: '1px solid #fde68a', borderRadius: 10,
              fontSize: 13, fontWeight: 600, color: '#92400e',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }} />
              {pendingCount} trade{pendingCount > 1 ? 's' : ''} awaiting approval
            </div>
          </Link>
        )}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { to: '/adult/analysis', icon: '📊', label: 'Stock Analysis', desc: 'AI summaries, financials & price charts' },
          { to: '/adult/news',     icon: '📰', label: 'Market News',    desc: 'Live news with sentiment analysis' },
          { to: '/parent/approval',icon: '✅', label: 'Guardian Portal', desc: 'Review & approve student trades' },
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
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* Unified bar: Import Portfolio + tabs all in one pill */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'var(--surface-alt)', padding: 4,
          borderRadius: 10, border: '1px solid var(--border)',
        }}>
          {/* Import Portfolio sits first inside the pill */}
          {showPortfolio && (
            <UploadButton
              onUploadSuccess={() => refreshRef.current?.()}
              userId={user?.id || 'default'}
            />
          )}

          {/* Thin separator between import button and tabs */}
          {showPortfolio && (
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />
          )}

          {tabBtn('portfolio', 'Portfolio Analytics')}
          {tabBtn('diversification', 'Diversification')}
          {tabBtn('leaderboard', 'Leaderboard')}
          {tabBtn('pending', 'Pending Approvals', pendingCount)}
        </div>
      </div>

      {/* Portfolio content — single mounted instance shared across 3 tabs */}
      {showPortfolio && (
        <PortfolioDashboard
          tab={tab === 'portfolio' ? 'diversification' : tab}
          registerRefresh={registerRefresh}
        />
      )}

      {tab === 'pending' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
          <p style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 16 }}>
            Manage all pending trade requests from your linked students.
          </p>
          <Link to="/parent/approval" className="btn btn--primary">
            Go to Approval Portal →
          </Link>
        </div>
      )}
    </div>
  );
}