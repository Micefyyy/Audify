import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Library, Upload, Settings } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useSettingsStore } from '../store/settingsStore';
import MiniPlayer from './Player/MiniPlayer';
import { motion } from 'framer-motion';

const tabs = [
  { to: '/',        icon: Home,     label: 'Home' },
  { to: '/search',  icon: Search,   label: 'Search' },
  { to: '/library', icon: Library,  label: 'Library' },
  { to: '/import',  icon: Upload,   label: 'Import' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const navigate = useNavigate();
  const theme = useSettingsStore(s => s.theme);

  return (
    <div className={`flex flex-col h-full ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      <div
        onClick={() => currentTrack && navigate('/now-playing')}
        className="px-2 pb-1 cursor-pointer"
      >
        <motion.div
          animate={currentTrack ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <MiniPlayer />
        </motion.div>
      </div>

      <nav className="bg-bg-surface border-t border-white/[0.04] safe-bottom">
        <div className="flex items-center justify-between h-14 px-1">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center h-full px-2.5 transition-colors ${
                  isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  <span className="text-[9px] font-medium mt-0.5 tracking-wide leading-none">{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute -top-px left-2 right-2 h-[2px] bg-accent rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
