# Audify 🎵

A clean, minimal music app — all premium features free, built with React + Capacitor, sideloaded via Xcode.

---

## Stack

| Layer | Tech |
|---|---|
| UI | React 18 + TypeScript + Tailwind CSS |
| Routing | React Router v6 |
| State | Zustand |
| Animation | Framer Motion |
| Audio playback | Howler.js (HTML5 Audio / Web Audio API) |
| Native bridge | Capacitor 6 |
| iOS sideload | Xcode (no App Store needed) |

---

## Project Structure

```
audify/
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Tab bar + mini-player shell
│   │   └── Player/
│   │       └── MiniPlayer.tsx  # Sticky mini player above nav
│   ├── pages/
│   │   ├── Home.tsx            # Home + Search + Library + Settings stubs
│   │   ├── NowPlaying.tsx      # Full-screen player
│   │   ├── Lyrics.tsx          # Synced lyrics viewer
│   │   └── Import.tsx          # Playlist import (Spotify / Apple / URL / file)
│   ├── store/
│   │   └── playerStore.ts      # Zustand — queue, playback, volume, shuffle/repeat
│   └── styles/
│       └── globals.css         # Tailwind + safe-area helpers + glass utility
├── capacitor.config.ts
├── tailwind.config.js
└── index.html
```

---

## Feature Roadmap

### ✅ Scaffolded
- [x] Full-screen Now Playing with scrubber, artwork, controls
- [x] Mini player (persistent, above tab bar)
- [x] Synced lyrics page (auto-scrolls to active line)
- [x] Playlist import UI — Spotify, Apple Music, URL, JSON/M3U
- [x] Shuffle, Repeat (off / all / one)
- [x] Zustand player store with Howler.js audio engine
- [x] Capacitor config for iOS sideload

### 🔲 Next to build
- [ ] **Audio source** — wire up a streaming API (see below)
- [ ] Search with live results
- [ ] Library — playlists, albums, liked songs
- [ ] Download for offline (Capacitor Filesystem)
- [ ] Lyrics API (Musixmatch / lrclib.net — free tier)
- [ ] Equalizer (Web Audio API BiquadFilter nodes)
- [ ] Crossfade between tracks
- [ ] Sleep timer
- [ ] AirPlay / Bluetooth metadata (MPNowPlayingInfoCenter via Capacitor plugin)

---

## Audio Sources (pick one)

| Option | Notes |
|---|---|
| **yt-dlp + local server** | Run a tiny Express proxy on your Mac; app streams from `localhost`. Legal grey area for personal use. |
| **Piped API** | Open-source YouTube front-end with a JSON API. Free, no key needed. |
| **SoundCloud public API** | Free tracks only, but huge catalogue. |
| **Self-hosted Navidrome** | Point at your own music collection — fully legal. |
| **Subsonic-compatible API** | Many self-hosted servers speak this protocol. |

Set the base URL in `src/services/audioService.ts` (create this file).

---

## Playlist Import — Real Implementation Notes

### Spotify
Spotify's API requires OAuth. Flow:
1. Register an app at developer.spotify.com (free).
2. Auth the user → get an access token.
3. `GET /v1/playlists/{id}/tracks` → map to your `Track` type.
4. Match each track to your audio source by title + artist.

### Apple Music
Use the MusicKit JS SDK (free, needs an Apple Developer account).

### JSON / M3U
Parse locally — no network needed. M3U is just a text playlist format.

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run in browser (for rapid UI dev)
npm run dev

# 3. Build & sync to Xcode
npm run build
npx cap add ios          # first time only
npm run cap:sync
npm run cap:ios          # opens Xcode
```

### Sideloading via Xcode
1. Plug in your iPhone.
2. In Xcode → select your device as the run target.
3. Under **Signing & Capabilities** → select your personal Apple ID team.
4. Hit **Run** (▶). Xcode will sign and install the app.
5. On iPhone → **Settings → General → VPN & Device Management** → trust your developer certificate.

> Free Apple developer accounts can sideload to one device for 7 days before re-signing. A $99/yr paid account removes this limit.

---

## Design Tokens (Tailwind)

| Token | Value | Use |
|---|---|---|
| `bg-base` | `#0A0A0A` | App background |
| `bg-surface` | `#141414` | Cards, list items |
| `bg-elevated` | `#1E1E1E` | Mini player, modals |
| `accent` | `#6C63FF` | Buttons, active states |
| `text-primary` | `#F2F2F2` | Headings, track titles |
| `text-secondary` | `#8A8A8A` | Artist names, subtitles |
| `text-muted` | `#4A4A4A` | Timestamps, inactive icons |
