import { useEffect } from 'react';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WidgetSpotlightCard } from '@/components/widgets/WidgetSpotlightCard';
import { WidgetNearbyEventsCard } from '@/components/widgets/WidgetNearbyEventsCard';
import { WidgetUpcomingTicketCard } from '@/components/widgets/WidgetUpcomingTicketCard';
import TabScreenShell from '@/components/tabs/TabScreenShell';
import TabSectionShell from '@/components/tabs/TabSectionShell';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLayout } from '@/hooks/useLayout';
import { useColors } from '@/hooks/useColors';
import { syncCultureWidgetSnapshots } from '@/lib/widgets/sync';

function WidgetsDashboardContent() {
  const colors = useColors();
  const { isDesktop, width } = useLayout();
  const { user, userId } = useAuth();
  const styles = getStyles(colors);

  const contentMaxWidth = isDesktop ? 960 : width;

  const { data, isLoading } = useQuery({
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
      <TabScreenShell contentMaxWidth={contentMaxWidth} horizontalPadding={16} contentContainerStyle={styles.screenContent}>
        <TabSectionShell maxWidth={contentMaxWidth}>
          <Animated.View entering={FadeInUp.duration(320).springify()} style={styles.header}>
            <Text style={styles.title}>Widget Dashboard</Text>
            <Text style={styles.subtitle}>Web card primitives aligned for future iOS/Android widgets.</Text>
          </Animated.View>
        </TabSectionShell>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading widget cards…</Text>
          </View>
        ) : (
          <>
            {data?.spotlight ? (
              <Animated.View entering={FadeInDown.delay(80).springify().damping(18)}>
                <TabSectionShell maxWidth={contentMaxWidth} style={styles.section}>
                  <WidgetSpotlightCard item={data.spotlight} />
                </TabSectionShell>
              </Animated.View>
            ) : null}

            <Animated.View entering={FadeInDown.delay(140).springify().damping(18)}>
              <TabSectionShell maxWidth={contentMaxWidth} style={styles.section}>
                <WidgetNearbyEventsCard events={data?.nearby ?? []} />
              </TabSectionShell>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify().damping(18)}>
              <TabSectionShell maxWidth={contentMaxWidth} style={styles.section}>
                <WidgetUpcomingTicketCard item={data?.upcomingTicket ?? null} />
              </TabSectionShell>
            </Animated.View>
          </>
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

const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    screenContent: {
      paddingTop: 18,
      paddingBottom: 36,
    },
    header: {
      gap: 4,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Poppins_700Bold',
      color: colors.text,
    },
    subtitle: {
      fontSize: 13,
      fontFamily: 'Poppins_400Regular',
      color: colors.textSecondary,
    },
    section: {
      marginTop: 14,
    },
    loading: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      gap: 10,
    },
    loadingText: {
      fontSize: 14,
      fontFamily: 'Poppins_500Medium',
      color: colors.textSecondary,
    },
  });
