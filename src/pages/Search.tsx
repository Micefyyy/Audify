import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, ListPlus } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { searchTracks, preresolveTracks } from '../services/audioService';
import { useHaptics } from '../hooks/useHaptics';
import type { Track } from '../store/playerStore';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TrackRow({ track, onPlay }: { track: Track; onPlay: () => void }) {
  const haptics = useHaptics();
  const navigate = useNavigate();
  const addToQueue = usePlayerStore(s => s.addToQueue);
  return (
    <div className="group flex items-center gap-3 px-5 py-2 hover:bg-white/[0.02] transition-colors">
      <button
        onClick={() => { haptics.tap(); onPlay(); }}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <img src={track.artwork} alt={track.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-sm font-medium truncate">{track.title}</p>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/artist/${encodeURIComponent(track.artist)}`); }}
            className="text-text-secondary text-xs truncate hover:text-accent transition-colors text-left block w-full"
          >
            {track.artist}
          </button>
        </div>
        <span className="text-text-muted text-[11px] flex-shrink-0">{formatDuration(track.duration)}</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); haptics.tap(); addToQueue(track); }}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted opacity-0 group-hover:opacity-100 hover:bg-white/[0.04] active:scale-90 transition-all flex-shrink-0"
        title="Add to queue"
      >
        <ListPlus size={15} />
      </button>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-2 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-bg-surface flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 bg-bg-surface rounded w-3/4" />
        <div className="h-2 bg-bg-surface rounded w-1/3" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const queryRef = useRef(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const play = usePlayerStore(s => s.play);

  queryRef.current = query;

  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam && qParam !== query) {
      setQuery(qParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query.trim()) {
      setResults([]);
      setError(null);
      setLoading(false);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError(null);

    timerRef.current = setTimeout(async () => {
      const q = query.trim();
      try {
        const tracks = await searchTracks(q);
        if (queryRef.current === q) {
          setResults(tracks);
          setSearched(true);
          preresolveTracks(tracks);
        }
      } catch (err) {
        if (queryRef.current === q) {
          setError(err instanceof Error ? err.message : 'Search failed');
          setResults([]);
        }
      } finally {
        if (queryRef.current === q) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  function handlePlay(track: Track) {
    play(track, results);
  }

  function handleBrowse(genre: string) {
    setQuery(genre);
    setSearchParams({ q: genre });
  }

  const categories: { label: string; bg: string }[] = [
    { label: 'Hip-Hop',    bg: 'from-amber-700/40 to-amber-900/20' },
    { label: 'Lo-fi',       bg: 'from-violet-700/40 to-violet-900/20' },
    { label: 'Pop',         bg: 'from-rose-700/40 to-rose-900/20' },
    { label: 'Rock',        bg: 'from-orange-700/40 to-orange-900/20' },
    { label: 'Electronic',  bg: 'from-cyan-700/40 to-cyan-900/20' },
    { label: 'R&B',         bg: 'from-emerald-700/40 to-emerald-900/20' },
    { label: 'Indie',       bg: 'from-indigo-700/40 to-indigo-900/20' },
    { label: 'Jazz',        bg: 'from-stone-600/40 to-stone-800/20' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-14 pb-3">
        <div className="bg-bg-surface rounded-lg px-3.5 py-2.5 flex items-center gap-2.5">
          <SearchIcon size={15} className="text-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            placeholder="Search songs, artists..."
            className="bg-transparent flex-1 text-sm text-text-primary placeholder:text-text-muted outline-none"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pb-4">
        {!query.trim() && (
          <div className="px-5">
            <h2 className="text-sm font-semibold text-text-primary mb-2.5">Browse</h2>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => handleBrowse(cat.label)}
                  className={`bg-gradient-to-br ${cat.bg} rounded-lg px-3 py-3 text-left active:brightness-110 transition-all`}
                >
                  <span className="text-white/90 font-semibold text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}

        {!loading && error && (
          <div className="px-5 py-12 flex flex-col items-center gap-2">
            <p className="text-text-muted text-xs">{error}</p>
          </div>
        )}

        {!loading && !error && searched && results.length === 0 && (
          <div className="px-5 py-12 flex flex-col items-center gap-2">
            <p className="text-text-muted text-xs">No results</p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div>
            {results.map(track => (
              <TrackRow key={track.id} track={track} onPlay={() => handlePlay(track)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
