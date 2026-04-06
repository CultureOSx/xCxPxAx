import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
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
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated';
import {
  AuthAmbientBackground,
  AuthLiquidFormCard,
  AuthDesktopBackPill,
  AuthMobileHeader,
} from '@/components/onboarding/AuthScreenPrimitives';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = email.includes('@') && email.includes('.');

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch (err: unknown) {
      const code = (err as Record<string, unknown>)?.code as string | undefined;
      const msg =
        code === 'auth/user-not-found'
          ? 'No account found with that email address.'
          : code === 'auth/invalid-email'
            ? 'Please enter a valid email address.'
            : 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const enterUp = reducedMotion
    ? undefined
    : FadeInUp.springify()
        .damping(LiquidGlassTokens.entranceSpring.damping)
        .stiffness(LiquidGlassTokens.entranceSpring.stiffness);

  const handleResend = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Email sent', 'A new reset link has been sent to your email.');
    } catch {
      Alert.alert('Error', 'Could not resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AuthAmbientBackground />

      {isDesktop ? (
        <AuthDesktopBackPill label="Back to Sign In" onPress={() => router.back()} />
      ) : (
        <AuthMobileHeader variant="back-only" onPress={() => router.back()} />
      )}

      <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.scrollContentDesktop,
            !isDesktop && { paddingTop: 12 },
            { paddingBottom: 60 + (Platform.OS === 'web' ? 0 : insets.bottom) },
          ]}
        >
          <Animated.View entering={enterUp} style={styles.cardWrap}>
            <AuthLiquidFormCard isDesktop={isDesktop}>
              {!sent ? (
                <>
                  <View style={styles.headerBlock}>
                    <View style={[styles.iconWrapper, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}>
                      <Ionicons name="lock-open-outline" size={28} color={colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                      Enter the email address associated with your account. We&apos;ll send you a link to reset your password.
                    </Text>
                  </View>

                  <View style={styles.block}>
                    <Input
                      label="Email Address"
                      placeholder="you@example.com"
                      leftIcon="mail-outline"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>

                  <View style={styles.spacer} />

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    haptic
                    rightIcon="send"
                    loading={loading}
                    disabled={!isValid || loading}
                    onPress={handleSubmit}
                    style={[styles.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold }]}
                    accessibilityLabel="Send password reset link"
                  >
                    Send Reset Link
                  </Button>

                  {!isDesktop ? (
                    <Pressable
                      style={styles.backRow}
                      onPress={() => router.back()}
                      hitSlop={12}
                      accessibilityRole="link"
                      accessibilityLabel="Back to Sign In"
                    >
                      <Text style={[styles.backText, { color: CultureTokens.gold }]}>Back to Sign In</Text>
                    </Pressable>
                  ) : null}
                </>
              ) : (
                <View style={styles.successContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={72}
                    color={colors.success}
                    style={{ marginBottom: Spacing.lg }}
                  />
                  <Text style={[styles.successTitle, { color: colors.text }]}>Check Your Email</Text>
                  <Text style={[styles.successSub, { color: colors.textSecondary }]}>We&apos;ve sent a password reset link to:</Text>
                  <Text style={[styles.emailDisplay, { color: colors.gold }]}>{email}</Text>
                  <Text style={[styles.successHint, { color: colors.textSecondary }]}>
                    If you don&apos;t see it, check your spam folder. The link expires in 24 hours.
                  </Text>

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    haptic
                    leftIcon="chevron-back"
                    onPress={() => router.replace('/(onboarding)/login')}
                    style={[styles.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold, marginTop: Spacing.lg }]}
                    accessibilityLabel="Back to sign in"
                  >
                    Back to Sign In
                  </Button>

                  <Pressable
                    style={styles.backRow}
                    onPress={handleResend}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Resend reset email"
                    disabled={loading}
                  >
                    <Text style={[styles.backTextSecondary, { color: colors.textSecondary }]}>
                      Didn&apos;t receive it?{' '}
                      <Text style={{ color: CultureTokens.gold, fontFamily: FontFamily.bold }}>Resend</Text>
                    </Text>
                  </Pressable>
                </View>
              )}
            </AuthLiquidFormCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, justifyContent: 'center' },
  scrollContentDesktop: { paddingVertical: 60 },
  cardWrap: { width: '100%' },
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
  block: { marginBottom: Spacing.md },
  spacer: { height: Spacing.md },
  submitBtn: { height: 56, borderRadius: CardTokens.radius },
  backRow: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm + 4 },
  backText: { fontFamily: FontFamily.semibold, fontSize: FontSize.callout },
  backTextSecondary: { fontFamily: FontFamily.regular, fontSize: FontSize.body2 },
  successContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  successTitle: {
    ...TextStyles.hero,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  successSub: { fontFamily: FontFamily.regular, fontSize: FontSize.body, textAlign: 'center' },
  emailDisplay: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.title3,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  successHint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
});
