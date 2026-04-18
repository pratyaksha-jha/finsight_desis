import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { acceptInvite } from '../../services/auth.service';

export default function InviteAccept() {
  const { token: inviteToken } = useParams();
  const { user, token: authToken, login, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  

  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // If already logged in as adult, accept immediately
  useEffect(() => {
    if (authLoading || !user) return;
    if (user.role !== 'adult') { logout(); return; }
  
    // Already logged in as adult — accept immediately
    acceptInvite(authToken, inviteToken)
      .then(() => { setStatus('success'); setTimeout(() => navigate('/parent/approval'), 1500); })
      .catch((err) => { setStatus('error'); setMessage(err.message || 'Invalid or expired invite link.'); });
  }, []);
    
  // Login form submit — after login, useEffect above fires automatically
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const result = await login(form.email, form.password);
      if (result.role !== 'adult') {
        setLoginError('Only parent/guardian accounts can accept student invites.');
        return;
      }
      // Don't rely on useEffect — call acceptInvite directly here
      const token = localStorage.getItem('fs_token');
      await acceptInvite(token, inviteToken);
      setStatus('success');
      setTimeout(() => navigate('/parent/approval'), 1500);
    } catch (err) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  if (authLoading) return <div className="auth-page"><p style={{ padding: 32 }}>Loading…</p></div>;

  if (status === 'accepting') return (
    <div className="auth-page"><div className="auth-card"><p>Linking your account… ⏳</p></div></div>
  );

  if (status === 'success') return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>✅ Accounts linked!</h2>
        <p>Redirecting to Guardian Portal…</p>
      </div>
    </div>
  );

  if (status === 'error') return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>⚠️ Could not accept invite</h2>
        <p className="form-error">{message}</p>
        <Link to="/parent/approval">Go to Guardian Portal</Link>
      </div>
    </div>
  );

  // Default: not logged in — show login form + register option
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🔗 Student Invite</h2>
          <p>A student has invited you to be their guardian on FinSight.</p>
        </div>

        <h3>Already have an account? Sign in to accept</h3>
        <form onSubmit={handleLogin} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="parent@example.com"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          {loginError && <p className="form-error">{loginError}</p>}
          <button type="submit" className="btn btn--primary btn--full" disabled={loginLoading}>
            {loginLoading ? 'Signing in…' : 'Sign In & Accept Invite'}
          </button>
        </form>

        <hr style={{ margin: '24px 0' }} />

        <p style={{ textAlign: 'center', marginBottom: 12 }}>New to FinSight?</p>
        <Link
          to={`/register/adult?invite=${inviteToken}`}
          className="btn btn--secondary btn--full"
          style={{ display: 'block', textAlign: 'center', padding: '10px 0' }}
        >
          Create Guardian Account
        </Link>
      </div>
    </div>
  );
}