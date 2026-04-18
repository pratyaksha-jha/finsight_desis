import { useEffect, useState } from 'react';
import CommentThread from '../../components/parental/CommentThread';
import { useAuth } from '../../hooks/useAuth';
import { getResolvedTrades } from '../../services/parental.service';

// Fetches ALL trade requests (resolved ones) so parent can review their feedback history
export default function ParentalFeedback() {
  const { token } = useAuth();
  const [trades, setTrades]   = useState([]);
  const [filter, setFilter]   = useState('all'); // 'all' | 'approved' | 'rejected'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Re-use the same endpoint; all resolved trades will have status !== 'pending'
    // In a real app you'd have GET /trades/resolved — adapt to your backend
    getResolvedTrades(token)
    .then(setTrades)
    .finally(() => setLoading(false));
  }, [token]);

  // For the feedback history view we actually want resolved trades.
  // The backend endpoint can be extended; for now we filter client-side.
  const resolved = trades.filter((t) =>
    filter === 'all' ? true : t.status === filter
  );

  const counts = {
    all:      trades.filter((t) => t.status !== 'pending').length,
    approved: trades.filter((t) => t.status === 'approved').length,
    rejected: trades.filter((t) => t.status === 'rejected').length,
  };

  if (loading) return <p className="loading-text">Loading feedback history…</p>;

  return (
    <div className="parental-feedback">
      <div className="feedback-header">
        <h2>Feedback History</h2>
        <p>All comments you have left on your student's trade requests.</p>
      </div>

      {/* Filter pills */}
      <div className="filter-pills">
        {['all', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            className={`pill ${filter === f ? 'pill--active' : ''} pill--${f}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="pill-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Trade list with comment threads */}
      {resolved.length === 0 ? (
        <div className="empty-state">
          <p>No {filter !== 'all' ? filter : 'resolved'} trades yet.</p>
        </div>
      ) : (
        <div className="feedback-list">
          {resolved.map((trade) => (
            <div key={trade.id} className="feedback-item">
              {/* Trade summary row */}
              <div className="feedback-trade-row">
                <div className="trade-identity">
                  <span className="symbol">{trade.symbol}</span>
                  <span className="trade-meta">
                    {trade.action?.toUpperCase()} {trade.qty} shares
                    · ${(trade.qty * trade.estimated_price).toFixed(2)}
                  </span>
                </div>

                <div className="trade-status-info">
                  <span className={`status-badge status-badge--${trade.status}`}>
                    {trade.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                  </span>
                  {trade.resolved_at && (
                    <span className="resolved-date">
                      {new Date(trade.resolved_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Student's reasoning */}
              {trade.reasoning && (
                <div className="student-reasoning">
                  <span className="reasoning-label">Student's reasoning:</span>
                  <p>{trade.reasoning}</p>
                </div>
              )}

              {/* Comment thread (parent comment + any replies) */}
              <CommentThread
                tradeId={trade.id}
                parentComment={trade.parent_comment}
                studentName={trade.student_name}
                readonly={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}