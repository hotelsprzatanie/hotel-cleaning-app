import { useAuth } from '../context/AuthContext';

export default function TopBar({ title }) {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 overflow-hidden"
      style={{ height: '60px' }}>
      {/* Gradient tła */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #1B4F72 0%, #2E86C1 100%)' }} />

      {/* Dekoracyjna fala na dole */}
      <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 400 12"
        preserveAspectRatio="none" style={{ height: '12px' }}>
        <path fill="rgba(255,255,255,0.12)"
          d="M0,6 C80,12 160,0 240,6 C320,12 360,3 400,6 L400,12 L0,12 Z" />
      </svg>

      {/* Treść */}
      <div className="relative z-10 h-full flex items-center justify-between px-4">
        {/* Logo lewej */}
        <div className="flex items-center gap-2">
          <div>
            <div className="text-white font-bold text-base leading-tight tracking-wide">
              Nordhotels
            </div>
            <div className="text-[#5DADE2] text-xs leading-none font-light tracking-wider">
              {title}
            </div>
          </div>
        </div>

        {/* Prawo — użytkownik + wyloguj */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-white text-sm font-medium leading-tight">{user?.name}</div>
            <div className="text-[#AED6F1] text-xs leading-none">
              {user?.role === 'manager' ? 'Manager' : 'Zimmermädchen'}
            </div>
          </div>
          <button onClick={logout}
            className="bg-white/15 hover:bg-white/25 text-white text-xs font-medium
                       px-3 py-1.5 rounded-lg transition-colors">
            ⎋ Abmelden
          </button>
        </div>
      </div>
    </header>
  );
}
