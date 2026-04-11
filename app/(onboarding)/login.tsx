import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useReducedMotion,
} from 'react-native-reanimated';

import { useLogin } from '@/hooks/useLogin';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { SocialButton } from '@/components/ui/SocialButton';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';

import {
  CardTokens,
  CultureTokens,
  FontFamily,
  FontSize,
  IconSize,
  LiquidGlassAccents,
  LiquidGlassTokens,
  Spacing,
  TextStyles,
  shadows,
} from '@/constants/theme';

import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import { BrandWordmark } from '@/components/ui/BrandWordmark';
import {
  AuthAmbientBackground,
  AuthDesktopBackPill,
  AuthLiquidFormCard,
  AuthMobileHeader,
} from '@/components/onboarding/AuthScreenPrimitives';

export default function LoginScreen() {
  const colors = useColors();
  const { isDesktop, isWeb } = useLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(
    searchParams.redirectTo ?? searchParams.redirect,
  );

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

  const padBottom = isWeb ? 40 : 64 + insets.bottom;

  const formContent = (
    <View style={s.cardInner}>
      {/* Brand */}
      <Animated.View entering={enter(40)} style={s.brandBlock}>
        <View
          style={[
            s.brandIcon,
            { backgroundColor: colors.primarySoft, borderColor: colors.borderLight },
          ]}
        >
          <Ionicons name="globe-outline" size={IconSize.xl} color={colors.primary} />
        </View>
        <BrandWordmark size="lg" withTagline centered taglineColor={CultureTokens.coral} />
      </Animated.View>

      {/* Copy */}
      <Animated.View entering={enter(90)}>
        <Text style={[s.title, { color: colors.text }]}>Welcome back.</Text>
      </Animated.View>
      <Animated.View entering={enter(120)}>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          Sign in to continue your cultural journey.
        </Text>
      </Animated.View>

      <Animated.View
        entering={enter(150)}
        style={[
          s.benefitsPill,
          { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
        ]}
      >
        <Text style={[s.benefitsText, { color: colors.textSecondary }]}>
          Events · Communities · Perks
        </Text>
      </Animated.View>

      {/* Global Error */}
      {globalError ? (
        <Animated.View
          entering={enter(180)}
          style={[
            s.errorBanner,
            {
              backgroundColor: LiquidGlassAccents.errorBannerFill,
              borderColor: LiquidGlassAccents.errorBannerBorder,
            },
          ]}
          accessibilityRole="alert"
        >
          <Ionicons name="alert-circle" size={IconSize.md} color={colors.error} />
          <Text style={[s.globalErrorText, { color: colors.error }]}>{globalError}</Text>
        </Animated.View>
      ) : null}

      {/* Form */}
      <Animated.View entering={enter(220)} style={s.form}>
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
          autoComplete="email"
          textContentType="username"
          keyboardType="email-address"
          returnKeyType="next"
          error={emailError}
        />

        <View style={s.passwordHeader}>
          <Text style={[s.passwordLabel, { color: colors.text }]}>Password</Text>
          <Pressable
            hitSlop={12}
            onPress={() =>
              router.push(routeWithRedirect('/(onboarding)/forgot-password', redirectTo) as string)
            }
            accessibilityRole="link"
            accessibilityLabel="Forgot password"
          >
            <Text style={[s.forgotText, { color: colors.primary }]}>Forgot?</Text>
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
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          error={passwordError}
        />

        <View style={s.optionsRow}>
          <Checkbox checked={rememberMe} onToggle={setRememberMe} label="Keep me signed in" />
        </View>

        <Button
          variant="gold"
          size="lg"
          fullWidth
          haptic
          rightIcon="arrow-forward"
          loading={loading}
          disabled={!isValid || loading}
          onPress={handleLogin}
          style={[s.submitBtn, shadows.medium]}
          accessibilityLabel="Sign in"
        >
          Sign In
        </Button>
      </Animated.View>

      {/* Social Divider */}
      <Animated.View entering={enter(320)} style={s.socialDivider}>
        <View style={[s.divLine, { backgroundColor: colors.borderLight }]} />
        <Text style={[s.divText, { color: colors.textSecondary }]}>or</Text>
        <View style={[s.divLine, { backgroundColor: colors.borderLight }]} />
      </Animated.View>

      {/* Social Buttons */}
      <Animated.View entering={enter(360)} style={s.socialRow}>
        <SocialButton provider="google" onPress={handleGoogleSignIn} disabled={loading} />
        {Platform.OS === 'ios' ? (
          <SocialButton provider="apple" onPress={handleAppleSignIn} disabled={loading} />
        ) : (
          <SocialButton provider="apple" comingSoon disabled={loading} />
        )}
      </Animated.View>

      {/* Switch to Signup */}
      <Animated.View entering={enter(420)}>
        <Pressable
          style={s.switchRow}
          onPress={() =>
            router.replace(routeWithRedirect('/(onboarding)/signup', redirectTo) as string)
          }
          hitSlop={12}
          accessibilityRole="link"
          accessibilityLabel="Sign up for an account"
        >
          <Text style={[s.switchText, { color: colors.textSecondary }]}>
            Don&apos;t have an account?{' '}
            <Text style={[s.switchLink, { color: colors.primary }]}>Sign Up</Text>
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <AuthAmbientBackground />

      {isDesktop ? (
        <AuthDesktopBackPill label="Back to Discover" onPress={() => router.replace('/(tabs)')} />
      ) : (
        <AuthMobileHeader
          variant="close-with-brand"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        />
      )}

      <KeyboardAwareScrollViewCompat
        style={s.keyboardAvoid}
        contentContainerStyle={[
          s.scrollContent,
          isDesktop && s.scrollContentDesktop,
          { paddingBottom: padBottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isWeb && isDesktop ? (
          <View style={s.webRow}>
            {/* Marketing Column */}
            <View style={s.webLeft}>
              <Animated.View entering={enter(40)} style={s.webKickerRow}>
                <View style={[s.webDot, { backgroundColor: CultureTokens.gold }]} />
                <Text style={[s.webKicker, { color: colors.textSecondary }]}>CulturePass</Text>
              </Animated.View>

              <Animated.View entering={enter(70)}>
                <Text style={[s.webHeadline, { color: colors.text }]}>Belong anywhere.</Text>
              </Animated.View>

              <Animated.View entering={enter(100)}>
                <Text style={[s.webLead, { color: colors.textSecondary }]}>
                  A premium cultural lifestyle marketplace — find events, communities, and local places built for diaspora cities.
                </Text>
              </Animated.View>

              <Animated.View entering={enter(130)} style={s.webValueGrid}>
                {[
                  { icon: 'calendar-outline' as const, title: 'Events', desc: 'Discover what’s on this week.' },
                  { icon: 'people-outline' as const, title: 'Communities', desc: 'Join and share with your people.' },
                  { icon: 'gift-outline' as const, title: 'Perks', desc: 'Member-only rewards & offers.' },
                ].map((item) => (
                  <View
                    key={item.title}
                    style={[
                      s.webValueCard,
                      { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                    ]}
                  >
                    <View style={[s.webValueIcon, { backgroundColor: CultureTokens.indigo + '1E' }]}>
                      <Ionicons name={item.icon} size={18} color={CultureTokens.indigo} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[s.webValueTitle, { color: colors.text }]}>{item.title}</Text>
                      <Text style={[s.webValueDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </Animated.View>
            </View>

            {/* Form Card - Right side on desktop */}
            <Animated.View entering={enterUp} style={s.cardWrap}>
              <AuthLiquidFormCard isDesktop={isDesktop}>
                {formContent}
              </AuthLiquidFormCard>
            </Animated.View>
          </View>
        ) : (
          /* Mobile & non-desktop web */
          <Animated.View entering={enterUp} style={s.cardWrap}>
            <AuthLiquidFormCard isDesktop={isDesktop}>
              {formContent}
            </AuthLiquidFormCard>
          </Animated.View>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingTop: 20,
  },
  scrollContentDesktop: {
    paddingVertical: 64,
    paddingHorizontal: 32,
  },

  cardWrap: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  cardInner: { width: '100%' },

  /* Web two-column */
  webRow: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 64,
  },
  webLeft: { flex: 1, minWidth: 0 },
  webKickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  webDot: { width: 8, height: 8, borderRadius: 4 },
  webKicker: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  webHeadline: {
    fontFamily: FontFamily.bold,
    fontSize: 42,
    letterSpacing: -0.8,
    lineHeight: 50,
    marginBottom: 14,
  },
  webLead: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 440,
    marginBottom: 24,
  },
  webValueGrid: { gap: 12, marginTop: 8, maxWidth: 440 },
  webValueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: CardTokens.radius,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  webValueIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webValueTitle: { fontFamily: FontFamily.semibold, fontSize: 14 },
  webValueDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  /* Shared form styles */
  brandBlock: { alignItems: 'center', marginBottom: 24, gap: 8 },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    marginBottom: 8,
  },

  title: {
    ...TextStyles.display,
    fontSize: 34,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    ...TextStyles.callout,
    textAlign: 'center',
    maxWidth: 380,
    alignSelf: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },

  benefitsPill: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 24,
  },
  benefitsText: {
    ...TextStyles.caption,
    textAlign: 'center',
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.2,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: CardTokens.radius,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  globalErrorText: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.body2 },

  form: { gap: 18, marginBottom: 8 },
  passwordHeader: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordLabel: { fontFamily: FontFamily.semibold, fontSize: 14 },
  forgotText: { fontFamily: FontFamily.semibold, fontSize: 13 },

  optionsRow: { marginTop: 4, marginBottom: 12 },
  submitBtn: { height: 56, borderRadius: CardTokens.radius },

  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: 24,
    marginBottom: 20,
  },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  divText: { fontFamily: FontFamily.medium, fontSize: FontSize.body2 },

  socialRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: 24,
    justifyContent: 'center',
  },

  switchRow: { alignItems: 'center', paddingVertical: 12 },
  switchText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.callout,
    textAlign: 'center',
  },
  switchLink: { fontFamily: FontFamily.bold },
});
