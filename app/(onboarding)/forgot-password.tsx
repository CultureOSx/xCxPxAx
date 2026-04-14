import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated';

import {
  CultureTokens,
  CardTokens,
  shadows,
  FontFamily,
  FontSize,
  TextStyles,
  Spacing,
  LiquidGlassTokens,
} from '@/constants/theme';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';

import {
  AuthAmbientBackground,
  AuthLiquidFormCard,
  AuthDesktopBackPill,
  AuthMobileHeader,
} from '@/components/onboarding/AuthScreenPrimitives';

const RESET_EMAIL_ACTION_SETTINGS = {
  url: `${(process.env.EXPO_PUBLIC_APP_URL ?? 'https://culturepass.app').replace(/\/+$/, '')}/login`,
  handleCodeInApp: false,
};

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = email.includes('@') && email.includes('.');

  const enterUp = reducedMotion
    ? undefined
    : FadeInUp.springify()
        .damping(LiquidGlassTokens.entranceSpring.damping)
        .stiffness(LiquidGlassTokens.entranceSpring.stiffness);

  const handleSubmit = async () => {
    if (!isValid) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase(), RESET_EMAIL_ACTION_SETTINGS);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setSent(true);
    } catch (err: unknown) {
      const code = (err as any)?.code as string | undefined;
      let msg = 'Something went wrong. Please try again.';

      if (code === 'auth/user-not-found') {
        msg = 'No account found with that email address.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }

      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isValid) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase(), RESET_EMAIL_ACTION_SETTINGS);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Email Sent', 'A new reset link has been sent to your email.');
    } catch {
      Alert.alert('Error', 'Could not resend the email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <AuthAmbientBackground />

      {isDesktop ? (
        <AuthDesktopBackPill
          label="Back to Sign In"
          onPress={() => router.back()}
        />
      ) : (
        <AuthMobileHeader
          variant="back-only"
          onPress={() => router.back()}
        />
      )}

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[
          s.scrollContent,
          isDesktop && s.scrollContentDesktop,
          { paddingBottom: 60 + (Platform.OS === 'web' ? 0 : insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={enterUp} style={s.cardWrap}>
          <AuthLiquidFormCard isDesktop={isDesktop}>
            {!sent ? (
              <>
                <View style={s.headerBlock}>
                  <View
                    style={[
                      s.iconWrapper,
                      { backgroundColor: colors.primarySoft, borderColor: colors.borderLight },
                    ]}
                  >
                    <Ionicons name="lock-open-outline" size={28} color={colors.primary} />
                  </View>
                  <Text style={[s.title, { color: colors.text }]}>Reset Password</Text>
                  <Text style={[s.subtitle, { color: colors.textSecondary }]}>
                    Enter the email address associated with your account. We&apos;ll send you a link to reset your password.
                  </Text>
                </View>

                <Input
                  label="Email Address"
                  placeholder="you@example.com"
                  leftIcon="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />

                <View style={s.spacer} />

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  haptic
                  rightIcon="send"
                  loading={loading}
                  disabled={!isValid || loading}
                  onPress={handleSubmit}
                  style={[s.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold }]}
                  accessibilityLabel="Send password reset link"
                >
                  Send Reset Link
                </Button>

                {!isDesktop && (
                  <Pressable
                    style={s.backRow}
                    onPress={() => router.back()}
                    hitSlop={12}
                    accessibilityRole="link"
                    accessibilityLabel="Back to Sign In"
                  >
                    <Text style={[s.backText, { color: CultureTokens.gold }]}>Back to Sign In</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <View style={s.successContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={72}
                  color={colors.success}
                  style={{ marginBottom: Spacing.lg }}
                />
                <Text style={[s.successTitle, { color: colors.text }]}>Check Your Email</Text>
                <Text style={[s.successSub, { color: colors.textSecondary }]}>
                  We&apos;ve sent a password reset link to:
                </Text>
                <Text style={[s.emailDisplay, { color: colors.gold }]}>{email}</Text>
                <Text style={[s.successHint, { color: colors.textSecondary }]}>
                  If you don&apos;t see it, check your spam folder. The link expires in 24 hours.
                </Text>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  haptic
                  leftIcon="chevron-back"
                  onPress={() => router.replace('/(onboarding)/login')}
                  style={[s.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold, marginTop: Spacing.lg }]}
                  accessibilityLabel="Back to sign in"
                >
                  Back to Sign In
                </Button>

                <Pressable
                  style={s.resendRow}
                  onPress={handleResend}
                  hitSlop={12}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Resend reset email"
                >
                  <Text style={[s.resendText, { color: colors.textSecondary }]}>
                    Didn&apos;t receive it?{' '}
                    <Text style={{ color: CultureTokens.gold, fontFamily: FontFamily.bold }}>
                      Resend
                    </Text>
                  </Text>
                </Pressable>
              </View>
            )}
          </AuthLiquidFormCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  scrollContentDesktop: { paddingVertical: 60 },

  cardWrap: { width: '100%', maxWidth: 420, alignSelf: 'center' },

  headerBlock: { alignItems: 'center', marginBottom: Spacing.xl },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  title: {
    ...TextStyles.display,
    fontSize: 32,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...TextStyles.callout,
    textAlign: 'center',
  },

  spacer: { height: Spacing.xl },

  submitBtn: { height: 56, borderRadius: CardTokens.radius },

  backRow: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  backText: { fontFamily: FontFamily.semibold, fontSize: FontSize.callout },

  successContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    ...TextStyles.hero,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  successSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    textAlign: 'center',
  },
  emailDisplay: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.title3,
    marginVertical: Spacing.md,
    textAlign: 'center',
  },
  successHint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  resendRow: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
  },
  resendText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    textAlign: 'center',
  },
});