import React from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CardSurface } from '@/components/ui/CardSurface';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { useCommunity, useCommunityMembers } from '@/hooks/queries/useCommunities';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily } from '@/constants/theme';

export default function CommunityMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 30 : insets.bottom;
  const communityQuery = useCommunity(id ?? '');
  const membersQuery = useCommunityMembers(id ?? '');

  const community = communityQuery.data;
  const members = membersQuery.data?.members ?? [];

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <View style={styles.hero}>
          <LinearGradient
            colors={[CultureTokens.indigo, '#1B0F2E', '#0D3B35']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroTopRow}>
            <LiquidGlassPanel borderRadius={22} style={styles.backGlass} contentStyle={styles.backGlassInner}>
              <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace(`/community/${id}`))} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </Pressable>
            </LiquidGlassPanel>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroKicker}>Community Hub</Text>
            <Text style={styles.heroTitle}>Members</Text>
            <Text style={styles.heroSub}>
              {community?.name || 'Community'} · {members.length} visible
            </Text>
            <View style={styles.heroSignals}>
              <LiquidGlassPanel borderRadius={999} style={styles.heroSignal} contentStyle={styles.heroSignalInner}>
                <Ionicons name="people-outline" size={13} color="#fff" />
                <Text style={styles.heroSignalText}>{members.length} visible members</Text>
              </LiquidGlassPanel>
              <LiquidGlassPanel borderRadius={999} style={styles.heroSignal} contentStyle={styles.heroSignalInner}>
                <Ionicons name="sparkles-outline" size={13} color="#fff" />
                <Text style={styles.heroSignalText}>Culture-led network</Text>
              </LiquidGlassPanel>
            </View>
          </View>
        </View>

        {membersQuery.isLoading ? (
          <View style={styles.loaderWrap}>
            <LiquidGlassPanel style={styles.loaderCard} contentStyle={styles.loaderCardInner}>
              <ActivityIndicator color={CultureTokens.indigo} />
              <Text style={[styles.loaderText, { color: colors.textSecondary }]}>Loading community members...</Text>
            </LiquidGlassPanel>
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 24, gap: 12 }}
            renderItem={({ item }) => (
              <LiquidGlassPanel style={styles.memberGlass} contentStyle={styles.memberCard}>
                <View style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}>
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} contentFit="cover" />
                  ) : (
                    <Text style={[styles.avatarText, { color: colors.text }]}>{item.name.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.memberMeta, { color: colors.textSecondary }]}>
                    {[item.username ? `+${item.username}` : null, item.city, item.country].filter(Boolean).join(' · ') || 'CulturePass member'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </LiquidGlassPanel>
            )}
            ListEmptyComponent={
              <LiquidGlassPanel style={styles.emptyGlass} contentStyle={styles.emptyWrap}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No visible members yet</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Members will appear here as people join this community.
                </Text>
              </LiquidGlassPanel>
            }
          />
        )}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    minHeight: 240,
    overflow: 'hidden',
    paddingBottom: 20,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,10,20,0.22)',
  },
  heroTopRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backGlass: { alignSelf: 'flex-start' },
  backGlassInner: { padding: 6 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  heroKicker: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.82)',
  },
  heroTitle: {
    marginTop: 10,
    fontSize: 30,
    fontFamily: FontFamily.bold,
    color: '#fff',
  },
  heroSub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: FontFamily.medium,
  },
  heroSignals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  heroSignal: {},
  heroSignalInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  heroSignalText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  loaderCard: { width: '100%', maxWidth: 420 },
  loaderCardInner: { padding: 20, alignItems: 'center', gap: 12 },
  loaderText: { fontSize: 14, fontFamily: FontFamily.medium },
  memberGlass: {},
  memberCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 20, fontFamily: FontFamily.bold },
  memberName: { fontSize: 16, fontFamily: FontFamily.semibold },
  memberMeta: { marginTop: 3, fontSize: 13, fontFamily: FontFamily.medium },
  emptyGlass: { marginTop: 40 },
  emptyWrap: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontFamily: FontFamily.bold, textAlign: 'center' },
  emptySub: { marginTop: 8, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
