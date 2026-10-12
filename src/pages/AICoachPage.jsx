import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { requestAI } from '../services/aiClient';

export default function AICoachPage() {
  const { taskList, subjectList, user } = useAppContext();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = async (event) => {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt || busy) return;
    setQuestion('');
    setError('');
    setMessages((current) => [...current, { role: 'you', text: prompt }]);
    setBusy(true);
    try {
      const result = await requestAI('chat', prompt, {
        student: user,
        tasks: taskList,
        subjects: subjectList.map((subject) => subject.name),
      });
      setMessages((current) => [...current, {
        role: result.mode === 'gemini' ? 'AI Coach' : 'Setup notice',
        text: result.message,
      }]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-shell narrow-shell">
      <div className="section-header slim"><div><p className="eyebrow">StudentOS AI</p><h1>AI Coach</h1><p className="muted-text">Powered by Gemini. Chat requests use the Gemini model configured for your StudentOS server.</p></div></div>
      <section className="glass-card ai-chat">
        <div className="chat-history" aria-live="polite">
          {messages.length === 0 ? <p className="empty-state">Try asking: “Help me plan a focused study session for today.”</p> : messages.map((message, index) => (
            <article className={`chat-message ${message.role === 'you' ? 'from-user' : ''}`} key={`${message.role}-${index}`}><strong>{message.role}</strong><p>{message.text}</p></article>
          ))}
          {busy && <p className="muted-text">StudentOS AI is thinking…</p>}
        </div>
        <form className="ai-input-row" onSubmit={sendMessage}>
          <label className="sr-only" htmlFor="coach-question">Message AI Coach</label>
          <textarea id="coach-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask your study coach…" rows={2} />
          <button className="primary-button" type="submit" disabled={busy || !question.trim()}>Send</button>
        </form>
        {error && <p className="form-error" role="alert">{error}</p>}
      </section>
    </div>
  );
}
