import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Spacing, Radius, ColorSet } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useTypography } from '@/contexts/PrefsContext';

export function useStyles() {
  const C = useColors();
  const T = useTypography();
  return useMemo(() => StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.background },
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
  title: { ...T.headlineLg, color: C.onSurface },
  rangeRow: { flexDirection: 'row', gap: 4 },
  rangeBtn: {
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  rangeBtnActive:     { backgroundColor: C.primary + '22' },
  rangeBtnText:       { ...T.labelLg, color: C.onSurfaceVariant },
  rangeBtnTextActive: { color: C.primary },

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
    ...T.labelLg,
    color: C.onSurfaceVariant,
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
    backgroundColor: C.primary + '18',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: C.primary + '44',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  logWeightText: { ...T.labelLg, color: C.primary },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: { ...T.labelLg, color: C.primary },

  // ── Body weight card ───────────────────────────────────────────────────────
  bwCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  bwCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  bwCurrent: { ...T.displayMd, color: C.onSurface },
  bwChange:  { ...T.labelLg, marginTop: 2 },
  bwBarLabel: { ...T.labelMd, color: C.onSurfaceVariant, fontSize: 10 },
  bwEmpty: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bwEmptyText: { ...T.titleMd, color: C.onSurface },
  bwEmptyHint: { ...T.bodyMd, color: C.onSurfaceVariant },

  // ── PRs card ───────────────────────────────────────────────────────────────
  prCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: C.surfaceContainer,
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
  prRowBorder:  { borderBottomWidth: 1, borderBottomColor: C.outlineVariant },
  prIconBox: {
    width: 36, height: 36,
    borderRadius: Radius.md,
    backgroundColor: C.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prInfo:     { flex: 1 },
  prExercise: { ...T.titleMd, color: C.onSurface },
  prDate:     { ...T.labelLg, color: C.onSurfaceVariant, marginTop: 2 },
  prWeight:   { ...T.headlineMd, color: C.primary },

  // ── Empty card ─────────────────────────────────────────────────────────────
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyCardText: { ...T.bodyMd, color: C.onSurfaceVariant },

  // ── Weekly volume chart ────────────────────────────────────────────────────
  volCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: C.surfaceContainer,
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
  volBarValue: { ...T.labelMd, color: C.onSurfaceVariant },
  volBarTrack: {
    width: 28, flex: 1,
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  volBarFill: {
    width: '100%',
    backgroundColor: C.primary,
    borderRadius: Radius.sm,
  },
  volBarLabel: { ...T.labelMd, color: C.onSurfaceVariant },

  // ── Muscle frequency ───────────────────────────────────────────────────────
  freqCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  freqRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  freqLabel:   { ...T.titleMd, color: C.onSurface, width: 80 },
  freqBarTrack: {
    flex: 1, height: 8, borderRadius: Radius.full,
    backgroundColor: C.surfaceContainerHighest,
    overflow: 'hidden',
  },
  freqBarFill: {
    height: '100%',
    backgroundColor: C.primary,
    borderRadius: Radius.full,
  },
  freqCount: { ...T.labelLg, color: C.primary, width: 28, textAlign: 'right' },

  // ── Log Weight Modal ───────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.surfaceContainer,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  modalTitle: { ...T.headlineMd, color: C.onSurface },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  modalInput: {
    flex: 1,
    ...T.headlineMd,
    color: C.onSurface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  modalUnitBox: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: C.primary + '22',
  },
  modalUnit:  { ...T.titleMd, color: C.primary },
  modalError: { ...T.labelLg, color: C.error },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  modalCancelText: { ...T.titleMd, color: C.onSurfaceVariant },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: Spacing.md,
    backgroundColor: C.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  modalSaveText: { ...T.titleMd, color: '#fff' },
}), [C, T]);
}
