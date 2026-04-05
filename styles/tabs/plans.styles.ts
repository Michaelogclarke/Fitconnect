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

  // ── My Routines ────────────────────────────────────────────────────────────
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
  emptySubtext: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, textAlign: 'center' },

  routineCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  routineIconBox: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.primary + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  routineInfo:    { flex: 1 },
  routineName:    { ...Typography.titleMd, color: Colors.onSurface },
  routineMeta:    { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginTop: 2 },
  routineRight:   { alignItems: 'flex-end', gap: 4 },
  routineLastDone:{ ...Typography.labelMd, color: Colors.onSurfaceVariant },

  // ── Preset split card ──────────────────────────────────────────────────────
  splitCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  splitCardHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  splitTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  splitName: { ...Typography.titleLg, color: Colors.onSurface },
  diffBadge: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  diffBadgeText: { ...Typography.labelMd },
  splitMeta: { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginBottom: 4 },
  splitDesc: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },

  splitDivider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    marginHorizontal: Spacing.lg,
  },
  daysList: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
  dayRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: Spacing.md,
  },
  dayNumber: {
    width: 24, height: 24, borderRadius: Radius.full,
    backgroundColor: Colors.primary + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  dayNumberText: { ...Typography.labelLg, color: Colors.primary },
  dayName:  { ...Typography.titleMd, color: Colors.onSurface },
  dayFocus: { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginTop: 2 },

  usePlanBtn: {
    margin: Spacing.lg,
    marginTop: Spacing.md,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usePlanBtnText: { ...Typography.titleMd, color: Colors.background },
});
