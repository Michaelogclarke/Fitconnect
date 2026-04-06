import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from '@/styles/tabs/plans.styles';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkoutPlan = {
  id: string;
  name: string;
  days_per_week: number | null;
  description: string | null;
  is_active: boolean;
};

// ─── Preset splits (static reference data) ───────────────────────────────────

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

const PRESET_SPLITS = [
  {
    id: 'ppl',
    name: 'Push Pull Legs',
    daysPerWeek: 6,
    difficulty: 'Intermediate' as Difficulty,
    description: 'Classic hypertrophy split. Push, pull, and leg days repeated twice per week.',
    days: [
      { name: 'Push A',  focus: 'Chest · Shoulders · Triceps' },
      { name: 'Pull A',  focus: 'Back · Biceps' },
      { name: 'Legs A',  focus: 'Quads · Hamstrings · Calves' },
      { name: 'Push B',  focus: 'Chest · Shoulders · Triceps' },
      { name: 'Pull B',  focus: 'Back · Biceps' },
      { name: 'Legs B',  focus: 'Quads · Hamstrings · Calves' },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper Lower',
    daysPerWeek: 4,
    difficulty: 'Beginner' as Difficulty,
    description: 'Efficient 4-day split training upper and lower body twice a week.',
    days: [
      { name: 'Upper A', focus: 'Chest · Back · Shoulders · Arms' },
      { name: 'Lower A', focus: 'Quads · Hamstrings · Glutes' },
      { name: 'Upper B', focus: 'Chest · Back · Shoulders · Arms' },
      { name: 'Lower B', focus: 'Quads · Hamstrings · Glutes' },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body',
    daysPerWeek: 3,
    difficulty: 'Beginner' as Difficulty,
    description: 'Three full-body sessions per week. Great for beginners and time-pressed athletes.',
    days: [
      { name: 'Full Body A', focus: 'Squat pattern · Horizontal push/pull' },
      { name: 'Full Body B', focus: 'Hinge pattern · Vertical push/pull' },
      { name: 'Full Body C', focus: 'Variation day' },
    ],
  },
  {
    id: 'bro-split',
    name: 'Bro Split',
    daysPerWeek: 5,
    difficulty: 'Intermediate' as Difficulty,
    description: 'One muscle group per day. High volume, classic bodybuilder style.',
    days: [
      { name: 'Chest Day',     focus: 'Chest' },
      { name: 'Back Day',      focus: 'Back' },
      { name: 'Shoulder Day',  focus: 'Shoulders · Traps' },
      { name: 'Arms Day',      focus: 'Biceps · Triceps' },
      { name: 'Legs Day',      focus: 'Quads · Hamstrings · Calves' },
    ],
  },
  {
    id: 'arnold',
    name: 'Arnold Split',
    daysPerWeek: 6,
    difficulty: 'Advanced' as Difficulty,
    description: "Used by Arnold Schwarzenegger. Chest & back, shoulders & arms, legs — each hit twice a week.",
    days: [
      { name: 'Chest & Back A',      focus: 'Chest · Back' },
      { name: 'Shoulders & Arms A',  focus: 'Shoulders · Biceps · Triceps' },
      { name: 'Legs A',              focus: 'Quads · Hamstrings · Calves' },
      { name: 'Chest & Back B',      focus: 'Chest · Back' },
      { name: 'Shoulders & Arms B',  focus: 'Shoulders · Biceps · Triceps' },
      { name: 'Legs B',              focus: 'Quads · Hamstrings · Calves' },
    ],
  },
];

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Beginner:     Colors.success,
  Intermediate: Colors.primary,
  Advanced:     Colors.error,
};

// ─── Split card ───────────────────────────────────────────────────────────────

function SplitCard({ split }: { split: typeof PRESET_SPLITS[0] }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const color = DIFFICULTY_COLOR[split.difficulty];

  return (
    <View style={styles.splitCard}>
      <TouchableOpacity style={styles.splitCardHeader} onPress={() => setExpanded((e) => !e)} activeOpacity={0.8}>
        <View style={{ flex: 1 }}>
          <View style={styles.splitTitleRow}>
            <Text style={styles.splitName}>{split.name}</Text>
            <View style={[styles.diffBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
              <Text style={[styles.diffBadgeText, { color }]}>{split.difficulty}</Text>
            </View>
          </View>
          <Text style={styles.splitMeta}>{split.daysPerWeek} days / week · {split.days.length} sessions</Text>
          <Text style={styles.splitDesc}>{split.description}</Text>
        </View>
        <IconSymbol
          name={expanded ? 'xmark.circle.fill' : 'chevron.right'}
          size={18}
          color={Colors.onSurfaceVariant}
        />
      </TouchableOpacity>

      {expanded && (
        <>
          <View style={styles.splitDivider} />
          <View style={styles.daysList}>
            {split.days.map((day, i) => (
              <View key={i} style={styles.dayRow}>
                <View style={styles.dayNumber}>
                  <Text style={styles.dayNumberText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayName}>{day.name}</Text>
                  <Text style={styles.dayFocus}>{day.focus}</Text>
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.usePlanBtn} onPress={() => router.push('/start-workout')}>
            <Text style={styles.usePlanBtnText}>Start with this Split</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PlansScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [])
  );

  async function loadPlans() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('workout_plans')
      .select('id, name, days_per_week, description, is_active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setPlans(data ?? []);
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Plans</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/plan-editor' as any)}>
            <IconSymbol name="plus.circle.fill" size={18} color={Colors.primary} />
            <Text style={styles.addBtnText}>New Routine</Text>
          </TouchableOpacity>
        </View>

        {/* My Routines */}
        <Text style={styles.sectionLabel}>My Routines</Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
        ) : plans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No routines yet</Text>
            <Text style={styles.emptySubtext}>Create your own or use a preset split below</Text>
          </View>
        ) : (
          plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={styles.routineCard}
              onPress={() => router.push({ pathname: '/plan-editor' as any, params: { planId: plan.id } })}>
              <View style={styles.routineIconBox}>
                <IconSymbol name="dumbbell.fill" size={20} color={Colors.primary} />
              </View>
              <View style={styles.routineInfo}>
                <Text style={styles.routineName}>{plan.name}</Text>
                <Text style={styles.routineMeta}>
                  {plan.description ?? (plan.days_per_week ? `${plan.days_per_week}x / week` : 'Custom routine')}
                </Text>
              </View>
              <View style={styles.routineRight}>
                {plan.is_active && (
                  <Text style={styles.routineLastDone}>Active</Text>
                )}
                <IconSymbol name="chevron.right" size={16} color={Colors.onSurfaceVariant} />
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Preset Splits */}
        <Text style={styles.sectionLabel}>Preset Splits</Text>
        {PRESET_SPLITS.map((split) => (
          <SplitCard key={split.id} split={split} />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}
