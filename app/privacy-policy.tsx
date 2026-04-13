import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Typography } from '@/constants/theme';

const LAST_UPDATED = '13 April 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: Spacing.xl }}>
      <Text style={{ ...Typography.titleLg, color: Colors.onSurface, marginBottom: Spacing.sm }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: string }) {
  return (
    <Text style={{ ...Typography.bodyMd, color: Colors.onSurfaceVariant, lineHeight: 22 }}>
      {children}
    </Text>
  );
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
        gap: Spacing.md,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={{ ...Typography.headlineMd, color: Colors.onSurface }}>Privacy Policy</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg }}
        showsVerticalScrollIndicator={false}>

        <Text style={{ ...Typography.labelLg, color: Colors.onSurfaceVariant, marginBottom: Spacing.xl }}>
          Last updated: {LAST_UPDATED}
        </Text>

        <Section title="1. Introduction">
          <Body>
            FitConnect ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use the FitConnect mobile application.
          </Body>
        </Section>

        <Section title="2. Information We Collect">
          <Body>
            {'Account information: name, email address, and role (client or personal trainer).\n\nFitness data: workout sessions, exercises, sets, reps, weights, and personal records.\n\nNutrition data: food logs, calorie and macro targets.\n\nBody metrics: body weight entries you log manually.\n\nHealth data: steps, active calories, sleep, and body weight read from Apple Health or Health Connect, only with your explicit permission.\n\nCommunication data: messages between trainers and clients within the app.\n\nBooking data: session availability and appointment requests.\n\nDevice data: push notification tokens for sending you alerts.'}
          </Body>
        </Section>

        <Section title="3. How We Use Your Information">
          <Body>
            {'We use your information to:\n\n• Provide and personalise the FitConnect service\n• Enable trainer-client relationships and communication\n• Display your progress, stats, and history\n• Send push notifications for workout reminders and bookings\n• Improve the app based on usage patterns\n\nWe do not sell your personal data to third parties.'}
          </Body>
        </Section>

        <Section title="4. Third-Party Services">
          <Body>
            {'Supabase — our backend database and authentication provider. Your data is stored securely on Supabase infrastructure.\n\nSpotify — if you connect your Spotify account, we access playback controls only. We do not store your Spotify credentials or listening history.\n\nApple Health / Health Connect — health data is read locally on your device with your permission and is not shared with third parties.\n\nExpo / EAS — used to deliver push notifications to your device.'}
          </Body>
        </Section>

        <Section title="5. Data Retention">
          <Body>
            Your data is retained for as long as your account is active. When you delete your account, all personal data is permanently removed from our systems within 30 days.
          </Body>
        </Section>

        <Section title="6. Your Rights">
          <Body>
            {'You have the right to:\n\n• Access the data we hold about you\n• Request correction of inaccurate data\n• Request deletion of your account and all associated data\n• Withdraw consent for health data access at any time via your device settings\n\nTo exercise these rights, use the account deletion option in the app or contact us directly.'}
          </Body>
        </Section>

        <Section title="7. Security">
          <Body>
            We use industry-standard security measures including encrypted connections (TLS), secure authentication via Supabase Auth, and row-level security policies to ensure users can only access their own data.
          </Body>
        </Section>

        <Section title="8. Children">
          <Body>
            FitConnect is not intended for users under the age of 13. We do not knowingly collect personal information from children.
          </Body>
        </Section>

        <Section title="9. Changes to This Policy">
          <Body>
            We may update this Privacy Policy from time to time. We will notify you of significant changes via the app. Continued use of FitConnect after changes constitutes acceptance of the updated policy.
          </Body>
        </Section>

        <Section title="10. Contact Us">
          <Body>
            If you have any questions about this Privacy Policy or your data, please contact us at: support@fitconnect.app
          </Body>
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}
