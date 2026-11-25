import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'daylist.tasks.v1';
const sampleTasks = [
  { id: 'demo-1', text: 'Practice JavaScript array methods', completed: false },
  { id: 'demo-2', text: 'Build a React component', completed: false },
  { id: 'demo-3', text: 'Review today’s notes', completed: false },
  { id: 'demo-4', text: 'Plan the day', completed: true },
];
const filters = ['All', 'Active', 'Completed'];

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return sampleTasks;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.every(t => t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.completed === 'boolean')) return parsed;
  } catch { /* The app still works when storage is unavailable. */ }
  return sampleTasks;
}

function Icon({ name, size = 20 }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    edit: <><path d="m16 4 4 4M4 20l4.5-1L20 7.5a2.8 2.8 0 0 0-4-4L4.5 15 4 20Z" /></>,
    trash: <><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
    list: <><rect x="5" y="3" width="14" height="18" rx="3"/><path d="m8 9 1 1 2-2m2 1h3m-8 5 1 1 2-2m2 1h3"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    x: <path d="m6 6 12 12M18 6 6 18" />,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  const inputRef = useRef(null);
  const editRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [tasks]);
  useEffect(() => { if (editingId !== null) editRef.current?.focus(); }, [editingId]);

  const completed = tasks.filter(task => task.completed).length;
  const remaining = tasks.length - completed;
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const visible = tasks.filter(task => filter === 'All' || (filter === 'Completed' ? task.completed : !task.completed));
  const date = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  function addTask(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setTasks(previous => [{ id, text, completed: false }, ...previous]);
    setInput('');
    if (filter === 'Completed') setFilter('All');
    setNotice(`Added: ${text}`);
    inputRef.current?.focus();
  }
  function toggleTask(id) {
    setTasks(previous => previous.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  }
  function deleteTask(task) {
    setTasks(previous => previous.filter(item => item.id !== task.id));
    if (editingId === task.id) cancelEdit();
    setNotice(`Deleted: ${task.text}`);
  }
  function startEdit(task) { setEditingId(task.id); setEditText(task.text); }
  function cancelEdit() { setEditingId(null); setEditText(''); }
  function saveEdit(event) {
    event.preventDefault();
    const text = editText.trim();
    if (!text) return;
    setTasks(previous => previous.map(task => task.id === editingId ? { ...task, text } : task));
    cancelEdit();
    setNotice('Task updated.');
  }
  function changeFilter(value) { cancelEdit(); setFilter(value); }
  function clearCompleted() {
    if (tasks.some(task => task.id === editingId && task.completed)) cancelEdit();
    setTasks(previous => previous.filter(task => !task.completed));
    setNotice(`Cleared ${completed} completed ${completed === 1 ? 'task' : 'tasks'}.`);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="./" aria-label="Daily-list home"><span className="brand-icon"><Icon name="check" size={25}/></span>Daily-list<span className="brand-dot"></span></a>
        <span className="date"><Icon name="sun" size={18}/>{date}</span>
      </header>
      <section className="intro">
        <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
        <h1>Make today <span>count.</span></h1>
        <p>Organize your day, one little win at a time.</p>
      </section>
      <div className="dashboard">
        <aside className="overview" aria-label="Task overview">
          <div className="progress-card">
            <p className="progress-kicker">YOUR PROGRESS</p>
            <div className="progress-number">{progress}<span>%</span></div>
            <div className="progress-track" role="progressbar" aria-label="Tasks completed" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div style={{width: `${progress}%`}}/></div>
            <p>{completed} of {tasks.length} tasks completed</p>
          </div>
          <div className="stats-card">
            {[
              { label: 'Total tasks', count: tasks.length, icon: 'list', color: 'purple' },
              { label: 'In progress', count: remaining, icon: 'clock', color: 'amber' },
              { label: 'Completed', count: completed, icon: 'check', color: 'green' },
            ].map(stat => <div className="stat" key={stat.label}><span className={`stat-icon ${stat.color}`}><Icon name={stat.icon}/></span><span>{stat.label}</span><strong>{stat.count}</strong></div>)}
          </div>
          <p className="side-note">Small steps. Big results.</p>
        </aside>
        <section className="task-card" aria-labelledby="tasks-heading">
          <div className="card-heading"><div><h2 id="tasks-heading">My tasks</h2><p>What would you like to get done?</p></div><span className="count-pill">{remaining} left</span></div>
          <form className="add-form" onSubmit={addTask}>
            <label className="sr-only" htmlFor="new-task">New task</label>
            <input id="new-task" ref={inputRef} value={input} onChange={event => setInput(event.target.value)} placeholder="Add a new task..." maxLength={160} autoComplete="off" required/>
            <button className="primary-button" type="submit" disabled={!input.trim()}><Icon name="plus"/><span>Add task</span></button>
          </form>
          <div className="filter-bar" role="group" aria-label="Filter tasks">
            {filters.map(value => <button type="button" key={value} className={`filter-button ${filter === value ? 'selected' : ''}`} aria-pressed={filter === value} onClick={() => changeFilter(value)}>{value}</button>)}
          </div>
          {visible.length ? <ul className="task-list">
            {visible.map(task => <li key={task.id} className={`task-row ${task.completed ? 'done' : ''}`}>
              <label className="check-control" title={task.completed ? 'Mark active' : 'Mark completed'}><input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} aria-label={`Mark ${task.text} ${task.completed ? 'active' : 'completed'}`}/><span><Icon name="check" size={17}/></span></label>
              {editingId === task.id ? <form className="edit-form" onSubmit={saveEdit}>
                <input ref={editRef} aria-label="Edit task" maxLength={160} value={editText} onChange={event => setEditText(event.target.value)} onKeyDown={event => {if (event.key === 'Escape') cancelEdit();}} required/>
                <button className="icon-button save" title="Save edit" aria-label="Save edit" disabled={!editText.trim()}><Icon name="check" size={18}/></button>
                <button type="button" className="icon-button" title="Cancel edit" aria-label="Cancel edit" onClick={cancelEdit}><Icon name="x" size={18}/></button>
              </form> : <><span className="task-text">{task.text}</span><div className="task-actions"><button type="button" className="icon-button edit" title="Edit task" aria-label={`Edit ${task.text}`} onClick={() => startEdit(task)}><Icon name="edit" size={18}/></button><button type="button" className="icon-button delete" title="Delete task" aria-label={`Delete ${task.text}`} onClick={() => deleteTask(task)}><Icon name="trash" size={18}/></button></div></>}
            </li>)}
          </ul> : <div className="empty"><span className="empty-icon"><Icon name={filter === 'Completed' ? 'check' : 'list'} size={28}/></span><h3>{filter === 'Completed' ? 'No completed tasks yet' : filter === 'Active' ? 'You’re all caught up!' : 'Your list is empty'}</h3><p>{filter === 'Completed' ? 'Finish a task to see it here.' : 'Add a task above to get started.'}</p></div>}
          <footer className="card-footer"><span>{visible.length} {visible.length === 1 ? 'task' : 'tasks'} shown</span><button type="button" className="clear-button" onClick={clearCompleted} disabled={!completed}>Clear completed</button></footer>
          {storageError && <p className="warning" role="status">Local storage is unavailable. Changes may not survive a refresh.</p>}
          <p className="sr-only" role="status">{notice}</p>
        </section>
      </div>
      <footer className="page-footer">A little better every day. <span>✦</span></footer>
    </main>
  );
}
