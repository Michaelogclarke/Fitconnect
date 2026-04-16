import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Session } from '@supabase/supabase-js';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { supabase } from '@/lib/supabase';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { SpotifyProvider } from '@/contexts/SpotifyContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { PrefsProvider } from '@/contexts/PrefsContext';
import { setCached, CACHE_KEYS } from '@/lib/cache';
import { flushWorkoutQueue } from '@/lib/offlineQueue';
import { registerPushToken } from '@/lib/notifications';
import { ONBOARDING_KEY } from './onboarding';

async function warmExerciseCache(): Promise<void> {
  try {
    const { data } = await supabase
      .from('exercises')
      .select('name, muscle_group')
      .order('name');
    if (data) await setCached(CACHE_KEYS.EXERCISES, data, 24 * 60 * 60 * 1000);
  } catch {}
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <PrefsProvider>
        <AppShell />
      </PrefsProvider>
    </ThemeProvider>
  );
}

function AppShell() {
  const { isDark } = useTheme();
  const router     = useRouter();
  const segments   = useSegments();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) { warmExerciseCache(); registerPushToken(); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Sync offline queue on foreground ─────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') flushWorkoutQueue();
    });
    return () => sub.remove();
  }, []);

  // ── Route guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (session === undefined) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      AsyncStorage.getItem(ONBOARDING_KEY).then((done) => {
        if (done === 'true') router.replace('/(tabs)');
        else router.replace('/onboarding' as any);
      });
    }
  }, [session, segments]);

  // ── Notification deep-linking ─────────────────────────────────────────────
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen as string | undefined;
      if (screen === 'start-workout') router.push('/start-workout' as any);
      else if (screen === 'home') router.replace('/(tabs)');
    });
    return () => sub.remove();
  }, []);

  return (
    <WorkoutProvider>
      <SpotifyProvider>
        <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)"               options={{ headerShown: false }} />
            <Stack.Screen name="(auth)"               options={{ headerShown: false }} />
            <Stack.Screen name="start-workout"        options={{ headerShown: false }} />
            <Stack.Screen name="edit-routine"         options={{ headerShown: false }} />
            <Stack.Screen name="plan-editor"          options={{ headerShown: false }} />
            <Stack.Screen name="session-detail"       options={{ headerShown: false }} />
            <Stack.Screen name="edit-profile"         options={{ headerShown: false }} />
            <Stack.Screen name="set-availability"     options={{ headerShown: false }} />
            <Stack.Screen name="book-session"         options={{ headerShown: false }} />
            <Stack.Screen name="bookings"             options={{ headerShown: false }} />
            <Stack.Screen name="modal"                options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="spotify-auth"         options={{ headerShown: false }} />
            <Stack.Screen name="privacy-policy"       options={{ headerShown: false }} />
            <Stack.Screen name="terms"                options={{ headerShown: false }} />
            <Stack.Screen name="body-weight-log"      options={{ headerShown: false }} />
            <Stack.Screen name="achievements"         options={{ headerShown: false }} />
            <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
            <Stack.Screen name="notifications"         options={{ headerShown: false }} />
            <Stack.Screen name="progress-photos"      options={{ headerShown: false }} />
            <Stack.Screen name="client-onboarding"   options={{ headerShown: false }} />
            <Stack.Screen name="onboarding"           options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="app-settings"         options={{ headerShown: false }} />
            <Stack.Screen name="dev-tools"            options={{ headerShown: false }} />
            <Stack.Screen name="conversation"         options={{ headerShown: false }} />
            <Stack.Screen name="trainer-listing"     options={{ headerShown: false }} />
            <Stack.Screen name="trainer-marketplace" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </NavThemeProvider>
      </SpotifyProvider>
    </WorkoutProvider>
  );
}
