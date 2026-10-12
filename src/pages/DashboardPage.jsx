import {
  CheckCircle2,
  Clock3,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { plannerSuggestions } from '../data/mockData';
import { useNavigate } from 'react-router-dom';

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const { taskList, calendarItems, user, studyStreak } = useAppContext();
  const navigate = useNavigate();
  const today = localDate();
  const todayItems = [
    ...calendarItems.filter((item) => item.date === today).map((item) => ({
      time: item.time || '—',
      title: item.title,
      category: 'Calendar event',
      duration: '',
    })),
    ...taskList.filter((task) => task.dueDate === today).map((task) => ({
      time: '—',
      title: task.title,
      category: task.subject || task.category,
      duration: `${task.duration}m`,
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const completedTasks = taskList.filter((task) => task.status === 'Completed').length;
  const pendingTasks = taskList.filter((task) => task.status !== 'Completed').length;
  const completionRate = taskList.length
    ? Math.round((completedTasks / taskList.length) * 100)
    : 0;
  const statCards = [
    {
      label: 'Study streak',
      value: `${studyStreak.current || 0}d`,
      detail: studyStreak.longest ? `${studyStreak.longest}d best streak` : 'Start today and keep it alive',
      icon: Flame,
    },
    {
      label: 'Task progress',
      value: `${completionRate}%`,
      detail: `${completedTasks} of ${taskList.length} completed`,
      icon: Target,
    },
    {
      label: 'Tasks completed',
      value: `${completedTasks}/${taskList.length}`,
      detail: `${pendingTasks} remaining`,
      icon: CheckCircle2,
    },
    {
      label: 'Study time',
      value: '—',
      detail: 'No study sessions recorded',
      icon: Clock3,
    },
  ];

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Welcome, {user.name || 'Student'} 👋</p>
          <h1>Make today yours.</h1>
          <p className="muted-text">
            Add your subjects and tasks to start organizing your studies.
          </p>
        </div>
        <div className="pulsing-chip">
          <Sparkles size={18} />
          {studyStreak.current > 0 ? `${studyStreak.current}-day study streak is active.` : 'Start your study streak today.'}
        </div>
      </section>

      <section className="stats-grid">
        {statCards.map(({ label, value, detail, icon: Icon }) => (
          <article key={label} className="glass-card stat-card">
            <div className="stat-icon">
              <Icon size={18} />
            </div>
            <div>
              <p>{label}</p>
              <h3>{value}</h3>
              <small>{detail}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="main-grid two-col">
        <div className="glass-card">
          <div className="section-header">
            <h2>Today’s timeline</h2>
            <button type="button" className="ghost-button small" onClick={() => navigate('/calendar')}>
              Add event
            </button>
          </div>
          <div className="timeline-list">
            {todayItems.length === 0 ? (
              <p className="empty-state">Your schedule is empty for now.</p>
            ) : todayItems.map((item, index) => (
              <div key={`${item.time}-${item.title}-${index}`} className="timeline-item">
                <span className="time-stamp">{item.time}</span>
                <div className="dot" />
                <div className="timeline-content">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.category}</p>
                  </div>
                  <small>{item.duration}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <div className="section-header">
            <h2>AI planner snapshot</h2>
            <TrendingUp size={18} />
          </div>
          <div className="stack-list">
            {plannerSuggestions.length === 0 ? (
              <p className="empty-state">Planner suggestions will appear here when available.</p>
            ) : plannerSuggestions.map((tip) => (
              <div key={tip.id} className="ai-suggestion">
                <div className="ai-tag">{tip.type}</div>
                <p>{tip.message}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="main-grid two-col">
        <div className="glass-card chart-card">
          <div className="section-header">
            <h2>Study hours</h2>
          </div>
          <div className="chart-wrap empty-state">
            Study activity will appear here once tracked.
          </div>
        </div>

        <div className="glass-card">
          <div className="section-header">
            <h2>Priority tasks</h2>
          </div>
          <div className="task-list compact-list">
            {taskList.length === 0 ? (
              <p className="empty-state">No tasks yet. Add one from the Tasks page.</p>
            ) : taskList.map((task) => (
              <div key={task.id} className="task-row">
                <div>
                  <strong>{task.title}</strong>
                  <p>{task.subject || 'No subject'}</p>
                </div>
                <span className={`pill ${task.priority.toLowerCase()}`}>{task.priority}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
