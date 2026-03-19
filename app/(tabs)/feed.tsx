import React, {
  useState, useMemo, useCallback, useEffect, useRef,
} from 'react';
import {
  View, Text, Pressable, StyleSheet, FlatList, ScrollView,
  Platform, ActivityIndicator, RefreshControl, Modal,
  TextInput, KeyboardAvoidingView,
  Keyboard, Share, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, CardTokens, gradients, HeaderTokens } from '@/constants/theme';
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LocationPicker } from '@/components/LocationPicker';
import { Button } from '@/components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { timeAgo, formatEventDateTime } from '@/lib/dateUtils';
import { uploadPostImage } from '@/lib/storage';

import {
  createCommunityPost,
  subscribeComments,
  subscribeCommentCount,
  addComment,
  toggleLike,
  subscribeLiked,
  subscribeLikeCount,
  reportPost,
  type FeedComment,
  type PostCollection,
} from '@/lib/feedService';
import type { EventData, Community, User } from '@/shared/schema';


// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT_COLORS = [
  CultureTokens.indigo, CultureTokens.teal, CultureTokens.coral,
  CultureTokens.saffron, CultureTokens.gold, '#7C3AED', '#059669',
];

const SEED_ANNOUNCEMENTS = [
  { body: 'Join us this weekend for our annual cultural festival! 🎉', img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800' },
  { body: 'New community guidelines have been updated. Please check them out.', img: null },
  { body: 'Welcome to all new members who joined this week! 👋', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800' },
  { body: 'Our community just hit a milestone — thank you all! 🙌', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800' },
  { body: 'Volunteering spots available for our upcoming event.', img: null },
  { body: 'Photos from last weekend\'s event are now in our gallery.', img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800' },
  { body: 'Our next community catch-up is coming soon. RSVP below!', img: null },
];


// ─── Types ────────────────────────────────────────────────────────────────────

type FeedPost = (
  | { id: string; kind: 'event';        event: EventData;    community: Community; createdAt: string }
  | { id: string; kind: 'announcement'; community: Community; body: string; authorId?: string; createdAt: string; imageUrl?: string }
  | { id: string; kind: 'welcome';      community: Community; createdAt: string }
  | { id: string; kind: 'milestone';    community: Community; members: number; createdAt: string }
) & { score?: number; matchReason?: string[] };


// ─── Styles ──────────────────────────────────────────────────────────────────

const lh = StyleSheet.create({
  storiesWrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  divider:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  divLine:     { flex: 1, height: StyleSheet.hairlineWidth },
  divText:     { fontSize: 10, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1.2, textTransform: 'uppercase' },
});

const s = StyleSheet.create({
  root:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  headerAccent: { height: 2.5 },
  title:        { fontSize: 20, fontFamily: 'Poppins_700Bold', letterSpacing: -0.4 },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  subtitle:     { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  headerRight:  { flexDirection: 'row', gap: 8 },
  iconBtn:      { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  list:         { paddingTop: 4 },
  listDesktop:  { maxWidth: 680, width: '100%', alignSelf: 'center' },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon:    { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 4 },
  emptyTitle:   { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  emptySub:     { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },
  joinCta:      { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  joinCtaText:  { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#fff' },
});

const pm = StyleSheet.create({
  backdrop:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:       { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, paddingBottom: 34, minHeight: 320 },
  handle:      { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title:       { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  cancelBtn:   { width: 64 },
  cancelText:  { fontSize: 15, fontFamily: 'Poppins_400Regular' },
  postBtn:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, minWidth: 60, alignItems: 'center', height: 34, justifyContent: 'center' },
  postBtnText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#fff' },
  commScroll:  { maxHeight: 52 },
  commRow:     { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, maxWidth: 140 },
  chipText:    { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  input:       { minHeight: 120, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
  imagePreviewWrap: { marginHorizontal: 18, marginBottom: 12, height: 160, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: '100%' },
  removeImg:   { position: 'absolute', top: 8, right: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  toolbar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  toolbarBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: CultureTokens.indigo + '12', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  toolbarText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 8 },
  error:       { fontSize: 12, fontFamily: 'Poppins_500Medium', flex: 1 },
  charCount:   { fontSize: 11, fontFamily: 'Poppins_400Regular' },
});

const pc = StyleSheet.create({
  card:          { borderRadius: CardTokens.radius, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  accentLine:    { height: 3, width: '100%' },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingBottom: 10 },
  nameRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commName:      { fontSize: 14, fontFamily: 'Poppins_700Bold', flex: 1 },
  subRow:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  timeText:      { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  dot:           { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 1 },
  badge:         { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  moreBtn:       { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  eventImg:      { height: 196, position: 'relative', backgroundColor: '#111827' },
  dateBadge:     { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  dateBadgeText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.9)' },
  pricePill:     { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pricePillText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#fff' },
  eventBody:     { padding: 12, paddingTop: 10, gap: 5 },
  eventTitle:    { fontSize: 17, fontFamily: 'Poppins_700Bold', lineHeight: 22, letterSpacing: -0.3 },
  metaRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:      { fontSize: 12, fontFamily: 'Poppins_500Medium', flex: 1 },
  viewRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 2, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
  viewText:      { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  announcementWrapper: { position: 'relative' },
  postImg:          { height: 260, marginBottom: 10, backgroundColor: '#111827' },
  announcementWrap: { paddingLeft: 14, paddingRight: 14, paddingVertical: 12, marginHorizontal: 12, marginBottom: 10, borderLeftWidth: 3, borderRadius: 4 },
  announcementText: { fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 24 },
  welcomeInner:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  welcomeIconWrap:  { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle:     { fontSize: 14, fontFamily: 'Poppins_700Bold', lineHeight: 20 },
  welcomeSub:       { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18, marginTop: 2 },
  explorePill:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  explorePillText:  { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#fff' },
  milestoneWrap:    { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 12, marginTop: 4, padding: 14, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  milestoneGradient:{ ...StyleSheet.absoluteFillObject },
  trophyWrap:       { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  milestoneTitle:   { fontSize: 13, fontFamily: 'Poppins_700Bold', lineHeight: 18 },
  milestoneSub:     { fontSize: 11, fontFamily: 'Poppins_400Regular' },

  intelBadge:    { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: CultureTokens.indigo, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  intelText:     { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
});

const sb = StyleSheet.create({
  scroll:     { paddingHorizontal: 14, paddingVertical: 10, gap: 14 },
  item:       { alignItems: 'center', gap: 6 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: HeaderTokens.paddingVertical, paddingHorizontal: HeaderTokens.paddingHorizontal, borderBottomWidth: StyleSheet.hairlineWidth },
  ring:       { width: 62, height: 62, borderRadius: 31, padding: 2.5, alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { width: 55, height: 55, borderRadius: 27.5, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImg:  { width: 55, height: 55 },
  addCircle:  { width: 55, height: 55, borderRadius: 27.5, alignItems: 'center', justifyContent: 'center' },
  label:      { fontSize: 10, fontFamily: 'Poppins_500Medium', maxWidth: 62, textAlign: 'center' },
});

const cps = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, marginBottom: 8, borderRadius: 14, borderWidth: 1 },
  avatar:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  mockInput:  { flex: 1, height: 36, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, justifyContent: 'center' },
  placeholder:{ fontSize: 13, fontFamily: 'Poppins_400Regular' },
  imgBtn:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

const sk = StyleSheet.create({
  card:       { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  accentLine: { height: 3 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  avatar:     { width: 40, height: 40, borderRadius: 20 },
  image:      { height: 180 },
  bodyPad:    { padding: 12 },
  line:       { height: 12, borderRadius: 6 },
  reactions:  { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, padding: 12, gap: 16 },
  reactionBtn:{ height: 22, width: 60, borderRadius: 6 },
});

const gb = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 12, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  icon:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  sub:   { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  cta:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  ctaText:{ fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#fff' },
});


// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return (name || 'C').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function postCollection(kind: FeedPost['kind']): PostCollection {
  return kind === 'event' ? 'events' : 'communityPosts';
}

function postId(post: FeedPost): string {
  return post.kind === 'event' ? post.event.id : post.id;
}

/** Simple debounce — returns a stable fn that only fires after `ms` silence. */
function useDebounced<T extends (...args: Parameters<T>) => void>(fn: T, ms = 600): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), ms);
    },
    [fn, ms],
  ) as T;
}

// ─── Algorithm ────────────────────────────────────────────────────────────────

/**
 * CultureFeeds Intelligent Discovery Engine
 * Implements a multi-signal ranking formula based on:
 * culture (30%), location (20%), interest (15%), community (15%), social (10%), freshness (10%)
 */
function rankPosts(posts: FeedPost[], user: User | null): FeedPost[] {
  if (!posts.length) return [];
  if (!user) {
    // Guest fallback: sort by freshness only
    return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const userInterests = new Set((user.interests || []).map((i: string) => i.toLowerCase()));
  const followingIds  = new Set(user.communities || []);
  const cid           = user.culturalIdentity || {};
  const userCity      = (user.city || 'Sydney').toLowerCase();

  return posts.map(post => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Cultural Relevance (30%) — Highest Weight
    const cultureTags = (post.kind === 'event' ? post.event.cultureTag : post.community.tags) || [];
    const languageTags = (post.kind === 'event' ? post.event.languageTags : []) || [];
    
    let cultureScoreRaw = 0;
    const cultureOverlap = cultureTags.some((t: string) => {
      const lt = t.toLowerCase();
      return lt === cid.nationalityId?.toLowerCase() || cid.cultureIds?.some((id: string) => id.toLowerCase() === lt);
    });
    const languageOverlap = languageTags.some((t: string) => cid.languageIds?.some((id: string) => id.toLowerCase() === t.toLowerCase()));

    if (cultureOverlap) cultureScoreRaw += 0.8;
    if (languageOverlap) cultureScoreRaw += 0.2;
    
    if (cultureScoreRaw > 0) {
      score += (cultureScoreRaw * 0.30);
      reasons.push('Matches your cultural identity');
    }

    // 2. Location Relevance (20%)
    const postCity = (post.kind === 'event' ? post.event.city : post.community.city)?.toLowerCase();
    if (postCity === userCity) {
      score += 0.20;
      reasons.push(`Trending in ${userCity}`);
    } else if (postCity) {
      score += 0.05; // Base for same country
    }

    // 3. Interest Matching (15%)
    const contentTags = (post.kind === 'event' ? post.event.tags : post.community.tags) || [];
    let matchCount = 0;
    contentTags.forEach((tag: string) => {
      if (userInterests.has(tag.toLowerCase())) matchCount++;
    });
    if (matchCount > 0) {
      const interestScore = Math.min(1, matchCount / 3) * 0.15;
      score += interestScore;
      reasons.push(`${matchCount} interest match${matchCount > 1 ? 'es' : ''}`);
    }

    // 4. Community Affinity (15%)
    if (followingIds.has(post.community.id)) {
      score += 0.15;
      reasons.push('From your communities');
    } else {
      // Bonus if it's the same cultural group even if not followed
      if (cultureOverlap) score += 0.05;
    }

    // 5. Social Proof / Engagement (10%)
    let socialScore = 0;
    if (post.kind === 'event') {
      const attendance = post.event.attending || 0;
      socialScore = Math.min(1, attendance / 500); // Max out at 500 attendees for scaling
    } else if (post.kind === 'milestone') {
      socialScore = 1;
    }
    score += (socialScore * 0.10);

    // 6. Freshness / Time Decay (10%)
    const ageHrs = (Date.now() - new Date(post.createdAt).getTime()) / 3_600_000;
    const freshness = Math.exp(-ageHrs / 168); // Decays over a week
    score += (freshness * 0.10);

    return { ...post, score, matchReason: reasons };
  }).sort((a, b) => (b.score || 0) - (a.score || 0));
}



// ─── Auth gate ────────────────────────────────────────────────────────────────

function useAuthGate() {
  const { isAuthenticated } = useAuth();
  return useCallback(
    (action: () => void) => {
      if (!isAuthenticated) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        router.push('/(onboarding)/login');
        return;
      }
      action();
    },
    [isAuthenticated],
  );
}

// ─── Avatars ──────────────────────────────────────────────────────────────────

function CommAvatar({ community, size = 40, colorIdx = 0 }: {
  community: Community; size?: number; colorIdx?: number;
}) {
  const accent = ACCENT_COLORS[colorIdx % ACCENT_COLORS.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: accent + '22' }}>
      {community.imageUrl
        ? <Image source={{ uri: community.imageUrl }} style={{ width: size, height: size }} contentFit="cover" />
        : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: accent + '28' }}>
            <Text style={{ fontSize: size * 0.36, fontFamily: 'Poppins_700Bold', color: accent }}>
              {getInitials(community.name)}
            </Text>
          </View>
        )}
    </View>
  );
}

function UserAvatar({ name, avatarUrl, size = 34, colorIdx = 0 }: {
  name?: string | null; avatarUrl?: string | null; size?: number; colorIdx?: number;
}) {
  const accent = ACCENT_COLORS[colorIdx % ACCENT_COLORS.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: accent + '22' }}>
      {avatarUrl
        ? <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} contentFit="cover" />
        : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: accent + '28' }}>
            <Text style={{ fontSize: size * 0.36, fontFamily: 'Poppins_700Bold', color: accent }}>
              {getInitials(name || 'U')}
            </Text>
          </View>
        )}
    </View>
  );
}

// ─── Report modal ─────────────────────────────────────────────────────────────

const REPORT_REASONS = [
  'Spam or misleading',
  'Hate speech or discrimination',
  'Harassment or bullying',
  'Violence or dangerous content',
  'Nudity or sexual content',
  'Other',
];

function ReportModal({ visible, onClose, onReport, colors }: {
  visible: boolean;
  onClose: () => void;
  onReport: (reason: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [selected, setSelected] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try { onReport(selected); } finally { setSubmitting(false); onClose(); }
  }, [selected, submitting, onReport, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[rm.overlay, { backgroundColor: 'transparent' }]}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} onPress={onClose} />
        <View style={[rm.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[rm.title, { color: colors.text }]}>Report Post</Text>
              <Text style={[rm.sub, { color: colors.textSecondary }]}>Why are you reporting this?</Text>
              {REPORT_REASONS.map((r) => (
                <Pressable
                  key={r}
                  style={[rm.row, { borderColor: colors.borderLight },
                    selected === r && { borderColor: CultureTokens.indigo, backgroundColor: CultureTokens.indigo + '12' }]}
                  onPress={() => setSelected(r)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected === r }}
                >
                  <View style={[rm.radio, { borderColor: selected === r ? CultureTokens.indigo : colors.border }]}>
                    {selected === r && <View style={[rm.radioDot, { backgroundColor: CultureTokens.indigo }]} />}
                  </View>
                  <Text style={[rm.rowText, { color: colors.text }]}>{r}</Text>
                </Pressable>
              ))}
              <View style={rm.actions}>
                <Button variant="outline" size="md" onPress={onClose} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button variant="danger" size="md" onPress={handleSubmit} disabled={!selected || submitting} loading={submitting} style={{ flex: 1 }}>
                  Report
                </Button>
              </View>
            </View>
        </View>
    </Modal>
  );
}

const rm = StyleSheet.create({
  overlay:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 },
  card:      { width: '100%', maxWidth: 380, borderRadius: 18, borderWidth: 1, padding: 20, gap: 10 },
  title:     { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  sub:       { fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 4 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  radio:     { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot:  { width: 8, height: 8, borderRadius: 4 },
  rowText:   { fontSize: 14, fontFamily: 'Poppins_500Medium', flex: 1 },
  actions:   { flexDirection: 'row', gap: 10, marginTop: 6 },
  btn:       { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', height: 44 },
  cancelBtn: { borderWidth: 1 },
  submitBtn: {},
  btnText:   { fontSize: 14, fontFamily: 'Poppins_700Bold' },
});

// ─── Post action sheet ────────────────────────────────────────────────────────

function PostMoreMenu({ visible, onClose, onReport, onHide, isOwn, colors }: {
  visible: boolean;
  onClose: () => void;
  onReport: () => void;
  onHide: () => void;
  isOwn: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const items = isOwn
    ? [{ icon: 'trash-outline' as const, label: 'Delete post', color: CultureTokens.coral, action: onHide }]
    : [
        { icon: 'eye-off-outline' as const, label: 'Hide this post', color: colors.textSecondary, action: onHide },
        { icon: 'flag-outline' as const, label: 'Report post', color: CultureTokens.coral, action: onReport },
      ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[mm.overlay, { backgroundColor: 'transparent' }]}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={onClose} />
        <View style={[mm.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {items.map((item) => (
                <Pressable
                  key={item.label}
                  style={[mm.row, { borderBottomColor: colors.borderLight }]}
                  onPress={() => { onClose(); item.action(); }}
                  accessibilityRole="button"
                >
                  <Ionicons name={item.icon} size={20} color={item.color} />
                  <Text style={[mm.label, { color: item.color }]}>{item.label}</Text>
                </Pressable>
              ))}
              <Pressable style={mm.cancel} onPress={onClose} accessibilityRole="button">
                <Text style={[mm.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
            </View>
        </View>
    </Modal>
  );
}

const mm = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:      { borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, paddingBottom: 24, paddingTop: 8 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  label:      { fontSize: 15, fontFamily: 'Poppins_500Medium' },
  cancel:     { paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center' },
  cancelText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});

// ─── Comments sheet ───────────────────────────────────────────────────────────

function CommentsSheet({ visible, onClose, post, colors }: {
  visible: boolean;
  onClose: () => void;
  post: FeedPost;
  colors: ReturnType<typeof useColors>;
}) {
  const { isAuthenticated, user } = useAuth();
  const pid = postId(post);
  const pcol = postCollection(post.kind);

  const [comments, setComments] = useState<FeedComment[]>([]);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    const unsub = subscribeComments(pid, pcol, (c) => {
      setComments(c);
      // Auto-scroll to bottom on new messages
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsub;
  }, [visible, pid, pcol]);

  const handleSubmit = useCallback(async () => {
    if (!body.trim() || !user || submitting) return;
    setError('');
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(true);
    try {
      await addComment(pid, pcol, {
        authorId: user.id,
        authorName: user.username || user.email || 'User',
        authorAvatar: undefined,
        body: body.trim(),
      });
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  }, [body, user, pid, pcol, submitting]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[cs.overlay, { backgroundColor: 'transparent' }]}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} onPress={onClose} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={cs.kav}>
          <View style={[cs.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Handle */}
            <View style={[cs.handle, { backgroundColor: colors.border }]} />

            {/* Header */}
            <View style={[cs.header, { borderBottomColor: colors.borderLight }]}>
              <View>
                <Text style={[cs.title, { color: colors.text }]}>Comments</Text>
                {comments.length > 0 && (
                  <Text style={[cs.countLabel, { color: colors.textTertiary }]}>{comments.length} comment{comments.length !== 1 ? 's' : ''}</Text>
                )}
              </View>
              <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
                <View style={[cs.closeBtn, { backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </View>
              </Pressable>
            </View>

            {/* Comments list */}
            {comments.length === 0 ? (
              <View style={cs.empty}>
                <View style={[cs.emptyIcon, { backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name="chatbubbles-outline" size={28} color={colors.textTertiary} />
                </View>
                <Text style={[cs.emptyTitle, { color: colors.text }]}>No comments yet</Text>
                <Text style={[cs.emptyText, { color: colors.textSecondary }]}>
                  {isAuthenticated ? 'Be the first to comment!' : 'Sign in to join the conversation.'}
                </Text>
              </View>
            ) : (
              <ScrollView
                ref={listRef}
                style={cs.list}
                contentContainerStyle={cs.listContent}
                keyboardShouldPersistTaps="handled"
              >
                {comments.map((c, i) => (
                  <View key={c.id} style={cs.commentRow}>
                    <UserAvatar name={c.authorName} avatarUrl={c.authorAvatar} size={30} colorIdx={i} />
                    <View style={[cs.bubble, { backgroundColor: colors.surfaceElevated }]}>
                      <View style={cs.bubbleHeader}>
                        <Text style={[cs.commenterName, { color: colors.text }]}>{c.authorName}</Text>
                        <Text style={[cs.commentTime, { color: colors.textTertiary }]}>{timeAgo(c.createdAt)}</Text>
                      </View>
                      <Text style={[cs.commentBody, { color: colors.textSecondary }]}>{c.body}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Error */}
            {error ? (
              <Text style={[cs.error, { color: CultureTokens.coral }]}>{error}</Text>
            ) : null}

            {/* Input / Sign-in CTA */}
            {isAuthenticated ? (
              <View style={[cs.inputRow, { borderTopColor: colors.borderLight, backgroundColor: colors.surface }]}>
                <UserAvatar name={user?.username} size={30} colorIdx={0} />
                <TextInput
                  style={[cs.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                  placeholder="Add a comment…"
                  placeholderTextColor={colors.textTertiary}
                  value={body}
                  onChangeText={(t) => { setBody(t); setError(''); }}
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit}
                  maxLength={300}
                  multiline
                />
                <Pressable
                  style={[cs.sendBtn, { backgroundColor: body.trim() ? CultureTokens.indigo : colors.border }]}
                  onPress={handleSubmit}
                  disabled={!body.trim() || submitting}
                  accessibilityRole="button"
                  accessibilityLabel="Send comment"
                >
                  {submitting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="send" size={14} color="#fff" />}
                </Pressable>
              </View>
            ) : (
              <View style={{ padding: 16 }}>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  leftIcon="log-in-outline"
                  onPress={() => { onClose(); router.push('/(onboarding)/login'); }}
                >
                  Sign in to join the conversation
                </Button>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const cs = StyleSheet.create({
  overlay:      { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  kav:          { maxHeight: '88%' },
  sheet:        { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderBottomWidth: 0, minHeight: 320 },
  handle:       { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  title:        { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  countLabel:   { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  closeBtn:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  empty:        { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyIcon:    { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:   { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  emptyText:    { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  list:         { maxHeight: 320 },
  listContent:  { padding: 14, gap: 10 },
  commentRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bubble:       { flex: 1, borderRadius: 14, padding: 10, gap: 3 },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commenterName:{ fontSize: 12, fontFamily: 'Poppins_700Bold' },
  commentBody:  { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  commentTime:  { fontSize: 10, fontFamily: 'Poppins_400Regular' },
  error:        { fontSize: 12, fontFamily: 'Poppins_500Medium', paddingHorizontal: 18, paddingTop: 4 },
  inputRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  input:        { flex: 1, minHeight: 38, maxHeight: 80, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, fontFamily: 'Poppins_400Regular' },
  sendBtn:      { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  signInBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, padding: 14, borderRadius: 14 },
  signInText:   { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
});

// ─── Reactions bar ────────────────────────────────────────────────────────────

function ReactionsBar({ post, colors }: {
  post: FeedPost;
  colors: ReturnType<typeof useColors>;
}) {
  const { isAuthenticated, user } = useAuth();
  const gate = useAuthGate();

  const pid  = postId(post);
  const pcol = postCollection(post.kind);

  // Seeded initial from post id so the number is stable before Firestore loads
  const seedCount = post.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 40 + 3;

  const [liked,        setLiked]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(seedCount);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [likeError,    setLikeError]    = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Real-time liked state for this user
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const unsub = subscribeLiked(pid, pcol, user.id, setLiked);
    return unsub;
  }, [isAuthenticated, user?.id, pid, pcol]);

  // Real-time like count
  useEffect(() => {
    const unsub = subscribeLikeCount(pid, pcol, (n) => {
      // Only update if Firestore has data (n > 0 or post actually changed)
      if (n > 0) setLikeCount(n);
    });
    return unsub;
  }, [pid, pcol]);

  // Real-time comment count
  useEffect(() => {
    const unsub = subscribeCommentCount(pid, pcol, setCommentCount);
    return unsub;
  }, [pid, pcol]);

  // Debounced like — prevents rapid spam-toggle (Firestore transaction cost + rate-limit protection)
  const doToggleLike = useCallback(async () => {
    if (!user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const wasLiked = liked;
    // Optimistic update
    setLiked(!wasLiked);
    setLikeCount((v) => Math.max(0, wasLiked ? v - 1 : v + 1));
    setLikeError(false);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.45, useNativeDriver: true, speed: 40 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 25 }),
    ]).start();
    try {
      await toggleLike(pid, pcol, user.id);
    } catch {
      // Revert on error
      setLiked(wasLiked);
      setLikeCount((v) => Math.max(0, wasLiked ? v + 1 : v - 1));
      setLikeError(true);
    }
  }, [user, liked, pid, pcol, scaleAnim]);

  const debouncedLike = useDebounced(doToggleLike, 500);

  const handleLike = useCallback(() => {
    gate(debouncedLike);
  }, [gate, debouncedLike]);

  const handleComment = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowComments(true);
  }, []);

  const handleShare = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const title   = post.kind === 'event' ? post.event.title : `${post.community.name} update`;
    const message = post.kind === 'event'
      ? `Check out "${post.event.title}" on CulturePass!`
      : `Check out this update from ${post.community.name} on CulturePass!`;
    try { await Share.share({ message, title }); } catch { /* user cancelled */ }
  }, [post]);

  return (
    <>
      <View style={[rb.wrap, { borderTopColor: colors.borderLight }]}>
        {/* Like */}
        <Pressable
          style={rb.action}
          onPress={handleLike}
          accessibilityRole="button"
          accessibilityLabel={`Like — ${likeCount} likes`}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={likeError ? CultureTokens.coral + '80' : liked ? CultureTokens.coral : colors.textSecondary}
            />
          </Animated.View>
          <Text style={[rb.count, { color: liked ? CultureTokens.coral : colors.textSecondary }]}>
            {likeCount > 0 ? likeCount : ''}
          </Text>
        </Pressable>

        {/* Comment */}
        <Pressable
          style={rb.action}
          onPress={handleComment}
          accessibilityRole="button"
          accessibilityLabel={`Comment — ${commentCount} comments`}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
          <Text style={[rb.count, { color: colors.textSecondary }]}>
            {commentCount > 0 ? commentCount : ''}
          </Text>
        </Pressable>

        {/* Share */}
        <Pressable
          style={rb.action}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          <Ionicons name="arrow-redo-outline" size={19} color={colors.textSecondary} />
          <Text style={[rb.label, { color: colors.textSecondary }]}>Share</Text>
        </Pressable>
      </View>

      <CommentsSheet
        visible={showComments}
        onClose={() => setShowComments(false)}
        post={post}
        colors={colors}
      />
    </>
  );
}

const rb = StyleSheet.create({
  wrap:   { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 4, paddingHorizontal: 6 },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8 },
  count:  { fontSize: 13, fontFamily: 'Poppins_600SemiBold', minWidth: 14 },
  label:  { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
});

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, colorIdx }: { post: FeedPost; colorIdx: number }) {
  const colors  = useColors();
  const accent  = ACCENT_COLORS[colorIdx % ACCENT_COLORS.length];
  const { user, isAuthenticated } = useAuth();
  const gate    = useAuthGate();

  const [hidden,     setHidden]     = useState(false);
  const [showMore,   setShowMore]   = useState(false);
  const [showReport, setShowReport] = useState(false);

  const isOwn = isAuthenticated && user?.id === (post as { authorId?: string }).authorId;

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (post.kind === 'event') {
      router.push({ pathname: '/event/[id]', params: { id: post.event.id } });
    } else {
      router.push({ pathname: '/community/[id]', params: { id: post.community.id } } as never);
    }
  }, [post]);

  const handleReport = useCallback((reason: string) => {
    if (!user) return;
    reportPost(user.id, postId(post), postCollection(post.kind), reason).catch(() => {});
  }, [user, post]);

  const handleMorePress = useCallback(() => {
    gate(() => setShowMore(true));
  }, [gate]);

  if (hidden) return null;

  const renderContent = () => {
    switch (post.kind) {
      case 'event': {
        const ev = post.event;
        return (
          <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={`View event: ${ev.title}`}>
            <View style={pc.eventImg}>

              <Image
                source={{ uri: ev.imageUrl ?? undefined }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                transition={200}
              />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={StyleSheet.absoluteFillObject} />
              {/* Date badge */}
              <View style={[pc.dateBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.8)" />
                <Text style={pc.dateBadgeText}>{formatEventDateTime(ev.date, ev.time)}</Text>
              </View>
              {/* Price/free pill */}
              <View style={[pc.pricePill, { backgroundColor: ev.isFree || ev.priceCents === 0 ? CultureTokens.teal : accent }]}>
                <Ionicons name="ticket-outline" size={10} color="#fff" />
                <Text style={pc.pricePillText}>
                  {ev.isFree || ev.priceCents === 0 ? 'Free' : ev.priceLabel ?? 'Tickets'}
                </Text>
              </View>
            </View>
            <View style={pc.eventBody}>
              <Text style={[pc.eventTitle, { color: colors.text }]} numberOfLines={2}>{ev.title}</Text>
              {(ev.venue || ev.city) && (
                <View style={pc.metaRow}>
                  <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
                  <Text style={[pc.metaText, { color: colors.textTertiary }]} numberOfLines={1}>
                    {[ev.venue, ev.city].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              )}
              <View style={[pc.viewRow, { borderColor: accent + '50' }]}>
                <Text style={[pc.viewText, { color: accent }]}>View Event</Text>
                <Ionicons name="chevron-forward" size={13} color={accent} />
              </View>
            </View>
          </Pressable>
        );
      }

      case 'announcement':
        return (
          <Pressable onPress={handlePress} style={pc.announcementWrapper}>
            {post.imageUrl && (
              <View style={pc.postImg}>
                <Image
                  source={{ uri: post.imageUrl }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  transition={200}
                />
              </View>
            )}
            <View style={[pc.announcementWrap, { borderLeftColor: accent }]}>
              <Text style={[pc.announcementText, { color: colors.text }]}>{post.body}</Text>
            </View>
          </Pressable>
        );


      case 'welcome':
        return (
          <Pressable onPress={handlePress} style={{ overflow: 'hidden' }}>
            <LinearGradient colors={[accent + '18', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <View style={pc.welcomeInner}>
              <View style={[pc.welcomeIconWrap, { backgroundColor: accent + '22' }]}>
                <Ionicons name="people" size={26} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[pc.welcomeTitle, { color: colors.text }]}>
                  Welcome to {post.community.name}!
                </Text>
                <Text style={[pc.welcomeSub, { color: colors.textSecondary }]} numberOfLines={2}>
                  {post.community.description || 'Join to stay updated on cultural events and activities.'}
                </Text>
              </View>
            </View>
            <View style={[pc.explorePill, { backgroundColor: accent, marginHorizontal: 14, marginBottom: 14 }]}>
              <Text style={pc.explorePillText}>Explore Community</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </View>
          </Pressable>
        );

      case 'milestone':
        return (
          <Pressable onPress={handlePress} style={[pc.milestoneWrap, { borderColor: accent + '35', backgroundColor: accent + '0C' }]}>
            <LinearGradient colors={[accent + '20', 'transparent']} style={pc.milestoneGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={[pc.trophyWrap, { backgroundColor: accent + '22' }]}>
              <Ionicons name="trophy" size={24} color={accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[pc.milestoneTitle, { color: colors.text }]}>
                🎉 {post.community.name} reached {post.members.toLocaleString()} members!
              </Text>
              <Text style={[pc.milestoneSub, { color: colors.textSecondary }]}>
                Be part of the growing community
              </Text>
            </View>
          </Pressable>
        );
    }
  };

  const badge = post.kind === 'event'
    ? { icon: 'calendar-outline' as const, label: 'Event', color: CultureTokens.saffron }
    : post.kind === 'announcement'
      ? { icon: 'megaphone-outline' as const, label: 'Announcement', color: CultureTokens.teal }
      : null;

  return (
    <>
      <View style={[pc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, position: 'relative' }]}>
        {/* Intelligent Badge */}
        {isAuthenticated && post.matchReason && post.matchReason.length > 0 && (post.score || 0) > 0.4 && (
          <View style={[pc.intelBadge, { backgroundColor: accent + 'E0', zIndex: 10 }]}>
            <Ionicons name="sparkles" size={10} color="#fff" />
            <Text style={pc.intelText}>{post.matchReason[0]}</Text>
          </View>
        )}

        {/* Accent line */}
        <View style={[pc.accentLine, { backgroundColor: accent }]} />

        {/* Header */}
        <View style={pc.header}>
          <CommAvatar community={post.community} size={40} colorIdx={colorIdx} />
          <View style={{ flex: 1 }}>
            <View style={pc.nameRow}>
              <Text style={[pc.commName, { color: colors.text }]} numberOfLines={1}>
                {post.community.name}
              </Text>
              {post.community.isVerified && (
                <Ionicons name="checkmark-circle" size={13} color={CultureTokens.indigo} />
              )}
            </View>
            <View style={pc.subRow}>
              <Text style={[pc.timeText, { color: colors.textTertiary }]}>{timeAgo(post.createdAt)}</Text>
              {badge && (
                <>
                  <View style={[pc.dot, { backgroundColor: colors.textTertiary }]} />
                  <Ionicons name={badge.icon} size={10} color={badge.color} />
                  <Text style={[pc.badge, { color: badge.color }]}>{badge.label}</Text>
                </>
              )}
            </View>
          </View>
          <Pressable
            style={[pc.moreBtn, { backgroundColor: colors.surfaceElevated }]}
            onPress={handleMorePress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Post options"
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        {renderContent()}
        <ReactionsBar post={post} colors={colors} />
      </View>

      <PostMoreMenu
        visible={showMore}
        onClose={() => setShowMore(false)}
        onReport={() => setShowReport(true)}
        onHide={() => setHidden(true)}
        isOwn={isOwn}
        colors={colors}
      />
      <ReportModal
        visible={showReport}
        onClose={() => setShowReport(false)}
        onReport={handleReport}
        colors={colors}
      />
    </>
  );
}



// ─── Stories bar ──────────────────────────────────────────────────────────────

function StoriesBar({ communities, authUser, colors, isAuthenticated, onCreatePost }: {
  communities: Community[];
  authUser: { displayName?: string | null; avatarUrl?: string | null } | null;
  colors: ReturnType<typeof useColors>;
  isAuthenticated: boolean;
  onCreatePost: () => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={sb.scroll}
      accessibilityRole="list"
    >
      {/* Your Story / Sign in CTA */}
      <Pressable style={sb.item} onPress={onCreatePost} accessibilityRole="button" accessibilityLabel="Create post">
        <LinearGradient colors={gradients.culturepassBrand as [string, string, string]} style={sb.ring}>
          <View style={[sb.avatarWrap, { backgroundColor: colors.background }]}>
            {isAuthenticated && authUser?.avatarUrl
              ? <Image source={{ uri: authUser.avatarUrl }} style={sb.avatarImg} contentFit="cover" />
              : (
                <View style={[sb.addCircle, { backgroundColor: CultureTokens.indigo + '18' }]}>
                  <Ionicons name={isAuthenticated ? 'add' : 'person'} size={22} color={CultureTokens.indigo} />
                </View>
              )}
          </View>
        </LinearGradient>
        <Text style={[sb.label, { color: colors.textSecondary }]} numberOfLines={1}>
          {isAuthenticated ? 'Your Story' : 'Sign In'}
        </Text>
      </Pressable>

      {communities.slice(0, 12).map((comm, i) => {
        const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
        return (
          <Pressable
            key={comm.id}
            style={sb.item}
            onPress={() => router.push({ pathname: '/community/[id]', params: { id: comm.id } } as never)}
            accessibilityRole="button"
            accessibilityLabel={comm.name}
          >
            <LinearGradient colors={[accent, accent + '70']} style={sb.ring}>
              <View style={[sb.avatarWrap, { backgroundColor: colors.background }]}>
                <CommAvatar community={comm} size={50} colorIdx={i} />
              </View>
            </LinearGradient>
            <Text style={[sb.label, { color: colors.textSecondary }]} numberOfLines={1}>
              {comm.name.split(' ')[0]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}



// ─── Create post stub ─────────────────────────────────────────────────────────

function CreatePostStub({ authUser, colors, onPress, isAuthenticated }: {
  authUser: { displayName?: string | null; avatarUrl?: string | null } | null;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
  isAuthenticated: boolean;
}) {
  return (
    <Pressable
      style={[cps.wrap, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isAuthenticated ? 'Create a post' : 'Sign in to post'}
    >
      <View style={[cps.avatar, { backgroundColor: CultureTokens.indigo + '18' }]}>
        {isAuthenticated && authUser?.avatarUrl
          ? <Image source={{ uri: authUser.avatarUrl }} style={{ width: 36, height: 36 }} contentFit="cover" />
          : <Ionicons name={isAuthenticated ? 'person' : 'log-in-outline'} size={17} color={CultureTokens.indigo} />
        }
      </View>
      <View style={[cps.mockInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
        <Text style={[cps.placeholder, { color: colors.textTertiary }]}>
          {isAuthenticated ? 'Share something with your community…' : 'Sign in to post to your community…'}
        </Text>
      </View>
      {isAuthenticated && (
        <View style={[cps.imgBtn, { backgroundColor: CultureTokens.indigo + '12' }]}>
          <Ionicons name="image-outline" size={18} color={CultureTokens.indigo} />
        </View>
      )}
    </Pressable>
  );
}



// ─── Create post modal ────────────────────────────────────────────────────────

function CreatePostModal({ visible, onClose, onSubmit, communities, colors }: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (communityId: string, communityName: string, body: string, imageUri?: string) => void;
  communities: Community[];
  colors: ReturnType<typeof useColors>;
}) {
  const [body,         setBody]         = useState('');
  const [selectedComm, setSelectedComm] = useState<Community | null>(null);
  const [imageUri,     setImageUri]     = useState<string | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    if (visible && communities.length > 0 && !selectedComm) setSelectedComm(communities[0]);
  }, [visible, communities, selectedComm]);

  const handleClose = useCallback(() => {
    setBody('');
    setImageUri(null);
    setError('');
    onClose();
  }, [onClose]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Permission to access library was denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!body.trim() || !selectedComm || submitting) return;
    if (body.trim().length > 500) { setError('Post must be under 500 characters.'); return; }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(selectedComm.id, selectedComm.name, body.trim(), imageUri || undefined);
      setBody('');
      setImageUri(null);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post.');
    } finally {
      setSubmitting(false);
    }
  }, [body, selectedComm, submitting, onSubmit, onClose, imageUri]);


  const remaining = 500 - body.length;
  const canPost   = body.trim().length > 0 && selectedComm !== null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[pm.backdrop, { backgroundColor: 'transparent' }]}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]} onPress={Keyboard.dismiss} />
          <View style={[pm.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[pm.handle, { backgroundColor: colors.border }]} />

                {/* Header */}
                <View style={[pm.header, { borderBottomColor: colors.borderLight }]}>
                  <Button variant="ghost" size="sm" onPress={handleClose}>
                    Cancel
                  </Button>
                  <Text style={[pm.title, { color: colors.text }]}>Create Post</Text>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={handleSubmit}
                    disabled={!canPost}
                    loading={submitting}
                  >
                    Post
                  </Button>
                </View>

                {/* Community picker */}
                {communities.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={pm.commScroll}
                    contentContainerStyle={pm.commRow}
                  >
                    {communities.slice(0, 8).map((c) => {
                      const active = selectedComm?.id === c.id;
                      return (
                        <Pressable
                          key={c.id}
                          style={[pm.chip, { borderColor: active ? CultureTokens.indigo : colors.border, backgroundColor: active ? CultureTokens.indigo : colors.background }]}
                          onPress={() => setSelectedComm(c)}
                        >
                          <Text style={[pm.chipText, { color: active ? '#fff' : colors.textSecondary }]} numberOfLines={1}>{c.name}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}

                {/* Text area */}
                <TextInput
                  style={[pm.input, { color: colors.text }]}
                  placeholder={`Share something with ${selectedComm?.name ?? 'your community'}…`}
                  placeholderTextColor={colors.textTertiary}
                  value={body}
                  onChangeText={(t) => { setBody(t); setError(''); }}
                  multiline
                  maxLength={500}
                  autoFocus
                  textAlignVertical="top"
                />

                {/* Optional Image Preview */}
                {imageUri && (
                  <View style={pm.imagePreviewWrap}>
                    <Image source={{ uri: imageUri }} style={pm.imagePreview} contentFit="cover" />
                    <Pressable style={pm.removeImg} onPress={() => setImageUri(null)}>
                      <Ionicons name="close-circle" size={24} color="#fff" />
                    </Pressable>
                  </View>
                )}

                {/* Toolbar */}
                <View style={[pm.toolbar, { borderTopColor: colors.borderLight }]}>
                  <Pressable style={pm.toolbarBtn} onPress={pickImage}>
                    <Ionicons name="image-outline" size={22} color={CultureTokens.indigo} />
                    <Text style={[pm.toolbarText, { color: CultureTokens.indigo }]}>Photo</Text>
                  </Pressable>
                </View>


                {/* Footer: error + char count */}
                <View style={pm.footer}>
                  {error ? <Text style={[pm.error, { color: CultureTokens.coral }]}>{error}</Text> : <View />}
                  <Text style={[pm.charCount, { color: remaining < 50 ? CultureTokens.coral : colors.textTertiary }]}>
                    {remaining}
                  </Text>
                </View>
              </View>
          </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}



// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard({ colors }: { colors: ReturnType<typeof useColors> }) {
  const anim = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 0.9, duration: 900, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.35, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [anim]);
  const bg = { backgroundColor: colors.borderLight, opacity: anim };
  return (
    <View style={[sk.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <Animated.View style={[sk.accentLine, bg]} />
      <View style={sk.header}>
        <Animated.View style={[sk.avatar, bg]} />
        <View style={{ flex: 1, gap: 7 }}>
          <Animated.View style={[sk.line, { width: '52%' }, bg]} />
          <Animated.View style={[sk.line, { width: '33%' }, bg]} />
        </View>
      </View>
      <Animated.View style={[sk.image, bg]} />
      <View style={sk.bodyPad}>
        <Animated.View style={[sk.line, { width: '88%' }, bg]} />
        <Animated.View style={[sk.line, { width: '65%', marginTop: 6 }, bg]} />
      </View>
      <View style={[sk.reactions, { borderTopColor: colors.borderLight }]}>
        {[0, 1, 2].map((i) => (
          <Animated.View key={i} style={[sk.reactionBtn, bg]} />
        ))}
      </View>
    </View>
  );
}



// ─── Guest banner ─────────────────────────────────────────────────────────────

function GuestBanner({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable
      style={[gb.wrap, { borderColor: CultureTokens.indigo + '40' }]}
      onPress={() => router.push('/(onboarding)/login')}
      accessibilityRole="button"
      accessibilityLabel="Sign in to interact with the feed"
    >
      <LinearGradient
        colors={[CultureTokens.indigo + '18', CultureTokens.teal + '10']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <View style={[gb.icon, { backgroundColor: CultureTokens.indigo + '20' }]}>
        <Ionicons name="people-circle-outline" size={22} color={CultureTokens.indigo} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[gb.title, { color: colors.text }]}>Join the conversation</Text>
        <Text style={[gb.sub, { color: colors.textSecondary }]}>Sign in to like, comment, and post</Text>
      </View>
      <View style={[gb.cta, { backgroundColor: CultureTokens.indigo }]}>
        <Text style={gb.ctaText}>Sign In</Text>
      </View>
    </Pressable>
  );
}



// ─── Main screen ──────────────────────────────────────────────────────────────

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

  const { data: events = [], isLoading: eventsLoading } = useQuery<EventData[]>({
    queryKey: ['/api/events', state.country, state.city, 'feed'],
    queryFn: async () => {
      const res = await api.events.list({ city: state.city, country: state.country, pageSize: 40 });
      return res.events ?? [];
    },
    staleTime: 3 * 60 * 1000,
  });

  const { data: communities = [], isLoading: commLoading } = useQuery<Community[]>({
    queryKey: ['/api/communities', state.city, state.country, 'feed'],
    queryFn: () => api.communities.list({ city: state.city, country: state.country }),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = eventsLoading || commLoading;

  const handleOpenCreatePost = useCallback(() => {
    gate(() => setShowCreatePost(true));
  }, [gate]);

  const handleNewPost = useCallback(async (communityId: string, communityName: string, body: string, imageUri?: string) => {
    if (!authUser) return;
    const comm = communities.find((c) => c.id === communityId);
    if (!comm) return;

    // Optimistic local post (use local URI for immediate display)
    const tempPost: FeedPost = {
      id: `local-${Date.now()}`,
      kind: 'announcement',
      community: comm,
      body,
      authorId: authUser.id,
      createdAt: new Date().toISOString(),
      imageUrl: imageUri,
    };

    setLocalPosts((prev) => [tempPost, ...prev]);

    // Background upload + creation
    (async () => {
      try {
        let finalImageUrl = undefined;
        if (imageUri) {
          finalImageUrl = await uploadPostImage(imageUri, authUser.id);
        }

        await createCommunityPost({
          authorId: authUser.id,
          authorName: authUser.username || authUser.email || 'User',
          communityId,
          communityName,
          body,
          imageUrl: finalImageUrl,
        });
      } catch (err) {
        console.error('[CultureFeed] Failed to create post:', err);
        // Maybe show an error toast here if we had one
      }
    })();
  }, [authUser, communities]);


  const posts = useMemo<FeedPost[]>(() => {
    const raw: FeedPost[] = [...localPosts];
    if (!communities.length && !events.length) return raw;
    const now = Date.now();
    const maxItems = Math.max(events.length, communities.length);

    for (let i = 0; i < Math.min(maxItems, 30); i++) {
      const comm = communities[i % communities.length];
      if (!comm) continue;

      if (i < events.length && events[i]) {
        raw.push({
          id: `ev-${events[i].id}-${i}`,
          kind: 'event',
          event: events[i],
          community: comm,
          createdAt: new Date(now - i * 3_600_000).toISOString(),
        });
      }

      if (i % 3 === 1 && communities[i]) {
        const seed = SEED_ANNOUNCEMENTS[i % SEED_ANNOUNCEMENTS.length];
        raw.push({
          id: `ann-${communities[i].id}-${i}`,
          kind: 'announcement',
          community: communities[i],
          body: seed.body,
          imageUrl: seed.img || undefined,
          createdAt: new Date(now - i * 7_200_000).toISOString(),
        });

      } else if (i % 5 === 0 && communities[i]) {
        const c = communities[i];
        raw.push(
          (c.membersCount ?? 0) > 100
            ? { id: `ms-${c.id}-${i}`, kind: 'milestone', community: c, members: c.membersCount ?? 120, createdAt: new Date(now - i * 10_800_000).toISOString() }
            : { id: `wc-${c.id}-${i}`, kind: 'welcome',   community: c,                                  createdAt: new Date(now - i * 10_800_000).toISOString() },
        );
      }
    }
    return rankPosts(raw, authUser as any);
  }, [events, communities, localPosts, authUser]);


  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['/api/events', state.country, state.city, 'feed'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/communities', state.city, state.country, 'feed'] }),
    ]);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(false);
  }, [queryClient, state.city, state.country]);

  const country = state.country || 'Australia';
  const countryFlag = { Australia: '🇦🇺', 'New Zealand': '🇳🇿', UAE: '🇦🇪', UK: '🇬🇧', Canada: '🇨🇦' }[country] ?? '🇦🇺';
  const locationLabel = state.city
    ? `${state.city}${state.country ? `, ${state.country}` : ''}`
    : state.country || 'Australia';

  const renderPost = useCallback(
    ({ item, index }: { item: FeedPost; index: number }) => <PostCard post={item} colorIdx={index} />,
    [],
  );

  const ListHeader = useMemo(() => (
    <View>
      {/* Stories */}
      {communities.length > 0 && (
        <View style={[lh.storiesWrap, { borderBottomColor: colors.borderLight }]}>
          <StoriesBar
            communities={communities}
            authUser={authUser ?? null}
            colors={colors}
            isAuthenticated={isAuthenticated}
            onCreatePost={handleOpenCreatePost}
          />
        </View>
      )}

      {/* Composer stub */}
      <View style={{ paddingHorizontal: hPad, marginTop: 10 }}>
        <CreatePostStub
          authUser={authUser ?? null}
          colors={colors}
          isAuthenticated={isAuthenticated}
          onPress={handleOpenCreatePost}
        />
      </View>

      {/* Guest banner */}
      {!isAuthenticated && (
        <View style={{ paddingHorizontal: hPad }}>
          <GuestBanner colors={colors} />
        </View>
      )}

      {/* Divider */}
      <View style={[lh.divider, { paddingHorizontal: hPad }]}>
        <View style={[lh.divLine, { backgroundColor: colors.borderLight }]} />
        <Text style={[lh.divText, { color: colors.textTertiary }]}>Community Updates</Text>
        <View style={[lh.divLine, { backgroundColor: colors.borderLight }]} />
      </View>
    </View>
  ), [communities, colors, authUser, isAuthenticated, hPad, handleOpenCreatePost]);

  return (
    <ErrorBoundary>
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={gradients.culturepassBrand as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Status-bar inset fill */}
          <View style={{ height: topInset }} />

          {/* Header */}
          <View style={[s.header, { paddingHorizontal: hPad, borderBottomWidth: 0 }]}>
            <View>
              <Text style={[s.title, { color: '#fff' }]}>Culture Feed</Text>
              <View style={s.locationRow}>
                <Text style={{ fontSize: 14 }}>{countryFlag}</Text>
                <Text style={[s.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>{locationLabel}</Text>
              </View>
            </View>
            <View style={s.headerRight}>
              <LocationPicker
                variant="icon"
                iconColor="#fff"
                buttonStyle={{ ...s.iconBtn, backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }}
              />
              <Pressable
                style={[s.iconBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }]}
                onPress={() => router.push('/search')}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <Ionicons name="search-outline" size={18} color="#fff" />
              </Pressable>
              <Pressable
                style={[s.iconBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }]}
                onPress={() => gate(() => router.push('/notifications'))}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        </LinearGradient>


        {isLoading ? (
          <ScrollView contentContainerStyle={{ padding: hPad, paddingTop: 12 }} scrollEnabled={false}>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} colors={colors} />)}
          </ScrollView>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={renderPost}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={[
              s.list,
              { paddingHorizontal: hPad, paddingBottom: bottomInset + 88 },
              isDesktop && s.listDesktop,
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
              <View style={s.empty}>
                <View style={[s.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <Ionicons name="chatbubbles-outline" size={32} color={colors.textTertiary} />
                </View>
                <Text style={[s.emptyTitle, { color: colors.text }]}>No community updates yet</Text>
                <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                  Join communities to see their updates here
                </Text>
                <Pressable
                  style={[s.joinCta, { backgroundColor: CultureTokens.indigo }]}
                  onPress={() => router.push('/(tabs)/community')}
                  accessibilityRole="button"
                >
                  <Text style={s.joinCtaText}>Browse Communities</Text>
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


