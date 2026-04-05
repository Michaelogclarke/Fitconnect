import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from './profile.styles';

const MENU_SECTIONS = [
  {
    title: 'Fitness',
    items: [
      { label: 'Progress Photos', icon: 'camera.fill' as const },
      { label: 'Weight Tracking', icon: 'arrow.up.right' as const },
      { label: 'Achievements', icon: 'checkmark.circle.fill' as const },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Edit Profile', icon: 'pencil' as const },
      { label: 'Notifications', icon: 'bell.fill' as const },
      { label: 'Privacy & Security', icon: 'lock.fill' as const },
    ],
  },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>AC</Text>
          </View>
          <Text style={styles.userName}>Alex Clarke</Text>
          <Text style={styles.userRole}>Personal Trainer · Level 12</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>247</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Clients</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>18</Text>
              <Text style={styles.statLabel}>PRs</Text>
            </View>
          </View>
        </View>

        {/* Streak Banner */}
        <View style={styles.streakBanner}>
          <IconSymbol name="flame.fill" size={24} color={Colors.primary} />
          <Text style={styles.streakText}>Current Streak</Text>
          <Text style={styles.streakCount}>14</Text>
          <Text style={[styles.streakText, { flex: 0 }]}> days</Text>
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

      </ScrollView>
    </SafeAreaView>
  );
}
