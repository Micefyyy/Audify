/**
 * Spotify OAuth PKCE + Web API integration.
 *
 * ── Setup ────────────────────────────────────────────────────────────────────
 * 1. Go to https://developer.spotify.com/dashboard and create an app.
 * 2. Copy the Client ID and paste it as CLIENT_ID below.
 * 3. In the Spotify Dashboard → Edit Settings, add `http://localhost`
 *    to the Redirect URIs list.
 * 4. No client secret is needed — PKCE uses the code verifier instead.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CLIENT_ID = ''; // ← Paste your Spotify Client ID here (get one free at developer.spotify.com)
const REDIRECT_URI = 'http://localhost';
const SCOPES = ['playlist-read-private', 'playlist-read-collaborative'];

let _codeVerifier: string | null = null;

function base64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateCodeVerifier(): string {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64url(bytes.buffer);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
  return base64url(digest);
}

export function getCodeVerifier(): string {
  if (!_codeVerifier) throw new Error('No code verifier. Call initiateSpotifyAuth() first.');
  return _codeVerifier;
}

export async function initiateSpotifyAuth(): Promise<void> {
  if (!CLIENT_ID) throw new Error(
    'Set your Spotify Client ID in src/services/spotifyService.ts ' +
    '(get one free at https://developer.spotify.com/dashboard)',
  );

  _codeVerifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(_codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES.join(' '),
  });

  window.open(`https://accounts.spotify.com/authorize?${params.toString()}`);
}

export function handleAuthCallback(url: string): string {
  const u = new URL(url);
  const code = u.searchParams.get('code');
  if (!code) throw new Error('No authorization code found in callback URL');
  return code;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<string> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

function extractPlaylistId(url: string): string {
  const m = /(?:open\.spotify\.com\/playlist\/|spotify:playlist:)([a-zA-Z0-9]+)/.exec(url);
  if (!m) throw new Error('Invalid Spotify playlist URL');
  return m[1];
}

export async function fetchSpotifyPlaylist(
  playlistUrl: string,
  token: string,
): Promise<{ name: string; tracks: { title: string; artist: string }[] }> {
  const id = extractPlaylistId(playlistUrl);

  const res = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify API failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  const tracks: { title: string; artist: string }[] =
    (data.tracks?.items ?? []).map((item: any) => ({
      title: item.track?.name ?? 'Unknown',
      artist: item.track?.artists?.[0]?.name ?? 'Unknown',
    }));

  return { name: data.name ?? 'Imported Playlist', tracks };
}
