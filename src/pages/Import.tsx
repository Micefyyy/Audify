import { useState } from 'react';
import { Music, Apple, Link2, FileJson, CheckCircle2, Loader2 } from 'lucide-react';
import { searchTracks } from '../services/audioService';
import { importFile, parseM3U, parseJSON } from '../services/fileImportService';
import { useHaptics } from '../hooks/useHaptics';
import { fetchSpotifyPlaylist } from '../services/spotifyService';
import { useLibraryStore } from '../store/libraryStore';
import type { Track } from '../store/playerStore';

type Platform = 'spotify' | 'apple' | 'url' | 'file';

interface ImportResult {
  name: string;
  trackCount: number;
  platform: Platform;
}

const sources: { id: Platform; label: string; icon: typeof Music; hint: string }[] = [
  { id: 'spotify', icon: Music,  label: 'Spotify',     hint: 'Paste a Spotify playlist link' },
  { id: 'apple',   icon: Apple,  label: 'Apple Music', hint: 'Not yet supported' },
  { id: 'url',     icon: Link2,  label: 'Any URL',     hint: 'Paste a JSON or M3U playlist URL' },
  { id: 'file',    icon: FileJson,label: 'JSON / M3U',  hint: 'Import an exported playlist file' },
];

async function matchAndSave(
  playlistName: string,
  tracks: { title: string; artist: string }[],
  platform: Platform,
  createPlaylist: (name: string) => string,
  addToPlaylist: (id: string, track: Track) => void,
  onProgress: (matched: number, total: number) => void,
): Promise<ImportResult> {
  const total = tracks.length;
  onProgress(0, total);

  const playlistId = createPlaylist(playlistName);
  let matched = 0;
  for (const track of tracks) {
    try {
      const q = `${track.title} ${track.artist}`.trim();
      if (q) {
        const results = await searchTracks(q);
        const best = results[0];
        if (best) {
          addToPlaylist(playlistId, { ...best, source: 'stream' });
          matched++;
        }
      }
    } catch {
      // skip unmatched tracks silently
    }
    onProgress(matched, total);
  }

  return { name: playlistName, trackCount: matched, platform };
}

export default function ImportPage() {
  const [selected, setSelected] = useState<Platform | null>(null);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<ImportResult | null>(null);

  const [progress, setProgress] = useState({ matched: 0, total: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const haptics = useHaptics();
  const { createPlaylist, addToPlaylist } = useLibraryStore();

  async function handleImport() {
    if (!input || !selected) return;

    if (selected === 'spotify') {
      setStatus('loading');
      setErrorMessage('');
      try {
        const playlist = await fetchSpotifyPlaylist(input);
        const r = await matchAndSave(
          playlist.name, playlist.tracks, 'spotify',
          createPlaylist, addToPlaylist,
          (m, t) => setProgress({ matched: m, total: t }),
        );
        setResult(r);
        haptics.success();
        setStatus('success');
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to fetch playlist');
        setStatus('error');
      }
      return;
    }

    if (selected === 'apple') {
      setStatus('error');
      return;
    }

    if (selected === 'file') {
      if (!selectedFile) return;
      setStatus('loading');
      try {
        const playlist = await importFile(selectedFile);
        const r = await matchAndSave(
          playlist.name, playlist.tracks, 'file',
          createPlaylist, addToPlaylist,
          (m, t) => setProgress({ matched: m, total: t }),
        );
        setResult(r);
        haptics.success();
        setStatus('success');
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'File import failed');
        setStatus('error');
      }
      return;
    }

    // URL import — fetch the URL and try to parse it
    setStatus('loading');
    try {
      const res = await fetch(input);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const name = 'Imported Playlist';

      let tracks: { title: string; artist: string }[];
      if (input.endsWith('.m3u') || input.endsWith('.m3u8') || text.startsWith('#EXTM3U')) {
        tracks = parseM3U(text);
      } else {
        tracks = parseJSON(text);
      }

      const r = await matchAndSave(
        name, tracks, 'url',
        createPlaylist, addToPlaylist,
        (m, t) => setProgress({ matched: m, total: t }),
      );
      setResult(r);
      haptics.success();
      setStatus('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'URL import failed');
      setStatus('error');
    }
  }

  return (
    <div className="px-5 pt-14 pb-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Import Playlist</h1>
        <p className="text-text-secondary text-xs mt-1">Bring your library from anywhere</p>
      </div>

      {/* Source picker */}
      <div className="grid grid-cols-2 gap-2.5">
        {sources.map(({ id, icon: Icon, label, hint }) => (
          <button
            key={id}
            onClick={() => { setSelected(id); setStatus('idle'); setProgress({ matched: 0, total: 0 }); setSelectedFile(null); setInput(''); setErrorMessage(''); }}
            className={`flex flex-col gap-2 p-3.5 rounded-lg text-left transition-all ${
              selected === id
                ? 'bg-accent/10 text-text-primary'
                : 'bg-bg-surface text-text-secondary'
            } ${id === 'apple' ? 'opacity-50' : ''}`}
          >
            <Icon size={18} className={selected === id ? 'text-accent' : ''} />
            <span className="font-semibold text-sm">{label}</span>
            <span className="text-xs text-text-muted leading-tight">{hint}</span>
          </button>
        ))}
      </div>

      {/* Input area */}
      {selected && status !== 'success' && status !== 'loading' && (
        <div className="space-y-3">
          {selected === 'apple' && (
            <p className="text-text-muted text-xs text-center py-3">
              Apple Music import requires an Apple Developer account — coming in a future update.
            </p>
          )}
          {(selected === 'spotify' || selected === 'url') && (
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={selected === 'url' ? 'https://example.com/playlist.json' : 'https://open.spotify.com/playlist/...'}
              className="w-full bg-bg-surface rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted text-sm outline-none focus:ring-1 ring-accent/60 transition-shadow"
            />
          )}
          {selected === 'file' && (
            <label className="flex items-center justify-center gap-2 w-full bg-bg-surface rounded-lg py-8 cursor-pointer text-text-secondary text-sm">
              <FileJson size={16} />
              Tap to choose file
              <input type="file" accept=".json,.m3u,.m3u8" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setInput(f.name); setSelectedFile(f); } }} />
            </label>
          )}
          {selected !== 'apple' && (
            <button
              onClick={handleImport}
              disabled={!input}
              className="w-full bg-accent text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              Import Playlist
            </button>
          )}
        </div>
      )}

      {/* Apple Music "not supported" from the button click too */}
      {selected === 'apple' && status === 'error' && (
        <p className="text-text-muted text-xs text-center">Apple Music import is not yet available.</p>
      )}

      {/* Progress indicator during track matching */}
      {progress.total > 0 && status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={22} className="text-accent animate-spin" />
          <p className="text-text-secondary text-xs">
            Matching {progress.matched}/{progress.total} tracks…
          </p>
        </div>
      )}

      {/* Success state */}
      {status === 'success' && result && (
        <div className="flex flex-col items-center gap-2 py-8">
          <CheckCircle2 size={36} className="text-accent" />
          <p className="text-text-primary font-bold">{result.name}</p>
          <p className="text-text-secondary text-xs">{result.trackCount} tracks imported</p>
          <button onClick={() => { setStatus('idle'); setInput(''); setSelected(null); setProgress({ matched: 0, total: 0 }); setSelectedFile(null); }} className="mt-3 text-accent text-xs">
            Import another
          </button>
        </div>
      )}

      {status === 'error' && selected !== 'apple' && (
        <div className="text-center">
          <p className="text-error text-sm">Import failed</p>
          {errorMessage && <p className="text-text-muted text-xs mt-1">{errorMessage}</p>}
        </div>
      )}
    </div>
  );
}
