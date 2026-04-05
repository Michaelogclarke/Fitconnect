import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from '@/styles/tabs/history.styles';

// ─── Data ─────────────────────────────────────────────────────────────────────

const HISTORY = [
  {
    week: 'This Week',
    sessions: [
      {
        id: 'h1', name: 'Pull Day A', date: 'Thu 3 Apr', duration: '48 min',
        sets: 14, volume: '4,200 kg',
        exercises: ['Deadlift', 'Pull-ups', 'Barbell Row', 'Face Pulls', 'Bicep Curls'],
      },
      {
        id: 'h2', name: 'Legs A', date: 'Mon 1 Apr', duration: '62 min',
        sets: 16, volume: '6,800 kg',
        exercises: ['Back Squat', 'Leg Press', 'RDL', 'Leg Curl', 'Calf Raises'],
      },
    ],
  },
  {
    week: 'Last Week',
    sessions: [
      {
        id: 'h3', name: 'Push Day B', date: 'Sun 30 Mar', duration: '51 min',
        sets: 15, volume: '3,900 kg',
        exercises: ['Incline Bench', 'DB Shoulder Press', 'Cable Fly', 'Lateral Raises', 'Skull Crushers'],
      },
      {
        id: 'h4', name: 'Pull Day B', date: 'Fri 28 Mar', duration: '44 min',
        sets: 13, volume: '3,600 kg',
        exercises: ['Rack Pull', 'Cable Row', 'Lat Pulldown', 'Rear Delt Fly', 'Hammer Curls'],
      },
      {
        id: 'h5', name: 'Legs B', date: 'Wed 26 Mar', duration: '58 min',
        sets: 15, volume: '5,200 kg',
        exercises: ['Front Squat', 'Hack Squat', 'Walking Lunges', 'Leg Extension', 'Seated Calf'],
      },
      {
        id: 'h6', name: 'Push Day A', date: 'Mon 24 Mar', duration: '55 min',
        sets: 16, volume: '4,100 kg',
        exercises: ['Flat Bench Press', 'Overhead Press', 'Incline DB Press', 'Lateral Raises', 'Tricep Pushdown'],
      },
    ],
  },
  {
    week: '24 – 30 Mar',
    sessions: [
      {
        id: 'h7', name: 'Full Body', date: 'Sat 22 Mar', duration: '70 min',
        sets: 18, volume: '5,900 kg',
        exercises: ['Squat', 'Bench Press', 'Deadlift', 'OHP', 'Pull-ups'],
      },
    ],
  },
];

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: typeof HISTORY[0]['sessions'][0] }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => setExpanded((e) => !e)}
      activeOpacity={0.8}>

      <View style={styles.sessionTop}>
        <View style={styles.sessionIconBox}>
          <IconSymbol name="dumbbell.fill" size={18} color={Colors.primary} />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionName}>{session.name}</Text>
          <Text style={styles.sessionMeta}>{session.date} · {session.duration}</Text>
        </View>
        <View style={styles.sessionRight}>
          <Text style={styles.sessionVolume}>{session.volume}</Text>
          <Text style={styles.sessionSets}>{session.sets} sets</Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.sessionDetail}>
          <View style={styles.sessionDivider} />
          {session.exercises.map((ex, i) => (
            <View key={i} style={styles.exerciseRow}>
              <View style={styles.exerciseDot} />
              <Text style={styles.exerciseText}>{ex}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const totalSessions = HISTORY.reduce((n, w) => n + w.sessions.length, 0);
  const totalVolume   = '28,000 kg';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
        </View>

        {/* Summary strip */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalSessions}</Text>
            <Text style={styles.summaryLabel}>Sessions logged</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalVolume}</Text>
            <Text style={styles.summaryLabel}>Total volume</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>247</Text>
            <Text style={styles.summaryLabel}>All time</Text>
          </View>
        </View>

        {/* Weeks */}
        {HISTORY.map((week) => (
          <View key={week.week}>
            <Text style={styles.weekLabel}>{week.week}</Text>
            {week.sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}
