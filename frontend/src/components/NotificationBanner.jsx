import { useState, useEffect } from 'react';

export default function NotificationBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') setShow(true);
  }, []);

  if (!show) return null;

  async function handleAllow() {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification('Nordhotels', { body: 'Benachrichtigungen aktiviert ✓', icon: '/icon-192.png' });
    }
    setShow(false);
  }

  return (
    <div className="fixed z-30 left-4 right-4 animate-in"
      style={{
        top: '68px',
        background: 'linear-gradient(135deg,#1B4F72,#2E86C1)',
        borderRadius: '14px',
        padding: '12px 16px',
        boxShadow: '0 4px 16px rgba(27,79,114,0.35)',
      }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-white text-sm font-medium">
          🔔 Benachrichtigungen für dringende Störungen?
        </p>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setShow(false)}
            className="text-xs text-white/70 hover:text-white px-2 py-1 rounded-lg">
            Nein
          </button>
          <button onClick={handleAllow}
            className="text-xs bg-white font-semibold px-3 py-1 rounded-lg"
            style={{ color: '#1B4F72' }}>
            Erlauben
          </button>
        </div>
      </div>
    </div>
  );
}
