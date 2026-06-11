import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Music } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { getArtistTracks } from '../services/audioService';
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
  return (
    <div className="group flex items-center gap-3 px-6 py-2 hover:bg-white/[0.03] transition-colors">
      <button
        onClick={() => { haptics.tap(); onPlay(); }}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <img src={track.artwork} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-sm font-medium truncate">{track.title}</p>
          <p className="text-text-secondary text-xs truncate">{track.artist}</p>
        </div>
        <span className="text-text-muted text-xs flex-shrink-0">{formatDuration(track.duration)}</span>
      </button>
    </div>
  );
}

export default function ArtistPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const play = usePlayerStore(s => s.play);
  const { currentTrack, isPlaying, pause, resume } = usePlayerStore();

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

  const isArtistPlaying = currentTrack?.artist === artistName;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-2 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-text-primary active:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0" />
      </div>

      {/* Artist hero */}
      <div className="flex flex-col items-center px-6 pb-4 flex-shrink-0">
        <div className="w-28 h-28 rounded-full bg-bg-elevated flex items-center justify-center mb-3 overflow-hidden">
          {tracks.length > 0 ? (
            <img
              src={tracks[0].artwork}
              alt={artistName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music size={36} className="text-text-muted" />
          )}
        </div>
        <h1 className="text-xl font-bold text-text-primary text-center">{artistName}</h1>
        <p className="text-text-secondary text-xs mt-0.5">Artist</p>
        {tracks.length > 0 && (
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handlePlayAll}
              className="w-10 h-10 bg-accent rounded-full flex items-center justify-center shadow-glow active:scale-90 transition-transform"
            >
              <Play size={18} fill="white" className="ml-0.5" />
            </button>
          </div>
        )}
      </div>

      {/* Top tracks */}
      <div className="flex items-center justify-between px-6 py-2 flex-shrink-0">
        <h2 className="text-sm font-semibold text-text-primary">Top tracks</h2>
        <span className="text-text-muted text-xs">{tracks.length} tracks</span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pb-4">
        {loading ? (
          <div className="space-y-1 px-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-bg-surface flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-bg-surface rounded w-3/4" />
                  <div className="h-2.5 bg-bg-surface rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-2 px-6">
            <Music size={28} className="text-text-muted" />
            <p className="text-text-muted text-xs text-center">No tracks found for this artist</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {tracks.map(track => (
              <TrackRow
                key={track.id}
                track={track}
                onPlay={() => handlePlayTrack(track)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
