import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useSpotify } from '@/contexts/SpotifyContext';
import { supabase } from '@/lib/supabase';
import type { NotificationType } from '@/lib/notifications';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppNotification = {
  id:        string;
  type:      NotificationType;
  title:     string;
  body:      string;
  read_at:   string | null;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type IconConfig = { name: any; bg: string; color: string };

function iconForType(type: NotificationType, C: ReturnType<typeof import('@/contexts/ThemeContext').useColors>): IconConfig {
  switch (type) {
    case 'booking_request':   return { name: 'calendar',              bg: C.primary + '22',  color: C.primary };
    case 'booking_confirmed': return { name: 'checkmark.circle.fill', bg: C.success + '22',  color: C.success };
    case 'booking_cancelled': return { name: 'xmark.circle.fill',     bg: C.error   + '22',  color: C.error   };
    case 'booking_declined':  return { name: 'xmark.circle.fill',     bg: C.error   + '22',  color: C.error   };
    case 'trainer_invite':    return { name: 'person.badge.plus',     bg: C.primary + '22',  color: C.primary };
    case 'trainer_request':   return { name: 'person.badge.plus',     bg: C.primary + '22',  color: C.primary };
    case 'trainer_accepted':  return { name: 'checkmark.circle.fill', bg: C.success + '22',  color: C.success };
    default:                  return { name: 'bell.fill',             bg: C.primary + '22',  color: C.primary };
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const C = useColors();
  const router = useRouter();
  const { isConnected: spotifyConnected, connect: connectSpotify } = useSpotify();

  const s = useMemo(() => StyleSheet.create({
    container:   { flex: 1, backgroundColor: C.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
      borderBottomWidth: 1, borderBottomColor: C.outlineVariant,
    },
    title:       { ...Typography.titleLg, color: C.onSurface },
    scroll:      { padding: Spacing.lg },
    card: {
      flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
      backgroundColor: C.surfaceContainer, borderRadius: Radius.lg,
      padding: Spacing.md, marginBottom: Spacing.sm,
      borderWidth: 1, borderColor: C.outlineVariant,
    },
    cardUnread:  { borderColor: C.primary + '44', backgroundColor: C.primary + '08' },
    iconBox: {
      width: 40, height: 40, borderRadius: Radius.full,
      justifyContent: 'center', alignItems: 'center',
    },
    cardBody:    { flex: 1 },
    cardTitle:   { ...Typography.titleMd, color: C.onSurface },
    cardText:    { ...Typography.bodyMd, color: C.onSurfaceVariant, marginTop: 2 },
    cardTime:    { ...Typography.labelMd, color: C.outlineVariant, marginTop: 4 },
    dot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: C.primary, marginTop: 6,
    },
    empty:       { paddingTop: 80, alignItems: 'center', gap: Spacing.md },
    emptyTitle:  { ...Typography.titleLg, color: C.onSurface },
    emptyText:   { ...Typography.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' },
    markAllBtn:  { paddingHorizontal: Spacing.sm, paddingVertical: 4 },
    markAllText: { ...Typography.labelLg, color: C.primary },
    spotifyCard: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: '#1DB95415',
      borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
      borderWidth: 1, borderColor: '#1DB95433',
    },
    spotifyIconBox: {
      width: 40, height: 40, borderRadius: Radius.full,
      backgroundColor: '#1DB95422', justifyContent: 'center', alignItems: 'center',
    },
    spotifyBody:    { flex: 1 },
    spotifyTitle:   { ...Typography.titleMd, color: C.onSurface },
    spotifyText:    { ...Typography.bodyMd, color: C.onSurfaceVariant, marginTop: 2 },
    spotifyBtn: {
      backgroundColor: '#1DB954', borderRadius: Radius.md,
      paddingHorizontal: Spacing.md, paddingVertical: 6, marginTop: Spacing.sm,
      alignSelf: 'flex-start',
    },
    spotifyBtnText: { ...Typography.labelLg, color: '#fff', fontWeight: '700' },
  }), [C]);

  const [loading,       setLoading]       = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, body, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    setNotifications((data ?? []) as AppNotification[]);

    // Mark all unread as read
    const unreadIds = (data ?? []).filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length > 0) {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);
    }

    setLoading(false);
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={24} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={s.title}>Notifications</Text>
        <TouchableOpacity
          style={s.markAllBtn}
          onPress={() => router.push('/notification-settings' as any)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="gearshape.fill" size={20} color={C.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <View style={s.empty}>
          <IconSymbol name="bell.fill" size={36} color={C.outlineVariant} />
          <Text style={s.emptyTitle}>All caught up</Text>
          <Text style={s.emptyText}>Booking updates, trainer activity, and more will appear here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Spotify suggestion */}
          {!spotifyConnected && (
            <View style={s.spotifyCard}>
              <View style={s.spotifyIconBox}>
                <IconSymbol name="music.note" size={20} color="#1DB954" />
              </View>
              <View style={s.spotifyBody}>
                <Text style={s.spotifyTitle}>Connect Spotify</Text>
                <Text style={s.spotifyText}>Play music during workouts without leaving the app.</Text>
                <TouchableOpacity style={s.spotifyBtn} onPress={connectSpotify}>
                  <Text style={s.spotifyBtnText}>Connect</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {unreadCount > 0 && (
            <TouchableOpacity style={[s.markAllBtn, { alignSelf: 'flex-end', marginBottom: Spacing.sm }]} onPress={markAllRead}>
              <Text style={s.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          )}
          {notifications.map((n) => {
            const icon = iconForType(n.type, C);
            const isUnread = !n.read_at;
            return (
              <View key={n.id} style={[s.card, isUnread && s.cardUnread]}>
                <View style={[s.iconBox, { backgroundColor: icon.bg }]}>
                  <IconSymbol name={icon.name} size={20} color={icon.color} />
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardTitle}>{n.title}</Text>
                  <Text style={s.cardText}>{n.body}</Text>
                  <Text style={s.cardTime}>{timeAgo(n.created_at)}</Text>
                </View>
                {isUnread && <View style={s.dot} />}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
