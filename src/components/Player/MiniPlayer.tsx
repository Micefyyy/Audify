import { Play, Pause, SkipForward } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { motion } from 'framer-motion';
import { useHaptics } from '../../hooks/useHaptics';

export default function MiniPlayer() {
  const { currentTrack, isPlaying, progress, error, pause, resume, skipNext } = usePlayerStore();
  const haptics = useHaptics();
  if (!currentTrack) return null;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.impact();
    isPlaying ? pause() : resume();
  };

  return (
    <div className="relative bg-bg-elevated rounded-xl overflow-hidden shadow-subtle">
      <div className="absolute top-0 left-0 h-[2px] bg-white/[0.04] w-full">
        <motion.div
          className="h-full bg-accent/60"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.25, ease: 'linear' }}
        />
      </div>

      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <motion.img
          src={currentTrack.artwork}
          alt={currentTrack.album}
          layoutId="track-artwork"
          className="w-9 h-9 rounded-md object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-sm font-medium truncate">{currentTrack.title}</p>
          <p className="text-text-secondary text-[11px] truncate">
            {error || currentTrack.artist}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handlePlayPause}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-primary hover:bg-white/[0.04] active:scale-90 transition-all"
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); skipNext(); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-white/[0.04] active:scale-90 transition-all"
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
