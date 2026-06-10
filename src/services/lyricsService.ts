import type { LyricLine } from '../store/playerStore';

const API = 'https://lrclib.net/api/get';

interface LrclibResponse {
  syncedLyrics: string | null;
  plainLyrics: string | null;
  duration: number;
}

function parseLrcTimestamp(ts: string): number {
  const m = /^(\d+):(\d+(?:\.\d+)?)$/.exec(ts);
  if (!m) return 0;
  const minutes = parseInt(m[1], 10);
  const seconds = parseFloat(m[2]);
  return minutes * 60 + seconds;
}

function parseSyncedLyrics(raw: string): LyricLine[] {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('['))
    .map(line => {
      const m = /^\[(\d+:\d+(?:\.\d+)?)\](.*)$/.exec(line);
      if (!m) return null;
      const text = m[2].trim();
      if (!text) return null;
      return { time: parseLrcTimestamp(m[1]), text };
    })
    .filter((l): l is LyricLine => l !== null);
}

function parsePlainLyrics(raw: string, duration: number): LyricLine[] {
  const lines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return [];
  if (lines.length === 1) return [{ time: 0, text: lines[0] }];

  const interval = duration / lines.length;

  return lines.map((text, i) => ({
    time: Math.min(i * interval, duration),
    text,
  }));
}

export async function fetchLyrics(
  title: string,
  artist: string,
): Promise<LyricLine[] | null> {
  try {
    const url = `${API}?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
    const res = await fetch(url);

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const data: LrclibResponse = await res.json();

    if (data.syncedLyrics) {
      const parsed = parseSyncedLyrics(data.syncedLyrics);
      if (parsed.length > 0) return parsed;
    }

    if (data.plainLyrics) {
      return parsePlainLyrics(data.plainLyrics, data.duration);
    }

    return null;
  } catch {
    return null;
  }
}
