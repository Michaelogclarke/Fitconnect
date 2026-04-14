import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/contexts/ThemeContext';
import { useStyles } from '@/styles/tabs/chat.styles';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/format';

// ─── Types ────────────────────────────────────────────────────────────────────

type Thread = {
  threadId:      string;
  otherUserId:   string;
  otherName:     string;
  lastMessage:   string | null;
  lastMessageAt: string | null;
  unreadCount:   number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d    = new Date(iso);
  const now  = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const C = useColors();
  const styles = useStyles();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadThreads();
    }, [])
  );

  async function loadThreads() {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_thread_summaries');

    if (!error && data) {
      setThreads(data.map((row: any) => ({
        threadId:      row.trainer_client_id,
        otherUserId:   row.other_user_id,
        otherName:     row.other_name ?? 'Unknown',
        lastMessage:   row.last_message ?? null,
        lastMessageAt: row.last_message_at ?? null,
        unreadCount:   Number(row.unread_count ?? 0),
      })));
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.lockRow}>
          <IconSymbol name="lock.fill" size={12} color={C.success} />
          <Text style={styles.lockText}>End-to-end encrypted</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : threads.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <IconSymbol name="bubble.left.and.bubble.right.fill" size={40} color={C.outlineVariant} />
          <Text style={{ ...styles.title, fontSize: 18, marginTop: 16 }}>No conversations yet</Text>
          <Text style={{ color: C.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
            Messages with your trainer or clients will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {threads.map((t, idx) => (
            <React.Fragment key={t.threadId}>
              <TouchableOpacity
                style={styles.threadCard}
                onPress={() => router.push({
                  pathname: '/conversation' as any,
                  params: { threadId: t.threadId, otherName: t.otherName },
                })}
                activeOpacity={0.8}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials(t.otherName)}</Text>
                  </View>
                </View>
                <View style={styles.threadInfo}>
                  <View style={styles.threadRow}>
                    <Text style={styles.threadName}>{t.otherName}</Text>
                    <Text style={styles.threadTime}>{formatTime(t.lastMessageAt)}</Text>
                  </View>
                  <View style={styles.threadRow}>
                    <Text style={styles.threadPreview} numberOfLines={1}>
                      {t.lastMessage ?? 'No messages yet'}
                    </Text>
                    {t.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{t.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
              {idx < threads.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
