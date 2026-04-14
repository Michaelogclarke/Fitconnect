import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useStyles } from '@/styles/tabs/index.styles';
import { supabase } from '@/lib/supabase';
import { formatSessionDate, formatDuration, formatVolume, initials } from '@/lib/format';
import { getCachedAny, setCached, CACHE_KEYS } from '@/lib/cache';
import { useWorkout, type Exercise, type SetRow } from '@/contexts/WorkoutContext';
const WEEKLY_GOAL_KEY    = 'pref:weekly_goal';
const WEEKLY_GOAL_OPTIONS = [2, 3, 4, 5, 6];

// ─── Streak helpers ───────────────────────────────────────────────────────────

function toLocalDateStr(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeStreaks(isoDates: string[]): { currentStreak: number; longestStreak: number } {
  if (!isoDates.length) return { currentStreak: 0, longestStreak: 0 };

  // Unique local dates, newest first
  const unique = [...new Set(isoDates.map(toLocalDateStr))].sort().reverse();

  const now  = new Date();
  const todayStr = toLocalDateStr(now.toISOString());
  const yd   = new Date(now); yd.setDate(yd.getDate() - 1);
  const ydStr = toLocalDateStr(yd.toISOString());

  // Current streak — count back from today or yesterday
  let currentStreak = 0;
  if (unique[0] === todayStr || unique[0] === ydStr) {
    currentStreak = 1;
    // Use noon to avoid any DST edge cases when stepping back one day
    let anchor = new Date(unique[0] + 'T12:00:00');
    for (let i = 1; i < unique.length; i++) {
      const prev = new Date(anchor); prev.setDate(prev.getDate() - 1);
      if (unique[i] === toLocalDateStr(prev.toISOString())) {
        currentStreak++;
        anchor = prev;
      } else { break; }
    }
  }

  // Longest streak — scan full history
  let longestStreak = 0;
  let run = 1;
  for (let i = 0; i < unique.length - 1; i++) {
    const a = new Date(unique[i]     + 'T12:00:00');
    const b = new Date(unique[i + 1] + 'T12:00:00');
    if (Math.round((a.getTime() - b.getTime()) / 86_400_000) === 1) {
      run++;
    } else {
      longestStreak = Math.max(longestStreak, run);
      run = 1;
    }
  }
  longestStreak = Math.max(longestStreak, run);

  return { currentStreak, longestStreak };
}

// ─────────────────────────────────────────────────────────────────────────────

type RecentSession = {
  id: string;
  name: string;
  started_at: string;
  duration_seconds: number | null;
  set_count: number;
  volume: number;
};

type HomeData = {
  userName:       string;
  recentSessions: RecentSession[];
  weekSessions:   number;
  weekVolume:     number;
  totalSessions:  number;
  currentStreak:  number;
  longestStreak:  number;
};

type FlaggedClient = {
  clientId:  string;
  name:      string;
  daysSince: number;
};

type RecentClientActivity = {
  clientName:   string;
  sessionName:  string;
  startedAt:    string;
};

type TrainerDashData = {
  activeClients:  number;
  weekSessions:   number;
  flagged:        FlaggedClient[];
  recentActivity: RecentClientActivity[];
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export default function HomeScreen() {
  const C = useColors();
  const styles = useStyles();
  const router = useRouter();
  const { isActive, startWorkoutFromPlan } = useWorkout();

  const trainerStyles = useMemo(() => StyleSheet.create({
    actionRow: {
      flexDirection: 'row',
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.lg,
      gap: Spacing.sm,
    },
    actionCard: {
      flex: 1,
      backgroundColor: C.surfaceContainer,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      alignItems: 'center',
      gap: Spacing.xs,
    },
    actionIcon: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionLabel: {
      ...Typography.labelLg,
      color: C.onSurfaceVariant,
      textAlign: 'center',
    },
    flagCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      backgroundColor: C.surfaceContainer,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      gap: Spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: C.error,
    },
    flagAvatar: {
      width: 40,
      height: 40,
      borderRadius: Radius.full,
      backgroundColor: C.error + '22',
      justifyContent: 'center',
      alignItems: 'center',
    },
    flagAvatarText: {
      ...Typography.titleMd,
      color: C.error,
    },
    flagName: {
      ...Typography.titleMd,
      color: C.onSurface,
    },
    flagSub: {
      ...Typography.bodyMd,
      color: C.onSurfaceVariant,
      marginTop: 2,
    },
    flagBadge: {
      backgroundColor: C.error + '22',
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
    },
    flagBadgeText: {
      ...Typography.labelLg,
      color: C.error,
      fontWeight: '700',
    },
    modeBar: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      gap: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: C.outlineVariant,
      backgroundColor: C.surfaceContainer,
    },
    modePill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingVertical: 10,
      borderRadius: Radius.full,
      backgroundColor: C.surfaceContainerHigh,
    },
    modePillActive: {
      backgroundColor: C.primary,
    },
    modePillText: {
      ...Typography.labelLg,
      color: C.onSurfaceVariant,
    },
    modePillTextActive: {
      color: C.background,
      fontWeight: '600',
    },
  }), [C]);

  const [loading,        setLoading]        = useState(true);
  const [role,           setRole]           = useState<'client' | 'trainer' | null>(null);
  const [userName,       setUserName]       = useState('');
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [weekSessions,   setWeekSessions]   = useState(0);
  const [weekVolume,     setWeekVolume]     = useState(0);
  const [totalSessions,  setTotalSessions]  = useState(0);
  const [currentStreak,  setCurrentStreak]  = useState(0);
  const [longestStreak,  setLongestStreak]  = useState(0);
  const [weeklyGoal,     setWeeklyGoal]     = useState(4);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [hasActiveTrainer, setHasActiveTrainer] = useState(false);
  const [trainerData,    setTrainerData]    = useState<TrainerDashData | null>(null);
  const [trainerMode,    setTrainerMode]    = useState<'clients' | 'own'>('clients');
  const [ownLoading,     setOwnLoading]     = useState(false);
  const [ownDataLoaded,  setOwnDataLoaded]  = useState(false);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  function applyData(d: HomeData) {
    setUserName(d.userName);
    setRecentSessions(d.recentSessions);
    setWeekSessions(d.weekSessions);
    setWeekVolume(d.weekVolume);
    setTotalSessions(d.totalSessions);
    setCurrentStreak(d.currentStreak);
    setLongestStreak(d.longestStreak);
  }

  // Load weekly goal from storage once on mount
  useEffect(() => {
    AsyncStorage.getItem(WEEKLY_GOAL_KEY).then((val) => {
      if (val) setWeeklyGoal(Number(val));
    });
  }, []);

  async function openGoalPicker() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowGoalPicker(true);
  }

  async function selectWeeklyGoal(val: number) {
    setWeeklyGoal(val);
    setShowGoalPicker(false);
    await AsyncStorage.setItem(WEEKLY_GOAL_KEY, String(val));
  }


  // Reload whenever the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Lazy-load personal workout data when trainer switches to 'own' mode
  useEffect(() => {
    if (trainerMode === 'own' && !ownDataLoaded) {
      loadOwnWorkoutData();
    }
  }, [trainerMode]);

  async function loadData() {
    // Show cached data immediately — no loading flash
    const cached = await getCachedAny<HomeData>(CACHE_KEYS.HOME_DATA);
    if (cached) {
      applyData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // Background refresh from Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Profile name + role
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();
      const userName   = profile?.full_name?.split(' ')[0] ?? '';
      const userRole   = (profile?.role ?? 'client') as 'client' | 'trainer';
      setRole(userRole);
      setUserName(userName);

      if (userRole === 'trainer') {
        await loadTrainerData(user.id);
        setLoading(false);
        return;
      }

      // Recent sessions with exercises + sets for volume
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select(`
          id, name, started_at, duration_seconds,
          session_exercises(
            session_sets(weight, reps, is_completed)
          )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(3);

      const recentSessions: RecentSession[] = (sessions ?? []).map((s: any) => {
        const allSets = s.session_exercises.flatMap((e: any) => e.session_sets);
        const completedSets = allSets.filter((st: any) => st.is_completed);
        const volume = completedSets.reduce(
          (sum: number, st: any) => sum + ((st.weight ?? 0) * (st.reps ?? 0)), 0
        );
        return {
          id:               s.id,
          name:             s.name,
          started_at:       s.started_at,
          duration_seconds: s.duration_seconds,
          set_count:        completedSets.length,
          volume,
        };
      });

      // This week stats
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

      const { data: weekData } = await supabase
        .from('workout_sessions')
        .select(`session_exercises(session_sets(weight, reps, is_completed))`)
        .eq('user_id', user.id)
        .gte('started_at', weekStart.toISOString());

      const weekSessions = weekData?.length ?? 0;
      const weekVolume = (weekData ?? [])
        .flatMap((s: any) => s.session_exercises.flatMap((e: any) => e.session_sets))
        .filter((st: any) => st.is_completed)
        .reduce((sum: number, st: any) => sum + ((st.weight ?? 0) * (st.reps ?? 0)), 0);

      // Total session count + all dates for streak calculation
      const { data: allDateRows, count } = await supabase
        .from('workout_sessions')
        .select('started_at', { count: 'exact' })
        .eq('user_id', user.id);
      const totalSessions = count ?? 0;

      const { currentStreak, longestStreak } = computeStreaks(
        (allDateRows ?? []).map((r: any) => r.started_at)
      );

      // Check if client has an active trainer (controls Book Session visibility)
      const { data: trainerLink } = await supabase
        .from('trainer_clients')
        .select('id')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      setHasActiveTrainer(!!trainerLink);

      const fresh: HomeData = {
        userName, recentSessions, weekSessions, weekVolume,
        totalSessions, currentStreak, longestStreak,
      };
      applyData(fresh);
      await setCached(CACHE_KEYS.HOME_DATA, fresh);
    } catch {
      // Silently fall back to cached data already displayed
    } finally {
      setLoading(false);
    }
  }

  async function loadTrainerData(userId: string) {
    // 1. Active client links
    const { data: links } = await supabase
      .from('trainer_clients')
      .select('id, client_id')
      .eq('trainer_id', userId)
      .eq('status', 'active');

    const activeClients = links?.length ?? 0;

    if (activeClients === 0) {
      setTrainerData({ activeClients: 0, weekSessions: 0, flagged: [], recentActivity: [] });
      return;
    }

    const clientIds = (links ?? []).map((l) => l.client_id);

    // 2. Profile names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', clientIds);
    const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name ?? 'Unknown']));

    // 3. Sessions this week across all clients
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

    const { count: weekSessions } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .in('user_id', clientIds)
      .gte('started_at', weekStart.toISOString())
      .not('finished_at', 'is', null);

    // 4. Last session per client (to find flagged)
    const { data: lastSessions } = await supabase
      .from('workout_sessions')
      .select('user_id, started_at')
      .in('user_id', clientIds)
      .not('finished_at', 'is', null)
      .order('started_at', { ascending: false });

    const lastByClient: Record<string, string> = {};
    (lastSessions ?? []).forEach((s) => {
      if (!lastByClient[s.user_id]) lastByClient[s.user_id] = s.started_at;
    });

    const now = Date.now();
    const flagged: FlaggedClient[] = clientIds
      .map((id) => {
        const last = lastByClient[id];
        const days = last
          ? Math.floor((now - new Date(last).getTime()) / 86_400_000)
          : 999;
        return { clientId: id, name: nameMap[id] ?? 'Unknown', daysSince: days };
      })
      .filter((c) => c.daysSince >= 7)
      .sort((a, b) => b.daysSince - a.daysSince)
      .slice(0, 3);

    // 5. Recent activity across all clients (last 5 completed sessions)
    const { data: recent } = await supabase
      .from('workout_sessions')
      .select('user_id, name, started_at')
      .in('user_id', clientIds)
      .not('finished_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(5);

    const recentActivity: RecentClientActivity[] = (recent ?? []).map((s) => ({
      clientName:  nameMap[s.user_id] ?? 'Unknown',
      sessionName: s.name,
      startedAt:   s.started_at,
    }));

    setTrainerData({ activeClients, weekSessions: weekSessions ?? 0, flagged, recentActivity });
  }

  async function loadOwnWorkoutData() {
    setOwnLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select(`
          id, name, started_at, duration_seconds,
          session_exercises(
            session_sets(weight, reps, is_completed)
          )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(3);

      const recentSessions: RecentSession[] = (sessions ?? []).map((s: any) => {
        const allSets = s.session_exercises.flatMap((e: any) => e.session_sets);
        const completedSets = allSets.filter((st: any) => st.is_completed);
        const volume = completedSets.reduce(
          (sum: number, st: any) => sum + ((st.weight ?? 0) * (st.reps ?? 0)), 0
        );
        return {
          id: s.id, name: s.name, started_at: s.started_at,
          duration_seconds: s.duration_seconds, set_count: completedSets.length, volume,
        };
      });

      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

      const { data: weekData } = await supabase
        .from('workout_sessions')
        .select(`session_exercises(session_sets(weight, reps, is_completed))`)
        .eq('user_id', user.id)
        .gte('started_at', weekStart.toISOString());

      const weekSessions = weekData?.length ?? 0;
      const weekVolume = (weekData ?? [])
        .flatMap((s: any) => s.session_exercises.flatMap((e: any) => e.session_sets))
        .filter((st: any) => st.is_completed)
        .reduce((sum: number, st: any) => sum + ((st.weight ?? 0) * (st.reps ?? 0)), 0);

      const { data: allDateRows, count } = await supabase
        .from('workout_sessions')
        .select('started_at', { count: 'exact' })
        .eq('user_id', user.id);

      const { currentStreak, longestStreak } = computeStreaks(
        (allDateRows ?? []).map((r: any) => r.started_at)
      );

      setRecentSessions(recentSessions);
      setWeekSessions(weekSessions);
      setWeekVolume(weekVolume);
      setTotalSessions(count ?? 0);
      setCurrentStreak(currentStreak);
      setLongestStreak(longestStreak);
      setOwnDataLoaded(true);
    } catch {}
    finally { setOwnLoading(false); }
  }

  async function doAgain(sessionId: string) {
    try {
      const { data } = await supabase
        .from('workout_sessions')
        .select(`
          session_exercises(
            exercise_name, muscle_group, sort_order,
            session_sets(set_number, weight, reps, is_completed)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (!data) return;

      const sortedEx = [...(data as any).session_exercises]
        .sort((a: any, b: any) => a.sort_order - b.sort_order);

      const exercises: Exercise[] = sortedEx.map((ex: any) => ({
        id:     Math.random().toString(36).slice(2),
        name:   ex.exercise_name,
        muscle: ex.muscle_group ?? '',
        tag:    'Custom',
      }));

      const setsState: Record<string, SetRow[]> = {};
      sortedEx.forEach((ex: any, i: number) => {
        const completed = ex.session_sets.filter((s: any) => s.is_completed);
        const rows      = completed.length > 0 ? completed : ex.session_sets.slice(0, 1);
        setsState[exercises[i].id] = rows.map((s: any) => ({
          weight: s.weight != null ? String(s.weight) : '0',
          reps:   s.reps   != null ? String(s.reps)   : '10',
          done:   false,
        }));
      });

      function launch() {
        startWorkoutFromPlan(exercises, setsState);
        router.push('/start-workout' as any);
      }

      if (isActive) {
        Alert.alert(
          'Workout in Progress',
          'Starting this workout will discard your current session.',
          [
            { text: 'Keep Current', style: 'cancel' },
            { text: 'Start New', style: 'destructive', onPress: launch },
          ]
        );
      } else {
        launch();
      }
    } catch {}
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {userName ? `${getGreeting()}, ${userName}` : getGreeting()}
            </Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity style={styles.iconBtn}>
              <IconSymbol name="bell.fill" size={20} color={C.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: C.primary }]}
              onPress={() => router.push('/(tabs)/profile' as any)}>
              <Text style={{ ...Typography.labelLg, color: C.background }}>
                {initials(userName)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 60 }} />
        ) : role === 'trainer' && trainerMode === 'clients' ? (
          /* ── Trainer Dashboard ──────────────────────────────────────── */
          <>
            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{trainerData?.activeClients ?? 0}</Text>
                <Text style={styles.statLabel}>Clients</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{trainerData?.weekSessions ?? 0}</Text>
                <Text style={styles.statLabel}>Sessions this week</Text>
              </View>
            </View>

            {/* Quick actions — row 1 */}
            <View style={trainerStyles.actionRow}>
              <TouchableOpacity
                style={trainerStyles.actionCard}
                onPress={() => router.push('/(tabs)/clients' as any)}>
                <View style={[trainerStyles.actionIcon, { backgroundColor: C.primary + '22' }]}>
                  <IconSymbol name="person.2.fill" size={20} color={C.primary} />
                </View>
                <Text style={trainerStyles.actionLabel}>All Clients</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={trainerStyles.actionCard}
                onPress={() => router.push('/(tabs)/chat' as any)}>
                <View style={[trainerStyles.actionIcon, { backgroundColor: C.success + '22' }]}>
                  <IconSymbol name="bubble.left.and.bubble.right.fill" size={20} color={C.success} />
                </View>
                <Text style={trainerStyles.actionLabel}>Messages</Text>
              </TouchableOpacity>
            </View>

            {/* Quick actions — row 2 */}
            <View style={trainerStyles.actionRow}>
              <TouchableOpacity
                style={trainerStyles.actionCard}
                onPress={() => router.push('/set-availability' as any)}>
                <View style={[trainerStyles.actionIcon, { backgroundColor: C.primaryDim + '22' }]}>
                  <IconSymbol name="calendar.badge.plus" size={20} color={C.primaryDim} />
                </View>
                <Text style={trainerStyles.actionLabel}>Availability</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={trainerStyles.actionCard}
                onPress={() => router.push('/bookings' as any)}>
                <View style={[trainerStyles.actionIcon, { backgroundColor: C.secondary + '22' }]}>
                  <IconSymbol name="calendar.badge.checkmark" size={20} color={C.secondary} />
                </View>
                <Text style={trainerStyles.actionLabel}>Bookings</Text>
              </TouchableOpacity>
            </View>

            {/* Needs attention */}
            {(trainerData?.flagged ?? []).length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Needs Attention</Text>
                {(trainerData?.flagged ?? []).map((c) => (
                  <TouchableOpacity
                    key={c.clientId}
                    style={trainerStyles.flagCard}
                    onPress={() => router.push({
                      pathname: '/client-detail' as any,
                      params: { clientId: c.clientId, clientName: c.name },
                    })}
                    activeOpacity={0.8}>
                    <View style={trainerStyles.flagAvatar}>
                      <Text style={trainerStyles.flagAvatarText}>{initials(c.name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={trainerStyles.flagName}>{c.name}</Text>
                      <Text style={trainerStyles.flagSub}>
                        {c.daysSince >= 999 ? 'No sessions logged yet' : `Last session ${c.daysSince} days ago`}
                      </Text>
                    </View>
                    <View style={trainerStyles.flagBadge}>
                      <Text style={trainerStyles.flagBadgeText}>
                        {c.daysSince >= 999 ? 'New' : `${c.daysSince}d`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Recent client activity */}
            <Text style={styles.sectionLabel}>Recent Client Activity</Text>
            {(trainerData?.recentActivity ?? []).length === 0 ? (
              <View style={styles.emptyCard}>
                <IconSymbol name="dumbbell.fill" size={28} color={C.outlineVariant} />
                <Text style={styles.emptyText}>No activity yet</Text>
                <Text style={styles.emptySub}>Client sessions will appear here once they start training</Text>
              </View>
            ) : (
              (trainerData?.recentActivity ?? []).map((a, i) => (
                <View key={i} style={styles.recentCard}>
                  <View style={styles.recentIconBox}>
                    <Text style={{ ...Typography.labelLg, color: C.primary }}>{initials(a.clientName)}</Text>
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>{a.sessionName}</Text>
                    <Text style={styles.recentMeta}>
                      {a.clientName} · {formatSessionDate(a.startedAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        ) : role === 'trainer' && trainerMode === 'own' && ownLoading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Streak banner */}
            {currentStreak > 0 && (
              <View style={styles.streakCard}>
                <View style={styles.streakLeft}>
                  <IconSymbol name="flame.fill" size={28} color={C.primary} />
                </View>
                <View style={styles.streakMid}>
                  <Text style={styles.streakTitle}>
                    {currentStreak} day streak
                  </Text>
                  <Text style={styles.streakSub}>
                    {currentStreak === longestStreak
                      ? 'Personal best — keep it up!'
                      : `Best: ${longestStreak} days · Keep going!`}
                  </Text>
                </View>
                <Text style={styles.streakCount}>{currentStreak}</Text>
              </View>
            )}

            {/* Quick start */}
            <Text style={styles.sectionLabel}>Quick Start</Text>
            <TouchableOpacity style={styles.quickStartCard} onPress={() => router.push('/start-workout')}>
              <View style={styles.quickStartLeft}>
                <IconSymbol name="play.fill" size={20} color={C.background} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickStartTitle}>Start Empty Workout</Text>
                <Text style={styles.quickStartSub}>Add exercises as you go</Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={C.primary} />
            </TouchableOpacity>

            {/* Book a session — only for clients with an active trainer */}
            {role !== 'trainer' && hasActiveTrainer && (
              <TouchableOpacity
                style={styles.quickStartCard}
                onPress={() => router.push('/book-session' as any)}
                activeOpacity={0.8}>
                <View style={[styles.quickStartLeft, { backgroundColor: C.tertiary }]}>
                  <IconSymbol name="calendar.badge.plus" size={20} color={C.background} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickStartTitle}>Book a Session</Text>
                  <Text style={styles.quickStartSub}>Schedule time with your trainer</Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={C.tertiary} />
              </TouchableOpacity>
            )}

            {/* Quick stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{weekSessions}</Text>
                <Text style={styles.statLabel}>This week</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{weekVolume > 0 ? formatVolume(weekVolume) : '—'}</Text>
                <Text style={styles.statLabel}>kg lifted</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalSessions}</Text>
                <Text style={styles.statLabel}>All time</Text>
              </View>
            </View>

            {/* Weekly goal */}
            <TouchableOpacity
              style={styles.weeklyGoalCard}
              onLongPress={openGoalPicker}
              delayLongPress={400}
              activeOpacity={0.8}>
              <View style={styles.weeklyGoalHeader}>
                <IconSymbol name="trophy.fill" size={16} color={C.primary} />
                <Text style={styles.weeklyGoalTitle}>Weekly Goal</Text>
                <Text style={styles.weeklyGoalTapHint}>Hold to change · {weeklyGoal}×/week</Text>
              </View>
              <View style={styles.weeklyGoalDots}>
                {Array.from({ length: weeklyGoal }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.weeklyGoalDot,
                      i < weekSessions ? styles.weeklyGoalDotFilled : styles.weeklyGoalDotEmpty,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.weeklyGoalCount}>
                {weekSessions >= weeklyGoal
                  ? `Goal reached! ${weekSessions} / ${weeklyGoal} sessions`
                  : `${weekSessions} / ${weeklyGoal} sessions this week`}
              </Text>
            </TouchableOpacity>


            {/* Recent sessions */}
            <Text style={styles.sectionLabel}>Recent Sessions</Text>

            {recentSessions.length === 0 ? (
              <View style={styles.emptyCard}>
                <IconSymbol name="dumbbell.fill" size={28} color={C.outlineVariant} />
                <Text style={styles.emptyText}>No sessions yet</Text>
                <Text style={styles.emptySub}>Complete your first workout to see it here</Text>
              </View>
            ) : (
              recentSessions.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.recentCard}
                  onPress={() => router.push({ pathname: '/session-detail' as any, params: { sessionId: s.id } })}
                  activeOpacity={0.8}>
                  <View style={styles.recentIconBox}>
                    <IconSymbol name="dumbbell.fill" size={18} color={C.primary} />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>{s.name}</Text>
                    <Text style={styles.recentMeta}>
                      {formatSessionDate(s.started_at)}
                      {s.duration_seconds ? ` · ${formatDuration(s.duration_seconds)}` : ''}
                      {s.set_count > 0 ? ` · ${s.set_count} sets` : ''}
                    </Text>
                  </View>
                  <View style={styles.recentRight}>
                    {s.volume > 0 && (
                      <Text style={styles.recentVolume}>{formatVolume(s.volume)}</Text>
                    )}
                    <TouchableOpacity
                      style={styles.recentDoAgainBtn}
                      onPress={() => doAgain(s.id)}>
                      <IconSymbol name="play.fill" size={10} color={C.primary} />
                      <Text style={styles.recentDoAgainText}>Do Again</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

      </ScrollView>

      {/* Mode toggle — trainer only, fixed at bottom */}
      {role === 'trainer' && (
        <View style={trainerStyles.modeBar}>
          <TouchableOpacity
            style={[trainerStyles.modePill, trainerMode === 'clients' && trainerStyles.modePillActive]}
            onPress={() => setTrainerMode('clients')}
            activeOpacity={0.8}>
            <IconSymbol name="person.2.fill" size={13} color={trainerMode === 'clients' ? C.background : C.onSurfaceVariant} />
            <Text style={[trainerStyles.modePillText, trainerMode === 'clients' && trainerStyles.modePillTextActive]}>
              Client Work
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[trainerStyles.modePill, trainerMode === 'own' && trainerStyles.modePillActive]}
            onPress={() => setTrainerMode('own')}
            activeOpacity={0.8}>
            <IconSymbol name="dumbbell.fill" size={13} color={trainerMode === 'own' ? C.background : C.onSurfaceVariant} />
            <Text style={[trainerStyles.modePillText, trainerMode === 'own' && trainerStyles.modePillTextActive]}>
              My Training
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Weekly goal picker — available in client view */}
      <Modal visible={(role === 'client' || trainerMode === 'own') && showGoalPicker} transparent animationType="fade">
        <Pressable style={styles.goalPickerOverlay} onPress={() => setShowGoalPicker(false)}>
          <Pressable style={styles.goalPickerSheet} onPress={() => {}}>
            <Text style={styles.goalPickerTitle}>Weekly Workout Goal</Text>
            <Text style={styles.goalPickerSub}>How many sessions per week?</Text>
            <View style={styles.goalPickerOptions}>
              {WEEKLY_GOAL_OPTIONS.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.goalPickerOption, n === weeklyGoal && styles.goalPickerOptionActive]}
                  onPress={() => selectWeeklyGoal(n)}>
                  <Text style={[styles.goalPickerOptionText, n === weeklyGoal && styles.goalPickerOptionTextActive]}>
                    {n}
                  </Text>
                  <Text style={[styles.goalPickerOptionLabel, n === weeklyGoal && styles.goalPickerOptionTextActive]}>
                    {n === 1 ? 'day' : 'days'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

