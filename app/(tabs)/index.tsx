import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from '@/styles/tabs/index.styles';

const TODAY_WORKOUT = {
  name: 'Push Day A',
  plan: 'Push Pull Legs',
  exercises: ['Flat Barbell Bench Press', 'Overhead Press', 'Incline DB Press', 'Lateral Raises', 'Tricep Pushdown'],
  estimatedTime: '55 min',
  totalSets: 16,
};

const RECENT_SESSIONS = [
  { id: '1', name: 'Pull Day A',  date: 'Yesterday', duration: '48 min', sets: 14, volume: '4,200 kg' },
  { id: '2', name: 'Legs A',      date: 'Monday',    duration: '62 min', sets: 16, volume: '6,800 kg' },
  { id: '3', name: 'Push Day B',  date: 'Sunday',    duration: '51 min', sets: 15, volume: '3,900 kg' },
];

export default function HomeScreen() {
  const router = useRouter();
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Let's get it, Alex</Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <IconSymbol name="bell.fill" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Streak */}
        <View style={styles.streakRow}>
          <View style={styles.streakBadge}>
            <IconSymbol name="flame.fill" size={13} color={Colors.primary} />
            <Text style={styles.streakText}>14-day streak</Text>
          </View>
        </View>

        {/* Today's workout */}
        <Text style={styles.sectionLabel}>Today's Workout</Text>
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.todayName}>{TODAY_WORKOUT.name}</Text>
              <Text style={styles.todayMeta}>
                {TODAY_WORKOUT.plan} · {TODAY_WORKOUT.estimatedTime} · {TODAY_WORKOUT.totalSets} sets
              </Text>
            </View>
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Today</Text>
            </View>
          </View>

          <View style={styles.exerciseList}>
            {TODAY_WORKOUT.exercises.slice(0, 4).map((ex, i) => (
              <Text key={i} style={styles.exerciseItem}>· {ex}</Text>
            ))}
            {TODAY_WORKOUT.exercises.length > 4 && (
              <Text style={styles.exerciseMore}>+{TODAY_WORKOUT.exercises.length - 4} more</Text>
            )}
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={() => router.push('/start-workout')}>
            <IconSymbol name="play.fill" size={15} color={Colors.background} />
            <Text style={styles.startBtnText}>Start Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>This week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>14,200</Text>
            <Text style={styles.statLabel}>kg lifted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>247</Text>
            <Text style={styles.statLabel}>All time</Text>
          </View>
        </View>

        {/* Recent sessions */}
        <Text style={styles.sectionLabel}>Recent Sessions</Text>
        {RECENT_SESSIONS.map((s) => (
          <View key={s.id} style={styles.recentCard}>
            <View style={styles.recentIconBox}>
              <IconSymbol name="dumbbell.fill" size={18} color={Colors.primary} />
            </View>
            <View style={styles.recentInfo}>
              <Text style={styles.recentName}>{s.name}</Text>
              <Text style={styles.recentMeta}>{s.date} · {s.duration} · {s.sets} sets</Text>
            </View>
            <Text style={styles.recentVolume}>{s.volume}</Text>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}
