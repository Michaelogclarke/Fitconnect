import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView,
  Modal, Platform, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { NumericInput } from '@/components/ui/numeric-input';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

type WeightEntry = {
  id:        string;
  weight:    number;
  unit:      string;
  logged_at: string;
};

export default function BodyWeightLogScreen() {
  const C = useColors();
  const router = useRouter();
  const [entries,    setEntries]    = useState<WeightEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [weight,     setWeight]     = useState('');
  const [saving,     setSaving]     = useState(false);
  const [inputError, setInputError] = useState('');

  useFocusEffect(useCallback(() => { loadEntries(); }, []));

  async function loadEntries() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('body_weight_logs')
        .select('id, weight, unit, logged_at')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });
      setEntries(data ?? []);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    const val = parseFloat(weight);
    if (!val || val <= 0) { setInputError('Enter a valid weight'); return; }
    setSaving(true);
    setInputError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { error } = await supabase
        .from('body_weight_logs')
        .upsert(
          { user_id: user.id, weight: val, unit: 'kg', logged_at: today.toISOString() },
          { onConflict: 'user_id,logged_at' },
        );
      if (error) throw error;
      setWeight('');
      setShowModal(false);
      loadEntries();
    } catch (e: any) {
      setInputError(e?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    setWeight('');
    setInputError('');
  }

  function handleDelete(id: string) {
    Alert.alert('Delete Entry', 'Remove this weight entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('body_weight_logs').delete().eq('id', id);
          setEntries((prev) => prev.filter((e) => e.id !== id));
        },
      },
    ]);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: C.outlineVariant,
        gap: Spacing.md,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={{ ...Typography.headlineMd, color: C.onSurface, flex: 1 }}>Body Weight Log</Text>
        <TouchableOpacity
          style={{
            backgroundColor: C.primary,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.xs,
            borderRadius: Radius.full,
          }}
          onPress={() => setShowModal(true)}>
          <Text style={{ ...Typography.labelLg, color: C.background, fontWeight: '700' }}>+ Log</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: Spacing.xxxl }} />
      ) : entries.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md }}>
          <IconSymbol name="scalemass.fill" size={48} color={C.outlineVariant} />
          <Text style={{ ...Typography.titleLg, color: C.onSurfaceVariant }}>No entries yet</Text>
          <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant }}>Tap + Log to record your weight</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const prev = entries[index + 1];
            const diff = prev ? item.weight - prev.weight : null;
            const isToday = new Date(item.logged_at).toDateString() === new Date().toDateString();
            return (
              <TouchableOpacity
                style={{
                  backgroundColor: C.surfaceContainer,
                  borderRadius: Radius.lg,
                  padding: Spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: isToday ? 1 : 0,
                  borderColor: C.primary + '50',
                }}
                onLongPress={() => handleDelete(item.id)}
                activeOpacity={0.8}>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...Typography.titleLg, color: C.onSurface }}>
                    {item.weight} {item.unit}
                  </Text>
                  <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant, marginTop: 2 }}>
                    {isToday ? 'Today' : formatDate(item.logged_at)}
                  </Text>
                </View>
                {diff !== null && (
                  <Text style={{
                    ...Typography.titleMd,
                    color: diff > 0 ? C.error : diff < 0 ? C.success : C.onSurfaceVariant,
                  }}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Log Weight Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={handleCloseModal}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{
            backgroundColor: C.surfaceContainerHigh,
            borderTopLeftRadius: Radius.xl,
            borderTopRightRadius: Radius.xl,
            padding: Spacing.xl,
            gap: Spacing.lg,
          }}>
            <Text style={{ ...Typography.headlineMd, color: C.onSurface }}>Log Body Weight</Text>

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <NumericInput
                style={{
                  flex: 1,
                  backgroundColor: C.surfaceContainer,
                  borderRadius: Radius.md,
                  padding: Spacing.md,
                  color: C.onSurface,
                  fontSize: 16,
                }}
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g. 75.5"
                placeholderTextColor={C.onSurfaceVariant}
                keyboardType="decimal-pad"
                autoFocus
              />
              <View style={{
                backgroundColor: C.surfaceContainer,
                borderRadius: Radius.md,
                padding: Spacing.md,
                justifyContent: 'center',
                paddingHorizontal: Spacing.lg,
              }}>
                <Text style={{ ...Typography.titleMd, color: C.onSurfaceVariant }}>kg</Text>
              </View>
            </View>

            {inputError ? (
              <Text style={{ ...Typography.bodyMd, color: C.error }}>{inputError}</Text>
            ) : null}

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: Spacing.md,
                  borderRadius: Radius.md,
                  backgroundColor: C.surfaceContainer,
                  alignItems: 'center',
                }}
                onPress={handleCloseModal}>
                <Text style={{ ...Typography.titleMd, color: C.onSurfaceVariant }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 2,
                  padding: Spacing.md,
                  borderRadius: Radius.md,
                  backgroundColor: C.primary,
                  alignItems: 'center',
                }}
                onPress={handleSave}
                disabled={saving}>
                {saving
                  ? <ActivityIndicator color={C.background} />
                  : <Text style={{ ...Typography.titleMd, color: C.background, fontWeight: '700' }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
