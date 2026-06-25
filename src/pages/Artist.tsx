import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Heart, Music, Disc3, Users } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { getArtistInfo, getSimilarArtists } from '../services/audioService';
import { useHaptics } from '../hooks/useHaptics';
import type { Track } from '../store/playerStore';
import type { Album, Artist as ArtistType } from '../store/libraryStore';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ArtistPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const haptics = useHaptics();

  const [artist, setArtist] = useState<ArtistType | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [similarArtists, setSimilarArtists] = useState<ArtistType[]>([]);
  const [loading, setLoading] = useState(true);

  const play = usePlayerStore(s => s.play);
  const { addArtistLike, removeArtistLike, isArtistLiked } = useLibraryStore();

  const artistName = name ? decodeURIComponent(name) : '';
  const liked = artist ? isArtistLiked(artist.id) : false;

  useEffect(() => {
    if (!artistName) return;
    setLoading(true);
    setArtist(null);
    setTracks([]);
    setAlbums([]);
    setSimilarArtists([]);

    Promise.all([
      getArtistInfo(artistName),
      getSimilarArtists(artistName),
    ]).then(([info, similar]) => {
      setArtist(info.artist);
      setTracks(info.tracks);
      setAlbums(info.albums);
      setSimilarArtists(similar);
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

  function handleToggleLike() {
    if (!artist) return;
    haptics.tap();
    if (liked) {
      removeArtistLike(artist.id);
    } else {
      addArtistLike(artist);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto overscroll-none pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-1 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-primary hover:bg-white/[0.04] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* Artist Header */}
      <div className="flex flex-col items-center px-5 pb-4 flex-shrink-0">
        <div className="w-28 h-28 rounded-full bg-bg-elevated flex items-center justify-center mb-3 overflow-hidden">
          {artist?.thumbnail ? (
            <img src={artist.thumbnail} alt={artistName} className="w-full h-full object-cover" />
          ) : tracks.length > 0 ? (
            <img src={tracks[0].artwork} alt={artistName} className="w-full h-full object-cover" />
          ) : (
            <Music size={32} className="text-text-muted" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-text-primary text-center">{artistName}</h1>
        <p className="text-text-muted text-xs mt-0.5">Artist</p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleToggleLike}
            className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center transition-colors"
          >
            <Heart
              size={18}
              className={liked ? 'text-accent fill-accent' : 'text-text-secondary'}
            />
          </button>
          {tracks.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-semibold active:scale-95 transition-transform"
            >
              <Play size={16} fill="white" className="ml-0.5" />
              Play All
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-text-muted text-xs">
          <span>{tracks.length} tracks</span>
          <span>{albums.length} albums</span>
        </div>
      </div>

      {loading ? (
        <div className="px-5 space-y-6">
          {/* Loading skeleton for sections */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-bg-surface rounded w-24 animate-pulse" />
              <div className="flex gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="w-20 h-20 rounded-lg bg-bg-surface animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6 px-5">
          {/* About Section */}
          <section>
            <h2 className="text-sm font-semibold text-text-primary mb-2">About</h2>
            <div className="bg-bg-surface rounded-xl p-3">
              {artist?.bio ? (
                <p className="text-text-secondary text-xs leading-relaxed">{artist.bio}</p>
              ) : (
                <p className="text-text-muted text-xs">No biography available</p>
              )}
            </div>
          </section>

          {/* Discography Section */}
          {albums.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-primary mb-2">Discography</h2>
              <div className="flex gap-3 overflow-x-auto overscroll-none pb-1 -mx-5 px-5">
                {albums.map(album => (
                  <button
                    key={album.id}
                    onClick={() => {
                      haptics.tap();
                      navigate(`/album/${btoa(album.id)}`);
                    }}
                    className="flex-shrink-0 w-32 text-left"
                  >
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-bg-elevated mb-1.5">
                      {album.artwork ? (
                        <img src={album.artwork} alt={album.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Disc3 size={24} className="text-text-muted" />
                        </div>
                      )}
                    </div>
                    <p className="text-text-primary text-xs font-medium truncate">{album.title}</p>
                    {album.year && (
                      <p className="text-text-muted text-[10px]">{album.year}</p>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Similar Artists Section */}
          {similarArtists.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-primary mb-2">Similar Artists</h2>
              <div className="flex gap-3 overflow-x-auto overscroll-none pb-1 -mx-5 px-5">
                {similarArtists.map(sa => (
                  <button
                    key={sa.id}
                    onClick={() => {
                      haptics.tap();
                      navigate(`/artist/${encodeURIComponent(sa.name)}`);
                    }}
                    className="flex-shrink-0 w-24 text-center"
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-bg-elevated mb-1.5">
                      {sa.thumbnail ? (
                        <img src={sa.thumbnail} alt={sa.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users size={20} className="text-text-muted" />
                        </div>
                      )}
                    </div>
                    <p className="text-text-primary text-[11px] font-medium truncate">{sa.name}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Top Tracks Section */}
          <section>
            <h2 className="text-sm font-semibold text-text-primary mb-2">Top Tracks</h2>
            {tracks.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <Music size={22} className="text-text-muted/50" />
                <p className="text-text-muted text-xs text-center">No tracks found</p>
              </div>
            ) : (
              <div>
                {tracks.map((track, i) => (
                  <div key={track.id} className="group flex items-center gap-3 py-2 hover:bg-white/[0.02] transition-colors">
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
          </section>
        </div>
      )}
    </div>
  );
}
