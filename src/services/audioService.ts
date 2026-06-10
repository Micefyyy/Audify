import type { Track } from '../store/playerStore';
import { useSettingsStore } from '../store/settingsStore';

const BASE_URL = 'https://pipedapi.kavin.rocks';

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
}

interface PipedAudioStream {
  url: string;
  bitrate: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function extractVideoId(url: string): string | null {
  const u = new URL(url, BASE_URL);
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

export async function searchTracks(query: string): Promise<Track[]> {
  try {
    const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&filter=music_songs`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Piped search failed: ${res.status} ${res.statusText}`);
    }
    const data: PipedSearchResponse = await res.json();
    return (data.items ?? []).map(mapSearchItem);
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Piped search request failed');
  }
}

export async function getStreamUrl(videoId: string): Promise<string> {
  try {
    const url = `${BASE_URL}/streams/${encodeURIComponent(videoId)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Piped streams failed: ${res.status} ${res.statusText}`);
    }
    const data: PipedStreamResponse = await res.json();
    const streams = data.audioStreams ?? [];
    if (streams.length === 0) {
      throw new Error(`No audio streams found for video ${videoId}`);
    }

    const quality = useSettingsStore.getState().audioQuality;
    const maxBitrate = BITRATE_LIMITS[quality];

    const candidates = streams.filter(s => s.bitrate <= maxBitrate);
    if (candidates.length === 0) {
      streams.sort((a, b) => a.bitrate - b.bitrate);
      return streams[0].url;
    }

    candidates.sort((a, b) => b.bitrate - a.bitrate);
    return candidates[0].url;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Piped stream request failed');
  }
}

export async function resolveTrack(track: Track): Promise<Track> {
  const audioUrl = await getStreamUrl(track.id);
  return { ...track, audioUrl };
}
