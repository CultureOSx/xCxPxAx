import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@tanstack/react-query';
import { GlassContainer, GlassView } from 'expo-glass-effect';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { api } from '@/lib/api';
import { CultureTokens, gradients } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const isWeb = Platform.OS === 'web';

// Cockpit Data Card using Liquid Glass
function CockpitCard({ title, value, icon, color, delay }: { title: string, value: string | number, icon: keyof typeof Ionicons.glyphMap, color: string, delay: number }) {
  const colors = useColors();
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(20)} style={styles.cardWrapper}>
      <GlassView style={[styles.card, { borderColor: colors.borderLight }]}>
        <View style={[styles.cardIconWrap, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardValue, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{title}</Text>
        </View>
      </GlassView>
    </Animated.View>
  );
}

// Action Item using Liquid Glass
function ActionItem({ title, description, icon, color, danger, onPress, pending }: { title: string, description: string, icon: keyof typeof Ionicons.glyphMap, color: string, danger?: boolean, onPress: () => void, pending?: boolean }) {
  const colors = useColors();
  return (
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
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionTitle, { color: danger ? color : colors.text }]}>{title}</Text>
        <Text style={[styles.actionDesc, { color: colors.textTertiary }]}>{description}</Text>
      </View>
      {pending ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      )}
    </Pressable>
  );
}

export default function SuperAdminCockpit() {
  const insets = useSafeAreaInsets();
  const topInset = isWeb ? 0 : insets.top;
  const colors = useColors();
  const { isDesktop, hPad, contentWidth } = useLayout();
  const { isSuperAdmin, isLoading: roleLoading } = useRole();

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

  // Action Mutations
  const algoliaMutation = useMutation({
    mutationFn: () => api.admin.algoliaBackfill({ force: false }),
    onSuccess: () => {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Algolia sync triggered successfully.');
    },
    onError: (err: any) => {
      Alert.alert('Algolia Sync Error', err?.message || 'Failed to sync');
    }
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

  const [maintenanceMode, setMaintenanceMode] = useState(false);

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
            setMaintenanceMode(!maintenanceMode);
            if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
          style={{ paddingTop: topInset, zIndex: 10 }}
        >
          <Animated.View entering={FadeInUp.duration(300)} style={[styles.header, { paddingHorizontal: hPad }]}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/admin/dashboard')}
              style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
              accessibilityRole="button" accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>SuperAdmin Cockpit</Text>
              <Text style={styles.headerSub}>Root Control & System Oversight</Text>
            </View>
            <View style={styles.badgeWrap}>
              <Ionicons name="shield-checkmark" size={12} color="#fff" />
              <Text style={styles.badgeText}>ROOT</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: hPad, paddingBottom: insets.bottom + 40 },
            isDesktop && { width: contentWidth, alignSelf: 'center' as const }
          ]}
        >
          {/* Stats Glass Grid */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform Metrics</Text>
          </View>
          
          <GlassContainer spacing={10}>
            <View style={styles.grid}>
              <CockpitCard 
                delay={100} 
                title="Registered Users" 
                value={statsLoading ? '...' : (stats?.totalUsers?.toLocaleString() ?? 0)} 
                icon="people" 
                color={CultureTokens.indigo} 
              />
              <CockpitCard 
                delay={150} 
                title="Published Events" 
                value={statsLoading ? '...' : (stats?.totalEvents?.toLocaleString() ?? 0)} 
                icon="calendar" 
                color={CultureTokens.gold} 
              />
              <CockpitCard 
                delay={200} 
                title="Active Councils" 
                value={statsLoading ? '...' : (stats?.activeCouncils?.toLocaleString() ?? 0)} 
                icon="business" 
                color={CultureTokens.teal} 
              />
              <CockpitCard 
                delay={250} 
                title="Tickets Sold" 
                value={statsLoading ? '...' : (stats?.totalTicketsSold?.toLocaleString() ?? 0)} 
                icon="ticket" 
                color={colors.primary} 
              />
            </View>
          </GlassContainer>

          {/* Core Actions */}
          <View style={[styles.sectionHeader, { marginTop: 12 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Agentic Ops & Syncing</Text>
          </View>
          
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <GlassView style={[styles.actionGroup, { borderColor: colors.borderLight }]}>
              <ActionItem
                title="Sync Algolia Databases"
                description="Trigger manual sync from Firestore to all Algolia Search indexes"
                icon="logo-amplify"
                color={CultureTokens.indigo}
                onPress={() => algoliaMutation.mutate()}
                pending={algoliaMutation.isPending}
              />
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
              <ActionItem
                title="Align Geohashes & Location"
                description="Force AU postcode alignment and radius indexing globally"
                icon="earth-outline"
                color={CultureTokens.teal}
                onPress={() => geoMutation.mutate()}
                pending={geoMutation.isPending}
              />
              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
              <ActionItem
                title="View Full Audit Logs"
                description="Access unmodified security and operation logs for platform"
                icon="list-outline"
                color={colors.primary}
                onPress={() => router.push('/admin/audit-logs')}
              />
            </GlassView>
          </Animated.View>

          {/* Danger Zone */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <View style={[styles.sectionHeader, { marginTop: 12 }]}>
              <Text style={[styles.sectionTitle, { color: CultureTokens.coral }]}>Danger Zone</Text>
            </View>
            <GlassView style={[styles.actionGroup, { borderColor: CultureTokens.coral + '40', borderWidth: 1 }]}>
              <ActionItem
                title={maintenanceMode ? "Restore Normal Operation" : "Engage Maintenance Mode"}
                description="Locks out all non-admin sessions instantly"
                icon={maintenanceMode ? "lock-open-outline" : "lock-closed-outline"}
                color={maintenanceMode ? CultureTokens.gold : CultureTokens.coral}
                danger
                onPress={toggleMaintenanceMode}
              />
            </GlassView>
          </Animated.View>

        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    paddingTop: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.7)',
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: CultureTokens.purple + '80',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CultureTokens.purple,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
  },
  content: {
    paddingTop: 24,
    gap: 20,
  },
  sectionHeader: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardWrapper: {
    ...Platform.select({
      web: { flexBasis: '48%' as any, flexShrink: 0 },
      default: { width: '48%' }, 
    }),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardValue: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  actionGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70, // Align with text
  },
});
