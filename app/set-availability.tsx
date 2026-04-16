import React, { useEffect, useMemo, useState } from 'react';
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
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
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

type Break    = { startHour: number; endHour: number };
type DayState = { enabled: boolean; startHour: number; endHour: number; breaks: Break[] };

type PickerState =
  | { dow: number; which: 'start' | 'end' }
  | { dow: number; which: 'break-start' | 'break-end'; breakIndex: number };

function defaultDays(): Record<number, DayState> {
  return Object.fromEntries(
    DAYS_CONFIG.map(({ dow }) => [dow, { enabled: false, startHour: 9, endHour: 17, breaks: [] }])
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

/** Convert a day's working hours + breaks into insertable time slot rows. */
function dayToSlots(d: DayState): Array<{ startHour: number; endHour: number }> {
  const sorted = [...d.breaks].sort((a, b) => a.startHour - b.startHour);
  const slots: Array<{ startHour: number; endHour: number }> = [];
  let cursor = d.startHour;
  for (const brk of sorted) {
    if (brk.startHour > cursor) slots.push({ startHour: cursor, endHour: brk.startHour });
    cursor = brk.endHour;
  }
  if (cursor < d.endHour) slots.push({ startHour: cursor, endHour: d.endHour });
  return slots.length > 0 ? slots : [{ startHour: d.startHour, endHour: d.endHour }];
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SetAvailabilityScreen() {
  const C = useColors();
  const router = useRouter();

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
      borderBottomWidth: 1, borderBottomColor: C.outlineVariant,
    },
    title:    { ...Typography.titleLg, color: C.onSurface },
    scroll:   { padding: Spacing.lg, gap: Spacing.sm },
    subtitle: { ...Typography.bodyMd, color: C.onSurfaceVariant, marginBottom: Spacing.md },

    dayCard: {
      backgroundColor: C.surfaceContainer,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      gap: Spacing.xs,
    },
    dayTop: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    },
    dayLabel:    { ...Typography.bodyMd, color: C.onSurface, flex: 1 },
    dayLabelOff: { color: C.onSurfaceVariant },
    timePair:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    timeChip: {
      backgroundColor: C.surfaceContainerHighest,
      borderRadius: Radius.md, paddingHorizontal: Spacing.sm, paddingVertical: 4,
    },
    timeChipText: { ...Typography.labelMd, color: C.primary },
    timeDash:     { ...Typography.labelMd, color: C.onSurfaceVariant },

    breakRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: Spacing.xs,
      paddingLeft: 52, // align under day label
    },
    breakLabel: { ...Typography.labelMd, color: C.onSurfaceVariant, flex: 1 },

    addBreakBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingLeft: 52,
      paddingVertical: Spacing.xs,
    },
    addBreakText: { ...Typography.labelMd, color: C.primary },

    saveBtn: {
      marginTop: Spacing.xl, backgroundColor: C.primary,
      borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center',
    },
    saveBtnText: { ...Typography.titleMd, color: C.background },
    overlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: C.surfaceContainer,
      borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
      padding: Spacing.lg, paddingBottom: 40,
    },
    sheetTitle:        { ...Typography.titleLg, color: C.onSurface, marginBottom: Spacing.md },
    pickOption:        { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: Radius.md },
    pickOptionSel:     { backgroundColor: C.primary + '22' },
    pickOptionDim:     { opacity: 0.3 },
    pickOptionText:    { ...Typography.bodyMd, color: C.onSurface },
    pickOptionTextSel: { color: C.primary, fontWeight: '600' },
  }), [C]);

  const [days,    setDays]    = useState<Record<number, DayState>>(defaultDays());
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [picker,  setPicker]  = useState<PickerState | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('pt_availability')
        .select('day_of_week, start_time, end_time')
        .eq('trainer_id', user.id)
        .order('start_time', { ascending: true });

      if (data?.length) {
        // Group slots by day, then infer breaks from gaps
        const grouped: Record<number, Array<{ start: number; end: number }>> = {};
        for (const row of data) {
          if (!grouped[row.day_of_week]) grouped[row.day_of_week] = [];
          grouped[row.day_of_week].push({
            start: timeStrToHour(row.start_time),
            end:   timeStrToHour(row.end_time),
          });
        }

        const next = defaultDays();
        for (const [dowStr, slots] of Object.entries(grouped)) {
          const dow    = Number(dowStr);
          const sorted = slots.sort((a, b) => a.start - b.start);
          const breaks: Break[] = [];
          for (let i = 0; i < sorted.length - 1; i++) {
            breaks.push({ startHour: sorted[i].end, endHour: sorted[i + 1].start });
          }
          next[dow] = {
            enabled:   true,
            startHour: sorted[0].start,
            endHour:   sorted[sorted.length - 1].end,
            breaks,
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

  function addBreak(dow: number) {
    setDays((prev) => {
      const d   = prev[dow];
      const mid = Math.floor((d.startHour + d.endHour) / 2);
      return { ...prev, [dow]: { ...d, breaks: [...d.breaks, { startHour: mid, endHour: Math.min(mid + 1, d.endHour) }] } };
    });
  }

  function removeBreak(dow: number, index: number) {
    setDays((prev) => {
      const d = prev[dow];
      return { ...prev, [dow]: { ...d, breaks: d.breaks.filter((_, i) => i !== index) } };
    });
  }

  function applyTime(hour: number) {
    if (!picker) return;
    setDays((prev) => {
      const d = { ...prev[picker.dow], breaks: [...prev[picker.dow].breaks] };
      if (picker.which === 'start') {
        d.startHour = hour;
        if (d.endHour <= hour) d.endHour = hour + 1;
      } else if (picker.which === 'end') {
        d.endHour = hour;
      } else if (picker.which === 'break-start') {
        const brk = { ...d.breaks[picker.breakIndex] };
        brk.startHour = hour;
        if (brk.endHour <= hour) brk.endHour = Math.min(hour + 1, d.endHour);
        d.breaks[picker.breakIndex] = brk;
      } else if (picker.which === 'break-end') {
        const brk = { ...d.breaks[picker.breakIndex] };
        brk.endHour = hour;
        d.breaks[picker.breakIndex] = brk;
      }
      return { ...prev, [picker.dow]: d };
    });
    setPicker(null);
  }

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from('pt_availability').delete().eq('trainer_id', user.id);

    const rows: Array<{ trainer_id: string; day_of_week: number; start_time: string; end_time: string }> = [];
    for (const { dow } of DAYS_CONFIG) {
      if (!days[dow].enabled) continue;
      for (const slot of dayToSlots(days[dow])) {
        rows.push({
          trainer_id:  user.id,
          day_of_week: dow,
          start_time:  hourToTimeStr(slot.startHour),
          end_time:    hourToTimeStr(slot.endHour),
        });
      }
    }

    if (rows.length > 0) await supabase.from('pt_availability').insert(rows);

    setSaving(false);
    router.back();
  }

  // Derive what hours are valid/selected for the current picker
  const pickerDay = picker ? days[picker.dow] : null;

  function isDisabled(value: number): boolean {
    if (!picker || !pickerDay) return false;
    if (picker.which === 'end')         return value <= pickerDay.startHour;
    if (picker.which === 'start')       return false;
    const brk = pickerDay.breaks[(picker as any).breakIndex];
    if (picker.which === 'break-start') return value <= pickerDay.startHour || value >= pickerDay.endHour;
    if (picker.which === 'break-end')   return value <= brk.startHour || value > pickerDay.endHour;
    return false;
  }

  function isSelected(value: number): boolean {
    if (!picker || !pickerDay) return false;
    if (picker.which === 'start') return value === pickerDay.startHour;
    if (picker.which === 'end')   return value === pickerDay.endHour;
    const brk = pickerDay.breaks[(picker as any).breakIndex];
    if (picker.which === 'break-start') return value === brk.startHour;
    if (picker.which === 'break-end')   return value === brk.endHour;
    return false;
  }

  function pickerTitle(): string {
    if (!picker) return '';
    if (picker.which === 'start')       return 'Start Time';
    if (picker.which === 'end')         return 'End Time';
    if (picker.which === 'break-start') return 'Break Start';
    return 'Break End';
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={24} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={s.title}>Set Availability</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.subtitle}>
            Set your weekly hours. Clients can book 1-hour slots within these windows.
          </Text>

          {DAYS_CONFIG.map(({ label, dow }) => {
            const d = days[dow];
            return (
              <View key={dow} style={s.dayCard}>
                {/* Top row: toggle + label + working hours */}
                <View style={s.dayTop}>
                  <Switch
                    value={d.enabled}
                    onValueChange={() => toggle(dow)}
                    trackColor={{ false: C.outlineVariant, true: C.primary + '55' }}
                    thumbColor={d.enabled ? C.primary : C.onSurfaceVariant}
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

                {/* Breaks */}
                {d.enabled && d.breaks.map((brk, i) => (
                  <View key={i} style={s.breakRow}>
                    <IconSymbol name="clock" size={14} color={C.onSurfaceVariant} />
                    <Text style={s.breakLabel}>Break</Text>
                    <View style={s.timePair}>
                      <TouchableOpacity
                        style={s.timeChip}
                        onPress={() => setPicker({ dow, which: 'break-start', breakIndex: i })}>
                        <Text style={s.timeChipText}>{hourLabel(brk.startHour)}</Text>
                      </TouchableOpacity>
                      <Text style={s.timeDash}>–</Text>
                      <TouchableOpacity
                        style={s.timeChip}
                        onPress={() => setPicker({ dow, which: 'break-end', breakIndex: i })}>
                        <Text style={s.timeChipText}>{hourLabel(brk.endHour)}</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => removeBreak(dow, i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <IconSymbol name="xmark.circle.fill" size={18} color={C.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add break button */}
                {d.enabled && (
                  <TouchableOpacity style={s.addBreakBtn} onPress={() => addBreak(dow)}>
                    <IconSymbol name="plus" size={14} color={C.primary} />
                    <Text style={s.addBreakText}>Add Break</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.5 }]}
            onPress={save}
            disabled={saving}>
            {saving
              ? <ActivityIndicator color={C.background} size="small" />
              : <Text style={s.saveBtnText}>Save Availability</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Time picker modal */}
      <Modal visible={!!picker} transparent animationType="slide">
        <Pressable style={s.overlay} onPress={() => setPicker(null)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <Text style={s.sheetTitle}>{pickerTitle()}</Text>
            <FlatList
              data={HOURS}
              keyExtractor={(item) => String(item.value)}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => {
                const disabled = isDisabled(item.value);
                const selected = isSelected(item.value);
                return (
                  <TouchableOpacity
                    style={[s.pickOption, selected && s.pickOptionSel, disabled && s.pickOptionDim]}
                    onPress={() => !disabled && applyTime(item.value)}
                    disabled={disabled}>
                    <Text style={[s.pickOptionText, selected && s.pickOptionTextSel]}>
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
