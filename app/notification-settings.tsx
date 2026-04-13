import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, Modal, ScrollView,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { registerPushToken } from '@/lib/notifications';

// ─── Types ────────────────────────────────────────────────────────────────────

type PermStatus = 'granted' | 'denied' | 'undetermined';

type Reminder = {
  id:       string;
  hour:     number;   // 0–23
  minute:   number;   // 0–55 in steps of 5
  days:     number[]; // 1=Sun 2=Mon 3=Tue 4=Wed 5=Thu 6=Fri 7=Sat
  notifIds: string[]; // one expo notification ID per selected day
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@fitconnect:reminders';

const DAY_LABELS: { short: string; long: string; weekday: number }[] = [
  { short: 'Sun', long: 'Sunday',    weekday: 1 },
  { short: 'Mon', long: 'Monday',    weekday: 2 },
  { short: 'Tue', long: 'Tuesday',   weekday: 3 },
  { short: 'Wed', long: 'Wednesday', weekday: 4 },
  { short: 'Thu', long: 'Thursday',  weekday: 5 },
  { short: 'Fri', long: 'Friday',    weekday: 6 },
  { short: 'Sat', long: 'Saturday',  weekday: 7 },
];

const NOTIFICATION_TYPES = [
  { icon: 'bubble.left.fill' as const, label: 'Trainer Messages',  desc: 'New messages from your trainer' },
  { icon: 'calendar'         as const, label: 'Booking Updates',   desc: 'Session confirmations and changes' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h      = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h}:${minute.toString().padStart(2, '0')} ${period}`;
}

function formatDays(days: number[]): string {
  if (days.length === 7) return 'Every day';
  if (days.length === 0) return 'No days selected';
  const weekdays = [2, 3, 4, 5, 6];
  const weekend  = [1, 7];
  if (weekdays.every((d) => days.includes(d)) && days.length === 5 && !days.includes(1) && !days.includes(7)) {
    return 'Weekdays';
  }
  if (weekend.every((d) => days.includes(d)) && days.length === 2) {
    return 'Weekends';
  }
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS.find((l) => l.weekday === d)!.short)
    .join(', ');
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

async function scheduleReminder(hour: number, minute: number, days: number[]): Promise<string[]> {
  const ids: string[] = [];
  for (const weekday of days) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to work out! 💪',
        body:  'Your scheduled workout reminder',
        sound: true,
      },
      trigger: {
        type:    Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour,
        minute,
      },
    });
    ids.push(id);
  }
  return ids;
}

async function cancelReminder(notifIds: string[]): Promise<void> {
  await Promise.all(notifIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

// ─── Add Reminder Modal ───────────────────────────────────────────────────────

function AddReminderModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave:  (hour: number, minute: number, days: number[]) => void;
}) {
  const [hour,   setHour]   = useState(7);
  const [minute, setMinute] = useState(0);
  const [ampm,   setAmpm]   = useState<'AM' | 'PM'>('AM');
  const [days,   setDays]   = useState<number[]>([2, 3, 4, 5, 6]); // Weekdays default

  function toggleDay(weekday: number) {
    setDays((prev) =>
      prev.includes(weekday) ? prev.filter((d) => d !== weekday) : [...prev, weekday],
    );
  }

  function incrementHour() {
    setHour((h) => (h === 12 ? 1 : h + 1));
  }

  function decrementHour() {
    setHour((h) => (h === 1 ? 12 : h - 1));
  }

  function incrementMinute() {
    setMinute((m) => (m >= 55 ? 0 : m + 5));
  }

  function decrementMinute() {
    setMinute((m) => (m <= 0 ? 55 : m - 5));
  }

  function handle24Hour(): number {
    if (ampm === 'AM') return hour === 12 ? 0 : hour;
    return hour === 12 ? 12 : hour + 12;
  }

  function handleSave() {
    if (days.length === 0) {
      Alert.alert('No Days Selected', 'Pick at least one day for the reminder.');
      return;
    }
    onSave(handle24Hour(), minute, days);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor:     Colors.surfaceContainerHigh,
          borderTopLeftRadius: Radius.xl,
          borderTopRightRadius: Radius.xl,
          padding:             Spacing.xl,
          gap:                 Spacing.lg,
        }}>
          <Text style={{ ...Typography.headlineMd, color: Colors.onSurface }}>Add Reminder</Text>

          {/* Time picker */}
          <View style={{ alignItems: 'center', gap: Spacing.md }}>
            <Text style={{ ...Typography.labelLg, color: Colors.onSurfaceVariant, textTransform: 'uppercase' }}>Time</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }}>
              {/* Hour */}
              <View style={{ alignItems: 'center', gap: Spacing.sm }}>
                <TouchableOpacity
                  style={arrowBtn}
                  onPress={incrementHour}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <IconSymbol name="chevron.up" size={18} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={{ ...Typography.displayMd, color: Colors.onSurface, width: 56, textAlign: 'center' }}>
                  {hour.toString().padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  style={arrowBtn}
                  onPress={decrementHour}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <IconSymbol name="chevron.down" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              <Text style={{ ...Typography.displayMd, color: Colors.onSurfaceVariant }}>:</Text>

              {/* Minute */}
              <View style={{ alignItems: 'center', gap: Spacing.sm }}>
                <TouchableOpacity
                  style={arrowBtn}
                  onPress={incrementMinute}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <IconSymbol name="chevron.up" size={18} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={{ ...Typography.displayMd, color: Colors.onSurface, width: 56, textAlign: 'center' }}>
                  {minute.toString().padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  style={arrowBtn}
                  onPress={decrementMinute}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <IconSymbol name="chevron.down" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              {/* AM/PM */}
              <View style={{ gap: Spacing.sm }}>
                {(['AM', 'PM'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={{
                      paddingHorizontal: Spacing.md,
                      paddingVertical:   Spacing.xs,
                      borderRadius:      Radius.md,
                      backgroundColor:   ampm === p ? Colors.primary : Colors.surfaceContainer,
                    }}
                    onPress={() => setAmpm(p)}>
                    <Text style={{
                      ...Typography.titleMd,
                      color: ampm === p ? Colors.background : Colors.onSurfaceVariant,
                    }}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Day picker */}
          <View style={{ gap: Spacing.sm }}>
            <Text style={{ ...Typography.labelLg, color: Colors.onSurfaceVariant, textTransform: 'uppercase' }}>Repeat</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' }}>
              {DAY_LABELS.map(({ short, weekday }) => {
                const selected = days.includes(weekday);
                return (
                  <TouchableOpacity
                    key={weekday}
                    style={{
                      paddingHorizontal: Spacing.md,
                      paddingVertical:   Spacing.xs,
                      borderRadius:      Radius.full,
                      backgroundColor:   selected ? Colors.primary : Colors.surfaceContainer,
                      borderWidth:       1,
                      borderColor:       selected ? Colors.primary : Colors.outlineVariant,
                    }}
                    onPress={() => toggleDay(weekday)}>
                    <Text style={{
                      ...Typography.titleMd,
                      color: selected ? Colors.background : Colors.onSurfaceVariant,
                    }}>
                      {short}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity
              style={{
                flex: 1, padding: Spacing.md, borderRadius: Radius.md,
                backgroundColor: Colors.surfaceContainer, alignItems: 'center',
              }}
              onPress={onClose}>
              <Text style={{ ...Typography.titleMd, color: Colors.onSurfaceVariant }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 2, padding: Spacing.md, borderRadius: Radius.md,
                backgroundColor: Colors.primary, alignItems: 'center',
              }}
              onPress={handleSave}>
              <Text style={{ ...Typography.titleMd, color: Colors.background, fontWeight: '700' }}>Save Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const arrowBtn = {
  width: 36, height: 36,
  borderRadius: Radius.md,
  backgroundColor: Colors.surfaceContainer,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [status,      setStatus]      = useState<PermStatus>('undetermined');
  const [requesting,  setRequesting]  = useState(false);
  const [checking,    setChecking]    = useState(true);
  const [reminders,   setReminders]   = useState<Reminder[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    checkStatus();
    loadReminders();
  }, []);

  async function checkStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    setStatus(status as PermStatus);
    setChecking(false);
  }

  async function loadReminders() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setReminders(JSON.parse(raw));
    } catch {}
  }

  async function saveReminders(updated: Reminder[]) {
    setReminders(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async function handleEnable() {
    setRequesting(true);
    await registerPushToken();
    await checkStatus();
    setRequesting(false);
  }

  async function handleAddReminder(hour: number, minute: number, days: number[]) {
    try {
      const notifIds = await scheduleReminder(hour, minute, days);
      const reminder: Reminder = { id: uid(), hour, minute, days, notifIds };
      await saveReminders([...reminders, reminder]);
    } catch {
      Alert.alert('Error', 'Failed to schedule reminder. Please try again.');
    }
  }

  async function handleDeleteReminder(reminder: Reminder) {
    Alert.alert('Delete Reminder', `Remove ${formatTime(reminder.hour, reminder.minute)} reminder?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelReminder(reminder.notifIds);
          await saveReminders(reminders.filter((r) => r.id !== reminder.id));
        },
      },
    ]);
  }

  const isGranted = status === 'granted';
  const isDenied  = status === 'denied';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
        gap: Spacing.md,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={{ ...Typography.headlineMd, color: Colors.onSurface }}>Notifications</Text>
      </View>

      {checking ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxxl }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}
          showsVerticalScrollIndicator={false}>

          {/* Permission status card */}
          <View style={{
            backgroundColor: Colors.surfaceContainer,
            borderRadius: Radius.lg,
            padding: Spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.md,
            borderWidth: 1,
            borderColor: (isGranted ? Colors.success : Colors.error) + '33',
          }}>
            <View style={{
              width: 44, height: 44,
              borderRadius: Radius.full,
              backgroundColor: (isGranted ? Colors.success : Colors.error) + '22',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <IconSymbol
                name={isGranted ? 'bell.fill' : 'bell.slash.fill'}
                size={22}
                color={isGranted ? Colors.success : Colors.error}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...Typography.titleLg, color: Colors.onSurface }}>Push Notifications</Text>
              <Text style={{ ...Typography.bodyMd, color: isGranted ? Colors.success : Colors.error, marginTop: 2 }}>
                {isGranted ? 'Enabled' : isDenied ? 'Blocked — open Settings to allow' : 'Not yet enabled'}
              </Text>
            </View>
          </View>

          {/* Enable button */}
          {!isGranted && (
            <TouchableOpacity
              style={{ backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' }}
              onPress={isDenied ? () => Linking.openSettings() : handleEnable}
              disabled={requesting}>
              {requesting
                ? <ActivityIndicator color={Colors.background} />
                : <Text style={{ ...Typography.titleMd, color: Colors.background, fontWeight: '700' }}>
                    {isDenied ? 'Open System Settings' : 'Enable Notifications'}
                  </Text>}
            </TouchableOpacity>
          )}

          {isGranted && (
            <>
              {/* Workout reminders section */}
              <View style={{ gap: Spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: Spacing.xs }}>
                  <Text style={{ ...Typography.labelLg, color: Colors.onSurfaceVariant, textTransform: 'uppercase', flex: 1 }}>
                    Workout Reminders
                  </Text>
                </View>

                {reminders.length > 0 && (
                  <View style={{ backgroundColor: Colors.surfaceContainer, borderRadius: Radius.lg, overflow: 'hidden' }}>
                    {reminders.map((r, i) => (
                      <View
                        key={r.id}
                        style={[
                          { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
                          i < reminders.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
                        ]}>
                        <View style={{
                          width: 36, height: 36,
                          borderRadius: Radius.md,
                          backgroundColor: Colors.primary + '22',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <IconSymbol name="alarm" size={16} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ ...Typography.titleMd, color: Colors.onSurface }}>
                            {formatTime(r.hour, r.minute)}
                          </Text>
                          <Text style={{ ...Typography.bodyMd, color: Colors.onSurfaceVariant }}>
                            {formatDays(r.days)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteReminder(r)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <IconSymbol name="trash" size={18} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={{
                    backgroundColor: Colors.surfaceContainer,
                    borderRadius: Radius.lg,
                    padding: Spacing.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: Spacing.sm,
                    borderWidth: 1,
                    borderColor: Colors.outlineVariant,
                    borderStyle: 'dashed',
                  }}
                  onPress={() => setShowAddModal(true)}>
                  <IconSymbol name="plus.circle.fill" size={18} color={Colors.primary} />
                  <Text style={{ ...Typography.titleMd, color: Colors.primary }}>Add Reminder</Text>
                </TouchableOpacity>
              </View>

              {/* Other notification types */}
              <View style={{ gap: Spacing.sm }}>
                <Text style={{ ...Typography.labelLg, color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginLeft: Spacing.xs }}>
                  Also Enabled
                </Text>
                <View style={{ backgroundColor: Colors.surfaceContainer, borderRadius: Radius.lg, overflow: 'hidden' }}>
                  {NOTIFICATION_TYPES.map((item, i) => (
                    <View
                      key={item.label}
                      style={[
                        { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
                        i < NOTIFICATION_TYPES.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant },
                      ]}>
                      <View style={{
                        width: 36, height: 36,
                        borderRadius: Radius.md,
                        backgroundColor: Colors.primary + '22',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <IconSymbol name={item.icon} size={16} color={Colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ ...Typography.titleMd, color: Colors.onSurface }}>{item.label}</Text>
                        <Text style={{ ...Typography.bodyMd, color: Colors.onSurfaceVariant }}>{item.desc}</Text>
                      </View>
                      <IconSymbol name="checkmark.circle.fill" size={20} color={Colors.success} />
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={{ backgroundColor: Colors.surfaceContainer, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' }}
                onPress={() => Linking.openSettings()}>
                <Text style={{ ...Typography.titleMd, color: Colors.onSurfaceVariant }}>Manage in System Settings</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      <AddReminderModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddReminder}
      />
    </SafeAreaView>
  );
}
