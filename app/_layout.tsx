import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import 'react-native-reanimated';

import { supabase } from '@/lib/supabase';

export default function RootLayout() {
  const router   = useRouter();
  const segments = useSegments();

  // undefined = still loading, null = signed out, Session = signed in
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    // Listen for sign-in / sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return; // still loading

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Not signed in — go to sign-in
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      // Signed in — go to app
      router.replace('/(tabs)');
    }
  }, [session, segments]);

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)"        options={{ headerShown: false }} />
        <Stack.Screen name="(auth)"        options={{ headerShown: false }} />
        <Stack.Screen name="start-workout" options={{ headerShown: false }} />
        <Stack.Screen name="edit-routine"  options={{ headerShown: false }} />
        <Stack.Screen name="modal"         options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
