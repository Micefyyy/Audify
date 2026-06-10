import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AudioQuality = 'low' | 'normal' | 'high' | 'lossless';

interface SettingsState {
  audioQuality: AudioQuality;
  downloadOnWifi: boolean;
  crossfadeDuration: number;
  equalizerPreset: string;

  setAudioQuality: (v: AudioQuality) => void;
  setDownloadOnWifi: (v: boolean) => void;
  setCrossfadeDuration: (v: number) => void;
  setEqualizerPreset: (v: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      audioQuality: 'high',
      downloadOnWifi: true,
      crossfadeDuration: 3,
      equalizerPreset: 'Flat',

      setAudioQuality(v) { set({ audioQuality: v }); },
      setDownloadOnWifi(v) { set({ downloadOnWifi: v }); },
      setCrossfadeDuration(v) { set({ crossfadeDuration: v }); },
      setEqualizerPreset(v) { set({ equalizerPreset: v }); },
    }),
    { name: 'audify-settings' },
  ),
);
