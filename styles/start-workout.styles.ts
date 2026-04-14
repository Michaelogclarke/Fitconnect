import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Spacing, Radius, ColorSet } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useTypography } from '@/contexts/PrefsContext';

export const DELETE_WIDTH = 72;

export function useStyles() {
  const C = useColors();
  const T = useTypography();
  return useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },

  // ── Top bar ────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: C.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarCenter: { flex: 1 },
  topBarTitle: { ...T.titleLg, color: C.onSurface },
  topBarSub: { ...T.labelMd, color: C.onSurfaceVariant },
  timerBadge: {
    backgroundColor: C.primary + '22',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: C.primary + '44',
  },
  timerText: {
    ...T.titleMd,
    color: C.primary,
    fontVariant: ['tabular-nums'],
  },

  // ── Progress strip ─────────────────────────────────────────────────────────
  progressStrip: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressLabel: { ...T.labelLg, color: C.onSurfaceVariant },
  progressCount: { ...T.labelLg, color: C.primary },
  progressTrack: {
    height: 4,
    backgroundColor: C.outlineVariant,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: C.primary,
    borderRadius: Radius.full,
  },

  scrollContent: { paddingBottom: 100 },

  // ── Exercise section ───────────────────────────────────────────────────────
  exerciseSection: { marginBottom: Spacing.sm },
  exerciseSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  exerciseNameInput: {
    ...T.headlineMd,
    color: C.onSurface,
    flex: 1,
    padding: 0,
  },
  muscleChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: C.primary + '22',
  },
  muscleChipText: { ...T.labelMd, color: C.primary },
  sectionProgressBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: C.surfaceContainerHighest,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionProgressBadgeDone: { backgroundColor: C.primary + '22' },
  sectionProgressText: { ...T.labelMd, color: C.onSurfaceVariant },
  sectionProgressTextDone: { color: C.primary },

  // ── Previous performance strip ─────────────────────────────────────────────
  prevRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    backgroundColor: C.surfaceContainerHigh,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  prevText: {
    ...T.labelLg,
    color: C.onSurfaceVariant,
    flex: 1,
    opacity: 0.85,
  },

  // ── PR banner ──────────────────────────────────────────────────────────────
  prBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 7,
    backgroundColor: C.primary + '1a',
    borderBottomWidth: 1,
    borderBottomColor: C.primary + '33',
  },
  prBannerText: {
    ...T.labelLg,
    color: C.primary,
    fontWeight: '600' as const,
  },

  // ── Sets table ─────────────────────────────────────────────────────────────
  setsSection: { paddingHorizontal: Spacing.lg, marginBottom: 4 },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  setHeaderCell: {
    ...T.labelMd,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  colSet:    { width: 24 },
  colWeight: { width: 72 },
  colUnit:   { width: 24, textAlign: 'center' as const },
  colReps:   { width: 52, textAlign: 'center' as const },

  // ── Pill-shaped set row ────────────────────────────────────────────────────
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.md,
    paddingRight: 4,           // tight right so checkmark hugs the edge
    paddingVertical: 6,
    borderRadius: Radius.lg,   // 12 — rounded but not full pill
    marginBottom: 4,
    backgroundColor: C.surfaceContainer,
    gap: Spacing.xs,
  },
  setRowNext: {
    backgroundColor: C.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: C.primary + '55',
  },
  setRowDone: { opacity: 0.5 },
  setNumber: {
    ...T.labelLg,
    color: C.onSurfaceVariant,
    width: 20,
    textAlign: 'center',
  },

  // ── Boxed inputs ───────────────────────────────────────────────────────────
  inputBox: {
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  inputBoxActive: { borderColor: C.primary + '88' },
  inputReadOnly: { borderColor: 'transparent', backgroundColor: 'transparent' },
  weightInput: {
    ...T.titleMd,
    color: C.onSurface,
    width: 56,
    padding: 0,
    textAlign: 'center',
  },
  weightUnit: {
    ...T.labelLg,
    color: C.onSurfaceVariant,
    width: 20,
    textAlign: 'center',
  },
  repsInput: {
    ...T.titleMd,
    color: C.onSurface,
    width: 44,
    padding: 0,
    textAlign: 'center',
  },

  // ── Checkmark — flush at right end of pill ─────────────────────────────────
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: C.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',       // push to far right of pill
  },
  checkCircleDone: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  checkCircleNext: { borderColor: C.primary },

  // ── Inline rest timer chip (beside completed set) ──────────────────────────
  restChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: Spacing.lg,
    marginTop: 2,
    marginBottom: 4,
    gap: 5,
    backgroundColor: C.primary + '18',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: C.primary + '44',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  restChipText: {
    ...T.labelLg,
    color: C.primary,
    fontVariant: ['tabular-nums'],
  },
  restChipDone: {
    backgroundColor: C.success + '22',
    borderColor: C.success + '55',
  },
  restChipDoneText: { color: C.success },
  restChipSkip: {
    paddingLeft: 4,
  },

  // ── Swipe-to-delete action ─────────────────────────────────────────────────
  swipeDeleteAction: {
    backgroundColor: C.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: DELETE_WIDTH,
    borderRadius: Radius.lg,
  },
  swipeDeleteText: {
    ...T.labelMd,
    color: '#fff',
    marginTop: 3,
  },

  // ── Set action row (add set) ───────────────────────────────────────────────
  setActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginTop: 4,
    gap: Spacing.sm,
  },
  addSetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.primary + '55',
    gap: Spacing.xs,
  },
  addSetBtnText: { ...T.labelLg, color: C.primary },

  sectionDivider: {
    height: 1,
    backgroundColor: C.outlineVariant,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },

  addExerciseSection: { marginHorizontal: Spacing.lg, marginTop: Spacing.xl },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.primary + '55',
    gap: Spacing.sm,
  },
  addExerciseBtnText: { ...T.titleMd, color: C.primary },

  // ── Bottom bar ─────────────────────────────────────────────────────────────
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
    backgroundColor: C.background,
    gap: Spacing.xs,
  },
  bottomProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  bottomProgressText: { ...T.labelLg, color: C.onSurfaceVariant },
  bottomProgressCount: { ...T.labelLg, color: C.primary },
  btnFinish: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: C.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnFinishText: { ...T.titleLg, color: C.background },
  btnFinishDimmed: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: C.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  btnFinishDimmedText: { ...T.titleLg, color: C.onSurfaceVariant },
  btnCancel: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  btnCancelText: { ...T.labelLg, color: C.error, opacity: 0.8 },
  saveErrorText: {
    ...T.labelLg,
    color: C.error,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },

  // ── Add Exercise Modal ─────────────────────────────────────────────────────
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
  modalSheetInner: {
    paddingHorizontal: Spacing.lg,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: C.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modalBackBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: C.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: { ...T.headlineMd, color: C.onSurface, marginBottom: Spacing.lg },
  modalTitleInRow: { ...T.headlineMd, color: C.onSurface, flex: 1 },

  // Search bar
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  searchBarInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    ...T.titleMd,
    color: C.onSurface,
  },

  // Exercise list
  exerciseList: {
    flexGrow: 0,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  exerciseListName: {
    ...T.titleMd,
    color: C.onSurface,
    flex: 1,
  },
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
  createCustomText: {
    ...T.titleMd,
    color: C.primary,
    flex: 1,
  },
  emptyListText: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },

  // Configure phase
  selectedExerciseCard: {
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  selectedExerciseName: {
    ...T.headlineMd,
    color: C.onSurface,
    marginBottom: 4,
  },

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
  fieldRow: { flexDirection: 'row', gap: Spacing.sm },
  fieldHalf: { flex: 1 },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
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

  // ── Rest timer — adjust buttons ────────────────────────────────────────────
  restAdjustBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    backgroundColor: C.primary + '30',
  },
  restAdjustBtnText: { ...T.labelLg, color: C.primary },

  // ── Numpad ─────────────────────────────────────────────────────────────────
  numPadBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  numPadSheet: {
    backgroundColor: C.surfaceContainerLow,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.md,
  },
  numPadHandle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: C.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  numPadLabel: {
    ...T.labelLg,
    color: C.onSurfaceVariant,
    textAlign: 'center' as const,
    marginBottom: Spacing.xs,
  },
  numPadDisplay: {
    alignItems: 'center' as const,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  numPadDisplayText: {
    fontSize: 52,
    fontWeight: '700' as const,
    color: C.onSurface,
    fontVariant: ['tabular-nums'] as const,
    letterSpacing: -1,
  },
  numPadRow: {
    flexDirection: 'row' as const,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  numPadKey: {
    flex: 1,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: C.surfaceContainerHigh,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  numPadKeySpecial: {
    backgroundColor: C.surfaceContainerHighest,
  },
  numPadKeyText: {
    ...T.headlineMd,
    color: C.onSurface,
  },
  numPadDoneBtn: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: C.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: Spacing.xs,
  },
  numPadDoneBtnText: { ...T.titleLg, color: C.background },

  // ── Workout saved overlay ──────────────────────────────────────────────────
  savedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  savedCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    width: '80%',
  },
  savedIconBox: {
    width: 72, height: 72, borderRadius: Radius.full,
    backgroundColor: C.primary + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  savedTitle: { ...T.headlineMd, color: C.onSurface },
  savedStatsRow: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xs },
  savedStat: { alignItems: 'center', minWidth: 60 },
  savedStatValue: { ...T.headlineMd, color: C.primary },
  savedStatLabel: { ...T.labelMd, color: C.onSurfaceVariant, marginTop: 2 },
}), [C, T]);
}
