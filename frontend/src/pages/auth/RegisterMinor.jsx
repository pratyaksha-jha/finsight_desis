import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterMinor() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'student' });
  const [inviteToken, setInviteToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const result = await register(form);
      // Show invite token so student can send to parent
      setInviteToken(result.inviteToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (inviteToken) return (
    <div className="auth-page">
    <div className="auth-card">
      <div className="auth-header">
        <h2>Account Created! 🎉</h2>
        <p>Share this link with your parent or guardian:</p>
      </div>
      <div className="form-group">
        <code style={{ wordBreak: 'break-all', background: '#f0f0f0', padding: '12px', borderRadius: '8px', display: 'block' }}>
          {`${window.location.origin}/invite/${inviteToken}`}
        </code>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 12 }}>
        You can trade only after your parent accepts the link.
      </p>
      <button className="btn btn--primary btn--full" onClick={() => navigate('/student/dashboard')}>
        Continue to Dashboard
      </button>
    </div>
  </div>
  );

  return (
    <div className="auth-page">
    <div className="auth-card">
      <div className="auth-header">
        <h2>Student Account</h2>
        <p>Your trades will require guardian approval before execution.</p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            placeholder="Riya Sharma"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="riya@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Student Account'}
        </button>
      </form>
      <p className="auth-footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  </div>
  );
}