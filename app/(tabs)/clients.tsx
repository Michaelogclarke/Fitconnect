import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { useStyles } from '@/styles/tabs/clients.styles';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/format';

// ─── Types ────────────────────────────────────────────────────────────────────

type Client = {
  linkId:       string;
  clientId:     string;
  fullName:     string;
  acceptedAt:   string | null;
  lastSession:  string | null; // ISO date string
  totalSessions: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(isoDate: string | null): string {
  if (!isoDate) return 'Never';
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff}d ago`;
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({
  visible,
  onClose,
  onInvited,
}: {
  visible:   boolean;
  onClose:   () => void;
  onInvited: () => void;
}) {
  const C = useColors();
  const inviteStyles = useMemo(() => StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
      backgroundColor: C.surfaceContainer,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.xl,
      paddingBottom: Spacing.xxxl,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: Radius.full,
      backgroundColor: C.outlineVariant,
      alignSelf: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      ...Typography.headlineMd,
      color: C.onSurface,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      ...Typography.bodyMd,
      color: C.onSurfaceVariant,
      marginBottom: Spacing.lg,
    },
    error: {
      ...Typography.bodyMd,
      color: C.error,
      backgroundColor: C.error + '18',
      borderRadius: Radius.md,
      padding: Spacing.sm,
      marginBottom: Spacing.md,
    },
    fieldGroup: {
      marginBottom: Spacing.md,
    },
    label: {
      ...Typography.labelLg,
      color: C.onSurfaceVariant,
      marginBottom: Spacing.xs,
    },
    input: {
      backgroundColor: C.surfaceContainerHighest,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: C.outlineVariant,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...Typography.titleMd,
      color: C.onSurface,
    },
    sendBtn: {
      height: 50,
      borderRadius: Radius.md,
      backgroundColor: C.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    sendBtnDisabled: { opacity: 0.45 },
    sendBtnText: { ...Typography.titleLg, color: C.background },
    cancelBtn: {
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    cancelBtnText: {
      ...Typography.titleMd,
      color: C.onSurfaceVariant,
    },
  }), [C]);

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function reset() {
    setEmail('');
    setError('');
    setLoading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleInvite() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    const { data, error: rpcErr } = await supabase.rpc('invite_client_by_email', {
      client_email: email.trim().toLowerCase(),
    });

    setLoading(false);

    if (rpcErr || data?.error) {
      setError(data?.error ?? rpcErr?.message ?? 'Something went wrong.');
      return;
    }

    reset();
    onClose();
    onInvited();
    Alert.alert('Invite Sent', `An invite has been sent to ${data.full_name ?? email}.`);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={inviteStyles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />

        <View style={inviteStyles.sheet}>
          <View style={inviteStyles.handle} />
          <Text style={inviteStyles.title}>Invite a Client</Text>
          <Text style={inviteStyles.subtitle}>
            Enter the email they used to sign up for FitConnect.
          </Text>

          {error ? <Text style={inviteStyles.error}>{error}</Text> : null}

          <View style={inviteStyles.fieldGroup}>
            <Text style={inviteStyles.label}>Client Email</Text>
            <TextInput
              style={inviteStyles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="client@example.com"
              placeholderTextColor={C.onSurfaceVariant}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="send"
              onSubmitEditing={handleInvite}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[inviteStyles.sendBtn, (!email.trim() || loading) && inviteStyles.sendBtnDisabled]}
            onPress={handleInvite}
            disabled={!email.trim() || loading}>
            {loading
              ? <ActivityIndicator color={C.background} />
              : <Text style={inviteStyles.sendBtnText}>Send Invite</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={inviteStyles.cancelBtn} onPress={handleClose}>
            <Text style={inviteStyles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ClientsScreen() {
  const C = useColors();
  const styles = useStyles();
  const router = useRouter();

  const emptyStyles = useMemo(() => StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingTop: Spacing.xxxl,
      paddingHorizontal: Spacing.xl,
    },
    title: {
      ...Typography.headlineMd,
      color: C.onSurface,
      marginTop: Spacing.lg,
    },
    subtitle: {
      ...Typography.bodyMd,
      color: C.onSurfaceVariant,
      textAlign: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: C.primary,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    btnText: {
      ...Typography.titleMd,
      color: C.background,
    },
  }), [C]);

  const [loading,       setLoading]       = useState(true);
  const [clients,       setClients]       = useState<Client[]>([]);
  const [weekSessions,  setWeekSessions]  = useState(0);
  const [showInvite,    setShowInvite]    = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  async function loadClients() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // 1. Fetch active client links
    const { data: links } = await supabase
      .from('trainer_clients')
      .select('id, client_id, accepted_at')
      .eq('trainer_id', user.id)
      .eq('status', 'active');

    if (!links || links.length === 0) {
      setClients([]);
      setWeekSessions(0);
      setLoading(false);
      return;
    }

    const clientIds = links.map((l) => l.client_id);

    // 2. Fetch profiles for all clients
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', clientIds);

    // 3. Fetch last session + total sessions per client
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('user_id, started_at')
      .in('user_id', clientIds)
      .not('finished_at', 'is', null)
      .order('started_at', { ascending: false });

    // 4. Sessions this week for the stat card
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const { count: wk } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .in('user_id', clientIds)
      .gte('started_at', weekStart.toISOString())
      .not('finished_at', 'is', null);

    setWeekSessions(wk ?? 0);

    // Build client objects
    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    const sessionsByClient: Record<string, string[]> = {};
    (sessions ?? []).forEach((s) => {
      if (!sessionsByClient[s.user_id]) sessionsByClient[s.user_id] = [];
      sessionsByClient[s.user_id].push(s.started_at);
    });

    const built: Client[] = links.map((link) => ({
      linkId:        link.id,
      clientId:      link.client_id,
      fullName:      profileMap[link.client_id]?.full_name ?? 'Unknown',
      acceptedAt:    link.accepted_at,
      lastSession:   sessionsByClient[link.client_id]?.[0] ?? null,
      totalSessions: sessionsByClient[link.client_id]?.length ?? 0,
    }));

    setClients(built);
    setLoading(false);
  }

  const activeCount = clients.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowInvite(true)}>
          <IconSymbol name="plus.circle.fill" size={20} color={C.background} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activeCount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{weekSessions}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {activeCount === 0
              ? '—'
              : `${Math.round((clients.filter((c) => c.lastSession && daysSince(c.lastSession) !== 'Never').length / activeCount) * 100)}%`}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Client List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginVertical: 40 }} />
        ) : clients.length === 0 ? (
          <View style={emptyStyles.container}>
            <IconSymbol name="person.2.fill" size={40} color={C.outlineVariant} />
            <Text style={emptyStyles.title}>No clients yet</Text>
            <Text style={emptyStyles.subtitle}>
              Tap the + button to invite your first client by email.
            </Text>
            <TouchableOpacity style={emptyStyles.btn} onPress={() => setShowInvite(true)}>
              <IconSymbol name="plus.circle.fill" size={16} color={C.background} />
              <Text style={emptyStyles.btnText}>Invite a Client</Text>
            </TouchableOpacity>
          </View>
        ) : (
          clients.map((c) => (
            <TouchableOpacity
              key={c.linkId}
              style={styles.clientCard}
              onPress={() => router.push({
                pathname: '/client-detail' as any,
                params: { clientId: c.clientId, clientName: c.fullName },
              })}
              activeOpacity={0.8}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(c.fullName)}</Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{c.fullName}</Text>
                <Text style={styles.clientMeta}>
                  {c.totalSessions} session{c.totalSessions !== 1 ? 's' : ''} · Last: {daysSince(c.lastSession)}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <InviteModal
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        onInvited={loadClients}
      />
    </SafeAreaView>
  );
}
