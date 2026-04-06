import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ── Top bar ─────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleInput: {
    flex: 1,
    ...Typography.headlineMd,
    color: Colors.onSurface,
    paddingVertical: 0,
  },
  saveBtn: {
    paddingHorizontal: Spacing.md,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 56,
  },
  saveBtnText: { ...Typography.titleMd, color: Colors.background },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 60 },

  // ── Description ─────────────────────────────────────────────────────────────
  descInput: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    paddingVertical: Spacing.sm,
  },

  // ── Empty state ─────────────────────────────────────────────────────────────
  emptyDays: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.outlineVariant,
  },
  emptyDaysText:  { ...Typography.titleMd, color: Colors.onSurface, marginBottom: Spacing.xs },
  emptyDaysSub:   { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },

  // ── Day card ─────────────────────────────────────────────────────────────────
  dayCard: {
    backgroundColor: Colors.surfaceContainer,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  dayCardExpanded: {
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  dayNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  dayNumberText:  { ...Typography.labelLg, color: Colors.primary },
  dayNameInput: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    padding: 0,
    marginBottom: 2,
  },
  dayFocusInput: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    padding: 0,
  },
  dayToggleBtn: { padding: 4 },
  dayDeleteBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: Colors.error + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // collapsed summary
  dayCollapsedRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  dayCollapsedText: { ...Typography.labelLg, color: Colors.onSurfaceVariant },
  dayCollapsedExs: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },

  // ── Exercises within a day ───────────────────────────────────────────────────
  dayExercises: {
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  exName:  { ...Typography.titleMd, color: Colors.onSurface },
  exChips: { flexDirection: 'row', gap: Spacing.xs, marginTop: 4, flexWrap: 'wrap' },
  exChip: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  exChipHighlight: {
    backgroundColor: Colors.primary + '22',
    color: Colors.primary,
  },
  exEditBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exDeleteBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: Colors.error + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // inline edit
  exInlineEdit: {
    backgroundColor: Colors.surfaceContainerHigh,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  inlineEditRow: { flexDirection: 'row', gap: Spacing.sm },
  inlineField: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  inlineLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  inlineInput: {
    ...Typography.titleMd,
    color: Colors.onSurface,
    padding: 0,
  },

  // add exercise button (within day)
  addExerciseInDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary + '55',
    gap: Spacing.xs,
  },
  addExerciseInDayText: { ...Typography.labelLg, color: Colors.primary },

  // ── Add day button ───────────────────────────────────────────────────────────
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary + '55',
    gap: Spacing.sm,
  },
  addDayBtnText: { ...Typography.titleMd, color: Colors.primary },

  // ── Error text ───────────────────────────────────────────────────────────────
  saveErrorText: {
    ...Typography.labelLg,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
  },

  // ── Add Exercise Modal ───────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    maxHeight: '88%',
  },
  modalSheetInner: { paddingHorizontal: Spacing.lg },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  modalBackBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleInRow: { ...Typography.headlineMd, color: Colors.onSurface, flex: 1 },

  // search bar
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.lg,
  },
  searchBarInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    ...Typography.titleMd,
    color: Colors.onSurface,
  },

  // exercise list
  exerciseList: { flexGrow: 0 },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  exerciseListName:   { ...Typography.titleMd, color: Colors.onSurface, flex: 1 },
  exerciseListMuscle: {
    ...Typography.labelMd,
    color: Colors.primary,
    backgroundColor: Colors.primary + '18',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  createCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  createCustomText: { ...Typography.titleMd, color: Colors.primary, flex: 1 },
  listEmptyText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },

  // configure phase fields
  fieldLabel: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  fieldInput: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.titleMd,
    color: Colors.onSurface,
  },
  fieldRow:  { flexDirection: 'row', gap: Spacing.sm },
  fieldHalf: { flex: 1 },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  modalCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: { ...Typography.titleMd, color: Colors.onSurfaceVariant },
  modalAddBtn: {
    flex: 2,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAddText: { ...Typography.titleLg, color: Colors.background },
});
