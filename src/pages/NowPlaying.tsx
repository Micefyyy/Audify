import { useNavigate } from 'react-router-dom';
import { ChevronDown, Heart, MoreHorizontal, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Mic2 } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { motion } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';

export default function NowPlayingPage() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const {
    currentTrack, isPlaying, progress,
    pause, resume, seek, skipNext, skipPrev,
    shuffle, repeat, toggleShuffle, cycleRepeat,
    volume, setVolume,
  } = usePlayerStore();
  const { likedSongs, addLike, removeLike } = useLibraryStore();

  if (!currentTrack) { navigate('/'); return null; }

  const isLiked = likedSongs.some(s => s.id === currentTrack.id);

  const handleLike = () => {
    if (isLiked) {
      removeLike(currentTrack.id);
      haptics.tap();
    } else {
      addLike(currentTrack);
      haptics.success();
    }
  };

  const handlePlayPause = () => {
    haptics.impact();
    isPlaying ? pause() : resume();
  };

  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  return (
    <motion.div
      onPanEnd={(_, info) => {
        if (info.offset.y > 80) navigate(-1);
      }}
      className="flex flex-col h-full bg-bg-base safe-top safe-bottom overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at top, rgba(108,99,255,0.15) 0%, #0A0A0A 60%)`,
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="text-text-secondary active:text-text-primary">
          <ChevronDown size={26} />
        </button>
        <div className="text-center">
          <p className="text-xs text-text-secondary uppercase tracking-widest">Now Playing</p>
        </div>
        <button className="text-text-secondary active:text-text-primary">
          <MoreHorizontal size={22} />
        </button>
      </div>

      {/* Artwork */}
      <div className="flex-1 flex items-center justify-center px-10">
        <motion.img
          key={currentTrack.id}
          src={currentTrack.artwork}
          alt={currentTrack.album}
          layoutId="track-artwork"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: isPlaying ? 1 : 0.88, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-full aspect-square rounded-3xl object-cover shadow-glow"
        />
      </div>

      {/* Meta */}
      <div className="px-8 pt-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h1 className="text-text-primary text-xl font-bold truncate">{currentTrack.title}</h1>
            <p className="text-text-secondary text-sm mt-0.5">{currentTrack.artist}</p>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleLike}
              className={isLiked ? 'text-error' : 'text-text-muted active:text-error'}
            >
              <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => navigate('/lyrics')}
              className="text-text-muted active:text-accent"
            >
              <Mic2 size={20} />
            </button>
          </div>
        </div>

        {/* Scrubber */}
        <div className="mt-5">
          <div
            className="relative h-1 bg-white/10 rounded-full cursor-pointer"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek((e.clientX - rect.left) / rect.width);
            }}
          >
            <motion.div
              className="absolute left-0 top-0 h-full bg-accent rounded-full"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.2, ease: 'linear' }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-text-muted">
              {fmt(progress * currentTrack.duration)}
            </span>
            <span className="text-[11px] text-text-muted">
              {fmt(currentTrack.duration)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4 mb-6">
          <button
            onClick={toggleShuffle}
            className={shuffle ? 'text-accent' : 'text-text-muted'}
          >
            <Shuffle size={20} />
          </button>
          <button onClick={skipPrev} className="text-text-primary active:scale-90 transition-transform">
            <SkipBack size={28} fill="currentColor" />
          </button>
          <button
            onClick={handlePlayPause}
            className="w-16 h-16 bg-accent rounded-full flex items-center justify-center shadow-glow active:scale-90 transition-transform"
          >
            {isPlaying
              ? <Pause size={28} fill="white" color="white" />
              : <Play size={28} fill="white" color="white" className="ml-1" />}
          </button>
          <button onClick={skipNext} className="text-text-primary active:scale-90 transition-transform">
            <SkipForward size={28} fill="currentColor" />
          </button>
          <button
            onClick={cycleRepeat}
            className={repeat !== 'none' ? 'text-accent' : 'text-text-muted'}
          >
            <RepeatIcon size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
