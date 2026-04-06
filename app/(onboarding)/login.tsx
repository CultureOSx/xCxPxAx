import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CultureTokens,
  CardTokens,
  shadows,
  FontFamily,
  FontSize,
  TextStyles,
  Spacing,
  IconSize,
  LiquidGlassTokens,
  LiquidGlassAccents,
} from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import Animated, { FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated';
import { useLogin } from '@/hooks/useLogin';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { SocialButton } from '@/components/ui/SocialButton';
import { LinearGradient } from 'expo-linear-gradient';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import { BrandWordmark } from '@/components/ui/BrandWordmark';
import {
  AuthAmbientBackground,
  AuthLiquidFormCard,
  AuthDesktopBackPill,
  AuthMobileHeader,
} from '@/components/onboarding/AuthScreenPrimitives';

export default function LoginScreen() {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const {
    email,
    setEmail,
    password,
    setPassword,
    emailError,
    passwordError,
    globalError,
    loading,
    rememberMe,
    setRememberMe,
    isValid,
    clearErrors,
    handleGoogleSignIn,
    handleAppleSignIn,
    handleLogin,
  } = useLogin(redirectTo);

  const enterUp = reducedMotion
    ? undefined
    : FadeInUp.springify()
        .damping(LiquidGlassTokens.entranceSpring.damping)
        .stiffness(LiquidGlassTokens.entranceSpring.stiffness);
  const enter = (delay: number) =>
    reducedMotion
      ? undefined
      : FadeInDown.delay(delay)
          .springify()
          .damping(LiquidGlassTokens.entranceSpring.damping)
          .stiffness(LiquidGlassTokens.entranceSpring.stiffness);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AuthAmbientBackground />

      {isDesktop ? (
        <AuthDesktopBackPill label="Back to Discover" onPress={() => router.replace('/(tabs)')} />
      ) : (
        <AuthMobileHeader
          variant="close-with-brand"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        />
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
              <View style={styles.logoRow}>
                <View style={[styles.logoCircle, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}>
                  <LinearGradient
                    colors={[colors.primaryGlow, 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Ionicons name="globe-outline" size={IconSize.xl} color={colors.primary} />
                </View>
                <BrandWordmark size="lg" withTagline centered />
              </View>

              <Animated.Text entering={enter(80)} style={[styles.title, { color: colors.text }]}>
                Welcome back.
              </Animated.Text>
              <Animated.Text entering={enter(120)} style={[styles.subtitle, { color: colors.textSecondary }]}>
                Sign in to continue your cultural journey.
              </Animated.Text>

              {globalError ? (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: LiquidGlassAccents.errorBannerFill,
                      borderColor: LiquidGlassAccents.errorBannerBorder,
                    },
                  ]}
                  accessibilityRole="alert"
                >
                  <Ionicons name="alert-circle" size={IconSize.md} color={colors.error} />
                  <Text style={[styles.globalErrorText, { color: colors.error }]}>{globalError}</Text>
                </View>
              ) : null}

              <Animated.View entering={enter(180)} style={styles.form}>
                <View style={styles.inputGroup}>
                  <Input
                    label="Email Address"
                    placeholder="name@culturepass.app"
                    leftIcon="mail-outline"
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      clearErrors();
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="next"
                    error={emailError}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.passwordHeader}>
                    <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                    <Pressable
                      hitSlop={12}
                      onPress={() => router.push(routeWithRedirect('/(onboarding)/forgot-password', redirectTo) as string)}
                      accessibilityRole="link"
                      accessibilityLabel="Forgot password"
                    >
                      <Text style={[styles.forgotText, { color: CultureTokens.gold }]}>Forgot Password?</Text>
                    </Pressable>
                  </View>
                  <Input
                    placeholder="Enter password"
                    leftIcon="lock-closed-outline"
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      clearErrors();
                    }}
                    passwordToggle
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    error={passwordError}
                  />
                </View>
              </Animated.View>

              <Animated.View entering={enter(240)} style={styles.optionsRow}>
                <Checkbox checked={rememberMe} onToggle={setRememberMe} label="Keep me signed in" />
              </Animated.View>

              <Animated.View entering={enter(300)}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  haptic
                  rightIcon="arrow-forward"
                  loading={loading}
                  disabled={!isValid || loading}
                  onPress={handleLogin}
                  style={[styles.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold }]}
                  accessibilityLabel="Sign in"
                >
                  Sign In
                </Button>
              </Animated.View>

              <Animated.View entering={enter(360)} style={styles.socialDivider}>
                <View style={[styles.divLine, { backgroundColor: colors.borderLight }]} />
                <Text style={[styles.divText, { color: colors.textSecondary }]}>or</Text>
                <View style={[styles.divLine, { backgroundColor: colors.borderLight }]} />
              </Animated.View>

              <Animated.View entering={enter(420)} style={styles.socialRow}>
                <SocialButton provider="google" onPress={handleGoogleSignIn} disabled={loading} />
                {Platform.OS === 'ios' ? (
                  <SocialButton provider="apple" onPress={handleAppleSignIn} disabled={loading} />
                ) : (
                  <SocialButton provider="apple" comingSoon disabled={loading} />
                )}
              </Animated.View>

              <Animated.View entering={enter(500)}>
                <Pressable
                  style={styles.switchRow}
                  onPress={() => router.replace(routeWithRedirect('/(onboarding)/signup', redirectTo) as string)}
                  hitSlop={12}
                  accessibilityRole="link"
                  accessibilityLabel="Sign up for an account"
                >
                  <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                    Don&apos;t have an account?{' '}
                    <Text style={[styles.switchLink, { color: CultureTokens.gold }]}>Sign Up</Text>
                  </Text>
                </Pressable>
              </Animated.View>
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
  logoRow: { alignItems: 'center', marginBottom: 28, gap: 6 },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  title: {
    ...TextStyles.display,
    fontSize: 34,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...TextStyles.callout,
    textAlign: 'center',
    marginBottom: 36,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: CardTokens.radius,
    marginBottom: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  globalErrorText: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.body2 },
  form: { gap: 20, marginBottom: Spacing.lg },
  inputGroup: { gap: Spacing.sm },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: FontFamily.semibold, fontSize: FontSize.body2 },
  forgotText: { fontFamily: FontFamily.semibold, fontSize: FontSize.chip },
  optionsRow: { marginBottom: 36 },
  submitBtn: { height: 56, borderRadius: CardTokens.radius },
  socialDivider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: 28 },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  divText: { fontFamily: FontFamily.medium, fontSize: FontSize.body2 },
  socialRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: 36 },
  switchRow: { alignItems: 'center', paddingVertical: Spacing.sm },
  switchText: { fontFamily: FontFamily.regular, fontSize: FontSize.callout },
  switchLink: { fontFamily: FontFamily.bold },
});
