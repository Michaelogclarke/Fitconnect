import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform,
  RefreshControl, ScrollView, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { NumericInput } from '@/components/ui/numeric-input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { styles } from '@/styles/tabs/progress.styles';
import { styles as hStyles } from '@/styles/tabs/history.styles';
import { supabase } from '@/lib/supabase';
import { formatVolume, formatShortDate, formatDuration } from '@/lib/format';

// ─── Types ────────────────────────────────────────────────────────────────────

type BwEntry    = { label: string; value: number };
type PrEntry    = { exercise: string; weight: number; reps: number; date: string };
type VolEntry   = { week: string; value: number };
type FreqEntry  = { muscle: string; sessions: number };

type HistorySession = {
  id:               string;
  name:             string;
  started_at:       string;
  duration_seconds: number | null;
  set_count:        number;
  volume:           number;
  exercises:        string[];
};

const RANGE_OPTIONS = ['1W', '1M', '3M', 'All'] as const;
type Range = typeof RANGE_OPTIONS[number];

// ─── Session card (history) ───────────────────────────────────────────────────

function SessionCard({ session, onPress }: { session: HistorySession; onPress: () => void }) {
  return (
    <TouchableOpacity style={hStyles.sessionCard} onPress={onPress} activeOpacity={0.8}>
      <View style={hStyles.sessionTop}>
        <View style={hStyles.sessionIconBox}>
          <IconSymbol name="dumbbell.fill" size={18} color={Colors.primary} />
        </View>
        <View style={hStyles.sessionInfo}>
          <Text style={hStyles.sessionName}>{session.name}</Text>
          <Text style={hStyles.sessionMeta}>
            {formatShortDate(session.started_at)}
            {session.duration_seconds ? ` · ${formatDuration(session.duration_seconds)}` : ''}
          </Text>
        </View>
        <View style={hStyles.sessionRight}>
          {session.volume > 0 && (
            <Text style={hStyles.sessionVolume}>{formatVolume(session.volume)}</Text>
          )}
          <Text style={hStyles.sessionSets}>{session.set_count} sets</Text>
        </View>
      </View>

      {session.exercises.length > 0 && (
        <View style={hStyles.sessionDetail}>
          <View style={hStyles.sessionDivider} />
          {session.exercises.slice(0, 3).map((ex, i) => (
            <View key={i} style={hStyles.exerciseRow}>
              <View style={hStyles.exerciseDot} />
              <Text style={hStyles.exerciseText}>{ex}</Text>
            </View>
          ))}
          {session.exercises.length > 3 && (
            <Text style={[hStyles.exerciseText, { marginLeft: 18, marginTop: 2 }]}>
              +{session.exercises.length - 3} more
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Line chart ───────────────────────────────────────────────────────────────

function LineChart({ data, color }: { data: BwEntry[]; color: string }) {
  const [chartWidth, setChartWidth] = useState(0);
  const CHART_H = 80;
  const PAD     = 8;

  if (data.length === 0) return null;

  const min   = Math.min(...data.map((d) => d.value));
  const max   = Math.max(...data.map((d) => d.value));
  const range = max - min || 1;

  const pts = data.map((d, i) => ({
    x: PAD + (i / Math.max(data.length - 1, 1)) * (chartWidth - PAD * 2),
    y: CHART_H - PAD - ((d.value - min) / range) * (CHART_H - PAD * 2),
  }));

  return (
    <View
      style={{ height: CHART_H, position: 'relative' }}
      onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
      {chartWidth > 0 && (
        <>
          {/* Line segments */}
          {pts.slice(0, -1).map((p, i) => {
            const nxt = pts[i + 1];
            const dx  = nxt.x - p.x;
            const dy  = nxt.y - p.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const deg = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <View
                key={i}
                style={{
                  position:        'absolute',
                  left:            (p.x + nxt.x) / 2 - len / 2,
                  top:             (p.y + nxt.y) / 2 - 1,
                  width:           len,
                  height:          2,
                  backgroundColor: color,
                  opacity:         0.7,
                  transform:       [{ rotate: `${deg}deg` }],
                }}
              />
            );
          })}

          {/* Dots */}
          {pts.map((p, i) => (
            <View
              key={i}
              style={{
                position:        'absolute',
                left:            p.x - 4,
                top:             p.y - 4,
                width:           8,
                height:          8,
                borderRadius:    4,
                backgroundColor: color,
              }}
            />
          ))}

          {/* X-axis labels */}
          {data.map((d, i) => (
            <Text
              key={i}
              style={[
                styles.bwBarLabel,
                {
                  position:  'absolute',
                  left:      pts[i].x - 16,
                  top:       CHART_H - 2,
                  width:     32,
                  textAlign: 'center',
                },
              ]}>
              {d.label}
            </Text>
          ))}
        </>
      )}
    </View>
  );
}

// ─── Log Weight Modal ─────────────────────────────────────────────────────────

function LogWeightModal({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [weight,  setWeight]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  async function handleSave() {
    const val = parseFloat(weight);
    if (!val || val <= 0) { setError('Enter a valid weight'); return; }

    setSaving(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { error: upsertErr } = await supabase
        .from('body_weight_logs')
        .upsert(
          {
            user_id:   user.id,
            weight:    val,
            unit:      'kg',
            logged_at: today.toISOString(),
          },
          { onConflict: 'user_id,logged_at' }
        );

      if (upsertErr) throw upsertErr;

      setWeight('');
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setWeight('');
    setError('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Log Body Weight</Text>

          <View style={styles.modalInputRow}>
            <NumericInput
              style={styles.modalInput}
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g. 75.5"
              placeholderTextColor={Colors.onSurfaceVariant}
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={styles.modalUnitBox}>
              <Text style={styles.modalUnit}>kg</Text>
            </View>
          </View>

          {!!error && <Text style={styles.modalError}>{error}</Text>}

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={handleClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.modalSaveText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const router = useRouter();

  const [range,          setRange]          = useState<Range>('1M');
  const [loading,        setLoading]        = useState(true);
  const [bodyWeight,     setBodyWeight]     = useState<BwEntry[]>([]);
  const [prs,            setPrs]            = useState<PrEntry[]>([]);
  const [weeklyVol,      setWeeklyVol]      = useState<VolEntry[]>([]);
  const [muscleFreq,     setMuscleFreq]     = useState<FreqEntry[]>([]);
  const [showLogModal,   setShowLogModal]   = useState(false);
  const [recentSessions, setRecentSessions] = useState<HistorySession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  useFocusEffect(
    useCallback(() => {
      loadProgress();
      loadHistory();
    }, [range])
  );

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setHistoryLoading(false); return; }

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select(`
          id, name, started_at, duration_seconds,
          session_exercises(
            exercise_name,
            session_sets(weight, reps, is_completed)
          )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(3);

      const mapped: HistorySession[] = (sessions ?? []).map((s: any) => {
        const allSets       = s.session_exercises.flatMap((e: any) => e.session_sets);
        const completedSets = allSets.filter((st: any) => st.is_completed);
        const volume        = completedSets.reduce(
          (sum: number, st: any) => sum + ((st.weight ?? 0) * (st.reps ?? 0)), 0
        );
        return {
          id:               s.id,
          name:             s.name,
          started_at:       s.started_at,
          duration_seconds: s.duration_seconds,
          set_count:        completedSets.length,
          volume,
          exercises:        s.session_exercises.map((e: any) => e.exercise_name),
        };
      });

      setRecentSessions(mapped);
    } catch {}
    setHistoryLoading(false);
  }

  async function loadProgress() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // ── Body weight: last 10 entries ──────────────────────────────────────────
    const { data: bwRows } = await supabase
      .from('body_weight_logs')
      .select('weight, logged_at')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(10);

    const bwData: BwEntry[] = (bwRows ?? [])
      .reverse()
      .map((r: any) => ({
        label: new Date(r.logged_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        value: Number(r.weight),
      }));

    // ── Sessions with exercises + sets (for PRs, volume, muscle freq) ─────────
    const rangeDate = new Date();
    if (range === '1W')      rangeDate.setDate(rangeDate.getDate() - 7);
    else if (range === '1M') rangeDate.setMonth(rangeDate.getMonth() - 1);
    else if (range === '3M') rangeDate.setMonth(rangeDate.getMonth() - 3);
    else                     rangeDate.setFullYear(2000);

    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select(`
        id, started_at,
        session_exercises(
          exercise_name, muscle_group,
          session_sets(weight, reps, is_completed)
        )
      `)
      .eq('user_id', user.id)
      .gte('started_at', rangeDate.toISOString())
      .order('started_at', { ascending: true });

    // ── Personal records ──────────────────────────────────────────────────────
    const prMap = new Map<string, PrEntry>();
    for (const session of sessions ?? []) {
      for (const ex of (session as any).session_exercises) {
        for (const set of ex.session_sets) {
          if (!set.is_completed || !set.weight) continue;
          const existing = prMap.get(ex.exercise_name);
          if (!existing || set.weight > existing.weight ||
              (set.weight === existing.weight && set.reps > existing.reps)) {
            prMap.set(ex.exercise_name, {
              exercise: ex.exercise_name,
              weight:   Number(set.weight),
              reps:     set.reps,
              date:     new Date((session as any).started_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short',
              }),
            });
          }
        }
      }
    }
    const prList = Array.from(prMap.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 6);

    // ── Weekly volume ─────────────────────────────────────────────────────────
    const weekVolMap = new Map<string, number>();
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const label = i === 0 ? 'Now' : `W${5 - i}`;
      weekVolMap.set(label, 0);
    }
    for (const session of sessions ?? []) {
      const sDate    = new Date((session as any).started_at);
      const diffWeeks = Math.floor((now.getTime() - sDate.getTime()) / (7 * 24 * 3600 * 1000));
      if (diffWeeks > 4) continue;
      const label = diffWeeks === 0 ? 'Now' : `W${5 - diffWeeks}`;
      const vol = (session as any).session_exercises
        .flatMap((e: any) => e.session_sets)
        .filter((s: any) => s.is_completed)
        .reduce((sum: number, s: any) => sum + ((s.weight ?? 0) * (s.reps ?? 0)), 0);
      weekVolMap.set(label, (weekVolMap.get(label) ?? 0) + vol);
    }
    const volData: VolEntry[] = Array.from(weekVolMap.entries()).map(([week, value]) => ({ week, value }));

    // ── Muscle frequency ──────────────────────────────────────────────────────
    const freqMap = new Map<string, number>();
    for (const session of sessions ?? []) {
      for (const ex of (session as any).session_exercises) {
        const muscle = ex.muscle_group;
        if (!muscle) continue;
        freqMap.set(muscle, (freqMap.get(muscle) ?? 0) + 1);
      }
    }
    const freqData: FreqEntry[] = Array.from(freqMap.entries())
      .map(([muscle, sessions]) => ({ muscle, sessions }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 6);

    setBodyWeight(bwData);
    setPrs(prList);
    setWeeklyVol(volData);
    setMuscleFreq(freqData);
    setLoading(false);
  }

  const bwChange = bodyWeight.length > 1
    ? (bodyWeight[bodyWeight.length - 1].value - bodyWeight[0].value)
    : null;

  const maxVol  = weeklyVol.length  ? Math.max(...weeklyVol.map((d)  => d.value)) || 1 : 1;
  const maxFreq = muscleFreq.length ? Math.max(...muscleFreq.map((d) => d.sessions)) || 1 : 1;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await Promise.all([loadProgress(), loadHistory()]); setRefreshing(false); }}
            tintColor={Colors.primary}
          />
        }>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <View style={styles.rangeRow}>
            {RANGE_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
                onPress={() => setRange(r)}>
                <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Body weight */}
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionLabel, { marginHorizontal: 0, marginTop: 0, marginBottom: 0 }]}>Body Weight</Text>
              <TouchableOpacity style={styles.logWeightBtn} onPress={() => setShowLogModal(true)}>
                <IconSymbol name="plus" size={13} color={Colors.primary} />
                <Text style={styles.logWeightText}>Log</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bwCard}>
              {bodyWeight.length === 0 ? (
                <TouchableOpacity
                  style={styles.bwEmpty}
                  onPress={() => setShowLogModal(true)}>
                  <IconSymbol name="scalemass.fill" size={24} color={Colors.outlineVariant} />
                  <Text style={styles.bwEmptyText}>No weight entries yet</Text>
                  <Text style={styles.bwEmptyHint}>Tap to log your first entry</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.bwCardHeader}>
                    <View>
                      <Text style={styles.bwCurrent}>
                        {bodyWeight[bodyWeight.length - 1].value} kg
                      </Text>
                      {bwChange !== null && (
                        <Text style={[
                          styles.bwChange,
                          { color: bwChange > 0 ? Colors.error : Colors.success },
                        ]}>
                          {bwChange > 0 ? '+' : ''}{bwChange.toFixed(1)} kg
                        </Text>
                      )}
                    </View>
                    <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={Colors.primary} />
                  </View>

                  <LineChart data={bodyWeight} color={Colors.primary} />

                  {/* Labels row spacer */}
                  <View style={{ height: 18 }} />
                </>
              )}
            </View>

            {/* Personal records */}
            <Text style={styles.sectionLabel}>Personal Records</Text>
            <View style={styles.prCard}>
              {prs.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>Complete workouts to see your PRs</Text>
                </View>
              ) : (
                prs.map((pr, i) => (
                  <View key={i} style={[styles.prRow, i < prs.length - 1 && styles.prRowBorder]}>
                    <View style={styles.prIconBox}>
                      <IconSymbol name="trophy.fill" size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.prInfo}>
                      <Text style={styles.prExercise}>{pr.exercise}</Text>
                      <Text style={styles.prDate}>
                        {pr.reps} rep{pr.reps !== 1 ? 's' : ''} · {pr.date}
                      </Text>
                    </View>
                    <Text style={styles.prWeight}>{pr.weight} kg</Text>
                  </View>
                ))
              )}
            </View>

            {/* Weekly volume */}
            <Text style={styles.sectionLabel}>Weekly Volume (kg)</Text>
            <View style={styles.volCard}>
              <View style={styles.volBars}>
                {weeklyVol.map((d) => {
                  const heightPct = (d.value / maxVol) * 100;
                  return (
                    <View key={d.week} style={styles.volBarGroup}>
                      <Text style={styles.volBarValue}>
                        {d.value > 0 ? formatVolume(d.value).replace(' kg', '') : ''}
                      </Text>
                      <View style={styles.volBarTrack}>
                        <View style={[styles.volBarFill, { height: `${heightPct}%` }]} />
                      </View>
                      <Text style={styles.volBarLabel}>{d.week}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Muscle frequency */}
            {muscleFreq.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Muscle Frequency</Text>
                <View style={styles.freqCard}>
                  {muscleFreq.map((m) => {
                    const pct = (m.sessions / maxFreq) * 100;
                    return (
                      <View key={m.muscle} style={styles.freqRow}>
                        <Text style={styles.freqLabel}>{m.muscle}</Text>
                        <View style={styles.freqBarTrack}>
                          <View style={[styles.freqBarFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.freqCount}>{m.sessions}x</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Workout history */}
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionLabel, { marginHorizontal: 0, marginTop: 0, marginBottom: 0 }]}>History</Text>
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => router.push('/(tabs)/history' as any)}>
                <Text style={styles.viewAllText}>View All</Text>
                <IconSymbol name="chevron.right" size={13} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            {historyLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginBottom: Spacing.lg }} />
            ) : recentSessions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>No sessions logged yet</Text>
              </View>
            ) : (
              recentSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onPress={() => router.push({ pathname: '/session-detail' as any, params: { sessionId: session.id } })}
                />
              ))
            )}
          </>
        )}

      </ScrollView>

      <LogWeightModal
        visible={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSaved={loadProgress}
      />
    </SafeAreaView>
  );
}
