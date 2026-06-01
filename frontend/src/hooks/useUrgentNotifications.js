import { useEffect, useRef } from 'react';
import { api } from '../api/client';

const POLL_INTERVAL = 30_000; // 30 sekund
const STORAGE_KEY   = 'notified_issue_ids';

function getNotifiedIds() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}

function saveNotifiedIds(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

function showNotification(issue) {
  const body = [issue.location, issue.description].filter(Boolean).join(' — ');
  new Notification('⚠️ Dringende Störung!', {
    body: body || issue.location,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `issue-${issue.id}`,   // zapobiega duplikatom
    requireInteraction: true,    // nie znika automatycznie
  });
}

export function useUrgentNotifications(enabled) {
  const permissionRef = useRef(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  // Poproś o zgodę przy pierwszym uruchomieniu
  useEffect(() => {
    if (!enabled) return;
    if (typeof Notification === 'undefined') return;
    if (permissionRef.current === 'default') {
      Notification.requestPermission().then(p => { permissionRef.current = p; });
    }
  }, [enabled]);

  // Polling co 30 sekund
  useEffect(() => {
    if (!enabled) return;
    if (typeof Notification === 'undefined') return;

    async function checkIssues() {
      if (permissionRef.current !== 'granted') return;
      try {
        const issues = await api.getIssues();
        const notifiedIds = getNotifiedIds();

        const newUrgent = issues.filter(i =>
          i.priority === 'urgent' &&
          i.status   === 'new'    &&
          !notifiedIds.has(i.id)
        );

        newUrgent.forEach(issue => {
          showNotification(issue);
          notifiedIds.add(issue.id);
        });

        if (newUrgent.length > 0) saveNotifiedIds(notifiedIds);
      } catch {
        // Błędy sieciowe ignorujemy — spróbujemy za 30s
      }
    }

    // Pierwsze sprawdzenie po 5 sekundach (żeby sesja się ustabilizowała)
    const firstCheck = setTimeout(checkIssues, 5_000);
    const interval   = setInterval(checkIssues, POLL_INTERVAL);

    return () => { clearTimeout(firstCheck); clearInterval(interval); };
  }, [enabled]);
}
