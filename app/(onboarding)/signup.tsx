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
import { router } from 'expo-router';
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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { SocialButton } from '@/components/ui/SocialButton';
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator';
import { LinearGradient } from 'expo-linear-gradient';
import { routeWithRedirect } from '@/lib/routes';
import { BrandWordmark } from '@/components/ui/BrandWordmark';
import { useSignup } from '@/hooks/useSignup';
import Animated, { FadeInUp, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { HapticManager } from '@/lib/haptics';
import {
  AuthAmbientBackground,
  AuthLiquidFormCard,
  AuthDesktopBackPill,
  AuthMobileHeader,
} from '@/components/onboarding/AuthScreenPrimitives';

export default function SignUpScreen() {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    agreed,
    setAgreed,
    role,
    setRole,
    nameError,
    emailError,
    passwordError,
    globalError,
    loading,
    isValid,
    clearErrors,
    handleGoogleSignUp,
    handleAppleSignUp,
    handleSignUp,
    redirectTo,
  } = useSignup();

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
          variant="close-only"
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
              <Animated.View entering={enter(60)} style={styles.logoRow}>
                <View style={[styles.logoCircle, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}>
                  <LinearGradient
                    colors={[colors.primaryGlow, 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Ionicons name="globe-outline" size={IconSize.xl} color={colors.primary} />
                </View>
                <BrandWordmark size="md" withTagline centered />
              </Animated.View>

              <Animated.Text entering={enter(100)} style={[styles.title, { color: colors.text }]}>
                Create Account.
              </Animated.Text>
              <Animated.Text entering={enter(130)} style={[styles.benefitsRow, { color: CultureTokens.gold }]}>
                Free events · Community access · Exclusive perks
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

              <Animated.View entering={enter(180)} style={styles.roleToggleGroup}>
                <Text style={[styles.roleLabel, { color: colors.textSecondary }]}>I want to...</Text>
                <View style={styles.roleRow}>
                  <Pressable
                    style={[
                      styles.roleOption,
                      role === 'user'
                        ? { backgroundColor: colors.primarySoft, borderColor: colors.primary }
                        : { backgroundColor: 'transparent', borderColor: colors.borderLight },
                    ]}
                    onPress={() => {
                      setRole('user');
                      HapticManager.light();
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: role === 'user' }}
                    accessibilityLabel="Discover Events"
                  >
                    <Ionicons
                      name="compass-outline"
                      size={IconSize.md}
                      color={role === 'user' ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.roleOptionText,
                        role === 'user'
                          ? { color: colors.text, fontFamily: FontFamily.semibold }
                          : { color: colors.textSecondary },
                      ]}
                    >
                      Discover Events
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.roleOption,
                      role === 'organizer'
                        ? { backgroundColor: colors.primarySoft, borderColor: colors.primary }
                        : { backgroundColor: 'transparent', borderColor: colors.borderLight },
                    ]}
                    onPress={() => {
                      setRole('organizer');
                      HapticManager.light();
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: role === 'organizer' }}
                    accessibilityLabel="Host Events"
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={IconSize.md}
                      color={role === 'organizer' ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.roleOptionText,
                        role === 'organizer'
                          ? { color: colors.text, fontFamily: FontFamily.semibold }
                          : { color: colors.textSecondary },
                      ]}
                    >
                      Host Events
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>

              <Animated.View entering={enter(240)} style={styles.form}>
                <View style={styles.inputGroup}>
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    leftIcon="person-outline"
                    value={name}
                    onChangeText={(v) => {
                      setName(v);
                      clearErrors();
                    }}
                    autoCapitalize="words"
                    returnKeyType="next"
                    error={nameError}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Input
                    label="Email Address"
                    placeholder="you@example.com"
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
                  <Input
                    label="Password"
                    placeholder="Min. 6 characters"
                    leftIcon="lock-closed-outline"
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      clearErrors();
                    }}
                    passwordToggle
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                    error={passwordError}
                  />
                  {password.length > 0 ? <PasswordStrengthIndicator password={password} /> : null}
                </View>
              </Animated.View>

              <Animated.View entering={enter(300)} style={styles.optionsRow}>
                <Checkbox
                  checked={agreed}
                  onToggle={(v) => {
                    setAgreed(v);
                    clearErrors();
                  }}
                  label={
                    <Text style={[styles.checkText, { color: colors.text }]}>
                      I agree to the{' '}
                      <Text style={[styles.linkText, { color: CultureTokens.gold }]} onPress={() => router.push('/legal/terms')}>
                        Terms
                      </Text>
                      {' & '}
                      <Text style={[styles.linkText, { color: CultureTokens.gold }]} onPress={() => router.push('/legal/privacy')}>
                        Privacy
                      </Text>
                    </Text>
                  }
                />
              </Animated.View>

              <Animated.View entering={enter(360)}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  haptic
                  rightIcon="arrow-forward"
                  loading={loading}
                  disabled={!isValid || loading}
                  onPress={handleSignUp}
                  style={[styles.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold }]}
                  accessibilityLabel="Create account"
                >
                  Create Account
                </Button>
              </Animated.View>

              <Animated.View entering={enter(420)} style={styles.socialDivider}>
                <View style={[styles.divLine, { backgroundColor: colors.borderLight }]} />
                <Text style={[styles.divText, { color: colors.textSecondary }]}>or sign up with</Text>
                <View style={[styles.divLine, { backgroundColor: colors.borderLight }]} />
              </Animated.View>

              <Animated.View entering={enter(480)} style={styles.socialRow}>
                <SocialButton provider="google" onPress={handleGoogleSignUp} disabled={loading} />
                {Platform.OS === 'ios' ? (
                  <SocialButton provider="apple" onPress={handleAppleSignUp} disabled={loading} />
                ) : (
                  <SocialButton provider="apple" comingSoon disabled={loading} />
                )}
              </Animated.View>

              <Animated.View entering={enter(540)}>
                <Pressable
                  style={styles.switchRow}
                  onPress={() => router.replace(routeWithRedirect('/(onboarding)/login', redirectTo) as string)}
                  hitSlop={12}
                  accessibilityRole="link"
                  accessibilityLabel="Sign in to existing account"
                >
                  <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                    Already have an account? <Text style={[styles.switchLink, { color: CultureTokens.gold }]}>Sign In</Text>
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
  logoRow: { alignItems: 'center', marginBottom: 20 },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  title: {
    ...TextStyles.display,
    fontSize: 34,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  benefitsRow: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.chip,
    textAlign: 'center',
    marginBottom: Spacing.xl,
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
  roleToggleGroup: { marginBottom: 20 },
  roleLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.chip,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: CardTokens.radius,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  roleOptionText: { fontFamily: FontFamily.medium, fontSize: FontSize.body2 },
  form: { gap: 20, marginBottom: 20 },
  inputGroup: { gap: Spacing.sm },
  optionsRow: { marginBottom: Spacing.xl },
  checkText: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.chip, lineHeight: 20 },
  linkText: { fontFamily: FontFamily.semibold },
  submitBtn: { height: 56, borderRadius: CardTokens.radius },
  socialDivider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  divText: { fontFamily: FontFamily.medium, fontSize: FontSize.body2 },
  socialRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  switchRow: { alignItems: 'center', paddingVertical: Spacing.sm },
  switchText: { fontFamily: FontFamily.regular, fontSize: FontSize.callout },
  switchLink: { fontFamily: FontFamily.bold },
});
