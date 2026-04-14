import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors, useTheme } from '@/contexts/ThemeContext';
import { useStyles } from '@/styles/tabs/profile.styles';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/format';
import { getCachedAny, setCached, CACHE_KEYS } from '@/lib/cache';
import { useSpotify } from '@/contexts/SpotifyContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileCache = {
  fullName:      string;
  totalSessions: number;
};

type PendingInvite = {
  linkId:      string;
  trainerId:   string;
  trainerName: string;
};

type ActiveTrainer = {
  linkId:      string;
  trainerId:   string;
  trainerName: string;
};

// ─── Static menu ─────────────────────────────────────────────────────────────

const MENU_SECTIONS = [
  {
    title: 'Fitness',
    items: [
      { label: 'Progress Photos',  icon: 'camera.fill'    as const, route: '/progress-photos'       as const },
      { label: 'Body Weight Log',  icon: 'scalemass.fill' as const, route: '/body-weight-log'        as const },
      { label: 'Achievements',     icon: 'trophy.fill'    as const, route: '/achievements'           as const },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Edit Profile',    icon: 'pencil'    as const, route: '/edit-profile'          as const },
      { label: 'Notifications',   icon: 'bell.fill' as const, route: '/notification-settings' as const },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Privacy Policy',  icon: 'lock.fill'        as const, route: '/privacy-policy' as const },
      { label: 'Terms of Service', icon: 'bookmark.fill'   as const, route: '/terms'           as const },
    ],
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const C = useColors();
  const { isDark, setMode, mode } = useTheme();
  const styles = useStyles();
  const router = useRouter();

  const inviteStyles = useMemo(() => StyleSheet.create({
    section:           { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
    inviteRow:         { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
    avatar:            { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: C.primary + '33', justifyContent: 'center', alignItems: 'center' },
    avatarText:        { ...Typography.titleMd, color: C.primary },
    inviteInfo:        { flex: 1 },
    trainerName:       { ...Typography.titleMd, color: C.onSurface },
    inviteLabel:       { ...Typography.bodyMd, color: C.onSurfaceVariant },
    actions:           { flexDirection: 'row', gap: Spacing.xs },
    acceptBtn:         { backgroundColor: C.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, minWidth: 64, alignItems: 'center' },
    acceptBtnText:     { ...Typography.labelLg, color: C.background, fontWeight: '600' as const },
    declineBtn:        { borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
    declineBtnText:    { ...Typography.labelLg, color: C.onSurfaceVariant },
    trainerAction:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.md },
    trainerActionText: { ...Typography.titleMd, color: C.primary },
  }), [C]);
  const [loading,        setLoading]        = useState(true);
  const [fullName,       setFullName]       = useState('');
  const [role,           setRole]           = useState<'client' | 'trainer'>('client');
  const [totalSessions,  setTotalSessions]  = useState(0);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [activeTrainer,  setActiveTrainer]  = useState<ActiveTrainer | null>(null);
  const [acceptingId,    setAcceptingId]    = useState<string | null>(null);
  const { isConnected: spotifyConnected, connect: connectSpotify, disconnect: disconnectSpotify, playerState } = useSpotify();

  function applyData(d: ProfileCache) {
    setFullName(d.fullName);
    setTotalSessions(d.totalSessions);
  }

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function loadProfile() {
    // Show cached data immediately
    const cached = await getCachedAny<ProfileCache>(CACHE_KEYS.PROFILE);
    if (cached) {
      applyData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // Background refresh
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
        supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      const fresh: ProfileCache = {
        fullName:      profile?.full_name ?? '',
        totalSessions: count ?? 0,
      };
      applyData(fresh);
      if (profile?.role) setRole(profile.role as 'client' | 'trainer');
      await setCached(CACHE_KEYS.PROFILE, fresh);

      // Load trainer-related data (clients only)
      if (profile?.role === 'client') {
        await Promise.all([
          loadPendingInvites(user.id),
          loadActiveTrainer(user.id),
        ]);
      }
    } catch {
      // Silently fall back to cached data
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingInvites(userId: string) {
    const { data: links } = await supabase
      .from('trainer_clients')
      .select('id, trainer_id')
      .eq('client_id', userId)
      .eq('status', 'pending');

    if (!links || links.length === 0) { setPendingInvites([]); return; }

    const trainerIds = links.map((l) => l.trainer_id);
    const { data: trainers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', trainerIds);

    const trainerMap = Object.fromEntries((trainers ?? []).map((t) => [t.id, t.full_name]));

    setPendingInvites(links.map((l) => ({
      linkId:      l.id,
      trainerId:   l.trainer_id,
      trainerName: trainerMap[l.trainer_id] ?? 'Unknown Trainer',
    })));
  }

  async function loadActiveTrainer(userId: string) {
    const { data: link } = await supabase
      .from('trainer_clients')
      .select('id, trainer_id')
      .eq('client_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!link) { setActiveTrainer(null); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', link.trainer_id)
      .single();

    setActiveTrainer({
      linkId:      link.id,
      trainerId:   link.trainer_id,
      trainerName: profile?.full_name ?? 'Your Trainer',
    });
  }

  async function handleAcceptInvite(linkId: string) {
    setAcceptingId(linkId);
    await supabase
      .from('trainer_clients')
      .update({ status: 'active', accepted_at: new Date().toISOString() })
      .eq('id', linkId);
    setPendingInvites((prev) => prev.filter((i) => i.linkId !== linkId));
    setAcceptingId(null);
  }

  async function handleDeclineInvite(linkId: string) {
    await supabase.from('trainer_clients').delete().eq('id', linkId);
    setPendingInvites((prev) => prev.filter((i) => i.linkId !== linkId));
  }

  async function handleDisconnectTrainer() {
    if (!activeTrainer) return;
    Alert.alert(
      'Remove Trainer',
      `Disconnect from ${activeTrainer.trainerName}? You'll lose access to messages and session booking.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('trainer_clients').delete().eq('id', activeTrainer.linkId);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setActiveTrainer(null);
            }
          },
        },
      ]
    );
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              const { error } = await supabase.functions.invoke('delete-account', {
                headers: { Authorization: `Bearer ${session?.access_token}` },
              });
              if (error) throw error;
              await supabase.auth.signOut();
            } catch {
              Alert.alert('Error', 'Failed to delete account. Please try again or contact mocupsolutions@gmail.com');
            }
          },
        },
      ],
    );
  }

  const displayName = fullName || (role === 'trainer' ? 'Trainer' : 'Athlete');
  const avatarText  = fullName ? initials(fullName) : '?';
  const roleLabel   = role === 'trainer' ? 'Personal Trainer' : 'FitConnect Athlete';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{avatarText}</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={C.primary} style={{ marginTop: 12 }} />
          ) : (
            <>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userRole}>{roleLabel}</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{totalSessions}</Text>
                  <Text style={styles.statLabel}>Workouts</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Active trainer section (clients only) */}
        {activeTrainer && (
          <View style={inviteStyles.section}>
            <Text style={styles.sectionTitle}>Your Trainer</Text>
            <View style={styles.menuCard}>
              <View style={[inviteStyles.inviteRow, { borderBottomWidth: 1, borderBottomColor: C.outlineVariant }]}>
                <View style={inviteStyles.avatar}>
                  <Text style={inviteStyles.avatarText}>{initials(activeTrainer.trainerName)}</Text>
                </View>
                <View style={inviteStyles.inviteInfo}>
                  <Text style={inviteStyles.trainerName}>{activeTrainer.trainerName}</Text>
                  <Text style={inviteStyles.inviteLabel}>Personal Trainer</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  style={[inviteStyles.trainerAction, { borderRightWidth: 1, borderRightColor: C.outlineVariant }]}
                  onPress={() => router.push({
                    pathname: '/conversation' as any,
                    params: { threadId: activeTrainer.linkId, otherName: activeTrainer.trainerName },
                  })}>
                  <IconSymbol name="bubble.left.fill" size={16} color={C.primary} />
                  <Text style={inviteStyles.trainerActionText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[inviteStyles.trainerAction, { borderRightWidth: 1, borderRightColor: C.outlineVariant }]}
                  onPress={() => router.push({
                    pathname: '/check-in' as any,
                    params: { threadId: activeTrainer.linkId, trainerName: activeTrainer.trainerName },
                  })}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color={C.primary} />
                  <Text style={inviteStyles.trainerActionText}>Check-In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={inviteStyles.trainerAction}
                  onPress={handleDisconnectTrainer}>
                  <IconSymbol name="xmark.circle.fill" size={16} color={C.error} />
                  <Text style={[inviteStyles.trainerActionText, { color: C.error }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Pending trainer invites (clients only) */}
        {pendingInvites.length > 0 && (
          <View style={inviteStyles.section}>
            <Text style={styles.sectionTitle}>Trainer Invites</Text>
            <View style={styles.menuCard}>
              {pendingInvites.map((invite, idx) => (
                <View
                  key={invite.linkId}
                  style={[
                    inviteStyles.inviteRow,
                    idx < pendingInvites.length - 1 && styles.menuItemBorder,
                  ]}>
                  <View style={inviteStyles.avatar}>
                    <Text style={inviteStyles.avatarText}>{initials(invite.trainerName)}</Text>
                  </View>
                  <View style={inviteStyles.inviteInfo}>
                    <Text style={inviteStyles.trainerName}>{invite.trainerName}</Text>
                    <Text style={inviteStyles.inviteLabel}>wants to be your trainer</Text>
                  </View>
                  <View style={inviteStyles.actions}>
                    <TouchableOpacity
                      style={inviteStyles.acceptBtn}
                      onPress={() => handleAcceptInvite(invite.linkId)}
                      disabled={acceptingId === invite.linkId}>
                      {acceptingId === invite.linkId
                        ? <ActivityIndicator size="small" color={C.background} />
                        : <Text style={inviteStyles.acceptBtnText}>Accept</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={inviteStyles.declineBtn}
                      onPress={() => handleDeclineInvite(invite.linkId)}>
                      <Text style={inviteStyles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    idx < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => item.route && router.push(item.route as any)}
                  activeOpacity={item.route ? 0.7 : 1}>
                  <View style={styles.menuIconBox}>
                    <IconSymbol name={item.icon} size={18} color={item.route ? C.primary : C.onSurfaceVariant} />
                  </View>
                  <Text style={[styles.menuLabel, !item.route && { color: C.onSurfaceVariant }]}>
                    {item.label}
                  </Text>
                  <IconSymbol
                    name="chevron.right"
                    size={16}
                    color={item.route ? C.onSurfaceVariant : C.outlineVariant}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.menuCard}>
            {(['dark', 'light', 'system'] as const).map((m, i, arr) => (
              <TouchableOpacity
                key={m}
                style={[styles.menuItem, i < arr.length - 1 && styles.menuItemBorder]}
                onPress={() => setMode(m)}
                activeOpacity={0.7}>
                <View style={styles.menuIconBox}>
                  <IconSymbol
                    name={m === 'dark' ? 'moon.fill' : m === 'light' ? 'sun.max.fill' : 'circle.lefthalf.filled'}
                    size={18}
                    color={C.primary}
                  />
                </View>
                <Text style={styles.menuLabel}>
                  {m === 'dark' ? 'Dark' : m === 'light' ? 'Light' : 'System Default'}
                </Text>
                {mode === m && <IconSymbol name="checkmark.circle.fill" size={20} color={C.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Music */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Music</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={spotifyConnected ? disconnectSpotify : connectSpotify}
              activeOpacity={0.7}>
              <View style={[styles.menuIconBox, { backgroundColor: '#1DB95422' }]}>
                <IconSymbol name="music.note" size={18} color="#1DB954" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>Spotify</Text>
                {spotifyConnected && playerState?.track ? (
                  <Text style={{ ...Typography.labelMd, color: C.onSurfaceVariant }} numberOfLines={1}>
                    {playerState.track.name} · {playerState.track.artist}
                  </Text>
                ) : (
                  <Text style={{ ...Typography.labelMd, color: spotifyConnected ? C.success : C.onSurfaceVariant }}>
                    {spotifyConnected ? 'Connected — tap to disconnect' : 'Tap to connect'}
                  </Text>
                )}
              </View>
              <View style={{
                backgroundColor: spotifyConnected ? '#1DB95422' : C.surfaceContainerHighest,
                paddingHorizontal: Spacing.sm,
                paddingVertical: 3,
                borderRadius: Radius.full,
              }}>
                <Text style={{ ...Typography.labelMd, color: spotifyConnected ? '#1DB954' : C.onSurfaceVariant }}>
                  {spotifyConnected ? 'Connected' : 'Connect'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign out + Delete account */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]} onPress={handleSignOut}>
              <View style={styles.menuIconBox}>
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color={C.error} />
              </View>
              <Text style={[styles.menuLabel, { color: C.error }]}>Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
              <View style={styles.menuIconBox}>
                <IconSymbol name="trash" size={18} color={C.error} />
              </View>
              <Text style={[styles.menuLabel, { color: C.error }]}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version */}
        <Text style={{ textAlign: 'center', color: C.onSurfaceVariant, fontSize: 12, marginBottom: Spacing.xl }}>
          FitConnect v1.0.0
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

