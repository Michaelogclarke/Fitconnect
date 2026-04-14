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

  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  backText: {
    ...Typography.titleMd,
    color: C.onSurfaceVariant,
  },

  // ── Hero card ─────────────────────────────────────────────────────────────
  heroCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },

  sessionName: {
    ...Typography.headlineMd,
    color: C.onSurface,
  },

  sessionMeta: {
    ...Typography.labelLg,
    color: C.onSurfaceVariant,
    marginTop: 4,
  },

  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },

  doAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    backgroundColor: C.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
  },

  doAgainText: {
    ...Typography.titleMd,
    color: C.background,
  },

  statBox: {
    flex: 1,
    backgroundColor: C.primary + '11',
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },

  statValue: {
    ...Typography.headlineMd,
    color: C.primary,
  },

  statLabel: {
    ...Typography.labelMd,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },

  // ── Exercise cards ────────────────────────────────────────────────────────
  exCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },

  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },

  exName: {
    ...Typography.titleMd,
    color: C.onSurface,
    flex: 1,
  },

  muscleBadge: {
    backgroundColor: C.primary + '22',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },

  muscleText: {
    ...Typography.labelMd,
    color: C.primary,
  },

  // ── Sets table ────────────────────────────────────────────────────────────
  setsTable: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  setsHeaderRow: {
    flexDirection: 'row',
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
    marginBottom: Spacing.xs,
  },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },

  colSet: {
    width: 32,
    ...Typography.labelMd,
    color: C.onSurfaceVariant,
  },

  colWeight: {
    flex: 1,
    ...Typography.labelLg,
    color: C.onSurface,
    textAlign: 'center',
  },

  colReps: {
    flex: 1,
    ...Typography.labelLg,
    color: C.onSurface,
    textAlign: 'center',
  },

  colDone: {
    width: 32,
    alignItems: 'center',
  },

  headerText: {
    ...Typography.labelMd,
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },

  checkDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.primary + '22',
    borderWidth: 1,
    borderColor: C.primary + '66',
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },

  // ── Utility states ────────────────────────────────────────────────────────
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  notFoundText: {
    ...Typography.bodyLg,
    color: C.onSurfaceVariant,
  },
}), [C]);
}
