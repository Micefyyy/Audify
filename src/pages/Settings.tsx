import { useState } from 'react';
import { useSettingsStore, DEFAULT_PIPED_INSTANCE, THEMES } from '../store/settingsStore';
import type { AudioQuality, ThemeName } from '../store/settingsStore';
import { Check } from 'lucide-react';

const qualityLabels: Record<AudioQuality, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  lossless: 'Lossless',
};

const themeNames: ThemeName[] = ['dark', 'light', 'green', 'aqua', 'mint', 'orange', 'red', 'violet'];

export default function SettingsPage() {
  const {
    audioQuality, setAudioQuality,
    downloadOnWifi, setDownloadOnWifi,
    crossfadeDuration, setCrossfadeDuration,
    equalizerPreset, setEqualizerPreset,
    pipedInstance, setPipedInstance,
    theme, setTheme,
  } = useSettingsStore();

  const [qualityOpen, setQualityOpen] = useState(false);

  return (
    <div className="px-5 pt-14 pb-6 space-y-6">
      <h1 className="text-xl font-bold text-text-primary">Settings</h1>

      {/* ── Appearance ───────────────────────────────────────────────────── */}
      <div className="py-3 border-b border-white/[0.04] space-y-3">
        <span className="text-text-primary text-sm font-medium">Appearance</span>
        <div className="grid grid-cols-4 gap-4">
          {themeNames.map(name => {
            const t = THEMES[name];
            const selected = theme === name;
            return (
              <button
                key={name}
                onClick={() => setTheme(name)}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className={`relative w-10 h-10 rounded-full transition-all ${
                    selected
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-base)] scale-105'
                      : 'group-hover:scale-105'
                  }`}
                  style={{ backgroundColor: t.accent }}
                >
                  {selected && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Check size={16} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <span className={`text-xs ${selected ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Audio Quality ────────────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => setQualityOpen(!qualityOpen)}
          className="flex justify-between items-center w-full py-3 border-b border-white/[0.04]"
        >
          <span className="text-text-primary text-sm">Audio Quality</span>
          <span className="text-text-secondary text-sm">{qualityLabels[audioQuality]}</span>
        </button>

        {qualityOpen && (
          <div className="flex gap-2 mt-3">
            {(Object.keys(qualityLabels) as AudioQuality[]).map(q => (
              <button
                key={q}
                onClick={() => { setAudioQuality(q); setQualityOpen(false); }}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  audioQuality === q
                    ? 'bg-accent text-white'
                    : 'bg-bg-surface text-text-secondary hover:bg-bg-elevated'
                }`}
              >
                {qualityLabels[q]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Download on Wi-Fi only ────────────────────────────────────────── */}
      <div className="flex justify-between items-center py-3 border-b border-white/[0.04]">
        <span className="text-text-primary text-sm">Download on Wi-Fi only</span>
        <button
          onClick={() => setDownloadOnWifi(!downloadOnWifi)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            downloadOnWifi ? 'bg-accent' : 'bg-bg-overlay'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              downloadOnWifi ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* ── Crossfade ─────────────────────────────────────────────────────── */}
      <div className="py-3 border-b border-white/[0.04] space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-text-primary text-sm">Crossfade</span>
          <span className="text-text-secondary text-sm">{crossfadeDuration}s</span>
        </div>
        <input
          type="range"
          min={0}
          max={8}
          step={0.5}
          value={crossfadeDuration}
          onChange={e => setCrossfadeDuration(parseFloat(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer bg-bg-overlay accent-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
        />
      </div>

      {/* ── Equalizer Preset ──────────────────────────────────────────────── */}
      <div className="flex justify-between items-center py-3 border-b border-white/[0.04]">
        <span className="text-text-primary text-sm">Equalizer</span>
        <select
          value={equalizerPreset}
          onChange={e => setEqualizerPreset(e.target.value)}
          className="bg-bg-surface text-text-secondary text-xs rounded-lg px-3 py-1.5 outline-none"
        >
          {['Flat', 'Pop', 'Rock', 'Jazz', 'Classical', 'Hip-Hop', 'Electronic', 'Acoustic'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* ── Piped Instance ──────────────────────────────────────────────────── */}
      <div className="py-3 border-b border-white/[0.04] space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-text-primary text-sm">Piped Instance</span>
          {pipedInstance !== DEFAULT_PIPED_INSTANCE && (
            <button
              onClick={() => setPipedInstance(DEFAULT_PIPED_INSTANCE)}
              className="text-accent text-xs"
            >
              Reset
            </button>
          )}
        </div>
        <input
          type="url"
          value={pipedInstance}
          onChange={e => setPipedInstance(e.target.value)}
          placeholder={DEFAULT_PIPED_INSTANCE}
          className="w-full bg-bg-surface text-text-primary text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 ring-accent/60 transition-shadow"
        />
        <p className="text-text-muted text-xs leading-relaxed">
          API URL of a Piped instance. Uses <code className="text-accent/80">{DEFAULT_PIPED_INSTANCE}</code> by default.
        </p>
      </div>
    </div>
  );
}
