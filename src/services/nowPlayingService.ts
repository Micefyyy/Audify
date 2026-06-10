import { MediaSession } from '@jofr/capacitor-media-session';
import { usePlayerStore } from '../store/playerStore';
import type { Track } from '../store/playerStore';

let initialized = false;

async function ensureInitialized(): Promise<void> {
  if (initialized) return;

  try {
    await MediaSession.setActionHandler({ action: 'play' }, () => {
      usePlayerStore.getState().resume();
    });
    await MediaSession.setActionHandler({ action: 'pause' }, () => {
      usePlayerStore.getState().pause();
    });
    await MediaSession.setActionHandler({ action: 'nexttrack' }, () => {
      usePlayerStore.getState().skipNext();
    });
    await MediaSession.setActionHandler({ action: 'previoustrack' }, () => {
      usePlayerStore.getState().skipPrev();
    });
    initialized = true;
  } catch {
    // Plugin not available (web dev, etc.)
  }
}

export async function updateNowPlaying(
  track: Track,
  isPlaying: boolean,
  progress: number,
): Promise<void> {
  await ensureInitialized();

  try {
    await MediaSession.setMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: [{ src: track.artwork }],
    });
    await MediaSession.setPlaybackState({
      playbackState: isPlaying ? 'playing' : 'paused',
    });
    await MediaSession.setPositionState({
      duration: track.duration,
      position: progress * track.duration,
      playbackRate: 1,
    });
  } catch {
    // silently fail
  }
}

export async function clearNowPlaying(): Promise<void> {
  try {
    await MediaSession.setPlaybackState({ playbackState: 'none' });
    await MediaSession.setMetadata({});
  } catch {
    // silently fail
  }
}
