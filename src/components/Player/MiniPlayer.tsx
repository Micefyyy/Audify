import { Play, Pause, SkipForward } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { motion } from 'framer-motion';
import { useHaptics } from '../../hooks/useHaptics';

export default function MiniPlayer() {
  const { currentTrack, isPlaying, progress, pause, resume, skipNext } = usePlayerStore();
  const haptics = useHaptics();
  if (!currentTrack) return null;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.impact();
    isPlaying ? pause() : resume();
  };

  return (
    <div className="relative bg-bg-elevated rounded-2xl overflow-hidden shadow-card border border-white/5">
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-accent/30 w-full">
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.25, ease: 'linear' }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <motion.img
          src={currentTrack.artwork}
          alt={currentTrack.album}
          layoutId="track-artwork"
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-sm font-semibold truncate">{currentTrack.title}</p>
          <p className="text-text-secondary text-xs truncate">{currentTrack.artist}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePlayPause}
            className="w-9 h-9 flex items-center justify-center rounded-full text-text-primary active:scale-90 transition-transform"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); skipNext(); }}
            className="w-9 h-9 flex items-center justify-center rounded-full text-text-secondary active:scale-90 transition-transform"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
