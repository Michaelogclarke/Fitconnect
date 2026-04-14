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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    ...T.displayMd,
    color: C.onSurface,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  lockText: {
    ...T.labelLg,
    color: C.success,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: 2,
  },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: C.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...T.titleLg,
    color: C.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: Radius.full,
    backgroundColor: C.success,
    borderWidth: 2,
    borderColor: C.background,
  },
  threadInfo: {
    flex: 1,
  },
  threadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadName: {
    ...T.titleLg,
    color: C.onSurface,
  },
  threadTime: {
    ...T.labelMd,
    color: C.onSurfaceVariant,
  },
  threadPreview: {
    ...T.bodyMd,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  unreadText: {
    ...T.labelMd,
    color: C.background,
    fontSize: 10,
  },
  divider: {
    height: 1,
    backgroundColor: C.outlineVariant,
    marginLeft: 68,
  },
}), [C, T]);
}
