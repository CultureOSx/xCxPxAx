import { useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { useColors } from '@/hooks/useColors';
import { useMembershipUpgrade } from '@/hooks/useMembershipUpgrade';
import { useAuth } from '@/lib/auth';
import { CultureTokens } from '@/constants/theme';
import { routeWithRedirect } from '@/lib/routes';
import { goBackOrReplace } from '@/lib/navigation';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ColorTheme } from '@/constants/theme';

const FEATURES = [
  { icon: 'cash-outline',             title: '2% Cashback',         desc: 'On every ticket purchase, credited to your wallet', free: false, plus: true },
  { icon: 'time-outline',             title: 'Early Access',         desc: '48-hour head start on event tickets',              free: false, plus: true },
  { icon: 'gift-outline',             title: 'Exclusive Perks',      desc: 'Members-only deals from local businesses',          free: false, plus: true },
  { icon: 'shield-checkmark-outline', title: 'Plus Badge',           desc: 'Stand out in the community',                       free: false, plus: true },
  { icon: 'calendar-outline',         title: 'Event Discovery',      desc: 'Browse and discover cultural events',               free: true,  plus: true },
  { icon: 'people-outline',           title: 'Communities',          desc: 'Join and engage with cultural groups',              free: true,  plus: true },
  { icon: 'ticket-outline',           title: 'Ticket Purchases',     desc: 'Buy tickets to events',                            free: true,  plus: true },
  { icon: 'person-outline',           title: 'Profile & Directory',  desc: 'Create and share your profile',                    free: true,  plus: true },
];

const isWeb = Platform.OS === 'web';
const PREMIUM_BLACK = '#0A0A0B';
const PREMIUM_CHARCOAL = '#141417';
const PREMIUM_SILVER = '#C7CCD6';
const PREMIUM_WHITE = '#F5F7FA';
const PREMIUM_LINE = '#2A2D33';
const IS_ANDROID = Platform.OS === 'android';
const IS_WEB = Platform.OS === 'web';

function GlassBackButton({ onPress, colors }: { onPress: () => void; colors: ColorTheme }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { width: 40, height: 40, borderRadius: 12, overflow: 'hidden', transform: [{ scale: pressed ? 0.95 : 1 }] },
      ]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <LiquidGlassPanel
        borderRadius={12}
        bordered={false}
        style={StyleSheet.absoluteFill}
        contentStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </LiquidGlassPanel>
    </Pressable>
  );
}

function MembershipUpgradeSkeleton({ topInset, insets, colors }: { topInset: number; insets: { top: number }; colors: ColorTheme }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + topInset }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Skeleton width={38} height={38} borderRadius={11} />
        <Skeleton width={120} height={24} borderRadius={6} />
        <View style={{ width: 38 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 40, gap: 32 }}>
        <View style={{ alignItems: 'center', gap: 16 }}>
          <Skeleton width={82} height={82} borderRadius={41} />
          <Skeleton width={200} height={38} borderRadius={10} />
          <Skeleton width={160} height={20} borderRadius={6} />
          <Skeleton width="100%" height={64} borderRadius={16} />
        </View>
        <View style={{ gap: 16 }}>
          <Skeleton width="100%" height={88} borderRadius={20} />
          <Skeleton width="100%" height={88} borderRadius={20} />
          <Skeleton width="100%" height={88} borderRadius={20} />
        </View>
      </ScrollView>
    </View>
  );
}

export default function UpgradeScreen() {
  const colors = useColors();
  const s = getStyles(colors);
  const insets = useSafeAreaInsets();
  const webTop = 0;
  const pathname = usePathname();
  const params = useLocalSearchParams<{ status?: string }>();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const {
    isAuthenticated,
    isMembershipLoading,
    membership,
    isPlus,
    memberCount,
    billingPeriod,
    setBillingPeriod,
    price,
    perMonth,
    loading,
    executeSubscribe,
    executeCancel,
  } = useMembershipUpgrade();

  const reducedMotion = useReducedMotion();
  const status = useMemo(() => (typeof params.status === 'string' ? params.status : undefined), [params.status]);

  useEffect(() => {
    if (!isAuthenticated || !status) return;
    if (status === 'success' || status === 'cancelled') {
      void queryClient.invalidateQueries({ queryKey: ['membership', userId] });
      void queryClient.invalidateQueries({ queryKey: ['membership-member-count'] });
    }
  }, [status, isAuthenticated, queryClient, userId]);

  if (!isAuthenticated) {
    return (
      <View style={[s.container, { paddingTop: insets.top + webTop }]}>
        {/* Header with back button */}
        <View style={s.header}>
          <GlassBackButton onPress={() => goBackOrReplace('/(tabs)/profile')} colors={colors} />
          <Text style={s.headerTitle}>CulturePass+</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section - Locked State */}
          <View style={s.heroSection}>
            <View style={[s.lockedIconWrap, { backgroundColor: PREMIUM_SILVER + '20' }]}>
              <Ionicons name="globe" size={44} color={PREMIUM_SILVER} />
            </View>
            <Text style={s.heroTitle}>Sign In to Unlock</Text>
            <Text style={s.heroTagline}>Premium cultural experiences await</Text>
            <Text style={s.heroDesc}> 
              Create your account or sign in to get exclusive access to CulturePass+ benefits and discover your next favorite cultural event.
            </Text>
          </View>

          {/* Preview of benefits */}
          <View style={s.benefitsPreview}>
            <Text style={s.sectionTitle}>What You&apos;ll Get</Text>
            {[
              { icon: 'cash-outline', title: '2% Cashback', desc: 'Earn rewards on every ticket', color: PREMIUM_SILVER },
              { icon: 'time-outline', title: '48h Early Access', desc: 'First to buy hot tickets', color: PREMIUM_SILVER },
              { icon: 'gift-outline', title: 'Exclusive Perks', desc: 'Members-only deals & discounts', color: PREMIUM_SILVER },
              { icon: 'shield-checkmark-outline', title: 'Plus Badge', desc: 'Stand out in the community', color: PREMIUM_SILVER },
            ].map((benefit) => (
              <View key={benefit.title} style={[s.benefitItem, { borderLeftColor: benefit.color }]}>
                <View style={[s.benefitIconWrap, { backgroundColor: benefit.color + '15' }]}>
                  <Ionicons name={benefit.icon as keyof typeof Ionicons.glyphMap} size={20} color={benefit.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.benefitTitle}>{benefit.title}</Text>
                  <Text style={s.benefitDesc}>{benefit.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Social proof */}
          {memberCount > 0 && (
            <View style={s.socialProofOuter}>
              <LiquidGlassPanel
                borderRadius={99}
                bordered={false}
                style={s.socialProofGlass}
                contentStyle={s.socialProofInner}
              >
                <Ionicons name="people" size={16} color={PREMIUM_SILVER} />
                <Text style={s.socialProofText}>
                  Join {memberCount.toLocaleString()}+ members already enjoying CulturePass+
                </Text>
              </LiquidGlassPanel>
            </View>
          )}

          {/* CTA Section */}
          <View style={s.ctaSection}>
            <Button
              onPress={() => router.push(routeWithRedirect('/(onboarding)/login', pathname))}
              leftIcon="arrow-forward"
              style={{ width: '100%', marginBottom: 12 }}
            >
              Sign In to Activate
            </Button>
            <Button
              variant="outline"
              onPress={() => router.replace('/')}
              style={{ width: '100%', marginBottom: 12 }}
            >
              Back to Discovery
            </Button>
            <Text style={s.ctaFine}>{"Don't have an account? Sign up during login"}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (isMembershipLoading && !membership) {
    return <MembershipUpgradeSkeleton topInset={webTop} insets={insets} colors={colors} />;
  }

  const expiryLabel = membership?.expiresAt ? new Date(membership.expiresAt).toLocaleDateString() : null;

  return (
    <View style={[s.container, { paddingTop: insets.top + webTop }]}>
      <LinearGradient
        colors={[PREMIUM_BLACK, PREMIUM_CHARCOAL]}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.6 }]}
      />
      <LinearGradient
        colors={['#FFFFFF', '#9CA3AF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.05 }]}
        pointerEvents="none"
      />
      <View style={s.header}>
        <GlassBackButton onPress={() => goBackOrReplace('/(tabs)/profile')} colors={colors} />
        <Text style={s.headerTitle} numberOfLines={1} adjustsFontSizeToFit>CulturePass+</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {status === 'success' && (
          <View style={[s.statusBanner, { backgroundColor: CultureTokens.success + '16', borderColor: CultureTokens.success + '3A' }]}>
            <Ionicons name="checkmark-circle" size={18} color={CultureTokens.success} />
            <Text style={[s.statusText, { color: colors.text }]}>Payment confirmed. Activating membership now.</Text>
          </View>
        )}
        {status === 'cancelled' && (
          <View style={[s.statusBanner, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            <Text style={[s.statusText, { color: colors.textSecondary }]}>Checkout cancelled. You can restart any time.</Text>
          </View>
        )}

        {/* Hero */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.springify().damping(16).stiffness(120).duration(600)}
          style={s.heroSection}
        >
          <View style={s.heroIconWrap}>
            <Ionicons name="globe" size={44} color={PREMIUM_SILVER} />
          </View>
          <Text style={s.heroTitle}>CulturePass+</Text>
          <Text style={s.heroTagline}>Access. Advantage. Influence.</Text>
          <Text style={s.heroDesc}> 
            Unlock premium cultural experiences with cashback rewards, early access to events, and exclusive perks from local businesses.
          </Text>
        </Animated.View>

        {/* Account state + integration card */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.springify().delay(80)} style={s.integrationCardWrap}>
          <LiquidGlassPanel borderRadius={20} bordered={false} style={s.integrationCard}>
            <View style={s.integrationHeader}>
              <View>
                <Text style={s.integrationTitle}>Membership Status</Text>
                <Text style={s.integrationSub}>
                  {membership?.status === 'active' ? `Active · ${membership.tierLabel}` : 'Free tier'}
                </Text>
              </View>
              <View style={[s.integrationPill, { backgroundColor: isPlus ? CultureTokens.success + '20' : colors.surface }]}>
                <Text style={[s.integrationPillText, { color: isPlus ? PREMIUM_WHITE : colors.textSecondary }]}>
                  {isPlus ? 'ACTIVE' : 'FREE'}
                </Text>
              </View>
            </View>
            <View style={s.integrationStats}>
              <View style={[s.integrationStatItem, { borderColor: colors.borderLight }]}>
                <Text style={s.integrationStatLabel}>Cashback</Text>
                <Text style={s.integrationStatValue}>{Math.round((membership?.cashbackRate ?? 0) * 100)}%</Text>
              </View>
              <View style={[s.integrationStatItem, { borderColor: colors.borderLight }]}>
                <Text style={s.integrationStatLabel}>Early Access</Text>
                <Text style={s.integrationStatValue}>{membership?.earlyAccessHours ?? 0}h</Text>
              </View>
              <View style={[s.integrationStatItem, { borderColor: colors.borderLight }]}>
                <Text style={s.integrationStatLabel}>Expires</Text>
                <Text style={s.integrationStatValue}>{expiryLabel ?? '—'}</Text>
              </View>
            </View>
          </LiquidGlassPanel>
        </Animated.View>

        {memberCount > 0 && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.springify().damping(14).stiffness(110).delay(100)}
            style={s.socialProofOuter}
          >
            <LiquidGlassPanel
              borderRadius={99}
              bordered={false}
              style={s.socialProofGlass}
              contentStyle={s.socialProofInner}
            >
              <Ionicons name="people" size={16} color={PREMIUM_SILVER} />
              <Text style={s.socialProofText}>
                Join {memberCount.toLocaleString()}+ members already enjoying CulturePass+
              </Text>
            </LiquidGlassPanel>
          </Animated.View>
        )}

        {/* Billing toggle */}
        {!isPlus && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.springify().damping(15).stiffness(115).delay(200)}
            style={s.pricingSection}
          >
            <View style={s.toggleRow}>
              <Pressable
                style={[s.toggleBtn, billingPeriod === 'monthly' && s.toggleActive]}
                onPress={() => { if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBillingPeriod('monthly'); }}
              >
                <Text style={[s.toggleText, billingPeriod === 'monthly' && { color: colors.text }]}>Monthly</Text>
              </Pressable>
              <Pressable
                style={[s.toggleBtn, billingPeriod === 'yearly' && s.toggleActive]}
                onPress={() => { if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBillingPeriod('yearly'); }}
              >
                <Text style={[s.toggleText, billingPeriod === 'yearly' && { color: colors.text }]}>Yearly</Text>
                {billingPeriod === 'yearly' && (
                  <View style={s.saveBadge}>
                    <Text style={s.saveBadgeText}>SAVE 28%</Text>
                  </View>
                )}
              </Pressable>
            </View>
              <LiquidGlassPanel
                borderRadius={24}
                bordered={false}
                style={[s.priceCard, { borderWidth: 1, borderColor: colors.borderLight + '50' }]}
                contentStyle={s.priceCardInner}
              >
                <Text style={s.priceAmount} adjustsFontSizeToFit numberOfLines={1}>{price}</Text>
                <Text style={s.pricePeriod}>
                  {billingPeriod === 'yearly' ? 'PER YEAR' : 'PER MONTH'}
                </Text>
                {billingPeriod === 'yearly' && (
                  <View style={s.breakdownBadge}>
                    <Text style={s.priceBreakdown}>ONLY {perMonth} / MONTH</Text>
                  </View>
                )}
              </LiquidGlassPanel>
          </Animated.View>
        )}

        {/* Feature comparison */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.springify().damping(14).stiffness(100).delay(300)}
          style={s.comparisonSectionOuter}
        >
          <LiquidGlassPanel
            borderRadius={24}
            bordered={false}
            style={[s.comparisonSectionGlass, { borderWidth: 1, borderColor: colors.borderLight + '50' }]}
            contentStyle={s.comparisonSectionInner}
          >
          <Text style={s.sectionTitle}>What&apos;s Included</Text>
          <View style={s.comparisonHeader}>
            <View style={{ flex: 1 }} />
            <View style={s.compColHeader}>
              <Text style={s.compColLabel}>Free</Text>
            </View>
            <View style={s.compColPlus}>
              <Ionicons name="star" size={12} color={colors.background} />
              <Text style={[s.compColLabel, { color: colors.background }]}> Plus</Text>
            </View>
          </View>

          {FEATURES.map((f, i) => (
            <View key={f.title} style={[s.compRow, i === FEATURES.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={s.compFeature}>
                <Ionicons name={f.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={s.compFeatureTitle}>{f.title}</Text>
                  <Text style={s.compFeatureDesc}>{f.desc}</Text>
                </View>
              </View>
              <View style={s.compCheck}>
                {f.free
                  ? <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.3)" />
                  : <Ionicons name="close-circle"    size={20} color="rgba(255,255,255,0.1)" />
                }
              </View>
              <View style={[s.compCheck, s.compCheckPlus]}>
                <Ionicons name="checkmark-circle" size={20} color={PREMIUM_SILVER} />
              </View>
            </View>
          ))}
          </LiquidGlassPanel>
        </Animated.View>

        {/* Highlights */}
        <View style={s.highlightsSection}>
          {[
            { bg: '#2D323A', color: PREMIUM_SILVER, icon: 'cash',  title: '2% Cashback',    desc: 'Every ticket purchase earns you cashback, automatically credited to your wallet.' },
            { bg: PREMIUM_SILVER + '20', color: PREMIUM_SILVER, icon: 'flash', title: '48h Early Access', desc: 'Get a 48-hour head start on hot event tickets before they go on sale to everyone.' },
            { bg: '#2D323A', color: PREMIUM_SILVER, icon: 'gift',  title: 'Exclusive Perks', desc: 'Access members-only deals and discounts from restaurants, shops, and cultural venues.' },
          ].map((h, i) => (
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.springify().damping(14).delay(400 + i * 100)}
              key={h.title}
              style={s.highlightCardOuter}
            >
              <LiquidGlassPanel
                borderRadius={20}
                bordered={false}
                style={[s.highlightCardGlass, { borderWidth: 1, borderColor: colors.borderLight + '50' }]}
                contentStyle={s.highlightCardInner}
              >
                <View style={[s.highlightIcon, { backgroundColor: h.bg }]}>
                  <Ionicons name={h.icon as keyof typeof Ionicons.glyphMap} size={24} color={h.color} />
                </View>
                <Text style={h.title === '2% Cashback' ? [s.highlightTitle, { color: CultureTokens.success }] : s.highlightTitle}>{h.title}</Text>
                <Text style={s.highlightDesc}>{h.desc}</Text>
              </LiquidGlassPanel>
            </Animated.View>
          ))}
        </View>

        {/* Active / Subscribe CTA */}
        {isPlus ? (
          <Animated.View entering={reducedMotion ? undefined : FadeInUp.springify().damping(15)} style={s.activeSection}>
            <View style={s.activeBadge}>
              <Ionicons name="checkmark-circle" size={20} color={CultureTokens.success} />
              <Text style={s.activeText}>{"You're a CulturePass+ member"}</Text>
            </View>
            <Text style={s.activeSubtext}>Thank you for being part of the CulturePass+ community.</Text>
            <Button
              variant="outline"
              onPress={executeCancel}
              loading={loading}
              style={{ borderColor: CultureTokens.coral + '40', borderWidth: 1 }}
              labelStyle={{ color: CultureTokens.coral }}
            >
              Cancel Membership
            </Button>
          </Animated.View>
        ) : (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInUp.springify().damping(18).stiffness(90).delay(700)}
            style={s.ctaSection}
          >
            <Button
              onPress={executeSubscribe}
              loading={loading}
              leftIcon="star"
              variant="gradient"
              gradientColors={['#E5E7EB', '#9CA3AF']}
              style={{ width: '100%', marginBottom: 12 }}
              labelStyle={{ color: PREMIUM_BLACK }}
            >
              Get CulturePass+ for {price}{billingPeriod === 'yearly' ? '/yr' : '/mo'}
            </Button>
            <Text style={s.ctaFine}>14-day trial. Managed securely by Stripe.</Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:          { flex: 1, backgroundColor: PREMIUM_BLACK },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PREMIUM_LINE },
  headerTitle:        { fontSize: IS_WEB ? 20 : 18, fontFamily: 'Poppins_700Bold', color: PREMIUM_WHITE },
  scroll:             { flex: 1 },
  scrollContent:      { paddingHorizontal: 20, flexGrow: 1 },
  heroSection:        { alignItems: 'center', paddingTop: 24, paddingBottom: 12 },
  heroIconWrap:       { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: PREMIUM_SILVER + '20' },
  lockedIconWrap:     { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  heroTitle:          { fontSize: IS_WEB ? 38 : IS_ANDROID ? 34 : 32, fontFamily: 'Poppins_700Bold', marginBottom: 8, color: PREMIUM_WHITE, textAlign: 'center' },
  heroTagline:        { fontSize: IS_WEB ? 15 : 14, fontFamily: 'Poppins_700Bold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20, color: PREMIUM_SILVER, textAlign: 'center' },
  heroDesc:           { fontSize: IS_WEB ? 17 : 16, fontFamily: 'Poppins_500Medium', textAlign: 'center', lineHeight: IS_WEB ? 27 : 24, paddingHorizontal: 10, color: '#E5E7EB' },
  socialProofOuter:   { marginTop: 16, marginBottom: 32, alignSelf: 'center' },
  socialProofGlass:   { borderWidth: 1, borderColor: '#9CA3AF44' },
  socialProofInner:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  socialProofText:    { fontSize: IS_WEB ? 14 : 13, fontFamily: 'Poppins_600SemiBold', marginLeft: 10, color: PREMIUM_WHITE },
  benefitsPreview:    { marginVertical: 24 },
  benefitItem:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 20, marginBottom: 12, backgroundColor: PREMIUM_CHARCOAL, borderWidth: 1, borderColor: PREMIUM_LINE, borderLeftWidth: 4 },
  benefitIconWrap:    { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16, flexShrink: 0 },
  benefitTitle:       { fontSize: IS_WEB ? 17 : 16, fontFamily: 'Poppins_700Bold', marginBottom: 4, color: PREMIUM_WHITE },
  benefitDesc:        { fontSize: IS_WEB ? 14 : 13, fontFamily: 'Poppins_500Medium', color: '#D1D5DB', lineHeight: 20 },
  pricingSection:     { marginTop: 16 },
  toggleRow:          { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 24, backgroundColor: PREMIUM_CHARCOAL, borderWidth: 1, borderColor: PREMIUM_LINE },
  toggleBtn:          { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, flexDirection: 'row', justifyContent: 'center' },
  toggleActive:       { backgroundColor: '#1C1F24', shadowColor: 'black', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  toggleText:         { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: 0.5 },
  saveBadge:          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8, backgroundColor: '#374151' },
  saveBadgeText:      { fontSize: 10, fontFamily: 'Poppins_700Bold', color: 'white' },
  priceCard:          {
    ...Platform.select({
      web: { boxShadow: '0px 8px 28px rgba(0,0,0,0.12)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
    }),
  },
  priceCardInner:     { alignItems: 'center', paddingVertical: IS_WEB ? 36 : 32 },
  priceAmount:        { fontSize: IS_WEB ? 62 : 56, fontFamily: 'Poppins_700Bold', color: PREMIUM_WHITE, letterSpacing: -1 },
  pricePeriod:        { fontSize: 13, fontFamily: 'Poppins_700Bold', marginTop: -4, color: colors.textTertiary, letterSpacing: 1 },
  breakdownBadge:     { marginTop: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#6B7280' },
  priceBreakdown:     { fontSize: 12, fontFamily: 'Poppins_700Bold', color: PREMIUM_SILVER },
  sectionTitle:       { fontSize: 12, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, color: '#D1D5DB', textAlign: 'center' },
  comparisonSectionOuter: { marginTop: 32, marginBottom: 24 },
  comparisonSectionGlass: {
    ...Platform.select({
      web: { boxShadow: '0px 8px 32px rgba(0,0,0,0.08)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
    }),
  },
  comparisonSectionInner: { paddingVertical: 20 },
  comparisonHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingRight: 4, paddingHorizontal: 16 },
  compColHeader:      { width: 60, alignItems: 'center', paddingVertical: 6 },
  compColPlus:        { width: 70, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, backgroundColor: PREMIUM_SILVER, shadowColor: '#9CA3AF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  compColLabel:       { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#D1D5DB' },
  compRow:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#2A2D3380', paddingHorizontal: 16 },
  compFeature:        { flex: 1, flexDirection: 'row', alignItems: 'center' },
  compFeatureTitle:   { fontSize: IS_WEB ? 15 : 14, fontFamily: 'Poppins_700Bold', color: PREMIUM_WHITE },
  compFeatureDesc:    { fontSize: IS_WEB ? 13 : 12, fontFamily: 'Poppins_500Medium', marginTop: 2, color: '#9CA3AF', lineHeight: 18 },
  compCheck:          { width: 60, alignItems: 'center' },
  compCheckPlus:      { width: 70 },
  highlightsSection:  { marginBottom: 32, gap: 12 },
  highlightCardOuter: {},
  highlightCardGlass: {
    ...Platform.select({
      web: { boxShadow: '0px 4px 20px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
    }),
  },
  highlightCardInner: { padding: 20 },
  highlightIcon:      { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  highlightTitle:     { fontSize: 17, fontFamily: 'Poppins_700Bold', marginBottom: 6, color: PREMIUM_WHITE },
  highlightDesc:      { fontSize: IS_WEB ? 14 : 13, fontFamily: 'Poppins_500Medium', lineHeight: 22, color: '#D1D5DB' },
  activeSection:      { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  activeBadge:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 99, marginBottom: 20, backgroundColor: '#1C1F24', borderWidth: 1, borderColor: PREMIUM_LINE },
  activeText:         { fontSize: 15, fontFamily: 'Poppins_700Bold', marginLeft: 10, color: PREMIUM_WHITE },
  activeSubtext:      { fontSize: 14, fontFamily: 'Poppins_500Medium', marginBottom: 32, textAlign: 'center', color: '#D1D5DB', lineHeight: 22 },
  ctaSection:         { paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center' },
  ctaFine:            { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#D1D5DB', marginTop: 16, textAlign: 'center' },
  statusBanner:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginTop: 14 },
  statusText:         { fontSize: 12, fontFamily: 'Poppins_500Medium', flex: 1 },
  integrationCardWrap:{ marginBottom: 22 },
  integrationCard:    { borderWidth: 1, borderColor: PREMIUM_LINE, ...Platform.select({ web: { boxShadow: '0px 6px 22px rgba(0,0,0,0.25)' }, default: {} }) },
  integrationHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 14 },
  integrationTitle:   { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.text },
  integrationSub:     { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#D1D5DB', marginTop: 2 },
  integrationPill:    { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  integrationPillText:{ fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 0.6 },
  integrationStats:   { flexDirection: 'row', gap: 8, padding: 14 },
  integrationStatItem:{ flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8 },
  integrationStatLabel:{ fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: '#9CA3AF', marginBottom: 3, textTransform: 'uppercase' },
  integrationStatValue:{ fontSize: 12, fontFamily: 'Poppins_700Bold', color: PREMIUM_WHITE },
});
