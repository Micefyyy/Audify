import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Pencil, Check, X, Play, Shuffle, ListPlus, Music } from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { useHaptics } from '../hooks/useHaptics';
import type { Track } from '../store/playerStore';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TrackRow({
  track,
  onPlay,
  onRemove,
}: {
  track: Track;
  onPlay: () => void;
  onRemove: () => void;
}) {
  const haptics = useHaptics();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const addToQueue = usePlayerStore(s => s.addToQueue);

  return (
    <div className="group flex items-center gap-3 px-6 py-2 hover:bg-white/[0.03] transition-colors">
      <button
        onClick={() => { haptics.tap(); onPlay(); }}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <img
          src={track.artwork}
          alt={track.title}
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
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
        <span className="text-text-muted text-xs flex-shrink-0">{formatDuration(track.duration)}</span>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); haptics.tap(); addToQueue(track); }}
        className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted opacity-0 group-hover:opacity-100 active:scale-90 transition-all flex-shrink-0"
        title="Add to queue"
      >
        <ListPlus size={15} />
      </button>

      {confirming ? (
        <div className="flex items-center gap-1">
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
          onClick={(e) => { e.stopPropagation(); haptics.tap(); setConfirming(true); }}
          className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted opacity-0 group-hover:opacity-100 active:scale-90 transition-all"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const haptics = useHaptics();

  const found = useLibraryStore(s => s.playlists.find(p => p.id === id));
  const { renamePlaylist, deletePlaylist, removeFromPlaylist } = useLibraryStore();
  const play = usePlayerStore(s => s.play);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');

  if (!found) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
        <Music size={40} className="text-text-muted" />
        <p className="text-text-muted text-sm">Playlist not found</p>
        <button
          onClick={() => navigate('/library')}
          className="text-accent text-sm font-medium active:opacity-70"
        >
          Go back
        </button>
      </div>
    );
  }

  const pl = found;

  function handleStartEdit() {
    setEditName(pl.name);
    setEditing(true);
  }

  function handleSaveRename() {
    const name = editName.trim();
    if (name && name !== pl.name) {
      haptics.impact();
      renamePlaylist(pl.id, name);
    }
    setEditing(false);
  }

  function handleCancelRename() {
    setEditing(false);
  }

  function handleDelete() {
    haptics.impact();
    deletePlaylist(pl.id);
    navigate('/library');
  }

  function handlePlayAll() {
    if (pl.tracks.length === 0) return;
    haptics.impact();
    play(pl.tracks[0], pl.tracks);
  }

  function handleShuffle() {
    if (pl.tracks.length === 0) return;
    haptics.impact();
    const shuffled = [...pl.tracks].sort(() => Math.random() - 0.5);
    play(shuffled[0], shuffled);
  }

  function handlePlayTrack(track: Track) {
    haptics.tap();
    play(track, pl.tracks);
  }

  function handleRemoveTrack(trackId: string) {
    removeFromPlaylist(pl.id, trackId);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-14 pb-2">
        <button
          onClick={() => navigate('/library')}
          className="w-9 h-9 flex items-center justify-center rounded-full text-text-primary active:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="flex-1 bg-bg-surface text-text-primary text-lg font-bold rounded-xl px-3 py-1.5 border border-white/10 outline-none focus:border-accent/60 transition-colors"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveRename();
                  if (e.key === 'Escape') handleCancelRename();
                }}
              />
              <button
                onClick={handleSaveRename}
                disabled={!editName.trim()}
                className="w-8 h-8 flex items-center justify-center rounded-full text-accent disabled:opacity-30 active:scale-90 transition-transform"
              >
                <Check size={18} />
              </button>
              <button
                onClick={handleCancelRename}
                className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted active:scale-90 transition-transform"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-text-primary truncate">{pl.name}</h1>
              <button
                onClick={handleStartEdit}
                className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text-secondary active:scale-90 transition-all shrink-0"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="w-9 h-9 flex items-center justify-center rounded-full text-red active:bg-red/10 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between px-6 py-3">
        <span className="text-text-muted text-sm">{pl.tracks.length} tracks</span>
        {pl.tracks.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-surface text-text-secondary text-xs font-medium active:scale-95 transition-transform border border-white/5"
            >
              <Shuffle size={12} />
              Shuffle
            </button>
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent text-white text-sm font-medium active:scale-95 transition-transform"
            >
              <Play size={14} fill="currentColor" />
              Play All
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pb-4">
        {pl.tracks.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2">
            <Music size={28} className="text-text-muted" />
            <p className="text-text-muted text-sm">No tracks in this playlist</p>
          </div>
        ) : (
          pl.tracks.map(track => (
            <TrackRow
              key={track.id}
              track={track}
              onPlay={() => handlePlayTrack(track)}
              onRemove={() => handleRemoveTrack(track.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
