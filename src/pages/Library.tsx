import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Music, Heart, Download, Check, X } from 'lucide-react';
import type { Track } from '../store/playerStore';
import type { Playlist } from '../store/libraryStore';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { useHaptics } from '../hooks/useHaptics';

// ── Shared components ───────────────────────────────────────────────────────

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

function PlaylistCard({ playlist, onTap }: { playlist: Playlist; onTap: () => void }) {
  const cells = playlist.tracks.slice(0, 4);

  return (
    <button
      onClick={onTap}
      className="bg-bg-surface rounded-2xl overflow-hidden border border-white/5 active:scale-[0.98] transition-transform"
    >
      <div className="aspect-square grid grid-cols-2 gap-px">
        {cells.length === 0 ? (
          <div className="col-span-2 bg-bg-overlay flex items-center justify-center">
            <Music size={28} className="text-text-muted" />
          </div>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cells[i] ? '' : 'bg-bg-overlay'}>
              {cells[i] && (
                <img src={cells[i].artwork} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          ))
        )}
      </div>
      <div className="p-3 text-left">
        <p className="text-text-primary text-sm font-semibold truncate">{playlist.name}</p>
        <p className="text-text-muted text-xs mt-0.5">{playlist.tracks.length} tracks</p>
      </div>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const tabs = [
  { key: 'playlists', label: 'Playlists', icon: Music },
  { key: 'liked', label: 'Liked', icon: Heart },
  { key: 'downloads', label: 'Downloads', icon: Download },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export default function LibraryPage() {
  const [tab, setTab] = useState<TabKey>('playlists');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();

  const { likedSongs, playlists, createPlaylist } = useLibraryStore();
  const play = usePlayerStore(s => s.play);

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    createPlaylist(name);
    setNewName('');
    setCreating(false);
  }

  function handleCancelCreate() {
    setNewName('');
    setCreating(false);
  }

  function handlePlayLiked(track: Track) {
    play(track, likedSongs);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Your Library</h1>

        {/* Pill tabs */}
        <div className="flex gap-2">
          {tabs.map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? 'bg-accent text-white'
                    : 'bg-bg-surface text-text-secondary active:bg-bg-elevated'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-none pb-4 relative">
        {/* ── Playlists tab ──────────────────────────────────────────────── */}
        {tab === 'playlists' && (
          <div className="px-6 pb-20">
            <div className="grid grid-cols-2 gap-3">
              {playlists.map(p => (
                <PlaylistCard
                  key={p.id}
                  playlist={p}
                  onTap={() => navigate(`/library/${p.id}`)}
                />
              ))}
            </div>

            {playlists.length === 0 && !creating && (
              <div className="py-16 flex flex-col items-center gap-2">
                <Music size={32} className="text-text-muted" />
                <p className="text-text-muted text-sm">
                  No playlists yet
                </p>
              </div>
            )}

            {/* Inline create playlist */}
            {creating && (
              <div className="mt-4 bg-bg-surface border border-white/5 rounded-2xl p-4 space-y-3">
                <input
                  placeholder="Playlist name"
                  className="w-full bg-bg-base border border-white/5 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/60 transition-colors"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') handleCancelCreate();
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancelCreate}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-text-secondary active:bg-bg-elevated transition-colors"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-accent text-white font-medium disabled:opacity-40 active:scale-[0.97] transition-all"
                  >
                    <Check size={14} />
                    Create
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Liked tab ──────────────────────────────────────────────────── */}
        {tab === 'liked' && (
          <div>
            {likedSongs.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-2">
                <Heart size={28} className="text-text-muted" />
                <p className="text-text-muted text-sm">No liked songs</p>
              </div>
            ) : (
              likedSongs.map(track => (
                <TrackRow
                  key={track.id}
                  track={track}
                  onPlay={() => handlePlayLiked(track)}
                />
              ))
            )}
          </div>
        )}

        {/* ── Downloads tab ──────────────────────────────────────────────── */}
        {tab === 'downloads' && (
          <div className="py-16 flex flex-col items-center gap-2">
            <Download size={28} className="text-text-muted" />
            <p className="text-text-muted text-sm">Coming soon</p>
          </div>
        )}
      </div>

      {/* Floating + button */}
      {tab === 'playlists' && !creating && (
        <button
          onClick={() => setCreating(true)}
          className="absolute bottom-6 right-6 w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-glow active:scale-90 transition-transform z-10"
        >
          <Plus size={22} className="text-white" />
        </button>
      )}
    </div>
  );
}
