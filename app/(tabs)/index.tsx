// app/(tabs)/index.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
  FadeInDown,
  FadeInLeft,
  SlideInDown,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';

import { CultureTokens, EntityTypeColors, shadows } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FilterChipRow, type FilterItem } from '@/components/FilterChip';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import { api, type CouncilData } from '@/lib/api';
import { isIndigenousProfile } from '@/lib/indigenous';
import { useOnboarding } from '@/contexts/OnboardingContext';
import type { Profile } from '@/shared/schema';

// ─── Constants ────────────────────────────────────────────────────────────────

const FEATURED_ARTISTS = [
  { id: '1', name: 'Aarav Shrivastav', handle: '@aaravmusic', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400', identity: 'Tabla Maestro', tag: 'Classical', color: '#FF9933', rate: '$150/hr' },
  { id: '2', name: 'Suki Park', handle: '@sukipark_k', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400', identity: 'K-Pop Voyager', tag: 'Pop/Dance', color: '#CD2E3A', rate: '$200/hr' },
  { id: '3', name: 'Zainab Al-Fayed', handle: '@zainab_oud', image: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?q=80&w=400', identity: 'Oud Artisan', tag: 'Traditional', color: '#006341', rate: '$180/hr' },
];

const HERITAGE_PLAYLIST = [
  { id: 'p1', title: 'Soul of the Sitar', artist: 'Ravi Shankar', culture: 'India', image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400', type: 'Music', color: '#FF9933', isLive: false },
  { id: 'p2', title: 'Neo-Trad Seoul', artist: 'Leenalchi', culture: 'S. Korea', image: 'https://images.unsplash.com/photo-1542152352-8418086054f7?q=80&w=400', type: 'Music', color: '#CD2E3A', isLive: true },
  { id: 'p3', title: 'Aegean Echoes', artist: 'Yanni', culture: 'Greece', image: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?q=80&w=400', type: 'Podcast', color: '#005BAE', isLive: false },
];

const ENTITY_FILTERS = [
  { id: 'All',          label: 'All',             icon: 'grid',             color: CultureTokens.indigo },
  { id: 'event',        label: 'Events',          icon: 'calendar',          color: CultureTokens.saffron },
  { id: 'indigenous',   label: '🪃 Indigenous',   icon: 'leaf',              color: CultureTokens.gold },
  { id: 'business',     label: 'Businesses',      icon: 'storefront',        color: EntityTypeColors.business },
  { id: 'venue',        label: 'Venues',          icon: 'location',          color: EntityTypeColors.venue },
  { id: 'organisation', label: 'Organisations',   icon: 'business',          color: EntityTypeColors.organisation },
  { id: 'council',      label: 'Councils',        icon: 'shield-checkmark',  color: EntityTypeColors.council },
  { id: 'charity',      label: 'Charities',       icon: 'heart',             color: EntityTypeColors.charity },
] as const;

// ─── Booking Drawer Component ────────────────────────────────────────────────

function ArtistBookingDrawer({ artist, onClose, colors }: { artist: any, onClose: () => void, colors: any }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  if (!artist) return null;

  const handleNext = () => {
    if (step < 3) {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStep(step + 1);
    } else { onClose(); }
  };

  return (
    <Modal visible={!!artist} transparent animationType="none" onRequestClose={onClose}>
      <View style={bookingStyles.overlay}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </TouchableOpacity>
        <Animated.View entering={SlideInDown.springify().damping(22)} style={[bookingStyles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
          <View style={bookingStyles.handle} />
          <View style={bookingStyles.header}>
            <View style={bookingStyles.artistMini}>
              <Image source={{ uri: artist.image }} style={bookingStyles.artistMiniImg} />
              <View>
                <Text style={[bookingStyles.artistMiniName, { color: colors.text }]}>{artist.name}</Text>
                <Text style={[bookingStyles.artistMiniHandle, { color: colors.textSecondary }]}>{artist.identity} • {artist.rate}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={bookingStyles.closeBtn}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
          </View>
          <View style={bookingStyles.content}>
            {step === 1 && <View style={bookingStyles.stepBody}><Text style={[bookingStyles.stepTitle, { color: colors.text }]}>Date & Time</Text><View style={bookingStyles.dateRow}>{['24 Mar', '25 Mar'].map(d => <TouchableOpacity key={d} style={[bookingStyles.datePill, { backgroundColor: colors.surface }]}><Text style={[bookingStyles.dateText, { color: colors.text }]}>{d}</Text></TouchableOpacity>)}</View></View>}
            {step === 2 && <View style={bookingStyles.stepBody}><Text style={[bookingStyles.stepTitle, { color: colors.text }]}>Event Details</Text><TextInput style={[bookingStyles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]} placeholder="Event Type" /></View>}
            {step === 3 && <View style={[bookingStyles.stepBody, { alignItems: 'center', paddingVertical: 40 }]}><Ionicons name="checkmark-done-circle" size={60} color={CultureTokens.teal} /><Text style={[bookingStyles.successTitle, { color: colors.text }]}>Inquiry Sent!</Text></View>}
            <Button variant={step === 3 ? "outline" : "gradient"} size="lg" fullWidth onPress={handleNext} style={bookingStyles.nextBtn}><Text style={[bookingStyles.nextBtnText, step === 3 && { color: colors.text }]}>{step === 1 ? 'Continue' : step === 2 ? 'Send Inquiry' : 'Done'}</Text></Button>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const bookingStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 36, borderTopRightRadius: 36, overflow: 'hidden', ...shadows.large },
  handle: { width: 44, height: 5, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 3, alignSelf: 'center', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  artistMini: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  artistMiniImg: { width: 48, height: 48, borderRadius: 14 },
  artistMiniName: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  artistMiniHandle: { fontSize: 12, fontFamily: 'Poppins_500Medium', opacity: 0.8 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, paddingTop: 0 },
  stepBody: { gap: 16 },
  stepTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold' },
  dateRow: { flexDirection: 'row', gap: 10 },
  datePill: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  dateText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  input: { padding: 16, borderRadius: 16, border坚Width: 1, borderWidth: 1 },
  successTitle: { fontSize: 24, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  nextBtn: { marginTop: 32, height: 56, borderRadius: 16 },
  nextBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DiscoveryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useLayout();
  const { state: onboardingState } = useOnboarding();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedBookingArtist, setSelectedBookingArtist] = useState<any>(null);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({ onScroll: (event) => { scrollY.value = event.contentOffset.y; } });

  const { data: eventsData } = useQuery({ queryKey: ['/api/events', 'discovery', onboardingState.city], queryFn: () => api.events.list({ city: onboardingState.city }) });

  const allEvents = useMemo(() => (eventsData && 'events' in eventsData ? eventsData.events : []), [eventsData]);

  const filteredItems = useMemo(() => {
    let results: any[] = [...allEvents.map(e => ({ type: 'event', data: e }))];
    if (search.trim()) results = results.filter(item => item.data.title.toLowerCase().includes(search.toLowerCase()));
    return results;
  }, [allEvents, search]);

  const renderHeader = () => (
    <View>
      <View style={styles.heroWrapper}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1543157145-f78c636d023d?q=80&w=1200' }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Discover Culture</Text>
          <Text style={styles.heroSubtitle}>Events in {onboardingState.city || 'your city'}</Text>
        </LinearGradient>
      </View>

      <View style={{ backgroundColor: colors.background }}>
        <View style={styles.searchWrapper}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={22} color={colors.textSecondary} />
            <TextInput style={[styles.searchInput, { color: colors.text }]} placeholder="Search..." value={search} onChangeText={setSearch} />
          </View>
        </View>

        {/* HERITAGE PLAYLIST Section with Live Status */}
        <View style={styles.heritageSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Heritage Playlist</Text>
            <View style={styles.heritageBadge}><Text style={styles.badgeLabel}>MATCHED TO ROOTS</Text></View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heritageScroll}>
            {HERITAGE_PLAYLIST.map((item, idx) => (
              <Animated.View key={item.id} entering={FadeInLeft.delay(idx * 150).springify()} style={[styles.mediaCard, { backgroundColor: colors.surface }]}>
                <Image source={{ uri: item.image }} style={styles.mediaCover} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFill} />
                <TouchableOpacity 
                  style={styles.playBtn} 
                  onPress={() => {
                    if (item.isLive) router.push(`/dashboard/backstage/${item.id}`);
                    else if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                  <Ionicons name={item.isLive ? "record" : "play"} size={20} color={item.isLive ? CultureTokens.coral : "#fff"} />
                </TouchableOpacity>
                {item.isLive && (
                  <View style={styles.liveNowTag}>
                    <Text style={styles.liveNowText}>BACKSTAGE ACCESS</Text>
                  </View>
                )}
                <View style={[styles.mediaAccent, { backgroundColor: item.color }]} />
                <View style={styles.mediaContent}>
                  <Text style={styles.mediaTitle}>{item.title}</Text>
                  <Text style={styles.mediaArtist}>{item.artist}</Text>
                  <Text style={styles.cultureInfoText}>{item.culture} • {item.type}</Text>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* ARTIST SPOTLIGHT */}
        <View style={styles.spotlightSection}>
          <Text style={[styles.spotlightTitle, { color: colors.text, paddingHorizontal: 24, marginBottom: 16 }]}>Artist Spotlight</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.spotlightScroll}>
            {FEATURED_ARTISTS.map(artist => (
              <TouchableOpacity key={artist.id} style={[styles.artistCard, { backgroundColor: colors.surface }]} onPress={() => setSelectedBookingArtist(artist)}>
                <Image source={{ uri: artist.image }} style={styles.artistCover} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                <View style={[styles.artistAccent, { backgroundColor: artist.color }]} />
                <View style={styles.artistContent}>
                  <Text style={styles.artistName}>{artist.name}</Text>
                  <View style={styles.artistIdentity}><Text style={styles.identityText}>BOOK NOW</Text></View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.chipsRow}>
          <FilterChipRow items={ENTITY_FILTERS as any} selectedId={selectedType} onSelect={setSelectedType} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ErrorBoundary>
        <AnimatedFlashList
          data={filteredItems}
          numColumns={2}
          keyExtractor={(item: any, index: number) => `${item.type}-${item.data.id}-${index}`}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.data.id } })} style={styles.cardContainer}>
              <Card padding={0} style={styles.roundedCard}>
                <Image source={{ uri: item.data.heroImageUrl }} style={styles.cardImage} />
                <View style={styles.cardBody}><Text numberOfLines={1} style={[styles.cardTitleText, { color: colors.text }]}>{item.data.title}</Text></View>
              </Card>
            </TouchableOpacity>
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
          onScroll={scrollHandler}
          estimatedItemSize={280}
        />
        <ArtistBookingDrawer artist={selectedBookingArtist} onClose={() => setSelectedBookingArtist(null)} colors={colors} />
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrapper: { height: 320, overflow: 'hidden' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%', padding: 28, justifyContent: 'flex-end' },
  heroTitle: { fontSize: 40, fontFamily: 'Poppins_700Bold', color: '#fff' },
  heroSubtitle: { fontSize: 18, fontFamily: 'Poppins_500Medium', color: '#fff', marginTop: 6 },
  searchWrapper: { marginTop: -32, paddingHorizontal: 20, zIndex: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 99, paddingHorizontal: 20, paddingVertical: 16, elevation: 5 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },

  heritageSection: { marginTop: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  heritageBadge: { backgroundColor: CultureTokens.gold + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeLabel: { fontSize: 9, fontFamily: 'Poppins_800ExtraBold', color: CultureTokens.gold },
  heritageScroll: { paddingHorizontal: 20, gap: 16, paddingBottom: 10 },
  mediaCard: { width: 220, height: 280, borderRadius: 28, overflow: 'hidden', ...shadows.medium },
  mediaCover: { width: '100%', height: '100%' },
  playBtn: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  liveNowTag: { position: 'absolute', top: 16, left: 16, backgroundColor: CultureTokens.coral, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  liveNowText: { color: '#fff', fontSize: 8, fontFamily: 'Poppins_800ExtraBold' },
  mediaAccent: { position: 'absolute', top: 0, left: 0, width: 6, height: '100%' },
  mediaContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  mediaTitle: { color: '#fff', fontSize: 17, fontFamily: 'Poppins_700Bold' },
  mediaArtist: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Poppins_500Medium' },
  cultureInfoText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'Poppins_700Bold', marginTop: 8 },

  spotlightSection: { marginTop: 32 },
  spotlightTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  spotlightScroll: { paddingHorizontal: 20, gap: 16, paddingBottom: 8 },
  artistCard: { width: 160, height: 220, borderRadius: 24, overflow: 'hidden' },
  artistCover: { width: '100%', height: '100%' },
  artistAccent: { position: 'absolute', top: 0, left: 0, width: 4, height: '100%' },
  artistContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  artistName: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },
  artistIdentity: { marginTop: 8, backgroundColor: CultureTokens.indigo, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  identityText: { color: '#fff', fontSize: 9, fontFamily: 'Poppins_800ExtraBold' },

  chipsRow: { paddingTop: 24 },
  cardContainer: { flex: 0.5, padding: 8 },
  roundedCard: { borderRadius: 24, overflow: 'hidden', ...shadows.medium },
  cardImage: { width: '100%', height: 150 },
  cardBody: { padding: 12 },
  cardTitleText: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
});
