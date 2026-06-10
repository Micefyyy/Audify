import { useState } from 'react';
import { Music, Apple, Link2, FileJson, CheckCircle2, Loader2 } from 'lucide-react';
import { searchTracks } from '../services/audioService';
import { importFile, parseM3U, parseJSON } from '../services/fileImportService';
import { useHaptics } from '../hooks/useHaptics';
import {
  initiateSpotifyAuth,
  handleAuthCallback,
  exchangeCodeForToken,
  fetchSpotifyPlaylist,
  getCodeVerifier,
} from '../services/spotifyService';
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

  // Spotify multi-step
  const [callbackUrl, setCallbackUrl] = useState('');
  const [progress, setProgress] = useState({ matched: 0, total: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const haptics = useHaptics();
  const { createPlaylist, addToPlaylist } = useLibraryStore();

  async function handleImport() {
    if (!input || !selected) return;

    if (selected === 'spotify') {
      setStatus('loading');
      try {
        await initiateSpotifyAuth();
        return;
      } catch {
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
      } catch {
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
    } catch {
      setStatus('error');
    }
  }

  async function handleCallbackSubmit() {
    if (!callbackUrl.trim()) return;

    setStatus('loading');
    try {
      const code = handleAuthCallback(callbackUrl);
      const token = await exchangeCodeForToken(code, getCodeVerifier());

      const playlist = await fetchSpotifyPlaylist(input, token);

      const r = await matchAndSave(
        playlist.name, playlist.tracks, 'spotify',
        createPlaylist, addToPlaylist,
        (m, t) => setProgress({ matched: m, total: t }),
      );
      setResult(r);
      haptics.success();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="px-6 pt-14 pb-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Import Playlist</h1>
        <p className="text-text-secondary text-sm mt-1">Bring your library from anywhere</p>
      </div>

      {/* Source picker */}
      <div className="grid grid-cols-2 gap-3">
        {sources.map(({ id, icon: Icon, label, hint }) => (
          <button
            key={id}
            onClick={() => { setSelected(id); setStatus('idle'); setCallbackUrl(''); setProgress({ matched: 0, total: 0 }); setSelectedFile(null); setInput(''); }}
            className={`flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all ${
              selected === id
                ? 'border-accent bg-accent/10 text-text-primary'
                : 'border-white/5 bg-bg-surface text-text-secondary'
            } ${id === 'apple' ? 'opacity-50' : ''}`}
          >
            <Icon size={20} className={selected === id ? 'text-accent' : ''} />
            <span className="font-semibold text-sm">{label}</span>
            <span className="text-xs text-text-muted leading-tight">{hint}</span>
          </button>
        ))}
      </div>

      {/* Input area */}
      {selected && status !== 'success' && status !== 'loading' && !callbackUrl && (
        <div className="space-y-3">
          {selected === 'apple' && (
            <p className="text-text-muted text-sm text-center py-4">
              Apple Music import requires an Apple Developer account — coming in a future update.
            </p>
          )}
          {(selected === 'spotify' || selected === 'url') && (
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={selected === 'url' ? 'https://example.com/playlist.json' : 'https://open.spotify.com/playlist/...'}
              className="w-full bg-bg-surface border border-white/5 rounded-2xl px-4 py-3 text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent/60 transition-colors"
            />
          )}
          {selected === 'file' && (
            <label className="flex items-center justify-center gap-2 w-full bg-bg-surface border border-dashed border-white/10 rounded-2xl py-8 cursor-pointer text-text-secondary text-sm">
              <FileJson size={18} />
              Tap to choose file
              <input type="file" accept=".json,.m3u,.m3u8" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setInput(f.name); setSelectedFile(f); } }} />
            </label>
          )}
          {selected !== 'apple' && (
            <button
              onClick={handleImport}
              disabled={!input}
              className="w-full bg-accent text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              Import Playlist
            </button>
          )}
        </div>
      )}

      {/* Apple Music "not supported" from the button click too */}
      {selected === 'apple' && status === 'error' && !callbackUrl && (
        <p className="text-text-muted text-sm text-center">Apple Music import is not yet available.</p>
      )}

      {/* Spotify callback URL input (shown after auth window opens) */}
      {selected === 'spotify' && status === 'loading' && !callbackUrl && (
        <div className="space-y-3">
          <p className="text-text-secondary text-sm">
            After authorizing, you'll be redirected to a page that says "This site can't be reached" — copy the full URL from your browser's address bar and paste it below.
          </p>
          <input
            value={callbackUrl}
            onChange={e => setCallbackUrl(e.target.value)}
            placeholder="http://localhost/?code=…"
            className="w-full bg-bg-surface border border-white/5 rounded-2xl px-4 py-3 text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-accent/60 transition-colors"
          />
          <button
            onClick={handleCallbackSubmit}
            disabled={!callbackUrl.trim()}
            className="w-full bg-accent text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            Fetch Playlist
          </button>
          <button
            onClick={() => { setStatus('idle'); setCallbackUrl(''); }}
            className="w-full text-text-secondary text-sm py-2 active:text-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Progress indicator during track matching */}
      {progress.total > 0 && status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 size={28} className="text-accent animate-spin" />
          <p className="text-text-secondary text-sm">
            Matching {progress.matched}/{progress.total} tracks…
          </p>
        </div>
      )}

      {/* Success state */}
      {status === 'success' && result && (
        <div className="flex flex-col items-center gap-3 py-10">
          <CheckCircle2 size={48} className="text-accent" />
          <p className="text-text-primary font-bold text-lg">{result.name}</p>
          <p className="text-text-secondary text-sm">{result.trackCount} tracks imported</p>
          <button onClick={() => { setStatus('idle'); setInput(''); setSelected(null); setCallbackUrl(''); setProgress({ matched: 0, total: 0 }); setSelectedFile(null); }} className="mt-4 text-accent text-sm">
            Import another
          </button>
        </div>
      )}

      {status === 'error' && selected !== 'apple' && (
        <p className="text-error text-sm text-center">Import failed — check the link and try again.</p>
      )}
    </div>
  );
}
