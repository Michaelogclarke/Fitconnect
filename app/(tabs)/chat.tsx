import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from '@/styles/tabs/chat.styles';

const THREADS = [
  { id: '1', name: 'Sarah Johnson', preview: 'How did the leg day go?', time: '2m', online: true, unread: 3 },
  { id: '2', name: 'Marcus Reid', preview: 'Updated my nutrition plan', time: '14m', online: true, unread: 0 },
  { id: '3', name: 'Emma Clarke', preview: 'See you at 6am tomorrow!', time: '1h', online: false, unread: 1 },
  { id: '4', name: 'Tom Walsh', preview: 'Can we reschedule Friday?', time: '3h', online: false, unread: 0 },
  { id: '5', name: 'Priya Patel', preview: 'PB on deadlifts today!!', time: '5h', online: false, unread: 0 },
];

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('');
}

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.lockRow}>
          <IconSymbol name="lock.fill" size={12} color={Colors.success} />
          <Text style={styles.lockText}>End-to-end encrypted</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {THREADS.map((t, idx) => (
          <React.Fragment key={t.id}>
            <TouchableOpacity style={styles.threadCard}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(t.name)}</Text>
                </View>
                {t.online && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.threadInfo}>
                <View style={styles.threadRow}>
                  <Text style={styles.threadName}>{t.name}</Text>
                  <Text style={styles.threadTime}>{t.time}</Text>
                </View>
                <View style={styles.threadRow}>
                  <Text style={styles.threadPreview} numberOfLines={1}>{t.preview}</Text>
                  {t.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{t.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
            {idx < THREADS.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
