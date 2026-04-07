import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from '@/styles/tabs/history.styles';
import { supabase } from '@/lib/supabase';
import { formatShortDate, formatDuration, formatVolume, weekLabel } from '@/lib/format';
import { getCachedAny, setCached, CACHE_KEYS } from '@/lib/cache';

// ─── Types ────────────────────────────────────────────────────────────────────

type HistorySession = {
  id: string;
  name: string;
  started_at: string;
  duration_seconds: number | null;
  set_count: number;
  volume: number;
  exercises: string[];
};

type WeekGroup = {
  week: string;
  sessions: HistorySession[];
};

type HistoryCache = {
  groups:        WeekGroup[];
  totalSessions: number;
  totalVolume:   number;
};

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({ session, onPress }: { session: HistorySession; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={onPress}
      activeOpacity={0.8}>

      <View style={styles.sessionTop}>
        <View style={styles.sessionIconBox}>
          <IconSymbol name="dumbbell.fill" size={18} color={Colors.primary} />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionName}>{session.name}</Text>
          <Text style={styles.sessionMeta}>
            {formatShortDate(session.started_at)}
            {session.duration_seconds ? ` · ${formatDuration(session.duration_seconds)}` : ''}
          </Text>
        </View>
        <View style={styles.sessionRight}>
          {session.volume > 0 && (
            <Text style={styles.sessionVolume}>{formatVolume(session.volume)}</Text>
          )}
          <Text style={styles.sessionSets}>{session.set_count} sets</Text>
        </View>
      </View>

      {session.exercises.length > 0 && (
        <View style={styles.sessionDetail}>
          <View style={styles.sessionDivider} />
          {session.exercises.slice(0, 3).map((ex, i) => (
            <View key={i} style={styles.exerciseRow}>
              <View style={styles.exerciseDot} />
              <Text style={styles.exerciseText}>{ex}</Text>
            </View>
          ))}
          {session.exercises.length > 3 && (
            <Text style={[styles.exerciseText, { marginLeft: 18, marginTop: 2 }]}>
              +{session.exercises.length - 3} more
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const router = useRouter();
  const [loading,       setLoading]       = useState(true);
  const [groups,        setGroups]        = useState<WeekGroup[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalVolume,   setTotalVolume]   = useState(0);

  function applyData(d: HistoryCache) {
    setGroups(d.groups);
    setTotalSessions(d.totalSessions);
    setTotalVolume(d.totalVolume);
  }

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  async function loadHistory() {
    // Show cached data immediately
    const cached = await getCachedAny<HistoryCache>(CACHE_KEYS.HISTORY);
    if (cached) {
      applyData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // Background refresh
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select(`
          id, name, started_at, duration_seconds,
          session_exercises(
            exercise_name,
            session_sets(weight, reps, is_completed)
          )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      const mapped: HistorySession[] = (sessions ?? []).map((s: any) => {
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
          exercises:        s.session_exercises.map((e: any) => e.exercise_name),
        };
      });

      const grouped: WeekGroup[] = [];
      for (const session of mapped) {
        const label = weekLabel(session.started_at);
        const existing = grouped.find((g) => g.week === label);
        if (existing) existing.sessions.push(session);
        else grouped.push({ week: label, sessions: [session] });
      }

      const totalVolume = mapped.reduce((sum, s) => sum + s.volume, 0);

      const fresh: HistoryCache = { groups: grouped, totalSessions: mapped.length, totalVolume };
      applyData(fresh);
      await setCached(CACHE_KEYS.HISTORY, fresh);
    } catch {
      // Silently fall back to cached data
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
        </View>

        {/* Summary strip */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalSessions}</Text>
            <Text style={styles.summaryLabel}>Sessions logged</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalVolume > 0 ? formatVolume(totalVolume) : '—'}</Text>
            <Text style={styles.summaryLabel}>Total volume</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : groups.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="dumbbell.fill" size={32} color={Colors.outlineVariant} />
            <Text style={styles.emptyText}>No sessions yet</Text>
            <Text style={styles.emptySubtext}>Your completed workouts will appear here</Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.week}>
              <Text style={styles.weekLabel}>{group.week}</Text>
              {group.sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onPress={() => router.push({ pathname: '/session-detail' as any, params: { sessionId: session.id } })}
                />
              ))}
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
