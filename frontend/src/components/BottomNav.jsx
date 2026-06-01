import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/rooms',        label: 'Zimmer',       icon: '🛏' },
  { to: '/common-areas', label: 'Gemeinschaft',  icon: '🏢' },
  { to: '/issues',       label: 'Störungen',     icon: '⚠️' },
  { to: '/tasks',        label: 'Sonstiges',     icon: '📋' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white flex"
      style={{ boxShadow: '0 -4px 16px rgba(27,79,114,0.10)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} className="flex-1">
          {({ isActive }) => (
            <div className="flex flex-col items-center py-2 relative select-none">
              {/* Wskaźnik aktywny */}
              {isActive && (
                <div className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full"
                  style={{ background: '#1B4F72' }} />
              )}
              <span className="text-2xl leading-none mb-0.5">{icon}</span>
              <span className="text-xs font-medium leading-tight"
                style={{ color: isActive ? '#1B4F72' : '#7F8C8D' }}>
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
