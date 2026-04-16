import React, { useRef, useState } from 'react';
import {
  Dimensions, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');
const WEEKLY_GOAL_KEY = 'pref:weekly_goal';

const PAGES = [
  {
    icon:    'dumbbell.fill'  as const,
    title:   'Welcome to FitConnect',
    body:    'Your personal training companion. Log workouts, track progress, and hit new personal records.',
  },
  {
    icon:    'chart.bar.fill' as const,
    title:   'Track Everything',
    body:    'Every set, every rep, every kg. Your full history lives in one place so you always know what to beat.',
  },
  {
    icon:    'trophy.fill'    as const,
    title:   'Set Your Weekly Goal',
    body:    'How many sessions are you aiming for each week? You can change this any time from the home screen.',
    isGoal:  true,
  },
];

export const ONBOARDING_KEY = '@fitconnect:onboarding_done';

export default function OnboardingScreen() {
  const C      = useColors();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [page,        setPage]        = useState(0);
  const [weeklyGoal,  setWeeklyGoal]  = useState(3);

  function goTo(p: number) {
    scrollRef.current?.scrollTo({ x: p * SCREEN_W, animated: true });
    setPage(p);
  }

  async function finish() {
    await AsyncStorage.multiSet([
      [ONBOARDING_KEY,  'true'],
      [WEEKLY_GOAL_KEY, String(weeklyGoal)],
    ]);
    router.replace('/(tabs)');
  }

  const isLast = page === PAGES.length - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top', 'bottom']}>

      {/* Skip */}
      <View style={{ alignItems: 'flex-end', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm }}>
        <TouchableOpacity onPress={finish} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant }}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Pages */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}>

        {PAGES.map((p, i) => (
          <View key={i} style={{
            width: SCREEN_W,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: Spacing.xxxl,
            gap: Spacing.xl,
          }}>
            {/* Icon */}
            <View style={{
              width: 100, height: 100, borderRadius: 50,
              backgroundColor: C.primary + '22',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <IconSymbol name={p.icon} size={44} color={C.primary} />
            </View>

            {/* Text */}
            <View style={{ alignItems: 'center', gap: Spacing.md }}>
              <Text style={{ ...Typography.displayMd, color: C.onSurface, textAlign: 'center' }}>
                {p.title}
              </Text>
              <Text style={{ ...Typography.bodyLg, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 26 }}>
                {p.body}
              </Text>
            </View>

            {/* Goal picker */}
            {p.isGoal && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: Spacing.xl,
                backgroundColor: C.surfaceContainer,
                borderRadius: Radius.xl, padding: Spacing.lg,
              }}>
                <TouchableOpacity
                  onPress={() => setWeeklyGoal((g) => Math.max(1, g - 1))}
                  style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: C.surfaceContainerHigh,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                  <IconSymbol name="minus" size={20} color={C.onSurface} />
                </TouchableOpacity>

                <View style={{ alignItems: 'center', minWidth: 60 }}>
                  <Text style={{ ...Typography.displayLg, color: C.primary, fontSize: 48 }}>
                    {weeklyGoal}
                  </Text>
                  <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant }}>
                    days / week
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setWeeklyGoal((g) => Math.min(7, g + 1))}
                  style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: C.surfaceContainerHigh,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                  <IconSymbol name="plus" size={20} color={C.onSurface} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Dot indicator */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: Spacing.lg }}>
        {PAGES.map((_, i) => (
          <View key={i} style={{
            width:  i === page ? 20 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === page ? C.primary : C.outlineVariant,
          }} />
        ))}
      </View>

      {/* CTA */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.sm }}>
        <TouchableOpacity
          onPress={() => isLast ? finish() : goTo(page + 1)}
          style={{
            height: 52, borderRadius: Radius.lg,
            backgroundColor: C.primary,
            alignItems: 'center', justifyContent: 'center',
          }}>
          <Text style={{ ...Typography.titleLg, color: C.onPrimary, fontWeight: '700' }}>
            {isLast ? "Let's Go" : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}
