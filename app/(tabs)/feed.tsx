/**
 * Culture Feed — full-width layout on native + web, shared chrome with other tabs.
 * Compose: TabPrimaryHeader → FeedFilterRail → FlashList (composer + posts).
 */
import React, {
  useMemo, useCallback,
} from 'react';
import {
  View, Pressable, StyleSheet, Platform, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useTabScrollBottomPadding } from '@/hooks/useTabScrollBottomPadding';
import { CultureTokens } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TabPrimaryHeader } from '@/components/tabs/TabPrimaryHeader';
import {
  FeedFilterBar,
  FeedListHeader,
  PostCard,
  TrendingInterstitial,
  CreatePostModal,
  useAuthGate,
} from '@/components/feed/FeedComponents';
import { FeedFilterRail } from '@/components/feed/FeedFilterRail';
import { FeedLoadingState } from '@/components/feed/FeedLoadingState';
import { FeedEmptyState } from '@/components/feed/FeedEmptyState';
import { FEED_FLASH_ESTIMATED_ITEM, FEED_ANDROID_REFRESH_EXTRA } from '@/components/feed/feedScreen.constants';
import type { ListItem } from '@/components/feed/types';
import { useFeedScreen } from '@/components/feed/useFeedScreen';

const IS_WEB = Platform.OS === 'web';

export default function CultureFeedScreen() {
  const insets = useSafeAreaInsets();
  const topInset = IS_WEB ? 0 : insets.top;
  const colors = useColors();
  const { isDesktop, hPad, tabBarHeight } = useLayout();
  const gate = useAuthGate();
  const listBottomPad = useTabScrollBottomPadding(12);

  const {
    activeFilter,
    setActiveFilter,
    refreshing,
    showCreatePost,
    createPostMode,
    communities,
    authUser,
    isAuthenticated,
    canPostStoryStatus,
    isLoading,
    isFetching,
    listItems,
    postCounts,
    locationLabel,
    city,
    openComposer,
    closeComposer,
    handleRefresh,
    handleNewPost,
  } = useFeedScreen({ isDesktop });

  const renderItem = useCallback(
    ({ item, index }: { item: ListItem; index: number }) => {
      if (item.kind === '_trending') {
        return <TrendingInterstitial city={item.city} colors={colors} />;
      }
      return (
        <ErrorBoundary>
          <PostCard post={item} colorIdx={index} />
        </ErrorBoundary>
      );
    },
    [colors],
  );

  const getItemType = useCallback((item: ListItem) => (item.kind === '_trending' ? 'trending' : item.kind), []);

  const listHeader = useMemo(
    () => (
      <FeedListHeader
        communities={communities}
        authUser={authUser ?? null}
        colors={colors}
        isAuthenticated={isAuthenticated}
        hPad={hPad}
        city={city}
        onCreatePost={() => gate(() => openComposer('standard'))}
        canPostStoryStatus={canPostStoryStatus}
        onCreateStoryPost={() => gate(() => openComposer('story'))}
      />
    ),
    [
      communities,
      authUser,
      colors,
      isAuthenticated,
      hPad,
      city,
      canPostStoryStatus,
      gate,
      openComposer,
    ],
  );

  const numColumns = isDesktop ? 2 : 1;
  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      {
        paddingHorizontal: hPad,
        paddingBottom: listBottomPad,
      },
      IS_WEB && isDesktop ? styles.listMaxWidth : null,
    ],
    [hPad, listBottomPad, isDesktop],
  );

  const androidRefreshOffset = insets.top + FEED_ANDROID_REFRESH_EXTRA;

  const emptyList = useMemo(
    () => <FeedEmptyState activeFilter={activeFilter} hPad={hPad} />,
    [activeFilter, hPad],
  );

  return (
    <ErrorBoundary>
      <Stack.Screen
        options={{
          title: 'Feed | CulturePass',
          headerShown: false,
        }}
      />
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <TabPrimaryHeader
          title="Feed"
          subtitle={locationLabel}
          locationLabel=""
          hPad={hPad}
          topInset={topInset}
        />

        <FeedFilterRail>
          <FeedFilterBar
            active={activeFilter}
            onChange={setActiveFilter}
            eventCount={postCounts.eventCount}
            commCount={postCounts.commCount}
            colors={colors}
            hPad={hPad}
          />
        </FeedFilterRail>

        {isFetching && !isLoading ? (
          <View style={styles.syncLineTrack}>
            <View style={[styles.syncLine, { backgroundColor: CultureTokens.indigo }]} />
          </View>
        ) : null}

        {isLoading ? (
          <FeedLoadingState listBottomPad={listBottomPad} hPad={hPad} />
        ) : (
          <FlashList
            data={listItems}
            keyExtractor={(item) => (item as ListItem).id}
            numColumns={numColumns}
            renderItem={renderItem}
            getItemType={getItemType}
            {...({ estimatedItemSize: FEED_FLASH_ESTIMATED_ITEM } as object)}
            ListHeaderComponent={listHeader}
            ItemSeparatorComponent={() => <View style={{ height: numColumns > 1 ? 20 : 16 }} />}
            contentContainerStyle={listContentStyle}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void handleRefresh()}
                tintColor={colors.primary}
                colors={[CultureTokens.indigo]}
                progressViewOffset={Platform.OS === 'android' ? androidRefreshOffset : undefined}
              />
            }
            ListEmptyComponent={emptyList}
          />
        )}

        {/* Floating post action — clean + consistent across iOS/Android/web */}
        <Pressable
          onPress={() => {
            if (!IS_WEB) Haptics.selectionAsync().catch(() => {});
            gate(() => openComposer('standard'));
          }}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: CultureTokens.indigo,
              right: hPad,
              bottom: (IS_WEB ? 16 : Math.max(insets.bottom, 10) + tabBarHeight + 12),
              opacity: Platform.OS === 'ios' && pressed ? 0.92 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Create post"
          accessibilityHint="Opens the post composer"
          android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.22)', borderless: false } : undefined}
        >
          <Ionicons name="add" size={20} color={colors.textOnBrandGradient} />
        </Pressable>
      </View>

      <CreatePostModal
        visible={showCreatePost}
        mode={createPostMode}
        onClose={closeComposer}
        onSubmit={handleNewPost}
        communities={communities}
        colors={colors}
      />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  syncLineTrack: {
    height: 2,
    backgroundColor: CultureTokens.indigo + '30',
  },
  syncLine: {
    height: 2,
    width: '60%',
  },
  listContent: {
    paddingTop: 4,
  },
  listMaxWidth: {
    maxWidth: 880,
    width: '100%',
    alignSelf: 'center',
  },
});
