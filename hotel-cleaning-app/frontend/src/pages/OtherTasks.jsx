import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

function AddTaskModal({ cleaners, onClose, onSave }) {
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!description.trim()) return setError('Opis jest wymagany');
    setSaving(true);
    try {
      await api.addTask(description.trim(), assignedTo || null);
      onSave();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <Modal title="Nowe zadanie" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Opis zadania *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            rows={3}
            placeholder="Opisz zadanie..."
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Przypisz do</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— nieprzypisane —</option>
            {cleaners.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? 'Dodaję...' : 'Dodaj zadanie'}
        </button>
      </div>
    </Modal>
  );
}

export default function OtherTasks() {
  const { user } = useAuth();
  const isManager = user.role === 'manager';

  const [tasks, setTasks] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const data = await api.getTasks();
    setTasks(data);
  }, []);

  useEffect(() => {
    setLoading(true);
    const promises = [fetchTasks()];
    if (isManager) promises.push(api.getCleaners().then(setCleaners));
    Promise.all(promises).finally(() => setLoading(false));
  }, [fetchTasks, isManager]);

  async function handleStatusChange(task, status) {
    try {
      await api.setTaskStatus(task.id, status);
      fetchTasks();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDelete(task) {
    if (!confirm('Usunąć to zadanie?')) return;
    try {
      await api.deleteTask(task.id);
      fetchTasks();
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-slate-400">Ładowanie...</div>;
  }

  return (
    <>
      {isManager && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            + Nowe zadanie
          </button>
        </div>
      )}

      <div className="space-y-3">
        {tasks.length === 0 && (
          <div className="card text-center text-slate-400">
            {isManager ? 'Brak zadań. Dodaj pierwsze.' : 'Nie masz przypisanych zadań'}
          </div>
        )}

        {tasks.map((task) => (
          <div key={task.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{task.description}</p>
                {task.assigned_name && (
                  <p className="text-sm text-slate-400 mt-0.5">{task.assigned_name}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={task.status} />
                {isManager && (
                  <button
                    onClick={() => handleDelete(task)}
                    className="text-slate-300 hover:text-red-400 text-sm p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              {task.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(task, 'in_progress')}
                  className="btn-primary flex-1"
                >
                  Zaczynam
                </button>
              )}
              {task.status === 'in_progress' && (
                <button
                  onClick={() => handleStatusChange(task, 'done')}
                  className="btn-success flex-1"
                >
                  Gotowe ✓
                </button>
              )}
              {task.status === 'done' && (
                <div className="flex-1 text-center text-sm text-slate-400 py-2">Wykonane</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <AddTaskModal
          cleaners={cleaners}
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); fetchTasks(); }}
        />
      )}
    </>
  );
}
