import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Spacing, Radius, Typography, ColorSet } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';

export function useStyles() {
  const C = useColors();
  return useMemo(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingBottom: Spacing.xxxl },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { ...Typography.headlineLg, color: C.onSurface },

  // ── Summary strip ──────────────────────────────────────────────────────────
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  summaryValue: { ...Typography.headlineMd, color: C.primary },
  summaryLabel: { ...Typography.labelMd, color: C.onSurfaceVariant, marginTop: 2 },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText:    { ...Typography.titleMd, color: C.onSurface },
  emptySubtext: { ...Typography.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' as const },

  // ── Week group ─────────────────────────────────────────────────────────────
  weekLabel: {
    ...Typography.labelLg,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  // ── Session card ───────────────────────────────────────────────────────────
  sessionCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  sessionTop: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md,
  },
  sessionIconBox: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: C.primary + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  sessionInfo:   { flex: 1 },
  sessionName:   { ...Typography.titleMd, color: C.onSurface },
  sessionMeta:   { ...Typography.labelLg, color: C.onSurfaceVariant, marginTop: 2 },
  sessionRight:  { alignItems: 'flex-end' },
  sessionVolume: { ...Typography.titleMd, color: C.primary },
  sessionSets:   { ...Typography.labelLg, color: C.onSurfaceVariant, marginTop: 2 },

  // ── Expanded detail ────────────────────────────────────────────────────────
  sessionDetail: { marginTop: Spacing.sm },
  sessionDivider: {
    height: 1,
    backgroundColor: C.outlineVariant,
    marginBottom: Spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, paddingVertical: 3,
  },
  exerciseDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.primary + '88',
  },
  exerciseText: { ...Typography.bodyMd, color: C.onSurfaceVariant },
}), [C]);
}
