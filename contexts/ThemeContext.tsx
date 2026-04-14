import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

import { DarkColors, LightColors, ColorSet } from '@/constants/theme';

const STORAGE_KEY = '@fitconnect:theme';

type ThemeMode = 'system' | 'dark' | 'light';

type ThemeContextValue = {
  colors:    ColorSet;
  isDark:    boolean;
  mode:      ThemeMode;
  setMode:   (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors:  DarkColors,
  isDark:  true,
  mode:    'system',
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const isDark =
    mode === 'dark' ? true :
    mode === 'light' ? false :
    systemScheme !== 'light';

  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, mode, setMode }}>
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
