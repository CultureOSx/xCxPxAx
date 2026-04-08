import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform,
  ActivityIndicator, useWindowDimensions, Linking, Alert, Share,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Head from 'expo-router/head';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { goBackOrReplace } from '@/lib/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSaved } from '@/contexts/SavedContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { routeWithRedirect } from '@/lib/routes';
import { getQueryFn } from '@/lib/query-client';
import { api } from '@/lib/api';
import { FlashList } from '@shopify/flash-list';
import {
  getCommunityActivityMeta,
  getCommunityCadenceLabel,
  getCommunityDiscoveryReasons,
  getCommunityEventsCount,
  getCommunityHeadline,
  getCommunityJoinLabel,
  getCommunityLabel,
  getCommunityLocationLabel,
  getCommunityMemberCount,
  getCommunitySignals,
  getCommunityTrustSignals,
} from '@/lib/community';
import type { Community, EventData } from '@/shared/schema';
import { confirmAndReport } from '@/lib/reporting';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens, CardTokens , TextStyles } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { formatEventDateTime } from '@/lib/dateUtils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useImageUpload } from '@/hooks/useImageUpload';
import * as ImagePicker from 'expo-image-picker';
import { BackButton } from '@/components/ui/BackButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Skeleton } from '@/components/ui/Skeleton';

const isWeb = Platform.OS === 'web';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}


function toCalendarDate(date: string, time?: string): Date | null {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return null;
  const dt = new Date(year, month - 1, day, 18, 0, 0, 0);
  const match = (time ?? '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    dt.setHours(hour, minute, 0, 0);
  }
  return dt;
}

function toGoogleCalendarTimestamp(value: Date): string {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function getInitials(name: string): string {
  return (name || 'C').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Color maps ───────────────────────────────────────────────────────────────

const COMMUNITY_TYPE_COLORS: Record<string, string> = {
  diaspora:   CultureTokens.indigo,
  indigenous: CultureTokens.gold,
  language:   CultureTokens.teal,
  religion:   CultureTokens.coral,
};

const COMMUNITY_TYPE_ICONS: Record<string, string> = {
  diaspora:   'earth',
  indigenous: 'leaf',
  language:   'chatbubbles',
  religion:   'heart',
};

const CATEGORY_COLORS: Record<string, string> = {
  cultural:     CultureTokens.indigo,
  business:     CultureTokens.gold,
  council:      CultureTokens.teal,
  charity:      CultureTokens.coral,
  club:         CultureTokens.community,
  professional: CultureTokens.gold,
};

const AVATAR_COLORS = [
  CultureTokens.indigo, CultureTokens.teal, CultureTokens.coral,
  CultureTokens.gold, CultureTokens.gold, '#7C3AED', '#059669',
];

// ─── Feed synthesis ───────────────────────────────────────────────────────────

const ANNOUNCEMENTS = [
  'Join us this weekend for our annual cultural festival!',
  'New community guidelines have been updated — please review.',
  'Welcome to all new members who joined this week!',
  'Our community just hit a big milestone. Thank you all!',
  'Volunteering spots available for our upcoming event.',
  'Photos from last weekend are now available in our gallery.',
  'Our next community catch-up is coming up. RSVP now!',
  'Thank you to all our sponsors and supporters.',
  'New resources added to our community hub.',
  'Save the date — annual gala is coming up!',
];

type FeedPost =
  | { id: string; kind: 'event';        event: EventData;   community: Community; createdAt: string }
  | { id: string; kind: 'announcement'; community: Community; body: string;       createdAt: string }
  | { id: string; kind: 'welcome';      community: Community;                     createdAt: string }
  | { id: string; kind: 'milestone';    community: Community; members: number;    createdAt: string };

function synthesizePosts(community: Community, events: EventData[]): FeedPost[] {
  const now = Date.now();
  const result: FeedPost[] = [];

  events.forEach((ev, i) => {
    result.push({
      id: `ev-${ev.id}-${i}`,
      kind: 'event',
      event: ev,
      community,
      createdAt: new Date(now - i * 3_600_000).toISOString(),
    });
    if (i % 2 === 1) {
      result.push({
        id: `ann-${community.id}-${i}`,
        kind: 'announcement',
        community,
        body: ANNOUNCEMENTS[i % ANNOUNCEMENTS.length],
        createdAt: new Date(now - i * 5_400_000).toISOString(),
      });
    }
  });

  // If no events, emit some announcement + welcome posts
  if (events.length === 0) {
    ANNOUNCEMENTS.slice(0, 4).forEach((body, i) => {
      result.push({
        id: `ann-empty-${i}`,
        kind: 'announcement',
        community,
        body,
        createdAt: new Date(now - i * 7_200_000).toISOString(),
      });
    });
    const count = community.memberCount ?? community.membersCount ?? 0;
    if (count > 100) {
      result.push({
        id: `ms-${community.id}`,
        kind: 'milestone',
        community,
        members: count,
        createdAt: new Date(now - 86_400_000).toISOString(),
      });
    } else {
      result.push({
        id: `wc-${community.id}`,
        kind: 'welcome',
        community,
        createdAt: new Date(now - 86_400_000).toISOString(),
      });
    }
  }

  return result;
}

// ─── Auto-link builder ────────────────────────────────────────────────────────

function buildLinks(community: Community): { title: string; url: string; icon: string }[] {
  const links = [...(community.links ?? [])];
  if (community.website && !links.find(l => l.url === community.website))
    links.push({ title: 'Website', url: community.website, icon: 'globe-outline' });
  if (community.trustSignals?.codeOfConductUrl && !links.find(l => l.url === community.trustSignals?.codeOfConductUrl))
    links.push({ title: 'Code of Conduct', url: community.trustSignals.codeOfConductUrl, icon: 'shield-checkmark-outline' });
  if (community.socialLinks?.instagram && !links.find(l => l.url?.includes('instagram')))
    links.push({ title: 'Instagram', url: community.socialLinks.instagram, icon: 'logo-instagram' });
  if (community.socialLinks?.facebook && !links.find(l => l.url?.includes('facebook')))
    links.push({ title: 'Facebook', url: community.socialLinks.facebook, icon: 'logo-facebook' });
  if (community.socialLinks?.website && !links.find(l => l.url === community.socialLinks?.website))
    links.push({ title: 'Website', url: community.socialLinks.website, icon: 'globe-outline' });
  return links;
}

// ─── Reactions bar (same as culturefeed) ─────────────────────────────────────

const LIKES_STORAGE_KEY = '@community_detail:likes';

async function loadLikedPosts(): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(LIKES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

async function saveLikedPosts(liked: Record<string, boolean>): Promise<void> {
  try {
    await AsyncStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(liked));
  } catch {
    // ignore storage errors
  }
}

function ReactionsBar({
  postId,
  communityId,
  communityName,
  initialLikes,
  colors,
}: {
  postId: string;
  communityId: string;
  communityName: string;
  initialLikes: number;
  colors: ReturnType<typeof useColors>;
}) {
  const [liked,    setLiked]   = useState(false);
  const [likes,    setLikes]   = useState(initialLikes);
  const [comments]             = useState(() => Math.floor(Math.random() * 18));
  const [shared,   setShared]  = useState(false);

  useEffect(() => {
    loadLikedPosts().then(stored => {
      if (stored[postId]) setLiked(true);
    });
  }, [postId]);

  const handleLike = useCallback(() => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes(v => nextLiked ? v + 1 : Math.max(0, v - 1));
    loadLikedPosts().then(stored => {
      const updated = { ...stored, [postId]: nextLiked };
      if (!nextLiked) delete updated[postId];
      saveLikedPosts(updated);
    });
  }, [liked, postId]);

  return (
    <View style={[rb.wrap, { borderTopColor: colors.borderLight }]}>
      <Pressable style={rb.action} onPress={handleLike} accessibilityRole="button" accessibilityLabel="Like">
        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? CultureTokens.coral : colors.textSecondary} />
        <Text style={[rb.actionText, { color: liked ? CultureTokens.coral : colors.textSecondary }]}>{likes}</Text>
      </Pressable>
      <Pressable style={rb.action} accessibilityRole="button" accessibilityLabel="Comment">
        <Ionicons name="chatbubble-outline" size={17} color={colors.textSecondary} />
        <Text style={[rb.actionText, { color: colors.textSecondary }]}>{comments}</Text>
      </Pressable>
      <Pressable
        style={rb.action}
        onPress={async () => {
          if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          const url = `https://culturepass.app/community/${communityId}`;
          try {
            if (Platform.OS === 'web' && navigator.share) {
              await navigator.share({ title: `${communityName} on CulturePass`, url });
            } else {
              await Share.share({ title: `${communityName} on CulturePass`, message: `Join the ${communityName} community on CulturePass!\n\n${url}`, url });
            }
            setShared(true);
          } catch { /* user cancelled */ }
        }}
        accessibilityRole="button"
        accessibilityLabel="Share"
      >
        <Ionicons name="share-outline" size={18} color={shared ? CultureTokens.teal : colors.textSecondary} />
        <Text style={[rb.actionText, { color: shared ? CultureTokens.teal : colors.textSecondary }]}>Share</Text>
      </Pressable>
    </View>
  );
}

const rb = StyleSheet.create({
  wrap:       { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 14, paddingBottom: 14, gap: 4 },
  action:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 6 },
  actionText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
});

// ─── Community avatar ─────────────────────────────────────────────────────────

function CommAvatar({
  community, size = 40, colorIdx = 0,
}: {
  community: Community; size?: number; colorIdx?: number;
}) {
  const accentColor = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: accentColor + '20' }}>
      {community.imageUrl ? (
        <Image source={{ uri: community.imageUrl }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: accentColor + '25' }}>
          <Text style={{ fontSize: size * 0.36, fontFamily: 'Poppins_700Bold', color: accentColor }}>
            {getInitials(community.name)}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, colorIdx }: { post: FeedPost; colorIdx: number }) {
  const colors = useColors();
  const accentColor = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];

  const handlePress = useCallback(() => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (post.kind === 'event') {
      router.push({ pathname: '/event/[id]', params: { id: post.event.id } });
    }
  }, [post]);

  const timeLabel = useMemo(() => {
    const ms = Date.now() - new Date(post.createdAt).getTime();
    const h = Math.floor(ms / 3_600_000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }, [post.createdAt]);

  const renderBody = () => {
    switch (post.kind) {
      case 'event': {
        const ev = post.event;
        return (
          <>
            <Pressable onPress={handlePress} style={{ overflow: 'hidden' }}>
              <View style={pc.eventImg}>
                <Image
                  source={{ uri: ev.imageUrl ?? undefined }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  transition={150}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.65)']}
                  style={StyleSheet.absoluteFillObject}
                />
                {(ev.priceCents === 0 || ev.isFree) ? (
                  <View style={pc.freePill}>
                    <Text style={pc.freePillText}>FREE</Text>
                  </View>
                ) : ev.priceLabel ? (
                  <View style={[pc.freePill, { backgroundColor: CultureTokens.indigo }]}>
                    <Text style={[pc.freePillText, { color: 'white' }]}>{ev.priceLabel}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
            <Pressable onPress={handlePress} style={pc.eventInfo}>
              <Text style={[pc.eventTitle, { color: colors.text }]} numberOfLines={2}>{ev.title}</Text>
              <View style={pc.metaRow}>
                <Ionicons name="calendar-outline" size={12} color={CultureTokens.indigo} />
                <Text style={[pc.metaText, { color: CultureTokens.indigo }]}>
                  {formatEventDateTime(ev.date, ev.time)}
                </Text>
              </View>
              {(ev.venue || ev.city) ? (
                <View style={pc.metaRow}>
                  <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                  <Text style={[pc.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {ev.venue || ev.city}
                  </Text>
                </View>
              ) : null}
              <View style={[pc.rsvpRow, { borderColor: accentColor + '40' }]}>
                <Ionicons name="ticket-outline" size={14} color={accentColor} />
                <Text style={[pc.rsvpText, { color: accentColor }]}>View Event</Text>
              </View>
            </Pressable>
          </>
        );
      }
      case 'announcement':
        return (
          <View style={pc.textBody}>
            <Text style={[pc.announcementText, { color: colors.text }]}>{post.body}</Text>
          </View>
        );
      case 'welcome':
        return (
          <View style={pc.welcomeBox}>
            <LinearGradient
              colors={[accentColor + '18', accentColor + '06']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={[pc.welcomeIcon, { backgroundColor: accentColor + '20' }]}>
              <Ionicons name="people" size={22} color={accentColor} />
            </View>
            <Text style={[pc.welcomeTitle, { color: colors.text }]}>
              Welcome to {post.community.name}!
            </Text>
            <Text style={[pc.welcomeSub, { color: colors.textSecondary }]} numberOfLines={2}>
              {getCommunityHeadline(post.community)}
            </Text>
          </View>
        );
      case 'milestone':
        return (
          <View style={[pc.milestoneBox, { borderColor: accentColor + '30', backgroundColor: accentColor + '08' }]}>
            <Ionicons name="trophy" size={28} color={accentColor} />
            <View style={{ flex: 1 }}>
              <Text style={[pc.milestoneTitle, { color: colors.text }]}>
                {post.community.name} reached {post.members.toLocaleString()} members!
              </Text>
              <Text style={[pc.milestoneSub, { color: colors.textSecondary }]}>
                Be part of the growing community
              </Text>
            </View>
          </View>
        );
    }
  };

  const isDark = useIsDark();
  const pc = getPostStyles(colors);

  return (
    <Card 
      glass={!isDark} 
      padding={0} 
      style={[
        pc.card, 
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.borderLight,
          ...Platform.select({
            web: { boxShadow: '0px 8px 32px rgba(0,0,0,0.6)' },
            ios: {
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.6,
              shadowRadius: 24,
            },
            android: { elevation: 12 }
          }),
        }
      ]}
    >
      <View style={pc.header}>
        <CommAvatar community={post.community} size={40} colorIdx={colorIdx} />
        <View style={{ flex: 1 }}>
          <Text style={[TextStyles.headline, { color: colors.text }]}>{post.community.name}</Text>
          <View style={pc.subRow}>
            <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>{timeLabel}</Text>
            {post.kind === 'event' && (
              <>
                <View style={[pc.dotSep, { backgroundColor: colors.textTertiary }]} />
                <Ionicons name="calendar-outline" size={11} color={CultureTokens.gold} />
                <Text style={[TextStyles.badgeCaps, { color: CultureTokens.gold }]}>Event</Text>
              </>
            )}
            {post.kind === 'announcement' && (
              <>
                <View style={[pc.dotSep, { backgroundColor: colors.textTertiary }]} />
                <Ionicons name="megaphone-outline" size={11} color={CultureTokens.teal} />
                <Text style={[TextStyles.badgeCaps, { color: CultureTokens.teal }]}>Announcement</Text>
              </>
            )}
          </View>
        </View>
        <Pressable style={pc.moreBtn} hitSlop={8 as never}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textTertiary} />
        </Pressable>
      </View>

      {renderBody()}

      <ReactionsBar
        postId={post.id}
        communityId={post.community.id}
        communityName={post.community.name}
        initialLikes={post.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 50 + 2}
        colors={colors}
      />
    </Card>
  );
}

const getPostStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  card:          { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 10 },
  communityName: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  subRow:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  timeText:      { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  dotSep:        { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 2 },
  badgeText:     { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  moreBtn:       { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },

  eventImg:      { height: 220, position: 'relative', backgroundColor: colors.surfaceElevated },
  freePill:      { position: 'absolute', top: 10, left: 12, backgroundColor: CultureTokens.teal, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  freePillText:  { fontSize: 10, fontFamily: 'Poppins_700Bold', color: colors.textInverse },
  eventInfo:     { padding: 14, gap: 6 },
  eventTitle:    { fontSize: 18, fontFamily: 'Poppins_700Bold', lineHeight: 24, letterSpacing: -0.3 },
  metaRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:      { fontSize: 12, fontFamily: 'Poppins_600SemiBold', flex: 1 },
  rsvpRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, alignSelf: 'flex-start' },
  rsvpText:      { fontSize: 13, fontFamily: 'Poppins_700Bold' },

  textBody:         { padding: 14, paddingTop: 4 },
  announcementText: { fontSize: 16, fontFamily: 'Poppins_400Regular', lineHeight: 26 },

  welcomeBox:    { margin: 12, marginTop: 4, borderRadius: 14, padding: 18, alignItems: 'center', gap: 10, overflow: 'hidden' },
  welcomeIcon:   { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle:  { fontSize: 17, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  welcomeSub:    { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20 },

  milestoneBox:   { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 12, marginTop: 4, padding: 14, borderRadius: 14, borderWidth: 1 },
  milestoneTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', lineHeight: 20 },
  milestoneSub:   { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
});

function CommunityDetailSkeleton() {
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Skeleton width="100%" height={220} borderRadius={0} />
        <View style={{ padding: 20, gap: 16 }}>
          {/* Header Info Skeleton */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: -40 }}>
            <Skeleton width={80} height={80} borderRadius={40} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="60%" height={24} borderRadius={8} />
              <Skeleton width="40%" height={16} borderRadius={4} />
            </View>
          </View>
          
          {/* Join Button Skeleton */}
          <Skeleton width="100%" height={56} borderRadius={20} style={{ marginTop: 12 }} />

          {/* Tabs Skeleton */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <Skeleton width="23%" height={40} borderRadius={12} />
            <Skeleton width="23%" height={40} borderRadius={12} />
            <Skeleton width="23%" height={40} borderRadius={12} />
            <Skeleton width="23%" height={40} borderRadius={12} />
          </View>

          {/* Feed Skeleton */}
          <View style={{ marginTop: 20, gap: 24 }}>
            {[1, 2].map(i => (
              <View key={i} style={{ 
                backgroundColor: colors.surface, 
                borderRadius: 16, 
                borderWidth: 1, 
                borderColor: colors.borderLight,
                overflow: 'hidden'
              }}>
                <View style={{ padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <Skeleton width={40} height={40} borderRadius={20} />
                  <Skeleton width="40%" height={16} borderRadius={4} />
                </View>
                <Skeleton width="100%" height={220} borderRadius={0} />
                <View style={{ padding: 14, gap: 10 }}>
                  <Skeleton width="80%" height={24} borderRadius={8} />
                  <Skeleton width="60%" height={16} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Top-level screen ─────────────────────────────────────────────────────────

type TabKey = 'feed' | 'events' | 'about' | 'links';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'feed',   label: 'Feed',   icon: 'newspaper-outline' },
  { key: 'events', label: 'Events', icon: 'calendar-outline' },
  { key: 'about',  label: 'About',  icon: 'information-circle-outline' },
  { key: 'links',  label: 'Links',  icon: 'link-outline' },
];

// ─── Top-level screen ─────────────────────────────────────────────────────────

export default function CommunityDetailScreen() {
  const colors = useColors();
  const s = getStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = isWeb ? 0 : insets.top;
  const bottomInset = isWeb ? 34 : insets.bottom;

  const { data: dbCommunity, isLoading, isError } = useQuery<Community>({
    queryKey: ['/api/communities', id],
    queryFn: getQueryFn({ on401: 'returnNull' }) as () => Promise<Community>,
    enabled: !!id,
  });

  if (isLoading) {
    return <CommunityDetailSkeleton />;
  }

  if (isError || !dbCommunity) {
    return (
      <View style={[s.container, s.centerContent, { paddingTop: topInset }]}>
        <Ionicons name="people-outline" size={64} color={colors.textTertiary} style={{ marginBottom: 12 }} />
        <Text style={s.errorText}>Community not found or unavailable</Text>
        <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={s.backActionBtn}>
          <Text style={s.backActionText}>Return Home</Text>
        </Pressable>
      </View>
    );
  }

  const pageTitle = `${dbCommunity.name} | CulturePass Community`;
  const pageDesc = dbCommunity.description || `Join the ${dbCommunity.name} community on CulturePass — connect with people who share your culture.`;
  const pageUrl = `https://culturepass.app/community/${dbCommunity.id}`;

  return (
    <ErrorBoundary>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        {dbCommunity.imageUrl && <meta property="og:image" content={dbCommunity.imageUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        {dbCommunity.imageUrl && <meta name="twitter:image" content={dbCommunity.imageUrl} />}
        <link rel="canonical" href={pageUrl} />
      </Head>
      <DbCommunityView community={dbCommunity} topInset={topInset} bottomInset={bottomInset} />
    </ErrorBoundary>
  );
}

// ─── Main community view ──────────────────────────────────────────────────────

interface DbViewProps {
  community: Community;
  topInset: number;
  bottomInset: number;
}

function DbCommunityView({ community, topInset, bottomInset }: DbViewProps) {
  const colors = useColors();
  const s = getStyles(colors);
  const { isCommunityJoined, toggleJoinCommunity, isCommunityBookmarked, toggleSaveCommunityBookmark } = useSaved();
  const communityBookmarked = isCommunityBookmarked(community.id);
  const joined = isCommunityJoined(community.id);
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const memberRole = community.memberRole;

  const [activeTab, setActiveTab] = useState<TabKey>('feed');

  // Derive accent color from category → type → fallback
  const color =
    CATEGORY_COLORS[community.communityCategory ?? ''] ??
    COMMUNITY_TYPE_COLORS[community.communityType ?? ''] ??
    CultureTokens.indigo;

  const icon = COMMUNITY_TYPE_ICONS[community.communityType ?? ''] || 'people';

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: relatedEvents = [] } = useQuery<EventData[]>({
    queryKey: ['events', 'list', 'community-db', community.id],
    queryFn: async () => {
      const data = await api.events.list({ communityId: String(community.id), pageSize: 15 });
      return Array.isArray(data.events) ? data.events : [];
    },
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const joinMutation = useMutation({
    mutationFn: () => api.communities.join(String(community.id)),
    onSuccess: () => {
      toggleJoinCommunity(community.id);
      queryClient.invalidateQueries({ queryKey: ['/api/communities', String(community.id)] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.communities.leave(String(community.id)),
    onSuccess: () => {
      toggleJoinCommunity(community.id);
      queryClient.invalidateQueries({ queryKey: ['/api/communities', String(community.id)] });
    },
  });

  const handleJoinPress = () => {
    if (!isAuthenticated) {
      Alert.alert('Login required', 'Please sign in to join this community.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push(routeWithRedirect('/(onboarding)/login', pathname)) },
      ]);
      return;
    }
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (joined) leaveMutation.mutate();
    else joinMutation.mutate();
  };

  const isMutating = joinMutation.isPending || leaveMutation.isPending;

  const { uploadImage, deleteImage, uploading } = useImageUpload();

  const handlePickImage = useCallback(async () => {
    if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      try {
        if (community.imageUrl) {
          await deleteImage('communities', community.id, community.imageUrl, 'imageUrl');
        }
        await uploadImage(result, 'communities', community.id, 'imageUrl');
        queryClient.invalidateQueries({ queryKey: ['/api/communities', community.id] });
      } catch (err) {
        Alert.alert('Upload Error', String(err));
      }
    }
  }, [community, uploadImage, deleteImage, queryClient]);

  const canEdit = memberRole === 'admin' || memberRole === 'organizer' || __DEV__;

  // ── Derived data ──────────────────────────────────────────────────────────
  const feedPosts = useMemo(() => synthesizePosts(community, relatedEvents), [community, relatedEvents]);
  const communityLinks = useMemo(() => buildLinks(community), [community]);
  const memberCount = getCommunityMemberCount(community);
  const headline = getCommunityHeadline(community);
  const communityLabel = getCommunityLabel(community);
  const activity = getCommunityActivityMeta(community);
  const communitySignals = getCommunitySignals(community);
  const trustSignals = getCommunityTrustSignals(community);
  const discoveryReasons = getCommunityDiscoveryReasons(community);
  const joinLabel = getCommunityJoinLabel(community);
  const cadenceLabel = getCommunityCadenceLabel(community);
  const locationLabel = getCommunityLocationLabel(community);
  const eventsCount = Math.max(getCommunityEventsCount(community), relatedEvents.length);

  // ── Helper Sub-component ──────────────────────────────────────────────────
  const CommunityBottomBarInner = () => (
    <Button
      variant={joined ? "outline" : "gradient"}
      onPress={handleJoinPress}
      loading={isMutating}
      size="lg"
      fullWidth
      leftIcon={joined ? 'checkmark-circle' : 'add-circle'}
      style={joined && { backgroundColor: color + '15', borderColor: color + '40' }}
    >
      {joined ? 'Joined Community' : 'Join Community'}
    </Button>
  );

  // ── Tab content ───────────────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <View style={{ paddingTop: 16, paddingBottom: 8, minHeight: 400 }}>
            <FlashList
              data={feedPosts}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <PostCard post={item} colorIdx={index} />
              )}
              // @ts-ignore
              estimatedItemSize={350}
              scrollEnabled={false} // Since we are inside a ScrollView, we have to disable this for now or refactor the whole page
              ListEmptyComponent={
                <View style={s.emptyState}>
                  <Ionicons name="newspaper-outline" size={40} color={colors.textTertiary} />
                  <Text style={s.emptyStateText}>No posts yet</Text>
                </View>
              }
            />
          </View>
        );

      case 'events':
        return (
          <View style={{ paddingTop: 16, minHeight: 400 }}>
            <FlashList
              data={relatedEvents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    s.eventCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderLight,
                      ...Platform.select({
                        web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.45)' },
                        ios: {
                          shadowColor: colors.text,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.45,
                          shadowRadius: 10,
                        },
                        android: { elevation: 4 }
                      })
                    },
                    pressed && { opacity: 0.8, backgroundColor: colors.surfaceElevated },
                  ]}
                  onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`View event: ${item.title}`}
                >
                  <Image source={{ uri: item.imageUrl }} style={s.eventImage} contentFit="cover" transition={200} />
                  <View style={s.eventInfo}>
                    <Text style={s.eventTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={[s.eventDate, { color: color }]}>{formatEventDateTime(item.date, item.time)}</Text>
                    {item.venue ? (
                      <Text style={s.eventVenue} numberOfLines={1}>{item.venue}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={s.eventCalendarBtn}
                    onPress={() => {
                      const start = toCalendarDate(item.date, item.time);
                      if (!start) return;
                      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
                      const details = item.description || 'Event on CulturePass';
                      const location = [item.venue, item.city, item.country].filter(Boolean).join(', ');
                      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(item.title)}&dates=${toGoogleCalendarTimestamp(start)}/${toGoogleCalendarTimestamp(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
                      Linking.openURL(url).catch(() => {});
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Add to Google Calendar"
                  >
                    <Ionicons name="calendar-number-outline" size={16} color={color} />
                  </Pressable>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>
              )}
              // @ts-ignore
              estimatedItemSize={100}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={s.emptyState}>
                  <Ionicons name="calendar-outline" size={40} color={colors.textTertiary} />
                  <Text style={s.emptyStateText}>No upcoming events</Text>
                </View>
              }
            />
          </View>
        );

      case 'about':
        return (
          <View style={{ paddingTop: 20, gap: 20 }}>
            <Card padding={20}>
              <Text style={TextStyles.badgeCaps}>Community Snapshot</Text>
              <Text style={[s.snapshotHeadline, { color: colors.text }]}>{headline}</Text>
              <Text style={[TextStyles.body, { color: colors.textSecondary, lineHeight: 26, marginTop: 12 }]}>
                {community.mission || community.description || 'A vibrant cultural community connecting people through shared heritage and traditions.'}
              </Text>

              <View style={s.snapshotGrid}>
                {locationLabel ? (
                  <View style={[s.snapshotTile, { backgroundColor: colors.backgroundSecondary }]}>
                    <Ionicons name="location-outline" size={16} color={color} />
                    <Text style={[s.snapshotLabel, { color: colors.textTertiary }]}>Location</Text>
                    <Text style={[s.snapshotValue, { color: colors.text }]}>{locationLabel}</Text>
                  </View>
                ) : null}
                {cadenceLabel ? (
                  <View style={[s.snapshotTile, { backgroundColor: colors.backgroundSecondary }]}>
                    <Ionicons name="repeat-outline" size={16} color={color} />
                    <Text style={[s.snapshotLabel, { color: colors.textTertiary }]}>Cadence</Text>
                    <Text style={[s.snapshotValue, { color: colors.text }]}>{cadenceLabel}</Text>
                  </View>
                ) : null}
                {joinLabel ? (
                  <View style={[s.snapshotTile, { backgroundColor: colors.backgroundSecondary }]}>
                    <Ionicons name="person-add-outline" size={16} color={color} />
                    <Text style={[s.snapshotLabel, { color: colors.textTertiary }]}>Membership</Text>
                    <Text style={[s.snapshotValue, { color: colors.text }]}>{joinLabel}</Text>
                  </View>
                ) : null}
                {community.chapterCount && community.chapterCount > 1 ? (
                  <View style={[s.snapshotTile, { backgroundColor: colors.backgroundSecondary }]}>
                    <Ionicons name="git-network-outline" size={16} color={color} />
                    <Text style={[s.snapshotLabel, { color: colors.textTertiary }]}>Chapters</Text>
                    <Text style={[s.snapshotValue, { color: colors.text }]}>{community.chapterCount} active cities</Text>
                  </View>
                ) : null}
              </View>
            </Card>

            {community.cultures && community.cultures.length > 0 && (
              <View>
                <Text style={s.sectionTitle}>Culture Tags</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {community.cultures.map((tag) => (
                    <View key={tag} style={[s.culturePill, { backgroundColor: color + '20', borderColor: color + '40' }]}>
                      <Text style={[s.culturePillText, { color }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {trustSignals.length > 0 ? (
              <View>
                <Text style={s.sectionTitle}>Trust & Safety</Text>
                <View style={s.infoChipRow}>
                  {trustSignals.map((signal) => (
                    <View
                      key={signal}
                      style={[s.infoChip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    >
                      <Ionicons name="shield-checkmark-outline" size={14} color={CultureTokens.teal} />
                      <Text style={[s.infoChipText, { color: colors.textSecondary }]}>{signal}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {community.communityHealth ? (
              <View>
                <Text style={s.sectionTitle}>Community Health</Text>
                <View style={s.healthGrid}>
                  {community.communityHealth.memberGrowth30d != null ? (
                    <View style={[s.healthTile, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                      <Text style={[s.healthValue, { color: activity.color }]}>
                        {community.communityHealth.memberGrowth30d > 0 ? '+' : ''}
                        {community.communityHealth.memberGrowth30d}%
                      </Text>
                      <Text style={[s.healthLabel, { color: colors.textSecondary }]}>30-day growth</Text>
                    </View>
                  ) : null}
                  {community.communityHealth.activeMembers7d != null ? (
                    <View style={[s.healthTile, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                      <Text style={[s.healthValue, { color: colors.text }]}>
                        {community.communityHealth.activeMembers7d}
                      </Text>
                      <Text style={[s.healthLabel, { color: colors.textSecondary }]}>Active this week</Text>
                    </View>
                  ) : null}
                  {community.communityHealth.weeklyPosts != null ? (
                    <View style={[s.healthTile, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                      <Text style={[s.healthValue, { color: colors.text }]}>
                        {community.communityHealth.weeklyPosts}
                      </Text>
                      <Text style={[s.healthLabel, { color: colors.textSecondary }]}>Weekly posts</Text>
                    </View>
                  ) : null}
                  {community.communityHealth.engagementScore != null ? (
                    <View style={[s.healthTile, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                      <Text style={[s.healthValue, { color: colors.text }]}>
                        {community.communityHealth.engagementScore}
                      </Text>
                      <Text style={[s.healthLabel, { color: colors.textSecondary }]}>Engagement score</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {discoveryReasons.length > 0 ? (
              <View>
                <Text style={s.sectionTitle}>Why It Shows Up For You</Text>
                <View style={s.infoChipRow}>
                  {discoveryReasons.map((reason) => (
                    <View
                      key={reason}
                      style={[s.infoChip, { backgroundColor: CultureTokens.gold + '12', borderColor: CultureTokens.gold + '25' }]}
                    >
                      <Ionicons name="sparkles-outline" size={14} color={CultureTokens.gold} />
                      <Text style={[s.infoChipText, { color: colors.textSecondary }]}>{reason}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {(community.chapterCities && community.chapterCities.length > 0) || locationLabel ? (
              <View style={{ gap: 10 }}>
                <Text style={s.sectionTitle}>Footprint</Text>
                {locationLabel ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                    <Text style={s.description}>{locationLabel}</Text>
                  </View>
                ) : null}
                {community.chapterCities && community.chapterCities.length > 0 ? (
                  <View style={s.infoChipRow}>
                    {community.chapterCities.map((city) => (
                      <View
                        key={city}
                        style={[s.infoChip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                      >
                        <Ionicons name="pin-outline" size={14} color={color} />
                        <Text style={[s.infoChipText, { color: colors.textSecondary }]}>{city}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={[s.wellbeingCard, { backgroundColor: CultureTokens.gold + '10', borderColor: CultureTokens.gold + '30' }]}>
              <Ionicons name="heart-circle" size={28} color={CultureTokens.gold} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.wellbeingTitle}>Mental Health & Belonging</Text>
                <Text style={s.wellbeingDesc}>
                  Community support resources, cultural counselling, and wellbeing programs are available for all members.
                </Text>
              </View>
            </View>
          </View>
        );

      case 'links':
        return (
          <View style={{ paddingTop: 16, gap: 12 }}>
            {communityLinks.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="link-outline" size={40} color={colors.textTertiary} />
                <Text style={s.emptyStateText}>No links added yet.</Text>
              </View>
            ) : (
              communityLinks.map((link, i) => (
                <Pressable
                  key={`link-${i}`}
                  style={({ pressed }) => [
                    s.linkCard,
                    { backgroundColor: colors.surface, borderColor: colors.borderLight },
                    pressed && { opacity: 0.8, backgroundColor: colors.surfaceElevated },
                  ]}
                  onPress={() => Linking.openURL(link.url).catch(() => {})}
                  accessibilityRole="link"
                  accessibilityLabel={link.title}
                >
                  <View style={[s.linkIconWrap, { backgroundColor: color + '18' }]}>
                    <Ionicons name={link.icon as keyof typeof Ionicons.glyphMap} size={20} color={color} />
                  </View>
                  <Text style={[s.linkTitle, { color: colors.text }]} numberOfLines={1}>{link.title}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>
              ))
            )}
          </View>
        );
    }
  };

  return (
    <View style={s.container}>
      {isWeb && (
        <>
          <View style={[s.orb, { top: -50, right: -100, backgroundColor: color, opacity: 0.15, filter: 'blur(80px)' } as never]} />
          <View style={[s.orb, { top: 400, left: -100, backgroundColor: CultureTokens.gold, opacity: 0.1, filter: 'blur(100px)' } as never]} />
        </>
      )}

      <View style={isDesktop ? s.desktopShellWrapper : undefined}>
        <View style={isDesktop ? s.desktopShell : undefined}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 120 }}>

            {/* ── Hero ───────────────────────────────────────────────────── */}
            <View
              style={[
                s.heroSection,
                { height: isDesktop ? 320 : 250 + topInset },
                isDesktop && { borderRadius: 24, marginHorizontal: 20, marginTop: 20, overflow: 'hidden' },
              ]}
            >
              <LinearGradient
                colors={[color + '80', color + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={['rgba(11,11,20,0.18)', 'rgba(11,11,20,0.65)']}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Nav row */}
              <View style={[s.heroNav, { paddingTop: topInset + 12 }]}>
                <BackButton fallback="/(tabs)" style={s.navBtn} color={colors.textInverse} />
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    style={({ pressed }) => [s.navBtn, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
                    onPress={() => {
                      if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleSaveCommunityBookmark(community.id);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={communityBookmarked ? 'Remove community bookmark' : 'Save community for later'}
                  >
                    <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" style={StyleSheet.absoluteFill} />
                    <Ionicons
                      name={communityBookmarked ? 'bookmark' : 'bookmark-outline'}
                      size={20}
                      color={colors.textInverse}
                    />
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [s.navBtn, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
                    onPress={() => confirmAndReport({ targetType: 'community', targetId: String(community.id) })}
                    accessibilityRole="button"
                    accessibilityLabel="Report community"
                  >
                    <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" style={StyleSheet.absoluteFill} />
                    <Ionicons name="flag-outline" size={20} color={colors.textInverse} />
                  </Pressable>
                </View>
              </View>

              {/* Centered icon + title */}
              <View style={s.heroCenterContent}>
                <View style={[s.heroIconWrap, { backgroundColor: color + '40', borderColor: color + '80' }]}>
                  {community.imageUrl ? (
                    <Image source={{ uri: community.imageUrl }} style={{ width: 64, height: 64, borderRadius: 20 }} contentFit="cover" />
                  ) : community.iconEmoji ? (
                    <Text style={{ fontSize: 32 }}>{community.iconEmoji}</Text>
                  ) : (
                    <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={30} color={colors.textInverse} />
                  )}
                  {canEdit && (
                    <Pressable 
                      onPress={handlePickImage} 
                      style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' }]}
                      accessibilityLabel="Change image"
                    >
                      {uploading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Ionicons name="camera" size={20} color="white" style={{ position: 'absolute' }} />
                      )}
                    </Pressable>
                  )}
                </View>
                <Text style={s.heroTitle} numberOfLines={2}>{community.name}</Text>
                <Text style={s.heroHeadline} numberOfLines={2}>{headline}</Text>

                {/* Badges row */}
                <View style={s.heroBadgeRow}>
                  <View style={s.heroBadge}>
                    <Text style={s.heroBadgeText}>{communityLabel}</Text>
                  </View>
                  {community.isVerified && (
                    <View style={[s.heroBadge, { backgroundColor: 'rgba(46,196,182,0.25)', borderColor: 'rgba(46,196,182,0.5)' }]}>
                      <Ionicons name="checkmark-circle" size={12} color={CultureTokens.teal} />
                      <Text style={[s.heroBadgeText, { color: CultureTokens.teal }]}>Verified</Text>
                    </View>
                  )}
                  {community.isIndigenous && (
                    <View style={[s.heroBadge, { backgroundColor: 'rgba(255,140,66,0.25)', borderColor: 'rgba(255,140,66,0.5)' }]}>
                      <Text style={[s.heroBadgeText, { color: CultureTokens.gold }]}>Indigenous</Text>
                    </View>
                  )}
                  {(memberRole === 'admin' || memberRole === 'organizer') && (
                    <View style={[s.heroBadge, { backgroundColor: 'rgba(255,200,87,0.25)', borderColor: 'rgba(255,200,87,0.5)' }]}>
                      <Ionicons name="shield-checkmark" size={12} color={CultureTokens.gold} />
                      <Text style={[s.heroBadgeText, { color: CultureTokens.gold }]}>
                        {memberRole === 'admin' ? 'Admin' : 'Organizer'}
                      </Text>
                    </View>
                  )}
                  {joinLabel ? (
                    <View style={[s.heroBadge, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                      <Ionicons name="person-add-outline" size={12} color={colors.textInverse} />
                      <Text style={s.heroBadgeText}>{joinLabel}</Text>
                    </View>
                  ) : null}
                  <View style={[s.heroBadge, { backgroundColor: activity.color + '24', borderColor: activity.color + '55' }]}>
                    <Text style={[s.heroBadgeText, { color: 'white' }]}>{activity.label}</Text>
                  </View>
                </View>

                {/* Stats row */}
                <View style={s.heroStatsRow}>
                  <View style={s.heroStat}>
                    <Ionicons name="people" size={14} color="rgba(255,255,255,0.85)" />
                    <Text style={s.heroStatText}>{formatNumber(memberCount)} members</Text>
                  </View>
                  <View style={s.heroStatDot} />
                  <View style={s.heroStat}>
                    <Ionicons name="calendar" size={14} color="rgba(255,255,255,0.85)" />
                    <Text style={s.heroStatText}>{eventsCount} events</Text>
                  </View>
                  {community.countryOfOrigin ? (
                    <>
                      <View style={s.heroStatDot} />
                      <View style={s.heroStat}>
                        <Ionicons name="globe" size={14} color="rgba(255,255,255,0.85)" />
                        <Text style={s.heroStatText} numberOfLines={1}>{community.countryOfOrigin}</Text>
                      </View>
                    </>
                  ) : null}
                </View>

                {communitySignals.length > 1 || discoveryReasons.length > 0 ? (
                  <View style={s.heroSignalRow}>
                    {communitySignals.slice(1).map((signal) => (
                      <View key={signal} style={s.heroSignalChip}>
                        <Text style={s.heroSignalText}>{signal}</Text>
                      </View>
                    ))}
                    {discoveryReasons.slice(0, 1).map((reason) => (
                      <View key={reason} style={[s.heroSignalChip, s.heroDiscoveryChip]}>
                        <Ionicons name="sparkles-outline" size={12} color={CultureTokens.gold} />
                        <Text style={[s.heroSignalText, { color: CultureTokens.gold }]}>{reason}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>

            {/* ── Tab bar ─────────────────────────────────────────────────── */}
            <View style={[s.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    style={s.tabItem}
                    onPress={() => {
                      if (!isWeb) Haptics.selectionAsync();
                      setActiveTab(tab.key);
                    }}
                    accessibilityRole="tab"
                    accessibilityLabel={tab.label}
                    accessibilityState={{ selected: active }}
                  >
                    <Ionicons
                      name={tab.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={active ? color : colors.textTertiary}
                    />
                    <Text style={[s.tabLabel, { color: active ? color : colors.textTertiary }]}>
                      {tab.label}
                    </Text>
                    {active && <View style={[s.tabActiveBar, { backgroundColor: color }]} />}
                  </Pressable>
                );
              })}
            </View>

            {/* ── Tab content ─────────────────────────────────────────────── */}
            <View style={s.tabContent}>
              {renderTabContent()}
            </View>

          </ScrollView>
        </View>
      </View>

      {/* ── Floating Join/Leave bar ──────────────────────────────────────── */}
      <View style={[s.floatingBottomBarWrapper, { paddingBottom: bottomInset + 16, pointerEvents: 'box-none' } as never]}>
        <LinearGradient
          colors={['transparent', colors.background]}
          style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' } as never]}
        />
        <View style={{ overflow: 'hidden', borderRadius: 24, marginHorizontal: 20 }}>
          {isWeb ? (
            <View style={[s.floatingBottomBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }, isDesktop && { maxWidth: 800, alignSelf: 'center', width: '100%', bottom: 0 }]}>
              <CommunityBottomBarInner />
            </View>
          ) : (
            <BlurView intensity={30} tint="dark" style={[s.floatingBottomBar, isDesktop && { maxWidth: 800, alignSelf: 'center', width: '100%', bottom: 0 }]}>
              <CommunityBottomBarInner />
            </BlurView>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  centerContent:  { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  orb:            { position: 'absolute', width: 350, height: 350, borderRadius: 175 },

  errorText:      { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text, textAlign: 'center', marginBottom: 16 },
  backActionBtn:  { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
  backActionText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },

  desktopShellWrapper: { flex: 1, alignItems: 'center' },
  desktopShell:        { width: '100%', maxWidth: 800 },

  // ── Hero ──
  heroSection:    { position: 'relative', justifyContent: 'flex-end' },
  heroNav:        {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, zIndex: 10,
  },
  navBtn:         {
    width: 44, height: 44, borderRadius: 22,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(11,11,20,0.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  heroCenterContent: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-end',
    paddingHorizontal: 20, paddingBottom: 24, gap: 4,
  },
  heroIconWrap:   {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, marginBottom: 8,
  },
  heroTitle:      {
    fontSize: 26, fontFamily: 'Poppins_700Bold',
    color: 'white', textAlign: 'center', lineHeight: 32,
    ...Platform.select({ web: { textShadow: '0px 1px 4px rgba(0,0,0,0.5)' }, default: { textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 } }),
  },
  heroHeadline:   {
    maxWidth: 540,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 6,
  },
  heroBadgeRow:   { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' },
  heroBadge:      {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  heroBadgeText:  { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: 'white', textTransform: 'capitalize' },
  heroStatsRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  heroStat:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroStatText:   { fontSize: 12, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.85)' },
  heroStatDot:    { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.4)' },
  heroSignalRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 },
  heroSignalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroDiscoveryChip: { backgroundColor: 'rgba(255,200,87,0.12)', borderColor: 'rgba(255,200,87,0.26)' },
  heroSignalText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.88)' },

  // ── Tab bar ──
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem:        {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 3, position: 'relative',
  },
  tabLabel:       { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  tabActiveBar:   {
    position: 'absolute', bottom: 0, left: '10%', right: '10%',
    height: 2, borderRadius: 1,
  },
  tabContent:     { paddingHorizontal: 16, paddingBottom: 8 },

  // ── Events tab ──
  eventCard:      {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: CardTokens.radius, padding: 14,
    marginBottom: 12, gap: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight,
  },
  eventImage:     { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.surfaceElevated },
  eventInfo:      { flex: 1, gap: 2 },
  eventTitle:     { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  eventDate:      { fontSize: 12, fontFamily: 'Poppins_500Medium', color: CultureTokens.indigo },
  eventVenue:     { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  eventCalendarBtn: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight,
  },

  // ── About tab ──
  sectionTitle:   { fontSize: 18, fontFamily: 'Poppins_700Bold', marginBottom: 8, color: colors.text },
  description:    { fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 24, color: colors.textSecondary },
  snapshotHeadline: { fontSize: 20, fontFamily: 'Poppins_700Bold', marginTop: 10 },
  snapshotGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  snapshotTile:   { minWidth: 140, flexGrow: 1, borderRadius: 16, padding: 14, gap: 6 },
  snapshotLabel:  { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.4 },
  snapshotValue:  { fontSize: 14, fontFamily: 'Poppins_600SemiBold', lineHeight: 20 },
  culturePill:    {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
  },
  culturePillText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  infoChipRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoChip:       {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  infoChipText:   { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  healthGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  healthTile:     {
    minWidth: 140,
    flexGrow: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
  },
  healthValue:    { fontSize: 22, fontFamily: 'Poppins_700Bold' },
  healthLabel:    { fontSize: 12, fontFamily: 'Poppins_500Medium', lineHeight: 18 },
  wellbeingCard:  { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 20, padding: 20, borderWidth: 1 },
  wellbeingTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginBottom: 4, color: colors.text },
  wellbeingDesc:  { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 20, color: colors.textSecondary },

  // ── Links tab ──
  linkCard:       {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: CardTokens.radius, padding: 16,
    borderWidth: 1,
  },
  linkIconWrap:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  linkTitle:      { flex: 1, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

  // ── Empty states ──
  emptyState:     { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyStateText: { fontSize: 15, fontFamily: 'Poppins_500Medium', color: colors.textTertiary },

  // ── Floating bar ──
  floatingBottomBarWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 },
  floatingBottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  joinButton:     {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 16,
  },
  joinText:       { fontSize: 16, fontFamily: 'Poppins_700Bold' },
});
