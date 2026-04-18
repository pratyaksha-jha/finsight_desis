import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function NavBar() {
  const { user, logout, isStudent, isAdult } = useAuth();
  const location = useLocation();

  const active = (path) =>
    location.pathname.startsWith(path) ? 'nav-link active' : 'nav-link';

  if (!user) return null;

  return (
    <nav className="nav">
      <Link to={isStudent ? '/student/dashboard' : '/adult/dashboard'} className="nav-logo">
        Fin<span>Sight</span>
      </Link>

      <div className="nav-links">
        {isStudent && (
          <>
            <Link to="/student/dashboard"  className={active('/student/dashboard')}>Dashboard</Link>
            <Link to="/student/news"       className={active('/student/news')}>News</Link>
            <Link to="/student/trades"     className={active('/student/trades')}>My Trades</Link>
            <Link to="/student/analysis"   className={active('/student/analysis')}>Analysis</Link>
            <Link to="/student/watchlist"  className={active('/student/watchlist')}>Watchlist</Link>
            <Link to="/student/compare"    className={active('/student/compare')}>Compare</Link>
          </>
        )}
        {isAdult && (
  <>
    <Link to="/adult/dashboard" className={active('/adult/dashboard')}>Dashboard</Link>
    <Link to="/adult/news" className={active('/adult/news')}>News</Link>
    <Link to="/adult/analysis" className={active('/adult/analysis')}>Analysis</Link>
    <Link to="/adult/watchlist" className={active('/adult/watchlist')}>Watchlist</Link>  {/* NEW */}
    <Link to="/adult/compare" className={active('/adult/compare')}>Compare</Link>      {/* NEW */}
    <Link to="/adult/trades" className={active('/adult/trades')}>Trades</Link>
    <Link to="/parent/approval" className={active('/parent/approval')}>Guardian Portal</Link>
  </>
)}
      </div>

      <div className="nav-user">
        <span className="nav-user-name">{user.name}</span>
        <span className={`nav-role-badge nav-role-badge--${user.role}`}>
          {user.role === 'student' ? 'Student' : 'Adult'}
        </span>
        <button
          onClick={logout}
          style={{
            padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 8,
            background: 'var(--surface)', cursor: 'pointer', fontSize: 12,
            fontFamily: 'Syne, sans-serif', fontWeight: 600, color: 'var(--text-soft)',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}