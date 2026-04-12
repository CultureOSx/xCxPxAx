import { View, Text, ScrollView, Pressable, StyleSheet, Alert , Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { api } from '@/lib/api';
import type { PendingHandleItem } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { CultureTokens } from '@/constants/theme';
import { queryClient } from '@/lib/query-client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';

const isWeb = Platform.OS === 'web';

function HandleCard({ item, onApprove, onReject }: {
  item: PendingHandleItem;
  onApprove: () => void;
  onReject: () => void;
}) {
  const colors = useColors();
  const isProfile = item.type === 'profile';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={styles.cardLeft}>
        <View style={[styles.typeIcon, { backgroundColor: isProfile ? CultureTokens.teal + '18' : CultureTokens.indigo + '18' }]}>
          <Ionicons
            name={isProfile ? 'business-outline' : 'person-outline'}
            size={18}
            color={isProfile ? CultureTokens.teal : CultureTokens.indigo}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.handleText, { color: colors.text }]}>+{item.handle}</Text>
          <Text style={[styles.nameSub, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.name}{item.entityType ? `  ·  ${item.entityType}` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: CultureTokens.teal + '18', borderColor: CultureTokens.teal + '40' }]}
          onPress={onApprove}
          accessibilityRole="button"
          accessibilityLabel={`Approve +${item.handle}`}
        >
          <Ionicons name="checkmark" size={16} color={CultureTokens.teal} />
          <Text style={[styles.actionText, { color: CultureTokens.teal }]}>Approve</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: CultureTokens.coral + '18', borderColor: CultureTokens.coral + '40' }]}
          onPress={onReject}
          accessibilityRole="button"
          accessibilityLabel={`Reject +${item.handle}`}
        >
          <Ionicons name="close" size={16} color={CultureTokens.coral} />
          <Text style={[styles.actionText, { color: CultureTokens.coral }]}>Reject</Text>
        </Pressable>
      </View>
    </View>
  );
}

function HandlesSkeleton() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 16, gap: 12 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} width="100%" height={120} borderRadius={14} />
        ))}
      </View>
    </View>
  );
}

function HandlesContent() {
  const colors = useColors();
  const { hPad } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const { isAdmin } = useRole();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-pending-handles'],
    queryFn: () => api.admin.pendingHandles(),
    enabled: isAdmin,
    staleTime: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ type, id }: { type: 'user' | 'profile'; id: string }) =>
      api.admin.approveHandle(type, id),
    onSuccess: () => {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['admin-pending-handles'] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ type, id }: { type: 'user' | 'profile'; id: string }) =>
      api.admin.rejectHandle(type, id),
    onSuccess: () => {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      queryClient.invalidateQueries({ queryKey: ['admin-pending-handles'] });
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="lock-closed" size={44} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Admin Access Required</Text>
      </View>
    );
  }

  const handles = data?.handles ?? [];

  const handleApprove = (item: PendingHandleItem) => {
    Alert.alert(
      'Approve Handle',
      `Approve +${item.handle} for ${item.name}? They will become visible in public listings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => approveMutation.mutate({ type: item.type, id: item.id }) },
      ]
    );
  };

  const handleReject = (item: PendingHandleItem) => {
    Alert.alert(
      'Reject Handle',
      `Reject +${item.handle} for ${item.name}? This handle will not be publicly visible.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => rejectMutation.mutate({ type: item.type, id: item.id }) },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12, paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <Pressable 
          style={styles.backBtn} 
          onPress={() => {
            if(!isWeb) Haptics.selectionAsync();
            if (router.canGoBack()) router.back(); else router.replace('/admin/dashboard');
          }} 
          accessibilityRole="button" 
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Handle Approvals</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {isLoading ? 'Loading…' : `${handles.length} pending`}
          </Text>
        </View>
        <Pressable
          style={[styles.refreshBtn, { backgroundColor: colors.backgroundSecondary }]}
          onPress={() => {
            if(!isWeb) Haptics.selectionAsync();
            refetch();
          }}
          accessibilityRole="button"
          accessibilityLabel="Refresh"
        >
          <Ionicons name="refresh-outline" size={18} color={colors.text} />
        </Pressable>
      </View>

      {isLoading ? (
        <HandlesSkeleton />
      ) : handles.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={52} color={CultureTokens.teal} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>All caught up</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>No pending handles to review</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 40 }]}
        >
          {handles.map(item => (
            <HandleCard
              key={`${item.type}-${item.id}`}
              item={item}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export default function AdminHandlesScreen() {
  return (
    <ErrorBoundary>
      <HandlesContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn:      { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  headerTitle:  { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  headerSub:    { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  refreshBtn:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle:   { fontSize: 18, fontFamily: 'Poppins_700Bold', marginTop: 4 },
  emptySub:     { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  list:         { paddingTop: 16, gap: 10 },

  card:         { 
    borderRadius: 14, 
    borderWidth: 1, 
    padding: 14, 
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
  cardLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeIcon:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  handleText:   { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  nameSub:      { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  actions:      { flexDirection: 'row', gap: 10 },
  actionBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, borderWidth: 1, paddingVertical: 9 },
  actionText:   { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
});
