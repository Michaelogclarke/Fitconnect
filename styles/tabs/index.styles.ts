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
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  greeting: { ...Typography.headlineLg, color: C.onSurface },
  date:     { ...Typography.bodyMd, color: C.onSurfaceVariant, marginTop: 2 },
  iconBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: C.surfaceContainer,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Section label ──────────────────────────────────────────────────────────
  sectionLabel: {
    ...Typography.labelLg,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },

  // ── Streak card ────────────────────────────────────────────────────────────
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: C.primary + '14',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: C.primary + '35',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  streakLeft: {
    width: 44, height: 44,
    borderRadius: Radius.md,
    backgroundColor: C.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakMid: { flex: 1 },
  streakTitle: { ...Typography.titleLg, color: C.primary },
  streakSub:   { ...Typography.labelLg, color: C.onSurfaceVariant, marginTop: 2 },
  streakCount: {
    ...Typography.displayMd,
    color: C.primary,
    opacity: 0.25,
  },

  // ── Quick start card ──────────────────────────────────────────────────────
  quickStartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: C.primary + '33',
    gap: Spacing.md,
  },
  quickStartLeft: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  quickStartTitle: { ...Typography.titleMd, color: C.onSurface },
  quickStartSub:   { ...Typography.labelLg, color: C.onSurfaceVariant, marginTop: 2 },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: { ...Typography.titleMd, color: C.onSurface },
  emptySub:  { ...Typography.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' },

  // ── Quick stats ────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  statValue: { ...Typography.headlineMd, color: C.primary },
  statLabel: { ...Typography.labelMd, color: C.onSurfaceVariant, marginTop: 2 },

  // ── Weekly goal card ───────────────────────────────────────────────────────
  weeklyGoalCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  weeklyGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  weeklyGoalTitle: { ...Typography.titleMd, color: C.onSurface, flex: 1 },
  weeklyGoalTapHint: { ...Typography.labelMd, color: C.onSurfaceVariant },
  weeklyGoalDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  weeklyGoalDot: {
    height: 10,
    flex: 1,
    borderRadius: Radius.full,
  },
  weeklyGoalDotFilled: { backgroundColor: C.primary },
  weeklyGoalDotEmpty:  { backgroundColor: C.outlineVariant },
  weeklyGoalCount: { ...Typography.labelLg, color: C.onSurfaceVariant },

  // ── Weekly goal picker modal ───────────────────────────────────────────────
  goalPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  goalPickerSheet: {
    width: '100%',
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  goalPickerTitle: { ...Typography.titleLg, color: C.onSurface, marginBottom: Spacing.xs },
  goalPickerSub:   { ...Typography.bodyMd, color: C.onSurfaceVariant, marginBottom: Spacing.lg },
  goalPickerOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  goalPickerOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  goalPickerOptionActive: {
    backgroundColor: C.primary + '22',
    borderColor: C.primary,
  },
  goalPickerOptionText: {
    ...Typography.headlineMd,
    color: C.onSurface,
  },
  goalPickerOptionLabel: {
    ...Typography.labelMd,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  goalPickerOptionTextActive: { color: C.primary },

  // ── Steps / health card ────────────────────────────────────────────────────
  stepsCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  stepsLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  stepsTitle: { ...Typography.titleMd, color: C.onSurface },
  stepsCount: { ...Typography.headlineMd, color: C.primary },
  stepsBarTrack: {
    height: 8,
    backgroundColor: C.outlineVariant,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  stepsBarFill: {
    height: '100%',
    backgroundColor: C.primary,
    borderRadius: Radius.full,
  },
  stepsFooter: { ...Typography.labelLg, color: C.onSurfaceVariant },
  stepsConnectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.outlineVariant,
  },
  stepsConnectText: {
    ...Typography.labelLg,
    color: C.onSurfaceVariant,
    flex: 1,
  },

  // ── Recent sessions ────────────────────────────────────────────────────────
  recentCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  recentIconBox: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: C.primary + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  recentInfo: { flex: 1 },
  recentName:   { ...Typography.titleMd, color: C.onSurface },
  recentMeta:   { ...Typography.labelLg, color: C.onSurfaceVariant, marginTop: 2 },
  recentVolume: { ...Typography.labelLg, color: C.primary },

  recentRight: { alignItems: 'flex-end', gap: 6 },
  recentDoAgainBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4,
    backgroundColor: C.primary + '1a',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.primary + '44',
  },
  recentDoAgainText: { ...Typography.labelMd, color: C.primary },
}), [C]);
}
