import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Top bar
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

  // Progress strip
  progressStrip: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
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

  // Exercise card
  exerciseCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  exerciseMuscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
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
  primaryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  primaryBadgeText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  exerciseName: {
    ...Typography.displayMd,
    color: Colors.onSurface,
    marginBottom: Spacing.sm,
  },
  exerciseTargetRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.xs,
  },
  exerciseTarget: {
    alignItems: 'center',
  },
  exerciseTargetValue: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
  },
  exerciseTargetLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  targetDivider: {
    width: 1,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'stretch',
    marginVertical: Spacing.xs,
  },

  // Sets table
  setsSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  setsHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  setHeaderCell: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  colSet: { width: 32 },
  colWeight: { flex: 1 },
  colReps: { width: 60, alignItems: 'center' as const },
  colDone: { width: 44, alignItems: 'center' as const },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: 4,
    backgroundColor: Colors.surfaceContainer,
  },
  setRowActive: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  setRowDone: {
    opacity: 0.6,
  },
  setNumber: {
    ...Typography.titleMd,
    color: Colors.onSurfaceVariant,
    width: 32,
  },
  setWeight: {
    ...Typography.titleMd,
    color: Colors.onSurface,
    flex: 1,
  },
  setReps: {
    ...Typography.titleMd,
    color: Colors.onSurface,
    width: 60,
    textAlign: 'center',
  },
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
  checkCircleActive: {
    borderColor: Colors.primary,
  },

  // Rest timer overlay
  restOverlay: {
    flex: 1,
    backgroundColor: Colors.background,
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
  restRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: Colors.primary + '33',
  },
  restRingActive: {
    borderTopColor: Colors.primary,
  },

  // Bottom controls
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    backgroundColor: Colors.background,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btnSkip: {
    flex: 1,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSkipText: {
    ...Typography.titleMd,
    color: Colors.onSurfaceVariant,
  },
  btnComplete: {
    flex: 2,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCompleteText: {
    ...Typography.titleLg,
    color: Colors.background,
  },
  btnFinish: {
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnFinishText: {
    ...Typography.titleLg,
    color: Colors.background,
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
});
