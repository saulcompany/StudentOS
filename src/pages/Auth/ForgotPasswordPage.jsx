import { Mail } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAppContext();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await requestPasswordReset(email);
      setNotice('If the email belongs to an account, a password reset link has been sent.');
    } catch (requestError) {
      setError(requestError.message || 'Could not send the password reset email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-intro">
          <span className="brand-mark">S</span>
          <h1>Reset password</h1>
          <p>Enter your email and we will send a secure reset link.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="your@email.com" required />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="success-message" role="status">{notice}</p>}

          <button type="submit" className="primary-button login-button" disabled={busy}>
            <Mail size={18} />
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="auth-switcher">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
