import { useEffect, useState, useMemo, useCallback } from 'react';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  TextInput, Alert, ActivityIndicator, Modal,
  Platform, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/lib/auth';
<<<<<<< HEAD
import { CultureTokens, gradients, TextStyles } from '@/constants/theme';
||||||| 7dc71c1
import { CultureTokens, gradients } from '@/constants/theme';
=======
import {
  CardTokens,
  ChipTokens,
  CultureTokens,
  FontFamily,
  FontSize,
  gradients,
  IconSize,
  SheetTokens,
  Spacing,
  TextStyles,
} from '@/constants/theme';
>>>>>>> cursor/onboarding-brand-lint-fixes
import type { UserRole } from '@/shared/schema';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import * as Haptics from 'expo-haptics';
import { Skeleton } from '@/components/ui/Skeleton';

const isWeb = Platform.OS === 'web';
const ADMIN_USERS_UI = {
  iconBtnSize: 28,
  tableActionWidth: 90,
  desktopRoleSheetWidth: 480,
  desktopRoleSheetBottom: Spacing.xl + Spacing.sm,
  roleSheetListMaxHeight: 380,
  emptyIconSize: 44,
  skeletonHeaderHeight: 100,
  skeletonCardHeight: 80,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────
type AdminUser = {
  id: string;
  username?: string;
  displayName?: string;
  email?: string;
  role?: UserRole;
  avatarUrl?: string;
  city?: string;
  country?: string;
  handle?: string;
  handleStatus?: string;
  isSydneyVerified?: boolean;
  membershipTier?: string;
  createdAt?: string;
  lastActiveAt?: string;
};

// ─── Role meta ───────────────────────────────────────────────────────────────
const ROLE_META: Record<UserRole, { label: string; description: string; color: string; icon: string }> = {
  user:          { label: 'User',           description: 'Standard member',              color: '#8E8E93',              icon: 'person-outline' },
  organizer:     { label: 'Organizer',      description: 'Creates & manages events',     color: CultureTokens.indigo,   icon: 'calendar-outline' },
  business:      { label: 'Business',       description: 'Business listing owner',       color: CultureTokens.gold,  icon: 'briefcase-outline' },
  sponsor:       { label: 'Sponsor',        description: 'Community sponsor',            color: CultureTokens.gold,     icon: 'ribbon-outline' },
  cityAdmin:     { label: 'City Admin',     description: 'Manages a city region',        color: CultureTokens.teal,     icon: 'location-outline' },
  moderator:     { label: 'Moderator',      description: 'Reviews content & reports',    color: '#5AC8FA',              icon: 'shield-outline' },
  admin:         { label: 'Admin',          description: 'Full platform access',         color: '#5856D6',              icon: 'key-outline' },
  platformAdmin: { label: 'Platform Admin', description: 'Super administrator',          color: CultureTokens.coral,    icon: 'star-outline' },
  superAdmin:    { label: 'SuperAdmin',     description: 'Root platform owner',          color: CultureTokens.purple,   icon: 'rocket-outline' },
};

const ROLE_KEYS = Object.keys(ROLE_META) as UserRole[];

function canEdit(actorRole: UserRole, actorId: string | undefined, target: AdminUser): boolean {
  const current = (target.role ?? 'user') as UserRole;
  if (!actorId || actorId === target.id) return false;
  if (actorRole === 'platformAdmin') return current !== 'admin' && current !== 'platformAdmin';
  if (actorRole === 'admin')         return current !== 'platformAdmin';
  return false;
}

function assignableRolesFor(actorRole: UserRole, actorId: string | undefined, target: AdminUser): UserRole[] {
  if (!canEdit(actorRole, actorId, target)) return [];
  if (actorRole === 'platformAdmin') return ROLE_KEYS.filter(k => k !== 'admin' && k !== 'platformAdmin');
  if (actorRole === 'admin')         return ROLE_KEYS.filter(k => k !== 'platformAdmin');
  return [];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function initials(user: AdminUser): string {
  return (user.displayName ?? user.username ?? '?')
    .split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function avatarColor(user: AdminUser): string {
  const role = user.role ?? 'user';
  return ROLE_META[role]?.color ?? '#8E8E93';
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtRelative(iso?: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7)  return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role, size = 'sm' }: { role?: UserRole; size?: 'sm' | 'md' }) {
  const meta = ROLE_META[role ?? 'user'];
  return (
    <View style={[rb.wrap, { borderColor: meta.color + '55', backgroundColor: meta.color + '14' },
      size === 'md' && rb.wrapMd]}>
      <Text style={[rb.text, { color: meta.color }, size === 'md' && rb.textMd]}>{meta.label}</Text>
    </View>
  );
}
const rb = StyleSheet.create({
<<<<<<< HEAD
  wrap:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  wrapMd: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  text:   { ...TextStyles.tabLabel, letterSpacing: 0.3 },
  textMd: { fontSize: 12 },
||||||| 7dc71c1
  wrap:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  wrapMd: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  text:   { fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 0.3 },
  textMd: { fontSize: 12 },
=======
  wrap:   { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs - 1, borderRadius: Spacing.sm, borderWidth: 1 },
  wrapMd: { paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs, borderRadius: CardTokens.radius - 6 },
  text:   { fontSize: FontSize.tab, fontFamily: FontFamily.bold, letterSpacing: 0.3 },
  textMd: { fontSize: FontSize.caption },
>>>>>>> cursor/onboarding-brand-lint-fixes
});

// ─── Membership Tier Badge ────────────────────────────────────────────────────
function TierBadge({ tier }: { tier?: string }) {
  if (!tier || tier === 'free') return null;
  const color = tier === 'elite' || tier === 'vip' ? CultureTokens.gold : CultureTokens.teal;
  return (
    <View style={[tb.wrap, { borderColor: color + '50', backgroundColor: color + '14' }]}>
      <Ionicons name="diamond-outline" size={9} color={color} />
      <Text style={[tb.text, { color }]}>{tier.toUpperCase()}</Text>
    </View>
  );
}
const tb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs - 1, paddingHorizontal: Spacing.sm - 1, paddingVertical: Spacing.xs - 1, borderRadius: Spacing.sm - 1, borderWidth: 1 },
  text: { fontSize: FontSize.micro - 2, fontFamily: FontFamily.bold, letterSpacing: 0.4 },
});

// ─── Avatar ───────────────────────────────────────────────────────────────────
function UserAvatar({ user, size = 44 }: { user: AdminUser; size?: number }) {
  const borderRadius = size / 2;
  const color = avatarColor(user);
  if (user.avatarUrl) {
    return <Image source={{ uri: user.avatarUrl }} style={{ width: size, height: size, borderRadius }} contentFit="cover" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.35, fontFamily: 'Poppins_700Bold', color }}>{initials(user)}</Text>
    </View>
  );
}

// ─── Role Assignment Sheet ────────────────────────────────────────────────────
function RoleSheet({ user, assignable, onSelect, onClose, isPending }: {
  user: AdminUser | null;
  assignable: UserRole[];
  onSelect: (r: UserRole) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const colors = useColors();
  if (!user) return null;
  const current = (user.role ?? 'user') as UserRole;

  return (
    <Modal transparent animationType={isWeb ? 'fade' : 'slide'} visible statusBarTranslucent onRequestClose={onClose}>
      <View style={ms.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[ms.sheet, { backgroundColor: colors.surface }]}>
          <View style={[ms.handle, { backgroundColor: colors.border }]} />

          {/* User header */}
          <View style={[ms.userRow, { borderBottomColor: colors.divider }]}>
            <UserAvatar user={user} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={[ms.userName, { color: colors.text }]} numberOfLines={1}>
                {user.displayName ?? user.username ?? 'Unknown'}
              </Text>
              <Text style={[ms.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                {user.email ?? (user.handle ? `+${user.handle}` : '—')}
              </Text>
            </View>
            <RoleBadge role={current} size="md" />
          </View>

          <Text style={[ms.sectionLabel, { color: colors.textTertiary }]}>Assign New Role</Text>

          <ScrollView style={{ maxHeight: ADMIN_USERS_UI.roleSheetListMaxHeight }} showsVerticalScrollIndicator={false}>
            {assignable.map(key => {
              const meta = ROLE_META[key];
              const isCurrent = key === current;
              return (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    ms.roleRow, { borderBottomColor: colors.divider },
                    isCurrent && { backgroundColor: meta.color + '10' },
                    pressed && !isCurrent && { backgroundColor: colors.surfaceElevated },
                  ]}
                  onPress={() => !isCurrent && !isPending && onSelect(key)}
                  disabled={isCurrent || isPending}
                  accessibilityRole="button"
                  accessibilityLabel={`Assign ${meta.label}`}
                >
                  <View style={[ms.roleIcon, { backgroundColor: meta.color + '18' }]}>
                    <Ionicons name={meta.icon as keyof typeof Ionicons.glyphMap} size={17} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ms.roleLabel, { color: colors.text }]}>{meta.label}</Text>
                    <Text style={[ms.roleDesc,  { color: colors.textSecondary }]}>{meta.description}</Text>
                  </View>
                  {isCurrent ? (
                    <View style={[ms.currentBadge, { backgroundColor: meta.color + '18', borderColor: meta.color + '44' }]}>
                      <Text style={[ms.currentText, { color: meta.color }]}>Current</Text>
                    </View>
                  ) : isPending ? (
                    <ActivityIndicator size="small" color={meta.color} />
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [ms.cancelBtn, { borderTopColor: colors.divider, opacity: pressed ? 0.6 : 1 }]}
            onPress={onClose}
          >
            <Text style={[ms.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  backdrop:     { flex: 1, justifyContent: 'flex-end', alignItems: isWeb ? 'center' : 'stretch' },
  sheet:        {
    borderTopLeftRadius: SheetTokens.borderRadius, borderTopRightRadius: SheetTokens.borderRadius,
    ...(isWeb ? { borderRadius: CardTokens.radiusLarge, width: ADMIN_USERS_UI.desktopRoleSheetWidth, marginBottom: ADMIN_USERS_UI.desktopRoleSheetBottom } : {}),
    ...Platform.select({
      web: { boxShadow: '0px 8px 32px rgba(0,0,0,0.45)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 32,
      },
      android: { elevation: 12 }
    }),
    paddingTop: Spacing.sm, paddingBottom: isWeb ? Spacing.lg : Platform.OS === 'ios' ? Spacing.xl + Spacing.xs : CardTokens.paddingLarge,
  },
<<<<<<< HEAD
  handle:       { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  userRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 6 },
  userName:     { ...TextStyles.callout },
  userEmail:    { ...TextStyles.caption, marginTop: 2 },
  sectionLabel: { ...TextStyles.tabLabel, textTransform: 'uppercase', letterSpacing: 1.3, paddingHorizontal: 20, paddingVertical: 10, },
  roleRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  roleIcon:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  roleLabel:    { ...TextStyles.cardTitle },
  roleDesc:     { ...TextStyles.caption, marginTop: 1 },
  currentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  currentText:  { ...TextStyles.badge },
  cancelBtn:    { marginTop: 6, paddingVertical: 16, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  cancelText:   { ...TextStyles.callout },
||||||| 7dc71c1
  handle:       { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  userRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 6 },
  userName:     { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  userEmail:    { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  sectionLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1.3, paddingHorizontal: 20, paddingVertical: 10, },
  roleRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  roleIcon:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  roleLabel:    { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  roleDesc:     { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  currentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  currentText:  { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  cancelBtn:    { marginTop: 6, paddingVertical: 16, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  cancelText:   { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
=======
  handle:       { width: SheetTokens.handleWidth - Spacing.xs, height: SheetTokens.handleHeight, borderRadius: SheetTokens.handleHeight / 2, alignSelf: 'center', marginBottom: Spacing.md },
  userRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md - 4, paddingHorizontal: CardTokens.paddingLarge, paddingBottom: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: Spacing.sm - 2 },
  userName:     { fontSize: FontSize.callout, fontFamily: FontFamily.bold },
  userEmail:    { fontSize: FontSize.caption, fontFamily: FontFamily.regular, marginTop: Spacing.xs - 2 },
  sectionLabel: { fontSize: FontSize.tab, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 1.3, paddingHorizontal: CardTokens.paddingLarge, paddingVertical: Spacing.sm + 2, },
  roleRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md - 4, paddingHorizontal: CardTokens.paddingLarge, paddingVertical: Spacing.md - 3, borderBottomWidth: StyleSheet.hairlineWidth },
  roleIcon:     { width: IconSize.xxl - Spacing.xs, height: IconSize.xxl - Spacing.xs, borderRadius: CardTokens.radius - 6, alignItems: 'center', justifyContent: 'center' },
  roleLabel:    { fontSize: FontSize.body2, fontFamily: FontFamily.semibold },
  roleDesc:     { fontSize: FontSize.caption, fontFamily: FontFamily.regular, marginTop: Spacing.xs - 3 },
  currentBadge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs - 1, borderRadius: Spacing.sm, borderWidth: 1 },
  currentText:  { fontSize: FontSize.micro, fontFamily: FontFamily.semibold },
  cancelBtn:    { marginTop: Spacing.sm - 2, paddingVertical: Spacing.md, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  cancelText:   { fontSize: FontSize.callout, fontFamily: FontFamily.semibold },
>>>>>>> cursor/onboarding-brand-lint-fixes
});

// ─── User Card (mobile) ───────────────────────────────────────────────────────
function UserCard({ user, onEditRole, onToggleVerify, canEditRole, canVerify, index }: {
  user: AdminUser;
  onEditRole: () => void;
  onToggleVerify: () => void;
  canEditRole: boolean;
  canVerify: boolean;
  index: number;
}) {
  const colors = useColors();
  const name = user.displayName ?? user.username ?? 'Unknown';

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 240)).springify().damping(20)}>
      <View style={[uc.card, { 
        backgroundColor: colors.surface, 
        borderColor: colors.borderLight,
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
      }]}>
        {/* Top row: avatar + info + role */}
        <View style={uc.topRow}>
          <UserAvatar user={user} size={46} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={uc.nameRow}>
              <Text style={[uc.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
              {user.isSydneyVerified ? (
                <Ionicons name="checkmark-circle" size={14} color={CultureTokens.teal} />
              ) : null}
            </View>
            <Text style={[uc.email, { color: colors.textSecondary }]} numberOfLines={1}>
              {user.email ?? (user.handle ? `+${user.handle}` : '—')}
            </Text>
            {(user.city || user.country) ? (
              <Text style={[uc.meta, { color: colors.textTertiary }]} numberOfLines={1}>
                {[user.city, user.country].filter(Boolean).join(', ')}
              </Text>
            ) : null}
          </View>
          <View style={uc.badges}>
            <RoleBadge role={user.role} />
            <TierBadge tier={user.membershipTier} />
          </View>
        </View>

        {/* Bottom row: joined date + actions */}
        <View style={[uc.bottomRow, { borderTopColor: colors.borderLight }]}>
          <View style={uc.metaRow}>
            <Ionicons name="time-outline" size={11} color={colors.textTertiary} />
            <Text style={[uc.metaText, { color: colors.textTertiary }]}>
              Joined {fmtDate(user.createdAt)}
            </Text>
            {user.lastActiveAt ? (
              <>
                <Text style={[uc.metaDot, { color: colors.textTertiary }]}>·</Text>
                <Text style={[uc.metaText, { color: colors.textTertiary }]}>
                  Active {fmtRelative(user.lastActiveAt)}
                </Text>
              </>
            ) : null}
          </View>
          <View style={uc.actions}>
            {canVerify ? (
              <Pressable
                style={[uc.actionBtn, {
                  backgroundColor: user.isSydneyVerified ? CultureTokens.teal + '18' : colors.backgroundSecondary,
                  borderColor: user.isSydneyVerified ? CultureTokens.teal + '44' : colors.borderLight,
                }]}
                onPress={onToggleVerify}
                accessibilityRole="button"
                accessibilityLabel={user.isSydneyVerified ? 'Revoke verification' : 'Verify Sydney'}
              >
                <Ionicons
                  name={user.isSydneyVerified ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={13}
                  color={user.isSydneyVerified ? CultureTokens.teal : colors.textSecondary}
                />
                <Text style={[uc.actionText, { color: user.isSydneyVerified ? CultureTokens.teal : colors.textSecondary }]}>
                  {user.isSydneyVerified ? 'Verified' : 'Verify'}
                </Text>
              </Pressable>
            ) : null}
            {canEditRole ? (
              <Pressable
                style={[uc.actionBtn, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '40' }]}
                onPress={onEditRole}
                accessibilityRole="button"
                accessibilityLabel={`Edit role for ${name}`}
              >
                <Ionicons name="shield-outline" size={13} color={CultureTokens.indigo} />
                <Text style={[uc.actionText, { color: CultureTokens.indigo }]}>Role</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const uc = StyleSheet.create({
<<<<<<< HEAD
  card:      { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  topRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name:      { ...TextStyles.cardTitle, flexShrink: 1 },
  email:     { ...TextStyles.caption, marginTop: 2 },
  meta:      { ...TextStyles.badge, marginTop: 1 },
  badges:    { alignItems: 'flex-end', gap: 5 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  metaText:  { ...TextStyles.badge },
  metaDot:   { fontSize: 11 },
  actions:   { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  actionText:{ ...TextStyles.badge },
||||||| 7dc71c1
  card:      { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  topRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name:      { fontSize: 14, fontFamily: 'Poppins_600SemiBold', flexShrink: 1 },
  email:     { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  meta:      { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  badges:    { alignItems: 'flex-end', gap: 5 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  metaText:  { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  metaDot:   { fontSize: 11 },
  actions:   { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  actionText:{ fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
=======
  card:      { borderRadius: CardTokens.radius, borderWidth: 1, padding: Spacing.md - 2, gap: Spacing.md - 4 },
  topRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md - 4 },
  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm - 3 },
  name:      { fontSize: FontSize.body2, fontFamily: FontFamily.semibold, flexShrink: 1 },
  email:     { fontSize: FontSize.caption, fontFamily: FontFamily.regular, marginTop: Spacing.xs - 2 },
  meta:      { fontSize: FontSize.micro, fontFamily: FontFamily.regular, marginTop: Spacing.xs - 3 },
  badges:    { alignItems: 'flex-end', gap: Spacing.sm - 3 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.sm + 2, borderTopWidth: StyleSheet.hairlineWidth },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1 },
  metaText:  { fontSize: FontSize.micro, fontFamily: FontFamily.regular },
  metaDot:   { fontSize: FontSize.micro },
  actions:   { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.sm - 2, borderRadius: CardTokens.radius - 6, borderWidth: 1 },
  actionText:{ fontSize: FontSize.micro, fontFamily: FontFamily.semibold },
>>>>>>> cursor/onboarding-brand-lint-fixes
});

// ─── Desktop Table Row ────────────────────────────────────────────────────────
function TableRow({ user, onEditRole, onToggleVerify, canEditRole, canVerify }: {
  user: AdminUser; onEditRole: () => void; onToggleVerify: () => void;
  canEditRole: boolean; canVerify: boolean;
}) {
  const colors = useColors();
  const name = user.displayName ?? user.username ?? 'Unknown';
  return (
    <Pressable
      style={({ pressed }) => [tr.row, { borderBottomColor: colors.divider },
        pressed && canEditRole && { backgroundColor: colors.primaryGlow }]}
      onPress={canEditRole ? onEditRole : undefined}
      accessibilityRole="button"
    >
      {/* User */}
      <View style={tr.tdUser}>
        <UserAvatar user={user} size={36} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[tr.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
            {user.isSydneyVerified ? <Ionicons name="checkmark-circle" size={12} color={CultureTokens.teal} /> : null}
          </View>
          <Text style={[tr.sub, { color: colors.textTertiary }]} numberOfLines={1}>
            {user.handle ? `+${user.handle}` : `@${user.username ?? '—'}`}
          </Text>
        </View>
      </View>
      {/* Email */}
      <View style={tr.tdEmail}>
        <Text style={[tr.sub, { color: colors.textSecondary }]} numberOfLines={1}>{user.email ?? '—'}</Text>
      </View>
      {/* Role + Tier */}
      <View style={[tr.tdRole, { gap: 4 }]}>
        <RoleBadge role={user.role} />
        <TierBadge tier={user.membershipTier} />
      </View>
      {/* Location */}
      <View style={tr.tdLoc}>
        <Text style={[tr.sub, { color: colors.textSecondary }]} numberOfLines={1}>
          {[user.city, user.country].filter(Boolean).join(', ') || '—'}
        </Text>
      </View>
      {/* Joined */}
      <View style={tr.tdJoined}>
        <Text style={[tr.sub, { color: colors.textTertiary }]}>{fmtDate(user.createdAt)}</Text>
        {user.lastActiveAt ? (
          <Text style={[tr.subXs, { color: colors.textTertiary }]}>{fmtRelative(user.lastActiveAt)}</Text>
        ) : null}
      </View>
      {/* Actions */}
      <View style={tr.tdAction}>
        {canVerify ? (
          <Pressable
            onPress={e => { e.stopPropagation?.(); onToggleVerify(); }}
            style={[tr.iconBtn, { backgroundColor: user.isSydneyVerified ? CultureTokens.teal + '18' : 'transparent', borderColor: user.isSydneyVerified ? CultureTokens.teal + '44' : 'transparent' }]}
            accessibilityRole="button" accessibilityLabel="Toggle verification"
          >
            <Ionicons name={user.isSydneyVerified ? 'checkmark-circle' : 'checkmark-circle-outline'} size={16} color={user.isSydneyVerified ? CultureTokens.teal : colors.textTertiary} />
          </Pressable>
        ) : null}
        {canEditRole ? (
          <View style={[tr.editBtn, { backgroundColor: colors.primaryGlow, borderColor: colors.primary + '44' }]}>
            <Ionicons name="create-outline" size={13} color={colors.primary} />
            <Text style={[tr.editText, { color: colors.primary }]}>Edit</Text>
          </View>
        ) : (
          <Ionicons name="lock-closed-outline" size={14} color={colors.textTertiary} />
        )}
      </View>
    </Pressable>
  );
}

const tr = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md - 4, borderBottomWidth: StyleSheet.hairlineWidth },
  tdUser:   { flex: 2, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, minWidth: 0 },
  tdEmail:  { flex: 2, paddingRight: Spacing.sm + 2, minWidth: 0 },
  tdRole:   { flex: 1.2, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', minWidth: 0 },
  tdLoc:    { flex: 1.2, paddingRight: Spacing.sm, minWidth: 0 },
  tdJoined: { flex: 1, minWidth: 80 },
<<<<<<< HEAD
  tdAction: { width: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  name:     { ...TextStyles.chip },
  sub:      { ...TextStyles.caption, marginTop: 1 },
  subXs:    { ...TextStyles.tabLabel, marginTop: 1 },
  iconBtn:  { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  editBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  editText: { ...TextStyles.badge },
||||||| 7dc71c1
  tdAction: { width: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  name:     { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  sub:      { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  subXs:    { fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  iconBtn:  { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  editBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  editText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
=======
  tdAction: { width: ADMIN_USERS_UI.tableActionWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.sm - 2 },
  name:     { fontSize: FontSize.chip, fontFamily: FontFamily.semibold },
  sub:      { fontSize: FontSize.caption, fontFamily: FontFamily.regular, marginTop: Spacing.xs - 3 },
  subXs:    { fontSize: FontSize.tab, fontFamily: FontFamily.regular, marginTop: Spacing.xs - 3 },
  iconBtn:  { width: ADMIN_USERS_UI.iconBtnSize, height: ADMIN_USERS_UI.iconBtnSize, borderRadius: Spacing.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  editBtn:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Spacing.sm, borderWidth: 1 },
  editText: { fontSize: FontSize.micro, fontFamily: FontFamily.semibold },
>>>>>>> cursor/onboarding-brand-lint-fixes
});

// ─── Table Header ─────────────────────────────────────────────────────────────
function TableHeader() {
  const colors = useColors();
  return (
    <View style={[th.row, { backgroundColor: colors.surfaceElevated, borderBottomColor: colors.divider }]}>
      {[
        { label: 'User',     flex: 2 },
        { label: 'Email',    flex: 2 },
        { label: 'Role',     flex: 1.2 },
        { label: 'Location', flex: 1.2 },
        { label: 'Joined',   flex: 1 },
        { label: '',         width: 90 },
      ].map((col, i) => (
        <Text key={i} style={[th.cell, { color: colors.textTertiary,
          ...(col.flex ? { flex: col.flex } : { width: col.width })
        }]}>
          {col.label}
        </Text>
      ))}
    </View>
  );
}
const th = StyleSheet.create({
<<<<<<< HEAD
  row:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  cell: { ...TextStyles.tabLabel, textTransform: 'uppercase', letterSpacing: 0.9 },
||||||| 7dc71c1
  row:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  cell: { fontSize: 10, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 0.9 },
=======
  row:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderBottomWidth: StyleSheet.hairlineWidth },
  cell: { fontSize: FontSize.tab, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.9 },
>>>>>>> cursor/onboarding-brand-lint-fixes
});

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
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
||||||| 7dc71c1
  chip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderRadius: 14, 
=======
  chip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Spacing.sm, 
    paddingHorizontal: ChipTokens.paddingH - 4, 
    paddingVertical: Spacing.sm + 2, 
    borderRadius: CardTokens.radius - 2, 
>>>>>>> cursor/onboarding-brand-lint-fixes
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 1 }
    })
  },
<<<<<<< HEAD
  icon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  val:  { ...TextStyles.headline },
  lbl:  { ...TextStyles.tabLabel },
||||||| 7dc71c1
  icon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  val:  { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  lbl:  { fontSize: 10, fontFamily: 'Poppins_500Medium' },
=======
  icon: { width: IconSize.lg + 6, height: IconSize.lg + 6, borderRadius: Spacing.sm + 1, alignItems: 'center', justifyContent: 'center' },
  val:  { fontSize: FontSize.body, fontFamily: FontFamily.bold },
  lbl:  { fontSize: FontSize.tab, fontFamily: FontFamily.medium },
>>>>>>> cursor/onboarding-brand-lint-fixes
});

function AdminUsersSkeleton() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  useLayout();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ height: ADMIN_USERS_UI.skeletonHeaderHeight, backgroundColor: CultureTokens.indigo, opacity: 0.8, paddingTop: topInset }} />
      <View style={{ padding: Spacing.md, gap: Spacing.md }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} width={100} height={60} borderRadius={14} />)}
        </View>
        <Skeleton width="100%" height={50} borderRadius={12} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} width={80} height={34} borderRadius={20} />)}
        </View>
        <View style={{ marginTop: Spacing.sm + 2, gap: Spacing.md - 4 }}>
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} width="100%" height={ADMIN_USERS_UI.skeletonCardHeight} borderRadius={CardTokens.radius} />)}
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
const ALL = '__all__';

function AdminUsersContent() {
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors   = useColors();
  const { isDesktop, hPad } = useLayout();
  const { user: authUser }  = useAuth();
  const { role, isAdmin, isLoading: roleLoading } = useRole();

  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | typeof ALL>(ALL);
  const [page,       setPage]       = useState(0);
  const [selected,   setSelected]   = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) router.replace('/(tabs)');
  }, [isAdmin, roleLoading]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-users', page],
    queryFn:  () => api.admin.listUsers({ limit: 100, page }),
    enabled:  isAdmin,
    staleTime: 30_000,
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: UserRole }) =>
      api.admin.setUserRole(userId, newRole),
    onSuccess: () => {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setSelected(null);
    },
    onError: () => Alert.alert('Error', 'Failed to update role. Please try again.'),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ userId, verified }: { userId: string; verified: boolean }) =>
      api.admin.setUserVerified(userId, verified),
    onSuccess: () => {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => Alert.alert('Error', 'Failed to update verification.'),
  });

  const handleRoleSelect = useCallback((newRole: UserRole) => {
    if (!selected) return;
    const cur = ROLE_META[(selected.role ?? 'user') as UserRole].label;
    const next = ROLE_META[newRole].label;
    Alert.alert(
      'Confirm Role Change',
      `Change ${selected.displayName ?? selected.username ?? 'this user'} from "${cur}" → "${next}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => roleMutation.mutate({ userId: selected.id, newRole }) },
      ],
    );
  }, [selected, roleMutation]);

  const handleToggleVerify = useCallback((user: AdminUser) => {
    const next = !user.isSydneyVerified;
    Alert.alert(
      next ? 'Verify User' : 'Revoke Verification',
      `${next ? 'Grant' : 'Remove'} Sydney Verified status for ${user.displayName ?? user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: next ? 'Verify' : 'Revoke', onPress: () => verifyMutation.mutate({ userId: user.id, verified: next }) },
      ],
    );
  }, [verifyMutation]);

  const users = useMemo(() => data?.users ?? [], [data]);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (roleFilter !== ALL) list = list.filter(u => (u.role ?? 'user') === roleFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(u =>
      (u.displayName ?? '').toLowerCase().includes(q) ||
      (u.username    ?? '').toLowerCase().includes(q) ||
      (u.email       ?? '').toLowerCase().includes(q) ||
      (u.handle      ?? '').toLowerCase().includes(q),
    );
    return list;
  }, [users, roleFilter, search]);

  // Stats
  const adminsCount    = users.filter(u => u.role === 'admin' || u.role === 'platformAdmin').length;
  const orgCount       = users.filter(u => ['organizer', 'business', 'sponsor'].includes(u.role ?? '')).length;
  const verifiedCount  = users.filter(u => u.isSydneyVerified).length;
  const staffCount     = users.filter(u => ['cityAdmin', 'moderator'].includes(u.role ?? '')).length;

  // Role filter tabs — only show roles present in data
  const presentRoles = Array.from(new Set(users.map(u => u.role ?? 'user'))) as UserRole[];
  const filterTabs   = [ALL as typeof ALL, ...ROLE_KEYS.filter(k => presentRoles.includes(k))];

  const assignable   = selected ? assignableRolesFor(role, authUser?.id, selected) : [];
  const canAdmin     = role === 'admin' || role === 'platformAdmin';

  if (roleLoading) {
    return <AdminUsersSkeleton />;
  }

  return (
    <View style={[s.fill, { backgroundColor: colors.background }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
            <Text style={s.headerTitle}>User Management</Text>
            <Text style={s.headerSub}>
              {isLoading ? 'Loading…' : `${data?.total ?? 0} users${isFetching ? ' · Refreshing…' : ''}`}
            </Text>
          </View>
          <Pressable onPress={() => refetch()} style={s.headerBtn} accessibilityRole="button" accessibilityLabel="Refresh">
            <Ionicons name="refresh" size={18} color="rgba(255,255,255,0.9)" />
          </Pressable>
          <Pressable onPress={() => router.push('/admin/notifications')} style={s.headerBtn} accessibilityRole="button" accessibilityLabel="Notifications">
            <Ionicons name="megaphone-outline" size={18} color="rgba(255,255,255,0.9)" />
          </Pressable>
          <Pressable onPress={() => router.push('/admin/audit-logs')} style={s.headerBtn} accessibilityRole="button" accessibilityLabel="Audit logs">
            <Ionicons name="document-text-outline" size={18} color="rgba(255,255,255,0.9)" />
          </Pressable>
        </Animated.View>
      </LinearGradient>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <View style={[s.body, isDesktop && s.bodyDesktop]}>
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.listContent, { paddingHorizontal: isDesktop ? 0 : hPad }]}
          ListHeaderComponent={
            <View style={s.listHeader}>

              {/* Stats chips */}
              {!isLoading && data ? (
                <Animated.View entering={FadeInDown.delay(40).springify()} style={s.statsRow}>
                  <StatChip value={data.total}   label="Total"     color={colors.primary}       icon="people-outline" />
                  <StatChip value={orgCount}      label="Creators"  color={CultureTokens.indigo} icon="calendar-outline" />
                  <StatChip value={staffCount}    label="Staff"     color={CultureTokens.teal}   icon="shield-outline" />
                  <StatChip value={adminsCount}   label="Admins"    color={CultureTokens.coral}  icon="key-outline" />
                  <StatChip value={verifiedCount} label="Verified"  color={CultureTokens.teal}   icon="checkmark-circle-outline" />
                </Animated.View>
              ) : null}

              {/* Search */}
              <Animated.View entering={FadeInDown.delay(80)} style={[s.searchWrap, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <Ionicons name="search" size={17} color={colors.textTertiary} />
                <TextInput
                  style={[s.searchInput, { color: colors.text }]}
                  placeholder="Search name, email, handle…"
                  placeholderTextColor={colors.textTertiary}
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                  accessibilityLabel="Search users"
                />
                {search.length > 0 ? (
                  <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="Clear search">
                    <Ionicons name="close-circle" size={17} color={colors.textTertiary} />
                  </Pressable>
                ) : null}
              </Animated.View>

              {/* Role filter chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
                {filterTabs.map(tab => {
                  const active = roleFilter === tab;
                  const meta   = tab === ALL ? null : ROLE_META[tab];
                  const count  = tab === ALL
                    ? users.length
                    : users.filter(u => (u.role ?? 'user') === tab).length;
                  const color  = meta?.color ?? colors.primary;
                  return (
                    <Pressable
                      key={tab}
                      style={[s.chip, {
                        backgroundColor: active ? color : colors.surface,
                        borderColor: active ? color : colors.borderLight,
                      }]}
                      onPress={() => setRoleFilter(tab)}
                      accessibilityRole="button"
                    >
                      {meta ? <Ionicons name={meta.icon as keyof typeof Ionicons.glyphMap} size={12} color={active ? '#fff' : color} /> : null}
                      <Text style={[s.chipText, { color: active ? '#fff' : colors.textSecondary }]}>
                        {tab === ALL ? 'All' : meta!.label}
                      </Text>
                      <View style={[s.chipCount, { backgroundColor: active ? 'rgba(255,255,255,0.22)' : colors.backgroundSecondary }]}>
                        <Text style={[s.chipCountText, { color: active ? '#fff' : colors.textTertiary }]}>{count}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Desktop table header */}
              {isDesktop ? (
                <View style={[s.tableWrap, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                  <TableHeader />
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item, index }) =>
            isDesktop ? (
              <View style={[s.tableWrap, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <TableRow
                  user={item}
                  onEditRole={() => setSelected(item)}
                  onToggleVerify={() => handleToggleVerify(item)}
                  canEditRole={canEdit(role, authUser?.id, item)}
                  canVerify={canAdmin}
                />
              </View>
            ) : (
              <UserCard
                user={item}
                index={index}
                onEditRole={() => setSelected(item)}
                onToggleVerify={() => handleToggleVerify(item)}
                canEditRole={canEdit(role, authUser?.id, item)}
                canVerify={canAdmin}
              />
            )
          }
          ItemSeparatorComponent={() =>
            isDesktop ? null : <View style={{ height: Spacing.sm }} />
          }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: Spacing.md - 4 }}>
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} width="100%" height={ADMIN_USERS_UI.skeletonCardHeight} borderRadius={CardTokens.radius} />)}
            </View>
          ) : (
              <View style={s.emptyWrap}>
                <Ionicons name="people-outline" size={ADMIN_USERS_UI.emptyIconSize} color={colors.textTertiary} />
                <Text style={[s.emptyTitle, { color: colors.text }]}>No users found</Text>
                <Text style={[s.emptyText, { color: colors.textSecondary }]}>
                  {search ? 'Try a different search term.' : 'No users match the selected filter.'}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            <View style={s.footer}>
              <Text style={[s.footerText, { color: colors.textTertiary }]}>
                Showing {filteredUsers.length} of {data?.total ?? 0} users
              </Text>
              {(data?.total ?? 0) > (page + 1) * 100 ? (
                <Pressable
                  style={[s.loadMore, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
                  onPress={() => setPage(p => p + 1)}
                  accessibilityRole="button"
                >
                  <Text style={[s.loadMoreText, { color: colors.primary }]}>Load more</Text>
                </Pressable>
              ) : null}
            </View>
          }
        />
      </View>

      {/* Role sheet */}
      <RoleSheet
        user={selected}
        assignable={assignable}
        onSelect={handleRoleSelect}
        onClose={() => setSelected(null)}
        isPending={roleMutation.isPending}
      />
    </View>
  );
}

export default function AdminUsersScreen() {
  return (
    <ErrorBoundary>
      <AdminUsersContent />
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  fill:         { flex: 1 },

  // Header
<<<<<<< HEAD
  header:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  headerTitle:  { ...TextStyles.title3, color: '#fff', letterSpacing: -0.2 },
  headerSub:    { ...TextStyles.caption, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  backBtn:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  headerBtn:    { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
||||||| 7dc71c1
  header:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  headerTitle:  { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -0.2 },
  headerSub:    { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  backBtn:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  headerBtn:    { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
=======
  header:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  headerTitle:  { ...TextStyles.title3, color: '#fff', letterSpacing: -0.2 },
  headerSub:    { ...TextStyles.caption, color: 'rgba(255,255,255,0.7)', marginTop: Spacing.xs - 3 },
  backBtn:      { width: IconSize.xl + Spacing.xs, height: IconSize.xl + Spacing.xs, borderRadius: CardTokens.radius - 6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  headerBtn:    { width: IconSize.lg + Spacing.sm + 2, height: IconSize.lg + Spacing.sm + 2, borderRadius: CardTokens.radius - 7, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
>>>>>>> cursor/onboarding-brand-lint-fixes

  // Body
  body:         { flex: 1 },
  bodyDesktop:  {},

  // List
  listContent:  { paddingTop: Spacing.md, paddingBottom: Spacing.xl, gap: 0 },
  listHeader:   { gap: Spacing.md - 4, marginBottom: Spacing.md - 4 },

  // Stats
  statsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },

  // Search
<<<<<<< HEAD
  searchWrap:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14, borderWidth: 1 },
  searchInput:  { flex: 1, ...TextStyles.cardBody, padding: 0 },
||||||| 7dc71c1
  searchWrap:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14, borderWidth: 1 },
  searchInput:  { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, padding: 0 },
=======
  searchWrap:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, paddingHorizontal: Spacing.md - 2, paddingVertical: Spacing.sm + 3, borderRadius: CardTokens.radius - 2, borderWidth: 1 },
  searchInput:  { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.body2, padding: 0 },
>>>>>>> cursor/onboarding-brand-lint-fixes

  // Role chips
<<<<<<< HEAD
  chips:        { gap: 8, paddingVertical: 2 },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText:     { ...TextStyles.captionSemibold },
  chipCount:    { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8, minWidth: 20, alignItems: 'center' },
  chipCountText:{ ...TextStyles.tabLabel },
||||||| 7dc71c1
  chips:        { gap: 8, paddingVertical: 2 },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText:     { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  chipCount:    { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8, minWidth: 20, alignItems: 'center' },
  chipCountText:{ fontSize: 10, fontFamily: 'Poppins_700Bold' },
=======
  chips:        { gap: Spacing.sm, paddingVertical: Spacing.xs - 2 },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm - 3, paddingHorizontal: ChipTokens.paddingH - 4, paddingVertical: ChipTokens.paddingV - 1, borderRadius: ChipTokens.radius, borderWidth: 1 },
  chipText:     { fontSize: FontSize.caption, fontFamily: FontFamily.semibold },
  chipCount:    { paddingHorizontal: Spacing.sm - 3, paddingVertical: Spacing.xs - 3, borderRadius: Spacing.sm, minWidth: CardTokens.radius + Spacing.xs, alignItems: 'center' },
  chipCountText:{ fontSize: FontSize.tab, fontFamily: FontFamily.bold },
>>>>>>> cursor/onboarding-brand-lint-fixes

  // Desktop table
  tableWrap:    { borderRadius: 0, borderLeftWidth: 0, borderRightWidth: 0, overflow: 'hidden' },

  // Empty / loading
<<<<<<< HEAD
  emptyWrap:    { alignItems: 'center', gap: 10, paddingVertical: 60 },
  emptyTitle:   { ...TextStyles.headline },
  emptyText:    { ...TextStyles.chip, textAlign: 'center' },
||||||| 7dc71c1
  emptyWrap:    { alignItems: 'center', gap: 10, paddingVertical: 60 },
  emptyTitle:   { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  emptyText:    { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
=======
  emptyWrap:    { alignItems: 'center', gap: Spacing.sm + 2, paddingVertical: 60 },
  emptyTitle:   { fontSize: FontSize.body, fontFamily: FontFamily.bold },
  emptyText:    { fontSize: FontSize.chip, fontFamily: FontFamily.regular, textAlign: 'center' },
>>>>>>> cursor/onboarding-brand-lint-fixes

  // Footer
<<<<<<< HEAD
  footer:       { alignItems: 'center', gap: 10, paddingTop: 16, paddingBottom: 20 },
  footerText:   { ...TextStyles.caption },
  loadMore:     { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  loadMoreText: { ...TextStyles.chip },
||||||| 7dc71c1
  footer:       { alignItems: 'center', gap: 10, paddingTop: 16, paddingBottom: 20 },
  footerText:   { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  loadMore:     { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  loadMoreText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
=======
  footer:       { alignItems: 'center', gap: Spacing.sm + 2, paddingTop: Spacing.md, paddingBottom: CardTokens.paddingLarge },
  footerText:   { fontSize: FontSize.caption, fontFamily: FontFamily.regular },
  loadMore:     { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: CardTokens.radius - 4, borderWidth: 1 },
  loadMoreText: { fontSize: FontSize.chip, fontFamily: FontFamily.semibold },
>>>>>>> cursor/onboarding-brand-lint-fixes
});
