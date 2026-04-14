import React, { useEffect, useState } from 'react';
import {
  Alert, Clipboard, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { clearCache } from '@/lib/cache';

// ─── Types ────────────────────────────────────────────────────────────────────

type DevStat = { label: string; value: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const FITCONNECT_KEYS = [
  '@fitconnect:onboarding_done',
  '@fitconnect:workout_count',
  '@fitconnect:accent',
  '@fitconnect:theme',
  '@fitconnect:restTimer',
  '@fitconnect:fontScale',
  '@fitconnect:weightIncrement',
  '@fitconnect:homeCards',
  'pref:weekly_goal',
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DevToolsScreen() {
  const C      = useColors();
  const router = useRouter();

  const [userId,    setUserId]    = useState('Loading...');
  const [userEmail, setUserEmail] = useState('');
  const [userRole,  setUserRole]  = useState('');
  const [stats,     setStats]     = useState<DevStat[]>([]);

  useEffect(() => { loadInfo(); }, []);

  async function loadInfo() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    setUserEmail(user.email ?? '');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();
    setUserRole(profile?.role ?? '');

    // AsyncStorage snapshot
    const pairs = await Promise.all(
      FITCONNECT_KEYS.map(async (k) => ({ label: k, value: (await AsyncStorage.getItem(k)) ?? '(not set)' }))
    );
    setStats(pairs);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const card = {
    backgroundColor: C.surfaceContainer,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden' as const,
  };
  const row = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
  };
  const divider = { height: 1, backgroundColor: C.outlineVariant, marginLeft: Spacing.md + 36 };
  const iconBox = (danger = false) => ({
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: danger ? C.error + '22' : C.primary + '22',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  });
  const sectionTitle = {
    ...Typography.labelLg,
    color: C.onSurfaceVariant,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    fontSize: 11,
  };

  function devRow(
    label: string,
    iconName: Parameters<typeof IconSymbol>[0]['name'],
    onPress: () => void,
    danger = false,
    last = false,
  ) {
    return (
      <React.Fragment key={label}>
        <TouchableOpacity style={row} onPress={onPress} activeOpacity={0.7}>
          <View style={iconBox(danger)}>
            <IconSymbol name={iconName} size={16} color={danger ? C.error : C.primary} />
          </View>
          <Text style={{ ...Typography.bodyLg, color: danger ? C.error : C.onSurface, flex: 1 }}>{label}</Text>
          <IconSymbol name="chevron.right" size={14} color={C.outlineVariant} />
        </TouchableOpacity>
        {!last && <View style={divider} />}
      </React.Fragment>
    );
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  function copyUserId() {
    Clipboard.setString(userId);
    Alert.alert('Copied', 'User ID copied to clipboard.');
  }

  async function resetOnboarding() {
    await AsyncStorage.removeItem('@fitconnect:onboarding_done');
    router.replace('/onboarding' as any);
  }

  async function resetWorkoutCount() {
    await AsyncStorage.removeItem('@fitconnect:workout_count');
    Alert.alert('Done', 'Workout count reset to 0.');
    loadInfo();
  }

  async function clearAllLocalData() {
    Alert.alert(
      'Clear Local Data',
      'This removes all cached preferences and flags stored on this device. Nothing is deleted from the server.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(FITCONNECT_KEYS);
            await clearCache();
            Alert.alert('Done', 'All local data cleared. Restart the app for full effect.');
            loadInfo();
          },
        },
      ]
    );
  }

  async function forceNotification() {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('No Permission', 'Notification permission not granted.');
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a dev test notification from FitConnect.',
        data: { screen: 'home' },
      },
      trigger: { seconds: 3 },
    });
    Alert.alert('Scheduled', 'Notification will fire in 3 seconds. Background the app.');
  }

  async function forceRatePrompt() {
    try {
      const StoreReview = await import('expo-store-review');
      if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview();
      } else {
        Alert.alert('Dev', 'StoreReview not available on this device/simulator.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message);
    }
  }

  async function toggleRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const newRole = userRole === 'trainer' ? 'client' : 'trainer';
    Alert.alert(
      'Toggle Role',
      `Switch role from ${userRole} → ${newRole}? You'll need to reload the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
            setUserRole(newRole);
            Alert.alert('Done', `Role set to ${newRole}. Reload the app to see the change.`);
          },
        },
      ]
    );
  }

  async function seedWorkouts() {
    Alert.alert(
      'Seed Test Workouts',
      'Creates 5 fake workout sessions over the past week for testing charts and stats.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seed',
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const names = ['Push Day', 'Pull Day', 'Leg Day', 'Upper Body', 'Full Body'];
            const now = Date.now();
            for (let i = 0; i < 5; i++) {
              const started = new Date(now - i * 24 * 60 * 60 * 1000 - i * 3600 * 1000).toISOString();
              await supabase.from('workout_sessions').insert({
                user_id:          user.id,
                name:             names[i],
                started_at:       started,
                duration_seconds: 2400 + i * 300,
              });
            }
            Alert.alert('Done', '5 test sessions created. Pull to refresh the home screen.');
          },
        },
      ]
    );
  }

  async function deleteAllSessions() {
    Alert.alert(
      'Delete All Sessions',
      'Permanently deletes every workout session for this account from the server. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { error } = await supabase
              .from('workout_sessions')
              .delete()
              .eq('user_id', user.id);
            if (error) Alert.alert('Error', error.message);
            else Alert.alert('Done', 'All sessions deleted.');
          },
        },
      ]
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={{ ...Typography.titleLg, color: C.error, flex: 1 }}>Dev Tools</Text>
        <View style={{ backgroundColor: C.error + '22', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full }}>
          <Text style={{ ...Typography.labelMd, color: C.error, fontWeight: '700' }}>DEV</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── Identity ─────────────────────────────────────────────────── */}
        <Text style={sectionTitle}>Identity</Text>
        <View style={card}>
          <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: 6 }}>
            <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant }}>User ID</Text>
            <TouchableOpacity onPress={copyUserId} activeOpacity={0.7}>
              <Text style={{ ...Typography.bodyMd, color: C.primary, fontFamily: 'monospace' }} numberOfLines={1}>
                {userId}
              </Text>
              <Text style={{ ...Typography.labelMd, color: C.onSurfaceVariant, marginTop: 2 }}>Tap to copy</Text>
            </TouchableOpacity>
          </View>
          <View style={divider} />
          <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: 6 }}>
            <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant }}>Email</Text>
            <Text style={{ ...Typography.bodyMd, color: C.onSurface }}>{userEmail || '—'}</Text>
          </View>
          <View style={divider} />
          <TouchableOpacity style={row} onPress={toggleRole} activeOpacity={0.7}>
            <View style={iconBox()}>
              <IconSymbol name="person.2.fill" size={16} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...Typography.bodyLg, color: C.onSurface }}>Toggle Role</Text>
              <Text style={{ ...Typography.labelMd, color: C.onSurfaceVariant }}>
                Currently: <Text style={{ color: C.primary, fontWeight: '600' }}>{userRole || '—'}</Text>
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={14} color={C.outlineVariant} />
          </TouchableOpacity>
        </View>

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <Text style={sectionTitle}>Navigation</Text>
        <View style={card}>
          {devRow('Reset Onboarding', 'arrow.up.circle.fill', resetOnboarding, false, false)}
          {devRow('Go to Onboarding (keep flag)', 'arrow.up', () => router.push('/onboarding' as any), false, true)}
        </View>

        {/* ── Data ─────────────────────────────────────────────────────── */}
        <Text style={sectionTitle}>Data</Text>
        <View style={card}>
          {devRow('Seed 5 Test Workouts', 'dumbbell.fill', seedWorkouts, false, false)}
          {devRow('Reset Workout Count', 'arrow.up.circle.fill', resetWorkoutCount, false, false)}
          {devRow('Clear Local Cache', 'trash', clearAllLocalData, true, false)}
          {devRow('Delete All Sessions', 'trash.fill', deleteAllSessions, true, true)}
        </View>

        {/* ── UI & Notifications ───────────────────────────────────────── */}
        <Text style={sectionTitle}>UI & Notifications</Text>
        <View style={card}>
          {devRow('Fire Test Notification (3s)', 'bell.fill', forceNotification, false, false)}
          {devRow('Force Rate-App Prompt', 'star.fill', forceRatePrompt, false, true)}
        </View>

        {/* ── AsyncStorage snapshot ─────────────────────────────────────── */}
        <Text style={sectionTitle}>Local Storage Snapshot</Text>
        <View style={[card, { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }]}>
          {stats.map((s, i) => (
            <View key={s.label} style={{ paddingVertical: 8, borderBottomWidth: i < stats.length - 1 ? 1 : 0, borderBottomColor: C.outlineVariant }}>
              <Text style={{ ...Typography.labelMd, color: C.onSurfaceVariant, fontFamily: 'monospace' }} numberOfLines={1}>
                {s.label.replace('@fitconnect:', '').replace('pref:', '')}
              </Text>
              <Text style={{ ...Typography.bodyMd, color: C.onSurface, marginTop: 2 }} numberOfLines={2}>
                {s.value}
              </Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
