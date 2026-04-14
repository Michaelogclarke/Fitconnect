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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.displayMd,
    color: C.onSurface,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.headlineLg,
    color: C.primary,
  },
  statLabel: {
    ...Typography.labelLg,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.sm,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: C.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Typography.titleLg,
    color: C.primary,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    ...Typography.titleLg,
    color: C.onSurface,
  },
  clientMeta: {
    ...Typography.bodyMd,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  statusActive: {
    backgroundColor: C.success,
  },
  statusPaused: {
    backgroundColor: C.onSurfaceVariant,
  },
}), [C]);
}
