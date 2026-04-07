import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
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
  rangeBtnActive:     { backgroundColor: Colors.primary + '22' },
  rangeBtnText:       { ...Typography.labelLg, color: Colors.onSurfaceVariant },
  rangeBtnTextActive: { color: Colors.primary },

  // ── Section label row ──────────────────────────────────────────────────────
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  logWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '18',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  logWeightText: { ...Typography.labelLg, color: Colors.primary },

  // ── Body weight card ───────────────────────────────────────────────────────
  bwCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  bwCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  bwCurrent: { ...Typography.displayMd, color: Colors.onSurface },
  bwChange:  { ...Typography.labelLg, marginTop: 2 },
  bwBarLabel: { ...Typography.labelMd, color: Colors.onSurfaceVariant, fontSize: 10 },
  bwEmpty: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bwEmptyText: { ...Typography.titleMd, color: Colors.onSurface },
  bwEmptyHint: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },

  // ── PRs card ───────────────────────────────────────────────────────────────
  prCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  prRowBorder:  { borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
  prIconBox: {
    width: 36, height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prInfo:     { flex: 1 },
  prExercise: { ...Typography.titleMd, color: Colors.onSurface },
  prDate:     { ...Typography.labelLg, color: Colors.onSurfaceVariant, marginTop: 2 },
  prWeight:   { ...Typography.headlineMd, color: Colors.primary },

  // ── Empty card ─────────────────────────────────────────────────────────────
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyCardText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },

  // ── Weekly volume chart ────────────────────────────────────────────────────
  volCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  volBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
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
  freqRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  freqLabel:   { ...Typography.titleMd, color: Colors.onSurface, width: 80 },
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

  // ── Log Weight Modal ───────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surfaceContainer,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  modalTitle: { ...Typography.headlineMd, color: Colors.onSurface },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  modalInput: {
    flex: 1,
    ...Typography.headlineMd,
    color: Colors.onSurface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  modalUnitBox: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary + '22',
  },
  modalUnit:  { ...Typography.titleMd, color: Colors.primary },
  modalError: { ...Typography.labelLg, color: Colors.error },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  modalCancelText: { ...Typography.titleMd, color: Colors.onSurfaceVariant },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  modalSaveText: { ...Typography.titleMd, color: '#fff' },
});
