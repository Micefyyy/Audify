const AUDIO_EXTENSIONS = /\.(mp3|flac|wav|aac|ogg|wma|m4a|opus|alac)$/i;

function stripFileExtensions(name: string): string {
  return name.replace(AUDIO_EXTENSIONS, '').trim();
}

function parseTitleArtist(raw: string): { title: string; artist: string } {
  // Try "Artist - Title" separator
  const sep = /^\s*(.+?)\s*-\s*(.+?)\s*$/.exec(raw);
  if (sep) return { artist: stripFileExtensions(sep[1]), title: stripFileExtensions(sep[2]) };

  // Fallback: entire string as title
  return { artist: '', title: stripFileExtensions(raw) };
}

export function parseM3U(content: string): { title: string; artist: string }[] {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const results: { title: string; artist: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTINF:')) {
      // #EXTINF:-1,Artist - Title  or  #EXTINF:123,Title
      const commaIdx = line.indexOf(',');
      if (commaIdx !== -1) {
        const raw = line.slice(commaIdx + 1).trim();
        results.push(parseTitleArtist(raw));
      }
      // next line is typically a URL/path — skip it
      i++;
    } else if (!line.startsWith('#')) {
      results.push(parseTitleArtist(line));
    }
  }

  return results;
}

export function parseJSON(content: string): { title: string; artist: string }[] {
  const data = JSON.parse(content);

  // Try the data as a direct array
  if (Array.isArray(data)) {
    return data.map(item => normalizeTrackItem(item));
  }

  // Try .tracks (array) or .items (array)
  const arr = data.tracks ?? data.items ?? data.playlist?.tracks ?? [];
  if (Array.isArray(arr)) {
    return arr.map(item => normalizeTrackItem(item));
  }

  throw new Error('Unrecognised JSON playlist format');
}

function normalizeTrackItem(item: any): { title: string; artist: string } {
  // Spotify-style: { track: { name, artists: [{ name }] } }
  if (item.track) {
    return {
      title: item.track.name ?? '',
      artist: item.track.artists?.[0]?.name ?? '',
    };
  }

  // Direct { title, artist } / { name, artist } objects
  return {
    title: item.title ?? item.name ?? '',
    artist: item.artist ?? item.artists?.[0]?.name ?? item.artists ?? '',
  };
}

export function importFile(file: File): Promise<{
  name: string;
  tracks: { title: string; artist: string }[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const content = reader.result as string;
      const ext = file.name.toLowerCase();

      let tracks: { title: string; artist: string }[];

      try {
        if (ext.endsWith('.m3u') || ext.endsWith('.m3u8')) {
          tracks = parseM3U(content);
        } else if (ext.endsWith('.json')) {
          tracks = parseJSON(content);
        } else {
          reject(new Error(`Unsupported file type: ${file.name}`));
          return;
        }
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse file'));
        return;
      }

      const name = file.name.replace(/\.(m3u|m3u8|json)$/i, '').trim();
      resolve({ name, tracks });
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
