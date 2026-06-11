import { useNavigate } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import { ChevronDown, Heart, ListMusic, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Sparkles } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { motion } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';

export default function NowPlayingPage() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const lyricsRef = useRef<HTMLDivElement>(null);
  const {
    currentTrack, isPlaying, progress, error,
    pause, resume, seek, skipNext, skipPrev,
    shuffle, smartShuffle, repeat, toggleShuffle, toggleSmartShuffle, cycleRepeat,
  } = usePlayerStore();
  const { likedSongs, addLike, removeLike } = useLibraryStore();

  if (!currentTrack) { navigate('/'); return null; }

  const isLiked = likedSongs.some(s => s.id === currentTrack.id);
  const lyrics = currentTrack.lyrics ?? [];
  const elapsed = progress * currentTrack.duration;
  const activeIdx = lyrics.reduce((acc, line, i) => (line.time <= elapsed ? i : acc), -1);

  useEffect(() => {
    const el = lyricsRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIdx]);

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
      <div className="flex items-center justify-between px-6 pt-4 pb-2 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="text-text-secondary active:text-text-primary">
          <ChevronDown size={26} />
        </button>
        <div className="text-center">
          <p className="text-xs text-text-secondary uppercase tracking-widest">Now Playing</p>
        </div>
        <button onClick={() => navigate('/queue')} className="text-text-secondary active:text-text-primary">
          <ListMusic size={22} />
        </button>
      </div>

      {/* Artwork */}
      <div className="flex items-center justify-center px-16 py-2 flex-shrink-0" style={{ maxHeight: '32vh' }}>
        <motion.img
          key={currentTrack.id}
          src={currentTrack.artwork}
          alt={currentTrack.album}
          layoutId="track-artwork"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: isPlaying ? 1 : 0.88, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="max-w-full max-h-full rounded-3xl object-cover shadow-glow aspect-square"
        />
      </div>

      {/* Title + Artist */}
      <div className="flex items-start justify-between px-8 pt-4 pb-2 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-text-primary text-xl font-bold truncate">{currentTrack.title}</h1>
          <p className="text-text-secondary text-sm mt-0.5">{currentTrack.artist}</p>
        </div>
        <button
          onClick={handleLike}
          className={`mt-1 ${isLiked ? 'text-error' : 'text-text-muted active:text-error'}`}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-error text-xs text-center px-8 flex-shrink-0">{error}</p>
      )}

      {/* Synced lyrics */}
      <div ref={lyricsRef} className="flex-1 overflow-y-auto px-8 py-4 min-h-0 scrollbar-none">
        {lyrics.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-text-muted text-xs">No lyrics available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lyrics.map((line, i) => (
              <motion.p
                key={i}
                data-idx={i}
                animate={{ opacity: i === activeIdx ? 1 : 0.2, scale: i === activeIdx ? 1 : 0.95 }}
                transition={{ duration: 0.25 }}
                className={`text-center text-xl font-bold leading-relaxed transition-colors cursor-pointer ${
                  i === activeIdx ? 'text-text-primary' : 'text-text-secondary'
                }`}
                onClick={() => seek(line.time / currentTrack.duration)}
              >
                {line.text || <span className="inline-block h-4" />}
              </motion.p>
            ))}
          </div>
        )}
      </div>

      {/* Scrubber */}
      <div className="px-8 pt-2 pb-1 flex-shrink-0">
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
      <div className="flex items-center justify-between px-8 pt-2 pb-6 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={toggleShuffle}
            className={shuffle ? 'text-accent' : 'text-text-muted'}
          >
            <Shuffle size={20} />
          </button>
          <button
            onClick={toggleSmartShuffle}
            className={`relative ${smartShuffle ? 'text-accent' : 'text-text-muted'}`}
            title="Smart shuffle"
          >
            <Sparkles size={16} />
            {smartShuffle && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-accent rounded-full" />
            )}
          </button>
        </div>
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
    </motion.div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
