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
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, CardTokens, gradients, HeaderTokens, shadows } from '@/constants/theme';
import { api } from '@/lib/api';
import { getCommunityHeadline } from '@/lib/community';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LocationPicker } from '@/components/LocationPicker';
import { HeaderAvatar } from '@/components/ui/HeaderAvatar';
import { Button } from '@/components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { timeAgo } from '@/lib/dateUtils';
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
import type { EventData, Community } from '@/shared/schema';


// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT_COLORS = [
  CultureTokens.indigo, CultureTokens.teal, CultureTokens.coral,
  CultureTokens.saffron, CultureTokens.gold, '#7C3AED', '#059669',
];



// ─── Types ────────────────────────────────────────────────────────────────────

type FeedFilter = 'for-you' | 'events' | 'communities';

type FeedPost = (
  | { id: string; kind: 'event';        event: EventData;    community: Community; createdAt: string }
  | { id: string; kind: 'announcement'; community: Community; body: string; authorId?: string; imageUrl?: string; likesCount?: number; commentsCount?: number; createdAt: string }
  | { id: string; kind: 'welcome';      community: Community; createdAt: string }
  | { id: string; kind: 'milestone';    community: Community; members: number; createdAt: string }
  | { id: string; kind: 'collection-highlight'; community: Community; tokenName: string; tokenImage: string; userName: string; createdAt: string }
) & { score?: number; matchReason?: string[] };


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

/** Returns "Today", "Tomorrow", "Sat 22 Mar", or "22 Mar" */
function getDateLabel(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const eventMs = new Date(d).setHours(0, 0, 0, 0);
  const diffDays = Math.round((eventMs - todayMs) / 86_400_000);
  if (diffDays < 0) return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 6) return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
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


// ─── Styles ──────────────────────────────────────────────────────────────────

const lh = StyleSheet.create({
  storiesWrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  divider:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  divLine:     { flex: 1, height: StyleSheet.hairlineWidth },
  divText:     { fontSize: 10, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1.2, textTransform: 'uppercase', lineHeight: 14 },
});

const ft = StyleSheet.create({
  bar:       { paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  tab:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  tabText:   { fontSize: 13, fontFamily: 'Poppins_600SemiBold', lineHeight: 18 },
  badge:     { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontSize: 10, fontFamily: 'Poppins_700Bold', lineHeight: 14 },
});

const s = StyleSheet.create({
  root:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  title:        { fontSize: 20, fontFamily: 'Poppins_700Bold', letterSpacing: -0.4, lineHeight: 26 },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  subtitle:     { fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 15 },
  headerRight:  { flexDirection: 'row', gap: 8 },
  iconBtn:      { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  list:         { paddingTop: 4 },
  listDesktop:  { maxWidth: 800, width: '100%', alignSelf: 'center' },
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon:    { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 4 },
  emptyTitle:   { fontSize: 17, fontFamily: 'Poppins_700Bold', lineHeight: 24 },
  emptySub:     { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },
  joinCta:      { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  joinCtaText:  { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 18 },
});

const pm = StyleSheet.create({
  backdrop:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:       { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, paddingBottom: 34, minHeight: 320 },
  handle:      { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title:       { fontSize: 16, fontFamily: 'Poppins_600SemiBold', lineHeight: 22 },
  cancelBtn:   { width: 64 },
  cancelText:  { fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
  postBtn:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, minWidth: 60, alignItems: 'center', height: 34, justifyContent: 'center' },
  postBtnText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 18 },
  commScroll:  { maxHeight: 52 },
  commRow:     { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, maxWidth: 140 },
  chipText:    { fontSize: 12, fontFamily: 'Poppins_500Medium', lineHeight: 17 },
  input:       { minHeight: 120, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
  imagePreviewWrap: { marginHorizontal: 18, marginBottom: 12, height: 160, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: '100%' },
  removeImg:   { position: 'absolute', top: 8, right: 8, ...shadows.small },
  toolbar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  toolbarBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: CultureTokens.indigo + '12', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  toolbarText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', lineHeight: 18 },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 8 },
  error:       { fontSize: 12, fontFamily: 'Poppins_500Medium', flex: 1, lineHeight: 17 },
  charCount:   { fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 15 },
});

const pc = StyleSheet.create({
  card:          { borderRadius: CardTokens.radius, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  accentLine:    { height: 3, width: '100%' },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingBottom: 10 },
  nameRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commName:      { fontSize: 14, fontFamily: 'Poppins_700Bold', flex: 1, lineHeight: 20 },
  subRow:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1, flexWrap: 'wrap' },
  timeText:      { fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 15 },
  dot:           { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 1 },
  badge:         { fontSize: 10, fontFamily: 'Poppins_600SemiBold', lineHeight: 14 },
  matchText:     { fontSize: 10, fontFamily: 'Poppins_600SemiBold', lineHeight: 14 },
  moreBtn:       { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  eventImg:      { height: 220, position: 'relative', backgroundColor: '#111827' },
  dateBadge:     { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  dateBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: 'rgba(255,255,255,0.95)', lineHeight: 15 },
  pricePill:     { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pricePillText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 15 },
  attendBadge:   { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.55)' },
  attendText:    { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.9)', lineHeight: 14 },
  eventBody:     { padding: 12, paddingTop: 10, gap: 5 },
  eventTitle:    { fontSize: 16, fontFamily: 'Poppins_700Bold', lineHeight: 24, letterSpacing: -0.2 },
  metaRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:      { fontSize: 12, fontFamily: 'Poppins_500Medium', flex: 1, lineHeight: 17 },
  viewRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 2, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1 },
  viewText:      { fontSize: 12, fontFamily: 'Poppins_700Bold', lineHeight: 17 },
  announcementWrapper: { position: 'relative' },
  postImg:          { height: 260, marginBottom: 10, backgroundColor: '#111827' },
  announcementWrap: { paddingLeft: 14, paddingRight: 14, paddingVertical: 12, marginHorizontal: 12, marginBottom: 10, borderLeftWidth: 3, borderRadius: 4 },
  announcementText: { fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 24 },
  welcomeInner:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  welcomeIconWrap:  { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle:     { fontSize: 14, fontFamily: 'Poppins_700Bold', lineHeight: 20 },
  welcomeSub:       { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18, marginTop: 2 },
  explorePill:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  explorePillText:  { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 18 },
  milestoneWrap:    { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 12, marginTop: 4, padding: 14, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  milestoneGradient:{ ...StyleSheet.absoluteFillObject },
  trophyWrap:       { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  milestoneTitle:   { fontSize: 13, fontFamily: 'Poppins_700Bold', lineHeight: 18 },
  milestoneSub:     { fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 15 },
});

const sb = StyleSheet.create({
  scroll:     { paddingHorizontal: 14, paddingVertical: 10, gap: 14 },
  item:       { alignItems: 'center', gap: 6 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: HeaderTokens.paddingVertical, paddingHorizontal: HeaderTokens.paddingHorizontal, borderBottomWidth: StyleSheet.hairlineWidth },
  ring:       { width: 62, height: 62, borderRadius: 31, padding: 2.5, alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { width: 55, height: 55, borderRadius: 27.5, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImg:  { width: 55, height: 55 },
  addCircle:  { width: 55, height: 55, borderRadius: 27.5, alignItems: 'center', justifyContent: 'center' },
  label:      { fontSize: 10, fontFamily: 'Poppins_500Medium', maxWidth: 62, textAlign: 'center', lineHeight: 14 },
});

const cps = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, marginBottom: 8, borderRadius: 14, borderWidth: 1 },
  avatar:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  mockInput:  { flex: 1, height: 36, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, justifyContent: 'center' },
  placeholder:{ fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
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
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 12, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  icon:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 13, fontFamily: 'Poppins_700Bold', lineHeight: 18 },
  sub:     { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1, lineHeight: 15 },
  cta:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  ctaText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 17 },
});


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
            <Text style={{ fontSize: size * 0.36, fontFamily: 'Poppins_700Bold', color: accent, lineHeight: size * 0.48 }}>
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
            <Text style={{ fontSize: size * 0.36, fontFamily: 'Poppins_700Bold', color: accent, lineHeight: size * 0.48 }}>
              {getInitials(name || 'U')}
            </Text>
          </View>
        )}
    </View>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

function FeedFilterTabs({ active, onChange, eventCount, commCount, colors }: {
  active: FeedFilter;
  onChange: (f: FeedFilter) => void;
  eventCount: number;
  commCount: number;
  colors: ReturnType<typeof useColors>;
}) {
  const tabs: { id: FeedFilter; label: string; count?: number }[] = [
    { id: 'for-you',      label: 'For You' },
    { id: 'events',       label: 'Events',      count: eventCount },
    { id: 'communities',  label: 'Communities', count: commCount  },
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[ft.bar, { borderBottomColor: colors.borderLight }]}
      accessibilityRole="tablist"
    >
      {tabs.map(tab => {
        const isActive = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={[
              ft.tab,
              {
                backgroundColor: isActive ? CultureTokens.indigo : 'transparent',
                borderColor: isActive ? CultureTokens.indigo : colors.borderLight,
              },
            ]}
            onPress={() => {
              onChange(tab.id);
              if (Platform.OS !== 'web') Haptics.selectionAsync();
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <Text style={[ft.tabText, { color: isActive ? '#fff' : colors.textSecondary }]}>
              {tab.label}
            </Text>
            {(tab.count ?? 0) > 0 && (
              <View style={[ft.badge, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : CultureTokens.indigo + '20' }]}>
                <Text style={[ft.badgeText, { color: isActive ? '#fff' : CultureTokens.indigo }]}>
                  {(tab.count ?? 0) > 99 ? '99+' : tab.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
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
            <Button variant="outline" size="md" onPress={onClose} style={{ flex: 1 }}>Cancel</Button>
            <Button variant="danger" size="md" onPress={handleSubmit} disabled={!selected || submitting} loading={submitting} style={{ flex: 1 }}>Report</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const rm = StyleSheet.create({
  overlay:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 },
  card:      { width: '100%', maxWidth: 380, borderRadius: 18, borderWidth: 1, padding: 20, gap: 10 },
  title:     { fontSize: 17, fontFamily: 'Poppins_700Bold', lineHeight: 24 },
  sub:       { fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 4, lineHeight: 18 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  radio:     { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot:  { width: 8, height: 8, borderRadius: 4 },
  rowText:   { fontSize: 14, fontFamily: 'Poppins_500Medium', flex: 1, lineHeight: 20 },
  actions:   { flexDirection: 'row', gap: 10, marginTop: 6 },
  btn:       { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', height: 44 },
  cancelBtn: { borderWidth: 1 },
  submitBtn: {},
  btnText:   { fontSize: 14, fontFamily: 'Poppins_700Bold', lineHeight: 18 },
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
  label:      { fontSize: 15, fontFamily: 'Poppins_500Medium', lineHeight: 20 },
  cancel:     { paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center' },
  cancelText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', lineHeight: 20 },
});

// ─── Comments sheet ───────────────────────────────────────────────────────────

function CommentsSheet({ visible, onClose, post, colors }: {
  visible: boolean;
  onClose: () => void;
  post: FeedPost;
  colors: ReturnType<typeof useColors>;
}) {
  const { isAuthenticated, user } = useAuth();
  const pid  = postId(post);
  const pcol = postCollection(post.kind);

  const [comments, setComments] = useState<FeedComment[]>([]);
  const [body, setBody]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const listRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    const unsub = subscribeComments(pid, pcol, (c) => {
      setComments(c);
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
        authorId:   user.id,
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
            <View style={[cs.handle, { backgroundColor: colors.border }]} />
            <View style={[cs.header, { borderBottomColor: colors.borderLight }]}>
              <View>
                <Text style={[cs.title, { color: colors.text }]}>Comments</Text>
                {comments.length > 0 && (
                  <Text style={[cs.countLabel, { color: colors.textTertiary }]}>
                    {comments.length} comment{comments.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
              <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
                <View style={[cs.closeBtn, { backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </View>
              </Pressable>
            </View>

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
              <ScrollView ref={listRef} style={cs.list} contentContainerStyle={cs.listContent} keyboardShouldPersistTaps="handled">
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

            {error ? <Text style={[cs.error, { color: CultureTokens.coral }]}>{error}</Text> : null}

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
                <Button variant="primary" size="md" fullWidth leftIcon="log-in-outline" onPress={() => { onClose(); router.push('/(onboarding)/login'); }}>
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
  title:        { fontSize: 16, fontFamily: 'Poppins_700Bold', lineHeight: 22 },
  countLabel:   { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1, lineHeight: 15 },
  closeBtn:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  empty:        { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyIcon:    { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:   { fontSize: 15, fontFamily: 'Poppins_700Bold', lineHeight: 20 },
  emptyText:    { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  list:         { maxHeight: 320 },
  listContent:  { padding: 14, gap: 10 },
  commentRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bubble:       { flex: 1, borderRadius: 14, padding: 10, gap: 3 },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commenterName:{ fontSize: 12, fontFamily: 'Poppins_700Bold', lineHeight: 16 },
  commentBody:  { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  commentTime:  { fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 14 },
  error:        { fontSize: 12, fontFamily: 'Poppins_500Medium', paddingHorizontal: 18, paddingTop: 4, lineHeight: 17 },
  inputRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  input:        { flex: 1, minHeight: 38, maxHeight: 80, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  sendBtn:      { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  signInBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, padding: 14, borderRadius: 14 },
  signInText:   { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#fff', lineHeight: 18 },
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

  const initialLikes    = post.kind === 'announcement' ? (post.likesCount    ?? 0) : 0;
  const initialComments = post.kind === 'announcement' ? (post.commentsCount ?? 0) : 0;

  const [liked,        setLiked]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(initialLikes);
  const [commentCount, setCommentCount] = useState(initialComments);
  const [showComments, setShowComments] = useState(false);
  const [likeError,    setLikeError]    = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const unsub = subscribeLiked(pid, pcol, user.id, setLiked);
    return unsub;
  }, [isAuthenticated, user?.id, pid, pcol]);

  useEffect(() => {
    const unsub = subscribeLikeCount(pid, pcol, (n) => { if (n > 0) setLikeCount(n); });
    return unsub;
  }, [pid, pcol]);

  useEffect(() => {
    const unsub = subscribeCommentCount(pid, pcol, (n) => { if (n > 0) setCommentCount(n); });
    return unsub;
  }, [pid, pcol]);

  const doToggleLike = useCallback(async () => {
    if (!user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((v) => Math.max(0, wasLiked ? v - 1 : v + 1));
    setLikeError(false);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.45, useNativeDriver: true, speed: 40 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 25 }),
    ]).start();
    try {
      await toggleLike(pid, pcol, user.id);
    } catch {
      setLiked(wasLiked);
      setLikeCount((v) => Math.max(0, wasLiked ? v + 1 : v - 1));
      setLikeError(true);
    }
  }, [user, liked, pid, pcol, scaleAnim]);

  const debouncedLike = useDebounced(doToggleLike, 500);
  const handleLike    = useCallback(() => { gate(debouncedLike); }, [gate, debouncedLike]);
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
        <Pressable style={rb.action} onPress={handleLike} accessibilityRole="button" accessibilityLabel={`Like — ${likeCount} likes`}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={likeError ? CultureTokens.coral + '80' : liked ? CultureTokens.coral : colors.textSecondary} />
          </Animated.View>
          <Text style={[rb.count, { color: liked ? CultureTokens.coral : colors.textSecondary }]}>
            {likeCount > 0 ? likeCount : ''}
          </Text>
        </Pressable>

        <Pressable style={rb.action} onPress={handleComment} accessibilityRole="button" accessibilityLabel={`Comment — ${commentCount} comments`}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
          <Text style={[rb.count, { color: colors.textSecondary }]}>{commentCount > 0 ? commentCount : ''}</Text>
        </Pressable>

        <Pressable style={rb.action} onPress={handleShare} accessibilityRole="button" accessibilityLabel="Share">
          <Ionicons name="arrow-redo-outline" size={19} color={colors.textSecondary} />
          <Text style={[rb.label, { color: colors.textSecondary }]}>Share</Text>
        </Pressable>
      </View>

      <CommentsSheet visible={showComments} onClose={() => setShowComments(false)} post={post} colors={colors} />
    </>
  );
}

const rb = StyleSheet.create({
  wrap:   { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 4, paddingHorizontal: 6 },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8 },
  count:  { fontSize: 13, fontFamily: 'Poppins_600SemiBold', minWidth: 14, lineHeight: 18 },
  label:  { fontSize: 13, fontFamily: 'Poppins_600SemiBold', lineHeight: 18 },
});

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, colorIdx }: { post: FeedPost; colorIdx: number }) {
  const colors = useColors();
  const accent = ACCENT_COLORS[colorIdx % ACCENT_COLORS.length];
  const { user, isAuthenticated } = useAuth();
  const gate   = useAuthGate();

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

  const handleReport   = useCallback((reason: string) => {
    if (!user) return;
    reportPost(user.id, postId(post), postCollection(post.kind), reason).catch(() => {});
  }, [user, post]);

  const handleMorePress = useCallback(() => { gate(() => setShowMore(true)); }, [gate]);

  if (hidden) return null;

  const renderContent = () => {
    switch (post.kind) {
      case 'event': {
        const ev       = post.event;
        const dateLabel = getDateLabel(ev.date);
        const isToday   = dateLabel === 'Today';
        return (
          <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={`View event: ${ev.title}`}>
            {/* Event image */}
            <View style={pc.eventImg}>
              <Image source={{ uri: ev.imageUrl ?? undefined }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.80)']} style={StyleSheet.absoluteFillObject} />

              {/* Date badge — "Today" in accent, other dates in dark glass */}
              <View style={[pc.dateBadge, { backgroundColor: isToday ? accent : 'rgba(0,0,0,0.60)' }]}>
                <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.9)" />
                <Text style={pc.dateBadgeText}>{dateLabel}</Text>
              </View>

              {/* Attendance count */}
              {(ev.attending ?? 0) > 0 && (
                <View style={pc.attendBadge}>
                  <Ionicons name="people-outline" size={10} color="rgba(255,255,255,0.9)" />
                  <Text style={pc.attendText}>{ev.attending} attending</Text>
                </View>
              )}

              {/* Price pill */}
              <View style={[pc.pricePill, { backgroundColor: ev.isFree || ev.priceCents === 0 ? CultureTokens.teal : accent }]}>
                <Ionicons name="ticket-outline" size={10} color="#fff" />
                <Text style={pc.pricePillText}>
                  {ev.isFree || ev.priceCents === 0 ? 'Free' : ev.priceLabel ?? 'Tickets'}
                </Text>
              </View>
            </View>

            {/* Event body */}
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
              <View style={[pc.viewRow, { borderColor: accent + '55' }]}>
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
                <Image source={{ uri: post.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
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
                <Text style={[pc.welcomeTitle, { color: colors.text }]}>Welcome to {post.community.name}!</Text>
                <Text style={[pc.welcomeSub, { color: colors.textSecondary }]} numberOfLines={2}>
                  {getCommunityHeadline(post.community)}
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
              <Text style={[pc.milestoneSub, { color: colors.textSecondary }]}>Be part of the growing community</Text>
            </View>
          </Pressable>
        );

      case 'collection-highlight':
        return (
          <Pressable onPress={handlePress} style={[pc.milestoneWrap, { borderColor: CultureTokens.gold + '50', backgroundColor: CultureTokens.gold + '08', padding: 18 }]}>
            <LinearGradient colors={[CultureTokens.gold + '15', 'transparent']} style={pc.milestoneGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={[pc.trophyWrap, { backgroundColor: CultureTokens.gold + '20', width: 64, height: 64, borderRadius: 20 }]}>
              <Ionicons name="ribbon" size={32} color={CultureTokens.gold} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[pc.milestoneTitle, { color: colors.text, fontSize: 16 }]}>
                {post.userName} earned the {post.tokenName} Explorer Token!
              </Text>
              <Text style={[pc.milestoneSub, { color: colors.textSecondary }]}>Shared to {post.community.name}</Text>
              <View style={[pc.viewRow, { borderColor: CultureTokens.gold + '55', marginTop: 8 }]}>
                <Text style={[pc.viewText, { color: CultureTokens.gold }]}>CONGRATULATE</Text>
                <Ionicons name="sparkles" size={12} color={CultureTokens.gold} />
              </View>
            </View>
          </Pressable>
        );
    }
  };

  const badge = post.kind === 'event'
    ? { icon: 'calendar-outline' as const, label: 'Event',        color: CultureTokens.saffron }
    : post.kind === 'announcement'
      ? { icon: 'megaphone-outline' as const, label: 'Update',   color: CultureTokens.teal }
      : null;

  // Inline match reason — shown after the time text
  const showMatchReason = isAuthenticated && (post.matchReason?.length ?? 0) > 0 && (post.score || 0) > 0.35;

  return (
    <>
      <View style={[pc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
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
              {showMatchReason && (
                <>
                  <View style={[pc.dot, { backgroundColor: colors.textTertiary }]} />
                  <Ionicons name="sparkles" size={9} color={CultureTokens.indigo} />
                  <Text style={[pc.matchText, { color: CultureTokens.indigo }]} numberOfLines={1}>
                    {post.matchReason![0]}
                  </Text>
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sb.scroll} accessibilityRole="list">
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
    setBody(''); setImageUri(null); setError(''); onClose();
  }, [onClose]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { setError('Permission to access library was denied'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!body.trim() || !selectedComm || submitting) return;
    if (body.trim().length > 500) { setError('Post must be under 500 characters.'); return; }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(true); setError('');
    try {
      await onSubmit(selectedComm.id, selectedComm.name, body.trim(), imageUri || undefined);
      setBody(''); setImageUri(null); onClose();
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
            <View style={[pm.header, { borderBottomColor: colors.borderLight }]}>
              <Button variant="ghost" size="sm" onPress={handleClose}>Cancel</Button>
              <Text style={[pm.title, { color: colors.text }]}>Create Post</Text>
              <Button variant="primary" size="sm" onPress={handleSubmit} disabled={!canPost} loading={submitting}>Post</Button>
            </View>

            {communities.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={pm.commScroll} contentContainerStyle={pm.commRow}>
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

            {imageUri && (
              <View style={pm.imagePreviewWrap}>
                <Image source={{ uri: imageUri }} style={pm.imagePreview} contentFit="cover" />
                <Pressable style={pm.removeImg} onPress={() => setImageUri(null)}>
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </Pressable>
              </View>
            )}

            <View style={[pm.toolbar, { borderTopColor: colors.borderLight }]}>
              <Pressable style={pm.toolbarBtn} onPress={pickImage}>
                <Ionicons name="image-outline" size={22} color={CultureTokens.indigo} />
                <Text style={[pm.toolbarText, { color: CultureTokens.indigo }]}>Photo</Text>
              </Pressable>
            </View>

            <View style={pm.footer}>
              {error ? <Text style={[pm.error, { color: CultureTokens.coral }]}>{error}</Text> : <View />}
              <Text style={[pm.charCount, { color: remaining < 50 ? CultureTokens.coral : colors.textTertiary }]}>{remaining}</Text>
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
      Animated.timing(anim, { toValue: 0.9,  duration: 900, useNativeDriver: true }),
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
        {[0, 1, 2].map((i) => <Animated.View key={i} style={[sk.reactionBtn, bg]} />)}
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
      <LinearGradient colors={[CultureTokens.indigo + '18', CultureTokens.teal + '10']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
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


// ─── Feed list header ─────────────────────────────────────────────────────────

function FeedListHeader({
  activeFilter,
  setActiveFilter,
  eventCount,
  commCount,
  colors,
  communities,
  authUser,
  isAuthenticated,
  hPad,
  onCreatePost,
}: {
  activeFilter: FeedFilter;
  setActiveFilter: (f: FeedFilter) => void;
  eventCount: number;
  commCount: number;
  colors: ReturnType<typeof useColors>;
  communities: Community[];
  authUser: { displayName?: string | null; avatarUrl?: string | null } | null;
  isAuthenticated: boolean;
  hPad: number;
  onCreatePost: () => void;
}) {
  return (
    <View>
      <FeedFilterTabs
        active={activeFilter}
        onChange={setActiveFilter}
        eventCount={eventCount}
        commCount={commCount}
        colors={colors}
      />
      {communities.length > 0 && (
        <View style={[lh.storiesWrap, { borderBottomColor: colors.borderLight }]}>
          <StoriesBar communities={communities} authUser={authUser} colors={colors} isAuthenticated={isAuthenticated} onCreatePost={onCreatePost} />
        </View>
      )}
      <View style={{ paddingHorizontal: hPad, marginTop: 10 }}>
        <CreatePostStub authUser={authUser} colors={colors} isAuthenticated={isAuthenticated} onPress={onCreatePost} />
      </View>
      {!isAuthenticated && (
        <View style={{ paddingHorizontal: hPad }}>
          <GuestBanner colors={colors} />
        </View>
      )}
      <View style={[lh.divider, { paddingHorizontal: hPad }]}>
        <View style={[lh.divLine, { backgroundColor: colors.borderLight }]} />
        <Text style={[lh.divText, { color: colors.textTertiary }]}>
          {activeFilter === 'events' ? 'Upcoming Events' : activeFilter === 'communities' ? 'Community Updates' : 'For You'}
        </Text>
        <View style={[lh.divLine, { backgroundColor: colors.borderLight }]} />
      </View>
    </View>
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
  const [activeFilter,   setActiveFilter]   = useState<FeedFilter>('for-you');

  const { data: feedData, isLoading, isFetching } = useQuery({
    queryKey: ['/api/feed', state.city, state.country],
    queryFn: () => api.feed.list({ city: state.city, country: state.country, pageSize: 50 }),
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  // Clear optimistic local posts when the city/country changes (avoid showing
  // posts from the previous city while new data loads with keepPreviousData).
  useEffect(() => {
    setLocalPosts([]);
  }, [state.city, state.country]);

  // Also clear when fresh server data arrives (dedup: server now contains the post).
  useEffect(() => {
    if (feedData && !isFetching) setLocalPosts([]);
  }, [feedData, isFetching]);

  // Keep a local communities list for the post composer community picker
  const { data: communities = [] } = useQuery<Community[]>({
    queryKey: ['/api/communities', state.city, state.country, 'feed'],
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
      kind: 'announcement',
      community: comm,
      body,
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
          authorId:      authUser.id,
          authorName:    authUser.username || authUser.email || 'User',
          communityId,
          communityName,
          body,
          imageUrl: finalImageUrl,
        });
        // Invalidate so the server response replaces the optimistic local post,
        // preventing the post from appearing twice in the feed.
        await queryClient.invalidateQueries({ queryKey: ['/api/feed', state.city, state.country] });
      } catch (err) {
        if (__DEV__) console.error('[CultureFeed] Failed to create post:', err);
      }
    })();
  }, [authUser, communities, queryClient, state.city, state.country]);


  const posts = useMemo<FeedPost[]>(() => {
    // Convert server FeedItems to the local FeedPost shape
    const serverItems = feedData?.items ?? [];
    const serverPosts: FeedPost[] = serverItems.map((item): FeedPost => {
      const comm: Community = {
        id:       item.communityId ?? '',
        name:     item.communityName ?? '',
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
      if ((item as any).kind === 'collection-highlight') {
        return { id: item.id, kind: 'collection-highlight', community: comm, tokenName: (item as any).tokenName, tokenImage: (item as any).tokenImage, userName: (item as any).userName, createdAt: item.createdAt, score: item.score, matchReason: item.matchReasons };
      }
      // announcement (real community post)
      return { id: item.id, kind: 'announcement', community: comm, body: item.body ?? '', imageUrl: item.imageUrl ?? undefined, authorId: item.authorId, likesCount: item.likesCount, commentsCount: item.commentsCount, createdAt: item.createdAt, score: item.score, matchReason: item.matchReasons };
    });

    // Prepend optimistic local posts (new posts the user just created)
    return [...localPosts, ...serverPosts];
  }, [feedData, localPosts]);

  // Filter by active tab
  const filteredPosts = useMemo(() => {
    if (activeFilter === 'events')      return posts.filter(p => (p as any).kind === 'event');
    if (activeFilter === 'communities') return posts.filter(p => (p as any).kind !== 'event');
    return posts;
  }, [posts, activeFilter]);

  const eventCount = useMemo(() => posts.filter(p => p.kind === 'event').length, [posts]);
  const commCount  = useMemo(() => posts.filter(p => p.kind !== 'event').length, [posts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['/api/feed', state.city, state.country] }),
      queryClient.invalidateQueries({ queryKey: ['/api/communities', state.city, state.country, 'feed'] }),
    ]);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(false);
  }, [queryClient, state.city, state.country]);

  const country      = state.country || 'Australia';
  const countryFlag  = { Australia: '🇦🇺', 'New Zealand': '🇳🇿', UAE: '🇦🇪', UK: '🇬🇧', Canada: '🇨🇦' }[country] ?? '🇦🇺';
  const locationLabel = state.city
    ? `${state.city}${state.country ? `, ${state.country}` : ''}`
    : state.country || 'Australia';

  const renderPost = useCallback(
    ({ item, index }: { item: FeedPost; index: number }) => (
      <ErrorBoundary>
        <PostCard post={item} colorIdx={index} />
      </ErrorBoundary>
    ),
    [],
  );

  const renderListHeader = useCallback(() => (
    <FeedListHeader
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      eventCount={eventCount}
      commCount={commCount}
      colors={colors}
      communities={communities}
      authUser={authUser ?? null}
      isAuthenticated={isAuthenticated}
      hPad={hPad}
      onCreatePost={handleOpenCreatePost}
    />
  ), [activeFilter, setActiveFilter, eventCount, commCount, colors, communities, authUser, isAuthenticated, hPad, handleOpenCreatePost]);

  return (
    <ErrorBoundary>
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <LinearGradient colors={gradients.culturepassBrand as [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={{ height: topInset }} />
          <View style={[s.header, { paddingHorizontal: hPad, borderBottomWidth: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <HeaderAvatar />
              <View>
                <Text style={[s.title, { color: '#fff' }]}>Culture Feed</Text>
                <View style={s.locationRow}>
                  <Text style={{ fontSize: 14 }}>{countryFlag}</Text>
                  <Text style={[s.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>{locationLabel}</Text>
                </View>
              </View>
            </View>
            <View style={s.headerRight}>
              <LocationPicker variant="icon" iconColor="#fff" buttonStyle={{ ...s.iconBtn, backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }} />
              <Pressable style={[s.iconBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }]} onPress={() => router.push('/search')} accessibilityRole="button" accessibilityLabel="Search">
                <Ionicons name="search-outline" size={18} color="#fff" />
              </Pressable>
              <Pressable style={[s.iconBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }]} onPress={() => gate(() => router.push('/notifications'))} accessibilityRole="button" accessibilityLabel="Notifications">
                <Ionicons name="notifications-outline" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        {isFetching && !isLoading && (
          <View style={{ height: 2, backgroundColor: CultureTokens.indigo + '40' }}>
            <View style={{ height: 2, width: '60%', backgroundColor: CultureTokens.indigo }} />
          </View>
        )}
        {isLoading ? (
          <ScrollView contentContainerStyle={{ padding: hPad, paddingTop: 12 }} scrollEnabled={false}>
            {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} colors={colors} />)}
          </ScrollView>
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderPost}
            ListHeaderComponent={renderListHeader}
            contentContainerStyle={[
              s.list,
              { paddingHorizontal: hPad, paddingBottom: bottomInset + 88 },
              isDesktop && s.listDesktop,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={CultureTokens.indigo} colors={[CultureTokens.indigo]} />
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <View style={[s.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <Ionicons name="chatbubbles-outline" size={32} color={colors.textTertiary} />
                </View>
                <Text style={[s.emptyTitle, { color: colors.text }]}>
                  {activeFilter === 'events' ? 'No events in your area yet' : activeFilter === 'communities' ? 'No community updates yet' : 'No updates yet'}
                </Text>
                <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                  {activeFilter === 'events' ? 'Check back soon or update your location' : 'Join communities to see their updates here'}
                </Text>
                <Pressable style={[s.joinCta, { backgroundColor: CultureTokens.indigo }]} onPress={() => router.push(activeFilter === 'events' ? '/events' : '/(tabs)/community')} accessibilityRole="button">
                  <Text style={s.joinCtaText}>{activeFilter === 'events' ? 'Browse Events' : 'Browse Communities'}</Text>
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
