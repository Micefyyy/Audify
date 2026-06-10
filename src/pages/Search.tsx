import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { searchTracks } from '../services/audioService';
import { useHaptics } from '../hooks/useHaptics';
import type { Track } from '../store/playerStore';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TrackRow({ track, onPlay }: { track: Track; onPlay: () => void }) {
  const haptics = useHaptics();
  return (
    <button
      onClick={() => { haptics.tap(); onPlay(); }}
      className="flex items-center gap-3 w-full px-6 py-2 active:bg-white/5 transition-colors"
    >
      <img
        src={track.artwork}
        alt={track.title}
        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-text-primary text-sm font-medium truncate">
          {track.title}
        </p>
        <p className="text-text-secondary text-xs truncate">
          {track.artist}
        </p>
      </div>
      <span className="text-text-muted text-xs flex-shrink-0">
        {formatDuration(track.duration)}
      </span>
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 w-full px-6 py-2 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-bg-surface flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-bg-surface rounded w-3/4" />
        <div className="h-2.5 bg-bg-surface rounded w-1/2" />
      </div>
      <div className="h-3 bg-bg-surface rounded w-10 flex-shrink-0" />
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const queryRef = useRef(query);
  const play = usePlayerStore(s => s.play);

  queryRef.current = query;

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

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-14 pb-4">
        <div className="bg-bg-surface border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3">
          <SearchIcon size={16} className="text-text-muted flex-shrink-0" />
          <input
            placeholder="Songs, artists, albums…"
            className="bg-transparent flex-1 text-sm text-text-primary placeholder:text-text-muted outline-none"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pb-4">
        {!query.trim() && (
          <div className="px-6 space-y-4">
            <h2 className="text-lg font-bold text-text-primary">Browse</h2>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => handleBrowse(cat.label)}
                  className={`${cat.bg} rounded-2xl px-4 py-6 text-left active:brightness-110 transition-all`}
                >
                  <span className="text-white font-bold text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-1">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}

        {!loading && error && (
          <div className="px-6 py-12 flex flex-col items-center gap-2">
            <p className="text-text-muted text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && searched && results.length === 0 && (
          <div className="px-6 py-12 flex flex-col items-center gap-2">
            <p className="text-text-muted text-sm">No results</p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="space-y-1">
            {results.map(track => (
              <TrackRow
                key={track.id}
                track={track}
                onPlay={() => handlePlay(track)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
