import { useAppContext } from '../context/AppContext';

const pageConfig = {
  calendar: {
    title: 'Calendar',
    noun: 'event',
    eyebrow: 'Schedule',
    description: 'Add events and review the dates you have planned.',
    collection: 'calendarItems',
    fields: [{ name: 'title', label: 'Event', required: true }, { name: 'date', label: 'Date', type: 'date', required: true }, { name: 'time', label: 'Time', type: 'time' }],
    summary: (item) => `${item.date}${item.time ? ` · ${item.time}` : ''}`,
  },
  goals: {
    title: 'Goals',
    noun: 'goal',
    eyebrow: 'Progress',
    description: 'Set personal or academic goals and track completion.',
    collection: 'goals',
    fields: [{ name: 'title', label: 'Goal', required: true }, { name: 'target', label: 'Target' }, { name: 'dueDate', label: 'Target date', type: 'date' }],
    summary: (item) => `${item.target || 'No target set'}${item.dueDate ? ` · By ${item.dueDate}` : ''}`,
    toggle: { key: 'completed', label: 'Complete goal' },
  },
  habits: {
    title: 'Habits',
    noun: 'habit',
    eyebrow: 'Consistency',
    description: 'Build a routine by checking in whenever you complete a habit.',
    collection: 'habits',
    fields: [{ name: 'title', label: 'Habit', required: true }, { name: 'frequency', label: 'Frequency', placeholder: 'e.g. Daily' }],
    summary: (item) => `${item.frequency || 'Flexible'} · ${item.checkIns || 0} check-ins`,
    action: { label: 'Check in', updates: (item) => ({ checkIns: (item.checkIns || 0) + 1 }) },
  },
  fitness: {
    title: 'Fitness',
    noun: 'workout',
    eyebrow: 'Wellbeing',
    description: 'Log workouts and track your activity time.',
    collection: 'fitnessLogs',
    fields: [{ name: 'title', label: 'Activity', required: true }, { name: 'minutes', label: 'Duration (minutes)', type: 'number', required: true }, { name: 'date', label: 'Date', type: 'date', required: true }],
    summary: (item) => `${item.minutes} min${item.date ? ` · ${item.date}` : ''}`,
  },
};

function CollectionPage({ config }) {
  const { [config.collection]: items, taskList, addRecord, updateRecord, removeRecord } = useAppContext();
  const sortedItems = config.collection === 'calendarItems'
    ? [...items].sort((a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`))
    : items;
  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    if (config.collection === 'fitnessLogs') values.minutes = Number(values.minutes);
    addRecord(config.collection === 'fitnessLogs' ? 'fitness' : config.collection.replace('Items', ''), values);
    form.reset();
  };

  return (
    <div className="page-shell">
      <div className="section-header slim">
        <div><p className="eyebrow">{config.eyebrow}</p><h1>{config.title}</h1><p className="muted-text">{config.description}</p></div>
      </div>
      <section className="glass-card">
        <h2>Add {config.noun}</h2>
        <form className="collection-form" onSubmit={handleSubmit}>
          {config.fields.map((field) => (
            <label key={field.name}>
              {field.label}
              {field.type === 'textarea' ? <textarea name={field.name} required={field.required} /> : (
                <input name={field.name} type={field.type || 'text'} placeholder={field.placeholder || ''} required={field.required} min={field.type === 'number' ? 1 : undefined} />
              )}
            </label>
          ))}
          <button type="submit" className="primary-button">Add to {config.title.toLowerCase()}</button>
        </form>
      </section>
      {config.collection === 'calendarItems' && (
        <section className="glass-card">
          <div className="section-header"><h2>Task deadlines</h2></div>
          {taskList.filter((task) => task.dueDate).length === 0 ? (
            <p className="empty-state">Tasks with due dates will appear on your calendar here.</p>
          ) : (
            <div className="collection-list">
              {taskList.filter((task) => task.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((task) => (
                <article className="collection-row" key={task.id}>
                  <div><strong>{task.title}</strong><p className="muted-text">{task.subject || task.category}</p></div>
                  <span>{task.dueDate}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
      <section className="glass-card">
        <div className="section-header"><h2>Your {config.title.toLowerCase()}</h2><span>{items.length}</span></div>
        {items.length === 0 ? <p className="empty-state">Nothing here yet. Add your first {config.title.toLowerCase().replace(/s$/, '')} above.</p> : (
          <div className="collection-list">
            {sortedItems.map((item) => (
              <article className="collection-row" key={item.id}>
                <div className="collection-copy">
                  <strong>{item.title}</strong>
                  <p className="muted-text">{config.summary(item)}</p>
                </div>
                <div className="collection-actions">
                  {config.toggle && <button type="button" className="ghost-button small" onClick={() => updateRecord(config.collection === 'fitnessLogs' ? 'fitness' : config.collection.replace('Items', ''), item.id, { [config.toggle.key]: !item[config.toggle.key] })}>{item[config.toggle.key] ? 'Reopen' : config.toggle.label}</button>}
                  {config.action && <button type="button" className="ghost-button small" onClick={() => updateRecord(config.collection === 'fitnessLogs' ? 'fitness' : config.collection.replace('Items', ''), item.id, config.action.updates(item))}>{config.action.label}</button>}
                  <button type="button" className="ghost-button small" onClick={() => removeRecord(config.collection === 'fitnessLogs' ? 'fitness' : config.collection.replace('Items', ''), item.id)} aria-label={`Delete ${item.title}`}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function CalendarPage() { return <CollectionPage config={pageConfig.calendar} />; }
export function GoalsPage() { return <CollectionPage config={pageConfig.goals} />; }
export function HabitsPage() { return <CollectionPage config={pageConfig.habits} />; }
export function FitnessPage() { return <CollectionPage config={pageConfig.fitness} />; }
