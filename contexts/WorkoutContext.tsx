import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Shared types (imported by start-workout.tsx) ─────────────────────────────

export type SetRow    = { weight: string; reps: string; done: boolean };
export type Exercise  = { id: string; name: string; muscle: string; tag: string };
// endsAt is a Date.now() ms timestamp — stays correct even after leaving the screen
export type ActiveRest = { exId: string; setIdx: number; endsAt: number };

// ─── Persistence ──────────────────────────────────────────────────────────────

const WORKOUT_KEY = 'workout:active_session';

type PersistedWorkout = {
  exercises:  Exercise[];
  setsState:  Record<string, SetRow[]>;
  activeRest: ActiveRest | null;
  startedAt:  string; // ISO string
};

// ─── Context shape ────────────────────────────────────────────────────────────

type WorkoutContextType = {
  hydrated:   boolean;          // true once AsyncStorage restore attempt is done
  isActive:   boolean;
  exercises:  Exercise[];
  setsState:  Record<string, SetRow[]>;
  activeRest: ActiveRest | null;
  elapsed:    number;
  startedAt:  Date | null;

  startWorkout:         () => void;
  startWorkoutFromPlan: (exercises: Exercise[], setsState: Record<string, SetRow[]>) => void;
  clearWorkout:         () => void;
  setExercises:         React.Dispatch<React.SetStateAction<Exercise[]>>;
  setSetsState:         React.Dispatch<React.SetStateAction<Record<string, SetRow[]>>>;
  setActiveRest:        React.Dispatch<React.SetStateAction<ActiveRest | null>>;
};

const WorkoutContext = createContext<WorkoutContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [hydrated,   setHydrated]   = useState(false);
  const [isActive,   setIsActive]   = useState(false);
  const [exercises,  setExercises]  = useState<Exercise[]>([]);
  const [setsState,  setSetsState]  = useState<Record<string, SetRow[]>>({});
  const [activeRest, setActiveRest] = useState<ActiveRest | null>(null);
  const [elapsed,    setElapsed]    = useState(0);

  const startedAt = useRef<Date | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Restore from AsyncStorage on mount ────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(WORKOUT_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const saved: PersistedWorkout = JSON.parse(raw);
            startedAt.current = new Date(saved.startedAt);
            setExercises(saved.exercises);
            setSetsState(saved.setsState);
            setActiveRest(saved.activeRest);
            // Compute elapsed correctly even if app was closed for a while
            setElapsed(Math.floor((Date.now() - startedAt.current.getTime()) / 1000));
            setIsActive(true);
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  // ── Persist on every relevant change ──────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    if (isActive && startedAt.current) {
      const payload: PersistedWorkout = {
        exercises,
        setsState,
        activeRest,
        startedAt: startedAt.current.toISOString(),
      };
      AsyncStorage.setItem(WORKOUT_KEY, JSON.stringify(payload)).catch(() => {});
    } else if (!isActive) {
      AsyncStorage.removeItem(WORKOUT_KEY).catch(() => {});
    }
  }, [hydrated, isActive, exercises, setsState, activeRest]);

  // ── Timer — compute from startedAt so it survives background pauses ───────
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (startedAt.current) {
          setElapsed(Math.floor((Date.now() - startedAt.current.getTime()) / 1000));
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive]);

  // ─── Workout actions ──────────────────────────────────────────────────────

  function startWorkout() {
    setExercises([]);
    setSetsState({});
    setActiveRest(null);
    setElapsed(0);
    startedAt.current = new Date();
    setIsActive(true);
  }

  function startWorkoutFromPlan(
    planExercises: Exercise[],
    planSetsState: Record<string, SetRow[]>,
  ) {
    setExercises(planExercises);
    setSetsState(planSetsState);
    setActiveRest(null);
    setElapsed(0);
    startedAt.current = new Date();
    setIsActive(true);
  }

  function clearWorkout() {
    setIsActive(false);
    setExercises([]);
    setSetsState({});
    setActiveRest(null);
    setElapsed(0);
    startedAt.current = null;
    AsyncStorage.removeItem(WORKOUT_KEY).catch(() => {});
  }

  return (
    <WorkoutContext.Provider
      value={{
        hydrated,
        isActive,
        exercises,
        setsState,
        activeRest,
        elapsed,
        startedAt: startedAt.current,
        startWorkout,
        startWorkoutFromPlan,
        clearWorkout,
        setExercises,
        setSetsState,
        setActiveRest,
      }}>
      {children}
    </WorkoutContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
}
