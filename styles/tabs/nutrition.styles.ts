import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Spacing, Radius, ColorSet } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useTypography } from '@/contexts/PrefsContext';

export function useStyles() {
  const C = useColors();
  const T = useTypography();
  return useMemo(() => StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingBottom: 120 },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: { ...T.headlineLg, color: C.onSurface },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  goalsBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: C.surfaceContainer,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Date nav ───────────────────────────────────────────────────────────────
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  dateBtn: {
    width: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: C.surfaceContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  dateText: { ...T.titleMd, color: C.onSurface, minWidth: 80, textAlign: 'center' },

  // ── Summary card ───────────────────────────────────────────────────────────
  summaryCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  calorieNum:    { ...T.displayMd, color: C.onSurface },
  calorieSep:    { ...T.titleMd, color: C.onSurfaceVariant },
  calorieGoal:   { ...T.titleMd, color: C.onSurfaceVariant },
  calorieLabel:  { ...T.labelLg, color: C.onSurfaceVariant, marginLeft: 4 },
  calorieBar: {
    height: 6, borderRadius: Radius.full,
    backgroundColor: C.surfaceContainerHighest,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  calorieBarFill: {
    height: '100%',
    backgroundColor: C.primary,
    borderRadius: Radius.full,
  },
  calorieRemaining: {
    ...T.labelLg,
    textAlign: 'right',
    marginBottom: Spacing.md,
    marginTop: -Spacing.xs,
  },
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  macroItem:  { flex: 1 },
  macroLabel: { ...T.labelMd, color: C.onSurfaceVariant, marginBottom: 4 },
  macroBar: {
    height: 6, borderRadius: Radius.full,
    backgroundColor: C.surfaceContainerHighest,
    overflow: 'hidden',
    marginBottom: 4,
  },
  macroBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  macroValue: { ...T.labelLg, color: C.onSurface },
  macroGoal:  { ...T.labelMd, color: C.onSurfaceVariant },

  // ── Meal section ───────────────────────────────────────────────────────────
  mealSection:   { marginHorizontal: Spacing.lg, marginTop: Spacing.lg },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mealLabel: {
    ...T.labelLg,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mealCals: { ...T.labelLg, color: C.onSurfaceVariant },
  mealEmpty: {
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  mealEmptyText: { ...T.labelLg, color: C.outlineVariant },

  // ── Food row ───────────────────────────────────────────────────────────────
  foodRowContainer: {
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.md,
    marginBottom: 4,
    overflow: 'hidden',
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: C.surfaceContainer,
  },
  foodInfo:    { flex: 1 },
  foodName:    { ...T.titleMd, color: C.onSurface },
  foodMacroRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  foodMacroPill: {
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  foodMacroText: { ...T.labelMd, fontWeight: '600' as const },
  foodCals:    { ...T.titleMd, color: C.primary },
  deleteAction: {
    backgroundColor: C.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 76,
    alignSelf: 'stretch',
  },

  // ── FAB ────────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  // ── Modal overlay + sheet ──────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.surfaceContainer,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  modalTitle:    { ...T.headlineMd, color: C.onSurface },
  modalSubtitle: { ...T.bodyMd, color: C.onSurfaceVariant },
  modalError:    { ...T.labelLg, color: C.error },

  // ── Method picker (phase 1) ────────────────────────────────────────────────
  methodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  methodBtnIcon: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: C.primary + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  methodBtnTitle: { ...T.titleMd, color: C.onSurface },
  methodBtnSub:   { ...T.labelLg, color: C.onSurfaceVariant, marginTop: 2 },

  // ── Add food form (phase 2) ────────────────────────────────────────────────
  formCard: {
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  fieldRowLast: {
    borderBottomWidth: 0,
  },
  fieldLabel: { ...T.titleMd, color: C.onSurface, width: 80 },
  fieldInput: {
    flex: 1,
    ...T.titleMd,
    color: C.onSurface,
    textAlign: 'right',
  },
  fieldUnit:  { ...T.labelLg, color: C.onSurfaceVariant },

  // ── Meal type pills ────────────────────────────────────────────────────────
  mealPills: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  mealPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: C.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  mealPillActive: {
    backgroundColor: C.primary + '22',
    borderColor: C.primary + '66',
  },
  mealPillText:       { ...T.labelLg, color: C.onSurfaceVariant },
  mealPillTextActive: { color: C.primary },

  // ── Modal action buttons ───────────────────────────────────────────────────
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  modalCancelBtn: {
    flex: 1, paddingVertical: Spacing.md,
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.md, alignItems: 'center',
  },
  modalCancelText: { ...T.titleMd, color: C.onSurfaceVariant },
  modalSaveBtn: {
    flex: 2, paddingVertical: Spacing.md,
    backgroundColor: C.primary,
    borderRadius: Radius.md, alignItems: 'center',
  },
  modalSaveText: { ...T.titleMd, color: C.background },

  // ── Barcode scanner ────────────────────────────────────────────────────────
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerCamera:    { flex: 1 },
  scannerCloseBtn: {
    position: 'absolute', top: 56, right: Spacing.lg,
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  scannerFrameOuter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  scannerFrame: {
    width: 240, height: 160,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    width: 28, height: 28,
    borderColor: C.primary,
    borderWidth: 3,
  },
  scannerStatus: {
    position: 'absolute', bottom: 80, left: Spacing.xl, right: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  scannerStatusText: { ...T.titleMd, color: '#fff', textAlign: 'center' },
  scannerStatusSub:  { ...T.labelLg, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  scannerNotFound: {
    backgroundColor: C.error + 'dd',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },

  // ── Goals modal ────────────────────────────────────────────────────────────
  goalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
    minHeight: 50,
  },
  goalsRowLast: { borderBottomWidth: 0 },
  goalsLabel:   { ...T.titleMd, color: C.onSurface, flex: 1 },
  goalsInput: {
    ...T.titleMd,
    color: C.onSurface,
    textAlign: 'right',
    width: 80,
  },
  goalsUnit: { ...T.labelLg, color: C.onSurfaceVariant, width: 24 },

  // ── Pick tabs (Recent / Saved) ─────────────────────────────────────────────
  pickTabRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pickTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: C.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  pickTabActive: {
    backgroundColor: C.primary + '22',
    borderColor: C.primary,
  },
  pickTabText: { ...T.labelLg, color: C.onSurfaceVariant },
  pickTabTextActive: { color: C.primary },
  pickTabBadge: {
    backgroundColor: C.primary,
    borderRadius: Radius.full,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  pickTabBadgeText: { ...T.labelMd, color: C.background, fontSize: 10 },

  // ── Fixed-height results container ────────────────────────────────────────
  pickResultsArea: {
    minHeight: 220,
  },

  // ── Food item action buttons (star + quick-log) ───────────────────────────
  foodActionBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Search bar ─────────────────────────────────────────────────────────────
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  searchBarInput: {
    flex: 1,
    ...T.titleMd,
    color: C.onSurface,
  },

  // ── Quick-pick list (recent + search results) ──────────────────────────────
  listSectionLabel: {
    ...T.labelMd,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  quickPickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: 4,
    gap: Spacing.sm,
  },
  quickPickInfo: { flex: 1 },
  quickPickName: { ...T.titleMd, color: C.onSurface },
  quickPickMeta: { ...T.labelLg, color: C.onSurfaceVariant, marginTop: 2 },
  quickPickCals: { ...T.labelLg, color: C.primary },
}), [C, T]);
}
