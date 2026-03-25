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
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import type { User } from '@shared/schema';
import { GuestProfileView } from '@/components/profile/GuestProfileView';
import { ProfileQuickMenuTrigger } from '@/components/ProfileQuickMenu';
import { CultureTokens, shadows } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import Animated, { 
  FadeInRight, 
  SlideInUp, 
  FadeIn,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { CultureWalletMap } from '../../components/profile/CultureWalletMap';

// ─── Constants ────────────────────────────────────────────────────────────────

const HERO_BG     = '#0B0B14';
const BLUE        = CultureTokens.indigo;

const LOYALTY_PASSES = [
  { id: '1', title: 'Classical India', level: 'Silver', progress: 0.6, color: '#FF9933', icon: 'musical-note' },
  { id: '2', title: 'K-Pop Explorer', level: 'Gold', progress: 0.9, color: '#CD2E3A', icon: 'sparkles' },
  { id: '3', title: 'Oud Artisan', level: 'Bronze', progress: 0.3, color: '#006341', icon: 'color-palette' },
];

const DIGITAL_HERITAGE_TOKENS = [
  { id: 't1', title: 'Suki: Neon Seoul Live', date: '24 Mar 2026', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400', color: '#CD2E3A', rarity: 'Rare' },
  { id: 't2', title: 'Aarav: Ganges Echoes', date: '20 Mar 2026', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400', color: '#FF9933', rarity: 'Epic' },
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

// ─── Ancestry Tree Modal ─────────────────────────────────────────────────────

function AncestryTreeModal({ visible, onClose, colors }: { visible: boolean, onClose: () => void, colors: any }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={treeStyles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}><BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} /></Pressable>
        <Animated.View entering={SlideInUp.springify().damping(22)} style={[treeStyles.sheet, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
          <View style={treeStyles.header}>
            <View><Text style={[treeStyles.title, { color: colors.text }]}>Ancestry Tree</Text><Text style={[treeStyles.subtitle, { color: colors.textSecondary }]}>Tracing your heritage</Text></View>
            <TouchableOpacity onPress={onClose} style={treeStyles.closeBtn}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={treeStyles.treeScroll}>
            <View style={treeStyles.canvas}>
              <Svg height="400" width="400">
                {ANCESTRY_TREE_DATA.map(node => {
                  const parent = node.parentId ? ANCESTRY_TREE_DATA.find(n => n.id === node.parentId) : null;
                  return parent ? <Line key={`line-${node.id}`} x1={parent.x} y1={parent.y} x2={node.x} y2={node.y} stroke={node.color} strokeWidth="2" strokeDasharray="4, 4" opacity={0.6} /> : null;
                })}
              </Svg>
              {ANCESTRY_TREE_DATA.map((node, idx) => (
                <Animated.View key={node.id} entering={FadeIn.delay(idx * 150).springify()} style={[treeStyles.nodeWrap, { left: node.x - 40, top: node.y - 40 }]}>
                  <View style={[treeStyles.nodeCircle, { borderColor: node.color, backgroundColor: colors.surface }]}>{node.emoji ? <Text style={treeStyles.nodeEmoji}>{node.emoji}</Text> : <Ionicons name="planet-outline" size={20} color={node.color} />}</View>
                  <Text style={[treeStyles.nodeLabel, { color: colors.text }]}>{node.label}</Text>
                </Animated.View>
              ))}
            </View>
            <Card style={treeStyles.insightCard} padding={20}>
              <View style={treeStyles.insightRow}><Ionicons name="git-branch-outline" size={24} color={BLUE} /><Text style={[treeStyles.insightText, { color: colors.text }]}>Strong confluence between South Asian Diaspora and East Asian Traditions.</Text></View>
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
  nodeCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  nodeEmoji: { fontSize: 24 },
  nodeLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  insightCard: { margin: 24, borderRadius: 28 },
  insightRow: { flexDirection: 'row', gap: 16 },
  insightText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', lineHeight: 22 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;
  const colors = useColors();
  const { userId, user: authUser } = useAuth();
  const [showAncestry, setShowAncestry] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery<User>({ queryKey: ['/api/users/me', userId], queryFn: () => api.users.me() as any, enabled: !!userId });
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
          <View style={s.avatarWrap}><LinearGradient colors={[CultureTokens.gold, CultureTokens.saffron]} style={s.avatarRing}><View style={s.avatarInner}><Image source={{ uri: displayUser?.avatarUrl || `https://ui-avatars.com/api/?name=${displayName}` }} style={s.avatarImg} /></View></LinearGradient></View>
          <Text style={s.heroName}>{displayName.toUpperCase()}</Text>
        </View>
        
        <View style={s.content}>
          {/* ANCESTRY Trigger */}
          <Card onPress={() => setShowAncestry(true)} style={s.ancestryTrigger} padding={24}>
            <View style={s.ancestryRow}><View style={[s.ancestryIcon, { backgroundColor: CultureTokens.gold + '15' }]}><Ionicons name="git-network-outline" size={32} color={CultureTokens.gold} /></View><Text style={[s.ancestryTitle, { color: colors.text }]}>Ancestry Tree</Text><Ionicons name="chevron-forward" size={24} color={colors.textTertiary} /></View>
          </Card>

          {/* DIGITAL HERITAGE ARCHIVE Implementation */}
          <View style={s.archiveSection}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Performance Archive</Text>
              <Text style={[s.sectionSubtitle, { color: colors.textSecondary }]}>Collectibles from past Backstage sessions</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.archiveScroll}>
              {DIGITAL_HERITAGE_TOKENS.map((token, idx) => (
                <Animated.View key={token.id} entering={FadeInRight.delay(idx * 150).springify()} style={[s.tokenCard, { backgroundColor: colors.surface }]}>
                  <Image source={{ uri: token.image }} style={s.tokenImage} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                  <View style={[s.rarityBadge, { backgroundColor: token.color }]}><Text style={s.rarityText}>{token.rarity.toUpperCase()}</Text></View>
                  <View style={s.tokenContent}>
                    <Text style={s.tokenTitle}>{token.title}</Text>
                    <Text style={s.tokenDate}>{token.date}</Text>
                  </View>
                </Animated.View>
              ))}
            </ScrollView>
          </View>

          {/* CULTURAL WALLET MAP (Conditional for Web) */}
          <View style={s.walletSection}>
            <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Culture Wallet</Text>
            <View style={s.mapContainer}>
              <CultureWalletMap cultures={MATCHED_CULTURES} />
            </View>
          </View>

          {/* PERKS Section */}
          <View style={s.perksSection}>
            <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Community Perks</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.perksScroll}>
              {LOYALTY_PASSES.map(pass => (
                <View key={pass.id} style={[s.passCard, { backgroundColor: colors.surface }]}>
                  <LinearGradient colors={[pass.color, pass.color + '40']} style={s.passIconWrap}><Ionicons name={pass.icon as any} size={20} color="#fff" /></LinearGradient>
                  <View style={s.passDetails}><Text style={[s.passTitle, { color: colors.text }]}>{pass.title}</Text><View style={[s.progressBar, { backgroundColor: colors.borderLight }]}><View style={[s.progressFill, { width: `${pass.progress * 100}%`, backgroundColor: pass.color }]} /></View></View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
      <AncestryTreeModal visible={showAncestry} onClose={() => setShowAncestry(false)} colors={colors} />
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
