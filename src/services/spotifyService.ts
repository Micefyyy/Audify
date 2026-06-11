const API_BASE = 'https://spotify.xwolf.space/api/playlist';

function extractPlaylistId(url: string): string {
  const m = /(?:open\.spotify\.com\/playlist\/|spotify:playlist:)([a-zA-Z0-9]+)/.exec(url);
  if (!m) throw new Error('Invalid Spotify playlist URL — use a link like https://open.spotify.com/playlist/...');
  return m[1];
}

export async function fetchSpotifyPlaylist(
  playlistUrl: string,
): Promise<{ name: string; tracks: { title: string; artist: string }[] }> {
  const id = extractPlaylistId(playlistUrl);

  const res = await fetch(`${API_BASE}/${id}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch playlist (HTTP ${res.status}) — make sure it's a public playlist`);
  }

  const body = await res.json();

  if (!body.success || !body.playlist) {
    throw new Error('Failed to parse playlist data from API');
  }

  const name = body.playlist.name || 'Imported Playlist';
  const tracks: { title: string; artist: string }[] = [];

  for (const item of body.playlist.tracks ?? []) {
    const title = (item.title || '').trim();
    const artist = (item.artist || '').trim();
    if (title && artist) {
      tracks.push({ title, artist });
    }
  }

  return { name, tracks };
}
