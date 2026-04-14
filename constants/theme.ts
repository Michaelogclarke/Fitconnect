/**
 * FitConnect Design Tokens
 * Based on the "Kinetic Pulse" design system.
 * Supports both dark (default) and light themes.
 */

export const DarkColors = {
  background:               '#0e0e0e',
  surfaceContainerLow:      '#131313',
  surfaceContainer:         '#1a1a1a',
  surfaceContainerHigh:     '#20201f',
  surfaceContainerHighest:  '#262626',
  onSurface:                '#ffffff',
  onSurfaceVariant:         '#adaaaa',
  primary:                  '#81ecff',
  primaryDim:               '#00d4ec',
  secondary:                '#10d5ff',
  tertiary:                 '#70aaff',
  error:                    '#ff716c',
  success:                  '#4edea3',
  outline:                  '#767575',
  outlineVariant:           '#484847',
  tabIconDefault:           '#767575',
  tabIconSelected:          '#81ecff',
  tabBarBackground:         '#131313',
};

export const LightColors = {
  background:               '#f5f6fa',
  surfaceContainerLow:      '#eeeff3',
  surfaceContainer:         '#e6e8ed',
  surfaceContainerHigh:     '#dddfe5',
  surfaceContainerHighest:  '#d4d6dc',
  onSurface:                '#0d0d0d',
  onSurfaceVariant:         '#505060',
  primary:                  '#0088aa',
  primaryDim:               '#006d8a',
  secondary:                '#0077bb',
  tertiary:                 '#2244bb',
  error:                    '#cc2222',
  success:                  '#1a8a5a',
  outline:                  '#888899',
  outlineVariant:           '#c8cad2',
  tabIconDefault:           '#888899',
  tabIconSelected:          '#0088aa',
  tabBarBackground:         '#eeeff3',
};

// Default export kept for backward compat — screens use useColors() instead
export const Colors = DarkColors;

export type ColorSet = typeof DarkColors;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  xxxl: 48,
};

export const Radius = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  full: 999,
};

export const Typography = {
  displayLg:  { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  displayMd:  { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  headlineLg: { fontSize: 22, fontWeight: '700' as const },
  headlineMd: { fontSize: 18, fontWeight: '600' as const },
  titleLg:    { fontSize: 16, fontWeight: '600' as const },
  titleMd:    { fontSize: 14, fontWeight: '600' as const },
  bodyLg:     { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMd:     { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  labelLg:    { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.5 },
  labelMd:    { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.8 },
};
