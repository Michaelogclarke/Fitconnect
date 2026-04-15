import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  RefreshControl,
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

import AsyncStorage from '@react-native-async-storage/async-storage';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { NumericInput } from '@/components/ui/numeric-input';
import { Spacing } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useStyles } from '@/styles/tabs/nutrition.styles';
import { supabase } from '@/lib/supabase';
import { toLocalDate } from '@/lib/format';
import { getCachedAny, setCached, CACHE_KEYS } from '@/lib/cache';

const SAVED_FOODS_KEY = 'nutrition:saved_foods';

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mealTypeForNow(): MealType {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 18) return 'dinner';
  return 'snack';
}

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
  onEdit,
}: {
  log:      FoodLog;
  onDelete: () => void;
  onEdit:   () => void;
}) {
  const C = useColors();
  const styles = useStyles();
  const DELETE_W   = 76;
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen     = useRef(false);
  const [rowWidth, setRowWidth] = useState(0);

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

  const macros = [
    log.protein_g > 0 ? { label: 'P', value: log.protein_g, color: C.primary } : null,
    log.carbs_g   > 0 ? { label: 'C', value: log.carbs_g,   color: '#70aaff'       } : null,
    log.fat_g     > 0 ? { label: 'F', value: log.fat_g,     color: C.success  } : null,
  ].filter(Boolean) as { label: string; value: number; color: string }[];

  return (
    <View
      style={styles.foodRowContainer}
      onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
      <Animated.View
        style={{ flexDirection: 'row', transform: [{ translateX }] }}
        {...pan.panHandlers}>
        {/* Food content — locked to container width so delete stays hidden */}
        <TouchableOpacity
          style={[styles.foodRow, rowWidth > 0 && { width: rowWidth }]}
          onPress={onEdit}
          activeOpacity={0.7}>
          <View style={styles.foodInfo}>
            <Text style={styles.foodName} numberOfLines={1}>{log.name}</Text>
            {macros.length > 0 && (
              <View style={styles.foodMacroRow}>
                {macros.map((m) => (
                  <View key={m.label} style={styles.foodMacroPill}>
                    <Text style={[styles.foodMacroText, { color: m.color }]}>
                      {m.label} {m.value}g
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Text style={styles.foodCals}>{log.calories} kcal</Text>
        </TouchableOpacity>

        {/* Delete action revealed on swipe */}
        <TouchableOpacity style={styles.deleteAction} onPress={onDelete}>
          <IconSymbol name="trash.fill" size={20} color="#fff" />
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
  const C = useColors();
  const styles = useStyles();
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
          <ActivityIndicator color={C.primary} />
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
              <ActivityIndicator color={C.primary} />
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
  editLog,
  targetMealType,
  onClose,
  onAdded,
  onEdited,
}: {
  visible:         boolean;
  viewDate:        Date;
  editLog?:        FoodLog;
  targetMealType?: MealType;
  onClose:         () => void;
  onAdded:         (log: FoodLog) => void;
  onEdited:        (log: FoodLog) => void;
}) {
  const C = useColors();
  const styles = useStyles();
  const isEditMode = !!editLog;
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
  const [mealType,       setMealType]       = useState<MealType>(mealTypeForNow());
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');

  // Recent + search
  const [recentFoods,   setRecentFoods]   = useState<RecentFood[]>([]);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<ScannedProduct[]>([]);
  const [searching,     setSearching]     = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Saved foods + tab
  const [savedFoods,   setSavedFoods]   = useState<RecentFood[]>([]);
  const [activePickTab, setActivePickTab] = useState<'recent' | 'saved'>('recent');
  const [isSaved,      setIsSaved]      = useState(false);

  // Pre-fill form when editing an existing log; set meal type when opening for specific meal
  useEffect(() => {
    if (!visible) return;
    if (editLog) {
      setFoodName(editLog.name);
      setCalories(String(editLog.calories));
      setProtein(String(editLog.protein_g));
      setCarbs(String(editLog.carbs_g));
      setFat(String(editLog.fat_g));
      setMealType(editLog.meal_type);
      setPhase('configure');
    } else {
      setMealType(targetMealType ?? mealTypeForNow());
    }
  }, [visible, editLog, targetMealType]);

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

  // Load saved foods when modal opens
  useEffect(() => {
    if (!visible) return;
    AsyncStorage.getItem(SAVED_FOODS_KEY).then((val) => {
      if (val) setSavedFoods(JSON.parse(val));
    });
  }, [visible]);

  // Sync isSaved with current food name
  useEffect(() => {
    setIsSaved(
      !!foodName.trim() &&
      savedFoods.some((f) => f.name.toLowerCase() === foodName.trim().toLowerCase())
    );
  }, [foodName, savedFoods]);

  function handleSearchChange(text: string) {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.length < 2) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(() => doSearch(text), 500);
  }

  async function doSearch(query: string) {
    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=20&sort_by=unique_scans_n&fields=product_name,product_name_en,nutriments,brands&action=process`;
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

  async function toggleSaveFood(food: RecentFood) {
    const exists = savedFoods.some((f) => f.name.toLowerCase() === food.name.toLowerCase());
    const next   = exists
      ? savedFoods.filter((f) => f.name.toLowerCase() !== food.name.toLowerCase())
      : [food, ...savedFoods];
    setSavedFoods(next);
    await AsyncStorage.setItem(SAVED_FOODS_KEY, JSON.stringify(next));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function toggleSaveCurrentFood() {
    if (!foodName.trim()) return;
    const food: RecentFood = {
      name:      foodName.trim(),
      calories:  parseInt(calories, 10) || 0,
      protein_g: parseFloat(protein)   || 0,
      carbs_g:   parseFloat(carbs)     || 0,
      fat_g:     parseFloat(fat)       || 0,
    };
    await toggleSaveFood(food);
  }

  async function quickLog(food: RecentFood) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('food_logs')
        .insert({
          user_id:   user.id,
          name:      food.name,
          calories:  food.calories,
          protein_g: food.protein_g,
          carbs_g:   food.carbs_g,
          fat_g:     food.fat_g,
          meal_type: targetMealType ?? mealTypeForNow(),
          logged_at: toLocalDate(viewDate),
        })
        .select()
        .single();
      if (error) throw error;
      handleDone(data as FoodLog);
    } catch {}
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
    setActivePickTab('recent'); setIsSaved(false);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    onClose();
  }

  function handleDone(log: FoodLog) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isEditMode) onEdited(log);
    else onAdded(log);
    handleClose();
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

      const fields = {
        name:      foodName.trim(),
        calories:  cal,
        protein_g: parseFloat(protein) || 0,
        carbs_g:   parseFloat(carbs)   || 0,
        fat_g:     parseFloat(fat)     || 0,
        meal_type: mealType,
      };

      if (isEditMode && editLog) {
        const { data, error: updateErr } = await supabase
          .from('food_logs')
          .update(fields)
          .eq('id', editLog.id)
          .eq('user_id', user.id)
          .select()
          .single();
        if (updateErr) throw updateErr;
        handleDone(data as FoodLog);
      } else {
        const { data, error: insertErr } = await supabase
          .from('food_logs')
          .insert({ user_id: user.id, ...fields, logged_at: toLocalDate(viewDate) })
          .select()
          .single();
        if (insertErr) throw insertErr;
        handleDone(data as FoodLog);
      }
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>

            {phase === 'pick' ? (
              <>
                <Text style={styles.modalTitle}>Add Food</Text>

                {/* Search bar */}
                <View style={styles.searchBarContainer}>
                  <IconSymbol name="magnifyingglass" size={16} color={C.onSurfaceVariant} />
                  <TextInput
                    style={styles.searchBarInput}
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    placeholder="Search foods…"
                    placeholderTextColor={C.onSurfaceVariant}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                  {searching && <ActivityIndicator size="small" color={C.onSurfaceVariant} />}
                  {searchQuery.length > 0 && !searching && (
                    <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                      <IconSymbol name="xmark.circle.fill" size={16} color={C.onSurfaceVariant} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Tab row — hidden while searching */}
                {searchQuery.length < 2 && (
                  <View style={styles.pickTabRow}>
                    {(['recent', 'saved'] as const).map((tab) => (
                      <TouchableOpacity
                        key={tab}
                        style={[styles.pickTab, activePickTab === tab && styles.pickTabActive]}
                        onPress={() => setActivePickTab(tab)}>
                        <Text style={[styles.pickTabText, activePickTab === tab && styles.pickTabTextActive]}>
                          {tab === 'recent' ? 'Recent' : 'Saved'}
                        </Text>
                        {tab === 'saved' && savedFoods.length > 0 && (
                          <View style={styles.pickTabBadge}>
                            <Text style={styles.pickTabBadgeText}>{savedFoods.length}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Fixed-height results area */}
                <View style={styles.pickResultsArea}>
                  {searchQuery.length >= 2 ? (
                    // ── Search results ────────────────────────────────────────
                    searchResults.length > 0 ? (
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
                            <IconSymbol name="chevron.right" size={14} color={C.onSurfaceVariant} />
                          </TouchableOpacity>
                        ))}
                      </>
                    ) : !searching ? (
                      <Text style={[styles.mealEmptyText, { textAlign: 'center', paddingVertical: Spacing.md }]}>
                        No results — try a different term
                      </Text>
                    ) : null
                  ) : activePickTab === 'recent' ? (
                    // ── Recent ────────────────────────────────────────────────
                    recentFoods.length > 0 ? (
                      recentFoods.map((food, i) => {
                        const alreadySaved = savedFoods.some(
                          (f) => f.name.toLowerCase() === food.name.toLowerCase()
                        );
                        return (
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
                            <Text style={styles.quickPickCals}>{food.calories}</Text>
                            <TouchableOpacity
                              style={styles.foodActionBtn}
                              onPress={() => toggleSaveFood(food)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                              <IconSymbol
                                name={alreadySaved ? 'star.fill' : 'star'}
                                size={16}
                                color={alreadySaved ? C.primary : C.onSurfaceVariant}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.foodActionBtn}
                              onPress={() => quickLog(food)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                              <IconSymbol name="plus.circle.fill" size={18} color={C.primary} />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text style={[styles.mealEmptyText, { textAlign: 'center', paddingVertical: Spacing.md }]}>
                        No recent foods yet
                      </Text>
                    )
                  ) : (
                    // ── Saved ─────────────────────────────────────────────────
                    savedFoods.length > 0 ? (
                      savedFoods.map((food, i) => (
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
                          <Text style={styles.quickPickCals}>{food.calories}</Text>
                          <TouchableOpacity
                            style={styles.foodActionBtn}
                            onPress={() => toggleSaveFood(food)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <IconSymbol name="star.fill" size={16} color={C.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.foodActionBtn}
                            onPress={() => quickLog(food)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <IconSymbol name="plus.circle.fill" size={18} color={C.primary} />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={[styles.mealEmptyText, { textAlign: 'center', paddingVertical: Spacing.md }]}>
                        No saved foods yet — tap ★ on a recent food
                      </Text>
                    )
                  )}
                </View>

                {/* Method buttons */}
                <TouchableOpacity
                  style={styles.methodBtn}
                  onPress={() => setShowScan(true)}>
                  <View style={styles.methodBtnIcon}>
                    <IconSymbol name="barcode.viewfinder" size={22} color={C.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodBtnTitle}>Scan Barcode</Text>
                    <Text style={styles.methodBtnSub}>Auto-fill from product label</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={C.onSurfaceVariant} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.methodBtn}
                  onPress={() => setPhase('configure')}>
                  <View style={styles.methodBtnIcon}>
                    <IconSymbol name="pencil" size={22} color={C.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodBtnTitle}>Enter Manually</Text>
                    <Text style={styles.methodBtnSub}>Type in the details yourself</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={C.onSurfaceVariant} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalCancelBtn} onPress={handleClose}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  {!scannedProduct && !isEditMode && (
                    <TouchableOpacity onPress={() => setPhase('pick')}>
                      <IconSymbol name="chevron.left" size={20} color={C.onSurfaceVariant} />
                    </TouchableOpacity>
                  )}
                  <Text style={[styles.modalTitle, { flex: 1 }]}>
                    {isEditMode ? 'Edit Food' : scannedProduct ? 'Confirm Details' : 'Add Food'}
                  </Text>
                  {!isEditMode && (
                    <TouchableOpacity
                      onPress={toggleSaveCurrentFood}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <IconSymbol
                        name={isSaved ? 'star.fill' : 'star'}
                        size={20}
                        color={isSaved ? C.primary : C.onSurfaceVariant}
                      />
                    </TouchableOpacity>
                  )}
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
                      placeholderTextColor={C.onSurfaceVariant}
                      autoCapitalize="sentences"
                    />
                  </View>
                </View>

                {/* Quantity (for scanned products) */}
                {scannedProduct && (
                  <View style={styles.formCard}>
                    <View style={[styles.fieldRow, styles.fieldRowLast]}>
                      <Text style={styles.fieldLabel}>Quantity</Text>
                      <NumericInput
                        style={styles.fieldInput}
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="numeric"
                        placeholder="100"
                        placeholderTextColor={C.onSurfaceVariant}
                      />
                      <Text style={styles.fieldUnit}>g</Text>
                    </View>
                  </View>
                )}

                {/* Macros */}
                <View style={styles.formCard}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Calories</Text>
                    <NumericInput
                      style={styles.fieldInput}
                      value={calories}
                      onChangeText={setCalories}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={C.onSurfaceVariant}
                      editable={!scannedProduct}
                    />
                    <Text style={styles.fieldUnit}>kcal</Text>
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Protein</Text>
                    <NumericInput
                      style={styles.fieldInput}
                      value={protein}
                      onChangeText={setProtein}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={C.onSurfaceVariant}
                      editable={!scannedProduct}
                    />
                    <Text style={styles.fieldUnit}>g</Text>
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Carbs</Text>
                    <NumericInput
                      style={styles.fieldInput}
                      value={carbs}
                      onChangeText={setCarbs}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={C.onSurfaceVariant}
                      editable={!scannedProduct}
                    />
                    <Text style={styles.fieldUnit}>g</Text>
                  </View>
                  <View style={[styles.fieldRow, styles.fieldRowLast]}>
                    <Text style={styles.fieldLabel}>Fat</Text>
                    <NumericInput
                      style={styles.fieldInput}
                      value={fat}
                      onChangeText={setFat}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={C.onSurfaceVariant}
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
                      ? <ActivityIndicator size="small" color={C.background} />
                      : <Text style={styles.modalSaveText}>{isEditMode ? 'Save Changes' : 'Add Food'}</Text>}
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
  const C = useColors();
  const styles = useStyles();
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
          <Text style={styles.modalSubtitle}>
            Set your daily calorie and macro targets. A typical starting point is 2000 kcal · 150g protein · 200g carbs · 65g fat.
          </Text>

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
                <NumericInput
                  style={styles.goalsInput}
                  value={row.value}
                  onChangeText={row.set}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={C.onSurfaceVariant}
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
                ? <ActivityIndicator size="small" color={C.background} />
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
  const C = useColors();
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [viewDate,       setViewDate]       = useState(new Date());
  const [goals,          setGoals]          = useState<NutritionGoals>(DEFAULT_GOALS);
  const [logs,           setLogs]           = useState<FoodLog[]>([]);
  const [showAddModal,   setShowAddModal]   = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [editLog,        setEditLog]        = useState<FoodLog | undefined>(undefined);
  const [targetMeal,     setTargetMeal]     = useState<MealType | undefined>(undefined);
  // Meals with entries start expanded; empty meals start collapsed
  const [expandedMeals,  setExpandedMeals]  = useState<Set<MealType>>(new Set());

  useFocusEffect(
    useCallback(() => {
      loadData(viewDate);
    }, [viewDate])
  );

  // Expand meals that have logs when logs change
  useEffect(() => {
    setExpandedMeals((prev) => {
      const next = new Set(prev);
      MEAL_TYPES.forEach((meal) => {
        if (logs.some((l) => l.meal_type === meal)) next.add(meal);
      });
      return next;
    });
  }, [logs]);

  async function loadData(date: Date, silent = false) {
    const dateStr = toLocalDate(date);

    if (!silent) {
      const cached = await getCachedAny<NutritionDayCache>(CACHE_KEYS.NUTRITION_DAY);
      if (cached && cached.date === dateStr) {
        setGoals(cached.goals);
        setLogs(cached.logs);
        setLoading(false);
      } else {
        setLoading(true);
      }
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

  async function handleRefresh() {
    setRefreshing(true);
    await loadData(viewDate, true);
    setRefreshing(false);
  }

  async function deleteLog(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  function handleLogEdited(log: FoodLog) {
    const updated = logs.map((l) => l.id === log.id ? log : l);
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

  function toggleMeal(meal: MealType) {
    setExpandedMeals((prev) => {
      const next = new Set(prev);
      if (next.has(meal)) next.delete(meal); else next.add(meal);
      return next;
    });
  }

  const isToday = toLocalDate(viewDate) === toLocalDate(new Date());

  // Derived totals
  const totalCalories = logs.reduce((s, l) => s + l.calories,  0);
  const totalProtein  = logs.reduce((s, l) => s + l.protein_g, 0);
  const totalCarbs    = logs.reduce((s, l) => s + l.carbs_g,   0);
  const totalFat      = logs.reduce((s, l) => s + l.fat_g,     0);

  const calRemaining = goals.calories - totalCalories;
  const calPct       = Math.min(totalCalories / (goals.calories  || 1), 1);
  const proteinPct   = Math.min(totalProtein  / (goals.protein_g || 1), 1);
  const carbsPct     = Math.min(totalCarbs    / (goals.carbs_g   || 1), 1);
  const fatPct       = Math.min(totalFat      / (goals.fat_g     || 1), 1);

  const fabBottom = 60 + insets.bottom + Spacing.lg;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <TouchableOpacity style={styles.goalsBtn} onPress={() => setShowGoalsModal(true)}>
          <IconSymbol name="gearshape.fill" size={18} color={C.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Date navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.dateBtn} onPress={goToPrevDay}>
          <IconSymbol name="chevron.left" size={16} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatViewDate(viewDate)}</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={goToNextDay} disabled={isToday}>
          <IconSymbol name="chevron.right" size={16} color={isToday ? C.outlineVariant : C.onSurface} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
          }>

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

            {/* Remaining calories */}
            <Text style={[
              styles.calorieRemaining,
              { color: calRemaining < 0 ? C.error : C.onSurfaceVariant },
            ]}>
              {calRemaining < 0
                ? `${Math.abs(calRemaining)} kcal over`
                : `${calRemaining} kcal remaining`}
            </Text>

            <View style={styles.macroRow}>
              {[
                { label: 'Protein', total: totalProtein, goal: goals.protein_g, pct: proteinPct, color: C.primary },
                { label: 'Carbs',   total: totalCarbs,   goal: goals.carbs_g,   pct: carbsPct,   color: '#70aaff' },
                { label: 'Fat',     total: totalFat,     goal: goals.fat_g,     pct: fatPct,     color: C.success },
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
            const mealLogs  = logs.filter((l) => l.meal_type === meal);
            const mealCals  = mealLogs.reduce((s, l) => s + l.calories, 0);
            const isExpanded = expandedMeals.has(meal);
            return (
              <View key={meal} style={styles.mealSection}>
                <View style={styles.mealHeader}>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 }}
                    onPress={() => toggleMeal(meal)}
                    activeOpacity={0.7}>
                    <Text style={styles.mealLabel}>{MEAL_LABELS[meal]}</Text>
                    <IconSymbol
                      name={isExpanded ? 'chevron.left' : 'chevron.right'}
                      size={12}
                      color={C.onSurfaceVariant}
                      style={{ transform: [{ rotate: isExpanded ? '270deg' : '90deg' }] }}
                    />
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    {mealCals > 0 && <Text style={styles.mealCals}>{mealCals} kcal</Text>}
                    <TouchableOpacity
                      onPress={() => { setEditLog(undefined); setTargetMeal(meal); setShowAddModal(true); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <IconSymbol name="plus.circle.fill" size={18} color={C.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {isExpanded && (
                  mealLogs.length === 0 ? (
                    <View style={styles.mealEmpty}>
                      <Text style={styles.mealEmptyText}>Nothing logged yet</Text>
                    </View>
                  ) : (
                    mealLogs.map((log) => (
                      <SwipeableFoodRow
                        key={log.id}
                        log={log}
                        onDelete={() => deleteLog(log.id)}
                        onEdit={() => { setEditLog(log); setShowAddModal(true); }}
                      />
                    ))
                  )
                )}
              </View>
            );
          })}

        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={() => { setEditLog(undefined); setTargetMeal(undefined); setShowAddModal(true); }}>
        <IconSymbol name="plus.circle.fill" size={26} color={C.background} />
      </TouchableOpacity>

      <AddFoodModal
        visible={showAddModal}
        viewDate={viewDate}
        editLog={editLog}
        targetMealType={targetMeal}
        onClose={() => { setShowAddModal(false); setEditLog(undefined); setTargetMeal(undefined); }}
        onAdded={handleLogAdded}
        onEdited={handleLogEdited}
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
