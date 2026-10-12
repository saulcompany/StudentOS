import { Bell, Bot, Search, Sparkles, UserCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export function TopHeader() {
  const { user, taskList, subjectList, assignments, notes, goals, calendarItems } = useAppContext();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const searchItems = [
    ...taskList.map((item) => ({ title: item.title, type: 'Task', to: '/tasks' })),
    ...subjectList.map((item) => ({ title: item.name, type: 'Subject', to: '/study-hub' })),
    ...assignments.map((item) => ({ title: item.title, type: 'Assignment', to: '/assignments' })),
    ...notes.map((item) => ({ title: item.title, type: 'Note', to: '/notes' })),
    ...goals.map((item) => ({ title: item.title, type: 'Goal', to: '/goals' })),
    ...calendarItems.map((item) => ({ title: item.title, type: 'Event', to: '/calendar' })),
  ].filter((item) => query.trim() && item.title.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6);

  return (
    <header className="topbar">
      <div className="search-container">
        <div className="search-box" role="search">
          <Search size={18} />
          <input
            aria-label="Global search"
            value={query}
            placeholder="Search tasks, notes, assignments..."
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && searchItems[0]) {
                navigate(searchItems[0].to);
                setQuery('');
              } else if (event.key === 'Escape') {
                setQuery('');
              }
            }}
          />
        </div>
        {query.trim() && (
          <div className="search-results">
            {searchItems.length === 0 ? <p>No matching items found.</p> : searchItems.map((item, index) => (
              <button key={`${item.type}-${item.title}-${index}`} type="button" onClick={() => { navigate(item.to); setQuery(''); }}>
                <span>{item.title}</span><small>{item.type}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <button className="ghost-button" type="button" aria-label="Open AI assistant" onClick={() => navigate('/ai-coach')}>
          <Bot size={18} />
          <span>AI Assistant</span>
        </button>
        <button className="icon-button" type="button" aria-label="Open recovery center" onClick={() => navigate('/recovery')}>
          <Bell size={18} />
        </button>
        <div className="user-chip">
          <div className="avatar-badge">
            <UserCircle2 size={18} />
          </div>
          <div>
            <strong>{user.name}</strong>
            <small>{user.course}</small>
          </div>
        </div>
        <button className="spark-button" type="button" aria-label="Open AI planner" onClick={() => navigate('/planner')}>
          <Sparkles size={16} />
          Briefing
        </button>
      </div>
    </header>
  );
}
