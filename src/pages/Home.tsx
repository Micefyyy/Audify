import { useNavigate } from 'react-router-dom';
import { Music, Play, Clock, TrendingUp, Grid3X3 } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useHaptics } from '../hooks/useHaptics';

const greetings = ['Good morning', 'Good afternoon', 'Good evening'];
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return greetings[0];
  if (h < 17) return greetings[1];
  return greetings[2];
}

const categories: { label: string; bg: string }[] = [
  { label: 'Hip-Hop',    bg: 'bg-amber-800' },
  { label: 'Lo-fi',       bg: 'bg-violet-800' },
  { label: 'Pop',         bg: 'bg-rose-800' },
  { label: 'Rock',        bg: 'bg-orange-800' },
  { label: 'Electronic',  bg: 'bg-cyan-800' },
  { label: 'R&B',         bg: 'bg-emerald-800' },
  { label: 'Indie',       bg: 'bg-indigo-800' },
  { label: 'Jazz',        bg: 'bg-stone-700' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { currentTrack, isPlaying, recentlyPlayed, pause, resume } = usePlayerStore();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto overscroll-none pb-4">
        {/* Header */}
        <div className="px-6 pt-14 pb-2">
          <h1 className="text-2xl font-bold text-text-primary">{greeting()}</h1>
          <p className="text-text-secondary text-sm mt-0.5">Welcome back</p>
        </div>

        {/* Now Playing banner */}
        {currentTrack && (
          <div className="px-6 mb-4">
            <button
              onClick={() => navigate('/now-playing')}
              className="w-full flex items-center gap-3 bg-bg-surface rounded-2xl p-3 border border-white/5 active:scale-[0.99] transition-transform"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <img src={currentTrack.artwork} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  {isPlaying ? (
                    <div className="flex items-end gap-0.5 h-4">
                      <span className="w-0.5 bg-accent rounded-full animate-bounce" style={{ height: '60%', animationDelay: '0ms' }} />
                      <span className="w-0.5 bg-accent rounded-full animate-bounce" style={{ height: '100%', animationDelay: '150ms' }} />
                      <span className="w-0.5 bg-accent rounded-full animate-bounce" style={{ height: '40%', animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <Play size={14} fill="white" color="white" className="ml-0.5" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-text-primary text-sm font-semibold truncate">{currentTrack.title}</p>
                <p className="text-text-secondary text-xs truncate">{currentTrack.artist}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); haptics.impact(); isPlaying ? pause() : resume(); }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-accent text-white active:scale-90 transition-transform flex-shrink-0"
              >
                <Play size={14} fill="white" className={isPlaying ? 'hidden' : 'ml-0.5'} />
                <Music size={14} className={isPlaying ? '' : 'hidden'} />
              </button>
            </button>
          </div>
        )}

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between px-6 mb-2">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-text-muted" />
                <h2 className="text-sm font-semibold text-text-primary">Recently Played</h2>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto overscroll-x-contain px-6 pb-1 scrollbar-none">
              {recentlyPlayed.map(track => (
                <button
                  key={track.id}
                  onClick={() => { haptics.tap(); usePlayerStore.getState().play(track, recentlyPlayed); }}
                  className="flex-shrink-0 w-32"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-bg-surface mb-1.5">
                    <img src={track.artwork} alt="" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-text-primary text-xs font-medium truncate">{track.title}</p>
                  <p className="text-text-muted text-[10px] truncate">{track.artist}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Browse by Genre */}
        <div className="px-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Grid3X3 size={15} className="text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">Browse by Genre</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(cat => (
              <button
                key={cat.label}
                onClick={() => { haptics.tap(); navigate(`/search?q=${cat.label}`); }}
                className={`${cat.bg} rounded-xl px-3 py-3.5 text-left active:brightness-110 transition-all`}
              >
                <span className="text-white font-bold text-xs">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick tip for new users */}
        {recentlyPlayed.length === 0 && (
          <div className="px-6 py-8 flex flex-col items-center gap-3">
            <Music size={36} className="text-text-muted" />
            <p className="text-text-muted text-xs text-center">
              Search for songs to get started<br />and they'll appear here.
            </p>
            <button
              onClick={() => navigate('/search')}
              className="px-5 py-2 bg-accent rounded-full text-white text-xs font-medium active:scale-95 transition-transform"
            >
              Start Exploring
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
