import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Music, Heart, Download, Check, X, Trash2, ListPlus } from 'lucide-react';
import type { Track } from '../store/playerStore';
import type { Playlist } from '../store/libraryStore';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { useHaptics } from '../hooks/useHaptics';
import { preresolveTracks } from '../services/audioService';

// ── Shared components ───────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TrackRow({ track, onPlay, onRemove }: { track: Track; onPlay: () => void; onRemove?: () => void }) {
  const haptics = useHaptics();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const addToQueue = usePlayerStore(s => s.addToQueue);

  return (
    <div className="group flex items-center gap-3 w-full px-6 py-1.5 hover:bg-white/[0.03] transition-colors">
      <button
        onClick={() => { haptics.tap(); onPlay(); }}
        className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
      >
        <img
          src={track.artwork}
          alt={track.title}
          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
        />
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
        onClick={e => { e.stopPropagation(); haptics.tap(); addToQueue(track); }}
        className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted opacity-0 group-hover:opacity-100 active:scale-90 transition-all flex-shrink-0"
        title="Add to queue"
      >
        <ListPlus size={15} />
      </button>

      {onRemove && (confirming ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => { haptics.impact(); onRemove(); setConfirming(false); }}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-red/10 text-red active:scale-90 transition-transform"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted active:scale-90 transition-transform"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); haptics.tap(); setConfirming(true); }}
          className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted opacity-0 group-hover:opacity-100 active:scale-90 transition-all flex-shrink-0"
        >
          <Trash2 size={14} />
        </button>
      ))}
    </div>
  );
}

function PlaylistCard({ playlist, onTap }: { playlist: Playlist; onTap: () => void }) {
  const cells = playlist.tracks.slice(0, 4);

  return (
    <button
      onClick={onTap}
      className="bg-bg-surface rounded-xl overflow-hidden border border-white/5 active:scale-[0.98] transition-transform"
    >
      <div className="aspect-[4/3] grid grid-cols-2">
        {cells.length === 0 ? (
          <div className="col-span-2 bg-bg-overlay flex items-center justify-center">
            <Music size={20} className="text-text-muted" />
          </div>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${cells[i] ? '' : 'bg-bg-overlay'} overflow-hidden`}>
              {cells[i] && (
                <img src={cells[i].artwork} alt="" className="w-full h-full object-cover" loading="lazy" />
              )}
            </div>
          ))
        )}
      </div>
      <div className="p-2 text-left">
        <p className="text-text-primary text-xs font-semibold truncate">{playlist.name}</p>
        <p className="text-text-muted text-[10px] mt-0.5">{playlist.tracks.length} tracks</p>
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

  const { likedSongs, playlists, createPlaylist, removeLike } = useLibraryStore();
  const play = usePlayerStore(s => s.play);

  useEffect(() => {
    if (tab === 'liked') preresolveTracks(likedSongs);
  }, [tab, likedSongs]);

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
      <div className="px-6 pt-14 pb-3">
        <h1 className="text-xl font-bold text-text-primary mb-3">Library</h1>

        {/* Pill tabs */}
        <div className="flex gap-1.5">
          {tabs.map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? 'bg-accent text-white'
                    : 'bg-bg-surface text-text-secondary active:bg-bg-elevated'
                }`}
              >
                <t.icon size={12} />
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
            <div className="grid grid-cols-4 gap-1.5">
              {playlists.map(p => (
                <PlaylistCard
                  key={p.id}
                  playlist={p}
                  onTap={() => navigate(`/library/${p.id}`)}
                />
              ))}
            </div>

            {playlists.length === 0 && !creating && (
              <div className="py-12 flex flex-col items-center gap-2">
                <Music size={24} className="text-text-muted" />
                <p className="text-text-muted text-xs">
                  No playlists yet
                </p>
              </div>
            )}

            {/* Inline create playlist */}
            {creating && (
              <div className="mt-3 bg-bg-surface border border-white/5 rounded-xl p-3 space-y-2.5">
                <input
                  placeholder="Playlist name"
                  className="w-full bg-bg-base border border-white/5 rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-accent/60 transition-colors"
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
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-text-secondary active:bg-bg-elevated transition-colors"
                  >
                    <X size={12} />
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs bg-accent text-white font-medium disabled:opacity-40 active:scale-[0.97] transition-all"
                  >
                    <Check size={12} />
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
              <div className="py-12 flex flex-col items-center gap-2">
                <Heart size={22} className="text-text-muted" />
                <p className="text-text-muted text-xs">No liked songs</p>
              </div>
            ) : (
              likedSongs.map(track => (
                <TrackRow
                  key={track.id}
                  track={track}
                  onPlay={() => handlePlayLiked(track)}
                  onRemove={() => removeLike(track.id)}
                />
              ))
            )}
          </div>
        )}

        {/* ── Downloads tab ──────────────────────────────────────────────── */}
        {tab === 'downloads' && (
          <div className="py-12 flex flex-col items-center gap-2">
            <Download size={22} className="text-text-muted" />
            <p className="text-text-muted text-xs">Coming soon</p>
          </div>
        )}
      </div>

      {/* Floating + button */}
      {tab === 'playlists' && !creating && (
        <button
          onClick={() => setCreating(true)}
          className="absolute bottom-6 right-6 w-10 h-10 bg-accent rounded-full flex items-center justify-center shadow-glow active:scale-90 transition-transform z-10"
        >
          <Plus size={18} className="text-white" />
        </button>
      )}
    </div>
  );
}
