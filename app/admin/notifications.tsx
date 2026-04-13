import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Skeleton } from '@/components/ui/Skeleton';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { interestCategories } from '@/constants/onboardingInterests';
<<<<<<< HEAD
import { CultureTokens, TextStyles } from '@/constants/theme';
||||||| 7dc71c1
import { CultureTokens } from '@/constants/theme';
=======
import {
  CardTokens,
  ChipTokens,
  CultureTokens,
  FontFamily,
  FontSize,
  IconSize,
  LineHeight,
  Spacing,
  TextStyles,
} from '@/constants/theme';
>>>>>>> cursor/onboarding-brand-lint-fixes
import { ALL_NATIONALITIES } from '@/constants/cultures';
import type { NotificationType } from '@/shared/schema';

type CampaignNotificationType = Extract<NotificationType, 'recommendation' | 'system' | 'event' | 'perk' | 'community'>;

interface CampaignFormState {
  title: string;
  message: string;
  type: CampaignNotificationType;
  city: string;
  country: string;
  interestsAny: string;
  communitiesAny: string;
  languagesAny: string;
  categoryIdsAny: string;
  /** Selected nationality IDs — drives ethnicityContains on API call */
  nationalityIds: string[];
  limit: string;
}

interface TargetedResult {
  dryRun: boolean;
  targetedCount: number;
  audiencePreview: { userId: string; city: string; country: string }[];
  idempotentReplay?: boolean;
  approvalToken?: string;
  approvalExpiresAt?: string;
}

const TYPE_OPTIONS: { value: CampaignNotificationType; icon: string; label: string }[] = [
  { value: 'recommendation', icon: 'sparkles-outline',  label: 'Recommendation' },
  { value: 'event',          icon: 'calendar-outline',  label: 'Event'          },
  { value: 'perk',           icon: 'gift-outline',      label: 'Perk'           },
  { value: 'community',      icon: 'people-outline',    label: 'Community'      },
  { value: 'system',         icon: 'settings-outline',  label: 'System'         },
];

const TITLE_MAX = 65;
const MESSAGE_MAX = 240;
const ADMIN_NOTIF_UI = {
  skeletonHeaderHeight: 100,
  skeletonCardHeight: 250,
  contentMaxWidth: 1100,
  tableSampleMaxRows: 12,
} as const;

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map(item => item.trim())
    .filter((item, i, arr) => item.length > 0 && item.length <= 80 && arr.indexOf(item) === i)
    .slice(0, 25);
}

// ─── Notification preview (iOS lock-screen style) ──────────────────────────
function NotificationPreview({ title, message }: { title: string; message: string }) {
  const colors = useColors();
  const displayTitle   = title.trim()   || 'Notification Title';
  const displayMessage = message.trim() || 'Your notification message will appear here.';

  return (
    <View style={[np.phone, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
      <View style={np.phoneDot} />
      <Text style={[np.phoneLabel, { color: colors.textTertiary }]}>Preview</Text>
      <View style={[np.notifCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <View style={np.notifHeader}>
          <View style={[np.notifIcon, { backgroundColor: CultureTokens.indigo }]}>
            <Ionicons name="notifications" size={13} color="white" />
          </View>
          <Text style={[np.notifApp, { color: colors.textSecondary }]}>CulturePass</Text>
          <Text style={[np.notifTime, { color: colors.textTertiary }]}>now</Text>
        </View>
        <Text style={[np.notifTitle, { color: colors.text }]} numberOfLines={1}>{displayTitle}</Text>
        <Text style={[np.notifBody,  { color: colors.textSecondary }]} numberOfLines={3}>{displayMessage}</Text>
      </View>
    </View>
  );
}

const np = StyleSheet.create({
<<<<<<< HEAD
  phone:      { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, alignItems: 'center' },
  phoneDot:   { width: 36, height: 5, borderRadius: 3, backgroundColor: 'rgba(128,128,128,0.25)' },
  phoneLabel: { ...TextStyles.badge, textTransform: 'uppercase', letterSpacing: 1.1 },
||||||| 7dc71c1
  phone:      { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, alignItems: 'center' },
  phoneDot:   { width: 36, height: 5, borderRadius: 3, backgroundColor: 'rgba(128,128,128,0.25)' },
  phoneLabel: { fontSize: 11, fontFamily: 'Poppins_500Medium', textTransform: 'uppercase', letterSpacing: 1.1 },
=======
  phone:      { borderRadius: CardTokens.radius, borderWidth: 1, padding: CardTokens.padding, gap: Spacing.md - 4, alignItems: 'center' },
  phoneDot:   { width: IconSize.xxl - 4, height: Spacing.sm - 3, borderRadius: Spacing.xs - 1, backgroundColor: 'rgba(128,128,128,0.25)' },
  phoneLabel: { fontSize: FontSize.micro, fontFamily: FontFamily.medium, textTransform: 'uppercase', letterSpacing: 1.1 },
>>>>>>> cursor/onboarding-brand-lint-fixes
  notifCard:  { 
    width: '100%', 
    borderRadius: CardTokens.radius - 2, 
    borderWidth: 1, 
    padding: Spacing.md - 2, 
    gap: Spacing.sm - 3 ,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 }
    })
  },
<<<<<<< HEAD
  notifHeader:{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  notifIcon:  { width: 20, height: 20, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  notifApp:   { flex: 1, ...TextStyles.captionSemibold },
  notifTime:  { ...TextStyles.badge },
  notifTitle: { ...TextStyles.cardTitle },
  notifBody:  { ...TextStyles.chip, lineHeight: 19 },
||||||| 7dc71c1
  notifHeader:{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  notifIcon:  { width: 20, height: 20, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  notifApp:   { flex: 1, fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  notifTime:  { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  notifTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  notifBody:  { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19 },
=======
  notifHeader:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm - 1, marginBottom: Spacing.xs },
  notifIcon:  { width: IconSize.md + 4, height: IconSize.md + 4, borderRadius: Spacing.sm - 3, alignItems: 'center', justifyContent: 'center' },
  notifApp:   { flex: 1, fontSize: FontSize.caption, fontFamily: FontFamily.semibold },
  notifTime:  { fontSize: FontSize.micro, fontFamily: FontFamily.regular },
  notifTitle: { fontSize: FontSize.body2, fontFamily: FontFamily.bold },
  notifBody:  { fontSize: FontSize.chip, fontFamily: FontFamily.regular, lineHeight: LineHeight.chip - 1 },
>>>>>>> cursor/onboarding-brand-lint-fixes
});

// ─── Char counter badge ─────────────────────────────────────────────────────
function CharCount({ value, max }: { value: string; max: number }) {
  const colors = useColors();
  const len = value.length;
  const over = len > max;
  return (
    <Text style={[cc.label, { color: over ? colors.error : len > max * 0.85 ? colors.warning : colors.textTertiary }]}>
      {len}/{max}
    </Text>
  );
}
<<<<<<< HEAD
const cc = StyleSheet.create({ label: { ...TextStyles.badge, textAlign: 'right', marginTop: -4 } });
||||||| 7dc71c1
const cc = StyleSheet.create({ label: { fontSize: 11, fontFamily: 'Poppins_500Medium', textAlign: 'right', marginTop: -4 } });
=======
const cc = StyleSheet.create({ label: { fontSize: FontSize.micro, fontFamily: FontFamily.medium, textAlign: 'right', marginTop: -4 } });
>>>>>>> cursor/onboarding-brand-lint-fixes

// ─── Section header ─────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[sh.label, { color: colors.textTertiary }]}>{children}</Text>;
}
<<<<<<< HEAD
const sh = StyleSheet.create({ label: { ...TextStyles.badge, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 } });
||||||| 7dc71c1
const sh = StyleSheet.create({ label: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 } });
=======
const sh = StyleSheet.create({ label: { fontSize: FontSize.micro, fontFamily: FontFamily.semibold, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: Spacing.sm + 2 } });
>>>>>>> cursor/onboarding-brand-lint-fixes

// ─── Quick-link row ─────────────────────────────────────────────────────────
function QuickLink({ icon, label, sub, accent, onPress }: { icon: string; label: string; sub: string; accent: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [ql.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }, pressed && { opacity: 0.75 }]}
      onPress={() => {
        if(Platform.OS !== 'web') Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
    >
      <View style={[ql.iconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ql.label, { color: colors.text }]}>{label}</Text>
        <Text style={[ql.sub, { color: colors.textSecondary }]} numberOfLines={1}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
    </Pressable>
  );
}
const ql = StyleSheet.create({
  card:     { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Spacing.md - 4, 
    borderRadius: CardTokens.radius - 2, 
    borderWidth: 1, 
    paddingHorizontal: Spacing.md - 2, 
    paddingVertical: Spacing.md - 4,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 2 }
    })
  },
<<<<<<< HEAD
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:    { ...TextStyles.chip },
  sub:      { ...TextStyles.badge, marginTop: 1 },
||||||| 7dc71c1
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:    { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  sub:      { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
=======
  iconWrap: { width: IconSize.xxl - 4, height: IconSize.xxl - 4, borderRadius: CardTokens.radius - 6, alignItems: 'center', justifyContent: 'center' },
  label:    { fontSize: FontSize.chip, fontFamily: FontFamily.semibold },
  sub:      { fontSize: FontSize.micro, fontFamily: FontFamily.regular, marginTop: Spacing.xs - 3 },
>>>>>>> cursor/onboarding-brand-lint-fixes
});

function NotificationsSkeleton() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const { hPad } = useLayout();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ height: ADMIN_NOTIF_UI.skeletonHeaderHeight, backgroundColor: CultureTokens.indigo, opacity: 0.8, paddingTop: topInset }} />
      <View style={{ padding: hPad, gap: Spacing.md }}>
        <View style={{ flexDirection: 'row', gap: Spacing.md - 4 }}>
          <Skeleton width="48%" height={60} borderRadius={CardTokens.radius - 2} />
          <Skeleton width="48%" height={60} borderRadius={CardTokens.radius - 2} />
        </View>
        <Skeleton width="100%" height={200} borderRadius={CardTokens.radius} />
        <Skeleton width="100%" height={ADMIN_NOTIF_UI.skeletonCardHeight} borderRadius={CardTokens.radius} />
      </View>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function AdminNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors = useColors();
  const { isDesktop, hPad } = useLayout();
  const { user } = useAuth();
  const { hasMinRole, isLoading: roleLoading } = useRole();
  const canAccess = hasMinRole('cityAdmin');
  const isCityAdmin = user?.role === 'cityAdmin';

  const [form, setForm] = useState<CampaignFormState>({
    title: '', message: '', type: 'recommendation',
    city: '', country: 'Australia',
    interestsAny: '', communitiesAny: '', languagesAny: '',
    categoryIdsAny: '', nationalityIds: [], limit: '200',
  });
  const [result, setResult]   = useState<TargetedResult | null>(null);
  const [approval, setApproval] = useState<{ token: string; expiresAt: string } | null>(null);
  const [localRemainingMs, setLocalRemainingMs] = useState(0);

  // Pre-fill city/country for city-scoped admins
  useEffect(() => {
    if (!isCityAdmin) return;
    setForm(prev => ({ ...prev, city: user?.city ?? prev.city, country: user?.country ?? prev.country }));
  }, [isCityAdmin, user?.city, user?.country]);

  // Invalidate approval when form changes
  useEffect(() => { setApproval(null); }, [
    form.title, form.message, form.type, form.city, form.country,
    form.interestsAny, form.communitiesAny, form.languagesAny,
    form.categoryIdsAny, form.nationalityIds, form.limit,
  ]);

  // Countdown timer
  useEffect(() => {
    if (!approval) { setLocalRemainingMs(0); return; }
    const tick = () => setLocalRemainingMs(Math.max(0, new Date(approval.expiresAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [approval]);

  const approvalStatusQuery = useQuery({
    queryKey: ['campaign-approval-status', approval?.token],
    queryFn: () => api.notifications.approvalStatus({ approvalToken: approval!.token }),
    enabled: Boolean(approval?.token),
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (approval && approvalStatusQuery.data && !approvalStatusQuery.data.valid) setApproval(null);
  }, [approval, approvalStatusQuery.data]);

  useEffect(() => {
    if (!roleLoading && !canAccess) router.replace('/(tabs)');
  }, [canAccess, roleLoading]);

  const categoryHint = useMemo(() => interestCategories.map(c => c.id).join(', '), []);

  const runCampaign = useMutation({
    mutationFn: async ({ dryRun, idempotencyKey, approvalToken }: { dryRun: boolean; idempotencyKey?: string; approvalToken?: string }) => {
      // Derive ethnicityContains from selected nationality labels
      const selectedLabels = ALL_NATIONALITIES
        .filter(n => form.nationalityIds.includes(n.id))
        .map(n => n.label)
        .join(', ');
      return api.notifications.targeted({
        title: form.title.trim(), message: form.message.trim(), type: form.type,
        idempotencyKey, approvalToken,
        city: form.city.trim() || undefined, country: form.country.trim() || undefined,
        interestsAny: parseCsv(form.interestsAny), communitiesAny: parseCsv(form.communitiesAny),
        languagesAny: parseCsv(form.languagesAny), categoryIdsAny: parseCsv(form.categoryIdsAny),
        ethnicityContains: selectedLabels || undefined,
        dryRun, limit: Number.isFinite(Number(form.limit)) ? Number(form.limit) : 200,
      });
    },
    onSuccess: data => {
      setResult(data);
      if (data.dryRun && data.approvalToken && data.approvalExpiresAt)
        setApproval({ token: data.approvalToken, expiresAt: data.approvalExpiresAt });
      if (!data.dryRun) setApproval(null);
    },
    onError: err => Alert.alert('Campaign Error', err instanceof Error ? err.message : 'Failed to process campaign'),
  });

  const validateAndRun = (dryRun: boolean) => {
    if (!form.title.trim() || !form.message.trim()) { Alert.alert('Missing fields', 'Title and message are required.'); return; }
    if (form.title.length > TITLE_MAX) { Alert.alert('Title too long', `Keep title under ${TITLE_MAX} characters.`); return; }
    if (form.message.length > MESSAGE_MAX) { Alert.alert('Message too long', `Keep message under ${MESSAGE_MAX} characters.`); return; }
    const lim = Number(form.limit);
    if (!Number.isFinite(lim) || lim < 1 || lim > 500) { Alert.alert('Invalid limit', 'Audience limit must be between 1 and 500.'); return; }
    if (!dryRun) {
      if (!approval?.token) { Alert.alert('Approval required', 'Run a dry run first to preview the audience and generate an approval token.'); return; }
      if (approvalStatusQuery.data && !approvalStatusQuery.data.valid) { Alert.alert('Approval expired', 'Run the dry run again.'); return; }
      if (new Date(approval.expiresAt).getTime() <= Date.now()) { Alert.alert('Approval expired', 'The dry-run approval token expired. Run dry run again before send.'); return; }
    }
    runCampaign.mutate({
      dryRun,
      idempotencyKey: dryRun ? undefined : `cp-campaign-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      approvalToken: dryRun ? undefined : approval?.token,
    });
  };

  if (roleLoading || (!canAccess && !roleLoading)) {
    return <NotificationsSkeleton />;
  }

  // Approval countdown
  const serverMs       = approvalStatusQuery.data?.remainingMs;
  const remainingMs    = typeof serverMs === 'number' ? serverMs : localRemainingMs;
  const remainingSec   = Math.max(0, Math.floor(remainingMs / 1000));
  const mmss           = `${String(Math.floor(remainingSec / 60)).padStart(2, '0')}:${String(remainingSec % 60).padStart(2, '0')}`;
  const isExpired      = remainingSec <= 0;
  const isWarning      = !isExpired && remainingSec <= 60;
  const approvalColor  = isExpired ? colors.error : isWarning ? colors.warning : colors.success;
  const approvalPct    = approval ? Math.min(100, (remainingMs / (5 * 60 * 1000)) * 100) : 0;

  // Active audience filter count (for badge)
  const filterCount = [form.city, form.country, form.interestsAny, form.communitiesAny,
    form.languagesAny, form.categoryIdsAny].filter(v => v.trim()).length
    + form.nationalityIds.length;

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(280)} style={[s.header, { paddingHorizontal: hPad, borderBottomColor: colors.divider }]}>
        <Pressable
          onPress={() => {
            if(Platform.OS !== 'web') Haptics.selectionAsync();
            if (router.canGoBack()) { router.back(); } else { router.replace('/(tabs)'); }
          }}
          style={[s.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
          accessibilityRole="button" accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.text }]}>Campaign Manager</Text>
          <Text style={[s.headerSub, { color: colors.textSecondary }]}>Push notification targeting</Text>
        </View>
        {/* Audience size summary pill */}
        {result ? (
          <View style={[s.audiencePill, { backgroundColor: result.dryRun ? colors.primaryGlow : CultureTokens.teal + '22',
            borderColor: result.dryRun ? colors.primary + '44' : CultureTokens.teal + '55' }]}>
            <Ionicons name={result.dryRun ? 'eye-outline' : 'send'} size={12}
              color={result.dryRun ? colors.primary : CultureTokens.teal} />
            <Text style={[s.audiencePillText, { color: result.dryRun ? colors.primary : CultureTokens.teal }]}>
              {result.targetedCount.toLocaleString()} {result.dryRun ? 'preview' : 'sent'}
            </Text>
          </View>
        ) : null}
      </Animated.View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: 40 + (Platform.OS === 'web' ? 0 : insets.bottom) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.contentCol, isDesktop && s.contentColDesktop]}>

          {/* Quick links */}
          <View style={s.quickRow}>
            <QuickLink
              icon="people-outline" label="User Roles"
              sub="Manage roles & permissions"
              accent={colors.error}
              onPress={() => router.push('/admin/users')}
            />
            <QuickLink
              icon="document-text-outline" label="Audit Logs"
              sub="View send & dry-run history"
              accent={colors.info}
              onPress={() => router.push('/admin/audit-logs')}
            />
          </View>

          {/* Main two-col area on desktop */}
          <View style={[s.mainArea, isDesktop && s.mainAreaDesktop]}>

            {/* LEFT — form */}
            <View style={[s.formCol, isDesktop && s.formColDesktop]}>

              {/* Notification content */}
              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <SectionLabel>Message Content</SectionLabel>

                <Input
                  label="Title"
                  placeholder="e.g. New Diwali events this weekend"
                  value={form.title}
                  onChangeText={v => setForm(p => ({ ...p, title: v }))}
                  leftIcon="notifications-outline"
                  maxLength={TITLE_MAX + 20}
                />
                <CharCount value={form.title} max={TITLE_MAX} />

                <Input
                  label="Message"
                  placeholder="Write the notification body…"
                  value={form.message}
                  onChangeText={v => setForm(p => ({ ...p, message: v }))}
                  leftIcon="chatbubble-outline"
                  multiline
                  maxLength={MESSAGE_MAX + 40}
                />
                <CharCount value={form.message} max={MESSAGE_MAX} />

                {/* Type selector */}
                <View style={s.typeLabelRow}>
                  <Text style={[s.typeLabel, { color: colors.textSecondary }]}>Notification Type</Text>
                </View>
                <View style={s.typeGrid}>
                  {TYPE_OPTIONS.map(opt => {
                    const active = form.type === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => setForm(p => ({ ...p, type: opt.value }))}
                        style={[
                          s.typeChip,
                          {
                            backgroundColor: active ? CultureTokens.indigo : colors.surfaceElevated,
                            borderColor: active ? CultureTokens.indigo : colors.borderLight,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={opt.label}
                      >
                        <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={14}
                          color={active ? 'white' : colors.textSecondary} />
                        <Text style={[s.typeChipText, { color: active ? 'white' : colors.textSecondary }]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Audience filters */}
              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <View style={s.sectionLabelRow}>
                  <SectionLabel>Audience Filters</SectionLabel>
                  {filterCount > 0 ? (
                    <View style={[s.filterBadge, { backgroundColor: CultureTokens.indigo }]}>
                      <Text style={s.filterBadgeText}>{filterCount} active</Text>
                    </View>
                  ) : null}
                </View>

                <View style={[s.row2, isDesktop && s.row2Desktop]}>
                  <View style={{ flex: 1 }}>
                    <Input label="City" placeholder="Sydney"
                      value={form.city}
                      onChangeText={v => setForm(p => ({ ...p, city: v }))}
                      editable={!isCityAdmin}
                      hint={isCityAdmin ? 'Fixed by your admin scope' : undefined}
                      leftIcon="location-outline"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input label="Country" placeholder="Australia"
                      value={form.country}
                      onChangeText={v => setForm(p => ({ ...p, country: v }))}
                      editable={!isCityAdmin}
                      leftIcon="flag-outline"
                    />
                  </View>
                </View>

                <Input label="Interests" placeholder="Business Networking, Food Festivals"
                  value={form.interestsAny}
                  onChangeText={v => setForm(p => ({ ...p, interestsAny: v }))}
                  leftIcon="heart-outline"
                  hint="Comma-separated. Match users with any of these interests."
                />
                <Input label="Communities" placeholder="Indian, Chinese"
                  value={form.communitiesAny}
                  onChangeText={v => setForm(p => ({ ...p, communitiesAny: v }))}
                  leftIcon="people-outline"
                  hint="Comma-separated. Match users in any of these communities."
                />
                <Input label="Languages" placeholder="Hindi, Mandarin"
                  value={form.languagesAny}
                  onChangeText={v => setForm(p => ({ ...p, languagesAny: v }))}
                  leftIcon="language-outline"
                  hint="Comma-separated."
                />
                <Input label="Category IDs" placeholder="cultural, food"
                  value={form.categoryIdsAny}
                  onChangeText={v => setForm(p => ({ ...p, categoryIdsAny: v }))}
                  hint={`Available: ${categoryHint}`}
                  leftIcon="list-outline"
                />

                {/* Nationality / Cultural Identity selector */}
                <View>
                  <Text style={[s.typeLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
                    Target by Nationality
                  </Text>
                  <View style={s.typeGrid}>
                    {ALL_NATIONALITIES.slice(0, 20).map(nat => {
                      const active = form.nationalityIds.includes(nat.id);
                      return (
                        <Pressable
                          key={nat.id}
                          onPress={() => setForm(p => ({
                            ...p,
                            nationalityIds: active
                              ? p.nationalityIds.filter(id => id !== nat.id)
                              : [...p.nationalityIds, nat.id],
                          }))}
                          style={[
                            s.typeChip,
                            {
                              backgroundColor: active ? CultureTokens.indigo : colors.surfaceElevated,
                              borderColor: active ? CultureTokens.indigo : colors.borderLight,
                            },
                          ]}
                          accessibilityRole="checkbox"
                          accessibilityLabel={nat.label}
                          accessibilityState={{ checked: active }}
                        >
                          <Text style={{ fontSize: 14 }}>{nat.emoji}</Text>
                          <Text style={[s.typeChipText, { color: active ? 'white' : colors.textSecondary }]}>
                            {nat.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {form.nationalityIds.length > 0 && (
                    <Pressable
                      onPress={() => setForm(p => ({ ...p, nationalityIds: [] }))}
                      style={{ marginTop: 6, alignSelf: 'flex-start' }}
                    >
                      <Text style={{ fontSize: FontSize.micro, color: colors.textTertiary, fontFamily: FontFamily.medium }}>
                        Clear selection
                      </Text>
                    </Pressable>
                  )}
                </View>

                <View style={[s.row2, isDesktop && s.row2Desktop]}>
                  <View style={{ flex: 1 }}>
                    <Input label="Audience limit" placeholder="200"
                      keyboardType="numeric" value={form.limit}
                      onChangeText={v => setForm(p => ({ ...p, limit: v }))}
                      leftIcon="options-outline"
                      hint="Max 500 per campaign."
                    />
                  </View>
                  <View style={{ flex: 1 }} />
                </View>
              </View>

              {/* Approval banner */}
              {approval ? (
                <View style={[s.approvalBanner, {
                  backgroundColor: approvalColor + '18',
                  borderColor: approvalColor + '44',
                }]}>
                  <View style={s.approvalBannerTop}>
                    <Ionicons
                      name={isExpired ? 'close-circle' : isWarning ? 'warning' : 'checkmark-circle'}
                      size={18} color={approvalColor}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.approvalBannerTitle, { color: approvalColor }]}>
                        {isExpired ? 'Approval Expired' : 'Dry Run Approved'}
                      </Text>
                      <Text style={[s.approvalBannerSub, { color: colors.textSecondary }]}>
                        {isExpired
                          ? 'Run a fresh dry run to generate a new approval.'
                          : `Valid for ${mmss} — ready to send.`}
                      </Text>
                    </View>
                    {!isExpired ? (
                      <Text style={[s.approvalCountdown, { color: approvalColor }]}>{mmss}</Text>
                    ) : null}
                  </View>
                  {/* Progress bar */}
                  {!isExpired ? (
                    <View style={[s.approvalBarTrack, { backgroundColor: approvalColor + '25' }]}>
                      <View style={[s.approvalBarFill, { width: `${approvalPct}%` as any, backgroundColor: approvalColor }]} />
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={[s.approvalHint, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
                  <Text style={[s.approvalHintText, { color: colors.textTertiary }]}>
                    Run a dry run first to preview your audience and generate a signed approval before sending.
                  </Text>
                </View>
              )}

              {/* Action buttons */}
              <View style={s.actionsRow}>
                <Pressable
                  style={({ pressed }) => [
                    s.dryRunBtn,
                    { borderColor: colors.primary + '60', backgroundColor: colors.primaryGlow },
                    pressed && { opacity: 0.8 },
                    runCampaign.isPending && { opacity: 0.6 },
                  ]}
                  onPress={() => validateAndRun(true)}
                  disabled={runCampaign.isPending}
                  accessibilityRole="button"
                  accessibilityLabel="Dry run"
                >
                  <Ionicons name="eye-outline" size={16} color={colors.primary} />
                  <Text style={[s.dryRunBtnText, { color: colors.primary }]}>
                    {runCampaign.isPending ? 'Running…' : 'Dry Run'}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    s.sendBtn,
                    { backgroundColor: approval && !isExpired ? CultureTokens.indigo : colors.border },
                    pressed && { opacity: 0.85 },
                    runCampaign.isPending && { opacity: 0.6 },
                  ]}
                  onPress={() =>
                    Alert.alert(
                      'Send Campaign',
                      `Send to up to ${Number(form.limit).toLocaleString()} users now?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Send', style: 'destructive', onPress: () => validateAndRun(false) },
                      ],
                    )
                  }
                  disabled={runCampaign.isPending || !approval || isExpired}
                  accessibilityRole="button"
                  accessibilityLabel="Send campaign"
                >
                  <Ionicons name="send" size={16} color={approval && !isExpired ? 'white' : colors.textTertiary} />
                  <Text style={[s.sendBtnText, { color: approval && !isExpired ? 'white' : colors.textTertiary }]}>
                    Send Now
                  </Text>
                </Pressable>
              </View>

            </View>

            {/* RIGHT — preview (desktop only inline, mobile at bottom) */}
            <View style={[s.previewCol, isDesktop && s.previewColDesktop]}>
              <SectionLabel>Live Preview</SectionLabel>
              <NotificationPreview title={form.title} message={form.message} />

              {/* Audience coverage summary when result exists */}
              {result ? (
                <View style={[s.statsCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                  <Text style={[s.statsCardTitle, { color: colors.text }]}>
                    {result.dryRun ? 'Dry Run Result' : 'Campaign Sent'}
                  </Text>

                  <View style={s.statRow}>
                    <View style={[s.statBox, { backgroundColor: colors.surfaceElevated }]}>
                      <Text style={[s.statNum, { color: colors.text }]}>{result.targetedCount.toLocaleString()}</Text>
                      <Text style={[s.statLabel, { color: colors.textSecondary }]}>Audience</Text>
                    </View>
                    <View style={[s.statBox, { backgroundColor: colors.surfaceElevated }]}>
                      <Text style={[s.statNum, { color: result.dryRun ? colors.primary : CultureTokens.teal }]}>
                        {result.dryRun ? 'Preview' : 'Sent'}
                      </Text>
                      <Text style={[s.statLabel, { color: colors.textSecondary }]}>Status</Text>
                    </View>
                  </View>

                  {result.idempotentReplay ? (
                    <View style={[s.replayBadge, { backgroundColor: colors.warning + '20', borderColor: colors.warning + '44' }]}>
                      <Ionicons name="refresh-circle-outline" size={14} color={colors.warning} />
                      <Text style={[s.replayText, { color: colors.warning }]}>Duplicate send prevented by idempotency key.</Text>
                    </View>
                  ) : null}

                  {/* Audience preview table */}
                  {result.audiencePreview.length > 0 ? (
                    <View style={{ marginTop: 10 }}>
                      <Text style={[s.previewTableTitle, { color: colors.textSecondary }]}>
                        Audience sample ({result.audiencePreview.length})
                      </Text>
                      <View style={[s.tableHeader, { borderBottomColor: colors.divider }]}>
                        <Text style={[s.thCell, { color: colors.textTertiary, flex: 2 }]}>User ID</Text>
                        <Text style={[s.thCell, { color: colors.textTertiary, flex: 1 }]}>City</Text>
                        <Text style={[s.thCell, { color: colors.textTertiary, flex: 1 }]}>Country</Text>
                      </View>
                      {result.audiencePreview.map((item, i) => (
                        <View
                          key={item.userId}
                          style={[
                            s.tableRow,
                            { borderBottomColor: colors.divider },
                            i % 2 === 0 ? { backgroundColor: colors.surfaceElevated + '60' } : null,
                          ]}
                        >
                          <Text style={[s.tdCell, { color: colors.text, flex: 2 }]} numberOfLines={1}>{item.userId}</Text>
                          <Text style={[s.tdCell, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>{item.city || '—'}</Text>
                          <Text style={[s.tdCell, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>{item.country || '—'}</Text>
                        </View>
                      ))}
                    </View>
                  ) : result ? (
                    <View style={[s.emptyAudience, { borderColor: colors.borderLight }]}>
                      <Ionicons name="people-outline" size={24} color={colors.textTertiary} />
                      <Text style={[s.emptyAudienceText, { color: colors.textTertiary }]}>No users matched this filter.</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const CONTENT_MAX = ADMIN_NOTIF_UI.contentMaxWidth;

const s = StyleSheet.create({
  container:        { flex: 1 },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:           {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md - 4,
    paddingVertical: Spacing.md - 4, borderBottomWidth: StyleSheet.hairlineWidth,
  },
<<<<<<< HEAD
  backBtn:          { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle:      { ...TextStyles.title3 },
  headerSub:        { ...TextStyles.caption, marginTop: 1 },
||||||| 7dc71c1
  backBtn:          { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle:      { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  headerSub:        { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
=======
  backBtn:          { width: IconSize.lg + Spacing.sm + 2, height: IconSize.lg + Spacing.sm + 2, borderRadius: CardTokens.radius - 7, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle:      { ...TextStyles.title3 },
  headerSub:        { ...TextStyles.caption, marginTop: Spacing.xs - 3 },
>>>>>>> cursor/onboarding-brand-lint-fixes

  audiencePill:     {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm - 3,
    paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs + 1, borderRadius: ChipTokens.radius, borderWidth: 1,
  },
<<<<<<< HEAD
  audiencePillText: { ...TextStyles.captionSemibold },
||||||| 7dc71c1
  audiencePillText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
=======
  audiencePillText: { fontSize: FontSize.caption, fontFamily: FontFamily.semibold },
>>>>>>> cursor/onboarding-brand-lint-fixes

  scroll:           { paddingTop: Spacing.md },
  contentCol:       { paddingHorizontal: Spacing.md },
  contentColDesktop:{ maxWidth: CONTENT_MAX, width: '100%', alignSelf: 'center' as const, paddingHorizontal: 0 },

  quickRow:         { flexDirection: 'row', gap: Spacing.md - 4, marginBottom: Spacing.md },

  mainArea:         { gap: Spacing.md },
  mainAreaDesktop:  { flexDirection: 'row', alignItems: 'flex-start', gap: CardTokens.paddingLarge },

  formCol:          { gap: Spacing.md - 2 },
  formColDesktop:   { flex: 3 },
  previewCol:       { gap: Spacing.md - 2, marginTop: Spacing.xs },
  previewColDesktop:{ flex: 2 },

  card:             { 
    borderRadius: CardTokens.radius, 
    borderWidth: 1, 
    padding: CardTokens.padding, 
    gap: Spacing.md - 4,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 2 }
    })
  },

  sectionLabelRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -2 },
<<<<<<< HEAD
  filterBadge:      { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  filterBadgeText:  { ...TextStyles.tabLabel, color: "white", textTransform: 'uppercase' },
||||||| 7dc71c1
  filterBadge:      { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  filterBadgeText:  { fontSize: 10, fontFamily: 'Poppins_700Bold', color: "white", textTransform: 'uppercase' },
=======
  filterBadge:      { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs - 2, borderRadius: Spacing.sm },
  filterBadgeText:  { fontSize: FontSize.tab, fontFamily: FontFamily.bold, color: "white", textTransform: 'uppercase' },
>>>>>>> cursor/onboarding-brand-lint-fixes

<<<<<<< HEAD
  typeLabelRow:     { marginTop: 4 },
  typeLabel:        { ...TextStyles.caption, marginBottom: 8 },
  typeGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
||||||| 7dc71c1
  typeLabelRow:     { marginTop: 4 },
  typeLabel:        { fontSize: 12, fontFamily: 'Poppins_500Medium', marginBottom: 8 },
  typeGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
=======
  typeLabelRow:     { marginTop: Spacing.xs },
  typeLabel:        { fontSize: FontSize.caption, fontFamily: FontFamily.medium, marginBottom: Spacing.sm },
  typeGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
>>>>>>> cursor/onboarding-brand-lint-fixes
  typeChip:         {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm - 2,
    paddingHorizontal: ChipTokens.paddingH - 4, paddingVertical: ChipTokens.paddingV - 1,
    borderRadius: ChipTokens.radius, borderWidth: 1,
  },
<<<<<<< HEAD
  typeChipText:     { ...TextStyles.captionSemibold, textTransform: 'capitalize' },
||||||| 7dc71c1
  typeChipText:     { fontSize: 12, fontFamily: 'Poppins_600SemiBold', textTransform: 'capitalize' },
=======
  typeChipText:     { fontSize: FontSize.caption, fontFamily: FontFamily.semibold, textTransform: 'capitalize' },
>>>>>>> cursor/onboarding-brand-lint-fixes

  row2:             { gap: Spacing.md - 4 },
  row2Desktop:      { flexDirection: 'row' },

  // Approval
  approvalBanner:   { 
    borderRadius: CardTokens.radius - 2, 
    borderWidth: 1, 
    padding: Spacing.md - 2, 
    gap: Spacing.sm + 2,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 }
    })
  },
<<<<<<< HEAD
  approvalBannerTop:{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  approvalBannerTitle: { ...TextStyles.cardTitle },
  approvalBannerSub:{ ...TextStyles.caption, marginTop: 2 },
  approvalCountdown:{ ...TextStyles.title2, tabularNums: true } as any,
  approvalBarTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  approvalBarFill:  { height: 4, borderRadius: 2 },
||||||| 7dc71c1
  approvalBannerTop:{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  approvalBannerTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  approvalBannerSub:{ fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  approvalCountdown:{ fontSize: 20, fontFamily: 'Poppins_700Bold', tabularNums: true } as any,
  approvalBarTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  approvalBarFill:  { height: 4, borderRadius: 2 },
=======
  approvalBannerTop:{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm + 2 },
  approvalBannerTitle: { fontSize: FontSize.body2, fontFamily: FontFamily.bold },
  approvalBannerSub:{ fontSize: FontSize.caption, fontFamily: FontFamily.regular, marginTop: Spacing.xs - 2 },
  approvalCountdown:{ fontSize: FontSize.title2, fontFamily: FontFamily.bold, tabularNums: true } as any,
  approvalBarTrack: { height: Spacing.xs, borderRadius: Spacing.xs / 2, overflow: 'hidden' },
  approvalBarFill:  { height: Spacing.xs, borderRadius: Spacing.xs / 2 },
>>>>>>> cursor/onboarding-brand-lint-fixes

  approvalHint:     {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    borderRadius: CardTokens.radius - 4, borderWidth: 1, padding: Spacing.md - 4,
  },
<<<<<<< HEAD
  approvalHintText: { flex: 1, ...TextStyles.caption, lineHeight: 18 },
||||||| 7dc71c1
  approvalHintText: { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
=======
  approvalHintText: { flex: 1, fontSize: FontSize.caption, fontFamily: FontFamily.regular, lineHeight: LineHeight.caption + 2 },
>>>>>>> cursor/onboarding-brand-lint-fixes

  // Action buttons
  actionsRow:       { flexDirection: 'row', gap: Spacing.sm + 2 },
  dryRunBtn:        {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm - 1, paddingVertical: Spacing.md - 3, borderRadius: CardTokens.radius - 4, borderWidth: 1,
  },
<<<<<<< HEAD
  dryRunBtnText:    { ...TextStyles.cardTitle },
||||||| 7dc71c1
  dryRunBtnText:    { fontSize: 14, fontFamily: 'Poppins_700Bold' },
=======
  dryRunBtnText:    { fontSize: FontSize.body2, fontFamily: FontFamily.bold },
>>>>>>> cursor/onboarding-brand-lint-fixes
  sendBtn:          {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm - 1, paddingVertical: Spacing.md - 3, borderRadius: CardTokens.radius - 4,
  },
<<<<<<< HEAD
  sendBtnText:      { ...TextStyles.cardTitle },
||||||| 7dc71c1
  sendBtnText:      { fontSize: 14, fontFamily: 'Poppins_700Bold' },
=======
  sendBtnText:      { fontSize: FontSize.body2, fontFamily: FontFamily.bold },
>>>>>>> cursor/onboarding-brand-lint-fixes

  // Results / stats
  statsCard:        { 
    borderRadius: CardTokens.radius, 
    borderWidth: 1, 
    padding: CardTokens.padding, 
    gap: Spacing.md - 4,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 2 }
    })
  },
<<<<<<< HEAD
  statsCardTitle:   { ...TextStyles.callout },
  statRow:          { flexDirection: 'row', gap: 10 },
  statBox:          { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 2 },
  statNum:          { ...TextStyles.title3 },
  statLabel:        { ...TextStyles.badge, textTransform: 'uppercase', letterSpacing: 0.5 },
||||||| 7dc71c1
  statsCardTitle:   { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  statRow:          { flexDirection: 'row', gap: 10 },
  statBox:          { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 2 },
  statNum:          { fontSize: 22, fontFamily: 'Poppins_700Bold' },
  statLabel:        { fontSize: 11, fontFamily: 'Poppins_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
=======
  statsCardTitle:   { fontSize: FontSize.callout, fontFamily: FontFamily.bold },
  statRow:          { flexDirection: 'row', gap: Spacing.sm + 2 },
  statBox:          { flex: 1, borderRadius: CardTokens.radius - 4, padding: Spacing.md - 2, alignItems: 'center', gap: Spacing.xs - 2 },
  statNum:          { fontSize: FontSize.title, fontFamily: FontFamily.bold },
  statLabel:        { fontSize: FontSize.micro, fontFamily: FontFamily.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
>>>>>>> cursor/onboarding-brand-lint-fixes

  replayBadge:      {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm - 2,
    borderRadius: CardTokens.radius - 6, borderWidth: 1, padding: Spacing.sm + 2,
  },
<<<<<<< HEAD
  replayText:       { flex: 1, ...TextStyles.caption },
||||||| 7dc71c1
  replayText:       { flex: 1, fontSize: 12, fontFamily: 'Poppins_500Medium' },
=======
  replayText:       { flex: 1, fontSize: FontSize.caption, fontFamily: FontFamily.medium },
>>>>>>> cursor/onboarding-brand-lint-fixes

  // Audience table
<<<<<<< HEAD
  previewTableTitle:{ ...TextStyles.captionSemibold, marginBottom: 8 },
  tableHeader:      { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  thCell:           { ...TextStyles.tabLabel, textTransform: 'uppercase', letterSpacing: 0.8 },
||||||| 7dc71c1
  previewTableTitle:{ fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginBottom: 8 },
  tableHeader:      { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  thCell:           { fontSize: 10, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 0.8 },
=======
  previewTableTitle:{ fontSize: FontSize.caption, fontFamily: FontFamily.semibold, marginBottom: Spacing.sm },
  tableHeader:      { flexDirection: 'row', paddingBottom: Spacing.sm - 2, borderBottomWidth: StyleSheet.hairlineWidth },
  thCell:           { fontSize: FontSize.tab, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
>>>>>>> cursor/onboarding-brand-lint-fixes
  tableRow:         {
    flexDirection: 'row', paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
<<<<<<< HEAD
  tdCell:           { ...TextStyles.caption },
||||||| 7dc71c1
  tdCell:           { fontSize: 12, fontFamily: 'Poppins_400Regular' },
=======
  tdCell:           { fontSize: FontSize.caption, fontFamily: FontFamily.regular },
>>>>>>> cursor/onboarding-brand-lint-fixes

  emptyAudience:    {
    alignItems: 'center', gap: Spacing.sm - 2, padding: Spacing.lg,
    borderRadius: CardTokens.radius - 4, borderWidth: 1, borderStyle: 'dashed', marginTop: Spacing.xs,
  },
<<<<<<< HEAD
  emptyAudienceText:{ ...TextStyles.chip },
||||||| 7dc71c1
  emptyAudienceText:{ fontSize: 13, fontFamily: 'Poppins_500Medium' },
=======
  emptyAudienceText:{ fontSize: FontSize.chip, fontFamily: FontFamily.medium },
>>>>>>> cursor/onboarding-brand-lint-fixes
});
