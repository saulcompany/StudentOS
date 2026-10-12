import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const savedTheme = localStorage.getItem('studentos-theme') || 'light';
const appliedTheme = savedTheme === 'system'
  ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  : savedTheme;
document.documentElement.dataset.theme = appliedTheme;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
