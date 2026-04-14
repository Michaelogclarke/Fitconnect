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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    ...T.displayMd,
    color: C.onSurface,
  },
  subtitle: {
    ...T.bodyMd,
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
    ...T.bodyMd,
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
    ...T.labelLg,
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
    ...T.titleLg,
    color: C.onSurface,
  },
  workoutMeta: {
    ...T.bodyMd,
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
    ...T.labelMd,
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
    ...T.titleLg,
    color: C.background,
  },
}), [C, T]);
}
