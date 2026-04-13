import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@tanstack/react-query';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { api } from '@/lib/api';
import { CultureTokens, gradients, TextStyles } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BrandWordmark } from '@/components/ui/BrandWordmark';

const isWeb = Platform.OS === 'web';

function CockpitCard({ title, value, icon, color, delay }: { title: string, value: string | number, icon: keyof typeof Ionicons.glyphMap, color: string, delay: number }) {
  const colors = useColors();
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(20)} style={styles.cardWrapper}>
      <View style={[styles.card, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
        <View style={[styles.cardIconWrap, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardValue, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{title}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function ActionItem({ title, description, icon, color, danger, onPress, pending, delay = 0 }: { title: string, description: string, icon: keyof typeof Ionicons.glyphMap, color: string, danger?: boolean, onPress: () => void, pending?: boolean, delay?: number }) {
  const colors = useColors();
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.actionGridItem}>
      <View
        style={[
          styles.actionCard,
          {
            borderColor: danger ? color + '40' : colors.borderLight,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.actionItem,
            pressed && { backgroundColor: danger ? color + '10' : colors.primarySoft },
          ]}
          onPress={() => {
            if (!isWeb) Haptics.selectionAsync();
            onPress();
          }}
          disabled={pending}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon} size={16} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionTitle, { color: danger ? color : colors.text }]}>{title}</Text>
            <Text style={[styles.actionDesc, { color: colors.textTertiary }]} numberOfLines={1}>{description}</Text>
          </View>
          {pending ? (
            <ActivityIndicator size="small" color={color} />
          ) : (
            <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}

function CommandChip({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => {
        if (!isWeb) Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.commandChip,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.commandChipIcon, { backgroundColor: color + '16' }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={[styles.commandChipText, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export default function SuperAdminCockpit() {
  const insets = useSafeAreaInsets();
  const topInset = isWeb ? 0 : insets.top;
  const colors = useColors();
  const { isDesktop, isTablet, hPad, contentWidth, columnGap } = useLayout();
  const { isSuperAdmin, isLoading: roleLoading } = useRole();
  const maxDesktopContentWidth = 1280;
  const effectiveGridWidth = isDesktop
    ? Math.min(contentWidth, maxDesktopContentWidth - hPad * 2)
    : contentWidth;
  const responsiveCols = isDesktop ? 3 : isTablet ? 2 : 1;
  const responsiveCellWidth =
    responsiveCols === 1
      ? '100%'
      : (effectiveGridWidth - columnGap * (responsiveCols - 1)) / responsiveCols;
  const signalCols = isDesktop ? 3 : isTablet ? 2 : 1;
  const signalCellWidth =
    signalCols === 1
      ? '100%'
      : (effectiveGridWidth - columnGap * (signalCols - 1)) / signalCols;

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      router.replace('/(tabs)');
    }
  }, [isSuperAdmin, roleLoading]);

  // Fetch true stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: api.admin.stats,
    enabled: isSuperAdmin,
    refetchInterval: 30000,
  });

  const geoMutation = useMutation({
    mutationFn: () => api.admin.geohashBackfill({ forceGeoHash: false, overwriteCoordinates: false }),
    onSuccess: () => {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Geohash alignment triggered successfully.');
    },
    onError: (err: any) => {
      Alert.alert('Geohash Sync Error', err?.message || 'Failed to sync geo hashes');
    }
  });

  // Fetch current config
  const { data: configData, refetch: refetchConfig } = useQuery({
    queryKey: ['admin-config'],
    queryFn: api.admin.getSystemConfig,
    enabled: isSuperAdmin,
  });

  const maintenanceMode = configData?.config?.maintenanceMode ?? false;
  const criticalAlerts = useMemo(() => {
    if (!stats) return [];
    const alerts: string[] = [];
    if ((stats.pendingModerationCount ?? 0) > 0) alerts.push(`${stats.pendingModerationCount} moderation items pending`);
    if ((stats.pendingHandlesCount ?? 0) > 0) alerts.push(`${stats.pendingHandlesCount} handles awaiting review`);
    if ((stats.activeOrganizers ?? 0) === 0) alerts.push('No active organizers detected');
    return alerts;
  }, [stats]);

  const configMutation = useMutation({
    mutationFn: (updates: { maintenanceMode?: boolean }) => api.admin.updateSystemConfig(updates),
    onSuccess: () => {
      refetchConfig();
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      Alert.alert('Configuration Error', err?.message || 'Failed to update system config');
    }
  });

  const toggleMaintenanceMode = () => {
    Alert.alert(
      maintenanceMode ? 'Disable Maintenance Mode' : 'Engage Maintenance Mode',
      maintenanceMode 
        ? 'Are you sure you want to restore regular platform access?' 
        : 'Are you sure? This will lock out all non-admin users instantly.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: maintenanceMode ? 'Restore Access' : 'Engage Lockout', 
          style: maintenanceMode ? 'default' : 'destructive',
          onPress: () => {
             configMutation.mutate({ maintenanceMode: !maintenanceMode });
          }
        }
      ]
    );
  };

  if (roleLoading || !isSuperAdmin) {
    return <View style={{ flex: 1, backgroundColor: colors.background }}><ActivityIndicator style={{marginTop: 50}} /></View>;
  }

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: colors.background }]}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <LinearGradient
          colors={gradients.midnight as unknown as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingTop: topInset, zIndex: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}
        >
          <Animated.View entering={FadeInUp.duration(300)} style={[styles.header, { paddingHorizontal: hPad }]}>
            <View style={[styles.headerControlGlass, { backgroundColor: 'rgba(24,28,48,0.92)' }]}>
              <Pressable
                onPress={() => router.canGoBack() ? router.back() : router.replace('/admin/dashboard')}
                style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
                accessibilityRole="button" accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </Pressable>
            </View>
            
            <View style={{ flex: 1, marginLeft: 12 }}>
              <BrandWordmark size="sm" withTagline={false} light />
              <Text style={[styles.headerSub, { color: CultureTokens.gold }]}>Root Control & System Oversight</Text>
            </View>

            <View style={[styles.headerControlGlass, { backgroundColor: 'rgba(24,28,48,0.92)' }]}>
              <View style={styles.badgeWrap}>
                <Ionicons name="shield-checkmark" size={12} color={CultureTokens.gold} />
                <Text style={[styles.badgeText, { color: CultureTokens.gold }]}>ROOT</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: hPad, paddingBottom: insets.bottom + 40 },
            isDesktop && { maxWidth: maxDesktopContentWidth, alignSelf: 'center' as const, width: '100%' }
          ]}
        >
          {/* ── Command Deck ───────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={[styles.commandDeck, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={styles.commandDeckHeader}>
              <View style={styles.commandDeckTitleRow}>
                <View style={[styles.liveDot, { backgroundColor: maintenanceMode ? CultureTokens.coral : CultureTokens.teal }]} />
                <Text style={[styles.commandDeckTitle, { color: colors.text }]}>Command Deck</Text>
              </View>
              <Text style={[styles.commandDeckSub, { color: colors.textSecondary }]}>
                {maintenanceMode ? 'Maintenance mode is ON' : 'Platform operating normally'}
              </Text>
            </View>

            <View style={styles.signalGrid}>
              <View style={[styles.signalCard, { width: signalCellWidth, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                <Text style={[styles.signalLabel, { color: colors.textTertiary }]}>Active organizers</Text>
                <Text style={[styles.signalValue, { color: colors.text }]}>
                  {statsLoading ? '...' : (stats?.activeOrganizers?.toLocaleString() ?? '0')}
                </Text>
              </View>
              <View style={[styles.signalCard, { width: signalCellWidth, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                <Text style={[styles.signalLabel, { color: colors.textTertiary }]}>New users (7d)</Text>
                <Text style={[styles.signalValue, { color: colors.text }]}>
                  {statsLoading ? '...' : (stats?.newUsersThisWeek?.toLocaleString() ?? '0')}
                </Text>
              </View>
              <View style={[styles.signalCard, { width: signalCellWidth, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                <Text style={[styles.signalLabel, { color: colors.textTertiary }]}>Pending moderation</Text>
                <Text style={[styles.signalValue, { color: (stats?.pendingModerationCount ?? 0) > 0 ? CultureTokens.coral : colors.text }]}>
                  {statsLoading ? '...' : (stats?.pendingModerationCount?.toLocaleString() ?? '0')}
                </Text>
              </View>
            </View>

            <View style={styles.commandChipRow}>
              <CommandChip label="Users" icon="people-outline" color={CultureTokens.indigo} onPress={() => router.push('/admin/users')} />
              <CommandChip label="Moderation" icon="eye-outline" color={CultureTokens.coral} onPress={() => router.push('/admin/moderation')} />
              <CommandChip label="Ingestion" icon="cloud-upload-outline" color={CultureTokens.teal} onPress={() => router.push('/admin/import')} />
              <CommandChip label="Finance" icon="card-outline" color={CultureTokens.gold} onPress={() => router.push('/admin/finance')} />
            </View>
          </Animated.View>

          {criticalAlerts.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.alertStrip, { backgroundColor: CultureTokens.coral + '12', borderColor: CultureTokens.coral + '35' }]}>
              <Ionicons name="warning-outline" size={16} color={CultureTokens.coral} />
              <Text style={[styles.alertText, { color: colors.text }]}>
                {criticalAlerts.join(' • ')}
              </Text>
            </Animated.View>
          ) : null}

          {/* Stats Glass Grid */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Core Signals</Text>
          </View>
          
          <View style={{ gap: 10 }}>
            <View style={[styles.grid, { gap: columnGap }]}>
              <View style={{ width: responsiveCellWidth }}>
                <CockpitCard 
                  delay={100} 
                  title="Registered Users" 
                  value={statsLoading ? '...' : (stats?.totalUsers?.toLocaleString() ?? 0)} 
                  icon="people" 
                  color={CultureTokens.indigo} 
                />
              </View>
              <View style={{ width: responsiveCellWidth }}>
                <CockpitCard 
                  delay={150} 
                  title="Published Events" 
                  value={statsLoading ? '...' : (stats?.totalEvents?.toLocaleString() ?? 0)} 
                  icon="calendar" 
                  color={CultureTokens.gold} 
                />
              </View>
              <View style={{ width: responsiveCellWidth }}>
                <CockpitCard 
                  delay={200} 
                  title="Active Councils" 
                  value={statsLoading ? '...' : (stats?.activeCouncils?.toLocaleString() ?? 0)} 
                  icon="business" 
                  color={CultureTokens.teal} 
                />
              </View>
              <View style={{ width: responsiveCellWidth }}>
                <CockpitCard 
                  delay={250} 
                  title="Tickets Sold" 
                  value={statsLoading ? '...' : (stats?.totalTicketsSold?.toLocaleString() ?? 0)} 
                  icon="ticket" 
                  color={colors.primary} 
                />
              </View>
            </View>
          </View>

          {/* ── System Ops & Infrastructure ──────────────────────────────── */}
          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>System Operations</Text>
          </View>
          
          <View style={[styles.grid, { gap: columnGap }]}>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={300}
                title="Align Geohashes"
                description="AU postcode alignment"
                icon="earth-outline"
                color={CultureTokens.teal}
                onPress={() => geoMutation.mutate()}
                pending={geoMutation.isPending}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={320}
                title="Platform Settings"
                description="Flags & configuration"
                icon="settings-outline"
                color={colors.primary}
                onPress={() => router.push('/admin/platform')}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={360}
                title="Discover Curation"
                description="Rail & spotlight curation"
                icon="sparkles-outline"
                color={CultureTokens.gold}
                onPress={() => router.push('/admin/discover')}
              />
            </View>
          </View>

          {/* ── People & Governance ───────────────────────────────────────── */}
          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>People & Governance</Text>
          </View>
          
          <View style={[styles.grid, { gap: columnGap }]}>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={380}
                title="Manage Users"
                description="Registry & role audits"
                icon="people-outline"
                color={CultureTokens.indigo}
                onPress={() => router.push('/admin/users')}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={400}
                title="Handle Approvals"
                description="Domain moderation"
                icon="at-outline"
                color={CultureTokens.purple}
                onPress={() => router.push('/admin/handles')}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={420}
                title="Moderation"
                description="Reports & flagging"
                icon="eye-outline"
                color={CultureTokens.coral}
                onPress={() => router.push('/admin/moderation')}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={440}
                title="Compliance"
                description="Data audits & GDPR"
                icon="shield-checkmark-outline"
                color={CultureTokens.teal}
                onPress={() => router.push('/admin/data-compliance')}
              />
            </View>
          </View>

          {/* ── Content Lifecycle (CRUD) ──────────────────────────────────── */}
          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Content Operations</Text>
          </View>
          
          <View style={[styles.grid, { gap: columnGap }]}>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={460}
                title="Create Event"
                description="Multi-step wizard"
                icon="add-circle"
                color={CultureTokens.gold}
                onPress={() => router.push('/event/create')}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={480}
                title="Manage Events"
                description="Master event list"
                icon="calendar-outline"
                color={CultureTokens.indigo}
                onPress={() => router.push('/admin/events')}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={500}
                title="Profiles"
                description="Artists & Venues"
                icon="id-card-outline"
                color={CultureTokens.teal}
                onPress={() => router.push('/admin/profiles')}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={520}
                title="Communities"
                description="Diaspora groups"
                icon="people-circle-outline"
                color={CultureTokens.indigo}
                onPress={() => router.push('/admin/communities')}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={540}
                title="Taxonomy"
                description="Cultural metadata tags"
                icon="pricetags-outline"
                color={CultureTokens.purple}
                onPress={() => router.push('/admin/taxonomy')}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={560}
                title="Updates"
                description="Microblog entries"
                icon="newspaper-outline"
                color={CultureTokens.coral}
                onPress={() => router.push('/admin/updates')}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={580}
                title="Locations"
                description="Council data & GIS"
                icon="location-outline"
                color={CultureTokens.teal}
                onPress={() => router.push('/admin/locations')}
              />
            </View>
          </View>

          {/* ── Marketplace & Logistics ───────────────────────────────────── */}
          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Marketplace & Logistics</Text>
          </View>
          
          <View style={[styles.grid, { gap: columnGap }]}>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={600}
                title="Tickets"
                description="Orders & bookings"
                icon="ticket-outline"
                color={CultureTokens.purple}
                onPress={() => router.push('/admin/tickets')}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={620}
                title="Perks"
                description="Benefit listings"
                icon="gift-outline"
                color={CultureTokens.coral}
                onPress={() => router.push('/admin/perks')}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={640}
                title="Finance"
                description="Stripe & subscriptions"
                icon="card-outline"
                color={CultureTokens.gold}
                onPress={() => router.push('/admin/finance')}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={660}
                title="Shopping & Retail"
                description="Manage stores & products"
                icon="bag-handle-outline"
                color={CultureTokens.teal}
                onPress={() => router.push('/admin/shopping')}
              />
            </View>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={680}
                title="Ingestion"
                description="Manual JSON/CSV imports"
                icon="cloud-upload-outline"
                color={CultureTokens.indigo}
                onPress={() => router.push('/admin/import')}
              />
            </View>
          </View>

          {/* ── Security ─────────────────────────────────────────────────── */}
          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Security</Text>
          </View>
          
          <View style={[styles.grid, { gap: columnGap }]}>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={680}
                title="Logs"
                description="Unmodified audit trail"
                icon="list-outline"
                color={colors.primary}
                onPress={() => router.push('/admin/audit-logs')}
              />
            </View>
          </View>

          {/* ── Danger Zone ────────────────────────────────────────────────── */}
          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: CultureTokens.coral }]}>Danger Zone</Text>
          </View>
          
          <View style={[styles.grid, { gap: columnGap }]}>
            <View style={{ width: responsiveCellWidth }}>
              <ActionItem
                delay={700}
                title={maintenanceMode ? "Restore" : "Lockout"}
                description="Platform maintenance"
                icon={maintenanceMode ? "lock-open-outline" : "lock-closed-outline"}
                color={maintenanceMode ? CultureTokens.gold : CultureTokens.coral}
                danger
                onPress={toggleMaintenanceMode}
              />
            </View>
          </View>

        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerControlGlass: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  backBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TextStyles.title2,
    letterSpacing: -0.5,
    marginBottom: -2,
  },
  headerSub: {
    ...TextStyles.badge,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  badgeText: {
    ...TextStyles.tabLabel,
    letterSpacing: 1.5,
  },
  content: {
    paddingTop: 24,
    gap: 20,
  },
  commandDeck: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  commandDeckHeader: {
    gap: 3,
  },
  commandDeckTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  commandDeckTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.2,
  },
  commandDeckSub: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    marginLeft: 16,
  },
  signalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  signalCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  signalLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  signalValue: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.2,
  },
  commandChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commandChip: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  commandChipIcon: {
    width: 20,
    height: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commandChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  alertStrip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  sectionHeader: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    ...TextStyles.cardTitle,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardWrapper: {
    marginBottom: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardValue: {
    ...TextStyles.title3,
    marginBottom: 0,
  },
  cardTitle: {
    ...TextStyles.tabLabel,
  },
  actionGridItem: {
    marginBottom: 0,
  },
  actionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    ...TextStyles.cardTitle,
    marginBottom: 0,
  },
  actionDesc: {
    ...TextStyles.badge,
  },
});
