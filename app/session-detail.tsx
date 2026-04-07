import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { formatShortDate, formatDuration } from '@/lib/format';
import { styles } from '@/styles/session-detail.styles';
import { useWorkout, type Exercise, type SetRow } from '@/contexts/WorkoutContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionSet = {
  set_number: number;
  weight: number | null;
  reps: number | null;
  is_completed: boolean;
};

type SessionExercise = {
  id: string;
  exercise_name: string;
  muscle_group: string | null;
  sort_order: number;
  session_sets: SessionSet[];
};

type WorkoutSession = {
  id: string;
  name: string;
  started_at: string;
  duration_seconds: number | null;
  session_exercises: SessionExercise[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatVolume(vol: number): string {
  if (vol >= 1000) {
    return (vol / 1000).toFixed(1).replace(/\.0$/, '') + 'k kg';
  }
  return `${vol} kg`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { isActive, startWorkoutFromPlan } = useWorkout();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    async function fetchSession() {
      setLoading(true);
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          id, name, started_at, duration_seconds,
          session_exercises(
            id, exercise_name, muscle_group, sort_order,
            session_sets(set_number, weight, reps, is_completed)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error || !data) {
        setSession(null);
      } else {
        const sorted: WorkoutSession = {
          ...data,
          session_exercises: [...data.session_exercises]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((ex) => ({
              ...ex,
              session_sets: [...ex.session_sets].sort(
                (a, b) => a.set_number - b.set_number
              ),
            })),
        };
        setSession(sorted);
      }
      setLoading(false);
    }

    fetchSession();
  }, [sessionId]);

  // ── Repeat workout ────────────────────────────────────────────────────────

  function handleDoAgain() {
    if (!session) return;

    function launch() {
      const exercises: Exercise[] = session!.session_exercises.map((ex) => ({
        id:     Math.random().toString(36).slice(2),
        name:   ex.exercise_name,
        muscle: ex.muscle_group ?? '',
        tag:    'Custom',
      }));

      const setsState: Record<string, SetRow[]> = {};
      session!.session_exercises.forEach((ex, i) => {
        const completedSets = ex.session_sets.filter((s) => s.is_completed);
        const rows = completedSets.length > 0 ? completedSets : ex.session_sets.slice(0, 1);
        setsState[exercises[i].id] = rows.map((s) => ({
          weight: s.weight != null ? String(s.weight) : '0',
          reps:   s.reps   != null ? String(s.reps)   : '10',
          done:   false,
        }));
      });

      startWorkoutFromPlan(exercises, setsState);
      router.push('/start-workout' as any);
    }

    if (isActive) {
      Alert.alert(
        'Workout in Progress',
        'Starting this workout will discard your current session.',
        [
          { text: 'Keep Current', style: 'cancel' },
          { text: 'Start New',    style: 'destructive', onPress: launch },
        ]
      );
    } else {
      launch();
    }
  }

  // ── Derived stats ──────────────────────────────────────────────────────────

  const allSets: SessionSet[] = session
    ? session.session_exercises.flatMap((ex) => ex.session_sets)
    : [];

  const completedSets = allSets.filter((s) => s.is_completed);

  const volume = completedSets.reduce((sum, s) => {
    if (s.weight != null && s.reps != null) {
      return sum + s.weight * s.reps;
    }
    return sum;
  }, 0);

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={20} color={Colors.onSurfaceVariant} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Session not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={20} color={Colors.onSurfaceVariant} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.sessionName}>{session.name}</Text>
          <Text style={styles.sessionMeta}>
            {formatShortDate(session.started_at)}
            {session.duration_seconds != null
              ? `  ·  ${formatDuration(session.duration_seconds)}`
              : ''}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{completedSets.length}</Text>
              <Text style={styles.statLabel}>sets</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {volume > 0 ? formatVolume(volume) : '—'}
              </Text>
              <Text style={styles.statLabel}>volume</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.doAgainBtn} onPress={handleDoAgain}>
            <IconSymbol name="play.fill" size={14} color={Colors.background} />
            <Text style={styles.doAgainText}>Do Again</Text>
          </TouchableOpacity>
        </View>

        {/* Exercise cards */}
        {session.session_exercises.map((ex) => (
          <View key={ex.id} style={styles.exCard}>
            {/* Exercise header */}
            <View style={styles.exHeader}>
              <Text style={styles.exName}>{ex.exercise_name}</Text>
              {ex.muscle_group ? (
                <View style={styles.muscleBadge}>
                  <Text style={styles.muscleText}>{ex.muscle_group}</Text>
                </View>
              ) : null}
            </View>

            {/* Sets table */}
            <View style={styles.setsTable}>
              {/* Table header */}
              <View style={styles.setsHeaderRow}>
                <Text style={[styles.colSet, styles.headerText]}>Set</Text>
                <Text style={[styles.colWeight, styles.headerText]}>Weight</Text>
                <Text style={[styles.colReps, styles.headerText]}>Reps</Text>
                <View style={styles.colDone}>
                  <Text style={styles.headerText}>✓</Text>
                </View>
              </View>

              {/* Set rows */}
              {ex.session_sets.map((set) => (
                <View key={set.set_number} style={styles.setRow}>
                  <Text style={styles.colSet}>{set.set_number}</Text>
                  <Text style={styles.colWeight}>
                    {set.weight != null ? `${set.weight}` : '—'}
                  </Text>
                  <Text style={styles.colReps}>
                    {set.reps != null ? `${set.reps}` : '—'}
                  </Text>
                  <View style={styles.colDone}>
                    {set.is_completed ? (
                      <View style={styles.checkDone}>
                        <IconSymbol
                          name="checkmark"
                          size={12}
                          color={Colors.primary}
                        />
                      </View>
                    ) : (
                      <View style={styles.checkEmpty} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
