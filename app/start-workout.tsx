import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
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
import { NumericInput } from '@/components/ui/numeric-input';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { DELETE_WIDTH, styles } from '@/styles/start-workout.styles';
import { supabase } from '@/lib/supabase';
import { useWorkout, Exercise, SetRow, ActiveRest } from '@/contexts/WorkoutContext';
import { getCached, getCachedAny, setCached, CACHE_KEYS } from '@/lib/cache';
import { enqueueWorkout, isNetworkError, WorkoutSavePayload } from '@/lib/offlineQueue';

// Show notification even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Types ────────────────────────────────────────────────────────────────────

// SetRow, Exercise, ActiveRest are imported from WorkoutContext
type ActiveRestDisplay = { exId: string; setIdx: number; remaining: number };
type NumPadTarget      = { exId: string; setIdx: number; field: 'weight' | 'reps' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

function formatTime(s: number) {
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}


const REST_SECONDS = 120;

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

type DbExercise = { name: string; muscle_group: string | null };
type ConfigForm = { muscle: string; sets: string; reps: string; weight: string };

function AddExerciseModal({
  visible, onClose, onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (exercise: Exercise, sets: SetRow[]) => void;
}) {
  const [phase, setPhase]       = useState<'search' | 'configure'>('search');
  const [search, setSearch]     = useState('');
  const [dbList, setDbList]     = useState<DbExercise[]>([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState<{ name: string; isPreset: boolean } | null>(null);
  const [form, setForm]         = useState<ConfigForm>({ muscle: '', sets: '3', reps: '10', weight: '' });

  // Fetch exercise library once per modal open
  useEffect(() => {
    if (!visible) return;
    setPhase('search');
    setSearch('');
    setSelected(null);
    setForm({ muscle: '', sets: '3', reps: '10', weight: '' });

    async function fetchExercises() {
      // Use fresh cache if available — avoids a round-trip
      const cached = await getCached<DbExercise[]>(CACHE_KEYS.EXERCISES);
      if (cached) {
        setDbList(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('name, muscle_group')
        .order('name');

      if (data) {
        setDbList(data);
        setCached(CACHE_KEYS.EXERCISES, data, 24 * 60 * 60 * 1000); // 24h TTL
      } else if (isNetworkError(error)) {
        // Offline: fall back to any stale cached data
        const stale = await getCachedAny<DbExercise[]>(CACHE_KEYS.EXERCISES);
        setDbList(stale ?? []);
      }
      setLoading(false);
    }

    fetchExercises();
  }, [visible]);

  const trimmedSearch = search.trim();
  const filtered = dbList.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()),
  );
  const exactMatch = dbList.some(
    (e) => e.name.toLowerCase() === trimmedSearch.toLowerCase(),
  );

  function selectPreset(ex: DbExercise) {
    setSelected({ name: ex.name, isPreset: true });
    setForm({ muscle: ex.muscle_group ?? '', sets: '3', reps: '10', weight: '' });
    setPhase('configure');
  }

  function createCustom() {
    setSelected({ name: trimmedSearch, isPreset: false });
    setForm({ muscle: '', sets: '3', reps: '10', weight: '' });
    setPhase('configure');
  }

  function handleAdd() {
    if (!selected) return;
    const setCount = Math.max(1, parseInt(form.sets) || 3);
    const exercise: Exercise = {
      id:     uid(),
      name:   selected.name,
      muscle: form.muscle.trim() || 'Custom',
      tag:    'Custom',
    };
    const sets: SetRow[] = Array.from({ length: setCount }, () => ({
      weight: form.weight.trim() || '0',
      reps:   form.reps.trim() || '10',
      done:   false,
    }));
    onAdd(exercise, sets);
  }

  function fieldC(key: keyof ConfigForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ── Search phase ────────────────────────────────────────────────────────────
  if (phase === 'search') {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { paddingHorizontal: 16 }]}>Add Exercise</Text>

            {/* Search bar */}
            <View style={styles.searchBarWrap}>
              <IconSymbol name="magnifyingglass" size={16} color={Colors.onSurfaceVariant} />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search exercises…"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={search}
                onChangeText={setSearch}
                autoFocus
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>

            {loading ? (
              <ActivityIndicator color={Colors.primary} style={{ paddingVertical: 32 }} />
            ) : (
              <FlatList
                style={styles.exerciseList}
                data={filtered}
                keyExtractor={(item) => item.name}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.exerciseListItem}
                    onPress={() => selectPreset(item)}>
                    <Text style={styles.exerciseListName}>{item.name}</Text>
                    {item.muscle_group ? (
                      <Text style={styles.exerciseListMuscle}>{item.muscle_group}</Text>
                    ) : null}
                    <IconSymbol name="plus" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  trimmedSearch.length === 0 ? (
                    <Text style={styles.emptyListText}>Type to search the exercise library</Text>
                  ) : null
                }
                ListFooterComponent={
                  trimmedSearch.length > 0 && !exactMatch ? (
                    <TouchableOpacity style={styles.createCustomRow} onPress={createCustom}>
                      <IconSymbol name="plus.circle.fill" size={20} color={Colors.primary} />
                      <Text style={styles.createCustomText}>
                        Create "{trimmedSearch}"
                      </Text>
                      <IconSymbol name="chevron.right" size={14} color={Colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  ) : null
                }
              />
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // ── Configure phase ─────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setPhase('search')}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setPhase('search')} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          {/* Title row with back button */}
          <View style={[styles.modalTitleRow, { paddingHorizontal: 16 }]}>
            <TouchableOpacity style={styles.modalBackBtn} onPress={() => setPhase('search')}>
              <IconSymbol name="chevron.left" size={14} color={Colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.modalTitleInRow}>{selected?.name}</Text>
            {form.muscle ? (
              <Text style={styles.exerciseListMuscle}>{form.muscle}</Text>
            ) : null}
          </View>

          <View style={styles.modalSheetInner}>
            {/* Muscle group — only editable for custom exercises */}
            {selected && !selected.isPreset && (
              <>
                <Text style={styles.fieldLabel}>Muscle Group</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. Legs"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={form.muscle}
                  onChangeText={(v) => fieldC('muscle', v)}
                  returnKeyType="next"
                />
              </>
            )}

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Sets</Text>
                <NumericInput
                  style={styles.fieldInput}
                  value={form.sets}
                  onChangeText={(v) => fieldC('sets', v)}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Reps</Text>
                <NumericInput
                  style={styles.fieldInput}
                  value={form.reps}
                  onChangeText={(v) => fieldC('reps', v)}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Weight (kg)</Text>
                <NumericInput
                  style={styles.fieldInput}
                  placeholder="0"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={form.weight}
                  onChangeText={(v) => fieldC('weight', v)}
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
              <TouchableOpacity style={styles.modalAddBtn} onPress={handleAdd}>
                <Text style={styles.modalAddText}>Add to Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Exercise Section ─────────────────────────────────────────────────────────

function ExerciseSection({
  exercise, sets, activeRest,
  onUpdateSet, onToggleSet, onAddSet, onDeleteSet, onDeleteExercise,
  onSkipRest, onAdjustRest, onOpenNumPad, isLast,
}: {
  exercise:          Exercise;
  sets:              SetRow[];
  activeRest:        ActiveRestDisplay | null;
  onUpdateSet:       (idx: number, field: 'weight' | 'reps', value: string) => void;
  onToggleSet:       (idx: number) => void;
  onAddSet:          () => void;
  onDeleteSet:       (idx: number) => void;
  onDeleteExercise:  () => void;
  onSkipRest:        () => void;
  onAdjustRest:      (delta: number) => void;
  onOpenNumPad:      (setIdx: number, field: 'weight' | 'reps', currentValue: string) => void;
  isLast:            boolean;
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

  // ── Previous performance + PR tracking ────────────────────────────────────
  type PrevSet = { weight: number | null; reps: number | null };
  const [prevSets,     setPrevSets]     = useState<PrevSet[] | null>(null);
  const [prBestWeight, setPrBestWeight] = useState<number | null>(null);
  const [prVisible,    setPrVisible]    = useState(false);
  const prTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchPrevAndPR() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        // Most recent session for this exercise (previous performance)
        const { data: sessions } = await supabase
          .from('workout_sessions')
          .select(`
            session_exercises!inner(
              exercise_name,
              session_sets(set_number, weight, reps, is_completed)
            )
          `)
          .eq('user_id', user.id)
          .eq('session_exercises.exercise_name', exercise.name)
          .order('started_at', { ascending: false })
          .limit(1);

        if (!cancelled && sessions?.length) {
          const rawSets = (sessions[0] as any).session_exercises?.[0]?.session_sets ?? [];
          const completed: PrevSet[] = rawSets
            .filter((s: any) => s.is_completed)
            .sort((a: any, b: any) => a.set_number - b.set_number)
            .map((s: any) => ({ weight: s.weight ?? null, reps: s.reps ?? null }));
          setPrevSets(completed.length > 0 ? completed : null);
        }

        // All-time best weight for this exercise
        const { data: allSessions } = await supabase
          .from('workout_sessions')
          .select(`session_exercises!inner(exercise_name, session_sets(weight, is_completed))`)
          .eq('user_id', user.id)
          .eq('session_exercises.exercise_name', exercise.name);

        if (!cancelled) {
          let best = 0;
          for (const sess of allSessions ?? []) {
            for (const ex of (sess as any).session_exercises) {
              for (const set of ex.session_sets) {
                if (set.is_completed && Number(set.weight) > best) best = Number(set.weight);
              }
            }
          }
          setPrBestWeight(best > 0 ? best : null);
        }
      } catch {}
    }
    fetchPrevAndPR();
    return () => { cancelled = true; };
  }, [exercise.name]);

  function handleSetToggle(i: number) {
    const wasNotDone = !sets[i].done;
    onToggleSet(i);

    if (wasNotDone && prBestWeight !== null) {
      const w = parseFloat(sets[i].weight);
      if (!isNaN(w) && w > prBestWeight) {
        setPrBestWeight(w);
        setPrVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (prTimer.current) clearTimeout(prTimer.current);
        prTimer.current = setTimeout(() => setPrVisible(false), 3000);
      }
    }
  }

  return (
    <View style={styles.exerciseSection}>
      {/* Section header */}
      <View style={styles.exerciseSectionHeader}>
        <Text style={styles.exerciseNameInput} numberOfLines={1}>{exercise.name}</Text>
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
        <TouchableOpacity
          onPress={onDeleteExercise}
          style={{ padding: 8 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="trash.fill" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Previous performance strip */}
      {prevSets && (
        <View style={styles.prevRow}>
          <IconSymbol name="clock" size={11} color={Colors.onSurfaceVariant} />
          <Text style={styles.prevText} numberOfLines={1}>
            {prevSets.map((s) => `${s.weight ?? '—'}×${s.reps ?? '—'}`).join('  ·  ')}
          </Text>
        </View>
      )}

      {/* PR celebration banner */}
      {prVisible && (
        <View style={styles.prBanner}>
          <IconSymbol name="trophy.fill" size={14} color={Colors.primary} />
          <Text style={styles.prBannerText}>New Personal Record!</Text>
        </View>
      )}

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
                    onPress={() => handleSetToggle(i)}>
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

  // ── Persistent workout state from context ──────────────────────────────────
  const {
    hydrated, isActive, exercises, setsState, activeRest, elapsed, startedAt,
    startWorkout, clearWorkout, setExercises, setSetsState, setActiveRest,
  } = useWorkout();

  // Start a new workout only after AsyncStorage restore is done and no session is running
  useEffect(() => {
    if (!hydrated) return;
    if (!isActive) startWorkout();
  }, [hydrated]);

  // ── Local UI state (resets on unmount — that's fine) ──────────────────────
  const [showAddModal, setShowAddModal] = useState(false);

  // Numpad state
  const [numPadTarget, setNumPadTarget] = useState<NumPadTarget | null>(null);
  const [numPadValue,  setNumPadValue]  = useState('0');

  const notifIdRef       = useRef<string | null>(null);
  const restExerciseRef  = useRef<string>('');

  const [finishing,   setFinishing]   = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [savedStats,  setSavedStats]  = useState<{ sets: number; volume: number; duration: number } | null>(null);

  // ── Tick to keep rest countdown display fresh ──────────────────────────────
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!activeRest) return;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [!!activeRest]);

  // Compute remaining from the endsAt timestamp (correct even after returning)
  const restRemaining = activeRest
    ? Math.max(0, Math.ceil((activeRest.endsAt - Date.now()) / 1000))
    : 0;

  // Auto-clear when rest expires + double-pulse to signal it's time
  useEffect(() => {
    if (activeRest && restRemaining <= 0) {
      setActiveRest(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 180);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 360);
    }
  }, [restRemaining]);

  // Display object passed to ExerciseSection (uses remaining, not endsAt)
  const activeRestDisplay: ActiveRestDisplay | null = activeRest
    ? { exId: activeRest.exId, setIdx: activeRest.setIdx, remaining: restRemaining }
    : null;

  // ── Notification permissions ───────────────────────────────────────────────

  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => {});
  }, []);


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
    setActiveRest(null);
    cancelRestNotification();
  }, [cancelRestNotification]);

  // Clamp to 5 s minimum so the chip doesn't vanish unexpectedly on -15.
  // Also reschedule the notification so it fires at the updated time.
  const adjustRest = useCallback(async (delta: number) => {
    if (!activeRest) return;
    const newEndsAt = Math.max(Date.now() + 5000, activeRest.endsAt + delta * 1000);
    setActiveRest({ ...activeRest, endsAt: newEndsAt });

    // Reschedule notification to the new end time
    if (notifIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notifIdRef.current).catch(() => {});
      notifIdRef.current = null;
    }
    const remainingSecs = Math.max(1, Math.ceil((newEndsAt - Date.now()) / 1000));
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rest complete!',
          body:  `Time to hit the next set — ${restExerciseRef.current}`,
          sound: true,
        },
        trigger: {
          type:    Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: remainingSecs,
          repeats: false,
        },
      });
      notifIdRef.current = id;
    } catch {}
  }, [activeRest]);

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      restExerciseRef.current = exerciseName;
      setActiveRest({ exId, setIdx: idx, endsAt: Date.now() + REST_SECONDS * 1000 });
      scheduleRestNotification(exerciseName);
    } else if (activeRest?.exId === exId && activeRest.setIdx === idx) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  function deleteExercise(exId: string) {
    setExercises((prev) => prev.filter((e) => e.id !== exId));
    setSetsState((prev) => {
      const next = { ...prev };
      delete next[exId];
      return next;
    });
    if (activeRest?.exId === exId) setActiveRest(null);
  }

  function addCustomExercise(exercise: Exercise, sets: SetRow[]) {
    setExercises((prev) => [...prev, exercise]);
    setSetsState((prev) => ({ ...prev, [exercise.id]: sets }));
    setShowAddModal(false);
  }

  // ── Cancel workout ────────────────────────────────────────────────────────────

  function confirmCancelWorkout() {
    Alert.alert(
      'Cancel Workout?',
      'Your progress will be lost and nothing will be saved.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            cancelRestNotification();
            clearWorkout();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  }

  // ── Save workout ─────────────────────────────────────────────────────────────

  function sessionName(d: Date): string {
    const h = d.getHours();
    if (h < 12) return 'Morning Workout';
    if (h < 17) return 'Afternoon Workout';
    if (h < 21) return 'Evening Workout';
    return 'Night Workout';
  }

  function buildPayload(userId: string): WorkoutSavePayload {
    const workoutStart = startedAt ?? new Date();
    return {
      user_id:          userId,
      name:             sessionName(workoutStart),
      started_at:       workoutStart.toISOString(),
      finished_at:      new Date().toISOString(),
      duration_seconds: elapsed,
      exercises: exercises.map((ex, i) => ({
        exercise_name: ex.name,
        muscle_group:  ex.muscle,
        sort_order:    i,
        sets: (setsState[ex.id] ?? []).map((s, j) => ({
          set_number:   j + 1,
          weight:       parseFloat(s.weight) || null,
          reps:         parseInt(s.reps)     || null,
          is_completed: s.done,
          completed_at: s.done ? new Date().toISOString() : null,
        })),
      })),
    };
  }

  async function saveOnline(payload: WorkoutSavePayload): Promise<void> {
    const { data: session, error: sessionErr } = await supabase
      .from('workout_sessions')
      .insert({
        user_id:          payload.user_id,
        name:             payload.name,
        started_at:       payload.started_at,
        finished_at:      payload.finished_at,
        duration_seconds: payload.duration_seconds,
      })
      .select('id')
      .single();
    if (sessionErr) throw sessionErr;

    for (const ex of payload.exercises) {
      const { data: sessionEx, error: exErr } = await supabase
        .from('session_exercises')
        .insert({
          session_id:    session.id,
          exercise_name: ex.exercise_name,
          muscle_group:  ex.muscle_group,
          sort_order:    ex.sort_order,
        })
        .select('id')
        .single();
      if (exErr) throw exErr;

      if (ex.sets.length > 0) {
        const { error: setsErr } = await supabase
          .from('session_sets')
          .insert(
            ex.sets.map((s) => ({
              session_exercise_id: sessionEx.id,
              set_number:          s.set_number,
              weight:              s.weight,
              reps:                s.reps,
              is_completed:        s.is_completed,
              completed_at:        s.completed_at,
            }))
          );
        if (setsErr) throw setsErr;
      }
    }
  }

  async function finishWorkout() {
    setFinishing(true);
    setSaveError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const payload = buildPayload(user.id);

      try {
        await saveOnline(payload);
      } catch (netErr) {
        if (isNetworkError(netErr)) {
          // No connection — store locally and sync later
          await enqueueWorkout(payload);
          const allSets  = Object.values(setsState).flat();
          const doneSets = allSets.filter((s) => s.done);
          const volume   = doneSets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSavedStats({ sets: doneSets.length, volume, duration: elapsed });
          setFinishing(false);
          setTimeout(() => { clearWorkout(); setSavedStats(null); router.replace('/(tabs)'); }, 2200);
          return;
        }
        throw netErr; // re-throw auth / logic errors
      }

      const allSets   = Object.values(setsState).flat();
      const doneSets  = allSets.filter((s) => s.done);
      const volume    = doneSets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSavedStats({ sets: doneSets.length, volume, duration: elapsed });
      setFinishing(false);
      setTimeout(() => {
        clearWorkout();
        setSavedStats(null);
        router.replace('/(tabs)');
      }, 2200);
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
        <TouchableOpacity style={styles.backBtn} onPress={confirmCancelWorkout}>
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
            activeRest={activeRestDisplay}
            onDeleteExercise={() => deleteExercise(ex.id)}
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

        <TouchableOpacity style={styles.btnCancel} onPress={confirmCancelWorkout} disabled={finishing}>
          <Text style={styles.btnCancelText}>Cancel Workout</Text>
        </TouchableOpacity>
      </View>

      <AddExerciseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addCustomExercise}
      />

      {/* Workout saved overlay */}
      {savedStats && (
        <View style={styles.savedOverlay}>
          <View style={styles.savedCard}>
            <View style={styles.savedIconBox}>
              <IconSymbol name="checkmark.circle.fill" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.savedTitle}>Workout Complete!</Text>
            <View style={styles.savedStatsRow}>
              <View style={styles.savedStat}>
                <Text style={styles.savedStatValue}>{formatTime(savedStats.duration)}</Text>
                <Text style={styles.savedStatLabel}>Duration</Text>
              </View>
              <View style={styles.savedStat}>
                <Text style={styles.savedStatValue}>{savedStats.sets}</Text>
                <Text style={styles.savedStatLabel}>Sets</Text>
              </View>
              <View style={styles.savedStat}>
                <Text style={styles.savedStatValue}>{savedStats.volume >= 1000 ? `${(savedStats.volume / 1000).toFixed(1)}k` : String(Math.round(savedStats.volume))}</Text>
                <Text style={styles.savedStatLabel}>kg lifted</Text>
              </View>
            </View>
          </View>
        </View>
      )}

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
