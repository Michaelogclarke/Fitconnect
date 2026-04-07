import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

// ─── Shared types (imported by start-workout.tsx) ─────────────────────────────

export type SetRow    = { weight: string; reps: string; done: boolean };
export type Exercise  = { id: string; name: string; muscle: string; tag: string };
// endsAt is a Date.now() ms timestamp — stays correct even after leaving the screen
export type ActiveRest = { exId: string; setIdx: number; endsAt: number };

// ─── Context shape ────────────────────────────────────────────────────────────

type WorkoutContextType = {
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
  const [isActive,   setIsActive]   = useState(false);
  const [exercises,  setExercises]  = useState<Exercise[]>([]);
  const [setsState,  setSetsState]  = useState<Record<string, SetRow[]>>({});
  const [activeRest, setActiveRest] = useState<ActiveRest | null>(null);
  const [elapsed,    setElapsed]    = useState(0);
  const startedAt = useRef<Date | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer runs in context — keeps ticking even when start-workout screen is unmounted
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive]);

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
  }

  return (
    <WorkoutContext.Provider
      value={{
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
