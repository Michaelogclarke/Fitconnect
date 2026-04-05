import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from '@/styles/tabs/clients.styles';

const CLIENTS = [
  { id: '1', name: 'Sarah Johnson', meta: 'Weight Loss · 3 sessions/wk', active: true },
  { id: '2', name: 'Marcus Reid', meta: 'Hypertrophy · 4 sessions/wk', active: true },
  { id: '3', name: 'Emma Clarke', meta: 'Endurance · 5 sessions/wk', active: true },
  { id: '4', name: 'Tom Walsh', meta: 'Strength · 3 sessions/wk', active: false },
  { id: '5', name: 'Priya Patel', meta: 'Mobility · 2 sessions/wk', active: true },
];

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('');
}

export default function ClientsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <TouchableOpacity style={styles.addBtn}>
          <IconSymbol name="plus.circle.fill" size={20} color={Colors.background} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>4</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>92%</Text>
          <Text style={styles.statLabel}>Retention</Text>
        </View>
      </View>

      {/* Client List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {CLIENTS.map((c) => (
          <TouchableOpacity key={c.id} style={styles.clientCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(c.name)}</Text>
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{c.name}</Text>
              <Text style={styles.clientMeta}>{c.meta}</Text>
            </View>
            <View style={[styles.statusDot, c.active ? styles.statusActive : styles.statusPaused]} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
