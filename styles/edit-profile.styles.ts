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
    ...T.titleMd,
    color: C.onSurfaceVariant,
  },
  headerTitle: {
    ...T.titleLg,
    color: C.onSurface,
  },
  saveBtn: {
    minWidth: 72,
    alignItems: 'flex-end',
    padding: Spacing.xs,
  },
  saveBtnText: {
    ...T.titleMd,
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
    ...T.labelLg,
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
    ...T.titleMd,
    color: C.onSurface,
    width: 90,
  },
  fieldInput: {
    flex: 1,
    ...T.titleMd,
    color: C.onSurface,
    textAlign: 'right',
  },
  errorText: {
    ...T.labelLg,
    color: C.error,
    marginTop: Spacing.sm,
    marginLeft: Spacing.xs,
  },
}), [C, T]);
}
