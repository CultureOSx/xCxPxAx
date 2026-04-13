// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInUp,
  FadeInDown,
  useReducedMotion,
} from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useSignup } from '@/hooks/useSignup';

import {
  Button,
  Input,
  Checkbox,
  SocialButton,
  PasswordStrengthIndicator,
} from '@/components/ui';

import { BrandWordmark } from '@/components/ui/BrandWordmark';
import {
  AuthAmbientBackground,
  AuthLiquidFormCard,
  AuthDesktopBackPill,
  AuthMobileHeader,
} from '@/components/onboarding/AuthScreenPrimitives';

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

import { routeWithRedirect } from '@/lib/routes';
import { HapticManager } from '@/lib/haptics';

const ROLE_OPTIONS = [
  { value: 'user' as const, icon: 'compass-outline' as const, label: 'Discover Events' },
  { value: 'organizer' as const, icon: 'calendar-outline' as const, label: 'Host Events' },
] as const;

const VALUE_PROPS = [
  { icon: 'calendar-outline' as const, title: 'Cultural Events', desc: "Discover what's on this week in your city." },
  { icon: 'people-outline' as const, title: 'Your Community', desc: 'Connect with people who share your culture.' },
  { icon: 'gift-outline' as const, title: 'Member Perks', desc: 'Exclusive rewards from local businesses.' },
] as const;

export default function SignUpScreen() {
  const colors = useColors();
  const { isDesktop, isWeb } = useLayout();
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

  const padBottom = isWeb ? 40 : 64 + insets.bottom;

  const formContent = (
    <AuthLiquidFormCard isDesktop={isDesktop}>
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
        <BrandWordmark size="lg" withTagline centered />
      </Animated.View>

      {/* Main Headline */}
      <Animated.View entering={enter(30)}>
        <Text style={[s.title, { color: colors.text }]}>Belong anywhere.</Text>
      </Animated.View>

      <Animated.View entering={enter(110)}>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          Join the cultural community built for diaspora cities.
        </Text>
      </Animated.View>

      {/* Benefits */}
      <Animated.View
        entering={enter(140)}
        style={[
          s.benefitsPill,
          { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
        ]}
      >
        <Text style={[s.benefitsText, { color: CultureTokens.gold }]}>
          Free Events · Communities · Exclusive Perks
        </Text>
      </Animated.View>

      {/* Global Error */}
      {globalError && (
        <Animated.View
          entering={enter(200)}
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
          <Text style={[s.errorText, { color: colors.error }]}>{globalError}</Text>
        </Animated.View>
      )}

      {/* Role Selection */}
      <Animated.View
        entering={enter(180)}
        style={s.roleGroup}
        accessibilityRole="radiogroup"
        accessibilityLabel="Account type"
      >
        <Text style={[s.roleLabel, { color: colors.textSecondary }]}>I want to</Text>
        <View style={s.roleRow}>
          {ROLE_OPTIONS.map((opt) => {
            const active = role === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[
                  s.roleOption,
                  {
                    backgroundColor: active ? colors.primarySoft : 'transparent',
                    borderColor: active ? colors.primary : colors.borderLight,
                  },
                ]}
                onPress={() => {
                  setRole(opt.value);
                  HapticManager.light();
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={opt.label}
              >
                <Ionicons
                  name={opt.icon}
                  size={IconSize.sm + 2}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    s.roleOptionText,
                    { color: active ? colors.text : colors.textSecondary },
                    active && { fontFamily: FontFamily.semibold },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Form Fields */}
      <Animated.View entering={enter(240)} style={s.form}>
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          leftIcon="person-outline"
          value={name}
          onChangeText={(v) => { setName(v); clearErrors(); }}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          error={nameError}
        />

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

        <View style={s.passwordGroup}>
          <Input
            label="Password"
            placeholder="Min. 6 characters"
            leftIcon="lock-closed-outline"
            value={password}
            onChangeText={(v) => { setPassword(v); clearErrors(); }}
            passwordToggle
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
            error={passwordError}
          />
          {password.length > 0 && <PasswordStrengthIndicator password={password} />}
        </View>
      </Animated.View>

      {/* Terms Checkbox */}
      <Animated.View entering={enter(300)} style={s.optionsRow}>
        <Checkbox
          checked={agreed}
          onToggle={(v) => { setAgreed(v); clearErrors(); }}
          label={
            <Text style={[s.checkText, { color: colors.text }]}>
              I agree to the{' '}
              <Text
                style={[s.linkText, { color: colors.primary }]}
                onPress={() => router.push('/legal/terms')}
              >
                Terms
              </Text>
              {' & '}
              <Text
                style={[s.linkText, { color: colors.primary }]}
                onPress={() => router.push('/legal/privacy')}
              >
                Privacy Policy
              </Text>
            </Text>
          }
        />
      </Animated.View>

      {/* Submit Button */}
      <Animated.View entering={enter(340)}>
        <Button
          variant="gold"
          size="lg"
          fullWidth
          haptic
          rightIcon="arrow-forward"
          loading={loading}
          disabled={!isValid || loading}
          onPress={handleSignUp}
          style={[s.submitBtn, shadows.medium]}
          accessibilityLabel="Create account"
        >
          Create Account
        </Button>
      </Animated.View>

      {/* Social */}
      <Animated.View entering={enter(380)} style={s.socialDivider}>
        <View style={[s.divLine, { backgroundColor: colors.borderLight }]} />
        <Text style={[s.divText, { color: colors.textSecondary }]}>or</Text>
        <View style={[s.divLine, { backgroundColor: colors.borderLight }]} />
      </Animated.View>

      <Animated.View entering={enter(420)} style={s.socialRow}>
        <SocialButton provider="google" onPress={handleGoogleSignUp} disabled={loading} />
        {Platform.OS === 'ios' ? (
          <SocialButton provider="apple" onPress={handleAppleSignUp} disabled={loading} />
        ) : (
          <SocialButton provider="apple" comingSoon disabled={loading} />
        )}
      </Animated.View>

      <Animated.View entering={enter(460)}>
        <Pressable
          style={s.switchRow}
          onPress={() => router.replace(routeWithRedirect('/(onboarding)/login', redirectTo) as string)}
          hitSlop={12}
          accessibilityRole="link"
          accessibilityLabel="Sign in to existing account"
        >
          <Text style={[s.switchText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
            <Text style={[s.switchLink, { color: colors.primary }]}>Sign In</Text>
          </Text>
        </Pressable>
      </Animated.View>
    </AuthLiquidFormCard>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <AuthAmbientBackground />

      {isDesktop ? (
        <AuthDesktopBackPill label="Back to Discover" onPress={() => router.replace('/(tabs)')} />
      ) : (
        <AuthMobileHeader
          variant="close-only"
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
            {/* Marketing Column - Left Side */}
            <View style={s.webLeft}>
              <Animated.View entering={enter(40)} style={s.webKickerRow}>
                <View style={[s.webDot, { backgroundColor: CultureTokens.gold }]} />
                <Text style={[s.webKicker, { color: colors.textSecondary }]}>CulturePass</Text>
              </Animated.View>

              <Animated.View entering={enter(70)}>
                <Text style={[s.webHeadline, { color: colors.text }]}>
                  Your cultural home,{'\n'}anywhere.
                </Text>
              </Animated.View>

              <Animated.View entering={enter(100)}>
                <Text style={[s.webLead, { color: colors.textSecondary }]}>
                  The premium marketplace for diaspora communities — events, local businesses, and exclusive member perks in your city.
                </Text>
              </Animated.View>

              <Animated.View entering={enter(130)} style={s.webValueGrid}>
                {VALUE_PROPS.map((item) => (
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

            {/* Form Card - Right Side on Desktop */}
            <Animated.View entering={enterUp} style={s.cardWrap}>
              {formContent}
            </Animated.View>
          </View>
        ) : (
          /* Mobile / non-desktop */
          <Animated.View entering={enterUp} style={s.cardWrap}>
            {formContent}
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

  /* Desktop Marketing */
  webRow: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 72,
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
    maxWidth: 460,
    marginBottom: 28,
  },
  webValueGrid: { gap: 12, marginTop: 8, maxWidth: 460 },
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

  /* Form Styles */
  brandBlock: { alignItems: 'center', marginBottom: 24, gap: 8 },
  brandIcon: {
    width: 69,
    height: 69,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    marginBottom: 8,
  },

  title: {
    ...TextStyles.display,
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -1.2,
    lineHeight: 54,
  },
  subtitle: {
    ...TextStyles.title2,
    textAlign: 'center',
    maxWidth: 369,
    alignSelf: 'center',
    marginBottom: 20,
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
  errorText: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.body2 },

  roleGroup: { marginBottom: 24 },
  roleLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.body2,
    marginBottom: Spacing.sm,
  },
  roleRow: { flexDirection: 'row', gap: 12 },
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

  form: { gap: 18, marginBottom: 8 },
  passwordGroup: { gap: Spacing.sm },

  optionsRow: { marginTop: 8, marginBottom: 24 },
  checkText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    lineHeight: 20,
  },
  linkText: { fontFamily: FontFamily.semibold },

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
