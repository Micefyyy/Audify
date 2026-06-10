import { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import type { AudioQuality } from '../store/settingsStore';

const qualityLabels: Record<AudioQuality, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  lossless: 'Lossless',
};

export default function SettingsPage() {
  const {
    audioQuality, setAudioQuality,
    downloadOnWifi, setDownloadOnWifi,
    crossfadeDuration, setCrossfadeDuration,
    equalizerPreset, setEqualizerPreset,
  } = useSettingsStore();

  const [qualityOpen, setQualityOpen] = useState(false);

  return (
    <div className="px-6 pt-14 pb-6 space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>

      {/* ── Audio Quality ────────────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => setQualityOpen(!qualityOpen)}
          className="flex justify-between items-center w-full py-3 border-b border-white/5"
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
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  audioQuality === q
                    ? 'bg-accent text-white'
                    : 'bg-bg-surface text-text-secondary active:bg-bg-elevated'
                }`}
              >
                {qualityLabels[q]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Download on Wi-Fi only ────────────────────────────────────────── */}
      <div className="flex justify-between items-center py-3 border-b border-white/5">
        <span className="text-text-primary text-sm">Download on Wi-Fi only</span>
        <button
          onClick={() => setDownloadOnWifi(!downloadOnWifi)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            downloadOnWifi ? 'bg-accent' : 'bg-bg-overlay'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              downloadOnWifi ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* ── Crossfade ─────────────────────────────────────────────────────── */}
      <div className="py-3 border-b border-white/5 space-y-2">
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
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-bg-overlay accent-accent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-glow"
        />
      </div>

      {/* ── Equalizer Preset ──────────────────────────────────────────────── */}
      <div className="flex justify-between items-center py-3 border-b border-white/5">
        <span className="text-text-primary text-sm">Equalizer</span>
        <select
          value={equalizerPreset}
          onChange={e => setEqualizerPreset(e.target.value)}
          className="bg-bg-surface text-text-secondary text-sm rounded-xl px-3 py-1.5 border border-white/5 outline-none"
        >
          {['Flat', 'Pop', 'Rock', 'Jazz', 'Classical', 'Hip-Hop', 'Electronic', 'Acoustic'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
