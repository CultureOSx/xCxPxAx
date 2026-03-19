import { View, Text, Pressable, StyleSheet, Platform, Alert, Share, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { queryClient } from '@/lib/query-client';
import { api } from '@/lib/api';
import { FilterChipRow, FilterItem } from '@/components/FilterChip';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useCouncil } from '@/hooks/useCouncil';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, gradients } from '@/constants/theme';
import { routeWithRedirect } from '@/lib/routes';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextStyles } from '@/constants/typography';

const isWeb = Platform.OS === 'web';

interface Perk {
  id: string;
  title: string;
  description: string | null;
  perkType: string;
  discountPercent: number | null;
  discountFixedCents: number | null;
  providerType: string | null;
  providerId: string | null;
  providerName: string | null;
  category: string | null;
  isMembershipRequired: boolean | null;
  requiredMembershipTier: string | null;
  usageLimit: number | null;
  usedCount: number | null;
  perUserLimit: number | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
}

const PERK_TYPE_INFO: Record<string, { icon: keyof typeof Ionicons.glyphMap; colorKey: 'error' | 'success' | 'secondary' | 'info' | 'warning'; label: string }> = {
  discount_percent: { icon: 'pricetag',  colorKey: 'error',     label: '% Off' },
  discount_fixed:   { icon: 'cash',      colorKey: 'success',   label: '$ Off' },
  free_ticket:      { icon: 'ticket',    colorKey: 'secondary', label: 'Free' },
  early_access:     { icon: 'time',      colorKey: 'info',      label: 'Early' },
  vip_upgrade:      { icon: 'star',      colorKey: 'warning',   label: 'VIP' },
  cashback:         { icon: 'wallet',    colorKey: 'success',   label: 'Cash' },
};

const CATEGORIES = [
  { id: 'All',        label: 'All Perks',    icon: 'gift'       },
  { id: 'tickets',    label: 'Tickets',      icon: 'ticket'     },
  { id: 'events',     label: 'Events',       icon: 'calendar'   },
  { id: 'dining',     label: 'Dining',       icon: 'restaurant' },
  { id: 'shopping',   label: 'Shopping',     icon: 'bag'        },
  { id: 'wallet',     label: 'Wallet',       icon: 'wallet'     },
  { id: 'indigenous', label: 'First Nations',icon: 'earth'      },
];

const filterItems: FilterItem[] = CATEGORIES.map(cat => ({ id: cat.id, label: cat.label, icon: cat.icon }));

export default function PerksTabScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width, isDesktop, isTablet } = useLayout();
  const s = getStyles(colors);
  const pathname = usePathname();
  
  const topInset = isWeb ? 0 : insets.top;
  const contentMaxWidth = isDesktop ? 1200 : isTablet ? 800 : width;

  const { userId } = useAuth();
  const { data: councilData } = useCouncil();
  const openGrants = (councilData?.grants ?? []).filter((grant: {status: string}) => grant.status === 'open');
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [redeemingPerkId, setRedeemingPerkId] = useState<string | null>(null);

  const { data: perks = [], isLoading, refetch } = useQuery<Perk[]>({
    queryKey: ['/api/perks'],
    queryFn: () => api.perks.list() as Promise<Perk[]>,
  });

  const { data: membership } = useQuery<{ tier: string } | null>({
    queryKey: ['/api/membership', userId],
    queryFn: () => api.membership.get(userId!).catch(() => null),
    enabled: !!userId,
  });

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const redeemMutation = useMutation({
    mutationFn: (perkId: string) => api.perks.redeem(perkId),
    onMutate: (perkId) => setRedeemingPerkId(perkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/perks'] });
      if (userId) queryClient.invalidateQueries({ queryKey: ['/api/membership', userId] });
      Alert.alert('Redeemed!', 'Perk has been added to your account.');
    },
    onError: (err: any) => Alert.alert('Cannot Redeem', err.message || 'An error occurred'),
    onSettled: () => setRedeemingPerkId(null),
  });

  const filteredPerks = selectedCategory === 'All'
    ? perks
    : perks.filter(p => p.category === selectedCategory);

  const formatValue = (perk: Perk) => {
    if (perk.perkType === 'discount_percent') return `${perk.discountPercent}% Off`;
    if (perk.perkType === 'discount_fixed')   return `$${((perk.discountFixedCents ?? 0) / 100).toFixed(0)} Off`;
    if (perk.perkType === 'free_ticket')      return 'Free';
    if (perk.perkType === 'early_access')     return '48h Early';
    if (perk.perkType === 'vip_upgrade')      return 'VIP';
    if (perk.perkType === 'cashback')
      return perk.discountPercent ? `${perk.discountPercent}% Cashback` : `$${((perk.discountFixedCents ?? 0) / 100).toFixed(0)} Cashback`;
    return 'Reward';
  };

  const canRedeem = (perk: Perk) => {
    const memberTier = membership?.tier ?? 'free';
    if (perk.isMembershipRequired && memberTier === 'free') return false;
    if (perk.usageLimit && (perk.usedCount ?? 0) >= perk.usageLimit) return false;
    return true;
  };

  const handleSharePerk = async (perk: Perk) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: `${perk.title} - CulturePass Perk`,
        message: `Check out this perk on CulturePass: ${perk.title}! ${perk.description ?? ''} ${perk.providerName ? `From ${perk.providerName}.` : ''}`,
      });
    } catch { /* ignore */ }
  };

  const activePerkCount = perks.filter(p => canRedeem(p)).length;
  const isPlusMember = !!membership?.tier && membership.tier !== 'free';

  const resolveTypeColor = useCallback((key: string): string => {
    if (key === 'error')     return CultureTokens.coral;
    if (key === 'success')   return CultureTokens.teal;
    if (key === 'secondary') return CultureTokens.indigo;
    if (key === 'info')      return colors.info;
    return CultureTokens.gold;
  }, [colors]);

  const handleSelectCategory = useCallback((id: string) => {
    if (!isWeb) Haptics.selectionAsync();
    setSelectedCategory(id);
  }, []);

  return (
    <ErrorBoundary>
      <View style={[s.container, { backgroundColor: colors.background }]}>

        {/* Brand gradient top bar */}
        <LinearGradient
          colors={gradients.culturepassBrand as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: topInset }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="gift" size={22} color="#FFC857" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[TextStyles.title2, { color: '#fff', letterSpacing: -0.3 }]}>Perks & Rewards</Text>
              <Text style={[TextStyles.caption, { color: 'rgba(255,255,255,0.8)' }]}>{activePerkCount} available to redeem</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
              <Text style={[TextStyles.labelSemibold, { color: '#fff' }]}>{filteredPerks.length} perks</Text>
            </View>
          </View>
        </LinearGradient>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={isWeb ? (e: any) => { scrollY.value = e.nativeEvent.contentOffset.y; } : scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={[
            { paddingBottom: isWeb ? 134 : insets.bottom + 110 },
            isDesktop && { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingTop: 32 },
            !isDesktop && !isWeb && { paddingTop: 16 }
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CultureTokens.indigo} />}
        >

          {/* Upgrade Nudge Box */}
          {!isPlusMember && (
            <View style={[s.listWrapper, isDesktop && { paddingHorizontal: 0 }]}>
            <Card
              onPress={() => { if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/membership/upgrade' } as any); }}
              style={s.upgradeBanner}
              padding={16}
            >
              <View style={[s.upgradeBannerIcon, { backgroundColor: CultureTokens.indigo }]}>
                <Ionicons name="star" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[TextStyles.headline, { color: colors.text }]}>CulturePass+ Membership</Text>
                <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
                  Upgrade to unlock all premium tier rewards globally.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={CultureTokens.indigo} />
            </Card>
            </View>
          )}

          {/* Council Grants Alert */}
          {openGrants.length > 0 && (
            <View style={[s.listWrapper, isDesktop && { paddingHorizontal: 0 }]}>
              <Pressable 
                style={({ pressed }) => [s.upgradeBanner, { 
                  backgroundColor: colors.surface, 
                  borderColor: CultureTokens.teal + '40', 
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  borderStyle: 'dashed' 
                }]}
                onPress={() => { if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/council'); }}
              > 
                <View style={[s.upgradeBannerIcon, { backgroundColor: CultureTokens.teal + '15' }]}> 
                  <Ionicons name="library" size={20} color={CultureTokens.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.upgradeBannerTitle, { color: colors.text }]}>Cultural Funding Available</Text>
                  <Text style={[s.upgradeBannerSub, { color: colors.textSecondary }]}> 
                    {openGrants.length} local council grant{openGrants.length === 1 ? '' : 's'} open right now.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={CultureTokens.teal} />
              </Pressable>
            </View>
          )}

          {/* Category Filter Chips */}
          <View style={[s.listWrapper, { marginBottom: 12 }, isDesktop && { paddingHorizontal: 0 }]}>
            <FilterChipRow
              items={filterItems}
              selectedId={selectedCategory}
              onSelect={handleSelectCategory}
              size="small"
            />
          </View>

          {/* Section Header */}
          <View style={[s.sectionHeader, isDesktop && { paddingHorizontal: 0 }]}>
            <Text style={[TextStyles.title2, { color: colors.text }]}>
              {selectedCategory === 'All' ? 'All Rewards' : CATEGORIES.find(c => c.id === selectedCategory)?.label ?? 'Perks'}
            </Text>
            {!isLoading && (
              <Text style={[TextStyles.callout, { color: colors.textTertiary }]}>
                {filteredPerks.length} available
              </Text>
            )}
          </View>

          {/* Perk Grid/List */}
          <View style={[s.grid, isDesktop && { paddingHorizontal: 0 }]}>
            {isLoading ? (
              <View style={s.empty}>
                <ActivityIndicator size="large" color={CultureTokens.indigo} />
                <Text style={[s.emptyText, { color: colors.textSecondary, marginTop: 12 }]}>Loading exclusive perks...</Text>
              </View>
            ) : filteredPerks.length === 0 ? (
              <View style={[s.emptyStateCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <View style={[s.emptyIconBox, { backgroundColor: colors.background }]}>
                  <Ionicons name="gift-outline" size={36} color={colors.textTertiary} />
                </View>
                <Text style={[s.emptyTitle, { color: colors.text }]}>No perks found</Text>
                <Text style={[s.emptyText, { color: colors.textSecondary }]}>Check back later for deals in this category.</Text>
              </View>
            ) : (
              <View style={[s.gridWrapper, isDesktop && s.gridDesktop]}>
                {filteredPerks.map((perk) => (
                  <View key={perk.id} style={isDesktop ? s.gridCell : s.fullCell}>
                    <PerkCard
                      perk={perk}
                      colors={colors}
                      redeemable={canRedeem(perk)}
                      formattedValue={formatValue(perk)}
                      onShare={() => handleSharePerk(perk)}
                      onRedeem={() => {
                        if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        if (!canRedeem(perk) && perk.isMembershipRequired) {
                          router.push({ pathname: '/membership/upgrade' } as any);
                        } else if (!userId) {
                          Alert.alert('Sign in required', 'Please sign in to redeem this perk.');
                          router.push(routeWithRedirect('/(onboarding)/login', pathname) as any);
                        } else {
                          redeemMutation.mutate(perk.id);
                        }
                      }}
                      isPending={redeemingPerkId === perk.id}
                      resolveTypeColor={resolveTypeColor}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

        </Animated.ScrollView>
      </View>
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Perk Card Component
// ---------------------------------------------------------------------------
function PerkCard({
  perk,
  colors,
  redeemable,
  formattedValue,
  onShare,
  onRedeem,
  isPending,
  resolveTypeColor,
}: {
  perk: Perk;
  colors: ReturnType<typeof useColors>;
  redeemable: boolean;
  formattedValue: string;
  onShare: () => void;
  onRedeem: () => void;
  isPending: boolean;
  resolveTypeColor: (key: string) => string;
}) {
  const typeInfo  = PERK_TYPE_INFO[perk.perkType] ?? PERK_TYPE_INFO.discount_percent;
  const typeColor = resolveTypeColor(typeInfo.colorKey);
  const usagePct  = perk.usageLimit ? Math.min(Math.round(((perk.usedCount ?? 0) / perk.usageLimit) * 100), 100) : 0;
  const needsUpgrade = !redeemable && !!perk.isMembershipRequired;
  const exhausted    = !redeemable && !perk.isMembershipRequired;
  const s = getStyles(colors);

  return (
    <Card 
      style={s.perkCard} 
      padding={0}
    >
      <View style={[s.cardStrip, { backgroundColor: needsUpgrade ? CultureTokens.indigo : typeColor }]} />

      <View style={s.cardContent}>
        <View style={s.perkTopRow}>
          <View style={[s.perkIconBox, { backgroundColor: typeColor + '10', borderColor: typeColor + '20', borderWidth: 1 }]}>
            <Ionicons name={typeInfo.icon} size={24} color={typeColor} />
          </View>
          
          <View style={s.perkInfo}>
            <Text style={[TextStyles.headline, { color: colors.text }]} numberOfLines={2}>{perk.title}</Text>
            <View style={s.providerRow}>
              <Ionicons name="business" size={14} color={colors.textTertiary} />
              <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>{perk.providerName ?? 'CulturePass App'}</Text>
            </View>
          </View>

          <View style={s.perkValueWrap}>
            <View style={[s.perkValuePill, { backgroundColor: colors.surfaceElevated, borderColor: CultureTokens.saffron + '30' }]}>
              <Text style={[TextStyles.labelSemibold, { color: CultureTokens.saffron }]}>{formattedValue}</Text>
            </View>
            <Pressable hitSlop={12} onPress={onShare} style={[s.shareBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight, borderWidth: 1 }]}>
              <Ionicons name="share" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {perk.description && (
          <Text style={[TextStyles.body, { color: colors.textSecondary, marginBottom: 20 }]} numberOfLines={3}>{perk.description}</Text>
        )}

        <View style={s.perkMetaRow}>
          {perk.isMembershipRequired && (
            <View style={[s.metaTag, { backgroundColor: CultureTokens.indigo + '10', borderColor: CultureTokens.indigo + '20' }]}>
              <Ionicons name="star" size={12} color={CultureTokens.indigo} />
              <Text style={[TextStyles.caption, { color: CultureTokens.indigo, fontWeight: '700' }]}>Plus</Text>
            </View>
          )}
          {!!perk.usageLimit && (
            <View style={[s.metaTag, { backgroundColor: CultureTokens.teal + '10', borderColor: CultureTokens.teal + '20' }]}>
              <Text style={[TextStyles.caption, { color: CultureTokens.teal, fontWeight: '700' }]}>{perk.usageLimit - (perk.usedCount ?? 0)} left</Text>
            </View>
          )}
          {perk.endDate && (
            <View style={[s.metaTag, { backgroundColor: CultureTokens.coral + '10', borderColor: CultureTokens.coral + '20' }]}>
              <Text style={[TextStyles.caption, { color: CultureTokens.coral, fontWeight: '700' }]}>
                Ends {new Date(perk.endDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          )}
        </View>

        {!!perk.usageLimit && (
          <View style={s.progressWrap}>
            <View style={[s.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={[s.progressFill, { width: `${usagePct}%`, backgroundColor: usagePct > 85 ? CultureTokens.coral : CultureTokens.teal }]} />
            </View>
            <Text style={[s.progressText, { color: colors.textTertiary }]}>{usagePct}% claimed</Text>
          </View>
        )}

        <Button
          onPress={onRedeem}
          disabled={exhausted || isPending}
          variant={needsUpgrade ? 'outline' : 'primary'}
          size="md"
          loading={isPending}
          leftIcon={redeemable ? 'gift' : (needsUpgrade ? 'star' : 'lock-closed')}
          style={[
            exhausted && { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
            needsUpgrade && { borderColor: CultureTokens.indigo + '40' },
            redeemable && { backgroundColor: typeColor }
          ]}
        >
          {exhausted ? 'Fully Claimed' : needsUpgrade ? 'Upgrade to CulturePass+' : 'Claim Reward'}
        </Button>
      </View>
    </Card>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1 },
  
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, height: isWeb ? 72 : 110, paddingBottom: 10, justifyContent: 'flex-end', overflow: 'hidden' },
  topBarBorder: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: colors.borderLight },
  
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 26, fontFamily: 'Poppins_700Bold', letterSpacing: -0.5, marginBottom: 2, color: colors.text },
  headerSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  addBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },

  heroWrapper: { paddingHorizontal: 20, marginBottom: 24, marginTop: 8 },
  heroBanner: { marginHorizontal: 16, marginTop: 4, marginBottom: 16, borderRadius: 20, padding: 16, overflow: 'hidden', shadowColor: CultureTokens.indigo, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  heroOrb: { position: 'absolute' },
  heroContentMini: { flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 1 },
  heroIconBoxMini: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroRibbon: { 
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff1a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffffff26',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  heroTitleRibbon: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#fff' },
  heroStatsBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroStatsText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#fff',
  },

  listWrapper: { paddingHorizontal: 20 },
  upgradeBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, padding: 20, borderWidth: 1, gap: 16, marginBottom: 16 },
  upgradeBannerIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  upgradeBannerTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 2 },
  upgradeBannerSub: { fontSize: 13, fontFamily: 'Poppins_400Regular' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  sectionTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
  sectionCount: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.textTertiary },

  grid: { paddingHorizontal: 20 },
  gridWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  gridDesktop: { justifyContent: 'flex-start' },
  fullCell: { width: '100%' },
  gridCell: { flexBasis: '48%', flexGrow: 1 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyStateCard: { padding: 48, borderRadius: 32, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', gap: 16, marginBottom: 40, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyIconBox: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 8, backgroundColor: colors.backgroundSecondary },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', color: colors.textSecondary },

  perkCard: { borderRadius: 28, marginBottom: 16, borderWidth: 1, overflow: 'hidden', backgroundColor: colors.surface, borderColor: colors.borderLight, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 4 },
  cardStrip: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 8 },
  cardContent: { padding: 24, paddingLeft: 30 },
  perkTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 18 },
  perkIconBox: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  perkInfo: { flex: 1, justifyContent: 'center' },
  perkTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', lineHeight: 24, paddingRight: 8, color: colors.text },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  perkProvider: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  perkValueWrap: { alignItems: 'flex-end', gap: 12 },
  perkValuePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  perkValueText: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  shareBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  perkDesc: { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22, marginBottom: 20, color: colors.textSecondary },

  perkMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  metaTag: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  metaTagText: { fontSize: 12, fontFamily: 'Poppins_700Bold' },

  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  progressBar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', flexDirection: 'row', backgroundColor: colors.backgroundSecondary },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, fontFamily: 'Poppins_700Bold', minWidth: 80, textAlign: 'right', color: colors.textTertiary },

  redeemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 14 },
  redeemBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.3 },
});
