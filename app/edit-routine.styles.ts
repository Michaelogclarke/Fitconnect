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
  },
  saveBtnText: {
    ...Typography.titleMd,
    color: Colors.background,
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  metaChipText: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
  },

  // Section label
  sectionLabel: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Exercise card
  exerciseCard: {
    backgroundColor: Colors.surfaceContainer,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  exerciseCardExpanded: {
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dragHandle: {
    padding: Spacing.xs,
    opacity: 0.4,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...Typography.titleLg,
    color: Colors.onSurface,
  },
  exerciseChips: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  chipText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  chipHighlight: {
    backgroundColor: Colors.primary + '22',
  },
  chipTextHighlight: {
    color: Colors.primary,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.error + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Expanded detail
  expandedBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  editRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  editField: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  editFieldLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  editFieldInput: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    padding: 0,
  },
  editNotes: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  editNotesInput: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    padding: 0,
  },

  // Add exercise
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primary + '66',
    gap: Spacing.sm,
  },
  addExerciseBtnText: {
    ...Typography.titleMd,
    color: Colors.primary,
  },

  // Bottom save bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    gap: Spacing.sm,
  },
  discardBtn: {
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discardBtnText: {
    ...Typography.titleMd,
    color: Colors.onSurfaceVariant,
  },
  saveLargeBtn: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveLargeBtnText: {
    ...Typography.titleLg,
    color: Colors.background,
  },
});
