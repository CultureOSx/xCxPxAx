// app/(tabs)/profile.tsx
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Share,
  useWindowDimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Button } from '@/components/ui/Button';
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { useColors } from '@/hooks/useColors';
import type { User, MembershipSummary } from '@shared/schema';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GuestProfileView } from '@/components/profile/GuestProfileView';
import { ProfileQuickMenuTrigger } from '@/components/ProfileQuickMenu';
import { CultureTokens, shadows } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { TextStyles } from '@/constants/typography';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, { 
  FadeInRight, 
  FadeInDown, 
  SlideInUp, 
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Line, Circle } from 'react-native-svg';

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 92;
const HERO_BG     = '#0B0B14';
const BLUE        = CultureTokens.indigo;

const LOYALTY_PASSES = [
  { id: '1', title: 'Classical India', level: 'Silver', progress: 0.6, color: '#FF9933', icon: 'musical-note' },
  { id: '2', title: 'K-Pop Explorer', level: 'Gold', progress: 0.9, color: '#CD2E3A', icon: 'sparkles' },
  { id: '3', title: 'Oud Artisan', level: 'Bronze', progress: 0.3, color: '#006341', icon: 'color-palette' },
];

const ANCESTRY_TREE_DATA = [
  { id: 'root', label: 'Common Origin', x: 200, y: 50, color: '#fff' },
  { id: 'asia', parentId: 'root', label: 'Asia', x: 100, y: 150, color: '#FF9933' },
  { id: 'europe', parentId: 'root', label: 'Europe', x: 300, y: 150, color: '#005BAE' },
  { id: 'india', parentId: 'asia', label: 'India', x: 50, y: 250, color: '#FF9933', emoji: '🇮🇳' },
  { id: 'korea', parentId: 'asia', label: 'S. Korea', x: 150, y: 250, color: '#CD2E3A', emoji: '🇰🇷' },
  { id: 'greece', parentId: 'europe', label: 'Greece', x: 300, y: 250, color: '#005BAE', emoji: '🇬🇷' },
];

const MATCHED_CULTURES = [
  { id: '1', name: 'India', lat: 20.5937, lng: 78.9629, emoji: '🇮🇳', color: '#FF9933' },
  { id: '2', name: 'South Korea', lat: 35.9078, lng: 127.7669, emoji: '🇰🇷', color: '#CD2E3A' },
  { id: '3', name: 'Greece', lat: 39.0742, lng: 21.8243, emoji: '🇬🇷', color: '#005BAE' },
];

const MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
];

// ─── Ancestry Tree Modal ─────────────────────────────────────────────────────

function AncestryTreeModal({ visible, onClose, colors }: { visible: boolean, onClose: () => void, colors: any }) {
  const insets = useSafeAreaInsets();
  
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={treeStyles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>

        <Animated.View 
          entering={SlideInUp.springify().damping(22)}
          style={[treeStyles.sheet, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}
        >
          <View style={treeStyles.header}>
            <View>
              <Text style={[treeStyles.title, { color: colors.text }]}>Cultural Ancestry Tree</Text>
              <Text style={[treeStyles.subtitle, { color: colors.textSecondary }]}>Tracing your heritage through the ages</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={treeStyles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={treeStyles.treeScroll}>
            <View style={treeStyles.canvas}>
              <Svg height="400" width="400">
                {ANCESTRY_TREE_DATA.map(node => {
                  if (node.parentId) {
                    const parent = ANCESTRY_TREE_DATA.find(n => n.id === node.parentId);
                    if (parent) {
                      return (
                        <Line
                          key={`line-${node.id}`}
                          x1={parent.x} y1={parent.y}
                          x2={node.x} y2={node.y}
                          stroke={node.color}
                          strokeWidth="2"
                          strokeDasharray="4, 4"
                          opacity={0.6}
                        />
                      );
                    }
                  }
                  return null;
                })}
              </Svg>

              {ANCESTRY_TREE_DATA.map((node, idx) => (
                <Animated.View 
                  key={node.id} 
                  entering={FadeIn.delay(idx * 150).springify()}
                  style={[treeStyles.nodeWrap, { left: node.x - 40, top: node.y - 40 }]}
                >
                  <View style={[treeStyles.nodeCircle, { borderColor: node.color, backgroundColor: colors.surface }]}>
                    {node.emoji ? <Text style={treeStyles.nodeEmoji}>{node.emoji}</Text> : <Ionicons name="planet-outline" size={20} color={node.color} />}
                  </View>
                  <Text style={[treeStyles.nodeLabel, { color: colors.text }]}>{node.label}</Text>
                </Animated.View>
              ))}
            </View>

            <Card style={treeStyles.insightCard} padding={20}>
              <View style={treeStyles.insightRow}>
                <Ionicons name="git-branch-outline" size={24} color={BLUE} />
                <View style={{ flex: 1 }}>
                  <Text style={[treeStyles.insightText, { color: colors.text }]}>
                    Your lineage shows a strong confluence between the **South Asian Diaspora** and **East Asian Traditions**.
                  </Text>
                  <Text style={[treeStyles.insightSub, { color: colors.textSecondary, marginTop: 8 }]}>
                    This unique combination of heritage gives you premium access to cross-cultural collaborations in the platform.
                  </Text>
                </View>
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
  canvas: { width: 400, height: 400, alignSelf: 'center', marginTop: 20 },
  nodeWrap: { position: 'absolute', width: 80, alignItems: 'center', gap: 8 },
  nodeCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center', ...shadows.medium },
  nodeEmoji: { fontSize: 24 },
  nodeLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  insightCard: { margin: 24, marginTop: 40, borderRadius: 28 },
  insightRow: { flexDirection: 'row', gap: 16 },
  insightText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', lineHeight: 22 },
  insightSub: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
});

// ─── Sub-Components ───────────────────────────────────────────────────────────

function LoyaltyPassCard({ pass, colors }: { pass: typeof LOYALTY_PASSES[0], colors: any }) {
  return (
    <Animated.View entering={FadeInRight.delay(200).springify()} style={[s.passCard, { backgroundColor: colors.surface }]}>
      <LinearGradient colors={[pass.color, pass.color + '40']} style={s.passIconWrap}>
        <Ionicons name={pass.icon as any} size={20} color="#fff" />
      </LinearGradient>
      <View style={s.passDetails}>
        <View style={s.passHeader}>
          <Text style={[s.passTitle, { color: colors.text }]}>{pass.title}</Text>
          <Text style={[s.passLevel, { color: pass.color }]}>{pass.level}</Text>
        </View>
        <View style={[s.progressBar, { backgroundColor: colors.borderLight }]}>
          <View style={[s.progressFill, { width: `${pass.progress * 100}%`, backgroundColor: pass.color }]} />
        </View>
        <Text style={[s.passProgress, { color: colors.textSecondary }]}>{Math.round(pass.progress * 100)}% to reward</Text>
      </View>
    </Animated.View>
  );
}

function QuickTile({ icon, label, color, onPress, colors }: { icon: string; label: string; color: string; onPress: () => void; colors: any }) {
  return (
    <Card onPress={onPress} style={{ flex: 1 }} padding={16}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <View style={[tStyle.tileIcon, { backgroundColor: color + '12' }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <Text style={[TextStyles.labelSemibold, { color: colors.text, fontSize: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }]}>{label}</Text>
      </View>
    </Card>
  );
}

const tStyle = StyleSheet.create({
  tileIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;
  const colors = useColors();
  const { userId, logout, user: authUser } = useAuth();
  
  const [showAncestry, setShowAncestry] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/users/me', 'profile-tab', userId],
    queryFn: () => api.users.me() as any,
    enabled: !!userId,
  });

  const { data: membership } = useQuery<MembershipSummary | null>({
    queryKey: [`/api/membership/${userId}`],
    queryFn: () => api.membership.get(userId!).catch(() => null) as any,
    enabled: !!userId,
  });

  if (!userId) return <GuestProfileView topInset={insets.top} />;
  if (userLoading) return null;

  const displayUser = (user || authUser) as Partial<User>;
  const displayName = displayUser?.displayName || displayUser?.username || 'CulturePass Member';
  const tier = membership?.tier || 'free';

  const heroSection = (
    <View style={[s.hero, { paddingTop: insets.top + 12 }]}>
      <LinearGradient colors={[HERO_BG, BLUE + '40', '#1B0F2E']} style={StyleSheet.absoluteFillObject} />
      <View style={s.topRow}>
        {!isDesktopWeb && <ProfileQuickMenuTrigger colors={colors} />}
        <View style={s.topRight}>
          <TouchableOpacity style={s.topBtn}><Ionicons name="share-outline" size={18} color="#fff" /></TouchableOpacity>
          <TouchableOpacity style={s.topBtn} onPress={() => router.push('/notifications' as any)}><Ionicons name="notifications-outline" size={18} color="#fff" /></TouchableOpacity>
        </View>
      </View>
      <View style={s.avatarWrap}>
        <LinearGradient colors={[CultureTokens.gold, CultureTokens.saffron]} style={s.avatarRing}>
          <View style={s.avatarInner}>
            <Image source={{ uri: displayUser?.avatarUrl || `https://ui-avatars.com/api/?name=${displayName}&background=0D1117&color=fff` }} style={s.avatarImg} />
          </View>
        </LinearGradient>
      </View>
      <Text style={s.heroName}>{displayName.toUpperCase()}</Text>
      <View style={[s.tierPill, { borderColor: BLUE + '40', backgroundColor: BLUE + '15' }]}>
        <Ionicons name="shield-checkmark" size={12} color={BLUE} />
        <Text style={[s.tierPillText, { color: BLUE }]}>{tier.toUpperCase()} Member</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {heroSection}
        
        <View style={s.content}>
          
          {/* ANCESTRY TREE TRIGGER CARD */}
          <Card 
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowAncestry(true);
            }} 
            style={s.ancestryTrigger} 
            padding={24}
          >
            <View style={s.ancestryRow}>
              <View style={[s.ancestryIcon, { backgroundColor: CultureTokens.gold + '15' }]}>
                <Ionicons name="git-network-outline" size={32} color={CultureTokens.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.ancestryTitle, { color: colors.text }]}>Cultural Ancestry Tree</Text>
                <Text style={[s.ancestrySub, { color: colors.textSecondary }]}>Visualize the evolution of your roots and traditions.</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textTertiary} />
            </View>
          </Card>
          
          {/* COMMUNITY PERKS (LOYALTY PASSES) */}
          <View style={s.perksSection}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Community Perks</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.perksScroll}>
              {LOYALTY_PASSES.map(pass => (
                <LoyaltyPassCard key={pass.id} pass={pass} colors={colors} />
              ))}
            </ScrollView>
          </View>

          {/* CULTURAL IDENTITY WALLET MAP */}
          <View style={s.walletSection}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Culture Wallet</Text>
            </View>
            <View style={s.mapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={s.map}
                customMapStyle={MAP_STYLE}
                initialRegion={{ latitude: 20, longitude: 100, latitudeDelta: 120, longitudeDelta: 120 }}
                scrollEnabled={false}
              >
                {MATCHED_CULTURES.map(c => (
                  <Marker key={c.id} coordinate={{ latitude: c.lat, longitude: c.lng }}>
                    <View style={[s.marker, { backgroundColor: c.color }]}>
                      <Text style={s.markerEmoji}>{c.emoji}</Text>
                    </View>
                  </Marker>
                ))}
              </MapView>
              <BlurView intensity={20} tint="dark" style={s.mapOverlay}>
                <TouchableOpacity style={s.exploreMapBtn}>
                  <Text style={s.exploreMapText}>Explore Cultural Roots</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </TouchableOpacity>
              </BlurView>
            </View>
          </View>

          {/* Quick Tiles */}
          <View style={s.tilesGrid}>
            <View style={s.tilesRow}>
              <QuickTile icon="person-outline" label="Edit Profile" color={BLUE} onPress={() => {}} colors={colors} />
              <QuickTile icon="people-outline" label="Communities" color={BLUE} onPress={() => router.push('/community')} colors={colors} />
              <QuickTile icon="calendar-outline" label="My Events" color={BLUE} onPress={() => {}} colors={colors} />
            </View>
          </View>

        </View>
      </ScrollView>

      <AncestryTreeModal 
        visible={showAncestry}
        onClose={() => setShowAncestry(false)}
        colors={colors}
      />
    </View>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', paddingBottom: 32, overflow: 'hidden' },
  topRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  topRight: { flexDirection: 'row', gap: 10 },
  topBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  avatarWrap: { position: 'relative', marginVertical: 16 },
  avatarRing: { width: 102, height: 102, borderRadius: 51, padding: 4, alignItems: 'center', justifyContent: 'center' },
  avatarInner: { width: 92, height: 92, borderRadius: 46, overflow: 'hidden', backgroundColor: '#1B0F2E' },
  avatarImg: { width: 92, height: 92 },
  heroName: { fontSize: 24, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: 1.5, textAlign: 'center' },
  tierPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99, borderWidth: 1, marginTop: 12 },
  tierPillText: { fontSize: 11, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase' },

  content: { padding: 20, gap: 32 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  
  ancestryTrigger: { borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.02)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  ancestryRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ancestryIcon: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  ancestryTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  ancestrySub: { fontSize: 13, fontFamily: 'Poppins_500Medium', opacity: 0.7, marginTop: 4 },

  perksSection: {},
  perksScroll: { gap: 16, paddingRight: 20 },
  passCard: { width: 240, padding: 16, borderRadius: 24, flexDirection: 'row', gap: 14, ...shadows.medium },
  passIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  passDetails: { flex: 1 },
  passHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  passTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  passLevel: { fontSize: 10, fontFamily: 'Poppins_800ExtraBold', textTransform: 'uppercase' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  passProgress: { fontSize: 10, fontFamily: 'Poppins_500Medium', marginTop: 4 },

  walletSection: { gap: 12 },
  mapContainer: { height: 260, borderRadius: 28, overflow: 'hidden', ...shadows.large },
  map: { flex: 1 },
  marker: { padding: 6, borderRadius: 12, ...shadows.medium },
  markerEmoji: { fontSize: 20 },
  mapOverlay: { position: 'absolute', bottom: 12, left: 12, right: 12, borderRadius: 20, padding: 12, overflow: 'hidden' },
  exploreMapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: CultureTokens.indigo, borderRadius: 12 },
  exploreMapText: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_700Bold' },

  tilesGrid: { gap: 12 },
  tilesRow: { flexDirection: 'row', gap: 12 },
});
