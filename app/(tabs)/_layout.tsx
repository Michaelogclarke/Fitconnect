import { Tabs, usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LiquidGlassTabBar } from '@/components/LiquidGlassTabBar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SpotifyMiniPlayer, MINI_PLAYER_HEIGHT } from '@/components/SpotifyMiniPlayer';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useSpotify } from '@/contexts/SpotifyContext';
import { supabase } from '@/lib/supabase';

const ORDERED_TABS = ['/', '/plans', '/progress', '/nutrition', '/trainer'] as const;
type TabHref = (typeof ORDERED_TABS)[number];

function getTabIndex(pathname: string, showTrainer: boolean): number {
  const tabs = showTrainer ? ORDERED_TABS : ORDERED_TABS.slice(0, 4);
  const i = tabs.findIndex((t) =>
    t === '/' ? pathname === '/' || pathname === '/(tabs)' : pathname.startsWith(t),
  );
  return i >= 0 ? i : 0;
}

function formatTime(s: number) {
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function TabLayout() {
  const C = useColors();
  const router   = useRouter();
  const pathname = usePathname();
  const insets   = useSafeAreaInsets();
  const { isActive, elapsed, exercises, activeRest } = useWorkout();
  const { playerState: spotifyState } = useSpotify();
  const spotifyVisible = !!(spotifyState?.track);

  const [showTrainer,  setShowTrainer]  = useState(false);
  const [clientUserId, setClientUserId] = useState<string | null>(null);

  async function checkTrainerTab(userId: string) {
    const { count } = await supabase
      .from('trainer_clients')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId)
      .eq('status', 'active');
    setShowTrainer((count ?? 0) > 0);
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const r = profile?.role as 'client' | 'trainer' | undefined;
      if (r !== 'trainer') {
        setClientUserId(user.id);
        checkTrainerTab(user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!clientUserId) return;
    const { remove } = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkTrainerTab(clientUserId);
    });
    return remove;
  }, [clientUserId]);

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!activeRest) return;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [!!activeRest]);

  const restRemaining = activeRest
    ? Math.max(0, Math.ceil((activeRest.endsAt - Date.now()) / 1000))
    : 0;

  // Floating banners sit above the pill bar (64 height + 12 gap + safe area)
  const baseBottom       = 64 + 12 + insets.bottom;
  const miniPlayerBottom = baseBottom;
  const bannerBottom     = spotifyVisible ? baseBottom + MINI_PLAYER_HEIGHT + 8 : baseBottom;

  // ── Swipe gesture ──────────────────────────────────────────────────────────
  const dragX = useSharedValue(0);
  const tabs  = showTrainer ? ORDERED_TABS : (ORDERED_TABS.slice(0, 4) as readonly TabHref[]);

  // Keep a ref so the worklet can read latest values without stale closure
  const showTrainerRef = useRef(showTrainer);
  const pathnameRef    = useRef(pathname);
  useEffect(() => { showTrainerRef.current = showTrainer; }, [showTrainer]);
  useEffect(() => { pathnameRef.current    = pathname;    }, [pathname]);

  const navigateToTab = useCallback((href: string) => {
    router.navigate(href as never);
  }, [router]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      dragX.value = clamp(e.translationX, -120, 120);
    })
    .onEnd((e) => {
      const tx = e.translationX;
      const isHorizontal = Math.abs(tx) > Math.abs(e.velocityY) * 0.2;
      const tabList = showTrainerRef.current ? ORDERED_TABS : ORDERED_TABS.slice(0, 4);
      const current = getTabIndex(pathnameRef.current, showTrainerRef.current);

      if (isHorizontal && tx < -60 && current < tabList.length - 1) {
        dragX.value = withSpring(0, { damping: 20, stiffness: 300 });
        runOnJS(navigateToTab)(tabList[current + 1]);
      } else if (isHorizontal && tx > 60 && current > 0) {
        dragX.value = withSpring(0, { damping: 20, stiffness: 300 });
        runOnJS(navigateToTab)(tabList[current - 1]);
      } else {
        dragX.value = withSpring(0, { damping: 18, stiffness: 250 });
      }
    });

  const contentStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: dragX.value }],
  }));

  return (
    <View style={{ flex: 1 }}>
      {/* Screen content — slides with swipe gesture */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={contentStyle}>
          <Tabs
            tabBar={() => <View style={{ height: 0 }} />}
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: C.tabIconSelected,
              tabBarInactiveTintColor: C.tabIconDefault,
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
            <Tabs.Screen name="clients" options={{ href: null }} />
            <Tabs.Screen
              name="trainer"
              options={{
                title: 'Trainer',
                href: showTrainer ? undefined : null,
                tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
              }}
            />
            <Tabs.Screen name="chat" options={{ href: null }} />
            <Tabs.Screen name="workouts" options={{ href: null }} />
          </Tabs>
        </Animated.View>
      </GestureDetector>

      {/* Floating liquid glass tab bar — stays fixed during swipe */}
      <LiquidGlassTabBar showTrainer={showTrainer} />

      {/* Active workout banner */}
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
            zIndex: 100,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 100,
          }}>
          <View style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: activeRest && restRemaining > 0 ? C.primary : C.success,
          }} />
          <View style={{ flex: 1 }}>
            <Text style={{ ...Typography.labelLg, color: C.onSurface }}>
              {activeRest && restRemaining > 0 ? 'Resting…' : 'Workout in progress'}
            </Text>
            <Text style={{ ...Typography.labelMd, color: C.onSurfaceVariant }}>
              {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} · {formatTime(elapsed)}
            </Text>
          </View>
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

      {/* Spotify mini player */}
      <SpotifyMiniPlayer bottom={miniPlayerBottom} />
    </View>
  );
}
