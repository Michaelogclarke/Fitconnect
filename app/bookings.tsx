import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { sendPushNotification, insertNotification } from '@/lib/notifications';

// ─── Types ────────────────────────────────────────────────────────────────────

type Booking = {
  id:           string;
  trainer_id:   string;
  client_id:    string;
  starts_at:    string;
  ends_at:      string;
  status:       'pending' | 'confirmed' | 'cancelled';
  client_notes: string | null;
  otherName:    string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBookingDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function formatBookingTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BookingsScreen() {
  const C = useColors();
  const router = useRouter();

  const s = useMemo(() => StyleSheet.create({
    container:    { flex: 1, backgroundColor: C.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
      borderBottomWidth: 1, borderBottomColor: C.outlineVariant,
    },
    title:        { ...Typography.titleLg, color: C.onSurface },
    scroll:       { padding: Spacing.lg, gap: Spacing.sm },
    sectionLabel: {
      ...Typography.labelLg, color: C.onSurfaceVariant,
      textTransform: 'uppercase', letterSpacing: 1,
      marginTop: Spacing.lg, marginBottom: Spacing.sm,
    },
    card: {
      backgroundColor: C.surfaceContainer, borderRadius: Radius.lg,
      padding: Spacing.md, gap: Spacing.sm,
      borderWidth: 1, borderColor: C.outlineVariant,
      marginBottom: Spacing.sm,
    },
    cardTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardLeft:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
    avatar: {
      width: 40, height: 40, borderRadius: Radius.full,
      backgroundColor: C.primary + '22',
      justifyContent: 'center', alignItems: 'center',
    },
    avatarText:   { ...Typography.titleMd, color: C.primary },
    cardName:     { ...Typography.titleMd, color: C.onSurface },
    cardTime:     { ...Typography.labelMd, color: C.onSurfaceVariant, marginTop: 2 },
    badge: {
      borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3,
      backgroundColor: C.surfaceContainerHighest,
    },
    badgeConfirmed: { backgroundColor: C.success + '22' },
    badgePending:   { backgroundColor: C.primary + '22' },
    badgeText:      { ...Typography.labelMd, color: C.onSurfaceVariant },
    badgeTextConfirmed: { color: C.success },
    badgeTextPending:   { color: C.primary },
    notes:        { ...Typography.bodyMd, color: C.onSurfaceVariant, fontStyle: 'italic' },
    actions:      { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
    btnConfirm: {
      flex: 1, backgroundColor: C.primary, borderRadius: Radius.md,
      paddingVertical: Spacing.sm, alignItems: 'center',
    },
    btnConfirmText: { ...Typography.titleMd, color: C.background },
    btnDecline: {
      flex: 1, backgroundColor: C.error + '22', borderRadius: Radius.md,
      paddingVertical: Spacing.sm, alignItems: 'center',
      borderWidth: 1, borderColor: C.error + '44',
    },
    btnDeclineText: { ...Typography.titleMd, color: C.error },
    btnCancel: {
      backgroundColor: C.surfaceContainerHighest, borderRadius: Radius.md,
      paddingVertical: Spacing.sm, alignItems: 'center', marginTop: Spacing.xs,
      borderWidth: 1, borderColor: C.outlineVariant,
    },
    btnCancelText: { ...Typography.labelLg, color: C.onSurfaceVariant },
    empty: {
      paddingTop: 80, alignItems: 'center', gap: Spacing.md,
      paddingHorizontal: Spacing.xl,
    },
    emptyTitle:   { ...Typography.titleLg, color: C.onSurface },
    emptyText:    { ...Typography.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' },
    emptyBtn: {
      marginTop: Spacing.sm, backgroundColor: C.primary,
      borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    },
    emptyBtnText: { ...Typography.titleMd, color: C.background },
  }), [C]);

  const [loading,   setLoading]   = useState(true);
  const [role,      setRole]      = useState<'trainer' | 'client' | null>(null);
  const [userId,    setUserId]    = useState<string | null>(null);
  const [bookings,  setBookings]  = useState<Booking[]>([]);

  useFocusEffect(
    useCallback(() => { loadBookings(); }, [])
  );

  async function loadBookings() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const r = (profile?.role ?? 'client') as 'trainer' | 'client';
    setRole(r);

    // Fetch bookings
    const query = r === 'trainer'
      ? supabase.from('bookings').select('*').eq('trainer_id', user.id).neq('status', 'cancelled')
      : supabase.from('bookings').select('*').eq('client_id',  user.id).neq('status', 'cancelled');

    const { data: raw } = await query.order('starts_at', { ascending: true });
    if (!raw?.length) { setBookings([]); setLoading(false); return; }

    // Fetch the other party's names
    const otherIds = [...new Set(raw.map((b) => r === 'trainer' ? b.client_id : b.trainer_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', otherIds);

    const nameMap: Record<string, string> = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p.full_name ?? 'Unknown'])
    );

    setBookings(raw.map((b) => ({
      ...b,
      otherName: nameMap[r === 'trainer' ? b.client_id : b.trainer_id] ?? 'Unknown',
    })));
    setLoading(false);
  }

  async function confirm(bookingId: string, clientId: string, startsAt: string) {
    await supabase
      .from('bookings')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    const dateStr = new Date(startsAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    await Promise.all([
      sendPushNotification(clientId, 'Booking Confirmed', `Your session on ${dateStr} has been confirmed!`),
      insertNotification(clientId, 'booking_confirmed', 'Booking Confirmed', `Your session on ${dateStr} has been confirmed!`),
    ]);
    loadBookings();
  }

  async function decline(bookingId: string, clientId: string, startsAt: string) {
    Alert.alert('Decline Booking', 'Are you sure you want to decline this request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline', style: 'destructive', onPress: async () => {
          await supabase
            .from('bookings')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', bookingId);

          const dateStr = new Date(startsAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
          await Promise.all([
            sendPushNotification(clientId, 'Booking Declined', `Your session request for ${dateStr} was not accepted.`),
            insertNotification(clientId, 'booking_declined', 'Booking Declined', `Your session request for ${dateStr} was not accepted.`),
          ]);
          loadBookings();
        },
      },
    ]);
  }

  async function cancelAsClient(bookingId: string, trainerId: string, startsAt: string) {
    Alert.alert('Cancel Session', 'Cancel this booking? Your trainer will be notified.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Session', style: 'destructive', onPress: async () => {
          await supabase
            .from('bookings')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', bookingId);
          const dateStr = new Date(startsAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
          await Promise.all([
            sendPushNotification(trainerId, 'Booking Cancelled', `A client has cancelled their session on ${dateStr}.`),
            insertNotification(trainerId, 'booking_cancelled', 'Booking Cancelled', `A client has cancelled their session on ${dateStr}.`),
          ]);
          loadBookings();
        },
      },
    ]);
  }

  async function cancelAsTrainer(bookingId: string, clientId: string, clientName: string, startsAt: string) {
    const dateStr = new Date(startsAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    Alert.alert(
      'Cancel Session',
      `Cancel the session with ${clientName} on ${dateStr}? They will be notified.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Session', style: 'destructive', onPress: async () => {
            await supabase
              .from('bookings')
              .update({ status: 'cancelled', updated_at: new Date().toISOString() })
              .eq('id', bookingId);
            await Promise.all([
              sendPushNotification(clientId, 'Session Cancelled', `Your trainer has cancelled the session on ${dateStr}. Please rebook at a new time.`),
              insertNotification(clientId, 'booking_cancelled', 'Session Cancelled', `Your trainer has cancelled the session on ${dateStr}. Please rebook at a new time.`),
            ]);
            loadBookings();
          },
        },
      ]
    );
  }

  const now     = new Date();
  const pending  = bookings.filter((b) => b.status === 'pending');
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && new Date(b.starts_at) > now);
  const past     = bookings.filter((b) => b.status === 'confirmed' && new Date(b.starts_at) <= now);

  function BookingCard({ booking }: { booking: Booking }) {
    const isPast = new Date(booking.starts_at) <= now;
    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={s.cardLeft}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>
                {booking.otherName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
            <View>
              <Text style={s.cardName}>{booking.otherName}</Text>
              <Text style={s.cardTime}>
                {formatBookingDate(booking.starts_at)} · {formatBookingTime(booking.starts_at)} – {formatBookingTime(booking.ends_at)}
              </Text>
            </View>
          </View>
          <View style={[
            s.badge,
            booking.status === 'confirmed' && s.badgeConfirmed,
            booking.status === 'pending'   && s.badgePending,
          ]}>
            <Text style={[
              s.badgeText,
              booking.status === 'confirmed' && s.badgeTextConfirmed,
              booking.status === 'pending'   && s.badgeTextPending,
            ]}>
              {booking.status === 'pending' ? 'Pending' : 'Confirmed'}
            </Text>
          </View>
        </View>

        {booking.client_notes ? (
          <Text style={s.notes}>"{booking.client_notes}"</Text>
        ) : null}

        {/* Trainer: confirm/decline pending */}
        {role === 'trainer' && booking.status === 'pending' && (
          <View style={s.actions}>
            <TouchableOpacity
              style={s.btnConfirm}
              onPress={() => confirm(booking.id, booking.client_id, booking.starts_at)}>
              <Text style={s.btnConfirmText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.btnDecline}
              onPress={() => decline(booking.id, booking.client_id, booking.starts_at)}>
              <Text style={s.btnDeclineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Trainer: cancel confirmed upcoming */}
        {role === 'trainer' && booking.status === 'confirmed' && !isPast && (
          <TouchableOpacity
            style={s.btnCancel}
            onPress={() => cancelAsTrainer(booking.id, booking.client_id, booking.otherName, booking.starts_at)}>
            <Text style={s.btnCancelText}>Cancel Session</Text>
          </TouchableOpacity>
        )}

        {/* Client: cancel pending or confirmed upcoming */}
        {role === 'client' && !isPast && (
          <TouchableOpacity
            style={s.btnCancel}
            onPress={() => cancelAsClient(booking.id, booking.trainer_id, booking.starts_at)}>
            <Text style={s.btnCancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  function Section({ title, data }: { title: string; data: Booking[] }) {
    if (!data.length) return null;
    return (
      <>
        <Text style={s.sectionLabel}>{title}</Text>
        {data.map((b) => <BookingCard key={b.id} booking={b} />)}
      </>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={24} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={s.title}>Bookings</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          {bookings.length === 0 ? (
            <View style={s.empty}>
              <IconSymbol name="calendar" size={36} color={C.outlineVariant} />
              <Text style={s.emptyTitle}>No bookings yet</Text>
              <Text style={s.emptyText}>
                {role === 'trainer'
                  ? 'Set your availability so clients can book sessions.'
                  : 'Book a session with your trainer to get started.'}
              </Text>
              {role === 'trainer' && (
                <TouchableOpacity
                  style={s.emptyBtn}
                  onPress={() => router.push('/set-availability' as any)}>
                  <Text style={s.emptyBtnText}>Set Availability</Text>
                </TouchableOpacity>
              )}
              {role === 'client' && (
                <TouchableOpacity
                  style={s.emptyBtn}
                  onPress={() => router.push('/book-session' as any)}>
                  <Text style={s.emptyBtnText}>Book a Session</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <Section title="Pending Requests" data={pending} />
              <Section title="Upcoming"         data={upcoming} />
              <Section title="Past"             data={past} />
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
