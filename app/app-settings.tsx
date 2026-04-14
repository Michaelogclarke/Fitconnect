import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors, useTheme, ACCENT_COLORS } from '@/contexts/ThemeContext';
import { usePrefs, type FontScale, type RestTimer, type WeightIncrement } from '@/contexts/PrefsContext';
import { useSpotify } from '@/contexts/SpotifyContext';

export default function AppSettingsScreen() {
  const C      = useColors();
  const router = useRouter();
  const { isDark, mode, setMode, accentColor, setAccentColor } = useTheme();
  const { restTimer, setRestTimer, fontScale, setFontScale, weightIncrement, setWeightIncrement, homeCards, setHomeCard } = usePrefs();
  const { isConnected: spotifyConnected, connect: connectSpotify, disconnect: disconnectSpotify, playerState } = useSpotify();

  const card: ReturnType<typeof StyleSheet.create>[string] = {
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  };
  const row = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
  };
  const divider = { height: 1, backgroundColor: C.outlineVariant, marginLeft: Spacing.md + 36 };
  const iconBox = {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: C.primary + '22',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  };
  const sectionTitle = {
    ...Typography.labelLg,
    color: C.onSurfaceVariant,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    fontSize: 11,
  };
  const pill = (active: boolean) => ({
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: active ? C.primary : C.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: active ? C.primary : C.outlineVariant,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={{ ...Typography.titleLg, color: C.onSurface, flex: 1 }}>App Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Appearance ─────────────────────────────────────────────────── */}
        <Text style={sectionTitle}>Appearance</Text>
        <View style={card}>
          {(['dark', 'light', 'system'] as const).map((m, i, arr) => (
            <React.Fragment key={m}>
              <TouchableOpacity style={row} onPress={() => setMode(m)} activeOpacity={0.7}>
                <View style={iconBox}>
                  <IconSymbol
                    name={m === 'dark' ? 'moon.fill' : m === 'light' ? 'sun.max.fill' : 'circle.lefthalf.filled'}
                    size={16} color={C.primary}
                  />
                </View>
                <Text style={{ ...Typography.bodyLg, color: C.onSurface, flex: 1 }}>
                  {m === 'dark' ? 'Dark' : m === 'light' ? 'Light' : 'System Default'}
                </Text>
                {mode === m && <IconSymbol name="checkmark.circle.fill" size={20} color={C.primary} />}
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={sectionTitle}>Accent Colour</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
          {ACCENT_COLORS.map((ac) => {
            const selected = accentColor === ac.value;
            return (
              <TouchableOpacity
                key={ac.value}
                onPress={() => setAccentColor(ac.value)}
                activeOpacity={0.8}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: ac.value,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: selected ? 3 : 2,
                  borderColor: selected ? C.onSurface : C.outlineVariant,
                }}>
                {selected && <IconSymbol name="checkmark" size={16} color={isDark ? '#000' : '#fff'} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Workout ────────────────────────────────────────────────────── */}
        <Text style={sectionTitle}>Workout</Text>
        <View style={card}>
          {/* Rest timer */}
          <View style={[row, { flexDirection: 'column', alignItems: 'flex-start', gap: Spacing.sm }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <View style={iconBox}>
                <IconSymbol name="timer" size={16} color={C.primary} />
              </View>
              <Text style={{ ...Typography.bodyLg, color: C.onSurface }}>Default Rest Timer</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingLeft: 36 }}>
              {([60, 90, 120, 180] as RestTimer[]).map((t) => (
                <TouchableOpacity key={t} onPress={() => setRestTimer(t)} style={pill(restTimer === t)}>
                  <Text style={{ ...Typography.labelLg, color: restTimer === t ? C.onPrimary : C.onSurfaceVariant, fontWeight: '600' }}>
                    {t}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={divider} />

          {/* Weight increment */}
          <View style={[row, { flexDirection: 'column', alignItems: 'flex-start', gap: Spacing.sm }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <View style={iconBox}>
                <IconSymbol name="plusminus" size={16} color={C.primary} />
              </View>
              <Text style={{ ...Typography.bodyLg, color: C.onSurface }}>Weight Increment</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingLeft: 36 }}>
              {([0.5, 1, 2.5, 5] as WeightIncrement[]).map((inc) => (
                <TouchableOpacity key={inc} onPress={() => setWeightIncrement(inc)} style={pill(weightIncrement === inc)}>
                  <Text style={{ ...Typography.labelLg, color: weightIncrement === inc ? C.onPrimary : C.onSurfaceVariant, fontWeight: '600' }}>
                    {inc}kg
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── Text Size ──────────────────────────────────────────────────── */}
        <Text style={sectionTitle}>Text Size</Text>
        <View style={card}>
          {([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']] as [FontScale, string][]).map(([scale, label], i, arr) => (
            <React.Fragment key={scale}>
              <TouchableOpacity style={row} onPress={() => setFontScale(scale)} activeOpacity={0.7}>
                <View style={iconBox}>
                  <IconSymbol name="textformat.size" size={16} color={C.primary} />
                </View>
                <Text style={{ ...Typography.bodyLg, color: C.onSurface, flex: 1, fontSize: scale === 'small' ? 13 : scale === 'large' ? 17 : 15 }}>
                  {label}
                </Text>
                {fontScale === scale && <IconSymbol name="checkmark.circle.fill" size={20} color={C.primary} />}
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── Home Screen Cards ──────────────────────────────────────────── */}
        <Text style={sectionTitle}>Home Screen Cards</Text>
        <View style={card}>
          {([
            ['streak',         'Streak Banner',   'flame.fill'             ],
            ['quickStats',     'Quick Stats',     'chart.bar.fill'         ],
            ['weeklyGoal',     'Weekly Goal',     'trophy.fill'            ],
            ['recentSessions', 'Recent Sessions', 'clock.arrow.circlepath' ],
          ] as [keyof typeof homeCards, string, any][]).map(([key, label, icon], i, arr) => (
            <React.Fragment key={key}>
              <TouchableOpacity style={row} onPress={() => setHomeCard(key, !homeCards[key])} activeOpacity={0.7}>
                <View style={iconBox}>
                  <IconSymbol name={icon} size={16} color={C.primary} />
                </View>
                <Text style={{ ...Typography.bodyLg, color: C.onSurface, flex: 1 }}>{label}</Text>
                {/* Toggle */}
                <View style={{
                  width: 44, height: 26, borderRadius: 13,
                  backgroundColor: homeCards[key] ? C.primary : C.surfaceContainerHigh,
                  borderWidth: 1, borderColor: homeCards[key] ? C.primary : C.outlineVariant,
                  justifyContent: 'center', paddingHorizontal: 3,
                }}>
                  <View style={{
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: homeCards[key] ? C.onPrimary : C.onSurfaceVariant,
                    alignSelf: homeCards[key] ? 'flex-end' : 'flex-start',
                  }} />
                </View>
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── Music ──────────────────────────────────────────────────────── */}
        <Text style={sectionTitle}>Music</Text>
        <View style={card}>
          <TouchableOpacity style={row} onPress={spotifyConnected ? disconnectSpotify : connectSpotify} activeOpacity={0.7}>
            <View style={[iconBox, { backgroundColor: '#1DB95422' }]}>
              <IconSymbol name="music.note" size={16} color="#1DB954" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...Typography.bodyLg, color: C.onSurface }}>Spotify</Text>
              {spotifyConnected && playerState?.track ? (
                <Text style={{ ...Typography.labelMd, color: C.onSurfaceVariant }} numberOfLines={1}>
                  {playerState.track.name} · {playerState.track.artist}
                </Text>
              ) : (
                <Text style={{ ...Typography.labelMd, color: spotifyConnected ? C.success : C.onSurfaceVariant }}>
                  {spotifyConnected ? 'Connected — tap to disconnect' : 'Tap to connect'}
                </Text>
              )}
            </View>
            <View style={{
              backgroundColor: spotifyConnected ? '#1DB95422' : C.surfaceContainerHighest,
              paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full,
            }}>
              <Text style={{ ...Typography.labelMd, color: spotifyConnected ? '#1DB954' : C.onSurfaceVariant }}>
                {spotifyConnected ? 'Connected' : 'Connect'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

