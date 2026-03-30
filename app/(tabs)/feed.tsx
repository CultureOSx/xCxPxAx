// app/(tabs)/feed.tsx — Culture Feed (main screen)
import React, {
  useState, useMemo, useCallback, useEffect,
} from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import Reanimated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { feedKeys, communityKeys } from '@/hooks/queries/keys';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/constants/theme';
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HeaderAvatar } from '@/components/ui/HeaderAvatar';
import { uploadPostImage } from '@/lib/storage';
import {
  createCommunityPost,
} from '@/lib/feedService';
import type { EventData, Community } from '@/shared/schema';
import {
  FeedFilterBar, SkeletonCard, FeedListHeader, PostCard,
  TrendingInterstitial, CreatePostModal, useAuthGate, COUNTRY_FLAG,
} from '@/components/feed/FeedComponents';
import type { FeedFilter, FeedPost, ListItem } from '@/components/feed/types';

export default function CultureFeedScreen() {
  const insets      = useSafeAreaInsets();
  const topInset    = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;
  const colors      = useColors();
  const { isDesktop, hPad } = useLayout();
  const { state }   = useOnboarding();
  const { user: authUser, isAuthenticated } = useAuth();
  const gate        = useAuthGate();
  const queryClient = useQueryClient();

  const [refreshing,     setRefreshing]     = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [localPosts,     setLocalPosts]     = useState<FeedPost[]>([]);
  const [activeFilter,   setActiveFilter]   = useState<FeedFilter>('for-you');

  const { data: feedData, isLoading, isFetching } = useQuery({
    queryKey: feedKeys.list({ city: state.city, country: state.country }),
    queryFn: () => api.feed.list({ city: state.city, country: state.country, pageSize: 50 }),
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  useEffect(() => { setLocalPosts([]); }, [state.city, state.country]);
  useEffect(() => { if (feedData && !isFetching) setLocalPosts([]); }, [feedData, isFetching]);

  const { data: communities = [] } = useQuery<Community[]>({
    queryKey: communityKeys.list({ city: state.city, country: state.country }),
    queryFn: () => api.communities.list({ city: state.city, country: state.country }),
    staleTime: 5 * 60 * 1000,
  });

  const handleOpenCreatePost = useCallback(() => { gate(() => setShowCreatePost(true)); }, [gate]);

  const handleNewPost = useCallback(async (communityId: string, communityName: string, body: string, imageUri?: string) => {
    if (!authUser) return;
    const comm = communities.find((c) => c.id === communityId);
    if (!comm) return;
    const tempPost: FeedPost = {
      id: `local-${Math.random().toString(36).slice(2)}-${Date.now()}`,
      kind: 'announcement', community: comm, body,
      authorId: authUser.id, createdAt: new Date().toISOString(), imageUrl: imageUri,
    };
    setLocalPosts((prev) => [tempPost, ...prev]);
    (async () => {
      try {
        let finalImageUrl: string | undefined;
        if (imageUri) finalImageUrl = await uploadPostImage(imageUri, authUser.id);
        await createCommunityPost({
          authorId: authUser.id, authorName: authUser.username || authUser.email || 'User',
          communityId, communityName, body, imageUrl: finalImageUrl,
        });
        await queryClient.invalidateQueries({ queryKey: feedKeys.list({ city: state.city, country: state.country }) });
      } catch (err) {
        if (__DEV__) console.error('[CultureFeed] Failed to create post:', err);
      }
    })();
  }, [authUser, communities, queryClient, state.city, state.country]);

  // Build server posts
  const posts = useMemo<FeedPost[]>(() => {
    const serverItems = feedData?.items ?? [];
    const serverPosts: FeedPost[] = serverItems.map((item): FeedPost => {
      const comm: Community = {
        id: item.communityId ?? '', name: item.communityName ?? '',
        imageUrl: item.communityImageUrl ?? undefined,
      } as Community;
      if (item.kind === 'event' && item.event) {
        return { id: item.id, kind: 'event', event: item.event as EventData, community: comm, createdAt: item.createdAt, score: item.score, matchReason: item.matchReasons };
      }
      if (item.kind === 'milestone') {
        return { id: item.id, kind: 'milestone', community: comm, members: item.members ?? 0, createdAt: item.createdAt, score: item.score, matchReason: item.matchReasons };
      }
      if (item.kind === 'welcome') {
        return { id: item.id, kind: 'welcome', community: comm, createdAt: item.createdAt, score: item.score, matchReason: item.matchReasons };
      }
      if ((item as Record<string, unknown>).kind === 'collection-highlight') {
        const ext = item as Record<string, unknown>;
        return { id: item.id, kind: 'collection-highlight' as const, community: comm, tokenName: ext.tokenName as string, tokenImage: ext.tokenImage as string, userName: ext.userName as string, createdAt: item.createdAt, score: item.score, matchReason: item.matchReasons };
      }
      return { id: item.id, kind: 'announcement', community: comm, body: item.body ?? '', imageUrl: item.imageUrl ?? undefined, authorId: item.authorId, likesCount: item.likesCount, commentsCount: item.commentsCount, createdAt: item.createdAt, score: item.score, matchReason: item.matchReasons };
    });
    return [...localPosts, ...serverPosts];
  }, [feedData, localPosts]);

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'events')      return posts.filter(p => p.kind === 'event');
    if (activeFilter === 'communities') return posts.filter(p => p.kind !== 'event');
    return posts;
  }, [posts, activeFilter]);

  // Build list items, injecting a trending interstitial at position 4
  const listItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [...filteredPosts];
    if (items.length >= 4) {
      items.splice(4, 0, { kind: '_trending', id: 'trending-interstitial', city: state.city || '' });
    }
    return items;
  }, [filteredPosts, state.city]);

  const eventCount = useMemo(() => posts.filter(p => p.kind === 'event').length, [posts]);
  const commCount  = useMemo(() => posts.filter(p => p.kind !== 'event').length, [posts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: feedKeys.list({ city: state.city, country: state.country }) }),
      queryClient.invalidateQueries({ queryKey: communityKeys.list({ city: state.city, country: state.country }) }),
    ]);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(false);
  }, [queryClient, state.city, state.country]);

  const country      = state.country || 'Australia';
  const countryFlag  = COUNTRY_FLAG[country] ?? '🇦🇺';
  const locationLabel = state.city
    ? `${state.city}${state.country ? `, ${state.country}` : ''}`
    : state.country || 'Australia';

  const renderItem = useCallback(({ item, index }: { item: ListItem; index: number }) => {
    if (item.kind === '_trending') {
      return <TrendingInterstitial city={item.city} colors={colors} />;
    }
    return (
      <ErrorBoundary>
        <PostCard post={item} colorIdx={index} />
      </ErrorBoundary>
    );
  }, [colors]);

  const renderListHeader = useCallback(() => (
    <FeedListHeader
      communities={communities}
      authUser={authUser ?? null}
      colors={colors}
      isAuthenticated={isAuthenticated}
      hPad={hPad}
      city={state.city || ''}
      onCreatePost={handleOpenCreatePost}
    />
  ), [communities, authUser, colors, isAuthenticated, hPad, state.city, handleOpenCreatePost]);

  return (
    <ErrorBoundary>
      <Stack.Screen 
        options={{ 
          title: 'Feed | CulturePass',
          headerShown: false,
        }} 
      />
      <View style={[sc.root, { backgroundColor: colors.background, paddingTop: topInset }]}>
        {/* ── Header ── */}
        <Reanimated.View
          style={[sc.header, { paddingHorizontal: hPad, borderBottomColor: colors.divider, backgroundColor: colors.background }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[sc.title, { color: colors.text }]}>Culture Feed</Text>
            <View style={sc.locationRow}>
              <Ionicons name="location" size={10} color={CultureTokens.indigo} />
              <Text style={[sc.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                {countryFlag} {locationLabel}
                {!isLoading && filteredPosts.length > 0
                  ? ` · ${filteredPosts.length} posts`
                  : ''}
              </Text>
            </View>
          </View>
          <View style={sc.headerRight}>
            <HeaderAvatar />
            <Pressable
              style={[sc.headerIconBtn, { backgroundColor: colors.surface + '80', borderColor: colors.borderLight }]}
              onPress={() => router.push('/search')}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <Ionicons name="search-outline" size={18} color={colors.text} />
            </Pressable>
            <Pressable
              style={[sc.headerIconBtn, { backgroundColor: colors.surface + '80', borderColor: colors.borderLight }]}
              onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); handleRefresh(); }}
              accessibilityRole="button"
              accessibilityLabel="Refresh feed"
            >
              {refreshing || isFetching
                ? <ActivityIndicator size="small" color={CultureTokens.indigo} />
                : <Ionicons name="refresh" size={18} color={colors.text} />}
            </Pressable>
          </View>
        </Reanimated.View>

        {/* Sticky filter tabs — outside FlatList */}
        <FeedFilterBar
          active={activeFilter}
          onChange={setActiveFilter}
          eventCount={eventCount}
          commCount={commCount}
          colors={colors}
          hPad={hPad}
        />

        {/* Fetch indicator */}
        {isFetching && !isLoading && (
          <View style={sc.fetchBar}>
            <View style={[sc.fetchProgress, { backgroundColor: CultureTokens.indigo }]} />
          </View>
        )}

        {isLoading ? (
          <ScrollView
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 80 }}
            scrollEnabled={false}
          >
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} colors={colors} />)}
          </ScrollView>
        ) : (
          <FlashList
            data={listItems}
            keyExtractor={(item) => (item as ListItem).id}
            numColumns={isDesktop ? 2 : 1}
            renderItem={renderItem}
            ListHeaderComponent={renderListHeader}
            {...({ estimatedItemSize: isDesktop ? 420 : 500 } as any)}
            contentContainerStyle={[
              sc.list,
              { paddingHorizontal: isDesktop ? hPad : 0, paddingBottom: bottomInset + 96 },
              isDesktop && sc.listDesktop,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={CultureTokens.indigo}
                colors={[CultureTokens.indigo]}
              />
            }
            ListEmptyComponent={
              <View style={[sc.empty, { paddingHorizontal: hPad }]}>
                <View style={[sc.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <Ionicons name="chatbubbles-outline" size={32} color={colors.textTertiary} />
                </View>
                <Text style={[sc.emptyTitle, { color: colors.text }]}>
                  {activeFilter === 'events'      ? 'No events in your area yet'
                   : activeFilter === 'communities' ? 'No community updates yet'
                   : 'Your feed is empty'}
                </Text>
                <Text style={[sc.emptySub, { color: colors.textSecondary }]}>
                  {activeFilter === 'events'      ? 'Check back soon or update your location'
                   : activeFilter === 'communities' ? 'Join communities to see their updates here'
                   : 'Follow communities and explore events to get started'}
                </Text>
                <Pressable
                  style={[sc.emptyCta, { backgroundColor: CultureTokens.indigo }]}
                  onPress={() => router.push(activeFilter === 'events' ? '/events' : '/(tabs)/community')}
                  accessibilityRole="button"
                >
                  <Text style={sc.emptyCtaText}>
                    {activeFilter === 'events' ? 'Browse Events' : 'Browse Communities'}
                  </Text>
                </Pressable>
              </View>
            }
          />
        )}
      </View>

      <CreatePostModal
        visible={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleNewPost}
        communities={communities}
        colors={colors}
      />
    </ErrorBoundary>
  );
}

const sc = StyleSheet.create({
  root:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title:        { fontSize: 22, fontFamily: 'Poppins_700Bold', lineHeight: 28, letterSpacing: -0.4 },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  locationText: { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 17 },
  headerRight:  { flexDirection: 'row', gap: 6, alignItems: 'center' },
  headerIconBtn:{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  fetchBar:     { height: 2, backgroundColor: CultureTokens.indigo + '30' },
  fetchProgress:{ height: 2, width: '60%' },
  list:         { paddingTop: 0 },
  listDesktop:  { maxWidth: 860, width: '100%', alignSelf: 'center' as const },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon:    { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 4 },
  emptyTitle:   { fontSize: 17, fontFamily: 'Poppins_700Bold', lineHeight: 24 },
  emptySub:     { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },
  emptyCta:     { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  emptyCtaText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 18 },
});
