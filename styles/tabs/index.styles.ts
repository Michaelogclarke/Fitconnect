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

  // ── Streak ─────────────────────────────────────────────────────────────────
  streakRow: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.primary + '18',
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.primary + '44',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  streakText: { ...Typography.labelLg, color: Colors.primary },

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

  // ── Today's workout card ───────────────────────────────────────────────────
  todayCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  todayHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  todayName: { ...Typography.headlineMd, color: Colors.onSurface },
  todayMeta: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, marginTop: 2 },
  todayBadge: {
    backgroundColor: Colors.primary + '22',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    marginLeft: Spacing.sm, marginTop: 2,
  },
  todayBadgeText: { ...Typography.labelMd, color: Colors.primary },
  exerciseList: { marginBottom: Spacing.lg, gap: 4 },
  exerciseItem: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  exerciseMore: { ...Typography.labelLg, color: Colors.primary, marginTop: 2 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 46, borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    gap: Spacing.sm,
  },
  startBtnText: { ...Typography.titleLg, color: Colors.background },

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
});
