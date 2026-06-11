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
      <div className="flex items-center justify-between px-5 pt-4 pb-1 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors">
          <ChevronDown size={24} />
        </button>
        <div className="text-center">
          <p className="text-[11px] text-text-muted uppercase tracking-widest">Now Playing</p>
        </div>
        <button onClick={() => navigate('/queue')} className="text-text-secondary hover:text-text-primary transition-colors">
          <ListMusic size={20} />
        </button>
      </div>

      <div className="flex items-center justify-center px-14 py-3 flex-shrink-0" style={{ maxHeight: '30vh' }}>
        <motion.img
          key={currentTrack.id}
          src={currentTrack.artwork}
          alt={currentTrack.album}
          layoutId="track-artwork"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: isPlaying ? 1 : 0.9, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="max-w-full max-h-full rounded-xl object-cover aspect-square"
        />
      </div>

      <div className="flex items-start justify-between px-5 pt-3 pb-1 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-text-primary text-lg font-bold truncate">{currentTrack.title}</h1>
          <button
            onClick={() => navigate(`/artist/${encodeURIComponent(currentTrack.artist)}`)}
            className="text-text-secondary text-sm truncate hover:text-accent transition-colors mt-0.5"
          >
            {currentTrack.artist}
          </button>
        </div>
        <button
          onClick={handleLike}
          className={`mt-0.5 ${isLiked ? 'text-error' : 'text-text-muted hover:text-error'}`}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {error && (
        <p className="text-error text-xs text-center px-5 flex-shrink-0">{error}</p>
      )}

      <div ref={lyricsRef} className="flex-1 overflow-y-auto px-6 py-3 min-h-0 scrollbar-none">
        {lyrics.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-text-muted text-xs">No lyrics available</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {lyrics.map((line, i) => (
              <motion.p
                key={i}
                data-idx={i}
                animate={{ opacity: i === activeIdx ? 1 : 0.15, scale: i === activeIdx ? 1 : 0.95 }}
                transition={{ duration: 0.25 }}
                className={`text-center text-lg font-bold leading-relaxed cursor-pointer ${
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

      <div className="px-5 pt-1 pb-1 flex-shrink-0">
        <div
          className="relative h-[3px] bg-white/[0.06] rounded-full cursor-pointer"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            seek((e.clientX - rect.left) / rect.width);
          }}
        >
          <motion.div
            className="absolute left-0 top-0 h-full bg-accent/70 rounded-full"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.2, ease: 'linear' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-text-muted">
            {fmt(progress * currentTrack.duration)}
          </span>
          <span className="text-[10px] text-text-muted">
            {fmt(currentTrack.duration)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 pt-1 pb-8 flex-shrink-0">
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggleShuffle}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              shuffle ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Shuffle size={18} />
          </button>
          <button
            onClick={toggleSmartShuffle}
            className={`relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              smartShuffle ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
            }`}
            title="Smart shuffle"
          >
            <Sparkles size={14} />
            {smartShuffle && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
            )}
          </button>
        </div>
        <button onClick={skipPrev} className="w-9 h-9 flex items-center justify-center text-text-primary hover:bg-white/[0.04] rounded-lg active:scale-90 transition-all">
          <SkipBack size={22} fill="currentColor" />
        </button>
        <button
          onClick={handlePlayPause}
          className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center active:scale-90 transition-transform"
        >
          {isPlaying
            ? <Pause size={24} fill="white" color="white" />
            : <Play size={24} fill="white" color="white" className="ml-0.5" />}
        </button>
        <button onClick={skipNext} className="w-9 h-9 flex items-center justify-center text-text-primary hover:bg-white/[0.04] rounded-lg active:scale-90 transition-all">
          <SkipForward size={22} fill="currentColor" />
        </button>
        <button
          onClick={cycleRepeat}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
            repeat !== 'none' ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <RepeatIcon size={18} />
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
