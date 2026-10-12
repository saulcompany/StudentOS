import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function SettingsPage() {
  const { user, saveProfile, logout } = useAppContext();
  const [saved, setSaved] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('studentos-theme') || 'light');
  const [studyWindow, setStudyWindow] = useState(user.preferredStudyWindow || '');
  const [sessionLength, setSessionLength] = useState(user.preferredSessionLength || '45');

  useEffect(() => {
    const appliedTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : theme;
    document.documentElement.dataset.theme = appliedTheme;
    localStorage.setItem('studentos-theme', theme);
  }, [theme]);

  const savePreferences = (event) => {
    event.preventDefault();
    saveProfile({ preferredStudyWindow: studyWindow, preferredSessionLength: sessionLength });
    setSaved(true);
  };

  const handleLogout = async () => {
    setLogoutError('');
    try {
      await logout();
    } catch (error) {
      setLogoutError(error.message || 'Could not log out.');
    }
  };

  return (
    <div className="page-shell">
      <div className="section-header slim">
        <div><p className="eyebrow">Settings</p><h1>Preferences and controls</h1></div>
      </div>
      <form className="settings-stack" onSubmit={savePreferences}>
        <div className="glass-card settings-card">
          <h3>Appearance</h3>
          <div className="toggle-list">
            <label><input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={(event) => setTheme(event.target.value)} /> Dark</label>
            <label><input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={(event) => setTheme(event.target.value)} /> Light</label>
            <label><input type="radio" name="theme" value="system" checked={theme === 'system'} onChange={(event) => setTheme(event.target.value)} /> System</label>
          </div>
        </div>
        <div className="glass-card settings-card">
          <h3>Study preferences</h3>
          <label>Preferred study window
            <input type="text" value={studyWindow} onChange={(event) => setStudyWindow(event.target.value)} placeholder="e.g. 7 PM - 9 PM" />
          </label>
          <label>Preferred session (minutes)
            <input type="number" min="5" max="240" value={sessionLength} onChange={(event) => setSessionLength(event.target.value)} />
          </label>
        </div>
        <div className="settings-actions">
          <button type="submit" className="primary-button">Save preferences</button>
          {saved && <span className="muted-text" role="status">Preferences saved.</span>}
          {logoutError && <p className="form-error" role="alert">{logoutError}</p>}
          <button type="button" className="ghost-button" onClick={handleLogout}>Log out</button>
        </div>
      </form>
    </div>
  );
}
