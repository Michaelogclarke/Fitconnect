import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useWorkout } from '@/contexts/WorkoutContext';

function formatTime(s: number) {
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function TabLayout() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isActive, elapsed, exercises, activeRest } = useWorkout();

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

  // Tab bar is 60px tall; sit the banner just above it with an 8px gap
  const bannerBottom = 60 + insets.bottom + 8;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarActiveTintColor: Colors.tabIconSelected,
          tabBarInactiveTintColor: Colors.tabIconDefault,
          tabBarStyle: {
            backgroundColor: Colors.tabBarBackground,
            borderTopColor: Colors.outlineVariant,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
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
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="clock.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
          }}
        />

        {/* Hide legacy tabs from the bar */}
        <Tabs.Screen name="workouts" options={{ href: null }} />
        <Tabs.Screen name="clients"  options={{ href: null }} />
        <Tabs.Screen name="chat"     options={{ href: null }} />
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
            backgroundColor: Colors.surfaceContainerHigh,
            borderRadius: Radius.lg,
            borderWidth: 1,
            borderColor: Colors.primary + '55',
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
            backgroundColor: activeRest && restRemaining > 0 ? Colors.primary : Colors.success,
          }} />

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text style={{ ...Typography.labelLg, color: Colors.onSurface }}>
              {activeRest && restRemaining > 0 ? 'Resting…' : 'Workout in progress'}
            </Text>
            <Text style={{ ...Typography.labelMd, color: Colors.onSurfaceVariant }}>
              {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} · {formatTime(elapsed)}
            </Text>
          </View>

          {/* Rest countdown or workout timer */}
          {activeRest && restRemaining > 0 ? (
            <View style={{
              backgroundColor: Colors.primary + '22',
              borderRadius: Radius.sm,
              paddingHorizontal: Spacing.sm,
              paddingVertical: 3,
              borderWidth: 1,
              borderColor: Colors.primary + '44',
            }}>
              <Text style={{ ...Typography.titleMd, color: Colors.primary, fontVariant: ['tabular-nums'] }}>
                {formatTime(restRemaining)}
              </Text>
            </View>
          ) : (
            <Text style={{ ...Typography.titleMd, color: Colors.primary, fontVariant: ['tabular-nums'] }}>
              {formatTime(elapsed)}
            </Text>
          )}

          <IconSymbol name="chevron.right" size={16} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}
