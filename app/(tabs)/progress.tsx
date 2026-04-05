import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from '@/styles/tabs/progress.styles';
import { supabase } from '@/lib/supabase';
import { formatVolume } from '@/lib/format';

// ─── Types ────────────────────────────────────────────────────────────────────

type BwEntry    = { label: string; value: number };
type PrEntry    = { exercise: string; weight: number; reps: number; date: string };
type VolEntry   = { week: string; value: number };
type FreqEntry  = { muscle: string; sessions: number };

const RANGE_OPTIONS = ['1W', '1M', '3M', 'All'] as const;
type Range = typeof RANGE_OPTIONS[number];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const [range, setRange]           = useState<Range>('1M');
  const [loading, setLoading]       = useState(true);
  const [bodyWeight, setBodyWeight] = useState<BwEntry[]>([]);
  const [prs, setPrs]               = useState<PrEntry[]>([]);
  const [weeklyVol, setWeeklyVol]   = useState<VolEntry[]>([]);
  const [muscleFreq, setMuscleFreq] = useState<FreqEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [range])
  );

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
        label: new Date(r.logged_at).toLocaleDateString('en-GB', { weekday: 'short' }),
        value: Number(r.weight),
      }));

    // ── Sessions with exercises + sets (for PRs, volume, muscle freq) ─────────
    const rangeDate = new Date();
    if (range === '1W') rangeDate.setDate(rangeDate.getDate() - 7);
    else if (range === '1M') rangeDate.setMonth(rangeDate.getMonth() - 1);
    else if (range === '3M') rangeDate.setMonth(rangeDate.getMonth() - 3);
    else rangeDate.setFullYear(2000); // All

    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select(`
        id, started_at,
        session_exercises(
          exercise_name, muscle_group,
          session_sets(weight, reps, is_completed, completed_at)
        )
      `)
      .eq('user_id', user.id)
      .gte('started_at', rangeDate.toISOString())
      .order('started_at', { ascending: true });

    // ── Personal records: max weight per exercise ─────────────────────────────
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

    // ── Weekly volume: last 5 weeks ───────────────────────────────────────────
    const weekVolMap = new Map<string, number>();
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const label = i === 0 ? 'Now' : `W${5 - i}`;
      weekVolMap.set(label, 0);
    }

    for (const session of sessions ?? []) {
      const sDate = new Date((session as any).started_at);
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

    // ── Muscle frequency: sessions per muscle group ───────────────────────────
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

  const bwMin = bodyWeight.length ? Math.min(...bodyWeight.map((d) => d.value)) : 0;
  const bwMax = bodyWeight.length ? Math.max(...bodyWeight.map((d) => d.value)) : 1;
  const bwRange = bwMax - bwMin || 1;
  const maxVol  = weeklyVol.length ? Math.max(...weeklyVol.map((d) => d.value)) || 1 : 1;
  const maxFreq = muscleFreq.length ? Math.max(...muscleFreq.map((d) => d.sessions)) || 1 : 1;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

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
            <Text style={styles.sectionLabel}>Body Weight</Text>
            <View style={styles.bwCard}>
              {bodyWeight.length === 0 ? (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <Text style={{ color: Colors.onSurfaceVariant }}>No weight entries yet</Text>
                </View>
              ) : (
                <>
                  <View style={styles.bwCardHeader}>
                    <View>
                      <Text style={styles.bwCurrent}>{bodyWeight[bodyWeight.length - 1].value} kg</Text>
                      {bodyWeight.length > 1 && (
                        <Text style={styles.bwChange}>
                          {(bodyWeight[bodyWeight.length - 1].value - bodyWeight[0].value > 0 ? '+' : '')}
                          {(bodyWeight[bodyWeight.length - 1].value - bodyWeight[0].value).toFixed(1)} kg
                        </Text>
                      )}
                    </View>
                    <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.bwBars}>
                    {bodyWeight.map((d) => {
                      const heightPct = ((d.value - bwMin) / bwRange) * 60 + 16;
                      return (
                        <View key={d.label} style={styles.bwBarGroup}>
                          <View style={[styles.bwBar, { height: heightPct }]} />
                          <Text style={styles.bwBarLabel}>{d.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </View>

            {/* Personal records */}
            <Text style={styles.sectionLabel}>Personal Records</Text>
            <View style={styles.prCard}>
              {prs.length === 0 ? (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <Text style={{ color: Colors.onSurfaceVariant }}>Complete workouts to see your PRs</Text>
                </View>
              ) : (
                prs.map((pr, i) => (
                  <View
                    key={i}
                    style={[styles.prRow, i < prs.length - 1 && styles.prRowBorder]}>
                    <View style={styles.prIconBox}>
                      <IconSymbol name="trophy.fill" size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.prInfo}>
                      <Text style={styles.prExercise}>{pr.exercise}</Text>
                      <Text style={styles.prDate}>{pr.reps} rep{pr.reps !== 1 ? 's' : ''} · {pr.date}</Text>
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
                      <Text style={styles.volBarValue}>{d.value > 0 ? formatVolume(d.value).replace(' kg', '') : ''}</Text>
                      <View style={styles.volBarTrack}>
                        <View style={[styles.volBarFill, { height: `${heightPct}%` }]} />
                      </View>
                      <Text style={styles.volBarLabel}>{d.week}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Muscle group frequency */}
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
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
