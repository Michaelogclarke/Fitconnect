/**
 * FitConnect Design Tokens
 * Based on the "Kinetic Pulse" design system — dark mode, electric blue accents.
 * Style files use StyleSheet.create() (RN's CSS-modules equivalent).
 */

export const Colors = {
  // Backgrounds & surfaces
  background: '#0e0e0e',
  surfaceContainerLow: '#131313',
  surfaceContainer: '#1a1a1a',
  surfaceContainerHigh: '#20201f',
  surfaceContainerHighest: '#262626',

  // Text
  onSurface: '#ffffff',
  onSurfaceVariant: '#adaaaa',

  // Brand accents
  primary: '#81ecff',
  primaryDim: '#00d4ec',
  secondary: '#10d5ff',
  tertiary: '#70aaff',

  // Semantic
  error: '#ff716c',
  success: '#4edea3',

  // Outlines
  outline: '#767575',
  outlineVariant: '#484847',

  // Tab bar
  tabIconDefault: '#767575',
  tabIconSelected: '#81ecff',
  tabBarBackground: '#131313',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const Typography = {
  displayLg: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  displayMd: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  headlineLg: { fontSize: 22, fontWeight: '700' as const },
  headlineMd: { fontSize: 18, fontWeight: '600' as const },
  titleLg: { fontSize: 16, fontWeight: '600' as const },
  titleMd: { fontSize: 14, fontWeight: '600' as const },
  bodyLg: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMd: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  labelLg: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.5 },
  labelMd: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.8 },
};
