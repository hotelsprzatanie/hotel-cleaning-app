import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

function Label({ children }) {
  return <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1B4F72' }}>{children}</label>;
}

const STATUS_COLORS = {
  new:         { bg: '#FDEBD0', border: '#E67E22' },
  in_progress: { bg: '#EBF5FB', border: '#2E86C1' },
  fixed:       { bg: '#EAFAF1', border: '#27AE60' },
};

// Modal powiększonego zdjęcia — kliknięcie tła lub ✕ zamyka
function PhotoModal({ url, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <img
          src={url}
          alt="Störungsfoto"
          className="w-full rounded-2xl object-contain"
          style={{ maxHeight: '85vh' }}
        />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center
                     rounded-full text-white font-bold text-lg"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function IssueCard({ issue, isManager, onStatusChange, onDelete }) {
  const isUrgent = issue.priority === 'urgent';
  const [photoOpen, setPhotoOpen] = useState(false);

  return (
    <>
    <div className="rounded-2xl overflow-hidden animate-in"
      style={{
        background: isUrgent ? '#FEF0EF' : '#fff',
        border: `2px solid ${isUrgent ? '#E74C3C' : '#F0F4F8'}`,
        boxShadow: isUrgent
          ? '0 4px 16px rgba(231,76,60,0.15)'
          : '0 2px 12px rgba(27,79,114,0.08)',
      }}>
      <div className="p-4">
        <div className="flex gap-3">
          {/* Miniatura zdjęcia — kliknięcie otwiera modal, NIE nawiguje */}
          {issue.photo_url && (
            <button
              onClick={() => setPhotoOpen(true)}
              className="shrink-0 active:scale-95 transition-transform"
              type="button"
            >
              <img src={issue.photo_url} alt="Störungsfoto"
                className="w-16 h-16 rounded-xl object-cover"
                style={{ border: '2px solid #E2E8F0' }} />
            </button>
          )}

          {/* Treść */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                {isUrgent && (
                  <span className="badge text-xs"
                    style={{ background: '#E74C3C', color: '#fff', letterSpacing: '0.05em' }}>
                    ⚡ DRINGEND
                  </span>
                )}
                <StatusBadge status={issue.status} />
              </div>
              {isManager && (
                <button onClick={() => onDelete(issue)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs
                             font-medium transition-colors hover:bg-red-50 shrink-0"
                  style={{ color: '#C0392B' }}>
                  🗑 Löschen
                </button>
              )}
            </div>

            <p className="font-semibold text-base" style={{ color: '#2C3E50' }}>
              📍 {issue.location}
            </p>
            {issue.description && (
              <p className="text-sm mt-0.5" style={{ color: '#7F8C8D' }}>{issue.description}</p>
            )}
            <p className="text-xs mt-1.5 font-medium" style={{ color: '#7F8C8D' }}>
              👤 {issue.reporter_name} · {new Date(issue.created_at).toLocaleDateString('de-DE')}
            </p>
          </div>
        </div>

        {/* Akcje managera */}
        {isManager && issue.status !== 'fixed' && (
          <div className="flex gap-2 mt-3 pt-3"
            style={{ borderTop: `1px solid ${isUrgent ? 'rgba(231,76,60,0.15)' : '#F0F4F8'}` }}>
            {issue.status === 'new' && (
              <button onClick={() => onStatusChange(issue, 'in_progress')}
                className="btn-ghost text-sm py-2 flex-1">
                In Bearbeitung nehmen
              </button>
            )}
            {issue.status === 'in_progress' && (
              <button onClick={() => onStatusChange(issue, 'fixed')}
                className="btn-success flex-1">
                ✓ Behoben
              </button>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Modal powiększonego zdjęcia */}
    {photoOpen && issue.photo_url && (
      <PhotoModal url={issue.photo_url} onClose={() => setPhotoOpen(false)} />
    )}
    </>
  );
}

function AddIssueModal({ onClose, onSave }) {
  const [location, setLoc]      = useState('');
  const [description, setDesc]  = useState('');
  const [priority, setPriority] = useState('normal');
  const [photo, setPhoto]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);
  const fileRef = useRef();

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!location.trim()) return setError('Bitte Ort der Störung angeben');
    if (!photo && !description.trim()) return setError('Bitte Beschreibung eingeben oder Foto hinzufügen');
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('location', location.trim());
      if (description.trim()) fd.append('description', description.trim());
      fd.append('priority', priority);
      if (photo) fd.append('photo', photo);
      await api.addIssue(fd);
      onSave();
    } catch (e) { setError(e.message); setSaving(false); }
  }

  return (
    <Modal title="Störung melden" onClose={onClose}>
      <div>
        <Label>Ort *</Label>
        <input type="text" value={location} onChange={e => setLoc(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base
                     focus:outline-none focus:border-[#2E86C1]"
          placeholder="z.B. Zimmer 205, Bad" autoFocus />
      </div>
      <div>
        <Label>
          Beschreibung{' '}
          <span className="text-xs font-normal" style={{ color: '#7F8C8D' }}>
            (optional wenn Foto vorhanden)
          </span>
        </Label>
        <textarea value={description} onChange={e => setDesc(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base
                     focus:outline-none focus:border-[#2E86C1] resize-none" rows={2}
          placeholder="Störung beschreiben..." />
      </div>

      {/* Priorytet */}
      <div>
        <Label>Priorität</Label>
        <div className="flex gap-2">
          <button onClick={() => setPriority('normal')}
            className="flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all"
            style={priority === 'normal'
              ? { background: '#1B4F72', borderColor: '#1B4F72', color: '#fff' }
              : { background: '#fff', borderColor: '#E2E8F0', color: '#7F8C8D' }}>
            Normal
          </button>
          <button onClick={() => setPriority('urgent')}
            className="flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all"
            style={priority === 'urgent'
              ? { background: '#C0392B', borderColor: '#C0392B', color: '#fff' }
              : { background: '#fff', borderColor: '#E2E8F0', color: '#7F8C8D' }}>
            ⚡ Dringend
          </button>
        </div>
      </div>

      {/* Upload zdjęcia */}
      <div>
        <Label>Foto</Label>
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          onChange={handlePhotoChange} className="hidden" />
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Vorschau" className="rounded-2xl w-full max-h-52 object-cover" />
            <button onClick={() => { setPhoto(null); setPreview(null); fileRef.current.value = ''; }}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center
                         rounded-full text-white text-sm font-bold"
              style={{ background: 'rgba(0,0,0,0.55)' }}>
              ✕
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current.click()}
            className="w-full border-2 border-dashed rounded-2xl py-8 flex flex-col
                       items-center gap-2 transition-colors"
            style={{ borderColor: '#CBD5E1', color: '#7F8C8D' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2E86C1'; e.currentTarget.style.color = '#2E86C1'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#7F8C8D'; }}>
            <span className="text-4xl">📷</span>
            <span className="text-sm font-medium">Foto aufnehmen oder aus Galerie wählen</span>
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: '#FDEDEC', color: '#C0392B' }}>
          {error}
        </div>
      )}
      <button onClick={handleSave} disabled={saving} className="btn-ocean w-full">
        {saving ? 'Wird gemeldet...' : '📤 Störung melden'}
      </button>
    </Modal>
  );
}

export default function Issues() {
  const { user } = useAuth();
  const isManager = user.role === 'manager';

  const [issues, setIssues]         = useState([]);
  const [showAdd, setShowAdd]       = useState(false);
  const [loading, setLoad]          = useState(true);
  const [filter, setFilter]         = useState('all');
  const [deleteIssue, setDeleteIss] = useState(null);
  const [deleting, setDeleting]     = useState(false);

  const fetchIssues = useCallback(async () => {
    const data = await api.getIssues();
    setIssues(data);
  }, []);

  useEffect(() => { setLoad(true); fetchIssues().finally(() => setLoad(false)); }, [fetchIssues]);

  async function handleStatusChange(issue, status) {
    try { await api.setIssueStatus(issue.id, status); fetchIssues(); }
    catch (e) { alert(e.message); }
  }

  function handleDeleteClick(issue) { setDeleteIss(issue); }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try { await api.deleteIssue(deleteIssue.id); fetchIssues(); setDeleteIss(null); }
    catch (e) { alert(e.message); }
    finally { setDeleting(false); }
  }

  const FILTERS = [['all','Alle'],['new','Neu'],['in_progress','In Bearb.'],['fixed','Behoben']];
  const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter);

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
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        {isManager ? (
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={filter === val ? 'filter-pill-active' : 'filter-pill-inactive'}>
                {label}
              </button>
            ))}
          </div>
        ) : <div />}
        <button onClick={() => setShowAdd(true)} className="btn-ocean py-2 px-4 text-sm shrink-0">
          + Störung melden
        </button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card text-center py-12" style={{ color: '#7F8C8D' }}>
            <div className="text-4xl mb-2">✅</div>
            <p>Keine Störungen</p>
          </div>
        )}
        {filtered.map(issue => (
          <IssueCard key={issue.id} issue={issue} isManager={isManager}
            onStatusChange={handleStatusChange} onDelete={handleDeleteClick} />
        ))}
      </div>

      {showAdd && (
        <AddIssueModal onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); fetchIssues(); }} />
      )}

      {deleteIssue && (
        <ConfirmModal
          message={`Störung "${deleteIssue.location}" wirklich löschen?`}
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteIss(null)}
        />
      )}
    </>
  );
}
