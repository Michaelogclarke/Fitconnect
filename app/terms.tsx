import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';

const LAST_UPDATED = '13 April 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const C = useColors();
  return (
    <View style={{ marginBottom: Spacing.xl }}>
      <Text style={{ ...Typography.titleLg, color: C.onSurface, marginBottom: Spacing.sm }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: string }) {
  const C = useColors();
  return (
    <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant, lineHeight: 22 }}>
      {children}
    </Text>
  );
}

export default function TermsScreen() {
  const C = useColors();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top', 'bottom']}>
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
        <Text style={{ ...Typography.headlineMd, color: C.onSurface }}>Terms of Service</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg }}
        showsVerticalScrollIndicator={false}>

        <Text style={{ ...Typography.labelLg, color: C.onSurfaceVariant, marginBottom: Spacing.xl }}>
          Last updated: {LAST_UPDATED}
        </Text>

        <Section title="1. Acceptance of Terms">
          <Body>
            By creating an account and using FitConnect, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.
          </Body>
        </Section>

        <Section title="2. Use of the Service">
          <Body>
            {'FitConnect is a fitness tracking platform for individuals and personal trainers. You agree to:\n\n• Provide accurate information when creating your account\n• Keep your login credentials secure\n• Use the app only for lawful purposes\n• Not attempt to access other users\' data\n• Not reverse engineer or misuse the platform'}
          </Body>
        </Section>

        <Section title="3. Trainer-Client Relationships">
          <Body>
            FitConnect facilitates connections between personal trainers and their clients. We are not responsible for the quality of training services provided. Any disputes between trainers and clients are to be resolved between the parties directly.
          </Body>
        </Section>

        <Section title="4. Health Disclaimer">
          <Body>
            FitConnect is a fitness tracking tool and is not a medical service. Nothing in the app constitutes medical advice. Always consult a qualified healthcare professional before starting a new exercise or nutrition programme. We are not liable for any injury, illness, or health outcome arising from use of the app.
          </Body>
        </Section>

        <Section title="5. User Content">
          <Body>
            You retain ownership of all data you enter into FitConnect (workouts, nutrition logs, messages, etc.). By using the service you grant us a limited licence to store and process this data solely to provide the service to you.
          </Body>
        </Section>

        <Section title="6. Account Termination">
          <Body>
            You may delete your account at any time from within the app. We reserve the right to suspend or terminate accounts that violate these Terms. Upon deletion, your data will be permanently removed within 30 days.
          </Body>
        </Section>

        <Section title="7. Limitation of Liability">
          <Body>
            To the maximum extent permitted by law, FitConnect shall not be liable for any indirect, incidental, or consequential damages arising from your use of the app. Our total liability shall not exceed the amount you paid us in the 12 months prior to the claim.
          </Body>
        </Section>

        <Section title="8. Changes to Terms">
          <Body>
            We may update these Terms from time to time. We will notify you of material changes via the app. Continued use after notification constitutes acceptance of the updated Terms.
          </Body>
        </Section>

        <Section title="9. Governing Law">
          <Body>
            These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
          </Body>
        </Section>

        <Section title="10. Contact">
          <Body>
            For questions about these Terms, contact us at: mocupsolutions@gmail.com
          </Body>
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}
