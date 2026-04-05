import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: Spacing.xxxl },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { ...Typography.headlineLg, color: Colors.onSurface },

  // ── Summary strip ──────────────────────────────────────────────────────────
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  summaryValue: { ...Typography.headlineMd, color: Colors.primary },
  summaryLabel: { ...Typography.labelMd, color: Colors.onSurfaceVariant, marginTop: 2 },

  // ── Week group ─────────────────────────────────────────────────────────────
  weekLabel: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
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
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  sessionTop: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md,
  },
  sessionIconBox: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.primary + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  sessionInfo:   { flex: 1 },
  sessionName:   { ...Typography.titleMd, color: Colors.onSurface },
  sessionMeta:   { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginTop: 2 },
  sessionRight:  { alignItems: 'flex-end' },
  sessionVolume: { ...Typography.titleMd, color: Colors.primary },
  sessionSets:   { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginTop: 2 },

  // ── Expanded detail ────────────────────────────────────────────────────────
  sessionDetail: { marginTop: Spacing.sm },
  sessionDivider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    marginBottom: Spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, paddingVertical: 3,
  },
  exerciseDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.primary + '88',
  },
  exerciseText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
});
