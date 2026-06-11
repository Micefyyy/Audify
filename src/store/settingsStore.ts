import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AudioQuality = 'low' | 'normal' | 'high' | 'lossless';
export type Theme = 'dark' | 'light';

export const DEFAULT_PIPED_INSTANCE = 'https://api.piped.private.coffee';

interface SettingsState {
  audioQuality: AudioQuality;
  downloadOnWifi: boolean;
  crossfadeDuration: number;
  equalizerPreset: string;
  pipedInstance: string;
  theme: Theme;

  setAudioQuality: (v: AudioQuality) => void;
  setDownloadOnWifi: (v: boolean) => void;
  setCrossfadeDuration: (v: number) => void;
  setEqualizerPreset: (v: string) => void;
  setPipedInstance: (v: string) => void;
  setTheme: (v: Theme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      audioQuality: 'high',
      downloadOnWifi: true,
      crossfadeDuration: 3,
      equalizerPreset: 'Flat',
      pipedInstance: DEFAULT_PIPED_INSTANCE,
      theme: 'dark',

      setAudioQuality(v) { set({ audioQuality: v }); },
      setDownloadOnWifi(v) { set({ downloadOnWifi: v }); },
      setCrossfadeDuration(v) { set({ crossfadeDuration: v }); },
      setEqualizerPreset(v) { set({ equalizerPreset: v }); },
      setPipedInstance(v) { set({ pipedInstance: v }); },
      setTheme(v) { set({ theme: v }); },
    }),
    { name: 'audify-settings' },
  ),
);
