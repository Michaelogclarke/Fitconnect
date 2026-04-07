import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id:        string;
  senderId:  string;
  content:   string;
  createdAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDay(iso: string): string {
  const d   = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

// Insert a day separator whenever the date changes
type ListItem = Message | { type: 'separator'; date: string; id: string };

function buildList(messages: Message[]): ListItem[] {
  const items: ListItem[] = [];
  let lastDay = '';
  for (const msg of messages) {
    const day = new Date(msg.createdAt).toDateString();
    if (day !== lastDay) {
      items.push({ type: 'separator', date: msg.createdAt, id: `sep-${day}` });
      lastDay = day;
    }
    items.push(msg);
  }
  return items;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ConversationScreen() {
  const router = useRouter();
  const { threadId, otherName } = useLocalSearchParams<{ threadId: string; otherName: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [userId,   setUserId]   = useState<string | null>(null);

  const listRef = useRef<FlatList>(null);

  // Load user ID + messages, then subscribe to realtime
  useEffect(() => {
    if (!threadId) return;

    let channel: ReturnType<typeof supabase.channel>;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Load existing messages
      const { data } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('trainer_client_id', threadId)
        .order('created_at', { ascending: true });

      const loaded: Message[] = (data ?? []).map((m: any) => ({
        id:        m.id,
        senderId:  m.sender_id,
        content:   m.content,
        createdAt: m.created_at,
      }));
      setMessages(loaded);
      setLoading(false);

      // Mark unread messages as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('trainer_client_id', threadId)
        .neq('sender_id', user.id)
        .is('read_at', null);

      // Subscribe to new messages
      channel = supabase
        .channel(`conversation:${threadId}`)
        .on(
          'postgres_changes',
          {
            event:  'INSERT',
            schema: 'public',
            table:  'messages',
            filter: `trainer_client_id=eq.${threadId}`,
          },
          (payload) => {
            const m = payload.new as any;
            setMessages((prev) => {
              if (prev.find((p) => p.id === m.id)) return prev;
              return [...prev, {
                id:        m.id,
                senderId:  m.sender_id,
                content:   m.content,
                createdAt: m.created_at,
              }];
            });
            // Mark incoming messages read immediately
            if (m.sender_id !== user.id) {
              supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', m.id);
            }
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [threadId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function handleSend() {
    if (!text.trim() || !userId || !threadId || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);

    await supabase.from('messages').insert({
      trainer_client_id: threadId,
      sender_id:         userId,
      content,
    });

    setSending(false);
  }

  const listItems = buildList(messages);

  function renderItem({ item }: { item: ListItem }) {
    if ('type' in item && item.type === 'separator') {
      return (
        <View style={convStyles.daySep}>
          <Text style={convStyles.daySepText}>{formatDay(item.date)}</Text>
        </View>
      );
    }

    const msg    = item as Message;
    const isMe   = msg.senderId === userId;

    return (
      <View style={[convStyles.bubble, isMe ? convStyles.bubbleMe : convStyles.bubbleThem]}>
        <Text style={[convStyles.bubbleText, isMe ? convStyles.bubbleTextMe : convStyles.bubbleTextThem]}>
          {msg.content}
        </Text>
        <Text style={[convStyles.bubbleTime, isMe ? convStyles.bubbleTimeMe : convStyles.bubbleTimeThem]}>
          {formatTime(msg.createdAt)}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={convStyles.container} edges={['top']}>
      {/* Header */}
      <View style={convStyles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={convStyles.headerName} numberOfLines={1}>{otherName ?? 'Chat'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            ref={listRef}
            data={listItems}
            keyExtractor={(item) => ('type' in item ? item.id : item.id)}
            renderItem={renderItem}
            contentContainerStyle={convStyles.messageList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={convStyles.emptyWrap}>
                <Text style={convStyles.emptyText}>
                  No messages yet. Say hello!
                </Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={convStyles.inputBar}>
          <TextInput
            style={convStyles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor={Colors.onSurfaceVariant}
            multiline
            maxLength={2000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[convStyles.sendBtn, (!text.trim() || sending) && convStyles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}>
            {sending
              ? <ActivityIndicator size="small" color={Colors.background} />
              : <IconSymbol name="arrow.up" size={18} color={Colors.background} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const convStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  headerName: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  messageList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  daySep: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  daySepText: {
    ...Typography.labelLg,
    color: Colors.onSurfaceVariant,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginVertical: 2,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceContainerHighest,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    ...Typography.bodyMd,
    lineHeight: 20,
  },
  bubbleTextMe:   { color: Colors.background },
  bubbleTextThem: { color: Colors.onSurface },
  bubbleTime: {
    ...Typography.labelMd,
    marginTop: 3,
  },
  bubbleTimeMe:   { color: Colors.background + 'aa', textAlign: 'right' },
  bubbleTimeThem: { color: Colors.onSurfaceVariant },
  emptyWrap: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
