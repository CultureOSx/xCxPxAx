/**
 * /profile/[id] — Gold-standard public profile
 *
 * User profiles render a Linktree + LinkedIn + cultural dating profile hybrid.
 * Entity profiles (community, business, venue) fall through to the legacy layout.
 *
 * Privacy: every section respects the user's privacySettings toggles.
 * Owner: Plus upsell for profile insights (no fabricated view metrics).
 * Activity: hosted events (public); tickets, saved events & joined communities (owner + signed in).
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet, Platform,
  ActivityIndicator, Linking, ScrollView, Share,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, gradients, FontFamily, shadows } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { User, EventData, Community, Ticket } from '@/shared/schema';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useSaved } from '@/contexts/SavedContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { goBackOrReplace } from '@/lib/navigation';
import { communityGroups, communityFlags } from '@/constants/onboardingCommunities';
import { interestCategories } from '@/constants/onboardingInterests';

// ─── Social platform config ────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = [
  { key: 'website',   label: 'Website',    icon: 'globe-outline'   as const, color: CultureTokens.indigo },
  { key: 'instagram', label: 'Instagram',  icon: 'logo-instagram'  as const, color: '#E4405F' },
  { key: 'twitter',   label: 'X / Twitter',icon: 'logo-twitter'    as const, color: '#1DA1F2' },
  { key: 'tiktok',    label: 'TikTok',     icon: 'logo-tiktok'     as const, color: '#69C9D0' },
  { key: 'youtube',   label: 'YouTube',    icon: 'logo-youtube'    as const, color: '#FF0000' },
  { key: 'linkedin',  label: 'LinkedIn',   icon: 'logo-linkedin'   as const, color: '#0A66C2' },
  { key: 'facebook',  label: 'Facebook',   icon: 'logo-facebook'   as const, color: '#1877F2' },
];

// ─── Community color lookup ────────────────────────────────────────────────────

const COMMUNITY_COLOR: Record<string, string> = {};
for (const g of communityGroups) {
  for (const m of g.members) COMMUNITY_COLOR[m] = g.color;
}

function accentForInterest(interest: string): string {
  for (const cat of interestCategories) {
    if (cat.interests.includes(interest)) return cat.accentColor;
  }
  return CultureTokens.gold;
}

// ─── Extended profile type ─────────────────────────────────────────────────────

interface ExtendedProfile {
  id: string;
  name: string;
  entityType: string;
  handle?: string;
  username?: string;
  avatarUrl?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  bio?: string;
  description?: string;
  city?: string;
  country?: string;
  website?: string;
  phone?: string;
  contactEmail?: string;
  socialLinks?: Record<string, string | undefined>;
  tags?: string[];
  interests?: string[];
  communities?: string[];
  ethnicityText?: string;
  languages?: string[];
  cultureIds?: string[];
  followersCount?: number;
  connectionsCount?: number;
  eventsAttended?: number;
  membersCount?: number;
  likes?: number;
  culturePassId?: string;
  membership?: { tier?: string };
  isVerified?: boolean;
  ownerId?: string;
  privacySettings?: {
    profileVisible?: boolean;
    locationVisible?: boolean;
    showSocialLinks?: boolean;
    showCommunities?: boolean;
    showInterests?: boolean;
    showCulturalIdentity?: boolean;
    [key: string]: boolean | undefined;
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

function openLink(url: string) {
  const href = url.startsWith('http') ? url : `https://${url}`;
  Linking.openURL(href).catch(() => {});
}

function eventStartMs(e: EventData): number {
  const d = e.date?.trim();
  if (!d) return NaN;
  const t = (e.time ?? '00:00').trim();
  return Date.parse(`${d}T${t || '00:00'}:00`);
}

function pickHostedEvents(raw: EventData[]): EventData[] {
  const now = Date.now();
  const rows = raw
    .filter((e) => e.status !== 'draft' && e.status !== 'cancelled')
    .map((e) => ({ e, ms: eventStartMs(e) }))
    .filter((x) => !Number.isNaN(x.ms));
  const upcoming = rows.filter((x) => x.ms >= now - 8 * 3600000).sort((a, b) => a.ms - b.ms);
  if (upcoming.length > 0) return upcoming.slice(0, 8).map((x) => x.e);
  return rows.sort((a, b) => b.ms - a.ms).slice(0, 5).map((x) => x.e);
}

function ticketStartMs(t: Ticket): number {
  if (t.eventSnapshot?.startAt) return Date.parse(t.eventSnapshot.startAt);
  const d = t.eventDate ?? t.date;
  if (!d?.trim()) return NaN;
  const time = (t.eventTime ?? '00:00').trim();
  return Date.parse(`${d.trim()}T${time || '00:00'}:00`);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  colors,
}: {
  title: string;
  subtitle?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={sec.wrap}>
      <View style={sec.row}>
        <View style={[sec.accent, { backgroundColor: CultureTokens.gold }]} />
        <Text style={[TextStyles.callout, { color: colors.text, fontFamily: FontFamily.semibold }]}>{title}</Text>
      </View>
      {subtitle ? (
        <Text style={[TextStyles.caption, { color: colors.textTertiary, marginLeft: 11, marginTop: 4, lineHeight: 18 }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
const sec = StyleSheet.create({
  wrap: { marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accent: { width: 3, height: 14, borderRadius: 2 },
});

function RecoRow({
  icon,
  title,
  subtitle,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        pu.recoRow,
        { borderColor: colors.borderLight },
        Platform.OS === 'ios' ? { opacity: pressed ? 0.88 : 1 } : null,
      ]}
      {...(Platform.OS === 'android'
        ? { android_ripple: { color: `${CultureTokens.indigo}14`, borderless: false } }
        : {})}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[pu.recoIconWrap, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={20} color={CultureTokens.indigo} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[TextStyles.callout, { color: colors.text, fontFamily: FontFamily.semibold }]}>{title}</Text>
        <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

function EventRailCard({ event, colors }: { event: EventData; colors: ReturnType<typeof useColors> }) {
  const uri = event.heroImageUrl ?? event.imageUrl;
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/event/${event.id}`);
      }}
      style={[pu.railCard, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
      accessibilityRole="button"
      accessibilityLabel={event.title}
    >
      {uri ? (
        <Image source={{ uri }} style={pu.railImage} contentFit="cover" />
      ) : (
        <View style={[pu.railImage, { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="calendar-outline" size={22} color={CultureTokens.indigo} />
        </View>
      )}
      <Text numberOfLines={2} style={[pu.railTitle, { color: colors.text }]}>
        {event.title}
      </Text>
      <Text numberOfLines={1} style={[pu.railMeta, { color: colors.textTertiary }]}>
        {[event.date, event.time].filter(Boolean).join(' · ')}
      </Text>
    </Pressable>
  );
}

function TicketRailCard({ ticket, colors }: { ticket: Ticket; colors: ReturnType<typeof useColors> }) {
  const uri = ticket.eventImageUrl;
  const title = ticket.eventTitle ?? ticket.eventName ?? ticket.eventSnapshot?.title ?? 'Event';
  const subtitle = [ticket.eventDate ?? ticket.date, ticket.eventTime].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/event/${ticket.eventId}`);
      }}
      style={[pu.railCard, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {uri ? (
        <Image source={{ uri }} style={pu.railImage} contentFit="cover" />
      ) : (
        <View style={[pu.railImage, { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="ticket-outline" size={22} color={CultureTokens.indigo} />
        </View>
      )}
      <Text numberOfLines={2} style={[pu.railTitle, { color: colors.text }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text numberOfLines={1} style={[pu.railMeta, { color: colors.textTertiary }]}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}

function CommunityRailCard({ community, colors }: { community: Community; colors: ReturnType<typeof useColors> }) {
  const uri = community.imageUrl;
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/community/${community.id}`);
      }}
      style={[pu.commRailCard, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
      accessibilityRole="button"
      accessibilityLabel={community.name}
    >
      {uri ? (
        <Image source={{ uri }} style={pu.commRailAvatar} contentFit="cover" />
      ) : (
        <View style={[pu.commRailAvatar, { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="people-outline" size={20} color={CultureTokens.indigo} />
        </View>
      )}
      <Text numberOfLines={2} style={[pu.commRailName, { color: colors.text }]}>
        {community.name}
      </Text>
    </Pressable>
  );
}

const pu = StyleSheet.create({
  recoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  recoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railScroll: { marginTop: 4, marginHorizontal: -4 },
  railScrollContent: { paddingHorizontal: 4, gap: 10, paddingBottom: 2 },
  railCard: {
    width: 148,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  railImage: { width: '100%', height: 88, backgroundColor: '#f0f0f0' },
  railTitle: { fontSize: 13, fontFamily: FontFamily.semibold, marginTop: 8, paddingHorizontal: 10, lineHeight: 18 },
  railMeta: { fontSize: 11, fontFamily: FontFamily.medium, marginTop: 4, paddingHorizontal: 10 },
  commRailCard: {
    width: 112,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 10,
    alignItems: 'center',
  },
  commRailAvatar: { width: '100%', aspectRatio: 1, backgroundColor: '#f0f0f0' },
  commRailName: { fontSize: 12, fontFamily: FontFamily.semibold, marginTop: 8, paddingHorizontal: 8, textAlign: 'center', lineHeight: 16 },
});

// ─────────────────────────────────────────────────────────────────────────────
// USER PUBLIC PROFILE
// ─────────────────────────────────────────────────────────────────────────────

function UserPublicProfile({
  profile,
  isOwner,
  insets,
  colors,
}: {
  profile: ExtendedProfile;
  isOwner: boolean;
  insets: ReturnType<typeof useSafeAreaInsets>;
  colors: ReturnType<typeof useColors>;
}) {
  const { isDesktop, hPad } = useLayout();
  const [following, setFollowing] = useState(false);
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const privacy = profile.privacySettings ?? {};
  const showLocation       = privacy.locationVisible        !== false;
  const showSocialLinks    = privacy.showSocialLinks        !== false;
  const showCommunities    = privacy.showCommunities        !== false;
  const showInterests      = privacy.showInterests          !== false;
  const showCulturalId     = privacy.showCulturalIdentity   !== false;

  const activeSocials = useMemo(() => {
    const links = { ...profile.socialLinks, website: profile.website } as Record<string, string | undefined>;
    return SOCIAL_PLATFORMS.filter(p => links[p.key]?.trim());
  }, [profile.socialLinks, profile.website]);

  const handleShare = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const h = profile.handle?.replace(/^@/, '');
    const url = h
      ? `https://culturepass.app/@${h}`
      : `https://culturepass.app/profile/${profile.id}`;
    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({ title: profile.name, text: profile.bio ?? '', url });
      } else {
        await Share.share({ title: profile.name, message: url });
      }
    } catch {}
  };

  const tier  = profile.membership?.tier ?? 'free';
  const ringGrad: [string, string, string] =
    tier === 'elite'        ? [CultureTokens.gold, '#FFD700', CultureTokens.coral] :
    tier === 'plus'         ? [CultureTokens.indigo, CultureTokens.teal, CultureTokens.indigo] :
    tier === 'sydney-local' ? [CultureTokens.teal, '#00C9A7', CultureTokens.teal] :
                              ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.3)'];

  const communities = profile.communities ?? [];
  const interests   = profile.interests   ?? [];
  const languages   = profile.languages   ?? [];

  const cardSurface = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderColor: colors.cardBorder,
      ...(Platform.OS === 'web' ? shadows.small : {}),
    }),
    [colors.surface, colors.cardBorder],
  );

  const { isAuthenticated } = useAuth();
  const { savedEvents } = useSaved();

  const { data: hostedResp } = useQuery({
    queryKey: ['profile', 'hosted-events', profile.id],
    queryFn: () => api.events.list({ organizerId: profile.id, pageSize: 32, page: 1 }),
    enabled: profile.entityType === 'user',
  });

  const hostedEventsList = useMemo(
    () => pickHostedEvents(hostedResp?.events ?? []),
    [hostedResp],
  );

  const { data: ticketsList } = useQuery({
    queryKey: ['profile', 'tickets', profile.id],
    queryFn: () => api.tickets.forUser(profile.id),
    enabled: Boolean(isOwner && isAuthenticated),
  });

  const upcomingTickets = useMemo(() => {
    if (!ticketsList?.length) return [];
    const now = Date.now();
    return ticketsList
      .filter((t) => t.status === 'confirmed' || t.status === 'reserved')
      .map((t) => ({ t, ms: ticketStartMs(t) }))
      .filter((x) => !Number.isNaN(x.ms) && x.ms >= now - 3600000)
      .sort((a, b) => a.ms - b.ms)
      .slice(0, 8)
      .map((x) => x.t);
  }, [ticketsList]);

  const savedSet = useMemo(() => new Set(savedEvents), [savedEvents]);
  const { data: eventsForSaved, isFetched: savedCatalogFetched } = useQuery({
    queryKey: ['events', 'list', 'saved-catalog'],
    queryFn: () => api.events.list({ pageSize: 400, page: 1 }),
    enabled: Boolean(isOwner && isAuthenticated && savedEvents.length > 0),
    staleTime: 60 * 1000,
  });

  const catalogEventsOwner = useMemo(
    () => eventsForSaved?.events ?? [],
    [eventsForSaved],
  );
  const missingSavedEventIds = useMemo(() => {
    if (!savedCatalogFetched || savedSet.size === 0) return [];
    const have = new Set(catalogEventsOwner.map((e) => e.id));
    return savedEvents.filter((id) => !have.has(id)).slice(0, 16);
  }, [savedCatalogFetched, savedSet, savedEvents, catalogEventsOwner]);

  const savedEventDetailQueries = useQueries({
    queries: missingSavedEventIds.map((id) => ({
      queryKey: ['events', 'detail', id] as const,
      queryFn: () => api.events.get(id),
      enabled:
        Boolean(isOwner && isAuthenticated && savedEvents.length > 0) &&
        savedCatalogFetched &&
        missingSavedEventIds.includes(id),
      staleTime: 60_000,
    })),
  });

  const savedEventCards = useMemo(() => {
    if (savedSet.size === 0) return [];
    const merged = new Map<string, EventData>();
    for (const e of catalogEventsOwner) merged.set(e.id, e);
    for (const q of savedEventDetailQueries) {
      if (q.data) merged.set(q.data.id, q.data);
    }
    const now = Date.now();
    return savedEvents
      .map((id) => merged.get(id))
      .filter((e): e is EventData => e != null)
      .map((e) => ({ e, ms: eventStartMs(e) }))
      .filter((x) => !Number.isNaN(x.ms) && x.ms >= now - 8 * 3600000)
      .sort((a, b) => a.ms - b.ms)
      .slice(0, 8)
      .map((x) => x.e);
  }, [savedEvents, savedSet, catalogEventsOwner, savedEventDetailQueries]);

  const { data: joinedPayload } = useQuery({
    queryKey: ['/api/communities/joined', 'profile'],
    queryFn: () => api.communities.joined(),
    enabled: Boolean(isOwner && isAuthenticated),
  });
  const joinedIds = useMemo(
    () => joinedPayload?.communityIds ?? [],
    [joinedPayload],
  );
  const { data: allCommunities = [] } = useQuery({
    queryKey: ['/api/communities'],
    queryFn: () => api.communities.list(),
    enabled: Boolean(isOwner && isAuthenticated && joinedIds.length > 0),
  });
  const joinedCommunityCards = useMemo(() => {
    const set = new Set(joinedIds);
    return allCommunities.filter((c) => set.has(c.id));
  }, [allCommunities, joinedIds]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <View style={[u.hero, Platform.OS === 'web' && u.heroWeb]}>
        <LinearGradient
          colors={gradients.culturepassBrand as unknown as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.45 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View style={[u.orb, { top: -40, right: -40, backgroundColor: CultureTokens.teal, opacity: 0.22 }]} />
        <View style={[u.orb, { bottom: -60, left: -30, backgroundColor: CultureTokens.coral, opacity: 0.18 }]} />

        <View style={[u.heroTop, { top: Platform.OS === 'web' ? 20 : insets.top + 10 }]}>
          <Pressable
            onPress={() => goBackOrReplace('/(tabs)')}
            style={u.glassBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            {...(Platform.OS === 'android'
              ? { android_ripple: { color: 'rgba(255,255,255,0.22)', borderless: true } }
              : {})}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {isOwner && (
              <Pressable
                onPress={() => router.push('/profile/edit')}
                style={u.glassBtn}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
                {...(Platform.OS === 'android'
                  ? { android_ripple: { color: 'rgba(255,255,255,0.22)', borderless: true } }
                  : {})}
              >
                <Ionicons name="create-outline" size={19} color="#fff" />
              </Pressable>
            )}
            <Pressable
              onPress={handleShare}
              style={u.glassBtn}
              accessibilityRole="button"
              accessibilityLabel="Share profile"
              {...(Platform.OS === 'android'
                ? { android_ripple: { color: 'rgba(255,255,255,0.22)', borderless: true } }
                : {})}
            >
              <Ionicons name="share-outline" size={19} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Avatar + identity */}
        <View style={u.heroBody}>
          {/* Avatar with tier ring */}
          <View style={u.avatarRingOuter}>
            <LinearGradient colors={ringGrad} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={u.avatarInner}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={u.avatar} contentFit="cover" />
              ) : (
                <View style={[u.avatarFallback, { backgroundColor: CultureTokens.indigo + '60' }]}>
                  <Text style={u.avatarLetter}>
                    {(profile.name ?? 'U')[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Name + handle */}
          <Text style={u.heroName} numberOfLines={1}>{profile.name}</Text>
          <View style={u.heroBadgeRow}>
            {profile.handle ? (
              <View style={[u.handlePill, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.22)' }]}>
                <Text style={u.handleText}>@{profile.handle.replace(/^@/, '')}</Text>
              </View>
            ) : null}
            {profile.culturePassId ? (
              <View style={[u.handlePill, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.18)' }]}>
                <Ionicons name="diamond-outline" size={11} color="rgba(255,255,255,0.9)" />
                <Text style={u.handleText}>{profile.culturePassId}</Text>
              </View>
            ) : null}
            {profile.isVerified ? (
              <View style={[u.verifyPill, { backgroundColor: `${CultureTokens.gold}25`, borderColor: `${CultureTokens.gold}50` }]}>
                <Ionicons name="shield-checkmark" size={10} color={CultureTokens.gold} />
                <Text style={[u.verifyText, { color: CultureTokens.gold }]}>Verified</Text>
              </View>
            ) : null}
          </View>
          {showLocation && (profile.city || profile.country) && (
            <View style={u.locationRow}>
              <Ionicons name="location" size={11} color="rgba(255,255,255,0.7)" />
              <Text style={u.locationText}>{[profile.city, profile.country].filter(Boolean).join(', ')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Scrollable content ───────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={[
          u.scrollContent,
          {
            paddingBottom: bottomInset + 100,
            paddingHorizontal: hPad,
            maxWidth: isDesktop ? 560 : undefined,
            width: '100%',
            alignSelf: isDesktop ? 'center' : undefined,
          },
        ]}
      >
        {!isOwner ? (
          <View style={u.connectBar}>
            <Pressable
              style={({ pressed }) => [
                u.followBtn,
                following && { backgroundColor: 'transparent', borderWidth: 2, borderColor: CultureTokens.indigo },
                pressed && { opacity: 0.82 },
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setFollowing((f) => !f);
              }}
              accessibilityRole="button"
              accessibilityLabel={following ? 'Unfollow' : 'Follow'}
            >
              <Ionicons
                name={following ? 'checkmark-circle' : 'person-add'}
                size={17}
                color={following ? CultureTokens.indigo : '#fff'}
              />
              <Text style={[u.followBtnText, following && { color: CultureTokens.indigo }]}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                u.messageBtn,
                { borderColor: colors.borderLight, backgroundColor: colors.surface },
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => Alert.alert('Messaging', 'Direct messaging is coming soon to CulturePass.')}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Ionicons name="chatbubble-outline" size={17} color={colors.text} />
              <Text style={[u.messageBtnText, { color: colors.text }]}>Message</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[u.statsRow, cardSurface]}>
          {[
            { label: 'Followers',   value: profile.followersCount   ?? 0 },
            { label: 'Connections', value: profile.connectionsCount  ?? 0 },
            { label: 'Events',      value: profile.eventsAttended    ?? 0 },
          ].map((stat, i, arr) => (
            <View key={stat.label} style={[u.statCell, i < arr.length - 1 && { borderRightWidth: 1, borderRightColor: colors.borderLight }]}>
              <Text style={[u.statValue, { color: colors.text }]}>{fmt(stat.value)}</Text>
              <Text style={[u.statLabel, { color: colors.textTertiary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Profile Views (owner) ── */}
        {isOwner ? (
          <Pressable
            style={[u.viewsCard, cardSurface, { borderColor: `${CultureTokens.gold}35` }]}
            onPress={() =>
              Alert.alert(
                'Profile insights',
                'See who viewed your profile and more with CulturePass Plus.',
                [
                  { text: 'Not now', style: 'cancel' },
                  { text: 'View Plus', onPress: () => router.push('/membership/upgrade') },
                ],
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Profile insights and Plus membership"
          >
            <LinearGradient
              colors={[`${CultureTokens.gold}0D`, `${CultureTokens.indigo}08`] as [string, string]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={u.viewsLeft}>
              <View style={[u.viewsIconWrap, { backgroundColor: `${CultureTokens.gold}22` }]}>
                <Ionicons name="sparkles-outline" size={18} color={CultureTokens.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[u.viewsTitle, { color: colors.text }]}>Profile insights</Text>
                <Text style={[u.viewsHint, { color: colors.textSecondary }]}>
                  {privacy.privateViewingMode
                    ? 'Private viewing is on for your account.'
                    : 'Audience insights with CulturePass Plus — tap to learn more.'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>
        ) : null}

        {/* ── About / Bio ── */}
        {profile.bio ? (
          <View style={[u.card, cardSurface]}>
            <SectionHeader title="About" subtitle="In their own words." colors={colors} />
            <Text style={[u.bioText, { color: colors.text }]}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* ── Linktree-style links ── */}
        {showSocialLinks && activeSocials.length > 0 ? (
          <View style={[u.card, cardSurface]}>
            <SectionHeader title="Links" subtitle="Websites and social profiles." colors={colors} />
            <View style={u.linkIconRow}>
              {activeSocials.map((p) => {
                const link =
                  ({ ...profile.socialLinks, website: profile.website } as Record<string, string | undefined>)[p.key] ?? '';
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      openLink(link);
                    }}
                    style={({ pressed }) => [
                      u.linkIconBtn,
                      { backgroundColor: p.color, transform: [{ scale: pressed ? 0.94 : 1 }] },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${p.label}`}
                  >
                    <Ionicons name={p.icon} size={22} color="#FFFFFF" />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {showCulturalId && (profile.ethnicityText || languages.length > 0 || (showCommunities && communities.length > 0)) ? (
          <View style={[u.card, cardSurface]}>
            <SectionHeader
              title="Cultural roots"
              subtitle="Heritage, languages, and communities they share publicly."
              colors={colors}
            />
            {profile.ethnicityText ? (
              <Text style={[u.ethnicityText, { color: colors.text }]}>{profile.ethnicityText}</Text>
            ) : null}

            {languages.length > 0 ? (
              <View style={u.chipGroup}>
                <Text style={[u.chipGroupLabel, { color: colors.textTertiary }]}>Languages</Text>
                <View style={[u.chipRow, { marginTop: 6 }]}>
                  {languages.map((lang) => (
                    <View
                      key={lang}
                      style={[u.langChip, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}
                    >
                      <Text style={[u.langChipText, { color: colors.text }]}>{lang}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {showCommunities && communities.length > 0 ? (
              <View style={[u.chipGroup, { marginTop: languages.length > 0 ? 16 : 0 }]}>
                <Text style={[u.chipGroupLabel, { color: colors.textTertiary }]}>Communities</Text>
                <View style={[u.chipRow, { marginTop: 6 }]}>
                  {communities.map((c) => {
                    const color = COMMUNITY_COLOR[c] ?? CultureTokens.indigo;
                    const flag = communityFlags[c] ?? '🌐';
                    return (
                      <View key={c} style={[u.commChip, { backgroundColor: color, borderColor: color }]}>
                        <Text style={u.commChipFlag}>{flag}</Text>
                        <Text style={[u.commChipText, { color: '#fff' }]}>{c}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {showInterests && interests.length > 0 ? (
          <View style={[u.card, cardSurface, { borderColor: `${CultureTokens.gold}40` }]}>
            <SectionHeader title="Interests" subtitle="Events and scenes they care about." colors={colors} />
            <View style={[u.chipRow, { marginTop: 2 }]}>
              {interests.map((tag, i) => {
                const accent = accentForInterest(tag);
                return (
                  <View
                    key={tag + i}
                    style={[u.interestChip, { backgroundColor: accent, borderColor: accent }]}
                  >
                    <Text style={[u.interestChipText, { color: '#fff' }]}>{tag}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {hostedEventsList.length > 0 ? (
          <View style={[u.card, cardSurface]}>
            <SectionHeader
              title={isOwner ? 'Your hosted events' : 'Events they host'}
              subtitle="Published on CulturePass (upcoming first)."
              colors={colors}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={pu.railScroll}
              contentContainerStyle={pu.railScrollContent}
            >
              {hostedEventsList.map((e) => (
                <EventRailCard key={e.id} event={e} colors={colors} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {isOwner && upcomingTickets.length > 0 ? (
          <View style={[u.card, cardSurface]}>
            <SectionHeader
              title="Tickets & RSVPs"
              subtitle="Upcoming events you are going to."
              colors={colors}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={pu.railScroll}
              contentContainerStyle={pu.railScrollContent}
            >
              {upcomingTickets.map((t) => (
                <TicketRailCard key={t.id} ticket={t} colors={colors} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {isOwner && savedEventCards.length > 0 ? (
          <View style={[u.card, cardSurface]}>
            <SectionHeader title="Saved events" subtitle="From your bookmarks." colors={colors} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={pu.railScroll}
              contentContainerStyle={pu.railScrollContent}
            >
              {savedEventCards.map((e) => (
                <EventRailCard key={e.id} event={e} colors={colors} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {isOwner && joinedCommunityCards.length > 0 ? (
          <View style={[u.card, cardSurface]}>
            <SectionHeader
              title="Communities joined"
              subtitle="Platform groups you are a member of."
              colors={colors}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={pu.railScroll}
              contentContainerStyle={pu.railScrollContent}
            >
              {joinedCommunityCards.map((c) => (
                <CommunityRailCard key={c.id} community={c} colors={colors} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={[u.card, cardSurface]}>
          <SectionHeader
            title="Explore CulturePass"
            subtitle={
              isOwner
                ? 'Shortcuts: saved items, events, directory, and groups.'
                : profile.city
                  ? `More to do in ${profile.city} — and across the app.`
                  : 'Keep exploring events, groups, and places.'
            }
            colors={colors}
          />
          {(isOwner
            ? [
                {
                  icon: 'bookmark-outline' as const,
                  title: 'Saved',
                  subtitle: 'Events, communities & cultural hubs you bookmarked',
                  onPress: () => router.push('/saved'),
                },
                {
                  icon: 'calendar-outline' as const,
                  title: 'Events',
                  subtitle: 'Browse what is on near you',
                  onPress: () => router.push('/events'),
                },
                {
                  icon: 'business-outline' as const,
                  title: 'Directory',
                  subtitle: 'Venues, businesses & organisers',
                  onPress: () => router.push('/directory'),
                },
                {
                  icon: 'people-outline' as const,
                  title: 'Communities',
                  subtitle: 'Join diaspora & cultural groups',
                  onPress: () => router.push('/communities'),
                },
                {
                  icon: 'gift-outline' as const,
                  title: 'Perks',
                  subtitle: 'Member deals & rewards',
                  onPress: () => router.push('/(tabs)/perks'),
                },
              ]
            : [
                {
                  icon: 'calendar-outline' as const,
                  title: 'Events',
                  subtitle: profile.city ? `Discover in ${profile.city}` : 'Browse upcoming events',
                  onPress: () => router.push('/events'),
                },
                {
                  icon: 'people-outline' as const,
                  title: 'Communities',
                  subtitle: 'Find groups that match you',
                  onPress: () => router.push('/communities'),
                },
                {
                  icon: 'compass-outline' as const,
                  title: 'Discover',
                  subtitle: 'Personalised culture feed',
                  onPress: () => router.push('/(tabs)/index'),
                },
              ]
          ).map((row, i) => (
            <View
              key={row.title}
              style={i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderLight } : undefined}
            >
              <RecoRow
                icon={row.icon}
                title={row.title}
                subtitle={row.subtitle}
                onPress={row.onPress}
                colors={colors}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles — user profile ─────────────────────────────────────────────────────

const u = StyleSheet.create({
  hero: {
    height: 340,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroWeb: {
    height: 300,
  },
  orb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    ...Platform.select({ web: { filter: 'blur(60px)' } as any }),
  },
  heroTop: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(28,28,36,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroBody: {
    alignItems: 'center',
    paddingBottom: 28,
    gap: 6,
  },
  avatarRingOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 4,
  },
  avatarInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatar: { width: 96, height: 96 },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 36, fontFamily: FontFamily.bold, color: '#fff' },
  heroName: { fontSize: 24, fontFamily: FontFamily.bold, color: '#fff', letterSpacing: -0.3 },
  heroBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center', maxWidth: 340 },
  handlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  handleText: { fontSize: 12, fontFamily: FontFamily.semibold, color: 'rgba(255,255,255,0.85)' },
  verifyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  verifyText: { fontSize: 10, fontFamily: FontFamily.semibold },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, fontFamily: FontFamily.regular, color: 'rgba(255,255,255,0.7)' },

  scrollContent: { paddingTop: 20, gap: 16 },

  connectBar: { flexDirection: 'row', gap: 10, marginBottom: 2 },
  followBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: CultureTokens.indigo,
    borderRadius: 14,
  },
  followBtnText: { fontSize: 14, fontFamily: FontFamily.bold, color: '#fff' },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  messageBtnText: { fontSize: 14, fontFamily: FontFamily.semibold },

  statsRow: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontFamily: FontFamily.bold },
  statLabel: { fontSize: 11, fontFamily: FontFamily.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  viewsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    gap: 8,
  },
  viewsLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  viewsIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  viewsTitle: { fontSize: 15, fontFamily: FontFamily.semibold, lineHeight: 20 },
  viewsHint: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 4, lineHeight: 17 },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 1 },
      default: {},
    }),
  },
  bioText: { fontSize: 15, fontFamily: FontFamily.regular, lineHeight: 24, marginTop: 2 },
  ethnicityText: { fontSize: 16, fontFamily: FontFamily.semibold, lineHeight: 24, marginTop: 2 },

  linkIconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },
  /** Round icon-only social buttons (48pt min touch target). */
  linkIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' } as object,
    }),
  },

  cultureNatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  cultureNatFlag: { fontSize: 28 },
  cultureNatLabel: { fontSize: 10, fontFamily: FontFamily.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  cultureNatValue: { fontSize: 15, fontFamily: FontFamily.semibold },

  chipGroup: { marginTop: 4, gap: 8 },
  chipGroupLabel: { fontSize: 11, fontFamily: FontFamily.semibold, letterSpacing: 0.3 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  langChipText: { fontSize: 13, fontFamily: FontFamily.medium },
  commChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  commChipFlag: { fontSize: 14 },
  commChipText: { fontSize: 12, fontFamily: FontFamily.semibold },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  interestChipText: { fontSize: 12, fontFamily: FontFamily.semibold },
});

// ─────────────────────────────────────────────────────────────────────────────
// ENTITY PUBLIC PROFILE (existing layout, unchanged logic)
// ─────────────────────────────────────────────────────────────────────────────

const SOCIAL_ICONS_LEGACY = [
  { key: 'facebook', icon: 'logo-facebook' as const, color: '#FFFFFF' },
  { key: 'instagram', icon: 'logo-instagram' as const, color: '#FFFFFF' },
  { key: 'twitter', icon: 'logo-twitter' as const, color: '#FFFFFF' },
  { key: 'linkedin', icon: 'logo-linkedin' as const, color: '#FFFFFF' },
  { key: 'youtube', icon: 'logo-youtube' as const, color: '#FFFFFF' },
  { key: 'tiktok', icon: 'logo-tiktok' as const, color: '#FFFFFF' },
];

const ENTITY_HOSTED_TYPES = new Set([
  'business',
  'artist',
  'venue',
  'restaurant',
  'organisation',
  'organizer',
  'community',
  'brand',
  'creator',
  'charity',
]);

function EntityPublicProfile({
  profile,
  isOwner,
  insets,
  colors,
}: {
  profile: ExtendedProfile;
  isOwner: boolean;
  insets: ReturnType<typeof useSafeAreaInsets>;
  colors: ReturnType<typeof useColors>;
}) {
  const [isFollowing, setIsFollowing] = useState(false);
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const showHostedEvents = ENTITY_HOSTED_TYPES.has(String(profile.entityType ?? '').toLowerCase());

  const { data: entityHostedResp } = useQuery({
    queryKey: ['profile', 'entity-hosted-events', profile.id, profile.ownerId],
    queryFn: async () => {
      const ownerKey = profile.ownerId;
      const byPub = await api.events.list({ publisherProfileId: profile.id, pageSize: 40, page: 1 });
      const byOrg = ownerKey
        ? await api.events.list({ organizerId: ownerKey, pageSize: 40, page: 1 })
        : { events: [] as EventData[] };
      const map = new Map<string, EventData>();
      for (const e of [...(byPub.events ?? []), ...(byOrg.events ?? [])]) {
        const matchPub = e.publisherProfileId === profile.id;
        const matchLegacy = !e.publisherProfileId && ownerKey && e.organizerId === ownerKey;
        if (matchPub || matchLegacy) map.set(e.id, e);
      }
      return { events: [...map.values()] };
    },
    enabled: showHostedEvents,
  });

  const entityHostedList = useMemo(
    () => pickHostedEvents(entityHostedResp?.events ?? []),
    [entityHostedResp],
  );

  const socialLinks = profile.socialLinks ?? {};
  const activeSocials = SOCIAL_ICONS_LEGACY.filter(s => socialLinks[s.key]);
  const tags = profile.tags ?? [];
  const showLocation = profile.privacySettings?.locationVisible !== false;
  const locationText = showLocation ? [profile.city, profile.country].filter(Boolean).join(', ') : '';
  const heroImage = profile.coverImageUrl ?? profile.avatarUrl ?? profile.imageUrl;
  const accentColor = CultureTokens.indigo;

  return (
    <View style={e.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
      >
        <View style={e.hero}>
          <LinearGradient colors={gradients.primary as [string, string]} style={e.heroGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          {heroImage && <Image source={{ uri: heroImage }} style={e.avatarLarge} contentFit="cover" />}
          <View style={[e.heroTop, { top: Platform.OS === 'web' ? 20 : insets.top + 10 }]}>
            <Pressable
              onPress={() => goBackOrReplace('/(tabs)')}
              style={e.glassBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              {...(Platform.OS === 'android'
                ? { android_ripple: { color: 'rgba(255,255,255,0.22)', borderless: true } }
                : {})}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
          </View>
          <View style={e.heroInfo}>
            <Text style={e.name}>{profile.name}</Text>
            <View style={e.metaRow}>
              <View style={e.roleBadge}>
                <Text style={e.roleText}>{profile.entityType.toUpperCase()}</Text>
              </View>
              {locationText ? <Text style={e.locText}> · {locationText}</Text> : null}
            </View>
          </View>
          {activeSocials.length > 0 && (
            <View style={e.socialRow}>
              {activeSocials.map(s => (
                <Pressable key={s.key} style={e.socialCircle} onPress={() => Linking.openURL(socialLinks[s.key]!)}>
                  <Ionicons name={s.icon} size={18} color="#fff" />
                </Pressable>
              ))}
            </View>
          )}
        </View>
        <View style={e.body}>
          <View style={[e.statsRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            {[
              { label: 'Followers', value: profile.followersCount ?? 0 },
              profile.membersCount ? { label: 'Members', value: profile.membersCount } : null,
              profile.likes ? { label: 'Likes', value: profile.likes } : null,
            ].filter(Boolean).map((stat, i, arr) => (
              <View key={stat!.label} style={[e.statCell, i < arr.length - 1 && { borderRightWidth: 1, borderRightColor: colors.borderLight }]}>
                <Text style={[e.statValue, { color: colors.text }]}>{fmt(stat!.value)}</Text>
                <Text style={[e.statLabel, { color: colors.textTertiary }]}>{stat!.label}</Text>
              </View>
            ))}
          </View>
          {(profile.bio || profile.description) && (
            <View style={[e.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, borderLeftColor: accentColor }]}>
              <Text style={[{ color: colors.text, fontSize: 15, fontFamily: FontFamily.regular, lineHeight: 24 }]}>
                {profile.bio ?? profile.description}
              </Text>
            </View>
          )}
          {tags.length > 0 && (
            <View style={e.section}>
              <Text style={[e.sectionTitle, { color: colors.text }]}>Tags</Text>
              <View style={e.tagCloud}>
                {tags.map((tag, i) => (
                  <View key={i} style={[e.tag, { backgroundColor: accentColor + '10', borderColor: accentColor + '20' }]}>
                    <Text style={[e.tagText, { color: accentColor }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {showHostedEvents ? (
            <View style={e.section}>
              {entityHostedList.length > 0 ? (
                <View style={[e.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                  <Text style={[e.sectionTitle, { color: colors.text }]}>Events</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={pu.railScroll}
                    contentContainerStyle={pu.railScrollContent}
                  >
                    {entityHostedList.map((ev) => (
                      <EventRailCard key={ev.id} event={ev} colors={colors} />
                    ))}
                  </ScrollView>
                </View>
              ) : null}
              <RecoRow
                icon="search-outline"
                title="Search events from this profile"
                subtitle="Open search with this page as organiser filter"
                onPress={() =>
                  router.push({
                    pathname: '/search',
                    params: { publisherProfileId: profile.id },
                  })
                }
                colors={colors}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
      <View style={[e.bottomBar, { paddingBottom: bottomInset + 8, backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
        <Pressable
          style={[e.followBtn, isFollowing && { backgroundColor: 'transparent', borderWidth: 2, borderColor: accentColor }]}
          onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIsFollowing(f => !f); }}
        >
          <Ionicons name={isFollowing ? 'checkmark-circle' : 'person-add'} size={20} color={isFollowing ? accentColor : '#fff'} />
          <Text style={[e.followBtnText, isFollowing && { color: accentColor }]}>{isFollowing ? 'Following' : 'Follow'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  container: { flex: 1 },
  hero: { height: 300, justifyContent: 'flex-end', padding: 24, overflow: 'hidden', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  heroGrad: StyleSheet.absoluteFillObject,
  avatarLarge: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 12 },
  heroTop: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', zIndex: 10 },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: { gap: 4 },
  name: { fontSize: 26, fontFamily: FontFamily.bold, color: '#fff' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleText: { fontSize: 10, fontFamily: FontFamily.bold, color: '#fff' },
  locText: { fontSize: 13, fontFamily: FontFamily.medium, color: 'rgba(255,255,255,0.7)' },
  socialRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  socialCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20, paddingTop: 24 },
  statsRow: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, paddingVertical: 16, marginBottom: 20 },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontFamily: FontFamily.bold },
  statLabel: { fontSize: 11, fontFamily: FontFamily.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { borderRadius: 16, borderWidth: 1, borderLeftWidth: 4, padding: 18, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontFamily: FontFamily.bold, marginBottom: 10 },
  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  tagText: { fontSize: 12, fontFamily: FontFamily.semibold },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  followBtn: { flex: 1, height: 52, backgroundColor: CultureTokens.indigo, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  followBtnText: { color: '#fff', fontSize: 16, fontFamily: FontFamily.bold },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfileDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id }    = useLocalSearchParams();
  const { userId: currentUserId } = useAuth();

  const { data: profile, isLoading } = useQuery<ExtendedProfile>({
    queryKey: ['/api/profiles-and-users', id as string],
    queryFn: async () => {
      try {
        return await api.profiles.get(id as string) as ExtendedProfile;
      } catch (err) {
        const status = err instanceof ApiError ? err.status : undefined;
        if (status === 404 || status === 403 || status === 401 || status === 400 || (err instanceof Error && err.message.includes('found'))) {
          const user = await api.users.get(id as string) as User;
          return {
            id: user.id,
            name: user.displayName ?? user.username ?? 'Anonymous',
            entityType: 'user',
            handle: user.handle,
            username: user.username,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            city: user.city,
            country: user.country,
            website: user.website,
            socialLinks: (user.socialLinks as Record<string, string>) ?? {},
            interests: user.interests ?? [],
            communities: user.communities ?? [],
            ethnicityText: user.ethnicityText,
            languages: user.languages ?? [],
            cultureIds: user.culturalIdentity?.cultureIds ?? [],
            followersCount: user.followersCount ?? 0,
            connectionsCount: user.connectionsCount ?? 0,
            eventsAttended: user.eventsAttended ?? 0,
            culturePassId: user.culturePassId,
            isVerified: user.isVerified,
            membership: user.membership ? { tier: user.membership.tier } : undefined,
            privacySettings: user.privacySettings ?? { profileVisible: true, locationVisible: true },
          };
        }
        throw err;
      }
    },
    enabled: !!id,
  });

  const isOwner  = currentUserId === (id as string);
  const isPrivate = profile?.entityType === 'user' && profile.privacySettings?.profileVisible === false;

  if (isLoading) {
    return (
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={CultureTokens.indigo} />
        </View>
      </ErrorBoundary>
    );
  }

  if (!profile) {
    return (
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 16, fontFamily: FontFamily.medium, color: colors.textSecondary }}>Profile not found</Text>
          <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: CultureTokens.indigo + '15' }}>
            <Text style={{ color: CultureTokens.indigo, fontFamily: FontFamily.semibold }}>Go Back</Text>
          </Pressable>
        </View>
      </ErrorBoundary>
    );
  }

  if (isPrivate && !isOwner) {
    return (
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Ionicons name="lock-closed" size={40} color={colors.textTertiary} />
          <Text style={{ fontSize: 18, fontFamily: FontFamily.bold, color: colors.text, textAlign: 'center', marginTop: 16 }}>This profile is private</Text>
          <Text style={{ fontSize: 14, fontFamily: FontFamily.regular, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>Only followers can see this user&apos;s details.</Text>
          <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: CultureTokens.indigo + '15' }}>
            <Text style={{ color: CultureTokens.indigo, fontFamily: FontFamily.semibold }}>Go Back</Text>
          </Pressable>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Stack.Screen options={{ title: profile.name ?? 'Profile', headerShown: false }} />
      <Head>
        <title>{`${profile.name} | CulturePass`}</title>
        <meta name="description" content={profile.bio ?? `Discover ${profile.name} on CulturePass.`} />
        <meta property="og:title" content={`${profile.name} | CulturePass`} />
        <meta property="og:description" content={profile.bio ?? `Discover ${profile.name} on CulturePass.`} />
        {profile.avatarUrl && <meta property="og:image" content={profile.avatarUrl} />}
        <meta property="og:url" content={`https://culturepass.app/profile/${id}`} />
      </Head>

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {profile.entityType === 'user' ? (
          <UserPublicProfile profile={profile} isOwner={isOwner} insets={insets} colors={colors} />
        ) : (
          <EntityPublicProfile profile={profile} isOwner={isOwner} insets={insets} colors={colors} />
        )}
      </View>
    </ErrorBoundary>
  );
}
