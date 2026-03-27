/**
 * RepresentativeCard — visual identity card for civic representatives, community
 * leaders, and cultural artists. Color-coded by role type:
 *   Indigo  = Government (Federal / State / Local)
 *   Teal    = Community Leader / Councillor / Mayor
 *   Coral   = Artist / Creative
 */
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { CardTokens, CultureTokens } from '@/constants/theme';
import type { RepresentativeProfile } from '@/shared/schema';
import { REPRESENTATIVE_ROLE_COLORS, REPRESENTATIVE_ROLE_LABELS } from '@/shared/schema';

// ── Ionicons for each government tier ───────────────────────────────────────
const ROLE_ICONS: Record<RepresentativeProfile['role'], string> = {
  federal_mp:       'business',
  state_mp:         'map',
  mayor:            'home',
  deputy_mayor:     'home-outline',
  councillor:       'people',
  community_leader: 'ribbon',
  artist:           'color-palette',
};

interface Props {
  rep: RepresentativeProfile;
  compact?: boolean;
  onPress?: () => void;
}

export function RepresentativeCard({ rep, compact = false, onPress }: Props) {
  const colors = useColors();
  const accentColor = REPRESENTATIVE_ROLE_COLORS[rep.role];
  const roleLabel   = REPRESENTATIVE_ROLE_LABELS[rep.role];
  const icon        = ROLE_ICONS[rep.role] as never;

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (onPress) {
      onPress();
    } else if (rep.userId) {
      router.push({ pathname: '/user/[id]', params: { id: rep.userId } });
    }
  };

  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.compactCard,
          {
            backgroundColor: colors.surface,
            borderColor: accentColor + '30',
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${rep.name}, ${rep.title}`}
      >
        <View style={[styles.compactAvatar, { borderColor: accentColor }]}>
          {rep.avatarUrl ? (
            <Image source={{ uri: rep.avatarUrl }} style={styles.compactAvatarImg} contentFit="cover" />
          ) : (
            <View style={[styles.compactAvatarPlaceholder, { backgroundColor: accentColor + '18' }]}>
              <Ionicons name={icon} size={18} color={accentColor} />
            </View>
          )}
        </View>
        <View style={styles.compactBody}>
          <Text style={[styles.compactName, { color: colors.text }]} numberOfLines={1}>{rep.name}</Text>
          <Text style={[styles.compactTitle, { color: colors.textSecondary }]} numberOfLines={1}>{rep.title}</Text>
        </View>
        {rep.verified && (
          <Ionicons name="checkmark-circle" size={16} color={accentColor} />
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${rep.name}, ${rep.title}`}
    >
      {/* Accent stripe */}
      <View style={[styles.accentStripe, { backgroundColor: accentColor }]} />

      <View style={styles.cardInner}>
        {/* Avatar */}
        <View style={[styles.avatarWrap, { borderColor: accentColor + '60' }]}>
          {rep.avatarUrl ? (
            <Image source={{ uri: rep.avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: accentColor + '18' }]}>
              <Ionicons name={icon} size={28} color={accentColor} />
            </View>
          )}
          {rep.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: accentColor }]}>
              <Ionicons name="checkmark" size={8} color="#fff" />
            </View>
          )}
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{rep.name}</Text>
            {!rep.isClaimed && (
              <View style={[styles.unclaimedBadge, { backgroundColor: colors.primaryGlow }]}>
                <Text style={[styles.unclaimedText, { color: colors.textSecondary }]}>Unclaimed</Text>
              </View>
            )}
          </View>
          <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={1}>{rep.title}</Text>

          <View style={styles.roleBadge}>
            <Ionicons name={icon} size={11} color={accentColor} />
            <Text style={[styles.roleText, { color: accentColor }]}>{roleLabel}</Text>
          </View>

          {rep.bio && (
            <Text style={[styles.bio, { color: colors.textTertiary }]} numberOfLines={2}>{rep.bio}</Text>
          )}
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>

      {/* Action row */}
      {(rep.contactEmail || rep.website || rep.isClaimed === false) && (
        <View style={[styles.actionRow, { borderTopColor: colors.divider }]}>
          {rep.contactEmail && (
            <View style={styles.actionChip}>
              <Ionicons name="mail-outline" size={12} color={accentColor} />
              <Text style={[styles.actionChipText, { color: accentColor }]}>Contact</Text>
            </View>
          )}
          {rep.website && (
            <View style={styles.actionChip}>
              <Ionicons name="globe-outline" size={12} color={accentColor} />
              <Text style={[styles.actionChipText, { color: accentColor }]}>Website</Text>
            </View>
          )}
          {rep.isClaimed === false && (
            <View style={[styles.actionChip, { backgroundColor: CultureTokens.indigo + '10' }]}>
              <Ionicons name="person-add-outline" size={12} color={CultureTokens.indigo} />
              <Text style={[styles.actionChipText, { color: CultureTokens.indigo }]}>Claim Profile</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

// ── Tier header badge ────────────────────────────────────────────────────────

interface TierBadgeProps {
  label: string;
  color: string;
  icon: string;
}

export function CivicTierBadge({ label, color, icon }: TierBadgeProps) {
  return (
    <View style={[badge.wrap, { backgroundColor: color + '14', borderColor: color + '30' }]}>
      <Ionicons name={icon as never} size={12} color={color} />
      <Text style={[badge.text, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.8,
  },
});

const styles = StyleSheet.create({
  // ── Full card ─────────────────────────────────────────────────────────────
  card: {
    borderRadius: CardTokens.radius,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
  },
  accentStripe: {
    height: 3,
    width: '100%',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    overflow: 'visible',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  unclaimedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unclaimedText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
  },
  title: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  roleText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  bio: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  actionChipText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },

  // ── Compact card ──────────────────────────────────────────────────────────
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  compactAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  compactAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactBody: {
    flex: 1,
  },
  compactName: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  compactTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
});
