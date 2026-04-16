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
import { CultureTokens, gradients, type ColorTheme } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { useContacts } from '@/contexts/ContactsContext';
import { useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

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
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  label: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
    marginTop: 2,
  },
  badge: {
    backgroundColor: CultureTokens.indigo + '15',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
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
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Contact Details</Text>

        <Pressable
          style={styles.headerShareBtn}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share contact"
        >
          <Ionicons name="share-outline" size={20} color={CultureTokens.indigo} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 + bottomInset }}
      >
        <View style={styles.identitySection}>
          <View style={[styles.avatar, { borderColor: tier.color + '35', backgroundColor: tier.color + '12' }]}>
            <Text style={[styles.avatarText, { color: tier.color }]}>{initials}</Text>
          </View>
          <Text style={styles.name}>{contact.name || 'CulturePass User'}</Text>
          {contact.org ? <Text style={styles.orgName}>{contact.org}</Text> : null}
          {contact.username ? <Text style={styles.username}>+{contact.username}</Text> : null}
        </View>

        <View style={styles.quickActions}>
          {contact.phone ? (
            <Pressable style={styles.quickActionBtn} onPress={handleCall} accessibilityRole="button" accessibilityLabel="Call contact">
              <View style={[styles.quickActionIconWrap, { backgroundColor: CultureTokens.success + '18' }]}>
                <Ionicons name="call" size={20} color={CultureTokens.success} />
              </View>
              <Text style={styles.quickActionLabel}>call</Text>
            </Pressable>
          ) : null}
          {contact.email ? (
            <Pressable style={styles.quickActionBtn} onPress={handleEmail} accessibilityRole="button" accessibilityLabel="Email contact">
              <View style={[styles.quickActionIconWrap, { backgroundColor: CultureTokens.indigo + '18' }]}>
                <Ionicons name="mail" size={20} color={CultureTokens.indigo} />
              </View>
              <Text style={styles.quickActionLabel}>email</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.quickActionBtn} onPress={handleShare} accessibilityRole="button" accessibilityLabel="Share contact">
            <View style={[styles.quickActionIconWrap, { backgroundColor: CultureTokens.gold + '20' }]}>
              <Ionicons name="share-social" size={20} color={CultureTokens.gold} />
            </View>
            <Text style={styles.quickActionLabel}>share</Text>
          </Pressable>
          <Pressable style={styles.quickActionBtn} onPress={handleSaveToPhone} accessibilityRole="button" accessibilityLabel="Save to phone contacts">
            <View style={[styles.quickActionIconWrap, { backgroundColor: CultureTokens.coral + '18' }]}>
              <Ionicons name="person-add" size={20} color={CultureTokens.coral} />
            </View>
            <Text style={styles.quickActionLabel}>save</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Contact info</Text>
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

        <Text style={styles.sectionLabel}>CulturePass</Text>
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

        {contact.bio ? (
          <>
            <Text style={styles.sectionLabel}>Notes</Text>
            <View style={styles.infoCard}>
              <View style={styles.noteRow}>
                <Text style={styles.bioText}>{contact.bio}</Text>
              </View>
            </View>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>Actions</Text>
        <View style={[styles.infoCard, styles.actionsCard]}>
          {contact.userId && (
            <>
              <Pressable style={styles.actionBtn} onPress={handleViewProfile}>
                <Text style={[styles.actionBtnText, { color: CultureTokens.indigo }]}>View Full Profile</Text>
              </Pressable>
              <View style={styles.dividerFull} />
            </>
          )}

          <Pressable style={styles.actionBtn} onPress={handleSaveToPhone}>
            <Text style={[styles.actionBtnText, { color: CultureTokens.coral }]}>Save to Phone Contacts</Text>
          </Pressable>
          <View style={styles.dividerFull} />

          <Pressable style={styles.actionBtn} onPress={handleShare}>
            <Text style={[styles.actionBtnText, { color: CultureTokens.gold }]}>Share Contact</Text>
          </Pressable>
          <View style={styles.dividerFull} />

          <Pressable style={styles.actionBtn} onPress={handleRemove}>
            <Text style={[styles.actionBtnText, { color: CultureTokens.error }]}>Remove Contact</Text>
          </Pressable>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text },
  headerShareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CultureTokens.indigo + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },

  identitySection: {
    marginTop: 8,
    alignItems: 'center',
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 14,
  },
  avatarText: { fontSize: 34, fontFamily: 'Poppins_700Bold' },
  name: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: colors.text, textAlign: 'center' },
  username: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  orgName: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textTertiary,
    marginTop: 3,
  },

  quickActions: {
    flexDirection: 'row',
    marginTop: 28,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  quickActionBtn: { alignItems: 'center', gap: 7, minWidth: 72 },
  quickActionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12.5,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },

  sectionLabel: {
    marginHorizontal: 20,
    marginTop: 26,
    marginBottom: 8,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 0,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  noteRow: { paddingHorizontal: 20, paddingVertical: 16 },
  bioText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  divider: { height: 1, backgroundColor: colors.backgroundSecondary, marginLeft: 78 },
  dividerFull: { height: 1, backgroundColor: colors.backgroundSecondary, marginLeft: 16 },

  actionsCard: { marginBottom: 8 },
  actionBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionBtnText: { fontSize: 17, fontFamily: 'Poppins_500Medium', color: colors.text },

  notFoundText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
    marginTop: 16,
  },
  backLink: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: CultureTokens.indigo,
  },
  backLinkText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.background },
});
