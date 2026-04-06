// app/(tabs)/feed.tsx — Culture Feed (main screen)
import React, {
  useState, useMemo, useCallback, useEffect,
} from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useTabScrollBottomPadding } from '@/hooks/useTabScrollBottomPadding';
import { useRole } from '@/hooks/useRole';
import { CultureTokens, Spacing, gradients } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
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
  TrendingInterstitial, CreatePostModal, useAuthGate,
} from '@/components/feed/FeedComponents';
import type { FeedFilter, FeedPost, ListItem } from '@/components/feed/types';

export default function CultureFeedScreen() {
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const isWeb    = Platform.OS === 'web';
  const colors      = useColors();
  const { isDesktop, hPad } = useLayout();
  const { state }   = useOnboarding();
  const { user: authUser, isAuthenticated } = useAuth();
  const gate             = useAuthGate();
  const { hasRole }      = useRole();
  const canPostStoryStatus = hasRole('organizer', 'business', 'admin', 'platformAdmin');
  const queryClient      = useQueryClient();
  const listBottomPad    = useTabScrollBottomPadding(12);

  const [refreshing,     setRefreshing]     = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [createPostMode, setCreatePostMode] = useState<'standard' | 'story'>('standard');
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

  const handleOpenCreatePost = useCallback(() => {
    gate(() => {
      setCreatePostMode('standard');
      setShowCreatePost(true);
    });
  }, [gate]);

  const handleOpenStoryPost = useCallback(() => {
    gate(() => {
      setCreatePostMode('story');
      setShowCreatePost(true);
    });
  }, [gate]);

  const handleNewPost = useCallback(async (
    communityId: string,
    communityName: string,
    body: string,
    imageUri?: string,
    postStyle: 'standard' | 'story' = 'standard',
  ) => {
    if (!authUser) return;
    const comm = communities.find((c) => c.id === communityId);
    if (!comm) return;
    const tempPost: FeedPost = {
      id: `local-${Math.random().toString(36).slice(2)}-${Date.now()}`,
      kind: 'announcement',
      community: comm,
      body,
      postStyle: postStyle === 'story' ? 'story' : undefined,
      authorId: authUser.id,
      createdAt: new Date().toISOString(),
      imageUrl: imageUri,
    };
    setLocalPosts((prev) => [tempPost, ...prev]);
    (async () => {
      try {
        let finalImageUrl: string | undefined;
        if (imageUri) finalImageUrl = await uploadPostImage(imageUri, authUser.id);
        await createCommunityPost({
          authorId: authUser.id, authorName: authUser.username || authUser.email || 'User',
          communityId, communityName, body, imageUrl: finalImageUrl, postStyle,
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
      return {
        id: item.id,
        kind: 'announcement',
        community: comm,
        body: item.body ?? '',
        postStyle: item.postStyle === 'story' ? 'story' : undefined,
        imageUrl: item.imageUrl ?? undefined,
        authorId: item.authorId,
        likesCount: item.likesCount,
        commentsCount: item.commentsCount,
        createdAt: item.createdAt,
        score: item.score,
        matchReason: item.matchReasons,
      };
    });
    return [...localPosts, ...serverPosts];
  }, [feedData, localPosts]);

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'events')      return posts.filter(p => p.kind === 'event');
    if (activeFilter === 'communities') return posts.filter(p => p.kind !== 'event');
    return posts;
  }, [posts, activeFilter]);

  const postCounts = useMemo(() => {
    let eventCount = 0;
    for (const post of posts) {
      if (post.kind === 'event') eventCount += 1;
    }
    return { eventCount, commCount: posts.length - eventCount };
  }, [posts]);

  // Build list items, injecting a trending interstitial at position 4
  const listItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [...filteredPosts];
    const insertAt = isDesktop ? 5 : 4;
    if (items.length >= insertAt) {
      items.splice(insertAt, 0, { kind: '_trending', id: 'trending-interstitial', city: state.city || '' });
    }
    return items;
  }, [filteredPosts, state.city, isDesktop]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: feedKeys.list({ city: state.city, country: state.country }) }),
        queryClient.refetchQueries({ queryKey: communityKeys.list({ city: state.city, country: state.country }) }),
      ]);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, state.city, state.country]);

  const locationLabel = state.city
    ? `${state.city}${state.country ? `, ${state.country}` : ''}`
    : state.country || 'Australia';
  const locationA11yLabel = `${locationLabel}${!isLoading && filteredPosts.length > 0 ? `. ${filteredPosts.length} posts in feed` : ''}`;

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

  const getItemType = useCallback((item: ListItem) => {
    return item.kind === '_trending' ? 'trending' : item.kind;
  }, []);

  const listHeaderComponent = useMemo(() => (
    <FeedListHeader
      communities={communities}
      authUser={authUser ?? null}
      colors={colors}
      isAuthenticated={isAuthenticated}
      hPad={hPad}
      city={state.city || ''}
      onCreatePost={handleOpenCreatePost}
      canPostStoryStatus={canPostStoryStatus}
      onCreateStoryPost={handleOpenStoryPost}
    />
  ), [communities, authUser, colors, isAuthenticated, hPad, state.city, handleOpenCreatePost, canPostStoryStatus, handleOpenStoryPost]);

  return (
    <ErrorBoundary>
      <Stack.Screen 
        options={{ 
          title: 'Feed | CulturePass',
          headerShown: false,
        }} 
      />
      <View style={[sc.root, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={feedAmbient.mesh}
          pointerEvents="none"
        />
        {/* ── Header ── */}
        <LiquidGlassPanel
          borderRadius={0}
          bordered={false}
          style={{
            borderBottomWidth: StyleSheet.hairlineWidth * 2,
            borderBottomColor: colors.borderLight,
          }}
          contentStyle={[sc.header, { paddingHorizontal: hPad }]}
        >
          <View style={{ flex: 1 }}>
            {/* Single page heading: “header” + “heading” each map to <h1> on web — never nest both. */}
            <Text style={[sc.title, { color: colors.text }]} accessibilityRole="header">
              Culture Feed
            </Text>
            <View style={sc.locationRow} accessibilityLabel={locationA11yLabel}>
              <Ionicons name="location-outline" size={14} color={CultureTokens.indigo} style={sc.locationIcon} accessible={false} />
              <Text style={[sc.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                {locationLabel}
                {!isLoading && filteredPosts.length > 0
                  ? ` · ${filteredPosts.length} posts`
                  : ''}
              </Text>
            </View>
          </View>
          <View style={sc.headerRight}>
            <HeaderAvatar />
            <Pressable
              style={[sc.headerIconBtn, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}
              onPress={() => router.push('/search')}
              accessibilityRole="button"
              accessibilityLabel="Search"
              accessibilityHint="Search events, communities, and profiles"
              hitSlop={10}
              android_ripple={Platform.OS === 'android' ? { color: CultureTokens.indigo + '22', borderless: true, radius: 24 } : undefined}
            >
              <Ionicons name="search-outline" size={20} color={colors.text} />
            </Pressable>
            <Pressable
              style={[sc.headerIconBtn, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}
              onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); void handleRefresh(); }}
              accessibilityRole="button"
              accessibilityLabel="Refresh feed"
              accessibilityHint="Reload posts for your area"
              hitSlop={10}
              disabled={refreshing}
              android_ripple={Platform.OS === 'android' ? { color: CultureTokens.indigo + '22', borderless: true, radius: 24 } : undefined}
            >
              {refreshing || isFetching
                ? <ActivityIndicator size="small" color={CultureTokens.indigo} accessibilityLabel="Loading" />
                : <Ionicons name="refresh-outline" size={20} color={colors.text} />}
            </Pressable>
          </View>
        </LiquidGlassPanel>

        {/* Sticky filter tabs — outside FlatList */}
        <LiquidGlassPanel
          borderRadius={0}
          bordered={false}
          style={{
            borderBottomWidth: StyleSheet.hairlineWidth * 2,
            borderBottomColor: colors.borderLight,
          }}
          contentStyle={sc.filterBarGlassInner}
        >
          <FeedFilterBar
            active={activeFilter}
            onChange={setActiveFilter}
            eventCount={postCounts.eventCount}
            commCount={postCounts.commCount}
            colors={colors}
            hPad={hPad}
          />
        </LiquidGlassPanel>

        {/* Fetch indicator */}
        {isFetching && !isLoading && (
          <View style={sc.fetchBar}>
            <View style={[sc.fetchProgress, { backgroundColor: CultureTokens.indigo }]} />
          </View>
        )}

        {isLoading ? (
          <ScrollView
            contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: listBottomPad }}
            scrollEnabled={false}
            accessibilityLabel="Loading feed"
          >
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} colors={colors} />)}
          </ScrollView>
        ) : (
          <FlashList
            data={listItems}
            keyExtractor={(item) => (item as ListItem).id}
            numColumns={isDesktop ? 2 : 1}
            renderItem={renderItem}
            getItemType={getItemType}
            ListHeaderComponent={listHeaderComponent}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            {...({ estimatedItemSize: isDesktop ? 420 : 500 } as any)}
            initialNumToRender={6}
            drawDistance={1000}
            removeClippedSubviews={Platform.OS !== 'web'}
            contentContainerStyle={[
              sc.list,
              { paddingHorizontal: isDesktop || isWeb ? hPad : 0, paddingBottom: listBottomPad },
              isDesktop && sc.listDesktop,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[CultureTokens.indigo]}
              />
            }
            ListEmptyComponent={
              <View
                style={[sc.empty, { paddingHorizontal: hPad }]}
                accessibilityRole="none"
                accessible
                accessibilityLabel={
                  activeFilter === 'events'
                    ? 'No events in feed. Browse events to find something near you.'
                    : activeFilter === 'communities'
                      ? 'No community updates. Browse communities to join groups.'
                      : 'Feed is empty. Explore communities or events to get started.'
                }
              >
                <View style={[sc.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <Ionicons name="chatbubbles-outline" size={34} color={colors.textTertiary} accessible={false} />
                </View>
                <Text style={[sc.emptyTitle, { color: colors.text }]}>
                  {activeFilter === 'events'      ? 'No events in your area yet'
                   : activeFilter === 'communities' ? 'No community updates yet'
                   : 'Your feed is quiet'}
                </Text>
                <Text style={[sc.emptySub, { color: colors.textSecondary }]}>
                  {activeFilter === 'events'      ? 'Check back soon or browse all events in your city'
                   : activeFilter === 'communities' ? 'Join communities to see their updates here'
                   : 'Follow communities and explore events — your personalised feed will fill up here'}
                </Text>
                <View style={sc.emptyActions}>
                  <Pressable
                    style={[sc.emptyCta, { backgroundColor: CultureTokens.indigo }]}
                    onPress={() => router.push(activeFilter === 'events' ? '/events' : '/(tabs)/community')}
                    accessibilityRole="button"
                    accessibilityHint="Opens the events or communities browse screen"
                    android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.25)' } : undefined}
                  >
                    <Text style={[sc.emptyCtaText, { color: colors.textOnBrandGradient }]}>
                      {activeFilter === 'events' ? 'Browse events' : 'Browse communities'}
                    </Text>
                  </Pressable>
                  {activeFilter === 'for-you' && (
                    <Pressable
                      style={[sc.emptyCtaSecondary, { borderColor: colors.border }]}
                      onPress={() => router.push('/(tabs)')}
                      accessibilityRole="button"
                      accessibilityLabel="Go to Discovery"
                      accessibilityHint="Opens the discovery home with featured rails"
                    >
                      <Text style={[sc.emptyCtaSecondaryText, { color: colors.text }]}>
                        Explore Discovery
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            }
          />
        )}
      </View>

      <CreatePostModal
        visible={showCreatePost}
        mode={createPostMode}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleNewPost}
        communities={communities}
        colors={colors}
      />
    </ErrorBoundary>
  );
}

const feedAmbient = StyleSheet.create({
  mesh: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },
});

const sc = StyleSheet.create({
  root:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  filterBarGlassInner: { paddingVertical: 0 },
  title:        { fontSize: 22, fontFamily: 'Poppins_700Bold', lineHeight: 28, letterSpacing: -0.4 },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  locationText: { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 17 },
  headerRight:  { flexDirection: 'row', gap: 6, alignItems: 'center' },
  headerIconBtn:{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  locationIcon: { marginRight: 2 },
  fetchBar:     { height: 2, backgroundColor: CultureTokens.indigo + '30' },
  fetchProgress:{ height: 2, width: '60%' },
  list:         { paddingTop: 0 },
  listDesktop:  { maxWidth: 860, width: '100%', alignSelf: 'center' as const },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon:    { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 4 },
  emptyTitle:   { fontSize: 17, fontFamily: 'Poppins_700Bold', lineHeight: 24 },
  emptySub:     { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },
  emptyCta:     { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  emptyCtaText: { fontSize: 14, fontFamily: 'Poppins_700Bold', lineHeight: 18 },
  emptyActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 6, paddingHorizontal: 8 },
  emptyCtaSecondary: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24, borderWidth: 1 },
  emptyCtaSecondaryText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', lineHeight: 18 },
});
