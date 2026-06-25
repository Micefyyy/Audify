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
    <div className="flex flex-col h-full bg-bg-base safe-top safe-bottom overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-colors"
        >
          <ChevronDown size={26} strokeWidth={2.5} />
        </button>
        <p className="text-[11px] text-text-muted uppercase tracking-widest font-medium">Now Playing</p>
        <button
          onClick={() => navigate('/queue')}
          className="w-10 h-10 flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-white/[0.06] transition-colors"
        >
          <ListMusic size={22} />
        </button>
      </div>

      {/* Artwork */}
      <div className="flex items-center justify-center px-10 py-2 flex-shrink-0" style={{ maxHeight: '40vh' }}>
        <motion.img
          key={currentTrack.id}
          src={currentTrack.artwork}
          alt={currentTrack.album}
          layoutId="track-artwork"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: isPlaying ? 1 : 0.92, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          className="w-full max-h-full rounded-2xl object-cover aspect-square shadow-2xl shadow-black/40"
        />
      </div>

      {/* Track info + Like */}
      <div className="flex items-start justify-between px-6 pt-4 pb-1 flex-shrink-0">
        <div className="min-w-0 flex-1 mr-3">
          <h1 className="text-text-primary text-lg font-bold truncate leading-tight">{currentTrack.title}</h1>
          <button
            onClick={() => navigate(`/artist/${encodeURIComponent(currentTrack.artist)}`)}
            className="text-text-secondary text-sm truncate hover:text-accent transition-colors mt-0.5"
          >
            {currentTrack.artist}
          </button>
        </div>
        <button
          onClick={handleLike}
          className={`mt-1 flex-shrink-0 ${isLiked ? 'text-error' : 'text-text-muted hover:text-error'} transition-colors`}
        >
          <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-error text-xs text-center px-6 flex-shrink-0">{error}</p>
      )}

      {/* Lyrics */}
      <div ref={lyricsRef} className="flex-1 overflow-y-auto px-6 py-3 min-h-0 scrollbar-none">
        {lyrics.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-text-muted text-sm">No lyrics available</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {lyrics.map((line, i) => (
              <motion.p
                key={i}
                data-idx={i}
                animate={{
                  opacity: i === activeIdx ? 1 : 0.2,
                  scale: i === activeIdx ? 1 : 0.96,
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`text-center text-lg font-bold leading-relaxed cursor-pointer transition-colors ${
                  i === activeIdx ? 'text-text-primary' : 'text-text-secondary'
                }`}
                onClick={() => seek(line.time / currentTrack.duration)}
              >
                {line.text || <span className="inline-block h-3" />}
              </motion.p>
            ))}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-1 pb-1 flex-shrink-0">
        <div
          className="relative h-[3px] bg-white/[0.06] rounded-full cursor-pointer group"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            seek((e.clientX - rect.left) / rect.width);
          }}
        >
          <motion.div
            className="absolute left-0 top-0 h-full bg-accent rounded-full"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.15, ease: 'linear' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            style={{ left: `calc(${progress * 100}% - 6px)` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-text-muted tabular-nums">{fmt(elapsed)}</span>
          <span className="text-[11px] text-text-muted tabular-nums">{fmt(currentTrack.duration)}</span>
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-4 px-5 pt-2 pb-8 flex-shrink-0">
        <button
          onClick={toggleShuffle}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
            shuffle ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Shuffle size={20} />
        </button>
        <button
          onClick={toggleSmartShuffle}
          className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
            smartShuffle ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
          }`}
          title="Smart shuffle"
        >
          <Sparkles size={16} />
          {smartShuffle && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
          )}
        </button>
        <button
          onClick={skipPrev}
          className="w-11 h-11 flex items-center justify-center text-text-primary hover:bg-white/[0.04] rounded-xl active:scale-90 transition-all"
        >
          <SkipBack size={24} fill="currentColor" />
        </button>
        <button
          onClick={handlePlayPause}
          className="w-16 h-16 bg-accent rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-accent/25"
        >
          {isPlaying
            ? <Pause size={28} fill="white" color="white" />
            : <Play size={28} fill="white" color="white" className="ml-0.5" />}
        </button>
        <button
          onClick={skipNext}
          className="w-11 h-11 flex items-center justify-center text-text-primary hover:bg-white/[0.04] rounded-xl active:scale-90 transition-all"
        >
          <SkipForward size={24} fill="currentColor" />
        </button>
        <button
          onClick={cycleRepeat}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
            repeat !== 'none' ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <RepeatIcon size={20} />
        </button>
      </div>
    </div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
