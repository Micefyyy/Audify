import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DownloadStatus = 'downloading' | 'done' | 'error';

interface DownloadsState {
  downloads: Record<string, DownloadStatus>;
  setStatus: (trackId: string, status: DownloadStatus) => void;
  removeDownload: (trackId: string) => void;
}

export const useDownloadsStore = create<DownloadsState>()(
  persist(
    (set) => ({
      downloads: {},

      setStatus(trackId, status) {
        set(s => ({ downloads: { ...s.downloads, [trackId]: status } }));
      },

      removeDownload(trackId) {
        set(s => {
          const { [trackId]: _, ...rest } = s.downloads;
          return { downloads: rest };
        });
      },
    }),
    { name: 'audify-downloads' },
  ),
);
