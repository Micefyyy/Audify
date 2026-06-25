import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AudioQuality = 'low' | 'normal' | 'high' | 'lossless';
export type ThemeName = 'dark' | 'light' | 'green' | 'aqua' | 'mint' | 'orange' | 'red' | 'violet';

export const DEFAULT_PIPED_INSTANCE = 'https://api.piped.private.coffee';

export interface Theme {
  name: ThemeName;
  label: string;
  accent: string;
  accentHover: string;
  bgBase: string;
  bgSurface: string;
  bgElevated: string;
  bgOverlay: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  error: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  dark: {
    name: 'dark', label: 'Dark',
    accent: '#6C63FF', accentHover: '#7D75FF',
    bgBase: '#0C0C0C', bgSurface: '#161616', bgElevated: '#1E1E1E', bgOverlay: '#262626',
    textPrimary: '#F5F5F5', textSecondary: '#9E9E9E', textMuted: '#555555',
    error: '#FF453A',
  },
  light: {
    name: 'light', label: 'Light',
    accent: '#6C63FF', accentHover: '#5B52E0',
    bgBase: '#F5F5F5', bgSurface: '#FFFFFF', bgElevated: '#EBEBEB', bgOverlay: '#D6D6D6',
    textPrimary: '#1A1A1A', textSecondary: '#666666', textMuted: '#999999',
    error: '#DC3545',
  },
  green: {
    name: 'green', label: 'Green',
    accent: '#1DB954', accentHover: '#1ED760',
    bgBase: '#0C0C0C', bgSurface: '#121A14', bgElevated: '#1A261E', bgOverlay: '#223328',
    textPrimary: '#F5F5F5', textSecondary: '#9E9E9E', textMuted: '#555555',
    error: '#FF453A',
  },
  aqua: {
    name: 'aqua', label: 'Aqua',
    accent: '#00BCD4', accentHover: '#26C6DA',
    bgBase: '#0C0C0C', bgSurface: '#111A1E', bgElevated: '#1A2428', bgOverlay: '#223038',
    textPrimary: '#F5F5F5', textSecondary: '#9E9E9E', textMuted: '#555555',
    error: '#FF453A',
  },
  mint: {
    name: 'mint', label: 'Mint',
    accent: '#00E5A0', accentHover: '#33EAB7',
    bgBase: '#0C0C0C', bgSurface: '#111C18', bgElevated: '#1A2822', bgOverlay: '#22352E',
    textPrimary: '#F5F5F5', textSecondary: '#9E9E9E', textMuted: '#555555',
    error: '#FF453A',
  },
  orange: {
    name: 'orange', label: 'Orange',
    accent: '#FF9800', accentHover: '#FFA726',
    bgBase: '#0C0C0C', bgSurface: '#1A1510', bgElevated: '#241E16', bgOverlay: '#2E281E',
    textPrimary: '#F5F5F5', textSecondary: '#9E9E9E', textMuted: '#555555',
    error: '#FF453A',
  },
  red: {
    name: 'red', label: 'Red',
    accent: '#E53935', accentHover: '#EF5350',
    bgBase: '#0C0C0C', bgSurface: '#1A1112', bgElevated: '#241A1B', bgOverlay: '#2E2324',
    textPrimary: '#F5F5F5', textSecondary: '#9E9E9E', textMuted: '#555555',
    error: '#FF453A',
  },
  violet: {
    name: 'violet', label: 'Violet',
    accent: '#9C27B0', accentHover: '#AB47BC',
    bgBase: '#0C0C0C', bgSurface: '#17101C', bgElevated: '#211A26', bgOverlay: '#2B2430',
    textPrimary: '#F5F5F5', textSecondary: '#9E9E9E', textMuted: '#555555',
    error: '#FF453A',
  },
};

interface SettingsState {
  audioQuality: AudioQuality;
  downloadOnWifi: boolean;
  crossfadeDuration: number;
  equalizerPreset: string;
  pipedInstance: string;
  theme: ThemeName;

  setAudioQuality: (v: AudioQuality) => void;
  setDownloadOnWifi: (v: boolean) => void;
  setCrossfadeDuration: (v: number) => void;
  setEqualizerPreset: (v: string) => void;
  setPipedInstance: (v: string) => void;
  setTheme: (v: ThemeName) => void;
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
