import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/format';

// ─── Types ────────────────────────────────────────────────────────────────────

type Session = {
  id:        string;
  name:      string;
  startedAt: string;
  duration:  number | null;
};

type AssignedPlan = {
  id:   string;
  name: string;
};

type TrainerPlan = {
  id:   string;
  name: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

// ─── Plan picker modal ────────────────────────────────────────────────────────

function PlanPickerModal({
  visible,
  plans,
  clientId,
  onClose,
  onAssigned,
}: {
  visible:    boolean;
  plans:      TrainerPlan[];
  clientId:   string;
  onClose:    () => void;
  onAssigned: (plan: TrainerPlan) => void;
}) {
  const [assigningId, setAssigningId] = useState<string | null>(null);

  async function handleAssign(plan: TrainerPlan) {
    setAssigningId(plan.id);
    const { data, error } = await supabase.rpc('assign_plan_to_client', {
      p_plan_id:   plan.id,
      p_client_id: clientId,
    });

    setAssigningId(null);

    if (error || data?.error) {
      Alert.alert('Error', data?.error ?? error?.message ?? 'Could not assign plan.');
      return;
    }

    onAssigned(plan);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pickerStyles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.handle} />
          <Text style={pickerStyles.title}>Assign a Plan</Text>
          {plans.length === 0 ? (
            <Text style={pickerStyles.empty}>You haven't created any plans yet.</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {plans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={pickerStyles.planRow}
                  onPress={() => handleAssign(plan)}
                  disabled={!!assigningId}>
                  <IconSymbol name="dumbbell.fill" size={18} color={Colors.primary} />
                  <Text style={pickerStyles.planName}>{plan.name}</Text>
                  {assigningId === plan.id
                    ? <ActivityIndicator size="small" color={Colors.primary} />
                    : <IconSymbol name="chevron.right" size={16} color={Colors.onSurfaceVariant} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity style={pickerStyles.cancelBtn} onPress={onClose}>
            <Text style={pickerStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ClientDetailScreen() {
  const router = useRouter();
  const { clientId, clientName } = useLocalSearchParams<{ clientId: string; clientName: string }>();

  const [loading,       setLoading]       = useState(true);
  const [sessions,      setSessions]      = useState<Session[]>([]);
  const [assignedPlan,  setAssignedPlan]  = useState<AssignedPlan | null>(null);
  const [trainerPlans,  setTrainerPlans]  = useState<TrainerPlan[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [lastWeight,    setLastWeight]    = useState<string | null>(null);
  const [showPicker,    setShowPicker]    = useState(false);

  useEffect(() => {
    if (clientId) loadClientData();
  }, [clientId]);

  async function loadClientData() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !clientId) { setLoading(false); return; }

    const [sessionsRes, weightRes, assignedRes, trainerPlansRes] = await Promise.all([
      // Recent sessions
      supabase
        .from('workout_sessions')
        .select('id, name, started_at, duration_seconds')
        .eq('user_id', clientId)
        .not('finished_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(10),

      // Last body weight
      supabase
        .from('body_weight_logs')
        .select('weight, unit')
        .eq('user_id', clientId)
        .order('logged_at', { ascending: false })
        .limit(1)
        .single(),

      // Assigned plan from this trainer
      supabase
        .from('workout_plans')
        .select('id, name')
        .eq('assigned_to', clientId)
        .eq('assigned_by', user.id)
        .maybeSingle(),

      // Trainer's own plans for the picker
      supabase
        .from('workout_plans')
        .select('id, name')
        .eq('user_id', user.id)
        .is('assigned_to', null)
        .order('created_at', { ascending: false }),
    ]);

    const rawSessions = sessionsRes.data ?? [];
    setSessions(rawSessions.map((s: any) => ({
      id:        s.id,
      name:      s.name,
      startedAt: s.started_at,
      duration:  s.duration_seconds,
    })));
    setTotalSessions(rawSessions.length);

    if (weightRes.data) {
      setLastWeight(`${weightRes.data.weight} ${weightRes.data.unit}`);
    }

    setAssignedPlan(assignedRes.data ?? null);
    setTrainerPlans((trainerPlansRes.data ?? []).map((p: any) => ({ id: p.id, name: p.name })));

    setLoading(false);
  }

  const name = clientName ?? 'Client';

  return (
    <SafeAreaView style={localStyles.container} edges={['top']}>
      {/* Header */}
      <View style={localStyles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={localStyles.headerTitle}>Client</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={localStyles.scroll}
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Client hero */}
        <View style={localStyles.hero}>
          <View style={localStyles.avatar}>
            <Text style={localStyles.avatarText}>{initials(name)}</Text>
          </View>
          <Text style={localStyles.clientName}>{name}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* Stats row */}
            <View style={localStyles.statsRow}>
              <View style={localStyles.statCard}>
                <Text style={localStyles.statValue}>{totalSessions}</Text>
                <Text style={localStyles.statLabel}>Sessions</Text>
              </View>
              <View style={localStyles.statCard}>
                <Text style={localStyles.statValue}>{lastWeight ?? '—'}</Text>
                <Text style={localStyles.statLabel}>Last Weight</Text>
              </View>
              <View style={localStyles.statCard}>
                <Text style={localStyles.statValue}>
                  {sessions[0] ? formatDate(sessions[0].startedAt) : '—'}
                </Text>
                <Text style={localStyles.statLabel}>Last Session</Text>
              </View>
            </View>

            {/* Assigned plan */}
            <View style={localStyles.section}>
              <Text style={localStyles.sectionTitle}>Assigned Plan</Text>
              <View style={localStyles.card}>
                {assignedPlan ? (
                  <View style={localStyles.planRow}>
                    <IconSymbol name="dumbbell.fill" size={20} color={Colors.primary} />
                    <Text style={localStyles.planName}>{assignedPlan.name}</Text>
                    <TouchableOpacity onPress={() => setShowPicker(true)}>
                      <Text style={localStyles.changeLink}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={localStyles.assignPrompt} onPress={() => setShowPicker(true)}>
                    <IconSymbol name="plus.circle.fill" size={18} color={Colors.primary} />
                    <Text style={localStyles.assignPromptText}>Assign a Plan</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Recent sessions */}
            <View style={localStyles.section}>
              <Text style={localStyles.sectionTitle}>Recent Sessions</Text>
              {sessions.length === 0 ? (
                <View style={localStyles.card}>
                  <Text style={localStyles.emptyText}>No sessions logged yet.</Text>
                </View>
              ) : (
                <View style={localStyles.card}>
                  {sessions.map((s, idx) => (
                    <View
                      key={s.id}
                      style={[
                        localStyles.sessionRow,
                        idx < sessions.length - 1 && localStyles.sessionBorder,
                      ]}>
                      <View style={localStyles.sessionInfo}>
                        <Text style={localStyles.sessionName}>{s.name}</Text>
                        <Text style={localStyles.sessionDate}>{formatDate(s.startedAt)}</Text>
                      </View>
                      <Text style={localStyles.sessionDuration}>
                        {formatDuration(s.duration)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <PlanPickerModal
        visible={showPicker}
        plans={trainerPlans}
        clientId={clientId ?? ''}
        onClose={() => setShowPicker(false)}
        onAssigned={(plan) => setAssignedPlan(plan)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    ...Typography.headlineLg,
    color: Colors.primary,
  },
  clientName: {
    ...Typography.displayMd,
    color: Colors.onSurface,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.titleLg,
    color: Colors.primary,
  },
  statLabel: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  planName: {
    ...Typography.titleMd,
    color: Colors.onSurface,
    flex: 1,
  },
  changeLink: {
    ...Typography.labelLg,
    color: Colors.primary,
  },
  assignPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  assignPromptText: {
    ...Typography.titleMd,
    color: Colors.primary,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sessionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  sessionInfo: { flex: 1 },
  sessionName: {
    ...Typography.titleMd,
    color: Colors.onSurface,
  },
  sessionDate: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  sessionDuration: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
  },
  emptyText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    padding: Spacing.md,
    textAlign: 'center',
  },
});

const pickerStyles = StyleSheet.create({
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
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  planName: {
    ...Typography.titleMd,
    color: Colors.onSurface,
    flex: 1,
  },
  empty: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.lg,
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
