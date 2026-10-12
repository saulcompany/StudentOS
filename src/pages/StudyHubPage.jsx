import { useState } from 'react';
import { BookOpen, Download, FileText, GraduationCap, Paperclip, Sparkles, UploadCloud } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { requestAI } from '../services/aiClient';
import { extractNoteText } from '../services/noteFileReader';
import {
  createStudyNoteDownloadUrl,
  removeStudyNoteFile,
  uploadStudyNote,
} from '../services/supabaseClient';

const recommendedSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English'];
const sections = [
  { id: 'subjects', label: 'Subjects', icon: GraduationCap },
  { id: 'assignments', label: 'Assignments', icon: FileText },
  { id: 'notes', label: 'Notes', icon: BookOpen },
  { id: 'ai', label: 'AI study assistant', icon: Sparkles },
];

function NoteFileDownloadButton({ storagePath }) {
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const prepareDownload = async () => {
    setBusy(true);
    setError('');
    try {
      setDownloadUrl(await createStudyNoteDownloadUrl(storagePath));
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setBusy(false);
    }
  };

  if (downloadUrl) {
    return <a className="ghost-button small" href={downloadUrl} target="_blank" rel="noreferrer"><Download size={14} /> Open file</a>;
  }

  return (
    <span className="note-download-control">
      <button type="button" className="ghost-button small" disabled={busy} onClick={prepareDownload}>
        <Download size={14} />{busy ? 'Preparing…' : 'Open file'}
      </button>
      {error && <small className="form-error" role="alert">{error}</small>}
    </span>
  );
}

export default function StudyHubPage() {
  const {
    subjectList, addSubject, updateSubject, removeSubject,
    assignments, notes, addRecord, updateRecord, removeRecord, user,
  } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = sections.some(({ id }) => id === searchParams.get('section'))
    ? searchParams.get('section')
    : 'subjects';
  const [aiInput, setAiInput] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiMode, setAiMode] = useState('');
  const [aiAction, setAiAction] = useState('assignment');
  const [aiSubject, setAiSubject] = useState('');
  const [aiError, setAiError] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [assignmentSubject, setAssignmentSubject] = useState('');
  const [uploadedNoteName, setUploadedNoteName] = useState('');
  const [noteUploadError, setNoteUploadError] = useState('');
  const [selectedNoteFile, setSelectedNoteFile] = useState(null);
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [isNoteDragging, setIsNoteDragging] = useState(false);

  const handleAddAssignment = (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    addRecord('assignments', values);
    event.currentTarget.reset();
  };

  const handleAddNote = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const selectedFile = selectedNoteFile;
    setNoteUploadError('');
    setIsNoteSaving(true);

    try {
      const fileContent = selectedFile ? await extractNoteText(selectedFile) : '';
      const fileName = selectedFile?.name || '';
      const title = (formData.get('title')?.toString() || '').trim()
        || (fileName ? fileName.replace(/\.[^.]+$/, '') : '');
      const subject = formData.get('subject')?.toString().trim() || '';
      const content = (formData.get('content')?.toString() || '').trim() || fileContent;

      if (!content) {
        setNoteUploadError('Add note content or upload a readable note file.');
        return;
      }

      const attachmentPath = selectedFile
        ? await uploadStudyNote(user.id, selectedFile)
        : '';

      addRecord('notes', {
        title: title || 'Untitled note',
        subject,
        content,
        ...(fileName ? { attachmentName: fileName } : {}),
        ...(selectedFile ? { attachmentType: selectedFile.type || 'application/octet-stream' } : {}),
        ...(attachmentPath ? { attachmentPath } : {}),
      });

      form.reset();
      setUploadedNoteName('');
      setSelectedNoteFile(null);
    } catch (error) {
      setNoteUploadError(error.message || 'Could not read the uploaded note file.');
    } finally {
      setIsNoteSaving(false);
    }
  };

  const handleDeleteNote = async (note) => {
    try {
      if (note.attachmentPath) await removeStudyNoteFile(note.attachmentPath);
      removeRecord('notes', note.id);
    } catch (error) {
      setNoteUploadError(error.message);
    }
  };

  const generateAssignment = async (event) => {
    event.preventDefault();
    const topic = aiInput.trim();
    if (!topic || aiBusy) return;
    setAiBusy(true);
    setAiError('');
    setAiResult('');
    setAiAction('assignment');
    try {
      const result = await requestAI('assignment', `Create a clear assignment brief with a title, learning objectives, suggested sections, and a reasonable checklist. Topic: ${topic}`, {
        student: user,
        subjects: subjectList.map((subject) => subject.name),
        selectedSubject: assignmentSubject,
      });
      setAiResult(result.message);
      setAiMode(result.mode);
    } catch (error) {
      setAiError(error.message);
    } finally {
      setAiBusy(false);
    }
  };

  const summarizeNote = async (note) => {
    setAiBusy(true);
    setAiError('');
    setAiResult('');
    setAiAction('summary');
    try {
      const result = await requestAI('summary', 'Summarize these study notes into a concise revision guide. Keep important facts, definitions, and formulas.', {
        subject: note.subject,
        title: note.title,
        content: note.content,
      });
      setAiResult(result.message);
      setAiMode(result.mode);
      setAiInput(note.title);
      setAiSubject(note.subject);
      setSearchParams({ section: 'ai' });
    } catch (error) {
      setAiError(error.message);
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="page-shell study-hub-page">
      <section className="study-hub-hero">
        <div className="study-hub-hero-icon"><GraduationCap size={24} /></div>
        <div>
          <p className="eyebrow">Your academic workspace</p>
          <h1>Study Hub</h1>
          <p className="muted-text">Keep subjects, assignments, and revision notes together.</p>
        </div>
        <div className="study-hub-counts">
          <div><strong>{subjectList.length}</strong><span>Subjects</span></div>
          <div><strong>{assignments.length}</strong><span>Assignments</span></div>
          <div><strong>{notes.length}</strong><span>Notes</span></div>
        </div>
      </section>

      <nav className="study-hub-tabs" aria-label="Study Hub sections">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`study-hub-tab ${activeSection === id ? 'active' : ''}`}
            aria-current={activeSection === id ? 'page' : undefined}
            onClick={() => setSearchParams({ section: id })}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      {activeSection === 'subjects' && (
        <section className="study-section">
          <div className="study-section-heading">
            <div><h2>My subjects</h2><p className="muted-text">Track the subjects you are studying this term.</p></div>
          </div>
          <article className="glass-card subject-add-panel">
            <div>
              <h3>Add a subject</h3>
              <p className="muted-text">Choose a common subject or enter your own.</p>
            </div>
            <form className="add-subject-form" onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const name = new FormData(form).get('subject')?.toString().trim();
              if (name) {
                addSubject(name);
                form.reset();
              }
            }}>
              <label className="sr-only" htmlFor="custom-subject">Your subject</label>
              <input id="custom-subject" name="subject" placeholder="e.g. Economics" />
              <button type="submit" className="primary-button">Add subject</button>
            </form>
            <div className="recommendation-list">
              {recommendedSubjects.map((name) => {
                const exists = subjectList.some((subject) => subject.name.toLowerCase() === name.toLowerCase());
                return <button key={name} type="button" className="chip-button" disabled={exists} onClick={() => addSubject(name)}>{exists ? '✓ ' : '+ '}{name}</button>;
              })}
            </div>
          </article>
          {subjectList.length === 0 ? (
            <div className="study-empty"><GraduationCap size={27} /><h3>Your subjects will appear here</h3><p>Add a subject above to start tracking your progress.</p></div>
          ) : (
            <div className="study-card-grid">
              {subjectList.map((subject) => (
                <article key={subject.name} className="glass-card subject-card">
                  <div className="subject-header"><h3>{subject.name}</h3><span className="subject-progress-label">{subject.progress}%</span></div>
                  <div className="progress-bar"><span style={{ width: `${subject.progress}%` }} /></div>
                  <p className="muted-text">{subject.completedTopics} of {subject.totalTopics} topics completed</p>
                  <div className="subject-card-actions">
                    <button type="button" className="ghost-button small" onClick={() => {
                      const totalTopics = subject.totalTopics + 1;
                      const completedTopics = subject.completedTopics + 1;
                      updateSubject(subject.name, { totalTopics, completedTopics, progress: Math.round((completedTopics / totalTopics) * 100) });
                    }}>Log completed topic</button>
                    <button type="button" className="text-button" onClick={() => removeSubject(subject.name)}>Remove</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeSection === 'assignments' && (
        <section className="study-section">
          <div className="study-section-heading"><div><h2>Assignments</h2><p className="muted-text">Record deadlines, track progress, and complete work.</p></div></div>
          <form className="glass-card study-entry-form" onSubmit={handleAddAssignment}>
            <label>Assignment title<input name="title" required placeholder="e.g. Research paper" /></label>
            <label>Subject<select name="subject" defaultValue=""><option value="">Select subject</option>{subjectList.map((subject) => <option key={subject.name}>{subject.name}</option>)}</select></label>
            <label>Due date<input type="date" name="dueDate" /></label>
            <label className="study-form-wide">Instructions or details<textarea name="description" rows="3" placeholder="What needs to be done?" /></label>
            <button type="submit" className="primary-button">Add assignment</button>
          </form>
          {assignments.length === 0 ? (
            <div className="study-empty"><FileText size={27} /><h3>No assignments yet</h3><p>Add an assignment above, or draft one with the AI study assistant.</p><button className="ghost-button" type="button" onClick={() => setSearchParams({ section: 'ai' })}>Open AI assistant</button></div>
          ) : (
            <div className="study-item-list">
              {assignments.map((assignment) => (
                <article className={`glass-card study-item ${assignment.completed ? 'is-complete' : ''}`} key={assignment.id}>
                  <div className="study-item-mark"><FileText size={19} /></div>
                  <div className="study-item-content"><div className="study-item-title"><h3>{assignment.title}</h3>{assignment.completed && <span className="status-tag">Completed</span>}</div><p className="muted-text">{assignment.subject || 'No subject'}{assignment.dueDate ? ` · Due ${assignment.dueDate}` : ''}</p>{assignment.description && <p className="study-item-description">{assignment.description}</p>}</div>
                  <div className="collection-actions"><button type="button" className="ghost-button small" onClick={() => updateRecord('assignments', assignment.id, { completed: !assignment.completed })}>{assignment.completed ? 'Reopen' : 'Complete'}</button><button type="button" className="text-button" onClick={() => removeRecord('assignments', assignment.id)}>Delete</button></div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeSection === 'notes' && (
        <section className="study-section">
          <div className="study-section-heading"><div><h2>Study notes</h2><p className="muted-text">Capture key ideas and turn them into revision material.</p></div></div>
          <form className="glass-card study-entry-form" onSubmit={handleAddNote}>
            <label>Note title<input name="title" placeholder="e.g. Cell biology — key concepts" /></label>
            <label>Subject<select name="subject" defaultValue=""><option value="">General</option>{subjectList.map((subject) => <option key={subject.name}>{subject.name}</option>)}</select></label>
            <label className="study-form-wide">Note content<textarea name="content" rows="5" placeholder="Write or paste your notes here..." /></label>
            <label
              className={`study-form-wide note-upload-dropzone ${isNoteDragging ? 'is-dragging' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsNoteDragging(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setIsNoteDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsNoteDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) {
                  setSelectedNoteFile(file);
                  setUploadedNoteName(file.name);
                  setNoteUploadError('');
                }
              }}
            >
              <UploadCloud size={24} />
              <span>{isNoteDragging ? 'Drop your note file here' : 'Drag and drop a note file, or browse'}</span>
              <small>PDF, DOCX, TXT, Markdown, CSV or JSON · up to 10 MB</small>
              <input type="file" name="attachment" accept=".txt,.md,.csv,.json,.log,.pdf,.docx" onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setSelectedNoteFile(file);
                setUploadedNoteName(file?.name || '');
                setNoteUploadError('');
              }} />
              {uploadedNoteName && <span className="upload-file-name"><Paperclip size={14} />{uploadedNoteName}</span>}
            </label>
            {noteUploadError && <p className="form-error study-form-wide" role="alert">{noteUploadError}</p>}
            <button type="submit" className="primary-button" disabled={isNoteSaving}>{isNoteSaving ? 'Uploading and saving…' : 'Save note'}</button>
          </form>
          {notes.length === 0 ? (
            <div className="study-empty"><BookOpen size={27} /><h3>Your notes will appear here</h3><p>Add a note, then use AI to create a concise revision summary.</p></div>
          ) : (
            <div className="study-card-grid notes-grid">
              {notes.map((note) => (
                <article className="glass-card note-card" key={note.id}>
                  <div className="note-card-heading"><div className="study-item-mark"><BookOpen size={18} /></div><span className="note-subject">{note.subject || 'General'}</span></div>
                  <h3>{note.title}</h3>
                  {note.attachmentName && (
                    <div className="note-attachment"><Paperclip size={14} /><span>{note.attachmentName}</span></div>
                  )}
                  <p className="note-preview">{note.content}</p>
                  <div className="collection-actions">
                    <button type="button" className="ghost-button small" disabled={aiBusy} onClick={() => summarizeNote(note)}>Summarize with AI</button>
                    {note.attachmentPath && <NoteFileDownloadButton storagePath={note.attachmentPath} />}
                    <button type="button" className="text-button" onClick={() => handleDeleteNote(note)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeSection === 'ai' && (
        <section className="study-section">
          <div className="study-section-heading"><div><h2>AI study assistant</h2><p className="muted-text">Create an assignment brief or summarize a note using your study context.</p></div></div>
          <article className="glass-card study-ai-panel">
            <div className="ai-panel-heading"><span className="ai-panel-icon"><Sparkles size={21} /></span><div><h3>Assignment brief generator</h3><p className="muted-text">Describe a topic and get a structured starting point.</p></div></div>
            <form className="study-entry-form" onSubmit={generateAssignment}>
              <label>Topic or assignment idea<input value={aiInput} onChange={(event) => setAiInput(event.target.value)} placeholder="e.g. Compare sorting algorithms" required /></label>
              <label>Subject<select value={assignmentSubject} onChange={(event) => setAssignmentSubject(event.target.value)}><option value="">Choose subject (optional)</option>{subjectList.map((subject) => <option key={subject.name}>{subject.name}</option>)}</select></label>
              <button type="submit" className="primary-button" disabled={aiBusy}>{aiBusy ? 'Working…' : 'Generate with AI'}</button>
            </form>
            {aiError && <p className="form-error" role="alert">{aiError}</p>}
            {aiResult && (
              <div className="ai-result">
                <span className="ai-tag">{aiMode === 'gemini' ? 'Gemini AI response' : 'AI setup notice'}</span>
                <p className="ai-response">{aiResult}</p>
                {aiMode === 'gemini' && <button type="button" className="ghost-button small" onClick={() => {
                  if (aiAction === 'summary') {
                    addRecord('notes', { title: `${aiInput} — Summary`, subject: aiSubject, content: aiResult });
                    setSearchParams({ section: 'notes' });
                  } else {
                    addRecord('assignments', { title: aiInput, subject: assignmentSubject, description: aiResult, dueDate: '', completed: false });
                    setSearchParams({ section: 'assignments' });
                  }
                }}>{aiAction === 'summary' ? 'Save summary as note' : 'Save as assignment'}</button>}
              </div>
            )}
            <p className="ai-setup-hint">AI summaries use Gemini through the StudentOS server.</p>
          </article>
          <div className="study-ai-shortcuts">
            <button type="button" className="glass-card ai-shortcut" onClick={() => setSearchParams({ section: 'notes' })}><BookOpen size={19} /><span><strong>Summarize saved notes</strong><small>Open a note and choose “Summarize with AI”.</small></span></button>
            <button type="button" className="glass-card ai-shortcut" onClick={() => setSearchParams({ section: 'assignments' })}><FileText size={19} /><span><strong>Manage assignments</strong><small>Keep subjects, due dates, and briefs together.</small></span></button>
          </div>
        </section>
      )}
    </div>
  );
}
