import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
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

type CheckIn = {
  id:              string;
  weekStart:       string;
  sleepRating:     number;
  energyRating:    number;
  adherenceRating: number;
  notes:           string | null;
};

type Onboarding = {
  goals:        string[];
  experience:   string | null;
  trainingDays: number | null;
  injuries:     string | null;
  medical:      string | null;
};

const GOAL_LABELS: Record<string, string> = {
  weight_loss:     'Lose Weight',
  muscle_gain:     'Build Muscle',
  strength:        'Get Stronger',
  endurance:       'Improve Endurance',
  general_fitness: 'General Fitness',
  sport:           'Sport Performance',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
};

const RATING_LABELS = ['', 'Very Poor', 'Poor', 'OK', 'Good', 'Excellent'];

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
  const C = useColors();
  const pickerStyles = useMemo(() => StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
      backgroundColor: C.surfaceContainer,
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
      backgroundColor: C.outlineVariant,
      alignSelf: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      ...Typography.headlineMd,
      color: C.onSurface,
      marginBottom: Spacing.md,
    },
    planRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: C.outlineVariant,
    },
    planName: {
      ...Typography.titleMd,
      color: C.onSurface,
      flex: 1,
    },
    empty: {
      ...Typography.bodyMd,
      color: C.onSurfaceVariant,
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
      color: C.onSurfaceVariant,
    },
  }), [C]);

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
                  <IconSymbol name="dumbbell.fill" size={18} color={C.primary} />
                  <Text style={pickerStyles.planName}>{plan.name}</Text>
                  {assigningId === plan.id
                    ? <ActivityIndicator size="small" color={C.primary} />
                    : <IconSymbol name="chevron.right" size={16} color={C.onSurfaceVariant} />}
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
  const C = useColors();
  const router = useRouter();
  const { clientId, clientName } = useLocalSearchParams<{ clientId: string; clientName: string }>();

  const localStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
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
      color: C.onSurface,
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
      backgroundColor: C.primary + '33',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    avatarText: {
      ...Typography.headlineLg,
      color: C.primary,
    },
    clientName: {
      ...Typography.displayMd,
      color: C.onSurface,
    },
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: C.surfaceContainer,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      alignItems: 'center',
    },
    statValue: {
      ...Typography.titleLg,
      color: C.primary,
    },
    statLabel: {
      ...Typography.labelLg,
      color: C.onSurfaceVariant,
      marginTop: 2,
    },
    section: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      ...Typography.labelLg,
      color: C.onSurfaceVariant,
      marginBottom: Spacing.sm,
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: C.surfaceContainer,
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
      color: C.onSurface,
      flex: 1,
    },
    changeLink: {
      ...Typography.labelLg,
      color: C.primary,
    },
    assignPrompt: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      padding: Spacing.md,
    },
    assignPromptText: {
      ...Typography.titleMd,
      color: C.primary,
    },
    sessionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    sessionBorder: {
      borderBottomWidth: 1,
      borderBottomColor: C.outlineVariant,
    },
    sessionInfo: { flex: 1 },
    sessionName: {
      ...Typography.titleMd,
      color: C.onSurface,
    },
    sessionDate: {
      ...Typography.bodyMd,
      color: C.onSurfaceVariant,
    },
    sessionDuration: {
      ...Typography.labelLg,
      color: C.onSurfaceVariant,
    },
    emptyText: {
      ...Typography.bodyMd,
      color: C.onSurfaceVariant,
      padding: Spacing.md,
      textAlign: 'center',
    },
    sessionNotePreview: {
      ...Typography.bodyMd,
      color: C.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: 2,
    },
  }), [C]);

  const noteStyles = useMemo(() => StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
      backgroundColor: C.surfaceContainer,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.xl,
      paddingBottom: Spacing.xxxl,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: Radius.full,
      backgroundColor: C.outlineVariant,
      alignSelf: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      ...Typography.headlineMd,
      color: C.onSurface,
      marginBottom: Spacing.md,
    },
    input: {
      backgroundColor: C.surfaceContainerHighest,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: C.outlineVariant,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      ...Typography.bodyMd,
      color: C.onSurface,
      minHeight: 120,
      marginBottom: Spacing.md,
    },
    saveBtn: {
      height: 50,
      borderRadius: Radius.md,
      backgroundColor: C.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveBtnDisabled: { opacity: 0.45 },
    saveBtnText: { ...Typography.titleLg, color: C.background },
    cancelBtn: {
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelText: {
      ...Typography.titleMd,
      color: C.onSurfaceVariant,
    },
  }), [C]);

  const [loading,        setLoading]        = useState(true);
  const [sessions,       setSessions]       = useState<Session[]>([]);
  const [assignedPlan,   setAssignedPlan]   = useState<AssignedPlan | null>(null);
  const [trainerPlans,   setTrainerPlans]   = useState<TrainerPlan[]>([]);
  const [totalSessions,  setTotalSessions]  = useState(0);
  const [lastWeight,     setLastWeight]     = useState<string | null>(null);
  const [showPicker,     setShowPicker]     = useState(false);
  const [checkIns,       setCheckIns]       = useState<CheckIn[]>([]);
  const [threadId,       setThreadId]       = useState<string | null>(null);
  const [sessionNotes,   setSessionNotes]   = useState<Record<string, string>>({});
  const [noteModalId,    setNoteModalId]    = useState<string | null>(null);
  const [noteText,       setNoteText]       = useState('');
  const [savingNote,     setSavingNote]     = useState(false);
  const [onboarding,     setOnboarding]     = useState<Onboarding | null>(null);

  useEffect(() => {
    if (clientId) loadClientData();
  }, [clientId]);

  async function loadClientData() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !clientId) { setLoading(false); return; }

    const [sessionsRes, weightRes, assignedRes, trainerPlansRes, linkRes] = await Promise.all([
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

      // Trainer-client link (for check-ins + messaging)
      supabase
        .from('trainer_clients')
        .select('id')
        .eq('trainer_id', user.id)
        .eq('client_id', clientId)
        .eq('status', 'active')
        .maybeSingle(),
    ]);

    const rawSessions = sessionsRes.data ?? [];
    const mappedSessions: Session[] = rawSessions.map((s: any) => ({
      id:        s.id,
      name:      s.name,
      startedAt: s.started_at,
      duration:  s.duration_seconds,
    }));
    setSessions(mappedSessions);
    setTotalSessions(rawSessions.length);

    if (weightRes.data) {
      setLastWeight(`${weightRes.data.weight} ${weightRes.data.unit}`);
    }

    setAssignedPlan(assignedRes.data ?? null);
    setTrainerPlans((trainerPlansRes.data ?? []).map((p: any) => ({ id: p.id, name: p.name })));

    const link = linkRes.data;
    if (link) {
      setThreadId(link.id);

      // Load check-ins, session notes, and onboarding in parallel
      const sessionIds = mappedSessions.map((s) => s.id);
      const [checkInsRes, notesRes, onboardingRes] = await Promise.all([
        supabase
          .from('check_ins')
          .select('id, week_start, sleep_rating, energy_rating, adherence_rating, notes')
          .eq('trainer_client_id', link.id)
          .order('week_start', { ascending: false })
          .limit(4),
        sessionIds.length > 0
          ? supabase
              .from('session_notes')
              .select('session_id, content')
              .in('session_id', sessionIds)
              .eq('trainer_id', user.id)
          : Promise.resolve({ data: [] }),
        supabase
          .from('client_onboarding')
          .select('goals, experience, training_days, injuries, medical_notes')
          .eq('user_id', clientId)
          .maybeSingle(),
      ]);

      setCheckIns((checkInsRes.data ?? []).map((c: any) => ({
        id:              c.id,
        weekStart:       c.week_start,
        sleepRating:     c.sleep_rating,
        energyRating:    c.energy_rating,
        adherenceRating: c.adherence_rating,
        notes:           c.notes,
      })));

      const notesMap: Record<string, string> = {};
      ((notesRes as any).data ?? []).forEach((n: any) => {
        notesMap[n.session_id] = n.content;
      });
      setSessionNotes(notesMap);

      const ob = (onboardingRes as any).data;
      if (ob) {
        setOnboarding({
          goals:        ob.goals ?? [],
          experience:   ob.experience,
          trainingDays: ob.training_days,
          injuries:     ob.injuries,
          medical:      ob.medical_notes,
        });
      }
    }

    setLoading(false);
  }

  async function handleSaveNote() {
    if (!noteModalId || savingNote) return;
    setSavingNote(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingNote(false); return; }

    const content = noteText.trim();
    if (content) {
      await supabase
        .from('session_notes')
        .upsert(
          { session_id: noteModalId, trainer_id: user.id, content, updated_at: new Date().toISOString() },
          { onConflict: 'session_id,trainer_id' }
        );
      setSessionNotes((prev) => ({ ...prev, [noteModalId]: content }));
    } else {
      await supabase
        .from('session_notes')
        .delete()
        .eq('session_id', noteModalId)
        .eq('trainer_id', user.id);
      setSessionNotes((prev) => { const n = { ...prev }; delete n[noteModalId]; return n; });
    }

    setSavingNote(false);
    setNoteModalId(null);
    setNoteText('');
  }

  const name = clientName ?? 'Client';

  return (
    <SafeAreaView style={localStyles.container} edges={['top']}>
      {/* Header */}
      <View style={localStyles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={24} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={localStyles.headerTitle}>Client</Text>
        {threadId ? (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/conversation' as any, params: { threadId, otherName: name } })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <IconSymbol name="bubble.left.fill" size={22} color={C.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
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
          <ActivityIndicator color={C.primary} style={{ marginVertical: 40 }} />
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

            {/* Fitness profile / onboarding */}
            <View style={localStyles.section}>
              <Text style={localStyles.sectionTitle}>Fitness Profile</Text>
              <View style={localStyles.card}>
                {onboarding ? (
                  <View style={{ padding: Spacing.md, gap: Spacing.md }}>
                    {/* Goals */}
                    {onboarding.goals.length > 0 && (
                      <View>
                        <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant, marginBottom: Spacing.xs }}>GOALS</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                          {onboarding.goals.map((g) => (
                            <View key={g} style={{
                              paddingHorizontal: Spacing.sm, paddingVertical: 3,
                              borderRadius: Radius.full,
                              backgroundColor: C.primary + '22',
                              borderWidth: 1, borderColor: C.primary + '44',
                            }}>
                              <Text style={{ ...Typography.labelLg, color: C.primary, fontWeight: '600' }}>
                                {GOAL_LABELS[g] ?? g}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    {/* Experience + days */}
                    <View style={{ flexDirection: 'row', gap: Spacing.lg }}>
                      {onboarding.experience && (
                        <View>
                          <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant }}>EXPERIENCE</Text>
                          <Text style={{ ...Typography.titleMd, color: C.onSurface, marginTop: 2 }}>
                            {EXPERIENCE_LABELS[onboarding.experience] ?? onboarding.experience}
                          </Text>
                        </View>
                      )}
                      {onboarding.trainingDays != null && (
                        <View>
                          <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant }}>FREQUENCY</Text>
                          <Text style={{ ...Typography.titleMd, color: C.onSurface, marginTop: 2 }}>
                            {onboarding.trainingDays}×/week
                          </Text>
                        </View>
                      )}
                    </View>
                    {/* Injuries */}
                    {onboarding.injuries ? (
                      <View>
                        <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant, marginBottom: Spacing.xs }}>INJURIES / LIMITATIONS</Text>
                        <Text style={{ ...Typography.bodyMd, color: C.onSurface }}>{onboarding.injuries}</Text>
                      </View>
                    ) : null}
                    {/* Medical */}
                    {onboarding.medical ? (
                      <View>
                        <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant, marginBottom: Spacing.xs }}>MEDICAL NOTES</Text>
                        <Text style={{ ...Typography.bodyMd, color: C.onSurface }}>{onboarding.medical}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={{ padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <IconSymbol name="person.text.rectangle.fill" size={18} color={C.outlineVariant} />
                    <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant, flex: 1 }}>
                      Client hasn't filled in their fitness profile yet
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Assigned plan */}
            <View style={localStyles.section}>
              <Text style={localStyles.sectionTitle}>Assigned Plan</Text>
              <View style={localStyles.card}>
                {assignedPlan ? (
                  <View style={localStyles.planRow}>
                    <IconSymbol name="dumbbell.fill" size={20} color={C.primary} />
                    <Text style={localStyles.planName}>{assignedPlan.name}</Text>
                    <TouchableOpacity onPress={() => setShowPicker(true)}>
                      <Text style={localStyles.changeLink}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={localStyles.assignPrompt} onPress={() => setShowPicker(true)}>
                    <IconSymbol name="plus.circle.fill" size={18} color={C.primary} />
                    <Text style={localStyles.assignPromptText}>Assign a Plan</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Weekly check-ins */}
            {checkIns.length > 0 && (
              <View style={localStyles.section}>
                <Text style={localStyles.sectionTitle}>Weekly Check-Ins</Text>
                <View style={localStyles.card}>
                  {checkIns.map((ci, idx) => (
                    <View
                      key={ci.id}
                      style={[
                        localStyles.sessionRow,
                        idx < checkIns.length - 1 && localStyles.sessionBorder,
                        { flexDirection: 'column', alignItems: 'flex-start', gap: Spacing.xs },
                      ]}>
                      <Text style={localStyles.sessionName}>
                        Week of {new Date(ci.weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: Spacing.lg }}>
                        <Text style={localStyles.sessionDate}>
                          Sleep: <Text style={{ color: C.onSurface }}>{RATING_LABELS[ci.sleepRating]}</Text>
                        </Text>
                        <Text style={localStyles.sessionDate}>
                          Energy: <Text style={{ color: C.onSurface }}>{RATING_LABELS[ci.energyRating]}</Text>
                        </Text>
                        <Text style={localStyles.sessionDate}>
                          Plan: <Text style={{ color: C.onSurface }}>{RATING_LABELS[ci.adherenceRating]}</Text>
                        </Text>
                      </View>
                      {ci.notes ? (
                        <Text style={localStyles.sessionNotePreview} numberOfLines={2}>{ci.notes}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            )}

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
                        {sessionNotes[s.id] ? (
                          <Text style={localStyles.sessionNotePreview} numberOfLines={1}>
                            {sessionNotes[s.id]}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={localStyles.sessionDuration}>
                        {formatDuration(s.duration)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setNoteModalId(s.id);
                          setNoteText(sessionNotes[s.id] ?? '');
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ marginLeft: Spacing.xs }}>
                        <IconSymbol
                          name="note.text"
                          size={18}
                          color={sessionNotes[s.id] ? C.primary : C.outlineVariant}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Session note modal */}
      <Modal visible={!!noteModalId} animationType="slide" transparent onRequestClose={() => setNoteModalId(null)}>
        <View style={noteStyles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setNoteModalId(null)} activeOpacity={1} />
          <View style={noteStyles.sheet}>
            <View style={noteStyles.handle} />
            <Text style={noteStyles.title}>Session Note</Text>
            <TextInput
              style={noteStyles.input}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Add a note for this session…"
              placeholderTextColor={C.onSurfaceVariant}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoFocus
            />
            <TouchableOpacity
              style={[noteStyles.saveBtn, savingNote && noteStyles.saveBtnDisabled]}
              onPress={handleSaveNote}
              disabled={savingNote}>
              {savingNote
                ? <ActivityIndicator color={C.background} />
                : <Text style={noteStyles.saveBtnText}>Save Note</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={noteStyles.cancelBtn} onPress={() => setNoteModalId(null)}>
              <Text style={noteStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
