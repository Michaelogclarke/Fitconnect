import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  brandText: {
    ...Typography.headlineLg,
    color: Colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Performance Card
  performanceCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  performanceLabel: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  performanceGreeting: {
    ...Typography.headlineLg,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  scoreNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 60,
  },
  scoreSubtext: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.sm,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.error + '22',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.error,
  },
  liveText: {
    ...Typography.labelMd,
    color: Colors.error,
    textTransform: 'uppercase',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
  },
  sectionLink: {
    ...Typography.labelLg,
    color: Colors.primary,
  },

  // Active Workout Card
  workoutCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainer,
    padding: Spacing.lg,
  },
  workoutTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  workoutDesc: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.lg,
  },
  workoutActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btnPrimary: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryText: {
    ...Typography.titleMd,
    color: Colors.background,
  },
  btnSecondary: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondaryText: {
    ...Typography.titleMd,
    color: Colors.onSurface,
  },

  // Metrics Row
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainer,
    padding: Spacing.md,
    alignItems: 'center',
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  metricValue: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
  },
  metricLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  metricSub: {
    ...Typography.labelMd,
    color: Colors.primary,
    marginTop: 2,
  },

  // Progress bar
  progressBarBg: {
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.outlineVariant,
    marginTop: Spacing.xs,
    width: '100%',
  },
  progressBarFill: {
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },

  // Weight Trend Card
  trendCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainer,
    padding: Spacing.lg,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  trendTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
  },
  trendValue: {
    ...Typography.displayMd,
    color: Colors.primary,
  },
  trendDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  trendDay: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  trendDayLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  trendDayBar: {
    width: 8,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary + '44',
  },
  trendDayBarActive: {
    backgroundColor: Colors.primary,
  },
});
