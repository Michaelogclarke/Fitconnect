import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

const DELETE_WIDTH = 72;

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
  topBarCenter: {
    flex: 1,
  },
  topBarTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
  },
  topBarSub: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
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
  progressLabel: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
  },
  progressCount: {
    ...Typography.labelLg,
    color: Colors.primary,
  },
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

  // ── Scroll content ─────────────────────────────────────────────────────────
  scrollContent: {
    paddingBottom: 100,
  },

  // ── Exercise section ───────────────────────────────────────────────────────
  exerciseSection: {
    marginBottom: Spacing.sm,
  },
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
  muscleChipText: {
    ...Typography.labelMd,
    color: Colors.primary,
  },
  sectionProgressBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHighest,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionProgressBadgeDone: {
    backgroundColor: Colors.primary + '22',
  },
  sectionProgressText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  sectionProgressTextDone: {
    color: Colors.primary,
  },

  // ── Sets table ─────────────────────────────────────────────────────────────
  setsSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: 4,
  },
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
  colDone:   { width: 36, alignItems: 'center' as const },

  // Each row is wrapped by Swipeable — the row itself is the visible content
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 7,
    borderRadius: Radius.md,
    marginBottom: 3,
    backgroundColor: Colors.surfaceContainer,
    gap: Spacing.xs,
  },
  setRowNext: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  setRowDone: {
    opacity: 0.5,
  },
  setNumber: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    width: 24,
    textAlign: 'center',
  },

  // ── Boxed input fields ─────────────────────────────────────────────────────
  inputBox: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  inputBoxActive: {
    borderColor: Colors.primary + '88',
    backgroundColor: Colors.surfaceContainerHighest,
  },
  weightInput: {
    ...Typography.titleMd,
    color: Colors.onSurface,
    width: 72,
    padding: 0,
    textAlign: 'center',
  },
  weightUnit: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    width: 24,
    textAlign: 'center',
  },
  repsInput: {
    ...Typography.titleMd,
    color: Colors.onSurface,
    width: 52,
    padding: 0,
    textAlign: 'center',
  },
  inputReadOnly: {
    color: Colors.onSurfaceVariant,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },

  // ── Checkmark ──────────────────────────────────────────────────────────────
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkCircleNext: {
    borderColor: Colors.primary,
  },

  // ── Swipe-to-delete action ─────────────────────────────────────────────────
  swipeDeleteAction: {
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: DELETE_WIDTH,
    borderRadius: Radius.md,
  },
  swipeDeleteText: {
    ...Typography.labelLg,
    color: '#fff',
    marginTop: 4,
  },

  // ── Add / remove set row ───────────────────────────────────────────────────
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
  addSetBtnText: {
    ...Typography.labelLg,
    color: Colors.primary,
  },

  // ── Divider between sections ───────────────────────────────────────────────
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },

  // ── Add exercise button ────────────────────────────────────────────────────
  addExerciseSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
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
  addExerciseBtnText: {
    ...Typography.titleMd,
    color: Colors.primary,
  },

  // ── Rest overlay ───────────────────────────────────────────────────────────
  restOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  restLabel: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  restCount: {
    fontSize: 88,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 96,
    fontVariant: ['tabular-nums'],
  },
  restSub: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxxl,
  },
  btnRestSkip: {
    paddingHorizontal: Spacing.xxl,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnRestSkipText: {
    ...Typography.titleMd,
    color: Colors.onSurface,
  },

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
  bottomProgressText: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
  },
  bottomProgressCount: {
    ...Typography.labelLg,
    color: Colors.primary,
  },
  btnFinish: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnFinishText: {
    ...Typography.titleLg,
    color: Colors.background,
  },
  btnFinishDimmed: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  btnFinishDimmedText: {
    ...Typography.titleLg,
    color: Colors.onSurfaceVariant,
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
  modalTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    marginBottom: Spacing.lg,
  },
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
  fieldRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  fieldHalf: {
    flex: 1,
  },
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
  modalCancelText: {
    ...Typography.titleMd,
    color: Colors.onSurfaceVariant,
  },
  modalAddBtn: {
    flex: 2,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAddText: {
    ...Typography.titleLg,
    color: Colors.background,
  },
});
