import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
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
import { sendPushNotification } from '@/lib/notifications';

// ─── Types ────────────────────────────────────────────────────────────────────

type AvailRow  = { day_of_week: number; start_time: string; end_time: string };
type BookedRow = { starts_at: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeStrToHour(t: string): number {
  return parseInt(t.split(':')[0], 10);
}

function hourLabel(h: number): string {
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12  = h === 0 ? 12 : h <= 12 ? h : h - 12;
  return `${h12}:00 ${ampm}`;
}

function getNextDays(n: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

const DAY_SHORT   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function slotDisplayLabel(date: Date, hour: number): string {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d.toLocaleString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BookSessionScreen() {
  const C = useColors();
  const router = useRouter();

  const s = useMemo(() => StyleSheet.create({
    container:       { flex: 1, backgroundColor: C.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
      borderBottomWidth: 1, borderBottomColor: C.outlineVariant,
    },
    title:          { ...Typography.titleLg, color: C.onSurface },
    trainerLabel: {
      ...Typography.bodyMd, color: C.onSurfaceVariant,
      paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
    },
    dateStrip:      { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.xs },
    dateChip: {
      alignItems: 'center', backgroundColor: C.surfaceContainer,
      borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 6,
      minWidth: 44,
    },
    dateChipSel:    { backgroundColor: C.primary },
    dateChipOff:    { opacity: 0.3 },
    dateChipDay:    { fontSize: 10, fontWeight: '500', color: C.onSurfaceVariant, lineHeight: 14 },
    dateChipNum:    { fontSize: 16, fontWeight: '700', color: C.onSurface, lineHeight: 20 },
    dateChipTextSel:{ color: C.background },
    slotList:       { padding: Spacing.lg, gap: Spacing.sm },
    slotCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: C.surfaceContainer, borderRadius: Radius.lg,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      borderWidth: 1, borderColor: C.outlineVariant,
    },
    slotCardTaken:  { borderColor: 'transparent', opacity: 0.45 },
    slotLeft:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    slotTime:       { ...Typography.bodyMd, color: C.onSurface },
    slotDur:        { ...Typography.labelMd, color: C.onSurfaceVariant },
    slotMuted:      { color: C.onSurfaceVariant },
    slotCta:        { ...Typography.labelLg, color: C.primary },
    slotBooked:     { ...Typography.labelMd, color: C.outlineVariant },
    empty:          { paddingTop: 60, alignItems: 'center' },
    emptyText:      { ...Typography.bodyMd, color: C.onSurfaceVariant },
    noTrainer: {
      flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md,
      paddingHorizontal: Spacing.xl,
    },
    noTrainerText:  { ...Typography.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' },
    overlay:        { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: C.surfaceContainer,
      borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
      padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md,
    },
    sheetTitle:     { ...Typography.titleLg, color: C.onSurface },
    sheetSub:       { ...Typography.bodyMd, color: C.onSurfaceVariant },
    notesInput: {
      backgroundColor: C.surfaceContainerHighest,
      borderRadius: Radius.lg, borderWidth: 1, borderColor: C.outlineVariant,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      ...Typography.bodyMd, color: C.onSurface, minHeight: 80, textAlignVertical: 'top',
    },
    confirmBtn: {
      backgroundColor: C.primary, borderRadius: Radius.lg,
      paddingVertical: Spacing.md, alignItems: 'center',
    },
    confirmBtnText: { ...Typography.titleMd, color: C.background },
  }), [C]);

  const [loading,          setLoading]          = useState(true);
  const [userId,           setUserId]           = useState<string | null>(null);
  const [trainerId,        setTrainerId]        = useState<string | null>(null);
  const [trainerClientId,  setTrainerClientId]  = useState<string | null>(null);
  const [trainerName,      setTrainerName]      = useState('');
  const [avail,            setAvail]            = useState<AvailRow[]>([]);
  const [booked,           setBooked]           = useState<BookedRow[]>([]);

  const days = getNextDays(28);
  const [selectedDay, setSelectedDay] = useState<Date>(days[0]);
  const [confirm,     setConfirm]     = useState<{ hour: number } | null>(null);
  const [notes,       setNotes]       = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      // Fetch active trainer relationship
      const { data: tc } = await supabase
        .from('trainer_clients')
        .select('id, trainer_id')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .single();

      if (!tc) { setLoading(false); return; }

      // Fetch trainer's display name
      const { data: trainerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', tc.trainer_id)
        .single();

      setTrainerId(tc.trainer_id);
      setTrainerClientId(tc.id);
      setTrainerName(trainerProfile?.full_name ?? 'Your Trainer');

      // Fetch trainer's availability
      const { data: av } = await supabase
        .from('pt_availability')
        .select('day_of_week, start_time, end_time')
        .eq('trainer_id', tc.trainer_id);
      setAvail(av ?? []);

      // Fetch existing non-cancelled bookings in next 28 days
      const from = new Date();
      const to   = new Date(from);
      to.setDate(from.getDate() + 28);

      const { data: bk } = await supabase
        .from('bookings')
        .select('starts_at')
        .eq('trainer_id', tc.trainer_id)
        .neq('status', 'cancelled')
        .gte('starts_at', from.toISOString())
        .lte('starts_at', to.toISOString());
      setBooked(bk ?? []);

      setLoading(false);
    })();
  }, []);

  function getSlots(date: Date): { hour: number; available: boolean }[] {
    const dow      = date.getDay();
    const availRow = avail.find((a) => a.day_of_week === dow);
    if (!availRow) return [];

    const startH = timeStrToHour(availRow.start_time);
    const endH   = timeStrToHour(availRow.end_time);
    const now    = new Date();

    return Array.from({ length: endH - startH }, (_, i) => {
      const hour      = startH + i;
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);

      if (slotStart <= now) return null; // past

      const taken = booked.some((b) => {
        const bStart = new Date(b.starts_at);
        return bStart.getTime() === slotStart.getTime();
      });

      return { hour, available: !taken };
    }).filter(Boolean) as { hour: number; available: boolean }[];
  }

  async function requestBooking() {
    if (!confirm || !trainerId || !trainerClientId || !userId) return;
    setSubmitting(true);

    const startsAt = new Date(selectedDay);
    startsAt.setHours(confirm.hour, 0, 0, 0);
    const endsAt = new Date(startsAt);
    endsAt.setHours(endsAt.getHours() + 1);

    const { error } = await supabase.from('bookings').insert({
      trainer_id:        trainerId,
      client_id:         userId,
      trainer_client_id: trainerClientId,
      starts_at:         startsAt.toISOString(),
      ends_at:           endsAt.toISOString(),
      client_notes:      notes.trim() || null,
    });

    if (!error) {
      setBooked((prev) => [...prev, { starts_at: startsAt.toISOString() }]);
      await sendPushNotification(
        trainerId,
        'New Booking Request',
        `Session requested for ${slotDisplayLabel(selectedDay, confirm.hour)}`,
      );
    }

    setSubmitting(false);
    setConfirm(null);
    setNotes('');
    if (!error) router.push('/bookings' as any);
  }

  const slots = getSlots(selectedDay);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={24} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={s.title}>Book a Session</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : !trainerId ? (
        <View style={s.noTrainer}>
          <IconSymbol name="person.fill" size={32} color={C.outlineVariant} />
          <Text style={s.noTrainerText}>You don't have an active trainer yet.</Text>
        </View>
      ) : avail.length === 0 ? (
        <View style={s.noTrainer}>
          <IconSymbol name="calendar" size={32} color={C.outlineVariant} />
          <Text style={s.noTrainerText}>Your trainer hasn't set their availability yet.</Text>
        </View>
      ) : (
        <>
          {/* Date strip */}
          <FlatList
            horizontal
            data={days}
            keyExtractor={(d) => d.toISOString()}
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={s.dateStrip}
            renderItem={({ item }) => {
              const dow        = item.getDay();
              const isSelected = item.toDateString() === selectedDay.toDateString();
              const hasAvail   = avail.some((a) => a.day_of_week === dow);
              return (
                <TouchableOpacity
                  style={[s.dateChip, isSelected && s.dateChipSel, !hasAvail && s.dateChipOff]}
                  onPress={() => setSelectedDay(item)}
                  disabled={!hasAvail}>
                  <Text style={[s.dateChipDay, isSelected && s.dateChipTextSel]}>
                    {DAY_SHORT[dow]}
                  </Text>
                  <Text style={[s.dateChipNum, isSelected && s.dateChipTextSel]}>
                    {item.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Selected date label */}
          <Text style={s.trainerLabel}>
            {selectedDay.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} · with {trainerName}
          </Text>

          {/* Slots */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.slotList}>
            {slots.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyText}>No available slots on this day.</Text>
              </View>
            ) : (
              slots.map(({ hour, available }) => (
                <TouchableOpacity
                  key={hour}
                  style={[s.slotCard, !available && s.slotCardTaken]}
                  onPress={() => available && setConfirm({ hour })}
                  activeOpacity={available ? 0.7 : 1}
                  disabled={!available}>
                  <View style={s.slotLeft}>
                    <IconSymbol
                      name="clock.fill"
                      size={16}
                      color={available ? C.primary : C.outlineVariant}
                    />
                    <View>
                      <Text style={[s.slotTime, !available && s.slotMuted]}>
                        {hourLabel(hour)}
                      </Text>
                      <Text style={[s.slotDur, !available && s.slotMuted]}>1 hour</Text>
                    </View>
                  </View>
                  {available
                    ? <Text style={s.slotCta}>Book →</Text>
                    : <Text style={s.slotBooked}>Booked</Text>}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </>
      )}

      {/* Confirmation modal */}
      <Modal visible={!!confirm} transparent animationType="slide">
        <Pressable style={s.overlay} onPress={() => setConfirm(null)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <Text style={s.sheetTitle}>Confirm Booking</Text>
            {confirm && (
              <Text style={s.sheetSub}>{slotDisplayLabel(selectedDay, confirm.hour)}</Text>
            )}
            <TextInput
              style={s.notesInput}
              placeholder="Add a note for your trainer (optional)"
              placeholderTextColor={C.onSurfaceVariant}
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={300}
            />
            <TouchableOpacity
              style={[s.confirmBtn, submitting && { opacity: 0.5 }]}
              onPress={requestBooking}
              disabled={submitting}>
              {submitting
                ? <ActivityIndicator color={C.background} size="small" />
                : <Text style={s.confirmBtnText}>Request Booking</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
