import { useEffect } from 'react';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(27,79,114,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto animate-in"
        style={{ borderRadius: '20px', boxShadow: '0 24px 60px rgba(27,79,114,0.3)' }}>

        {/* Header modala */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #F0F4F8' }}>
          <h2 className="text-lg font-bold" style={{ color: '#1B4F72' }}>{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg
                       transition-colors hover:bg-slate-100"
            style={{ color: '#7F8C8D' }}>
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}
