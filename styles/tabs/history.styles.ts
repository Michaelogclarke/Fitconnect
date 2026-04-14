import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Spacing, Radius, ColorSet } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useTypography } from '@/contexts/PrefsContext';

export function useStyles() {
  const C = useColors();
  const T = useTypography();
  return useMemo(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingBottom: Spacing.xxxl },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { ...T.headlineLg, color: C.onSurface },

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
  summaryValue: { ...T.headlineMd, color: C.primary },
  summaryLabel: { ...T.labelMd, color: C.onSurfaceVariant, marginTop: 2 },

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
  emptyText:    { ...T.titleMd, color: C.onSurface },
  emptySubtext: { ...T.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' as const },

  // ── Week group ─────────────────────────────────────────────────────────────
  weekLabel: {
    ...T.labelLg,
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
  sessionName:   { ...T.titleMd, color: C.onSurface },
  sessionMeta:   { ...T.labelLg, color: C.onSurfaceVariant, marginTop: 2 },
  sessionRight:  { alignItems: 'flex-end' },
  sessionVolume: { ...T.titleMd, color: C.primary },
  sessionSets:   { ...T.labelLg, color: C.onSurfaceVariant, marginTop: 2 },

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
  exerciseText: { ...T.bodyMd, color: C.onSurfaceVariant },
}), [C, T]);
}
