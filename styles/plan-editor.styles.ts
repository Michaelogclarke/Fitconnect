import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Spacing, Radius, ColorSet } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useTypography } from '@/contexts/PrefsContext';

export function useStyles() {
  const C = useColors();
  const T = useTypography();
  return useMemo(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },

  // ── Top bar ─────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: C.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleInput: {
    flex: 1,
    ...T.headlineMd,
    color: C.onSurface,
    paddingVertical: 0,
  },
  saveBtn: {
    paddingHorizontal: Spacing.md,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 56,
  },
  saveBtnText: { ...T.titleMd, color: C.background },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 60 },

  // ── Description ─────────────────────────────────────────────────────────────
  descInput: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    paddingVertical: Spacing.sm,
  },

  // ── Empty state ─────────────────────────────────────────────────────────────
  emptyDays: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.outlineVariant,
  },
  emptyDaysText:  { ...T.titleMd, color: C.onSurface, marginBottom: Spacing.xs },
  emptyDaysSub:   { ...T.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' },

  // ── Day card ─────────────────────────────────────────────────────────────────
  dayCard: {
    backgroundColor: C.surfaceContainer,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  dayCardExpanded: {
    borderWidth: 1,
    borderColor: C.primary + '44',
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
    backgroundColor: C.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  dayNumberText:  { ...T.labelLg, color: C.primary },
  dayNameInput: {
    ...T.titleLg,
    color: C.onSurface,
    padding: 0,
    marginBottom: 2,
  },
  dayFocusInput: {
    ...T.labelLg,
    color: C.onSurfaceVariant,
    padding: 0,
  },
  dayToggleBtn: { padding: 4 },
  dayDeleteBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: C.error + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // collapsed summary
  dayCollapsedRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  dayCollapsedText: { ...T.labelLg, color: C.onSurfaceVariant },
  dayCollapsedExs: {
    ...T.labelMd,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },

  // ── Exercises within a day ───────────────────────────────────────────────────
  dayExercises: {
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
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
  exName:  { ...T.titleMd, color: C.onSurface },
  exChips: { flexDirection: 'row', gap: Spacing.xs, marginTop: 4, flexWrap: 'wrap' },
  exChip: {
    ...T.labelMd,
    color: C.onSurfaceVariant,
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  exChipHighlight: {
    backgroundColor: C.primary + '22',
    color: C.primary,
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
    backgroundColor: C.error + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // inline edit
  exInlineEdit: {
    backgroundColor: C.surfaceContainerHigh,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: C.primary + '33',
  },
  inlineEditRow: { flexDirection: 'row', gap: Spacing.sm },
  inlineField: {
    flex: 1,
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  inlineLabel: {
    ...T.labelMd,
    color: C.onSurfaceVariant,
    marginBottom: 4,
  },
  inlineInput: {
    ...T.titleMd,
    color: C.onSurface,
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
    borderColor: C.primary + '55',
    gap: Spacing.xs,
  },
  addExerciseInDayText: { ...T.labelLg, color: C.primary },

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
    borderColor: C.primary + '55',
    gap: Spacing.sm,
  },
  addDayBtnText: { ...T.titleMd, color: C.primary },

  // ── Error text ───────────────────────────────────────────────────────────────
  saveErrorText: {
    ...T.labelLg,
    color: C.error,
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
    backgroundColor: C.surfaceContainerLow,
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
    backgroundColor: C.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...T.headlineMd,
    color: C.onSurface,
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
    backgroundColor: C.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleInRow: { ...T.headlineMd, color: C.onSurface, flex: 1 },

  // search bar
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.lg,
  },
  searchBarInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    ...T.titleMd,
    color: C.onSurface,
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
    borderBottomColor: C.outlineVariant,
  },
  exerciseListName:   { ...T.titleMd, color: C.onSurface, flex: 1 },
  exerciseListMuscle: {
    ...T.labelMd,
    color: C.primary,
    backgroundColor: C.primary + '18',
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
  createCustomText: { ...T.titleMd, color: C.primary, flex: 1 },
  listEmptyText: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },

  // configure phase fields
  fieldLabel: {
    ...T.labelLg,
    color: C.onSurfaceVariant,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  fieldInput: {
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...T.titleMd,
    color: C.onSurface,
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
    backgroundColor: C.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: { ...T.titleMd, color: C.onSurfaceVariant },
  modalAddBtn: {
    flex: 2,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAddText: { ...T.titleLg, color: C.background },
}), [C, T]);
}
