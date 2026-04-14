import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/contexts/ThemeContext';
import { useStyles } from '@/styles/edit-profile.styles';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/format';
import { setCached, getCachedAny, CACHE_KEYS } from '@/lib/cache';

export default function EditProfileScreen() {
  const C = useColors();
  const styles = useStyles();
  const router = useRouter();

  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [fullName,  setFullName]  = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    // Show cached value instantly while fetching fresh
    const cached = await getCachedAny<{ fullName: string; totalSessions: number }>(CACHE_KEYS.PROFILE);
    if (cached?.fullName) setFullName(cached.fullName);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (data?.full_name) setFullName(data.full_name);
    } catch {}

    setLoading(false);
  }

  async function handleSave() {
    const trimmed = fullName.trim();
    if (!trimmed) { setError('Name cannot be empty'); return; }

    setSaving(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ full_name: trimmed })
        .eq('id', user.id);
      if (updateErr) throw updateErr;

      // Update cache so profile screen reflects new name immediately
      const cached = await getCachedAny<{ fullName: string; totalSessions: number }>(CACHE_KEYS.PROFILE);
      if (cached) {
        await setCached(CACHE_KEYS.PROFILE, { ...cached, fullName: trimmed });
      }

      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save. Please try again.');
      setSaving(false);
    }
  }

  const avatarLabel = fullName.trim() ? initials(fullName.trim()) : '?';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} disabled={saving}>
            <IconSymbol name="chevron.left" size={20} color={C.onSurfaceVariant} />
            <Text style={styles.backText}>Profile</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Edit Profile</Text>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color={C.primary} />
              : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLabel}</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Personal</Text>
            <View style={styles.formCard}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                {loading ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : (
                  <TextInput
                    style={styles.fieldInput}
                    value={fullName}
                    onChangeText={(t) => { setFullName(t); setError(''); }}
                    placeholder="Your name"
                    placeholderTextColor={C.onSurfaceVariant}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
                  />
                )}
              </View>
            </View>

            {!!error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
