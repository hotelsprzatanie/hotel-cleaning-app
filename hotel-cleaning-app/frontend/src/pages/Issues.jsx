import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

const PRIORITY_LABELS = { normal: 'Normalny', urgent: '🔴 Pilny' };

const STATUS_LABELS = { new: 'Nowa', in_progress: 'W realizacji', fixed: 'Naprawiona' };

function IssueCard({ issue, isManager, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`card ${issue.priority === 'urgent' ? 'border-red-300' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={issue.status} />
            {issue.priority === 'urgent' && (
              <span className="badge bg-red-100 text-red-700">Pilne</span>
            )}
          </div>
          <p className="font-medium mt-1">{issue.location}</p>
          {issue.description && (
            <p className="text-sm text-slate-500 mt-0.5">{issue.description}</p>
          )}
          <p className="text-xs text-slate-400 mt-1">
            {issue.reporter_name} · {new Date(issue.created_at).toLocaleDateString('pl-PL')}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {issue.photo_url && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-blue-500 text-sm px-2 py-1 hover:bg-blue-50 rounded"
            >
              📷
            </button>
          )}
          {isManager && (
            <button
              onClick={() => onDelete(issue)}
              className="text-slate-300 hover:text-red-400 text-sm p-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {expanded && issue.photo_url && (
        <div className="mt-3">
          <img
            src={issue.photo_url}
            alt="Zdjęcie usterki"
            className="rounded-lg w-full max-h-64 object-cover"
          />
        </div>
      )}

      {isManager && issue.status !== 'fixed' && (
        <div className="flex gap-2 mt-3">
          {issue.status === 'new' && (
            <button
              onClick={() => onStatusChange(issue, 'in_progress')}
              className="btn-ghost text-sm border border-slate-200"
            >
              Przyjmuję do realizacji
            </button>
          )}
          {issue.status === 'in_progress' && (
            <button
              onClick={() => onStatusChange(issue, 'fixed')}
              className="btn-success text-sm"
            >
              Naprawiona ✓
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AddIssueModal({ onClose, onSave }) {
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!location.trim()) return setError('Podaj lokalizację usterki');
    if (!photo && !description.trim()) return setError('Podaj opis lub dodaj zdjęcie');

    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('location', location.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('priority', priority);
      if (photo) formData.append('photo', photo);

      await api.addIssue(formData);
      onSave();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <Modal title="Zgłoś usterkę" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Lokalizacja *</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="np. Pokój 205, łazienka"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Opis <span className="text-slate-400 font-normal">(opcjonalny jeśli jest zdjęcie)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            rows={2}
            placeholder="Opisz usterkę..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Priorytet</label>
          <div className="flex gap-2">
            {['normal', 'urgent'].map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  priority === p
                    ? p === 'urgent'
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Upload zdjęcia — otwiera aparat na telefonie */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Zdjęcie</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
          />

          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="Podgląd" className="rounded-lg w-full max-h-48 object-cover" />
              <button
                onClick={() => { setPhoto(null); setPhotoPreview(null); fileRef.current.value = ''; }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-lg py-8 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex flex-col items-center gap-1"
            >
              <span className="text-3xl">📷</span>
              <span className="text-sm">Zrób zdjęcie lub wybierz z galerii</span>
            </button>
          )}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? 'Zgłaszam...' : 'Zgłoś usterkę'}
        </button>
      </div>
    </Modal>
  );
}

export default function Issues() {
  const { user } = useAuth();
  const isManager = user.role === 'manager';

  const [issues, setIssues] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchIssues = useCallback(async () => {
    const data = await api.getIssues();
    setIssues(data);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchIssues().finally(() => setLoading(false));
  }, [fetchIssues]);

  async function handleStatusChange(issue, status) {
    try {
      await api.setIssueStatus(issue.id, status);
      fetchIssues();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDelete(issue) {
    if (!confirm('Usunąć tę usterkę?')) return;
    try {
      await api.deleteIssue(issue.id);
      fetchIssues();
    } catch (e) {
      alert(e.message);
    }
  }

  const filtered = filter === 'all'
    ? issues
    : issues.filter((i) => i.status === filter);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-slate-400">Ładowanie...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        {isManager ? (
          <div className="flex gap-1 text-sm">
            {[['all', 'Wszystkie'], ['new', 'Nowe'], ['in_progress', 'W realizacji'], ['fixed', 'Naprawione']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  filter === val ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : <div />}
        <button onClick={() => setShowAdd(true)} className="btn-primary shrink-0">
          + Zgłoś
        </button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card text-center text-slate-400">Brak usterek</div>
        )}
        {filtered.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            isManager={isManager}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {showAdd && (
        <AddIssueModal
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); fetchIssues(); }}
        />
      )}
    </>
  );
}
