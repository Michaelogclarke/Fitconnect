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
import { styles } from '@/styles/auth.styles';
import { Colors } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
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
      options: { data: { full_name: fullName.trim() } },
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
              placeholderTextColor={Colors.onSurfaceVariant}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.onSurfaceVariant}
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
              placeholderTextColor={Colors.onSurfaceVariant}
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
              ? <ActivityIndicator color={Colors.background} />
              : <Text style={styles.primaryBtnText}>Create Account</Text>}
          </TouchableOpacity>
        </View>

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
