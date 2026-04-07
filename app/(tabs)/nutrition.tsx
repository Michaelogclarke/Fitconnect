import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { styles } from '@/styles/tabs/nutrition.styles';
import { supabase } from '@/lib/supabase';
import { toLocalDate } from '@/lib/format';
import { getCachedAny, setCached, CACHE_KEYS } from '@/lib/cache';

// ─── Types ────────────────────────────────────────────────────────────────────

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

type NutritionGoals = {
  calories:  number;
  protein_g: number;
  carbs_g:   number;
  fat_g:     number;
};

type FoodLog = {
  id:        string;
  name:      string;
  calories:  number;
  protein_g: number;
  carbs_g:   number;
  fat_g:     number;
  meal_type: MealType;
  logged_at: string;
};

type ScannedProduct = {
  name:    string;
  brand?:  string;
  per100g: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
};

type RecentFood = {
  name:      string;
  calories:  number;
  protein_g: number;
  carbs_g:   number;
  fat_g:     number;
};

type NutritionDayCache = { date: string; goals: NutritionGoals; logs: FoodLog[] };

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 65,
};

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch:     'Lunch',
  dinner:    'Dinner',
  snack:     'Snacks',
};

// ─── Swipeable food row ───────────────────────────────────────────────────────

function SwipeableFoodRow({
  log,
  onDelete,
}: {
  log:      FoodLog;
  onDelete: () => void;
}) {
  const DELETE_W   = 72;
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen     = useRef(false);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) + 5 && (gs.dx < 0 || isOpen.current),
      onPanResponderMove: (_, gs) => {
        const base = isOpen.current ? -DELETE_W : 0;
        translateX.setValue(Math.max(-DELETE_W, Math.min(0, base + gs.dx)));
      },
      onPanResponderRelease: (_, gs) => {
        const base = isOpen.current ? -DELETE_W : 0;
        if (base + gs.dx < -DELETE_W / 2) {
          Animated.spring(translateX, { toValue: -DELETE_W, useNativeDriver: true }).start();
          isOpen.current = true;
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          isOpen.current = false;
        }
      },
    })
  ).current;

  const macroStr = [
    log.protein_g > 0 ? `P ${log.protein_g}g` : null,
    log.carbs_g   > 0 ? `C ${log.carbs_g}g`   : null,
    log.fat_g     > 0 ? `F ${log.fat_g}g`     : null,
  ].filter(Boolean).join('  ·  ');

  return (
    <View style={styles.foodRowContainer}>
      <Animated.View
        style={{ flexDirection: 'row', transform: [{ translateX }] }}
        {...pan.panHandlers}>
        <View style={styles.foodRow}>
          <View style={styles.foodInfo}>
            <Text style={styles.foodName} numberOfLines={1}>{log.name}</Text>
            {!!macroStr && <Text style={styles.foodMeta}>{macroStr}</Text>}
          </View>
          <Text style={styles.foodCals}>{log.calories} kcal</Text>
        </View>
        <TouchableOpacity style={styles.deleteAction} onPress={onDelete}>
          <IconSymbol name="trash.fill" size={18} color="#fff" />
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Barcode scanner modal ────────────────────────────────────────────────────

function BarcodeScannerModal({
  visible,
  onClose,
  onProductFound,
}: {
  visible:        boolean;
  onClose:        () => void;
  onProductFound: (product: ScannedProduct) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [fetching,   setFetching]   = useState(false);
  const [notFound,   setNotFound]   = useState(false);
  const scanLock = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      scanLock.current = false;
      setFetching(false);
      setNotFound(false);
    }
  }, [visible]);

  async function handleBarcodeScanned({ data: barcode }: { data: string }) {
    if (scanLock.current) return;
    scanLock.current = true;
    setFetching(true);
    setNotFound(false);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const json = await res.json();

      if (json.status !== 1 || !json.product) {
        setFetching(false);
        setNotFound(true);
        scanLock.current = false;
        return;
      }

      const p = json.product;
      const n = p.nutriments ?? {};

      const product: ScannedProduct = {
        name: (p.product_name_en || p.product_name || p.abbreviated_product_name || '').trim(),
        per100g: {
          calories:  n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0,
          protein_g: n.proteins_100g       ?? n.proteins       ?? 0,
          carbs_g:   n.carbohydrates_100g  ?? n.carbohydrates  ?? 0,
          fat_g:     n.fat_100g            ?? n.fat            ?? 0,
        },
      };

      setFetching(false);
      onProductFound(product);
      onClose();
    } catch {
      setFetching(false);
      scanLock.current = false;
    }
  }

  if (!visible) return null;

  // Permission not yet determined
  if (!permission) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <View style={[styles.scannerContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </Modal>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={[styles.scannerContainer, { justifyContent: 'center', alignItems: 'center', padding: 32 }]} edges={['top']}>
          <Text style={{ ...styles.scannerStatusText, marginBottom: 16, textAlign: 'center' }}>
            Camera access is required to scan barcodes.
          </Text>
          <TouchableOpacity
            style={styles.modalSaveBtn}
            onPress={requestPermission}>
            <Text style={styles.modalSaveText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 12 }} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
          onBarcodeScanned={fetching ? undefined : handleBarcodeScanned}
        />

        {/* Corner frame */}
        <View style={styles.scannerFrameOuter} pointerEvents="none">
          <View style={styles.scannerFrame}>
            {/* top-left */}
            <View style={[styles.scannerCorner, { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 }]} />
            {/* top-right */}
            <View style={[styles.scannerCorner, { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 }]} />
            {/* bottom-left */}
            <View style={[styles.scannerCorner, { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 }]} />
            {/* bottom-right */}
            <View style={[styles.scannerCorner, { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 }]} />
          </View>
        </View>

        {/* Close button */}
        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, right: Spacing.lg }}>
          <TouchableOpacity style={styles.scannerCloseBtn} onPress={onClose}>
            <IconSymbol name="xmark.circle.fill" size={20} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Status */}
        <View style={styles.scannerStatus}>
          {fetching ? (
            <>
              <ActivityIndicator color={Colors.primary} />
              <Text style={[styles.scannerStatusText, { marginTop: 8 }]}>Looking up product…</Text>
            </>
          ) : notFound ? (
            <View style={styles.scannerNotFound}>
              <Text style={styles.scannerStatusText}>Product not found</Text>
              <Text style={styles.scannerStatusSub}>Try again or enter manually</Text>
            </View>
          ) : (
            <>
              <Text style={styles.scannerStatusText}>Point at a barcode</Text>
              <Text style={styles.scannerStatusSub}>EAN-13, EAN-8, UPC-A supported</Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Add food modal ───────────────────────────────────────────────────────────

function AddFoodModal({
  visible,
  viewDate,
  onClose,
  onAdded,
}: {
  visible:  boolean;
  viewDate: Date;
  onClose:  () => void;
  onAdded:  (log: FoodLog) => void;
}) {
  type Phase = 'pick' | 'configure';
  const [phase,    setPhase]    = useState<Phase>('pick');
  const [showScan, setShowScan] = useState(false);

  // Form fields
  const [foodName,       setFoodName]       = useState('');
  const [quantity,       setQuantity]       = useState('100');
  const [calories,       setCalories]       = useState('');
  const [protein,        setProtein]        = useState('');
  const [carbs,          setCarbs]          = useState('');
  const [fat,            setFat]            = useState('');
  const [mealType,       setMealType]       = useState<MealType>('breakfast');
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');

  // Recent + search
  const [recentFoods,   setRecentFoods]   = useState<RecentFood[]>([]);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<ScannedProduct[]>([]);
  const [searching,     setSearching]     = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent foods when modal opens
  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('food_logs')
          .select('name, calories, protein_g, carbs_g, fat_g')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30);
        if (!data) return;
        const seen = new Set<string>();
        const unique: RecentFood[] = [];
        for (const item of data) {
          const key = item.name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item as RecentFood);
            if (unique.length >= 6) break;
          }
        }
        setRecentFoods(unique);
      } catch {}
    })();
  }, [visible]);

  function handleSearchChange(text: string) {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.length < 2) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(() => doSearch(text), 500);
  }

  async function doSearch(query: string) {
    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=10&fields=product_name,product_name_en,nutriments,brands&action=process`;
      const res  = await fetch(url);
      const json = await res.json();
      const results: ScannedProduct[] = (json.products ?? [])
        .map((p: any) => {
          const n    = p.nutriments ?? {};
          const name = (p.product_name_en || p.product_name || '').trim();
          if (!name) return null;
          return {
            name,
            brand: p.brands?.split(',')[0]?.trim() || undefined,
            per100g: {
              calories:  n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0,
              protein_g: n.proteins_100g       ?? n.proteins       ?? 0,
              carbs_g:   n.carbohydrates_100g  ?? n.carbohydrates  ?? 0,
              fat_g:     n.fat_100g            ?? n.fat            ?? 0,
            },
          };
        })
        .filter(Boolean)
        .filter((p: ScannedProduct) => p.per100g.calories > 0)
        .slice(0, 6);
      setSearchResults(results);
    } catch {}
    setSearching(false);
  }

  function handleRecentPick(food: RecentFood) {
    setFoodName(food.name);
    setCalories(String(food.calories));
    setProtein(String(food.protein_g));
    setCarbs(String(food.carbs_g));
    setFat(String(food.fat_g));
    setScannedProduct(null);
    setPhase('configure');
  }

  // Auto-recalculate macros when quantity changes (scanned products only)
  useEffect(() => {
    if (!scannedProduct) return;
    const f = (parseFloat(quantity) || 100) / 100;
    setCalories(String(Math.round(scannedProduct.per100g.calories * f)));
    setProtein((scannedProduct.per100g.protein_g * f).toFixed(1));
    setCarbs((scannedProduct.per100g.carbs_g * f).toFixed(1));
    setFat((scannedProduct.per100g.fat_g * f).toFixed(1));
  }, [quantity, scannedProduct]);

  function handleProductFound(product: ScannedProduct) {
    setScannedProduct(product);
    setFoodName(product.name);
    setPhase('configure');
  }

  function handleClose() {
    setPhase('pick');
    setShowScan(false);
    setFoodName(''); setQuantity('100'); setCalories('');
    setProtein(''); setCarbs(''); setFat('');
    setScannedProduct(null); setSaving(false); setError('');
    setSearchQuery(''); setSearchResults([]);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    onClose();
  }

  async function handleSave() {
    const cal = parseInt(calories, 10);
    if (!foodName.trim()) { setError('Food name is required'); return; }
    if (isNaN(cal) || cal < 0) { setError('Enter a valid calorie amount'); return; }

    setSaving(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const { data, error: insertErr } = await supabase
        .from('food_logs')
        .insert({
          user_id:   user.id,
          name:      foodName.trim(),
          calories:  cal,
          protein_g: parseFloat(protein) || 0,
          carbs_g:   parseFloat(carbs)   || 0,
          fat_g:     parseFloat(fat)     || 0,
          meal_type: mealType,
          logged_at: toLocalDate(viewDate),
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      onAdded(data as FoodLog);
      handleClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save');
      setSaving(false);
    }
  }

  return (
    <>
      <BarcodeScannerModal
        visible={showScan}
        onClose={() => setShowScan(false)}
        onProductFound={handleProductFound}
      />

      <Modal visible={visible && !showScan} transparent animationType="slide" onRequestClose={handleClose}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>

            {phase === 'pick' ? (
              <>
                <Text style={styles.modalTitle}>Add Food</Text>

                {/* Search bar */}
                <View style={styles.searchBarContainer}>
                  <IconSymbol name="magnifyingglass" size={16} color={Colors.onSurfaceVariant} />
                  <TextInput
                    style={styles.searchBarInput}
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    placeholder="Search foods…"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                  {searching && <ActivityIndicator size="small" color={Colors.onSurfaceVariant} />}
                  {searchQuery.length > 0 && !searching && (
                    <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                      <IconSymbol name="xmark.circle.fill" size={16} color={Colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Search results or recent foods */}
                {searchQuery.length >= 2 ? (
                  <View>
                    {searchResults.length > 0 ? (
                      <>
                        <Text style={styles.listSectionLabel}>Results</Text>
                        {searchResults.map((result, i) => (
                          <TouchableOpacity
                            key={i}
                            style={styles.quickPickItem}
                            onPress={() => handleProductFound(result)}>
                            <View style={styles.quickPickInfo}>
                              <Text style={styles.quickPickName} numberOfLines={1}>{result.name}</Text>
                              <Text style={styles.quickPickMeta}>
                                {result.brand ? `${result.brand} · ` : ''}per 100g · {Math.round(result.per100g.calories)} kcal
                              </Text>
                            </View>
                            <IconSymbol name="chevron.right" size={14} color={Colors.onSurfaceVariant} />
                          </TouchableOpacity>
                        ))}
                      </>
                    ) : !searching ? (
                      <Text style={[styles.mealEmptyText, { textAlign: 'center', paddingVertical: Spacing.sm }]}>
                        No results found
                      </Text>
                    ) : null}
                  </View>
                ) : recentFoods.length > 0 ? (
                  <View>
                    <Text style={styles.listSectionLabel}>Recent</Text>
                    {recentFoods.map((food, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.quickPickItem}
                        onPress={() => handleRecentPick(food)}>
                        <View style={styles.quickPickInfo}>
                          <Text style={styles.quickPickName} numberOfLines={1}>{food.name}</Text>
                          <Text style={styles.quickPickMeta}>
                            P {food.protein_g}g · C {food.carbs_g}g · F {food.fat_g}g
                          </Text>
                        </View>
                        <Text style={styles.quickPickCals}>{food.calories} kcal</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                {/* Method buttons */}
                <TouchableOpacity
                  style={styles.methodBtn}
                  onPress={() => setShowScan(true)}>
                  <View style={styles.methodBtnIcon}>
                    <IconSymbol name="barcode.viewfinder" size={22} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodBtnTitle}>Scan Barcode</Text>
                    <Text style={styles.methodBtnSub}>Auto-fill from product label</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.methodBtn}
                  onPress={() => setPhase('configure')}>
                  <View style={styles.methodBtnIcon}>
                    <IconSymbol name="pencil" size={22} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodBtnTitle}>Enter Manually</Text>
                    <Text style={styles.methodBtnSub}>Type in the details yourself</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalCancelBtn} onPress={handleClose}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  {!scannedProduct && (
                    <TouchableOpacity onPress={() => setPhase('pick')}>
                      <IconSymbol name="chevron.left" size={20} color={Colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  )}
                  <Text style={styles.modalTitle}>
                    {scannedProduct ? 'Confirm Details' : 'Add Food'}
                  </Text>
                </View>

                {/* Food name */}
                <View style={styles.formCard}>
                  <View style={[styles.fieldRow, styles.fieldRowLast]}>
                    <Text style={styles.fieldLabel}>Name</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={foodName}
                      onChangeText={setFoodName}
                      placeholder="Food name"
                      placeholderTextColor={Colors.onSurfaceVariant}
                      autoCapitalize="sentences"
                    />
                  </View>
                </View>

                {/* Quantity (for scanned products) */}
                {scannedProduct && (
                  <View style={styles.formCard}>
                    <View style={[styles.fieldRow, styles.fieldRowLast]}>
                      <Text style={styles.fieldLabel}>Quantity</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="numeric"
                        placeholder="100"
                        placeholderTextColor={Colors.onSurfaceVariant}
                      />
                      <Text style={styles.fieldUnit}>g</Text>
                    </View>
                  </View>
                )}

                {/* Macros */}
                <View style={styles.formCard}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Calories</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={calories}
                      onChangeText={setCalories}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.onSurfaceVariant}
                      editable={!scannedProduct}
                    />
                    <Text style={styles.fieldUnit}>kcal</Text>
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Protein</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={protein}
                      onChangeText={setProtein}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.onSurfaceVariant}
                      editable={!scannedProduct}
                    />
                    <Text style={styles.fieldUnit}>g</Text>
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Carbs</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={carbs}
                      onChangeText={setCarbs}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.onSurfaceVariant}
                      editable={!scannedProduct}
                    />
                    <Text style={styles.fieldUnit}>g</Text>
                  </View>
                  <View style={[styles.fieldRow, styles.fieldRowLast]}>
                    <Text style={styles.fieldLabel}>Fat</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={fat}
                      onChangeText={setFat}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.onSurfaceVariant}
                      editable={!scannedProduct}
                    />
                    <Text style={styles.fieldUnit}>g</Text>
                  </View>
                </View>

                {/* Meal type */}
                <View style={styles.mealPills}>
                  {MEAL_TYPES.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.mealPill, mealType === m && styles.mealPillActive]}
                      onPress={() => setMealType(m)}>
                      <Text style={[styles.mealPillText, mealType === m && styles.mealPillTextActive]}>
                        {MEAL_LABELS[m]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {!!error && <Text style={styles.modalError}>{error}</Text>}

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={handleClose}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={saving}>
                    {saving
                      ? <ActivityIndicator size="small" color={Colors.background} />
                      : <Text style={styles.modalSaveText}>Add Food</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─── Goals modal ──────────────────────────────────────────────────────────────

function NutritionGoalsModal({
  visible,
  goals,
  onClose,
  onSaved,
}: {
  visible: boolean;
  goals:   NutritionGoals;
  onClose: () => void;
  onSaved: (g: NutritionGoals) => void;
}) {
  const [calories,  setCalories]  = useState('');
  const [protein,   setProtein]   = useState('');
  const [carbs,     setCarbs]     = useState('');
  const [fat,       setFat]       = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (visible) {
      setCalories(String(goals.calories));
      setProtein(String(goals.protein_g));
      setCarbs(String(goals.carbs_g));
      setFat(String(goals.fat_g));
    }
  }, [visible, goals]);

  async function handleSave() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const updated: NutritionGoals = {
        calories:  parseInt(calories)  || DEFAULT_GOALS.calories,
        protein_g: parseInt(protein)   || DEFAULT_GOALS.protein_g,
        carbs_g:   parseInt(carbs)     || DEFAULT_GOALS.carbs_g,
        fat_g:     parseInt(fat)       || DEFAULT_GOALS.fat_g,
      };

      await supabase.from('nutrition_goals').upsert(
        { user_id: user.id, ...updated, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

      onSaved(updated);
      onClose();
    } catch {}
    setSaving(false);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Daily Goals</Text>

          <View style={styles.formCard}>
            {[
              { label: 'Calories',  value: calories, set: setCalories, unit: 'kcal' },
              { label: 'Protein',   value: protein,  set: setProtein,  unit: 'g'    },
              { label: 'Carbs',     value: carbs,    set: setCarbs,    unit: 'g'    },
              { label: 'Fat',       value: fat,      set: setFat,      unit: 'g'    },
            ].map((row, i, arr) => (
              <View
                key={row.label}
                style={[styles.goalsRow, i === arr.length - 1 && styles.goalsRowLast]}>
                <Text style={styles.goalsLabel}>{row.label}</Text>
                <TextInput
                  style={styles.goalsInput}
                  value={row.value}
                  onChangeText={row.set}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.onSurfaceVariant}
                />
                <Text style={styles.goalsUnit}>{row.unit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={Colors.background} />
                : <Text style={styles.modalSaveText}>Save Goals</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();

  const [loading,       setLoading]       = useState(true);
  const [viewDate,      setViewDate]      = useState(new Date());
  const [goals,         setGoals]         = useState<NutritionGoals>(DEFAULT_GOALS);
  const [logs,          setLogs]          = useState<FoodLog[]>([]);
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData(viewDate);
    }, [viewDate])
  );

  async function loadData(date: Date) {
    const dateStr = toLocalDate(date);

    // Show cached data for this date immediately
    const cached = await getCachedAny<NutritionDayCache>(CACHE_KEYS.NUTRITION_DAY);
    if (cached && cached.date === dateStr) {
      setGoals(cached.goals);
      setLogs(cached.logs);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [{ data: goalRow }, { data: logRows }] = await Promise.all([
        supabase.from('nutrition_goals').select('*').eq('user_id', user.id).single(),
        supabase.from('food_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('logged_at', dateStr)
          .order('created_at'),
      ]);

      const freshGoals = goalRow
        ? { calories: goalRow.calories, protein_g: goalRow.protein_g, carbs_g: goalRow.carbs_g, fat_g: goalRow.fat_g }
        : DEFAULT_GOALS;
      const freshLogs = (logRows ?? []) as FoodLog[];

      setGoals(freshGoals);
      setLogs(freshLogs);
      await setCached(CACHE_KEYS.NUTRITION_DAY, { date: dateStr, goals: freshGoals, logs: freshLogs });
    } catch {}

    setLoading(false);
  }

  async function deleteLog(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('food_logs').delete().eq('id', id).eq('user_id', user.id);
      const updated = logs.filter((l) => l.id !== id);
      setLogs(updated);
      await setCached(CACHE_KEYS.NUTRITION_DAY, { date: toLocalDate(viewDate), goals, logs: updated });
    } catch {}
  }

  function handleLogAdded(log: FoodLog) {
    const updated = [...logs, log];
    setLogs(updated);
    setCached(CACHE_KEYS.NUTRITION_DAY, { date: toLocalDate(viewDate), goals, logs: updated });
  }

  function handleGoalsSaved(newGoals: NutritionGoals) {
    setGoals(newGoals);
    setCached(CACHE_KEYS.NUTRITION_DAY, { date: toLocalDate(viewDate), goals: newGoals, logs });
  }

  function goToPrevDay() {
    setViewDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  }

  function goToNextDay() {
    const next = new Date(viewDate);
    next.setDate(next.getDate() + 1);
    const today = new Date(); today.setHours(23, 59, 59, 999);
    if (next <= today) setViewDate(next);
  }

  function formatViewDate(d: Date): string {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yd    = new Date(today); yd.setDate(yd.getDate() - 1);
    const check = new Date(d); check.setHours(0, 0, 0, 0);
    if (check.getTime() === today.getTime()) return 'Today';
    if (check.getTime() === yd.getTime())    return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  const isToday = toLocalDate(viewDate) === toLocalDate(new Date());

  // Derived totals
  const totalCalories = logs.reduce((s, l) => s + l.calories,  0);
  const totalProtein  = logs.reduce((s, l) => s + l.protein_g, 0);
  const totalCarbs    = logs.reduce((s, l) => s + l.carbs_g,   0);
  const totalFat      = logs.reduce((s, l) => s + l.fat_g,     0);

  const calPct     = Math.min(totalCalories / (goals.calories  || 1), 1);
  const proteinPct = Math.min(totalProtein  / (goals.protein_g || 1), 1);
  const carbsPct   = Math.min(totalCarbs    / (goals.carbs_g   || 1), 1);
  const fatPct     = Math.min(totalFat      / (goals.fat_g     || 1), 1);

  const fabBottom = 60 + insets.bottom + Spacing.lg;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <TouchableOpacity style={styles.goalsBtn} onPress={() => setShowGoalsModal(true)}>
          <IconSymbol name="gearshape.fill" size={18} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Date navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.dateBtn} onPress={goToPrevDay}>
          <IconSymbol name="chevron.left" size={16} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatViewDate(viewDate)}</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={goToNextDay} disabled={isToday}>
          <IconSymbol name="chevron.right" size={16} color={isToday ? Colors.outlineVariant : Colors.onSurface} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Daily summary card */}
          <View style={styles.summaryCard}>
            <View style={styles.calorieRow}>
              <Text style={styles.calorieNum}>{totalCalories}</Text>
              <Text style={styles.calorieSep}>/</Text>
              <Text style={styles.calorieGoal}>{goals.calories}</Text>
              <Text style={styles.calorieLabel}>kcal</Text>
            </View>

            <View style={styles.calorieBar}>
              <View style={[styles.calorieBarFill, { width: `${calPct * 100}%` }]} />
            </View>

            <View style={styles.macroRow}>
              {[
                { label: 'Protein', total: totalProtein, goal: goals.protein_g, pct: proteinPct, color: Colors.primary },
                { label: 'Carbs',   total: totalCarbs,   goal: goals.carbs_g,   pct: carbsPct,   color: '#70aaff' },
                { label: 'Fat',     total: totalFat,     goal: goals.fat_g,     pct: fatPct,     color: Colors.success },
              ].map((m) => (
                <View key={m.label} style={styles.macroItem}>
                  <Text style={styles.macroLabel}>{m.label}</Text>
                  <View style={styles.macroBar}>
                    <View style={[styles.macroBarFill, { width: `${m.pct * 100}%`, backgroundColor: m.color }]} />
                  </View>
                  <Text style={styles.macroValue}>{m.total.toFixed(0)}g</Text>
                  <Text style={styles.macroGoal}>/ {m.goal}g</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Meal sections */}
          {MEAL_TYPES.map((meal) => {
            const mealLogs = logs.filter((l) => l.meal_type === meal);
            const mealCals = mealLogs.reduce((s, l) => s + l.calories, 0);
            return (
              <View key={meal} style={styles.mealSection}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealLabel}>{MEAL_LABELS[meal]}</Text>
                  {mealCals > 0 && <Text style={styles.mealCals}>{mealCals} kcal</Text>}
                </View>

                {mealLogs.length === 0 ? (
                  <View style={styles.mealEmpty}>
                    <Text style={styles.mealEmptyText}>Nothing logged yet</Text>
                  </View>
                ) : (
                  mealLogs.map((log) => (
                    <SwipeableFoodRow key={log.id} log={log} onDelete={() => deleteLog(log.id)} />
                  ))
                )}
              </View>
            );
          })}

        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={() => setShowAddModal(true)}>
        <IconSymbol name="plus.circle.fill" size={26} color={Colors.background} />
      </TouchableOpacity>

      <AddFoodModal
        visible={showAddModal}
        viewDate={viewDate}
        onClose={() => setShowAddModal(false)}
        onAdded={handleLogAdded}
      />

      <NutritionGoalsModal
        visible={showGoalsModal}
        goals={goals}
        onClose={() => setShowGoalsModal(false)}
        onSaved={handleGoalsSaved}
      />
    </SafeAreaView>
  );
}
