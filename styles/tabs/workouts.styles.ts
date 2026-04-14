import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Spacing, Radius, Typography, ColorSet } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';

export function useStyles() {
  const C = useColors();
  return useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.displayMd,
    color: C.onSurface,
  },
  subtitle: {
    ...Typography.bodyMd,
    color: C.onSurfaceVariant,
    marginTop: Spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchText: {
    ...Typography.bodyMd,
    color: C.onSurfaceVariant,
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: C.surfaceContainer,
  },
  filterChipActive: {
    backgroundColor: C.primary,
  },
  filterChipText: {
    ...Typography.labelLg,
    color: C.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: C.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.sm,
  },
  workoutCard: {
    borderRadius: Radius.lg,
    backgroundColor: C.surfaceContainer,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  workoutIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: C.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    ...Typography.titleLg,
    color: C.onSurface,
  },
  workoutMeta: {
    ...Typography.bodyMd,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  workoutBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: C.primary + '22',
  },
  workoutBadgeText: {
    ...Typography.labelMd,
    color: C.primary,
  },
  logBtn: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  logBtnText: {
    ...Typography.titleLg,
    color: C.background,
  },
}), [C]);
}
