import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl, ScrollView,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/format';
import { sendPushNotification } from '@/lib/notifications';

// ─── Types ────────────────────────────────────────────────────────────────────

type TrainerInfo = {
  linkId:      string;
  trainerId:   string;
  trainerName: string;
};

type AssignedPlan = {
  id:   string;
  name: string;
  days: number;
};

type LastMessage = {
  content:   string;
  senderId:  string;
  createdAt: string;
  unread:    number;
};

type CheckIn = {
  id:         string;
  week_start: string;
  mood:       number | null;
  energy:     number | null;
  note:       string | null;
};

type Booking = {
  id:         string;
  trainer_id: string;
  starts_at:  string;
  ends_at:    string;
  status:     'pending' | 'confirmed';
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function moodEmoji(score: number | null): string {
  if (score == null) return '—';
  if (score <= 1) return '😞';
  if (score <= 2) return '😕';
  if (score <= 3) return '😐';
  if (score <= 4) return '🙂';
  return '😄';
}

function moodColor(score: number | null, C: ReturnType<typeof useColors>): string {
  if (score == null) return C.onSurfaceVariant;
  if (score <= 2) return C.error;
  if (score <= 3) return '#F59E0B';
  return C.success;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function weekLabel(iso: string): string {
  const d = new Date(iso);
  const end = new Date(d); end.setDate(d.getDate() + 6);
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function isThisWeek(iso: string): boolean {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return new Date(iso) >= monday;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TrainerTab() {
  const C      = useColors();
  const router = useRouter();

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myId,       setMyId]       = useState('');
  const [trainer,    setTrainer]    = useState<TrainerInfo | null>(null);
  const [plans,      setPlans]      = useState<AssignedPlan[]>([]);
  const [lastMsg,    setLastMsg]    = useState<LastMessage | null>(null);
  const [checkIns,   setCheckIns]   = useState<CheckIn[]>([]);
  const [bookings,   setBookings]   = useState<Booking[]>([]);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setMyId(user.id);

    const { data: link } = await supabase
      .from('trainer_clients')
      .select('id, trainer_id')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!link) { setTrainer(null); setLoading(false); return; }

    const [profileRes, plansRes, msgsRes, checkInsRes, bookingsRes] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', link.trainer_id).single(),

      supabase
        .from('workout_plans')
        .select('id, name, workout_plan_days(id)')
        .eq('assigned_to', user.id)
        .not('assigned_by', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3),

      supabase
        .from('messages')
        .select('id, content, sender_id, created_at, is_read')
        .eq('trainer_client_id', link.id)
        .order('created_at', { ascending: false })
        .limit(20),

      supabase
        .from('check_ins')
        .select('id, week_start, mood, energy, note')
        .eq('client_id', user.id)
        .order('week_start', { ascending: false })
        .limit(4),

      supabase
        .from('bookings')
        .select('id, trainer_id, starts_at, ends_at, status')
        .eq('client_id', user.id)
        .neq('status', 'cancelled')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(5),
    ]);

    setTrainer({ linkId: link.id, trainerId: link.trainer_id, trainerName: profileRes.data?.full_name ?? 'Your Trainer' });
    setPlans((plansRes.data ?? []).map((p: any) => ({ id: p.id, name: p.name, days: p.workout_plan_days?.length ?? 0 })));

    const msgs = msgsRes.data ?? [];
    if (msgs.length > 0) {
      const latest = msgs[0];
      const unread = msgs.filter((m: any) => !m.is_read && m.sender_id !== user.id).length;
      setLastMsg({ content: latest.content, senderId: latest.sender_id, createdAt: latest.created_at, unread });
    } else {
      setLastMsg(null);
    }

    setCheckIns(checkInsRes.data ?? []);
    setBookings(bookingsRes.data ?? []);
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const goToConvo = () => router.push({
    pathname: '/conversation' as any,
    params: { threadId: trainer!.linkId, otherName: trainer!.trainerName },
  });

  const goToCheckIn = () => router.push({
    pathname: '/check-in' as any,
    params: { threadId: trainer!.linkId, trainerName: trainer!.trainerName },
  });

  function cancelBooking(booking: Booking) {
    const dateStr = new Date(booking.starts_at).toLocaleDateString(undefined, {
      weekday: 'long', month: 'short', day: 'numeric',
    });
    const timeStr = new Date(booking.starts_at).toLocaleTimeString(undefined, {
      hour: '2-digit', minute: '2-digit',
    });
    Alert.alert(
      'Cancel Session',
      `Cancel your session on ${dateStr} at ${timeStr}?\n\n${trainer!.trainerName} will be notified.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: async () => {
            await supabase
              .from('bookings')
              .update({ status: 'cancelled', updated_at: new Date().toISOString() })
              .eq('id', booking.id);
            await sendPushNotification(
              booking.trainer_id,
              'Booking Cancelled',
              `A client has cancelled their session on ${dateStr}.`,
            );
            setBookings((prev) => prev.filter((b) => b.id !== booking.id));
          },
        },
      ]
    );
  }

  // ── No trainer ─────────────────────────────────────────────────────────────

  if (!loading && !trainer) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: Spacing.lg }}>
          <View style={{
            width: 88, height: 88, borderRadius: 44,
            backgroundColor: C.surfaceContainer,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <IconSymbol name="person.2.fill" size={36} color={C.onSurfaceVariant} />
          </View>
          <View style={{ alignItems: 'center', gap: Spacing.sm }}>
            <Text style={{ ...Typography.titleLg, color: C.onSurface }}>No trainer connected</Text>
            <Text style={{ ...Typography.bodyLg, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 24 }}>
              When a personal trainer connects with you, their hub will appear here.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top']}>
        <ActivityIndicator color={C.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const thisWeekCheckIn = checkIns.find((ci) => isThisWeek(ci.week_start)) ?? null;
  const pastCheckIns    = checkIns.filter((ci) => !isThisWeek(ci.week_start));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />}>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <View style={{
          alignItems: 'center',
          paddingTop: Spacing.xl,
          paddingBottom: Spacing.lg,
          paddingHorizontal: Spacing.lg,
          gap: Spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: C.outlineVariant,
          marginBottom: Spacing.lg,
        }}>
          {/* Avatar */}
          <View style={{
            width: 96, height: 96, borderRadius: 48,
            backgroundColor: C.primary + '20',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 3, borderColor: C.primary + '40',
          }}>
            <Text style={{ fontSize: 36, fontWeight: '700', color: C.primary }}>
              {initials(trainer!.trainerName)}
            </Text>
          </View>

          {/* Name + role */}
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ ...Typography.titleLg, color: C.onSurface, fontWeight: '700', fontSize: 22 }}>
              {trainer!.trainerName}
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: C.primary + '15',
              paddingHorizontal: Spacing.md, paddingVertical: 4,
              borderRadius: Radius.full,
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.success }} />
              <Text style={{ ...Typography.labelLg, color: C.primary, fontWeight: '600' }}>
                Personal Trainer
              </Text>
            </View>
          </View>

          {/* Quick actions */}
          <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xs }}>
            {([
              { label: 'Message',  icon: 'bubble.left.fill'     as const, onPress: goToConvo },
              { label: 'Check In', icon: 'checkmark.circle.fill' as const, onPress: goToCheckIn },
              { label: 'Book',     icon: 'calendar'              as const, onPress: () => router.push('/book-session' as any) },
            ] as const).map(({ label, icon, onPress }) => (
              <TouchableOpacity
                key={label}
                onPress={onPress}
                activeOpacity={0.75}
                style={{ alignItems: 'center', gap: Spacing.xs }}>
                <View style={{
                  width: 56, height: 56, borderRadius: 28,
                  backgroundColor: C.primary + '18',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: C.primary + '30',
                }}>
                  <IconSymbol name={icon} size={22} color={C.primary} />
                </View>
                <Text style={{ ...Typography.labelMd, color: C.onSurfaceVariant }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Messages preview ─────────────────────────────────────────── */}
        <View style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
          <TouchableOpacity
            onPress={goToConvo}
            activeOpacity={0.8}
            style={{
              backgroundColor: C.surfaceContainer,
              borderRadius: Radius.lg,
              padding: Spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.md,
            }}>
            {/* Avatar mini */}
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: C.primary + '20',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ ...Typography.labelLg, color: C.primary, fontWeight: '700' }}>
                {initials(trainer!.trainerName)}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                <Text style={{ ...Typography.titleMd, color: C.onSurface, flex: 1 }}>
                  {trainer!.trainerName}
                </Text>
                {lastMsg && (
                  <Text style={{ ...Typography.labelMd, color: C.onSurfaceVariant }}>
                    {timeAgo(lastMsg.createdAt)}
                  </Text>
                )}
              </View>
              <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant }} numberOfLines={1}>
                {lastMsg
                  ? (lastMsg.senderId === myId ? `You: ${lastMsg.content}` : lastMsg.content)
                  : 'Start the conversation…'}
              </Text>
            </View>

            {/* Unread badge */}
            {(lastMsg?.unread ?? 0) > 0 ? (
              <View style={{
                minWidth: 20, height: 20, borderRadius: 10,
                backgroundColor: C.primary,
                alignItems: 'center', justifyContent: 'center',
                paddingHorizontal: 5,
              }}>
                <Text style={{ ...Typography.labelMd, color: C.onPrimary, fontWeight: '700', fontSize: 11 }}>
                  {lastMsg!.unread}
                </Text>
              </View>
            ) : (
              <IconSymbol name="chevron.right" size={16} color={C.outlineVariant} />
            )}
          </TouchableOpacity>
        </View>

        {/* ── This week's check-in ──────────────────────────────────────── */}
        <View style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
          <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 11 }}>
            This Week's Check-in
          </Text>

          {thisWeekCheckIn ? (
            <View style={{
              backgroundColor: C.surfaceContainer,
              borderRadius: Radius.lg,
              padding: Spacing.md,
              gap: Spacing.sm,
            }}>
              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                {/* Mood */}
                <View style={{ flex: 1, alignItems: 'center', gap: 4, backgroundColor: C.surfaceContainerHigh, borderRadius: Radius.md, paddingVertical: Spacing.md }}>
                  <Text style={{ fontSize: 28 }}>{moodEmoji(thisWeekCheckIn.mood)}</Text>
                  <Text style={{ ...Typography.labelMd, color: moodColor(thisWeekCheckIn.mood, C), fontWeight: '600' }}>
                    Mood
                  </Text>
                  <Text style={{ ...Typography.titleMd, color: C.onSurface }}>
                    {thisWeekCheckIn.mood ?? '—'}/5
                  </Text>
                </View>
                {/* Energy */}
                <View style={{ flex: 1, alignItems: 'center', gap: 4, backgroundColor: C.surfaceContainerHigh, borderRadius: Radius.md, paddingVertical: Spacing.md }}>
                  <Text style={{ fontSize: 28 }}>{moodEmoji(thisWeekCheckIn.energy)}</Text>
                  <Text style={{ ...Typography.labelMd, color: moodColor(thisWeekCheckIn.energy, C), fontWeight: '600' }}>
                    Energy
                  </Text>
                  <Text style={{ ...Typography.titleMd, color: C.onSurface }}>
                    {thisWeekCheckIn.energy ?? '—'}/5
                  </Text>
                </View>
              </View>
              {thisWeekCheckIn.note ? (
                <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant, fontStyle: 'italic' }} numberOfLines={3}>
                  "{thisWeekCheckIn.note}"
                </Text>
              ) : null}
              <TouchableOpacity onPress={goToCheckIn} style={{ alignItems: 'center', paddingVertical: Spacing.xs }}>
                <Text style={{ ...Typography.labelLg, color: C.primary }}>Update check-in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={goToCheckIn}
              activeOpacity={0.85}
              style={{
                backgroundColor: C.primary + '12',
                borderRadius: Radius.lg,
                borderWidth: 1.5,
                borderColor: C.primary + '30',
                borderStyle: 'dashed',
                padding: Spacing.lg,
                alignItems: 'center',
                gap: Spacing.sm,
              }}>
              <IconSymbol name="checkmark.circle.fill" size={28} color={C.primary} />
              <Text style={{ ...Typography.titleMd, color: C.primary, fontWeight: '600' }}>
                Submit this week's check-in
              </Text>
              <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' }}>
                Keep your trainer up to date on how you're feeling
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Assigned plans ────────────────────────────────────────────── */}
        {plans.length > 0 && (
          <View style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs }}>
              <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant, flex: 1, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 11 }}>
                My Plans
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/plans' as any)}>
                <Text style={{ ...Typography.labelLg, color: C.primary }}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={{ backgroundColor: C.surfaceContainer, borderRadius: Radius.lg, overflow: 'hidden' }}>
              {plans.map((plan, i) => (
                <TouchableOpacity
                  key={plan.id}
                  onPress={() => router.push('/(tabs)/plans' as any)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: Spacing.md,
                    gap: Spacing.md,
                    borderBottomWidth: i < plans.length - 1 ? 1 : 0,
                    borderBottomColor: C.outlineVariant,
                  }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: Radius.md,
                    backgroundColor: C.primary + '18',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconSymbol name="dumbbell.fill" size={18} color={C.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...Typography.titleMd, color: C.onSurface }}>{plan.name}</Text>
                    <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant }}>
                      {plan.days} day{plan.days !== 1 ? 's' : ''} · From trainer
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={C.outlineVariant} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Past check-ins ────────────────────────────────────────────── */}
        {pastCheckIns.length > 0 && (
          <View style={{ marginHorizontal: Spacing.lg, marginBottom: Spacing.lg }}>
            <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 11 }}>
              Check-in History
            </Text>
            <View style={{ backgroundColor: C.surfaceContainer, borderRadius: Radius.lg, overflow: 'hidden' }}>
              {pastCheckIns.map((ci, i) => (
                <View
                  key={ci.id}
                  style={{
                    padding: Spacing.md,
                    borderBottomWidth: i < pastCheckIns.length - 1 ? 1 : 0,
                    borderBottomColor: C.outlineVariant,
                    gap: 6,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ ...Typography.titleMd, color: C.onSurface, flex: 1 }}>
                      {weekLabel(ci.week_start)}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      {ci.mood != null && (
                        <Text style={{ fontSize: 16 }}>{moodEmoji(ci.mood)}</Text>
                      )}
                      {ci.energy != null && (
                        <Text style={{ fontSize: 16 }}>{moodEmoji(ci.energy)}</Text>
                      )}
                    </View>
                  </View>
                  {ci.note ? (
                    <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant }} numberOfLines={1}>
                      {ci.note}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Upcoming bookings ──────────────────────────────────────────── */}
        <View style={{ marginHorizontal: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs }}>
            <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant, flex: 1, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 11 }}>
              Upcoming Sessions
            </Text>
            <TouchableOpacity onPress={() => router.push('/book-session' as any)}>
              <Text style={{ ...Typography.labelLg, color: C.primary }}>Book new</Text>
            </TouchableOpacity>
          </View>

          {bookings.length === 0 ? (
            <TouchableOpacity
              onPress={() => router.push('/book-session' as any)}
              activeOpacity={0.85}
              style={{
                backgroundColor: C.surfaceContainer,
                borderRadius: Radius.lg,
                padding: Spacing.lg,
                alignItems: 'center',
                gap: Spacing.sm,
                flexDirection: 'row',
              }}>
              <View style={{ width: 40, height: 40, borderRadius: Radius.md, backgroundColor: C.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
                <IconSymbol name="calendar" size={20} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...Typography.titleMd, color: C.onSurface }}>No upcoming sessions</Text>
                <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant }}>Tap to book a session</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={C.outlineVariant} />
            </TouchableOpacity>
          ) : (
            <View style={{ backgroundColor: C.surfaceContainer, borderRadius: Radius.lg, overflow: 'hidden' }}>
              {bookings.map((booking, i) => {
                const start   = new Date(booking.starts_at);
                const end     = new Date(booking.ends_at);
                const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                const timeStr = `${start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
                const isPending = booking.status === 'pending';
                return (
                  <View
                    key={booking.id}
                    style={{
                      padding: Spacing.md,
                      borderBottomWidth: i < bookings.length - 1 ? 1 : 0,
                      borderBottomColor: C.outlineVariant,
                      gap: Spacing.sm,
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                      <View style={{ width: 40, height: 40, borderRadius: Radius.md, backgroundColor: C.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
                        <IconSymbol name="calendar" size={18} color={C.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ ...Typography.titleMd, color: C.onSurface }}>{dateStr}</Text>
                        <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant }}>{timeStr}</Text>
                      </View>
                      <View style={{
                        paddingHorizontal: Spacing.sm, paddingVertical: 3,
                        borderRadius: Radius.full,
                        backgroundColor: isPending ? C.primary + '20' : C.success + '20',
                      }}>
                        <Text style={{ ...Typography.labelMd, color: isPending ? C.primary : C.success, fontWeight: '600' }}>
                          {isPending ? 'Pending' : 'Confirmed'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => cancelBooking(booking)}
                      style={{
                        paddingVertical: Spacing.sm,
                        borderRadius: Radius.md,
                        backgroundColor: C.error + '10',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: C.error + '25',
                      }}>
                      <Text style={{ ...Typography.labelLg, color: C.error }}>Cancel Session</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
