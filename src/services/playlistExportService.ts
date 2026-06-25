import type { Track } from '../store/playerStore';

export function exportAsJSON(name: string, tracks: Track[]): string {
  const data = {
    name,
    exportedAt: new Date().toISOString(),
    app: 'Audify',
    trackCount: tracks.length,
    tracks: tracks.map(t => ({
      title: t.title,
      artist: t.artist,
      album: t.album || undefined,
      duration: t.duration,
      id: t.id,
    })),
  };
  return JSON.stringify(data, null, 2);
}

export function exportAsM3U(name: string, tracks: Track[]): string {
  const lines = ['#EXTM3U', `#PLAYLIST:${name}`];
  for (const t of tracks) {
    const mins = Math.floor(t.duration / 60);
    const secs = Math.floor(t.duration % 60);
    const duration = t.duration > 0 ? `${mins * 60 + secs}` : '-1';
    lines.push(`#EXTINF:${duration},${t.artist} - ${t.title}`);
    if (t.id) {
      lines.push(`https://www.youtube.com/watch?v=${t.id}`);
    }
  }
  return lines.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
