import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { CultureTokens } from '@/constants/theme';

export default function AdminMeetScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { hPad, isDesktop, contentWidth } = useLayout();
  const { isSuperAdmin, isAdmin, isLoading: roleLoading } = useRole();

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin && !isAdmin) {
      router.replace('/(tabs)' as any);
    }
  }, [roleLoading, isSuperAdmin, isAdmin]);

  if (roleLoading || (!isSuperAdmin && !isAdmin)) return null;

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scroll,
          {
            paddingTop: insets.top + 18,
            paddingBottom: insets.bottom + 48,
            paddingHorizontal: hPad,
          },
          isDesktop && { width: contentWidth, alignSelf: 'center' as const },
        ]}
      >
        <View style={s.headerRow}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin/dashboard' as any))}
            style={[s.backBtn, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Go back to admin dashboard"
          >
            <Ionicons name="arrow-back" size={16} color={colors.text} />
          </Pressable>
          <View style={[s.badge, { backgroundColor: CultureTokens.indigo + '1A', borderColor: CultureTokens.indigo + '44' }]}>
            <Text style={[s.badgeText, { color: CultureTokens.indigo }]}>MEET BETA</Text>
          </View>
        </View>

        <View style={[s.heroCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
          <Text style={[s.heroTitle, { color: colors.text }]}>CultraMeet Admin</Text>
          <Text style={[s.heroSub, { color: colors.textSecondary }]}>
            Configure profile matching roadmap: 1:1 pairing, 4+ group matching, moderation, and safety controls.
          </Text>
          <Text style={[s.heroSub, { color: colors.textSecondary }]}>
            Current phase keeps Meet separate from Perks. Future phase swaps Perks tab with Meet after rollout validation.
          </Text>
        </View>

        <View style={s.grid}>
          <ActionCard
            title="Open Meet Experience"
            desc="Preview the user-facing CultraMeet screen."
            icon="people-circle-outline"
            color={CultureTokens.teal}
            onPress={() => router.push('/(tabs)/meet' as any)}
          />
          <ActionCard
            title="Moderation Queue"
            desc="Review flagged profiles and behavior reports."
            icon="shield-checkmark-outline"
            color={CultureTokens.coral}
            onPress={() => router.push('/admin/moderation' as any)}
          />
          <ActionCard
            title="Profile Controls"
            desc="Manage public profile data and visibility."
            icon="id-card-outline"
            color={CultureTokens.indigo}
            onPress={() => router.push('/admin/profiles' as any)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ActionCard({
  title,
  desc,
  icon,
  color,
  onPress,
}: {
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight, opacity: pressed ? 0.86 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[s.iconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[s.cardTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[s.cardDesc, { color: colors.textSecondary }]}>{desc}</Text>
      <Ionicons name="arrow-forward" size={14} color={color} style={{ marginTop: 6 }} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 0.8 },
  heroCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 8 },
  heroTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold' },
  heroSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { minWidth: 210, flexGrow: 1, flexBasis: 240, borderWidth: 1, borderRadius: 16, padding: 14 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', marginBottom: 4 },
  cardDesc: { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
});
