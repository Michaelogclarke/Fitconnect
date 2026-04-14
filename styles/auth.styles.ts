import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Spacing, Radius, ColorSet } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useTypography } from '@/contexts/PrefsContext';

export function useStyles() {
  const C = useColors();
  const T = useTypography();
  return useMemo(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },

  // ── Brand ─────────────────────────────────────────────────────────────────
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: -1,
  },
  tagline: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    marginTop: Spacing.xs,
  },

  // ── Form card ─────────────────────────────────────────────────────────────
  form: {
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  formTitle: {
    ...T.headlineMd,
    color: C.onSurface,
    marginBottom: Spacing.lg,
  },

  errorText: {
    ...T.bodyMd,
    color: C.error,
    backgroundColor: C.error + '18',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },

  // ── Fields ────────────────────────────────────────────────────────────────
  fieldGroup: { marginBottom: Spacing.md },
  label: {
    ...T.labelLg,
    color: C.onSurfaceVariant,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...T.titleMd,
    color: C.onSurface,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  primaryBtn: {
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { ...T.titleLg, color: C.background },

  // ── Switch row ────────────────────────────────────────────────────────────
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: { ...T.bodyMd, color: C.onSurfaceVariant },
  switchLink: { ...T.bodyMd, color: C.primary, fontWeight: '600' },

  // ── Confirmation screen ───────────────────────────────────────────────────
  confirmText: {
    ...T.bodyLg,
    color: C.onSurfaceVariant,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  confirmEmail: { color: C.primary, fontWeight: '600' },
}), [C, T]);
}
