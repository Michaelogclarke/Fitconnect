import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Spacing, Radius, Typography, ColorSet } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';

export function useStyles() {
  const C = useColors();
  return useMemo(() => StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingBottom: Spacing.xxxl },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: Spacing.xs,
    minWidth: 72,
  },
  backText: {
    ...Typography.titleMd,
    color: C.onSurfaceVariant,
  },
  headerTitle: {
    ...Typography.titleLg,
    color: C.onSurface,
  },
  saveBtn: {
    minWidth: 72,
    alignItems: 'flex-end',
    padding: Spacing.xs,
  },
  saveBtnText: {
    ...Typography.titleMd,
    color: C.primary,
  },

  // ── Avatar section ─────────────────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    backgroundColor: C.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.primary,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: C.primary,
  },

  // ── Form ───────────────────────────────────────────────────────────────────
  formSection: {
    marginHorizontal: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.labelLg,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  formCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    minHeight: 52,
  },
  fieldLabel: {
    ...Typography.titleMd,
    color: C.onSurface,
    width: 90,
  },
  fieldInput: {
    flex: 1,
    ...Typography.titleMd,
    color: C.onSurface,
    textAlign: 'right',
  },
  errorText: {
    ...Typography.labelLg,
    color: C.error,
    marginTop: Spacing.sm,
    marginLeft: Spacing.xs,
  },
}), [C]);
}
