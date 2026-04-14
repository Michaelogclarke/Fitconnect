import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/contexts/ThemeContext';
import { useStyles } from '@/styles/tabs/workouts.styles';

const FILTERS = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Core'];

const WORKOUTS = [
  { id: '1', name: 'Hypertrophy Phase II: Chest', meta: '4 sets · 45 min', tag: 'Active' },
  { id: '2', name: 'Pull Day — Back & Biceps', meta: '5 sets · 55 min', tag: 'Scheduled' },
  { id: '3', name: 'Lower Body Power', meta: '4 sets · 60 min', tag: 'Scheduled' },
  { id: '4', name: 'Core & Stability', meta: '3 sets · 30 min', tag: 'Rest' },
  { id: '5', name: 'Full Body HIIT', meta: '6 rounds · 40 min', tag: 'Scheduled' },
];

export default function WorkoutsScreen() {
  const C = useColors();
  const styles = useStyles();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <Text style={styles.subtitle}>Your training programme</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <IconSymbol name="chevron.right" size={18} color={C.onSurfaceVariant} />
        <Text style={styles.searchText}>Search workouts…</Text>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}>
            <Text
              style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Log Workout CTA */}
      <TouchableOpacity style={styles.logBtn} onPress={() => router.push('/start-workout')}>
        <Text style={styles.logBtnText}>+ Log Today's Workout</Text>
      </TouchableOpacity>

      {/* Workout List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {WORKOUTS.map((w) => (
          <TouchableOpacity key={w.id} style={styles.workoutCard} onPress={() => router.push('/start-workout')}>
            <View style={styles.workoutIconBox}>
              <IconSymbol name="dumbbell.fill" size={22} color={C.primary} />
            </View>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutName}>{w.name}</Text>
              <Text style={styles.workoutMeta}>{w.meta}</Text>
            </View>
            <View style={styles.workoutBadge}>
              <Text style={styles.workoutBadgeText}>{w.tag}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
