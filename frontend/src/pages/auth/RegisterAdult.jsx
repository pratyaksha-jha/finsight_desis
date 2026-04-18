import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { acceptInvite } from '../../services/auth.service';

export default function RegisterAdult() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { token: tokenFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const pendingInviteToken = tokenFromPath || searchParams.get('invite') || null;
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'adult',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    if (!form.name || !form.email || !form.password)
      return 'All fields are required.';
    if (form.password !== form.confirmPassword)
      return 'Passwords do not match.';
    if (form.password.length < 8)
      return 'Password must be at least 8 characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');

    try {
      const { name, email, password, role } = form;
      const result = await register({ name, email, password, role });

      // If they arrived via a student invite link, auto-accept it
      if (pendingInviteToken) {
        try {
          await acceptInvite(result.token, pendingInviteToken);
        } catch {
          // Non-fatal — they can link manually later
          setError('Account created, but the invite link failed. Ask your student to resend it.');
        }
      }

      navigate('/adult/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Adult / Guardian Account</h2>
          <p>Full trading access with optional student oversight tools.</p>
          {pendingInviteToken && (
            <div className="invite-notice">
              🔗 You were invited by a student. Register below to link accounts.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Anita Sharma"
              value={form.name}
              onChange={set('name')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="anita@example.com"
              value={form.email}
              onChange={set('email')}
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
              onChange={set('password')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Adult Account'}
          </button>
        </form>

        <p className="auth-footer">
          Registering as a student instead?{' '}
          <Link to="/register/student">Student account</Link>
        </p>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}