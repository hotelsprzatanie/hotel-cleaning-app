const CONFIG = {
  pending:     { label: 'Zu reinigen',    bg: '#F0E6CC', color: '#7D6608' },
  in_progress: { label: 'In Bearbeitung', bg: '#D6EAF8', color: '#1B4F72' },
  done:        { label: 'Fertig',         bg: '#D5F5E3', color: '#1E8449' },
  verified:    { label: 'Geprüft',        bg: '#E8DAEF', color: '#6C3483' },
  new:         { label: 'Neu',            bg: '#FDEBD0', color: '#A04000' },
  in_progress_issue: { label: 'In Bearb.', bg: '#D6EAF8', color: '#1B4F72' },
  fixed:       { label: 'Behoben',        bg: '#D5F5E3', color: '#1E8449' },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] ?? { label: status, bg: '#F0F4F8', color: '#7F8C8D' };
  return (
    <span className="badge" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}
