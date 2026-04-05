import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from './index.styles';

const WEIGHT_DAYS = [
  { label: 'Mon', height: 40, active: false },
  { label: 'Tue', height: 48, active: false },
  { label: 'Wed', height: 44, active: false },
  { label: 'Thu', height: 52, active: false },
  { label: 'Fri', height: 46, active: false },
  { label: 'Sat', height: 50, active: false },
  { label: 'Today', height: 54, active: true },
];

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandText}>FitConnect</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="bell.fill" size={20} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Performance Card */}
        <View style={styles.performanceCard}>
          <Text style={styles.performanceLabel}>Daily Score</Text>
          <Text style={styles.performanceGreeting}>Level Up, Alex</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreNumber}>78</Text>
            <Text style={styles.scoreSubtext}>/ 100</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live Session</Text>
          </View>
        </View>

        {/* Active Workout */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Workout</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.workoutCard}>
          <Text style={styles.workoutTitle}>Hypertrophy Phase II: Chest</Text>
          <Text style={styles.workoutDesc}>
            Focus on compound lifts with progressive overload. 4 sets x 8-12 reps.
          </Text>
          <View style={styles.workoutActions}>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/start-workout')}>
              <Text style={styles.btnPrimaryText}>Start Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push('/edit-routine')}>
              <Text style={styles.btnSecondaryText}>Edit Routine</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <IconSymbol name="flame.fill" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.metricValue}>420</Text>
            <Text style={styles.metricLabel}>Calories</Text>
            <Text style={styles.metricSub}>kcal burned</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <IconSymbol name="heart.fill" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.metricValue}>8,420</Text>
            <Text style={styles.metricLabel}>Steps</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '84%' }]} />
            </View>
            <Text style={styles.metricSub}>10,000 goal</Text>
          </View>
        </View>

        {/* Weight Trend */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weight Trend</Text>
        </View>
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendTitle}>7-Day Progress</Text>
            <Text style={styles.trendValue}>184.5 lbs</Text>
          </View>
          <View style={styles.trendDays}>
            {WEIGHT_DAYS.map((day) => (
              <View key={day.label} style={styles.trendDay}>
                <View
                  style={[
                    styles.trendDayBar,
                    { height: day.height },
                    day.active && styles.trendDayBarActive,
                  ]}
                />
                <Text style={styles.trendDayLabel}>{day.label}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
