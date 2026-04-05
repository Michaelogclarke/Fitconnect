import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from './start-workout.styles';

// ─── Types ────────────────────────────────────────────────────────────────────

type SetRow = { weight: string; reps: string; done: boolean };

type Exercise = {
  id: string;
  name: string;
  muscle: string;
  tag: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// ─── Initial data ─────────────────────────────────────────────────────────────

const INITIAL_EXERCISES: Exercise[] = [
  { id: 'e1', name: 'Flat Barbell Bench Press', muscle: 'Chest', tag: 'Primary' },
  { id: 'e2', name: 'Incline Dumbbell Press',   muscle: 'Chest', tag: 'Secondary' },
  { id: 'e3', name: 'Cable Chest Fly',           muscle: 'Chest', tag: 'Isolation' },
];

const INITIAL_SETS: Record<string, SetRow[]> = {
  e1: [
    { weight: '80 kg', reps: '10', done: false },
    { weight: '80 kg', reps: '10', done: false },
    { weight: '82.5 kg', reps: '8', done: false },
    { weight: '82.5 kg', reps: '8', done: false },
  ],
  e2: [
    { weight: '32 kg', reps: '12', done: false },
    { weight: '32 kg', reps: '12', done: false },
    { weight: '34 kg', reps: '10', done: false },
  ],
  e3: [
    { weight: '15 kg', reps: '15', done: false },
    { weight: '15 kg', reps: '15', done: false },
    { weight: '17.5 kg', reps: '12', done: false },
  ],
};

const REST_SECONDS = 90;

// ─── Add Exercise Modal ───────────────────────────────────────────────────────

type NewExerciseForm = {
  name: string;
  muscle: string;
  sets: string;
  reps: string;
  weight: string;
};

function AddExerciseModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (exercise: Exercise, sets: SetRow[]) => void;
}) {
  const [form, setForm] = useState<NewExerciseForm>({
    name: '', muscle: '', sets: '3', reps: '10', weight: '',
  });

  function field(key: keyof NewExerciseForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleAdd() {
    if (!form.name.trim()) return;
    const setCount = Math.max(1, parseInt(form.sets) || 3);
    const exercise: Exercise = {
      id: uid(),
      name: form.name.trim(),
      muscle: form.muscle.trim() || 'Custom',
      tag: 'Custom',
    };
    const sets: SetRow[] = Array.from({ length: setCount }, () => ({
      weight: form.weight.trim() || '0 kg',
      reps: form.reps.trim() || '10',
      done: false,
    }));
    onAdd(exercise, sets);
    setForm({ name: '', muscle: '', sets: '3', reps: '10', weight: '' });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add Exercise</Text>

          <Text style={styles.fieldLabel}>Exercise Name</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. Bulgarian Split Squat"
            placeholderTextColor={Colors.onSurfaceVariant}
            value={form.name}
            onChangeText={(v) => field('name', v)}
            returnKeyType="next"
            autoFocus
          />

          <Text style={styles.fieldLabel}>Muscle Group</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. Legs"
            placeholderTextColor={Colors.onSurfaceVariant}
            value={form.muscle}
            onChangeText={(v) => field('muscle', v)}
            returnKeyType="next"
          />

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Sets</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.sets}
                onChangeText={(v) => field('sets', v)}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Reps</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.reps}
                onChangeText={(v) => field('reps', v)}
              />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Weight</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="60 kg"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={form.weight}
                onChangeText={(v) => field('weight', v)}
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalAddBtn, !form.name.trim() && { opacity: 0.4 }]}
              onPress={handleAdd}
              disabled={!form.name.trim()}>
              <Text style={styles.modalAddText}>Add to Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Exercise Section ─────────────────────────────────────────────────────────

function ExerciseSection({
  exercise,
  sets,
  onUpdateName,
  onUpdateSet,
  onCompleteSet,
  onAddSet,
  onRemoveSet,
  isLast,
}: {
  exercise: Exercise;
  sets: SetRow[];
  onUpdateName: (name: string) => void;
  onUpdateSet: (idx: number, field: 'weight' | 'reps', value: string) => void;
  onCompleteSet: (idx: number) => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
  isLast: boolean;
}) {
  const doneCount = sets.filter((s) => s.done).length;
  const allDone = doneCount === sets.length;
  // "next" set = first undone set in this exercise
  const nextSetIdx = sets.findIndex((s) => !s.done);

  return (
    <View style={styles.exerciseSection}>
      {/* Section header */}
      <View style={styles.exerciseSectionHeader}>
        <TextInput
          style={styles.exerciseNameInput}
          value={exercise.name}
          onChangeText={onUpdateName}
          placeholderTextColor={Colors.onSurfaceVariant}
          multiline={false}
          returnKeyType="done"
        />
        <View style={styles.muscleChip}>
          <Text style={styles.muscleChipText}>{exercise.muscle}</Text>
        </View>
        <View style={[styles.sectionProgressBadge, allDone && styles.sectionProgressBadgeDone]}>
          {allDone && (
            <IconSymbol name="checkmark.circle.fill" size={12} color={Colors.primary} />
          )}
          <Text style={[styles.sectionProgressText, allDone && styles.sectionProgressTextDone]}>
            {doneCount}/{sets.length}
          </Text>
        </View>
      </View>

      {/* Sets table */}
      <View style={styles.setsSection}>
        <View style={styles.setsHeader}>
          <Text style={[styles.setHeaderCell, styles.colSet]}>Set</Text>
          <Text style={[styles.setHeaderCell, styles.colWeight]}>Weight</Text>
          <Text style={[styles.setHeaderCell, styles.colReps, { textAlign: 'center' }]}>Reps</Text>
          <Text style={[styles.setHeaderCell, styles.colDone, { textAlign: 'center' }]}>Done</Text>
        </View>

        {sets.map((s, i) => {
          const isNext = i === nextSetIdx;
          const editable = !s.done;
          return (
            <View
              key={i}
              style={[
                styles.setRow,
                isNext && styles.setRowNext,
                s.done && styles.setRowDone,
              ]}>
              <Text style={styles.setNumber}>{i + 1}</Text>

              <TextInput
                style={[styles.setInput, styles.setInputWeight, !editable && styles.setInputReadOnly]}
                value={s.weight}
                onChangeText={(v) => onUpdateSet(i, 'weight', v)}
                editable={editable}
                returnKeyType="done"
                placeholderTextColor={Colors.onSurfaceVariant}
              />

              <TextInput
                style={[styles.setInput, styles.setInputReps, !editable && styles.setInputReadOnly]}
                value={s.reps}
                onChangeText={(v) => onUpdateSet(i, 'reps', v)}
                editable={editable}
                returnKeyType="done"
                placeholderTextColor={Colors.onSurfaceVariant}
              />

              <TouchableOpacity
                style={[
                  styles.checkCircle,
                  s.done && styles.checkCircleDone,
                  isNext && !s.done && styles.checkCircleNext,
                ]}
                onPress={() => !s.done && onCompleteSet(i)}
                disabled={s.done}>
                {s.done && (
                  <IconSymbol name="checkmark.circle.fill" size={16} color={Colors.background} />
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Add / remove set */}
      <View style={styles.setActionsRow}>
        <TouchableOpacity style={styles.addSetBtn} onPress={onAddSet}>
          <IconSymbol name="plus.circle.fill" size={15} color={Colors.primary} />
          <Text style={styles.addSetBtnText}>Add Set</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeSetBtn} onPress={onRemoveSet}>
          <IconSymbol name="trash" size={15} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Divider between exercises */}
      {!isLast && <View style={styles.sectionDivider} />}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StartWorkoutScreen() {
  const router = useRouter();

  // Elapsed timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // All exercises visible at once
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES);
  const [setsState, setSetsState] = useState<Record<string, SetRow[]>>(INITIAL_SETS);

  // Rest timer
  const [resting, setResting] = useState(false);
  const [restLeft, setRestLeft] = useState(REST_SECONDS);
  const [restingFor, setRestingFor] = useState('');
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Add exercise modal
  const [showAddModal, setShowAddModal] = useState(false);

  // ── Derived totals ─────────────────────────────────────────────────────────

  const allSets = exercises.flatMap((e) => setsState[e.id] ?? []);
  const totalSets = allSets.length;
  const doneSets = allSets.filter((s) => s.done).length;
  const allDone = totalSets > 0 && doneSets === totalSets;
  const progressFraction = totalSets > 0 ? doneSets / totalSets : 0;

  // ── Set mutations ──────────────────────────────────────────────────────────

  function updateSet(exId: string, idx: number, field: 'weight' | 'reps', value: string) {
    setSetsState((prev) => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  }

  function addSet(exId: string) {
    setSetsState((prev) => {
      const last = prev[exId][prev[exId].length - 1];
      return {
        ...prev,
        [exId]: [...prev[exId], { weight: last?.weight ?? '0 kg', reps: last?.reps ?? '10', done: false }],
      };
    });
  }

  function removeLastSet(exId: string) {
    setSetsState((prev) => {
      const current = prev[exId];
      if (current.length <= 1) return prev;
      const lastUndoneIdx = [...current].map((s, i) => (!s.done ? i : -1)).filter((i) => i !== -1).pop();
      if (lastUndoneIdx === undefined) return prev;
      return { ...prev, [exId]: current.filter((_, i) => i !== lastUndoneIdx) };
    });
  }

  // ── Complete a set → start rest ────────────────────────────────────────────

  const completeSet = useCallback((exId: string, setIdx: number, exerciseName: string) => {
    setSetsState((prev) => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => (i === setIdx ? { ...s, done: true } : s)),
    }));
    setRestingFor(exerciseName);
    setResting(true);
    setRestLeft(REST_SECONDS);
    if (restRef.current) clearInterval(restRef.current);
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

  // ── Exercise mutations ─────────────────────────────────────────────────────

  function updateExerciseName(exId: string, name: string) {
    setExercises((prev) => prev.map((e) => (e.id === exId ? { ...e, name } : e)));
  }

  function addCustomExercise(exercise: Exercise, sets: SetRow[]) {
    setExercises((prev) => [...prev, exercise]);
    setSetsState((prev) => ({ ...prev, [exercise.id]: sets }));
    setShowAddModal(false);
  }

  // ── Rest overlay ───────────────────────────────────────────────────────────

  if (resting) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={skipRest}>
            <IconSymbol name="xmark.circle.fill" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle}>{restingFor}</Text>
            <Text style={styles.topBarSub}>Rest between sets</Text>
          </View>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
          </View>
        </View>
        <View style={styles.restOverlay}>
          <Text style={styles.restLabel}>Rest</Text>
          <Text style={styles.restCount}>{formatTime(restLeft)}</Text>
          <Text style={styles.restSub}>{doneSets} of {totalSets} sets done across all exercises</Text>
          <TouchableOpacity style={styles.btnRestSkip} onPress={skipRest}>
            <Text style={styles.btnRestSkipText}>Skip Rest</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────

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

      {/* Overall progress strip */}
      <View style={styles.progressStrip}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{exercises.length} exercises</Text>
          <Text style={styles.progressCount}>{doneSets}/{totalSets} sets done</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressFraction * 100}%` }]} />
        </View>
      </View>

      {/* All exercises in one scroll */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>

        {exercises.map((ex, idx) => (
          <ExerciseSection
            key={ex.id}
            exercise={ex}
            sets={setsState[ex.id] ?? []}
            onUpdateName={(name) => updateExerciseName(ex.id, name)}
            onUpdateSet={(i, f, v) => updateSet(ex.id, i, f, v)}
            onCompleteSet={(i) => completeSet(ex.id, i, ex.name)}
            onAddSet={() => addSet(ex.id)}
            onRemoveSet={() => removeLastSet(ex.id)}
            isLast={idx === exercises.length - 1}
          />
        ))}

        {/* Add custom exercise */}
        <View style={styles.addExerciseSection}>
          <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setShowAddModal(true)}>
            <IconSymbol name="plus.circle.fill" size={20} color={Colors.primary} />
            <Text style={styles.addExerciseBtnText}>Add Exercise to Session</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomProgress}>
          <Text style={styles.bottomProgressText}>
            {allDone ? 'All sets complete!' : `${totalSets - doneSets} sets remaining`}
          </Text>
          <Text style={styles.bottomProgressCount}>{doneSets}/{totalSets}</Text>
        </View>
        <TouchableOpacity
          style={allDone ? styles.btnFinish : styles.btnFinishDimmed}
          onPress={() => router.back()}>
          <Text style={allDone ? styles.btnFinishText : styles.btnFinishDimmedText}>
            Finish Workout
          </Text>
        </TouchableOpacity>
      </View>

      <AddExerciseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addCustomExercise}
      />

    </SafeAreaView>
  );
}
