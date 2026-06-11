import { useNavigate } from 'react-router-dom';
import { Music, Play } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useHaptics } from '../hooks/useHaptics';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const categories = [
  'Hip-Hop', 'Lo-fi', 'Pop', 'Rock',
  'Electronic', 'R&B', 'Indie', 'Jazz',
];

const catColors = [
  'from-amber-700/40 to-amber-900/20',
  'from-violet-700/40 to-violet-900/20',
  'from-rose-700/40 to-rose-900/20',
  'from-orange-700/40 to-orange-900/20',
  'from-cyan-700/40 to-cyan-900/20',
  'from-emerald-700/40 to-emerald-900/20',
  'from-indigo-700/40 to-indigo-900/20',
  'from-stone-600/40 to-stone-800/20',
];

export default function HomePage() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { currentTrack, isPlaying, recentlyPlayed, pause, resume } = usePlayerStore();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto overscroll-none pb-2">
        <div className="px-5 pt-14 pb-1">
          <h1 className="text-2xl font-bold text-text-primary">{greeting()}</h1>
        </div>

        {currentTrack && (
          <div className="px-5 mb-5">
            <button
              onClick={() => navigate('/now-playing')}
              className="w-full flex items-center gap-3 bg-bg-surface rounded-xl p-2.5 active:scale-[0.99] transition-transform"
            >
              <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                <img src={currentTrack.artwork} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  {isPlaying ? (
                    <div className="flex items-end gap-[2px] h-3.5">
                      <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '50%', animationDelay: '0ms' }} />
                      <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '100%', animationDelay: '150ms' }} />
                      <span className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: '35%', animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <Play size={13} fill="white" color="white" className="ml-0.5" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-text-primary text-sm font-medium truncate">{currentTrack.title}</p>
                <p className="text-text-secondary text-[11px] truncate">{currentTrack.artist}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); haptics.impact(); isPlaying ? pause() : resume(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent/10 text-accent active:scale-90 transition-transform flex-shrink-0"
              >
                <Play size={13} fill="currentColor" className={isPlaying ? 'hidden' : 'ml-0.5'} />
                <Music size={13} className={isPlaying ? '' : 'hidden'} />
              </button>
            </button>
          </div>
        )}

        {recentlyPlayed.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-text-primary px-5 mb-2.5">Recently played</h2>
            <div className="flex gap-2 overflow-x-auto overscroll-x-contain px-5 pb-1 scrollbar-none">
              {recentlyPlayed.map(track => (
                <div key={track.id} className="flex-shrink-0 w-28">
                  <button
                    onClick={() => { haptics.tap(); usePlayerStore.getState().play(track, recentlyPlayed); }}
                    className="w-full"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-bg-surface mb-1.5">
                      <img src={track.artwork} alt="" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-text-primary text-xs font-medium truncate text-left leading-tight">{track.title}</p>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/artist/${encodeURIComponent(track.artist)}`); }}
                    className="text-text-muted text-[10px] truncate hover:text-accent transition-colors text-left w-full mt-0.5"
                  >
                    {track.artist}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-5 mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2.5">Browse</h2>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat, i) => (
              <button
                key={cat}
                onClick={() => { haptics.tap(); navigate(`/search?q=${cat}`); }}
                className={`bg-gradient-to-br ${catColors[i]} rounded-lg px-3 py-3 text-left active:brightness-110 transition-all`}
              >
                <span className="text-white/90 font-semibold text-xs">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {recentlyPlayed.length === 0 && (
          <div className="px-5 py-12 flex flex-col items-center gap-3">
            <Music size={28} className="text-text-muted/50" />
            <p className="text-text-muted text-xs text-center leading-relaxed">
              Search for songs to get started
            </p>
            <button
              onClick={() => navigate('/search')}
              className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-xs font-medium active:scale-95 transition-transform"
            >
              Start Exploring
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
