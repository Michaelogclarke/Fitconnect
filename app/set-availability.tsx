import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_CONFIG = [
  { label: 'Monday',    dow: 1 },
  { label: 'Tuesday',   dow: 2 },
  { label: 'Wednesday', dow: 3 },
  { label: 'Thursday',  dow: 4 },
  { label: 'Friday',    dow: 5 },
  { label: 'Saturday',  dow: 6 },
  { label: 'Sunday',    dow: 0 },
];

type HourOption = { label: string; value: number };

function buildHours(): HourOption[] {
  const out: HourOption[] = [];
  for (let h = 6; h <= 22; h++) {
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12  = h === 0 ? 12 : h <= 12 ? h : h - 12;
    out.push({ label: `${h12}:00 ${ampm}`, value: h });
  }
  return out;
}

const HOURS = buildHours();

type DayState = { enabled: boolean; startHour: number; endHour: number };

function defaultDays(): Record<number, DayState> {
  return Object.fromEntries(
    DAYS_CONFIG.map(({ dow }) => [dow, { enabled: false, startHour: 9, endHour: 17 }])
  );
}

function hourToTimeStr(h: number): string {
  return `${String(h).padStart(2, '0')}:00:00`;
}

function timeStrToHour(t: string): number {
  return parseInt(t.split(':')[0], 10);
}

function hourLabel(h: number): string {
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12  = h === 0 ? 12 : h <= 12 ? h : h - 12;
  return `${h12}:00 ${ampm}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SetAvailabilityScreen() {
  const router = useRouter();

  const [days,    setDays]    = useState<Record<number, DayState>>(defaultDays());
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [picker,  setPicker]  = useState<{ dow: number; which: 'start' | 'end' } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('pt_availability')
        .select('day_of_week, start_time, end_time')
        .eq('trainer_id', user.id);

      if (data?.length) {
        const next = defaultDays();
        for (const row of data) {
          next[row.day_of_week] = {
            enabled:   true,
            startHour: timeStrToHour(row.start_time),
            endHour:   timeStrToHour(row.end_time),
          };
        }
        setDays(next);
      }
      setLoading(false);
    })();
  }, []);

  function toggle(dow: number) {
    setDays((prev) => ({ ...prev, [dow]: { ...prev[dow], enabled: !prev[dow].enabled } }));
  }

  function applyTime(dow: number, which: 'start' | 'end', hour: number) {
    setDays((prev) => {
      const d = { ...prev[dow] };
      if (which === 'start') {
        d.startHour = hour;
        if (d.endHour <= hour) d.endHour = hour + 1;
      } else {
        d.endHour = hour;
      }
      return { ...prev, [dow]: d };
    });
    setPicker(null);
  }

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from('pt_availability').delete().eq('trainer_id', user.id);

    const rows = DAYS_CONFIG
      .filter(({ dow }) => days[dow].enabled)
      .map(({ dow }) => ({
        trainer_id:  user.id,
        day_of_week: dow,
        start_time:  hourToTimeStr(days[dow].startHour),
        end_time:    hourToTimeStr(days[dow].endHour),
      }));

    if (rows.length > 0) {
      await supabase.from('pt_availability').insert(rows);
    }

    setSaving(false);
    router.back();
  }

  const pickerDay = picker ? days[picker.dow] : null;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={s.title}>Set Availability</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.subtitle}>
            Set your weekly hours. Clients can book 1-hour slots within these windows.
          </Text>

          {DAYS_CONFIG.map(({ label, dow }) => {
            const d = days[dow];
            return (
              <View key={dow} style={s.dayRow}>
                <Switch
                  value={d.enabled}
                  onValueChange={() => toggle(dow)}
                  trackColor={{ false: Colors.outlineVariant, true: Colors.primary + '55' }}
                  thumbColor={d.enabled ? Colors.primary : Colors.onSurfaceVariant}
                />
                <Text style={[s.dayLabel, !d.enabled && s.dayLabelOff]}>{label}</Text>
                {d.enabled && (
                  <View style={s.timePair}>
                    <TouchableOpacity
                      style={s.timeChip}
                      onPress={() => setPicker({ dow, which: 'start' })}>
                      <Text style={s.timeChipText}>{hourLabel(d.startHour)}</Text>
                    </TouchableOpacity>
                    <Text style={s.timeDash}>–</Text>
                    <TouchableOpacity
                      style={s.timeChip}
                      onPress={() => setPicker({ dow, which: 'end' })}>
                      <Text style={s.timeChipText}>{hourLabel(d.endHour)}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.5 }]}
            onPress={save}
            disabled={saving}>
            {saving
              ? <ActivityIndicator color={Colors.background} size="small" />
              : <Text style={s.saveBtnText}>Save Availability</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Time picker modal */}
      <Modal visible={!!picker} transparent animationType="slide">
        <Pressable style={s.overlay} onPress={() => setPicker(null)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <Text style={s.sheetTitle}>
              {picker?.which === 'start' ? 'Start Time' : 'End Time'}
            </Text>
            <FlatList
              data={HOURS}
              keyExtractor={(item) => String(item.value)}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => {
                if (!picker || !pickerDay) return null;
                const isDisabled = picker.which === 'end' && item.value <= pickerDay.startHour;
                const isSelected = picker.which === 'start'
                  ? item.value === pickerDay.startHour
                  : item.value === pickerDay.endHour;
                return (
                  <TouchableOpacity
                    style={[
                      s.pickOption,
                      isSelected && s.pickOptionSel,
                      isDisabled && s.pickOptionDim,
                    ]}
                    onPress={() => !isDisabled && applyTime(picker.dow, picker.which, item.value)}
                    disabled={isDisabled}>
                    <Text style={[s.pickOptionText, isSelected && s.pickOptionTextSel]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  title:    { ...Typography.titleLg, color: Colors.onSurface },
  scroll:   { padding: Spacing.lg, gap: Spacing.sm },
  subtitle: { ...Typography.bodyMd, color: Colors.onSurfaceVariant, marginBottom: Spacing.md },
  dayRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  dayLabel:    { ...Typography.bodyMd, color: Colors.onSurface, flex: 1 },
  dayLabelOff: { color: Colors.onSurfaceVariant },
  timePair:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  timeChip: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  timeChipText: { ...Typography.labelMd, color: Colors.primary },
  timeDash:     { ...Typography.labelMd, color: Colors.onSurfaceVariant },
  saveBtn: {
    marginTop: Spacing.xl, backgroundColor: Colors.primary,
    borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center',
  },
  saveBtnText: { ...Typography.titleMd, color: Colors.background },
  overlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surfaceContainer,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.lg, paddingBottom: 40,
  },
  sheetTitle:       { ...Typography.titleLg, color: Colors.onSurface, marginBottom: Spacing.md },
  pickOption:       { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.md },
  pickOptionSel:    { backgroundColor: Colors.primary + '22' },
  pickOptionDim:    { opacity: 0.3 },
  pickOptionText:   { ...Typography.bodyMd, color: Colors.onSurface },
  pickOptionTextSel:{ color: Colors.primary, fontWeight: '600' },
});
