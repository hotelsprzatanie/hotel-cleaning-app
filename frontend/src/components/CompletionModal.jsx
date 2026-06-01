import { useState } from 'react';
import Modal from './Modal';

/**
 * Modal wywoływany po kliknięciu "Fertig" przez sprzątaczkę.
 * Pozwala dodać opcjonalne uwagi przed zmianą statusu na "done".
 *
 * Props:
 *   title     - np. "Zimmer 101" lub "Frühstücksraum"
 *   onConfirm(notes: string|null) - wywołane po kliknięciu Abschließen
 *   onCancel()                    - wywołane po kliknięciu Abbrechen
 */
export default function CompletionModal({ title, onConfirm, onCancel }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    await onConfirm(notes.trim() || null);
    // setSaving(false) nie jest potrzebne bo modal się zamknie
  }

  return (
    <Modal title="Aufgabe abgeschlossen" onClose={onCancel}>
      <div className="space-y-4">
        {/* Nazwa zadania */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: '#EBF5FB' }}>
          <span className="text-2xl">✅</span>
          <p className="font-semibold" style={{ color: '#1B4F72' }}>{title}</p>
        </div>

        {/* Pytanie o uwagi */}
        <p className="text-base" style={{ color: '#2C3E50' }}>
          Möchten Sie eine Anmerkung hinzufügen?
        </p>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base
                     focus:outline-none focus:border-[#2E86C1] resize-none"
          rows={3}
          placeholder="Anmerkungen (optional)"
          autoFocus
        />

        <div className="flex gap-2 pt-1">
          <button onClick={onCancel} disabled={saving} className="btn-ghost flex-1">
            Abbrechen
          </button>
          <button onClick={handleConfirm} disabled={saving} className="btn-success flex-1">
            {saving ? 'Wird gespeichert...' : 'Abschließen ✓'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
