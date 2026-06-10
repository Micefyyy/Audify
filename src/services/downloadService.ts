import { Filesystem, Directory } from '@capacitor/filesystem';
import type { Track } from '../store/playerStore';

const TRACKS_DIR = 'audify/tracks';

function filePath(trackId: string): string {
  return `${TRACKS_DIR}/${trackId}.mp3`;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function ensureDir(): Promise<void> {
  try {
    await Filesystem.mkdir({ path: TRACKS_DIR, directory: Directory.Documents, recursive: true });
  } catch {
    // directory already exists
  }
}

export async function getLocalTrackUri(trackId: string): Promise<string> {
  const result = await Filesystem.getUri({ path: filePath(trackId), directory: Directory.Documents });
  return result.uri;
}

export async function downloadTrack(track: Track): Promise<Track> {
  await ensureDir();

  const res = await fetch(track.audioUrl);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }

  const blob = await res.blob();
  const base64 = await blobToBase64(blob);

  await Filesystem.writeFile({
    path: filePath(track.id),
    data: base64,
    directory: Directory.Documents,
  });

  const uri = await getLocalTrackUri(track.id);
  return { ...track, audioUrl: uri, source: 'local' };
}

export async function isDownloaded(trackId: string): Promise<boolean> {
  try {
    await Filesystem.stat({ path: filePath(trackId), directory: Directory.Documents });
    return true;
  } catch {
    return false;
  }
}

export async function deleteDownload(trackId: string): Promise<void> {
  await Filesystem.deleteFile({ path: filePath(trackId), directory: Directory.Documents });
}

export async function getDownloadedTracks(): Promise<string[]> {
  try {
    const result = await Filesystem.readdir({ path: TRACKS_DIR, directory: Directory.Documents });
    return result.files.map(f => f.name.replace(/\.mp3$/, ''));
  } catch {
    return [];
  }
}
