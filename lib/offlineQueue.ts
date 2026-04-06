import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SavedSet = {
  set_number:   number;
  weight:       number | null;
  reps:         number | null;
  is_completed: boolean;
  completed_at: string | null;
};

export type SavedExercise = {
  exercise_name: string;
  muscle_group:  string;
  sort_order:    number;
  sets:          SavedSet[];
};

export type WorkoutSavePayload = {
  user_id:          string;
  name:             string;
  started_at:       string;
  finished_at:      string;
  duration_seconds: number;
  exercises:        SavedExercise[];
};

export type QueuedWorkout = {
  id:         string;   // local ID for dedup / debugging
  enqueuedAt: string;   // ISO timestamp
  payload:    WorkoutSavePayload;
};

// ─── Internal queue helpers ───────────────────────────────────────────────────

const QUEUE_KEY = 'offline:workout_queue';

async function readQueue(): Promise<QueuedWorkout[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedWorkout[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

// ─── Network error detection ──────────────────────────────────────────────────

/**
 * Returns true if the error looks like a network/connectivity failure.
 * Used to decide whether to queue a workout vs surface an error to the user.
 */
export function isNetworkError(err: unknown): boolean {
  if (!err) return false;
  const msg: string = (err as any)?.message ?? '';
  const name: string = (err as any)?.name ?? '';
  return (
    name === 'TypeError' ||                          // fetch throws TypeError on network failure
    msg.includes('Failed to fetch') ||
    msg.includes('Network request failed') ||
    msg.includes('fetch failed') ||
    msg.includes('ECONNREFUSED') ||
    msg.toLowerCase().includes('network')
  );
}

// ─── Queue operations ─────────────────────────────────────────────────────────

/** Append a workout payload to the offline queue. */
export async function enqueueWorkout(payload: WorkoutSavePayload): Promise<void> {
  const queue = await readQueue();
  queue.push({
    id:         Math.random().toString(36).slice(2),
    enqueuedAt: new Date().toISOString(),
    payload,
  });
  await writeQueue(queue);
}

/** Returns the number of workouts currently waiting to sync. */
export async function getPendingCount(): Promise<number> {
  const queue = await readQueue();
  return queue.length;
}

// ─── Flush ────────────────────────────────────────────────────────────────────

// Module-level mutex — prevents two concurrent flush calls from double-inserting
let flushing = false;

/**
 * Replay every queued workout to Supabase using the same 3-step insert chain
 * as finishWorkout. Workouts that succeed are removed from the queue; those
 * that fail remain so they can be retried later.
 *
 * Returns the number of workouts successfully flushed.
 */
export async function flushWorkoutQueue(): Promise<number> {
  if (flushing) return 0;
  flushing = true;

  try {
    const queue = await readQueue();
    if (queue.length === 0) return 0;

    // Auth check first — abort without touching the queue if not authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    let flushed = 0;
    const remaining: QueuedWorkout[] = [];

    for (const item of queue) {
      try {
        // Step 1: Create the session record
        const { data: session, error: sessionErr } = await supabase
          .from('workout_sessions')
          .insert({
            user_id:          item.payload.user_id,
            name:             item.payload.name,
            started_at:       item.payload.started_at,
            finished_at:      item.payload.finished_at,
            duration_seconds: item.payload.duration_seconds,
          })
          .select('id')
          .single();
        if (sessionErr) throw sessionErr;

        // Steps 2 & 3: Insert each exercise then its sets
        for (const ex of item.payload.exercises) {
          const { data: sessionEx, error: exErr } = await supabase
            .from('session_exercises')
            .insert({
              session_id:    session.id,
              exercise_name: ex.exercise_name,
              muscle_group:  ex.muscle_group,
              sort_order:    ex.sort_order,
            })
            .select('id')
            .single();
          if (exErr) throw exErr;

          if (ex.sets.length > 0) {
            const { error: setsErr } = await supabase
              .from('session_sets')
              .insert(
                ex.sets.map((s) => ({
                  session_exercise_id: sessionEx.id,
                  set_number:          s.set_number,
                  weight:              s.weight,
                  reps:                s.reps,
                  is_completed:        s.is_completed,
                  completed_at:        s.completed_at,
                }))
              );
            if (setsErr) throw setsErr;
          }
        }

        flushed++;
        // Success — item is NOT added to remaining, so it's removed from queue
      } catch {
        // Keep this item for the next retry attempt
        remaining.push(item);
      }
    }

    await writeQueue(remaining);
    return flushed;
  } finally {
    flushing = false;
  }
}
