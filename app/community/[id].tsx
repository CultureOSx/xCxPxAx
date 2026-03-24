import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform,
  ActivityIndicator, useWindowDimensions, Linking, Alert
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
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
import type { Community, EventData } from '@/shared/schema';
import { confirmAndReport } from '@/lib/reporting';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens, CardTokens } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { formatEventDateTime } from '@/lib/dateUtils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useImageUpload } from '@/hooks/useImageUpload';
import * as ImagePicker from 'expo-image-picker';
import { TextStyles } from '@/constants/typography';
import { BackButton } from '@/components/ui/BackButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  indigenous: CultureTokens.saffron,
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
  business:     CultureTokens.saffron,
  council:      CultureTokens.teal,
  charity:      CultureTokens.coral,
  club:         CultureTokens.community,
  professional: CultureTokens.gold,
};

const AVATAR_COLORS = [
  CultureTokens.indigo, CultureTokens.teal, CultureTokens.coral,
  CultureTokens.saffron, CultureTokens.gold, '#7C3AED', '#059669',
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
  initialLikes,
  colors,
}: {
  postId: string;
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
      <Pressable style={rb.action} onPress={() => setShared(true)} accessibilityRole="button" accessibilityLabel="Share">
        <Ionicons name="arrow-redo-outline" size={18} color={shared ? CultureTokens.teal : colors.textSecondary} />
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
              {post.community.description || 'Join this community to stay updated on local events and cultural activities.'}
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
  return (
    <Card 
      glass={!isDark} 
      padding={0} 
      style={[pc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
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
                <Ionicons name="calendar-outline" size={11} color={CultureTokens.saffron} />
                <Text style={[TextStyles.badgeCaps, { color: CultureTokens.saffron }]}>Event</Text>
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
        initialLikes={post.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 50 + 2}
        colors={colors}
      />
    </Card>
  );
}

const pc = StyleSheet.create({
  card:          { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 10 },
  communityName: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  subRow:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  timeText:      { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  dotSep:        { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 2 },
  badgeText:     { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  moreBtn:       { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },

  eventImg:      { height: 220, position: 'relative', backgroundColor: '#1a1a2e' },
  freePill:      { position: 'absolute', top: 10, left: 12, backgroundColor: CultureTokens.saffron, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  freePillText:  { fontSize: 10, fontFamily: 'Poppins_700Bold', color: 'black' },
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

// ─── Tab types ────────────────────────────────────────────────────────────────

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
    return (
      <View style={[s.container, s.centerContent, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color={CultureTokens.indigo} />
      </View>
    );
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

  return (
    <ErrorBoundary>
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
  const { isCommunityJoined, toggleJoinCommunity } = useSaved();
  const joined = isCommunityJoined(community.id);
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const memberCount = community.memberCount ?? community.membersCount ?? 0;
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
        { text: 'Sign in', onPress: () => router.push(routeWithRedirect('/(onboarding)/login', pathname) as any) },
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
  }, [community, uploadImage, deleteImage]);

  const canEdit = memberRole === 'admin' || memberRole === 'organizer' || __DEV__;

  // ── Derived data ──────────────────────────────────────────────────────────
  const feedPosts = useMemo(() => synthesizePosts(community, relatedEvents), [community, relatedEvents]);
  const communityLinks = useMemo(() => buildLinks(community), [community]);

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
          <View style={{ paddingTop: 16, paddingBottom: 8 }}>
            {feedPosts.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="newspaper-outline" size={40} color={colors.textTertiary} />
                <Text style={s.emptyStateText}>No posts yet</Text>
              </View>
            ) : (
              feedPosts.map((post, i) => (
                <PostCard key={post.id} post={post} colorIdx={i} />
              ))
            )}
          </View>
        );

      case 'events':
        return (
          <View style={{ paddingTop: 16 }}>
            {relatedEvents.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="calendar-outline" size={40} color={colors.textTertiary} />
                <Text style={s.emptyStateText}>No upcoming events</Text>
              </View>
            ) : (
              relatedEvents.map((event) => (
                <Pressable
                  key={event.id}
                  style={({ pressed }) => [
                    s.eventCard,
                    pressed && { opacity: 0.8, backgroundColor: colors.surfaceElevated },
                  ]}
                  onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`View event: ${event.title}`}
                >
                  <Image source={{ uri: event.imageUrl }} style={s.eventImage} contentFit="cover" transition={200} />
                  <View style={s.eventInfo}>
                    <Text style={s.eventTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={s.eventDate}>{formatEventDateTime(event.date, event.time)}</Text>
                    {event.venue ? (
                      <Text style={s.eventVenue} numberOfLines={1}>{event.venue}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={s.eventCalendarBtn}
                    onPress={() => {
                      const start = toCalendarDate(event.date, event.time);
                      if (!start) return;
                      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
                      const details = event.description || 'Event on CulturePass';
                      const location = [event.venue, event.city, event.country].filter(Boolean).join(', ');
                      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${toGoogleCalendarTimestamp(start)}/${toGoogleCalendarTimestamp(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
                      Linking.openURL(url).catch(() => {});
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Add to Google Calendar"
                  >
                    <Ionicons name="calendar-number-outline" size={16} color={CultureTokens.indigo} />
                  </Pressable>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>
              ))
            )}
          </View>
        );

      case 'about':
        return (
          <View style={{ paddingTop: 20, gap: 20 }}>
            {/* Description */}
            <Card padding={20}>
              <Text style={TextStyles.badgeCaps}>About Community</Text>
              <Text style={[TextStyles.body, { color: colors.textSecondary, lineHeight: 26, marginTop: 12 }]}>
                {community.description || 'A vibrant cultural community connecting people through shared heritage and traditions.'}
              </Text>
            </Card>

            {/* Culture tags */}
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

            {/* Location */}
            {(community.city || community.country) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                <Text style={s.description}>
                  {[community.city, community.country].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}

            {/* Wellbeing card */}
            <View style={[s.wellbeingCard, { backgroundColor: CultureTokens.saffron + '10', borderColor: CultureTokens.saffron + '30' }]}>
              <Ionicons name="heart-circle" size={28} color={CultureTokens.saffron} style={{ marginTop: 2 }} />
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
                    <Ionicons name={link.icon as never} size={20} color={color} />
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
          <View style={[s.orb, { top: 400, left: -100, backgroundColor: CultureTokens.saffron, opacity: 0.1, filter: 'blur(100px)' } as never]} />
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
                    onPress={() => confirmAndReport({ targetType: 'community', targetId: String(community.id) })}
                    accessibilityRole="button"
                    accessibilityLabel="Report community"
                  >
                    <Ionicons name="flag-outline" size={20} color={colors.textInverse} />
                    {!isWeb && <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />}
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
                    <Ionicons name={icon as never} size={30} color={colors.textInverse} />
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

                {/* Badges row */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <View style={s.heroBadge}>
                    <Text style={s.heroBadgeText}>{community.communityType || 'General'}</Text>
                  </View>
                  {community.isVerified && (
                    <View style={[s.heroBadge, { backgroundColor: 'rgba(46,196,182,0.25)', borderColor: 'rgba(46,196,182,0.5)' }]}>
                      <Ionicons name="checkmark-circle" size={12} color={CultureTokens.teal} />
                      <Text style={[s.heroBadgeText, { color: CultureTokens.teal }]}>Verified</Text>
                    </View>
                  )}
                  {community.isIndigenous && (
                    <View style={[s.heroBadge, { backgroundColor: 'rgba(255,140,66,0.25)', borderColor: 'rgba(255,140,66,0.5)' }]}>
                      <Text style={[s.heroBadgeText, { color: CultureTokens.saffron }]}>Indigenous</Text>
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
                    <Text style={s.heroStatText}>{relatedEvents.length} events</Text>
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
                      name={tab.icon as never}
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
  culturePill:    {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
  },
  culturePillText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
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
