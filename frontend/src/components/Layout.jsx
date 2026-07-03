import { useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

const PAGE_TITLES = {
  '/rooms':        'Zimmer',
  '/common-areas': 'Gemeinschaftsbereiche',
  '/issues':       'Störungen',
  '/tasks':        'Sonstiges',
  '/statistics':   'Statistik',
};

export default function Layout({ children }) {
  const { pathname } = useLocation();
  return (
    <div className="flex flex-col h-full" style={{ background: '#F0F4F8' }}>
      <TopBar title={PAGE_TITLES[pathname] ?? 'Nordhotels'} />
      {/* top: 60px (topbar) + paddingBottom: 72px (bottomnav) */}
      <main className="flex-1 overflow-y-auto px-4 pb-4" style={{ paddingTop: '76px', paddingBottom: '80px' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
