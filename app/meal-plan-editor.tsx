import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { NumericInput } from '@/components/ui/numeric-input';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

type MealEntry = {
  id:        string;
  meal_type: MealType;
  name:      string;
  calories:  string;
  protein:   string;
  carbs:     string;
  fat:       string;
  notes:     string;
};

type SavedCombo = {
  id:    string;
  name:  string;
  items: { id: string; name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }[];
};

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch:     'Lunch',
  dinner:    'Dinner',
  snack:     'Snack',
};

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: 'sun.horizon.fill',
  lunch:     'sun.max.fill',
  dinner:    'moon.fill',
  snack:     'leaf.fill',
};

function uid() { return Math.random().toString(36).slice(2); }

function emptyMeal(type: MealType): MealEntry {
  return { id: uid(), meal_type: type, name: '', calories: '0', protein: '0', carbs: '0', fat: '0', notes: '' };
}

// ─── Add / Edit Meal Modal ────────────────────────────────────────────────────

function MealModal({
  visible,
  initialMeal,
  onClose,
  onSave,
}: {
  visible:     boolean;
  initialMeal: MealEntry;
  onClose:     () => void;
  onSave:      (meal: MealEntry) => void;
}) {
  const C = useColors();
  const [meal,        setMeal]        = useState<MealEntry>(initialMeal);
  const [activeTab,   setActiveTab]   = useState<'manual' | 'saved'>('manual');
  const [savedCombos, setSavedCombos] = useState<SavedCombo[]>([]);
  const [loadingCombos, setLoadingCombos] = useState(false);

  useEffect(() => {
    if (visible) {
      setMeal(initialMeal);
      setActiveTab('manual');
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || activeTab !== 'saved') return;
    (async () => {
      setLoadingCombos(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('saved_meals')
          .select('id, name, saved_meal_items(id, name, calories, protein_g, carbs_g, fat_g, sort_order)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setSavedCombos((data ?? []).map((c: any) => ({
          id: c.id, name: c.name,
          items: (c.saved_meal_items ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        })));
      } catch {}
      setLoadingCombos(false);
    })();
  }, [visible, activeTab]);

  function field<K extends keyof MealEntry>(key: K, value: MealEntry[K]) {
    setMeal((m) => ({ ...m, [key]: value }));
  }

  // Import a saved combo: adds each item as a separate meal entry via onSave
  function importCombo(combo: SavedCombo) {
    combo.items.forEach((item) => {
      onSave({
        id:        uid(),
        meal_type: meal.meal_type,
        name:      item.name,
        calories:  String(item.calories),
        protein:   String(item.protein_g),
        carbs:     String(item.carbs_g),
        fat:       String(item.fat_g),
        notes:     '',
      });
    });
    onClose();
  }

  const s = useMemo(() => StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: C.surfaceContainer,
      borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
      padding: Spacing.xl, paddingBottom: Spacing.xxxl, gap: Spacing.md,
      maxHeight: '85%',
    },
    handle: {
      width: 40, height: 4, borderRadius: Radius.full,
      backgroundColor: C.outlineVariant, alignSelf: 'center', marginBottom: Spacing.xs,
    },
    title:           { ...Typography.headlineMd, color: C.onSurface },
    segRow:          { flexDirection: 'row', backgroundColor: C.surfaceContainerHigh, borderRadius: Radius.md, padding: 3 },
    segTab:          { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: Radius.sm },
    segTabActive:    { backgroundColor: C.background },
    segText:         { ...Typography.labelLg, color: C.onSurfaceVariant },
    segTextActive:   { color: C.primary, fontWeight: '600' },
    typeTabs:        { flexDirection: 'row', gap: Spacing.xs },
    typeTab:         { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.md, backgroundColor: C.surfaceContainerHigh, borderWidth: 1, borderColor: C.outlineVariant },
    typeTabActive:   { backgroundColor: C.primary + '22', borderColor: C.primary },
    typeTabText:     { ...Typography.labelLg, color: C.onSurfaceVariant },
    typeTabTextActive: { color: C.primary, fontWeight: '600' },
    label:           { ...Typography.labelLg, color: C.onSurfaceVariant, marginBottom: 2 },
    input:           { backgroundColor: C.surfaceContainerHigh, borderRadius: Radius.md, borderWidth: 1, borderColor: C.outlineVariant, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Typography.bodyMd, color: C.onSurface },
    macroRow:        { flexDirection: 'row', gap: Spacing.sm },
    macroField:      { flex: 1 },
    actions:         { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
    cancelBtn:       { flex: 1, height: 48, borderRadius: Radius.md, borderWidth: 1, borderColor: C.outlineVariant, justifyContent: 'center', alignItems: 'center' },
    saveBtn:         { flex: 2, height: 48, borderRadius: Radius.md, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
    cancelText:      { ...Typography.titleMd, color: C.onSurfaceVariant },
    saveText:        { ...Typography.titleMd, color: C.background },
    comboRow:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: C.outlineVariant },
    comboName:       { ...Typography.titleMd, color: C.onSurface, flex: 1 },
    comboMeta:       { ...Typography.bodyMd, color: C.onSurfaceVariant },
  }), [C]);

  const isEditing = !!initialMeal.name;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <ScrollView style={s.sheet} contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing.md }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.handle} />
          <Text style={s.title}>{isEditing ? 'Edit Meal' : 'Add Meal'}</Text>

          {/* Manual / Saved Meals tabs — only for new entries */}
          {!isEditing && (
            <View style={s.segRow}>
              {(['manual', 'saved'] as const).map((t) => (
                <TouchableOpacity key={t} style={[s.segTab, activeTab === t && s.segTabActive]} onPress={() => setActiveTab(t)}>
                  <Text style={[s.segText, activeTab === t && s.segTextActive]}>
                    {t === 'manual' ? 'Manual' : 'From Saved Meals'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Meal type (shared for both tabs) */}
          <View style={s.typeTabs}>
            {MEAL_TYPES.map((t) => (
              <TouchableOpacity key={t} style={[s.typeTab, meal.meal_type === t && s.typeTabActive]} onPress={() => field('meal_type', t)}>
                <Text style={[s.typeTabText, meal.meal_type === t && s.typeTabTextActive]}>{MEAL_LABELS[t]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'saved' ? (
            // ── From Saved Meals ──────────────────────────────────────────────
            loadingCombos ? (
              <ActivityIndicator color={C.primary} style={{ marginVertical: Spacing.lg }} />
            ) : savedCombos.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm }}>
                <IconSymbol name="fork.knife" size={32} color={C.outlineVariant} />
                <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' }}>
                  No saved meals yet.{'\n'}Log food and tap "Save as Meal" on the nutrition screen.
                </Text>
              </View>
            ) : (
              savedCombos.map((combo) => {
                const totalCal = combo.items.reduce((s, i) => s + i.calories, 0);
                return (
                  <TouchableOpacity key={combo.id} style={s.comboRow} onPress={() => importCombo(combo)}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.comboName}>{combo.name}</Text>
                      <Text style={s.comboMeta}>{combo.items.length} items · {totalCal} kcal</Text>
                    </View>
                    <IconSymbol name="plus.circle.fill" size={22} color={C.primary} />
                  </TouchableOpacity>
                );
              })
            )
          ) : (
            // ── Manual entry ─────────────────────────────────────────────────
            <>
              <View>
                <Text style={s.label}>Name</Text>
                <TextInput
                  style={s.input}
                  value={meal.name}
                  onChangeText={(v) => field('name', v)}
                  placeholder="e.g. Oats with banana"
                  placeholderTextColor={C.onSurfaceVariant}
                  autoCapitalize="sentences"
                  returnKeyType="next"
                />
              </View>

              <View>
                <Text style={s.label}>Calories (kcal)</Text>
                <NumericInput style={s.input} value={meal.calories} onChangeText={(v) => field('calories', v)} keyboardType="number-pad" placeholder="0" placeholderTextColor={C.onSurfaceVariant} />
              </View>

              <View style={s.macroRow}>
                {(['protein', 'carbs', 'fat'] as const).map((macro) => (
                  <View key={macro} style={s.macroField}>
                    <Text style={s.label}>{macro.charAt(0).toUpperCase() + macro.slice(1)} (g)</Text>
                    <NumericInput style={s.input} value={meal[macro]} onChangeText={(v) => field(macro, v)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={C.onSurfaceVariant} />
                  </View>
                ))}
              </View>

              <View>
                <Text style={s.label}>Notes (optional)</Text>
                <TextInput
                  style={[s.input, { minHeight: 60, textAlignVertical: 'top' }]}
                  value={meal.notes}
                  onChangeText={(v) => field('notes', v)}
                  placeholder="e.g. use low-fat milk"
                  placeholderTextColor={C.onSurfaceVariant}
                  multiline returnKeyType="done" blurOnSubmit
                />
              </View>

              <View style={s.actions}>
                <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.saveBtn, !meal.name.trim() && { opacity: 0.45 }]}
                  onPress={() => { if (meal.name.trim()) onSave(meal); }}
                  disabled={!meal.name.trim()}>
                  <Text style={s.saveText}>{isEditing ? 'Save Changes' : 'Add Meal'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MealPlanEditorScreen() {
  const C = useColors();
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId?: string }>();

  const [screenLoading, setScreenLoading] = useState(!!planId);
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState('');
  const [planName,      setPlanName]      = useState('');
  const [planDesc,      setPlanDesc]      = useState('');
  const [meals,         setMeals]         = useState<MealEntry[]>([]);
  const [expandedType,  setExpandedType]  = useState<MealType | null>('breakfast');

  const [mealModal, setMealModal] = useState<{
    visible: boolean;
    meal:    MealEntry;
    isEdit:  boolean;
  }>({ visible: false, meal: emptyMeal('breakfast'), isEdit: false });

  const s = useMemo(() => StyleSheet.create({
    container:    { flex: 1, backgroundColor: C.background },
    topBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: C.outlineVariant, gap: Spacing.sm },
    backBtn:      { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    titleInput:   { flex: 1, ...Typography.titleLg, color: C.onSurface },
    saveBtn:      { paddingHorizontal: Spacing.lg, height: 36, borderRadius: Radius.full, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
    saveBtnText:  { ...Typography.titleMd, color: C.background },
    scroll:       { flex: 1 },
    scrollContent:{ padding: Spacing.lg, paddingBottom: 80 },
    descInput:    { ...Typography.bodyMd, color: C.onSurface, backgroundColor: C.surfaceContainer, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg, minHeight: 56 },
    typeSection:  { marginBottom: Spacing.sm },
    typeHeader:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, backgroundColor: C.surfaceContainer, borderRadius: Radius.lg, marginBottom: 2 },
    typeLabel:    { ...Typography.titleMd, color: C.onSurface, flex: 1 },
    typeMeta:     { ...Typography.bodyMd, color: C.onSurfaceVariant },
    mealRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: C.surfaceContainer, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: 2, marginHorizontal: 2 },
    mealInfo:     { flex: 1 },
    mealName:     { ...Typography.titleMd, color: C.onSurface },
    mealMeta:     { ...Typography.bodyMd, color: C.onSurfaceVariant, fontSize: 12 },
    addMealBtn:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
    addMealText:  { ...Typography.labelLg, color: C.primary },
    macroTotals:  { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.md },
    macroCell:    { flex: 1, alignItems: 'center' },
    macroValue:   { ...Typography.titleMd, color: C.onSurface },
    macroLabel:   { ...Typography.labelMd, color: C.onSurfaceVariant },
    emptyBox:     { alignItems: 'center', paddingVertical: 48, gap: Spacing.sm },
    emptyText:    { ...Typography.titleMd, color: C.onSurface },
    emptySub:     { ...Typography.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' },
    saveErrorText:{ ...Typography.bodyMd, color: C.error, textAlign: 'center', marginBottom: Spacing.md },
  }), [C]);

  useEffect(() => {
    if (planId) loadPlan(planId);
  }, []);

  async function loadPlan(id: string) {
    const [{ data: plan }, { data: mealRows }] = await Promise.all([
      supabase.from('meal_plans').select('name, description').eq('id', id).single(),
      supabase.from('meal_plan_meals').select('id, meal_type, name, calories, protein_g, carbs_g, fat_g, notes, sort_order').eq('meal_plan_id', id).order('sort_order'),
    ]);

    if (plan) {
      setPlanName(plan.name ?? '');
      setPlanDesc(plan.description ?? '');
    }
    setMeals((mealRows ?? []).map((m: any) => ({
      id:        m.id,
      meal_type: m.meal_type as MealType,
      name:      m.name,
      calories:  String(m.calories ?? 0),
      protein:   String(m.protein_g ?? 0),
      carbs:     String(m.carbs_g ?? 0),
      fat:       String(m.fat_g ?? 0),
      notes:     m.notes ?? '',
    })));
    setScreenLoading(false);
  }

  function openAdd(type: MealType) {
    setMealModal({ visible: true, meal: emptyMeal(type), isEdit: false });
    setExpandedType(type);
  }

  function openEdit(meal: MealEntry) {
    setMealModal({ visible: true, meal, isEdit: true });
  }

  function handleMealSave(saved: MealEntry) {
    if (mealModal.isEdit) {
      setMeals((prev) => prev.map((m) => m.id === saved.id ? saved : m));
    } else {
      setMeals((prev) => [...prev, saved]);
    }
    setMealModal((m) => ({ ...m, visible: false }));
  }

  // importCombo calls onSave multiple times then closes — handle via this wrapper
  function handleMealSaveMulti(saved: MealEntry) {
    setMeals((prev) => [...prev, saved]);
  }

  function deleteMeal(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }

  async function save() {
    const name = planName.trim();
    if (!name) { Alert.alert('Name required', 'Please give your meal plan a name.'); return; }

    setSaving(true); setSaveError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      let planDbId = planId as string | undefined;

      if (planId) {
        await supabase.from('meal_plans').update({ name, description: planDesc.trim() || null, updated_at: new Date().toISOString() }).eq('id', planId);
        await supabase.from('meal_plan_meals').delete().eq('meal_plan_id', planId);
      } else {
        const { data: created, error } = await supabase
          .from('meal_plans')
          .insert({ user_id: user.id, name, description: planDesc.trim() || null })
          .select('id').single();
        if (error || !created) throw error ?? new Error('Failed to create plan');
        planDbId = created.id;
      }

      if (meals.length > 0) {
        await supabase.from('meal_plan_meals').insert(
          meals.map((m, i) => ({
            meal_plan_id: planDbId,
            meal_type:    m.meal_type,
            name:         m.name,
            calories:     parseInt(m.calories) || 0,
            protein_g:    parseFloat(m.protein) || 0,
            carbs_g:      parseFloat(m.carbs) || 0,
            fat_g:        parseFloat(m.fat) || 0,
            notes:        m.notes.trim() || null,
            sort_order:   i,
          }))
        );
      }

      router.back();
    } catch (err: any) {
      setSaveError(err?.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (screenLoading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ActivityIndicator color={C.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const totalCal  = meals.reduce((s, m) => s + (parseInt(m.calories) || 0), 0);
  const totalProt = meals.reduce((s, m) => s + (parseFloat(m.protein) || 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (parseFloat(m.carbs) || 0), 0);
  const totalFat  = meals.reduce((s, m) => s + (parseFloat(m.fat) || 0), 0);
  const hasMeals  = meals.length > 0;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={20} color={C.onSurface} />
        </TouchableOpacity>
        <TextInput
          style={s.titleInput}
          value={planName}
          onChangeText={setPlanName}
          placeholder="Meal plan name"
          placeholderTextColor={C.onSurfaceVariant}
          returnKeyType="done"
        />
        {saving
          ? <ActivityIndicator color={C.primary} style={{ width: 56 }} />
          : <TouchableOpacity style={s.saveBtn} onPress={save}><Text style={s.saveBtnText}>Save</Text></TouchableOpacity>}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Description */}
        <TextInput
          style={s.descInput}
          value={planDesc}
          onChangeText={setPlanDesc}
          placeholder="Description (optional) — e.g. High protein cut, 2400 kcal"
          placeholderTextColor={C.onSurfaceVariant}
          multiline returnKeyType="done" blurOnSubmit
        />

        {/* Plan totals */}
        {hasMeals && (
          <View style={{ backgroundColor: C.surfaceContainer, borderRadius: Radius.lg, marginBottom: Spacing.lg }}>
            <View style={s.macroTotals}>
              {[
                { label: 'Calories', value: `${totalCal}` },
                { label: 'Protein',  value: `${Math.round(totalProt)}g` },
                { label: 'Carbs',    value: `${Math.round(totalCarbs)}g` },
                { label: 'Fat',      value: `${Math.round(totalFat)}g` },
              ].map(({ label, value }) => (
                <View key={label} style={s.macroCell}>
                  <Text style={s.macroValue}>{value}</Text>
                  <Text style={s.macroLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Meals grouped by type */}
        {!hasMeals && (
          <View style={s.emptyBox}>
            <IconSymbol name="fork.knife" size={40} color={C.outlineVariant} />
            <Text style={s.emptyText}>No meals yet</Text>
            <Text style={s.emptySub}>Tap a meal type below to start adding items</Text>
          </View>
        )}

        {MEAL_TYPES.map((type) => {
          const typeMeals  = meals.filter((m) => m.meal_type === type);
          const isExpanded = expandedType === type;
          const typeCal    = typeMeals.reduce((s, m) => s + (parseInt(m.calories) || 0), 0);

          return (
            <View key={type} style={s.typeSection}>
              {/* Section header */}
              <TouchableOpacity
                style={s.typeHeader}
                onPress={() => setExpandedType(isExpanded ? null : type)}
                activeOpacity={0.8}>
                <IconSymbol name={MEAL_ICONS[type] as any} size={15} color={C.primary} />
                <Text style={s.typeLabel}>{MEAL_LABELS[type]}</Text>
                {typeMeals.length > 0 && (
                  <Text style={s.typeMeta}>{typeMeals.length} · {typeCal} kcal</Text>
                )}
                <IconSymbol name={isExpanded ? 'chevron.up' : 'chevron.down'} size={14} color={C.onSurfaceVariant} />
              </TouchableOpacity>

              {/* Meals in this type */}
              {isExpanded && (
                <>
                  {typeMeals.map((meal) => (
                    <View key={meal.id} style={s.mealRow}>
                      <View style={s.mealInfo}>
                        <Text style={s.mealName}>{meal.name}</Text>
                        <Text style={s.mealMeta}>
                          {meal.calories} kcal · {meal.protein}P {meal.carbs}C {meal.fat}F
                          {meal.notes ? ` · ${meal.notes}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => openEdit(meal)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <IconSymbol name="pencil" size={15} color={C.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteMeal(meal.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <IconSymbol name="trash" size={15} color={C.error} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity style={s.addMealBtn} onPress={() => openAdd(type)}>
                    <IconSymbol name="plus.circle.fill" size={15} color={C.primary} />
                    <Text style={s.addMealText}>Add {MEAL_LABELS[type]}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        })}

        {saveError ? <Text style={s.saveErrorText}>{saveError}</Text> : null}
      </ScrollView>

      <MealModal
        visible={mealModal.visible}
        initialMeal={mealModal.meal}
        onClose={() => setMealModal((m) => ({ ...m, visible: false }))}
        onSave={mealModal.isEdit ? handleMealSave : handleMealSaveMulti}
      />
    </SafeAreaView>
  );
}
