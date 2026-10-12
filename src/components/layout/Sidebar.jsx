import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  Dumbbell,
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  MoonStar,
  Rocket,
  Settings,
  Sparkles,
  Target,
  TimerReset,
  UserRound,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'My Day', to: '/my-day', icon: TimerReset },
  { label: 'Tasks', to: '/tasks', icon: CheckSquare },
  { label: 'Study Hub', to: '/study-hub', icon: GraduationCap },
  { label: 'AI Planner', to: '/planner', icon: Rocket },
  { label: 'Recovery Center', to: '/recovery', icon: Sparkles },
  { label: 'Calendar', to: '/calendar', icon: CalendarDays },
  { label: 'Goals', to: '/goals', icon: Target },
  { label: 'Habits', to: '/habits', icon: MoonStar },
  { label: 'Fitness', to: '/fitness', icon: Dumbbell },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'AI Coach', to: '/ai-coach', icon: MessageSquareText },
  { label: 'Settings', to: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">S</div>
        <div>
          <p className="eyebrow">StudentOS</p>
          <h2>Campus OS</h2>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink key={label} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/settings" className="profile-pill profile-link">
          <UserRound size={16} />
          <span>Profile</span>
        </NavLink>
      </div>
    </aside>
  );
}
