import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
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
  headerTitle: { ...Typography.headlineLg, color: Colors.onSurface },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  goalsBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainer,
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
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  dateText: { ...Typography.titleMd, color: Colors.onSurface, minWidth: 80, textAlign: 'center' },

  // ── Summary card ───────────────────────────────────────────────────────────
  summaryCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceContainer,
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
  calorieNum:    { ...Typography.displayMd, color: Colors.onSurface },
  calorieSep:    { ...Typography.titleMd, color: Colors.onSurfaceVariant },
  calorieGoal:   { ...Typography.titleMd, color: Colors.onSurfaceVariant },
  calorieLabel:  { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginLeft: 4 },
  calorieBar: {
    height: 6, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHighest,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  calorieBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  macroItem:  { flex: 1 },
  macroLabel: { ...Typography.labelMd, color: Colors.onSurfaceVariant, marginBottom: 4 },
  macroBar: {
    height: 6, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHighest,
    overflow: 'hidden',
    marginBottom: 4,
  },
  macroBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  macroValue: { ...Typography.labelLg, color: Colors.onSurface },
  macroGoal:  { ...Typography.labelMd, color: Colors.onSurfaceVariant },

  // ── Meal section ───────────────────────────────────────────────────────────
  mealSection:   { marginHorizontal: Spacing.lg, marginTop: Spacing.lg },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  mealLabel: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mealCals: { ...Typography.labelLg, color: Colors.onSurfaceVariant },
  mealEmpty: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  mealEmptyText: { ...Typography.labelLg, color: Colors.outlineVariant },

  // ── Food row ───────────────────────────────────────────────────────────────
  foodRowContainer: {
    backgroundColor: Colors.surfaceContainer,
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
    backgroundColor: Colors.surfaceContainer,
  },
  foodInfo:    { flex: 1 },
  foodName:    { ...Typography.titleMd, color: Colors.onSurface },
  foodMeta:    { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginTop: 2 },
  foodCals:    { ...Typography.titleMd, color: Colors.primary },
  deleteAction: {
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    alignSelf: 'stretch',
  },
  deleteActionText: { ...Typography.labelLg, color: '#fff', marginTop: 4 },

  // ── FAB ────────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
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
    backgroundColor: Colors.surfaceContainer,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  modalTitle:    { ...Typography.headlineMd, color: Colors.onSurface },
  modalSubtitle: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  modalError:    { ...Typography.labelLg, color: Colors.error },

  // ── Method picker (phase 1) ────────────────────────────────────────────────
  methodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  methodBtnIcon: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.primary + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  methodBtnTitle: { ...Typography.titleMd, color: Colors.onSurface },
  methodBtnSub:   { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginTop: 2 },

  // ── Add food form (phase 2) ────────────────────────────────────────────────
  formCard: {
    backgroundColor: Colors.surfaceContainerHigh,
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
    borderBottomColor: Colors.outlineVariant,
  },
  fieldRowLast: {
    borderBottomWidth: 0,
  },
  fieldLabel: { ...Typography.titleMd, color: Colors.onSurface, width: 80 },
  fieldInput: {
    flex: 1,
    ...Typography.titleMd,
    color: Colors.onSurface,
    textAlign: 'right',
  },
  fieldUnit:  { ...Typography.labelLg, color: Colors.onSurfaceVariant },

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
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  mealPillActive: {
    backgroundColor: Colors.primary + '22',
    borderColor: Colors.primary + '66',
  },
  mealPillText:       { ...Typography.labelLg, color: Colors.onSurfaceVariant },
  mealPillTextActive: { color: Colors.primary },

  // ── Modal action buttons ───────────────────────────────────────────────────
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  modalCancelBtn: {
    flex: 1, paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.md, alignItems: 'center',
  },
  modalCancelText: { ...Typography.titleMd, color: Colors.onSurfaceVariant },
  modalSaveBtn: {
    flex: 2, paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md, alignItems: 'center',
  },
  modalSaveText: { ...Typography.titleMd, color: Colors.background },

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
    borderColor: Colors.primary,
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
  scannerStatusText: { ...Typography.titleMd, color: '#fff', textAlign: 'center' },
  scannerStatusSub:  { ...Typography.labelLg, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  scannerNotFound: {
    backgroundColor: Colors.error + 'dd',
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
    borderBottomColor: Colors.outlineVariant,
    minHeight: 50,
  },
  goalsRowLast: { borderBottomWidth: 0 },
  goalsLabel:   { ...Typography.titleMd, color: Colors.onSurface, flex: 1 },
  goalsInput: {
    ...Typography.titleMd,
    color: Colors.onSurface,
    textAlign: 'right',
    width: 80,
  },
  goalsUnit: { ...Typography.labelLg, color: Colors.onSurfaceVariant, width: 24 },
});
