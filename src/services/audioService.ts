import type { Track } from '../store/playerStore';
import { useSettingsStore } from '../store/settingsStore';

const INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.kavin.rocks',
  'https://pipedapi-libre.kavin.rocks',
];

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

// ── Public API ──────────────────────────────────────────────────────────────

async function fetchFromInstances<T>(path: string): Promise<T> {
  const errors: string[] = [];
  for (const base of INSTANCES) {
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

  // Fallback: use the first video stream (contains audio track)
  const videoStreams = data.videoStreams ?? [];
  if (videoStreams.length > 0) {
    return videoStreams[0].url;
  }

  throw new Error(`No streams found for video ${videoId}`);
}

export async function resolveTrack(track: Track): Promise<Track> {
  const audioUrl = await getStreamUrl(track.id);
  return { ...track, audioUrl };
}
