import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { styles } from '@/styles/tabs/plans.styles';
import { supabase } from '@/lib/supabase';
import { getCachedAny, setCached, CACHE_KEYS } from '@/lib/cache';
import { useWorkout, Exercise, SetRow } from '@/contexts/WorkoutContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanDay = {
  id:         string;
  name:       string;
  focus:      string | null;
  day_number: number;
};

type WorkoutPlan = {
  id:           string;
  name:         string;
  days_per_week: number | null;
  description:  string | null;
  is_active:    boolean;
  days:         PlanDay[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2); }

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  onStartDay,
  onEdit,
}: {
  plan:         WorkoutPlan;
  onStartDay:   (dayId: string) => Promise<void>;
  onEdit:       () => void;
}) {
  const [expanded,    setExpanded]    = useState(false);
  const [startingId,  setStartingId]  = useState<string | null>(null);

  const sortedDays = [...plan.days].sort((a, b) => a.day_number - b.day_number);

  async function handleStart(dayId: string) {
    setStartingId(dayId);
    await onStartDay(dayId);
    setStartingId(null);
  }

  return (
    <View style={styles.planCard}>
      {/* Header — always visible */}
      <TouchableOpacity
        style={styles.planCardHeader}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.8}>
        <View style={styles.planIconBox}>
          <IconSymbol name="dumbbell.fill" size={20} color={Colors.primary} />
        </View>
        <View style={styles.planInfo}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planMeta}>
            {plan.description
              ? plan.description
              : plan.days_per_week
                ? `${plan.days_per_week} days / week`
                : `${plan.days.length} day${plan.days.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <IconSymbol
          name={expanded ? 'chevron.up' : 'chevron.down'}
          size={18}
          color={Colors.onSurfaceVariant}
        />
      </TouchableOpacity>

      {/* Expanded: day list */}
      {expanded && (
        <>
          <View style={styles.planDivider} />

          {sortedDays.length === 0 ? (
            <Text style={[styles.dayFocus, { padding: 16 }]}>
              No days added yet — edit the plan to add training days.
            </Text>
          ) : (
            <View style={styles.daysList}>
              {sortedDays.map((day) => (
                <View key={day.id} style={styles.dayRow}>
                  <View style={styles.dayNumber}>
                    <Text style={styles.dayNumberText}>{day.day_number}</Text>
                  </View>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>{day.name}</Text>
                    {day.focus ? (
                      <Text style={styles.dayFocus}>{day.focus}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.dayStartBtn}
                    onPress={() => handleStart(day.id)}
                    disabled={!!startingId}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    {startingId === day.id ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <IconSymbol name="play.fill" size={14} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.editPlanRow} onPress={onEdit}>
            <Text style={styles.editPlanText}>Edit Plan</Text>
            <IconSymbol name="pencil" size={13} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PlansScreen() {
  const router = useRouter();
  const { startWorkoutFromPlan } = useWorkout();

  const [loading, setLoading] = useState(true);
  const [plans,   setPlans]   = useState<WorkoutPlan[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [])
  );

  async function loadPlans() {
    // Show cached data immediately
    const cached = await getCachedAny<WorkoutPlan[]>(CACHE_KEYS.PLANS);
    if (cached) {
      setPlans(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('workout_plans')
        .select(`
          id, name, days_per_week, description, is_active,
          workout_plan_days(id, name, focus, day_number)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const fresh: WorkoutPlan[] = (data ?? []).map((p: any) => ({
        id:            p.id,
        name:          p.name,
        days_per_week: p.days_per_week,
        description:   p.description,
        is_active:     p.is_active,
        days:          p.workout_plan_days ?? [],
      }));

      setPlans(fresh);
      await setCached(CACHE_KEYS.PLANS, fresh);
    } catch {
      // Fall back to cached data already displayed
    } finally {
      setLoading(false);
    }
  }

  // Load exercises for a plan day, pre-populate context, navigate to workout
  async function startDayWorkout(dayId: string) {
    const { data: planExs } = await supabase
      .from('workout_plan_exercises')
      .select('exercise_name, muscle_group, sets, reps, weight')
      .eq('plan_day_id', dayId)
      .order('sort_order');

    const exercises: Exercise[] = (planExs ?? []).map((pe: any) => ({
      id:     uid(),
      name:   pe.exercise_name,
      muscle: pe.muscle_group || 'Custom',
      tag:    'Plan',
    }));

    const setsState: Record<string, SetRow[]> = {};
    (planExs ?? []).forEach((pe: any, i: number) => {
      setsState[exercises[i].id] = Array.from(
        { length: Math.max(1, pe.sets || 3) },
        () => ({
          weight: pe.weight ? String(pe.weight) : '0',
          reps:   pe.reps   ? String(pe.reps)   : '10',
          done:   false,
        })
      );
    });

    startWorkoutFromPlan(exercises, setsState);
    router.push('/start-workout' as any);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Plans</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/plan-editor' as any)}>
            <IconSymbol name="plus.circle.fill" size={18} color={Colors.primary} />
            <Text style={styles.addBtnText}>New Plan</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 40 }} />
        ) : plans.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="list.bullet" size={36} color={Colors.outlineVariant} />
            <Text style={[styles.emptyText, { marginTop: Spacing.md }]}>No plans yet</Text>
            <Text style={styles.emptySubtext}>
              Build a training plan with your exercises, sets, and reps — then start any day with one tap.
            </Text>
            <TouchableOpacity
              style={styles.emptyCreateBtn}
              onPress={() => router.push('/plan-editor' as any)}>
              <IconSymbol name="plus.circle.fill" size={16} color={Colors.background} />
              <Text style={styles.emptyCreateText}>Create Your First Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onStartDay={startDayWorkout}
              onEdit={() => router.push({ pathname: '/plan-editor' as any, params: { planId: plan.id } })}
            />
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
