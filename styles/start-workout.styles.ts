import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

export const DELETE_WIDTH = 72;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarCenter: { flex: 1 },
  topBarTitle: { ...Typography.titleLg, color: Colors.onSurface },
  topBarSub: { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  timerBadge: {
    backgroundColor: Colors.primary + '22',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  timerText: {
    ...Typography.titleMd,
    color: Colors.primary,
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
  progressLabel: { ...Typography.labelLg, color: Colors.onSurfaceVariant },
  progressCount: { ...Typography.labelLg, color: Colors.primary },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.outlineVariant,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.primary,
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
    ...Typography.headlineMd,
    color: Colors.onSurface,
    flex: 1,
    padding: 0,
  },
  muscleChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary + '22',
  },
  muscleChipText: { ...Typography.labelMd, color: Colors.primary },
  sectionProgressBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHighest,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionProgressBadgeDone: { backgroundColor: Colors.primary + '22' },
  sectionProgressText: { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  sectionProgressTextDone: { color: Colors.primary },

  // ── Sets table ─────────────────────────────────────────────────────────────
  setsSection: { paddingHorizontal: Spacing.lg, marginBottom: 4 },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  setHeaderCell: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
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
    backgroundColor: Colors.surfaceContainer,
    gap: Spacing.xs,
  },
  setRowNext: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
  },
  setRowDone: { opacity: 0.5 },
  setNumber: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    width: 20,
    textAlign: 'center',
  },

  // ── Boxed inputs ───────────────────────────────────────────────────────────
  inputBox: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  inputBoxActive: { borderColor: Colors.primary + '88' },
  inputReadOnly: { borderColor: 'transparent', backgroundColor: 'transparent' },
  weightInput: {
    ...Typography.titleMd,
    color: Colors.onSurface,
    width: 56,
    padding: 0,
    textAlign: 'center',
  },
  weightUnit: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    width: 20,
    textAlign: 'center',
  },
  repsInput: {
    ...Typography.titleMd,
    color: Colors.onSurface,
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
    borderColor: Colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',       // push to far right of pill
  },
  checkCircleDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkCircleNext: { borderColor: Colors.primary },

  // ── Inline rest timer chip (beside completed set) ──────────────────────────
  restChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: Spacing.lg,
    marginTop: 2,
    marginBottom: 4,
    gap: 5,
    backgroundColor: Colors.primary + '18',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  restChipText: {
    ...Typography.labelLg,
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
  restChipDone: {
    backgroundColor: Colors.success + '22',
    borderColor: Colors.success + '55',
  },
  restChipDoneText: { color: Colors.success },
  restChipSkip: {
    paddingLeft: 4,
  },

  // ── Swipe-to-delete action ─────────────────────────────────────────────────
  swipeDeleteAction: {
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: DELETE_WIDTH,
    borderRadius: Radius.lg,
  },
  swipeDeleteText: {
    ...Typography.labelMd,
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
    borderColor: Colors.primary + '55',
    gap: Spacing.xs,
  },
  addSetBtnText: { ...Typography.labelLg, color: Colors.primary },

  sectionDivider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
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
    borderColor: Colors.primary + '55',
    gap: Spacing.sm,
  },
  addExerciseBtnText: { ...Typography.titleMd, color: Colors.primary },

  // ── Bottom bar ─────────────────────────────────────────────────────────────
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    backgroundColor: Colors.background,
    gap: Spacing.xs,
  },
  bottomProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  bottomProgressText: { ...Typography.labelLg, color: Colors.onSurfaceVariant },
  bottomProgressCount: { ...Typography.labelLg, color: Colors.primary },
  btnFinish: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnFinishText: { ...Typography.titleLg, color: Colors.background },
  btnFinishDimmed: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  btnFinishDimmedText: { ...Typography.titleLg, color: Colors.onSurfaceVariant },
  saveErrorText: {
    ...Typography.labelLg,
    color: Colors.error,
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
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: { ...Typography.headlineMd, color: Colors.onSurface, marginBottom: Spacing.lg },
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
  fieldRow: { flexDirection: 'row', gap: Spacing.sm },
  fieldHalf: { flex: 1 },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
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

  // ── Rest timer — adjust buttons ────────────────────────────────────────────
  restAdjustBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary + '30',
  },
  restAdjustBtnText: { ...Typography.labelLg, color: Colors.primary },

  // ── Numpad ─────────────────────────────────────────────────────────────────
  numPadBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  numPadSheet: {
    backgroundColor: Colors.surfaceContainerLow,
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
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  numPadLabel: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
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
    color: Colors.onSurface,
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
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  numPadKeySpecial: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  numPadKeyText: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
  },
  numPadDoneBtn: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: Spacing.xs,
  },
  numPadDoneBtnText: { ...Typography.titleLg, color: Colors.background },
});
