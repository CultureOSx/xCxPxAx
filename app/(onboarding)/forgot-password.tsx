import { View, Text, Pressable, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CultureTokens,
  gradients,
  CardTokens,
  glass,
  shadows,
  FontFamily,
  FontSize,
  TextStyles,
  Spacing,
  IconSize,
} from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

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
      const msg = code === 'auth/user-not-found'
        ? 'No account found with that email address.'
        : code === 'auth/invalid-email'
        ? 'Please enter a valid email address.'
        : 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.gradientBg}
      />

      {Platform.OS === 'web' && (
        <>
          <View style={[s.orb, { top: -100, right: -50, backgroundColor: CultureTokens.indigo, opacity: 0.5 }]} />
          <View style={[s.orb, { bottom: -50, left: -50, backgroundColor: CultureTokens.gold, opacity: 0.3 }]} />
        </>
      )}

      {isDesktop && (
        <View style={s.desktopBackRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={Spacing.sm}
            style={[s.desktopBackBtn, { backgroundColor: glass.overlay.backgroundColor, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Back to Sign In"
          >
            <Ionicons name="chevron-back" size={IconSize.md - 2} color={colors.textInverse} />
            <Text style={[s.desktopBackText, { color: colors.textInverse }]}>Back to Sign In</Text>
          </Pressable>
        </View>
      )}

      {!isDesktop && (
        <View style={[s.mobileHeader, { paddingTop: topInset + Spacing.sm + 4 }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={28} color={colors.textInverse} />
          </Pressable>
        </View>
      )}

      <KeyboardAvoidingView
        style={s.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            s.scrollContent,
            isDesktop && s.scrollContentDesktop,
            !isDesktop && { paddingTop: 20 },
          ]}
        >
          <View style={[s.formContainer, isDesktop && s.formContainerDesktop, { borderRadius: CardTokens.radiusLarge }]}>
            {Platform.OS === 'ios' || Platform.OS === 'web' ? (
              <BlurView intensity={isDesktop ? 60 : 40} tint="dark" style={[StyleSheet.absoluteFill, s.formBlur, { borderRadius: CardTokens.radiusLarge, borderColor: colors.borderLight }]} />
            ) : (
              <View style={[StyleSheet.absoluteFill, s.formBlur, { backgroundColor: glass.dark.backgroundColor, borderRadius: CardTokens.radiusLarge, borderColor: colors.borderLight }]} />
            )}

            <View style={[s.formContent, { padding: CardTokens.paddingLarge * 2 }]}>
              {!sent ? (
                <>
                  <View style={s.headerBlock}>
                    <View style={[s.iconWrapper, { backgroundColor: colors.overlay, borderColor: colors.borderLight }]}>
                      <Ionicons name="lock-open-outline" size={28} color={colors.textInverse} />
                    </View>
                    <Text style={[s.title, { color: colors.textInverse }]}>Reset Password</Text>
                    <Text style={[s.subtitle, { color: colors.textSecondary }]}>
                      Enter the email address associated with your account. We&apos;ll send you a link to reset your password.
                    </Text>
                  </View>

                  <View style={s.block}>
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

                  <View style={s.spacer} />

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    rightIcon="send"
                    loading={loading}
                    disabled={!isValid || loading}
                    onPress={handleSubmit}
                    style={[s.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold }]}
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
                  <Ionicons name="checkmark-circle" size={72} color={CultureTokens.success} style={{ marginBottom: 20 }} />
                  <Text style={[s.successTitle, { color: colors.textInverse }]}>Check Your Email</Text>
                  <Text style={[s.successSub, { color: colors.textSecondary }]}>We&apos;ve sent a password reset link to:</Text>
                  <Text style={s.emailDisplay}>{email}</Text>
                  <Text style={[s.successHint, { color: colors.textSecondary }]}>
                    If you don&apos;t see it, check your spam folder. The link expires in 24 hours.
                  </Text>

                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    leftIcon="chevron-back"
                    onPress={() => router.replace('/(onboarding)/login')}
                    style={[s.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold, marginTop: Spacing.lg }]}
                  >
                    Back to Sign In
                  </Button>

                  <Pressable
                    style={s.backRow}
                    onPress={() => Alert.alert('Email Resent', 'A new reset link has been sent to your email.')}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Resend reset email"
                  >
                    <Text style={[s.backTextSecondary, { color: colors.textSecondary }]}>
                      Didn&apos;t receive it?{' '}
                      <Text style={{ color: CultureTokens.gold, fontFamily: FontFamily.bold }}>Resend</Text>
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — static StyleSheet
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  container: { flex: 1 },
  gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.85 },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    ...Platform.select({
      web: { filter: 'blur(50px)' } as Record<string, string>,
      default: {},
    }),
  },
  keyboardAvoid: { flex: 1 },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: Spacing.sm + 4,
  },
  desktopBackRow: { position: 'absolute', top: Spacing.xl, left: Spacing.xxl, zIndex: 10 },
  desktopBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
  },
  desktopBackText: { fontFamily: FontFamily.medium, fontSize: FontSize.body2 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60, justifyContent: 'center' },
  scrollContentDesktop: { paddingVertical: 60 },
  formContainer: { width: '100%', maxWidth: 460, alignSelf: 'center', overflow: 'hidden' },
  formContainerDesktop: { maxWidth: 520 },
  formBlur: { borderWidth: 1 },
  formContent: { paddingTop: Spacing.xxl },

  headerBlock: { alignItems: 'center', marginBottom: Spacing.xl },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
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
    color: CultureTokens.gold,
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
