import { MediaSession, MediaSessionPlaybackState } from '@jofr/capacitor-media-session';
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
      artwork: track.artwork,
      duration: track.duration,
      elapsedPlaybackTime: progress * track.duration,
      playbackState: isPlaying
        ? MediaSessionPlaybackState.PLAYING
        : MediaSessionPlaybackState.PAUSED,
    });
  } catch {
    // silently fail
  }
}

export async function clearNowPlaying(): Promise<void> {
  try {
    await MediaSession.setMetadata({
      playbackState: MediaSessionPlaybackState.NONE,
    });
  } catch {
    // silently fail
  }
}
