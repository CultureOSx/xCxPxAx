import { useEffect, useMemo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, Platform, ScrollView } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, gradients } from '@/constants/theme';
import { api } from '@/lib/api';
import { goBackOrReplace } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { routeWithRedirect } from '@/lib/routes';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// ─── Tap Card Helper ──────────────────────────────────────────────────────────
function TapCard({ onPress, style, children }: {
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[anim, style]}>
      <Pressable
        onPressIn={() => { 
          if(Platform.OS !== 'web') Haptics.selectionAsync();
          scale.value = withSpring(0.96, { damping: 15 }); 
        }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={onPress}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function WalletReadinessSkeleton() {
  const colors = useColors();
  const { columnWidth, isDesktop } = useLayout();
  return (
    <View style={{ gap: 20 }}>
      <Skeleton width="100%" height={120} borderRadius={20} />
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16 }}>
        <Skeleton width={isDesktop ? columnWidth(2) : '100%'} height={160} borderRadius={20} />
        <Skeleton width={isDesktop ? columnWidth(2) : '100%'} height={160} borderRadius={20} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Skeleton width="100%" height={56} borderRadius={16} style={{ flex: 1 }} />
        <Skeleton width="100%" height={56} borderRadius={16} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function WalletReadinessContent() {
  const { isAuthenticated } = useAuth();
  const { isAdmin } = useRole();
  const colors = useColors();
  const { isDesktop, columnWidth } = useLayout();
  const styles = getStyles(colors);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(routeWithRedirect('/(onboarding)/login', '/dashboard/wallet-readiness') as never);
      return;
    }
    if (isAuthenticated && !isAdmin) {
      router.replace('/(tabs)' as never);
    }
  }, [isAuthenticated, isAdmin]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-wallet-business-card-readiness'],
    queryFn: () => api.admin.walletBusinessCardReadiness(),
  });

  const bootstrapMutation = useMutation({
    mutationFn: () => api.admin.bootstrapGoogleWalletBusinessCardClass(),
    onSuccess: () => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    },
  });

  const missingAll = useMemo(
    () => [...(data?.apple.missing ?? []), ...(data?.google.missing ?? [])],
    [data?.apple.missing, data?.google.missing]
  );

  const handleRefresh = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  }, [refetch]);

  const handleBootstrap = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bootstrapMutation.mutate();
  }, [bootstrapMutation]);

  const header = (
    <LinearGradient
      colors={data?.ready ? [CultureTokens.teal, CultureTokens.indigo] as [string, string] : gradients.midnight as unknown as [string, string]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.headerCard}
    >
      <View style={styles.headerRow}>
        <Pressable 
          style={styles.backBtn} 
          onPress={() => {
            if(Platform.OS !== 'web') Haptics.selectionAsync();
            goBackOrReplace('/admin/dashboard');
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Wallet Readiness</Text>
          <Text style={styles.headerSub}>Platform certificate & class validation</Text>
        </View>
        {data?.ready && (
          <View style={styles.readyBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
            <Text style={styles.readyBadgeText}>Verified</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );

  return (
    <DashboardShell header={header}>
      {isLoading ? (
        <WalletReadinessSkeleton />
      ) : (
        <View style={styles.mainContainer}>
          {/* Status Card */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <LinearGradient
              colors={data?.ready ? ['#2EC4B620', '#0066CC15'] as [string, string] : ['#FF5E5B15', '#0066CC10'] as [string, string]}
              style={[styles.statusCard, { borderColor: data?.ready ? CultureTokens.teal + '40' : CultureTokens.coral + '40' }]}
            >
              <View style={styles.statusIconRow}>
                <View style={[styles.statusIconWrap, { backgroundColor: data?.ready ? CultureTokens.teal + '30' : CultureTokens.coral + '30' }]}>
                  <Ionicons 
                    name={data?.ready ? "shield-checkmark" : "warning"} 
                    size={24} 
                    color={data?.ready ? CultureTokens.teal : CultureTokens.coral} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitle}>{data?.ready ? 'Production Ready' : 'Action Required'}</Text>
                  <Text style={styles.statusSub}>
                    {data?.ready
                      ? 'Apple and Google wallet prerequisites are correctly configured.'
                      : `Your environment is missing ${missingAll.length} critical setting${missingAll.length === 1 ? '' : 's'}.`}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Grid of Groups */}
          <View style={[styles.grid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
            {/* Apple */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ flex: 1 }}>
              <View style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Ionicons name="logo-apple" size={20} color={colors.text} />
                  <Text style={styles.groupTitle}>Apple Wallet</Text>
                  <View style={[styles.dot, { backgroundColor: data?.apple.ready ? CultureTokens.teal : CultureTokens.coral }]} />
                </View>
                <Text style={[styles.groupState, { color: data?.apple.ready ? CultureTokens.teal : CultureTokens.coral }]}>
                  {data?.apple.ready ? 'Configured' : 'Missing settings'}
                </Text>
                <View style={styles.missingList}>
                  {(data?.apple.missing ?? []).map((item) => (
                    <View key={item} style={styles.missingItemRow}>
                      <Ionicons name="close-circle-outline" size={14} color={CultureTokens.coral} />
                      <Text style={styles.missingItemText}>{item}</Text>
                    </View>
                  ))}
                  {data?.apple.ready && (
                    <View style={styles.missingItemRow}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={CultureTokens.teal} />
                      <Text style={[styles.missingItemText, { color: colors.textSecondary }]}>Pass Type ID & Certs valid</Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>

            {/* Google */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ flex: 1 }}>
              <View style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Ionicons name="logo-google" size={18} color={colors.text} />
                  <Text style={styles.groupTitle}>Google Wallet</Text>
                  <View style={[styles.dot, { backgroundColor: data?.google.ready ? CultureTokens.teal : CultureTokens.coral }]} />
                </View>
                <Text style={[styles.groupState, { color: data?.google.ready ? CultureTokens.teal : CultureTokens.coral }]}>
                  {data?.google.ready ? 'Configured' : 'Missing settings'}
                </Text>
                <View style={styles.missingList}>
                  {(data?.google.missing ?? []).map((item) => (
                    <View key={item} style={styles.missingItemRow}>
                      <Ionicons name="close-circle-outline" size={14} color={CultureTokens.coral} />
                      <Text style={styles.missingItemText}>{item}</Text>
                    </View>
                  ))}
                  {data?.google.ready && (
                    <View style={styles.missingItemRow}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={CultureTokens.teal} />
                      <Text style={[styles.missingItemText, { color: colors.textSecondary }]}>Issuer ID & Service Account valid</Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Actions */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.actions}>
            <TapCard onPress={handleRefresh} style={{ flex: 1 }}>
              <View style={[styles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }]}>
                <Ionicons name="refresh" size={18} color={colors.text} />
                <Text style={[styles.actionText, { color: colors.text }]}>{isRefetching ? 'Checking…' : 'Re-verify'}</Text>
              </View>
            </TapCard>
            <TapCard onPress={handleBootstrap} style={{ flex: 1 }}>
              <LinearGradient
                colors={[CultureTokens.teal, '#1EB0A4'] as [string, string]}
                style={styles.actionBtn}
              >
                <Ionicons name="rocket-outline" size={18} color="#0B0B14" />
                <Text style={styles.actionText}>{bootstrapMutation.isPending ? 'Working…' : 'Bootstrap Google'}</Text>
              </LinearGradient>
            </TapCard>
          </Animated.View>

          <Text style={styles.footerNote}>
            Google requires a one-time {'"'}Bootstrap{'"'} to create the Wallet Class on their servers if it doesn{"'"}t already exist.
          </Text>
        </View>
      )}
    </DashboardShell>
  );
}

export default function WalletReadinessScreen() {
  return (
    <ErrorBoundary>
      <WalletReadinessContent />
    </ErrorBoundary>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    mainContainer: { gap: 20 },
    // Header
    headerCard: { borderRadius: 20, padding: 16, overflow: 'hidden' },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { 
      width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', 
      backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' 
    },
    headerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: '#fff' },
    headerSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 1 },
    readyBadge: { 
      flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, 
      borderRadius: 10, backgroundColor: 'rgba(46,196,182,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' 
    },
    readyBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#fff' },

    // Status Card
    statusCard: { 
      borderRadius: 20, padding: 20, borderWidth: 1,
      ...Platform.select({
        web: { boxShadow: '0px 8px 24px rgba(0,0,0,0.15)' },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
        },
        android: { elevation: 8 }
      })
    },
    statusIconRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    statusIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    statusTitle: { color: colors.text, fontSize: 18, fontFamily: 'Poppins_700Bold' },
    statusSub: { color: colors.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 4, lineHeight: 18 },

    // Grid
    grid: { gap: 16 },
    groupCard: {
      flex: 1,
      borderRadius: 20,
      padding: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      ...Platform.select({
        web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: { elevation: 4 }
      })
    },
    groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    groupTitle: { color: colors.text, fontSize: 15, fontFamily: 'Poppins_700Bold', flex: 1 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    groupState: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginBottom: 14 },
    missingList: { gap: 8 },
    missingItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    missingItemText: { color: colors.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },

    // Actions
    actions: { flexDirection: 'row', gap: 12, marginTop: 10 },
    actionBtn: {
      height: 56,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    actionText: { color: '#0B0B14', fontFamily: 'Poppins_700Bold', fontSize: 14 },
    footerNote: { 
      color: colors.textTertiary, fontSize: 12, fontFamily: 'Poppins_400Regular', 
      textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 
    },
  });
