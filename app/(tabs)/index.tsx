import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from '@/styles/tabs/index.styles';
import { supabase } from '@/lib/supabase';
import { formatSessionDate, formatDuration, formatVolume } from '@/lib/format';
import { getCachedAny, setCached, CACHE_KEYS } from '@/lib/cache';
import { useWorkout, type Exercise, type SetRow } from '@/contexts/WorkoutContext';

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

export default function HomeScreen() {
  const router = useRouter();
  const { isActive, startWorkoutFromPlan } = useWorkout();

  const [loading,        setLoading]        = useState(true);
  const [userName,       setUserName]       = useState('');
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [weekSessions,   setWeekSessions]   = useState(0);
  const [weekVolume,     setWeekVolume]     = useState(0);
  const [totalSessions,  setTotalSessions]  = useState(0);
  const [currentStreak,  setCurrentStreak]  = useState(0);
  const [longestStreak,  setLongestStreak]  = useState(0);

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

  // Reload whenever the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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

      // Profile name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      const userName = profile?.full_name?.split(' ')[0] ?? '';

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
              {userName ? `Let's get it, ${userName}` : "Let's get it"}
            </Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <IconSymbol name="bell.fill" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Streak banner */}
            {currentStreak > 0 && (
              <View style={styles.streakCard}>
                <View style={styles.streakLeft}>
                  <IconSymbol name="flame.fill" size={28} color={Colors.primary} />
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
                <IconSymbol name="play.fill" size={20} color={Colors.background} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickStartTitle}>Start Empty Workout</Text>
                <Text style={styles.quickStartSub}>Add exercises as you go</Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={Colors.primary} />
            </TouchableOpacity>

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

            {/* Recent sessions */}
            <Text style={styles.sectionLabel}>Recent Sessions</Text>

            {recentSessions.length === 0 ? (
              <View style={styles.emptyCard}>
                <IconSymbol name="dumbbell.fill" size={28} color={Colors.outlineVariant} />
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
                    <IconSymbol name="dumbbell.fill" size={18} color={Colors.primary} />
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
                      <IconSymbol name="play.fill" size={10} color={Colors.primary} />
                      <Text style={styles.recentDoAgainText}>Do Again</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
