import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from './start-workout.styles';

// ─── Data ────────────────────────────────────────────────────────────────────

type SetState = { weight: string; reps: string; done: boolean };

const EXERCISES = [
  {
    id: '1',
    name: 'Flat Barbell Bench Press',
    muscle: 'Chest',
    tag: 'Primary',
    sets: 4,
    reps: '8–10',
    sets_data: [
      { weight: '80 kg', reps: '10', done: false },
      { weight: '80 kg', reps: '10', done: false },
      { weight: '82.5 kg', reps: '8', done: false },
      { weight: '82.5 kg', reps: '8', done: false },
    ] as SetState[],
  },
  {
    id: '2',
    name: 'Incline Dumbbell Press',
    muscle: 'Chest',
    tag: 'Secondary',
    sets: 3,
    reps: '10–12',
    sets_data: [
      { weight: '32 kg', reps: '12', done: false },
      { weight: '32 kg', reps: '12', done: false },
      { weight: '34 kg', reps: '10', done: false },
    ] as SetState[],
  },
  {
    id: '3',
    name: 'Cable Chest Fly',
    muscle: 'Chest',
    tag: 'Isolation',
    sets: 3,
    reps: '12–15',
    sets_data: [
      { weight: '15 kg', reps: '15', done: false },
      { weight: '15 kg', reps: '15', done: false },
      { weight: '17.5 kg', reps: '12', done: false },
    ] as SetState[],
  },
];

const REST_SECONDS = 90;

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function StartWorkoutScreen() {
  const router = useRouter();

  // Elapsed workout timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Exercise & set state
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [setsState, setSetsState] = useState<Record<string, SetState[]>>(
    Object.fromEntries(EXERCISES.map((e) => [e.id, e.sets_data.map((s) => ({ ...s }))])),
  );

  // Rest timer
  const [resting, setResting] = useState(false);
  const [restLeft, setRestLeft] = useState(REST_SECONDS);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRest = useCallback(() => {
    setResting(true);
    setRestLeft(REST_SECONDS);
    restRef.current = setInterval(() => {
      setRestLeft((r) => {
        if (r <= 1) {
          clearInterval(restRef.current!);
          setResting(false);
          return REST_SECONDS;
        }
        return r - 1;
      });
    }, 1000);
  }, []);

  const skipRest = useCallback(() => {
    if (restRef.current) clearInterval(restRef.current);
    setResting(false);
    setRestLeft(REST_SECONDS);
  }, []);

  const exercise = EXERCISES[exerciseIdx];
  const sets = setsState[exercise.id];
  const activeSetIdx = sets.findIndex((s) => !s.done);
  const allSetsDone = activeSetIdx === -1;
  const isLastExercise = exerciseIdx === EXERCISES.length - 1;
  const completedExercises = exerciseIdx; // simple proxy
  const progress = completedExercises / EXERCISES.length;

  function completeSet() {
    if (activeSetIdx === -1) return;
    setSetsState((prev) => {
      const updated = prev[exercise.id].map((s, i) =>
        i === activeSetIdx ? { ...s, done: true } : s,
      );
      return { ...prev, [exercise.id]: updated };
    });
    startRest();
  }

  function nextExercise() {
    if (isLastExercise) {
      router.back();
    } else {
      setExerciseIdx((i) => i + 1);
    }
  }

  // ── Rest timer overlay ────────────────────────────────────────────────────

  if (resting) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={skipRest}>
            <IconSymbol name="xmark.circle.fill" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle}>{exercise.name}</Text>
            <Text style={styles.topBarSub}>Rest between sets</Text>
          </View>
        </View>

        <View style={styles.restOverlay}>
          <Text style={styles.restLabel}>Rest</Text>
          <Text style={styles.restCount}>{formatTime(restLeft)}</Text>
          <Text style={styles.restSub}>Next set coming up…</Text>
          <TouchableOpacity style={styles.btnRestSkip} onPress={skipRest}>
            <Text style={styles.btnRestSkipText}>Skip Rest</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main workout view ─────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.right" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>Hypertrophy Phase II</Text>
          <Text style={styles.topBarSub}>Chest Day</Text>
        </View>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      {/* Progress strip */}
      <View style={styles.progressStrip}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>
            Exercise {exerciseIdx + 1} of {EXERCISES.length}
          </Text>
          <Text style={styles.progressCount}>{exercise.name.split(' ').slice(0, 2).join(' ')}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(progress) * 100}%` }]} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Exercise card */}
        <View style={styles.exerciseCard}>
          <View style={styles.exerciseMuscleRow}>
            <View style={styles.muscleChip}>
              <Text style={styles.muscleChipText}>{exercise.muscle}</Text>
            </View>
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>{exercise.tag}</Text>
            </View>
          </View>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.exerciseTargetRow}>
            <View style={styles.exerciseTarget}>
              <Text style={styles.exerciseTargetValue}>{exercise.sets}</Text>
              <Text style={styles.exerciseTargetLabel}>Sets</Text>
            </View>
            <View style={styles.targetDivider} />
            <View style={styles.exerciseTarget}>
              <Text style={styles.exerciseTargetValue}>{exercise.reps}</Text>
              <Text style={styles.exerciseTargetLabel}>Reps</Text>
            </View>
            <View style={styles.targetDivider} />
            <View style={styles.exerciseTarget}>
              <Text style={styles.exerciseTargetValue}>{sets[0]?.weight ?? '—'}</Text>
              <Text style={styles.exerciseTargetLabel}>Target</Text>
            </View>
          </View>
        </View>

        {/* Sets table */}
        <View style={styles.setsSection}>
          <View style={styles.setsHeader}>
            <Text style={[styles.setHeaderCell, styles.colSet]}>Set</Text>
            <Text style={[styles.setHeaderCell, styles.colWeight]}>Weight</Text>
            <Text style={[styles.setHeaderCell, { width: 60, textAlign: 'center' }]}>Reps</Text>
            <Text style={[styles.setHeaderCell, { width: 44, textAlign: 'center' }]}>Done</Text>
          </View>

          {sets.map((s, i) => {
            const isActive = i === activeSetIdx;
            return (
              <View
                key={i}
                style={[
                  styles.setRow,
                  isActive && styles.setRowActive,
                  s.done && styles.setRowDone,
                ]}>
                <Text style={styles.setNumber}>{i + 1}</Text>
                <Text style={styles.setWeight}>{s.weight}</Text>
                <Text style={styles.setReps}>{s.reps}</Text>
                <TouchableOpacity
                  style={[
                    styles.checkCircle,
                    s.done && styles.checkCircleDone,
                    isActive && !s.done && styles.checkCircleActive,
                  ]}
                  onPress={isActive ? completeSet : undefined}
                  disabled={!isActive && !s.done}>
                  {s.done && (
                    <IconSymbol name="checkmark.circle.fill" size={16} color={Colors.background} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        {allSetsDone ? (
          <TouchableOpacity
            style={isLastExercise ? styles.btnFinish : styles.btnComplete}
            onPress={nextExercise}>
            <Text style={isLastExercise ? styles.btnFinishText : styles.btnCompleteText}>
              {isLastExercise ? 'Finish Workout' : 'Next Exercise →'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.btnSkip} onPress={nextExercise}>
              <Text style={styles.btnSkipText}>Skip Exercise</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnComplete, activeSetIdx === -1 && { opacity: 0.4 }]}
              onPress={completeSet}
              disabled={activeSetIdx === -1}>
              <Text style={styles.btnCompleteText}>
                Complete Set {activeSetIdx + 1}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </SafeAreaView>
  );
}
