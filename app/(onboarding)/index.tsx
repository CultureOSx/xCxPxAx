import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import Head from 'expo-router/head';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

import {
  CultureTokens,
  gradients,
  CardTokens,
  shadows,
  FontSize,
  LineHeight,
  FontFamily,
  LiquidGlassTokens,
  LiquidGlassAccents,
} from '@/constants/theme';

import { Button } from '@/components/ui/Button';
import { SocialButton } from '@/components/ui/SocialButton';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { BrandWordmark } from '@/components/ui/BrandWordmark';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';

const HERO_TAGLINE = 'Celebrate Your Culture, Connect Your Community';

const VALUE_RIBBON =
  'A dedicated home for cultural events — discover what matters, skip the noisy social feed.';

const HOST_PITCH_SUMMARY =
  'List cultural events where they are easy to find — not lost in a social feed. Reach the right audience, sell tickets, and give attendees one place to come back to.';

const HOST_PITCH_EXTENDED =
  ' Share the same links on WhatsApp or Facebook; CulturePass is the home base. You keep your existing tools — we add a dedicated venue for your program and deeper engagement.';

const WEB_WELCOME_TITLE = 'CulturePass — Celebrate Your Culture, Connect Your Community';
const WEB_WELCOME_DESCRIPTION =
  'Discover cultural events and communities built for diaspora cities. Organizers reach the right audience; attendees find festivals, tickets, and belonging in one place.';

const FEATURES = [
  {
    icon: 'calendar' as const,
    color: CultureTokens.gold,
    well: LiquidGlassAccents.eventIconWell,
    text: 'Discover cultural events near you',
  },
  {
    icon: 'people' as const,
    color: CultureTokens.coral,
    well: LiquidGlassAccents.communityIconWell,
    text: 'Join vibrant communities',
  },
  {
    icon: 'gift' as const,
    color: CultureTokens.gold,
    well: LiquidGlassAccents.perksIconWell,
    text: 'Unlock exclusive member perks',
  },
];

const TRUST_PILLS = [
  { icon: 'shield-checkmark-outline' as const, label: 'Verified profiles' },
  { icon: 'ticket-outline' as const, label: 'Tickets in one place' },
  { icon: 'globe-outline' as const, label: 'Diaspora-first discovery' },
];

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const reducedMotion = useReducedMotion();

  const { completeOnboarding } = useOnboarding();
  const pathname = usePathname();

  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const orbStyleA = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value * LiquidGlassTokens.parallaxFactor * 0.6 }],
  }));

  const orbStyleB = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value * LiquidGlassTokens.parallaxFactor * 1.1 }],
  }));

  const orbStyleC = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value * LiquidGlassTokens.parallaxFactor * 0.85 }],
  }));

  const [hostPitchExpanded, setHostPitchExpanded] = useState(false);

  const triggerImpact = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(style).catch(() => {});
  }, []);

  const goToSignup = useCallback(() => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/(onboarding)/signup', params: { redirectTo: pathname } });
  }, [pathname, triggerImpact]);

  const goToLogin = useCallback(() => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(onboarding)/login', params: { redirectTo: pathname } });
  }, [pathname, triggerImpact]);

  const goToLocation = useCallback(() => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/location');
  }, [triggerImpact]);

  const toggleHostPitch = useCallback(() => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    setHostPitchExpanded((v) => !v);
  }, [triggerImpact]);

  const handleSkip = useCallback(() => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Medium);
    completeOnboarding();
    router.replace('/(tabs)');
  }, [completeOnboarding, triggerImpact]);

  const listEntering = (index: number) =>
    reducedMotion
      ? undefined
      : FadeInDown.delay(index * 70)
          .springify()
          .damping(LiquidGlassTokens.entranceSpring.damping)
          .stiffness(LiquidGlassTokens.entranceSpring.stiffness);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.gradientBg}
      />

      {/* Parallax Orbs */}
      <Animated.View style={[s.orb, s.orbIndigo, orbStyleA]} pointerEvents="none" />
      <Animated.View style={[s.orb, s.orbGold, orbStyleB]} pointerEvents="none" />
      <Animated.View style={[s.orb, s.orbCoral, orbStyleC]} pointerEvents="none" />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces
        contentContainerStyle={[
          s.scrollContent,
          isDesktop && s.scrollContentDesktop,
          { paddingTop: isDesktop ? 56 : insets.top + 32, paddingBottom: insets.bottom + 28 },
        ]}
      >
        <LiquidGlassPanel
          style={[
            s.cardOuter,
            isDesktop && s.cardOuterDesktop,
            Platform.select({
              ios: shadows.large,
              android: { elevation: 8 },
              web: shadows.heavy,
            }),
          ]}
          borderRadius={LiquidGlassTokens.corner.mainCard}
        >
          <View style={[s.cardInner, { padding: CardTokens.paddingLarge * 2 }]}>
            {Platform.OS === 'web' && (
              <Head>
                <title>{WEB_WELCOME_TITLE}</title>
                <meta name="description" content={WEB_WELCOME_DESCRIPTION} />
              </Head>
            )}

            {/* Hero Ribbon */}
            <LinearGradient
              colors={[CultureTokens.indigo, CultureTokens.coral]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.heroRibbon}
            >
              <Text style={[s.heroRibbonText, { color: '#fff' }]}>{HERO_TAGLINE}</Text>
            </LinearGradient>

            {/* Header */}
            <View style={s.headerBlock}>
              <View style={s.logoContainer}>
                <Image
                  source={require('@/assets/images/culturepass-logo.png')}
                  style={s.logoImage}
                  contentFit="contain"
                  priority="high"
                  transition={200}
                />
              </View>

              <BrandWordmark size="xl" withTagline centered light />

              <Text style={[s.subtitle, { color: colors.textSecondary }]}>
                One trusted place for cultural discovery, tickets, and community — built for diaspora cities worldwide.
              </Text>

              <View style={s.trustPillsRow}>
                {TRUST_PILLS.map((pill) => (
                  <View
                    key={pill.label}
                    style={[
                      s.trustPill,
                      { backgroundColor: colors.primarySoft, borderColor: colors.borderLight },
                    ]}
                  >
                    <Ionicons name={pill.icon} size={14} color={CultureTokens.indigo} />
                    <Text style={[s.trustPillText, { color: colors.text }]}>{pill.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Value Ribbon */}
            <View style={s.ideaRibbon}>
              <View style={[s.ideaRibbonAccent, { backgroundColor: CultureTokens.gold }]} />
              <Ionicons name="sparkles-outline" size={22} color={CultureTokens.gold} style={s.ideaRibbonIcon} />
              <Text style={[s.ideaRibbonText, { color: colors.text }]}>{VALUE_RIBBON}</Text>
            </View>

            {/* Features */}
            <View style={s.featureList}>
              {FEATURES.map((f, i) => (
                <Animated.View
                  key={f.text}
                  entering={listEntering(i)}
                  style={[
                    s.featureRow,
                    { backgroundColor: colors.primarySoft, borderColor: colors.borderLight },
                  ]}
                >
                  <View style={[s.featureIcon, { backgroundColor: f.well }]}>
                    <Ionicons name={f.icon} size={20} color={f.color} />
                  </View>
                  <Text style={[s.featureText, { color: colors.text }]}>{f.text}</Text>
                </Animated.View>
              ))}
            </View>

            {/* Host Callout */}
            <View style={s.hostCallout}>
              <View style={s.hostCalloutHeader}>
                <Ionicons name="business-outline" size={20} color={LiquidGlassAccents.hostAccentBar} />
                <Text style={[s.hostCalloutTitle, { color: colors.text }]}>For organizers & hosts</Text>
              </View>
              <Text style={[s.hostCalloutBody, { color: colors.textSecondary }]}>
                {HOST_PITCH_SUMMARY}
                {hostPitchExpanded && HOST_PITCH_EXTENDED}
              </Text>
              <Pressable
                onPress={toggleHostPitch}
                style={s.hostPitchToggle}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={hostPitchExpanded ? 'Show less' : 'Read more'}
              >
                <Text style={[s.hostPitchToggleLabel, { color: LiquidGlassAccents.hostAccentBar }]}>
                  {hostPitchExpanded ? 'Show less' : 'Read more'}
                </Text>
              </Pressable>
            </View>

            <View style={s.spacer} />

            {/* Actions */}
            <View style={s.actionStack}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                haptic
                rightIcon="arrow-forward"
                onPress={goToSignup}
                style={[shadows.medium, { backgroundColor: CultureTokens.gold }]}
              >
                Get Started
              </Button>

              <Button
                variant="outline"
                size="lg"
                fullWidth
                haptic
                onPress={goToLogin}
                style={{ borderColor: colors.border, backgroundColor: colors.overlay }}
                labelStyle={{ color: colors.text }}
              >
                I already have an account
              </Button>

              <View style={s.socialDivider}>
                <View style={[s.divLine, { backgroundColor: colors.borderLight }]} />
                <Text style={[s.divText, { color: colors.textSecondary }]}>or continue with</Text>
                <View style={[s.divLine, { backgroundColor: colors.borderLight }]} />
              </View>

              <View style={s.socialRow}>
                <SocialButton provider="google" onPress={goToLocation} />
                <SocialButton provider="apple" onPress={goToLocation} />
              </View>

              <Pressable
                onPress={handleSkip}
                style={s.skipBtn}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Skip onboarding and explore as guest"
              >
                <Text style={[s.skipText, { color: colors.textSecondary }]}>Skip and explore</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        </LiquidGlassPanel>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.88 },

  orb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  orbIndigo: {
    top: -120,
    right: -80,
    backgroundColor: CultureTokens.indigo,
    opacity: 0.45,
  },
  orbGold: {
    bottom: -40,
    left: -60,
    backgroundColor: CultureTokens.gold,
    opacity: 0.28,
  },
  orbCoral: {
    top: '38%',
    left: -100,
    backgroundColor: CultureTokens.coral,
    opacity: 0.22,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  scrollContentDesktop: { paddingVertical: 48 },

  cardOuter: { width: '100%', maxWidth: 500, alignSelf: 'center' },
  cardOuterDesktop: { maxWidth: 560 },
  cardInner: {},

  heroRibbon: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -CardTokens.paddingLarge * 2,
    marginTop: -CardTokens.paddingLarge * 2,
    borderTopLeftRadius: LiquidGlassTokens.corner.mainCard,
    borderTopRightRadius: LiquidGlassTokens.corner.mainCard,
  },
  heroRibbonText: {
    fontSize: FontSize.callout,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
    lineHeight: LineHeight.callout,
    letterSpacing: 0.25,
    maxWidth: 400,
  },

  headerBlock: { alignItems: 'center', marginBottom: 26 },
  logoContainer: { marginBottom: 16 },
  logoImage: { width: 100, height: 100, borderRadius: 50 },
  subtitle: {
    fontSize: FontSize.body2,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: LineHeight.body2 + 4,
    paddingHorizontal: 4,
  },

  trustPillsRow: {
    marginTop: 14,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  trustPill: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustPillText: {
    fontSize: FontSize.micro,
    fontFamily: FontFamily.semibold,
  },

  ideaRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: LiquidGlassTokens.corner.valueRibbon,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 20,
    gap: 10,
    overflow: 'hidden',
    backgroundColor: LiquidGlassAccents.valueRibbonFill,
    borderColor: LiquidGlassAccents.valueRibbonBorder,
  },
  ideaRibbonAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  ideaRibbonIcon: { flexShrink: 0 },
  ideaRibbonText: {
    flex: 1,
    fontSize: FontSize.body2,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.body2,
  },

  featureList: { gap: 12, marginBottom: 16 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: LiquidGlassTokens.corner.innerRow,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontSize: FontSize.body2, fontFamily: FontFamily.medium, flex: 1 },

  hostCallout: {
    borderRadius: LiquidGlassTokens.corner.innerRow,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  hostCalloutHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  hostCalloutTitle: { fontSize: FontSize.title3, fontFamily: FontFamily.semibold },
  hostCalloutBody: {
    fontSize: FontSize.chip,
    fontFamily: FontFamily.regular,
    lineHeight: LineHeight.chip + 4,
  },
  hostPitchToggle: { marginTop: 10, alignSelf: 'flex-start', paddingVertical: 4 },
  hostPitchToggleLabel: { fontSize: FontSize.chip, fontFamily: FontFamily.semibold },

  spacer: { height: 22 },

  actionStack: { gap: 12 },
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  divText: { fontSize: FontSize.chip, fontFamily: FontFamily.regular },
  socialRow: { flexDirection: 'row', gap: 12 },

  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 16,
    paddingBottom: 8,
  },
  skipText: { fontSize: FontSize.body2, fontFamily: FontFamily.medium },
});
