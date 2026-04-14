import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Spacing, Radius, ColorSet } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useTypography } from '@/contexts/PrefsContext';

export function useStyles() {
  const C = useColors();
  const T = useTypography();
  return useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
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
  },
  saveBtnText: {
    ...T.titleMd,
    color: C.background,
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
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  metaChipText: {
    ...T.labelLg,
    color: C.onSurfaceVariant,
  },

  // Section label
  sectionLabel: {
    ...T.labelLg,
    color: C.onSurfaceVariant,
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
    backgroundColor: C.surfaceContainer,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  exerciseCardExpanded: {
    borderWidth: 1,
    borderColor: C.primary + '44',
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
    ...T.titleLg,
    color: C.onSurface,
  },
  exerciseChips: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  chipText: {
    ...T.labelMd,
    color: C.onSurfaceVariant,
  },
  chipHighlight: {
    backgroundColor: C.primary + '22',
  },
  chipTextHighlight: {
    color: C.primary,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: C.error + '22',
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
    borderTopColor: C.outlineVariant,
  },
  editRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  editField: {
    flex: 1,
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  editFieldLabel: {
    ...T.labelMd,
    color: C.onSurfaceVariant,
    marginBottom: 4,
  },
  editFieldInput: {
    ...T.titleLg,
    color: C.onSurface,
    padding: 0,
  },
  editNotes: {
    marginTop: Spacing.sm,
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  editNotesInput: {
    ...T.bodyMd,
    color: C.onSurface,
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
    borderColor: C.primary + '66',
    gap: Spacing.sm,
  },
  addExerciseBtnText: {
    ...T.titleMd,
    color: C.primary,
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
    backgroundColor: C.background,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
    gap: Spacing.sm,
  },
  discardBtn: {
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: C.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discardBtnText: {
    ...T.titleMd,
    color: C.onSurfaceVariant,
  },
  saveLargeBtn: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveLargeBtnText: {
    ...T.titleLg,
    color: C.background,
  },
}), [C, T]);
}
