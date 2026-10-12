import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const recommendedTasks = [
  { title: 'Review lecture notes', category: 'Study', duration: 30 },
  { title: 'Practice questions', category: 'Study', duration: 45 },
  { title: 'Work on an assignment', category: 'Assignment', duration: 60 },
  { title: 'Prepare for an exam', category: 'Revision', duration: 45 },
  { title: 'Take a study break', category: 'Break', duration: 15 },
];

export default function TasksPage() {
  const { taskList, subjectList, updateTaskStatus, addTask, removeTask } = useAppContext();
  const [statusFilter, setStatusFilter] = useState('All');
  const filteredTasks = taskList.filter((task) => statusFilter === 'All' || task.status === statusFilter);
  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    addTask({ ...values, duration: Number(values.duration) });
    form.reset();
  };

  return (
    <div className="page-shell">
      <div className="section-header slim">
        <div>
          <p className="eyebrow">Task management</p>
          <h1>My tasks</h1>
        </div>
      </div>

      <section className="glass-card recommendation-card">
        <h2>Quick add a common task</h2>
        <p className="muted-text">Choose a suggestion to add it to your task list.</p>
        <div className="recommendation-list">
          {recommendedTasks.map((task) => (
            <button
              key={task.title}
              type="button"
              className="chip-button"
              onClick={() => addTask(task)}
            >
              + {task.title}
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card">
        <h2>Create a task</h2>
        <form className="collection-form" onSubmit={handleSubmit}>
          <label>Task title<input name="title" required /></label>
          <label>Subject<select name="subject" defaultValue=""><option value="">No subject</option>{subjectList.map((subject) => <option key={subject.name}>{subject.name}</option>)}</select></label>
          <label>Due date<input name="dueDate" type="date" /></label>
          <label>Priority<select name="priority" defaultValue="Medium">{['Critical', 'High', 'Medium', 'Low'].map((priority) => <option key={priority}>{priority}</option>)}</select></label>
          <label>Duration (minutes)<input name="duration" type="number" min="1" defaultValue="30" required /></label>
          <button type="submit" className="primary-button">Add task</button>
        </form>
      </section>

      <section className="glass-card">
        <div className="section-header">
          <h2>Your tasks</h2>
          <label className="filter-label">Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {['All', 'Pending', 'In Progress', 'Completed', 'Skipped', 'Missed', 'Rescheduled'].map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
        </div>
      <div className="task-board">
        {filteredTasks.length === 0 ? (
          <p className="glass-card empty-state">No tasks yet. Add one from the suggestions above.</p>
        ) : filteredTasks.map((task) => (
          <article key={task.id} className="glass-card task-card">
            <div className="task-topline">
              <div>
                <h3>{task.title}</h3>
                <p>{task.subject || 'No subject'}</p>
              </div>
              <span className={`pill ${task.priority.toLowerCase()}`}>{task.priority}</span>
            </div>
            <p className="muted-text">{task.description || 'No details added.'}</p>
            <div className="meta-grid">
              <span>Category: {task.category}</span>
              <span>Due: {task.dueDate || 'Not set'}</span>
              <span>Duration: {task.duration} min</span>
              <span>Reminder: {task.reminder}</span>
            </div>
            <div className="task-actions">
              <button type="button" className="ghost-button small" onClick={() => updateTaskStatus(task.id, 'Completed')}>
                Complete
              </button>
              <button type="button" className="ghost-button small" onClick={() => updateTaskStatus(task.id, 'Pending')}>
                Reset
              </button>
              <button type="button" className="ghost-button small" onClick={() => removeTask(task.id)}>Delete</button>
              <select
                value={task.status}
                aria-label={`Update status for ${task.title}`}
                onChange={(event) => updateTaskStatus(task.id, event.target.value)}
              >
                {['Pending', 'In Progress', 'Completed', 'Skipped', 'Missed', 'Rescheduled'].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </article>
        ))}
      </div>
      </section>
    </div>
  );
}
