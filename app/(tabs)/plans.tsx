import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { styles } from '@/styles/tabs/plans.styles';
import { supabase } from '@/lib/supabase';
import { getCachedAny, setCached, CACHE_KEYS } from '@/lib/cache';
import { useWorkout, Exercise, SetRow } from '@/contexts/WorkoutContext';
import { initials } from '@/lib/format';

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
  is_template:  boolean;
  days:         PlanDay[];
};

type ActiveClient = {
  linkId:    string;
  clientId:  string;
  name:      string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2); }

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  onStartDay,
  onEdit,
  isTrainer,
  onToggleTemplate,
  onDeploy,
}: {
  plan:             WorkoutPlan;
  onStartDay:       (dayId: string) => Promise<void>;
  onEdit:           () => void;
  isTrainer?:       boolean;
  onToggleTemplate?: () => void;
  onDeploy?:        () => void;
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <Text style={styles.planName}>{plan.name}</Text>
            {plan.is_template && (
              <View style={templateStyles.badge}>
                <Text style={templateStyles.badgeText}>Template</Text>
              </View>
            )}
          </View>
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

          <View style={templateStyles.footerRow}>
            <TouchableOpacity style={[styles.editPlanRow, { flex: 1 }]} onPress={onEdit}>
              <Text style={styles.editPlanText}>Edit Plan</Text>
              <IconSymbol name="pencil" size={13} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
            {isTrainer && (
              <>
                <View style={templateStyles.footerDivider} />
                <TouchableOpacity
                  style={[styles.editPlanRow, { flex: 1 }]}
                  onPress={onToggleTemplate}>
                  <Text style={[styles.editPlanText, plan.is_template && { color: Colors.primary }]}>
                    {plan.is_template ? 'Remove Template' : 'Make Template'}
                  </Text>
                  <IconSymbol
                    name="doc.on.doc.fill"
                    size={13}
                    color={plan.is_template ? Colors.primary : Colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
                {plan.is_template && (
                  <>
                    <View style={templateStyles.footerDivider} />
                    <TouchableOpacity
                      style={[styles.editPlanRow, { flex: 1 }]}
                      onPress={onDeploy}>
                      <Text style={[styles.editPlanText, { color: Colors.success }]}>Deploy</Text>
                      <IconSymbol name="arrow.up.circle.fill" size={13} color={Colors.success} />
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        </>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PlansScreen() {
  const router = useRouter();
  const { startWorkoutFromPlan } = useWorkout();

  const [loading,        setLoading]        = useState(true);
  const [plans,          setPlans]          = useState<WorkoutPlan[]>([]);
  const [isTrainer,      setIsTrainer]      = useState(false);
  const [activeClients,  setActiveClients]  = useState<ActiveClient[]>([]);
  const [deployPlanId,   setDeployPlanId]   = useState<string | null>(null);
  const [deployingId,    setDeployingId]    = useState<string | null>(null);

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

      const [plansRes, profileRes] = await Promise.all([
        supabase
          .from('workout_plans')
          .select(`id, name, days_per_week, description, is_active, is_template, workout_plan_days(id, name, focus, day_number)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('role').eq('id', user.id).single(),
      ]);

      const trainer = profileRes.data?.role === 'trainer';
      setIsTrainer(trainer);

      const fresh: WorkoutPlan[] = (plansRes.data ?? []).map((p: any) => ({
        id:            p.id,
        name:          p.name,
        days_per_week: p.days_per_week,
        description:   p.description,
        is_active:     p.is_active,
        is_template:   p.is_template ?? false,
        days:          p.workout_plan_days ?? [],
      }));

      setPlans(fresh);
      await setCached(CACHE_KEYS.PLANS, fresh);

      if (trainer) {
        const { data: links } = await supabase
          .from('trainer_clients')
          .select('id, client_id')
          .eq('trainer_id', user.id)
          .eq('status', 'active');

        if (links && links.length > 0) {
          const clientIds = links.map((l) => l.client_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', clientIds);
          setActiveClients(links.map((l) => ({
            linkId:   l.id,
            clientId: l.client_id,
            name:     profiles?.find((p) => p.id === l.client_id)?.full_name ?? 'Unknown',
          })));
        }
      }
    } catch {
      // Fall back to cached data already displayed
    } finally {
      setLoading(false);
    }
  }

  async function toggleTemplate(planId: string, current: boolean) {
    await supabase
      .from('workout_plans')
      .update({ is_template: !current })
      .eq('id', planId);
    setPlans((prev) => prev.map((p) => p.id === planId ? { ...p, is_template: !current } : p));
  }

  async function deployToClient(clientId: string) {
    if (!deployPlanId) return;
    setDeployingId(clientId);
    const { data, error } = await supabase.rpc('deploy_template_to_client', {
      p_template_id: deployPlanId,
      p_client_id:   clientId,
    });
    setDeployingId(null);
    setDeployPlanId(null);
    if (error || data?.error) {
      Alert.alert('Error', data?.error ?? error?.message ?? 'Could not deploy plan.');
    } else {
      Alert.alert('Deployed', 'A copy of the plan has been assigned to the client.');
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
              isTrainer={isTrainer}
              onToggleTemplate={() => toggleTemplate(plan.id, plan.is_template)}
              onDeploy={() => setDeployPlanId(plan.id)}
            />
          ))
        )}

      </ScrollView>
      {/* Deploy to client modal */}
      <Modal visible={!!deployPlanId} animationType="slide" transparent onRequestClose={() => setDeployPlanId(null)}>
        <View style={templateStyles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setDeployPlanId(null)} activeOpacity={1} />
          <View style={templateStyles.sheet}>
            <View style={templateStyles.handle} />
            <Text style={templateStyles.sheetTitle}>Deploy to Client</Text>
            <Text style={templateStyles.sheetSub}>
              A copy of this plan will be assigned to the selected client.
            </Text>
            {activeClients.length === 0 ? (
              <Text style={templateStyles.empty}>No active clients to deploy to.</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {activeClients.map((c) => (
                  <TouchableOpacity
                    key={c.clientId}
                    style={templateStyles.clientRow}
                    onPress={() => deployToClient(c.clientId)}
                    disabled={!!deployingId}>
                    <View style={templateStyles.clientAvatar}>
                      <Text style={templateStyles.clientAvatarText}>{initials(c.name)}</Text>
                    </View>
                    <Text style={templateStyles.clientName}>{c.name}</Text>
                    {deployingId === c.clientId
                      ? <ActivityIndicator size="small" color={Colors.primary} />
                      : <IconSymbol name="arrow.up.circle.fill" size={20} color={Colors.success} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={templateStyles.cancelBtn} onPress={() => setDeployPlanId(null)}>
              <Text style={templateStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const templateStyles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.tertiary + '22',
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.tertiary + '55',
  },
  badgeText: {
    ...Typography.labelMd,
    color: Colors.tertiary,
  },
  footerRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  footerDivider: {
    width: 1,
    backgroundColor: Colors.outlineVariant,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: Colors.surfaceContainer,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    maxHeight: '65%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  sheetSub: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.lg,
  },
  empty: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.lg,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarText: {
    ...Typography.titleMd,
    color: Colors.primary,
  },
  clientName: {
    ...Typography.titleMd,
    color: Colors.onSurface,
    flex: 1,
  },
  cancelBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  cancelText: {
    ...Typography.titleMd,
    color: Colors.onSurfaceVariant,
  },
});
