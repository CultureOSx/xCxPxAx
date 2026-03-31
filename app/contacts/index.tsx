import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  FlatList,
  Share,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients } from '@/constants/theme';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useContacts, SavedContact, PhoneContact } from '@/contexts/ContactsContext';
import { useCallback, useState, useMemo } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { goBackOrReplace } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Contacts from 'expo-contacts';

// Defensive check: is the native module actually linked?
const isContactsLinked = Platform.OS !== 'web' && !!Contacts && typeof Contacts.getContactsAsync === 'function';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  free: 'rgba(255,255,255,0.6)',
  plus: CultureTokens.indigo,
  premium: CultureTokens.gold,
  elite: '#8E44AD',
  vip: CultureTokens.gold,
  pro: CultureTokens.teal,
};

type ActiveTab = 'contacts' | 'sync' | 'discover';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ─── Contact item ─────────────────────────────────────────────────────────────

function ContactItem({
  contact,
  onPress,
  onRemove,
  index,
}: {
  contact: SavedContact;
  onPress: () => void;
  onRemove: () => void;
  index: number;
}) {
  const colors = useColors();
  const tierColor = TIER_COLORS[contact.tier || 'free'] || colors.textSecondary;
  const initials = getInitials(contact.name || contact.cpid);

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
      <View style={[styles.contactItem, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Pressable style={styles.contactMain} onPress={onPress} android_ripple={{ color: colors.borderLight }}>
          <View style={[styles.contactAvatar, { borderColor: tierColor + '50', backgroundColor: tierColor + '12' }]}>
            <Text style={[styles.contactInitials, { color: tierColor }]}>{initials}</Text>
            {contact.fromPhone && (
              <View style={styles.phoneBadge}>
                <Ionicons name="phone-portrait-outline" size={8} color={colors.background} />
              </View>
            )}
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
              {contact.name || 'CulturePass User'}
            </Text>
            <View style={styles.contactMeta}>
              <View style={styles.cpidMini}>
                <Ionicons name="finger-print" size={10} color={CultureTokens.indigo} />
                <Text style={[styles.cpidMiniText]}>{contact.cpid}</Text>
              </View>
              {contact.city && (
                <Text style={[styles.contactLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                  {contact.city}{contact.country ? `, ${contact.country}` : ''}
                </Text>
              )}
            </View>
            <Text style={[styles.contactSavedAt, { color: colors.textTertiary }]}>
              Saved {timeAgo(contact.savedAt)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </Pressable>
        <Pressable style={styles.removeBtn} onPress={onRemove} hitSlop={8}>
          <Ionicons name="trash-outline" size={15} color={CultureTokens.coral} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Phone contact row ────────────────────────────────────────────────────────

function PhoneContactRow({
  item,
  onImport,
  onInvite,
  index,
}: {
  item: PhoneContact;
  onImport: () => void;
  onInvite: () => void;
  index: number;
}) {
  const colors = useColors();
  const initials = getInitials(item.name || 'Unknown');
  const isMatched = !!item.matched;

  return (
    <Animated.View entering={FadeInDown.delay(index * 35).springify()}>
      <View style={[styles.phoneContactRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <View style={[styles.phoneAvatar, {
          backgroundColor: isMatched ? CultureTokens.indigo + '18' : colors.backgroundSecondary,
          borderColor: isMatched ? CultureTokens.indigo + '40' : colors.borderLight,
        }]}>
          <Text style={[styles.contactInitials, { color: isMatched ? CultureTokens.indigo : colors.textSecondary, fontSize: 13 }]}>
            {initials}
          </Text>
        </View>

        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          {item.phoneNumbers?.[0] && (
            <Text style={[styles.contactLocation, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.phoneNumbers[0]}
            </Text>
          )}
          {isMatched && (
            <View style={styles.cpidMini}>
              <View style={styles.onCPBadge}>
                <Ionicons name="checkmark-circle" size={10} color={CultureTokens.success} />
                <Text style={styles.onCPBadgeText}>On CulturePass</Text>
              </View>
            </View>
          )}
        </View>

        {isMatched ? (
          <Pressable
            style={[styles.syncActionBtn, { backgroundColor: CultureTokens.indigo }]}
            onPress={onImport}
          >
            <Ionicons name="person-add" size={14} color="#fff" />
            <Text style={styles.syncActionBtnText}>Add</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.syncActionBtn, {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: item.invited ? colors.borderLight : CultureTokens.teal + '60',
            }]}
            onPress={onInvite}
          >
            <Ionicons
              name={item.invited ? 'checkmark' : 'mail-outline'}
              size={14}
              color={item.invited ? colors.textTertiary : CultureTokens.teal}
            />
            <Text style={[styles.syncActionBtnText, { color: item.invited ? colors.textTertiary : CultureTokens.teal }]}>
              {item.invited ? 'Invited' : 'Invite'}
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Suggestion card ──────────────────────────────────────────────────────────

function SuggestionCard({
  title,
  subtitle,
  icon,
  accentColor,
  tag,
  onPress,
  index,
}: {
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  tag?: string;
  onPress: () => void;
  index: number;
}) {
  const colors = useColors();
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <Pressable
        style={[styles.suggestionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
        onPress={onPress}
        android_ripple={{ color: colors.borderLight }}
      >
        <View style={[styles.suggestionIcon, { backgroundColor: accentColor + '18' }]}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={22} color={accentColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.suggestionTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.suggestionSub, { color: colors.textSecondary }]} numberOfLines={1}>{subtitle}</Text>
        </View>
        {tag && (
          <View style={[styles.suggestionTag, { backgroundColor: accentColor + '15' }]}>
            <Text style={[styles.suggestionTagText, { color: accentColor }]}>{tag}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Add Contact Modal ────────────────────────────────────────────────────────

function AddContactModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; cpid: string; phone: string; email: string; city: string }) => void;
}) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [cpid, setCpid] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');

  const handleAdd = () => {
    if (!name.trim() && !cpid.trim()) {
      Alert.alert('Missing Info', 'Please enter at least a name or CulturePass ID.');
      return;
    }
    onAdd({ name: name.trim(), cpid: cpid.trim(), phone: phone.trim(), email: email.trim(), city: city.trim() });
    setName(''); setCpid(''); setPhone(''); setEmail(''); setCity('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add Contact</Text>
          <Pressable onPress={handleAdd} hitSlop={12}>
            <Text style={[styles.modalDone, { color: CultureTokens.indigo }]}>Add</Text>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalAvatarRow}>
            <View style={[styles.modalAvatar, { backgroundColor: CultureTokens.indigo + '15', borderColor: CultureTokens.indigo + '30' }]}>
              <Ionicons name="person-add-outline" size={32} color={CultureTokens.indigo} />
            </View>
            <Text style={[styles.modalAvatarLabel, { color: colors.textSecondary }]}>New Cultural Contact</Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <FormField icon="person-outline" placeholder="Full Name" value={name} onChangeText={setName} colors={colors} />
            <View style={[styles.formDivider, { backgroundColor: colors.borderLight }]} />
            <FormField icon="finger-print" placeholder="CulturePass ID (CPID)" value={cpid} onChangeText={setCpid} colors={colors} autoCapitalize="none" />
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <FormField icon="call-outline" placeholder="Phone Number" value={phone} onChangeText={setPhone} colors={colors} keyboardType="phone-pad" />
            <View style={[styles.formDivider, { backgroundColor: colors.borderLight }]} />
            <FormField icon="mail-outline" placeholder="Email Address" value={email} onChangeText={setEmail} colors={colors} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <FormField icon="location-outline" placeholder="City" value={city} onChangeText={setCity} colors={colors} />
          </View>

          <Pressable style={[styles.addContactBtn, { backgroundColor: CultureTokens.indigo }]} onPress={handleAdd}>
            <Ionicons name="person-add" size={18} color="#fff" />
            <Text style={styles.addContactBtnText}>Add to Contacts</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function FormField({
  icon,
  placeholder,
  value,
  onChangeText,
  colors,
  keyboardType,
  autoCapitalize,
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  colors: ReturnType<typeof useColors>;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.formField}>
      <View style={[styles.formFieldIcon, { backgroundColor: CultureTokens.indigo + '12' }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={CultureTokens.indigo} />
      </View>
      <TextInput
        style={[styles.formInput, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'words'}
        returnKeyType="next"
      />
    </View>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
  contactCount,
  matchCount,
  colors,
}: {
  active: ActiveTab;
  onChange: (t: ActiveTab) => void;
  contactCount: number;
  matchCount: number;
  colors: ReturnType<typeof useColors>;
}) {
  const tabs: { key: ActiveTab; label: string; icon: string; badge?: number }[] = [
    { key: 'contacts', label: 'Contacts', icon: 'people', badge: contactCount > 0 ? contactCount : undefined },
    { key: 'sync', label: 'Phone Sync', icon: 'sync', badge: matchCount > 0 ? matchCount : undefined },
    { key: 'discover', label: 'Discover', icon: 'sparkles' },
  ];

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      {tabs.map(tab => {
        const isActive = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tabItem, isActive && { backgroundColor: CultureTokens.indigo + '15' }]}
            onPress={() => { Haptics.selectionAsync(); onChange(tab.key); }}
          >
            <View style={styles.tabIconRow}>
              <Ionicons
                name={tab.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={isActive ? CultureTokens.indigo : colors.textTertiary}
              />
              {tab.badge !== undefined && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color: isActive ? CultureTokens.indigo : colors.textTertiary }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Sync permission UI ───────────────────────────────────────────────────────

function SyncPermissionBanner({ onRequest }: { onRequest: () => void }) {
  const colors = useColors();
  return (
    <Animated.View entering={FadeIn.springify()} style={{ flex: 1 }}>
      <View style={styles.permissionContainer}>
        <LinearGradient
          colors={[CultureTokens.indigo + '30', CultureTokens.teal + '20', 'transparent']}
          style={styles.permissionGradient}
        />
        <View style={[styles.permissionIcon, { backgroundColor: CultureTokens.indigo + '15' }]}>
          <Ionicons name="people-circle" size={56} color={CultureTokens.indigo} />
        </View>
        <Text style={[styles.permissionTitle, { color: colors.text }]}>
          Find Friends on CulturePass
        </Text>
        <Text style={[styles.permissionSub, { color: colors.textSecondary }]}>
          Sync your phone contacts to discover who&apos;s already on CulturePass and invite those who aren&apos;t.
        </Text>
        <View style={styles.permissionBullets}>
          {[
            { icon: 'shield-checkmark', text: 'Phone numbers are never stored on our servers' },
            { icon: 'person-add', text: 'Instantly connect with friends already here' },
            { icon: 'mail', text: 'Invite others with one tap' },
          ].map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name={b.icon as keyof typeof Ionicons.glyphMap} size={16} color={CultureTokens.teal} />
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{b.text}</Text>
            </View>
          ))}
        </View>
        <Pressable
          style={[styles.permissionBtn, { backgroundColor: CultureTokens.indigo }]}
          onPress={onRequest}
        >
          <Ionicons name="sync" size={18} color="#fff" />
          <Text style={styles.permissionBtnText}>Sync Phone Contacts</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Discover / Recommendations ───────────────────────────────────────────────

function DiscoverTab({ contacts, colors }: { contacts: SavedContact[]; colors: ReturnType<typeof useColors> }) {
  // Derive cities and interests from saved contacts for local recommendations
  const sharedCities = useMemo(() => {
    const cityMap: Record<string, number> = {};
    contacts.forEach(c => { if (c.city) cityMap[c.city] = (cityMap[c.city] ?? 0) + 1; });
    return Object.entries(cityMap).sort((a, b) => b[1] - a[1]).map(([city]) => city);
  }, [contacts]);

  const topCity = sharedCities[0] ?? 'Sydney';

  const suggestions = [
    {
      id: 'comm-1',
      title: `${topCity} Cultural Network`,
      subtitle: `Communities in ${topCity} • 2.4k members`,
      icon: 'people-circle-outline',
      color: CultureTokens.indigo,
      tag: 'Community',
      route: '/(tabs)/community',
    },
    {
      id: 'comm-2',
      title: 'Diaspora Arts Collective',
      subtitle: 'Shared by 3 of your contacts',
      icon: 'color-palette-outline',
      color: CultureTokens.coral,
      tag: 'Community',
      route: '/(tabs)/community',
    },
    {
      id: 'event-1',
      title: `Cultural Festival ${topCity}`,
      subtitle: `Events near ${topCity} • This weekend`,
      icon: 'calendar-outline',
      color: CultureTokens.teal,
      tag: 'Event',
      route: '/(tabs)',
    },
    {
      id: 'event-2',
      title: 'Heritage Food Market',
      subtitle: 'Popular with your network',
      icon: 'restaurant-outline',
      color: CultureTokens.gold,
      tag: 'Event',
      route: '/(tabs)',
    },
    {
      id: 'discover-1',
      title: 'Discover New Communities',
      subtitle: 'Find groups that match your interests',
      icon: 'compass-outline',
      color: CultureTokens.indigo,
      route: '/(tabs)/explore',
    },
    {
      id: 'discover-2',
      title: 'Browse Upcoming Events',
      subtitle: 'Cultural events near you',
      icon: 'ticket-outline',
      color: CultureTokens.coral,
      route: '/(tabs)',
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 60, paddingTop: 8 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Invite banner */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Share.share({
              title: 'Join me on CulturePass!',
              message: "Hey! I'm using CulturePass to discover cultural events and communities. Join me here: https://culturepass.app",
              url: 'https://culturepass.app',
            });
          }}
        >
          <LinearGradient
            colors={gradients.culturepassBrand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.inviteBanner}
          >
            <View style={styles.inviteBannerContent}>
              <View style={styles.inviteBannerLeft}>
                <Text style={styles.inviteBannerTitle}>Invite Friends</Text>
                <Text style={styles.inviteBannerSub}>Share CulturePass and explore together</Text>
              </View>
              <View style={styles.inviteBannerIcon}>
                <Ionicons name="share-social" size={24} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Section: Recommended for you */}
      <View style={styles.discoverSection}>
        <Text style={[styles.discoverSectionTitle, { color: colors.text }]}>Recommended for You</Text>
        <Text style={[styles.discoverSectionSub, { color: colors.textSecondary }]}>
          Based on your contacts&apos; activity
        </Text>
      </View>

      {suggestions.map((s, i) => (
        <SuggestionCard
          key={s.id}
          title={s.title}
          subtitle={s.subtitle}
          icon={s.icon}
          accentColor={s.color}
          tag={s.tag}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(s.route as any);
          }}
          index={i}
        />
      ))}

      {/* Interest tags */}
      <Animated.View entering={FadeInDown.delay(300).springify()}>
        <View style={styles.interestSection}>
          <Text style={[styles.discoverSectionTitle, { color: colors.text }]}>Explore by Interest</Text>
          <View style={styles.interestGrid}>
            {[
              { label: 'Music', icon: 'musical-notes', color: CultureTokens.coral },
              { label: 'Food', icon: 'restaurant', color: CultureTokens.gold },
              { label: 'Arts', icon: 'color-palette', color: '#AF52DE' },
              { label: 'Dance', icon: 'body', color: CultureTokens.teal },
              { label: 'Film', icon: 'film', color: CultureTokens.indigo },
              { label: 'Sport', icon: 'football', color: CultureTokens.success },
            ].map((interest, idx) => (
              <Pressable
                key={interest.label}
                style={[styles.interestChip, { backgroundColor: interest.color + '12', borderColor: interest.color + '30' }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/(tabs)', params: { category: interest.label } } as any);
                }}
              >
                <Ionicons name={interest.icon as keyof typeof Ionicons.glyphMap} size={16} color={interest.color} />
                <Text style={[styles.interestLabel, { color: interest.color }]}>{interest.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ContactsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { contacts, removeContact, clearContacts, addContact, phoneContacts, setPhoneContacts, markInvited, importedFromPhone } = useContacts();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('contacts');
  const [syncing, setSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(phoneContacts.length > 0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const matchedPhoneContacts = useMemo(
    () => phoneContacts.filter(c => c.matched && !importedFromPhone.has(c.matched.cpid)),
    [phoneContacts, importedFromPhone]
  );

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      c.cpid.toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const handleRemove = useCallback((contact: SavedContact) => {
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
          },
        },
      ]
    );
  }, [removeContact]);

  const handleClearAll = useCallback(() => {
    if (contacts.length === 0) return;
    Alert.alert('Clear All', `Remove all ${contacts.length} contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); clearContacts(); } },
    ]);
  }, [contacts.length, clearContacts]);

  const handleContactPress = useCallback((contact: SavedContact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/contacts/[cpid]' as any, params: { cpid: contact.cpid } });
  }, []);

  const handleSyncPhoneContacts = useCallback(async () => {
    if (!isContactsLinked) {
      Alert.alert(
        'Contacts Module Missing',
        'Native contacts access is not linked in this build. Please rebuild the dev client with npx expo run:ios.',
      );
      return;
    }
    setSyncing(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'CulturePass needs access to your contacts to find friends. You can enable this in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        setSyncing(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });

      // Build phone contact list — simulate server match (in production: POST /api/contacts/match)
      const phoneList: PhoneContact[] = data
        .filter(c => c.name)
        .slice(0, 100) // cap for demo
        .map(c => ({
          id: c.id ?? `pc-${Math.random()}`,
          name: c.name ?? 'Unknown',
          phoneNumbers: c.phoneNumbers?.map(p => p.number ?? '').filter(Boolean),
          emails: c.emails?.map(e => e.email ?? '').filter(Boolean),
          // In production: matched set by server lookup
          matched: null,
          invited: false,
        }));

      setPhoneContacts(phoneList);
      setHasSynced(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Sync Failed', 'Could not read contacts. Please try again.');
    } finally {
      setSyncing(false);
    }
  }, [setPhoneContacts]);

  const handleImportPhoneContact = useCallback((phoneContact: PhoneContact) => {
    if (!phoneContact.matched) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addContact({
      cpid: phoneContact.matched.cpid,
      name: phoneContact.name,
      userId: phoneContact.matched.userId,
      username: phoneContact.matched.username,
      avatarUrl: phoneContact.matched.avatarUrl,
      tier: phoneContact.matched.tier,
      city: phoneContact.matched.city,
      phone: phoneContact.phoneNumbers?.[0],
      fromPhone: true,
    });
  }, [addContact]);

  const handleInvitePhoneContact = useCallback(async (item: PhoneContact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: `Join ${user?.displayName || 'me'} on CulturePass!`,
        message: `Hey ${item.name}! I'm using CulturePass to discover cultural events and communities. Join me here: https://culturepass.app`,
        url: 'https://culturepass.app',
      });
      markInvited(item.id);
    } catch {}
  }, [user, markInvited]);

  const handleAddContact = useCallback((data: { name: string; cpid: string; phone: string; email: string; city: string }) => {
    if (!data.cpid && !data.name) return;
    const cpid = data.cpid || `CP-MANUAL-${Date.now()}`;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addContact({
      cpid,
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      city: data.city || undefined,
    });
  }, [addContact]);

  const renderContactItem = useCallback(({ item, index }: { item: SavedContact; index: number }) => (
    <ContactItem
      contact={item}
      onPress={() => handleContactPress(item)}
      onRemove={() => handleRemove(item)}
      index={index}
    />
  ), [handleContactPress, handleRemove]);

  const renderPhoneItem = useCallback(({ item, index }: { item: PhoneContact; index: number }) => (
    <PhoneContactRow
      item={item}
      onImport={() => handleImportPhoneContact(item)}
      onInvite={() => handleInvitePhoneContact(item)}
      index={index}
    />
  ), [handleImportPhoneContact, handleInvitePhoneContact]);

  return (
    <AuthGuard icon="people-outline" title="Cultural Contacts" message="Sign in to connect with your cultural community.">
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={[styles.headerCircleBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Contacts</Text>
            {contacts.length > 0 && (
              <Text style={[styles.headerCount, { color: colors.textSecondary }]}>{contacts.length} saved</Text>
            )}
          </View>

          <View style={styles.headerRight}>
            <Pressable
              style={[styles.headerCircleBtn, { backgroundColor: CultureTokens.indigo + '15', borderColor: CultureTokens.indigo + '30' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddModal(true); }}
              hitSlop={8}
            >
              <Ionicons name="person-add-outline" size={18} color={CultureTokens.indigo} />
            </Pressable>
            <Pressable
              style={[styles.headerCircleBtn, { backgroundColor: CultureTokens.indigo + '15', borderColor: CultureTokens.indigo + '30' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/scanner'); }}
              hitSlop={8}
            >
              <Ionicons name="scan-outline" size={18} color={CultureTokens.indigo} />
            </Pressable>
          </View>
        </View>

        {/* Tab bar */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            contactCount={contacts.length}
            matchCount={matchedPhoneContacts.length}
            colors={colors}
          />
        </View>

        {/* ── Contacts Tab ── */}
        {activeTab === 'contacts' && (
          <View style={{ flex: 1 }}>
            {contacts.length > 0 && (
              <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <Ionicons name="search" size={16} color={colors.textTertiary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search contacts..."
                  placeholderTextColor={colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                  </Pressable>
                )}
              </View>
            )}

            {filteredContacts.length === 0 ? (
              <Animated.View entering={FadeIn.springify()} style={styles.emptyState}>
                <LinearGradient
                  colors={[CultureTokens.indigo + '20', 'transparent']}
                  style={styles.emptyGradient}
                />
                <View style={[styles.emptyIconWrap, { backgroundColor: CultureTokens.indigo + '12' }]}>
                  <Ionicons name="people-outline" size={44} color={CultureTokens.indigo} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {searchQuery ? 'No results' : 'No Contacts Yet'}
                </Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? `No contacts match "${searchQuery}"`
                    : 'Scan CulturePass QR codes or sync your phone to connect with your cultural community.'}
                </Text>
                {!searchQuery && (
                  <View style={styles.emptyActions}>
                    <Pressable
                      style={[styles.emptyBtn, { backgroundColor: CultureTokens.indigo }]}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/scanner'); }}
                    >
                      <Ionicons name="scan-outline" size={17} color="#fff" />
                      <Text style={styles.emptyBtnText}>Scan QR Code</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.emptyBtnOutline, { borderColor: CultureTokens.teal + '60' }]}
                      onPress={() => { Haptics.selectionAsync(); setActiveTab('sync'); }}
                    >
                      <Ionicons name="sync-outline" size={17} color={CultureTokens.teal} />
                      <Text style={[styles.emptyBtnText, { color: CultureTokens.teal }]}>Sync Phone</Text>
                    </Pressable>
                  </View>
                )}
              </Animated.View>
            ) : (
              <>
                <FlatList
                  data={filteredContacts}
                  keyExtractor={item => item.cpid}
                  renderItem={renderContactItem}
                  contentContainerStyle={{ paddingBottom: 24 + bottomInset, paddingHorizontal: 16 }}
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                />
                {contacts.length > 1 && !searchQuery && (
                  <Pressable
                    style={[styles.clearAllBtn, { backgroundColor: colors.surface, borderColor: CultureTokens.coral + '30' }]}
                    onPress={handleClearAll}
                  >
                    <Ionicons name="trash-outline" size={14} color={CultureTokens.coral} />
                    <Text style={[styles.clearAllText, { color: CultureTokens.coral }]}>Clear All</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        )}

        {/* ── Phone Sync Tab ── */}
        {activeTab === 'sync' && (
          <View style={{ flex: 1 }}>
            {!hasSynced ? (
              <SyncPermissionBanner onRequest={handleSyncPhoneContacts} />
            ) : syncing ? (
              <View style={styles.syncingState}>
                <ActivityIndicator size="large" color={CultureTokens.indigo} />
                <Text style={[styles.syncingText, { color: colors.textSecondary }]}>Syncing contacts...</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {/* Sync header */}
                <View style={[styles.syncStats, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                  <View style={styles.syncStatItem}>
                    <Text style={[styles.syncStatNum, { color: colors.text }]}>{phoneContacts.length}</Text>
                    <Text style={[styles.syncStatLabel, { color: colors.textSecondary }]}>Phone</Text>
                  </View>
                  <View style={[styles.syncStatDivider, { backgroundColor: colors.borderLight }]} />
                  <View style={styles.syncStatItem}>
                    <Text style={[styles.syncStatNum, { color: CultureTokens.indigo }]}>{matchedPhoneContacts.length}</Text>
                    <Text style={[styles.syncStatLabel, { color: colors.textSecondary }]}>On CulturePass</Text>
                  </View>
                  <View style={[styles.syncStatDivider, { backgroundColor: colors.borderLight }]} />
                  <View style={styles.syncStatItem}>
                    <Text style={[styles.syncStatNum, { color: CultureTokens.coral }]}>
                      {phoneContacts.filter(c => !c.matched).length}
                    </Text>
                    <Text style={[styles.syncStatLabel, { color: colors.textSecondary }]}>To Invite</Text>
                  </View>
                  <Pressable
                    style={[styles.resyncBtn, { backgroundColor: CultureTokens.indigo + '15' }]}
                    onPress={handleSyncPhoneContacts}
                  >
                    <Ionicons name="refresh" size={16} color={CultureTokens.indigo} />
                  </Pressable>
                </View>

                <FlatList
                  data={phoneContacts}
                  keyExtractor={item => item.id}
                  renderItem={renderPhoneItem}
                  contentContainerStyle={{ paddingBottom: 24 + bottomInset, paddingHorizontal: 16, paddingTop: 4 }}
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                  ListHeaderComponent={
                    matchedPhoneContacts.length > 0 ? (
                      <Animated.View entering={FadeInDown.springify()}>
                        <Pressable
                          style={[styles.importAllBtn, { backgroundColor: CultureTokens.indigo }]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            matchedPhoneContacts.forEach(c => handleImportPhoneContact(c));
                          }}
                        >
                          <Ionicons name="people" size={16} color="#fff" />
                          <Text style={styles.importAllBtnText}>
                            Import All {matchedPhoneContacts.length} Matched Contacts
                          </Text>
                        </Pressable>
                      </Animated.View>
                    ) : null
                  }
                />
              </View>
            )}
          </View>
        )}

        {/* ── Discover Tab ── */}
        {activeTab === 'discover' && (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <DiscoverTab contacts={contacts} colors={colors} />
          </View>
        )}

        {/* Add Contact Modal */}
        <AddContactModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddContact}
        />
      </View>
    </AuthGuard>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  headerCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  headerCount: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  headerRight: { flexDirection: 'row', gap: 8 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  tabIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tabBadge: {
    backgroundColor: CultureTokens.coral,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  tabBadgeText: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: '#fff' },
  tabLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular' },

  // Contact item
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingRight: 12,
    overflow: 'hidden',
  },
  contactMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  contactInitials: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  phoneBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: CultureTokens.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  contactMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  cpidMini: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cpidMiniText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: CultureTokens.indigo },
  contactLocation: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  contactSavedAt: { fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 3 },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: CultureTokens.coral + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Phone contact row
  phoneContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  phoneAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onCPBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: CultureTokens.success + '15',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  onCPBadgeText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.success },
  syncActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  syncActionBtnText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  // Sync stats
  syncStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  syncStatItem: { flex: 1, alignItems: 'center' },
  syncStatNum: { fontSize: 22, fontFamily: 'Poppins_700Bold' },
  syncStatLabel: { fontSize: 10, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  syncStatDivider: { width: 1, height: 32 },
  resyncBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  importAllBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  // Syncing state
  syncingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  syncingText: { fontSize: 15, fontFamily: 'Poppins_400Regular' },

  // Permission banner
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    gap: 16,
    overflow: 'hidden',
  },
  permissionGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
  },
  permissionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  permissionTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  permissionSub: { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22 },
  permissionBullets: { gap: 10, width: '100%', marginTop: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulletText: { fontSize: 13, fontFamily: 'Poppins_400Regular', flex: 1, lineHeight: 20 },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: 16,
  },
  permissionBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
    overflow: 'hidden',
  },
  emptyGradient: { ...StyleSheet.absoluteFillObject },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  emptySub: { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22 },
  emptyActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  emptyBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  // Clear all
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  clearAllText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  // Discover / suggestions
  inviteBanner: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  inviteBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  inviteBannerLeft: { flex: 1 },
  inviteBannerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#fff' },
  inviteBannerSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  inviteBannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverSection: { marginBottom: 12 },
  discoverSectionTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  discoverSectionSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  suggestionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  suggestionSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  suggestionTag: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  suggestionTagText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  interestSection: { marginTop: 16, marginBottom: 16 },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  interestLabel: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  // Add Contact Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancel: { fontSize: 16, fontFamily: 'Poppins_400Regular' },
  modalTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  modalDone: { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  modalContent: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 60, gap: 16 },
  modalAvatarRow: { alignItems: 'center', gap: 10, marginBottom: 8 },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarLabel: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  formField: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  formFieldIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  formInput: { flex: 1, fontSize: 15, fontFamily: 'Poppins_400Regular' },
  formDivider: { height: 1, marginLeft: 64 },
  addContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  addContactBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
});
