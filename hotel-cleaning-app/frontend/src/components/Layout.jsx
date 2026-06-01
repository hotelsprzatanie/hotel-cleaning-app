import { useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

const PAGE_TITLES = {
  '/rooms':        'Pokoje',
  '/common-areas': 'Części wspólne',
  '/issues':       'Usterki',
  '/tasks':        'Inne zadania',
};

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'Hotel Cleaning';

  return (
    <div className="flex flex-col h-full">
      <TopBar title={title} />
      <main className="flex-1 overflow-y-auto pt-14 pb-20 px-4 py-4 mt-14">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
