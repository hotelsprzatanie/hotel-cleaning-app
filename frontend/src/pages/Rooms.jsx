import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import CompletionModal from '../components/CompletionModal';
import { formatDuration } from '../utils/time';

// ── Opcje serwisowe ─────────────────────────────────────────────
const SERVICE_OPTIONS = [
  { key: 'cleaned', icon: '🧹', label: 'Zimmer gereinigt' },
  { key: 'sweet',   icon: '🍬', label: 'Süßigkeitenbeutel' },
  { key: 'dnd',     icon: '🚫', label: 'Bitte nicht stören' },
];

function parseCompletion(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return { notes: raw }; }
}

function ServiceBadges({ raw }) {
  const data = parseCompletion(raw);
  if (!data) return null;
  const opts = data.options || [];
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {SERVICE_OPTIONS.filter(o => opts.includes(o.key)).map(o => (
        <span key={o.key} className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-lg font-medium"
          style={{ background: 'rgba(230,126,34,0.12)', color: '#C05000' }}>
          {o.icon} {o.label}
        </span>
      ))}
      {data.notes && (
        <span className="text-xs italic" style={{ color: '#7D6608' }}>💬 {data.notes}</span>
      )}
    </div>
  );
}

// ── Modal serwisowy (checkboxy) ─────────────────────────────────
function ServiceCompletionModal({ room, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(null);
  const [notes, setNotes]       = useState('');

  function handleConfirm() {
    const payload = JSON.stringify({ options: selected ? [selected] : [], notes: notes.trim() || undefined });
    onConfirm(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-sm rounded-3xl p-6 space-y-4"
        style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: '#7F8C8D' }}>
            Zimmer {room.number} · Service
          </p>
          <h2 className="text-xl font-bold" style={{ color: '#1B4F72' }}>Was wurde gemacht?</h2>
        </div>

        <div className="space-y-2">
          {SERVICE_OPTIONS.map(opt => {
            const active = selected === opt.key;
            return (
              <button key={opt.key} onClick={() => setSelected(opt.key)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left active:scale-[0.98]"
                style={active
                  ? { background: '#1B4F72', borderColor: '#1B4F72', color: '#fff' }
                  : { background: '#F8FAFB', borderColor: '#E2E8F0', color: '#5D6D7E' }}>
                <span className="text-2xl">{opt.icon}</span>
                <span className="font-semibold text-sm flex-1">{opt.label}</span>
                <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={active
                    ? { background: '#fff', borderColor: '#fff' }
                    : { borderColor: '#CBD5E1' }}>
                  {active && <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#1B4F72' }} />}
                </span>
              </button>
            );
          })}
        </div>

        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base
                     focus:outline-none focus:border-[#2E86C1] resize-none"
          rows={2} placeholder="Zusätzliche Anmerkungen (optional)" />

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-semibold border-2 text-sm"
            style={{ borderColor: '#E2E8F0', color: '#7F8C8D' }}>
            Abbrechen
          </button>
          <button onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white"
            style={{ background: '#1E8449' }}>
            Abschließen ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Kolory typów ────────────────────────────────────────────────
// cardBg  — tło całej karty sprzątaczki (jasne odcienie)
// text    — kolor tekstu głównego na kartach sprzątaczki
// subtext — kolor tekstu pomocniczego
// label   — kolor etykiety typu (kafelki managera i karty sprzątaczki)
// tileBg/border — kafelki managera
const TYPE_COLORS = {
  checkout: {
    border:  '#E74C3C',
    tileBg:  '#FDEDEC',
    cardBg:  '#FFEBEE',   // jasny różowo-czerwony
    text:    '#C62828',   // ciemnoczerwony tekst
    subtext: '#E57373',
    label:   '#E74C3C',
  },
  service: {
    border:  '#E67E22',
    tileBg:  '#FEF5E7',
    cardBg:  '#FFF3E0',   // jasny pomarańczowy
    text:    '#E65100',   // ciemnopomarańczowy tekst
    subtext: '#FF8A65',
    label:   '#E67E22',
  },
  none: {
    border:  '#CBD5E1',
    tileBg:  '#F8FAFB',
    cardBg:  '#F5F5F5',   // jasny szary
    text:    '#424242',   // ciemnoszary
    subtext: '#757575',
    label:   '#7F8C8D',
  },
};

// Kolejność sortowania typów w widoku sprzątaczki: Service → Abreise → Kein Auftrag
const TYPE_ORDER = { service: 0, checkout: 1, none: 2 };

// Kolory wg statusu (kafelki managera gdy in_progress/done/verified)
const STATUS_TILE = {
  in_progress: { bg: '#EBF5FB', border: '#2E86C1' },
  done:        { bg: '#EAFAF1', border: '#27AE60' },
  verified:    { bg: '#F5EEF8', border: '#7D3C98' },
};

// Etykiety typów — zmiana Auschecken → Abreise
const TYPE_LABELS = { checkout: 'Abreise', service: 'Service', none: 'Kein Auftrag' };

function tileStyle(room) {
  const statusOverride = STATUS_TILE[room.status];
  if (statusOverride) return statusOverride;
  return { bg: TYPE_COLORS[room.task_type]?.tileBg ?? '#F8FAFB',
           border: TYPE_COLORS[room.task_type]?.border ?? '#CBD5E1' };
}

function Label({ children }) {
  return <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1B4F72' }}>{children}</label>;
}

// ── Modal edycji pokoju (manager) ───────────────────────────────
function RoomModal({ room, cleaners, onClose, onSave, onReset }) {
  const [taskType, setTaskType]   = useState(room.task_type);
  const [assignedTo, setAssigned] = useState(room.assigned_to ?? '');
  const [notes, setNotes]         = useState(room.notes ?? '');
  const [saving, setSaving]       = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError]         = useState('');
  const duration = formatDuration(room.started_at, room.finished_at);

  async function handleSave() {
    setSaving(true); setError('');
    try {
      await api.assignRoom(room.id, { task_type: taskType, assigned_to: assignedTo || null, notes });
      onSave();
    } catch (e) { setError(e.message); setSaving(false); }
  }

  async function handleReset() {
    setResetting(true);
    try { await onReset(); }
    catch (e) { setError(e.message); setResetting(false); }
  }

  const tc = TYPE_COLORS[taskType] ?? TYPE_COLORS.none;

  return (
    <Modal title={`Zimmer ${room.number}`} onClose={onClose}>
      {duration && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
          style={{ background: '#EBF5FB', color: '#1B4F72' }}>
          ⏱ Reinigungsdauer: <strong>{duration}</strong>
        </div>
      )}
      {room.completion_notes && (() => {
        const data = parseCompletion(room.completion_notes);
        const opts = data?.options || [];
        return (
          <div className="rounded-xl px-4 py-3 text-sm space-y-2"
            style={{ background: '#F0E6CC', color: '#7D6608' }}>
            {opts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {SERVICE_OPTIONS.filter(o => opts.includes(o.key)).map(o => (
                  <span key={o.key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-semibold text-xs"
                    style={{ background: 'rgba(230,126,34,0.18)', color: '#C05000' }}>
                    {o.icon} {o.label}
                  </span>
                ))}
              </div>
            )}
            {data?.notes && (
              <p><span className="font-semibold">💬 Anmerkung:</span> {data.notes}</p>
            )}
            {!opts.length && !data?.notes && (
              <p><span className="font-semibold">💬 Anmerkung:</span> {room.completion_notes}</p>
            )}
          </div>
        );
      })()}
      <div>
        <Label>Auftragstyp</Label>
        <div className="flex gap-2">
          {[
            { key: 'none',     color: '#7F8C8D' },
            { key: 'service',  color: '#E67E22' },
            { key: 'checkout', color: '#E74C3C' },
          ].map(({ key, color }) => (
            <button key={key} onClick={() => setTaskType(key)}
              className="flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
              style={taskType === key
                ? { background: color, borderColor: color, color: '#fff' }
                : { background: '#fff', borderColor: '#E2E8F0', color: '#7F8C8D' }}>
              {TYPE_LABELS[key]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Zimmermädchen</Label>
        <select value={assignedTo} onChange={e => setAssigned(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base
                     focus:outline-none focus:border-[#2E86C1] bg-white">
          <option value="">— nicht zugewiesen —</option>
          {cleaners.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <Label>Hinweise</Label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base
                     focus:outline-none focus:border-[#2E86C1] resize-none" rows={2}
          placeholder="z.B. Dusche überprüfen..." />
      </div>
      {error && <p className="text-[#C0392B] text-sm font-medium">{error}</p>}

      {/* Bestätigen — wyraźnie oddzielone, tylko gdy status=done */}
      {room.status === 'done' && (
        <div className="pt-1">
          <p className="text-xs text-center mb-2" style={{ color: '#7F8C8D' }}>
            Zimmer geprüft → Status zurücksetzen und für neue Zuweisung freigeben
          </p>
          <button onClick={handleReset} disabled={resetting} className="btn-success w-full">
            {resetting ? 'Wird zurückgesetzt...' : 'Bestätigen ✓ — Zimmer freigeben'}
          </button>
        </div>
      )}

      {/* Speichern — tylko zapis zmian (typ, sprzątaczka, uwagi) */}
      <button onClick={handleSave} disabled={saving} className="btn-ocean w-full">
        {saving ? 'Speichern...' : 'Speichern'}
      </button>
    </Modal>
  );
}

function AddRoomModal({ onClose, onSave }) {
  const [number, setNumber] = useState('');
  const [floor, setFloor]   = useState('1');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!number.trim()) return setError('Bitte Zimmernummer eingeben');
    setSaving(true);
    try { await api.addRoom(number.trim(), parseInt(floor)); onSave(); }
    catch (e) { setError(e.message); setSaving(false); }
  }

  return (
    <Modal title="Zimmer hinzufügen" onClose={onClose}>
      <div>
        <Label>Zimmernummer</Label>
        <input type="text" value={number} onChange={e => setNumber(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base
                     focus:outline-none focus:border-[#2E86C1]"
          placeholder="z.B. 101" autoFocus />
      </div>
      <div>
        <Label>Bereich</Label>
        <select value={floor} onChange={e => setFloor(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base
                     focus:outline-none focus:border-[#2E86C1] bg-white">
          <option value="1">Haus Borkum</option>
          <option value="2">Kleine Möwe</option>
          <option value="0">Erdgeschoss</option>
        </select>
      </div>
      {error && <p className="text-[#C0392B] text-sm font-medium">{error}</p>}
      <button onClick={handleSave} disabled={saving} className="btn-ocean w-full">
        {saving ? 'Wird hinzugefügt...' : 'Zimmer hinzufügen'}
      </button>
    </Modal>
  );
}

// ── Główny komponent ────────────────────────────────────────────
export default function Rooms() {
  const { user } = useAuth();
  const isManager = user.role === 'manager';

  const [rooms, setRooms]              = useState([]);
  const [cleaners, setClean]           = useState([]);
  const [selected, setSelect]          = useState(null);
  const [showAdd, setShowAdd]          = useState(false);
  const [loading, setLoading]          = useState(true);
  const [filter, setFilter]            = useState('all');
  const [completionRoom, setComplRoom] = useState(null);
  const [serviceRoom, setServiceRoom]  = useState(null);

  const fetchRooms = useCallback(async () => {
    const data = await api.getRooms();
    setRooms(data);
  }, []);

  useEffect(() => {
    setLoading(true);
    const p = [fetchRooms()];
    if (isManager) p.push(api.getCleaners().then(setClean));
    Promise.all(p).finally(() => setLoading(false));
  }, [fetchRooms, isManager]);

  async function handleStatusChange(room, status, completionNotes) {
    try { await api.setRoomStatus(room.id, status, completionNotes); fetchRooms(); }
    catch (e) { alert(e.message); }
  }

  function handleFertigClick(room) {
    if (room.task_type === 'service') setServiceRoom(room);
    else setComplRoom(room);
  }

  async function handleCompletionConfirm(notes) {
    await handleStatusChange(completionRoom, 'done', notes);
    setComplRoom(null);
  }

  async function handleServiceConfirm(payload) {
    await handleStatusChange(serviceRoom, 'done', payload);
    setServiceRoom(null);
  }

  // Bestätigen = reset pokoju (pending, brak sprzątaczki, brak notatek)
  async function handleReset(room) {
    try { await api.resetRoom(room.id); fetchRooms(); setSelect(null); }
    catch (e) { alert(e.message); }
  }

  async function handleDelete(room) {
    if (!confirm(`Zimmer ${room.number} löschen?`)) return;
    try { await api.deleteRoom(room.id); fetchRooms(); }
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

  // ── Widok sprzątaczki ─────────────────────────────────────────
  if (!isManager) {
    return (
      <>
        <div className="space-y-3">
          {rooms.length === 0 && (
            <div className="card text-center py-12" style={{ color: '#7F8C8D' }}>
              <div className="text-4xl mb-2">🛏</div>
              <p>Keine zugewiesenen Zimmer</p>
            </div>
          )}

          {/* Sortowanie: Service → Abreise → Kein Auftrag */}
          {[...rooms].sort((a, b) =>
            (TYPE_ORDER[a.task_type] ?? 3) - (TYPE_ORDER[b.task_type] ?? 3)
          ).map(room => {
            const tc = TYPE_COLORS[room.task_type] ?? TYPE_COLORS.none;

            return (
              <div key={room.id} className="rounded-2xl overflow-hidden animate-in"
                style={{
                  background: tc.cardBg,
                  border: `1px solid ${tc.border}30`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                }}>
                <div className="p-4">
                  {/* Nagłówek karty */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xl font-bold" style={{ color: tc.text }}>
                        Zimmer {room.number}
                      </span>
                      {/* Etykieta typu w kolorze */}
                      <span className="ml-2 text-sm font-semibold" style={{ color: tc.subtext }}>
                        · {TYPE_LABELS[room.task_type]}
                      </span>
                    </div>
                    {/* Badge statusu */}
                    <StatusBadge status={room.status} />
                  </div>

                  {/* Uwagi managera */}
                  {room.notes && (
                    <p className="text-sm mb-3 px-3 py-2 rounded-xl"
                      style={{ background: `${tc.border}18`, color: tc.text }}>
                      💬 {room.notes}
                    </p>
                  )}

                  {/* Przyciski akcji — pełne kolory (tło jasne, więc przyciski standardowe) */}
                  <div className="flex gap-2">
                    {room.status === 'pending' && (
                      <button onClick={() => handleStatusChange(room, 'in_progress')}
                        className="flex-1 py-3 rounded-xl font-semibold text-base transition-all active:scale-95 text-white"
                        style={{ background: '#1B4F72', boxShadow: '0 4px 14px rgba(27,79,114,0.3)' }}>
                        ▶ Beginnen
                      </button>
                    )}
                    {room.status === 'in_progress' && (
                      <button onClick={() => handleFertigClick(room)}
                        className="flex-1 py-3 rounded-xl font-semibold text-base transition-all active:scale-95 text-white"
                        style={{ background: '#1E8449', boxShadow: '0 4px 14px rgba(30,132,73,0.3)' }}>
                        ✓ Fertig
                      </button>
                    )}
                    {(room.status === 'done' || room.status === 'verified') && (
                      <div className="flex-1 text-center py-3 rounded-xl text-sm font-medium"
                        style={{ background: `${tc.border}20`, color: tc.text }}>
                        {room.status === 'verified'
                          ? '✓ Vom Manager bestätigt'
                          : '⏳ Wartet auf Bestätigung'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Abreise — zwykłe pole uwag */}
        {completionRoom && (
          <CompletionModal
            title={`Zimmer ${completionRoom.number}`}
            onConfirm={handleCompletionConfirm}
            onCancel={() => setComplRoom(null)}
          />
        )}
        {/* Modal Service — checkboxy */}
        {serviceRoom && (
          <ServiceCompletionModal
            room={serviceRoom}
            onConfirm={handleServiceConfirm}
            onCancel={() => setServiceRoom(null)}
          />
        )}
      </>
    );
  }

  // ── Widok managera ────────────────────────────────────────────
  // Filtry — Abreise zamiast Auschecken
  const FILTERS = [
    { key: 'all',         label: 'Alle',          dot: null      },
    { key: 'checkout',    label: 'Abreise',        dot: '#E74C3C' },
    { key: 'service',     label: 'Service',        dot: '#E67E22' },
    { key: 'in_progress', label: 'In Bearbeitung', dot: '#2E86C1' },
  ];

  const filtered = filter === 'all'         ? rooms
    : filter === 'in_progress'              ? rooms.filter(r => r.status === 'in_progress')
    : rooms.filter(r => r.task_type === filter);

  const byFloor = filtered.reduce((acc, r) => {
    (acc[r.floor] = acc[r.floor] || []).push(r);
    return acc;
  }, {});

  return (
    <>
      {/* Pasek filtrów */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={filter === f.key ? 'filter-pill-active' : 'filter-pill-inactive'}
            style={{ whiteSpace: 'nowrap' }}>
            {f.dot && (
              <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                style={{ background: f.dot }} />
            )}
            {f.label}
          </button>
        ))}
        <div className="ml-auto shrink-0">
          <button onClick={() => setShowAdd(true)} className="btn-ocean py-1.5 px-4 text-sm">
            + Zimmer
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="card text-center py-12" style={{ color: '#7F8C8D' }}>
          <div className="text-4xl mb-2">🔍</div>
          <p>Keine Zimmer gefunden</p>
        </div>
      )}

      {Object.keys(byFloor).sort((a, b) => a - b).map(floor => (
        <div key={floor} className="mb-6">
          <div className="section-title">
            {({ '0': 'Erdgeschoss', '1': 'Haus Borkum', '2': 'Kleine Möwe' })[floor] ?? `${floor}. Etage`}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {byFloor[floor].map(room => {
              const ts = tileStyle(room);
              const tc = TYPE_COLORS[room.task_type] ?? TYPE_COLORS.none;
              const duration = formatDuration(room.started_at, room.finished_at);
              return (
                <div key={room.id} onClick={() => setSelect(room)}
                  className="relative rounded-2xl p-3.5 cursor-pointer transition-all duration-150
                             active:scale-95 animate-in"
                  style={{
                    background: ts.bg,
                    borderLeft: `4px solid ${ts.border}`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                  }}>
                  <div className="text-2xl font-bold mb-0.5" style={{ color: '#1B4F72' }}>
                    {room.number}
                  </div>
                  {/* Typ w kolorze */}
                  <div className="text-xs font-bold mb-2"
                    style={{ color: tc.label }}>
                    {TYPE_LABELS[room.task_type]}
                  </div>
                  <StatusBadge status={room.status} />
                  {room.assigned_name && (
                    <div className="text-xs mt-1.5 font-medium truncate" style={{ color: '#2C3E50' }}>
                      👤 {room.assigned_name}
                    </div>
                  )}
                  {duration && (
                    <div className="text-xs mt-1 font-medium" style={{ color: '#7F8C8D' }}>
                      ⏱ {duration}
                    </div>
                  )}
                  {room.completion_notes && (
                    <ServiceBadges raw={room.completion_notes} />
                  )}
                  <button onClick={e => { e.stopPropagation(); handleDelete(room); }}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center
                               rounded-full text-xs hover:bg-red-100 transition-colors"
                    style={{ color: '#CBD5E1' }}>
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {selected && (
        <RoomModal
          room={selected}
          cleaners={cleaners}
          onClose={() => setSelect(null)}
          onSave={() => { setSelect(null); fetchRooms(); }}
          onReset={() => handleReset(selected)}
        />
      )}
      {showAdd && (
        <AddRoomModal onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); fetchRooms(); }} />
      )}
    </>
  );
}
