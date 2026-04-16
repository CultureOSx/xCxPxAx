import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useReducedMotion } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { CardSurface } from '@/components/ui/CardSurface';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { useAuth } from '@/lib/auth';
import {
  useCommunity,
  useCommunityMembers,
  useCommunityRecommendedEvents,
  useJoinCommunity,
  useJoinedCommunities,
  useLeaveCommunity,
} from '@/hooks/queries/useCommunities';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily } from '@/constants/theme';
import {
  getCommunityActivityMeta,
  getCommunityHeadline,
  getCommunityLabel,
  getCommunityLocationLabel,
  getCommunityMemberCount,
  getCommunitySignals,
} from '@/lib/community';

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 28 : insets.bottom;
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const [tab, setTab] = useState<'about' | 'events' | 'members'>('events');
  const [optimisticJoined, setOptimisticJoined] = useState<boolean | null>(null);
  const [optimisticMemberDelta, setOptimisticMemberDelta] = useState(0);

  const communityQuery = useCommunity(id ?? '');
  const membersQuery = useCommunityMembers(id ?? '');
  const eventsQuery = useCommunityRecommendedEvents(id ?? '');
  const joinedQuery = useJoinedCommunities();
  const joinMutation = useJoinCommunity();
  const leaveMutation = useLeaveCommunity();

  const community = communityQuery.data;
  const joinedFromServer = !!id && (joinedQuery.data?.communityIds ?? []).includes(id);
  const isJoined = optimisticJoined ?? joinedFromServer;
  const activity = community ? getCommunityActivityMeta(community) : null;
  const headline = community ? getCommunityHeadline(community) : '';
  const signals = community ? getCommunitySignals(community) : [];
  const locationLabel = community ? getCommunityLocationLabel(community) : null;
  const posts = useMemo(() => community?.longFormPosts?.slice(0, 4) ?? [], [community]);
  const members = membersQuery.data?.members ?? [];
  // ...existing code...
  const recommendedEvents = eventsQuery.data ?? [];
  const heroImage = community?.coverImageUrl || community?.imageUrl;
  const memberCountValue = Math.max(0, getCommunityMemberCount(community ?? {}) + optimisticMemberDelta);
  const heroStats = [
    { label: 'Members', value: memberCountValue.toLocaleString() },
    { label: 'Events', value: `${recommendedEvents.length}` },
    { label: 'Momentum', value: activity?.label ?? 'New', accent: activity?.color },
  ];

  const handleJoinToggle = () => {
    if (!id) return;
    if (!user) {
      router.push('/(onboarding)/login');
      return;
    }
    if (isJoined) {
      setOptimisticJoined(false);
      setOptimisticMemberDelta((prev) => prev - 1);
      leaveMutation.mutate(id);
      return;
    }
    setOptimisticJoined(true);
    setOptimisticMemberDelta((prev) => prev + 1);
    joinMutation.mutate(id);
  };

  if (communityQuery.isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={CultureTokens.indigo} />
      </View>
    );
  }

  if (!community) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingHorizontal: 24 }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Community not found</Text>
        <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
          This community may have moved or no longer be available.
        </Text>
        <Button onPress={() => router.replace('/community')} style={styles.emptyButton}>
          Back to Community Hub
        </Button>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <FlashList
          data={[{ id: '__header__' }]}
          keyExtractor={(item) => item.id}
          renderItem={() => (
            <>
          <View style={[styles.hero, { paddingTop: topInset + 12 }]}>
            {heroImage ? (
              <Image source={{ uri: heroImage }} style={styles.heroMedia} contentFit="cover" />
            ) : (
              <LinearGradient
                colors={[CultureTokens.indigo, '#1B0F2E', '#0D3B35']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroMedia}
              />
            )}
            {(Platform.OS === 'ios' || Platform.OS === 'android') && (
              <BlurView
                intensity={Platform.OS === 'ios' ? 40 : 24}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            )}
            <LinearGradient
              colors={['rgba(8,10,20,0.1)', 'rgba(8,10,20,0.56)', 'rgba(8,10,20,0.92)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroTopRow}>
              <LiquidGlassPanel borderRadius={22} style={styles.heroTopGlass} contentStyle={styles.heroTopGlassContent}>
                <Pressable
                  onPress={() => (router.canGoBack() ? router.back() : router.replace('/community'))}
                  style={styles.heroIconBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Ionicons name="chevron-back" size={20} color="#fff" />
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/community/${community.id}/members`)}
                  style={styles.heroIconBtn}
                  accessibilityRole="button"
                  accessibilityLabel="View members"
                >
                  <Ionicons name="people-outline" size={18} color="#fff" />
                </Pressable>
              </LiquidGlassPanel>
            </View>

            <View style={styles.heroBody}>
              <View style={styles.heroAvatar}>
                {community.imageUrl ? (
                  <Image source={{ uri: community.imageUrl }} style={styles.heroAvatarImage} contentFit="cover" />
                ) : (
                  <Text style={styles.heroAvatarText}>{community.name.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <Text style={styles.heroTitle}>{community.name}</Text>
              <Text style={styles.heroSubtitle}>
                {getCommunityLabel(community)}
                {locationLabel ? ` · ${locationLabel}` : ''}
              </Text>
              <Text style={styles.heroHeadline}>{headline}</Text>

              <View style={styles.heroBadgeRow}>
                {(signals.length > 0 ? signals : ['Community']).map((signal) => (
                  <LiquidGlassPanel key={signal} borderRadius={999} style={styles.heroBadge} contentStyle={styles.heroBadgeContent}>
                    <Text style={styles.heroBadgeText}>{signal}</Text>
                  </LiquidGlassPanel>
                ))}
              </View>

              <View style={styles.heroActions}>
                <Button
                  onPress={handleJoinToggle}
                  variant={isJoined ? 'outline' : 'gradient'}
                  style={styles.heroActionBtn}
                  loading={joinMutation.isPending || leaveMutation.isPending}
                  fullWidth
                >
                  {isJoined ? 'Leave Community' : 'Join Community'}
                </Button>
                <Button
                  onPress={() => router.push(`/community/${community.id}/members`)}
                  variant="secondary"
                  style={styles.heroActionBtn}
                  fullWidth
                >
                  View Members
                </Button>
              </View>
            </View>
          </View>

          <View style={styles.contentShell}>
            <View style={styles.statGrid}>
              {heroStats.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  colors={colors}
                  accent={stat.accent}
                />
              ))}
            </View>

            <LiquidGlassPanel style={styles.glassCard} contentStyle={styles.cardContent}>
              <View style={styles.tabRow}>
                {(['about', 'events', 'members'] as const).map((item) => {
                  const active = tab === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setTab(item)}
                      style={[
                        styles.tabPill,
                        {
                          backgroundColor: active ? colors.primarySoft : 'transparent',
                          borderColor: active ? colors.primary : colors.borderLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabPillText,
                          { color: active ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </LiquidGlassPanel>

            <LiquidGlassPanel style={styles.glassCard} contentStyle={styles.cardContent}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {tab === 'about' ? 'About this community' : tab === 'events' ? 'Hosted events' : 'Members'}
                </Text>
                {tab === 'members' ? (
                  <Pressable onPress={() => router.push(`/community/${community.id}/members`)}>
                    <Text style={styles.linkText}>See all</Text>
                  </Pressable>
                ) : null}
              </View>

              {tab === 'about' ? (
                <>
                  <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                    {community.description || headline}
                  </Text>
                  {posts.length > 0 ? (
                    <View style={styles.inlinePosts}>
                      {posts.slice(0, 2).map((post) => (
                        <View key={post.id} style={[styles.postRow, { borderColor: colors.borderLight }]}>
                          <Text style={[styles.postTitle, { color: colors.text }]}>{post.title}</Text>
                          <Text style={[styles.postMeta, { color: colors.textSecondary }]}>{post.publishedAt}</Text>
                          <Text style={[styles.sectionBody, { color: colors.textSecondary }]} numberOfLines={3}>
                            {post.content}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </>
              ) : null}
            </LiquidGlassPanel>

            {tab === 'events' ? (
              recommendedEvents.length > 0 ? (
                recommendedEvents.map((event) => (
                  <Pressable
                    key={event.id}
                    onPress={() => router.push(`/event/${event.id}`)}
                    style={[styles.feedCard, { borderColor: colors.borderLight }]}
                  >
                    <BlurView intensity={20} tint={Platform.OS === 'ios' ? 'light' : 'default'} style={StyleSheet.absoluteFill} />
                    {event.imageUrl ? <Image source={{ uri: event.imageUrl }} style={styles.feedImage} contentFit="cover" /> : null}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.eventMeta, { color: colors.textSecondary }]}>
                        {[event.date, event.city, event.venue].filter(Boolean).join(' · ')}
                      </Text>
                      <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyFeedState}>
                  <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                    No linked events yet. Once this community publishes events, they will appear here.
                  </Text>
                </View>
              )
            ) : null}

            {tab === 'members' ? (
              members.length > 0 ? (
                members.map((member) => (
                  <View key={member.id} style={[styles.feedCard, styles.memberFeedCard, { borderColor: colors.borderLight }]}>
                    <BlurView intensity={20} tint={Platform.OS === 'ios' ? 'light' : 'default'} style={StyleSheet.absoluteFill} />
                    <View style={[styles.memberAvatar, { backgroundColor: colors.backgroundSecondary }]}>
                      {member.avatarUrl ? (
                        <Image source={{ uri: member.avatarUrl }} style={styles.memberAvatarImage} contentFit="cover" />
                      ) : (
                        <Text style={[styles.memberAvatarText, { color: colors.text }]}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                      <Text style={[styles.memberMeta, { color: colors.textSecondary }]}>
                        {[member.username ? `+${member.username}` : null, member.city, member.country].filter(Boolean).join(' · ') || 'Community member'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyFeedState}>
                  {membersQuery.isLoading ? (
                    <ActivityIndicator color={CultureTokens.indigo} />
                  ) : (
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                      No member profiles are visible yet.
                    </Text>
                  )}
                </View>
              )
            ) : null}

              {!reducedMotion && (
                <CardSurface colors={colors} style={styles.footerHintCard} contentStyle={styles.footerHintContent}>
                  <Text style={[styles.footerHintTitle, { color: colors.text }]}>Culture-led discovery</Text>
                  <Text style={[styles.footerHintBody, { color: colors.textSecondary }]}>
                    This hub surfaces members, hosted events, and updates together so communities feel alive, not just listed.
                  </Text>
                </CardSurface>
              )}
            </View>
            </>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 36 }}
        />
      </View>
    </ErrorBoundary>
  );
}

function StatCard({
  label,
  value,
  colors,
  accent,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  accent?: string;
}) {
  return (
    <LiquidGlassPanel style={styles.statCard} contentStyle={styles.statCardContent}>
      <Text style={[styles.statValue, { color: accent || colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </LiquidGlassPanel>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 22, fontFamily: FontFamily.bold },
  emptySub: { marginTop: 8, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyButton: { marginTop: 16 },
  hero: { paddingBottom: 24, minHeight: 430, overflow: 'hidden' },
  heroMedia: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTopRow: {
    paddingHorizontal: 16,
  },
  heroTopGlass: {
    alignSelf: 'stretch',
  },
  heroTopGlassContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 26 },
  heroAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarImage: { width: '100%', height: '100%' },
  heroAvatarText: { fontSize: 40, color: '#fff', fontFamily: FontFamily.bold },
  heroTitle: { marginTop: 16, fontSize: 28, color: '#fff', fontFamily: FontFamily.bold, textAlign: 'center' },
  heroSubtitle: { marginTop: 4, fontSize: 14, color: 'rgba(255,255,255,0.78)', fontFamily: FontFamily.medium, textAlign: 'center' },
  heroHeadline: { marginTop: 10, fontSize: 14, lineHeight: 21, color: '#fff', textAlign: 'center' },
  heroBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 },
  heroBadge: {
    minHeight: 34,
  },
  heroBadgeContent: { paddingHorizontal: 10, paddingVertical: 7 },
  heroBadgeText: { color: '#fff', fontSize: 12, fontFamily: FontFamily.semibold },
  heroActions: { marginTop: 18, width: '100%', gap: 10, maxWidth: 420 },
  heroActionBtn: { minHeight: 52 },
  contentShell: { padding: 16, gap: 14, width: '100%', maxWidth: 980, alignSelf: 'center' },
  statGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1 },
  statCardContent: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontFamily: FontFamily.bold },
  statLabel: { marginTop: 4, fontSize: 12, fontFamily: FontFamily.medium },
  glassCard: {},
  cardContent: { padding: 16, gap: 12 },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tabPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabPillText: { fontSize: 13, fontFamily: FontFamily.semibold },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontFamily: FontFamily.bold },
  sectionBody: { fontSize: 14, lineHeight: 22, fontFamily: FontFamily.regular },
  linkText: { color: CultureTokens.indigo, fontSize: 13, fontFamily: FontFamily.semibold },
  inlinePosts: { gap: 10 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1 },
  memberAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarImage: { width: '100%', height: '100%' },
  memberAvatarText: { fontSize: 18, fontFamily: FontFamily.bold },
  memberName: { fontSize: 15, fontFamily: FontFamily.semibold },
  memberMeta: { marginTop: 2, fontSize: 12, fontFamily: FontFamily.medium },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  eventTitle: { fontSize: 15, fontFamily: FontFamily.semibold },
  eventMeta: { marginTop: 2, fontSize: 12, fontFamily: FontFamily.medium },
  postRow: { paddingTop: 12, borderTopWidth: 1 },
  postTitle: { fontSize: 15, fontFamily: FontFamily.semibold, marginBottom: 4 },
  postMeta: { fontSize: 12, fontFamily: FontFamily.medium, marginBottom: 8 },
  feedCard: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 12,
  },
  memberFeedCard: {
    minHeight: 84,
  },
  feedImage: { width: 84, height: 84, borderRadius: 16 },
  emptyFeedState: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 8 },
  footerHintCard: { marginTop: 2 },
  footerHintContent: { padding: 16 },
  footerHintTitle: { fontSize: 16, fontFamily: FontFamily.bold },
  footerHintBody: { marginTop: 6, fontSize: 14, lineHeight: 21, fontFamily: FontFamily.regular },
});
