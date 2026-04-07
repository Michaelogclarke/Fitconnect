import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    color: Colors.onSurfaceVariant,
  },

  // ── Hero card ─────────────────────────────────────────────────────────────
  heroCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },

  sessionName: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
  },

  sessionMeta: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
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
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
  },

  doAgainText: {
    ...Typography.titleMd,
    color: Colors.background,
  },

  statBox: {
    flex: 1,
    backgroundColor: Colors.primary + '11',
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },

  statValue: {
    ...Typography.headlineMd,
    color: Colors.primary,
  },

  statLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },

  // ── Exercise cards ────────────────────────────────────────────────────────
  exCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },

  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },

  exName: {
    ...Typography.titleMd,
    color: Colors.onSurface,
    flex: 1,
  },

  muscleBadge: {
    backgroundColor: Colors.primary + '22',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },

  muscleText: {
    ...Typography.labelMd,
    color: Colors.primary,
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
    borderBottomColor: Colors.outlineVariant,
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
    color: Colors.onSurfaceVariant,
  },

  colWeight: {
    flex: 1,
    ...Typography.labelLg,
    color: Colors.onSurface,
    textAlign: 'center',
  },

  colReps: {
    flex: 1,
    ...Typography.labelLg,
    color: Colors.onSurface,
    textAlign: 'center',
  },

  colDone: {
    width: 32,
    alignItems: 'center',
  },

  headerText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },

  checkDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary + '22',
    borderWidth: 1,
    borderColor: Colors.primary + '66',
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },

  // ── Utility states ────────────────────────────────────────────────────────
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  notFoundText: {
    ...Typography.bodyLg,
    color: Colors.onSurfaceVariant,
  },
});
