// app/(tabs)/feed/_components/FeedComponents.tsx — Feed components
import React, {
  useState, useCallback, useEffect, useRef,
} from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, ActivityIndicator, Modal,
  TextInput, KeyboardAvoidingView, Keyboard, Share, Animated, useColorScheme,
  type ViewStyle,
} from 'react-native';
// Reanimated intentionally NOT imported — interpolateColor worklet crashes iOS (SIGABRT via worklets::UIScheduler)
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, CardTokens, gradients } from '@/constants/theme';
import { getCommunityHeadline } from '@/lib/community';
import { Button } from '@/components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { timeAgo } from '@/lib/dateUtils';
import {
  subscribeComments, subscribeCommentCount,
  addComment, toggleLike, subscribeLiked, subscribeLikeCount, reportPost,
  type FeedComment, type PostCollection,
} from '@/lib/feedService';
import type { Community } from '@/shared/schema';

// ── Types ─────────────────────────────────────────────────────────────────────


import type { FeedFilter, FeedPost, ListItem } from './types';

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT = [
  CultureTokens.indigo, CultureTokens.teal, CultureTokens.coral,
  CultureTokens.gold, CultureTokens.gold, '#7C3AED', '#059669',
];
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const COUNTRY_FLAG: Record<string, string> = {
  'United States': '🇺🇸',
  USA: '🇺🇸',
  Canada: '🇨🇦',
  'United Arab Emirates': '🇦🇪',
  UAE: '🇦🇪',
  'United Kingdom': '🇬🇧',
  UK: '🇬🇧',
  Australia: '🇦🇺',
  Singapore: '🇸🇬',
  'New Zealand': '🇳🇿',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return (name || 'C').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
function postCollection(kind: FeedPost['kind']): PostCollection {
  return kind === 'event' ? 'events' : 'communityPosts';
}
function postId(post: FeedPost): string {
  return post.kind === 'event' ? post.event.id : post.id;
}
function getDateLabel(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - todayMs) / 86_400_000);
  if (diff < 0)  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 6) return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
function useDebounced<T extends (...args: Parameters<T>) => void>(fn: T, ms = 600): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), ms);
  }, [fn, ms]) as T;
}
function useAuthGate() {
  const { isAuthenticated } = useAuth();
  return useCallback((action: () => void) => {
    if (!isAuthenticated) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/(onboarding)/login');
      return;
    }
    action();
  }, [isAuthenticated]);
}

// ── Avatars ───────────────────────────────────────────────────────────────────

function CommAvatar({ community, size = 40, colorIdx = 0 }: { community: Community; size?: number; colorIdx?: number }) {
  const accent = ACCENT[colorIdx % ACCENT.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: accent + '22' }}>
      {community.imageUrl
        ? <Image source={{ uri: community.imageUrl }} style={{ width: size, height: size }} contentFit="cover" />
        : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: accent + '28' }}>
            <Text style={{ fontSize: size * 0.36, fontFamily: 'Poppins_700Bold', color: accent, lineHeight: size * 0.5 }}>{getInitials(community.name)}</Text>
          </View>}
    </View>
  );
}

function UserAvatar({ name, avatarUrl, size = 34, colorIdx = 0 }: { name?: string | null; avatarUrl?: string | null; size?: number; colorIdx?: number }) {
  const accent = ACCENT[colorIdx % ACCENT.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: accent + '22' }}>
      {avatarUrl
        ? <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} contentFit="cover" />
        : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: accent + '28' }}>
            <Text style={{ fontSize: size * 0.36, fontFamily: 'Poppins_700Bold', color: accent, lineHeight: size * 0.5 }}>{getInitials(name || 'U')}</Text>
          </View>}
    </View>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FILTER_TABS: { id: FeedFilter; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; hint: string }[] = [
  { id: 'for-you', label: 'For You', icon: 'sparkles', hint: 'Show your full personalised mix of events and communities' },
  { id: 'events', label: 'Events', icon: 'calendar', hint: 'Show only event cards from the feed' },
  { id: 'communities', label: 'Communities', icon: 'people', hint: 'Show community updates, announcements, and milestones' },
];

// Inline animated chip — uses RN Animated only (Reanimated interpolateColor crashes iOS)
function FeedFilterChip({
  label, active, onPress, icon, count, colors, hint,
}: {
  label: string; active: boolean; onPress: () => void;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  count?: number;
  colors: ReturnType<typeof useColors>;
  hint: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: USE_NATIVE_DRIVER, speed: 40 }).start();
  }, [scale]);
  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: USE_NATIVE_DRIVER, speed: 25 }).start();
  }, [scale]);

  const chipBg = active ? CultureTokens.indigo : colors.surface;
  const chipBorder = active ? CultureTokens.indigo : colors.borderLight;

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); onPress(); }}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ selected: active }}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      android_ripple={Platform.OS === 'android' ? { color: (active ? 'rgba(255,255,255,0.2)' : CultureTokens.indigo + '18'), borderless: false } : undefined}
    >
      <Animated.View style={[ffc.chip, { borderColor: chipBorder, backgroundColor: chipBg, transform: [{ scale }] }]}>
        <Ionicons name={icon} size={14} color={active ? '#fff' : colors.textTertiary} accessible={false} />
        <Text style={[ffc.text, { color: active ? '#fff' : colors.textSecondary }]}>{label}</Text>
        {count != null && count > 0 && (
          <View style={[ffc.badge, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.surfaceElevated }]}>
            <Text style={[ffc.badgeText, { color: active ? '#fff' : colors.textTertiary }]}>
              {count > 99 ? '99+' : count}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const ffc = StyleSheet.create({
  chip:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 15, paddingVertical: 11, minHeight: 46, borderRadius: 20, borderWidth: 1 },
  text:      { fontSize: 13, fontFamily: 'Poppins_600SemiBold', lineHeight: 19 },
  badge:     { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontSize: 10, fontFamily: 'Poppins_700Bold', lineHeight: 14 },
});

function FeedFilterBar({ active, onChange, eventCount, commCount, colors, hPad }: {
  active: FeedFilter;
  onChange: (f: FeedFilter) => void;
  eventCount: number;
  commCount: number;
  colors: ReturnType<typeof useColors>;
  hPad: number;
}) {
  return (
    <View style={[fb.wrap, { backgroundColor: 'transparent' }]}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[fb.scroll, { paddingHorizontal: hPad, paddingRight: hPad + 4 }]}
        accessibilityRole="tablist"
        accessibilityLabel="Feed filters"
      >
        {FILTER_TABS.map((tab) => {
          const count = tab.id === 'events' ? eventCount : tab.id === 'communities' ? commCount : undefined;
          return (
            <FeedFilterChip
              key={tab.id}
              label={tab.label}
              active={active === tab.id}
              onPress={() => onChange(tab.id)}
              icon={tab.icon}
              count={count}
              colors={colors}
              hint={tab.hint}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const fb = StyleSheet.create({
  wrap:  { paddingTop: 10, paddingBottom: 11 },
  scroll:{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingBottom: 1 },
});

// ── Stories bar ───────────────────────────────────────────────────────────────

function StoriesBar({ communities, authUser, colors, isAuthenticated, onCreatePost, canPostStoryStatus, onCreateStoryPost, hPad }: {
  communities: Community[];
  authUser: { displayName?: string | null; avatarUrl?: string | null } | null;
  colors: ReturnType<typeof useColors>;
  isAuthenticated: boolean;
  onCreatePost: () => void;
  /** Organizer, business, or admin — story-style status composer */
  canPostStoryStatus?: boolean;
  onCreateStoryPost?: () => void;
  hPad: number;
}) {
  const showStoryRing = Boolean(isAuthenticated && canPostStoryStatus && onCreateStoryPost);

  return (
    <View style={[st.wrap, { borderBottomColor: colors.borderLight }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[st.scroll, { paddingHorizontal: hPad, paddingRight: hPad + 6 }]}
      >
        {/* Your story / sign in */}
        <Pressable
          style={st.item}
          onPress={onCreatePost}
          accessibilityRole="button"
          accessibilityLabel={isAuthenticated ? 'Create post' : 'Sign in to post'}
          accessibilityHint={isAuthenticated ? 'Compose an update for your community' : 'Opens sign in so you can share'}
          {...(Platform.OS === 'android'
            ? { android_ripple: { color: CultureTokens.indigo + '16', borderless: false } }
            : {})}
        >
          <View style={st.ringWrap}>
            <LinearGradient
              colors={gradients.culturepassBrand as [string, string]}
              style={st.ring}
            >
              <View style={[st.inner, { backgroundColor: colors.background }]}>
                {isAuthenticated && authUser?.avatarUrl
                  ? <Image source={{ uri: authUser.avatarUrl }} style={st.img} contentFit="cover" />
                  : <View style={[st.placeholder, { backgroundColor: CultureTokens.indigo + '18' }]}>
                      <Ionicons name={isAuthenticated ? 'add' : 'person'} size={20} color={CultureTokens.indigo} />
                    </View>}
              </View>
            </LinearGradient>
            {isAuthenticated && (
              <View style={[st.addDot, { backgroundColor: CultureTokens.indigo, borderColor: colors.background }]}>
                <Ionicons name="add" size={9} color="#fff" />
              </View>
            )}
          </View>
          <Text style={[st.name, { color: colors.textSecondary }]} numberOfLines={1}>
            {isAuthenticated ? 'Your Post' : 'Sign In'}
          </Text>
        </Pressable>

        {showStoryRing && (
          <Pressable
            style={st.item}
            onPress={onCreateStoryPost}
            accessibilityRole="button"
            accessibilityLabel="Create story status"
            accessibilityHint="Share a short story-style update with a portrait photo"
            {...(Platform.OS === 'android'
              ? { android_ripple: { color: CultureTokens.purple + '22', borderless: false } }
              : {})}
          >
            <LinearGradient
              colors={[CultureTokens.purple, CultureTokens.coral]}
              style={st.ring}
            >
              <View style={[st.inner, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="albums-outline" size={24} color={CultureTokens.purple} />
              </View>
            </LinearGradient>
            <Text style={[st.name, { color: colors.textSecondary }]} numberOfLines={1}>
              Story
            </Text>
          </Pressable>
        )}

        {/* Community stories */}
        {communities.slice(0, 14).map((comm, i) => {
          const accent = ACCENT[i % ACCENT.length];
          return (
            <Pressable
              key={comm.id}
              style={st.item}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                router.push({ pathname: '/community/[id]', params: { id: comm.id } });
              }}
              accessibilityRole="button"
              accessibilityLabel={comm.name}
              {...(Platform.OS === 'android'
                ? { android_ripple: { color: accent + '28', borderless: false } }
                : {})}
            >
              <LinearGradient colors={[accent, accent + '80']} style={st.ring}>
                <View style={[st.inner, { backgroundColor: colors.background }]}>
                  <CommAvatar community={comm} size={50} colorIdx={i} />
                </View>
              </LinearGradient>
              <Text style={[st.name, { color: colors.textSecondary }]} numberOfLines={1}>
                {comm.name.split(' ')[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  wrap:        { borderBottomWidth: StyleSheet.hairlineWidth },
  scroll:      { paddingVertical: 13, gap: 14 },
  item:        { alignItems: 'center', gap: 6 },
  ringWrap:    { position: 'relative' },
  ring:        { width: 64, height: 64, borderRadius: 32, padding: 2.5, alignItems: 'center', justifyContent: 'center' },
  inner:       { width: 57, height: 57, borderRadius: 28.5, overflow: 'hidden' },
  img:         { width: 57, height: 57 },
  placeholder: { width: 57, height: 57, borderRadius: 28.5, alignItems: 'center', justifyContent: 'center' },
  addDot:      { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  name:        { fontSize: 11, fontFamily: 'Poppins_500Medium', maxWidth: 68, textAlign: 'center', lineHeight: 15 },
});

// ── Create post stub ──────────────────────────────────────────────────────────

function CreatePostStub({ authUser, colors, onPress, isAuthenticated, city }: {
  authUser: { displayName?: string | null; avatarUrl?: string | null } | null;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
  isAuthenticated: boolean;
  city: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        cp.wrap,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        Platform.OS === 'ios' && pressed ? { opacity: 0.92 } : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={isAuthenticated ? 'Create a post' : 'Sign in to post'}
      {...(Platform.OS === 'android'
        ? { android_ripple: { color: CultureTokens.indigo + '14', borderless: false } }
        : {})}
    >
      <View style={[cp.avatar, { backgroundColor: CultureTokens.indigo + '15' }]}>
        {isAuthenticated && authUser?.avatarUrl
          ? <Image source={{ uri: authUser.avatarUrl }} style={{ width: 38, height: 38 }} contentFit="cover" />
          : <Ionicons name={isAuthenticated ? 'person' : 'log-in-outline'} size={18} color={CultureTokens.indigo} />}
      </View>
      <View style={[cp.mockInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
        <Text style={[cp.placeholder, { color: colors.textTertiary }]} numberOfLines={1}>
          {isAuthenticated
            ? (city ? `Share with ${city}…` : 'Share with your community…')
            : 'Sign in to share…'}
        </Text>
      </View>
      {isAuthenticated && (
        <View style={[cp.imgBtn, { backgroundColor: CultureTokens.gold + '18' }]}>
          <Ionicons name="image-outline" size={18} color={CultureTokens.gold} />
        </View>
      )}
    </Pressable>
  );
}

const cp = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1, minHeight: 62, overflow: 'hidden' },
  avatar:      { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  mockInput:   { flex: 1, height: 38, borderRadius: 19, borderWidth: 1, paddingHorizontal: 14, justifyContent: 'center' },
  placeholder: { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  imgBtn:      { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});

// ── Guest banner ──────────────────────────────────────────────────────────────

function GuestBanner({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable
      style={({ pressed }) => [
        gst.wrap,
        { borderColor: CultureTokens.indigo + '30' },
        Platform.OS === 'ios' && pressed ? { opacity: 0.94 } : null,
      ]}
      onPress={() => router.push('/(onboarding)/login')}
      accessibilityRole="button"
      accessibilityLabel="Join the conversation"
      accessibilityHint="Sign in to like posts, comment, and share with your community"
      {...(Platform.OS === 'android'
        ? { android_ripple: { color: CultureTokens.indigo + '18', borderless: false } }
        : {})}
    >
      <LinearGradient
        colors={[CultureTokens.indigo + '14', CultureTokens.teal + '0C']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={[gst.iconWrap, { backgroundColor: CultureTokens.indigo + '20' }]}>
        <Ionicons name="people-circle-outline" size={22} color={CultureTokens.indigo} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[gst.title, { color: colors.text }]}>Join the conversation</Text>
        <Text style={[gst.sub, { color: colors.textSecondary }]}>Like, comment, and share with your community</Text>
      </View>
      <View style={[gst.cta, { backgroundColor: CultureTokens.indigo }]}>
        <Text style={gst.ctaText}>Sign In</Text>
      </View>
    </Pressable>
  );
}

const gst = StyleSheet.create({
  wrap:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 13, fontFamily: 'Poppins_700Bold', lineHeight: 18 },
  sub:      { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1, lineHeight: 15 },
  cta:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  ctaText:  { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 17 },
});

// ── Trending interstitial ─────────────────────────────────────────────────────

function TrendingInterstitial({ city, colors }: { city: string; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable
      onPress={() => router.push('/events')}
      style={({ pressed }) => [
        ti.wrap,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        Platform.OS === 'ios' && pressed ? { opacity: 0.92 } : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={city ? `Trending events in ${city}` : 'Trending events near you'}
      accessibilityHint="Opens the events browse screen"
      {...(Platform.OS === 'android'
        ? { android_ripple: { color: CultureTokens.gold + '28', borderless: false } }
        : {})}
    >
      <LinearGradient
        colors={[CultureTokens.gold + '12', CultureTokens.coral + '08']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />
      <View style={[ti.iconWrap, { backgroundColor: CultureTokens.gold + '20' }]}>
        <Ionicons name="flame" size={20} color={CultureTokens.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ti.title, { color: colors.text }]}>
          Trending{city ? ` in ${city}` : ' near you'}
        </Text>
        <Text style={[ti.sub, { color: colors.textSecondary }]}>Discover what&apos;s popular this week</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} accessible={false} />
    </Pressable>
  );
}

const ti = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 2,
    marginBottom: 10,
    minHeight: 74,
  },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 14, fontFamily: 'Poppins_700Bold', lineHeight: 20 },
  sub:      { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1, lineHeight: 16 },
});

// ── Report modal ──────────────────────────────────────────────────────────────

const REPORT_REASONS = [
  'Spam or misleading', 'Hate speech or discrimination',
  'Harassment or bullying', 'Violence or dangerous content',
  'Nudity or sexual content', 'Other',
];

function ReportModal({ visible, onClose, onReport, colors }: {
  visible: boolean; onClose: () => void; onReport: (reason: string) => void;
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
      <View style={[rm.overlay]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
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
                {selected === r && <View style={[rm.dot, { backgroundColor: CultureTokens.indigo }]} />}
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
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 },
  card:    { width: '100%', maxWidth: 380, borderRadius: 18, borderWidth: 1, padding: 20, gap: 10 },
  title:   { fontSize: 17, fontFamily: 'Poppins_700Bold', lineHeight: 24 },
  sub:     { fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 4, lineHeight: 18 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  radio:   { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot:     { width: 8, height: 8, borderRadius: 4 },
  rowText: { fontSize: 14, fontFamily: 'Poppins_500Medium', flex: 1, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
});

// ── Post action sheet ─────────────────────────────────────────────────────────

function PostMoreMenu({ visible, onClose, onReport, onHide, isOwn, colors }: {
  visible: boolean; onClose: () => void; onReport: () => void;
  onHide: () => void; isOwn: boolean; colors: ReturnType<typeof useColors>;
}) {
  const items = isOwn
    ? [{ icon: 'trash-outline' as const, label: 'Delete post', color: CultureTokens.coral, action: onHide }]
    : [
        { icon: 'eye-off-outline' as const,  label: 'Hide this post', color: colors.textSecondary, action: onHide },
        { icon: 'flag-outline' as const,     label: 'Report post',    color: CultureTokens.coral,  action: onReport },
      ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={mo.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[mo.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {items.map((item) => (
            <Pressable
              key={item.label}
              style={[mo.row, { borderBottomColor: colors.borderLight }]}
              onPress={() => { onClose(); item.action(); }}
              accessibilityRole="button"
            >
              <Ionicons name={item.icon} size={20} color={item.color} />
              <Text style={[mo.label, { color: item.color }]}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable style={mo.cancel} onPress={onClose} accessibilityRole="button">
            <Text style={[mo.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const mo = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:      { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, paddingBottom: 28, paddingTop: 8 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  label:      { fontSize: 15, fontFamily: 'Poppins_500Medium', lineHeight: 20 },
  cancel:     { paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center' },
  cancelText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', lineHeight: 20 },
});

// ── Comments sheet ────────────────────────────────────────────────────────────

function CommentsSheet({ visible, onClose, post, colors }: {
  visible: boolean; onClose: () => void; post: FeedPost;
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
        authorId: user.id,
        authorName: user.username || user.email || 'User',
        authorAvatar: (user as unknown as Record<string, unknown>).avatar as string | undefined
          || (user as unknown as Record<string, unknown>).image as string | undefined
          || (user as unknown as Record<string, unknown>).photo as string | undefined
          || undefined,
        body: body.trim(),
      });
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post.');
    } finally {
      setSubmitting(false);
    }
  }, [body, user, pid, pcol, submitting]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={csh.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          enabled={Platform.OS !== 'web'}
          style={csh.kav}
        >
          <View style={[csh.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[csh.handle, { backgroundColor: colors.border }]} />
            <View style={[csh.header, { borderBottomColor: colors.borderLight }]}>
              <View>
                <Text style={[csh.title, { color: colors.text }]}>Comments</Text>
                {comments.length > 0 && (
                  <Text style={[csh.count, { color: colors.textTertiary }]}>
                    {comments.length} comment{comments.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
              <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
                <View style={[csh.closeBtn, { backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </View>
              </Pressable>
            </View>

            {comments.length === 0 ? (
              <View style={csh.empty}>
                <View style={[csh.emptyIcon, { backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name="chatbubbles-outline" size={28} color={colors.textTertiary} />
                </View>
                <Text style={[csh.emptyTitle, { color: colors.text }]}>No comments yet</Text>
                <Text style={[csh.emptySub, { color: colors.textSecondary }]}>
                  {isAuthenticated ? 'Be the first to comment!' : 'Sign in to join the conversation.'}
                </Text>
              </View>
            ) : (
              <ScrollView ref={listRef} style={csh.list} contentContainerStyle={csh.listContent} keyboardShouldPersistTaps="handled">
                {comments.map((c, i) => (
                  <View key={c.id} style={csh.commentRow}>
                    <UserAvatar name={c.authorName} avatarUrl={c.authorAvatar} size={32} colorIdx={i} />
                    <View style={[csh.bubble, { backgroundColor: colors.surfaceElevated }]}>
                      <View style={csh.bubbleHeader}>
                        <Text style={[csh.commName, { color: colors.text }]}>{c.authorName}</Text>
                        <Text style={[csh.commTime, { color: colors.textTertiary }]}>{timeAgo(c.createdAt)}</Text>
                      </View>
                      <Text style={[csh.commBody, { color: colors.textSecondary }]}>{c.body}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {!!error && <Text style={[csh.error, { color: CultureTokens.coral }]}>{error}</Text>}

            {isAuthenticated ? (
              <View style={[csh.inputRow, { borderTopColor: colors.borderLight }]}>
                <UserAvatar name={user?.username} size={32} colorIdx={0} />
                <TextInput
                  style={[csh.input, { color: colors.text, backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                  placeholder="Add a comment…"
                  placeholderTextColor={colors.textTertiary}
                  value={body}
                  onChangeText={(t) => { setBody(t); setError(''); }}
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit}
                  maxLength={300}
                  multiline
                  selectionColor={CultureTokens.indigo}
                  underlineColorAndroid="transparent"
                />
                <Pressable
                  style={[csh.sendBtn, { backgroundColor: body.trim() ? CultureTokens.indigo : colors.border }]}
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

const csh = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  kav:        { maxHeight: '90%' },
  sheet:      { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderBottomWidth: 0, minHeight: 320 },
  handle:     { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  title:      { fontSize: 16, fontFamily: 'Poppins_700Bold', lineHeight: 22 },
  count:      { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2, lineHeight: 15 },
  closeBtn:   { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  empty:      { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyIcon:  { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold', lineHeight: 20 },
  emptySub:   { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  list:       { maxHeight: 320 },
  listContent:{ padding: 14, gap: 10 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bubble:     { flex: 1, borderRadius: 14, padding: 10, gap: 3 },
  bubbleHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commName:   { fontSize: 12, fontFamily: 'Poppins_700Bold', lineHeight: 16 },
  commBody:   { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  commTime:   { fontSize: 10, fontFamily: 'Poppins_400Regular', lineHeight: 14 },
  error:      { fontSize: 12, fontFamily: 'Poppins_500Medium', paddingHorizontal: 18, paddingTop: 4, lineHeight: 17 },
  inputRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  input:      { flex: 1, minHeight: 40, maxHeight: 80, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  sendBtn:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

// ── Reactions bar ─────────────────────────────────────────────────────────────

function ReactionsBar({ post, colors }: { post: FeedPost; colors: ReturnType<typeof useColors> }) {
  const { isAuthenticated, user } = useAuth();
  const gate  = useAuthGate();
  const pid   = postId(post);
  const pcol  = postCollection(post.kind);
  const initLikes    = post.kind === 'announcement' ? (post.likesCount    ?? 0) : 0;
  const initComments = post.kind === 'announcement' ? (post.commentsCount ?? 0) : 0;

  const [liked,        setLiked]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(initLikes);
  const [commentCount, setCommentCount] = useState(initComments);
  const [showComments, setShowComments] = useState(false);
  const [likeError,    setLikeError]    = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    return subscribeLiked(pid, pcol, user.id, setLiked);
  }, [isAuthenticated, user?.id, pid, pcol]);

  useEffect(() => {
    return subscribeLikeCount(pid, pcol, (n) => { if (n > 0) setLikeCount(n); });
  }, [pid, pcol]);

  useEffect(() => {
    return subscribeCommentCount(pid, pcol, (n) => { if (n > 0) setCommentCount(n); });
  }, [pid, pcol]);

  const doToggleLike = useCallback(async () => {
    if (!user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((v) => Math.max(0, wasLiked ? v - 1 : v + 1));
    setLikeError(false);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.5, useNativeDriver: USE_NATIVE_DRIVER, speed: 40 }),
      Animated.spring(scaleAnim, { toValue: 1,   useNativeDriver: USE_NATIVE_DRIVER, speed: 25 }),
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
  const handleShare   = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isEvent  = post.kind === 'event';
    const title    = isEvent ? post.event.title : `${post.community.name} update`;
    const shareUrl = isEvent
      ? `https://culturepass.app/event/${post.event.id}`
      : `https://culturepass.app/community/${post.community.id}`;
    const message  = isEvent
      ? `Check out "${post.event.title}" on CulturePass!\n\n${shareUrl}`
      : `Check out this update from ${post.community.name} on CulturePass!\n\n${shareUrl}`;
    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({ title, text: message, url: shareUrl });
      } else {
        await Share.share({ title, message, url: shareUrl });
      }
    } catch { /* user cancelled */ }
  }, [post]);

  const likeColor    = likeError ? CultureTokens.coral + '80' : liked ? '#E0245E' : colors.textSecondary;
  const commentColor = colors.textSecondary;
  const shareColor   = colors.textSecondary;

  return (
    <>
      {/* Like count summary (Facebook style — shows above buttons if likes > 0) */}
      {likeCount > 0 && (
        <View style={[rxn.likeSummary, { borderTopColor: colors.borderLight }]}>
          <Ionicons name="heart" size={14} color="#E0245E" />
          <Text style={[rxn.likeSummaryText, { color: colors.textTertiary }]}>
            {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
            {commentCount > 0 ? `  ·  ${commentCount} comment${commentCount !== 1 ? 's' : ''}` : ''}
          </Text>
        </View>
      )}

      <View style={[rxn.wrap, { borderTopColor: colors.borderLight }]}>
        {/* Like */}
        <Pressable
          style={rxn.btn}
          onPress={handleLike}
          accessibilityRole="button"
          accessibilityLabel={`Like — ${likeCount} likes`}
          {...(Platform.OS === 'android'
            ? { android_ripple: { color: (liked ? '#E0245E' : colors.textSecondary) + '22', borderless: false } }
            : {})}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={21} color={likeColor} />
          </Animated.View>
          <Text style={[rxn.btnLabel, { color: likeColor, fontFamily: liked ? 'Poppins_700Bold' : 'Poppins_500Medium' }]}>
            Like
          </Text>
        </Pressable>

        {/* Comment */}
        <Pressable
          style={rxn.btn}
          onPress={handleComment}
          accessibilityRole="button"
          accessibilityLabel={`Comment — ${commentCount} comments`}
          {...(Platform.OS === 'android'
            ? { android_ripple: { color: colors.textSecondary + '22', borderless: false } }
            : {})}
        >
          <Ionicons name="chatbubble-outline" size={20} color={commentColor} />
          <Text style={[rxn.btnLabel, { color: commentColor }]}>Comment</Text>
        </Pressable>

        {/* Share */}
        <Pressable
          style={rxn.btn}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share"
          {...(Platform.OS === 'android'
            ? { android_ripple: { color: colors.textSecondary + '22', borderless: false } }
            : {})}
        >
          <Ionicons name="share-social-outline" size={21} color={shareColor} />
          <Text style={[rxn.btnLabel, { color: shareColor }]}>Share</Text>
        </Pressable>
      </View>

      <CommentsSheet visible={showComments} onClose={() => setShowComments(false)} post={post} colors={colors} />
    </>
  );
}

const rxn = StyleSheet.create({
  likeSummary:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  likeSummaryText: { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 17 },
  wrap:            { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  btn:             { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, minHeight: 48 },
  btnLabel:        { fontSize: 13, fontFamily: 'Poppins_500Medium', lineHeight: 18 },
});

// ── Post card header ──────────────────────────────────────────────────────────

function PostCardHeader({ post, accent, colors, colorIdx, onMorePress }: {
  post: FeedPost; accent: string; colors: ReturnType<typeof useColors>;
  colorIdx: number; onMorePress: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const badge = post.kind === 'event'
    ? { icon: 'calendar-outline' as const, label: 'Event',  color: CultureTokens.gold }
    : post.kind === 'announcement'
      ? post.postStyle === 'story'
        ? { icon: 'aperture-outline' as const, label: 'Story', color: CultureTokens.purple }
        : { icon: 'megaphone-outline' as const, label: 'Update', color: CultureTokens.teal }
      : null;
  const showMatch = isAuthenticated && (post.matchReason?.length ?? 0) > 0 && (post.score ?? 0) > 0.35;

  return (
    <View style={ph.row}>
      <CommAvatar community={post.community} size={42} colorIdx={colorIdx} />
      <View style={ph.info}>
        <View style={ph.nameRow}>
          <Text style={[ph.name, { color: colors.text }]} numberOfLines={1}>{post.community.name}</Text>
          {post.community.isVerified && (
            <Ionicons name="checkmark-circle" size={14} color={CultureTokens.indigo} />
          )}
        </View>
        <View style={ph.metaRow}>
          <Text style={[ph.time, { color: colors.textTertiary }]}>{timeAgo(post.createdAt)}</Text>
          {badge && (
            <>
              <Text style={[ph.sep, { color: colors.textTertiary }]}>·</Text>
              <View style={[ph.pill, { backgroundColor: badge.color + '18' }]}>
                <Ionicons name={badge.icon} size={9} color={badge.color} />
                <Text style={[ph.pillText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            </>
          )}
          {showMatch && (
            <>
              <Text style={[ph.sep, { color: colors.textTertiary }]}>·</Text>
              <View style={[ph.pill, { backgroundColor: CultureTokens.indigo + '15' }]}>
                <Ionicons name="sparkles" size={9} color={CultureTokens.indigo} />
                <Text style={[ph.pillText, { color: CultureTokens.indigo }]} numberOfLines={1}>
                  {post.matchReason![0]}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
      <Pressable
        onPress={onMorePress}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Post options"
        style={ph.moreBtn}
        {...(Platform.OS === 'android'
          ? { android_ripple: { color: CultureTokens.indigo + '18', borderless: true } }
          : {})}
      >
        <Ionicons name="ellipsis-horizontal" size={18} color={colors.textTertiary} />
      </Pressable>
    </View>
  );
}

const ph = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  info:    { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name:    { fontSize: 14, fontFamily: 'Poppins_700Bold', flex: 1, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  time:    { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 16 },
  sep:     { fontSize: 12, lineHeight: 16 },
  pill:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pillText:{ fontSize: 10, fontFamily: 'Poppins_600SemiBold', lineHeight: 14 },
  moreBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ── Post card ─────────────────────────────────────────────────────────────────

// -- PostCard Memoized --
function PostCardInner({ post, colorIdx }: { post: FeedPost; colorIdx: number }) {
  const colors = useColors();
  const isDark = useColorScheme() === 'dark';
  const accent = ACCENT[colorIdx % ACCENT.length];
  const { user, isAuthenticated } = useAuth();
  const gate = useAuthGate();

  const [hidden,     setHidden]     = useState(false);
  const [showMore,   setShowMore]   = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(false);

  const isOwn = isAuthenticated && user?.id === (post as { authorId?: string }).authorId;

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (post.kind === 'event') {
      router.push({ pathname: '/event/[id]', params: { id: post.event.id } });
    } else {
      router.push({ pathname: '/community/[id]', params: { id: post.community.id } });
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
        const ev = post.event;
        const dateLabel = getDateLabel(ev.date);
        const isFree    = ev.isFree || ev.priceCents === 0;
        return (
          <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={`View event: ${ev.title}`}>
            {/* Hero image */}
            <View style={pcd.eventImg}>
              <Image
                source={{ uri: ev.imageUrl ?? undefined }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                transition={200}
              />
              {/* Bottom gradient overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0.35 }}
              />

              {/* Top-left: category / date badge */}
              <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" style={pcd.datePill}>
                <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.9)" />
                <Text style={pcd.datePillText}>{dateLabel}</Text>
              </BlurView>

              {/* Top-right: price pill */}
              <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" style={[pcd.pricePill, { backgroundColor: isFree ? CultureTokens.teal + 'AA' : accent + 'AA' }]}>
                <Text style={pcd.pricePillText}>{isFree ? 'Free' : ev.priceLabel ?? 'Tickets'}</Text>
              </BlurView>

              {/* Bottom-left: venue + city */}
              <View style={pcd.eventFooter}>
                <View style={pcd.eventInfoRow}>
                  <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.8)" />
                  <Text style={pcd.eventInfoText} numberOfLines={1}>
                    {[ev.venue, ev.city].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {(ev.attending ?? 0) > 0 && (
                  <View style={pcd.eventInfoRow}>
                    <Ionicons name="people-outline" size={11} color="rgba(255,255,255,0.8)" />
                    <Text style={pcd.eventInfoText}>{ev.attending} going</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Card body */}
            <View style={pcd.eventBody}>
              <Text style={[pcd.eventTitle, { color: colors.text }]} numberOfLines={2}>{ev.title}</Text>
              {/* Meta: date + time */}
              <View style={pcd.eventMeta}>
                <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
                <Text style={[pcd.eventMetaText, { color: colors.textTertiary }]}>
                  {dateLabel}{ev.time ? ` at ${ev.time}` : ''}
                </Text>
                {ev.venue ? (
                  <>
                    <Text style={[pcd.eventMetaText, { color: colors.textTertiary }]}>·</Text>
                    <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
                    <Text style={[pcd.eventMetaText, { color: colors.textTertiary }]} numberOfLines={1}>{ev.venue}</Text>
                  </>
                ) : null}
              </View>
              <View style={[pcd.viewRow, { borderColor: accent + '60', backgroundColor: accent + '10' }]}>
                <Text style={[pcd.viewText, { color: accent }]}>View Event</Text>
                <Ionicons name="arrow-forward" size={14} color={accent} />
              </View>
            </View>
          </Pressable>
        );
      }

      case 'announcement': {
        if (post.postStyle === 'story') {
          return (
            <Pressable onPress={handlePress}>
              {post.imageUrl ? (
                <View style={pcd.storyFrame}>
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={pcd.storyImg}
                    contentFit="cover"
                    transition={200}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.82)']}
                    style={pcd.storyGradient}
                    start={{ x: 0.5, y: 0.35 }}
                  />
                  <View style={pcd.storyCaption}>
                    <Text style={pcd.storyCaptionText}>{post.body}</Text>
                  </View>
                </View>
              ) : (
                <View style={[pcd.storyTextCard, { borderColor: accent + '35', backgroundColor: accent + '10' }]}>
                  <Ionicons name="chatbox-ellipses-outline" size={26} color={accent} style={pcd.storyTextCardIcon} />
                  <Text style={[pcd.storyTextCardBody, { color: colors.text }]}>{post.body}</Text>
                </View>
              )}
            </Pressable>
          );
        }
        const MAX_LINES = 4;
        return (
          <Pressable onPress={handlePress}>
            {post.imageUrl && (
              <Image
                source={{ uri: post.imageUrl }}
                style={pcd.postImg}
                contentFit="cover"
                transition={200}
              />
            )}
            <View style={pcd.announcementBody}>
              <Text
                style={[pcd.announcementText, { color: colors.text }]}
                numberOfLines={bodyExpanded ? undefined : MAX_LINES}
              >
                {post.body}
              </Text>
              {!bodyExpanded && post.body.length > 180 && (
                <Pressable onPress={(e) => { e.stopPropagation?.(); setBodyExpanded(true); }}>
                  <Text style={[pcd.readMore, { color: accent }]}>Read more</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        );
      }

      case 'welcome':
        return (
          <Pressable onPress={handlePress} style={pcd.welcomeWrap}>
            <LinearGradient colors={[accent + '1C', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <View style={[pcd.welcomeIconWrap, { backgroundColor: accent + '22' }]}>
              <Ionicons name="people" size={28} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[pcd.welcomeTitle, { color: colors.text }]}>Welcome to {post.community.name}!</Text>
              <Text style={[pcd.welcomeSub, { color: colors.textSecondary }]} numberOfLines={2}>
                {getCommunityHeadline(post.community)}
              </Text>
            </View>
          </Pressable>
        );

      case 'milestone':
        return (
          <Pressable onPress={handlePress} style={[pcd.milestoneWrap, { borderColor: accent + '30', backgroundColor: accent + '0A' }]}>
            <LinearGradient colors={[accent + '20', 'transparent']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={[pcd.milestoneIcon, { backgroundColor: accent + '22' }]}>
              <Ionicons name="trophy" size={24} color={accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[pcd.milestoneTitle, { color: colors.text }]}>
                🎉 {post.community.name} reached {post.members.toLocaleString()} members!
              </Text>
              <Text style={[pcd.milestoneSub, { color: colors.textSecondary }]}>Be part of the growing community</Text>
            </View>
          </Pressable>
        );

      case 'collection-highlight':
        return (
          <Pressable onPress={handlePress} style={[pcd.milestoneWrap, { borderColor: CultureTokens.gold + '40', backgroundColor: CultureTokens.gold + '08', padding: 18 }]}>
            <LinearGradient colors={[CultureTokens.gold + '15', 'transparent']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <View style={[pcd.milestoneIcon, { backgroundColor: CultureTokens.gold + '20', width: 56, height: 56, borderRadius: 18 }]}>
              <Ionicons name="ribbon" size={28} color={CultureTokens.gold} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[pcd.milestoneTitle, { color: colors.text, fontSize: 15 }]}>
                {post.userName} earned the {post.tokenName} Explorer Token!
              </Text>
              <Text style={[pcd.milestoneSub, { color: colors.textSecondary }]}>Shared to {post.community.name}</Text>
            </View>
          </Pressable>
        );
    }
  };

  // Mobile: full-bleed borderless post. Desktop/web: card with shadow.
  const isMobile = Platform.OS !== 'web';
  const cardStyle = isMobile
    ? {
        backgroundColor: colors.surface,
        borderRadius: CardTokens.radius,
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginBottom: 16,
        marginHorizontal: 12,
        overflow: 'hidden' as const,
        ...Platform.select({
          android: { elevation: 2 },
          default: {},
        }),
      }
    : {
        backgroundColor: colors.surface,
        borderRadius: CardTokens.radius,
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginBottom: 20,
        overflow: 'hidden' as const,
        ...Platform.select<ViewStyle>({
          web: (isDark
            ? { boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }
            : { boxShadow: '0 8px 24px rgba(44,42,114,0.12)' }) as ViewStyle,
          ios: isDark
            ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 }
            : { shadowColor: '#2C2A72', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
          android: { elevation: 3 },
          default: isDark
            ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 }
            : { shadowColor: '#2C2A72', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
        }),
      };

  return (
    <>
      <View style={[pcd.card, cardStyle]}>
        <PostCardHeader post={post} accent={accent} colors={colors} colorIdx={colorIdx} onMorePress={handleMorePress} />
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

PostCardInner.displayName = 'PostCard';
const PostCard = React.memo(
  PostCardInner,
  (prev, next) => {
    const a = prev.post;
    const b = next.post;
    if (prev.colorIdx !== next.colorIdx) return false;
    if (a.id !== b.id || a.kind !== b.kind || a.createdAt !== b.createdAt) return false;

    if (a.kind === 'event' && b.kind === 'event') {
      return (
        a.event.id === b.event.id &&
        a.event.title === b.event.title &&
        a.event.imageUrl === b.event.imageUrl &&
        a.event.attending === b.event.attending &&
        a.event.date === b.event.date &&
        a.event.time === b.event.time
      );
    }
    if (a.kind === 'announcement' && b.kind === 'announcement') {
      return (
        a.body === b.body &&
        a.imageUrl === b.imageUrl &&
        a.postStyle === b.postStyle &&
        a.likesCount === b.likesCount &&
        a.commentsCount === b.commentsCount
      );
    }
    if (a.kind === 'milestone' && b.kind === 'milestone') {
      return a.members === b.members && a.community.id === b.community.id;
    }
    if (a.kind === 'welcome' && b.kind === 'welcome') {
      return a.community.id === b.community.id;
    }
    if (a.kind === 'collection-highlight' && b.kind === 'collection-highlight') {
      return (
        a.tokenName === b.tokenName &&
        a.userName === b.userName &&
        a.community.id === b.community.id
      );
    }
    return false;
  },
);

const pcd = StyleSheet.create({
  card: {},

  // ── Event ─────────────────────────────────────────────────────────────────
  eventImg:     { height: Platform.OS === 'web' ? 260 : 320, position: 'relative', backgroundColor: '#0D0D14' },
  datePill:     { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  datePillText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: 'rgba(255,255,255,0.95)', lineHeight: 15 },
  pricePill:    { position: 'absolute', top: 14, right: 14, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pricePillText:{ fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 15 },
  eventFooter:  { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, gap: 5 },
  eventInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventInfoText:{ fontSize: 13, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.9)', flex: 1, lineHeight: 18 },
  eventBody:    { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, gap: 10 },
  eventTitle:   { fontSize: 19, fontFamily: 'Poppins_700Bold', lineHeight: 27, letterSpacing: -0.3 },
  eventMeta:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventMetaText:{ fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 17 },
  viewRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, marginBottom: 4 },
  viewText:     { fontSize: 13, fontFamily: 'Poppins_700Bold', lineHeight: 18 },

  // ── Announcement ──────────────────────────────────────────────────────────
  postImg:         { height: 260, width: '100%', backgroundColor: '#0D0D14' },
  storyFrame:      { width: '100%', aspectRatio: 9 / 16, maxHeight: 520, backgroundColor: '#0D0D14', position: 'relative' },
  storyImg:        { ...StyleSheet.absoluteFillObject },
  storyGradient:   { ...StyleSheet.absoluteFillObject },
  storyCaption:    { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 28, paddingBottom: 18 },
  storyCaptionText:{ fontSize: 16, fontFamily: 'Poppins_600SemiBold', lineHeight: 22, color: '#fff' },
  storyTextCard:   { marginHorizontal: 16, marginBottom: 12, padding: 18, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  storyTextCardIcon: { marginBottom: 6 },
  storyTextCardBody:{ fontSize: 17, fontFamily: 'Poppins_600SemiBold', lineHeight: 24, textAlign: 'center' },
  announcementBody:{ paddingHorizontal: 16, paddingVertical: 14 },
  announcementText:{ fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 23, letterSpacing: 0.1 },
  readMore:        { fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginTop: 6, lineHeight: 20 },

  // ── Welcome ───────────────────────────────────────────────────────────────
  welcomeWrap:    { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, overflow: 'hidden' },
  welcomeIconWrap:{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle:   { fontSize: 15, fontFamily: 'Poppins_700Bold', lineHeight: 22 },
  welcomeSub:     { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19, marginTop: 3 },

  // ── Milestone / Collection ────────────────────────────────────────────────
  milestoneWrap: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginBottom: 6, padding: 16, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  milestoneIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  milestoneTitle:{ fontSize: 14, fontFamily: 'Poppins_700Bold', lineHeight: 20 },
  milestoneSub:  { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 17 },
});

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard({ colors }: { colors: ReturnType<typeof useColors> }) {
  const anim = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 0.9,  duration: 850, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(anim, { toValue: 0.35, duration: 850, useNativeDriver: USE_NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [anim]);
  const bg = { backgroundColor: colors.borderLight, opacity: anim };
  return (
    <View style={[sk.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
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
        <Animated.View style={[sk.viewBtn, { marginTop: 10 }, bg]} />
      </View>
      <View style={[sk.reactions, { borderTopColor: colors.borderLight }]}>
        {[0, 1, 2].map((i) => <Animated.View key={i} style={[sk.reactionBtn, bg]} />)}
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  card:       { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 18, marginHorizontal: Platform.OS === 'web' ? 0 : 12 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  avatar:     { width: 38, height: 38, borderRadius: 19 },
  image:      { height: 200 },
  bodyPad:    { padding: 14 },
  line:       { height: 12, borderRadius: 6 },
  viewBtn:    { height: 32, width: 120, borderRadius: 20 },
  reactions:  { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, padding: 12, gap: 16 },
  reactionBtn:{ height: 22, width: 56, borderRadius: 6 },
});

// ── Create post modal ─────────────────────────────────────────────────────────

function CreatePostModal({ visible, onClose, onSubmit, communities, colors, mode = 'standard' }: {
  visible: boolean; onClose: () => void;
  onSubmit: (
    communityId: string,
    communityName: string,
    body: string,
    imageUri?: string,
    postStyle?: 'standard' | 'story',
  ) => void | Promise<void>;
  communities: Community[]; colors: ReturnType<typeof useColors>;
  mode?: 'standard' | 'story';
}) {
  const [body,         setBody]         = useState('');
  const [selectedComm, setSelectedComm] = useState<Community | null>(null);
  const [imageUri,     setImageUri]     = useState<string | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');

  const maxChars = mode === 'story' ? 280 : 500;

  useEffect(() => {
    if (!visible) return;
    setBody('');
    setImageUri(null);
    setError('');
  }, [visible, mode]);

  useEffect(() => {
    if (visible && communities.length > 0) {
      setSelectedComm(communities[0]);
    }
  }, [visible, communities]);

  const handleClose = useCallback(() => {
    setBody(''); setImageUri(null); setError(''); onClose();
  }, [onClose]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { setError('Library permission denied'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: mode === 'story' ? [9, 16] : [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }, [mode]);

  const handleSubmit = useCallback(async () => {
    if (!body.trim() || !selectedComm || submitting) return;
    if (body.trim().length > maxChars) {
      setError(mode === 'story' ? `Story must be under ${maxChars} characters.` : 'Post must be under 500 characters.');
      return;
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(true); setError('');
    try {
      await onSubmit(
        selectedComm.id,
        selectedComm.name,
        body.trim(),
        imageUri || undefined,
        mode === 'story' ? 'story' : 'standard',
      );
      setBody(''); setImageUri(null); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post.');
    } finally {
      setSubmitting(false);
    }
  }, [body, selectedComm, submitting, onSubmit, onClose, imageUri, maxChars, mode]);

  const remaining = maxChars - body.length;
  const canPost   = body.trim().length > 0 && selectedComm !== null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS !== 'web'}
      >
        <View style={[cpm.backdrop]}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]} onPress={Keyboard.dismiss} />
          <View style={[cpm.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[cpm.handle, { backgroundColor: colors.border }]} />
            <View style={[cpm.header, { borderBottomColor: colors.borderLight }]}>
              <Button variant="ghost" size="sm" onPress={handleClose}>Cancel</Button>
              <Text style={[cpm.title, { color: colors.text }]}>
                {mode === 'story' ? 'Story status' : 'Create Post'}
              </Text>
              <Button variant="primary" size="sm" onPress={handleSubmit} disabled={!canPost} loading={submitting}>Post</Button>
            </View>

            {communities.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={cpm.commScroll} contentContainerStyle={cpm.commRow}>
                {communities.slice(0, 8).map((c) => {
                  const active = selectedComm?.id === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      style={[cpm.chip, {
                        borderColor:     active ? CultureTokens.indigo : colors.border,
                        backgroundColor: active ? CultureTokens.indigo : colors.background,
                      }]}
                      onPress={() => setSelectedComm(c)}
                    >
                      <Text style={[cpm.chipText, { color: active ? '#fff' : colors.textSecondary }]} numberOfLines={1}>{c.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <TextInput
              style={[cpm.input, { color: colors.text }]}
              placeholder={
                mode === 'story'
                  ? `Short story for ${selectedComm?.name ?? 'your community'}…`
                  : `Share something with ${selectedComm?.name ?? 'your community'}…`
              }
              placeholderTextColor={colors.textTertiary}
              value={body}
              onChangeText={(t) => { setBody(t); setError(''); }}
              multiline
              maxLength={maxChars}
              autoFocus
              textAlignVertical="top"
            />

            {imageUri && (
              <View style={mode === 'story' ? cpm.imgPreviewWrapStory : cpm.imgPreviewWrap}>
                <Image source={{ uri: imageUri }} style={cpm.imgPreview} contentFit="cover" />
                <Pressable style={cpm.removeImg} onPress={() => setImageUri(null)}>
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </Pressable>
              </View>
            )}

            <View style={[cpm.toolbar, { borderTopColor: colors.borderLight }]}>
              <Pressable style={[cpm.toolbarBtn, { backgroundColor: CultureTokens.indigo + '12' }]} onPress={pickImage}>
                <Ionicons name="image-outline" size={20} color={CultureTokens.indigo} />
                <Text style={[cpm.toolbarText, { color: CultureTokens.indigo }]}>Photo</Text>
              </Pressable>
            </View>

            <View style={cpm.footer}>
              {error
                ? <Text style={[cpm.error, { color: CultureTokens.coral }]}>{error}</Text>
                : <View />}
              <Text style={[cpm.charCount, { color: remaining < 50 ? CultureTokens.coral : colors.textTertiary }]}>{remaining}</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const cpm = StyleSheet.create({
  backdrop:    { flex: 1, justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, paddingBottom: 34, minHeight: 340 },
  handle:      { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title:       { fontSize: 16, fontFamily: 'Poppins_600SemiBold', lineHeight: 22 },
  commScroll:  { maxHeight: 52 },
  commRow:     { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, maxWidth: 140 },
  chipText:    { fontSize: 12, fontFamily: 'Poppins_500Medium', lineHeight: 17 },
  input:       { minHeight: 120, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
  imgPreviewWrap:{ marginHorizontal: 18, marginBottom: 12, height: 160, borderRadius: 14, overflow: 'hidden' },
  imgPreviewWrapStory:{ marginHorizontal: 18, marginBottom: 12, height: 220, borderRadius: 14, overflow: 'hidden' },
  imgPreview:  { width: '100%', height: '100%' },
  removeImg:   { position: 'absolute', top: 8, right: 8 },
  toolbar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  toolbarBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  toolbarText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', lineHeight: 18 },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 8 },
  error:       { fontSize: 12, fontFamily: 'Poppins_500Medium', flex: 1, lineHeight: 17 },
  charCount:   { fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 15 },
});

// ── Feed list header (stories + create post + guest banner + divider) ─────────

function FeedListHeader({ communities, authUser, colors, isAuthenticated, hPad, city, onCreatePost, canPostStoryStatus, onCreateStoryPost }: {
  communities: Community[]; authUser: { displayName?: string | null; avatarUrl?: string | null } | null;
  colors: ReturnType<typeof useColors>; isAuthenticated: boolean;
  hPad: number; city: string; onCreatePost: () => void;
  canPostStoryStatus?: boolean;
  onCreateStoryPost?: () => void;
}) {
  return (
    <View>
      {/* Stories / communities row */}
      {communities.length > 0 && (
        <StoriesBar
          communities={communities}
          authUser={authUser}
          colors={colors}
          isAuthenticated={isAuthenticated}
          onCreatePost={onCreatePost}
          canPostStoryStatus={canPostStoryStatus}
          onCreateStoryPost={onCreateStoryPost}
          hPad={hPad}
        />
      )}

      {/* Create post + guest banner */}
      <View style={[flh.createWrap, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <CreatePostStub authUser={authUser} colors={colors} isAuthenticated={isAuthenticated} onPress={onCreatePost} city={city} />
        {!isAuthenticated && <GuestBanner colors={colors} />}
      </View>

      {/* Section header */}
      <View style={[flh.divider, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <View style={[flh.divLine, { backgroundColor: colors.borderLight }]} />
        <View style={[flh.divPill, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="sparkles" size={10} color={CultureTokens.indigo} />
          <Text style={[flh.divText, { color: colors.textTertiary }]}>Your Feed</Text>
        </View>
        <View style={[flh.divLine, { backgroundColor: colors.borderLight }]} />
      </View>
    </View>
  );
}

const flh = StyleSheet.create({
  createWrap: { gap: 12, paddingTop: 12, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  divider:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  divLine:    { flex: 1, height: StyleSheet.hairlineWidth },
  divPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  divText:    { fontSize: 10, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.8, textTransform: 'uppercase', lineHeight: 14 },
});

// ── Main screen ───────────────────────────────────────────────────────────────


// ── Re-exports for use in parent screen ──────────────────────────────────────
export { FeedFilterBar, SkeletonCard, FeedListHeader, PostCard, TrendingInterstitial, CreatePostModal, useAuthGate, COUNTRY_FLAG, ACCENT };
export type { FeedFilter, FeedPost, ListItem };
