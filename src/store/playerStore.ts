import { create } from 'zustand';
import { Howl, Howler } from 'howler';
import { resolveTrack, getCachedTrack, preresolveTrack, getRecommendations } from '../services/audioService';
import { fetchLyrics } from '../services/lyricsService';
import { isDownloaded, getLocalTrackUri } from '../services/downloadService';
import { updateNowPlaying, clearNowPlaying } from '../services/nowPlayingService';
import { useSettingsStore } from '../store/settingsStore';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  audioUrl: string;
  duration: number;
  lyrics?: LyricLine[];
  source?: 'local' | 'stream' | 'imported';
}

export interface LyricLine {
  time: number;
  text: string;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  progress: number;
  volume: number;
  shuffle: boolean;
  smartShuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  howl: Howl | null;
  isLoading: boolean;
  error: string;
  recentlyPlayed: Track[];

  play: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  seek: (pct: number) => void;
  skipNext: () => void;
  skipPrev: () => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  toggleSmartShuffle: () => void;
  cycleRepeat: () => void;
  setProgress: (p: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (from: number, to: number) => void;
}

// ── Equalizer ───────────────────────────────────────────────────────────────

const EQ_PRESETS: Record<string, number[]> = {
  Flat:       [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Pop:        [-1, 2, 4, 5, 3, 0, -1, -1, -1, -1],
  Rock:       [5, 3, -2, -4, -2, 2, 5, 6, 6, 6],
  Jazz:       [3, 2, 0, 2, -1, -1, 0, 1, 2, 3],
  Classical:  [4, 3, 2, 1, -1, -1, 0, 2, 3, 4],
  'Hip-Hop':  [5, 4, 1, 3, -1, -1, 1, -1, 2, 3],
  Electronic: [5, 4, 2, 0, -2, 0, 2, 4, 5, 5],
  Acoustic:   [4, 3, 2, 1, 1, -1, -1, 0, 2, 3],
};

let eqFilters: BiquadFilterNode[] | null = null;

function getEqFilters(): BiquadFilterNode[] {
  if (eqFilters) return eqFilters;
  const ctx = Howler.ctx;
  if (!ctx) return [];

  const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  eqFilters = frequencies.map((freq, i) => {
    const filter = ctx.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = freq;
    filter.Q.value = 1.4;
    filter.gain.value = 0;
    return filter;
  });

  // Chain: masterGain -> filters -> destination
  const masterGain = Howler.masterGain;
  if (masterGain) {
    let lastNode: AudioNode = masterGain;
    for (const filter of eqFilters) {
      lastNode.connect(filter);
      lastNode = filter;
    }
    lastNode.connect(ctx.destination);
  }

  return eqFilters;
}

export function applyEqPreset(presetName: string): void {
  const preset = EQ_PRESETS[presetName];
  if (!preset) return;
  const filters = getEqFilters();
  if (filters.length === 0) return;
  preset.forEach((gain, i) => {
    if (filters[i]) {
      filters[i].gain.value = gain;
    }
  });
}

// ── Crossfade helper ────────────────────────────────────────────────────────

function crossfadeHowl(
  oldHowl: Howl | null,
  newHowl: Howl,
  duration: number,
) {
  if (!oldHowl || duration <= 0) {
    newHowl.play();
    return;
  }

  const oldVol = oldHowl.volume();
  // Fade out old
  oldHowl.fade(oldVol, 0, duration * 1000);
  oldHowl.once('fade', () => {
    oldHowl.pause();
    oldHowl.volume(oldVol); // restore for next use
  });

  // Fade in new
  newHowl.volume(0);
  newHowl.play();
  newHowl.fade(0, oldVol, duration * 1000);
}

// ── Init Howl ───────────────────────────────────────────────────────────────

function initHowl(
  set: (partial: Partial<PlayerState> | ((s: PlayerState) => Partial<PlayerState>)) => void,
  get: () => PlayerState,
  resolved: Track,
) {
  const { volume, howl: oldHowl } = get();
  const crossfadeDuration = useSettingsStore.getState().crossfadeDuration;
  const eqPreset = useSettingsStore.getState().equalizerPreset;

  const newHowl = new Howl({
    src: [resolved.audioUrl],
    format: ['mp4', 'aac', 'webm'],
    html5: true,
    volume,
    onloaderror: (_id: number, err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to load audio';
      console.error('[Howler] loaderror:', msg, 'url:', resolved.audioUrl);
      set({
        error: `Playback error: ${msg}`,
        isLoading: false,
        isPlaying: false,
      });
    },
    onload: () => {
      set({ isLoading: false });
    },
    onplay: () => {
      set({ isLoading: false, isPlaying: true });
      // Apply EQ preset on each new track
      applyEqPreset(eqPreset);
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

  set({
    currentTrack: resolved,
    progress: 0,
    howl: newHowl,
    isLoading: false,
  });

  if (crossfadeDuration > 0 && oldHowl) {
    crossfadeHowl(oldHowl, newHowl, crossfadeDuration);
  } else {
    newHowl.play();
  }

  fetchLyrics(resolved.title, resolved.artist).then(lyrics => {
    if (!lyrics) return;
    const cur = get();
    if (cur.currentTrack?.id === resolved.id) {
      set({ currentTrack: { ...cur.currentTrack!, lyrics } });
    }
  });
}

// ── Store ───────────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  progress: 0,
  volume: 0.8,
  shuffle: false,
  smartShuffle: false,
  repeat: 'none',
  howl: null,
  isLoading: false,
  error: '',
  recentlyPlayed: [],

  play(track, queue) {
    const trackId = track.id;
    const { howl, isLoading } = get();
    if (isLoading) return;
    if (howl) howl.unload();

    const newQueue = queue ?? get().queue;
    const newIndex = queue ? queue.findIndex(t => t.id === trackId) : get().queueIndex;

    set(s => ({
      howl: null,
      isLoading: true,
      error: '',
      isPlaying: false,
      queue: newQueue,
      queueIndex: newIndex,
      recentlyPlayed: [track, ...s.recentlyPlayed.filter(t => t.id !== track.id)].slice(0, 20),
    }));

    if (get().smartShuffle) {
      fetchSmartRecommendations(get, track);
    }

    const cached = getCachedTrack(track);
    if (cached && !cached.audioUrl.startsWith('piped:')) {
      initHowl(set, get, cached);
      return;
    }

    isDownloaded(trackId).then(downloaded => {
      if (downloaded) return getLocalTrackUri(trackId);
      return preresolveTrack(track).then(t => t.audioUrl);
    }).then(audioUrl => {
      const s = get();
      if (!s.isLoading) return;
      initHowl(set, get, { ...track, audioUrl });
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
    const { queue, queueIndex, shuffle, smartShuffle, repeat } = get();
    if (repeat === 'one') { get().howl?.seek(0); get().howl?.play(); return; }
    let next = queueIndex + 1;
    if (shuffle) next = Math.floor(Math.random() * queue.length);
    if (next >= queue.length) {
      if (repeat === 'all') next = 0; else { set({ isPlaying: false }); return; }
    }
    const nextTrack = queue[next];
    if (!nextTrack) { set({ isPlaying: false }); return; }
    get().play(nextTrack, queue);
    if (smartShuffle && queue.length - next < 3) {
      fetchSmartRecommendations(get, nextTrack);
    }
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

  toggleSmartShuffle() {
    const wasOn = get().smartShuffle;
    set({ smartShuffle: !wasOn, shuffle: wasOn ? get().shuffle : true });
    if (!wasOn && get().currentTrack) {
      fetchSmartRecommendations(get, get().currentTrack!);
    }
  },

  cycleRepeat() {
    const map: Record<PlayerState['repeat'], PlayerState['repeat']> = {
      none: 'all', all: 'one', one: 'none',
    };
    set(s => ({ repeat: map[s.repeat] }));
  },

  setProgress(p) { set({ progress: p }); },

  addToQueue(track) {
    set(s => {
      if (s.queue.some(t => t.id === track.id)) return s;
      return { queue: [...s.queue, track] };
    });
  },

  removeFromQueue(index) {
    set(s => ({ queue: s.queue.filter((_, i) => i !== index) }));
  },

  clearQueue() {
    set({ queue: [] });
  },

  reorderQueue(from, to) {
    set(s => {
      const q = [...s.queue];
      const [removed] = q.splice(from, 1);
      q.splice(to, 0, removed);
      return { queue: q };
    });
  },
}));

// ── Smart shuffle helpers ────────────────────────────────────────────────────

let fetching = false;

async function fetchSmartRecommendations(get: () => PlayerState, seed: Track) {
  if (fetching) return;
  fetching = true;
  try {
    const state = get();
    const excludeIds = [state.currentTrack?.id ?? '', ...state.queue.map(t => t.id)].filter(Boolean);
    const recs = await getRecommendations(seed, excludeIds);
    if (!get().smartShuffle) return;
    for (const t of recs) {
      get().addToQueue(t);
    }
  } catch {} finally {
    fetching = false;
  }
}

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
