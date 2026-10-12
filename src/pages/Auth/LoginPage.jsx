import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { getRememberMePreference } from '../../services/supabaseClient';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, supabaseConfigured } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(getRememberMePreference);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login({ email, password, rememberMe });
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Could not log in. Check your email and password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-intro">
          <span className="brand-mark">S</span>
          <h1>Welcome back</h1>
          <p>Log in to StudentOS and plan your academic life with clarity.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button type="button" className="icon-button small" onClick={() => setShowPassword((current) => !current)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div className="auth-meta">
            <label className="checkbox-row">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          {!supabaseConfigured && <p className="form-error" role="status">Add your Supabase URL and anon/publishable key to the project-root .env file, then restart the app.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" className="primary-button login-button" disabled={busy}>
            <LogIn size={18} />
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="auth-switcher">
          Need an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
