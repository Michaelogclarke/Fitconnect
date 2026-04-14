import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useStyles } from '@/styles/tabs/profile.styles';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/format';
import { getCachedAny, setCached, CACHE_KEYS } from '@/lib/cache';

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

type OutgoingRequest = {
  linkId:      string;
  trainerId:   string;
  trainerName: string;
};

// ─── Static menu ─────────────────────────────────────────────────────────────

const CLIENT_MENU_SECTIONS = [
  {
    title: 'Fitness',
    items: [
      { label: 'Progress Photos',  icon: 'camera.fill'       as const, route: '/progress-photos'     as const },
      { label: 'Body Weight Log',  icon: 'scalemass.fill'    as const, route: '/body-weight-log'      as const },
      { label: 'Achievements',     icon: 'trophy.fill'       as const, route: '/achievements'         as const },
      { label: 'Fitness Profile',  icon: 'person.text.rectangle.fill' as const, route: '/client-onboarding' as const },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Edit Profile',        icon: 'pencil'            as const, route: '/edit-profile'    as const },
      { label: 'Notifications',       icon: 'bell.fill'         as const, route: '/notifications'   as const },
      { label: 'App Settings',        icon: 'gearshape.fill'    as const, route: '/app-settings'    as const },
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

const TRAINER_MENU_SECTIONS = [
  {
    title: 'Trainer',
    items: [
      { label: 'My Listing',       icon: 'storefront'        as const, route: '/trainer-listing'    as const },
      { label: 'Set Availability', icon: 'calendar.badge.plus' as const, route: '/set-availability' as const },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Edit Profile',        icon: 'pencil'            as const, route: '/edit-profile'    as const },
      { label: 'Notifications',       icon: 'bell.fill'         as const, route: '/notifications'   as const },
      { label: 'App Settings',        icon: 'gearshape.fill'    as const, route: '/app-settings'    as const },
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
  const [unreadCount,      setUnreadCount]      = useState(0);
  const [loading,          setLoading]          = useState(true);
  const [fullName,         setFullName]         = useState('');
  const [role,             setRole]             = useState<'client' | 'trainer'>('client');
  const [isDev,            setIsDev]            = useState(false);
  const [totalSessions,    setTotalSessions]    = useState(0);
  const [pendingInvites,   setPendingInvites]   = useState<PendingInvite[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingRequest[]>([]);
  const [activeTrainer,    setActiveTrainer]    = useState<ActiveTrainer | null>(null);
  const [acceptingId,      setAcceptingId]      = useState<string | null>(null);
  const [showFindTrainer,  setShowFindTrainer]  = useState(false);

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

      const [{ data: profile }, { count }, { count: unread }] = await Promise.all([
        supabase.from('profiles').select('full_name, role, is_dev').eq('id', user.id).single(),
        supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null),
      ]);
      setUnreadCount(unread ?? 0);

      const fresh: ProfileCache = {
        fullName:      profile?.full_name ?? '',
        totalSessions: count ?? 0,
      };
      applyData(fresh);
      if (profile?.role) setRole(profile.role as 'client' | 'trainer');
      if (profile?.is_dev) setIsDev(true);
      await setCached(CACHE_KEYS.PROFILE, fresh);

      // Load trainer-related data (clients only)
      if (profile?.role === 'client') {
        await Promise.all([
          loadPendingInvites(user.id),
          loadOutgoingRequests(user.id),
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
      .eq('status', 'pending')
      .eq('initiated_by', 'trainer');

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

  async function loadOutgoingRequests(userId: string) {
    const { data: links } = await supabase
      .from('trainer_clients')
      .select('id, trainer_id')
      .eq('client_id', userId)
      .eq('status', 'pending')
      .eq('initiated_by', 'client');

    if (!links || links.length === 0) { setOutgoingRequests([]); return; }

    const trainerIds = links.map((l) => l.trainer_id);
    const { data: trainers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', trainerIds);

    const trainerMap = Object.fromEntries((trainers ?? []).map((t) => [t.id, t.full_name]));
    setOutgoingRequests(links.map((l) => ({
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

  async function handleCancelRequest(linkId: string) {
    await supabase.from('trainer_clients').delete().eq('id', linkId);
    setOutgoingRequests((prev) => prev.filter((r) => r.linkId !== linkId));
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
            const { error } = await supabase
              .from('trainer_clients')
              .update({ status: 'removed' })
              .eq('id', activeTrainer.linkId);
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
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => supabase.auth.signOut() },
      ]
    );
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

        {/* My Trainer section (clients only) */}
        {role === 'client' && (
          <View style={inviteStyles.section}>
            <Text style={styles.sectionTitle}>My Trainer</Text>
            <View style={styles.menuCard}>

              {/* ── Active trainer ── */}
              {activeTrainer ? (
                <>
                  <View style={[inviteStyles.inviteRow, { borderBottomWidth: 1, borderBottomColor: C.outlineVariant }]}>
                    <View style={inviteStyles.avatar}>
                      <Text style={inviteStyles.avatarText}>{initials(activeTrainer.trainerName)}</Text>
                    </View>
                    <View style={inviteStyles.inviteInfo}>
                      <Text style={inviteStyles.trainerName}>{activeTrainer.trainerName}</Text>
                      <Text style={inviteStyles.inviteLabel}>Personal Trainer · Active</Text>
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
                    <TouchableOpacity style={inviteStyles.trainerAction} onPress={handleDisconnectTrainer}>
                      <IconSymbol name="xmark.circle.fill" size={16} color={C.error} />
                      <Text style={[inviteStyles.trainerActionText, { color: C.error }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {/* ── Incoming trainer invites ── */}
                  {pendingInvites.map((invite, idx) => (
                    <View
                      key={invite.linkId}
                      style={[
                        inviteStyles.inviteRow,
                        (idx < pendingInvites.length - 1 || outgoingRequests.length > 0) && styles.menuItemBorder,
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

                  {/* ── Outgoing client requests ── */}
                  {outgoingRequests.map((req, idx) => (
                    <View
                      key={req.linkId}
                      style={[
                        inviteStyles.inviteRow,
                        idx < outgoingRequests.length - 1 && styles.menuItemBorder,
                      ]}>
                      <View style={inviteStyles.avatar}>
                        <Text style={inviteStyles.avatarText}>{initials(req.trainerName)}</Text>
                      </View>
                      <View style={inviteStyles.inviteInfo}>
                        <Text style={inviteStyles.trainerName}>{req.trainerName}</Text>
                        <Text style={inviteStyles.inviteLabel}>Request sent · awaiting response</Text>
                      </View>
                      <TouchableOpacity
                        style={inviteStyles.declineBtn}
                        onPress={() => handleCancelRequest(req.linkId)}>
                        <Text style={inviteStyles.declineBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* ── No trainer yet ── */}
                  {pendingInvites.length === 0 && outgoingRequests.length === 0 && (
                    <>
                      <TouchableOpacity
                        style={[inviteStyles.inviteRow, { borderBottomWidth: 1, borderBottomColor: C.outlineVariant }]}
                        onPress={() => router.push('/trainer-marketplace' as any)}
                        activeOpacity={0.7}>
                        <View style={[inviteStyles.avatar, { backgroundColor: C.primary + '22' }]}>
                          <IconSymbol name="storefront" size={20} color={C.primary} />
                        </View>
                        <View style={inviteStyles.inviteInfo}>
                          <Text style={inviteStyles.trainerName}>Browse Marketplace</Text>
                          <Text style={inviteStyles.inviteLabel}>Find trainers in your city</Text>
                        </View>
                        <IconSymbol name="chevron.right" size={16} color={C.onSurfaceVariant} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={inviteStyles.inviteRow}
                        onPress={() => setShowFindTrainer(true)}
                        activeOpacity={0.7}>
                        <View style={[inviteStyles.avatar, { backgroundColor: C.primary + '22' }]}>
                          <IconSymbol name="person.badge.plus" size={20} color={C.primary} />
                        </View>
                        <View style={inviteStyles.inviteInfo}>
                          <Text style={inviteStyles.trainerName}>Invite by Email</Text>
                          <Text style={inviteStyles.inviteLabel}>Send a request to a specific trainer</Text>
                        </View>
                        <IconSymbol name="chevron.right" size={16} color={C.onSurfaceVariant} />
                      </TouchableOpacity>
                    </>
                  )}

                  {/* ── Add another / request ── */}
                  {(pendingInvites.length > 0 || outgoingRequests.length > 0) && (
                    <TouchableOpacity
                      style={[inviteStyles.inviteRow, { borderTopWidth: 1, borderTopColor: C.outlineVariant }]}
                      onPress={() => setShowFindTrainer(true)}
                      activeOpacity={0.7}>
                      <IconSymbol name="plus.circle.fill" size={18} color={C.primary} />
                      <Text style={[inviteStyles.inviteLabel, { color: C.primary, marginLeft: Spacing.xs }]}>
                        Request another trainer
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {/* Menu Sections */}
        {(role === 'trainer' ? TRAINER_MENU_SECTIONS : CLIENT_MENU_SECTIONS).map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => {
                const isNotifItem = item.label === 'Notifications';
                const badge = isNotifItem && unreadCount > 0 ? unreadCount : 0;
                return (
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
                    {badge > 0 ? (
                      <View style={{
                        backgroundColor: C.error, borderRadius: Radius.full,
                        minWidth: 20, height: 20, paddingHorizontal: 5,
                        justifyContent: 'center', alignItems: 'center', marginRight: Spacing.xs,
                      }}>
                        <Text style={{ ...Typography.labelMd, color: '#fff', fontWeight: '700' }}>
                          {badge > 99 ? '99+' : badge}
                        </Text>
                      </View>
                    ) : (
                      <IconSymbol
                        name="chevron.right"
                        size={16}
                        color={item.route ? C.onSurfaceVariant : C.outlineVariant}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

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

        {/* Dev Tools — only visible to is_dev users */}
        {isDev && (
          <View style={styles.section}>
            <View style={styles.menuCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/dev-tools' as any)}>
                <View style={[styles.menuIconBox, { backgroundColor: C.error + '22' }]}>
                  <IconSymbol name="bolt.fill" size={18} color={C.error} />
                </View>
                <Text style={[styles.menuLabel, { color: C.error }]}>Dev Tools</Text>
                <IconSymbol name="chevron.right" size={16} color={C.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Version */}
        <Text style={{ textAlign: 'center', color: C.onSurfaceVariant, fontSize: 12, marginBottom: Spacing.xl }}>
          FitConnect v1.0.0
        </Text>

      </ScrollView>

      {/* Find Trainer Modal */}
      <FindTrainerModal
        visible={showFindTrainer}
        onClose={() => setShowFindTrainer(false)}
        onRequested={() => {
          setShowFindTrainer(false);
          // Reload outgoing requests (userId fetched inline)
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) loadOutgoingRequests(user.id);
          });
        }}
      />
    </SafeAreaView>
  );
}

// ─── Find Trainer Modal ───────────────────────────────────────────────────────

function FindTrainerModal({
  visible,
  onClose,
  onRequested,
}: {
  visible:     boolean;
  onClose:     () => void;
  onRequested: () => void;
}) {
  const C = useColors();
  const ms = useMemo(() => StyleSheet.create({
    backdrop:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: {
      backgroundColor: C.surfaceContainer,
      borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
      padding: Spacing.xl, paddingBottom: Spacing.xxxl,
    },
    handle: {
      width: 40, height: 4, borderRadius: Radius.full,
      backgroundColor: C.outlineVariant, alignSelf: 'center', marginBottom: Spacing.lg,
    },
    title:       { ...Typography.titleLg, color: C.onSurface, marginBottom: Spacing.xs },
    subtitle:    { ...Typography.bodyMd, color: C.onSurfaceVariant, marginBottom: Spacing.lg },
    label:       { ...Typography.labelLg, color: C.onSurfaceVariant, marginBottom: Spacing.xs },
    input: {
      backgroundColor: C.surfaceContainerHighest, borderRadius: Radius.md,
      borderWidth: 1, borderColor: C.outlineVariant,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      ...Typography.titleMd, color: C.onSurface, marginBottom: Spacing.md,
    },
    error: {
      ...Typography.bodyMd, color: C.error, backgroundColor: C.error + '18',
      borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.md,
    },
    sendBtn: {
      height: 50, borderRadius: Radius.md, backgroundColor: C.primary,
      justifyContent: 'center', alignItems: 'center',
    },
    sendBtnDisabled: { opacity: 0.45 },
    sendBtnText:     { ...Typography.titleLg, color: C.background },
    cancelBtn:       { height: 44, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.sm },
    cancelBtnText:   { ...Typography.titleMd, color: C.onSurfaceVariant },
  }), [C]);

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function reset() { setEmail(''); setError(''); setLoading(false); }
  function handleClose() { reset(); onClose(); }

  async function handleRequest() {
    if (!email.trim()) return;
    setLoading(true); setError('');

    const { data, error: rpcErr } = await supabase.rpc('request_trainer_by_email', {
      trainer_email: email.trim().toLowerCase(),
    });

    setLoading(false);
    if (rpcErr || data?.error) {
      setError(data?.error ?? rpcErr?.message ?? 'Something went wrong.');
      return;
    }

    reset();
    onRequested();
    Alert.alert('Request Sent', `Your request has been sent to ${data.full_name ?? email}. They will be notified.`);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={ms.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
        <View style={ms.sheet}>
          <View style={ms.handle} />
          <Text style={ms.title}>Request a Trainer</Text>
          <Text style={ms.subtitle}>
            Enter the email address of your trainer's FitConnect account.
          </Text>
          {error ? <Text style={ms.error}>{error}</Text> : null}
          <Text style={ms.label}>Trainer Email</Text>
          <TextInput
            style={ms.input}
            value={email}
            onChangeText={setEmail}
            placeholder="trainer@example.com"
            placeholderTextColor={C.onSurfaceVariant}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={handleRequest}
            autoFocus
          />
          <TouchableOpacity
            style={[ms.sendBtn, (!email.trim() || loading) && ms.sendBtnDisabled]}
            onPress={handleRequest}
            disabled={!email.trim() || loading}>
            {loading
              ? <ActivityIndicator color={C.background} />
              : <Text style={ms.sendBtnText}>Send Request</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={ms.cancelBtn} onPress={handleClose}>
            <Text style={ms.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

