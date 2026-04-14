import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

// ─── Options ─────────────────────────────────────────────────────────────────

const GOALS = [
  { id: 'weight_loss',      label: 'Lose Weight',       icon: 'flame.fill'          },
  { id: 'muscle_gain',      label: 'Build Muscle',      icon: 'dumbbell.fill'       },
  { id: 'strength',         label: 'Get Stronger',      icon: 'bolt.fill'           },
  { id: 'endurance',        label: 'Improve Endurance', icon: 'figure.run'          },
  { id: 'general_fitness',  label: 'General Fitness',   icon: 'heart.fill'          },
  { id: 'sport',            label: 'Sport Performance', icon: 'trophy.fill'         },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner',     label: 'Beginner',     sub: 'Less than 1 year'   },
  { id: 'intermediate', label: 'Intermediate', sub: '1–3 years'           },
  { id: 'advanced',     label: 'Advanced',     sub: '3+ years'            },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ClientOnboardingScreen() {
  const C      = useColors();
  const router = useRouter();

  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  const [goals,        setGoals]        = useState<string[]>([]);
  const [experience,   setExperience]   = useState('');
  const [trainingDays, setTrainingDays] = useState(3);
  const [injuries,     setInjuries]     = useState('');
  const [medical,      setMedical]      = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('client_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setGoals(data.goals ?? []);
        setExperience(data.experience ?? '');
        setTrainingDays(data.training_days ?? 3);
        setInjuries(data.injuries ?? '');
        setMedical(data.medical_notes ?? '');
      }
    } catch {}
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const payload = {
        user_id:       user.id,
        goals,
        experience,
        training_days: trainingDays,
        injuries:      injuries.trim() || null,
        medical_notes: medical.trim()  || null,
        updated_at:    new Date().toISOString(),
      };
      const { error } = await supabase
        .from('client_onboarding')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save your profile.');
    }
    setSaving(false);
  }

  function toggleGoal(id: string) {
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  const bg    = { backgroundColor: C.background };
  const card  = { backgroundColor: C.surfaceContainer, borderRadius: Radius.lg, padding: Spacing.md };
  const label = { ...Typography.labelLg, color: C.onSurfaceVariant, marginBottom: Spacing.sm, textTransform: 'uppercase' as const };
  const body  = { ...Typography.bodyMd, color: C.onSurface };

  return (
    <SafeAreaView style={[{ flex: 1 }, bg]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: C.outlineVariant,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={24} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={{ ...Typography.titleLg, color: C.onSurface, flex: 1, textAlign: 'center' }}>
          Fitness Profile
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ flex: 1 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Goals */}
          <View>
            <Text style={label}>My Goals</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {GOALS.map((g) => {
                const selected = goals.includes(g.id);
                return (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => toggleGoal(g.id)}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
                      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
                      borderRadius: Radius.full,
                      backgroundColor: selected ? C.primary + '22' : C.surfaceContainerHigh,
                      borderWidth: 1.5,
                      borderColor: selected ? C.primary : C.outlineVariant,
                    }}>
                    <IconSymbol name={g.icon as any} size={14} color={selected ? C.primary : C.onSurfaceVariant} />
                    <Text style={{
                      ...Typography.labelLg, fontWeight: '600',
                      color: selected ? C.primary : C.onSurfaceVariant,
                    }}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Experience */}
          <View>
            <Text style={label}>Training Experience</Text>
            <View style={{ gap: Spacing.sm }}>
              {EXPERIENCE_LEVELS.map((e) => {
                const selected = experience === e.id;
                return (
                  <TouchableOpacity
                    key={e.id}
                    onPress={() => setExperience(e.id)}
                    activeOpacity={0.8}
                    style={{
                      ...card,
                      flexDirection: 'row', alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: selected ? C.primary : 'transparent',
                      backgroundColor: selected ? C.primary + '14' : C.surfaceContainer,
                    }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...Typography.titleMd, color: selected ? C.primary : C.onSurface }}>
                        {e.label}
                      </Text>
                      <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant, marginTop: 2 }}>
                        {e.sub}
                      </Text>
                    </View>
                    {selected && <IconSymbol name="checkmark.circle.fill" size={20} color={C.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Training days per week */}
          <View>
            <Text style={label}>Sessions Per Week</Text>
            <View style={[card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <TouchableOpacity
                onPress={() => setTrainingDays((d) => Math.max(1, d - 1))}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: C.surfaceContainerHigh,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                <IconSymbol name="minus" size={18} color={C.onSurface} />
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ ...Typography.displayLg, color: C.primary }}>{trainingDays}</Text>
                <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant }}>days / week</Text>
              </View>
              <TouchableOpacity
                onPress={() => setTrainingDays((d) => Math.min(7, d + 1))}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: C.surfaceContainerHigh,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                <IconSymbol name="plus" size={18} color={C.onSurface} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Injuries */}
          <View>
            <Text style={label}>Injuries or Limitations</Text>
            <TextInput
              style={[card, { ...body, minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="e.g. bad knees, lower back pain, shoulder impingement…"
              placeholderTextColor={C.onSurfaceVariant}
              value={injuries}
              onChangeText={setInjuries}
              multiline
            />
          </View>

          {/* Medical notes */}
          <View>
            <Text style={label}>Medical Notes</Text>
            <TextInput
              style={[card, { ...body, minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="e.g. diabetes, high blood pressure, asthma…"
              placeholderTextColor={C.onSurfaceVariant}
              value={medical}
              onChangeText={setMedical}
              multiline
            />
          </View>

          {/* Save */}
          <TouchableOpacity
            onPress={save}
            disabled={saving}
            style={{
              height: 52, borderRadius: Radius.lg,
              backgroundColor: saving ? C.outlineVariant : C.primary,
              alignItems: 'center', justifyContent: 'center',
            }}>
            {saving
              ? <ActivityIndicator color={C.onPrimary} />
              : <Text style={{ ...Typography.titleMd, color: C.onPrimary, fontWeight: '700' }}>Save Profile</Text>}
          </TouchableOpacity>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}
