# Audify Changelog

## Nuclear-Inspired Overhaul (June 25, 2026)

Complete rewrite of the app to mirror [Nuclear](https://github.com/nukeop/nuclear) music player's features, adapted for mobile.

### New Features

**Album Pages**
- New `/album/:encodedUrl` route with full album view
- Album artwork, title, artist (clickable), track listing
- Like/unlike albums, Play All, Shuffle
- Track count and total duration display

**Enhanced Artist Pages**
- Full artist page with large circular avatar
- About section with biography (when available)
- Discography section with horizontal scrollable album cards
- Similar Artists section with horizontal scrollable artist cards
- Top Tracks section with numbered list
- Like/unlike artists

**Search with Tabs**
- 3 search tabs: Tracks, Albums, Artists
- All three types searched in parallel (400ms debounce)
- Album results show artwork, title, artist, year badge
- Artist results show circular thumbnail, name
- Genre browse grid when no query

**Enhanced Library**
- 5 tabs: Playlists, Liked, Albums, Artists, Downloads
- Albums tab: 2-column grid of liked album cards
- Artists tab: List with circular thumbnails

**8 Built-in Themes** (like Nuclear)
- Dark, Light, Green, Aqua, Mint, Orange, Red, Violet
- Each theme has unique accent color and surface tones
- Theme picker in Settings with color swatches

**Drag-and-Drop Queue**
- Touch-based drag reordering with grip handles
- Visual feedback: dragged item fades, target position highlighted

**Crossfade**
- Configurable 0-8 seconds
- Fades out old track, fades in new one
- Uses Howler.js `fade()` API

**Equalizer**
- 10-band BiquadFilter chain via Web Audio API
- 8 presets: Flat, Pop, Rock, Jazz, Classical, Hip-Hop, Electronic, Acoustic
- Applied automatically on each new track

**Playlist Export**
- Export service for JSON and M3U formats
- Available for future UI integration

**Improved NowPlaying**
- Larger artwork with shadow
- Better spacing and control layout
- Draggable progress thumb

### Files Changed

| File | Type |
|---|---|
| `src/pages/Album.tsx` | New |
| `src/services/playlistExportService.ts` | New |
| `src/store/settingsStore.ts` | Rewritten |
| `src/store/libraryStore.ts` | Rewritten |
| `src/store/playerStore.ts` | Rewritten |
| `src/services/audioService.ts` | Rewritten |
| `src/styles/globals.css` | Rewritten |
| `src/pages/Search.tsx` | Rewritten |
| `src/pages/Library.tsx` | Rewritten |
| `src/pages/Artist.tsx` | Rewritten |
| `src/pages/Settings.tsx` | Rewritten |
| `src/pages/NowPlaying.tsx` | Rewritten |
| `src/pages/Queue.tsx` | Rewritten |
| `src/pages/Home.tsx` | Rewritten |
| `src/App.tsx` | Updated (new route) |
| `src/components/Layout.tsx` | Updated (dynamic theme) |

### API Additions

**audioService.ts**
- `searchAlbums(query)` - Search for albums via Piped
- `searchArtists(query)` - Search for artists via Piped
- `getAlbumTracks(albumUrl)` - Get tracks for an album/playlist
- `getArtistInfo(artistName)` - Get artist, tracks, and albums
- `getSimilarArtists(artistName)` - Get similar artists

**libraryStore.ts**
- `likedAlbums: Album[]` - Persisted liked albums
- `likedArtists: Artist[]` - Persisted liked artists
- `addAlbumLike/removeAlbumLike/isAlbumLiked` - Album like actions
- `addArtistLike/removeArtistLike/isArtistLiked` - Artist like actions

**playerStore.ts**
- `applyEqPreset(name)` - Apply equalizer preset
- Crossfade logic in `initHowl()` using settings store

**settingsStore.ts**
- `ThemeName` type with 8 options
- `THEMES` record with full color configs
- `theme` state replaces boolean `isDark`
