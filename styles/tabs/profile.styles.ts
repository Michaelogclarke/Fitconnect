import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Spacing, Radius, ColorSet } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useTypography } from '@/contexts/PrefsContext';

export function useStyles() {
  const C = useColors();
  const T = useTypography();
  return useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: C.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: C.primary,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: C.primary,
  },
  userName: {
    ...T.headlineLg,
    color: C.onSurface,
  },
  userRole: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xxl,
    marginTop: Spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...T.headlineLg,
    color: C.primary,
  },
  statLabel: {
    ...T.labelLg,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...T.labelLg,
    color: C.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuCard: {
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: C.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    ...T.titleMd,
    color: C.onSurface,
    flex: 1,
  },
  menuChevron: {
    color: C.onSurfaceVariant,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary + '15',
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: C.primary + '40',
  },
  streakText: {
    ...T.titleMd,
    color: C.primary,
    flex: 1,
  },
  streakCount: {
    ...T.displayMd,
    color: C.primary,
  },
}), [C, T]);
}
