import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

function AssignModal({ area, cleaners, onClose, onSave }) {
  const [assignedTo, setAssignedTo] = useState(area.assigned_to ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    try {
      await api.assignCommonArea(area.id, assignedTo || null);
      onSave();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  async function handleVerify() {
    setSaving(true);
    try {
      await api.setCommonAreaStatus(area.id, 'verified');
      onSave();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={area.name} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Przypisz sprzątaczkę</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— nieprzypisana —</option>
            {cleaners.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          {area.status === 'done' && (
            <button onClick={handleVerify} disabled={saving} className="btn-success flex-1">
              Zatwierdź ✓
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Zapisuję...' : 'Zapisz'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AddAreaModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return setError('Wpisz nazwę');
    setSaving(true);
    try {
      await api.addCommonArea(name.trim());
      onSave();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <Modal title="Dodaj część wspólną" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nazwa</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="np. Recepcja"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? 'Dodaję...' : 'Dodaj'}
        </button>
      </div>
    </Modal>
  );
}

export default function CommonAreas() {
  const { user } = useAuth();
  const isManager = user.role === 'manager';

  const [areas, setAreas] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAreas = useCallback(async () => {
    const data = await api.getCommonAreas();
    setAreas(data);
  }, []);

  useEffect(() => {
    setLoading(true);
    const promises = [fetchAreas()];
    if (isManager) promises.push(api.getCleaners().then(setCleaners));
    Promise.all(promises).finally(() => setLoading(false));
  }, [fetchAreas, isManager]);

  async function handleStatusChange(area, status) {
    try {
      await api.setCommonAreaStatus(area.id, status);
      fetchAreas();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDelete(area) {
    if (!confirm(`Usunąć "${area.name}"?`)) return;
    try {
      await api.deleteCommonArea(area.id);
      fetchAreas();
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
            + Dodaj
          </button>
        </div>
      )}

      <div className="space-y-3">
        {areas.length === 0 && (
          <div className="card text-center text-slate-400">
            {isManager ? 'Brak części wspólnych. Dodaj pierwszą.' : 'Nie masz przypisanych zadań'}
          </div>
        )}

        {areas.map((area) => (
          <div key={area.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{area.name}</p>
                {area.assigned_name && (
                  <p className="text-sm text-slate-400">{area.assigned_name}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={area.status} />
                {isManager && (
                  <button
                    onClick={() => handleDelete(area)}
                    className="text-slate-300 hover:text-red-400 text-sm p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              {isManager ? (
                <button onClick={() => setSelected(area)} className="btn-ghost text-sm">
                  Przypisz / Zatwierdź
                </button>
              ) : (
                <>
                  {area.status === 'pending' && (
                    <button onClick={() => handleStatusChange(area, 'in_progress')} className="btn-primary flex-1">
                      Zaczynam
                    </button>
                  )}
                  {area.status === 'in_progress' && (
                    <button onClick={() => handleStatusChange(area, 'done')} className="btn-success flex-1">
                      Gotowe ✓
                    </button>
                  )}
                  {(area.status === 'done' || area.status === 'verified') && (
                    <div className="flex-1 text-center text-sm text-slate-400 py-2">
                      {area.status === 'verified' ? 'Zatwierdzone' : 'Czeka na weryfikację'}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <AssignModal
          area={selected}
          cleaners={cleaners}
          onClose={() => setSelected(null)}
          onSave={() => { setSelected(null); fetchAreas(); }}
        />
      )}

      {showAdd && (
        <AddAreaModal
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); fetchAreas(); }}
        />
      )}
    </>
  );
}
