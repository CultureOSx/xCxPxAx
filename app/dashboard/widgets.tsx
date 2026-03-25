import { useEffect } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ActivityIndicator, StyleSheet, Text, View, Platform, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WidgetSpotlightCard } from '@/components/widgets/WidgetSpotlightCard';
import { WidgetNearbyEventsCard } from '@/components/widgets/WidgetNearbyEventsCard';
import { WidgetUpcomingTicketCard } from '@/components/widgets/WidgetUpcomingTicketCard';
import { WidgetIdentityQRCard } from '@/components/widgets/WidgetIdentityQRCard';
import { BackButton } from '@/components/ui/BackButton';
import TabScreenShell from '@/components/tabs/TabScreenShell';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLayout } from '@/hooks/useLayout';
import { useColors } from '@/hooks/useColors';
import { syncCultureWidgetSnapshots } from '@/lib/widgets/sync';
import { CultureTokens, gradients } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function WidgetsDashboardContent() {
  const colors = useColors();
  const { isDesktop, width } = useLayout();
  const { user, userId } = useAuth();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);

  const contentMaxWidth = isDesktop ? 800 : width;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['widgets-dashboard', userId, user?.city, user?.country],
    queryFn: async () => {
      const [spotlights, nearby, upcomingTicket] = await Promise.all([
        api.widgets.spotlight(1),
        api.widgets.happeningNearYou({
          city: user?.city,
          country: user?.country,
          limit: 3,
        }),
        userId ? api.widgets.upcomingTicket(userId) : Promise.resolve(null),
      ]);
      return {
        spotlight: spotlights[0] ?? null,
        nearby,
        upcomingTicket,
      };
    },
  });

  useEffect(() => {
    if (!data) return;

    syncCultureWidgetSnapshots({
      spotlight: data.spotlight,
      nearby: data.nearby,
      upcomingTicket: data.upcomingTicket,
      displayName: user?.displayName ?? user?.username,
      culturePassId: user?.culturePassId,
      city: user?.city,
      country: user?.country,
    });
  }, [data, user?.city, user?.country, user?.culturePassId, user?.displayName, user?.username]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.culturepassBrand as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <BackButton fallback="/(tabs)/profile" color="#FFFFFF" />
          <View style={styles.headerTextWrapper}>
            <Text style={[TextStyles.title2, { color: '#FFFFFF' }]}>Widget Center</Text>
            <Text style={[TextStyles.caption, { color: 'rgba(255,255,255,0.7)' }]}>
              Manage your iOS & Android smart cards
            </Text>
          </View>
          <Pressable 
            onPress={() => refetch()}
            style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </LinearGradient>

      <TabScreenShell 
        contentMaxWidth={contentMaxWidth} 
        horizontalPadding={16} 
        contentContainerStyle={styles.screenContent}
      >
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={CultureTokens.indigo} />
            <Text style={styles.loadingText}>Syncing snapshots…</Text>
          </View>
        ) : (
          <View style={styles.dashboardGrid}>
            
            {/* Spotlight Section */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="sparkles" size={18} color={CultureTokens.indigo} />
                <Text style={styles.sectionTitle}>Global Spotlight</Text>
              </View>
              {data?.spotlight ? (
                <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
                  <WidgetSpotlightCard item={data.spotlight} />
                </Animated.View>
              ) : (
                 <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No active spotlight for your area</Text>
                 </View>
              )}
            </View>

            {/* Near You Section */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="location" size={18} color={CultureTokens.indigo} />
                <Text style={styles.sectionTitle}>Happening Near You</Text>
              </View>
              <Animated.View entering={FadeInDown.delay(200).springify().damping(18)}>
                <WidgetNearbyEventsCard events={data?.nearby ?? []} />
              </Animated.View>
            </View>

            {/* Tickets Section */}
            {userId && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="ticket" size={18} color={CultureTokens.indigo} />
                  <Text style={styles.sectionTitle}>Quick Access Pass</Text>
                </View>
                <Animated.View entering={FadeInDown.delay(300).springify().damping(18)}>
                  <WidgetUpcomingTicketCard item={data?.upcomingTicket ?? null} />
                </Animated.View>
              </View>
            )}

            {/* Identity Section */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="finger-print" size={18} color={CultureTokens.indigo} />
                <Text style={styles.sectionTitle}>Business & Identity Card</Text>
              </View>
              <Animated.View entering={FadeInDown.delay(400).springify().damping(18)}>
                <WidgetIdentityQRCard 
                  displayName={user?.displayName ?? user?.username ?? 'CulturePass Member'} 
                  culturePassId={(user as any)?.culturePassId ?? user?.id ?? 'CP-ID'} 
                  role={user?.role}
                />
              </Animated.View>
            </View>

            <View style={styles.footerInfo}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
              <Text style={styles.footerNote}>
                Changes on this dashboard will automatically sync to your device widgets within 15 minutes.
              </Text>
            </View>
          </View>
        )}
      </TabScreenShell>
    </View>
  );
}

export default function WidgetsDashboardScreen() {
  return (
    <ErrorBoundary>
      <WidgetsDashboardContent />
    </ErrorBoundary>
  );
}

const getStyles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerGradient: {
      paddingTop: Platform.OS === 'web' ? 20 : insets.top,
      paddingBottom: 24,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    headerTextWrapper: {
      flex: 1,
    },
    refreshBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    screenContent: {
      paddingTop: 24,
      paddingBottom: 60,
    },
    dashboardGrid: {
      gap: 24,
    },
    sectionGroup: {
      gap: 12,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: 'Poppins_700Bold',
      color: colors.text,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    emptyCard: {
      padding: 30,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      color: colors.textTertiary,
      fontSize: 13,
      fontFamily: 'Poppins_400Regular',
    },
    footerInfo: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 12,
      marginTop: 12,
      opacity: 0.7,
    },
    footerNote: {
      flex: 1,
      fontSize: 12,
      fontFamily: 'Poppins_400Regular',
      color: colors.textTertiary,
      lineHeight: 18,
    },
    loading: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 100,
      gap: 14,
    },
    loadingText: {
      fontSize: 15,
      fontFamily: 'Poppins_600SemiBold',
      color: colors.textSecondary,
    },
  });
