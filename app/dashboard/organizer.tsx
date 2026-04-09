import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { CultureTokens, gradients } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { EventData, Profile } from '@/shared/schema';
import { useColors } from '@/hooks/useColors';
import { Skeleton } from '@/components/ui/Skeleton';


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrganizerStats {
  performanceMetrics: {
    reach: number;
    profileViews: number;
    playlistSaves: number;
    avgEngagement: string;
  };
  eventStats: {
    totalEvents: number;
    publishedEvents: number;
    draftEvents: number;
    totalTicketsSold: number;
    totalRevenueCents: number;
  };
}

interface EventsResponse {
  events: EventData[];
  total?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function connectPayoutsHeadline(
  s: { stripeConnectOnboardingStatus?: string; payoutsEnabled?: boolean } | undefined,
): string {
  if (s?.payoutsEnabled && s?.stripeConnectOnboardingStatus === 'complete') return 'Payouts connected';
  if (s?.stripeConnectOnboardingStatus === 'restricted') return 'Stripe needs more information';
  if (s?.stripeConnectOnboardingStatus === 'pending') return 'Finish Stripe setup';
  return 'Connect Stripe for ticket revenue';
}

function statusColor(status?: string, colors?: ReturnType<typeof useColors>): string {
  switch (status) {
    case 'published': return '#34C759';
    case 'draft': return CultureTokens.gold;
    case 'deleted': return CultureTokens.coral;
    default: return colors ? colors.textSecondary : 'rgba(255,255,255,0.4)';
  }
}

// ---------------------------------------------------------------------------
// Stat Card — Large Analytics Card
// ---------------------------------------------------------------------------

function AnalyticsCard({ 
  label, 
  value, 
  trend, 
  trendUp, 
  icon, 
  color 
}: { 
  label: string; 
  value: string | number; 
  trend: string; 
  trendUp?: boolean; 
  icon: string; 
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[dashboardStyles.analyticsBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={dashboardStyles.analyticsTop}>
        <View style={[dashboardStyles.analyticsIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={color} />
        </View>
        <View style={dashboardStyles.trendRow}>
          <Ionicons name={trendUp ? 'arrow-up-circle' : 'arrow-down-circle'} size={14} color={trendUp ? '#34C759' : '#8E8E93'} />
          <Text style={[dashboardStyles.trendText, { color: trendUp ? '#34C759' : '#8E8E93' }]}>{trend}</Text>
        </View>
      </View>
      <Text style={[dashboardStyles.analyticsValue, { color: colors.text }]}>{value}</Text>
      <Text style={[dashboardStyles.analyticsLabel, { color: colors.textTertiary }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------


function OrganizerDashboardContent() {
  const insets = useSafeAreaInsets();
  const { hPad, isWeb } = useLayout();
  const { userId, user } = useAuth();
  const { isOrganizer, isLoading: roleLoading } = useRole();
  const colors = useColors();
  const topPad = Platform.OS === 'web' ? 0 : insets.top;
  const queryClient = useQueryClient();
  const { connect: connectQueryParam } = useLocalSearchParams<{ connect?: string }>();
  
  const [activeTab, setActiveTab] = useState<'events' | 'performance' | 'content'>('events');
  const [activeFilter, setActiveFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [payoutProfileId, setPayoutProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!roleLoading && !isOrganizer) router.replace('/(tabs)');
  }, [isOrganizer, roleLoading]);

  const { data: eventsData, isLoading, refetch, isRefetching } = useQuery<EventsResponse>({
    queryKey: ['/api/events', { organizerId: userId }],
    queryFn: async () => {
      return api.events.list({ organizerId: userId ?? undefined, page: 1, pageSize: 50 });
    },
    enabled: !!userId,
  });

  const { data: myProfiles = [] } = useQuery({
    queryKey: ['/api/profiles/my'],
    queryFn: () => api.profiles.my(),
    enabled: !!userId && activeTab === 'events',
  });

  useEffect(() => {
    if (payoutProfileId === null && myProfiles.length > 0) {
      setPayoutProfileId((myProfiles[0] as Profile).id);
    }
  }, [myProfiles, payoutProfileId]);

  const { data: connectState, refetch: refetchConnect } = useQuery({
    queryKey: ['stripe-connect-status', payoutProfileId],
    queryFn: () => api.stripe.connectStatus(payoutProfileId!),
    enabled: !!payoutProfileId,
  });

  useEffect(() => {
    if (connectQueryParam === 'return' || connectQueryParam === 'refresh') {
      queryClient.invalidateQueries({ queryKey: ['stripe-connect-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles/my'] });
      // Clear the connect param from the URL to avoid repeated invalidation
      if (typeof window !== 'undefined' && window.history && window.location) {
        const url = new URL(window.location.href);
        url.searchParams.delete('connect');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [connectQueryParam, queryClient]);

  const setupStripePayouts = useMutation({
      mutationFn: async () => {
        try {
          const pid = payoutProfileId!;
          const status = await api.stripe.connectStatus(pid);
          if (!status.accountId) {
            await api.stripe.connectCreateAccount(pid);
          }
          const { url } = await api.stripe.connectAccountLink(pid);
          return url;
        } catch (err) {
          if (__DEV__) console.error('Stripe setup error', err);
          throw err;
        }
      },
      onSuccess: async (url) => {
        try {
          const result = await WebBrowser.openBrowserAsync(url, {
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          });
          // WebBrowser returns OPENED when the external browser launches.
          if (result.type === WebBrowser.WebBrowserResultType.OPENED) {
            await refetchConnect();
            queryClient.invalidateQueries({ queryKey: ['/api/profiles/my'] });
          }
        } catch (err) {
          if (__DEV__) console.error('WebBrowser error', err);
        }
      },
      onError: (error) => {
        if (__DEV__) console.error('Stripe Connect setup failed', error);
        // Optionally show a toast/alert here
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Failed to set up Stripe payouts. Please try again or contact support.');
        }
      },
    });

  const { data: playlistData, refetch: refetchPlaylist } = useQuery({
    queryKey: ['/api/playlists', userId],
    queryFn: async () => {
      // Import here to avoid circular dependency if any, but since it's a constant it's fine
      const { DEFAULT_DISCOVER_CURATION } = await import('@/shared/schema/discover');
      return DEFAULT_DISCOVER_CURATION.heritagePlaylists;
    },
    enabled: activeTab === 'content',
  });

  const events: EventData[] = eventsData?.events ?? [];

  const stats: OrganizerStats = {
    performanceMetrics: {
      reach: 12400,
      profileViews: 3200,
      playlistSaves: 450,
      avgEngagement: '8.4%',
    },
    eventStats: {
      totalEvents: events.length,
      publishedEvents: events.filter((e) => e.status === 'published').length,
      draftEvents: events.filter((e) => e.status === 'draft').length,
      totalTicketsSold: events.reduce((sum, e) => sum + (e.attending ?? 0), 0),
      totalRevenueCents: events.reduce((sum, e) => sum + (e.priceCents ?? 0) * (e.attending ?? 0), 0),
    },
  };





  const sortedEvents = [...events]
    .filter((e) => {
      if (activeFilter === 'all') return true;
      return e.status === activeFilter;
    });

  return (
    <View style={[dashboardStyles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={dashboardStyles.ambientMesh}
        pointerEvents="none"
      />

      <View style={{ paddingTop: topPad }}>
        <LiquidGlassPanel
          borderRadius={0}
          bordered={false}
          style={{
            borderBottomWidth: StyleSheet.hairlineWidth * 2,
            borderBottomColor: colors.borderLight,
          }}
          contentStyle={{ paddingHorizontal: hPad, paddingTop: 16, paddingBottom: 14, gap: 14 }}
        >
          <View style={dashboardStyles.headerContent}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[dashboardStyles.greeting, { color: colors.textTertiary }]}>Welcome back</Text>
              <Text style={[dashboardStyles.userName, { color: colors.text }]} numberOfLines={1}>
                {user?.displayName || 'Creator'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/submit')}
              style={[
                dashboardStyles.createBtn,
                { backgroundColor: colors.primarySoft, borderColor: colors.borderLight, borderWidth: StyleSheet.hairlineWidth * 2 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Create event"
            >
              <Ionicons name="add" size={24} color={CultureTokens.indigo} />
            </Pressable>
          </View>

          <View style={[dashboardStyles.headerTabs, { backgroundColor: colors.primarySoft }]}>
            {([
              { id: 'events' as const, label: 'Events' },
              { id: 'content' as const, label: 'Studio' },
              { id: 'performance' as const, label: 'Reach' },
            ]).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[
                    dashboardStyles.tab,
                    active && { backgroundColor: CultureTokens.indigo + '18', borderColor: CultureTokens.indigo + '40' },
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      dashboardStyles.tabText,
                      { color: active ? CultureTokens.indigo : colors.textSecondary },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </LiquidGlassPanel>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: hPad, paddingVertical: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={() => { refetch(); refetchPlaylist?.(); }} 
            tintColor={CultureTokens.indigo} 
          />
        }
      >
        {activeTab === 'performance' ? (
          <Animated.View entering={FadeInDown} style={dashboardStyles.performanceGrid}>
            <View style={dashboardStyles.analyticsRow}>
               <AnalyticsCard label="Reach" value={stats.performanceMetrics.reach.toLocaleString()} trend="+12%" trendUp icon="eye-outline" color={CultureTokens.indigo} />
               <AnalyticsCard label="Views" value={stats.performanceMetrics.profileViews.toLocaleString()} trend="+5%" trendUp icon="person-outline" color={CultureTokens.teal} />
            </View>
            <View style={dashboardStyles.analyticsRow}>
               <AnalyticsCard label="Playlist" value={stats.performanceMetrics.playlistSaves} trend="+24%" trendUp icon="musical-notes-outline" color={CultureTokens.gold} />
               <AnalyticsCard label="Engage" value={stats.performanceMetrics.avgEngagement} trend="-2%" icon="heart-outline" color={CultureTokens.coral} />
            </View>

            <View style={[dashboardStyles.premiumBanner, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <View style={dashboardStyles.bannerIcon}>
                <Ionicons name="sparkles" size={24} color={CultureTokens.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[dashboardStyles.bannerTitle, { color: colors.text }]}>Featured in Your City</Text>
                <Text style={[dashboardStyles.bannerSub, { color: colors.textSecondary }]}>Your profile has been selected for the Sydney Creator Spotlight!</Text>
              </View>
            </View>
          </Animated.View>
        ) : activeTab === 'content' ? (
          <Animated.View entering={FadeInDown} style={dashboardStyles.eventsSection}>
            <View style={dashboardStyles.sectionHeader}>
              <Text style={[dashboardStyles.sectionTitle, { color: colors.text }]}>Heritage Playlist</Text>
              <Pressable 
                onPress={() => {
                  if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/dashboard/content-studio');
                }} 
                style={dashboardStyles.addSmallBtn}
              >
                <Ionicons name="add" size={18} color={CultureTokens.indigo} />
                <Text style={dashboardStyles.addSmallText}>Add Item</Text>
              </Pressable>
            </View>

            {playlistData?.length === 0 ? (
               <View style={dashboardStyles.empty}>
                 <Ionicons name="musical-notes-outline" size={40} color={colors.textTertiary} />
                 <Text style={[dashboardStyles.emptyText, { color: colors.textTertiary }]}>No playlist items yet</Text>
               </View>
            ) : (
              playlistData?.map((item: any, idx: number) => (
                <Animated.View key={item.id} entering={FadeInRight.delay(idx * 50)}>
                  <Pressable 
                    style={[dashboardStyles.contentRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                    onPress={() => {
                      if(!isWeb) Haptics.selectionAsync();
                      router.push('/dashboard/content-studio');
                    }}
                  >
                    <View style={dashboardStyles.contentThumbWrap}>
                      <Ionicons name="musical-note" size={20} color={CultureTokens.indigo} style={dashboardStyles.contentThumbPlaceholder} />
                    </View>
                    <View style={dashboardStyles.eventInfo}>
                      <Text style={[dashboardStyles.eventTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                      <Text style={[dashboardStyles.eventMeta, { color: colors.textTertiary }]}>{item.typeLabel.toUpperCase()} • {item.culture}</Text>
                    </View>
                    <View style={dashboardStyles.eventRight}>
                      <Ionicons name="create-outline" size={18} color={colors.textTertiary} />
                    </View>
                  </Pressable>
                </Animated.View>
              ))
            )}

            <View style={[dashboardStyles.tipsCard, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="bulb-outline" size={20} color={CultureTokens.gold} />
              <Text style={[dashboardStyles.tipsText, { color: colors.textSecondary }]}>
                {`Pro Tip: Curated listening items with 'Discover' deep-links increase profile reach by up to 40%.`}
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown} style={dashboardStyles.eventsSection}>
            {myProfiles.length > 0 && payoutProfileId ? (
              <View
                style={[
                  dashboardStyles.payoutCard,
                  { backgroundColor: colors.surface, borderColor: colors.borderLight },
                ]}
              >
                <View style={dashboardStyles.payoutCardHeader}>
                  <Ionicons name="wallet-outline" size={22} color={CultureTokens.teal} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[dashboardStyles.payoutTitle, { color: colors.text }]}>
                      Ticket payouts
                    </Text>
                    <Text style={[dashboardStyles.payoutSub, { color: colors.textSecondary }]} numberOfLines={2}>
                      Revenue from paid events published under your profile goes to your Stripe Connect account after the platform fee.
                    </Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={dashboardStyles.profileChipRow}>
                  {myProfiles.map((p: Profile) => {
                    const sel = p.id === payoutProfileId;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => {
                          if (!isWeb) Haptics.selectionAsync();
                          setPayoutProfileId(p.id);
                        }}
                        style={[
                          dashboardStyles.profileChip,
                          sel && { backgroundColor: CultureTokens.indigo + '18', borderColor: CultureTokens.indigo },
                          !sel && { borderColor: colors.borderLight },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Select profile ${p.name} for payouts`}
                        accessibilityState={{ selected: sel }}
                      >
                        <Text
                          style={[dashboardStyles.profileChipText, { color: sel ? CultureTokens.indigo : colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {p.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Text style={[dashboardStyles.payoutStatus, { color: colors.text }]}>
                  {connectPayoutsHeadline(connectState ?? undefined)}
                </Text>
                <Pressable
                  onPress={() => {
                    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setupStripePayouts.mutate();
                  }}
                  disabled={
                    setupStripePayouts.isPending ||
                    (connectState?.payoutsEnabled === true && connectState?.stripeConnectOnboardingStatus === 'complete')
                  }
                  style={[
                    dashboardStyles.payoutCta,
                    {
                      backgroundColor: CultureTokens.indigo,
                      opacity:
                        setupStripePayouts.isPending ||
                        (connectState?.payoutsEnabled === true && connectState?.stripeConnectOnboardingStatus === 'complete')
                          ? 0.45
                          : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    connectState?.payoutsEnabled && connectState?.stripeConnectOnboardingStatus === 'complete'
                      ? 'Stripe payouts already connected'
                      : 'Open Stripe to connect payouts'
                  }
                >
                  <Text style={dashboardStyles.payoutCtaText}>
                    {connectState?.payoutsEnabled && connectState?.stripeConnectOnboardingStatus === 'complete'
                      ? 'Connected'
                      : setupStripePayouts.isPending
                        ? 'Opening…'
                        : 'Set up or continue in Stripe'}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View style={dashboardStyles.statsOverview}>
              <View style={dashboardStyles.quickStat}>
                 <Text style={[dashboardStyles.quickStatValue, { color: colors.text }]}>{stats.eventStats.totalTicketsSold}</Text>
                 <Text style={[dashboardStyles.quickStatLabel, { color: colors.textTertiary }]}>ATTENDING</Text>
              </View>
              <View style={[dashboardStyles.statDivider, { backgroundColor: colors.borderLight }]} />
              <View style={dashboardStyles.quickStat}>
                 <Text style={[dashboardStyles.quickStatValue, { color: colors.text }]}>{formatCurrency(stats.eventStats.totalRevenueCents)}</Text>
                 <Text style={[dashboardStyles.quickStatLabel, { color: colors.textTertiary }]}>REVENUE</Text>
              </View>
            </View>

            <View style={dashboardStyles.filterRow}>
              {(['all', 'published', 'draft'] as const).map(f => (
                <Pressable 
                  key={f} 
                  onPress={() => setActiveFilter(f)}
                  style={[dashboardStyles.filterBtn, activeFilter === f && { backgroundColor: CultureTokens.indigo + '15', borderColor: CultureTokens.indigo }]}
                >
                  <Text style={[dashboardStyles.filterBtnText, { color: activeFilter === f ? CultureTokens.indigo : colors.textSecondary }]}>
                    {f.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            {isLoading ? (
               <View style={{ gap: 12, marginTop: 20 }}>
                 {[1, 2, 3, 4].map(i => <Skeleton key={i} width="100%" height={80} borderRadius={20} />)}
               </View>
             ) : sortedEvents.length === 0 ? (
               <View style={dashboardStyles.empty}>
                 <Ionicons name="calendar-outline" size={40} color={colors.textTertiary} />
                 <Text style={[dashboardStyles.emptyText, { color: colors.textTertiary }]}>No events found</Text>
               </View>
             ) : (
               sortedEvents.map((event, idx) => (
                 <Animated.View key={event.id} entering={FadeInRight.delay(idx * 50)}>
                   <Pressable 
                     style={[dashboardStyles.eventRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                     onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
                   >
                     <View style={dashboardStyles.eventInfo}>
                       <Text style={[dashboardStyles.eventTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                       <Text style={[dashboardStyles.eventMeta, { color: colors.textTertiary }]}>{formatDate(event.date)} • {event.venue}</Text>
                     </View>
                     <View style={dashboardStyles.eventRight}>
                       <View style={[dashboardStyles.statusDot, { backgroundColor: statusColor(event.status) }]} />
                       <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                     </View>
                   </Pressable>
                 </Animated.View>
               ))
             )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable 
        style={dashboardStyles.fab}
        onPress={() => router.push('/submit')}
      >
        <LinearGradient
          colors={[CultureTokens.indigo, CultureTokens.coral]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Ionicons name="rocket" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const dashboardStyles = StyleSheet.create({
  container: { flex: 1 },
  ambientMesh: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  greeting: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.4, textTransform: 'uppercase' },
  userName: { fontSize: 22, fontFamily: 'Poppins_700Bold', letterSpacing: -0.4, marginTop: 4 },
  createBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTabs: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: 16,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'transparent',
  },
  tabText: { fontSize: 12, fontFamily: 'Poppins_700Bold', letterSpacing: 0.2 },
  
  performanceGrid: { gap: 16 },
  analyticsRow: { flexDirection: 'row', gap: 16 },
  analyticsBox: { 
    flex: 1, 
    padding: 16, 
    borderRadius: 24, 
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.35)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 4 }
    })
  },
  analyticsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  analyticsIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.03)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  trendText: { fontSize: 10, fontFamily: 'Poppins_700Bold' },
  analyticsValue: { fontSize: 22, fontFamily: 'Poppins_700Bold', letterSpacing: -0.5 },
  analyticsLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },
  
  premiumBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1, 
    gap: 16, 
    marginTop: 8,
    ...Platform.select({
      web: { boxShadow: '0px 4px 16px rgba(44,42,114,0.1)' },
      ios: {
        shadowColor: '#2C2A72',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: { elevation: 4 }
    })
  },
  bannerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: CultureTokens.gold + '15', alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  bannerSub: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  
  eventsSection: { gap: 16 },
  payoutCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 4,
    ...Platform.select({
      web: { boxShadow: '0px 2px 12px rgba(0,0,0,0.12)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  payoutCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  payoutTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  payoutSub: { fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 4, lineHeight: 17 },
  profileChipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  profileChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
    maxWidth: 200,
  },
  profileChipText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  payoutStatus: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  payoutCta: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  payoutCtaText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  statsOverview: { flexDirection: 'row', alignItems: 'center', padding: 24 },
  quickStat: { flex: 1, alignItems: 'center' },
  quickStatValue: { fontSize: 22, fontFamily: 'Poppins_700Bold' },
  quickStatLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing:0.5 },
  statDivider: { width: 1, height: 32, marginHorizontal: 20 },
  
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  filterBtnText: { fontSize: 10, fontFamily: 'Poppins_700Bold' },
  
  eventRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1, 
    marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 2 }
    })
  },
  eventInfo: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  eventMeta: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  eventRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  addSmallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: CultureTokens.indigo + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addSmallText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: CultureTokens.indigo },
  
  contentRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 20, 
    borderWidth: 1, 
    marginBottom: 12, 
    gap: 12,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 2 }
    })
  },
  contentThumbWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: CultureTokens.indigo + '10', alignItems: 'center', justifyContent: 'center' },
  contentThumbPlaceholder: { opacity: 0.5 },
  
  tipsCard: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 16, marginTop: 12 },
  tipsText: { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },

  fab: { 
    position: 'absolute', 
    bottom: 32, 
    right: 24, 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    alignItems: 'center', 
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 4px 16px rgba(0,0,0,0.3)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 8 }
    }),
    overflow: 'hidden' 
  },
});

export default function OrganizerDashboard() {
  return (
    <ErrorBoundary>
      <OrganizerDashboardContent />
    </ErrorBoundary>
  );
}
