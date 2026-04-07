import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  greeting: { ...Typography.headlineLg, color: Colors.onSurface },
  date:     { ...Typography.bodyMd, color: Colors.onSurfaceVariant, marginTop: 2 },
  iconBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Section label ──────────────────────────────────────────────────────────
  sectionLabel: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
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
    backgroundColor: Colors.primary + '14',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '35',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  streakLeft: {
    width: 44, height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakMid: { flex: 1 },
  streakTitle: { ...Typography.titleLg, color: Colors.primary },
  streakSub:   { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginTop: 2 },
  streakCount: {
    ...Typography.displayMd,
    color: Colors.primary,
    opacity: 0.25,
  },

  // ── Quick start card ──────────────────────────────────────────────────────
  quickStartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
    gap: Spacing.md,
  },
  quickStartLeft: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  quickStartTitle: { ...Typography.titleMd, color: Colors.onSurface },
  quickStartSub:   { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginTop: 2 },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: { ...Typography.titleMd, color: Colors.onSurface },
  emptySub:  { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },

  // ── Quick stats ────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  statValue: { ...Typography.headlineMd, color: Colors.primary },
  statLabel: { ...Typography.labelMd, color: Colors.onSurfaceVariant, marginTop: 2 },

  // ── Recent sessions ────────────────────────────────────────────────────────
  recentCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  recentIconBox: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.primary + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  recentInfo: { flex: 1 },
  recentName:   { ...Typography.titleMd, color: Colors.onSurface },
  recentMeta:   { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginTop: 2 },
  recentVolume: { ...Typography.labelLg, color: Colors.primary },

  recentRight: { alignItems: 'flex-end', gap: 6 },
  recentDoAgainBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '1a',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  recentDoAgainText: { ...Typography.labelMd, color: Colors.primary },
});
