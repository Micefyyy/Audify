import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Music } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { getArtistTracks } from '../services/audioService';
import { useHaptics } from '../hooks/useHaptics';
import type { Track } from '../store/playerStore';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ArtistPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const play = usePlayerStore(s => s.play);

  const artistName = name ? decodeURIComponent(name) : '';

  useEffect(() => {
    if (!artistName) return;
    setLoading(true);
    getArtistTracks(artistName).then(results => {
      setTracks(results);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [artistName]);

  function handlePlayAll() {
    if (tracks.length === 0) return;
    haptics.impact();
    play(tracks[0], tracks);
  }

  function handlePlayTrack(track: Track) {
    haptics.tap();
    play(track, tracks);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-14 pb-1 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-primary hover:bg-white/[0.04] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center px-5 pb-4 flex-shrink-0">
        <div className="w-24 h-24 rounded-full bg-bg-elevated flex items-center justify-center mb-3 overflow-hidden">
          {tracks.length > 0 ? (
            <img src={tracks[0].artwork} alt={artistName} className="w-full h-full object-cover" />
          ) : (
            <Music size={28} className="text-text-muted" />
          )}
        </div>
        <h1 className="text-xl font-bold text-text-primary text-center">{artistName}</h1>
        <p className="text-text-muted text-xs mt-0.5">Artist</p>
        {tracks.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center active:scale-90 transition-transform mt-3"
          >
            <Play size={16} fill="white" className="ml-0.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-1 flex-shrink-0">
        <h2 className="text-sm font-semibold text-text-primary">Top tracks</h2>
        <span className="text-text-muted text-xs">{tracks.length} tracks</span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pb-4">
        {loading ? (
          <div className="px-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-bg-surface flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 bg-bg-surface rounded w-3/4" />
                  <div className="h-2 bg-bg-surface rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-2 px-5">
            <Music size={22} className="text-text-muted/50" />
            <p className="text-text-muted text-xs text-center">No tracks found</p>
          </div>
        ) : (
          <div>
            {tracks.map((track, i) => (
              <div key={track.id} className="group flex items-center gap-3 px-5 py-2 hover:bg-white/[0.02] transition-colors">
                <button
                  onClick={() => handlePlayTrack(track)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <span className="text-text-muted text-xs w-5 text-right flex-shrink-0">{i + 1}</span>
                  <img src={track.artwork} alt="" className="w-9 h-9 rounded-md object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">{track.title}</p>
                    <p className="text-text-secondary text-xs truncate">{track.artist}</p>
                  </div>
                  <span className="text-text-muted text-[11px] flex-shrink-0">{formatDuration(track.duration)}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
