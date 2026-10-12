import { useAppContext } from '../context/AppContext';

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function MyDayPage() {
  const { taskList, calendarItems, updateTaskStatus } = useAppContext();
  const today = localDate();
  const todaysTasks = taskList.filter((task) => task.dueDate === today);
  const todaysEvents = calendarItems.filter((item) => item.date === today).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const nextTasks = taskList.filter((task) => (
    task.dueDate && task.dueDate > today && task.status !== 'Completed'
  )).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5);

  return (
    <div className="page-shell">
      <div className="section-header slim">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1>My Day</h1>
          <p className="muted-text">Your tasks due today, with upcoming work close at hand.</p>
        </div>
      </div>
      <section className="glass-card">
        <div className="section-header"><h2>Today’s tasks</h2><span>{todaysTasks.length} due</span></div>
        {todaysTasks.length === 0 ? <p className="empty-state">Nothing is due today. Add a task and set today as its due date.</p> : (
          <div className="collection-list">
            {todaysTasks.map((task) => (
              <article className="collection-row" key={task.id}>
                <div><strong>{task.title}</strong><p className="muted-text">{task.subject || task.category} · {task.duration} min</p></div>
                <select aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => updateTaskStatus(task.id, event.target.value)}>
                  {['Pending', 'In Progress', 'Completed', 'Skipped', 'Missed', 'Rescheduled'].map((status) => <option key={status}>{status}</option>)}
                </select>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="glass-card">
        <div className="section-header"><h2>Today’s events</h2><span>{todaysEvents.length} scheduled</span></div>
        {todaysEvents.length === 0 ? <p className="empty-state">No calendar events for today.</p> : (
          <div className="collection-list">
            {todaysEvents.map((event) => <article className="collection-row" key={event.id}><strong>{event.title}</strong><span>{event.time || 'Time not set'}</span></article>)}
          </div>
        )}
      </section>
      <section className="glass-card">
        <div className="section-header"><h2>Coming up</h2></div>
        {nextTasks.length === 0 ? <p className="empty-state">No upcoming dated tasks.</p> : (
          <div className="collection-list">
            {nextTasks.map((task) => <article className="collection-row" key={task.id}><strong>{task.title}</strong><span>{task.dueDate}</span></article>)}
          </div>
        )}
      </section>
    </div>
  );
}
