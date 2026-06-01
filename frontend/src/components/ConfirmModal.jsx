import Modal from './Modal';

/**
 * Modal potwierdzenia akcji (np. usuwania).
 *
 * Props:
 *   message    - treść pytania, np. "Störung #3 wirklich löschen?"
 *   onConfirm() - po kliknięciu "Ja, löschen"
 *   onCancel()  - po kliknięciu "Abbrechen"
 *   loading     - opcjonalnie blokuje przyciski podczas operacji
 */
export default function ConfirmModal({ message, onConfirm, onCancel, loading = false }) {
  return (
    <Modal title="Wirklich löschen?" onClose={onCancel}>
      <div className="space-y-5">
        {/* Ikona ostrzeżenia */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{ background: '#FDEDEC' }}>
            🗑️
          </div>
          <p className="text-base text-center" style={{ color: '#2C3E50' }}>
            {message || 'Diesen Eintrag wirklich löschen?'}
          </p>
          <p className="text-sm text-center" style={{ color: '#7F8C8D' }}>
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel} disabled={loading} className="btn-ghost flex-1">
            Abbrechen
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="btn flex-1 text-white font-semibold rounded-xl py-3 transition-all active:scale-95"
            style={{ background: loading ? '#E88' : '#C0392B',
                     boxShadow: '0 4px 14px rgba(192,57,43,0.35)' }}>
            {loading ? 'Wird gelöscht...' : 'Ja, löschen'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
