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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useLogin } from '@/hooks/useLogin';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { SocialButton } from '@/components/ui/SocialButton';
import { LinearGradient } from 'expo-linear-gradient';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import { BrandWordmark } from '@/components/ui/BrandWordmark';

export default function LoginScreen() {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const {
    email, setEmail,
    password, setPassword,
    emailError, passwordError, globalError,
    loading, rememberMe, setRememberMe,
    isValid, clearErrors,
    handleGoogleSignIn, handleAppleSignIn, handleLogin
  } = useLogin(redirectTo);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand as unknown as [string, string]}
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
          <View style={s.mobileHeaderBrand}>
            <BrandWordmark size="md" withTagline centered light />
          </View>
          <View style={{ width: 28 }} />
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
          <Animated.View entering={FadeInUp.springify().damping(16).stiffness(120).duration(600)} style={[s.formContainer, isDesktop && s.formContainerDesktop, { borderRadius: CardTokens.radiusLarge }]}>
            {Platform.OS === 'ios' || Platform.OS === 'web' ? (
              <BlurView intensity={isDesktop ? 60 : 40} tint="dark" style={[StyleSheet.absoluteFill, s.formBlur, { borderRadius: CardTokens.radiusLarge, borderColor: colors.borderLight }]} />
            ) : (
              <View style={[StyleSheet.absoluteFill, s.formBlur, { backgroundColor: glass.dark.backgroundColor, borderRadius: CardTokens.radiusLarge, borderColor: colors.borderLight }]} />
            )}

            <View style={[s.formContent, { padding: CardTokens.paddingLarge * 2 }]}>
              <View style={s.logoRow}>
                <View style={[s.logoCircle, { backgroundColor: colors.overlay, borderColor: colors.borderLight }]}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Ionicons name="globe-outline" size={IconSize.xl} color="#FFFFFF" />
                </View>
                <BrandWordmark size="lg" withTagline />
              </View>

              <Animated.Text entering={FadeInDown.springify().damping(15).delay(100)} style={[s.title, { color: colors.textInverse }]}>Welcome back.</Animated.Text>
              <Animated.Text entering={FadeInDown.springify().damping(15).delay(150)} style={[s.subtitle, { color: colors.textSecondary }]}>Sign in to continue your cultural journey.</Animated.Text>

              {globalError ? (
                <View style={[s.errorBanner, { backgroundColor: `${CultureTokens.coral}20`, borderColor: `${CultureTokens.coral}50` }]}>
                  <Ionicons name="alert-circle" size={IconSize.md} color={CultureTokens.coral} />
                  <Text style={[s.globalErrorText, { color: CultureTokens.coral }]}>{globalError}</Text>
                </View>
              ) : null}

              <Animated.View entering={FadeInDown.springify().damping(16).delay(250)} style={s.form}>
                <View style={s.inputGroup}>
                  <Input
                    label="Email Address"
                    placeholder="name@culturepass.app"
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
                  <View style={s.passwordHeader}>
                    <Text style={[s.label, { color: colors.textInverse }]}>Password</Text>
                    <Pressable
                      hitSlop={12}
                      onPress={() => router.push(routeWithRedirect('/(onboarding)/forgot-password', redirectTo) as string)}
                      accessibilityRole="link"
                      accessibilityLabel="Forgot password"
                    >
                      <Text style={[s.forgotText, { color: CultureTokens.gold }]}>Forgot Password?</Text>
                    </Pressable>
                  </View>
                  <Input
                    placeholder="Enter password"
                    leftIcon="lock-closed-outline"
                    value={password}
                    onChangeText={(v) => { setPassword(v); clearErrors(); }}
                    passwordToggle
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    error={passwordError}
                  />
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.springify().damping(16).delay(350)} style={s.optionsRow}>
                <Checkbox
                  checked={rememberMe}
                  onToggle={setRememberMe}
                  label="Keep me signed in"
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.springify().damping(16).delay(400)}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  rightIcon="arrow-forward"
                  loading={loading}
                  disabled={!isValid || loading}
                  onPress={handleLogin}
                  style={[s.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold }]}
                >
                  Sign In
                </Button>
              </Animated.View>

              <Animated.View entering={FadeInDown.springify().damping(16).delay(450)} style={s.socialDivider}>
                <View style={[s.divLine, { backgroundColor: colors.borderLight }]} />
                <Text style={[s.divText, { color: colors.textSecondary }]}>or</Text>
                <View style={[s.divLine, { backgroundColor: colors.borderLight }]} />
              </Animated.View>

              <Animated.View entering={FadeInDown.springify().damping(16).delay(550)} style={s.socialRow}>
                <SocialButton provider="google" onPress={handleGoogleSignIn} disabled={loading} />
                {Platform.OS === 'ios' ? (
                  <SocialButton provider="apple" onPress={handleAppleSignIn} disabled={loading} />
                ) : (
                  <SocialButton provider="apple" comingSoon disabled={loading} />
                )}
              </Animated.View>

              <Animated.View entering={FadeInDown.springify().damping(16).delay(650)}>
                <Pressable
                  style={s.switchRow}
                  onPress={() => router.replace(routeWithRedirect('/(onboarding)/signup', redirectTo) as string)}
                  hitSlop={12}
                  accessibilityRole="link"
                  accessibilityLabel="Sign up for an account"
                >
                  <Text style={[s.switchText, { color: colors.textSecondary }]}>
                    Don&apos;t have an account? <Text style={[s.switchLink, { color: CultureTokens.gold }]}>Sign Up</Text>
                  </Text>
                </Pressable>
              </Animated.View>
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
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: Spacing.sm + 4,
  },
  mobileHeaderBrand: { alignItems: 'center', gap: 2 },
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
  logoRow: { alignItems: 'center', marginBottom: 28, gap: 6 },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
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
    borderWidth: 1,
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
  divLine: { flex: 1, height: 1 },
  divText: { fontFamily: FontFamily.medium, fontSize: FontSize.body2 },
  socialRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: 36 },
  switchRow: { alignItems: 'center', paddingVertical: Spacing.sm },
  switchText: { fontFamily: FontFamily.regular, fontSize: FontSize.callout },
  switchLink: { fontFamily: FontFamily.bold },
});
