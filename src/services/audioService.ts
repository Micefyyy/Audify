import type { Track } from '../store/playerStore';
import type { Album, Artist } from '../store/libraryStore';
import { useSettingsStore, DEFAULT_PIPED_INSTANCE } from '../store/settingsStore';

const INSTANCES = [
  DEFAULT_PIPED_INSTANCE,
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.tokhmi.xyz',
];

const BITRATE_LIMITS: Record<string, number> = {
  low: 64000,
  normal: 128000,
  high: 320000,
  lossless: Infinity,
};

interface PipedSearchResponse {
  items: PipedSearchItem[];
  suggestion?: string;
}

interface PipedSearchItem {
  url: string;
  title: string;
  thumbnail: string;
  uploaderName: string;
  uploaderUrl?: string;
  duration: number;
  type?: string;
  uploaderAvatar?: string;
  albumArt?: string;
  albumTitle?: string;
  year?: string;
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

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url, INSTANCES[0]);
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}

function extractPlaylistId(url: string): string | null {
  try {
    const u = new URL(url, INSTANCES[0]);
    return u.searchParams.get('list');
  } catch {
    return null;
  }
}

function extractChannelId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/channel\/([^/?]+)/);
  return match ? match[1] : null;
}

export function mapSearchItem(item: PipedSearchItem): Track {
  const videoId = extractVideoId(item.url) ?? '';
  const artwork = videoId
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : item.thumbnail;
  return {
    id: videoId,
    title: item.title,
    artist: item.uploaderName,
    album: item.albumTitle || '',
    artwork,
    audioUrl: `piped:${videoId}`,
    duration: item.duration ?? 0,
    source: 'stream',
  };
}

function mapToAlbum(item: PipedSearchItem): Album {
  const videoId = extractVideoId(item.url) ?? '';
  const artwork = item.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');
  return {
    id: item.url || videoId,
    title: item.title,
    artist: item.uploaderName,
    artwork,
    year: item.year,
    tracks: [],
  };
}

function mapToArtist(item: PipedSearchItem): Artist {
  const channelId = extractChannelId(item.uploaderUrl ?? item.url) ?? '';
  return {
    id: channelId || item.uploaderName,
    name: item.uploaderName,
    thumbnail: item.uploaderAvatar || item.thumbnail || '',
    bio: undefined,
    albumCount: undefined,
  };
}

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

function proxyUrl(base: string, rawUrl: string): string {
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    const prefix = rawUrl.startsWith('/') ? '' : '/';
    return `${base}${prefix}${rawUrl}`;
  }
  if (/googlevideo\.com|youtube\.com|ytimg\.com/.test(rawUrl)) {
    return `${base}/proxy/media?url=${encodeURIComponent(rawUrl)}`;
  }
  return rawUrl;
}

// ── Search ──────────────────────────────────────────────────────────────────

export async function searchTracks(query: string): Promise<Track[]> {
  const path = `/search?q=${encodeURIComponent(query)}&filter=music_songs`;
  const { data } = await fetchFromInstances<PipedSearchResponse>(path);
  return (data.items ?? []).map(mapSearchItem);
}

export async function searchAlbums(query: string): Promise<Album[]> {
  const path = `/search?q=${encodeURIComponent(query)}&filter=music_albums`;
  const { data } = await fetchFromInstances<PipedSearchResponse>(path);
  return (data.items ?? []).map(mapToAlbum);
}

export async function searchArtists(query: string): Promise<Artist[]> {
  const path = `/search?q=${encodeURIComponent(query)}&filter=music_artists`;
  const { data } = await fetchFromInstances<PipedSearchResponse>(path);
  return (data.items ?? []).map(mapToArtist);
}

// ── Album tracks ────────────────────────────────────────────────────────────

export async function getAlbumTracks(albumUrl: string): Promise<Track[]> {
  // Piped playlist/album endpoint
  const playlistId = extractPlaylistId(albumUrl);
  if (!playlistId) {
    // If it's a direct video URL, treat as single track
    const videoId = extractVideoId(albumUrl);
    if (videoId) {
      const track: Track = {
        id: videoId,
        title: 'Unknown Track',
        artist: 'Unknown Artist',
        album: '',
        artwork: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        audioUrl: `piped:${videoId}`,
        duration: 0,
        source: 'stream',
      };
      return [track];
    }
    return [];
  }
  try {
    const path = `/playlists/${encodeURIComponent(playlistId)}`;
    const { data } = await fetchFromInstances<{ title?: string; thumbnailUrl?: string; relatedStreams?: PipedSearchItem[] }>(path);
    return (data.relatedStreams ?? []).map(mapSearchItem);
  } catch {
    return [];
  }
}

// ── Artist info ─────────────────────────────────────────────────────────────

export async function getArtistInfo(artistName: string): Promise<{ artist: Artist; tracks: Track[]; albums: Album[] }> {
  const [tracks, albumResults] = await Promise.all([
    searchTracks(artistName),
    searchAlbums(artistName),
  ]);

  const filteredTracks = tracks.filter(t =>
    t.artist.toLowerCase() === artistName.toLowerCase() ||
    t.artist.toLowerCase().includes(artistName.toLowerCase())
  );
  const finalTracks = filteredTracks.length >= 3 ? filteredTracks : tracks;

  const albums = albumResults.filter(a =>
    a.artist.toLowerCase() === artistName.toLowerCase() ||
    a.artist.toLowerCase().includes(artistName.toLowerCase())
  );

  const artist: Artist = {
    id: artistName,
    name: artistName,
    thumbnail: finalTracks[0]?.artwork || albums[0]?.artwork || '',
    bio: undefined,
    albumCount: albums.length,
  };

  return { artist, tracks: finalTracks, albums };
}

// ── Similar artists ─────────────────────────────────────────────────────────

export async function getSimilarArtists(artistName: string): Promise<Artist[]> {
  try {
    const path = `/search?q=${encodeURIComponent(artistName)}&filter=music_artists`;
    const { data } = await fetchFromInstances<PipedSearchResponse>(path);
    return (data.items ?? [])
      .filter(i => i.uploaderName !== artistName)
      .slice(0, 6)
      .map(mapToArtist);
  } catch {
    return [];
  }
}

// ── Stream resolution ───────────────────────────────────────────────────────

export async function getStreamUrl(videoId: string): Promise<string> {
  const path = `/streams/${encodeURIComponent(videoId)}`;
  const { data, base } = await fetchFromInstances<PipedStreamResponse>(path);

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

  const videoStreams = data.videoStreams ?? [];
  const ytStream = videoStreams.find(
    s => s.url.includes('googlevideo.com') || s.url.includes('videoplayback')
  );
  if (ytStream) return proxyUrl(base, ytStream.url);

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
    } catch {}
  }

  return results;
}
