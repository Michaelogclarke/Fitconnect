import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarBooking = {
  id:        string;
  starts_at: string;
  ends_at:   string;
  status:    'pending' | 'confirmed' | 'cancelled';
  otherName: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_H     = 56;
const START_HOUR = 6;
const END_HOUR   = 22;
const TIME_COL_W = 44;
const TOTAL_H    = (END_HOUR - START_HOUR) * HOUR_H;
const HOURS      = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const DAY_SHORT  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d   = new Date(date);
  const dow = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const first   = new Date(year, month, 1);
  const last    = new Date(year, month + 1, 0);
  const padLeft = (first.getDay() + 6) % 7;
  const days: (Date | null)[] = Array(padLeft).fill(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function hourLabel(h: number): string {
  if (h === 0 || h === 24) return '12am';
  if (h === 12)            return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function BookingCalendar({ bookings }: { bookings: CalendarBooking[] }) {
  const C = useColors();

  const [mode,    setMode]    = useState<'month' | 'week'>('month');
  const [refDate, setRefDate] = useState(() => new Date());

  const weekStart = useMemo(() => startOfWeek(refDate), [refDate]);
  const month     = refDate.getMonth();
  const year      = refDate.getFullYear();

  const s = useMemo(() => StyleSheet.create({
    modeRow: {
      flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1, borderBottomColor: C.outlineVariant,
    },
    modeBtn:          { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: C.surfaceContainer },
    modeBtnActive:    { backgroundColor: C.primary },
    modeBtnText:      { ...Typography.labelLg, color: C.onSurfaceVariant },
    modeBtnTextActive:{ color: C.background },
    navRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    },
    navTitle: { ...Typography.titleMd, color: C.onSurface },
  }), [C]);

  function navigate(dir: -1 | 1) {
    setRefDate((prev) => {
      const d = new Date(prev);
      if (mode === 'month') d.setMonth(d.getMonth() + dir);
      else                  d.setDate(d.getDate() + dir * 7);
      return d;
    });
  }

  const weekEnd  = addDays(weekStart, 6);
  const navTitle = mode === 'month'
    ? `${MONTH_LONG[month]} ${year}`
    : weekStart.getMonth() === weekEnd.getMonth()
      ? `${MONTH_LONG[weekStart.getMonth()]} ${weekStart.getDate()}–${weekEnd.getDate()}`
      : `${MONTH_LONG[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()} – ${MONTH_LONG[weekEnd.getMonth()].slice(0, 3)} ${weekEnd.getDate()}`;

  return (
    <View style={{ flex: 1 }}>
      {/* Month / Week toggle */}
      <View style={s.modeRow}>
        {(['month', 'week'] as const).map((m) => (
          <TouchableOpacity
            key={m}
            style={[s.modeBtn, mode === m && s.modeBtnActive]}
            onPress={() => setMode(m)}>
            <Text style={[s.modeBtnText, mode === m && s.modeBtnTextActive]}>
              {m === 'month' ? 'Month' : 'Week'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Navigation */}
      <View style={s.navRow}>
        <TouchableOpacity onPress={() => navigate(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={20} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={s.navTitle}>{navTitle}</Text>
        <TouchableOpacity onPress={() => navigate(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.right" size={20} color={C.onSurface} />
        </TouchableOpacity>
      </View>

      {mode === 'month'
        ? (
          <MonthView
            bookings={bookings}
            year={year}
            month={month}
            onSelectDay={(d) => { setRefDate(d); setMode('week'); }}
          />
        ) : (
          <WeekView bookings={bookings} weekStart={weekStart} />
        )}
    </View>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  bookings, year, month, onSelectDay,
}: {
  bookings:    CalendarBooking[];
  year:        number;
  month:       number;
  onSelectDay: (d: Date) => void;
}) {
  const C     = useColors();
  const today = useMemo(() => new Date(), []);
  const grid  = useMemo(() => getMonthGrid(year, month), [year, month]);

  const s = useMemo(() => StyleSheet.create({
    headerRow: {
      flexDirection: 'row', paddingHorizontal: Spacing.sm,
      borderBottomWidth: 1, borderBottomColor: C.outlineVariant,
    },
    headerCell:     { flex: 1, alignItems: 'center', paddingVertical: Spacing.xs },
    headerText:     { ...Typography.labelMd, color: C.onSurfaceVariant },
    grid:           { paddingHorizontal: Spacing.sm, paddingTop: Spacing.xs },
    week:           { flexDirection: 'row' },
    cell:           { flex: 1, alignItems: 'center', paddingVertical: 6, minHeight: 52 },
    numWrap:        { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    numWrapToday:   { backgroundColor: C.primary },
    dayNum:         { ...Typography.bodyMd, color: C.onSurface },
    dayNumToday:    { color: C.background, fontWeight: '700' },
    dayNumFaded:    { color: C.outlineVariant },
    dotsRow:        { flexDirection: 'row', gap: 3, marginTop: 3 },
    dot:            { width: 5, height: 5, borderRadius: 3 },
  }), [C]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={s.headerRow}>
        {DAY_SHORT.map((d) => (
          <View key={d} style={s.headerCell}>
            <Text style={s.headerText}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={s.grid}>
        {Array.from({ length: grid.length / 7 }, (_, row) => (
          <View key={row} style={s.week}>
            {grid.slice(row * 7, row * 7 + 7).map((day, col) => {
              if (!day) return <View key={col} style={s.cell} />;

              const isToday    = isSameDay(day, today);
              const isThisMonth= day.getMonth() === month;
              const dayBooks   = bookings.filter((b) => isSameDay(new Date(b.starts_at), day));
              const confirmed  = dayBooks.some((b) => b.status === 'confirmed');
              const pending    = dayBooks.some((b) => b.status === 'pending');

              return (
                <TouchableOpacity key={col} style={s.cell} onPress={() => onSelectDay(day)} activeOpacity={0.6}>
                  <View style={[s.numWrap, isToday && s.numWrapToday]}>
                    <Text style={[s.dayNum, isToday && s.dayNumToday, !isThisMonth && s.dayNumFaded]}>
                      {day.getDate()}
                    </Text>
                  </View>
                  <View style={s.dotsRow}>
                    {confirmed && <View style={[s.dot, { backgroundColor: C.primary }]} />}
                    {pending   && <View style={[s.dot, { backgroundColor: C.success }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({ bookings, weekStart }: { bookings: CalendarBooking[]; weekStart: Date }) {
  const C        = useColors();
  const { width} = useWindowDimensions();
  const scrollRef= useRef<ScrollView>(null);
  const today    = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const dayColW  = (width - TIME_COL_W) / 7;

  const todayColIdx = weekDays.findIndex((d) => isSameDay(d, today));
  const nowTop      = todayColIdx >= 0
    ? Math.min(Math.max((today.getHours() + today.getMinutes() / 60 - START_HOUR) * HOUR_H, 0), TOTAL_H)
    : -1;

  useEffect(() => {
    // Scroll to 8am
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: (8 - START_HOUR) * HOUR_H, animated: false });
    }, 50);
  }, [weekStart]);

  const s = useMemo(() => StyleSheet.create({
    root:            { flex: 1 },
    dayHeaderRow: {
      flexDirection: 'row', marginLeft: TIME_COL_W,
      borderBottomWidth: 1, borderBottomColor: C.outlineVariant,
    },
    dayHeader: {
      width: dayColW, alignItems: 'center', paddingVertical: 5,
      borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: C.outlineVariant,
    },
    dayLabel:        { ...Typography.labelMd, color: C.onSurfaceVariant },
    dayNum:          { ...Typography.labelLg, color: C.onSurface, lineHeight: 20 },
    dayNumToday:     { color: C.primary, fontWeight: '700' },
    gridRow:         { flexDirection: 'row', height: TOTAL_H },
    timeCol:         { width: TIME_COL_W },
    hourLabelWrap: {
      height: HOUR_H, justifyContent: 'flex-start',
      paddingTop: 3, paddingRight: 6, alignItems: 'flex-end',
    },
    hourText:        { ...Typography.labelMd, color: C.outlineVariant, fontSize: 10 },
    daysArea:        { flex: 1, flexDirection: 'row' },
    dayCol: {
      width: dayColW,
      borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: C.outlineVariant,
      position: 'relative',
    },
    dayColToday:     { backgroundColor: C.primary + '06' },
    hourLine:        { height: HOUR_H, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant },
    halfLine: {
      position: 'absolute', left: 0, right: 0,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant + '66',
    },
    block: {
      position: 'absolute', left: 2, right: 2,
      borderRadius: Radius.sm, paddingHorizontal: 4, paddingVertical: 3,
      overflow: 'hidden',
    },
    blockConfirmed:  { backgroundColor: C.primary },
    blockPending:    { backgroundColor: C.primary + 'aa' },
    blockName:       { color: '#fff', fontSize: 10, fontWeight: '700', lineHeight: 13 },
    blockTime:       { color: '#ffffffcc', fontSize: 9, lineHeight: 12, marginTop: 1 },
    nowLine: {
      position: 'absolute', left: 0, right: 0, height: 2,
      backgroundColor: C.error, zIndex: 10,
    },
    nowDot: {
      position: 'absolute', left: -3, top: -3,
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: C.error,
    },
  }), [C, dayColW]);

  return (
    <View style={s.root}>
      {/* Day header row */}
      <View style={s.dayHeaderRow}>
        {weekDays.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <View key={i} style={s.dayHeader}>
              <Text style={s.dayLabel}>{DAY_SHORT[i]}</Text>
              <Text style={[s.dayNum, isToday && s.dayNumToday]}>{d.getDate()}</Text>
            </View>
          );
        })}
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <View style={s.gridRow}>
          {/* Time labels */}
          <View style={s.timeCol}>
            {HOURS.map((h) => (
              <View key={h} style={s.hourLabelWrap}>
                <Text style={s.hourText}>{hourLabel(h)}</Text>
              </View>
            ))}
          </View>

          {/* Day columns */}
          <View style={s.daysArea}>
            {weekDays.map((day, di) => {
              const isToday    = di === todayColIdx;
              const dayBookings= bookings.filter((b) => isSameDay(new Date(b.starts_at), day));

              return (
                <View key={di} style={[s.dayCol, isToday && s.dayColToday]}>
                  {/* Hour grid lines */}
                  {HOURS.map((h) => (
                    <React.Fragment key={h}>
                      <View style={s.hourLine} />
                      <View style={[s.halfLine, { top: h === START_HOUR ? HOUR_H / 2 : (h - START_HOUR) * HOUR_H + HOUR_H / 2 }]} />
                    </React.Fragment>
                  ))}

                  {/* Current time indicator */}
                  {isToday && nowTop >= 0 && (
                    <View style={[s.nowLine, { top: nowTop }]}>
                      <View style={s.nowDot} />
                    </View>
                  )}

                  {/* Booking blocks */}
                  {dayBookings.map((b) => {
                    const start    = new Date(b.starts_at);
                    const end      = new Date(b.ends_at);
                    const topPx    = Math.max((start.getHours() + start.getMinutes() / 60 - START_HOUR) * HOUR_H, 0);
                    const heightPx = Math.max(
                      ((end.getHours() + end.getMinutes() / 60) - (start.getHours() + start.getMinutes() / 60)) * HOUR_H,
                      20,
                    );
                    const timeStr  = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                    const firstName= b.otherName.split(' ')[0];

                    return (
                      <View
                        key={b.id}
                        style={[s.block, b.status === 'confirmed' ? s.blockConfirmed : s.blockPending, { top: topPx, height: heightPx }]}>
                        <Text style={s.blockName} numberOfLines={1}>{firstName}</Text>
                        {heightPx >= 32 && <Text style={s.blockTime} numberOfLines={1}>{timeStr}</Text>}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
