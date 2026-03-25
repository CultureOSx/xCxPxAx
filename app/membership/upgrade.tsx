import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/lib/auth';
import { api, type MembershipSummary } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import { routeWithRedirect } from '@/lib/routes';
import { goBackOrReplace } from '@/lib/navigation';

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

export default function UpgradeScreen() {
  const colors = useColors();
  const s = getStyles(colors);
  const insets = useSafeAreaInsets();
  const webTop = 0;
  const pathname = usePathname();
  const { userId, isAuthenticated } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const { data: membership } = useQuery<MembershipSummary>({
    queryKey: ['membership', userId],
    queryFn: () => api.membership.get(userId!),
    enabled: !!userId,
  });

  const { data: memberCountData } = useQuery({
    queryKey: ['membership-member-count'],
    queryFn: () => api.membership.memberCount(),
  });

  const isPlus = membership?.tier === 'plus' && membership?.status === 'active';
  const memberCount = memberCountData?.count ?? 0;
  const price    = billingPeriod === 'yearly' ? '$69' : '$7.99';
  const perMonth = billingPeriod === 'yearly' ? '$5.75' : '$7.99';

  const handleSubscribe = useCallback(async () => {
    if (!userId) {
      Alert.alert('Login required', 'Please sign in to activate CulturePass+.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push(routeWithRedirect('/(onboarding)/login', pathname) as any) },
      ]);
      return;
    }
    setLoading(true);
    try {
      if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const data = await api.membership.subscribe({ billingPeriod });
      if (data.alreadyActive) {
        await queryClient.invalidateQueries({ queryKey: ['membership', userId] });
        Alert.alert('Already Active', 'Your CulturePass+ membership is already active.');
        return;
      }
      if (data.checkoutUrl) {
        await WebBrowser.openBrowserAsync(data.checkoutUrl);
        await queryClient.invalidateQueries({ queryKey: ['membership', userId] });
        await queryClient.invalidateQueries({ queryKey: ['membership-member-count'] });

        const pollForUpdate = async (retries = 0): Promise<void> => {
          if (retries >= 8) return;
          try {
            const checkData = await api.membership.get(userId);
            if (checkData?.tier === 'plus' && checkData?.status === 'active') {
              await queryClient.invalidateQueries({ queryKey: ['membership', userId] });
              if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Welcome to CulturePass+!', 'Your membership is now active. Enjoy early access, cashback rewards, and exclusive perks!');
              return;
            }
          } catch {}
          await new Promise(r => setTimeout(r, 2000));
          return pollForUpdate(retries + 1);
        };
        await pollForUpdate();
      } else if (data.devMode) {
        await queryClient.invalidateQueries({ queryKey: ['membership', userId] });
        if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Dev Mode', 'Membership upgraded to Plus (dev mode — no Stripe charge).');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to start subscription';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, [userId, billingPeriod, pathname]);

  const handleCancel = useCallback(async () => {
    if (!userId) return;
    Alert.alert(
      'Cancel Membership',
      'Are you sure you want to cancel your CulturePass+ membership? Your subscription will be cancelled immediately and you will lose access to exclusive perks and cashback.',
      [
        { text: 'Keep Membership', style: 'cancel' },
        {
          text: 'Cancel Membership',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.membership.cancel();
              await queryClient.invalidateQueries({ queryKey: ['membership', userId] });
              await queryClient.invalidateQueries({ queryKey: ['membership-member-count'] });
              queryClient.setQueryData(['membership', userId], {
                tier: 'free', tierLabel: 'Free', status: 'inactive', expiresAt: null,
                cashbackRate: 0, cashbackMultiplier: 1, earlyAccessHours: 0,
                eventsAttended: membership?.eventsAttended ?? 0,
              } satisfies MembershipSummary);
              if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Membership Cancelled', 'Your CulturePass+ membership has been cancelled. You can re-subscribe anytime.');
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Failed to cancel';
              Alert.alert('Error', msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [userId, membership]);

  if (!isAuthenticated) {
    return (
      <View style={[s.container, { paddingTop: insets.top + webTop }]}>
        {/* Header with back button */}
        <View style={s.header}>
          <Pressable 
            onPress={() => goBackOrReplace('/(tabs)/profile')} 
            style={({ pressed }) => [s.backBtn, { transform: [{ scale: pressed ? 0.95 : 1 }], backgroundColor: colors.surface + '80' }]}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
            {!isWeb && <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />}
          </Pressable>
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
            <View style={[s.lockedIconWrap, { backgroundColor: CultureTokens.gold + '15' }]}>
              <Ionicons name="globe" size={44} color={CultureTokens.gold} />
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
              { icon: 'cash-outline', title: '2% Cashback', desc: 'Earn rewards on every ticket', color: CultureTokens.teal },
              { icon: 'time-outline', title: '48h Early Access', desc: 'First to buy hot tickets', color: CultureTokens.gold },
              { icon: 'gift-outline', title: 'Exclusive Perks', desc: 'Members-only deals & discounts', color: CultureTokens.coral },
              { icon: 'shield-checkmark-outline', title: 'Plus Badge', desc: 'Stand out in the community', color: CultureTokens.gold },
            ].map((benefit) => (
              <View key={benefit.title} style={[s.benefitItem, { borderLeftColor: benefit.color }]}>
                <View style={[s.benefitIconWrap, { backgroundColor: benefit.color + '15' }]}>
                  <Ionicons name={benefit.icon as never} size={20} color={benefit.color} />
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
            <View style={s.socialProof}>
              <Ionicons name="people" size={16} color={CultureTokens.gold} />
              <Text style={s.socialProofText}>
                Join {memberCount.toLocaleString()}+ members already enjoying CulturePass+
              </Text>
            </View>
          )}

          {/* CTA Section */}
          <View style={s.ctaSection}>
            <Button
              onPress={() => router.push(routeWithRedirect('/(onboarding)/login', pathname) as any)}
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

  return (
    <View style={[s.container, { paddingTop: insets.top + webTop }]}>
      <View style={s.header}>
        <Pressable 
          onPress={() => goBackOrReplace('/(tabs)/profile')} 
          style={({ pressed }) => [s.backBtn, { transform: [{ scale: pressed ? 0.95 : 1 }], backgroundColor: colors.surface + '80' }]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          {!isWeb && <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />}
        </Pressable>
        <Text style={s.headerTitle}>CulturePass+</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={s.heroSection}>
          <View style={s.heroIconWrap}>
            <Ionicons name="globe" size={44} color={CultureTokens.gold} />
          </View>
          <Text style={s.heroTitle}>CulturePass+</Text>
          <Text style={s.heroTagline}>Access. Advantage. Influence.</Text>
          <Text style={s.heroDesc}> 
            Unlock premium cultural experiences with cashback rewards, early access to events, and exclusive perks from local businesses.
          </Text>
        </View>

        {memberCount > 0 && (
          <View style={s.socialProof}>
            <Ionicons name="people" size={16} color={CultureTokens.gold} />
            <Text style={s.socialProofText}>
              Join {memberCount.toLocaleString()}+ members already enjoying CulturePass+
            </Text>
          </View>
        )}

        {/* Billing toggle */}
        {!isPlus && (
          <View style={s.pricingSection}>
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
            <LinearGradient
              colors={[colors.surface, colors.surfaceElevated]}
              style={s.priceCard}
            >
              <Text style={s.priceAmount}>{price}</Text>
              <Text style={s.pricePeriod}>
                {billingPeriod === 'yearly' ? 'PER YEAR' : 'PER MONTH'}
              </Text>
              {billingPeriod === 'yearly' && (
                <View style={s.breakdownBadge}>
                  <Text style={s.priceBreakdown}>ONLY {perMonth} / MONTH</Text>
                </View>
              )}
            </LinearGradient>
          </View>
        )}

        {/* Feature comparison */}
        <View style={s.comparisonSection}>
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
                <Ionicons name={f.icon as never} size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
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
                <Ionicons name="checkmark-circle" size={20} color={CultureTokens.gold} />
              </View>
            </View>
          ))}
        </View>

        {/* Highlights */}
        <View style={s.highlightsSection}>
          {[
            { bg: CultureTokens.success + '15', color: CultureTokens.success, icon: 'cash',  title: '2% Cashback',    desc: 'Every ticket purchase earns you cashback, automatically credited to your wallet.' },
            { bg: CultureTokens.gold + '15', color: CultureTokens.gold, icon: 'flash', title: '48h Early Access', desc: 'Get a 48-hour head start on hot event tickets before they go on sale to everyone.' },
            { bg: CultureTokens.coral + '15',   color: CultureTokens.coral,   icon: 'gift',  title: 'Exclusive Perks', desc: 'Access members-only deals and discounts from restaurants, shops, and cultural venues.' },
          ].map(h => (
            <View key={h.title} style={s.highlightCard}>
              <View style={[s.highlightIcon, { backgroundColor: h.bg }]}>
                <Ionicons name={h.icon as never} size={24} color={h.color} />
              </View>
              <Text style={s.highlightTitle}>{h.title}</Text>
              <Text style={s.highlightDesc}>{h.desc}</Text>
            </View>
          ))}
        </View>

        {/* Active / Subscribe CTA */}
        {isPlus ? (
          <View style={s.activeSection}>
            <View style={s.activeBadge}>
              <Ionicons name="checkmark-circle" size={20} color={CultureTokens.success} />
              <Text style={s.activeText}>{"You're a CulturePass+ member"}</Text>
            </View>
            <Text style={s.activeSubtext}>Thank you for being part of the CulturePass+ community.</Text>
            <Button
              variant="outline"
              onPress={handleCancel}
              loading={loading}
              style={{ borderColor: CultureTokens.coral + '40' }}
              labelStyle={{ color: CultureTokens.coral }}
            >
              Cancel Membership
            </Button>
          </View>
        ) : (
          <View style={s.ctaSection}>
            <Button
              onPress={handleSubscribe}
              loading={loading}
              leftIcon="star"
              style={{ width: '100%', marginBottom: 12 }}
            >
              Get CulturePass+ for {price}{billingPeriod === 'yearly' ? '/yr' : '/mo'}
            </Button>
            <Text style={s.ctaFine}>Cancel anytime. Powered by Stripe.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.background },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  backBtn:            { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden' },
  headerTitle:        { fontSize: 18, fontFamily: 'Poppins_700Bold', color: CultureTokens.gold },
  scroll:             { flex: 1 },
  scrollContent:      { paddingHorizontal: 20, flexGrow: 1 },
  heroSection:        { alignItems: 'center', paddingTop: 24, paddingBottom: 12 },
  heroIconWrap:       { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: CultureTokens.gold + '15' },
  lockedIconWrap:     { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  heroTitle:          { fontSize: 32, fontFamily: 'Poppins_700Bold', marginBottom: 8, color: colors.text, textAlign: 'center' },
  heroTagline:        { fontSize: 14, fontFamily: 'Poppins_700Bold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20, color: CultureTokens.gold, textAlign: 'center' },
  heroDesc:           { fontSize: 16, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 24, paddingHorizontal: 10, color: colors.textSecondary },
  socialProof:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 99, marginTop: 16, marginBottom: 32, alignSelf: 'center', backgroundColor: CultureTokens.gold + '10', borderWidth: 1, borderColor: CultureTokens.gold + '25' },
  socialProofText:    { fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginLeft: 10, color: CultureTokens.gold },
  benefitsPreview:    { marginVertical: 24 },
  benefitItem:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 20, marginBottom: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, borderLeftWidth: 4 },
  benefitIconWrap:    { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16, flexShrink: 0 },
  benefitTitle:       { fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 4, color: colors.text },
  benefitDesc:        { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 20 },
  pricingSection:     { marginTop: 16 },
  toggleRow:          { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 24, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  toggleBtn:          { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, flexDirection: 'row', justifyContent: 'center' },
  toggleActive:       { backgroundColor: colors.surface, shadowColor: 'black', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  toggleText:         { fontSize: 13, fontFamily: 'Poppins_700Bold', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  saveBadge:          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8, backgroundColor: CultureTokens.teal },
  saveBadgeText:      { fontSize: 10, fontFamily: 'Poppins_700Bold', color: 'white' },
  priceCard:          { alignItems: 'center', paddingVertical: 32, borderRadius: 24, borderWidth: 1, borderColor: colors.borderLight, shadowColor: 'black', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 5 },
  priceAmount:        { fontSize: 56, fontFamily: 'Poppins_700Bold', color: CultureTokens.gold, letterSpacing: -1 },
  pricePeriod:        { fontSize: 13, fontFamily: 'Poppins_700Bold', marginTop: -4, color: colors.textTertiary, letterSpacing: 1 },
  breakdownBadge:     { marginTop: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: CultureTokens.gold + '15', borderWidth: 1, borderColor: CultureTokens.gold + '30' },
  priceBreakdown:     { fontSize: 12, fontFamily: 'Poppins_700Bold', color: CultureTokens.gold },
  sectionTitle:       { fontSize: 12, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, color: colors.textTertiary, textAlign: 'center' },
  comparisonSection:  { marginTop: 32, marginBottom: 24, paddingHorizontal: 16, paddingVertical: 20, backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.borderLight },
  comparisonHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingRight: 4 },
  compColHeader:      { width: 60, alignItems: 'center', paddingVertical: 6 },
  compColPlus:        { width: 70, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, backgroundColor: CultureTokens.gold, shadowColor: CultureTokens.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  compColLabel:       { fontSize: 12, fontFamily: 'Poppins_700Bold', color: colors.textSecondary },
  compRow:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  compFeature:        { flex: 1, flexDirection: 'row', alignItems: 'center' },
  compFeatureTitle:   { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  compFeatureDesc:    { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2, color: colors.textTertiary, lineHeight: 18 },
  compCheck:          { width: 60, alignItems: 'center' },
  compCheckPlus:      { width: 70 },
  highlightsSection:  { marginBottom: 32, gap: 12 },
  highlightCard:      { borderRadius: 20, padding: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, shadowColor: 'black', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 },
  highlightIcon:      { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  highlightTitle:     { fontSize: 17, fontFamily: 'Poppins_700Bold', marginBottom: 6, color: colors.text },
  highlightDesc:      { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22, color: colors.textSecondary },
  activeSection:      { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  activeBadge:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 99, marginBottom: 20, backgroundColor: CultureTokens.success + '12', borderWidth: 1, borderColor: CultureTokens.success + '30' },
  activeText:         { fontSize: 15, fontFamily: 'Poppins_700Bold', marginLeft: 10, color: CultureTokens.success },
  activeSubtext:      { fontSize: 14, fontFamily: 'Poppins_500Medium', marginBottom: 32, textAlign: 'center', color: colors.textSecondary, lineHeight: 22 },
  ctaSection:         { paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center' },
  ctaFine:            { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textTertiary, marginTop: 16, textAlign: 'center' },
});
