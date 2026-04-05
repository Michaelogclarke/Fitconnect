import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
    color: Colors.primary,
    letterSpacing: -1,
  },
  tagline: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.xs,
  },

  // ── Form card ─────────────────────────────────────────────────────────────
  form: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  formTitle: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    marginBottom: Spacing.lg,
  },

  errorText: {
    ...Typography.bodyMd,
    color: Colors.error,
    backgroundColor: Colors.error + '18',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },

  // ── Fields ────────────────────────────────────────────────────────────────
  fieldGroup: { marginBottom: Spacing.md },
  label: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.titleMd,
    color: Colors.onSurface,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  primaryBtn: {
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { ...Typography.titleLg, color: Colors.background },

  // ── Switch row ────────────────────────────────────────────────────────────
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },
  switchLink: { ...Typography.bodyMd, color: Colors.primary, fontWeight: '600' },

  // ── Confirmation screen ───────────────────────────────────────────────────
  confirmText: {
    ...Typography.bodyLg,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  confirmEmail: { color: Colors.primary, fontWeight: '600' },
});
