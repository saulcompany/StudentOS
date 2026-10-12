import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export default function ResetPasswordPage() {
  const { updatePassword } = useAppContext();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
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
      await updatePassword(password);
      setNotice('Your password has been updated. You can now log in with it.');
      form.reset();
    } catch (updateError) {
      setError(updateError.message || 'Could not update your password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-intro">
          <span className="brand-mark">S</span>
          <h1>Set a new password</h1>
          <p>Create a strong password for your StudentOS account.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            New password
            <input type="password" name="password" minLength="8" required />
          </label>
          <label>
            Confirm new password
            <input type="password" name="confirmPassword" minLength="8" required />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="success-message" role="status">{notice}</p>}

          <button type="submit" className="primary-button login-button" disabled={busy}>
            <CheckCircle2 size={18} />
            {busy ? 'Saving…' : 'Save new password'}
          </button>
        </form>

        <p className="auth-switcher">
          <Link to="/login">Return to login</Link>
        </p>
      </div>
    </div>
  );
}
