import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { useStyles } from '@/styles/auth.styles';
import { Spacing, Radius, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';

type Role = 'client' | 'trainer';

export default function SignUpScreen() {
  const C = useColors();
  const styles = useStyles();
  const router = useRouter();
  const roleStyles = makeRoleStyles(C);
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState<Role>('client');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);

  async function handleSignUp() {
    if (!fullName.trim() || !email.trim() || !password) return;
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), role } },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.inner}>
          <View style={styles.brandSection}>
            <Text style={styles.brand}>FitConnect</Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.formTitle}>Check your email</Text>
            <Text style={styles.confirmText}>
              We sent a confirmation link to{'\n'}
              <Text style={styles.confirmEmail}>{email}</Text>
              {'\n\n'}Click the link to activate your account, then sign in.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(auth)/sign-in')}>
              <Text style={styles.primaryBtnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Brand */}
        <View style={styles.brandSection}>
          <Text style={styles.brand}>FitConnect</Text>
          <Text style={styles.tagline}>Track every rep. Own every PR.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Create account</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Alex Clarke"
              placeholderTextColor={C.onSurfaceVariant}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>I am a</Text>
            <View style={roleStyles.row}>
              <TouchableOpacity
                style={[roleStyles.option, role === 'client' && roleStyles.optionSelected]}
                onPress={() => setRole('client')}
                activeOpacity={0.8}>
                <Text style={[roleStyles.optionText, role === 'client' && roleStyles.optionTextSelected]}>
                  Client
                </Text>
                <Text style={[roleStyles.optionSub, role === 'client' && roleStyles.optionSubSelected]}>
                  Track my fitness
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[roleStyles.option, role === 'trainer' && roleStyles.optionSelected]}
                onPress={() => setRole('trainer')}
                activeOpacity={0.8}>
                <Text style={[roleStyles.optionText, role === 'trainer' && roleStyles.optionTextSelected]}>
                  Personal Trainer
                </Text>
                <Text style={[roleStyles.optionSub, role === 'trainer' && roleStyles.optionSubSelected]}>
                  Manage my clients
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={C.onSurfaceVariant}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              autoComplete="email"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              placeholderTextColor={C.onSurfaceVariant}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!fullName || !email || !password || loading) && styles.primaryBtnDisabled,
            ]}
            onPress={handleSignUp}
            disabled={!fullName || !email || !password || loading}>
            {loading
              ? <ActivityIndicator color={C.background} />
              : <Text style={styles.primaryBtnText}>Create Account</Text>}
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <Text style={{ textAlign: 'center', color: C.onSurfaceVariant, fontSize: 12, marginBottom: Spacing.md, lineHeight: 18 }}>
          By creating an account you agree to our{' '}
          <Text style={{ color: C.primary }} onPress={() => router.push('/terms' as any)}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={{ color: C.primary }} onPress={() => router.push('/privacy-policy' as any)}>Privacy Policy</Text>
        </Text>

        {/* Switch to sign in */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
            <Text style={styles.switchLink}>Sign in</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeRoleStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    option: {
      flex: 1,
      borderRadius: Radius.md,
      borderWidth: 1.5,
      borderColor: C.outlineVariant,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      alignItems: 'center',
    },
    optionSelected: {
      borderColor: C.primary,
      backgroundColor: C.primary + '14',
    },
    optionText: {
      ...Typography.titleMd,
      color: C.onSurfaceVariant,
    },
    optionTextSelected: {
      color: C.primary,
    },
    optionSub: {
      ...Typography.labelLg,
      color: C.onSurfaceVariant,
      marginTop: 2,
      opacity: 0.7,
    },
    optionSubSelected: {
      color: C.primary,
      opacity: 0.8,
    },
  });
}
