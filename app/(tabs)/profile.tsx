import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from '@/styles/tabs/profile.styles';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/format';

// ─── Static menu ─────────────────────────────────────────────────────────────

const MENU_SECTIONS = [
  {
    title: 'Fitness',
    items: [
      { label: 'Progress Photos',  icon: 'camera.fill'    as const },
      { label: 'Body Weight Log',  icon: 'scalemass.fill' as const },
      { label: 'Achievements',     icon: 'trophy.fill'    as const },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Edit Profile',       icon: 'pencil'    as const },
      { label: 'Notifications',      icon: 'bell.fill' as const },
      { label: 'Privacy & Security', icon: 'lock.fill' as const },
    ],
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [totalSessions, setTotalSessions] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function loadProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: profile }, { count }] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single(),
      supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    setFullName(profile?.full_name ?? '');
    setTotalSessions(count ?? 0);
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const displayName = fullName || 'Athlete';
  const avatarText  = fullName ? initials(fullName) : '?';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{avatarText}</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />
          ) : (
            <>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userRole}>FitConnect Athlete</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{totalSessions}</Text>
                  <Text style={styles.statLabel}>Workouts</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    idx < section.items.length - 1 && styles.menuItemBorder,
                  ]}>
                  <View style={styles.menuIconBox}>
                    <IconSymbol name={item.icon} size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <IconSymbol name="chevron.right" size={16} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign out */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <View style={styles.menuIconBox}>
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color={Colors.error} />
              </View>
              <Text style={[styles.menuLabel, { color: Colors.error }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
