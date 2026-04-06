import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from '@/styles/tabs/index.styles';
import { supabase } from '@/lib/supabase';
import { formatSessionDate, formatDuration, formatVolume } from '@/lib/format';
import { getCachedAny, setCached, CACHE_KEYS } from '@/lib/cache';

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
};

export default function HomeScreen() {
  const router = useRouter();

  const [loading,        setLoading]        = useState(true);
  const [userName,       setUserName]       = useState('');
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [weekSessions,   setWeekSessions]   = useState(0);
  const [weekVolume,     setWeekVolume]     = useState(0);
  const [totalSessions,  setTotalSessions]  = useState(0);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  function applyData(d: HomeData) {
    setUserName(d.userName);
    setRecentSessions(d.recentSessions);
    setWeekSessions(d.weekSessions);
    setWeekVolume(d.weekVolume);
    setTotalSessions(d.totalSessions);
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

      // Total session count
      const { count } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      const totalSessions = count ?? 0;

      const fresh: HomeData = { userName, recentSessions, weekSessions, weekVolume, totalSessions };
      applyData(fresh);
      await setCached(CACHE_KEYS.HOME_DATA, fresh);
    } catch {
      // Silently fall back to cached data already displayed
    } finally {
      setLoading(false);
    }
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
                <View key={s.id} style={styles.recentCard}>
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
                  {s.volume > 0 && (
                    <Text style={styles.recentVolume}>{formatVolume(s.volume)}</Text>
                  )}
                </View>
              ))
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
