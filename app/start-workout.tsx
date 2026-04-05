import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import * as Notifications from 'expo-notifications';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { DELETE_WIDTH, styles } from '@/styles/start-workout.styles';
import { supabase } from '@/lib/supabase';

// Show notification even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Types ────────────────────────────────────────────────────────────────────

type SetRow     = { weight: string; reps: string; done: boolean };
type Exercise   = { id: string; name: string; muscle: string; tag: string };
type ActiveRest = { exId: string; setIdx: number; remaining: number };
type NumPadTarget = { exId: string; setIdx: number; field: 'weight' | 'reps' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

function formatTime(s: number) {
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}


const REST_SECONDS = 90;

// ─── SwipeableRow ─────────────────────────────────────────────────────────────

function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen     = useRef(false);
  const [rowWidth, setRowWidth] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) + 5 && (gs.dx < 0 || isOpen.current),
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

// ─── NumPad ───────────────────────────────────────────────────────────────────

function NumPad({
  visible,
  label,
  value,
  allowDecimal,
  onChange,
  onDone,
  onClose,
}: {
  visible:      boolean;
  label:        string;
  value:        string;
  allowDecimal: boolean;
  onChange:     (v: string) => void;
  onDone:       () => void;
  onClose:      () => void;
}) {
  function press(key: string) {
    if (key === '⌫') {
      const next = value.slice(0, -1);
      onChange(next === '' ? '0' : next);
      return;
    }
    if (key === '.') {
      if (!allowDecimal || value.includes('.')) return;
      onChange(value + '.');
      return;
    }
    onChange(value === '0' ? key : value + key);
  }

  const rows = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['.', '0', '⌫'],
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.numPadBackdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={styles.numPadSheet}>
            <View style={styles.numPadHandle} />
            <Text style={styles.numPadLabel}>{label}</Text>
            <View style={styles.numPadDisplay}>
              <Text style={styles.numPadDisplayText}>{value}</Text>
            </View>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.numPadRow}>
                {row.map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.numPadKey,
                      (key === '.' || key === '⌫') && styles.numPadKeySpecial,
                      key === '.' && !allowDecimal && { opacity: 0.3 },
                    ]}
                    onPress={() => press(key)}
                    disabled={key === '.' && !allowDecimal}>
                    <Text style={styles.numPadKeyText}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <TouchableOpacity style={styles.numPadDoneBtn} onPress={onDone}>
              <Text style={styles.numPadDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
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
    const setCount  = Math.max(1, parseInt(form.sets) || 3);
    const exercise: Exercise = {
      id:     uid(),
      name:   form.name.trim(),
      muscle: form.muscle.trim() || 'Custom',
      tag:    'Custom',
    };
    const sets: SetRow[] = Array.from({ length: setCount }, () => ({
      weight: form.weight.trim() || '0',
      reps:   form.reps.trim() || '10',
      done:   false,
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
  exercise, sets, activeRest,
  onUpdateName, onUpdateSet, onToggleSet, onAddSet, onDeleteSet,
  onSkipRest, onAdjustRest, onOpenNumPad, isLast,
}: {
  exercise:     Exercise;
  sets:         SetRow[];
  activeRest:   ActiveRest | null;
  onUpdateName: (name: string) => void;
  onUpdateSet:  (idx: number, field: 'weight' | 'reps', value: string) => void;
  onToggleSet:  (idx: number) => void;
  onAddSet:     () => void;
  onDeleteSet:  (idx: number) => void;
  onSkipRest:   () => void;
  onAdjustRest: (delta: number) => void;
  onOpenNumPad: (setIdx: number, field: 'weight' | 'reps', currentValue: string) => void;
  isLast:       boolean;
}) {
  const doneCount  = sets.filter((s) => s.done).length;
  const allDone    = doneCount === sets.length && sets.length > 0;
  const nextSetIdx = sets.findIndex((s) => !s.done);

  // Whether the rest chip is expanded to show +/- controls
  const [restExpanded, setRestExpanded] = useState(false);
  const isResting = activeRest?.exId === exercise.id;
  useEffect(() => {
    if (!isResting) setRestExpanded(false);
  }, [isResting]);

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
          const isNext    = i === nextSetIdx;
          const isResting = activeRest?.exId === exercise.id && activeRest.setIdx === i;

          return (
            <React.Fragment key={i}>
              <SwipeableRow onDelete={() => onDeleteSet(i)}>
                <View
                  style={[
                    styles.setRow,
                    isNext && !s.done && styles.setRowNext,
                    s.done && styles.setRowDone,
                  ]}>
                  <Text style={styles.setNumber}>{i + 1}</Text>

                  {/* Weight — tapping opens the numpad */}
                  <TouchableOpacity
                    style={[
                      styles.inputBox,
                      s.done && styles.inputReadOnly,
                      isNext && !s.done && styles.inputBoxActive,
                    ]}
                    onPress={() => !s.done && onOpenNumPad(i, 'weight', s.weight)}
                    disabled={s.done}
                    activeOpacity={0.7}>
                    <Text style={styles.weightInput}>{s.weight || '0'}</Text>
                  </TouchableOpacity>

                  <Text style={styles.weightUnit}>kg</Text>

                  {/* Reps — tapping opens the numpad */}
                  <TouchableOpacity
                    style={[
                      styles.inputBox,
                      s.done && styles.inputReadOnly,
                      isNext && !s.done && styles.inputBoxActive,
                    ]}
                    onPress={() => !s.done && onOpenNumPad(i, 'reps', s.reps)}
                    disabled={s.done}
                    activeOpacity={0.7}>
                    <Text style={styles.repsInput}>{s.reps || '0'}</Text>
                  </TouchableOpacity>

                  {/* Checkmark */}
                  <TouchableOpacity
                    style={[
                      styles.checkCircle,
                      s.done    && styles.checkCircleDone,
                      isNext && !s.done && styles.checkCircleNext,
                    ]}
                    onPress={() => onToggleSet(i)}>
                    {s.done && (
                      <IconSymbol name="checkmark" size={14} color={Colors.background} />
                    )}
                  </TouchableOpacity>
                </View>
              </SwipeableRow>

              {/* Inline rest chip below this set */}
              {isResting && (
                <TouchableOpacity
                  style={styles.restChip}
                  onPress={() => setRestExpanded((e) => !e)}
                  activeOpacity={0.8}>
                  <IconSymbol name="timer" size={13} color={Colors.primary} />

                  {restExpanded ? (
                    <>
                      <TouchableOpacity
                        style={styles.restAdjustBtn}
                        onPress={(e) => { e.stopPropagation(); onAdjustRest(-15); }}>
                        <Text style={styles.restAdjustBtnText}>−15</Text>
                      </TouchableOpacity>
                      <Text style={styles.restChipText}>
                        {formatTime(activeRest!.remaining)}
                      </Text>
                      <TouchableOpacity
                        style={styles.restAdjustBtn}
                        onPress={(e) => { e.stopPropagation(); onAdjustRest(+15); }}>
                        <Text style={styles.restAdjustBtnText}>+15</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.restChipText}>
                      {formatTime(activeRest!.remaining)}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.restChipSkip}
                    onPress={(e) => { e.stopPropagation(); onSkipRest(); }}>
                    <Text style={[styles.restChipText, { opacity: 0.6 }]}>Skip</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            </React.Fragment>
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

  // Workout stopwatch
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const [exercises, setExercises]   = useState<Exercise[]>([]);
  const [setsState, setSetsState]   = useState<Record<string, SetRow[]>>({});
  const [activeRest, setActiveRest] = useState<ActiveRest | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Numpad state
  const [numPadTarget, setNumPadTarget] = useState<NumPadTarget | null>(null);
  const [numPadValue,  setNumPadValue]  = useState('0');

  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifIdRef   = useRef<string | null>(null);
  const startedAt    = useRef(new Date());

  const [finishing,  setFinishing]  = useState(false);
  const [saveError,  setSaveError]  = useState('');

  // ── Notification permissions ───────────────────────────────────────────────

  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => {});
  }, []);

  // ── Rest countdown ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeRest) return;

    if (restTimerRef.current) clearInterval(restTimerRef.current);

    restTimerRef.current = setInterval(() => {
      setActiveRest((prev) => {
        if (!prev) return null;
        if (prev.remaining <= 1) {
          clearInterval(restTimerRef.current!);
          return null;
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);

    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [activeRest?.exId, activeRest?.setIdx]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const allSets          = exercises.flatMap((e) => setsState[e.id] ?? []);
  const totalSets        = allSets.length;
  const doneSets         = allSets.filter((s) => s.done).length;
  const allDone          = totalSets > 0 && doneSets === totalSets;
  const progressFraction = totalSets > 0 ? doneSets / totalSets : 0;

  // ── Rest helpers ───────────────────────────────────────────────────────────

  const scheduleRestNotification = useCallback(async (exerciseName: string) => {
    if (notifIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notifIdRef.current).catch(() => {});
      notifIdRef.current = null;
    }
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rest complete!',
          body:  `Time to hit the next set — ${exerciseName}`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: REST_SECONDS,
          repeats: false,
        },
      });
      notifIdRef.current = id;
    } catch { /* gracefully degrade in Expo Go */ }
  }, []);

  const cancelRestNotification = useCallback(async () => {
    if (notifIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notifIdRef.current).catch(() => {});
      notifIdRef.current = null;
    }
  }, []);

  const skipRest = useCallback(() => {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setActiveRest(null);
    cancelRestNotification();
  }, [cancelRestNotification]);

  // Clamp remaining to 5 s minimum so the chip doesn't vanish unexpectedly on -15
  const adjustRest = useCallback((delta: number) => {
    setActiveRest((prev) =>
      prev ? { ...prev, remaining: Math.max(5, prev.remaining + delta) } : null
    );
  }, []);

  // ── NumPad helpers ─────────────────────────────────────────────────────────

  function openNumPad(exId: string, setIdx: number, field: 'weight' | 'reps', currentValue: string) {
    setNumPadTarget({ exId, setIdx, field });
    setNumPadValue(currentValue || '0');
  }

  function confirmNumPad() {
    if (!numPadTarget) return;
    updateSet(numPadTarget.exId, numPadTarget.setIdx, numPadTarget.field, numPadValue);
    setNumPadTarget(null);
  }

  function closeNumPad() {
    setNumPadTarget(null);
  }

  // ── Set mutations ──────────────────────────────────────────────────────────

  function updateSet(exId: string, idx: number, field: 'weight' | 'reps', value: string) {
    setSetsState((prev) => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  }

  function toggleSet(exId: string, idx: number, exerciseName: string) {
    const wasDone = setsState[exId][idx].done;

    setSetsState((prev) => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => (i === idx ? { ...s, done: !s.done } : s)),
    }));

    if (!wasDone) {
      setActiveRest({ exId, setIdx: idx, remaining: REST_SECONDS });
      scheduleRestNotification(exerciseName);
    } else if (activeRest?.exId === exId && activeRest.setIdx === idx) {
      skipRest();
    }
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
    if (activeRest?.exId === exId && activeRest.setIdx === idx) skipRest();
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

  // ── Save workout to Supabase ───────────────────────────────────────────────

  async function finishWorkout() {
    setFinishing(true);
    setSaveError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      // 1. Create the session record
      const sessionName = new Date(startedAt.current).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'short',
      }) + ' Workout';

      const { data: session, error: sessionErr } = await supabase
        .from('workout_sessions')
        .insert({
          user_id:          user.id,
          name:             sessionName,
          started_at:       startedAt.current.toISOString(),
          finished_at:      new Date().toISOString(),
          duration_seconds: elapsed,
        })
        .select('id')
        .single();
      if (sessionErr) throw sessionErr;

      // 2. Insert each exercise + its sets
      for (let i = 0; i < exercises.length; i++) {
        const ex   = exercises[i];
        const sets = setsState[ex.id] ?? [];

        const { data: sessionEx, error: exErr } = await supabase
          .from('session_exercises')
          .insert({
            session_id:    session.id,
            exercise_name: ex.name,
            muscle_group:  ex.muscle,
            sort_order:    i,
          })
          .select('id')
          .single();
        if (exErr) throw exErr;

        if (sets.length > 0) {
          const { error: setsErr } = await supabase
            .from('session_sets')
            .insert(
              sets.map((s, idx) => ({
                session_exercise_id: sessionEx.id,
                set_number:          idx + 1,
                weight:              parseFloat(s.weight) || null,
                reps:                parseInt(s.reps)    || null,
                is_completed:        s.done,
                completed_at:        s.done ? new Date().toISOString() : null,
              }))
            );
          if (setsErr) throw setsErr;
        }
      }

      // Success — go to history so they can see the saved session
      router.replace('/(tabs)/history');
    } catch (err: any) {
      setSaveError(err?.message ?? 'Failed to save. Please try again.');
      setFinishing(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>Today's Workout</Text>
          <Text style={styles.topBarSub}>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      {/* Progress strip */}
      <View style={styles.progressStrip}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{exercises.length} exercises</Text>
          <Text style={styles.progressCount}>{doneSets}/{totalSets} sets done</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressFraction * 100}%` }]} />
        </View>
      </View>

      {/* Scrollable exercise list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>

        {exercises.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 8 }}>
            <IconSymbol name="dumbbell.fill" size={40} color={Colors.outlineVariant} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.onSurface, marginTop: 8 }}>
              No exercises yet
            </Text>
            <Text style={{ fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center' }}>
              Tap "Add Exercise" below to get started
            </Text>
          </View>
        )}

        {exercises.map((ex, idx) => (
          <ExerciseSection
            key={ex.id}
            exercise={ex}
            sets={setsState[ex.id] ?? []}
            activeRest={activeRest}
            onUpdateName={(name) => updateExerciseName(ex.id, name)}
            onUpdateSet={(i, f, v) => updateSet(ex.id, i, f, v)}
            onToggleSet={(i) => toggleSet(ex.id, i, ex.name)}
            onAddSet={() => addSet(ex.id)}
            onDeleteSet={(i) => deleteSet(ex.id, i)}
            onSkipRest={skipRest}
            onAdjustRest={adjustRest}
            onOpenNumPad={(setIdx, field, val) => openNumPad(ex.id, setIdx, field, val)}
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

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomProgress}>
          <Text style={styles.bottomProgressText}>
            {allDone ? 'All sets complete!' : `${totalSets - doneSets} sets remaining`}
          </Text>
          <Text style={styles.bottomProgressCount}>{doneSets}/{totalSets}</Text>
        </View>
        {saveError ? (
          <Text style={styles.saveErrorText}>{saveError}</Text>
        ) : null}
        <TouchableOpacity
          style={[
            allDone ? styles.btnFinish : styles.btnFinishDimmed,
            finishing && { opacity: 0.6 },
          ]}
          onPress={finishWorkout}
          disabled={finishing}>
          {finishing ? (
            <ActivityIndicator color={allDone ? Colors.background : Colors.onSurfaceVariant} />
          ) : (
            <Text style={allDone ? styles.btnFinishText : styles.btnFinishDimmedText}>
              {allDone ? 'Finish Workout' : 'Finish Early'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <AddExerciseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addCustomExercise}
      />

      {/* Numpad — screen-level so it renders over everything */}
      <NumPad
        visible={numPadTarget !== null}
        label={numPadTarget?.field === 'weight' ? 'Weight (kg)' : 'Reps'}
        value={numPadValue}
        allowDecimal={numPadTarget?.field === 'weight'}
        onChange={setNumPadValue}
        onDone={confirmNumPad}
        onClose={closeNumPad}
      />
    </SafeAreaView>
  );
}
