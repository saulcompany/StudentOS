import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { AppProvider, useAppContext } from './context/AppContext';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AICoachPage from './pages/AICoachPage';
import DashboardPage from './pages/DashboardPage';
import MyDayPage from './pages/MyDayPage';
import OnboardingPage from './pages/OnboardingPage';
import PlannerPage from './pages/PlannerPage';
import RecoveryCenterPage from './pages/RecoveryCenterPage';
import SettingsPage from './pages/SettingsPage';
import StudyHubPage from './pages/StudyHubPage';
import TasksPage from './pages/TasksPage';
import {
  CalendarPage,
  FitnessPage,
  GoalsPage,
  HabitsPage,
} from './pages/WorkspacePages';

function PrivateLayout({ children }) {
  const { dataSyncError } = useAppContext();
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-panel">
        <TopHeader />
        {dataSyncError && <p className="form-error" role="alert">{dataSyncError}</p>}
        <main>{children}</main>
      </div>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { isAuthenticated, authLoading, dataLoading } = useAppContext();
  const location = useLocation();

  if (authLoading || (isAuthenticated && dataLoading)) {
    return <div className="auth-shell"><p className="muted-text">Connecting to your StudentOS account…</p></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function AppRoutes() {
  const { isAuthenticated, authLoading } = useAppContext();
  const location = useLocation();
  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

  if (authLoading && !authRoutes.includes(location.pathname)) {
    return <div className="auth-shell"><p className="muted-text">Connecting to your StudentOS account…</p></div>;
  }

  if (!isAuthenticated && !authRoutes.includes(location.pathname)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/onboarding" element={<PrivateRoute><PrivateLayout><OnboardingPage /></PrivateLayout></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><PrivateLayout><DashboardPage /></PrivateLayout></PrivateRoute>} />
      <Route path="/my-day" element={<PrivateRoute><PrivateLayout><MyDayPage /></PrivateLayout></PrivateRoute>} />
      <Route path="/tasks" element={<PrivateRoute><PrivateLayout><TasksPage /></PrivateLayout></PrivateRoute>} />
      <Route path="/study-hub" element={<PrivateRoute><PrivateLayout><StudyHubPage /></PrivateLayout></PrivateRoute>} />
      <Route path="/planner" element={<PrivateRoute><PrivateLayout><PlannerPage /></PrivateLayout></PrivateRoute>} />
      <Route path="/recovery" element={<PrivateRoute><PrivateLayout><RecoveryCenterPage /></PrivateLayout></PrivateRoute>} />
      <Route path="/calendar" element={<PrivateRoute><PrivateLayout><CalendarPage /></PrivateLayout></PrivateRoute>} />
      <Route path="/assignments" element={<Navigate to="/study-hub?section=assignments" replace />} />
      <Route path="/notes" element={<Navigate to="/study-hub?section=notes" replace />} />
      <Route path="/goals" element={<PrivateRoute><PrivateLayout><GoalsPage /></PrivateLayout></PrivateRoute>} />
      <Route path="/habits" element={<PrivateRoute><PrivateLayout><HabitsPage /></PrivateLayout></PrivateRoute>} />
      <Route path="/fitness" element={<PrivateRoute><PrivateLayout><FitnessPage /></PrivateLayout></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><PrivateLayout><AnalyticsPage /></PrivateLayout></PrivateRoute>} />
      <Route path="/ai-coach" element={<PrivateRoute><PrivateLayout><AICoachPage /></PrivateLayout></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><PrivateLayout><SettingsPage /></PrivateLayout></PrivateRoute>} />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
