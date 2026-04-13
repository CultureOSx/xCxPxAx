// @ts-nocheck
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { goBackOrReplace } from '@/lib/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSaved } from '@/contexts/SavedContext';
import { useMemo, useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  getCommunityAccent,
  getCommunityActivityMeta,
  getCommunityEventsCount,
  getCommunityHeadline,
  getCommunityLabel,
  getCommunityMemberCount,
  getCommunitySignals,
} from '@/lib/community';
import type { Community, EventData } from '@/shared/schema';
import { AuthGuard } from '@/components/AuthGuard';
import { CultureTokens, shadows, FontFamily } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

const isWeb = Platform.OS === 'web';

type TabKey = 'events' | 'communities' | 'hubs';

const EVENTS_CATALOG_KEY = ['events', 'list', 'saved-catalog'] as const;
const COMMUNITIES_LIST_KEY = ['/api/communities'] as const;

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function eventStartMs(e: EventData): number {
  const d = e.date?.trim();
  if (!d) return NaN;
  const t = (e.time ?? '00:00').trim();
  return Date.parse(`${d}T${t || '00:00'}:00`);
}

function eventImageUri(e: EventData): string | undefined {
  const u = e.heroImageUrl ?? e.imageUrl;
  return u?.trim() || undefined;
}

function eventKindLabel(e: EventData): string {
  const cat = e.category?.trim();
  if (cat) return cat;
  if (e.eventType) return e.eventType.replace(/_/g, ' ');
  const tag = e.cultureTag?.[0] ?? e.cultureTags?.[0];
  if (tag) return tag;
  return 'Event';
}

function formatEventPrice(e: EventData): string {
  if (e.priceLabel?.trim()) return e.priceLabel.trim();
  if (e.isFree) return 'Free';
  if (e.priceCents != null && e.priceCents > 0) {
    return `$${(e.priceCents / 100).toFixed(0)}+`;
  }
  return '';
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { hPad, isDesktop, maxContentWidth } = useLayoutCompat();
  const queryClient = useQueryClient();
  const s = getStyles(colors);

  const topInset = isWeb ? 0 : insets.top;
  const bottomInset = isWeb ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<TabKey>('events');
  const [refreshing, setRefreshing] = useState(false);
  const {
    savedEvents,
    joinedCommunities,
    savedCommunityBookmarks,
    savedHubs,
    toggleSaveEvent,
    toggleJoinCommunity,
    toggleSaveCommunityBookmark,
    toggleSaveHub,
  } = useSaved();

  const savedCount = savedEvents.length;
  const joinedCount = joinedCommunities.length;
  const bookmarkCount = savedCommunityBookmarks.length;
  const communitiesTabTotal = useMemo(
    () => new Set([...joinedCommunities, ...savedCommunityBookmarks]).size,
    [joinedCommunities, savedCommunityBookmarks],
  );

  const eventsQuery = useQuery({
    queryKey: EVENTS_CATALOG_KEY,
    queryFn: async () => {
      const res = await api.events.list({ pageSize: 400, page: 1 });
      return Array.isArray(res.events) ? res.events : [];
    },
    enabled: savedCount > 0,
    staleTime: 60 * 1000,
  });

  const catalogEvents = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const catalogFetched = eventsQuery.isFetched;

  const missingEventIds = useMemo(() => {
    if (savedCount === 0 || !catalogFetched) return [];
    const catIds = new Set(catalogEvents.map((e) => e.id));
    return savedEvents.filter((id) => !catIds.has(id)).slice(0, 40);
  }, [savedCount, catalogFetched, catalogEvents, savedEvents]);

  const eventDetailQueries = useQueries({
    queries: missingEventIds.map((id) => ({
      queryKey: ['events', 'detail', id] as const,
      queryFn: () => api.events.get(id),
      enabled: savedCount > 0 && catalogFetched && missingEventIds.includes(id),
      staleTime: 60_000,
    })),
  });

  const eventDetailsStillLoading =
    missingEventIds.length > 0 &&
    eventDetailQueries.length === missingEventIds.length &&
    eventDetailQueries.every((q) => q.isPending);

  const communitiesQuery = useQuery({
    queryKey: COMMUNITIES_LIST_KEY,
    queryFn: () => api.communities.list(),
    enabled: joinedCount > 0 || bookmarkCount > 0,
    staleTime: 60 * 1000,
  });

  const allCommunities = useMemo(() => communitiesQuery.data ?? [], [communitiesQuery.data]);

  const bookmarkOnlyIds = useMemo(
    () => savedCommunityBookmarks.filter((id) => !joinedCommunities.includes(id)),
    [savedCommunityBookmarks, joinedCommunities],
  );

  const missingCommunityIds = useMemo(() => {
    if (!communitiesQuery.isFetched || bookmarkOnlyIds.length === 0) return [];
    const have = new Set(allCommunities.map((c) => c.id));
    return bookmarkOnlyIds.filter((id) => !have.has(id)).slice(0, 30);
  }, [communitiesQuery.isFetched, bookmarkOnlyIds, allCommunities]);

  const communityDetailQueries = useQueries({
    queries: missingCommunityIds.map((id) => ({
      queryKey: ['communities', 'detail', id] as const,
      queryFn: () => api.communities.get(id),
      enabled:
        (joinedCount > 0 || bookmarkCount > 0) &&
        communitiesQuery.isFetched &&
        missingCommunityIds.includes(id),
      staleTime: 60_000,
    })),
  });

  const communityDetailsStillLoading =
    missingCommunityIds.length > 0 &&
    communityDetailQueries.length === missingCommunityIds.length &&
    communityDetailQueries.every((q) => q.isPending);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const tasks: Promise<unknown>[] = [];
      if (savedCount > 0) {
        tasks.push(queryClient.invalidateQueries({ queryKey: EVENTS_CATALOG_KEY }));
      }
      if (joinedCount > 0 || bookmarkCount > 0) {
        tasks.push(queryClient.invalidateQueries({ queryKey: COMMUNITIES_LIST_KEY }));
      }
      if (savedCount > 0) {
        tasks.push(queryClient.invalidateQueries({ queryKey: ['events', 'detail'] }));
      }
      if (bookmarkCount > 0) {
        tasks.push(queryClient.invalidateQueries({ queryKey: ['communities', 'detail'] }));
      }
      await Promise.all(tasks);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, savedCount, joinedCount, bookmarkCount]);

  const savedEventItems = useMemo(() => {
    if (savedCount === 0) return [];
    const merged = new Map<string, EventData>();
    for (const e of catalogEvents) merged.set(e.id, e);
    for (const q of eventDetailQueries) {
      if (q.data) merged.set(q.data.id, q.data);
    }
    const now = Date.now();
    return savedEvents
      .map((id) => merged.get(id))
      .filter((e): e is EventData => e != null)
      .map((e) => ({ e, ms: eventStartMs(e) }))
      .sort((a, b) => {
        const aUp = !Number.isNaN(a.ms) && a.ms >= now - 12 * 3600000;
        const bUp = !Number.isNaN(b.ms) && b.ms >= now - 12 * 3600000;
        if (aUp !== bUp) return aUp ? -1 : 1;
        const am = Number.isNaN(a.ms) ? Infinity : a.ms;
        const bm = Number.isNaN(b.ms) ? Infinity : b.ms;
        return am - bm;
      })
      .map((x) => x.e);
  }, [catalogEvents, eventDetailQueries, savedEvents, savedCount]);

  const joinedCommunityItems = useMemo(() => {
    if (!allCommunities.length || joinedCount === 0) return [];
    const idSet = new Set(joinedCommunities);
    return allCommunities.filter((c) => idSet.has(c.id));
  }, [allCommunities, joinedCommunities, joinedCount]);

  const bookmarkCommunityItems = useMemo(() => {
    if (bookmarkOnlyIds.length === 0) return [];
    const byId = new Map<string, Community>();
    for (const c of allCommunities) byId.set(c.id, c);
    for (const q of communityDetailQueries) {
      if (q.data) byId.set(q.data.id, q.data);
    }
    return bookmarkOnlyIds.map((id) => byId.get(id)).filter((c): c is Community => c != null);
  }, [bookmarkOnlyIds, allCommunities, communityDetailQueries]);

  const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; count: number }[] = [
    { key: 'events', label: 'Events', icon: 'bookmark', count: savedCount },
    { key: 'communities', label: 'Communities', icon: 'people', count: communitiesTabTotal },
    { key: 'hubs', label: 'Hubs', icon: 'compass-outline', count: savedHubs.length },
  ];

  const loadingEvents =
    activeTab === 'events' && savedCount > 0 && (eventsQuery.isPending || eventDetailsStillLoading);
  const loadingCommunities =
    activeTab === 'communities' &&
    (joinedCount > 0 || bookmarkCount > 0) &&
    (communitiesQuery.isPending || communityDetailsStillLoading);
  const showListSkeleton = loadingEvents || loadingCommunities;

  const eventsError = activeTab === 'events' && savedCount > 0 && eventsQuery.isError;
  const communitiesError =
    activeTab === 'communities' &&
    (joinedCount > 0 || bookmarkCount > 0) &&
    communitiesQuery.isError;

  const cardSurface = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderColor: colors.cardBorder,
      ...(Platform.OS === 'web' ? shadows.small : {}),
    }),
    [colors.surface, colors.cardBorder],
  );

  return (
    <AuthGuard
      icon="bookmark"
      title="My Saved"
      message="Sign in to save events, communities, and culture hub pages you want to revisit."
    >
      <View style={[s.container, { paddingTop: topInset }]}>
        <LinearGradient
          colors={[CultureTokens.indigo + '18', 'transparent']}
          style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}
        />

        <View style={[s.shell, isDesktop && s.desktopShell, { maxWidth: maxContentWidth, paddingHorizontal: hPad }]}>
          <View style={s.header}>
            <Pressable
              onPress={() => goBackOrReplace('/(tabs)')}
              style={({ pressed }) => [
                s.backBtn,
                {
                  borderColor: colors.borderLight,
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              hitSlop={8}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <View style={s.headerTitles}>
              <Text style={[s.headerTitle, { color: colors.text }]}>Saved</Text>
              <Text style={[s.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                Bookmarks, memberships & hub shortcuts
              </Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          <View style={[s.tabRail, isDesktop && s.tabRailDesktop]}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const outlineName = tab.icon.endsWith('-outline')
                ? tab.icon
                : (`${tab.icon}-outline` as keyof typeof Ionicons.glyphMap);
              const resolvedIcon = (
                isActive
                  ? tab.icon
                  : outlineName in Ionicons.glyphMap
                    ? outlineName
                    : tab.icon
              ) as keyof typeof Ionicons.glyphMap;
              return (
                <Pressable
                  key={tab.key}
                  style={[
                    s.tabBtn,
                    isDesktop && s.tabBtnDesktop,
                    {
                      borderColor: isActive ? CultureTokens.indigo : colors.borderLight,
                      backgroundColor: isActive ? colors.primarySoft : colors.backgroundSecondary,
                    },
                  ]}
                  onPress={() => {
                    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab(tab.key);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <Ionicons
                    name={resolvedIcon}
                    size={17}
                    color={isActive ? CultureTokens.indigo : colors.textSecondary}
                  />
                  <Text
                    style={[s.tabLabel, { color: isActive ? CultureTokens.indigo : colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                  {tab.count > 0 ? (
                    <View
                      style={[
                        s.countBadge,
                        { backgroundColor: isActive ? CultureTokens.indigo : colors.primarySoft },
                      ]}
                    >
                      <Text style={[s.countText, { color: isActive ? '#FFFFFF' : colors.text }]}>{tab.count}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CultureTokens.indigo} />
            }
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: bottomInset + 48,
              flexGrow: 1,
            }}
          >
            {eventsError || communitiesError ? (
              <View style={[s.errorCard, cardSurface]}>
                <Ionicons name="cloud-offline-outline" size={28} color={colors.error} />
                <Text style={[TextStyles.callout, { color: colors.text, textAlign: 'center' }]}>
                  Could not refresh this list. Check your connection and try again.
                </Text>
                <Button variant="outline" size="sm" onPress={() => void onRefresh()}>
                  Retry
                </Button>
              </View>
            ) : null}

            {showListSkeleton ? (
              <View style={{ gap: 14 }}>
                {[0, 1, 2].map((k) => (
                  <View key={k} style={[s.eventCard, cardSurface, { padding: 0, overflow: 'hidden' }]}>
                    <Skeleton width={118} height={144} borderRadius={0} />
                    <View style={{ flex: 1, padding: 16, gap: 10 }}>
                      <Skeleton width="50%" height={11} borderRadius={6} />
                      <Skeleton width="88%" height={17} borderRadius={8} />
                      <Skeleton width="62%" height={13} borderRadius={6} />
                      <Skeleton width="48%" height={13} borderRadius={6} />
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {!showListSkeleton && activeTab === 'events' && (
              <>
                {savedCount === 0 ? (
                  <EmptyBlock
                    colors={colors}
                    icon="bookmark-outline"
                    title="No saved events yet"
                    description="Save events from Discover or search — they land here for quick access and sorting by date."
                    ctaLabel="Browse events"
                    onCta={() => router.push('/events')}
                  />
                ) : savedEventItems.length === 0 ? (
                  <EmptyBlock
                    colors={colors}
                    icon="trash-outline"
                    title="Events unavailable"
                    description="Some saved events may have been removed or are no longer listed. Remove stale bookmarks or explore new ones."
                    ctaLabel="Browse events"
                    onCta={() => router.push('/events')}
                  />
                ) : (
                  <>
                    <View style={s.sectionHead}>
                      <View style={[s.sectionAccent, { backgroundColor: CultureTokens.gold }]} />
                      <Text style={[s.sectionTitle, { color: colors.textTertiary }]}>Upcoming first</Text>
                    </View>
                    {savedEventItems.map((event) => {
                      const img = eventImageUri(event);
                      const price = formatEventPrice(event);
                      return (
                        <View key={event.id} style={[s.eventCard, cardSurface]}>
                          <Pressable
                            style={({ pressed }) => [s.eventCardMain, pressed && { opacity: 0.92 }]}
                            onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
                            accessibilityRole="button"
                            accessibilityLabel={event.title}
                          >
                            {img ? (
                              <Image source={{ uri: img }} style={s.eventImage} contentFit="cover" transition={150} />
                            ) : (
                              <View style={[s.eventImage, s.eventImagePlaceholder, { backgroundColor: colors.primarySoft }]}>
                                <Ionicons name="calendar-outline" size={28} color={CultureTokens.indigo} />
                              </View>
                            )}
                            <View style={s.eventInfo}>
                              <View style={[s.kindPill, { backgroundColor: CultureTokens.gold + '18' }]}>
                                <Text style={[s.kindPillText, { color: CultureTokens.indigo }]}>
                                  {eventKindLabel(event)}
                                </Text>
                              </View>
                              <Text style={[s.eventTitle, { color: colors.text }]} numberOfLines={2}>
                                {event.title}
                              </Text>
                              <View style={s.metaGroup}>
                                <View style={s.eventMeta}>
                                  <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                                  <Text style={[s.eventMetaText, { color: colors.textSecondary }]}>
                                    {formatDate(event.date)}
                                  </Text>
                                </View>
                                {event.venue ? (
                                  <View style={s.eventMeta}>
                                    <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                                    <Text style={[s.eventMetaText, { color: colors.textSecondary }]} numberOfLines={1}>
                                      {event.venue}
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                              {price ? (
                                <Text style={[s.eventPrice, { color: CultureTokens.teal }]}>{price}</Text>
                              ) : null}
                            </View>
                          </Pressable>
                          <Pressable
                            hitSlop={12}
                            style={({ pressed }) => [
                              s.bookmarkBtn,
                              { backgroundColor: colors.primarySoft, opacity: pressed ? 0.8 : 1 },
                            ]}
                            onPress={() => {
                              if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              toggleSaveEvent(event.id);
                            }}
                            accessibilityLabel="Remove from saved"
                          >
                            <Ionicons name="bookmark" size={20} color={CultureTokens.indigo} />
                          </Pressable>
                        </View>
                      );
                    })}
                  </>
                )}
              </>
            )}

            {activeTab === 'hubs' && (
              <>
                {savedHubs.length === 0 ? (
                  <EmptyBlock
                    colors={colors}
                    icon="compass-outline"
                    title="No saved hubs"
                    description="On a culture hub page, tap Save hub. We keep state, language, and the link here."
                    ctaLabel="Hub finder"
                    onCta={() => router.push('/finder')}
                  />
                ) : (
                  savedHubs.map((hub) => (
                    <View key={hub.id} style={[s.hubCard, cardSurface]}>
                      <Pressable
                        style={({ pressed }) => [s.hubCardMain, pressed && { opacity: 0.92 }]}
                        onPress={() => {
                          if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push(hub.href as Parameters<typeof router.push>[0]);
                        }}
                        accessibilityRole="link"
                        accessibilityLabel={hub.title}
                      >
                        <View style={[s.hubIconWrap, { backgroundColor: CultureTokens.gold + '22' }]}>
                          <Ionicons name="globe-outline" size={22} color={CultureTokens.indigo} />
                        </View>
                        <View style={s.hubInfo}>
                          <Text style={[s.hubTitle, { color: colors.text }]} numberOfLines={2}>
                            {hub.title}
                          </Text>
                          {hub.subtitle ? (
                            <Text style={[s.hubSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                              {hub.subtitle}
                            </Text>
                          ) : null}
                          <Text style={[s.hubHref, { color: CultureTokens.indigo }]} numberOfLines={1}>
                            {hub.href}
                          </Text>
                        </View>
                      </Pressable>
                      <Pressable
                        hitSlop={12}
                        style={({ pressed }) => [s.hubRemoveBtn, { opacity: pressed ? 0.75 : 1 }]}
                        onPress={() => {
                          if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          toggleSaveHub({
                            href: hub.href,
                            slug: hub.slug,
                            state: hub.state,
                            language: hub.language,
                            title: hub.title,
                            subtitle: hub.subtitle,
                          });
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove saved hub ${hub.title}`}
                      >
                        <Ionicons name="bookmark" size={20} color={CultureTokens.indigo} />
                      </Pressable>
                    </View>
                  ))
                )}
              </>
            )}

            {!showListSkeleton && activeTab === 'communities' && (
              <>
                {communitiesTabTotal === 0 ? (
                  <EmptyBlock
                    colors={colors}
                    icon="people-outline"
                    title="No communities yet"
                    description="Join a community or tap Save on a community card to keep it here for later."
                    ctaLabel="Find communities"
                    onCta={() => router.push('/(tabs)/community')}
                  />
                ) : joinedCount > 0 && joinedCommunityItems.length === 0 && bookmarkCommunityItems.length === 0 ? (
                  <EmptyBlock
                    colors={colors}
                    icon="alert-circle-outline"
                    title="Could not load community cards"
                    description="Your lists are saved, but details did not load. Pull to refresh or try again shortly."
                    ctaLabel="Refresh"
                    onCta={() => void onRefresh()}
                  />
                ) : (
                  <>
                    {joinedCommunityItems.length > 0 ? (
                      <>
                        <View style={s.sectionHead}>
                          <View style={[s.sectionAccent, { backgroundColor: CultureTokens.gold }]} />
                          <Text style={[s.sectionTitle, { color: colors.textTertiary }]}>Your memberships</Text>
                        </View>
                        {joinedCommunityItems.map((community) => {
                          const accent = getCommunityAccent(community, CultureTokens.indigo);
                          return (
                            <View key={community.id} style={[s.communityCard, cardSurface, { borderColor: accent + '30' }]}>
                              <Pressable
                                style={({ pressed }) => [s.communityCardMain, pressed && { opacity: 0.94 }]}
                                onPress={() => {
                                  if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  router.push({ pathname: '/community/[id]', params: { id: community.id } });
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={community.name}
                              >
                                <View
                                  style={[
                                    s.communityAvatar,
                                    { backgroundColor: accent + '18' },
                                  ]}
                                >
                                  {community.iconEmoji ? (
                                    <Text style={s.communityEmoji}>{community.iconEmoji}</Text>
                                  ) : (
                                    <Ionicons name="people" size={26} color={accent} />
                                  )}
                                </View>
                                <View style={s.communityInfo}>
                                  <Text style={[s.communityName, { color: colors.text }]} numberOfLines={1}>
                                    {community.name}
                                  </Text>
                                  <View style={[s.communityTypeBadge, { backgroundColor: accent + '14' }]}>
                                    <Text style={[s.communityType, { color: accent }]}>
                                      {getCommunitySignals(community)[0] ?? getCommunityLabel(community)}
                                    </Text>
                                  </View>
                                  <Text style={[s.communityHeadline, { color: colors.textSecondary }]} numberOfLines={2}>
                                    {getCommunityHeadline(community)}
                                  </Text>
                                  <View style={s.communityStats}>
                                    <Ionicons name="people-outline" size={13} color={colors.textTertiary} />
                                    <Text style={[s.communityStatText, { color: colors.textSecondary }]}>
                                      {getCommunityMemberCount(community)} members
                                    </Text>
                                    {getCommunityEventsCount(community) > 0 ? (
                                      <>
                                        <View style={[s.statDot, { backgroundColor: colors.borderLight }]} />
                                        <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
                                        <Text style={[s.communityStatText, { color: colors.textSecondary }]}>
                                          {getCommunityEventsCount(community)} events
                                        </Text>
                                      </>
                                    ) : null}
                                    <View style={[s.statDot, { backgroundColor: colors.borderLight }]} />
                                    <Text
                                      style={[
                                        s.communityActivity,
                                        { color: getCommunityActivityMeta(community).color },
                                      ]}
                                    >
                                      {getCommunityActivityMeta(community).label}
                                    </Text>
                                  </View>
                                </View>
                              </Pressable>
                              <Pressable
                                hitSlop={8}
                                onPress={() => {
                                  if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                  toggleJoinCommunity(community.id);
                                }}
                                style={({ pressed }) => [
                                  s.leaveBtn,
                                  { borderColor: colors.borderLight, opacity: pressed ? 0.75 : 1 },
                                ]}
                                accessibilityLabel={`Leave ${community.name}`}
                              >
                                <Ionicons name="exit-outline" size={18} color={colors.textSecondary} />
                              </Pressable>
                            </View>
                          );
                        })}
                      </>
                    ) : null}

                    {bookmarkCommunityItems.length > 0 ? (
                      <>
                        <View style={[s.sectionHead, joinedCommunityItems.length > 0 && { marginTop: 20 }]}>
                          <View style={[s.sectionAccent, { backgroundColor: CultureTokens.teal }]} />
                          <Text style={[s.sectionTitle, { color: colors.textTertiary }]}>Saved for later</Text>
                        </View>
                        {bookmarkCommunityItems.map((community) => {
                          const accent = getCommunityAccent(community, CultureTokens.indigo);
                          return (
                            <View key={`bm-${community.id}`} style={[s.communityCard, cardSurface, { borderColor: accent + '30' }]}>
                              <Pressable
                                style={({ pressed }) => [s.communityCardMain, pressed && { opacity: 0.94 }]}
                                onPress={() => {
                                  if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  router.push({ pathname: '/community/[id]', params: { id: community.id } });
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={community.name}
                              >
                                <View style={[s.communityAvatar, { backgroundColor: accent + '18' }]}>
                                  {community.iconEmoji ? (
                                    <Text style={s.communityEmoji}>{community.iconEmoji}</Text>
                                  ) : (
                                    <Ionicons name="people" size={26} color={accent} />
                                  )}
                                </View>
                                <View style={s.communityInfo}>
                                  <Text style={[s.communityName, { color: colors.text }]} numberOfLines={1}>
                                    {community.name}
                                  </Text>
                                  <View style={[s.communityTypeBadge, { backgroundColor: accent + '14' }]}>
                                    <Text style={[s.communityType, { color: accent }]}>
                                      {getCommunitySignals(community)[0] ?? getCommunityLabel(community)}
                                    </Text>
                                  </View>
                                  <Text style={[s.communityHeadline, { color: colors.textSecondary }]} numberOfLines={2}>
                                    {getCommunityHeadline(community)}
                                  </Text>
                                </View>
                              </Pressable>
                              <Pressable
                                hitSlop={8}
                                onPress={() => {
                                  if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                  toggleSaveCommunityBookmark(community.id);
                                }}
                                style={({ pressed }) => [
                                  s.leaveBtn,
                                  { borderColor: colors.borderLight, opacity: pressed ? 0.75 : 1 },
                                ]}
                                accessibilityLabel={`Remove saved community ${community.name}`}
                              >
                                <Ionicons name="bookmark" size={18} color={CultureTokens.indigo} />
                              </Pressable>
                            </View>
                          );
                        })}
                      </>
                    ) : bookmarkOnlyIds.length > 0 ? (
                      <EmptyBlock
                        colors={colors}
                        icon="alert-circle-outline"
                        title="Saved communities unavailable"
                        description="Some bookmarks could not be loaded. Pull to refresh."
                        ctaLabel="Refresh"
                        onCta={() => void onRefresh()}
                      />
                    ) : null}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </AuthGuard>
  );
}

/** useLayout + sensible max width for saved lists on large desktop */
function useLayoutCompat() {
  const { hPad, isDesktop, width, sidebarWidth } = useLayout();
  const maxContentWidth = isDesktop ? Math.min(720, width - sidebarWidth - hPad * 2) : undefined;
  return { hPad, isDesktop, maxContentWidth };
}

function EmptyBlock({
  colors,
  icon,
  title,
  description,
  ctaLabel,
  onCta,
}: {
  colors: ReturnType<typeof useColors>;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <View style={stylesEmpty.wrap}>
      <View style={[stylesEmpty.iconRing, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={40} color={CultureTokens.indigo} />
      </View>
      <Text style={[TextStyles.title3, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
      <Text style={[TextStyles.callout, { color: colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300 }]}>
        {description}
      </Text>
      <Button variant="primary" onPress={onCta} style={{ marginTop: 20, minWidth: 200 }}>
        {ctaLabel}
      </Button>
    </View>
  );
}

const stylesEmpty = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 48, paddingBottom: 24, gap: 10, paddingHorizontal: 16 },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});

const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    shell: { flex: 1, width: '100%', alignSelf: 'center' },
    desktopShell: {},

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      gap: 8,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    headerTitles: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontFamily: FontFamily.bold },
    headerSubtitle: { fontSize: 12, fontFamily: FontFamily.medium, marginTop: 2 },

    tabRail: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
      justifyContent: 'center',
    },
    tabRailDesktop: {
      justifyContent: 'space-between',
    },
    tabBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
    },
    tabBtnDesktop: { flex: 1 },
    tabLabel: { fontSize: 13, fontFamily: FontFamily.semibold },
    countBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, minWidth: 22, alignItems: 'center' },
    countText: { fontSize: 11, fontFamily: FontFamily.bold },

    errorCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 20,
      gap: 12,
      alignItems: 'center',
      marginBottom: 16,
    },

    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 },
    sectionAccent: { width: 3, height: 14, borderRadius: 2 },
    sectionTitle: { fontSize: 11, fontFamily: FontFamily.semibold, letterSpacing: 0.4, textTransform: 'uppercase' },

    eventCard: {
      flexDirection: 'row',
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 14,
      borderWidth: 1,
      position: 'relative',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    eventCardMain: { flexDirection: 'row', flex: 1 },
    eventImage: { width: 118, minHeight: 144 },
    eventImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
    eventInfo: { flex: 1, padding: 14, gap: 6, justifyContent: 'center', paddingRight: 48 },
    kindPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    kindPillText: { fontSize: 10, fontFamily: FontFamily.semibold, letterSpacing: 0.3, textTransform: 'uppercase' },
    eventTitle: { fontSize: 17, fontFamily: FontFamily.bold, lineHeight: 22 },

    metaGroup: { gap: 5, marginTop: 2 },
    eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    eventMetaText: { fontSize: 13, fontFamily: FontFamily.regular, flexShrink: 1 },

    eventPrice: { fontSize: 15, fontFamily: FontFamily.bold, marginTop: 4 },
    bookmarkBtn: {
      position: 'absolute',
      right: 10,
      bottom: 10,
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },

    communityCard: {
      borderRadius: 18,
      marginBottom: 12,
      borderWidth: 1,
      position: 'relative',
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    communityCardMain: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingRight: 12, gap: 12, flex: 1 },
    communityAvatar: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    communityEmoji: { fontSize: 26 },
    communityInfo: { flex: 1, gap: 4, justifyContent: 'center', minWidth: 0 },
    communityName: { fontSize: 17, fontFamily: FontFamily.bold },
    communityHeadline: { fontSize: 13, fontFamily: FontFamily.medium, lineHeight: 18 },
    communityTypeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    communityType: { fontSize: 10, fontFamily: FontFamily.semibold, letterSpacing: 0.4, textTransform: 'uppercase' },
    communityStats: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    communityStatText: { fontSize: 12, fontFamily: FontFamily.medium },
    communityActivity: { fontSize: 11, fontFamily: FontFamily.bold },
    statDot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 2 },

    leaveBtn: {
      width: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderLeftWidth: StyleSheet.hairlineWidth,
      backgroundColor: colors.backgroundSecondary,
    },

    hubCard: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 1,
      overflow: 'hidden',
    },
    hubCardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, minWidth: 0 },
    hubIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    hubInfo: { flex: 1, gap: 4, minWidth: 0 },
    hubTitle: { fontSize: 16, fontFamily: FontFamily.bold, lineHeight: 22 },
    hubSubtitle: { fontSize: 13, fontFamily: FontFamily.medium },
    hubHref: { fontSize: 12, fontFamily: FontFamily.regular },
    hubRemoveBtn: {
      width: 52,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
  });
