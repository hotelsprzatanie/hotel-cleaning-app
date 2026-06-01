import { useAuth } from '../context/AuthContext';

export default function TopBar({ title }) {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-blue-700 text-white z-40 flex items-center justify-between px-4 h-14 shadow-md">
      <h1 className="font-semibold text-lg">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="text-blue-200 text-sm">{user?.name}</span>
        <button
          onClick={logout}
          className="text-blue-200 hover:text-white text-sm px-2 py-1 rounded"
        >
          Wyloguj
        </button>
      </div>
    </header>
  );
}
