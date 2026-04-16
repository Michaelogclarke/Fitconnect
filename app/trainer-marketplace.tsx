import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
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

// ─── Types ────────────────────────────────────────────────────────────────────

type TrainerProfile = {
  id:          string;
  full_name:   string;
  city:        string | null;
  bio:         string | null;
  specialties: string[] | null;
  hourly_rate: number | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SPECIALTIES = [
  'Strength & Conditioning', 'Weight Loss', 'Muscle Building',
  'HIIT & Cardio', 'Yoga & Flexibility', 'Sports Performance',
  'Rehabilitation', 'Nutrition Coaching', 'Powerlifting', 'Running & Endurance',
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TrainerMarketplaceScreen() {
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
    searchOuter: {
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
      borderBottomWidth: 1, borderBottomColor: C.outlineVariant,
    },
    searchWrap: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: C.surfaceContainer, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: C.outlineVariant,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    searchInput: {
      flex: 1,
      ...Typography.bodyMd, color: C.onSurface,
    },
    filterRow: {
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
      gap: Spacing.xs, alignItems: 'center' as const,
    },
    chip: {
      paddingHorizontal: Spacing.md, paddingVertical: 6,
      borderRadius: Radius.full, borderWidth: 1,
      borderColor: C.outlineVariant, backgroundColor: C.surfaceContainer,
      alignSelf: 'flex-start' as const,
    },
    chipActive:   { borderColor: C.primary, backgroundColor: C.primary + '18' },
    chipText:     { ...Typography.labelLg, color: C.onSurfaceVariant },
    chipTextActive:{ color: C.primary },
    list:         { padding: Spacing.lg, gap: Spacing.md },
    card: {
      backgroundColor: C.surfaceContainer, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: C.outlineVariant, padding: Spacing.md,
      gap: Spacing.sm,
    },
    cardTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
    avatar: {
      width: 48, height: 48, borderRadius: Radius.full,
      backgroundColor: C.primary + '22', justifyContent: 'center', alignItems: 'center',
    },
    avatarText:   { ...Typography.titleLg, color: C.primary },
    cardInfo:     { flex: 1 },
    cardName:     { ...Typography.titleMd, color: C.onSurface },
    cardCity: {
      flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2,
    },
    cardCityText: { ...Typography.labelLg, color: C.onSurfaceVariant },
    cardRate:     { ...Typography.titleMd, color: C.primary },
    bio:          { ...Typography.bodyMd, color: C.onSurfaceVariant, lineHeight: 20 },
    specWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    specChip: {
      paddingHorizontal: Spacing.sm, paddingVertical: 3,
      borderRadius: Radius.full, backgroundColor: C.primary + '14',
    },
    specChipText: { ...Typography.labelMd, color: C.primary },
    ctaRow:       { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
    connectBtn: {
      flex: 1, backgroundColor: C.primary, borderRadius: Radius.md,
      paddingVertical: Spacing.sm, alignItems: 'center',
    },
    connectBtnText:{ ...Typography.labelLg, color: C.background, fontWeight: '600' as const },
    empty: {
      paddingTop: 80, alignItems: 'center', gap: Spacing.sm,
      paddingHorizontal: Spacing.xl,
    },
    emptyText:    { ...Typography.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' },
  }), [C]);

  const [trainers,        setTrainers]        = useState<TrainerProfile[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [citySearch,      setCitySearch]      = useState('');
  const [activeSpec,      setActiveSpec]      = useState<string | null>(null);
  const [requesting,      setRequesting]      = useState<string | null>(null);
  const [userId,          setUserId]          = useState<string | null>(null);
  const [existingLinks,   setExistingLinks]   = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Pre-load any existing trainer links so we can hide "Connect" for them
        const { data: links } = await supabase
          .from('trainer_clients')
          .select('trainer_id')
          .eq('client_id', user.id)
          .in('status', ['pending', 'active']);
        setExistingLinks(new Set((links ?? []).map((l: any) => l.trainer_id)));
      }
      await fetchTrainers();
    })();
  }, []);

  async function fetchTrainers() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, city, bio, specialties, hourly_rate')
      .eq('is_public', true)
      .eq('role', 'trainer')
      .order('full_name');
    setTrainers(data ?? []);
    setLoading(false);
  }

  async function handleConnect(trainer: TrainerProfile) {
    if (!userId || requesting) return;
    setRequesting(trainer.id);
    const { error } = await supabase.from('trainer_clients').insert({
      trainer_id:   trainer.id,
      client_id:    userId,
      status:       'pending',
      initiated_by: 'client',
    });
    if (!error) {
      setExistingLinks((prev) => new Set([...prev, trainer.id]));
    }
    setRequesting(null);
  }

  function initials(name: string): string {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  const filtered = trainers.filter((t) => {
    const cityMatch = !citySearch.trim() ||
      (t.city ?? '').toLowerCase().includes(citySearch.trim().toLowerCase());
    const specMatch = !activeSpec ||
      (t.specialties ?? []).includes(activeSpec);
    return cityMatch && specMatch;
  });

  function renderTrainer({ item: t }: { item: TrainerProfile }) {
    const connected = existingLinks.has(t.id);
    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials(t.full_name)}</Text>
          </View>
          <View style={s.cardInfo}>
            <Text style={s.cardName}>{t.full_name}</Text>
            {t.city && (
              <View style={s.cardCity}>
                <IconSymbol name="mappin" size={12} color={C.onSurfaceVariant} />
                <Text style={s.cardCityText}>{t.city}</Text>
              </View>
            )}
          </View>
          {t.hourly_rate != null && (
            <Text style={s.cardRate}>£{t.hourly_rate}/hr</Text>
          )}
        </View>

        {t.bio ? (
          <Text style={s.bio} numberOfLines={3}>{t.bio}</Text>
        ) : null}

        {(t.specialties ?? []).length > 0 && (
          <View style={s.specWrap}>
            {(t.specialties ?? []).map((sp) => (
              <View key={sp} style={s.specChip}>
                <Text style={s.specChipText}>{sp}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.ctaRow}>
          {connected ? (
            <View style={[s.connectBtn, { backgroundColor: C.surfaceContainerHighest }]}>
              <Text style={[s.connectBtnText, { color: C.onSurfaceVariant }]}>Request Sent</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[s.connectBtn, requesting === t.id && { opacity: 0.6 }]}
              onPress={() => handleConnect(t)}
              disabled={!!requesting}>
              {requesting === t.id
                ? <ActivityIndicator size="small" color={C.background} />
                : <Text style={s.connectBtnText}>Connect</Text>}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={24} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={s.title}>Find a Trainer</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* City search */}
      <View style={s.searchOuter}>
        <View style={s.searchWrap}>
          <IconSymbol name="magnifyingglass" size={16} color={C.onSurfaceVariant} />
          <TextInput
            style={s.searchInput}
            value={citySearch}
            onChangeText={setCitySearch}
            placeholder="Search by city…"
            placeholderTextColor={C.onSurfaceVariant}
          />
          {citySearch.length > 0 && (
            <TouchableOpacity onPress={() => setCitySearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <IconSymbol name="xmark.circle.fill" size={18} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Specialty filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}>
        <TouchableOpacity
          style={[s.chip, !activeSpec && s.chipActive]}
          onPress={() => setActiveSpec(null)}>
          <Text style={[s.chipText, !activeSpec && s.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {SPECIALTIES.map((sp) => (
          <TouchableOpacity
            key={sp}
            style={[s.chip, activeSpec === sp && s.chipActive]}
            onPress={() => setActiveSpec(activeSpec === sp ? null : sp)}>
            <Text style={[s.chipText, activeSpec === sp && s.chipTextActive]}>{sp}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          renderItem={renderTrainer}
          contentContainerStyle={[s.list, filtered.length === 0 && { flex: 1 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <IconSymbol name="person.2.slash" size={40} color={C.outlineVariant} />
              <Text style={s.emptyText}>
                {citySearch || activeSpec
                  ? 'No trainers match your filters. Try adjusting your search.'
                  : 'No trainers are listed in the marketplace yet.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
