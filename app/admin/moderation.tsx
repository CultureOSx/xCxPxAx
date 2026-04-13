import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, Platform,
  Alert, ScrollView,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
<<<<<<< HEAD
import { CultureTokens, gradients, TextStyles } from '@/constants/theme';
||||||| 7dc71c1
import { CultureTokens, gradients } from '@/constants/theme';
=======
import {
  CardTokens,
  ChipTokens,
  Colors,
  CultureTokens,
  FontFamily,
  FontSize,
  gradients,
  IconSize,
  Spacing,
  TextStyles,
} from '@/constants/theme';
>>>>>>> cursor/onboarding-brand-lint-fixes
import { queryClient } from '@/lib/query-client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/ui/Card';

const isWeb = Platform.OS === 'web';
const MOD_UI = {
  emptyIconSize: 44,
} as const;

type ModerationTab = 'reports' | 'events';
type ReportStatus = 'pending' | 'resolved' | 'dismissed';

const TARGET_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  event:     { label: 'Event',     icon: 'calendar-outline',  color: CultureTokens.gold },
  community: { label: 'Community', icon: 'people-outline',    color: CultureTokens.indigo },
  profile:   { label: 'Profile',   icon: 'person-outline',    color: CultureTokens.teal },
  post:      { label: 'Post',      icon: 'chatbubble-outline', color: CultureTokens.purple },
  user:      { label: 'User',      icon: 'person-outline',    color: CultureTokens.coral },
};

function getMeta(targetType: string) {
  return TARGET_TYPE_META[targetType] ?? { label: targetType, icon: 'flag-outline', color: Colors.textTertiary };
}

function timeAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7)   return `${d}d ago`;
  if (d < 30)  return `${Math.floor(d / 7)}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────
function StatChip({ value, label, color, icon }: { value: number | string; label: string; color: string; icon: string }) {
  const colors = useColors();
  return (
    <View style={[sp.chip, { backgroundColor: colors.surface, borderColor: color + '30' }]}>
      <View style={[sp.icon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color={color} />
      </View>
      <View>
        <Text style={[sp.val, { color: colors.text }]}>{value}</Text>
        <Text style={[sp.lbl, { color: colors.textTertiary }]}>{label}</Text>
      </View>
    </View>
  );
}
const sp = StyleSheet.create({
<<<<<<< HEAD
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  icon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  val:  { ...TextStyles.headline },
  lbl:  { ...TextStyles.tabLabel },
||||||| 7dc71c1
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  icon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  val:  { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  lbl:  { fontSize: 10, fontFamily: 'Poppins_500Medium' },
=======
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: ChipTokens.paddingH - 4, paddingVertical: Spacing.sm + 2, borderRadius: CardTokens.radius - 2, borderWidth: 1 },
  icon: { width: IconSize.lg + 6, height: IconSize.lg + 6, borderRadius: Spacing.sm + 1, alignItems: 'center', justifyContent: 'center' },
  val:  { fontSize: FontSize.body, fontFamily: FontFamily.bold },
  lbl:  { fontSize: FontSize.tab, fontFamily: FontFamily.medium },
>>>>>>> cursor/onboarding-brand-lint-fixes
});

function ReportCardSkeleton() {
  return (
    <Card style={{ marginBottom: 10 }} padding={14}>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Skeleton width={80} height={20} borderRadius={8} />
          <Skeleton width={60} height={20} borderRadius={8} />
          <View style={{ flex: 1 }} />
          <Skeleton width={50} height={14} borderRadius={4} />
        </View>
        <View style={{ gap: 6 }}>
          <Skeleton width={60} height={10} />
          <Skeleton width="100%" height={18} />
          <Skeleton width="90%" height={14} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={80} height={34} borderRadius={10} />
          <Skeleton width={80} height={34} borderRadius={10} />
          <Skeleton width={80} height={34} borderRadius={10} />
        </View>
      </View>
    </Card>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────
function ReportCard({ report, onResolve, onDismiss, index }: {
  report: { id: string; targetType: string; targetId: string; reason: string; details?: string; reporterUserId: string; status: string; createdAt: string };
  onResolve: () => void;
  onDismiss: () => void;
  index: number;
}) {
  const colors = useColors();
  const meta   = getMeta(report.targetType);
  const isPending = report.status === 'pending';

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 280)).springify().damping(20)}>
      <View style={[rc.card, { backgroundColor: colors.surface, borderColor: isPending ? CultureTokens.coral + '30' : colors.borderLight }]}>
        <View style={[rc.accent, { backgroundColor: isPending ? CultureTokens.coral : colors.borderLight }]} />
        <View style={{ flex: 1, gap: 10 }}>
          {/* Header */}
          <View style={rc.header}>
            <View style={[rc.typeBadge, { backgroundColor: meta.color + '18', borderColor: meta.color + '44' }]}>
              <Ionicons name={meta.icon as keyof typeof Ionicons.glyphMap} size={12} color={meta.color} />
              <Text style={[rc.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <View style={[rc.statusBadge, {
              backgroundColor: isPending ? CultureTokens.coral + '14' : CultureTokens.success + '14',
              borderColor: isPending ? CultureTokens.coral + '40' : CultureTokens.success + '40',
            }]}>
              <Text style={[rc.statusText, { color: isPending ? CultureTokens.coral : CultureTokens.success }]}>
                {isPending ? 'Pending' : report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            <Text style={[rc.timeText, { color: colors.textTertiary }]}>{timeAgo(report.createdAt)}</Text>
          </View>

          {/* Reason */}
          <View>
            <Text style={[rc.reasonLabel, { color: colors.textTertiary }]}>Reason</Text>
            <Text style={[rc.reason, { color: colors.text }]}>{report.reason}</Text>
            {report.details ? (
              <Text style={[rc.details, { color: colors.textSecondary }]}>{report.details}</Text>
            ) : null}
          </View>

          {/* Target ID */}
          <View style={rc.metaRow}>
            <Ionicons name="link-outline" size={12} color={colors.textTertiary} />
            <Text style={[rc.metaText, { color: colors.textTertiary }]} numberOfLines={1}>
              ID: {report.targetId}
            </Text>
          </View>

          {/* Actions */}
          {isPending ? (
            <View style={rc.actions}>
              <Pressable
                style={[rc.actionBtn, { backgroundColor: CultureTokens.success + '18', borderColor: CultureTokens.success + '44' }]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onResolve();
                }}
                accessibilityRole="button"
                accessibilityLabel="Resolve report"
              >
                <Ionicons name="checkmark" size={14} color={CultureTokens.success} />
                <Text style={[rc.actionText, { color: CultureTokens.success }]}>Resolve</Text>
              </Pressable>
              <Pressable
                style={[rc.actionBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onDismiss();
                }}
                accessibilityRole="button"
                accessibilityLabel="Dismiss report"
              >
                <Ionicons name="close" size={14} color={colors.textSecondary} />
                <Text style={[rc.actionText, { color: colors.textSecondary }]}>Dismiss</Text>
              </Pressable>
              <Pressable
                style={[rc.actionBtn, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '40' }]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/${report.targetType}/${report.targetId}`);
                }}
                accessibilityRole="button"
                accessibilityLabel="View content"
              >
                <Ionicons name="eye-outline" size={14} color={CultureTokens.indigo} />
                <Text style={[rc.actionText, { color: CultureTokens.indigo }]}>View</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

const rc = StyleSheet.create({
<<<<<<< HEAD
  card:       { flexDirection: 'row', gap: 12, borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 14 },
  accent:     { width: 3, borderRadius: 2, flexShrink: 0, marginLeft: -14, marginRight: 0 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  typeBadgeText: { ...TextStyles.badge },
  statusBadge:{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText: { ...TextStyles.badge },
  timeText:   { ...TextStyles.caption },
  reasonLabel:{ ...TextStyles.tabLabel, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  reason:     { ...TextStyles.label },
  details:    { ...TextStyles.caption, marginTop: 4 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:   { ...TextStyles.badge, flex: 1 },
  actions:    { flexDirection: 'row', gap: 8 },
  actionBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 10, borderWidth: 1, paddingVertical: 9 },
  actionText: { ...TextStyles.captionSemibold },
||||||| 7dc71c1
  card:       { flexDirection: 'row', gap: 12, borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 14 },
  accent:     { width: 3, borderRadius: 2, flexShrink: 0, marginLeft: -14, marginRight: 0 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  typeBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold' },
  statusBadge:{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  timeText:   { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  reasonLabel:{ fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  reason:     { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  details:    { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 4 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:   { fontSize: 11, fontFamily: 'Poppins_400Regular', flex: 1 },
  actions:    { flexDirection: 'row', gap: 8 },
  actionBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 10, borderWidth: 1, paddingVertical: 9 },
  actionText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
=======
  card:       { flexDirection: 'row', gap: Spacing.md - 4, borderRadius: CardTokens.radius, borderWidth: 1, overflow: 'hidden', padding: Spacing.md - 2 },
  accent:     { width: Spacing.xs - 1, borderRadius: Spacing.xs - 2, flexShrink: 0, marginLeft: -(Spacing.md - 2), marginRight: 0 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  typeBadge:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Spacing.sm, borderWidth: 1 },
  typeBadgeText: { fontSize: FontSize.micro, fontFamily: FontFamily.bold },
  statusBadge:{ paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Spacing.sm, borderWidth: 1 },
  statusText: { fontSize: FontSize.micro, fontFamily: FontFamily.semibold },
  timeText:   { fontSize: FontSize.caption, fontFamily: FontFamily.regular },
  reasonLabel:{ fontSize: FontSize.tab, fontFamily: FontFamily.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs - 1 },
  reason:     { fontSize: FontSize.body2, fontFamily: FontFamily.medium },
  details:    { fontSize: FontSize.caption, fontFamily: FontFamily.regular, marginTop: Spacing.xs },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm - 3 },
  metaText:   { fontSize: FontSize.micro, fontFamily: FontFamily.regular, flex: 1 },
  actions:    { flexDirection: 'row', gap: Spacing.sm },
  actionBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm - 3, borderRadius: CardTokens.radius - 6, borderWidth: 1, paddingVertical: Spacing.sm + 1 },
  actionText: { fontSize: FontSize.caption, fontFamily: FontFamily.semibold },
>>>>>>> cursor/onboarding-brand-lint-fixes
});

// ─── Event Approval Card ──────────────────────────────────────────────────────
function EventApprovalCard({ event, onApprove, index }: {
  event: { id: string; title?: string; category?: string; city?: string; country?: string; date?: string; organizerId?: string; createdAt?: string; isFree?: boolean; priceCents?: number };
  onApprove: () => void;
  index: number;
}) {
  const colors = useColors();
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 280)).springify().damping(20)}>
      <View style={[ec.card, { backgroundColor: colors.surface, borderColor: CultureTokens.gold + '30' }]}>
        <View style={[ec.accent, { backgroundColor: CultureTokens.gold }]} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={ec.header}>
            <View style={[ec.catBadge, { backgroundColor: CultureTokens.gold + '18', borderColor: CultureTokens.gold + '44' }]}>
              <Text style={[ec.catText, { color: CultureTokens.gold }]}>{event.category ?? 'Event'}</Text>
            </View>
            <View style={{ flex: 1 }} />
            {event.createdAt ? (
              <Text style={[ec.time, { color: colors.textTertiary }]}>{timeAgo(event.createdAt)}</Text>
            ) : null}
          </View>
          <Text style={[ec.title, { color: colors.text }]} numberOfLines={2}>{event.title ?? 'Untitled Event'}</Text>
          <View style={ec.metaRow}>
            {event.city ? (
              <View style={ec.metaItem}>
                <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                <Text style={[ec.metaText, { color: colors.textSecondary }]}>{event.city}{event.country ? `, ${event.country}` : ''}</Text>
              </View>
            ) : null}
            {event.date ? (
              <View style={ec.metaItem}>
                <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
                <Text style={[ec.metaText, { color: colors.textSecondary }]}>{event.date}</Text>
              </View>
            ) : null}
            <View style={ec.metaItem}>
              <Ionicons name="pricetag-outline" size={12} color={colors.textTertiary} />
              <Text style={[ec.metaText, { color: colors.textSecondary }]}>
                {event.isFree ? 'Free' : event.priceCents ? `$${(event.priceCents / 100).toFixed(0)}` : 'Paid'}
              </Text>
            </View>
          </View>
          <View style={ec.actions}>
            <Pressable
              style={[ec.approveBtn, { backgroundColor: CultureTokens.teal }]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onApprove();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Approve ${event.title}`}
            >
              <Ionicons name="checkmark" size={15} color="#fff" />
              <Text style={ec.approveBtnText}>Approve & Publish</Text>
            </Pressable>
            <Pressable
              style={[ec.viewBtn, { borderColor: colors.borderLight }]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/event/${event.id}`);
              }}
              accessibilityRole="button"
            >
              <Ionicons name="eye-outline" size={15} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const ec = StyleSheet.create({
<<<<<<< HEAD
  card:       { flexDirection: 'row', gap: 12, borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 14 },
  accent:     { width: 3, borderRadius: 2, flexShrink: 0, marginLeft: -14, marginRight: 0 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catBadge:   { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  catText:    { ...TextStyles.badge },
  time:       { ...TextStyles.caption },
  title:      { ...TextStyles.callout },
  metaRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:   { ...TextStyles.caption },
  actions:    { flexDirection: 'row', gap: 8 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 10 },
  approveBtnText: { ...TextStyles.chip, color: '#fff' },
  viewBtn:    { width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1 },
||||||| 7dc71c1
  card:       { flexDirection: 'row', gap: 12, borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 14 },
  accent:     { width: 3, borderRadius: 2, flexShrink: 0, marginLeft: -14, marginRight: 0 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catBadge:   { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  catText:    { fontSize: 11, fontFamily: 'Poppins_700Bold' },
  time:       { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  title:      { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  metaRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:   { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  actions:    { flexDirection: 'row', gap: 8 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 10 },
  approveBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  viewBtn:    { width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1 },
=======
  card:       { flexDirection: 'row', gap: Spacing.md - 4, borderRadius: CardTokens.radius, borderWidth: 1, overflow: 'hidden', padding: Spacing.md - 2 },
  accent:     { width: Spacing.xs - 1, borderRadius: Spacing.xs - 2, flexShrink: 0, marginLeft: -(Spacing.md - 2), marginRight: 0 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  catBadge:   { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Spacing.sm, borderWidth: 1 },
  catText:    { fontSize: FontSize.micro, fontFamily: FontFamily.bold },
  time:       { fontSize: FontSize.caption, fontFamily: FontFamily.regular },
  title:      { fontSize: FontSize.callout, fontFamily: FontFamily.semibold },
  metaRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md - 4 },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metaText:   { fontSize: FontSize.caption, fontFamily: FontFamily.regular },
  actions:    { flexDirection: 'row', gap: Spacing.sm },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm - 2, borderRadius: CardTokens.radius - 4, paddingVertical: Spacing.sm + 2 },
  approveBtnText: { fontSize: FontSize.chip, fontFamily: FontFamily.semibold, color: '#fff' },
  viewBtn:    { width: IconSize.xxl, alignItems: 'center', justifyContent: 'center', borderRadius: CardTokens.radius - 4, borderWidth: 1 },
>>>>>>> cursor/onboarding-brand-lint-fixes
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
function ModerationContent() {
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors   = useColors();
  const { hPad } = useLayout();
  const { hasMinRole, isLoading: roleLoading } = useRole();
  const canAccess = hasMinRole('moderator');
  const [tab, setTab] = useState<ModerationTab>('reports');
  const [reportStatus, setReportStatus] = useState<ReportStatus>('pending');

  useEffect(() => {
    if (!roleLoading && !canAccess) router.replace('/(tabs)');
  }, [canAccess, roleLoading]);

  const reportsQuery = useQuery({
    queryKey: ['admin-reports', reportStatus],
    queryFn:  () => api.admin.listReports({ status: reportStatus, limit: 100 }),
    staleTime: 30_000,
    enabled:  canAccess,
  });

  const eventsQuery = useQuery({
    queryKey: ['admin-pending-events'],
    queryFn:  () => api.admin.pendingEvents(50),
    staleTime: 30_000,
    enabled:  canAccess && tab === 'events',
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'resolved' | 'dismissed' }) =>
      api.admin.resolveReport(id, status),
    onSuccess: () => {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: () => Alert.alert('Error', 'Failed to update report.'),
  });

  const publishMutation = useMutation({
    mutationFn: (eventId: string) => api.events.publish(eventId),
    onSuccess: () => {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['admin-pending-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: () => Alert.alert('Error', 'Failed to publish event.'),
  });

  const reports = reportsQuery.data?.reports ?? [];
  const events  = eventsQuery.data?.events ?? [];
  const pendingCount = reports.filter(r => r.status === 'pending').length;

  const handleResolve = (id: string) => {
    Alert.alert('Resolve Report', 'Mark this report as resolved? The content will remain visible.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resolve', onPress: () => resolveMutation.mutate({ id, status: 'resolved' }) },
    ]);
  };

  const handleDismiss = (id: string) => {
    Alert.alert('Dismiss Report', 'Dismiss this report as unfounded?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Dismiss', style: 'destructive', onPress: () => resolveMutation.mutate({ id, status: 'dismissed' }) },
    ]);
  };

  const handlePublish = (event: { id: string; title?: string }) => {
    Alert.alert('Publish Event', `Approve and publish "${event.title ?? 'this event'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Publish', onPress: () => publishMutation.mutate(event.id) },
    ]);
  };

  return (
    <View style={[s.fill, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.midnight as unknown as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: topInset }}
      >
        <Animated.View entering={FadeInUp.duration(300)} style={[s.header, { paddingHorizontal: hPad }]}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/admin/dashboard')}
            style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button" accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Moderation</Text>
            <Text style={s.headerSub}>
              {pendingCount > 0 ? `${pendingCount} pending reports` : 'Content review & approvals'}
            </Text>
          </View>
          <Pressable onPress={() => { reportsQuery.refetch(); eventsQuery.refetch(); }} style={s.headerBtn} accessibilityRole="button" accessibilityLabel="Refresh">
            <Ionicons name="refresh" size={18} color="rgba(255,255,255,0.9)" />
          </Pressable>
        </Animated.View>
      </LinearGradient>

      <FlatList
        data={(tab === 'reports' ? reports : events) as typeof reports}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.list, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 40 }]}
        ListHeaderComponent={
          <View style={s.listHeader}>
            {/* Stats */}
            <View style={s.statsRow}>
              <StatChip value={reportsQuery.data?.total ?? 0}  label="Reports"  color={CultureTokens.coral}   icon="flag-outline" />
              <StatChip value={pendingCount}                    label="Pending"  color={CultureTokens.gold} icon="time-outline" />
              <StatChip value={eventsQuery.data?.total ?? '…'} label="Events"   color={CultureTokens.teal}    icon="calendar-outline" />
            </View>

            {/* Tab bar */}
            <View style={[s.tabBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {([
                { key: 'reports' as ModerationTab, label: 'Flagged Content', icon: 'flag-outline', color: CultureTokens.coral },
                { key: 'events'  as ModerationTab, label: 'Event Approvals', icon: 'calendar-outline', color: CultureTokens.gold },
              ] as const).map(t => (
                <Pressable
                  key={t.key}
                  style={[s.tabItem, tab === t.key && [s.tabItemActive, { borderBottomColor: t.color }]]}
                  onPress={() => setTab(t.key)}
                  accessibilityRole="button"
                >
                  <Ionicons name={t.icon as keyof typeof Ionicons.glyphMap} size={15} color={tab === t.key ? t.color : colors.textTertiary} />
                  <Text style={[s.tabLabel, { color: tab === t.key ? t.color : colors.textTertiary }]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Report status filter chips */}
            {tab === 'reports' ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
                {(['pending', 'resolved', 'dismissed'] as ReportStatus[]).map(st => {
                  const active = reportStatus === st;
                  const color  = st === 'pending' ? CultureTokens.coral : st === 'resolved' ? CultureTokens.success : colors.textSecondary;
                  return (
                    <Pressable
                      key={st}
                      style={[s.chip, { backgroundColor: active ? color : colors.surface, borderColor: active ? color : colors.borderLight }]}
                      onPress={() => setReportStatus(st)}
                      accessibilityRole="button"
                    >
                      <Text style={[s.chipText, { color: active ? '#fff' : colors.textSecondary }]}>
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {(tab === 'reports' ? reportsQuery.isLoading : eventsQuery.isLoading) ? (
              <View style={{ gap: 10 }}>
                <ReportCardSkeleton />
                <ReportCardSkeleton />
                <ReportCardSkeleton />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) =>
          tab === 'reports'
            ? <ReportCard
                report={item as typeof reports[0]}
                index={index}
                onResolve={() => handleResolve(item.id)}
                onDismiss={() => handleDismiss(item.id)}
              />
            : <EventApprovalCard
                event={item as typeof events[0]}
                index={index}
                onApprove={() => handlePublish(item as typeof events[0])}
              />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          (reportsQuery.isLoading || eventsQuery.isLoading) ? null : (
            <View style={s.emptyWrap}>
              <Ionicons name={tab === 'reports' ? 'shield-checkmark-outline' : 'checkmark-circle-outline'} size={MOD_UI.emptyIconSize} color={colors.textTertiary} />
              <Text style={[s.emptyTitle, { color: colors.text }]}>
                {tab === 'reports' ? 'No reports' : 'No pending events'}
              </Text>
              <Text style={[s.emptyText, { color: colors.textSecondary }]}>
                {tab === 'reports'
                  ? `No ${reportStatus} reports to review.`
                  : 'All events have been reviewed.'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

export default function AdminModerationScreen() {
  return <ErrorBoundary><ModerationContent /></ErrorBoundary>;
}

const s = StyleSheet.create({
  fill:        { flex: 1 },
<<<<<<< HEAD
  header:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  headerTitle: { ...TextStyles.title3, color: '#fff', letterSpacing: -0.2 },
  headerSub:   { ...TextStyles.caption, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  backBtn:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  headerBtn:   { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  list:        { paddingTop: 16, paddingBottom: 40 },
  listHeader:  { gap: 12, marginBottom: 12 },
  statsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tabBar:      { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  tabItem:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: 'transparent' },
||||||| 7dc71c1
  header:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -0.2 },
  headerSub:   { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  backBtn:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  headerBtn:   { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  list:        { paddingTop: 16, paddingBottom: 40 },
  listHeader:  { gap: 12, marginBottom: 12 },
  statsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tabBar:      { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  tabItem:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: 'transparent' },
=======
  header:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  headerTitle: { ...TextStyles.title3, color: '#fff', letterSpacing: -0.2 },
  headerSub:   { ...TextStyles.caption, color: 'rgba(255,255,255,0.7)', marginTop: Spacing.xs - 3 },
  backBtn:     { width: IconSize.xl + Spacing.xs, height: IconSize.xl + Spacing.xs, borderRadius: CardTokens.radius - 6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  headerBtn:   { width: IconSize.lg + Spacing.sm + 2, height: IconSize.lg + Spacing.sm + 2, borderRadius: CardTokens.radius - 7, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  list:        { paddingTop: Spacing.md, paddingBottom: Spacing.xl },
  listHeader:  { gap: Spacing.md - 4, marginBottom: Spacing.md - 4 },
  statsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tabBar:      { flexDirection: 'row', borderRadius: CardTokens.radius, borderWidth: 1, overflow: 'hidden' },
  tabItem:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm - 2, paddingVertical: Spacing.md - 3, borderBottomWidth: 2, borderBottomColor: 'transparent' },
>>>>>>> cursor/onboarding-brand-lint-fixes
  tabItemActive: {},
<<<<<<< HEAD
  tabLabel:    { ...TextStyles.chip },
  chips:       { gap: 8, paddingVertical: 2 },
  chip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText:    { ...TextStyles.captionSemibold },
  loadingWrap: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  loadingText: { ...TextStyles.cardBody },
  emptyWrap:   { alignItems: 'center', gap: 10, paddingVertical: 60 },
  emptyTitle:  { ...TextStyles.headline },
  emptyText:   { ...TextStyles.chip, textAlign: 'center' },
||||||| 7dc71c1
  tabLabel:    { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  chips:       { gap: 8, paddingVertical: 2 },
  chip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText:    { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  loadingWrap: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  loadingText: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
  emptyWrap:   { alignItems: 'center', gap: 10, paddingVertical: 60 },
  emptyTitle:  { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  emptyText:   { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
=======
  tabLabel:    { fontSize: FontSize.chip, fontFamily: FontFamily.semibold },
  chips:       { gap: Spacing.sm, paddingVertical: Spacing.xs - 2 },
  chip:        { paddingHorizontal: Spacing.md - 2, paddingVertical: ChipTokens.paddingV - 1, borderRadius: ChipTokens.radius, borderWidth: 1 },
  chipText:    { fontSize: FontSize.caption, fontFamily: FontFamily.semibold },
  loadingWrap: { alignItems: 'center', gap: Spacing.sm + 2, paddingVertical: Spacing.xxl },
  loadingText: { fontSize: FontSize.body2, fontFamily: FontFamily.regular },
  emptyWrap:   { alignItems: 'center', gap: Spacing.sm + 2, paddingVertical: 60 },
  emptyTitle:  { fontSize: FontSize.body, fontFamily: FontFamily.bold },
  emptyText:   { fontSize: FontSize.chip, fontFamily: FontFamily.regular, textAlign: 'center' },
>>>>>>> cursor/onboarding-brand-lint-fixes
});
