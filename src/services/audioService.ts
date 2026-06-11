import type { Track } from '../store/playerStore';
import { useSettingsStore, DEFAULT_PIPED_INSTANCE } from '../store/settingsStore';

// Piped is a proxy frontend for YouTube. The search API works fine, but the
// stream URLs it returns are direct YouTube videoplayback URLs that require
// specific HTTP headers (Referer, cookies) to serve content. The browser's
// <audio> element cannot set those headers, so we proxy the stream through
// the Piped instance itself, which adds the necessary headers on our behalf.
//
// Known working instances as of mid 2026 are listed below in order of
// reliability. Users can also supply a custom instance in Settings.
const INSTANCES = [
  DEFAULT_PIPED_INSTANCE, // https://api.piped.private.coffee
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.tokhmi.xyz',
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
  try {
    const u = new URL(url, INSTANCES[0]);
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}

function mapSearchItem(item: PipedSearchItem): Track {
  const videoId = extractVideoId(item.url) ?? '';
  const artwork = videoId
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : item.thumbnail;
  return {
    id: videoId,
    title: item.title,
    artist: item.uploaderName,
    album: '',
    artwork,
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

// ── Instance selection ──────────────────────────────────────────────────────

function getBases(): string[] {
  const settings = useSettingsStore.getState();
  const custom = settings.pipedInstance?.trim();
  if (custom && custom !== DEFAULT_PIPED_INSTANCE) {
    return [custom, ...INSTANCES.filter(i => i !== custom)];
  }
  return INSTANCES;
}

async function fetchFromInstances<T>(path: string): Promise<{ data: T; base: string }> {
  const bases = getBases();
  const errors: string[] = [];
  for (const base of bases) {
    try {
      const res = await fetch(`${base}${path}`);
      if (res.ok) return { data: (await res.json()) as T, base };
      errors.push(`${base} returned ${res.status}`);
    } catch {
      errors.push(`${base} unreachable`);
    }
  }
  throw new Error(`All Piped instances failed:\n${errors.join('\n')}`);
}

// ── Proxy helpers ───────────────────────────────────────────────────────────

/** Wrap a YouTube stream URL so it goes through the Piped instance's proxy. */
function proxyUrl(base: string, rawUrl: string): string {
  // If the URL is relative, resolve it against the instance
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    const prefix = rawUrl.startsWith('/') ? '' : '/';
    return `${base}${prefix}${rawUrl}`;
  }
  // Raw YouTube videoplayback/googlevideo URLs need proxying
  if (/googlevideo\.com|youtube\.com|ytimg\.com/.test(rawUrl)) {
    return `${base}/proxy/media?url=${encodeURIComponent(rawUrl)}`;
  }
  return rawUrl;
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function searchTracks(query: string): Promise<Track[]> {
  const path = `/search?q=${encodeURIComponent(query)}&filter=music_songs`;
  const { data } = await fetchFromInstances<PipedSearchResponse>(path);
  return (data.items ?? []).map(mapSearchItem);
}

export async function getStreamUrl(videoId: string): Promise<string> {
  const path = `/streams/${encodeURIComponent(videoId)}`;
  const { data, base } = await fetchFromInstances<PipedStreamResponse>(path);

  // Prefer audio streams
  const audioStreams = data.audioStreams ?? [];
  if (audioStreams.length > 0) {
    const quality = useSettingsStore.getState().audioQuality;
    const maxBitrate = BITRATE_LIMITS[quality];
    const candidates = audioStreams.filter(s => s.bitrate <= maxBitrate);
    let best = candidates.length > 0
      ? candidates.sort((a, b) => b.bitrate - a.bitrate)[0]
      : audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];
    return proxyUrl(base, best.url);
  }

  // Fallback: use a video stream as audio source
  const videoStreams = data.videoStreams ?? [];

  // Prefer a proxied YouTube videoplayback URL
  const ytStream = videoStreams.find(
    s => s.url.includes('googlevideo.com') || s.url.includes('videoplayback')
  );
  if (ytStream) return proxyUrl(base, ytStream.url);

  // Last resort — try any video stream
  if (videoStreams.length > 0) {
    return videoStreams[0].url;
  }

  throw new Error(`No streams found for video ${videoId}`);
}

export async function resolveTrack(track: Track): Promise<Track> {
  const audioUrl = await getStreamUrl(track.id);
  return { ...track, audioUrl };
}

export async function getArtistTracks(artistName: string): Promise<Track[]> {
  const path = `/search?q=${encodeURIComponent(artistName)}&filter=music_songs`;
  const { data } = await fetchFromInstances<PipedSearchResponse>(path);
  const items = (data.items ?? []).map(mapSearchItem);
  const exact = items.filter(t => t.artist.toLowerCase() === artistName.toLowerCase());
  if (exact.length >= 3) return exact;
  return items;
}

export async function getRecommendations(seed: Track, excludeIds: string[]): Promise<Track[]> {
  const queries = [
    `${seed.artist} ${seed.title}`,
    seed.artist,
    `${seed.artist} mix`,
  ];
  const seen = new Set(excludeIds);
  const results: Track[] = [];

  for (const q of queries) {
    if (results.length >= 5) break;
    try {
      const tracks = await searchTracks(q);
      for (const t of tracks) {
        if (!seen.has(t.id) && t.id) {
          seen.add(t.id);
          results.push(t);
          if (results.length >= 5) break;
        }
      }
    } catch {
      // skip failed queries
    }
  }

  return results;
}
