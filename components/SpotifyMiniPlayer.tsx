import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useSpotify } from '@/contexts/SpotifyContext';
import { SpotifyFullPlayer } from '@/components/SpotifyFullPlayer';

export const MINI_PLAYER_HEIGHT = 64;

type Props = {
  bottom: number;
};

export function SpotifyMiniPlayer({ bottom }: Props) {
  const C = useColors();
  const { isConnected, playerState, play, pause, skipNext, skipPrevious } = useSpotify();
  const [fullOpen, setFullOpen] = useState(false);

  if (!isConnected || !playerState?.track) return null;

  const { track, isPlaying, progressMs, durationMs } = playerState;
  const progress = durationMs > 0 ? Math.min(progressMs / durationMs, 1) : 0;

  return (
    <>
      <View
        pointerEvents="box-none"
        style={{
          position:      'absolute',
          bottom,
          left:          Spacing.md,
          right:         Spacing.md,
          height:        MINI_PLAYER_HEIGHT,
          zIndex:        99,
          shadowColor:   '#000',
          shadowOffset:  { width: 0, height: 2 },
          shadowOpacity: 0.35,
          shadowRadius:  8,
          elevation:     99,
        }}>

        {/* Card */}
        <View style={{
          flex:              1,
          backgroundColor:   C.surfaceContainerHigh,
          borderRadius:      Radius.lg,
          borderWidth:       1,
          borderColor:       C.outlineVariant,
          overflow:          'hidden',
        }}>
          {/* Main row */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setFullOpen(true)}
            style={{
              flex:              1,
              flexDirection:     'row',
              alignItems:        'center',
              paddingHorizontal: Spacing.md,
              gap:               Spacing.sm,
            }}>

            {/* Spotify green accent */}
            <View style={{
              position:        'absolute',
              left:            0, top: 8, bottom: 8,
              width:           3,
              backgroundColor: '#1DB954',
              borderRadius:    Radius.full,
            }} />

            {/* Album art */}
            {track.albumArt ? (
              <Image
                source={{ uri: track.albumArt }}
                style={{ width: 40, height: 40, borderRadius: Radius.sm, marginLeft: 8 }}
              />
            ) : (
              <View style={{
                width: 40, height: 40, borderRadius: Radius.sm, marginLeft: 8,
                backgroundColor: C.surfaceContainerHighest,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <IconSymbol name="music.note" size={18} color={C.onSurfaceVariant} />
              </View>
            )}

            {/* Track info */}
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ ...Typography.titleMd, color: C.onSurface }}>
                {track.name}
              </Text>
              <Text numberOfLines={1} style={{ ...Typography.labelMd, color: C.onSurfaceVariant }}>
                {track.artist}
              </Text>
            </View>

            {/* Controls */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <TouchableOpacity
                onPress={skipPrevious}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <IconSymbol name="backward.fill" size={20} color={C.onSurface} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={isPlaying ? pause : play}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: '#1DB954',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                <IconSymbol
                  name={isPlaying ? 'pause.fill' : 'play.fill'}
                  size={14}
                  color="#000"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={skipNext}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <IconSymbol name="forward.fill" size={20} color={C.onSurface} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Progress bar — sits at very bottom of card */}
          <View style={{ height: 2, backgroundColor: C.surfaceContainerHighest }}>
            <View style={{
              height:          2,
              width:           `${progress * 100}%`,
              backgroundColor: '#1DB954',
            }} />
          </View>
        </View>
      </View>

      <SpotifyFullPlayer
        visible={fullOpen}
        onClose={() => setFullOpen(false)}
      />
    </>
  );
}
