import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CultureTokens,
  CardTokens,
  shadows,
  FontSize,
  LineHeight,
  FontFamily,
  LiquidGlassTokens,
  LiquidGlassAccents,
} from '@/constants/theme';
import { useCallback, useState } from 'react';
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
  useReducedMotion,
} from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { SocialButton } from '@/components/ui/SocialButton';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { Image } from 'expo-image';
import { BrandWordmark } from '@/components/ui/BrandWordmark';

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

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

function triggerImpact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(style).catch(() => {});
}

export default function WelcomeScreen() {
  const colors = useColors();
  const styles = getStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const reducedMotion = useReducedMotion();

  const { completeOnboarding } = useOnboarding();
  const pathname = usePathname();

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const goToSignup = useCallback(() => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/(onboarding)/signup', params: { redirectTo: pathname } });
  }, [pathname]);

  const goToLogin = useCallback(() => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/(onboarding)/login', params: { redirectTo: pathname } });
  }, [pathname]);

  const goToLocationViaGoogle = useCallback(() => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/location');
  }, []);

  const goToLocationViaApple = useCallback(() => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/location');
  }, []);

  const cardPad = CardTokens.paddingLarge * 2;
  const [hostPitchExpanded, setHostPitchExpanded] = useState(false);

  const toggleHostPitch = useCallback(() => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    setHostPitchExpanded((v) => !v);
  }, []);

  const handleSkip = useCallback(() => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Medium);
    completeOnboarding();
    router.replace('/(tabs)');
  }, [completeOnboarding]);

  const listEntering = (index: number) =>
    reducedMotion
      ? undefined
      : FadeInDown.delay(index * 70)
          .springify()
          .damping(LiquidGlassTokens.entranceSpring.damping)
          .stiffness(LiquidGlassTokens.entranceSpring.stiffness);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          { paddingTop: isDesktop ? 56 : topInset + 32, paddingBottom: bottomInset + 28 },
        ]}
      >
        <View
          style={[
            styles.cardOuter,
            isDesktop && styles.cardOuterDesktop,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
              borderWidth: 1,
              borderRadius: LiquidGlassTokens.corner.mainCard,
            },
            Platform.select({
              ios: shadows.large,
              android: { elevation: 8 },
              web: shadows.heavy,
            }),
          ]}
        >
          <View style={[styles.cardInner, { padding: cardPad }]}>
            {Platform.OS === 'web' && (
              <Head>
                <title>{WEB_WELCOME_TITLE}</title>
                <meta name="description" content={WEB_WELCOME_DESCRIPTION} />
              </Head>
            )}

            <View
              style={[
                styles.heroRibbon,
                {
                  marginHorizontal: -cardPad,
                  marginTop: -cardPad,
                  paddingHorizontal: cardPad,
                  borderTopLeftRadius: LiquidGlassTokens.corner.mainCard,
                  borderTopRightRadius: LiquidGlassTokens.corner.mainCard,
                  backgroundColor: CultureTokens.indigo,
                },
              ]}
            >
              <Text
                style={[styles.heroRibbonText, { color: colors.textOnBrandGradient }]}
                maxFontSizeMultiplier={2}
              >
                {HERO_TAGLINE}
              </Text>
            </View>

            <View style={styles.headerBlock}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/assets/images/culturepass-logo.png')}
                  style={styles.logoImage}
                  contentFit="contain"
                  priority="high"
                  transition={200}
                />
              </View>
              <BrandWordmark size="xl" withTagline={false} centered />
              <Text
                style={[styles.subtitle, { color: colors.textSecondary }]}
                maxFontSizeMultiplier={2}
              >
                One trusted place for cultural discovery, tickets, and community — built for diaspora
                cities worldwide.
              </Text>

              <View style={styles.trustPillsRow}>
                {TRUST_PILLS.map((pill) => (
                  <View
                    key={pill.label}
                    style={[
                      styles.trustPill,
                      {
                        backgroundColor: colors.primarySoft,
                        borderColor: colors.borderLight,
                      },
                    ]}
                  >
                    <Ionicons name={pill.icon} size={14} color={CultureTokens.indigo} />
                    <Text style={[styles.trustPillText, { color: colors.text }]} numberOfLines={1}>
                      {pill.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View
              style={[
                styles.ideaRibbon,
                {
                  backgroundColor: LiquidGlassAccents.valueRibbonFill,
                  borderColor: LiquidGlassAccents.valueRibbonBorder,
                },
              ]}
              accessibilityRole="none"
              accessibilityLabel={VALUE_RIBBON}
            >
              <View style={[styles.ideaRibbonAccent, { backgroundColor: CultureTokens.gold }]} />
              <Ionicons name="sparkles-outline" size={22} color={CultureTokens.gold} style={styles.ideaRibbonIcon} />
              <Text style={[styles.ideaRibbonText, { color: colors.text }]} maxFontSizeMultiplier={2}>
                {VALUE_RIBBON}
              </Text>
            </View>

            <View style={styles.featureList}>
              {FEATURES.map((f, i) => (
                <Animated.View
                  key={f.text}
                  entering={listEntering(i)}
                  style={[
                    styles.featureRow,
                    {
                      backgroundColor: colors.primarySoft,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <View style={[styles.featureIcon, { backgroundColor: f.well }]}>
                    <Ionicons name={f.icon} size={20} color={f.color} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.text }]} maxFontSizeMultiplier={2}>
                    {f.text}
                  </Text>
                </Animated.View>
              ))}
            </View>

            <View
              style={[
                styles.hostCallout,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.borderLight,
                  borderLeftColor: LiquidGlassAccents.hostAccentBar,
                },
              ]}
              accessibilityRole="summary"
              accessibilityLabel="For organizers and hosts"
            >
              <View style={styles.hostCalloutHeader}>
                <Ionicons name="business-outline" size={20} color={LiquidGlassAccents.hostAccentBar} />
                <Text style={[styles.hostCalloutTitle, { color: colors.text }]} maxFontSizeMultiplier={1.8}>
                  For organizers & hosts
                </Text>
              </View>
              <Text style={[styles.hostCalloutBody, { color: colors.textSecondary }]} maxFontSizeMultiplier={2}>
                {HOST_PITCH_SUMMARY}
                {hostPitchExpanded ? HOST_PITCH_EXTENDED : ''}
              </Text>
              <Pressable
                onPress={toggleHostPitch}
                accessibilityRole="button"
                accessibilityLabel={hostPitchExpanded ? 'Show less about organizers' : 'Read more about organizers'}
                style={styles.hostPitchToggle}
                hitSlop={12}
              >
                <Text style={[styles.hostPitchToggleLabel, { color: LiquidGlassAccents.hostAccentBar }]}>
                  {hostPitchExpanded ? 'Show less' : 'Read more'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.spacer} />

            <View style={styles.actionStack}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                haptic
                rightIcon="arrow-forward"
                onPress={goToSignup}
                style={[shadows.medium, { backgroundColor: CultureTokens.gold }]}
                accessibilityLabel="Get started"
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
                accessibilityLabel="Log in with existing account"
              >
                I already have an account
              </Button>

              <View style={styles.socialDivider}>
                <View style={[styles.divLine, { backgroundColor: colors.borderLight }]} />
                <Text style={[styles.divText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.8}>
                  or continue with
                </Text>
                <View style={[styles.divLine, { backgroundColor: colors.borderLight }]} />
              </View>

              <View style={styles.socialRow}>
                <SocialButton provider="google" onPress={goToLocationViaGoogle} accessibilityLabel="Continue with Google" />
                <SocialButton provider="apple" onPress={goToLocationViaApple} accessibilityLabel="Continue with Apple" />
              </View>

              <Pressable
                onPress={handleSkip}
                style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.72 }]}
                hitSlop={12}
                accessibilityLabel="Skip onboarding and explore as guest"
                accessibilityRole="button"
                accessibilityHint="Completes guest setup and opens discovery"
              >
                <Text style={[styles.skipText, { color: colors.textSecondary }]} maxFontSizeMultiplier={2}>
                  Skip and explore
                </Text>
                <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>
      </AnimatedScrollView>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
    scrollContentDesktop: { paddingVertical: 48 },
    cardOuter: { width: '100%', maxWidth: 500, alignSelf: 'center' },
    cardOuterDesktop: { maxWidth: 560 },
    cardInner: {},
    heroRibbon: {
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroRibbonText: {
      fontSize: FontSize.callout,
      fontFamily: FontFamily.semibold,
      textAlign: 'center',
      lineHeight: LineHeight.callout,
      letterSpacing: 0.25,
      maxWidth: 400,
    },
    ideaRibbon: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: LiquidGlassTokens.corner.valueRibbon,
      borderWidth: StyleSheet.hairlineWidth * 2,
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginBottom: 20,
      gap: 10,
      overflow: 'hidden',
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
    hostCallout: {
      borderRadius: LiquidGlassTokens.corner.innerRow,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderLeftWidth: 4,
      padding: 16,
      marginBottom: 8,
    },
    hostCalloutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    hostCalloutTitle: {
      fontSize: FontSize.title3,
      fontFamily: FontFamily.semibold,
    },
    hostCalloutBody: {
      fontSize: FontSize.chip,
      fontFamily: FontFamily.regular,
      lineHeight: LineHeight.chip + 4,
    },
    hostPitchToggle: {
      marginTop: 10,
      alignSelf: 'flex-start',
      paddingVertical: 4,
    },
    hostPitchToggleLabel: {
      fontSize: FontSize.chip,
      fontFamily: FontFamily.semibold,
    },
    headerBlock: { alignItems: 'center', marginBottom: 26 },
    logoContainer: {
      marginBottom: 16,
    },
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
      lineHeight: LineHeight.micro + 2,
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
    spacer: { height: 22 },
    actionStack: { gap: 12 },
    socialDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    divLine: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
    divText: { fontSize: FontSize.chip, fontFamily: FontFamily.regular },
    socialRow: { flexDirection: 'row', gap: 12 },
    skipBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 16, paddingBottom: 8 },
    skipText: { fontSize: FontSize.body2, fontFamily: FontFamily.medium },
  });
