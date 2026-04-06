import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { useLocalSearchParams, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from '@/styles/plan-editor.styles';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanExercise = {
  id: string;
  name: string;
  muscle: string;
  sets: string;
  reps: string;
  weight: string;
};

type PlanDay = {
  id: string;
  name: string;
  focus: string;
  exercises: PlanExercise[];
};

type DbExercise  = { name: string; muscle_group: string | null };
type ConfigForm  = { muscle: string; sets: string; reps: string; weight: string };

// ─── Helper ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2); }

// ─── Add Exercise Modal (2-phase: search → configure) ─────────────────────────

function AddExerciseModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (ex: PlanExercise) => void;
}) {
  const [phase, setPhase]       = useState<'search' | 'configure'>('search');
  const [search, setSearch]     = useState('');
  const [dbList, setDbList]     = useState<DbExercise[]>([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState<{ name: string; isPreset: boolean } | null>(null);
  const [form, setForm]         = useState<ConfigForm>({ muscle: '', sets: '3', reps: '10', weight: '' });

  useEffect(() => {
    if (!visible) return;
    setPhase('search');
    setSearch('');
    setSelected(null);
    setForm({ muscle: '', sets: '3', reps: '10', weight: '' });
    setLoading(true);
    supabase
      .from('exercises')
      .select('name, muscle_group')
      .order('name')
      .then(({ data }) => { setDbList(data ?? []); setLoading(false); });
  }, [visible]);

  const trimmed  = search.trim();
  const filtered = dbList.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
  const exactMatch = dbList.some((e) => e.name.toLowerCase() === trimmed.toLowerCase());

  function selectPreset(ex: DbExercise) {
    setSelected({ name: ex.name, isPreset: true });
    setForm({ muscle: ex.muscle_group ?? '', sets: '3', reps: '10', weight: '' });
    setPhase('configure');
  }

  function createCustom() {
    setSelected({ name: trimmed, isPreset: false });
    setForm({ muscle: '', sets: '3', reps: '10', weight: '' });
    setPhase('configure');
  }

  function handleAdd() {
    if (!selected) return;
    onAdd({
      id:     uid(),
      name:   selected.name,
      muscle: form.muscle.trim() || 'Custom',
      sets:   form.sets || '3',
      reps:   form.reps || '10',
      weight: form.weight || '0',
    });
    // Return to search so user can keep adding
    setPhase('search');
    setSearch('');
    setSelected(null);
    setForm({ muscle: '', sets: '3', reps: '10', weight: '' });
  }

  function fc(key: keyof ConfigForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ── Search phase ─────────────────────────────────────────────────────────────
  if (phase === 'search') {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Exercise</Text>

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
                  <TouchableOpacity style={styles.exerciseListItem} onPress={() => selectPreset(item)}>
                    <Text style={styles.exerciseListName}>{item.name}</Text>
                    {item.muscle_group ? (
                      <Text style={styles.exerciseListMuscle}>{item.muscle_group}</Text>
                    ) : null}
                    <IconSymbol name="plus" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  trimmed.length === 0 ? (
                    <Text style={styles.listEmptyText}>Type to search the exercise library</Text>
                  ) : null
                }
                ListFooterComponent={
                  trimmed.length > 0 && !exactMatch ? (
                    <TouchableOpacity style={styles.createCustomRow} onPress={createCustom}>
                      <IconSymbol name="plus.circle.fill" size={20} color={Colors.primary} />
                      <Text style={styles.createCustomText}>Create "{trimmed}"</Text>
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

  // ── Configure phase ───────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setPhase('search')}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setPhase('search')} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalTitleRow}>
            <TouchableOpacity style={styles.modalBackBtn} onPress={() => setPhase('search')}>
              <IconSymbol name="chevron.left" size={14} color={Colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.modalTitleInRow}>{selected?.name}</Text>
            {form.muscle ? <Text style={styles.exerciseListMuscle}>{form.muscle}</Text> : null}
          </View>

          <View style={styles.modalSheetInner}>
            {selected && !selected.isPreset && (
              <>
                <Text style={styles.fieldLabel}>Muscle Group</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. Legs"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={form.muscle}
                  onChangeText={(v) => fc('muscle', v)}
                  returnKeyType="next"
                />
              </>
            )}

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Sets</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.sets}
                  onChangeText={(v) => fc('sets', v)}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Reps</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.reps}
                  onChangeText={(v) => fc('reps', v)}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="0"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={form.weight}
                  onChangeText={(v) => fc('weight', v)}
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
                <Text style={styles.modalAddText}>Add to Day</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Day Section ──────────────────────────────────────────────────────────────

function DaySection({
  day,
  dayNumber,
  expanded,
  onToggle,
  onUpdateName,
  onUpdateFocus,
  onDelete,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
}: {
  day:              PlanDay;
  dayNumber:        number;
  expanded:         boolean;
  onToggle:         () => void;
  onUpdateName:     (v: string) => void;
  onUpdateFocus:    (v: string) => void;
  onDelete:         () => void;
  onAddExercise:    () => void;
  onUpdateExercise: (exId: string, field: keyof PlanExercise, value: string) => void;
  onDeleteExercise: (exId: string) => void;
}) {
  const [expandedExId, setExpandedExId] = useState<string | null>(null);

  return (
    <View style={[styles.dayCard, expanded && styles.dayCardExpanded]}>
      {/* Header */}
      <View style={styles.dayCardHeader}>
        <View style={styles.dayNumberBadge}>
          <Text style={styles.dayNumberText}>{dayNumber}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            style={styles.dayNameInput}
            value={day.name}
            onChangeText={onUpdateName}
            placeholder="Day name"
            placeholderTextColor={Colors.onSurfaceVariant}
            returnKeyType="done"
          />
          <TextInput
            style={styles.dayFocusInput}
            value={day.focus}
            onChangeText={onUpdateFocus}
            placeholder="Focus (e.g. Chest · Triceps)"
            placeholderTextColor={Colors.outlineVariant}
            returnKeyType="done"
          />
        </View>
        <TouchableOpacity style={styles.dayToggleBtn} onPress={onToggle}>
          <IconSymbol
            name={expanded ? 'chevron.up' : 'chevron.down'}
            size={18}
            color={Colors.onSurfaceVariant}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dayDeleteBtn} onPress={onDelete}>
          <IconSymbol name="trash.fill" size={14} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Collapsed summary */}
      {!expanded && day.exercises.length > 0 && (
        <TouchableOpacity onPress={onToggle} style={styles.dayCollapsedRow}>
          <Text style={styles.dayCollapsedText}>
            {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.dayCollapsedExs} numberOfLines={1}>
            {day.exercises.map((e) => e.name).join(' · ')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Expanded body */}
      {expanded && (
        <View style={styles.dayExercises}>
          {day.exercises.map((ex) => (
            <View key={ex.id}>
              <View style={styles.exRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <View style={styles.exChips}>
                    {ex.muscle && ex.muscle !== 'Custom' ? (
                      <Text style={[styles.exChip, styles.exChipHighlight]}>{ex.muscle}</Text>
                    ) : null}
                    <Text style={styles.exChip}>{ex.sets} sets</Text>
                    <Text style={styles.exChip}>{ex.reps} reps</Text>
                    {parseFloat(ex.weight) > 0 ? (
                      <Text style={styles.exChip}>{ex.weight} kg</Text>
                    ) : null}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.exEditBtn}
                  onPress={() => setExpandedExId(expandedExId === ex.id ? null : ex.id)}>
                  <IconSymbol
                    name={expandedExId === ex.id ? 'xmark' : 'pencil'}
                    size={14}
                    color={expandedExId === ex.id ? Colors.onSurfaceVariant : Colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.exDeleteBtn} onPress={() => onDeleteExercise(ex.id)}>
                  <IconSymbol name="trash" size={14} color={Colors.error} />
                </TouchableOpacity>
              </View>

              {/* Inline editor */}
              {expandedExId === ex.id && (
                <View style={styles.exInlineEdit}>
                  <View style={styles.inlineEditRow}>
                    <View style={styles.inlineField}>
                      <Text style={styles.inlineLabel}>Sets</Text>
                      <TextInput
                        style={styles.inlineInput}
                        value={ex.sets}
                        onChangeText={(v) => onUpdateExercise(ex.id, 'sets', v)}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.inlineField}>
                      <Text style={styles.inlineLabel}>Reps</Text>
                      <TextInput
                        style={styles.inlineInput}
                        value={ex.reps}
                        onChangeText={(v) => onUpdateExercise(ex.id, 'reps', v)}
                      />
                    </View>
                    <View style={styles.inlineField}>
                      <Text style={styles.inlineLabel}>Weight (kg)</Text>
                      <TextInput
                        style={styles.inlineInput}
                        value={ex.weight}
                        onChangeText={(v) => onUpdateExercise(ex.id, 'weight', v)}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addExerciseInDayBtn} onPress={onAddExercise}>
            <IconSymbol name="plus.circle.fill" size={16} color={Colors.primary} />
            <Text style={styles.addExerciseInDayText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PlanEditorScreen() {
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId?: string }>();

  const [screenLoading, setScreenLoading] = useState(!!planId);
  const [saving, setSaving]               = useState(false);
  const [saveError, setSaveError]         = useState('');
  const [planName, setPlanName]           = useState('');
  const [planDesc, setPlanDesc]           = useState('');
  const [days, setDays]                   = useState<PlanDay[]>([]);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);
  const [addExDayId, setAddExDayId]       = useState<string | null>(null);

  useEffect(() => {
    if (planId) loadPlan(planId as string);
  }, []);

  // ── Load existing plan ──────────────────────────────────────────────────────

  async function loadPlan(id: string) {
    const { data: plan } = await supabase
      .from('workout_plans')
      .select('name, description')
      .eq('id', id)
      .single();

    if (plan) {
      setPlanName(plan.name ?? '');
      setPlanDesc(plan.description ?? '');
    }

    const { data: planDays } = await supabase
      .from('workout_plan_days')
      .select('id, name, focus, day_number')
      .eq('plan_id', id)
      .order('day_number');

    if (planDays) {
      const loaded: PlanDay[] = await Promise.all(
        planDays.map(async (d) => {
          const { data: exs } = await supabase
            .from('workout_plan_exercises')
            .select('id, exercise_name, muscle_group, sets, reps, weight, sort_order')
            .eq('plan_day_id', d.id)
            .order('sort_order');

          return {
            id:    d.id,
            name:  d.name,
            focus: d.focus ?? '',
            exercises: (exs ?? []).map((e) => ({
              id:     e.id,
              name:   e.exercise_name,
              muscle: e.muscle_group ?? '',
              sets:   String(e.sets ?? 3),
              reps:   String(e.reps ?? 10),
              weight: String(e.weight ?? 0),
            })),
          };
        })
      );
      setDays(loaded);
    }

    setScreenLoading(false);
  }

  // ── Day operations ──────────────────────────────────────────────────────────

  function addDay() {
    const id = uid();
    setDays((prev) => [...prev, { id, name: `Day ${prev.length + 1}`, focus: '', exercises: [] }]);
    setExpandedDayId(id);
  }

  function updateDay(dayId: string, field: 'name' | 'focus', value: string) {
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, [field]: value } : d)));
  }

  function deleteDay(dayId: string) {
    setDays((prev) => prev.filter((d) => d.id !== dayId));
    if (expandedDayId === dayId) setExpandedDayId(null);
  }

  // ── Exercise operations ─────────────────────────────────────────────────────

  function addExercise(ex: PlanExercise) {
    if (!addExDayId) return;
    setDays((prev) => prev.map((d) =>
      d.id === addExDayId ? { ...d, exercises: [...d.exercises, ex] } : d
    ));
    // keep modal open at search phase so user can keep adding
  }

  function updateExercise(dayId: string, exId: string, field: keyof PlanExercise, value: string) {
    setDays((prev) => prev.map((d) =>
      d.id === dayId
        ? { ...d, exercises: d.exercises.map((e) => (e.id === exId ? { ...e, [field]: value } : e)) }
        : d
    ));
  }

  function deleteExercise(dayId: string, exId: string) {
    setDays((prev) => prev.map((d) =>
      d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d
    ));
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function save() {
    const name = planName.trim() || 'My Plan';
    setSaving(true);
    setSaveError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    let planDbId: string | undefined = planId as string | undefined;

    if (planId) {
      // Edit: update header, wipe days (cascade deletes exercises), re-insert
      await supabase.from('workout_plans').update({
        name,
        description:  planDesc.trim() || null,
        days_per_week: days.length,
        updated_at:   new Date().toISOString(),
      }).eq('id', planId);
      await supabase.from('workout_plan_days').delete().eq('plan_id', planId);
    } else {
      // Create new plan
      const { data: created, error } = await supabase
        .from('workout_plans')
        .insert({
          user_id:      user.id,
          name,
          description:  planDesc.trim() || null,
          days_per_week: days.length,
        })
        .select('id')
        .single();

      if (error || !created) {
        setSaving(false);
        setSaveError('Failed to save plan. Please try again.');
        return;
      }
      planDbId = created.id;
    }

    // Insert days and their exercises
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const { data: dbDay } = await supabase
        .from('workout_plan_days')
        .insert({
          plan_id:    planDbId,
          day_number: i + 1,
          name:       day.name,
          focus:      day.focus || null,
        })
        .select('id')
        .single();

      if (dbDay && day.exercises.length > 0) {
        await supabase.from('workout_plan_exercises').insert(
          day.exercises.map((ex, j) => ({
            plan_day_id:   dbDay.id,
            exercise_name: ex.name,
            muscle_group:  ex.muscle || null,
            sets:          parseInt(ex.sets) || 3,
            reps:          ex.reps || '10',
            weight:        parseFloat(ex.weight) || null,
            sort_order:    j,
          }))
        );
      }
    }

    setSaving(false);
    router.back();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (screenLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
        <TextInput
          style={styles.titleInput}
          value={planName}
          onChangeText={setPlanName}
          placeholder={planId ? 'Plan name' : 'New plan name'}
          placeholderTextColor={Colors.onSurfaceVariant}
          returnKeyType="done"
        />
        {saving ? (
          <ActivityIndicator color={Colors.primary} style={{ width: 56 }} />
        ) : (
          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Description */}
        <TextInput
          style={styles.descInput}
          value={planDesc}
          onChangeText={setPlanDesc}
          placeholder="Description (optional)"
          placeholderTextColor={Colors.onSurfaceVariant}
          multiline
          returnKeyType="done"
          blurOnSubmit
        />

        {/* Days */}
        {days.length === 0 ? (
          <View style={styles.emptyDays}>
            <Text style={styles.emptyDaysText}>No days yet</Text>
            <Text style={styles.emptyDaysSub}>Tap "Add Day" below to build your training week</Text>
          </View>
        ) : (
          days.map((day, i) => (
            <DaySection
              key={day.id}
              day={day}
              dayNumber={i + 1}
              expanded={expandedDayId === day.id}
              onToggle={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}
              onUpdateName={(v) => updateDay(day.id, 'name', v)}
              onUpdateFocus={(v) => updateDay(day.id, 'focus', v)}
              onDelete={() => deleteDay(day.id)}
              onAddExercise={() => {
                setAddExDayId(day.id);
                if (expandedDayId !== day.id) setExpandedDayId(day.id);
              }}
              onUpdateExercise={(exId, field, value) => updateExercise(day.id, exId, field, value)}
              onDeleteExercise={(exId) => deleteExercise(day.id, exId)}
            />
          ))
        )}

        {saveError ? <Text style={styles.saveErrorText}>{saveError}</Text> : null}

        {/* Add day */}
        <TouchableOpacity style={styles.addDayBtn} onPress={addDay}>
          <IconSymbol name="plus.circle.fill" size={20} color={Colors.primary} />
          <Text style={styles.addDayBtnText}>Add Day</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Add Exercise Modal */}
      <AddExerciseModal
        visible={!!addExDayId}
        onClose={() => setAddExDayId(null)}
        onAdd={addExercise}
      />

    </SafeAreaView>
  );
}
