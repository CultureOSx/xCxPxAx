// @ts-nocheck
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TabPrimaryHeader } from '@/components/tabs/TabPrimaryHeader';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { CultureTokens } from '@/constants/theme';
import type { EventData, Ticket } from '@/shared/schema';

const IS_WEB = Platform.OS === 'web';

export default function CalendarSyncScreen() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { userId, isAuthenticated } = useAuth();
  const topInset = IS_WEB ? 0 : insets.top;
  const bottomInset = IS_WEB ? 20 : insets.bottom;

  const {
    prefs,
    isLoading,
    isSyncing,
    permissionGranted,
    connectDeviceCalendar,
    disconnectDeviceCalendar,
    setShowPersonalEvents,
    setAutoAddTickets,
    exportAllTickets,
  } = useCalendarSync();

  const {
    data: tickets = [],
    isLoading: isTicketsLoading,
    refetch: refetchTickets,
  } = useQuery<Ticket[]>({
    queryKey: ['calendar-sync-tickets', userId],
    queryFn: () => api.tickets.forUser(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const activeTicketCount = useMemo(
    () => tickets.filter((t) => t.status === 'confirmed' || t.status === 'reserved' || t.status === 'used').length,
    [tickets],
  );

  const haptic = () => {
    if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const openSettings = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  const handleDeviceToggle = useCallback(async () => {
    haptic();
    if (prefs.deviceConnected) {
      Alert.alert(
        'Disconnect calendar',
        'CulturePass will stop reading your busy times from device calendar.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: () => void disconnectDeviceCalendar() },
        ],
      );
      return;
    }
    await connectDeviceCalendar();
  }, [prefs.deviceConnected, connectDeviceCalendar, disconnectDeviceCalendar]);

  const handleExportTickets = useCallback(async () => {
    haptic();
    if (!isAuthenticated || !userId) {
      Alert.alert('Sign in required', 'Please sign in to sync your tickets to calendar.');
      return;
    }

    const active = tickets.filter((t) => t.status === 'confirmed' || t.status === 'reserved' || t.status === 'used');
    if (!active.length) {
      Alert.alert('No active tickets', 'You do not have active tickets to export.');
      return;
    }

    try {
      const ids = [...new Set(active.map((t) => t.eventId).filter(Boolean))];
      const settled = await Promise.allSettled(ids.map((id) => api.events.get(id)));
      const events = settled
        .filter((r): r is PromiseFulfilledResult<EventData> => r.status === 'fulfilled')
        .map((r) => r.value);

      if (!events.length) {
        Alert.alert('Nothing to export', 'Could not load event details for your tickets right now.');
        return;
      }

      await exportAllTickets(events);
    } catch {
      Alert.alert('Export failed', 'Unable to sync tickets right now. Please try again.');
    }
  }, [isAuthenticated, userId, tickets, exportAllTickets]);

  if (isLoading) {
    return (
      <ErrorBoundary>
        <View style={[styles.loadingRoot, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={CultureTokens.indigo} />
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <TabPrimaryHeader
          title="Calendar Sync"
          subtitle={undefined}
          locationLabel={undefined}
          hPad={hPad}
          topInset={topInset}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: hPad,
              paddingBottom: bottomInset + 30,
              alignSelf: 'center',
              width: '100%',
              maxWidth: isDesktop ? 860 : undefined,
            },
          ]}
        >
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(220)}>
            <LiquidGlassPanel borderRadius={20} contentStyle={styles.heroCard}>
              <View style={[styles.heroIcon, { backgroundColor: CultureTokens.indigo + '18' }]}>
                <Ionicons
                  name={prefs.deviceConnected ? 'checkmark-done-circle' : 'calendar-outline'}
                  size={24}
                  color={CultureTokens.indigo}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroTitle, { color: colors.text }]}>
                  {prefs.deviceConnected ? 'Calendar Connected' : 'Connect Your Calendar'}
                </Text>
                <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                  Sync CulturePass tickets with Apple/Google calendar and avoid scheduling conflicts.
                </Text>
              </View>
            </LiquidGlassPanel>
          </Animated.View>

          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(40).duration(220)}>
            <LiquidGlassPanel borderRadius={18} contentStyle={styles.card}>
              <Row
                icon={IS_WEB ? 'download-outline' : 'phone-portrait-outline'}
                iconColor={CultureTokens.indigo}
                title={IS_WEB ? 'Browser Calendar Export' : 'Device Calendar Connection'}
                subtitle={
                  IS_WEB
                    ? 'On web, events export as .ics files.'
                    : permissionGranted
                      ? 'Calendar permission granted.'
                      : 'Calendar permission is required on iOS/Android.'
                }
                right={
                  IS_WEB ? (
                    <Text style={[styles.badge, { color: colors.textSecondary }]}>ICS</Text>
                  ) : (
                    <Switch
                      value={prefs.deviceConnected}
                      onValueChange={() => void handleDeviceToggle()}
                      trackColor={{ false: colors.borderLight, true: CultureTokens.indigo + '70' }}
                      thumbColor={prefs.deviceConnected ? CultureTokens.indigo : '#fff'}
                      accessibilityLabel="Toggle device calendar connection"
                    />
                  )
                }
              />

              {!IS_WEB && !permissionGranted ? (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
                  <Pressable
                    onPress={openSettings}
                    style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.82 : 1, borderColor: colors.borderLight }]}
                    accessibilityRole="button"
                    accessibilityLabel="Open device settings"
                  >
                    <Ionicons name="settings-outline" size={16} color={colors.text} />
                    <Text style={[styles.actionBtnText, { color: colors.text }]}>Open Device Settings</Text>
                  </Pressable>
                </>
              ) : null}
            </LiquidGlassPanel>
          </Animated.View>

          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(80).duration(220)}>
            <LiquidGlassPanel borderRadius={18} contentStyle={styles.card}>
              <Row
                icon="eye-outline"
                iconColor={CultureTokens.teal}
                title="Show Personal Busy Blocks"
                subtitle="Show personal calendar occupancy in Events calendar."
                right={
                  <Switch
                    value={prefs.showPersonalEvents}
                    onValueChange={(v) => void setShowPersonalEvents(v)}
                    trackColor={{ false: colors.borderLight, true: CultureTokens.teal + '70' }}
                    thumbColor={prefs.showPersonalEvents ? CultureTokens.teal : '#fff'}
                    disabled={!prefs.deviceConnected}
                  />
                }
              />
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
              <Row
                icon="add-circle-outline"
                iconColor={CultureTokens.coral}
                title="Auto-add New Tickets"
                subtitle="Automatically push newly purchased tickets to your calendar."
                right={
                  <Switch
                    value={prefs.autoAddTickets}
                    onValueChange={(v) => void setAutoAddTickets(v)}
                    trackColor={{ false: colors.borderLight, true: CultureTokens.coral + '70' }}
                    thumbColor={prefs.autoAddTickets ? CultureTokens.coral : '#fff'}
                    disabled={!prefs.deviceConnected && !IS_WEB}
                  />
                }
              />
            </LiquidGlassPanel>
          </Animated.View>

          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(120).duration(220)}>
            <LiquidGlassPanel borderRadius={18} contentStyle={styles.card}>
              <Row
                icon="ticket-outline"
                iconColor={CultureTokens.gold}
                title="Sync My Tickets Now"
                subtitle={
                  isTicketsLoading
                    ? 'Loading your tickets...'
                    : `${activeTicketCount} active ticket${activeTicketCount === 1 ? '' : 's'} ready to export`
                }
                right={isTicketsLoading ? <ActivityIndicator size="small" color={CultureTokens.indigo} /> : null}
              />
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => void refetchTickets()}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    { borderColor: colors.borderLight, backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Ionicons name="refresh-outline" size={15} color={colors.text} />
                  <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Refresh</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleExportTickets()}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: CultureTokens.indigo, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Ionicons name="download-outline" size={15} color="#fff" />
                  <Text style={styles.primaryBtnText}>Sync Tickets</Text>
                </Pressable>
              </View>
            </LiquidGlassPanel>
          </Animated.View>
        </ScrollView>

        {isSyncing ? (
          <View style={styles.syncOverlay}>
            <View style={[styles.syncPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
              <ActivityIndicator size="small" color={CultureTokens.indigo} />
              <Text style={[styles.syncText, { color: colors.text }]}>Syncing...</Text>
            </View>
          </View>
        ) : null}
      </View>
    </ErrorBoundary>
  );
}

function Row({
  icon,
  iconColor,
  title,
  subtitle,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingTop: 12, gap: 12 },

  heroCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, lineHeight: 22 },
  heroSub: { marginTop: 2, fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 17 },

  card: { paddingVertical: 4 },
  row: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, lineHeight: 19 },
  rowSub: { marginTop: 2, fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 16 },
  badge: { fontFamily: 'Poppins_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },

  divider: { height: 1, marginLeft: 66, opacity: 0.55 },
  actionBtn: {
    marginHorizontal: 14,
    marginVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  actionBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12 },

  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  secondaryBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
  primaryBtn: {
    flex: 1.2,
    minHeight: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 12 },

  syncOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncPill: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
});

