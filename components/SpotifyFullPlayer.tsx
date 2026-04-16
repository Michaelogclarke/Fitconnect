import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useSpotify } from '@/contexts/SpotifyContext';
import { SpotifyPlaylist, SpotifyTrack } from '@/lib/spotify';

type Tab = 'player' | 'browse';

type Props = {
  visible:  boolean;
  onClose:  () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMs(ms: number) {
  const total = Math.floor(ms / 1000);
  const m     = Math.floor(total / 60);
  const s     = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlaylistRow({
  item,
  onPress,
}: {
  item: SpotifyPlaylist;
  onPress: () => void;
}) {
  const C = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection:  'row',
        alignItems:     'center',
        paddingVertical: Spacing.sm,
        gap:            Spacing.md,
      }}>
      {item.art ? (
        <Image source={{ uri: item.art }} style={{ width: 48, height: 48, borderRadius: Radius.sm }} />
      ) : (
        <View style={{
          width: 48, height: 48, borderRadius: Radius.sm,
          backgroundColor: C.surfaceContainerHighest,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <IconSymbol name="music.note.list" size={20} color={C.onSurfaceVariant} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ ...Typography.titleMd, color: C.onSurface }}>
          {item.name}
        </Text>
        <Text style={{ ...Typography.labelMd, color: C.onSurfaceVariant }}>
          {item.trackCount} tracks
        </Text>
      </View>
      <IconSymbol name="play.fill" size={14} color={C.onSurfaceVariant} />
    </TouchableOpacity>
  );
}

function TrackRow({
  item,
  onPress,
  isPlaying,
}: {
  item:      SpotifyTrack;
  onPress:   () => void;
  isPlaying: boolean;
}) {
  const C = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection:  'row',
        alignItems:     'center',
        paddingVertical: Spacing.sm,
        gap:            Spacing.md,
      }}>
      {item.albumArt ? (
        <Image source={{ uri: item.albumArt }} style={{ width: 48, height: 48, borderRadius: Radius.sm }} />
      ) : (
        <View style={{
          width: 48, height: 48, borderRadius: Radius.sm,
          backgroundColor: C.surfaceContainerHighest,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <IconSymbol name="music.note" size={20} color={C.onSurfaceVariant} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ ...Typography.titleMd, color: isPlaying ? '#1DB954' : C.onSurface }}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={{ ...Typography.labelMd, color: C.onSurfaceVariant }}>
          {item.artist}
        </Text>
      </View>
      {isPlaying && (
        <IconSymbol name="waveform" size={14} color="#1DB954" />
      )}
    </TouchableOpacity>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SpotifyFullPlayer({ visible, onClose }: Props) {
  const C = useColors();
  const {
    playerState,
    play, pause, skipNext, skipPrevious,
    setShuffle, setRepeat,
    playContext, playTrack,
    getPlaylists, search,
  } = useSpotify();

  const [tab,           setTab]          = useState<Tab>('player');
  const [localProgress, setLocalProgress] = useState(0);
  const [playlists,     setPlaylists]    = useState<SpotifyPlaylist[]>([]);
  const [searchQuery,   setSearchQuery]  = useState('');
  const [searchTracks,  setSearchTracks] = useState<SpotifyTrack[]>([]);
  const [searchLists,   setSearchLists]  = useState<SpotifyPlaylist[]>([]);
  const [loadingLists,  setLoadingLists] = useState(false);
  const [searching,     setSearching]    = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync progress from poll, then interpolate locally
  useEffect(() => {
    setLocalProgress(playerState?.progressMs ?? 0);
  }, [playerState?.progressMs]);

  useEffect(() => {
    if (!playerState?.isPlaying) return;
    const id = setInterval(() => {
      setLocalProgress((p) =>
        Math.min(p + 1000, playerState?.durationMs ?? 0),
      );
    }, 1000);
    return () => clearInterval(id);
  }, [playerState?.isPlaying, playerState?.durationMs]);

  // Load playlists when Browse tab opens
  useEffect(() => {
    if (tab !== 'browse' || playlists.length > 0) return;
    setLoadingLists(true);
    getPlaylists().then((data) => {
      setPlaylists(data);
      setLoadingLists(false);
    });
  }, [tab]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) { setSearchTracks([]); setSearchLists([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const results = await search(text);
      setSearchTracks(results.tracks);
      setSearchLists(results.playlists);
      setSearching(false);
    }, 400);
  }, [search]);

  const handlePlayPlaylist = useCallback(async (uri: string) => {
    await playContext(uri);
    setTab('player');
  }, [playContext]);

  const handlePlayTrack = useCallback(async (uri: string) => {
    await playTrack(uri);
    setTab('player');
  }, [playTrack]);

  const cycleRepeat = useCallback(() => {
    const next: Record<string, 'off' | 'track' | 'context'> = {
      off:     'context',
      context: 'track',
      track:   'off',
    };
    setRepeat(next[playerState?.repeat ?? 'off']);
  }, [playerState?.repeat, setRepeat]);

  const track    = playerState?.track;
  const progress = playerState?.durationMs
    ? Math.min(localProgress / playerState.durationMs, 1)
    : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top', 'bottom']}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={{
          flexDirection:  'row',
          alignItems:     'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.lg,
          paddingVertical:   Spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: C.outlineVariant,
        }}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <IconSymbol name="chevron.down" size={22} color={C.onSurface} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#1DB954' }} />
            <Text style={{ ...Typography.titleMd, color: C.onSurface }}>Spotify</Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <View style={{
          flexDirection:    'row',
          marginHorizontal: Spacing.lg,
          marginTop:        Spacing.md,
          backgroundColor:  C.surfaceContainer,
          borderRadius:     Radius.full,
          padding:          3,
        }}>
          {(['player', 'browse'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex:            1,
                paddingVertical: 7,
                borderRadius:    Radius.full,
                alignItems:      'center',
                backgroundColor: tab === t ? C.surfaceContainerHigh : 'transparent',
              }}>
              <Text style={{
                ...Typography.titleMd,
                color: tab === t ? C.onSurface : C.onSurfaceVariant,
              }}>
                {t === 'player' ? 'Now Playing' : 'Browse'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Now Playing ─────────────────────────────────────────────────── */}
        {tab === 'player' && (
          <View style={{ flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl }}>

            {/* Album art */}
            <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
              {track?.albumArtLarge ? (
                <Image
                  source={{ uri: track.albumArtLarge }}
                  style={{
                    width: 260, height: 260,
                    borderRadius: Radius.lg,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.5,
                    shadowRadius: 16,
                  }}
                />
              ) : (
                <View style={{
                  width: 260, height: 260, borderRadius: Radius.lg,
                  backgroundColor: C.surfaceContainerHighest,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconSymbol name="music.note" size={64} color={C.onSurfaceVariant} />
                </View>
              )}
            </View>

            {/* Track info */}
            <View style={{ marginBottom: Spacing.lg }}>
              <Text numberOfLines={1} style={{ ...Typography.headlineMd, color: C.onSurface }}>
                {track?.name ?? '—'}
              </Text>
              <Text numberOfLines={1} style={{ ...Typography.bodyMd, color: C.onSurfaceVariant, marginTop: 2 }}>
                {track?.artist ?? '—'}
              </Text>
            </View>

            {/* Progress bar */}
            <View style={{ marginBottom: Spacing.sm }}>
              <View style={{
                height:          4,
                backgroundColor: C.surfaceContainerHighest,
                borderRadius:    Radius.full,
                overflow:        'hidden',
              }}>
                <View style={{
                  height:          4,
                  width:           `${progress * 100}%`,
                  backgroundColor: C.onSurface,
                  borderRadius:    Radius.full,
                }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ ...Typography.labelMd, color: C.onSurfaceVariant }}>
                  {formatMs(localProgress)}
                </Text>
                <Text style={{ ...Typography.labelMd, color: C.onSurfaceVariant }}>
                  {formatMs(playerState?.durationMs ?? 0)}
                </Text>
              </View>
            </View>

            {/* Controls */}
            <View style={{
              flexDirection:  'row',
              alignItems:     'center',
              justifyContent: 'space-between',
              marginTop:      Spacing.md,
            }}>
              {/* Shuffle */}
              <TouchableOpacity
                onPress={() => setShuffle(!playerState?.shuffle)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <IconSymbol
                  name="shuffle"
                  size={22}
                  color={playerState?.shuffle ? '#1DB954' : C.onSurfaceVariant}
                />
              </TouchableOpacity>

              {/* Previous */}
              <TouchableOpacity onPress={skipPrevious} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <IconSymbol name="backward.fill" size={28} color={C.onSurface} />
              </TouchableOpacity>

              {/* Play / Pause */}
              <TouchableOpacity
                onPress={playerState?.isPlaying ? pause : play}
                style={{
                  width:           64,
                  height:          64,
                  borderRadius:    32,
                  backgroundColor: '#1DB954',
                  alignItems:      'center',
                  justifyContent:  'center',
                }}>
                <IconSymbol
                  name={playerState?.isPlaying ? 'pause.fill' : 'play.fill'}
                  size={26}
                  color="#000"
                />
              </TouchableOpacity>

              {/* Next */}
              <TouchableOpacity onPress={skipNext} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <IconSymbol name="forward.fill" size={28} color={C.onSurface} />
              </TouchableOpacity>

              {/* Repeat */}
              <TouchableOpacity onPress={cycleRepeat} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <IconSymbol
                  name={playerState?.repeat === 'track' ? 'repeat.1' : 'repeat'}
                  size={22}
                  color={playerState?.repeat !== 'off' ? '#1DB954' : C.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Browse ──────────────────────────────────────────────────────── */}
        {tab === 'browse' && (
          <View style={{ flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>

            {/* Search bar */}
            <View style={{
              flexDirection:   'row',
              alignItems:      'center',
              backgroundColor: C.surfaceContainer,
              borderRadius:    Radius.lg,
              paddingHorizontal: Spacing.md,
              marginBottom:    Spacing.lg,
              gap:             Spacing.sm,
            }}>
              <IconSymbol name="magnifyingglass" size={16} color={C.onSurfaceVariant} />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Search tracks or playlists…"
                placeholderTextColor={C.onSurfaceVariant}
                style={{
                  flex:   1,
                  height: 44,
                  color:  C.onSurface,
                  ...Typography.bodyMd,
                }}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {searching && <ActivityIndicator size="small" color={C.onSurfaceVariant} />}
            </View>

            {searchQuery.trim() ? (
              // ── Search results
              <FlatList
                data={[
                  ...(searchTracks.length  ? [{ type: 'header', label: 'Tracks' }]    : []),
                  ...searchTracks.map((t)  => ({ type: 'track', item: t })),
                  ...(searchLists.length   ? [{ type: 'header', label: 'Playlists' }] : []),
                  ...searchLists.map((p)   => ({ type: 'playlist', item: p })),
                ] as any[]}
                keyExtractor={(row, i) => row.item?.id ?? `h-${i}`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: row }) => {
                  if (row.type === 'header') {
                    return (
                      <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant, marginBottom: Spacing.sm }}>
                        {row.label.toUpperCase()}
                      </Text>
                    );
                  }
                  if (row.type === 'track') {
                    return (
                      <TrackRow
                        item={row.item}
                        isPlaying={playerState?.track?.id === row.item.id}
                        onPress={() => handlePlayTrack(row.item.uri)}
                      />
                    );
                  }
                  return (
                    <PlaylistRow
                      item={row.item}
                      onPress={() => handlePlayPlaylist(row.item.uri)}
                    />
                  );
                }}
              />
            ) : (
              // ── Your playlists
              <>
                <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant, marginBottom: Spacing.sm }}>
                  YOUR PLAYLISTS
                </Text>
                {loadingLists ? (
                  <ActivityIndicator color={C.primary} style={{ marginTop: Spacing.xl }} />
                ) : (
                  <FlatList
                    data={playlists}
                    keyExtractor={(p) => p.id}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <PlaylistRow
                        item={item}
                        onPress={() => handlePlayPlaylist(item.uri)}
                      />
                    )}
                  />
                )}
              </>
            )}
          </View>
        )}

      </SafeAreaView>
    </Modal>
  );
}
