import React from 'react';
import {
  View, Text, Pressable, StyleSheet, Modal, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, FontSize, Spacing } from '@/constants/theme';
import { CultureWalletMap } from '@/components/profile/CultureWalletMap';
import type { User } from '@shared/schema';
import { initials } from './ProfileUtils';

// ── Section header ────────────────────────────────────────────────────────────

export function SectionHeader({ title, action, onAction, colors }: {
  title: string; action?: string; onAction?: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={sh.row}>
      <View style={[sh.accent, { backgroundColor: CultureTokens.indigo }]} />
      <Text style={[sh.title, { color: colors.text }]}>{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={[sh.action, { color: CultureTokens.indigo }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
const sh = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  accent: { width: 4, height: 22, borderRadius: 2 },
  title:  { fontSize: 18, fontFamily: 'Poppins_700Bold', letterSpacing: -0.3, flex: 1, lineHeight: 26 },
  action: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', lineHeight: 18 },
});

// ── Avatar ────────────────────────────────────────────────────────────────────

export function ProfileAvatar({ user, displayName, size = 100 }: {
  user: Partial<User>; displayName: string; size?: number;
}) {
  const hasPhoto = !!user.avatarUrl;
  const isElite = (user.membership?.tier && user.membership.tier !== 'free') || user.isVerified;

  return (
    <View style={{ position: 'relative', marginBottom: 14 }}>
      <LinearGradient
        colors={isElite ? [CultureTokens.gold, '#F4A100'] : [CultureTokens.teal, CultureTokens.indigo]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, padding: 3, alignItems: 'center', justifyContent: 'center' }}
      >
        <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#1C1C2E' }}>
          {hasPhoto
            ? <Image source={{ uri: user.avatarUrl! }} style={{ width: size, height: size }} contentFit="cover" />
            : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: size * 0.35, fontFamily: 'Poppins_700Bold', color: CultureTokens.teal, letterSpacing: 1 }}>
                  {initials(displayName)}
                </Text>
              </View>}
        </View>
      </LinearGradient>
      {user.isVerified && (
        <View style={av.verifiedDot}>
          <Ionicons name="checkmark" size={10} color="#fff" />
        </View>
      )}
    </View>
  );
}
const av = StyleSheet.create({
  verifiedDot: {
    position: 'absolute', bottom: 14, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: CultureTokens.teal,
    borderWidth: 3, borderColor: '#0B0B14',
    alignItems: 'center', justifyContent: 'center',
  },
});

// ── Loading skeleton ──────────────────────────────────────────────────────────

export function ProfileSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[sk.hero, { backgroundColor: '#0B0B14' }]}>
        <View style={[sk.avatarRing, { backgroundColor: colors.border + '40' }]} />
        <View style={[sk.nameLine, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
        <View style={[sk.handleLine, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />
      </View>
      <View style={{ padding: 20, gap: 14 }}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[sk.block, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} />
        ))}
      </View>
    </View>
  );
}
const sk = StyleSheet.create({
  hero:       { alignItems: 'center', paddingTop: 80, paddingBottom: 32, gap: 12 },
  avatarRing: { width: 108, height: 108, borderRadius: 54 },
  nameLine:   { width: 160, height: 18, borderRadius: 9, marginTop: 4 },
  handleLine: { width: 100, height: 12, borderRadius: 6 },
  block:      { height: 90, borderRadius: 16, borderWidth: 1 },
});

// ── Culture Map Modal ─────────────────────────────────────────────────────────

export function CultureMapModal({ visible, onClose, cultures, colors }: {
  visible: boolean;
  onClose: () => void;
  cultures: { id: string; name: string; emoji: string; lat: number; lng: number; color: string }[];
  colors: ReturnType<typeof useColors>;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[cmap.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={Platform.OS !== 'web' ? FadeIn.duration(300) : undefined}
          style={[cmap.sheet, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}
        >
          <View style={cmap.header}>
            <View>
              <Text style={[cmap.title, { color: colors.text }]}>Cultural Heritage</Text>
              <Text style={[cmap.sub, { color: colors.textSecondary }]}>
                {cultures.length === 1
                  ? `Rooted in ${cultures[0].name} heritage.`
                  : `Your CulturePass spans ${cultures.length} traditions`}
              </Text>
            </View>
            <Pressable
              style={[cmap.closeBtn, { backgroundColor: colors.surfaceElevated }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={cmap.chipsRow}>
            {cultures.map(c => (
              <View key={c.id} style={[cmap.chip, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                <Text style={[cmap.chipLabel, { color: colors.text }]}>{c.name}</Text>
              </View>
            ))}
          </View>

          <View style={cmap.mapWrap}>
            <CultureWalletMap cultures={cultures} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const cmap = StyleSheet.create({
  overlay:   { flex: 1, justifyContent: 'flex-end' },
  sheet:     { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '90%', paddingBottom: Spacing.xxl },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: 20 },
  title:     { fontSize: FontSize.title, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  sub:       { fontSize: FontSize.body2, fontFamily: FontFamily.regular },
  closeBtn:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chipsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.sm + 4, paddingVertical: Spacing.sm, borderRadius: 12, borderWidth: 1 },
  chipLabel: { fontSize: FontSize.chip, fontFamily: FontFamily.semibold },
  mapWrap:   { flex: 1, borderRadius: Spacing.lg, overflow: 'hidden', marginHorizontal: Spacing.lg, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
});
