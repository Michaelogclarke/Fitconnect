import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

export const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
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
    borderBottomColor: Colors.outlineVariant,
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
    color: Colors.onSurfaceVariant,
  },
  headerTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
  },
  saveBtn: {
    minWidth: 72,
    alignItems: 'flex-end',
    padding: Spacing.xs,
  },
  saveBtnText: {
    ...Typography.titleMd,
    color: Colors.primary,
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
    backgroundColor: Colors.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.primary,
  },

  // ── Form ───────────────────────────────────────────────────────────────────
  formSection: {
    marginHorizontal: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  formCard: {
    backgroundColor: Colors.surfaceContainer,
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
    color: Colors.onSurface,
    width: 90,
  },
  fieldInput: {
    flex: 1,
    ...Typography.titleMd,
    color: Colors.onSurface,
    textAlign: 'right',
  },
  errorText: {
    ...Typography.labelLg,
    color: Colors.error,
    marginTop: Spacing.sm,
    marginLeft: Spacing.xs,
  },
});
