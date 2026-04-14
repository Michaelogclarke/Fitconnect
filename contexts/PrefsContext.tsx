import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FontScale      = 'small' | 'medium' | 'large';
export type WeightIncrement = 0.5 | 1 | 2.5 | 5;
export type RestTimer       = 60 | 90 | 120 | 180;

export type HomeCards = {
  streak:         boolean;
  quickStats:     boolean;
  weeklyGoal:     boolean;
  recentSessions: boolean;
};

type PrefsContextValue = {
  restTimer:          RestTimer;
  setRestTimer:       (v: RestTimer) => void;
  fontScale:          FontScale;
  setFontScale:       (v: FontScale) => void;
  weightIncrement:    WeightIncrement;
  setWeightIncrement: (v: WeightIncrement) => void;
  homeCards:          HomeCards;
  setHomeCard:        (key: keyof HomeCards, value: boolean) => void;
  typography:         typeof Typography;
};

// ─── Font scale ───────────────────────────────────────────────────────────────

const SCALE_FACTOR: Record<FontScale, number> = {
  small:  0.875,
  medium: 1.0,
  large:  1.15,
};

function scaleTypography(fs: FontScale): typeof Typography {
  const mult = SCALE_FACTOR[fs];
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(Typography)) {
    result[key] = { ...val, fontSize: Math.round(val.fontSize * mult * 2) / 2 };
    if ('lineHeight' in val && val.lineHeight) {
      result[key].lineHeight = Math.round(val.lineHeight * mult);
    }
  }
  return result as typeof Typography;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  restTimer:       '@fitconnect:restTimer',
  fontScale:       '@fitconnect:fontScale',
  weightIncrement: '@fitconnect:weightIncrement',
  homeCards:       '@fitconnect:homeCards',
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_HOME_CARDS: HomeCards = {
  streak:         true,
  quickStats:     true,
  weeklyGoal:     true,
  recentSessions: true,
};

const DEFAULT_TYPOGRAPHY = scaleTypography('medium');

const PrefsContext = createContext<PrefsContextValue>({
  restTimer:          120,
  setRestTimer:       () => {},
  fontScale:          'medium',
  setFontScale:       () => {},
  weightIncrement:    2.5,
  setWeightIncrement: () => {},
  homeCards:          DEFAULT_HOME_CARDS,
  setHomeCard:        () => {},
  typography:         DEFAULT_TYPOGRAPHY,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [restTimer,       setRestTimerState]       = useState<RestTimer>(120);
  const [fontScale,       setFontScaleState]       = useState<FontScale>('medium');
  const [weightIncrement, setWeightIncrementState] = useState<WeightIncrement>(2.5);
  const [homeCards,       setHomeCardsState]       = useState<HomeCards>(DEFAULT_HOME_CARDS);

  useEffect(() => {
    AsyncStorage.multiGet([KEYS.restTimer, KEYS.fontScale, KEYS.weightIncrement, KEYS.homeCards])
      .then(([[, rt], [, fs], [, wi], [, hc]]) => {
        if (rt) setRestTimerState(Number(rt) as RestTimer);
        if (fs === 'small' || fs === 'medium' || fs === 'large') setFontScaleState(fs);
        if (wi) setWeightIncrementState(Number(wi) as WeightIncrement);
        if (hc) {
          try { setHomeCardsState({ ...DEFAULT_HOME_CARDS, ...JSON.parse(hc) }); } catch {}
        }
      });
  }, []);

  const setRestTimer = useCallback((v: RestTimer) => {
    setRestTimerState(v);
    AsyncStorage.setItem(KEYS.restTimer, String(v));
  }, []);

  const setFontScale = useCallback((v: FontScale) => {
    setFontScaleState(v);
    AsyncStorage.setItem(KEYS.fontScale, v);
  }, []);

  const setWeightIncrement = useCallback((v: WeightIncrement) => {
    setWeightIncrementState(v);
    AsyncStorage.setItem(KEYS.weightIncrement, String(v));
  }, []);

  const setHomeCard = useCallback((key: keyof HomeCards, value: boolean) => {
    setHomeCardsState((prev) => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(KEYS.homeCards, JSON.stringify(next));
      return next;
    });
  }, []);

  const typography = useMemo(() => scaleTypography(fontScale), [fontScale]);

  return (
    <PrefsContext.Provider value={{
      restTimer, setRestTimer,
      fontScale, setFontScale,
      weightIncrement, setWeightIncrement,
      homeCards, setHomeCard,
      typography,
    }}>
      {children}
    </PrefsContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function usePrefs() {
  return useContext(PrefsContext);
}

/** Returns typography constants scaled to the user's font size preference. */
export function useTypography() {
  return useContext(PrefsContext).typography;
}
