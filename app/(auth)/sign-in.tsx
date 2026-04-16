import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { useStyles } from '@/styles/auth.styles';
import { useColors } from '@/contexts/ThemeContext';

export default function SignInScreen() {
  const C = useColors();
  const styles = useStyles();
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSignIn() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    setLoading(false);
    if (error) {
      setError(error.message);
    }
    // Auth state change in _layout.tsx handles the redirect automatically
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
          <Text style={styles.formTitle}>Sign in</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
              placeholder="••••••••"
              placeholderTextColor={C.onSurfaceVariant}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, (!email || !password || loading) && styles.primaryBtnDisabled]}
            onPress={handleSignIn}
            disabled={!email || !password || loading}>
            {loading
              ? <ActivityIndicator color={C.background} />
              : <Text style={styles.primaryBtnText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        {/* Switch to sign up */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
            <Text style={styles.switchLink}>Sign up</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
