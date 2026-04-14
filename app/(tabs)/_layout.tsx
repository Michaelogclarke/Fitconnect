import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SpotifyMiniPlayer, MINI_PLAYER_HEIGHT } from '@/components/SpotifyMiniPlayer';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useSpotify } from '@/contexts/SpotifyContext';
import { supabase } from '@/lib/supabase';

function formatTime(s: number) {
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function TabLayout() {
  const C = useColors();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isActive, elapsed, exercises, activeRest } = useWorkout();
  const { playerState: spotifyState } = useSpotify();
  const spotifyVisible = !!(spotifyState?.track);

  const [role,     setRole]     = useState<'client' | 'trainer' | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const r = profile?.role as 'client' | 'trainer' | undefined;
      if (r) setRole(r);

      if (r !== 'trainer') {
        // Clients only see chat if they have an active trainer
        const { count } = await supabase
          .from('trainer_clients')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', user.id)
          .eq('status', 'active');
        setShowChat((count ?? 0) > 0);
      }
      // Trainers access messages from the Home screen — no nav tab needed
    });
  }, []);

  // Tick to keep rest countdown on the banner fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!activeRest) return;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [!!activeRest]);

  const restRemaining = activeRest
    ? Math.max(0, Math.ceil((activeRest.endsAt - Date.now()) / 1000))
    : 0;

  // Base position just above the tab bar
  const baseBottom    = 56 + insets.bottom + 8;
  // Mini player sits at base; workout banner stacks above it when both are visible
  const miniPlayerBottom = baseBottom;
  const bannerBottom  = spotifyVisible
    ? baseBottom + MINI_PLAYER_HEIGHT + 8
    : baseBottom;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarActiveTintColor: C.tabIconSelected,
          tabBarInactiveTintColor: C.tabIconDefault,
          tabBarStyle: {
            backgroundColor: C.tabBarBackground,
            borderTopColor: C.outlineVariant,
            borderTopWidth: 1,
            height: 72,
            paddingBottom: 12,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        }}>

        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="plans"
          options={{
            title: 'Plans',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="list.bullet" color={color} />,
          }}
        />
        <Tabs.Screen name="history" options={{ href: null }} />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: 'Nutrition',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="fork.knife" color={color} />,
          }}
        />
        <Tabs.Screen name="profile" options={{ href: null }} />

        {/* Clients — accessible from Home, not needed in nav */}
        <Tabs.Screen name="clients" options={{ href: null }} />

        {/* Chat — visible for trainers and clients with an active trainer */}
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Messages',
            href: showChat ? undefined : null,
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="bubble.left.and.bubble.right.fill" color={color} />,
          }}
        />

        {/* Hide legacy tabs from the bar */}
        <Tabs.Screen name="workouts" options={{ href: null }} />
      </Tabs>

      {/* Active workout banner — floats above the tab bar */}
      {isActive && (
        <TouchableOpacity
          onPress={() => router.push('/start-workout')}
          activeOpacity={0.9}
          style={{
            position: 'absolute',
            bottom: bannerBottom,
            left: Spacing.md,
            right: Spacing.md,
            backgroundColor: C.surfaceContainerHigh,
            borderRadius: Radius.lg,
            borderWidth: 1,
            borderColor: C.primary + '55',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            gap: Spacing.sm,
            // render above tab screens
            zIndex: 100,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 100,
          }}>
          {/* Live indicator dot — orange when resting, green when active */}
          <View style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: activeRest && restRemaining > 0 ? C.primary : C.success,
          }} />

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text style={{ ...Typography.labelLg, color: C.onSurface }}>
              {activeRest && restRemaining > 0 ? 'Resting…' : 'Workout in progress'}
            </Text>
            <Text style={{ ...Typography.labelMd, color: C.onSurfaceVariant }}>
              {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} · {formatTime(elapsed)}
            </Text>
          </View>

          {/* Rest countdown or workout timer */}
          {activeRest && restRemaining > 0 ? (
            <View style={{
              backgroundColor: C.primary + '22',
              borderRadius: Radius.sm,
              paddingHorizontal: Spacing.sm,
              paddingVertical: 3,
              borderWidth: 1,
              borderColor: C.primary + '44',
            }}>
              <Text style={{ ...Typography.titleMd, color: C.primary, fontVariant: ['tabular-nums'] }}>
                {formatTime(restRemaining)}
              </Text>
            </View>
          ) : (
            <Text style={{ ...Typography.titleMd, color: C.primary, fontVariant: ['tabular-nums'] }}>
              {formatTime(elapsed)}
            </Text>
          )}

          <IconSymbol name="chevron.right" size={16} color={C.primary} />
        </TouchableOpacity>
      )}

      {/* Spotify mini player — floats above the tab bar */}
      <SpotifyMiniPlayer bottom={miniPlayerBottom} />
    </View>
  );
}
