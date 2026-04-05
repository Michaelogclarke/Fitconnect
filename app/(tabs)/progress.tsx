import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from '@/styles/tabs/progress.styles';

// ─── Data ─────────────────────────────────────────────────────────────────────

const BODY_WEIGHT = [
  { label: 'Mon', value: 84.2 },
  { label: 'Tue', value: 84.0 },
  { label: 'Wed', value: 83.8 },
  { label: 'Thu', value: 84.1 },
  { label: 'Fri', value: 83.9 },
  { label: 'Sat', value: 83.7 },
  { label: 'Sun', value: 83.5 },
];

const PERSONAL_RECORDS = [
  { exercise: 'Flat Bench Press',  weight: '120 kg', date: '28 Mar', reps: 3 },
  { exercise: 'Back Squat',        weight: '160 kg', date: '22 Mar', reps: 2 },
  { exercise: 'Deadlift',          weight: '200 kg', date: '14 Mar', reps: 1 },
  { exercise: 'Overhead Press',    weight: '80 kg',  date: '20 Mar', reps: 4 },
  { exercise: 'Barbell Row',       weight: '100 kg', date: '3 Apr',  reps: 5 },
];

const WEEKLY_VOLUME = [
  { week: 'W1', value: 18400, label: '18.4k' },
  { week: 'W2', value: 22100, label: '22.1k' },
  { week: 'W3', value: 19600, label: '19.6k' },
  { week: 'W4', value: 24800, label: '24.8k' },
  { week: 'Now', value: 14200, label: '14.2k' },
];

const MUSCLE_FREQ = [
  { muscle: 'Chest',     sessions: 8 },
  { muscle: 'Back',      sessions: 8 },
  { muscle: 'Legs',      sessions: 8 },
  { muscle: 'Shoulders', sessions: 6 },
  { muscle: 'Arms',      sessions: 4 },
  { muscle: 'Core',      sessions: 2 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RANGE_OPTIONS = ['1W', '1M', '3M', 'All'] as const;
type Range = typeof RANGE_OPTIONS[number];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const [range, setRange] = useState<Range>('1M');

  const bwMin = Math.min(...BODY_WEIGHT.map((d) => d.value));
  const bwMax = Math.max(...BODY_WEIGHT.map((d) => d.value));
  const bwRange = bwMax - bwMin || 1;
  const maxVol  = Math.max(...WEEKLY_VOLUME.map((d) => d.value));
  const maxFreq = Math.max(...MUSCLE_FREQ.map((d) => d.sessions));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <View style={styles.rangeRow}>
            {RANGE_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
                onPress={() => setRange(r)}>
                <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Body weight */}
        <Text style={styles.sectionLabel}>Body Weight</Text>
        <View style={styles.bwCard}>
          <View style={styles.bwCardHeader}>
            <View>
              <Text style={styles.bwCurrent}>{BODY_WEIGHT[BODY_WEIGHT.length - 1].value} kg</Text>
              <Text style={styles.bwChange}>−0.7 kg this week</Text>
            </View>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={Colors.primary} />
          </View>
          <View style={styles.bwBars}>
            {BODY_WEIGHT.map((d) => {
              const heightPct = ((d.value - bwMin) / bwRange) * 60 + 16;
              return (
                <View key={d.label} style={styles.bwBarGroup}>
                  <View style={[styles.bwBar, { height: heightPct }]} />
                  <Text style={styles.bwBarLabel}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Personal records */}
        <Text style={styles.sectionLabel}>Personal Records</Text>
        <View style={styles.prCard}>
          {PERSONAL_RECORDS.map((pr, i) => (
            <View
              key={i}
              style={[styles.prRow, i < PERSONAL_RECORDS.length - 1 && styles.prRowBorder]}>
              <View style={styles.prIconBox}>
                <IconSymbol name="trophy.fill" size={16} color={Colors.primary} />
              </View>
              <View style={styles.prInfo}>
                <Text style={styles.prExercise}>{pr.exercise}</Text>
                <Text style={styles.prDate}>{pr.reps} rep{pr.reps !== 1 ? 's' : ''} · {pr.date}</Text>
              </View>
              <Text style={styles.prWeight}>{pr.weight}</Text>
            </View>
          ))}
        </View>

        {/* Weekly volume */}
        <Text style={styles.sectionLabel}>Weekly Volume (kg)</Text>
        <View style={styles.volCard}>
          <View style={styles.volBars}>
            {WEEKLY_VOLUME.map((d) => {
              const heightPct = (d.value / maxVol) * 100;
              return (
                <View key={d.week} style={styles.volBarGroup}>
                  <Text style={styles.volBarValue}>{d.label}</Text>
                  <View style={styles.volBarTrack}>
                    <View style={[styles.volBarFill, { height: `${heightPct}%` }]} />
                  </View>
                  <Text style={styles.volBarLabel}>{d.week}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Muscle group frequency */}
        <Text style={styles.sectionLabel}>Muscle Frequency (this month)</Text>
        <View style={styles.freqCard}>
          {MUSCLE_FREQ.map((m) => {
            const pct = (m.sessions / maxFreq) * 100;
            return (
              <View key={m.muscle} style={styles.freqRow}>
                <Text style={styles.freqLabel}>{m.muscle}</Text>
                <View style={styles.freqBarTrack}>
                  <View style={[styles.freqBarFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.freqCount}>{m.sessions}x</Text>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
