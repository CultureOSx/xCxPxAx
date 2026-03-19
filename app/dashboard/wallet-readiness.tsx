import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import { api } from '@/lib/api';
import { goBackOrReplace } from '@/lib/navigation';

function WalletReadinessContent() {
  const colors = useColors();
  const styles = getStyles(colors);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-wallet-business-card-readiness'],
    queryFn: () => api.admin.walletBusinessCardReadiness(),
  });

  const bootstrapMutation = useMutation({
    mutationFn: () => api.admin.bootstrapGoogleWalletBusinessCardClass(),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    },
  });

  const missingAll = useMemo(
    () => [...(data?.apple.missing ?? []), ...(data?.google.missing ?? [])],
    [data?.apple.missing, data?.google.missing]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => goBackOrReplace('/(tabs)')}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Wallet Readiness</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={CultureTokens.indigo} />
            <Text style={styles.loadingText}>Checking environment…</Text>
          </View>
        ) : (
          <>
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>{data?.ready ? 'Ready to Ship' : 'Configuration Required'}</Text>
              <Text style={styles.statusSub}>
                {data?.ready
                  ? 'Apple and Google wallet prerequisites are configured.'
                  : `Missing ${missingAll.length} environment setting${missingAll.length === 1 ? '' : 's'}.`}
              </Text>
            </View>

            <View style={styles.group}>
              <Text style={styles.groupTitle}>Apple Wallet</Text>
              <Text style={[styles.groupState, { color: data?.apple.ready ? CultureTokens.teal : CultureTokens.coral }]}>
                {data?.apple.ready ? 'Ready' : 'Missing settings'}
              </Text>
              {(data?.apple.missing ?? []).map((item) => (
                <Text key={item} style={styles.missingItem}>
                  - {item}
                </Text>
              ))}
            </View>

            <View style={styles.group}>
              <Text style={styles.groupTitle}>Google Wallet</Text>
              <Text style={[styles.groupState, { color: data?.google.ready ? CultureTokens.teal : CultureTokens.coral }]}>
                {data?.google.ready ? 'Ready' : 'Missing settings'}
              </Text>
              {(data?.google.missing ?? []).map((item) => (
                <Text key={item} style={styles.missingItem}>
                  - {item}
                </Text>
              ))}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.actionBtn}
                onPress={() => refetch()}
                disabled={isRefetching}
              >
                <Text style={styles.actionText}>{isRefetching ? 'Refreshing…' : 'Refresh Check'}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.bootstrapBtn]}
                onPress={() => bootstrapMutation.mutate()}
                disabled={bootstrapMutation.isPending}
              >
                <Text style={styles.actionText}>{bootstrapMutation.isPending ? 'Bootstrapping…' : 'Bootstrap Google Class'}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
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
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: 20,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backBtn: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.surface,
    },
    backText: { color: colors.text, fontFamily: 'Poppins_500Medium' },
    title: { color: colors.text, fontSize: 20, fontFamily: 'Poppins_700Bold' },
    content: { padding: 16, gap: 12, paddingBottom: 40 },
    loading: { paddingVertical: 40, alignItems: 'center', gap: 10 },
    loadingText: { color: colors.textSecondary, fontFamily: 'Poppins_500Medium' },
    statusCard: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 14,
      padding: 14,
      backgroundColor: colors.surface,
    },
    statusTitle: { color: colors.text, fontSize: 18, fontFamily: 'Poppins_700Bold' },
    statusSub: { color: colors.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2 },
    group: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 14,
      padding: 14,
      backgroundColor: colors.surface,
      gap: 4,
    },
    groupTitle: { color: colors.text, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
    groupState: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
    missingItem: { color: colors.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
    actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    actionBtn: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: CultureTokens.indigo,
    },
    bootstrapBtn: { backgroundColor: CultureTokens.teal },
    actionText: { color: '#0B0B14', fontFamily: 'Poppins_700Bold', fontSize: 12 },
  });
