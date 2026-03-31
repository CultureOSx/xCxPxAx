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
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { BlurView } from 'expo-blur';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { SocialButton } from '@/components/ui/SocialButton';
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator';
import { LinearGradient } from 'expo-linear-gradient';
import { routeWithRedirect } from '@/lib/routes';
import { BrandWordmark } from '@/components/ui/BrandWordmark';
import { useSignup } from '@/hooks/useSignup';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { HapticManager } from '@/lib/haptics';

export default function SignUpScreen() {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const {
    name, setName,
    email, setEmail,
    password, setPassword,
    agreed, setAgreed,
    role, setRole,
    nameError, emailError, passwordError, globalError,
    loading, isValid, clearErrors,
    handleGoogleSignUp, handleAppleSignUp, handleSignUp,
    redirectTo
  } = useSignup();

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
            onPress={() => router.replace('/(tabs)')}
            hitSlop={Spacing.sm}
            style={[s.desktopBackBtn, { backgroundColor: glass.overlay.backgroundColor, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Back to Discover"
          >
            <Ionicons name="chevron-back" size={IconSize.md - 2} color={colors.textInverse} />
            <Text style={[s.desktopBackText, { color: colors.textInverse }]}>Back to Discover</Text>
          </Pressable>
        </View>
      )}

      {!isDesktop && (
        <View style={[s.mobileHeader, { paddingTop: topInset + Spacing.sm + 4 }]}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={28} color={colors.textInverse} />
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
          <Animated.View entering={FadeInUp.springify().damping(16).duration(600)} style={[s.formContainer, isDesktop && s.formContainerDesktop, { borderRadius: CardTokens.radiusLarge }]}>
            {Platform.OS === 'ios' || Platform.OS === 'web' ? (
              <BlurView intensity={isDesktop ? 60 : 40} tint="dark" style={[StyleSheet.absoluteFill, s.formBlur, { borderRadius: CardTokens.radiusLarge, borderColor: colors.borderLight }]} />
            ) : (
              <View style={[StyleSheet.absoluteFill, s.formBlur, { backgroundColor: glass.dark.backgroundColor, borderRadius: CardTokens.radiusLarge, borderColor: colors.borderLight }]} />
            )}

            <View style={[s.formContent, { padding: CardTokens.paddingLarge * 2 }]}>
              <View style={s.logoRow}>
                <View style={[s.logoCircle, { backgroundColor: colors.overlay, borderColor: colors.borderLight }]}>
                  <Ionicons name="globe-outline" size={IconSize.xl} color={colors.textInverse} />
                </View>
                <BrandWordmark size="md" withTagline centered light />
              </View>

              <Text style={[s.title, { color: colors.textInverse }]}>Create Account.</Text>
              <Text style={[s.benefitsRow, { color: CultureTokens.gold }]}>
                Free events · Community access · Exclusive perks
              </Text>

              {globalError ? (
                <View style={[s.errorBanner, { backgroundColor: `${CultureTokens.coral}20`, borderColor: `${CultureTokens.coral}50` }]}>
                  <Ionicons name="alert-circle" size={IconSize.md} color={CultureTokens.coral} />
                  <Text style={[s.globalErrorText, { color: CultureTokens.coral }]}>{globalError}</Text>
                </View>
              ) : null}

              <View style={s.roleToggleGroup}>
                <Text style={[s.roleLabel, { color: colors.textSecondary }]}>I want to...</Text>
                <View style={s.roleRow}>
                  <Pressable
                    style={[
                      s.roleOption,
                      role === 'user'
                        ? { backgroundColor: colors.primaryGlow, borderColor: colors.primary }
                        : { backgroundColor: 'transparent', borderColor: colors.borderLight },
                    ]}
                    onPress={() => { setRole('user'); HapticManager.light(); }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: role === 'user' }}
                    accessibilityLabel="Discover Events"
                  >
                    <Ionicons name="compass-outline" size={IconSize.md} color={role === 'user' ? colors.textInverse : colors.textSecondary} />
                    <Text style={[s.roleOptionText, role === 'user' ? { color: colors.textInverse, fontFamily: FontFamily.semibold } : { color: colors.textSecondary }]}>
                      Discover Events
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      s.roleOption,
                      role === 'organizer'
                        ? { backgroundColor: colors.primaryGlow, borderColor: colors.primary }
                        : { backgroundColor: 'transparent', borderColor: colors.borderLight },
                    ]}
                    onPress={() => { setRole('organizer'); HapticManager.light(); }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: role === 'organizer' }}
                    accessibilityLabel="Host Events"
                  >
                    <Ionicons name="calendar-outline" size={IconSize.md} color={role === 'organizer' ? colors.textInverse : colors.textSecondary} />
                    <Text style={[s.roleOptionText, role === 'organizer' ? { color: colors.textInverse, fontFamily: FontFamily.semibold } : { color: colors.textSecondary }]}>
                      Host Events
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={s.form}>
                <View style={s.inputGroup}>
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    leftIcon="person-outline"
                    value={name}
                    onChangeText={(v) => { setName(v); clearErrors(); }}
                    autoCapitalize="words"
                    returnKeyType="next"
                    error={nameError}
                  />
                </View>

                <View style={s.inputGroup}>
                  <Input
                    label="Email Address"
                    placeholder="you@example.com"
                    leftIcon="mail-outline"
                    value={email}
                    onChangeText={(v) => { setEmail(v); clearErrors(); }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="next"
                    error={emailError}
                  />
                </View>

                <View style={s.inputGroup}>
                  <Input
                    label="Password"
                    placeholder="Min. 6 characters"
                    leftIcon="lock-closed-outline"
                    value={password}
                    onChangeText={(v) => { setPassword(v); clearErrors(); }}
                    passwordToggle
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                    error={passwordError}
                  />
                  {password.length > 0 && <PasswordStrengthIndicator password={password} />}
                </View>
              </View>

              <View style={s.optionsRow}>
                <Checkbox
                  checked={agreed}
                  onToggle={(v) => { setAgreed(v); clearErrors(); }}
                  label={
                    <Text style={[s.checkText, { color: colors.textInverse }]}>
                      I agree to the{' '}
                      <Text style={[s.linkText, { color: CultureTokens.gold }]} onPress={() => router.push('/legal/terms')}>Terms</Text>
                      {' & '}
                      <Text style={[s.linkText, { color: CultureTokens.gold }]} onPress={() => router.push('/legal/privacy')}>Privacy</Text>
                    </Text>
                  }
                />
              </View>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                rightIcon="arrow-forward"
                loading={loading}
                disabled={!isValid || loading}
                onPress={handleSignUp}
                style={[s.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold }]}
              >
                Create Account
              </Button>

              <View style={s.socialDivider}>
                <View style={[s.divLine, { backgroundColor: colors.borderLight }]} />
                <Text style={[s.divText, { color: colors.textSecondary }]}>or sign up with</Text>
                <View style={[s.divLine, { backgroundColor: colors.borderLight }]} />
              </View>

              <View style={s.socialRow}>
                <SocialButton provider="google" onPress={handleGoogleSignUp} disabled={loading} />
                {Platform.OS === 'ios' ? (
                  <SocialButton provider="apple" onPress={handleAppleSignUp} disabled={loading} />
                ) : (
                  <SocialButton provider="apple" comingSoon disabled={loading} />
                )}
              </View>

              <Pressable
                style={s.switchRow}
                onPress={() => router.replace(routeWithRedirect('/(onboarding)/login', redirectTo) as string)}
                hitSlop={12}
                accessibilityRole="link"
                accessibilityLabel="Sign in to existing account"
              >
                <Text style={[s.switchText, { color: colors.textSecondary }]}>
                  Already have an account? <Text style={[s.switchLink, { color: CultureTokens.gold }]}>Sign In</Text>
                </Text>
              </Pressable>
            </View>
          </Animated.View>
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
  mobileHeader: { paddingHorizontal: 20, paddingBottom: Spacing.sm + 4 },
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
  logoRow: { alignItems: 'center', marginBottom: 20 },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
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
    borderWidth: 1,
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
    borderWidth: 1,
  },
  roleOptionText: { fontFamily: FontFamily.medium, fontSize: FontSize.body2 },
  form: { gap: 20, marginBottom: 20 },
  inputGroup: { gap: Spacing.sm },
  optionsRow: { marginBottom: Spacing.xl },
  checkText: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.chip, lineHeight: 20 },
  linkText: { fontFamily: FontFamily.semibold },
  submitBtn: { height: 56, borderRadius: CardTokens.radius },
  socialDivider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  divLine: { flex: 1, height: 1 },
  divText: { fontFamily: FontFamily.medium, fontSize: FontSize.body2 },
  socialRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  switchRow: { alignItems: 'center', paddingVertical: Spacing.sm },
  switchText: { fontFamily: FontFamily.regular, fontSize: FontSize.callout },
  switchLink: { fontFamily: FontFamily.bold },
});
