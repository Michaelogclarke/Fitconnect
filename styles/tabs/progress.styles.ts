import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  title: { ...Typography.headlineLg, color: Colors.onSurface },
  rangeRow: { flexDirection: 'row', gap: 4 },
  rangeBtn: {
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  rangeBtnActive: { backgroundColor: Colors.primary + '22' },
  rangeBtnText:   { ...Typography.labelLg, color: Colors.onSurfaceVariant },
  rangeBtnTextActive: { color: Colors.primary },

  // ── Section label ──────────────────────────────────────────────────────────
  sectionLabel: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  // ── Body weight card ───────────────────────────────────────────────────────
  bwCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  bwCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  bwCurrent: { ...Typography.displayMd, color: Colors.onSurface },
  bwChange:  { ...Typography.labelLg, color: Colors.success, marginTop: 2 },
  bwBars: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    height: 80,
  },
  bwBarGroup: { alignItems: 'center', gap: 4, flex: 1 },
  bwBar: {
    width: 8, borderRadius: Radius.sm,
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },
  bwBarLabel: { ...Typography.labelMd, color: Colors.onSurfaceVariant },

  // ── PRs card ───────────────────────────────────────────────────────────────
  prCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  prRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  prRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  prIconBox: {
    width: 36, height: 36, borderRadius: Radius.md,
    backgroundColor: Colors.primary + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  prInfo:     { flex: 1 },
  prExercise: { ...Typography.titleMd, color: Colors.onSurface },
  prDate:     { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginTop: 2 },
  prWeight:   { ...Typography.headlineMd, color: Colors.primary },

  // ── Weekly volume chart ────────────────────────────────────────────────────
  volCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  volBars: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    height: 100,
  },
  volBarGroup: { flex: 1, alignItems: 'center', gap: 4 },
  volBarValue: { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  volBarTrack: {
    width: 28, flex: 1,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  volBarFill: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
  },
  volBarLabel: { ...Typography.labelMd, color: Colors.onSurfaceVariant },

  // ── Muscle frequency ───────────────────────────────────────────────────────
  freqCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  freqRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md,
  },
  freqLabel: { ...Typography.titleMd, color: Colors.onSurface, width: 80 },
  freqBarTrack: {
    flex: 1, height: 8, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  freqBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  freqCount: { ...Typography.labelLg, color: Colors.primary, width: 28, textAlign: 'right' },
});
