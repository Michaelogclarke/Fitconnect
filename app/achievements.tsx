import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Achievement = {
  id:            string;
  title:         string;
  description:   string;
  icon:          string;
  color:         string;
  unlocked:      boolean;
  progress:      number; // 0–1
  progressLabel: string;
};

// ─── Achievement definitions ──────────────────────────────────────────────────

const WORKOUT_MILESTONES = [1, 5, 10, 25, 50, 100] as const;
const WEIGHT_MILESTONES  = [7, 30]                 as const;

function buildAchievements(sessions: number, weightDays: number, primary: string, tertiary: string): Achievement[] {
  const workoutAchievements: Achievement[] = WORKOUT_MILESTONES.map((n) => ({
    id:            `workouts_${n}`,
    title:         n === 1 ? 'First Rep' : `${n} Workouts`,
    description:   n === 1 ? 'Complete your first workout' : `Complete ${n} total workouts`,
    icon:          'dumbbell.fill',
    color:         primary,
    unlocked:      sessions >= n,
    progress:      Math.min(sessions / n, 1),
    progressLabel: `${Math.min(sessions, n)} / ${n}`,
  }));

  const weightAchievements: Achievement[] = [
    {
      id:            'weight_7',
      title:         'Consistent Tracker',
      description:   'Log your body weight 7 times',
      icon:          'scalemass.fill',
      color:         tertiary,
      unlocked:      weightDays >= 7,
      progress:      Math.min(weightDays / 7, 1),
      progressLabel: `${Math.min(weightDays, 7)} / 7`,
    },
    {
      id:            'weight_30',
      title:         'Weight Watch Pro',
      description:   'Log your body weight 30 times',
      icon:          'chart.line.uptrend.xyaxis',
      color:         tertiary,
      unlocked:      weightDays >= 30,
      progress:      Math.min(weightDays / 30, 1),
      progressLabel: `${Math.min(weightDays, 30)} / 30`,
    },
  ];

  return [...workoutAchievements, ...weightAchievements];
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function AchievementCard({ a }: { a: Achievement }) {
  const C = useColors();
  return (
    <View style={{
      backgroundColor:  a.unlocked ? C.surfaceContainerHigh : C.surfaceContainer,
      borderRadius:     Radius.lg,
      padding:          Spacing.lg,
      flexDirection:    'row',
      alignItems:       'center',
      gap:              Spacing.md,
      opacity:          a.unlocked ? 1 : 0.75,
      borderWidth:      a.unlocked ? 1 : 0,
      borderColor:      a.color + '40',
    }}>
      <View style={{
        width:           48,
        height:          48,
        borderRadius:    Radius.full,
        backgroundColor: a.unlocked ? a.color + '22' : C.outlineVariant + '33',
        justifyContent:  'center',
        alignItems:      'center',
      }}>
        <IconSymbol name={a.icon as any} size={22} color={a.unlocked ? a.color : C.outlineVariant} />
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ ...Typography.titleMd, color: a.unlocked ? C.onSurface : C.onSurfaceVariant }}>
          {a.title}
        </Text>
        <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant }}>
          {a.description}
        </Text>

        {!a.unlocked && (
          <>
            <View style={{
              height:          4,
              backgroundColor: C.outlineVariant,
              borderRadius:    Radius.full,
              marginTop:       4,
              overflow:        'hidden',
            }}>
              <View style={{
                height:          '100%',
                width:           `${a.progress * 100}%`,
                backgroundColor: a.color,
                borderRadius:    Radius.full,
              }} />
            </View>
            <Text style={{ ...Typography.labelMd, color: C.onSurfaceVariant }}>
              {a.progressLabel}
            </Text>
          </>
        )}
      </View>

      {a.unlocked && (
        <IconSymbol name="checkmark.circle.fill" size={22} color={a.color} />
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AchievementsScreen() {
  const C = useColors();
  const router = useRouter();
  const [loading,      setLoading]      = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ count: sessions }, { count: weightDays }] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('body_weight_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      setAchievements(buildAchievements(sessions ?? 0, weightDays ?? 0, C.primary, C.tertiary));
    } catch {} finally {
      setLoading(false);
    }
  }

  const unlocked       = achievements.filter((a) => a.unlocked);
  const inProgress     = achievements.filter((a) => !a.unlocked);
  const unlockedCount  = unlocked.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: C.outlineVariant,
        gap: Spacing.md,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={{ ...Typography.headlineMd, color: C.onSurface, flex: 1 }}>Achievements</Text>
        {!loading && (
          <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant }}>
            {unlockedCount}/{achievements.length}
          </Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: Spacing.xxxl }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}
          showsVerticalScrollIndicator={false}>

          {/* Summary banner */}
          <View style={{
            backgroundColor: C.primary + '15',
            borderRadius:    Radius.lg,
            padding:         Spacing.lg,
            flexDirection:   'row',
            alignItems:      'center',
            gap:             Spacing.md,
            borderWidth:     1,
            borderColor:     C.primary + '40',
            marginBottom:    Spacing.sm,
          }}>
            <IconSymbol name="trophy.fill" size={32} color={C.primary} />
            <View>
              <Text style={{ ...Typography.headlineMd, color: C.primary }}>
                {unlockedCount} Unlocked
              </Text>
              <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant }}>
                {achievements.length - unlockedCount} more to go
              </Text>
            </View>
          </View>

          {/* Unlocked */}
          {unlocked.length > 0 && (
            <>
              <Text style={{
                ...Typography.labelLg,
                color: C.onSurfaceVariant,
                textTransform: 'uppercase',
                marginLeft: Spacing.xs,
                marginTop: Spacing.sm,
              }}>
                Unlocked
              </Text>
              {unlocked.map((a) => <AchievementCard key={a.id} a={a} />)}
            </>
          )}

          {/* In progress */}
          {inProgress.length > 0 && (
            <>
              <Text style={{
                ...Typography.labelLg,
                color: C.onSurfaceVariant,
                textTransform: 'uppercase',
                marginLeft: Spacing.xs,
                marginTop: Spacing.sm,
              }}>
                In Progress
              </Text>
              {inProgress.map((a) => <AchievementCard key={a.id} a={a} />)}
            </>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}
