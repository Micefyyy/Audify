import { create } from 'zustand';
import { Howl } from 'howler';
import { resolveTrack } from '../services/audioService';
import { fetchLyrics } from '../services/lyricsService';
import { isDownloaded, getLocalTrackUri } from '../services/downloadService';
import { updateNowPlaying, clearNowPlaying } from '../services/nowPlayingService';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;       // URL
  audioUrl: string;      // stream URL
  duration: number;      // seconds
  lyrics?: LyricLine[];
  source?: 'local' | 'stream' | 'imported';
}

export interface LyricLine {
  time: number;   // seconds
  text: string;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  progress: number;        // 0–1
  volume: number;          // 0–1
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  howl: Howl | null;
  isLoading: boolean;
  error: string;

  // Actions
  play: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  seek: (pct: number) => void;
  skipNext: () => void;
  skipPrev: () => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setProgress: (p: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  progress: 0,
  volume: 0.8,
  shuffle: false,
  repeat: 'none',
  howl: null,
  isLoading: false,
  error: '',

  play(track, queue) {
    const trackId = track.id;
    const { howl } = get();
    if (howl) howl.unload();

    const newQueue = queue ?? get().queue;
    const newIndex = queue ? queue.findIndex(t => t.id === trackId) : get().queueIndex;

    set({
      howl: null,
      isLoading: true,
      error: '',
      isPlaying: false,
      queue: newQueue,
      queueIndex: newIndex,
    });

    (isDownloaded(trackId).then(downloaded => {
      if (downloaded) return getLocalTrackUri(trackId).then(uri => ({ ...track, audioUrl: uri }));
      return resolveTrack(track);
    })).then(resolved => {
      const s = get();
      if (!s.isLoading) return;

      const newHowl = new Howl({
        src: [resolved.audioUrl],
        html5: true,
        volume: s.volume,
        onend: () => get().skipNext(),
        onplay: () => {
          const tick = () => {
            const h = get().howl;
            if (!h) return;
            const dur = h.duration() || 1;
            set({ progress: (h.seek() as number) / dur });
            if (get().isPlaying) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        },
      });

      newHowl.play();
      set({
        currentTrack: resolved,
        isLoading: false,
        isPlaying: true,
        progress: 0,
        howl: newHowl,
      });

      fetchLyrics(resolved.title, resolved.artist).then(lyrics => {
        if (!lyrics) return;
        const s = get();
        if (s.currentTrack?.id === resolved.id) {
          set({ currentTrack: { ...s.currentTrack!, lyrics } });
        }
      });
    }).catch(err => {
      const s = get();
      if (!s.isLoading) return;
      set({
        error: err instanceof Error ? err.message : 'Failed to resolve track',
        isLoading: false,
      });
    });
  },

  pause() {
    get().howl?.pause();
    set({ isPlaying: false });
  },

  resume() {
    get().howl?.play();
    set({ isPlaying: true });
  },

  seek(pct) {
    const h = get().howl;
    if (h) {
      h.seek(pct * (h.duration() || 0));
      set({ progress: pct });
    }
  },

  skipNext() {
    const { queue, queueIndex, shuffle, repeat } = get();
    if (repeat === 'one') { get().howl?.seek(0); get().howl?.play(); return; }
    let next = queueIndex + 1;
    if (shuffle) next = Math.floor(Math.random() * queue.length);
    if (next >= queue.length) {
      if (repeat === 'all') next = 0; else { set({ isPlaying: false }); return; }
    }
    get().play(queue[next], queue);
  },

  skipPrev() {
    const { queue, queueIndex, howl } = get();
    const elapsed = (howl?.seek() as number) ?? 0;
    if (elapsed > 3) { howl?.seek(0); return; }
    const prev = Math.max(0, queueIndex - 1);
    get().play(queue[prev], queue);
  },

  setVolume(v) {
    get().howl?.volume(v);
    set({ volume: v });
  },

  toggleShuffle() { set(s => ({ shuffle: !s.shuffle })); },

  cycleRepeat() {
    const map: Record<PlayerState['repeat'], PlayerState['repeat']> = {
      none: 'all', all: 'one', one: 'none',
    };
    set(s => ({ repeat: map[s.repeat] }));
  },

  setProgress(p) { set({ progress: p }); },
}));

// ── NowPlaying sync ──────────────────────────────────────────────────────────

let snapshot: { id: string | null; playing: boolean; progress: number } | null = null;

usePlayerStore.subscribe((state) => {
  if (state.currentTrack) {
    const s = { id: state.currentTrack.id, playing: state.isPlaying, progress: state.progress };
    if (snapshot && snapshot.id === s.id && snapshot.playing === s.playing && snapshot.progress === s.progress) return;
    snapshot = s;
    updateNowPlaying(state.currentTrack, state.isPlaying, state.progress);
  } else {
    snapshot = null;
    clearNowPlaying();
  }
});
