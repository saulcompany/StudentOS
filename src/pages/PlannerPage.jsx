import { useState } from 'react';
import { BookOpen, CalendarDays, CheckCircle2, Clock3, ListTodo, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { requestAI } from '../services/aiClient';

function renderInlineText(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => (
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part
  ));
}

function renderPlanContent(content) {
  const blocks = [];
  let paragraph = [];
  let list = [];
  let listType = '';

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list.length) {
      blocks.push({ type: listType, items: list });
      list = [];
      listType = '';
    }
  };

  content.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    if (/^[-*_]{3,}$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'divider' });
      return;
    }

    const heading = line.match(/^#{1,3}\s+(.+)$/)
      || line.match(/^\*\*(.{1,90})\*\*:?\s*$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', text: heading[1].replace(/\*\*/g, '') });
      return;
    }

    const orderedItem = line.match(/^\d+[.)]\s+(.+)$/);
    const unorderedItem = line.match(/^[-*]\s+(.+)$/);
    const item = orderedItem || unorderedItem;
    if (item) {
      flushParagraph();
      const nextListType = orderedItem ? 'ordered-list' : 'unordered-list';
      if (listType && listType !== nextListType) flushList();
      listType = nextListType;
      list.push(item[1]);
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();

  return blocks.map((block, index) => {
    if (block.type === 'divider') return <hr className="planner-divider" key={index} />;
    if (block.type === 'heading') return <h3 className="planner-response-heading" key={index}>{renderInlineText(block.text)}</h3>;
    if (block.type === 'ordered-list' || block.type === 'unordered-list') {
      const ListTag = block.type === 'ordered-list' ? 'ol' : 'ul';
      return (
        <ListTag className="planner-response-list" key={index}>
          {block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInlineText(item)}</li>)}
        </ListTag>
      );
    }
    return <p className="planner-response-paragraph" key={index}>{renderInlineText(block.text)}</p>;
  });
}

export default function PlannerPage() {
  const { taskList, subjectList, addTask, user } = useAppContext();
  const [plan, setPlan] = useState('');
  const [planMode, setPlanMode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pendingTasks = taskList.filter((task) => task.status !== 'Completed');

  const generatePlan = async () => {
    setError('');
    setPlan('');
    setPlanMode('');
    setBusy(true);
    try {
      const result = await requestAI(
        'planner',
        'Create a practical study plan for today using my pending tasks and subjects. Prioritize deadlines, include breaks, and avoid inventing fixed commitments. Use clear time blocks when availability is known.',
        { student: user, tasks: pendingTasks, subjects: subjectList.map((subject) => subject.name) },
      );
      setPlan(result.message);
      setPlanMode(result.mode);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const savePlan = () => {
    addTask({ title: 'AI study plan', description: plan, category: 'Study', duration: 45 });
    setPlan('');
  };

  return (
    <div className="page-shell planner-page">
      <section className="planner-hero">
        <div className="planner-hero-copy">
          <span className="planner-hero-icon"><Sparkles size={20} /></span>
          <div>
            <p className="eyebrow">AI Planner</p>
            <h1>Plan a focused study day</h1>
            <p className="muted-text">A realistic plan shaped around your tasks, subjects, and available time.</p>
          </div>
        </div>
        <button type="button" className="primary-button planner-generate-button" onClick={generatePlan} disabled={busy}>
          <Sparkles size={16} />
          {busy ? 'Building your plan…' : plan ? 'Create a new plan' : 'Generate my plan'}
        </button>
      </section>

      <section className="planner-context" aria-label="Your study context">
        <article className="planner-context-card">
          <span className="planner-context-icon"><ListTodo size={18} /></span>
          <div><strong>{pendingTasks.length}</strong><span>tasks to plan</span></div>
        </article>
        <article className="planner-context-card">
          <span className="planner-context-icon"><BookOpen size={18} /></span>
          <div><strong>{subjectList.length}</strong><span>subjects added</span></div>
        </article>
        <article className="planner-context-card">
          <span className="planner-context-icon"><Clock3 size={18} /></span>
          <div><strong>Flexible</strong><span>study schedule</span></div>
        </article>
      </section>

      {!pendingTasks.length && !subjectList.length && (
        <section className="planner-setup-note">
          <span className="planner-context-icon"><CalendarDays size={18} /></span>
          <div>
            <h2>Personalize your plan</h2>
            <p>Add a few tasks or subjects to your workspace first. You can still generate a general study plan now.</p>
          </div>
        </section>
      )}

      {error && <p className="form-error planner-error" role="alert">{error}</p>}

      {busy && (
        <section className="glass-card planner-loading" aria-live="polite">
          <span className="planner-loading-icon"><Sparkles size={19} /></span>
          <div><h2>Putting your study day together</h2><p className="muted-text">Prioritizing your work and making room for breaks…</p></div>
        </section>
      )}

      {plan && (
        <article className="glass-card plan-card planner-result">
          <header className="planner-result-header">
            <span className="planner-result-icon"><CheckCircle2 size={19} /></span>
            <div>
              <span className="ai-tag">{planMode === 'gemini' ? 'AI-generated plan' : 'Planner response'}</span>
              <h2>Your study plan</h2>
              <p className="muted-text">A clear starting point for a focused, balanced day.</p>
            </div>
          </header>
          <div className="planner-response">{renderPlanContent(plan)}</div>
          <footer className="planner-buttons">
            {planMode === 'gemini' && <button type="button" className="primary-button small" onClick={savePlan}>Save as a task</button>}
            <button type="button" className="ghost-button small" onClick={generatePlan} disabled={busy}>Regenerate</button>
            <button type="button" className="ghost-button small" onClick={() => setPlan('')}>Dismiss</button>
          </footer>
        </article>
      )}

      {!plan && !error && !busy && (
        <section className="glass-card planner-empty">
          <span className="planner-empty-icon"><CalendarDays size={23} /></span>
          <h2>Your plan will show up here</h2>
          <p>Generate a study schedule with focused work blocks, breaks, and priorities based on what you need to get done.</p>
          <div className="planner-empty-steps">
            <span><CheckCircle2 size={15} /> Prioritize tasks</span>
            <span><CheckCircle2 size={15} /> Organize subjects</span>
            <span><CheckCircle2 size={15} /> Make time for breaks</span>
          </div>
        </section>
      )}
    </div>
  );
}
