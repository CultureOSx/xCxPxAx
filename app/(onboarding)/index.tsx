import { View, Text, Pressable, StyleSheet, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { router, usePathname } from 'expo-router';
import Head from 'expo-router/head';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CultureTokens, gradients, CardTokens, glass, shadows } from '@/constants/theme';
import { useCallback, useState } from 'react';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { SocialButton } from '@/components/ui/SocialButton';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { BlurView } from 'expo-blur';
import { useColors } from '@/hooks/useColors';
import { Image } from 'expo-image';
import { BrandWordmark } from '@/components/ui/BrandWordmark';

const HERO_TAGLINE = 'Celebrate Your Culture, Connect Your Community';

const VALUE_RIBBON =
  'A dedicated home for cultural events — discover what matters, skip the noisy social feed.';

/** Shown first — scannable on mobile. */
const HOST_PITCH_SUMMARY =
  'List cultural events where they are easy to find — not lost in a social feed. Reach the right audience, sell tickets, and give attendees one place to come back to.';

/** Optional detail for organizers who want the full story. */
const HOST_PITCH_EXTENDED =
  ' Share the same links on WhatsApp or Facebook; CulturePass is the home base. You keep your existing tools — we add a dedicated venue for your program and deeper engagement.';

const WEB_WELCOME_TITLE = 'CulturePass — Celebrate Your Culture, Connect Your Community';
const WEB_WELCOME_DESCRIPTION =
  'Discover cultural events and communities built for diaspora cities. Organizers reach the right audience; attendees find festivals, tickets, and belonging in one place.';

const FEATURES = [
  { icon: 'calendar' as const, color: CultureTokens.gold, bg: 'rgba(255, 140, 66, 0.15)', text: 'Discover cultural events near you' },
  { icon: 'people' as const, color: CultureTokens.coral, bg: 'rgba(255, 94, 91, 0.15)', text: 'Join vibrant communities' },
  { icon: 'gift' as const, color: CultureTokens.gold, bg: 'rgba(255, 200, 87, 0.15)', text: 'Unlock exclusive member perks' },
];

export default function WelcomeScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  
  const { completeOnboarding } = useOnboarding();
  const pathname = usePathname();

  const goToSignup = useCallback(() => router.push({ pathname: '/(onboarding)/signup', params: { redirectTo: pathname } }), [pathname]);
  const goToLogin = useCallback(() => router.push({ pathname: '/(onboarding)/login', params: { redirectTo: pathname } }), [pathname]);
  const goToLocationViaGoogle = useCallback(() => router.push('/(onboarding)/location'), []);
  const goToLocationViaApple = useCallback(() => router.push('/(onboarding)/location'), []);

  const cardPad = CardTokens.paddingLarge * 2;
  const [hostPitchExpanded, setHostPitchExpanded] = useState(false);

  const toggleHostPitch = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    setHostPitchExpanded((v) => !v);
  }, []);

  const handleSkip = useCallback(() => {
    completeOnboarding();
    router.replace('/(tabs)');
  }, [completeOnboarding]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, right: -50, backgroundColor: CultureTokens.indigo, opacity: 0.5, ...Platform.select({ web: { filter: 'blur(50px)' }, default: {} }) } as any]} />
      <View style={[styles.orb, { bottom: -50, left: -50, backgroundColor: CultureTokens.gold, opacity: 0.3, ...Platform.select({ web: { filter: 'blur(50px)' }, default: {} }) } as any]} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          { paddingTop: isDesktop ? 60 : topInset + 40, paddingBottom: bottomInset + 30 }
        ]}
      >
        <View style={[styles.cardContainer, isDesktop && styles.cardContainerDesktop, { borderRadius: CardTokens.radiusLarge }]}>
          {Platform.OS === 'ios' || Platform.OS === 'web' ? (
            <BlurView intensity={isDesktop ? 60 : 40} tint="dark" style={[StyleSheet.absoluteFill, styles.cardBlur, { borderRadius: CardTokens.radiusLarge, borderColor: colors.borderLight }]} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.cardBlur, { backgroundColor: glass.dark.backgroundColor, borderRadius: CardTokens.radiusLarge, borderColor: colors.borderLight }]} />
          )}

          <View style={[styles.cardContent, { padding: cardPad }]}>
            {Platform.OS === 'web' && (
              <Head>
                <title>{WEB_WELCOME_TITLE}</title>
                <meta name="description" content={WEB_WELCOME_DESCRIPTION} />
              </Head>
            )}

            <LinearGradient
              colors={[CultureTokens.indigo, CultureTokens.coral]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.heroRibbon,
                {
                  marginHorizontal: -cardPad,
                  marginTop: -cardPad,
                  paddingHorizontal: cardPad,
                  borderTopLeftRadius: CardTokens.radiusLarge,
                  borderTopRightRadius: CardTokens.radiusLarge,
                },
              ]}
            >
              <Text style={styles.heroRibbonText}>{HERO_TAGLINE}</Text>
            </LinearGradient>

            <View style={styles.headerBlock}>
              <View style={[styles.logoContainer, { backgroundColor: 'transparent', borderColor: 'transparent' }]}>
                <Image 
                  source={require('@/assets/images/culturepass-logo.png')} 
                  style={{ width: 100, height: 100, borderRadius: 50 }} 
                  contentFit="contain"
                />
              </View>
              <BrandWordmark size="xl" withTagline={false} centered light />
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                One trusted place for cultural discovery, tickets, and community — built for diaspora cities worldwide.
              </Text>
            </View>

            <View
              style={[
                styles.ideaRibbon,
                {
                  backgroundColor: 'rgba(255, 200, 87, 0.12)',
                  borderColor: `${CultureTokens.gold}44`,
                },
              ]}
              accessibilityRole="none"
              accessibilityLabel={VALUE_RIBBON}
            >
              <View style={[styles.ideaRibbonAccent, { backgroundColor: CultureTokens.gold }]} />
              <Ionicons name="sparkles-outline" size={22} color={CultureTokens.gold} style={styles.ideaRibbonIcon} />
              <Text style={[styles.ideaRibbonText, { color: colors.textInverse }]}>{VALUE_RIBBON}</Text>
            </View>

            <View style={styles.featureList}>
              {FEATURES.map((f, i) => (
                <Reanimated.View
                  key={i}
                  entering={FadeInDown.delay(i * 100).springify().damping(18)}
                  style={[styles.featureRow, { backgroundColor: glass.overlay.backgroundColor, borderColor: colors.borderLight }]}
                >
                  <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                    <Ionicons name={f.icon} size={20} color={f.color} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.textInverse }]}>{f.text}</Text>
                </Reanimated.View>
              ))}
            </View>

            <View
              style={[
                styles.hostCallout,
                {
                  backgroundColor: glass.overlay.backgroundColor,
                  borderColor: colors.borderLight,
                  borderLeftColor: CultureTokens.teal,
                },
              ]}
              accessibilityRole="summary"
              accessibilityLabel="For organizers and hosts"
            >
              <View style={styles.hostCalloutHeader}>
                <Ionicons name="business-outline" size={20} color={CultureTokens.teal} />
                <Text style={[styles.hostCalloutTitle, { color: colors.textInverse }]}>For organizers & hosts</Text>
              </View>
              <Text style={[styles.hostCalloutBody, { color: colors.textSecondary }]}>
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
                <Text style={[styles.hostPitchToggleLabel, { color: CultureTokens.teal }]}>
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
                rightIcon="arrow-forward"
                onPress={goToSignup}
                style={[shadows.medium, { backgroundColor: CultureTokens.gold }]}
              >
                Create Account
              </Button>

              <Button
                variant="outline"
                size="lg"
                fullWidth
                onPress={goToLogin}
                style={{ borderColor: colors.border, backgroundColor: colors.overlay }}
                labelStyle={{ color: colors.textInverse }}
              >
                I already have an account
              </Button>

              <View style={styles.socialDivider}>
                <View style={[styles.divLine, { backgroundColor: colors.borderLight }]} />
                <Text style={[styles.divText, { color: colors.textSecondary }]}>or continue with</Text>
                <View style={[styles.divLine, { backgroundColor: colors.borderLight }]} />
              </View>

              <View style={styles.socialRow}>
                <SocialButton provider="google" onPress={goToLocationViaGoogle} />
                <SocialButton provider="apple" onPress={goToLocationViaApple} />
              </View>

              <Pressable 
                onPress={handleSkip} 
                style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
                hitSlop={12}
                accessibilityLabel="Skip onboarding and explore as guest"
                accessibilityRole="button"
              >
                <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip and explore</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1 },
  gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.85 },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
  scrollContentDesktop: { paddingVertical: 60 },
  
  cardContainer: { width: '100%', maxWidth: 500, alignSelf: 'center', overflow: 'hidden' },
  cardContainerDesktop: { maxWidth: 560 },
  cardBlur: { borderWidth: 1 },
  cardContent: { },
  
  heroRibbon: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRibbonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
    maxWidth: 400,
  },
  ideaRibbon: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
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
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 20,
  },
  hostCallout: {
    borderRadius: 16,
    borderWidth: 1,
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
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  hostCalloutBody: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 21,
  },
  hostPitchToggle: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  hostPitchToggleLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  headerBlock: { alignItems: 'center', marginBottom: 28 },
  logoContainer: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, borderWidth: 1,
  },
  title: { fontSize: 36, fontFamily: 'Poppins_700Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 12, lineHeight: 22 },

  featureList: { gap: 12, marginBottom: 16 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 12, borderWidth: 1,
  },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 14, fontFamily: 'Poppins_500Medium', flex: 1 },

  spacer: { height: 24 },
  actionStack: { gap: 12 },

  socialDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  divLine: { flex: 1, height: 1 },
  divText: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  socialRow: { flexDirection: 'row', gap: 12 },

  skipBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 16, paddingBottom: 8 },
  skipText: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
});
