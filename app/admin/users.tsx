import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/query-client';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/lib/auth';
import { CultureTokens } from '@/constants/theme';
import type { UserRole } from '@/shared/schema';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  username?: string;
  displayName?: string;
  email?: string;
  role?: UserRole;
  avatarUrl?: string;
  city?: string;
  country?: string;
  subscriptionTier?: string;
  createdAt?: string;
}

interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

// ─── Role definitions ────────────────────────────────────────────────────────

const ROLE_META: Record<UserRole, { label: string; description: string; color: string; rank: number }> = {
  user:          { label: 'User',           description: 'Standard member',              color: '#8E8E93',              rank: 0 },
  organizer:     { label: 'Organizer',      description: 'Creates & manages events',     color: CultureTokens.indigo,   rank: 1 },
  business:      { label: 'Business',       description: 'Business listing owner',       color: CultureTokens.saffron,  rank: 1 },
  sponsor:       { label: 'Sponsor',        description: 'Community sponsor',            color: CultureTokens.gold,     rank: 1 },
  cityAdmin:     { label: 'City Admin',     description: 'Manages a city region',        color: CultureTokens.teal,     rank: 2 },
  moderator:     { label: 'Moderator',      description: 'Reviews content & reports',    color: '#5AC8FA',              rank: 3 },
  admin:         { label: 'Admin',          description: 'Full platform access',         color: '#5856D6',              rank: 4 },
  platformAdmin: { label: 'Platform Admin', description: 'Super administrator',          color: CultureTokens.coral,    rank: 5 },
};

const ROLE_KEYS = Object.keys(ROLE_META) as UserRole[];

function canEditUserRole(actorRole: UserRole, actorId: string | undefined, target: AdminUser): boolean {
  const current = target.role ?? 'user';
  if (!actorId || actorId === target.id) return false;
  if (actorRole === 'platformAdmin') return current !== 'admin' && current !== 'platformAdmin';
  if (actorRole === 'admin') return current !== 'platformAdmin';
  return false;
}

function getAssignableRoles(actorRole: UserRole, actorId: string | undefined, target: AdminUser): UserRole[] {
  if (!canEditUserRole(actorRole, actorId, target)) return [];
  if (actorRole === 'platformAdmin') return ROLE_KEYS.filter(k => k !== 'admin' && k !== 'platformAdmin');
  if (actorRole === 'admin')         return ROLE_KEYS.filter(k => k !== 'platformAdmin');
  return [];
}

// ─── Role badge ──────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role?: UserRole }) {
  const meta = ROLE_META[role ?? 'user'];
  return (
    <View style={[rb.wrap, { borderColor: meta.color + '66', backgroundColor: meta.color + '14' }]}>
      <Text style={[rb.text, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}
const rb = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  text: { fontSize: 11, fontFamily: 'Poppins_700Bold' },
});

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ value, label, color, icon }: { value: string | number; label: string; color: string; icon: string }) {
  const colors = useColors();
  return (
    <View style={[sc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={[sc.icon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as never} size={16} color={color} />
      </View>
      <Text style={[sc.value, { color: colors.text }]}>{value}</Text>
      <Text style={[sc.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card:  { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 6, alignItems: 'center' },
  icon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  value: { fontSize: 22, fontFamily: 'Poppins_700Bold' },
  label: { fontSize: 11, fontFamily: 'Poppins_500Medium', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ─── Role assignment modal ───────────────────────────────────────────────────

interface RoleModalProps {
  user: AdminUser | null;
  assignableRoles: UserRole[];
  onSelect: (role: UserRole) => void;
  onClose: () => void;
  isPending: boolean;
}

function RoleModal({ user, assignableRoles, onSelect, onClose, isPending }: RoleModalProps) {
  const colors = useColors();
  if (!user) return null;
  const currentRole = user.role ?? 'user';

  return (
    <Modal
      transparent
      animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
      visible={!!user}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[rm.backdrop, { backgroundColor: 'transparent' }]}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={onClose} />
        <View
          style={[rm.sheet, { backgroundColor: colors.surface }]}
        >
          {/* Handle (mobile) */}
          <View style={[rm.handle, { backgroundColor: colors.border }]} />

          {/* User identity */}
          <View style={[rm.userRow, { borderBottomColor: colors.divider }]}>
            <View style={[rm.avatarWrap, { backgroundColor: colors.surfaceElevated }]}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={rm.avatar} contentFit="cover" />
              ) : (
                <Text style={[rm.initials, { color: colors.primary }]}>
                  {(user.displayName ?? user.username ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[rm.userName, { color: colors.text }]} numberOfLines={1}>
                {user.displayName ?? user.username ?? 'Unknown'}
              </Text>
              <Text style={[rm.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                {user.email ?? `@${user.username}`}
              </Text>
            </View>
            <RoleBadge role={currentRole as UserRole} />
          </View>

          {/* Section label */}
          <Text style={[rm.sectionLabel, { color: colors.textTertiary }]}>Assign Role</Text>

          {/* Role options */}
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {assignableRoles.map(roleKey => {
              const meta = ROLE_META[roleKey];
              const isCurrent = roleKey === currentRole;
              return (
                <Pressable
                  key={roleKey}
                  style={({ pressed }) => [
                    rm.roleRow,
                    { borderBottomColor: colors.divider },
                    isCurrent && { backgroundColor: meta.color + '10' },
                    pressed && !isCurrent && { backgroundColor: colors.surfaceElevated },
                  ]}
                  onPress={() => !isCurrent && !isPending && onSelect(roleKey)}
                  disabled={isCurrent || isPending}
                  accessibilityRole="button"
                  accessibilityLabel={`Assign ${meta.label}`}
                >
                  <View style={[rm.roleIconWrap, { backgroundColor: meta.color + '18' }]}>
                    <Ionicons name={roleIconFor(roleKey)} size={16} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[rm.roleLabel, { color: colors.text }]}>{meta.label}</Text>
                    <Text style={[rm.roleDesc, { color: colors.textSecondary }]}>{meta.description}</Text>
                  </View>
                  {isCurrent ? (
                    <View style={[rm.currentBadge, { backgroundColor: meta.color + '20', borderColor: meta.color + '44' }]}>
                      <Text style={[rm.currentBadgeText, { color: meta.color }]}>Current</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Cancel */}
          <Pressable
            style={({ pressed }) => [rm.cancelBtn, { borderTopColor: colors.divider }, pressed && { opacity: 0.7 }]}
            onPress={onClose}
          >
            <Text style={[rm.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function roleIconFor(role: UserRole): keyof typeof import('@expo/vector-icons/build/Ionicons').default.glyphMap {
  const map: Record<UserRole, string> = {
    user: 'person-outline', organizer: 'calendar-outline', business: 'briefcase-outline',
    sponsor: 'ribbon-outline', cityAdmin: 'location-outline', moderator: 'shield-outline',
    admin: 'key-outline', platformAdmin: 'star-outline',
  };
  return map[role] as never;
}

const rm = StyleSheet.create({
  backdrop:       { flex: 1, justifyContent: 'flex-end', alignItems: Platform.OS === 'web' ? 'center' : 'stretch' },
  sheet:          {
    borderRadius: Platform.OS === 'web' ? 20 : 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    width: Platform.OS === 'web' ? 480 : '100%',
    maxWidth: '100%',
    ...(Platform.OS === 'web' ? { marginBottom: 40, alignSelf: 'center' as const } : {}),
  },
  handle:         { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  userRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  avatarWrap:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatar:         { width: 44, height: 44 },
  initials:       { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  userName:       { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  userEmail:      { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  sectionLabel:   { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 4, marginTop: 8 },
  roleRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  roleIconWrap:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  roleLabel:      { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  roleDesc:       { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  currentBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  currentBadgeText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  cancelBtn:      { marginTop: 8, paddingVertical: 16, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  cancelText:     { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});

// ─── User row (mobile card / desktop table row) ──────────────────────────────

function UserRow({
  user, onPress, disabled, isDesktop,
}: {
  user: AdminUser; onPress: () => void; disabled: boolean; isDesktop: boolean;
}) {
  const colors = useColors();
  const name     = user.displayName ?? user.username ?? 'Unknown';
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const joined   = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  if (isDesktop) {
    return (
      <Pressable
        style={({ pressed }) => [
          ur.tableRow,
          { borderBottomColor: colors.divider },
          pressed && !disabled && { backgroundColor: colors.primaryGlow },
          disabled && { opacity: 0.55 },
        ]}
        onPress={disabled ? undefined : onPress}
        accessibilityRole="button"
        accessibilityLabel={`Edit role for ${name}`}
      >
        {/* Avatar + name */}
        <View style={[ur.tdAvatar]}>
          <View style={[ur.avatarWrap, { backgroundColor: colors.surfaceElevated }]}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={ur.avatar} contentFit="cover" />
            ) : (
              <Text style={[ur.initials, { color: colors.primary }]}>{initials}</Text>
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[ur.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
            <Text style={[ur.sub, { color: colors.textTertiary }]} numberOfLines={1}>@{user.username}</Text>
          </View>
        </View>
        {/* Email */}
        <View style={ur.tdEmail}>
          <Text style={[ur.sub, { color: colors.textSecondary }]} numberOfLines={1}>{user.email ?? '—'}</Text>
        </View>
        {/* Role */}
        <View style={ur.tdRole}>
          <RoleBadge role={user.role} />
        </View>
        {/* Location */}
        <View style={ur.tdLocation}>
          <Text style={[ur.sub, { color: colors.textSecondary }]} numberOfLines={1}>
            {[user.city, user.country].filter(Boolean).join(', ') || '—'}
          </Text>
        </View>
        {/* Joined */}
        <View style={ur.tdJoined}>
          <Text style={[ur.sub, { color: colors.textTertiary }]}>{joined}</Text>
        </View>
        {/* Action */}
        <View style={ur.tdAction}>
          {disabled ? (
            <Ionicons name="lock-closed-outline" size={15} color={colors.textTertiary} />
          ) : (
            <View style={[ur.editBtn, { backgroundColor: colors.primaryGlow, borderColor: colors.primary + '44' }]}>
              <Ionicons name="create-outline" size={14} color={colors.primary} />
              <Text style={[ur.editBtnText, { color: colors.primary }]}>Edit</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  }

  // Mobile card
  return (
    <Pressable
      style={({ pressed }) => [
        ur.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        pressed && !disabled && { backgroundColor: colors.primaryGlow, borderColor: colors.primary + '44' },
        disabled && { opacity: 0.55 },
      ]}
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
    >
      <View style={[ur.avatarWrap, { backgroundColor: colors.surfaceElevated }]}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={ur.avatar} contentFit="cover" />
        ) : (
          <Text style={[ur.initials, { color: colors.primary }]}>{initials}</Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[ur.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
        <Text style={[ur.sub, { color: colors.textSecondary }]} numberOfLines={1}>{user.email ?? `@${user.username}`}</Text>
        {user.city ? (
          <Text style={[ur.sub, { color: colors.textTertiary, marginTop: 1 }]} numberOfLines={1}>
            <Ionicons name="location-outline" size={11} color={colors.textTertiary} /> {user.city}{user.country ? `, ${user.country}` : ''}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <RoleBadge role={user.role} />
        {disabled ? (
          <Ionicons name="lock-closed-outline" size={14} color={colors.textTertiary} />
        ) : (
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        )}
      </View>
    </Pressable>
  );
}

const ur = StyleSheet.create({
  card:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  avatar:     { width: 44, height: 44 },
  initials:   { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  name:       { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  sub:        { fontSize: 12, fontFamily: 'Poppins_400Regular' },

  // Desktop table row
  tableRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  tdAvatar:   { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  tdEmail:    { flex: 2, paddingRight: 12, minWidth: 0 },
  tdRole:     { flex: 1, minWidth: 80 },
  tdLocation: { flex: 1.5, paddingRight: 8, minWidth: 0 },
  tdJoined:   { flex: 1, minWidth: 80 },
  tdAction:   { width: 70, alignItems: 'flex-end' },
  editBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  editBtnText:{ fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
});

// ─── Table header ────────────────────────────────────────────────────────────

function TableHeader() {
  const colors = useColors();
  return (
    <View style={[th.row, { backgroundColor: colors.surfaceElevated, borderBottomColor: colors.divider }]}>
      {([
        { label: 'User',     flex: 2 },
        { label: 'Email',    flex: 2 },
        { label: 'Role',     flex: 1 },
        { label: 'Location', flex: 1.5 },
        { label: 'Joined',   flex: 1 },
        { label: '',         width: 70 },
      ] as { label: string; flex?: number; width?: number }[]).map((col, i) => (
        <Text
          key={i}
          style={[th.cell, { color: colors.textTertiary, flex: col.flex, width: col.width }]}
        >
          {col.label}
        </Text>
      ))}
    </View>
  );
}
const th = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  cell: { fontSize: 11, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 0.8 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

const ALL_FILTER = '__all__';

export default function AdminUsersScreen() {
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors   = useColors();
  const { isDesktop, hPad } = useLayout();
  const { user: authUser } = useAuth();
  const { role, isAdmin, isLoading: roleLoading } = useRole();

  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState<UserRole | typeof ALL_FILTER>(ALL_FILTER);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [page] = useState(0);

  useEffect(() => {
    if (!roleLoading && !isAdmin) router.replace('/(tabs)');
  }, [isAdmin, roleLoading]);

  const { data, isLoading, refetch, isFetching } = useQuery<AdminUsersResponse>({
    queryKey: ['/api/admin/users', page],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/admin/users?limit=50&page=${page}`);
      return res.json();
    },
    enabled: isAdmin,
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      const res = await apiRequest('PUT', `/api/admin/users/${userId}/role`, { role: newRole });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setSelectedUser(null);
    },
    onError: () => Alert.alert('Error', 'Failed to assign role. Please try again.'),
  });

  const handleRoleSelect = useCallback((newRole: UserRole) => {
    if (!selectedUser) return;
    const current = selectedUser.role ?? 'user';
    Alert.alert(
      'Confirm Role Change',
      `Change ${selectedUser.displayName ?? selectedUser.username}'s role from "${ROLE_META[current].label}" to "${ROLE_META[newRole].label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => assignRoleMutation.mutate({ userId: selectedUser.id, newRole }) },
      ],
    );
  }, [selectedUser, assignRoleMutation]);

  const users = useMemo(() => data?.users ?? [], [data?.users]);

  // Stats
  const adminCount     = users.filter(u => u.role === 'admin' || u.role === 'platformAdmin').length;
  const organizerCount = users.filter(u => ['organizer', 'business', 'sponsor'].includes(u.role ?? '')).length;
  const staffCount     = users.filter(u => ['cityAdmin', 'moderator'].includes(u.role ?? '')).length;

  // Filter + search
  const filteredUsers = useMemo(() => {
    let list = users;
    if (roleFilter !== ALL_FILTER) list = list.filter(u => (u.role ?? 'user') === roleFilter);
    const q = search.toLowerCase().trim();
    if (q) list = list.filter(u =>
      (u.displayName ?? '').toLowerCase().includes(q) ||
      (u.username ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q),
    );
    return list;
  }, [users, roleFilter, search]);

  const assignableRoles = selectedUser
    ? getAssignableRoles(role, authUser?.id, selectedUser)
    : [];

  if (roleLoading || (!isAdmin && !roleLoading)) {
    return <View style={[s.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  // Role filter tabs — only show roles present in the loaded data + "All"
  const presentRoles = Array.from(new Set(users.map(u => u.role ?? 'user')));
  const filterTabs: (UserRole | typeof ALL_FILTER)[] = [ALL_FILTER, ...ROLE_KEYS.filter(k => presentRoles.includes(k))];

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: topInset }]}>

      {/* Header */}
      <View style={[s.header, { paddingHorizontal: hPad, borderBottomColor: colors.divider }]}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          style={[s.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
          accessibilityRole="button" accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.text }]}>User Management</Text>
          <Text style={[s.headerSub, { color: colors.textSecondary }]}>
            {data?.total ?? 0} total users{isFetching ? ' · Refreshing…' : ''}
          </Text>
        </View>
        <Pressable
          onPress={() => refetch()}
          style={[s.iconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
          accessibilityRole="button" accessibilityLabel="Refresh"
        >
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/admin/notifications' as never)}
          style={[s.iconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
          accessibilityRole="button" accessibilityLabel="Campaign manager"
        >
          <Ionicons name="megaphone-outline" size={18} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/admin/audit-logs' as never)}
          style={[s.iconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
          accessibilityRole="button" accessibilityLabel="Audit logs"
        >
          <Ionicons name="document-text-outline" size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* Body */}
      <View style={[s.body, isDesktop && s.bodyDesktop]}>

        {/* Centred content column */}
        <View style={[s.col, isDesktop && s.colDesktop]}>

          {/* Stats row */}
          {!isLoading && data ? (
            <View style={s.statsRow}>
              <StatCard value={data.total}      label="Total"      color={colors.primary}    icon="people-outline" />
              <StatCard value={adminCount}       label="Admins"     color={CultureTokens.coral}   icon="key-outline"    />
              <StatCard value={organizerCount}   label="Organizers" color={CultureTokens.indigo}  icon="calendar-outline" />
              <StatCard value={staffCount}       label="Staff"      color={CultureTokens.teal}    icon="shield-outline" />
            </View>
          ) : null}

          {/* Search */}
          <View style={[s.searchWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
            <Ionicons name="search" size={17} color={colors.textTertiary} />
            <TextInput
              style={[s.searchInput, { color: colors.text }]}
              placeholder="Search by name or email…"
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
          </View>

          {/* Role filter tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterTabs}>
            {filterTabs.map(tab => {
              const active = roleFilter === tab;
              const meta   = tab === ALL_FILTER ? null : ROLE_META[tab];
              const count  = tab === ALL_FILTER ? users.length : users.filter(u => (u.role ?? 'user') === tab).length;
              return (
                <Pressable
                  key={tab}
                  style={[
                    s.filterTab,
                    {
                      backgroundColor: active ? (meta?.color ?? colors.primary) : colors.surfaceElevated,
                      borderColor: active ? (meta?.color ?? colors.primary) : colors.borderLight,
                    },
                  ]}
                  onPress={() => setRoleFilter(tab)}
                  accessibilityRole="button"
                  accessibilityLabel={tab === ALL_FILTER ? 'All roles' : `Filter by ${ROLE_META[tab].label}`}
                >
                  <Text style={[s.filterTabText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                    {tab === ALL_FILTER ? 'All' : ROLE_META[tab].label}
                  </Text>
                  <View style={[s.filterTabCount, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.border }]}>
                    <Text style={[s.filterTabCountText, { color: active ? '#FFFFFF' : colors.textTertiary }]}>{count}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* User list */}
          {isLoading ? (
            <View style={[s.center, { paddingTop: 60 }]}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[s.loadingText, { color: colors.textSecondary }]}>Loading users…</Text>
            </View>
          ) : (
            <View style={[s.listWrap, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {isDesktop ? <TableHeader /> : null}
              <FlatList
                data={filteredUsers}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <Animated.View entering={FadeInDown.delay(Math.min(index * 35, 280)).springify()}>
                  <UserRow
                    user={item}
                    isDesktop={isDesktop}
                    onPress={() => setSelectedUser(item)}
                    disabled={!canEditUserRole(role, authUser?.id, item)}
                  />
                  </Animated.View>
                )}
                ItemSeparatorComponent={isDesktop ? undefined : () => (
                  <View style={[s.sep, { backgroundColor: colors.divider }]} />
                )}
                ListEmptyComponent={
                  <View style={s.empty}>
                    <Ionicons name="people-outline" size={40} color={colors.textTertiary} />
                    <Text style={[s.emptyTitle, { color: colors.text }]}>No users found</Text>
                    <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                      {search ? 'Try a different search term.' : 'No users match the selected filter.'}
                    </Text>
                  </View>
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={isDesktop ? undefined : { padding: 12, gap: 8 }}
              />
            </View>
          )}

          <Text style={[s.pagingNote, { color: colors.textTertiary }]}>
            Showing {filteredUsers.length} of {data?.total ?? 0} users
          </Text>

        </View>
      </View>

      {/* Role assignment modal */}
      <RoleModal
        user={selectedUser}
        assignableRoles={assignableRoles}
        onSelect={handleRoleSelect}
        onClose={() => setSelectedUser(null)}
        isPending={assignRoleMutation.isPending}
      />

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CONTENT_MAX = 1200;

const s = StyleSheet.create({
  container:      { flex: 1 },
  center:         { alignItems: 'center', justifyContent: 'center', gap: 12 },

  header:         {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:        { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconBtn:        { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle:    { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  headerSub:      { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },

  body:           { flex: 1 },
  bodyDesktop:    {},
  col:            { flex: 1, padding: 16, gap: 14 },
  colDesktop:     { maxWidth: CONTENT_MAX, width: '100%', alignSelf: 'center' as const },

  statsRow:       { flexDirection: 'row', gap: 10 },

  searchWrap:     {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  searchInput:    { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, padding: 0 },

  filterTabs:     { gap: 8, paddingVertical: 2 },
  filterTab:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterTabText:  { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  filterTabCount: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8, minWidth: 20, alignItems: 'center' },
  filterTabCountText: { fontSize: 10, fontFamily: 'Poppins_700Bold' },

  listWrap:       { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sep:            { height: StyleSheet.hairlineWidth, marginHorizontal: 12 },

  pagingNote:     { fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingBottom: 8 },

  empty:          { alignItems: 'center', gap: 8, paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle:     { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  emptySub:       { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  loadingText:    { fontFamily: 'Poppins_400Regular', fontSize: 14 },
});
