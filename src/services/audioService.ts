import type { Track } from '../store/playerStore';
import { useSettingsStore, DEFAULT_PIPED_INSTANCE } from '../store/settingsStore';

// As of mid-2026, api.piped.private.coffee is the only surviving Piped instance.
// It does not return audio-only streams, but does return a YouTube videoplayback
// URL (360p video+audio) via its proxy for every video. We use that as the audio source.
// The instance URL is configurable in Settings (pipedInstance).
const INSTANCES = [DEFAULT_PIPED_INSTANCE];

const BITRATE_LIMITS: Record<string, number> = {
  low: 64000,
  normal: 128000,
  high: 320000,
  lossless: Infinity,
};

// ── Piped API response types ────────────────────────────────────────────────

interface PipedSearchResponse {
  items: PipedSearchItem[];
}

interface PipedSearchItem {
  url: string;
  title: string;
  thumbnail: string;
  uploaderName: string;
  duration: number;
}

interface PipedStreamResponse {
  audioStreams: PipedAudioStream[];
  videoStreams: PipedVideoStream[];
}

interface PipedAudioStream {
  url: string;
  bitrate: number;
}

interface PipedVideoStream {
  url: string;
  quality: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function extractVideoId(url: string): string | null {
  const u = new URL(url, INSTANCES[0]);
  return u.searchParams.get('v');
}

function mapSearchItem(item: PipedSearchItem): Track {
  const videoId = extractVideoId(item.url) ?? '';
  return {
    id: videoId,
    title: item.title,
    artist: item.uploaderName,
    album: '',
    artwork: item.thumbnail,
    audioUrl: `piped:${videoId}`,
    duration: item.duration ?? 0,
    source: 'stream',
  };
}

// ── Pre-resolution cache (for synchronous playback on iOS) ─────────────────

const streamCache = new Map<string, string>();

export function getCachedStreamUrl(videoId: string): string | null {
  return streamCache.get(videoId) ?? null;
}

export function getCachedTrack(track: Track): Track | null {
  const url = streamCache.get(track.id);
  return url ? { ...track, audioUrl: url } : null;
}

export async function preresolveTrack(track: Track): Promise<Track> {
  const cached = streamCache.get(track.id);
  if (cached) return { ...track, audioUrl: cached };
  const resolved = await resolveTrack(track);
  streamCache.set(track.id, resolved.audioUrl);
  return resolved;
}

export function preresolveTracks(tracks: Track[]): void {
  for (const track of tracks) {
    if (!streamCache.has(track.id)) {
      preresolveTrack(track).catch(() => {});
    }
  }
}

export function clearStreamCache(): void {
  streamCache.clear();
}

// ── Public API ──────────────────────────────────────────────────────────────

async function fetchFromInstances<T>(path: string): Promise<T> {
  const settings = useSettingsStore.getState();
  const custom = settings.pipedInstance?.trim();
  const bases = custom && custom !== DEFAULT_PIPED_INSTANCE
    ? [custom, ...INSTANCES]
    : INSTANCES;

  const errors: string[] = [];
  for (const base of bases) {
    try {
      const res = await fetch(`${base}${path}`);
      if (res.ok) return (await res.json()) as T;
      errors.push(`${base} returned ${res.status}`);
    } catch {
      errors.push(`${base} unreachable`);
    }
  }
  throw new Error(`All Piped instances failed:\n${errors.join('\n')}`);
}

export async function searchTracks(query: string): Promise<Track[]> {
  const path = `/search?q=${encodeURIComponent(query)}&filter=music_songs`;
  const data = await fetchFromInstances<PipedSearchResponse>(path);
  return (data.items ?? []).map(mapSearchItem);
}

export async function getStreamUrl(videoId: string): Promise<string> {
  const path = `/streams/${encodeURIComponent(videoId)}`;
  const data = await fetchFromInstances<PipedStreamResponse>(path);
  const streams = data.audioStreams ?? [];

  if (streams.length > 0) {
    const quality = useSettingsStore.getState().audioQuality;
    const maxBitrate = BITRATE_LIMITS[quality];

    const candidates = streams.filter(s => s.bitrate <= maxBitrate);
    if (candidates.length === 0) {
      streams.sort((a, b) => a.bitrate - b.bitrate);
      return streams[0].url;
    }

    candidates.sort((a, b) => b.bitrate - a.bitrate);
    return candidates[0].url;
  }

  // Fallback: use a video stream as audio source
  const videoStreams = data.videoStreams ?? [];

  // Prefer the actual YouTube videoplayback URL (itag=18 etc.) over LBRY streams
  const ytStream = videoStreams.find(s => s.url.includes('googlevideo.com') || s.url.includes('videoplayback'));
  if (ytStream) return ytStream.url;

  // Fall back to any other video stream
  if (videoStreams.length > 0) {
    return videoStreams[0].url;
  }

  throw new Error(`No streams found for video ${videoId}`);
}

export async function resolveTrack(track: Track): Promise<Track> {
  const audioUrl = await getStreamUrl(track.id);
  return { ...track, audioUrl };
}
