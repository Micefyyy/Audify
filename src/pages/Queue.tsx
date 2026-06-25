import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ListMusic, GripVertical } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useHaptics } from '../hooks/useHaptics';
import { useState, useRef, useCallback } from 'react';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function QueuePage() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { currentTrack, queue, queueIndex, play, removeFromQueue, clearQueue, reorderQueue } = usePlayerStore();

  const upcoming = queue.slice(queueIndex + 1);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const startYRef = useRef(0);
  const dragIdxRef = useRef<number | null>(null);
  const overIdxRef = useRef<number | null>(null);
  const rowHeightRef = useRef(52);
  const upcomingRef = useRef(upcoming);
  upcomingRef.current = upcoming;

  const startDrag = useCallback((index: number, e: React.TouchEvent) => {
    e.preventDefault();
    startYRef.current = e.touches[0].clientY;
    dragIdxRef.current = index;
    overIdxRef.current = index;
    setDragIndex(index);
    setOverIndex(index);

    const onMove = (ev: TouchEvent) => {
      ev.preventDefault();
      const deltaY = ev.touches[0].clientY - startYRef.current;
      const offset = Math.round(deltaY / rowHeightRef.current);
      const len = upcomingRef.current.length;
      const target = Math.max(0, Math.min(len - 1, dragIdxRef.current! + offset));
      if (target !== overIdxRef.current) {
        overIdxRef.current = target;
        setOverIndex(target);
      }
    };

    const onEnd = () => {
      const from = dragIdxRef.current;
      const to = overIdxRef.current;
      if (from !== null && to !== null && from !== to) {
        reorderQueue(queueIndex + 1 + from, queueIndex + 1 + to);
        haptics.tap();
      }
      dragIdxRef.current = null;
      overIdxRef.current = null;
      setDragIndex(null);
      setOverIndex(null);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  }, [queueIndex, reorderQueue, haptics]);

  return (
    <div className="flex flex-col h-full safe-top">
      <div className="flex items-center gap-3 px-5 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-primary hover:bg-white/[0.04] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-text-primary flex-1">Queue</h1>
        {upcoming.length > 0 && (
          <button
            onClick={() => { haptics.impact(); clearQueue(); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-text-muted hover:bg-white/[0.04] transition-colors"
          >
            <Trash2 size={11} />
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pb-4">
        {currentTrack && (
          <div className="px-5 mb-4">
            <h2 className="text-[11px] font-semibold text-text-muted tracking-wide mb-2">Now Playing</h2>
            <div className="flex items-center gap-3 px-3 py-2.5 bg-bg-surface rounded-lg">
              <img src={currentTrack.artwork} alt={currentTrack.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">{currentTrack.title}</p>
                <p className="text-text-secondary text-xs truncate">{currentTrack.artist}</p>
              </div>
            </div>
          </div>
        )}

        <div className="px-5">
          <h2 className="text-[11px] font-semibold text-text-muted tracking-wide mb-2">
            Next Up{upcoming.length > 0 ? ` (${upcoming.length})` : ''}
          </h2>

          {upcoming.length === 0 && (
            <div className="py-12 flex flex-col items-center gap-3">
              <ListMusic size={24} className="text-text-muted/50" />
              <p className="text-text-muted text-xs text-center">Queue is empty.</p>
            </div>
          )}

          <div>
            {upcoming.map((track, i) => {
              const actualIndex = queueIndex + 1 + i;
              const isDragging = dragIndex === i;
              const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;
              return (
                <div
                  key={`${track.id}-${actualIndex}`}
                  ref={i === 0 ? (el) => { if (el) rowHeightRef.current = el.offsetHeight; } : undefined}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isDragging ? 'opacity-50 scale-95' : 'hover:bg-white/[0.02]'
                  } ${isOver ? 'border-t-2 border-accent' : ''}`}
                >
                  <div
                    className="flex items-center justify-center w-5 h-5 flex-shrink-0 text-text-muted cursor-grab active:cursor-grabbing"
                    style={{ touchAction: 'none' }}
                    onTouchStart={(e) => startDrag(i, e)}
                  >
                    <GripVertical size={14} />
                  </div>
                  <button
                    onClick={() => { haptics.tap(); play(track, queue); }}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <img src={track.artwork} alt={track.title} className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-medium truncate">{track.title}</p>
                      <p className="text-text-secondary text-xs truncate">{track.artist}</p>
                    </div>
                    <span className="text-text-muted text-[11px] flex-shrink-0">{formatDuration(track.duration)}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); haptics.tap(); removeFromQueue(actualIndex - 1); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted opacity-0 group-hover:opacity-100 hover:bg-white/[0.04] active:scale-90 transition-all flex-shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
