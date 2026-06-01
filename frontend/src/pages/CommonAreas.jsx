import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import CompletionModal from '../components/CompletionModal';
import { formatDuration } from '../utils/time';

const BAR_COLORS = {
  pending:     '#CBD5E1',
  in_progress: '#2E86C1',
  done:        '#27AE60',
};

function areaIcon(area) {
  if (area.id === 1 || area.name.toLowerCase().includes('toilet') || area.name.toLowerCase().includes('wc')) return '🚽';
  if (area.id === 2 || area.name.toLowerCase().includes('treppe') || area.name.toLowerCase().includes('flur')) return '🪜';
  if (area.id === 3 || area.name.toLowerCase().includes('frühstück') || area.name.toLowerCase().includes('speise')) return '🍳';
  return '🏢';
}

function Label({ children }) {
  return <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1B4F72' }}>{children}</label>;
}

// Modal przypisania sprzątaczki — dostępny dla WSZYSTKICH obszarów (locked i unlocked)
function AssignModal({ area, cleaners, onClose, onSave, onReset }) {
  const [assignedTo, setAssigned] = useState(area.assigned_to ?? '');
  const [saving, setSaving]       = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError]         = useState('');
  const duration = formatDuration(area.started_at, area.finished_at);

  async function handleSave() {
    setSaving(true);
    try { await api.assignCommonArea(area.id, assignedTo || null); onSave(); }
    catch (e) { setError(e.message); setSaving(false); }
  }

  async function handleReset() {
    setResetting(true);
    try { await onReset(); }
    catch (e) { setError(e.message); setResetting(false); }
  }

  return (
    <Modal title={area.name} onClose={onClose}>
      <div className="space-y-4">
        {duration && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
            style={{ background: '#EBF5FB', color: '#1B4F72' }}>
            ⏱ Reinigungsdauer: <strong>{duration}</strong>
          </div>
        )}
        {area.completion_notes && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: '#F0E6CC', color: '#7D6608' }}>
            <span className="font-semibold">💬 Anmerkung:</span> {area.completion_notes}
          </div>
        )}

        {/* Zablokowane obszary: informacja że tylko nazwa jest zablokowana */}
        {area.locked && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{ background: '#F8F9FA', color: '#7F8C8D' }}>
            🔒 Standardbereich — Name und Löschen gesperrt
          </div>
        )}

        <div>
          <Label>Zimmermädchen zuweisen</Label>
          <select value={assignedTo} onChange={e => setAssigned(e.target.value)}
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base
                       focus:outline-none focus:border-[#2E86C1] bg-white">
            <option value="">— nicht zugewiesen —</option>
            {cleaners.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {error && <p className="text-[#C0392B] text-sm font-medium">{error}</p>}

        <div className="flex gap-2">
          {/* Zurücksetzen — gdy status=done (dla wszystkich obszarów) */}
          {area.status === 'done' && (
            <button onClick={handleReset} disabled={resetting}
              className="btn-ghost flex-1"
              style={{ color: '#E67E22', borderColor: '#E67E22' }}>
              {resetting ? 'Zurücksetzen...' : '↺ Zurücksetzen'}
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-ocean flex-1">
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AddAreaModal({ onClose, onSave }) {
  const [name, setName]     = useState('');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return setError('Bitte Namen eingeben');
    setSaving(true);
    try { await api.addCommonArea(name.trim()); onSave(); }
    catch (e) { setError(e.message); setSaving(false); }
  }

  return (
    <Modal title="Bereich hinzufügen" onClose={onClose}>
      <div>
        <Label>Name des Bereichs</Label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base
                     focus:outline-none focus:border-[#2E86C1]"
          placeholder="z.B. Rezeptionsbereich" autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); }} />
      </div>
      {error && <p className="text-[#C0392B] text-sm font-medium">{error}</p>}
      <button onClick={handleSave} disabled={saving} className="btn-ocean w-full">
        {saving ? 'Wird hinzugefügt...' : 'Hinzufügen'}
      </button>
    </Modal>
  );
}

export default function CommonAreas() {
  const { user } = useAuth();
  const isManager = user.role === 'manager';

  const [areas, setAreas]              = useState([]);
  const [cleaners, setClean]           = useState([]);
  const [selected, setSelect]          = useState(null);
  const [showAdd, setShowAdd]          = useState(false);
  const [loading, setLoading]          = useState(true);
  const [completionArea, setComplArea] = useState(null);

  const fetchAreas = useCallback(async () => {
    const data = await api.getCommonAreas();
    setAreas(data);
  }, []);

  useEffect(() => {
    setLoading(true);
    const p = [fetchAreas()];
    if (isManager) p.push(api.getCleaners().then(setClean));
    Promise.all(p).finally(() => setLoading(false));
  }, [fetchAreas, isManager]);

  async function handleStatusChange(area, status, completionNotes) {
    try { await api.setCommonAreaStatus(area.id, status, completionNotes); fetchAreas(); }
    catch (e) { alert(e.message); }
  }

  function handleFertigClick(area) { setComplArea(area); }

  async function handleCompletionConfirm(notes) {
    await handleStatusChange(completionArea, 'done', notes);
    setComplArea(null);
  }

  // Reset obszaru → pending, czyści notatki i czasy
  async function handleReset(area) {
    try { await api.resetCommonArea(area.id); fetchAreas(); setSelect(null); }
    catch (e) { alert(e.message); }
  }

  async function handleDelete(area) {
    // Zablokowane obszary nie mogą być usunięte (blokada po obu stronach)
    if (area.locked) return;
    if (!confirm(`"${area.name}" löschen?`)) return;
    try { await api.deleteCommonArea(area.id); fetchAreas(); }
    catch (e) { alert(e.message); }
  }

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
            + Bereich hinzufügen
          </button>
        </div>
      )}

      <div className="space-y-3">
        {areas.length === 0 && (
          <div className="card text-center py-12" style={{ color: '#7F8C8D' }}>
            <div className="text-4xl mb-2">🏢</div>
            <p>{isManager ? 'Keine Bereiche vorhanden.' : 'Keine zugewiesenen Aufgaben'}</p>
          </div>
        )}

        {areas.map(area => {
          const duration = isManager ? formatDuration(area.started_at, area.finished_at) : null;
          const icon = areaIcon(area);

          return (
            <div key={area.id} className="bg-white rounded-2xl overflow-hidden animate-in"
              style={{ boxShadow: '0 2px 12px rgba(27,79,114,0.08)' }}>
              <div className="flex">
                {/* Lewy pasek koloru wg statusu */}
                <div className="w-1.5 shrink-0"
                  style={{ background: BAR_COLORS[area.status] ?? '#CBD5E1' }} />

                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold truncate" style={{ color: '#2C3E50' }}>
                            {area.name}
                          </p>
                          {/* Ikona kłódki — tylko informacyjna, locked = tylko brak Delete */}
                          {area.locked && (
                            <span className="text-xs shrink-0" style={{ color: '#B0BEC5' }}>🔒</span>
                          )}
                        </div>
                        {area.assigned_name && (
                          <p className="text-sm mt-0.5" style={{ color: '#7F8C8D' }}>
                            👤 {area.assigned_name}
                          </p>
                        )}
                        {duration && (
                          <p className="text-xs mt-0.5 font-medium" style={{ color: '#7F8C8D' }}>
                            ⏱ {duration}
                          </p>
                        )}
                        {isManager && area.completion_notes && (
                          <p className="text-xs mt-0.5 italic" style={{ color: '#7D6608' }}>
                            💬 {area.completion_notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={area.status} />
                      {/* Przycisk Delete — TYLKO dla NIEzablokowanych obszarów (manager) */}
                      {isManager && !area.locked && (
                        <button onClick={() => handleDelete(area)}
                          className="w-7 h-7 flex items-center justify-center rounded-full
                                     hover:bg-red-50 transition-colors text-sm"
                          style={{ color: '#CBD5E1' }}>✕</button>
                      )}
                    </div>
                  </div>

                  {/* Przyciski akcji */}
                  <div className="flex gap-2 mt-3">
                    {isManager ? (
                      // Manager: "Zuweisen" dla WSZYSTKICH obszarów (locked i unlocked)
                      <button onClick={() => setSelect(area)} className="btn-ghost text-sm py-2">
                        {area.status === 'done' ? '↺ Zurücksetzen / Zuweisen' : 'Zuweisen'}
                      </button>
                    ) : (
                      // Sprzątaczka
                      <>
                        {area.status === 'pending' && (
                          <button onClick={() => handleStatusChange(area, 'in_progress')}
                            className="btn-ocean flex-1">▶ Beginnen</button>
                        )}
                        {area.status === 'in_progress' && (
                          <button onClick={() => handleFertigClick(area)}
                            className="btn-success flex-1">✓ Fertig</button>
                        )}
                        {area.status === 'done' && (
                          <div className="flex-1 text-center py-3 rounded-xl text-sm font-medium"
                            style={{ background: '#F0F4F8', color: '#7F8C8D' }}>
                            ✓ Erledigt
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal przypisania — dostępny dla WSZYSTKICH obszarów */}
      {selected && (
        <AssignModal
          area={selected}
          cleaners={cleaners}
          onClose={() => setSelect(null)}
          onSave={() => { setSelect(null); fetchAreas(); }}
          onReset={() => handleReset(selected)}
        />
      )}

      {showAdd && (
        <AddAreaModal onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); fetchAreas(); }} />
      )}

      {completionArea && (
        <CompletionModal
          title={completionArea.name}
          onConfirm={handleCompletionConfirm}
          onCancel={() => setComplArea(null)}
        />
      )}
    </>
  );
}
