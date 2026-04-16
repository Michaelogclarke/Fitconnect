import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL    = 'https://api.spotify.com/v1';
const TOKEN_KEY   = 'spotify:access_token';
const REFRESH_KEY = 'spotify:refresh_token';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SpotifyTrack = {
  id:            string;
  name:          string;
  artist:        string;
  uri:           string;
  albumArt:      string | null; // small  (~64px)
  albumArtLarge: string | null; // large (~640px)
};

export type SpotifyPlaylist = {
  id:         string;
  name:       string;
  uri:        string;
  art:        string | null;
  trackCount: number;
};

export type SpotifySearchResult = {
  tracks:    SpotifyTrack[];
  playlists: SpotifyPlaylist[];
};

export type PlayerState = {
  isPlaying:   boolean;
  track:       SpotifyTrack | null;
  progressMs:  number;
  durationMs:  number;
  shuffle:     boolean;
  repeat:      'off' | 'track' | 'context';
};

// ─── Token storage ────────────────────────────────────────────────────────────

export async function saveTokens(accessToken: string, refreshToken?: string) {
  await AsyncStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_KEY);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
}

// ─── Token refresh ────────────────────────────────────────────────────────────

export async function refreshAccessToken(
  clientId: string,
  refreshToken: string,
): Promise<string | null> {
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
        client_id:     clientId,
      }).toString(),
    });
    const json = await res.json();
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function call(
  method: 'GET' | 'PUT' | 'POST',
  path:   string,
  token:  string,
  body?:  object,
): Promise<{ ok: boolean; status: number; data?: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization:  `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204 || res.status === 202) return { ok: true, status: res.status };
  try {
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: res.ok, status: res.status };
  }
}

// ─── Player state ─────────────────────────────────────────────────────────────

// Returns PlayerState when playing, null when no active device (204), false on auth error
export async function getPlayerState(token: string): Promise<PlayerState | null | false> {
  const { ok, status, data } = await call('GET', '/me/player', token);
  if (status === 204 || (ok && !data)) return null; // no active device — normal
  if (!ok) return false;                             // auth/network error

  const images = data.item?.album?.images ?? [];
  return {
    isPlaying:  data.is_playing ?? false,
    track: data.item ? {
      id:            data.item.id,
      name:          data.item.name,
      artist:        (data.item.artists ?? []).map((a: any) => a.name).join(', '),
      uri:           data.item.uri,
      albumArt:      images[images.length - 1]?.url ?? null,
      albumArtLarge: images[0]?.url ?? null,
    } : null,
    progressMs: data.progress_ms      ?? 0,
    durationMs: data.item?.duration_ms ?? 0,
    shuffle:    data.shuffle_state     ?? false,
    repeat:     data.repeat_state      ?? 'off',
  };
}

// ─── Playback controls ────────────────────────────────────────────────────────

export const spotifyPlay     = (token: string) => call('PUT',  '/me/player/play',     token);
export const spotifyPause    = (token: string) => call('PUT',  '/me/player/pause',    token);
export const spotifyNext     = (token: string) => call('POST', '/me/player/next',     token);
export const spotifyPrevious = (token: string) => call('POST', '/me/player/previous', token);

export function spotifyPlayContext(token: string, contextUri: string) {
  return call('PUT', '/me/player/play', token, { context_uri: contextUri });
}

export function spotifyPlayTrack(token: string, trackUri: string, contextUri?: string) {
  return call('PUT', '/me/player/play', token, {
    uris: [trackUri],
    ...(contextUri ? { context_uri: contextUri } : {}),
  });
}

export function spotifySetShuffle(token: string, state: boolean) {
  return call('PUT', `/me/player/shuffle?state=${state}`, token);
}

export function spotifySetRepeat(token: string, state: 'off' | 'track' | 'context') {
  return call('PUT', `/me/player/repeat?state=${state}`, token);
}

// ─── Browse ───────────────────────────────────────────────────────────────────

export async function getUserPlaylists(token: string): Promise<SpotifyPlaylist[]> {
  const { ok, data } = await call('GET', '/me/playlists?limit=50', token);
  if (!ok || !data?.items) return [];
  return (data.items as any[]).map((p) => ({
    id:         p.id,
    name:       p.name,
    uri:        p.uri,
    art:        p.images?.[0]?.url ?? null,
    trackCount: p.tracks?.total ?? 0,
  }));
}

export async function searchSpotify(
  token: string,
  query: string,
): Promise<SpotifySearchResult> {
  const q = encodeURIComponent(query);
  const { ok, data } = await call(
    'GET',
    `/search?q=${q}&type=track,playlist&limit=10`,
    token,
  );
  if (!ok || !data) return { tracks: [], playlists: [] };

  const tracks: SpotifyTrack[] = (data.tracks?.items ?? []).map((t: any) => {
    const images = t.album?.images ?? [];
    return {
      id:            t.id,
      name:          t.name,
      artist:        (t.artists ?? []).map((a: any) => a.name).join(', '),
      uri:           t.uri,
      albumArt:      images[images.length - 1]?.url ?? null,
      albumArtLarge: images[0]?.url ?? null,
    };
  });

  const playlists: SpotifyPlaylist[] = (data.playlists?.items ?? []).map((p: any) => ({
    id:         p.id,
    name:       p.name,
    uri:        p.uri,
    art:        p.images?.[0]?.url ?? null,
    trackCount: p.tracks?.total ?? 0,
  }));

  return { tracks, playlists };
}
