import { useState } from 'react';

export default function TransactionApprovalCard({ trade, onApprove, onReject }) {
  const [comment, setComment] = useState('');
  const [acting, setActing] = useState(false);

  const handle = async (fn) => {
    setActing(true);
    await fn(comment);
    setActing(false);
  };

  return (
    <div className="approval-card">
      <div className="trade-header">
        <span className="symbol">{trade.symbol}</span>
        <span className="action">{trade.action.toUpperCase()} {trade.qty} shares</span>
        <span className="cost">${(trade.qty * trade.estimated_price).toFixed(2)}</span>
      </div>

      {trade.reasoning && (
        <div className="reasoning">
          <strong>Student's reasoning:</strong> {trade.reasoning}
        </div>
      )}

      <textarea
        placeholder="Leave a comment for your student (optional)…"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={2}
      />

      <div className="actions">
        <button onClick={() => handle(onApprove)} disabled={acting} className="btn-approve">
          ✓ Approve
        </button>
        <button onClick={() => handle(onReject)} disabled={acting} className="btn-reject">
          ✗ Reject
        </button>
      </div>
    </div>
  );
}