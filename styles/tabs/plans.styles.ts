import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Spacing, Radius, Typography, ColorSet } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';

export function useStyles() {
  const C = useColors();
  return useMemo(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingBottom: Spacing.xxxl },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { ...Typography.headlineLg, color: C.onSurface },
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: C.primary + '18',
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: C.primary + '44',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  addBtnText: { ...Typography.labelLg, color: C.primary },

  // ── Section label ──────────────────────────────────────────────────────────
  sectionLabel: {
    ...Typography.labelLg,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: {
    marginHorizontal: Spacing.lg,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.outlineVariant,
  },
  emptyText:    { ...Typography.titleMd, color: C.onSurface, marginBottom: Spacing.xs },
  emptySubtext: { ...Typography.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' as const },
  emptyCreateBtn: {
    marginTop: Spacing.lg,
    backgroundColor: C.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.xs,
  },
  emptyCreateText: { ...Typography.titleMd, color: C.background },

  // ── Plan card ──────────────────────────────────────────────────────────────
  planCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  planIconBox: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: C.primary + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  planInfo: { flex: 1 },
  planName:    { ...Typography.titleLg, color: C.onSurface },
  planMeta:    { ...Typography.labelLg, color: C.onSurfaceVariant, marginTop: 2 },

  // ── Expanded days list ─────────────────────────────────────────────────────
  planDivider: {
    height: 1,
    backgroundColor: C.outlineVariant,
    marginHorizontal: Spacing.lg,
  },
  daysList: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  dayNumber: {
    width: 26, height: 26, borderRadius: Radius.full,
    backgroundColor: C.primary + '22',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  dayNumberText: { ...Typography.labelLg, color: C.primary },
  dayInfo: { flex: 1 },
  dayName:  { ...Typography.titleMd, color: C.onSurface },
  dayFocus: { ...Typography.labelLg, color: C.onSurfaceVariant, marginTop: 2 },
  dayStartBtn: {
    width: 36, height: 36,
    borderRadius: Radius.full,
    backgroundColor: C.primary + '22',
    borderWidth: 1,
    borderColor: C.primary + '55',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Edit plan link row (bottom of expanded card)
  editPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.xs,
    gap: Spacing.xs,
  },
  editPlanText: { ...Typography.labelLg, color: C.onSurfaceVariant },
}), [C]);
}
