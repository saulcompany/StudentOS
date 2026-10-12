import { ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp, supabaseConfigured } = useAppContext();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name')?.toString().trim() || '';
    const email = formData.get('email')?.toString().trim() || '';
    const password = formData.get('password')?.toString() || '';
    const confirmPassword = formData.get('confirmPassword')?.toString() || '';

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await signUp({ email, password, name });
      if (result.session) {
        navigate('/onboarding', { replace: true });
      } else {
        setNotice('Check your email to confirm your account, then log in.');
      }
    } catch (signupError) {
      setError(signupError.message || 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-intro">
          <span className="brand-mark">S</span>
          <h1>Create your account</h1>
          <p>Set up StudentOS and start building a smarter academic life.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Full name
            <input type="text" name="name" placeholder="Your full name" required />
          </label>
          <label>
            Email
            <input type="email" name="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input type="password" name="password" placeholder="Create a strong password" minLength="8" required />
          </label>
          <label>
            Confirm password
            <input type="password" name="confirmPassword" placeholder="Re-enter your password" minLength="8" required />
          </label>

          <label className="checkbox-row terms-row">
            <input type="checkbox" required />
            <span>I accept the terms and privacy policy.</span>
          </label>

          {!supabaseConfigured && <p className="form-error" role="status">Add your Supabase URL and anon/publishable key to the project-root .env file, then restart the app.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="success-message" role="status">{notice}</p>}

          <button type="submit" className="primary-button login-button" disabled={busy}>
            <Sparkles size={18} />
            {busy ? 'Creating account…' : 'Continue'}
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="auth-switcher">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
