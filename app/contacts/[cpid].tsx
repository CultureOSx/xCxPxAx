import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { goBackOrReplace } from '@/lib/navigation';
import { useColors } from '@/hooks/useColors';
import {
  CardTokens,
  ChipTokens,
  CultureTokens,
  FontFamily,
  FontSize,
  gradients,
  IconSize,
  Spacing,
  TextStyles,
  type ColorTheme,
} from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { useContacts } from '@/contexts/ContactsContext';
import { useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

// ─── Tier config ─────────────────────────────────────────────────────────────

const getTierDisplay = (colors: ColorTheme): Record<string, { label: string; color: string; icon: string }> => ({
  free: { label: 'Standard', color: colors.textSecondary, icon: 'shield-outline' },
  plus: { label: 'Plus', color: CultureTokens.indigo, icon: 'star' },
  premium: { label: 'Premium', color: CultureTokens.gold, icon: 'diamond' },
  elite: { label: 'Elite', color: '#8E44AD', icon: 'trophy' },
  vip: { label: 'VIP', color: CultureTokens.gold, icon: 'ribbon' },
  pro: { label: 'Pro', color: CultureTokens.teal, icon: 'briefcase' },
});

// ─── vCard builder ────────────────────────────────────────────────────────────

function buildVCard(contact: ReturnType<ReturnType<typeof useContacts>['getContact']>): string {
  if (!contact) return '';

  const nameParts = (contact.name || 'CulturePass User').split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ');

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.name || 'CulturePass User'}`,
    `N:${lastName};${firstName};;;`,
  ];

  if (contact.org) {
    lines.push(`ORG:${contact.org}`);
  }
  if (contact.phone) {
    lines.push(`TEL;TYPE=CELL:${contact.phone}`);
  }
  if (contact.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${contact.email}`);
  }
  if (contact.username) {
    lines.push(`URL;TYPE=WORK:https://culturepass.app/u/${contact.username}`);
    lines.push(`X-SOCIALPROFILE;type=culturepass:${contact.username}`);
  }
  if (contact.city || contact.country) {
    lines.push(`ADR;TYPE=HOME:;;${contact.city || ''};${contact.country || ''};;;`);
  }
  if (contact.avatarUrl) {
    lines.push(`PHOTO;VALUE=URI:${contact.avatarUrl}`);
  }

  const noteLines = [`CulturePass ID: ${contact.cpid}`];
  if (contact.bio) noteLines.push(contact.bio);
  lines.push(`NOTE:${noteLines.join(' | ')}`);

  lines.push('END:VCARD');
  return lines.join('\n');
}

// ─── Save vCard to phone ──────────────────────────────────────────────────────

async function saveVCardToPhone(contact: NonNullable<ReturnType<ReturnType<typeof useContacts>['getContact']>>) {
  const vCardString = buildVCard(contact);
  const displayName = contact.name || contact.cpid;

  if (Platform.OS === 'web') {
    const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${displayName.replace(/\s+/g, '_')}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  try {
    const safeName = displayName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileUri = (FileSystem.cacheDirectory ?? '') + `${safeName}.vcf`;

    await FileSystem.writeAsStringAsync(fileUri, vCardString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Share.share({
      title: `Save ${displayName} to Contacts`,
      message: vCardString,
      url: fileUri,
    });
  } catch {
    await Share.share({
      title: `Save ${displayName} to Contacts`,
      message: vCardString,
    });
  }
}

// ─── Info row component ───────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  color,
  onPress,
  badge,
}: {
  icon: string;
  label: string;
  value: string;
  color?: string;
  onPress?: () => void;
  badge?: string;
}) {
  const colors = useColors();
  const rowStyles = getRowStyles(colors);
  const finalColor = color || colors.text;

  const content = (
    <View style={rowStyles.container}>
      <View style={[rowStyles.iconWrap, { backgroundColor: finalColor === colors.text ? colors.backgroundSecondary : finalColor + '15' }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={finalColor} />
      </View>
      <View style={rowStyles.textWrap}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={[rowStyles.value, onPress && { color: finalColor }]} numberOfLines={1}>{value}</Text>
      </View>
      {badge && (
        <View style={rowStyles.badge}>
          <Text style={rowStyles.badgeText}>{badge}</Text>
        </View>
      )}
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
    </View>
  );

  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

const getRowStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md - 2,
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: CardTokens.paddingLarge,
  },
  iconWrap: {
    width: IconSize.xxl + 4,
    height: IconSize.xxl + 4,
    borderRadius: CardTokens.radius - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  label: {
    fontSize: FontSize.micro,
    fontFamily: FontFamily.medium,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontSize: FontSize.callout,
    fontFamily: FontFamily.medium,
    color: colors.text,
    marginTop: Spacing.xs - 2,
  },
  badge: {
    backgroundColor: CultureTokens.indigo + '15',
    borderRadius: Spacing.sm,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    fontSize: FontSize.micro,
    fontFamily: FontFamily.semibold,
    color: CultureTokens.indigo,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ContactDetailScreen() {
  const { cpid } = useLocalSearchParams<{ cpid: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const styles = getStyles(colors);
  const { getContact, removeContact } = useContacts();

  const contact = getContact(cpid as string);

  const handleShare = useCallback(async () => {
    if (!contact) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const profileUrl = contact.username
      ? `https://culturepass.app/u/${contact.username}`
      : '';
    try {
      await Share.share({
        title: `${contact.name} on CulturePass`,
        message: `Check out ${contact.name || contact.cpid} on CulturePass!\nCPID: ${contact.cpid}${profileUrl ? `\n${profileUrl}` : ''}`,
        url: profileUrl || undefined,
      });
    } catch {}
  }, [contact]);

  const handleSaveToPhone = useCallback(async () => {
    if (!contact) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await saveVCardToPhone(contact);
    } catch {
      Alert.alert('Error', 'Could not save contact. Please try again.');
    }
  }, [contact]);

  const handleRemove = useCallback(() => {
    if (!contact) return;
    Alert.alert(
      'Remove Contact',
      `Remove ${contact.name || contact.cpid} from your saved contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            removeContact(contact.cpid);
            goBackOrReplace('/(tabs)');
          },
        },
      ]
    );
  }, [contact, removeContact]);

  const handleViewProfile = useCallback(() => {
    if (!contact?.userId) {
      Alert.alert('Profile', 'Full profile is not available for this contact.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/user/[id]', params: { id: contact.userId } });
  }, [contact]);

  const handleCall = useCallback(() => {
    if (!contact?.phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${contact.phone}`);
  }, [contact]);

  const handleEmail = useCallback(() => {
    if (!contact?.email) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${contact.email}`);
  }, [contact]);

  const handleOpenLocation = useCallback(() => {
    if (!contact?.city) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const q = `${contact.city}${contact.country ? `, ${contact.country}` : ''}`;
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(q)}`);
  }, [contact]);

  if (!contact) {
    return (
      <View style={[styles.container, { paddingTop: topInset, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="person-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.notFoundText}>Contact not found</Text>
        <Pressable style={styles.backLink} onPress={() => goBackOrReplace('/(tabs)')}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const TIER_DISPLAY = getTierDisplay(colors);
  const tier = TIER_DISPLAY[contact.tier || 'free'] || TIER_DISPLAY.free;
  const initials = (contact.name || contact.cpid)
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const savedDate = new Date(contact.savedAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Contact Details</Text>
        <Pressable style={styles.headerShareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color={CultureTokens.indigo} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + bottomInset }}
      >
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { borderColor: tier.color + '40', backgroundColor: tier.color + '10' }]}>
            <Text style={[styles.avatarText, { color: tier.color }]}>{initials}</Text>
          </View>

          <Text style={styles.name}>{contact.name || 'CulturePass User'}</Text>
          {contact.username && (
            <Text style={styles.username}>+{contact.username}</Text>
          )}
          {contact.org && (
            <Text style={styles.orgName}>{contact.org}</Text>
          )}

          {/* CPID + tier chips */}
          <View style={styles.chipRow}>
            <View style={styles.cpidChip}>
              <Ionicons name="finger-print" size={14} color={CultureTokens.indigo} />
              <Text style={styles.cpidText}>{contact.cpid}</Text>
            </View>
            <View style={[styles.tierChip, { backgroundColor: tier.color + '15', borderColor: tier.color + '30' }]}>
              <Ionicons name={tier.icon as keyof typeof Ionicons.glyphMap} size={12} color={tier.color} />
              <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
            </View>
          </View>

          {/* Quick-action icons */}
          <View style={styles.quickActions}>
            {contact.phone && (
              <Pressable style={styles.quickActionBtn} onPress={handleCall}>
                <Ionicons name="call" size={22} color={CultureTokens.success} />
                <Text style={[styles.quickActionLabel, { color: CultureTokens.success }]}>Call</Text>
              </Pressable>
            )}
            {contact.email && (
              <Pressable style={styles.quickActionBtn} onPress={handleEmail}>
                <Ionicons name="mail" size={22} color={CultureTokens.indigo} />
                <Text style={[styles.quickActionLabel, { color: CultureTokens.indigo }]}>Email</Text>
              </Pressable>
            )}
            <Pressable style={styles.quickActionBtn} onPress={handleSaveToPhone}>
              <Ionicons name="person-add" size={22} color={CultureTokens.coral} />
              <Text style={[styles.quickActionLabel, { color: CultureTokens.coral }]}>Save</Text>
            </Pressable>
            <Pressable style={styles.quickActionBtn} onPress={handleShare}>
              <Ionicons name="share-social" size={22} color={CultureTokens.gold} />
              <Text style={[styles.quickActionLabel, { color: CultureTokens.gold }]}>Share</Text>
            </Pressable>
          </View>
        </View>

        {/* Bio */}
        {contact.bio && (
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{contact.bio}</Text>
          </View>
        )}

        {/* Contact info */}
        <View style={styles.infoCard}>
          {contact.phone && (
            <InfoRow
              icon="call"
              label="Phone"
              value={contact.phone}
              color={CultureTokens.success}
              onPress={handleCall}
            />
          )}
          {contact.phone && (contact.email || contact.city || contact.org) && (
            <View style={styles.divider} />
          )}
          {contact.email && (
            <InfoRow
              icon="mail"
              label="Email"
              value={contact.email}
              color={CultureTokens.indigo}
              onPress={handleEmail}
            />
          )}
          {contact.email && (contact.city || contact.org) && (
            <View style={styles.divider} />
          )}
          {contact.org && (
            <InfoRow
              icon="business"
              label="Organisation"
              value={contact.org}
              color={colors.textSecondary}
            />
          )}
          {contact.org && contact.city && <View style={styles.divider} />}
          {contact.city && (
            <InfoRow
              icon="location"
              label="Location"
              value={`${contact.city}${contact.country ? `, ${contact.country}` : ''}`}
              color={CultureTokens.indigo}
              onPress={handleOpenLocation}
            />
          )}
          {(contact.phone || contact.email || contact.org || contact.city) && (
            <View style={styles.divider} />
          )}
          <InfoRow
            icon="calendar-outline"
            label="Saved on"
            value={savedDate}
            color={colors.textSecondary}
          />
        </View>

        {/* CulturePass section */}
        <View style={styles.infoCard}>
          {contact.username && (
            <>
              <InfoRow
                icon="globe-outline"
                label="CulturePass Profile"
                value={`culturepass.app/u/${contact.username}`}
                color={CultureTokens.indigo}
                onPress={() =>
                  Linking.openURL(`https://culturepass.app/u/${contact.username}`)
                }
              />
              <View style={styles.divider} />
            </>
          )}
          <InfoRow
            icon="finger-print"
            label="CulturePass ID"
            value={contact.cpid}
            color={CultureTokens.indigo}
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          {contact.userId && (
            <Pressable style={styles.actionBtn} onPress={handleViewProfile}>
              <View style={[styles.actionIcon, { backgroundColor: CultureTokens.indigo + '15' }]}>
                <Ionicons name="person-outline" size={20} color={CultureTokens.indigo} />
              </View>
              <Text style={styles.actionBtnText}>View Full Profile</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </Pressable>
          )}

          <Pressable style={styles.actionBtn} onPress={handleSaveToPhone}>
            <View style={[styles.actionIcon, { backgroundColor: CultureTokens.coral + '15' }]}>
              <Ionicons name="person-add-outline" size={20} color={CultureTokens.coral} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionBtnText}>Save to Phone Contacts</Text>
              <Text style={styles.actionBtnSub}>Exports as vCard (.vcf)</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={handleShare}>
            <View style={[styles.actionIcon, { backgroundColor: CultureTokens.gold + '15' }]}>
              <Ionicons name="share-outline" size={20} color={CultureTokens.gold} />
            </View>
            <Text style={styles.actionBtnText}>Share Contact</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>

          <Pressable style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleRemove}>
            <View style={[styles.actionIcon, { backgroundColor: CultureTokens.error + '15' }]}>
              <Ionicons name="trash-outline" size={20} color={CultureTokens.error} />
            </View>
            <Text style={[styles.actionBtnText, { color: CultureTokens.error }]}>Remove Contact</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* ── Invite banner ── */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={{ marginHorizontal: 20, marginTop: 24 }}>
          <Pressable onPress={handleShare}>
            <LinearGradient
              colors={gradients.culturepassBrand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inviteBanner}
            >
              <View style={styles.inviteBannerInner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inviteBannerTitle}>
                    Invite {contact.name?.split(' ')[0] ?? 'this contact'}
                  </Text>
                  <Text style={styles.inviteBannerSub}>
                    Share their CulturePass profile or send them an invite link
                  </Text>
                </View>
                <View style={styles.inviteBannerIconWrap}>
                  <Ionicons name="share-social" size={22} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* ── Similar communities / events ── */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={{ marginHorizontal: 20, marginTop: 24 }}>
          <Text style={[styles.recSectionTitle, { color: colors.text }]}>You Might Also Like</Text>
          <Text style={[styles.recSectionSub, { color: colors.textSecondary }]}>
            {contact.city ? `Communities and events in ${contact.city}` : 'Communities your contacts enjoy'}
          </Text>
        </Animated.View>

        {[
          {
            delay: 160,
            icon: 'people-circle-outline',
            color: CultureTokens.indigo,
            title: contact.city ? `${contact.city} Cultural Network` : 'Cultural Network',
            sub: 'Community • Join with your contact',
            tag: 'Community',
            route: '/(tabs)/community',
          },
          {
            delay: 200,
            icon: 'calendar-outline',
            color: CultureTokens.teal,
            title: 'Upcoming Cultural Events',
            sub: contact.city ? `Events near ${contact.city}` : 'Events near you',
            tag: 'Events',
            route: '/(tabs)',
          },
          {
            delay: 240,
            icon: 'compass-outline',
            color: CultureTokens.coral,
            title: 'Discover More Together',
            sub: 'Explore the cultural directory',
            tag: 'Explore',
            route: '/(tabs)/explore',
          },
        ].map((item, idx) => (
          <Animated.View key={item.route + idx} entering={FadeInDown.delay(item.delay).springify()}>
            <Pressable
              style={[styles.recCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(item.route as any); }}
            >
              <View style={[styles.recIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.recTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.recSub, { color: colors.textSecondary }]} numberOfLines={1}>{item.sub}</Text>
              </View>
              <View style={[styles.recTag, { backgroundColor: item.color + '12' }]}>
                <Text style={[styles.recTagText, { color: item.color }]}>{item.tag}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CardTokens.paddingLarge,
    paddingVertical: Spacing.md - 4,
    zIndex: 10,
  },
  backBtn: {
    width: IconSize.xxl + 4,
    height: IconSize.xxl + 4,
    borderRadius: (IconSize.xxl + 4) / 2,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...TextStyles.title3, color: colors.text },
  headerShareBtn: {
    width: IconSize.xxl + 4,
    height: IconSize.xxl + 4,
    borderRadius: (IconSize.xxl + 4) / 2,
    backgroundColor: CultureTokens.indigo + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    marginHorizontal: CardTokens.paddingLarge,
    backgroundColor: colors.surface,
    borderRadius: CardTokens.radiusLarge + Spacing.xs,
    paddingHorizontal: Spacing.xl - 4,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: CardTokens.paddingLarge,
  },
  avatarText: { fontSize: FontSize.display, fontFamily: FontFamily.bold },
  name: { fontSize: FontSize.title, fontFamily: FontFamily.bold, color: colors.text, textAlign: 'center' },
  username: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: 4,
  },
  orgName: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: colors.textTertiary,
    marginTop: 4,
  },

  chipRow: { flexDirection: 'row', gap: Spacing.sm + 2, marginTop: CardTokens.paddingLarge - 2 },
  cpidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: CultureTokens.indigo + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: ChipTokens.radius,
  },
  cpidText: { fontSize: FontSize.chip, fontFamily: FontFamily.semibold, color: CultureTokens.indigo },
  tierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: ChipTokens.radius,
    borderWidth: 1,
  },
  tierText: { fontSize: FontSize.chip, fontFamily: FontFamily.semibold },

  quickActions: {
    flexDirection: 'row',
    gap: CardTokens.paddingLarge,
    marginTop: Spacing.lg + 4,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    width: '100%',
    justifyContent: 'center',
  },
  quickActionBtn: { alignItems: 'center', gap: Spacing.sm, minWidth: 60 },
  quickActionLabel: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.semibold,
  },

  bioCard: {
    marginHorizontal: CardTokens.paddingLarge,
    marginTop: CardTokens.paddingLarge,
    backgroundColor: colors.surface,
    borderRadius: CardTokens.radiusLarge,
    paddingHorizontal: CardTokens.paddingLarge,
    paddingVertical: CardTokens.padding - 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  bioText: {
    fontSize: FontSize.body2,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  infoCard: {
    marginHorizontal: CardTokens.paddingLarge,
    marginTop: CardTokens.paddingLarge,
    backgroundColor: colors.surface,
    borderRadius: CardTokens.radiusLarge,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  divider: { height: 1, backgroundColor: colors.backgroundSecondary, marginLeft: 78 },

  actionsSection: {
    marginHorizontal: CardTokens.paddingLarge,
    marginTop: Spacing.xl,
    gap: Spacing.md - 4,
    paddingBottom: Spacing.sm + 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md - 2,
    backgroundColor: colors.surface,
    borderRadius: CardTokens.radiusLarge - 2,
    padding: CardTokens.padding,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  actionBtnDanger: {
    borderWidth: 1,
    borderColor: CultureTokens.error + '30',
  },
  actionIcon: {
    width: IconSize.xxl + 4,
    height: IconSize.xxl + 4,
    borderRadius: CardTokens.radius - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { flex: 1, fontSize: FontSize.body, fontFamily: FontFamily.semibold, color: colors.text },
  actionBtnSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: colors.textTertiary,
    marginTop: 2,
  },

  notFoundText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginTop: 16,
  },
  backLink: { marginTop: Spacing.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md - 2, borderRadius: CardTokens.radius - 2, backgroundColor: CultureTokens.indigo },
  backLinkText: { fontSize: FontSize.callout, fontFamily: FontFamily.semibold, color: colors.background },

  // Invite banner
  inviteBanner: { borderRadius: CardTokens.radiusLarge, overflow: 'hidden' },
  inviteBannerInner: { flexDirection: 'row', alignItems: 'center', padding: CardTokens.paddingLarge, gap: CardTokens.padding },
  inviteBannerTitle: { fontSize: FontSize.title3 - 1, fontFamily: FontFamily.bold, color: '#fff' },
  inviteBannerSub: { fontSize: FontSize.caption, fontFamily: FontFamily.regular, color: 'rgba(255,255,255,0.8)', marginTop: Spacing.xs, lineHeight: 18 },
  inviteBannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Recommendations
  recSectionTitle: { fontSize: FontSize.body, fontFamily: FontFamily.bold, marginBottom: Spacing.xs },
  recSectionSub: { fontSize: FontSize.caption, fontFamily: FontFamily.regular, marginBottom: Spacing.md - 4 },
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md - 4,
    padding: Spacing.md - 2,
    borderRadius: CardTokens.radius,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  recIcon: { width: IconSize.xl * 2, height: IconSize.xl * 2, borderRadius: CardTokens.radius - 2, alignItems: 'center', justifyContent: 'center' },
  recTitle: { fontSize: FontSize.body2, fontFamily: FontFamily.semibold },
  recSub: { fontSize: FontSize.micro, fontFamily: FontFamily.regular, marginTop: Spacing.xs - 2 },
  recTag: { borderRadius: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  recTagText: { fontSize: FontSize.tab, fontFamily: FontFamily.semibold },
});
