import { View, Text, Pressable, StyleSheet, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { goBackOrReplace } from '@/lib/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSaved } from '@/contexts/SavedContext';
import { useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
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
import { CultureTokens } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { BlurView } from 'expo-blur';

const isWeb = Platform.OS === 'web';

type TabKey = 'events' | 'communities';

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colors = useColors();
  const s = getStyles(colors);

  const topInset = isWeb ? 0 : insets.top;
  const bottomInset = isWeb ? 34 : insets.bottom;
  const isDesktop = width >= 1024;

  const [activeTab, setActiveTab] = useState<TabKey>('events');
  const { savedEvents, joinedCommunities, toggleSaveEvent, toggleJoinCommunity } = useSaved();

  const { data: allEvents = [], isLoading: eventsLoading } = useQuery<EventData[]>({
    queryKey: ['events', 'list', 'saved'],
    queryFn: async () => {
      const data = await api.events.list();
      return Array.isArray(data.events) ? data.events : [];
    },
  });

  const { data: allCommunities = [], isLoading: commLoading } = useQuery<Community[]>({
    queryKey: ['/api/communities'],
    queryFn: () => api.communities.list(),
  });

  const isLoading = eventsLoading || commLoading;

  const savedEventItems = useMemo(
    () => allEvents.filter((e) => savedEvents.includes(e.id)),
    [savedEvents, allEvents],
  );

  const joinedCommunityItems = useMemo(
    () => allCommunities.filter((c) => joinedCommunities.includes(c.id)),
    [joinedCommunities, allCommunities],
  );

  const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; count: number }[] = [
    { key: 'events',      label: 'Saved Events',  icon: 'bookmark', count: savedEventItems.length },
    { key: 'communities', label: 'Communities',   icon: 'people',   count: joinedCommunityItems.length },
  ];

  return (
    <AuthGuard icon="bookmark" title="My Saved" message="Sign in to save events and communities you love.">
      <View style={[s.container, { paddingTop: topInset }]}>
        <LinearGradient
          colors={[CultureTokens.indigo + '26', 'transparent']}
          style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}
        />
        <View style={[s.shell, isDesktop && s.desktopShell]}>
          <View style={s.header}>
            <Pressable 
              onPress={() => goBackOrReplace('/(tabs)')} 
              style={({ pressed }) => [s.backBtn, { transform: [{ scale: pressed ? 0.95 : 1 }], backgroundColor: colors.surface + '80' }]} 
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
              {!isWeb && <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />}
            </Pressable>
            <Text style={s.headerTitle}>Saved</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={s.tabRow}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={({ pressed }) => [
                    s.tab, 
                    isActive ? { backgroundColor: CultureTokens.indigo + '15', borderColor: CultureTokens.indigo + '40' } : { backgroundColor: colors.surface, borderColor: colors.borderLight },
                    pressed && !isActive && { opacity: 0.8 }
                  ]}
                  onPress={() => {
                    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab(tab.key);
                  }}
                >
                  <Ionicons name={isActive ? tab.icon : tab.icon + '-outline' as any} size={18} color={isActive ? CultureTokens.indigo : colors.textSecondary} />
                  <Text style={[s.tabText, isActive ? { color: CultureTokens.indigo } : { color: colors.textSecondary }]}>{tab.label}</Text>
                  {tab.count > 0 && (
                    <View style={[
                      s.countBadge, 
                      isActive ? { backgroundColor: CultureTokens.indigo } : { backgroundColor: colors.backgroundSecondary }
                    ]}>
                      <Text style={[s.countText, { color: '#FFFFFF' }]}>{tab.count}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: bottomInset + 40 }}
          >
            {isLoading ? (
              <View style={{ gap: 14 }}>
                {[0, 1, 2].map((k) => (
                  <View key={k} style={[s.eventCard, { padding: 0, overflow: 'hidden' }]}>
                    <Skeleton width={120} height={140} borderRadius={0} />
                    <View style={{ flex: 1, padding: 16, gap: 10 }}>
                      <Skeleton width="55%" height={12} borderRadius={6} />
                      <Skeleton width="85%" height={18} borderRadius={8} />
                      <Skeleton width="65%" height={13} borderRadius={6} />
                      <Skeleton width="50%" height={13} borderRadius={6} />
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
            {!isLoading && activeTab === 'events' && (
              <>
                {savedEventItems.length === 0 ? (
                  <View style={s.emptyState}>
                    <View style={[s.emptyIconWrap, { backgroundColor: CultureTokens.indigo + '10' }]}>
                      <Ionicons name="bookmark" size={48} color={CultureTokens.indigo} />
                    </View>
                    <Text style={s.emptyTitle}>Your saved events will appear here</Text>
                    <Text style={s.emptyDesc}>Discover and save events from across the world to build your cultural calendar.</Text>
                    <Button 
                      variant="primary"
                      onPress={() => router.push('/(tabs)')}
                      style={{ marginTop: 24, paddingHorizontal: 40 }}
                    >
                      Explore Events
                    </Button>
                  </View>
                ) : (
                  savedEventItems.map((event: EventData) => (
                    <View key={event.id}>
                      <View style={s.eventCard}>
                        <Pressable
                          style={({ pressed }) => [s.eventCardMain, pressed && { transform: [{ scale: 0.98 }] }]}
                          onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
                        >
                          <Image source={{ uri: event.imageUrl }} style={s.eventImage} contentFit="cover" transition={150} />
                          <View style={s.eventInfo}>
                            <View style={s.eventCommunityRow}>
                              <Text style={s.eventCommunity}>{event.communityId}</Text>
                            </View>
                            <Text style={s.eventTitle} numberOfLines={2}>{event.title}</Text>
                            
                            <View style={s.metaGroup}>
                              <View style={s.eventMeta}>
                                <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                                <Text style={s.eventMetaText}>{formatDate(event.date)}</Text>
                              </View>
                              <View style={s.eventMeta}>
                                <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                                <Text style={s.eventMetaText} numberOfLines={1}>{event.venue}</Text>
                              </View>
                            </View>

                            <View style={s.eventBottom}>
                              <Text style={s.eventPrice}>{event.priceLabel}</Text>
                            </View>
                          </View>
                        </Pressable>
                        <Pressable
                          hitSlop={12}
                          style={({pressed}) => [s.bookmarkBtnFloating, { backgroundColor: CultureTokens.indigo + '15' }, pressed && { opacity: 0.8 }]}
                          onPress={() => {
                            if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            toggleSaveEvent(event.id);
                          }}
                        >
                          <Ionicons name="bookmark" size={20} color={CultureTokens.indigo} />
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {!isLoading && activeTab === 'communities' && (
              <>
                {joinedCommunityItems.length === 0 ? (
                  <View style={s.emptyState}>
                    <View style={[s.emptyIconWrap, { backgroundColor: CultureTokens.indigo + '10' }]}>
                      <Ionicons name="people" size={48} color={CultureTokens.indigo} />
                    </View>
                    <Text style={s.emptyTitle}>Join a community</Text>
                    <Text style={s.emptyDesc}>Join cultural communities to stay connected with events and news from your diaspora.</Text>
                    <Button 
                      variant="primary"
                      onPress={() => router.push('/(tabs)/community')}
                      style={{ marginTop: 24, paddingHorizontal: 40 }}
                    >
                      Find Communities
                    </Button>
                  </View>
                ) : (
                  joinedCommunityItems.map((community: Community) => (
                    <View key={community.id}>
                      <View
                        style={[
                          s.communityCard,
                          {
                            borderColor:
                              getCommunityAccent(community, CultureTokens.indigo) + '22',
                          },
                        ]}
                      >
                        <Pressable
                          style={({ pressed }) => [s.communityCardMain, pressed && { transform: [{ scale: 0.98 }] }]}
                          onPress={() => {
                            if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push({ pathname: '/community/[id]', params: { id: community.id } });
                          }}
                        >
                          <View
                            style={[
                              s.communityAvatar,
                              {
                                backgroundColor:
                                  getCommunityAccent(community, CultureTokens.indigo) + '15',
                              },
                            ]}
                          >
                            {community.iconEmoji ? (
                              <Text style={s.communityEmoji}>{community.iconEmoji}</Text>
                            ) : (
                              <Ionicons
                                name="people"
                                size={28}
                                color={getCommunityAccent(community, CultureTokens.indigo)}
                              />
                            )}
                          </View>
                          
                          <View style={s.communityInfo}>
                            <Text style={s.communityName} numberOfLines={1}>{community.name}</Text>
                            <View
                              style={[
                                s.communityTypeBadge,
                                {
                                  backgroundColor:
                                    getCommunityAccent(community, CultureTokens.indigo) + '12',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  s.communityType,
                                  { color: getCommunityAccent(community, CultureTokens.indigo) },
                                ]}
                              >
                                {getCommunitySignals(community)[0] ?? getCommunityLabel(community)}
                              </Text>
                            </View>
                            <Text style={s.communityHeadline} numberOfLines={2}>
                              {getCommunityHeadline(community)}
                            </Text>
                            
                            <View style={s.communityStats}>
                              <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                              <Text style={s.communityStatText}>
                                {getCommunityMemberCount(community)} members
                              </Text>
                              {getCommunityEventsCount(community) > 0 && (
                                <>
                                  <View style={s.statDot} />
                                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                                  <Text style={s.communityStatText}>
                                    {getCommunityEventsCount(community)} events
                                  </Text>
                                </>
                              )}
                              <View style={s.statDot} />
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
                            if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            toggleJoinCommunity(community.id);
                          }}
                          style={({pressed}) => [s.leaveBtnFloating, pressed && { opacity: 0.7 }]}
                        >
                          <Ionicons name="checkmark" size={16} color={colors.text} />
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </AuthGuard>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  shell: { flex: 1 },
  desktopShell: { maxWidth: 800, width: '100%', alignSelf: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, zIndex: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  headerTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },
  
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 4, marginBottom: 8, zIndex: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  tabText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 11, fontFamily: 'Poppins_700Bold' },
  
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 8, backgroundColor: colors.backgroundSecondary },
  emptyTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
  emptyDesc: { fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, maxWidth: 280, color: colors.textSecondary },
  emptyBtn: { marginTop: 20, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
  emptyBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF' },
  
  eventCard: { flexDirection: 'row', borderRadius: 20, overflow: 'hidden', marginBottom: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight },
  eventCardMain: { flexDirection: 'row' },
  eventImage: { width: 120, minHeight: 140 },
  eventInfo: { flex: 1, padding: 16, gap: 6, justifyContent: 'center' },
  eventCommunityRow: { flexDirection: 'row' },
  eventCommunity: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5, color: CultureTokens.saffron, backgroundColor: CultureTokens.saffron + '15' },
  eventTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', lineHeight: 24, color: colors.text },
  
  metaGroup: { gap: 6, marginVertical: 6 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventMetaText: { fontSize: 13, fontFamily: 'Poppins_400Regular', flexShrink: 1, color: colors.textSecondary },
  
  eventBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  eventPrice: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: CultureTokens.teal },
  bookmarkBtnFloating: { position: 'absolute', right: 12, bottom: 12, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: CultureTokens.indigo + '20' },
  
  communityCard: { borderRadius: 20, marginBottom: 12, borderWidth: 1, backgroundColor: colors.surface, borderColor: colors.borderLight, position: 'relative', overflow: 'hidden' },
  communityCardMain: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingRight: 68, gap: 14 },
  communityAvatar: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: CultureTokens.indigo + '15' },
  communityEmoji: { fontSize: 28 },
  communityInfo: { flex: 1, gap: 4, justifyContent: 'center' },
  communityName: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text },
  communityHeadline: { fontSize: 13, fontFamily: 'Poppins_500Medium', lineHeight: 18, color: colors.textSecondary },
  
  communityTypeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.backgroundSecondary },
  communityType: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSecondary },
  
  communityStats: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  communityStatText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  communityActivity: { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  statDot: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 2, backgroundColor: colors.textSecondary },
  
  leaveBtnFloating: { position: 'absolute', right: 14, top: '50%', marginTop: -20, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.borderLight },
});
