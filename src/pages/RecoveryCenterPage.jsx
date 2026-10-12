import { useAppContext } from '../context/AppContext';

export default function RecoveryCenterPage() {
  const { taskList, updateTask, addTask } = useAppContext();
  const missedTasks = taskList.filter((task) => ['Missed', 'Skipped'].includes(task.status));
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  return (
    <div className="page-shell">
      <div className="section-header slim">
        <div>
          <p className="eyebrow">Recovery Center</p>
          <h1>Missed task recovery</h1>
        </div>
      </div>

      <div className="recovery-grid">
        <article className="glass-card">
          <h3>Missed tasks</h3>
          {missedTasks.length === 0 ? (
            <p className="empty-state">No missed tasks to recover.</p>
          ) : (
            <ul>
              {missedTasks.map((task) => (
                <li className="recovery-task" key={task.id}>
                  <span>{task.title}</span>
                  <div className="collection-actions">
                    <button type="button" className="ghost-button small" onClick={() => updateTask(task.id, { dueDate: tomorrowDate, status: 'Rescheduled' })}>Move to tomorrow</button>
                    <button type="button" className="ghost-button small" onClick={() => {
                      const splitDuration = Math.max(15, Math.round((task.duration || 45) / 2));
                      addTask({ ...task, title: `${task.title} (Part 1)`, duration: splitDuration, status: 'Pending' });
                      addTask({ ...task, title: `${task.title} (Part 2)`, duration: splitDuration, status: 'Pending' });
                      updateTask(task.id, { status: 'Rescheduled' });
                    }}>Split into 2 tasks</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="glass-card">
          <h3>Recommended action</h3>
          <p>Break missed work into smaller sessions and reschedule it when you have time.</p>
        </article>
      </div>
    </div>
  );
}
