import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import CompletionModal from '../components/CompletionModal';
import ConfirmModal from '../components/ConfirmModal';
import { formatDuration } from '../utils/time';

function Label({ children }) {
  return <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1B4F72' }}>{children}</label>;
}

function TaskCheckbox({ status }) {
  const cfg = {
    pending:     { bg: '#fff',    border: '#CBD5E1', icon: '',  iconColor: '#fff' },
    in_progress: { bg: '#EBF5FB', border: '#2E86C1', icon: '◐', iconColor: '#2E86C1' },
    done:        { bg: '#27AE60', border: '#27AE60', icon: '✓', iconColor: '#fff' },
    verified:    { bg: '#7D3C98', border: '#7D3C98', icon: '✓', iconColor: '#fff' },
  }[status] ?? { bg: '#fff', border: '#CBD5E1', icon: '', iconColor: '#fff' };

  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0
                    text-base font-bold transition-all duration-300"
      style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, color: cfg.iconColor }}>
      {cfg.icon}
    </div>
  );
}

function AddTaskModal({ cleaners, onClose, onSave }) {
  const [description, setDesc]    = useState('');
  const [assignedTo, setAssigned] = useState('');
  const [error, setError]         = useState('');
  const [saving, setSaving]       = useState(false);

  async function handleSave() {
    if (!description.trim()) return setError('Beschreibung ist erforderlich');
    setSaving(true);
    try { await api.addTask(description.trim(), assignedTo || null); onSave(); }
    catch (e) { setError(e.message); setSaving(false); }
  }

  return (
    <Modal title="Neue Aufgabe" onClose={onClose}>
      <div>
        <Label>Beschreibung *</Label>
        <textarea value={description} onChange={e => setDesc(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base
                     focus:outline-none focus:border-[#2E86C1] resize-none" rows={3}
          placeholder="Aufgabe beschreiben..." autoFocus />
      </div>
      <div>
        <Label>Zuweisen an</Label>
        <select value={assignedTo} onChange={e => setAssigned(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base
                     focus:outline-none focus:border-[#2E86C1] bg-white">
          <option value="">— nicht zugewiesen —</option>
          {cleaners.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: '#FDEDEC', color: '#C0392B' }}>{error}</div>
      )}
      <button onClick={handleSave} disabled={saving} className="btn-ocean w-full">
        {saving ? 'Wird hinzugefügt...' : 'Aufgabe hinzufügen'}
      </button>
    </Modal>
  );
}

export default function OtherTasks() {
  const { user } = useAuth();
  const isManager = user.role === 'manager';

  const [tasks, setTasks]           = useState([]);
  const [cleaners, setClean]        = useState([]);
  const [showAdd, setShowAdd]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [completionTask, setComplT] = useState(null);  // task czekający na modal "Fertig"
  const [deleteTask, setDeleteTask] = useState(null);  // task czekający na potwierdzenie usunięcia
  const [deleting, setDeleting]     = useState(false);

  const fetchTasks = useCallback(async () => {
    const data = await api.getTasks();
    setTasks(data);
  }, []);

  useEffect(() => {
    setLoading(true);
    const p = [fetchTasks()];
    if (isManager) p.push(api.getCleaners().then(setClean));
    Promise.all(p).finally(() => setLoading(false));
  }, [fetchTasks, isManager]);

  async function handleStatusChange(task, status, completionNotes) {
    try { await api.setTaskStatus(task.id, status, completionNotes); fetchTasks(); }
    catch (e) { alert(e.message); }
  }

  function handleFertigClick(task) { setComplT(task); }

  async function handleCompletionConfirm(notes) {
    await handleStatusChange(completionTask, 'done', notes);
    setComplT(null);
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try { await api.deleteTask(deleteTask.id); fetchTasks(); setDeleteTask(null); }
    catch (e) { alert(e.message); }
    finally { setDeleting(false); }
  }

  // Sprzątaczka nie widzi zadań "verified"
  const visibleTasks = isManager
    ? tasks
    : tasks.filter(t => t.status !== 'verified');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 rounded-full animate-spin"
          style={{ border: '3px solid #2E86C1', borderTopColor: 'transparent' }} />
        <p style={{ color: '#7F8C8D' }}>Wird geladen...</p>
      </div>
    );
  }

  return (
    <>
      {isManager && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowAdd(true)} className="btn-ocean py-2 px-4 text-sm">
            + Neue Aufgabe
          </button>
        </div>
      )}

      <div className="space-y-3">
        {visibleTasks.length === 0 && (
          <div className="card text-center py-12" style={{ color: '#7F8C8D' }}>
            <div className="text-4xl mb-2">📋</div>
            <p>{isManager ? 'Keine Aufgaben. Erste Aufgabe hinzufügen.' : 'Keine zugewiesenen Aufgaben'}</p>
          </div>
        )}

        {visibleTasks.map(task => {
          const duration = isManager ? formatDuration(task.started_at, task.finished_at) : null;
          const isDone = task.status === 'done' || task.status === 'verified';
          return (
            <div key={task.id} className="bg-white rounded-2xl overflow-hidden animate-in"
              style={{
                boxShadow: '0 2px 12px rgba(27,79,114,0.08)',
                opacity: task.status === 'verified' ? 0.85 : 1,
              }}>
              <div className="flex items-start gap-3 p-4">
                <TaskCheckbox status={task.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base leading-tight"
                        style={{
                          color: '#2C3E50',
                          textDecoration: task.status === 'verified' ? 'line-through' : 'none',
                        }}>
                        {task.description}
                      </p>
                      {task.assigned_name && (
                        <p className="text-sm mt-0.5" style={{ color: '#7F8C8D' }}>
                          👤 {task.assigned_name}
                        </p>
                      )}
                      {duration && (
                        <p className="text-xs mt-0.5 font-medium" style={{ color: '#7F8C8D' }}>
                          ⏱ {duration}
                        </p>
                      )}
                      {/* Uwagi sprzątaczki — widoczne dla managera */}
                      {isManager && task.completion_notes && (
                        <p className="text-xs mt-1 italic" style={{ color: '#7D6608' }}>
                          💬 {task.completion_notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge status={task.status} />
                      {/* Przycisk Löschen dla managera */}
                      {isManager && (
                        <button onClick={() => setDeleteTask(task)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs
                                     font-medium transition-colors hover:bg-red-50"
                          style={{ color: '#C0392B' }}>
                          🗑 Löschen
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Akcje */}
                  <div className="mt-3">
                    {!isManager && (
                      <>
                        {task.status === 'pending' && (
                          <button onClick={() => handleStatusChange(task, 'in_progress')}
                            className="btn-ocean w-full">▶ Beginnen</button>
                        )}
                        {task.status === 'in_progress' && (
                          <button onClick={() => handleFertigClick(task)}
                            className="btn-success w-full">✓ Fertig</button>
                        )}
                        {task.status === 'done' && (
                          <div className="text-center py-2 rounded-xl text-sm font-medium"
                            style={{ background: '#F0F4F8', color: '#7F8C8D' }}>
                            ⏳ Wartet auf Bestätigung
                          </div>
                        )}
                      </>
                    )}
                    {isManager && task.status === 'done' && (
                      <button onClick={() => handleStatusChange(task, 'verified')}
                        className="btn-success w-full">
                        Bestätigen ✓
                      </button>
                    )}
                    {isManager && task.status !== 'done' && (
                      <div className="text-sm py-1 font-medium" style={{ color: '#B0BEC5' }}>
                        {task.status === 'pending'     && 'Noch nicht begonnen'}
                        {task.status === 'in_progress' && '⏳ In Bearbeitung'}
                        {task.status === 'verified'    && '✓ Bestätigt'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <AddTaskModal cleaners={cleaners}
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); fetchTasks(); }} />
      )}

      {completionTask && (
        <CompletionModal
          title={completionTask.description}
          onConfirm={handleCompletionConfirm}
          onCancel={() => setComplT(null)}
        />
      )}

      {deleteTask && (
        <ConfirmModal
          message={`"${deleteTask.description}" wirklich löschen?`}
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTask(null)}
        />
      )}
    </>
  );
}
