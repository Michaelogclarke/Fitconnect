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
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary + '18',
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.primary + '44',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  addBtnText: { ...Typography.labelLg, color: Colors.primary },

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

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.outlineVariant,
  },
  emptyText:    { ...Typography.titleMd, color: Colors.onSurface, marginBottom: Spacing.xs },
  emptySubtext: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' as const },
  emptyCreateBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.xs,
  },
  emptyCreateText: { ...Typography.titleMd, color: Colors.background },

  // ── Plan card ──────────────────────────────────────────────────────────────
  planCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceContainer,
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
    backgroundColor: Colors.primary + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  planInfo: { flex: 1 },
  planName:    { ...Typography.titleLg, color: Colors.onSurface },
  planMeta:    { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginTop: 2 },

  // ── Expanded days list ─────────────────────────────────────────────────────
  planDivider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
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
    backgroundColor: Colors.primary + '22',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  dayNumberText: { ...Typography.labelLg, color: Colors.primary },
  dayInfo: { flex: 1 },
  dayName:  { ...Typography.titleMd, color: Colors.onSurface },
  dayFocus: { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginTop: 2 },
  dayStartBtn: {
    width: 36, height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary + '22',
    borderWidth: 1,
    borderColor: Colors.primary + '55',
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
  editPlanText: { ...Typography.labelLg, color: Colors.onSurfaceVariant },
});
