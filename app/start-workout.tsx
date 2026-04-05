import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
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
type Exercise = { id: string; name: string; muscle: string; tag: string };

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
    { weight: '80',   reps: '10', done: false },
    { weight: '80',   reps: '10', done: false },
    { weight: '82.5', reps: '8',  done: false },
    { weight: '82.5', reps: '8',  done: false },
  ],
  e2: [
    { weight: '32', reps: '12', done: false },
    { weight: '32', reps: '12', done: false },
    { weight: '34', reps: '10', done: false },
  ],
  e3: [
    { weight: '15',   reps: '15', done: false },
    { weight: '15',   reps: '15', done: false },
    { weight: '17.5', reps: '12', done: false },
  ],
};

const REST_SECONDS = 90;
const DELETE_WIDTH  = 72;

// ─── SwipeableRow — pure Animated + PanResponder, no gesture handler ──────────
// The delete button sits BESIDE the row (not behind it) so it never bleeds
// through rounded corners. overflow:hidden on the container clips it until
// the swipe translates the row far enough to reveal it.

function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);
  const [rowWidth, setRowWidth] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) + 5 && gs.dx < 0,
      onPanResponderMove: (_, gs) => {
        const base = isOpen.current ? -DELETE_WIDTH : 0;
        translateX.setValue(Math.max(-DELETE_WIDTH, Math.min(0, base + gs.dx)));
      },
      onPanResponderRelease: (_, gs) => {
        const base = isOpen.current ? -DELETE_WIDTH : 0;
        if (base + gs.dx < -DELETE_WIDTH / 2) {
          Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true }).start();
          isOpen.current = true;
        } else {
          close();
        }
      },
    })
  ).current;

  function close() {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    isOpen.current = false;
  }

  return (
    <View
      style={{ overflow: 'hidden', marginBottom: 3 }}
      onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
      {/*
        Animated.View is a flex row: [row content | delete button].
        The content is pinned to rowWidth so it always fills the container.
        The delete button lives to its right, hidden by overflow:hidden until
        the translate reveals it — no absolute positioning, no bleed-through.
      */}
      <Animated.View
        style={{ flexDirection: 'row', transform: [{ translateX }] }}
        {...panResponder.panHandlers}>
        <View style={{ width: rowWidth }}>
          {children}
        </View>
        <TouchableOpacity
          style={[styles.swipeDeleteAction, { marginBottom: 0 }]}
          onPress={() => { close(); onDelete(); }}>
          <IconSymbol name="trash" size={18} color="#fff" />
          <Text style={styles.swipeDeleteText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Add Exercise Modal ───────────────────────────────────────────────────────

type NewExerciseForm = { name: string; muscle: string; sets: string; reps: string; weight: string };

function AddExerciseModal({
  visible, onClose, onAdd,
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
      weight: form.weight.trim() || '0',
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
              <Text style={styles.fieldLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="60"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={form.weight}
                onChangeText={(v) => field('weight', v)}
                keyboardType="decimal-pad"
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
  exercise, sets, onUpdateName, onUpdateSet, onToggleSet, onAddSet, onDeleteSet, isLast,
}: {
  exercise: Exercise;
  sets: SetRow[];
  onUpdateName: (name: string) => void;
  onUpdateSet: (idx: number, field: 'weight' | 'reps', value: string) => void;
  onToggleSet: (idx: number) => void;
  onAddSet: () => void;
  onDeleteSet: (idx: number) => void;
  isLast: boolean;
}) {
  const doneCount = sets.filter((s) => s.done).length;
  const allDone = doneCount === sets.length && sets.length > 0;
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
          <Text style={[styles.setHeaderCell, styles.colSet]}>#</Text>
          <Text style={[styles.setHeaderCell, styles.colWeight, { textAlign: 'center' }]}>Weight</Text>
          <Text style={[styles.setHeaderCell, styles.colUnit]} />
          <Text style={[styles.setHeaderCell, styles.colReps, { textAlign: 'center' }]}>Reps</Text>
          <Text style={[styles.setHeaderCell, { flex: 1 }]} />
        </View>

        {sets.map((s, i) => {
          const isNext = i === nextSetIdx;
          return (
            <SwipeableRow key={i} onDelete={() => onDeleteSet(i)}>
              <View
                style={[
                  styles.setRow,
                  isNext && !s.done && styles.setRowNext,
                  s.done && styles.setRowDone,
                ]}>
                <Text style={styles.setNumber}>{i + 1}</Text>

                {/* Weight — numeric only, clearly boxed */}
                <View style={[
                  styles.inputBox,
                  s.done && styles.inputReadOnly,
                  isNext && !s.done && styles.inputBoxActive,
                ]}>
                  <TextInput
                    style={styles.weightInput}
                    value={s.weight}
                    onChangeText={(v) => onUpdateSet(i, 'weight', v.replace(/[^0-9.]/g, ''))}
                    editable={!s.done}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    placeholder="0"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    selectTextOnFocus
                  />
                </View>

                <Text style={styles.weightUnit}>kg</Text>

                {/* Reps — text, boxed */}
                <View style={[
                  styles.inputBox,
                  s.done && styles.inputReadOnly,
                  isNext && !s.done && styles.inputBoxActive,
                ]}>
                  <TextInput
                    style={styles.repsInput}
                    value={s.reps}
                    onChangeText={(v) => onUpdateSet(i, 'reps', v)}
                    editable={!s.done}
                    keyboardType="default"
                    returnKeyType="done"
                    placeholder="10"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    selectTextOnFocus
                  />
                </View>

                {/* Toggle checkmark — tap to complete or uncheck */}
                <TouchableOpacity
                  style={[
                    styles.checkCircle,
                    s.done && styles.checkCircleDone,
                    isNext && !s.done && styles.checkCircleNext,
                  ]}
                  onPress={() => onToggleSet(i)}>
                  {s.done && (
                    <IconSymbol name="checkmark.circle.fill" size={16} color={Colors.background} />
                  )}
                </TouchableOpacity>
              </View>
            </SwipeableRow>
          );
        })}
      </View>

      {/* Add set */}
      <View style={styles.setActionsRow}>
        <TouchableOpacity style={styles.addSetBtn} onPress={onAddSet}>
          <IconSymbol name="plus.circle.fill" size={15} color={Colors.primary} />
          <Text style={styles.addSetBtnText}>Add Set</Text>
        </TouchableOpacity>
      </View>

      {!isLast && <View style={styles.sectionDivider} />}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StartWorkoutScreen() {
  const router = useRouter();

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES);
  const [setsState, setSetsState] = useState<Record<string, SetRow[]>>(INITIAL_SETS);

  const [resting, setResting] = useState(false);
  const [restLeft, setRestLeft] = useState(REST_SECONDS);
  const [restingFor, setRestingFor] = useState('');
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────

  const allSets = exercises.flatMap((e) => setsState[e.id] ?? []);
  const totalSets = allSets.length;
  const doneSets = allSets.filter((s) => s.done).length;
  const allDone = totalSets > 0 && doneSets === totalSets;
  const progressFraction = totalSets > 0 ? doneSets / totalSets : 0;

  // ── Rest timer ─────────────────────────────────────────────────────────────

  const startRest = useCallback((exerciseName: string) => {
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

  // ── Set mutations ──────────────────────────────────────────────────────────

  function updateSet(exId: string, idx: number, field: 'weight' | 'reps', value: string) {
    setSetsState((prev) => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  }

  // Completing fires rest timer; unchecking does not
  function toggleSet(exId: string, idx: number, exerciseName: string) {
    setSetsState((prev) => {
      const wasDone = prev[exId][idx].done;
      const updated = prev[exId].map((s, i) => (i === idx ? { ...s, done: !s.done } : s));
      if (!wasDone) {
        setTimeout(() => startRest(exerciseName), 0);
      }
      return { ...prev, [exId]: updated };
    });
  }

  function addSet(exId: string) {
    setSetsState((prev) => {
      const last = prev[exId][prev[exId].length - 1];
      return {
        ...prev,
        [exId]: [
          ...prev[exId],
          { weight: last?.weight ?? '0', reps: last?.reps ?? '10', done: false },
        ],
      };
    });
  }

  function deleteSet(exId: string, idx: number) {
    setSetsState((prev) => {
      if (prev[exId].length <= 1) return prev;
      return { ...prev, [exId]: prev[exId].filter((_, i) => i !== idx) };
    });
  }

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
          <Text style={styles.restSub}>{doneSets} of {totalSets} sets done</Text>
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

      <View style={styles.progressStrip}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{exercises.length} exercises</Text>
          <Text style={styles.progressCount}>{doneSets}/{totalSets} sets done</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressFraction * 100}%` }]} />
        </View>
      </View>

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
            onToggleSet={(i) => toggleSet(ex.id, i, ex.name)}
            onAddSet={() => addSet(ex.id)}
            onDeleteSet={(i) => deleteSet(ex.id, i)}
            isLast={idx === exercises.length - 1}
          />
        ))}

        <View style={styles.addExerciseSection}>
          <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setShowAddModal(true)}>
            <IconSymbol name="plus.circle.fill" size={20} color={Colors.primary} />
            <Text style={styles.addExerciseBtnText}>Add Exercise to Session</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

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
