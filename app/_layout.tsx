import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Session } from '@supabase/supabase-js';
import 'react-native-reanimated';

import { supabase } from '@/lib/supabase';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { setCached, CACHE_KEYS } from '@/lib/cache';
import { flushWorkoutQueue } from '@/lib/offlineQueue';

// Warm the exercise library cache so exercise search works offline.
// Fire-and-forget — never blocks the UI.
async function warmExerciseCache(): Promise<void> {
  try {
    const { data } = await supabase
      .from('exercises')
      .select('name, muscle_group')
      .order('name');
    if (data) {
      await setCached(CACHE_KEYS.EXERCISES, data, 24 * 60 * 60 * 1000); // 24h
    }
  } catch {}
}

export default function RootLayout() {
  const router   = useRouter();
  const segments = useSegments();

  // undefined = still loading, null = signed out, Session = signed in
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // Warm the exercise cache whenever a session is established
      if (newSession) warmExerciseCache();
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Sync offline queue when app comes to foreground ───────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') flushWorkoutQueue();
    });
    return () => sub.remove();
  }, []);

  // ── Route guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (session === undefined) return; // still loading

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments]);

  return (
    <WorkoutProvider>
      <ThemeProvider value={DarkTheme}>
        <Stack>
          <Stack.Screen name="(tabs)"        options={{ headerShown: false }} />
          <Stack.Screen name="(auth)"        options={{ headerShown: false }} />
          <Stack.Screen name="start-workout" options={{ headerShown: false }} />
          <Stack.Screen name="edit-routine"  options={{ headerShown: false }} />
          <Stack.Screen name="plan-editor"      options={{ headerShown: false }} />
          <Stack.Screen name="session-detail"  options={{ headerShown: false }} />
          <Stack.Screen name="modal"         options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </WorkoutProvider>
  );
}
