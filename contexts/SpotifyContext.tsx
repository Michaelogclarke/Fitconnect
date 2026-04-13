import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as AuthSession from 'expo-auth-session';

import {
  PlayerState,
  SpotifyPlaylist,
  SpotifySearchResult,
  clearTokens,
  getPlayerState,
  getStoredRefreshToken,
  getStoredToken,
  getUserPlaylists,
  refreshAccessToken,
  saveTokens,
  searchSpotify,
  spotifyNext,
  spotifyPause,
  spotifyPlay,
  spotifyPlayContext,
  spotifyPlayTrack,
  spotifyPrevious,
  spotifySetRepeat,
  spotifySetShuffle,
} from '@/lib/spotify';

const CLIENT_ID    = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';
const REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'fitconnect', path: 'spotify-auth' });
const DISCOVERY    = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint:         'https://accounts.spotify.com/api/token',
};
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
];

// ─── Context type ─────────────────────────────────────────────────────────────

type SpotifyContextValue = {
  isConnected:  boolean;
  playerState:  PlayerState | null;
  connect:      () => void;
  disconnect:   () => void;
  play:         () => Promise<void>;
  pause:        () => Promise<void>;
  skipNext:     () => Promise<void>;
  skipPrevious: () => Promise<void>;
  setShuffle:   (state: boolean) => Promise<void>;
  setRepeat:    (state: 'off' | 'track' | 'context') => Promise<void>;
  playContext:  (uri: string) => Promise<void>;
  playTrack:    (uri: string) => Promise<void>;
  getPlaylists: () => Promise<SpotifyPlaylist[]>;
  search:       (query: string) => Promise<SpotifySearchResult>;
};

const SpotifyContext = createContext<SpotifyContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SpotifyProvider({ children }: { children: React.ReactNode }) {
  const [token,       setToken]       = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    { clientId: CLIENT_ID, scopes: SCOPES, usePKCE: true, redirectUri: REDIRECT_URI },
    DISCOVERY,
  );

  // Restore token on mount
  useEffect(() => {
    getStoredToken().then((t) => { if (t) setToken(t); });
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    if (response?.type !== 'success' || !request?.codeVerifier) return;
    AuthSession.exchangeCodeAsync(
      {
        clientId:    CLIENT_ID,
        redirectUri: REDIRECT_URI,
        code:        response.params.code,
        extraParams: { code_verifier: request.codeVerifier },
      },
      DISCOVERY,
    ).then(async (result) => {
      await saveTokens(result.accessToken, result.refreshToken ?? undefined);
      setToken(result.accessToken);
    }).catch(() => {});
  }, [response]);

  // Poll player every 3s
  useEffect(() => {
    if (!token) {
      if (pollRef.current) clearInterval(pollRef.current);
      setPlayerState(null);
      return;
    }

    async function poll() {
      const state = await getPlayerState(token!);
      if (state === null) {
        const refreshToken = await getStoredRefreshToken();
        if (refreshToken) {
          const newToken = await refreshAccessToken(CLIENT_ID, refreshToken);
          if (newToken) { await saveTokens(newToken); setToken(newToken); return; }
          await clearTokens();
          setToken(null);
        }
      }
      setPlayerState(state);
    }

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token]);

  // Refetch player state after a skip (track changes)
  async function refetch() {
    if (!token) return;
    setTimeout(async () => {
      const s = await getPlayerState(token);
      if (s) setPlayerState(s);
    }, 600);
  }

  const connect    = useCallback(() => promptAsync(), [promptAsync]);
  const disconnect = useCallback(async () => {
    await clearTokens(); setToken(null); setPlayerState(null);
  }, []);

  const play = useCallback(async () => {
    if (!token) return;
    await spotifyPlay(token);
    setPlayerState((s) => s ? { ...s, isPlaying: true } : s);
  }, [token]);

  const pause = useCallback(async () => {
    if (!token) return;
    await spotifyPause(token);
    setPlayerState((s) => s ? { ...s, isPlaying: false } : s);
  }, [token]);

  const skipNext = useCallback(async () => {
    if (!token) return;
    await spotifyNext(token);
    refetch();
  }, [token]);

  const skipPrevious = useCallback(async () => {
    if (!token) return;
    await spotifyPrevious(token);
    refetch();
  }, [token]);

  const setShuffle = useCallback(async (state: boolean) => {
    if (!token) return;
    await spotifySetShuffle(token, state);
    setPlayerState((s) => s ? { ...s, shuffle: state } : s);
  }, [token]);

  const setRepeat = useCallback(async (state: 'off' | 'track' | 'context') => {
    if (!token) return;
    await spotifySetRepeat(token, state);
    setPlayerState((s) => s ? { ...s, repeat: state } : s);
  }, [token]);

  const playContext = useCallback(async (uri: string) => {
    if (!token) return;
    await spotifyPlayContext(token, uri);
    refetch();
  }, [token]);

  const playTrack = useCallback(async (uri: string) => {
    if (!token) return;
    await spotifyPlayTrack(token, uri);
    refetch();
  }, [token]);

  const getPlaylists = useCallback(
    () => (token ? getUserPlaylists(token) : Promise.resolve([])),
    [token],
  );

  const search = useCallback(
    (query: string) => (token ? searchSpotify(token, query) : Promise.resolve({ tracks: [], playlists: [] })),
    [token],
  );

  return (
    <SpotifyContext.Provider value={{
      isConnected: !!token,
      playerState,
      connect, disconnect,
      play, pause, skipNext, skipPrevious,
      setShuffle, setRepeat,
      playContext, playTrack,
      getPlaylists, search,
    }}>
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const ctx = useContext(SpotifyContext);
  if (!ctx) throw new Error('useSpotify must be used inside SpotifyProvider');
  return ctx;
}
