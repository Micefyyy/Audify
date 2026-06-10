// ── Home ────────────────────────────────────────────────────────────────────
export function HomePage() {
  return (
    <div className="px-6 pt-14 pb-6 space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Good evening</h1>
      {/* TODO: Featured carousel, Recently played, Recommended */}
      <div className="h-48 bg-bg-surface rounded-3xl flex items-center justify-center text-text-muted text-sm border border-white/5">
        Featured banner
      </div>
      <section>
        <h2 className="text-text-primary font-semibold mb-3">Recently Played</h2>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-bg-surface rounded-2xl p-3 flex items-center gap-3 border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-bg-overlay" />
              <span className="text-text-secondary text-xs">Playlist {i + 1}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Search ───────────────────────────────────────────────────────────────────
export function SearchPage() {
  return (
    <div className="px-6 pt-14 pb-6 space-y-4">
      <h1 className="text-2xl font-bold text-text-primary">Search</h1>
      <div className="bg-bg-surface border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-text-muted text-sm">🔍</span>
        <input placeholder="Songs, artists, albums…" className="bg-transparent flex-1 text-sm text-text-primary placeholder:text-text-muted outline-none" />
      </div>
      {/* TODO: Search results, Browse by genre */}
    </div>
  );
}

// ── Library ──────────────────────────────────────────────────────────────────
export function LibraryPage() {
  return (
    <div className="px-6 pt-14 pb-6 space-y-4">
      <h1 className="text-2xl font-bold text-text-primary">Your Library</h1>
      {/* TODO: Playlists, Albums, Artists, Downloaded */}
      <div className="text-text-muted text-sm">Your playlists will appear here.</div>
    </div>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────
export function SettingsPage() {
  return (
    <div className="px-6 pt-14 pb-6 space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      {[
        ['Audio Quality', 'High (320 kbps)'],
        ['Download over Wi-Fi only', 'On'],
        ['Crossfade', '3s'],
        ['Equalizer', 'Flat'],
        ['Cache Size', '512 MB'],
      ].map(([label, value]) => (
        <div key={label} className="flex justify-between items-center py-3 border-b border-white/5">
          <span className="text-text-primary text-sm">{label}</span>
          <span className="text-text-secondary text-sm">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default HomePage;
