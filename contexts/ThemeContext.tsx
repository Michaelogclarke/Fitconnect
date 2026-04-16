import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

import { DarkColors, LightColors, ColorSet } from '@/constants/theme';

const STORAGE_KEY       = '@fitconnect:theme';
const ACCENT_STORAGE_KEY = '@fitconnect:accent';

type ThemeMode = 'system' | 'dark' | 'light';

export const ACCENT_COLORS = [
  { label: 'Cyan',    value: '#81ecff' },
  { label: 'Blue',    value: '#4A9EFF' },
  { label: 'Purple',  value: '#A78BFA' },
  { label: 'Pink',    value: '#F472B6' },
  { label: 'Red',     value: '#F87171' },
  { label: 'Orange',  value: '#FB923C' },
  { label: 'Yellow',  value: '#FBBF24' },
  { label: 'Green',   value: '#34D399' },
] as const;

export type AccentColor = typeof ACCENT_COLORS[number]['value'];

const DEFAULT_DARK_ACCENT  = '#81ecff';
const DEFAULT_LIGHT_ACCENT = '#0088aa';

type ThemeContextValue = {
  colors:         ColorSet;
  isDark:         boolean;
  mode:           ThemeMode;
  setMode:        (mode: ThemeMode) => void;
  accentColor:    AccentColor;
  setAccentColor: (color: AccentColor) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors:         DarkColors,
  isDark:         true,
  mode:           'system',
  setMode:        () => {},
  accentColor:    DEFAULT_DARK_ACCENT,
  setAccentColor: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode,        setModeState]    = useState<ThemeMode>('system');
  const [accentColor, setAccentState]  = useState<AccentColor>(DEFAULT_DARK_ACCENT);

  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEY, ACCENT_STORAGE_KEY]).then(([[, storedMode], [, storedAccent]]) => {
      if (storedMode === 'dark' || storedMode === 'light' || storedMode === 'system') {
        setModeState(storedMode);
      }
      if (storedAccent && ACCENT_COLORS.some((c) => c.value === storedAccent)) {
        setAccentState(storedAccent as AccentColor);
      }
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentState(color);
    AsyncStorage.setItem(ACCENT_STORAGE_KEY, color);
  }, []);

  const isDark =
    mode === 'dark'  ? true  :
    mode === 'light' ? false :
    systemScheme !== 'light';

  const baseColors = isDark ? DarkColors : LightColors;

  const colors: ColorSet = {
    ...baseColors,
    primary:         accentColor,
    onPrimary:       isDark ? '#000000' : '#ffffff',
    tabIconSelected: accentColor,
  };

  return (
    <ThemeContext.Provider value={{ colors, isDark, mode, setMode, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColors(): ColorSet {
  return useContext(ThemeContext).colors;
}

export function useTheme() {
  return useContext(ThemeContext);
}
