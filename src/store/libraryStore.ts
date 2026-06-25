import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from './playerStore';

export interface Album {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  year?: string;
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  thumbnail: string;
  bio?: string;
  albumCount?: number;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: number;
}

interface LibraryState {
  likedSongs: Track[];
  likedAlbums: Album[];
  likedArtists: Artist[];
  playlists: Playlist[];

  addLike: (track: Track) => void;
  removeLike: (id: string) => void;
  isLiked: (id: string) => boolean;

  addAlbumLike: (album: Album) => void;
  removeAlbumLike: (id: string) => void;
  isAlbumLiked: (id: string) => boolean;

  addArtistLike: (artist: Artist) => void;
  removeArtistLike: (id: string) => void;
  isArtistLiked: (id: string) => boolean;

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
      likedAlbums: [],
      likedArtists: [],
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

      addAlbumLike(album) {
        const { likedAlbums } = get();
        if (likedAlbums.some(a => a.id === album.id)) return;
        set({ likedAlbums: [album, ...likedAlbums] });
      },

      removeAlbumLike(id) {
        set(s => ({ likedAlbums: s.likedAlbums.filter(a => a.id !== id) }));
      },

      isAlbumLiked(id) {
        return get().likedAlbums.some(a => a.id === id);
      },

      addArtistLike(artist) {
        const { likedArtists } = get();
        if (likedArtists.some(a => a.id === artist.id)) return;
        set({ likedArtists: [artist, ...likedArtists] });
      },

      removeArtistLike(id) {
        set(s => ({ likedArtists: s.likedArtists.filter(a => a.id !== id) }));
      },

      isArtistLiked(id) {
        return get().likedArtists.some(a => a.id === id);
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
