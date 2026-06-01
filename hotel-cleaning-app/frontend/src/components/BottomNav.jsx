import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/rooms',        label: 'Pokoje',      icon: '🛏️' },
  { to: '/common-areas', label: 'Wspólne',     icon: '🚪' },
  { to: '/issues',       label: 'Usterki',     icon: '🔧' },
  { to: '/tasks',        label: 'Inne',        icon: '📋' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-40 safe-area-pb">
      {tabs.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs transition-colors gap-0.5 ` +
            (isActive ? 'text-blue-600' : 'text-slate-500')
          }
        >
          <span className="text-xl leading-none">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
