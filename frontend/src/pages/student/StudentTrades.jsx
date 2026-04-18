import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { submitTradeRequest, getMyTrades } from '../../services/parental.service';
import { fetchCompanies } from '../../services/stock.service';

const STATUS_STYLE = {
  pending:  { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending Approval' },
  approved: { bg: 'var(--green-soft)', color: 'var(--green)', label: '✓ Approved' },
  rejected: { bg: 'var(--red-soft)',   color: 'var(--red)',   label: '✗ Rejected' },
};

export default function StudentTrades() {
  const { user, token } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [trades, setTrades]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const [form, setForm] = useState({
    symbol: '', qty: '', action: 'buy', estimatedPrice: '', reasoning: '',
  });

  useEffect(() => {
    fetchCompanies().then(setCompanies);
    if (token) {
      getMyTrades(token)
        .then(setTrades)
        .catch(() => setTrades([]))
        .finally(() => setLoading(false));
    }
  }, [token]);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.symbol || !form.qty || !form.estimatedPrice) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await submitTradeRequest(token, {
        symbol: form.symbol.toUpperCase(),
        qty: parseInt(form.qty),
        action: form.action,
        estimatedPrice: parseFloat(form.estimatedPrice),
        reasoning: form.reasoning,
      });
      setSuccess('Trade request submitted! Your guardian will review it shortly.');
      setForm({ symbol: '', qty: '', action: 'buy', estimatedPrice: '', reasoning: '' });
      // Reload trades
      const updated = await getMyTrades(token);
      setTrades(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '28px 36px' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Submit a Trade Request</h2>
        <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>
          All trade requests require guardian approval before execution.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 28, alignItems: 'start' }}>
        {/* Form */}
        <div className="card">
          <div className="card-label" style={{ marginBottom: 20 }}>New Trade Request</div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Stock Symbol *</label>
              <select value={form.symbol} onChange={set('symbol')} required>
                <option value="">Select a company…</option>
                {companies.map(c => (
                  <option key={c.ticker} value={c.ticker}>
                    {c.company_name} ({c.ticker})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Action *</label>
              <select value={form.action} onChange={set('action')}>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Quantity *</label>
                <input type="number" min="1" placeholder="e.g. 5" value={form.qty} onChange={set('qty')} required />
              </div>
              <div className="form-group">
                <label>Est. Price per Share *</label>
                <input type="number" min="0.01" step="0.01" placeholder="e.g. 150.00" value={form.estimatedPrice} onChange={set('estimatedPrice')} required />
              </div>
            </div>

            {form.qty && form.estimatedPrice && (
              <div style={{ padding: '10px 14px', background: 'var(--accent-soft)', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                <strong>Estimated total:</strong> ${(parseFloat(form.qty || 0) * parseFloat(form.estimatedPrice || 0)).toFixed(2)}
              </div>
            )}

            <div className="form-group">
              <label>Reasoning (recommended)</label>
              <textarea
                rows={3} placeholder="Why do you want to make this trade? What news or analysis supports it?"
                value={form.reasoning} onChange={set('reasoning')}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'Syne, sans-serif', fontSize: 13, resize: 'vertical', outline: 'none' }}
              />
            </div>

            {error   && <p className="form-error" style={{ marginBottom: 10 }}>{error}</p>}
            {success && <p style={{ color: 'var(--green)', fontSize: 12, marginBottom: 10, fontWeight: 600 }}>{success}</p>}

            <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Trade Request'}
            </button>
          </form>
        </div>

        {/* Trade history */}
        <div className="card">
          <div className="card-label" style={{ marginBottom: 16 }}>My Trade History</div>
          {loading && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>}
          {!loading && trades.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No trades submitted yet.</p>
          )}
          {trades.map(trade => {
            const s = STATUS_STYLE[trade.status] || STATUS_STYLE.pending;
            return (
              <div key={trade.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{trade.symbol}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-soft)', padding: '2px 8px', background: 'var(--accent-soft)', borderRadius: 4, fontWeight: 700 }}>
                      {trade.action?.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-soft)', fontFamily: 'DM Mono, monospace' }}>
                  {trade.qty} shares × ${trade.estimated_price} = ${(trade.qty * trade.estimated_price).toFixed(2)}
                </div>
                {trade.parent_comment && (
                  <div style={{
                    marginTop: 8, padding: '8px 12px', background: 'var(--accent-soft)',
                    borderRadius: 8, fontSize: 12, borderLeft: '3px solid var(--accent)',
                  }}>
                    <strong>Guardian:</strong> {trade.parent_comment}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
