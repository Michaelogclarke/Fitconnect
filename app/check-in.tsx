import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Rating = 1 | 2 | 3 | 4 | 5;

// Monday of current week (ISO)
function currentWeekStart(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// ─── Rating picker ────────────────────────────────────────────────────────────

const LABELS: Record<string, string[]> = {
  sleep:     ['Very poor', 'Poor', 'OK', 'Good', 'Excellent'],
  energy:    ['Very low', 'Low', 'Moderate', 'High', 'Very high'],
  adherence: ['Missed most', 'Missed some', 'Mostly on track', 'On track', 'Perfect'],
};

function RatingPicker({
  label,
  field,
  value,
  onChange,
}: {
  label:    string;
  field:    string;
  value:    Rating;
  onChange: (v: Rating) => void;
}) {
  return (
    <View style={ratingStyles.container}>
      <View style={ratingStyles.labelRow}>
        <Text style={ratingStyles.label}>{label}</Text>
        <Text style={ratingStyles.sublabel}>{LABELS[field][value - 1]}</Text>
      </View>
      <View style={ratingStyles.dots}>
        {([1, 2, 3, 4, 5] as Rating[]).map((n) => (
          <TouchableOpacity
            key={n}
            style={[ratingStyles.dot, value >= n && ratingStyles.dotFilled]}
            onPress={() => onChange(n)}
            activeOpacity={0.7}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CheckInScreen() {
  const router = useRouter();
  const { threadId, trainerName } = useLocalSearchParams<{ threadId: string; trainerName: string }>();

  const [sleep,     setSleep]     = useState<Rating>(3);
  const [energy,    setEnergy]    = useState<Rating>(3);
  const [adherence, setAdherence] = useState<Rating>(3);
  const [notes,     setNotes]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  const weekStart = currentWeekStart();

  useEffect(() => {
    if (!threadId) return;
    loadExisting();
  }, [threadId]);

  async function loadExisting() {
    setLoading(true);
    const { data } = await supabase
      .from('check_ins')
      .select('sleep_rating, energy_rating, adherence_rating, notes')
      .eq('trainer_client_id', threadId)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (data) {
      setSleep((data.sleep_rating    ?? 3) as Rating);
      setEnergy((data.energy_rating  ?? 3) as Rating);
      setAdherence((data.adherence_rating ?? 3) as Rating);
      setNotes(data.notes ?? '');
      setAlreadyDone(true);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!threadId || saving) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase
      .from('check_ins')
      .upsert({
        trainer_client_id: threadId,
        client_id:         user.id,
        week_start:        weekStart,
        sleep_rating:      sleep,
        energy_rating:     energy,
        adherence_rating:  adherence,
        notes:             notes.trim() || null,
      }, { onConflict: 'trainer_client_id,week_start' });

    setSaving(false);
    router.back();
  }

  return (
    <SafeAreaView style={localStyles.container} edges={['top']}>
      {/* Header */}
      <View style={localStyles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={localStyles.headerTitle}>Weekly Check-In</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={localStyles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          <Text style={localStyles.subheading}>
            {alreadyDone ? 'Update your check-in for' : 'Check in for'} the week of{' '}
            <Text style={localStyles.weekText}>
              {new Date(weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
          </Text>

          {trainerName ? (
            <Text style={localStyles.trainerNote}>Sharing with {trainerName}</Text>
          ) : null}

          <View style={localStyles.card}>
            <RatingPicker label="Sleep Quality"      field="sleep"     value={sleep}     onChange={setSleep} />
            <View style={localStyles.divider} />
            <RatingPicker label="Energy Levels"      field="energy"    value={energy}    onChange={setEnergy} />
            <View style={localStyles.divider} />
            <RatingPicker label="Plan Adherence"     field="adherence" value={adherence} onChange={setAdherence} />
          </View>

          <View style={localStyles.notesSection}>
            <Text style={localStyles.notesLabel}>Notes (optional)</Text>
            <TextInput
              style={localStyles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="How's the programme feeling? Anything to flag?"
              placeholderTextColor={Colors.onSurfaceVariant}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[localStyles.submitBtn, saving && localStyles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={saving}>
            {saving
              ? <ActivityIndicator color={Colors.background} />
              : <Text style={localStyles.submitBtnText}>
                  {alreadyDone ? 'Update Check-In' : 'Submit Check-In'}
                </Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ratingStyles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.titleMd,
    color: Colors.onSurface,
  },
  sublabel: {
    ...Typography.labelLg,
    color: Colors.primary,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    flex: 1,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.outlineVariant,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
});

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  subheading: {
    ...Typography.bodyLg,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
  },
  weekText: {
    color: Colors.onSurface,
    fontWeight: '600',
  },
  trainerNote: {
    ...Typography.labelLg,
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
  },
  notesSection: {
    marginBottom: Spacing.xl,
  },
  notesLabel: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.sm,
  },
  notesInput: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    minHeight: 100,
  },
  submitBtn: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: {
    ...Typography.titleLg,
    color: Colors.background,
  },
});
