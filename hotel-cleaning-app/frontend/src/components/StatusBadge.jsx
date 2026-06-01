const CONFIG = {
  pending:     { label: 'Oczekuje',    cls: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'W trakcie',   cls: 'bg-blue-100 text-blue-700' },
  done:        { label: 'Gotowe',      cls: 'bg-green-100 text-green-700' },
  verified:    { label: 'Zatwierdzone',cls: 'bg-purple-100 text-purple-700' },
  new:         { label: 'Nowa',        cls: 'bg-orange-100 text-orange-700' },
  fixed:       { label: 'Naprawiona',  cls: 'bg-green-100 text-green-700' },
};

export default function StatusBadge({ status }) {
  const { label, cls } = CONFIG[status] ?? { label: status, cls: 'bg-slate-100 text-slate-500' };
  return <span className={`badge ${cls}`}>{label}</span>;
}
