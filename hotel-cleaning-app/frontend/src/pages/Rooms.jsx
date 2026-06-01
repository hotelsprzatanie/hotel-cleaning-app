import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

// Kolor kafelka zależy od typu i statusu
function tileColor(room) {
  if (room.status === 'in_progress') return 'bg-blue-100 border-blue-300 text-blue-900';
  if (room.status === 'done')        return 'bg-green-100 border-green-300 text-green-900';
  if (room.status === 'verified')    return 'bg-purple-100 border-purple-300 text-purple-900';
  if (room.task_type === 'checkout') return 'bg-red-100 border-red-300 text-red-900';
  if (room.task_type === 'service')  return 'bg-yellow-100 border-yellow-300 text-yellow-900';
  return 'bg-slate-100 border-slate-200 text-slate-500';
}

const TYPE_LABELS = { checkout: 'Checkout', service: 'Serwis', none: 'Brak' };

// Modal edycji pokoju (tylko manager)
function RoomModal({ room, cleaners, onClose, onSave }) {
  const [taskType, setTaskType] = useState(room.task_type);
  const [assignedTo, setAssignedTo] = useState(room.assigned_to ?? '');
  const [notes, setNotes] = useState(room.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await api.assignRoom(room.id, {
        task_type: taskType,
        assigned_to: assignedTo || null,
        notes,
      });
      onSave();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    setSaving(true);
    try {
      await api.setRoomStatus(room.id, 'verified');
      onSave();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <Modal title={`Pokój ${room.number}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Typ zadania</label>
          <div className="flex gap-2">
            {['none', 'service', 'checkout'].map((t) => (
              <button
                key={t}
                onClick={() => setTaskType(t)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  taskType === t
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sprzątaczka</label>
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Uwagi (opcjonalne)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            rows={2}
            placeholder="np. sprawdź prysznic..."
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2 pt-2">
          {room.status === 'done' && (
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

// Modal dodania pokoju
function AddRoomModal({ onClose, onSave }) {
  const [number, setNumber] = useState('');
  const [floor, setFloor] = useState('1');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!number.trim()) return setError('Wpisz numer pokoju');
    setSaving(true);
    try {
      await api.addRoom(number.trim(), parseInt(floor));
      onSave();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Dodaj pokój" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Numer pokoju</label>
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="np. 101"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Piętro</label>
          <input
            type="number"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            min="0"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? 'Dodaję...' : 'Dodaj pokój'}
        </button>
      </div>
    </Modal>
  );
}

export default function Rooms() {
  const { user } = useAuth();
  const isManager = user.role === 'manager';

  const [rooms, setRooms] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    try {
      const data = await api.getRooms();
      setRooms(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const promises = [fetchRooms()];
    if (isManager) promises.push(api.getCleaners().then(setCleaners));
    Promise.all(promises).finally(() => setLoading(false));
  }, [fetchRooms, isManager]);

  async function handleStatusChange(room, status) {
    try {
      await api.setRoomStatus(room.id, status);
      fetchRooms();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDelete(room) {
    if (!confirm(`Usunąć pokój ${room.number}?`)) return;
    try {
      await api.deleteRoom(room.id);
      fetchRooms();
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-slate-400">Ładowanie...</div>;
  }

  // Widok sprzątaczki — karty
  if (!isManager) {
    return (
      <div className="space-y-3">
        {rooms.length === 0 && (
          <div className="card text-center text-slate-400">Nie masz przypisanych pokoi</div>
        )}
        {rooms.map((room) => (
          <div key={room.id} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold">Pokój {room.number}</span>
              <StatusBadge status={room.status} />
            </div>
            <p className="text-sm text-slate-500 mb-3">
              {TYPE_LABELS[room.task_type]}
              {room.notes && <span className="ml-2">· {room.notes}</span>}
            </p>
            <div className="flex gap-2">
              {room.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(room, 'in_progress')}
                  className="btn-primary flex-1"
                >
                  Zaczynam
                </button>
              )}
              {room.status === 'in_progress' && (
                <button
                  onClick={() => handleStatusChange(room, 'done')}
                  className="btn-success flex-1"
                >
                  Gotowe ✓
                </button>
              )}
              {(room.status === 'done' || room.status === 'verified') && (
                <div className="flex-1 text-center text-sm text-slate-400 py-2">
                  {room.status === 'verified' ? 'Zatwierdzone przez managera' : 'Czeka na weryfikację'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Grupowanie po piętrach
  const byFloor = rooms.reduce((acc, r) => {
    (acc[r.floor] = acc[r.floor] || []).push(r);
    return acc;
  }, {});

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          + Dodaj pokój
        </button>
      </div>

      {Object.keys(byFloor).sort((a, b) => a - b).map((floor) => (
        <div key={floor} className="mb-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {floor === '0' ? 'Parter' : `Piętro ${floor}`}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {byFloor[floor].map((room) => (
              <div
                key={room.id}
                onClick={() => setSelected(room)}
                className={`relative border-2 rounded-xl p-3 cursor-pointer transition-transform active:scale-95 ${tileColor(room)}`}
              >
                <div className="font-bold text-lg">{room.number}</div>
                <div className="text-xs font-medium">{TYPE_LABELS[room.task_type]}</div>
                {room.assigned_name && (
                  <div className="text-xs mt-1 truncate opacity-70">{room.assigned_name}</div>
                )}
                <StatusBadge status={room.status} />
                {/* Przycisk usuń */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(room); }}
                  className="absolute top-1 right-1 text-slate-300 hover:text-red-400 text-sm leading-none p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <RoomModal
          room={selected}
          cleaners={cleaners}
          onClose={() => setSelected(null)}
          onSave={() => { setSelected(null); fetchRooms(); }}
        />
      )}

      {showAdd && (
        <AddRoomModal
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); fetchRooms(); }}
        />
      )}
    </>
  );
}
