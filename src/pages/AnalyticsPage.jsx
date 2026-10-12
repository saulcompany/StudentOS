import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppContext } from '../context/AppContext';

export default function AnalyticsPage() {
  const { taskList, goals, habits, fitnessLogs, assignments } = useAppContext();
  const completedTasks = taskList.filter((task) => task.status === 'Completed').length;
  const completionRate = taskList.length
    ? Math.round((completedTasks / taskList.length) * 100)
    : 0;

  return (
    <div className="page-shell">
      <div className="section-header slim">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Productivity dashboard</h1>
        </div>
      </div>

      <div className="stats-grid analytics-grid">
        <article className="glass-card stat-card">
          <p>Task completion rate</p>
          <h3>{completionRate}%</h3>
        </article>
        <article className="glass-card stat-card">
          <p>Tasks completed</p>
          <h3>{completedTasks}/{taskList.length}</h3>
        </article>
        <article className="glass-card stat-card">
          <p>Fitness hours</p>
          <h3>{(fitnessLogs.reduce((total, log) => total + (Number(log.minutes) || 0), 0) / 60).toFixed(1)}h</h3>
        </article>
        <article className="glass-card stat-card">
          <p>Goals completed</p>
          <h3>{goals.filter((goal) => goal.completed).length}/{goals.length}</h3>
        </article>
      </div>

      <div className="stats-grid analytics-grid">
        <article className="glass-card stat-card"><p>Assignments tracked</p><h3>{assignments.length}</h3></article>
        <article className="glass-card stat-card"><p>Habit check-ins</p><h3>{habits.reduce((total, habit) => total + (habit.checkIns || 0), 0)}</h3></article>
        <article className="glass-card stat-card"><p>Tasks remaining</p><h3>{taskList.length - completedTasks}</h3></article>
        <article className="glass-card stat-card"><p>Workout logs</p><h3>{fitnessLogs.length}</h3></article>
      </div>

      <div className="glass-card chart-card">
        <div className="section-header">
          <h2>Completion trend</h2>
        </div>
        {taskList.length === 0 ? (
          <p className="empty-state">Add tasks to start seeing completion analytics.</p>
        ) : (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[{ name: 'All tasks', completion: completionRate }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completion" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
