import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Library, Upload } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import MiniPlayer from './Player/MiniPlayer';
import { motion, AnimatePresence } from 'framer-motion';

const tabs = [
  { to: '/',        icon: Home,    label: 'Home' },
  { to: '/search',  icon: Search,  label: 'Search' },
  { to: '/library', icon: Library, label: 'Library' },
  { to: '/import',  icon: Upload,  label: 'Import' },
];

export default function Layout() {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Page content */}
      <main className="flex-1 overflow-y-auto overscroll-none">
        <Outlet />
      </main>

      {/* Mini player — slides up when a track is loaded */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={() => navigate('/now-playing')}
            className="px-3 pb-1 cursor-pointer"
          >
            <MiniPlayer />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab bar */}
      <nav className="glass border-t border-white/5 safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'text-accent'
                    : 'text-text-muted hover:text-text-secondary'
                }`
              }
            >
              <Icon size={22} strokeWidth={1.75} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
