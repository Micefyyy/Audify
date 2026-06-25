import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Shuffle, Heart, Music } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { getAlbumTracks } from '../services/audioService';
import { useHaptics } from '../hooks/useHaptics';
import type { Track } from '../store/playerStore';
import type { Album } from '../store/libraryStore';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTotalDuration(tracks: Track[]): string {
  const total = tracks.reduce((acc, t) => acc + t.duration, 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export default function AlbumPage() {
  const { encodedUrl } = useParams<{ encodedUrl: string }>();
  const navigate = useNavigate();
  const haptics = useHaptics();

  const play = usePlayerStore(s => s.play);
  const { addAlbumLike, removeAlbumLike, isAlbumLiked } = useLibraryStore();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const albumUrl = useMemo(() => {
    if (!encodedUrl) return '';
    try {
      return atob(encodedUrl);
    } catch {
      return '';
    }
  }, [encodedUrl]);

  const albumTitle = useMemo(() => {
    if (tracks.length > 0) return tracks[0].album || 'Unknown Album';
    return 'Album';
  }, [tracks]);

  const artistName = useMemo(() => {
    if (tracks.length > 0) return tracks[0].artist || 'Unknown Artist';
    return '';
  }, [tracks]);

  const artwork = useMemo(() => {
    if (tracks.length > 0) return tracks[0].artwork || '';
    return '';
  }, [tracks]);

  const albumId = useMemo(() => {
    return `album-${albumUrl}`;
  }, [albumUrl]);

  const liked = isAlbumLiked(albumId);

  useEffect(() => {
    if (!albumUrl) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getAlbumTracks(albumUrl)
      .then(results => {
        setTracks(results);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [albumUrl]);

  function handlePlayAll() {
    if (tracks.length === 0) return;
    haptics.impact();
    play(tracks[0], tracks);
  }

  function handleShuffle() {
    if (tracks.length === 0) return;
    haptics.impact();
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    play(shuffled[0], shuffled);
  }

  function handlePlayTrack(track: Track) {
    haptics.tap();
    play(track, tracks);
  }

  function handleToggleLike() {
    haptics.impact();
    if (liked) {
      removeAlbumLike(albumId);
    } else {
      addAlbumLike({
        id: albumId,
        title: albumTitle,
        artist: artistName,
        artwork,
        tracks,
      });
    }
  }

  function handleNavigateArtist() {
    if (artistName) {
      navigate(`/artist/${encodeURIComponent(artistName)}`);
    }
  }

  return (
    <div className="flex flex-col h-full bg-bg-base overflow-y-auto overscroll-none pb-8">
      <div className="flex items-center gap-3 px-5 pt-14 pb-2 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-primary hover:bg-white/[0.04] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      {loading ? (
        <div className="px-5 pb-6">
          <div className="w-full aspect-square max-w-[260px] mx-auto rounded-xl bg-bg-elevated animate-pulse mb-4" />
          <div className="h-6 bg-bg-elevated rounded-lg w-3/4 mx-auto mb-2 animate-pulse" />
          <div className="h-4 bg-bg-elevated rounded-lg w-1/2 mx-auto mb-3 animate-pulse" />
          <div className="h-3 bg-bg-elevated rounded-lg w-1/3 mx-auto mb-4 animate-pulse" />
          <div className="flex items-center justify-center gap-3">
            <div className="h-9 w-24 bg-bg-elevated rounded-lg animate-pulse" />
            <div className="h-9 w-20 bg-bg-elevated rounded-lg animate-pulse" />
          </div>
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-5 h-4 bg-bg-surface rounded" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 bg-bg-surface rounded w-3/4" />
                  <div className="h-2 bg-bg-surface rounded w-1/4" />
                </div>
                <div className="w-8 h-3 bg-bg-surface rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : tracks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6">
          <Music size={32} className="text-text-muted" />
          <p className="text-text-muted text-sm text-center">No tracks found for this album</p>
          <button
            onClick={() => navigate(-1)}
            className="text-accent text-sm font-medium active:opacity-70"
          >
            Go back
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center px-5 pb-5 flex-shrink-0">
            <div className="w-full max-w-[260px] aspect-square rounded-xl bg-bg-elevated overflow-hidden mb-4 shadow-lg">
              <img
                src={artwork}
                alt={albumTitle}
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="text-xl font-bold text-text-primary text-center line-clamp-2">
              {albumTitle}
            </h1>

            <button
              onClick={handleNavigateArtist}
              className="text-accent text-sm font-medium mt-1 active:opacity-70"
            >
              {artistName}
            </button>

            {tracks[0]?.album && (
              <p className="text-text-muted text-xs mt-0.5">{tracks[0].album}</p>
            )}

            <button
              onClick={handleToggleLike}
              className="w-9 h-9 flex items-center justify-center rounded-full mt-3 active:scale-90 transition-transform"
            >
              <Heart
                size={20}
                className={liked ? 'text-accent fill-accent' : 'text-text-muted'}
              />
            </button>

            <p className="text-text-muted text-xs mt-2">
              {tracks.length} track{tracks.length !== 1 ? 's' : ''} · {formatTotalDuration(tracks)}
            </p>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleShuffle}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-bg-surface text-text-secondary text-xs font-medium active:scale-95 transition-transform"
              >
                <Shuffle size={13} />
                Shuffle
              </button>
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-accent text-white text-xs font-medium active:scale-95 transition-transform"
              >
                <Play size={13} fill="currentColor" />
                Play All
              </button>
            </div>
          </div>

          <div className="flex-1">
            {tracks.map((track, i) => (
              <div
                key={track.id}
                className="group flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.02] transition-colors"
              >
                <button
                  onClick={() => handlePlayTrack(track)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <span className="text-text-muted text-xs w-5 text-right flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">
                      {track.title}
                    </p>
                    <p className="text-text-secondary text-xs truncate">{track.artist}</p>
                  </div>
                  <span className="text-text-muted text-[11px] flex-shrink-0">
                    {formatDuration(track.duration)}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
