import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from './playerStore';

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
}

interface LibraryState {
  likedSongs: Track[];
  playlists: Playlist[];

  addLike: (track: Track) => void;
  removeLike: (id: string) => void;
  isLiked: (id: string) => boolean;

  createPlaylist: (name: string) => string;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, track: Track) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  renamePlaylist: (id: string, name: string) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      likedSongs: [],
      playlists: [],

      addLike(track) {
        const { likedSongs } = get();
        if (likedSongs.some(t => t.id === track.id)) return;
        set({ likedSongs: [track, ...likedSongs] });
      },

      removeLike(id) {
        set(s => ({ likedSongs: s.likedSongs.filter(t => t.id !== id) }));
      },

      isLiked(id) {
        return get().likedSongs.some(t => t.id === id);
      },

      createPlaylist(name) {
        const playlist: Playlist = {
          id: crypto.randomUUID(),
          name,
          tracks: [],
          createdAt: Date.now(),
        };
        set(s => ({ playlists: [...s.playlists, playlist] }));
        return playlist.id;
      },

      deletePlaylist(id) {
        set(s => ({ playlists: s.playlists.filter(p => p.id !== id) }));
      },

      addToPlaylist(playlistId, track) {
        set(s => ({
          playlists: s.playlists.map(p =>
            p.id !== playlistId || p.tracks.some(t => t.id === track.id)
              ? p
              : { ...p, tracks: [...p.tracks, track] },
          ),
        }));
      },

      removeFromPlaylist(playlistId, trackId) {
        set(s => ({
          playlists: s.playlists.map(p =>
            p.id !== playlistId
              ? p
              : { ...p, tracks: p.tracks.filter(t => t.id !== trackId) },
          ),
        }));
      },

      renamePlaylist(id, name) {
        set(s => ({
          playlists: s.playlists.map(p =>
            p.id === id ? { ...p, name } : p,
          ),
        }));
      },
    }),
    { name: 'audify-library' },
  ),
);
