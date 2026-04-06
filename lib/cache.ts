import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Cache key constants ──────────────────────────────────────────────────────

export const CACHE_KEYS = {
  EXERCISES: 'cache:exercises',
  HOME_DATA:  'cache:home_data',
  HISTORY:    'cache:history',
  PLANS:      'cache:plans',
  PROFILE:    'cache:profile',
} as const;

// ─── Internal types ───────────────────────────────────────────────────────────

type CacheEntry<T> = {
  data:      T;
  expiresAt: number;   // Date.now() ms timestamp
};

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Store a value in cache with an expiry timestamp.
 * Failures are swallowed — cache operations must never crash the app.
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {}
}

/**
 * Return cached data only if it is still within its TTL.
 * Returns null if the entry is missing or expired.
 * Use this to decide whether a network fetch can be skipped.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) return null;
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Return cached data regardless of whether it has expired.
 * Use this as an offline fallback when a Supabase call fails.
 */
export async function getCachedAny<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    return entry.data;
  } catch {
    return null;
  }
}
