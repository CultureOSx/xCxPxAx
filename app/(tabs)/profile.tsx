// app/(tabs)/profile.tsx
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PerkData } from '@/shared/schema/perk';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { NATIONALITIES } from '@/constants/cultures';
import type { User } from '@shared/schema';
import { GuestProfileView } from '@/components/profile/GuestProfileView';
import { ProfileQuickMenuTrigger } from '@/components/ProfileQuickMenu';
import { CultureTokens, shadows } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import Animated, {
  SlideInUp,
  FadeIn,
} from 'react-native-reanimated';
import { CultureWalletMap } from '../../components/profile/CultureWalletMap';

// ─── Constants ────────────────────────────────────────────────────────────────

const HERO_BG = '#0B0B14';
const BLUE    = CultureTokens.indigo;

// Approximate country centroids for the Culture Wallet Map.
// Keys match Nationality.id from constants/cultures.ts.
const NATIONALITY_COORDS: Record<string, { lat: number; lng: number }> = {
  indian:     { lat: 20.5937,  lng: 78.9629  },
  chinese:    { lat: 35.8617,  lng: 104.1954 },
  korean:     { lat: 35.9078,  lng: 127.7669 },
  japanese:   { lat: 36.2048,  lng: 138.2529 },
  vietnamese: { lat: 14.0583,  lng: 108.2772 },
  filipino:   { lat: 12.8797,  lng: 121.7740 },
  indonesian: { lat: -0.7893,  lng: 113.9213 },
  thai:       { lat: 15.8700,  lng: 100.9925 },
  malay:      { lat: 4.2105,   lng: 101.9758 },
  greek:      { lat: 39.0742,  lng: 21.8243  },
  italian:    { lat: 41.8719,  lng: 12.5674  },
  spanish:    { lat: 40.4637,  lng: -3.7492  },
  lebanese:   { lat: 33.8547,  lng: 35.8623  },
  egyptian:   { lat: 26.8206,  lng: 30.8025  },
  nigerian:   { lat: 9.0820,   lng: 8.6753   },
  ghanaian:   { lat: 7.9465,   lng: -1.0232  },
  somali:     { lat: 5.1521,   lng: 46.1996  },
  ethiopian:  { lat: 9.1450,   lng: 40.4897  },
  mexican:    { lat: 23.6345,  lng: -102.5528 },
  colombian:  { lat: 4.5709,   lng: -74.2973  },
  brazilian:  { lat: -14.2350, lng: -51.9253  },
  kiwi:       { lat: -40.9006, lng: 174.8860  },
  aboriginal: { lat: -25.2744, lng: 133.7751  },
  maori:      { lat: -40.9006, lng: 174.8860  },
};

// ─── Ancestry Tree Modal ─────────────────────────────────────────────────────

interface CultureMarker {
  id: string;
  name: string;
  emoji: string;
  lat: number;
  lng: number;
  color: string;
}

function AncestryTreeModal({
  visible,
  onClose,
  colors,
  cultures,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
  cultures: CultureMarker[];
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={treeStyles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}><BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} /></Pressable>
        <Animated.View entering={SlideInUp.springify().damping(22)} style={[treeStyles.sheet, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
          <View style={treeStyles.header}>
            <View>
              <Text style={[treeStyles.title, { color: colors.text }]}>Your Heritage</Text>
              <Text style={[treeStyles.subtitle, { color: colors.textSecondary }]}>Cultures from your profile</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={treeStyles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={treeStyles.treeScroll}>
            <View style={treeStyles.cultureGrid}>
              {cultures.map((c, idx) => (
                <Animated.View key={c.id} entering={FadeIn.delay(idx * 120).springify()} style={[treeStyles.cultureNode, { backgroundColor: colors.surface }]}>
                  <Text style={treeStyles.cultureEmoji}>{c.emoji}</Text>
                  <Text style={[treeStyles.nodeLabel, { color: colors.text }]}>{c.name}</Text>
                </Animated.View>
              ))}
            </View>
            <Card style={treeStyles.insightCard} padding={20}>
              <View style={treeStyles.insightRow}>
                <Ionicons name="git-branch-outline" size={24} color={BLUE} />
                <Text style={[treeStyles.insightText, { color: colors.text }]}>
                  {cultures.length === 1
                    ? `Rooted in ${cultures[0].name} heritage.`
                    : `Your CulturePass spans ${cultures.length} cultural traditions.`}
                </Text>
              </View>
            </Card>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const treeStyles = StyleSheet.create({
  overlay: { flex: 1 },
  sheet: { flex: 1, borderTopLeftRadius: 36, borderTopRightRadius: 36, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontFamily: 'Poppins_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Poppins_500Medium', opacity: 0.8 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' },
  treeScroll: { paddingBottom: 60 },
  cultureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, padding: 24, justifyContent: 'center' },
  cultureNode: { alignItems: 'center', padding: 20, borderRadius: 24, gap: 8, minWidth: 100 },
  cultureEmoji: { fontSize: 36 },
  nodeLabel: { fontSize: 13, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  insightCard: { margin: 24, borderRadius: 28 },
  insightRow: { flexDirection: 'row', gap: 16 },
  insightText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', lineHeight: 22, flex: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;
  const colors = useColors();
  const { userId, user: authUser } = useAuth();
  const { state: onboardingState } = useOnboarding();
  const [showAncestry, setShowAncestry] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/users/me', userId],
    queryFn: () => api.users.me(),
    enabled: !!userId,
  });

  const { data: perks = [] } = useQuery<PerkData[]>({
    queryKey: ['/api/perks'],
    queryFn: () => api.perks.list(),
    enabled: !!userId,
  });

  // Build culture wallet markers from the user's actual nationality/culture data.
  const matchedCultures = useMemo(() => {
    const natId = onboardingState?.nationalityId;
    const cultureIds: string[] = onboardingState?.cultureIds ?? [];
    const natIds = new Set<string>(natId ? [natId] : []);
    cultureIds.forEach(cid => {
      const nat = Object.values(NATIONALITIES).find(n => n.cultureIds.includes(cid));
      if (nat) natIds.add(nat.id);
    });
    return Array.from(natIds)
      .map((id, idx) => {
        const nat = NATIONALITIES[id];
        const coords = NATIONALITY_COORDS[id];
        if (!nat || !coords) return null;
        return { id: `${id}-${idx}`, name: nat.label, lat: coords.lat, lng: coords.lng, emoji: nat.emoji, color: CultureTokens.saffron };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [onboardingState?.nationalityId, onboardingState?.cultureIds]);

  const hasCultureData = matchedCultures.length > 0;

  if (!userId) return <GuestProfileView topInset={insets.top} />;
  if (userLoading) return null;

  const displayUser = (user || authUser) as Partial<User>;
  const displayName = displayUser?.displayName || displayUser?.username || 'CulturePass Member';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* HERO Section */}
        <View style={[s.hero, { paddingTop: insets.top + 12 }]}>
          <LinearGradient colors={[HERO_BG, BLUE + '40', '#1B0F2E']} style={StyleSheet.absoluteFillObject} />
          {!isDesktopWeb && <ProfileQuickMenuTrigger colors={colors} />}
          <View style={s.avatarWrap}><LinearGradient colors={[CultureTokens.gold, CultureTokens.saffron]} style={s.avatarRing}><View style={s.avatarInner}><Image source={{ uri: displayUser?.avatarUrl ?? '' }} style={s.avatarImg} /></View></LinearGradient></View>
          <Text style={s.heroName}>{displayName.toUpperCase()}</Text>
        </View>

        <View style={s.content}>
          {/* ANCESTRY Trigger — only show when user has culture data */}
          {hasCultureData && (
            <Card onPress={() => setShowAncestry(true)} style={s.ancestryTrigger} padding={24}>
              <View style={s.ancestryRow}><View style={[s.ancestryIcon, { backgroundColor: CultureTokens.gold + '15' }]}><Ionicons name="git-network-outline" size={32} color={CultureTokens.gold} /></View><Text style={[s.ancestryTitle, { color: colors.text }]}>Ancestry Tree</Text><Ionicons name="chevron-forward" size={24} color={colors.textTertiary} /></View>
            </Card>
          )}

          {/* CULTURAL WALLET MAP — only show when user has culture markers */}
          {hasCultureData && (
            <View style={s.walletSection}>
              <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Culture Wallet</Text>
              <View style={s.mapContainer}>
                <CultureWalletMap cultures={matchedCultures} />
              </View>
            </View>
          )}

          {/* PERKS Section — only show when user has real perks */}
          {perks.length > 0 && (
            <View style={s.perksSection}>
              <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Community Perks</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.perksScroll}>
                {perks.slice(0, 5).map(perk => (
                  <View key={perk.id} style={[s.passCard, { backgroundColor: colors.surface }]}>
                    <LinearGradient colors={[CultureTokens.saffron, CultureTokens.indigo + '80']} style={s.passIconWrap}><Ionicons name="gift-outline" size={20} color="#fff" /></LinearGradient>
                    <View style={s.passDetails}><Text style={[s.passTitle, { color: colors.text }]} numberOfLines={2}>{perk.title}</Text></View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
      <AncestryTreeModal visible={showAncestry} onClose={() => setShowAncestry(false)} colors={colors} cultures={matchedCultures} />
    </View>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', paddingBottom: 32 },
  avatarWrap: { marginVertical: 16 },
  avatarRing: { width: 102, height: 102, borderRadius: 51, padding: 4, alignItems: 'center', justifyContent: 'center' },
  avatarInner: { width: 92, height: 92, borderRadius: 46, overflow: 'hidden' },
  avatarImg: { width: 92, height: 92 },
  heroName: { fontSize: 24, fontFamily: 'Poppins_700Bold', color: '#fff' },
  content: { padding: 20, gap: 32 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  sectionSubtitle: { fontSize: 13, fontFamily: 'Poppins_500Medium', opacity: 0.7 },
  ancestryTrigger: { borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.02)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  ancestryRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ancestryIcon: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  ancestryTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', flex: 1 },
  archiveSection: {},
  archiveScroll: { gap: 16, paddingRight: 20 },
  tokenCard: { width: 160, height: 220, borderRadius: 24, overflow: 'hidden', ...shadows.medium },
  tokenImage: { width: '100%', height: '100%' },
  rarityBadge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  rarityText: { color: '#fff', fontSize: 8, fontFamily: 'Poppins_800ExtraBold' },
  tokenContent: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  tokenTitle: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_700Bold' },
  tokenDate: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'Poppins_500Medium' },
  walletSection: {},
  mapContainer: { height: 260, borderRadius: 28, overflow: 'hidden', ...shadows.large },
  map: { flex: 1 },
  marker: { padding: 6, borderRadius: 12 },
  markerEmoji: { fontSize: 20 },
  perksSection: {},
  perksScroll: { gap: 16, paddingRight: 20 },
  passCard: { width: 220, padding: 16, borderRadius: 24, flexDirection: 'row', gap: 14, ...shadows.medium },
  passIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  passDetails: { flex: 1, justifyContent: 'center' },
  passTitle: { fontSize: 13, fontFamily: 'Poppins_700Bold', marginBottom: 6 },
  progressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%' },
});
