import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const SPECIALTIES = [
  'Strength & Conditioning', 'Weight Loss', 'Muscle Building',
  'HIIT & Cardio', 'Yoga & Flexibility', 'Sports Performance',
  'Rehabilitation', 'Nutrition Coaching', 'Powerlifting', 'Running & Endurance',
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TrainerListingScreen() {
  const C      = useColors();
  const router = useRouter();

  const s = useMemo(() => StyleSheet.create({
    container:    { flex: 1, backgroundColor: C.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
      borderBottomWidth: 1, borderBottomColor: C.outlineVariant,
    },
    title:        { ...Typography.titleLg, color: C.onSurface },
    saveText:     { ...Typography.titleMd, color: C.primary },
    scroll:       { padding: Spacing.lg, gap: Spacing.lg },
    sectionLabel: {
      ...Typography.labelLg, color: C.onSurfaceVariant,
      textTransform: 'uppercase', letterSpacing: 0.8,
      marginBottom: Spacing.sm,
    },
    card: {
      backgroundColor: C.surfaceContainer, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: C.outlineVariant, overflow: 'hidden',
    },
    row: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      gap: Spacing.md,
    },
    rowBorder:    { borderTopWidth: 1, borderTopColor: C.outlineVariant },
    rowLabel:     { flex: 1, ...Typography.bodyMd, color: C.onSurface },
    rowSub:       { ...Typography.labelMd, color: C.onSurfaceVariant, marginTop: 2 },
    input: {
      backgroundColor: C.surfaceContainer, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: C.outlineVariant,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      ...Typography.bodyMd, color: C.onSurface,
    },
    bioInput:     { minHeight: 100, textAlignVertical: 'top' },
    specialtyWrap:{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    chip: {
      paddingHorizontal: Spacing.md, paddingVertical: 6,
      borderRadius: Radius.full, borderWidth: 1,
      borderColor: C.outlineVariant, backgroundColor: C.surfaceContainer,
    },
    chipActive:   { borderColor: C.primary, backgroundColor: C.primary + '18' },
    chipText:     { ...Typography.labelLg, color: C.onSurfaceVariant },
    chipTextActive:{ color: C.primary },
    publicBanner: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: C.success + '15', borderRadius: Radius.lg,
      padding: Spacing.md, borderWidth: 1, borderColor: C.success + '33',
    },
    publicBannerText: { flex: 1, ...Typography.bodyMd, color: C.onSurface },
    publicBannerSub:  { ...Typography.labelMd, color: C.onSurfaceVariant, marginTop: 2 },
  }), [C]);

  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [isPublic,    setIsPublic]    = useState(false);
  const [city,        setCity]        = useState('');
  const [bio,         setBio]         = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [hourlyRate,  setHourlyRate]  = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('city, bio, specialties, hourly_rate, is_public')
        .eq('id', user.id)
        .single();
      if (data) {
        setIsPublic(data.is_public ?? false);
        setCity(data.city ?? '');
        setBio(data.bio ?? '');
        setSpecialties(data.specialties ?? []);
        setHourlyRate(data.hourly_rate ? String(data.hourly_rate) : '');
      }
      setLoading(false);
    })();
  }, []);

  function toggleSpecialty(s: string) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleSave() {
    if (isPublic && !city.trim()) {
      Alert.alert('City required', 'Add your city so clients can find you.');
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from('profiles').update({
      city:        city.trim() || null,
      bio:         bio.trim()  || null,
      specialties,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      is_public:   isPublic,
    }).eq('id', user.id);

    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else { Alert.alert('Saved', 'Your listing has been updated.'); router.back(); }
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={24} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={s.title}>My Listing</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={C.primary} size="small" /> : <Text style={s.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

            {/* Visibility toggle */}
            <View style={s.card}>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowLabel}>List me as available</Text>
                  <Text style={s.rowSub}>Clients can find and request you in the marketplace</Text>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ true: C.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {isPublic && (
              <View style={[s.publicBanner]}>
                <IconSymbol name="checkmark.circle.fill" size={20} color={C.success} />
                <View style={{ flex: 1 }}>
                  <Text style={s.publicBannerText}>Your profile is visible in the marketplace</Text>
                  <Text style={s.publicBannerSub}>Fill in the details below to attract clients</Text>
                </View>
              </View>
            )}

            {/* City */}
            <View>
              <Text style={s.sectionLabel}>City</Text>
              <TextInput
                style={s.input}
                value={city}
                onChangeText={setCity}
                placeholder="e.g. London, Manchester, Dublin…"
                placeholderTextColor={C.onSurfaceVariant}
              />
            </View>

            {/* Bio */}
            <View>
              <Text style={s.sectionLabel}>About you</Text>
              <TextInput
                style={[s.input, s.bioInput]}
                value={bio}
                onChangeText={(t) => setBio(t.slice(0, 500))}
                placeholder="Tell potential clients about your background, training style, and what makes you unique…"
                placeholderTextColor={C.onSurfaceVariant}
                multiline
                maxLength={500}
              />
              <Text style={{ ...Typography.labelMd, color: C.outlineVariant, textAlign: 'right', marginTop: 4 }}>
                {bio.length}/500
              </Text>
            </View>

            {/* Specialties */}
            <View>
              <Text style={s.sectionLabel}>Specialties</Text>
              <View style={s.specialtyWrap}>
                {SPECIALTIES.map((sp) => {
                  const active = specialties.includes(sp);
                  return (
                    <TouchableOpacity
                      key={sp}
                      style={[s.chip, active && s.chipActive]}
                      onPress={() => toggleSpecialty(sp)}
                      activeOpacity={0.7}>
                      <Text style={[s.chipText, active && s.chipTextActive]}>{sp}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Hourly rate */}
            <View>
              <Text style={s.sectionLabel}>Hourly Rate (£)</Text>
              <TextInput
                style={s.input}
                value={hourlyRate}
                onChangeText={(t) => setHourlyRate(t.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 50"
                placeholderTextColor={C.onSurfaceVariant}
                keyboardType="decimal-pad"
              />
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
