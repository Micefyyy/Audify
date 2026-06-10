import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function LyricsPage() {
  const navigate = useNavigate();
  const { currentTrack, progress } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);

  if (!currentTrack) { navigate('/'); return null; }

  const lyrics = currentTrack.lyrics ?? [];
  const elapsed = progress * currentTrack.duration;
  const activeIdx = lyrics.reduce((acc, line, i) => (line.time <= elapsed ? i : acc), -1);

  useEffect(() => {
    const el = containerRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIdx]);

  return (
    <div className="flex flex-col h-full bg-bg-base safe-top safe-bottom"
      style={{ background: `radial-gradient(ellipse at top, rgba(108,99,255,0.12) 0%, #0A0A0A 55%)` }}
    >
      <div className="flex items-center px-6 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="text-text-secondary">
          <ChevronDown size={26} />
        </button>
        <p className="flex-1 text-center text-sm font-semibold text-text-secondary">Lyrics</p>
        <div className="w-8" />
      </div>

      {lyrics.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted text-sm">No lyrics available</p>
        </div>
      ) : (
        <div ref={containerRef} className="flex-1 overflow-y-auto px-8 py-12 space-y-6">
          {lyrics.map((line, i) => (
            <motion.p
              key={i}
              data-idx={i}
              animate={{ opacity: i === activeIdx ? 1 : 0.25, scale: i === activeIdx ? 1 : 0.95 }}
              transition={{ duration: 0.3 }}
              className={`text-2xl font-bold leading-snug cursor-pointer transition-colors ${
                i === activeIdx ? 'text-text-primary' : 'text-text-secondary'
              }`}
            >
              {line.text}
            </motion.p>
          ))}
        </div>
      )}
    </div>
  );
}
