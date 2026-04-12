import { View, Text, Pressable, StyleSheet, Platform, ActivityIndicator, ScrollView, TextInput, Linking, useWindowDimensions, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { CultureTokens, gradients, LayoutRules, LiquidGlassTokens } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { api } from '@/lib/api';
import { useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import NativeMapView from '@/components/NativeMapView';
import type { EventData } from '@/shared/schema';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLayout } from '@/hooks/useLayout';
import { isIndigenousEvent } from '@/lib/indigenous';
import { eventListImageUrl } from '@/lib/eventImage';

type MapGroup = {
  label: string;
  coords: { latitude: number; longitude: number };
  events: EventData[];
  count: number;
};

function toSortableDate(date?: string, time?: string): number {
  if (!date) return Number.MAX_SAFE_INTEGER;
  const iso = `${date}T${time || '00:00'}:00`;
  const ts = Date.parse(iso);
  return Number.isFinite(ts) ? ts : Number.MAX_SAFE_INTEGER;
}

function formatDate(date?: string): string {
  if (!date) return 'Date TBA';
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const d = new Date(year, month, day);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function openCityInMaps(city: string) {
  const query = encodeURIComponent(city);
  const url = Platform.select({
    ios: `maps://?q=${query}`,
    android: `geo:0,0?q=${query}`,
    default: `https://www.google.com/maps/search/?api=1&query=${query}`,
  });
  if (url) {
    Linking.openURL(url).catch(() => undefined);
  }
}

function WebCityList({
  cityGroups,
  selectedCity,
  onSelectCity,
  onEventPress,
  colors,
  webStyles,
  styles,
  onOpenSystemMap,
  onOpenEventMap,
  indigenousOnly,
  setIndigenousOnly,
  groupEntries,
  shellStyle,
  totalEvents,
  onClearFilters,
}: {
  cityGroups: Record<string, MapGroup>;
  selectedCity: string | null;
  onSelectCity: (city: string | null) => void;
  onEventPress: (eventId: string) => void;
  colors: ReturnType<typeof useColors>;
  webStyles: ReturnType<typeof getWebStyles>;
  styles: ReturnType<typeof getStyles>;
  onOpenSystemMap: (key: string) => void;
  onOpenEventMap: (event: EventData) => void;
  totalEvents: number;
  indigenousOnly: boolean;
  setIndigenousOnly: (val: boolean) => void;
  groupEntries: [string, MapGroup][];
  shellStyle: ViewStyle | null;
  onClearFilters: () => void;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const selectedEvents = selectedCity ? (cityGroups[selectedCity]?.events || []) : [];
  const allEventsSorted = useMemo(() => 
    groupEntries
      .flatMap((group) => group[1].events)
      .sort((a, b) => toSortableDate(a.date, a.time) - toSortableDate(b.date, b.time)),
    [groupEntries]
  );
  const visibleEvents = selectedCity ? selectedEvents : allEventsSorted;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          { paddingHorizontal: 20, paddingTop: 12, paddingBottom: selectedCity ? 240 : 60 },
          shellStyle || undefined,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {selectedCity && (
          <View style={[webStyles.selectedCityHeader, !isDesktop && { flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
            <View style={{ flex: 1 }}>
              <Text style={webStyles.selectedCityName}>{selectedCity}</Text>
              <Text style={webStyles.selectedCityCount}>{selectedEvents.length} upcoming events</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => onOpenSystemMap(selectedCity)} style={webStyles.mapButton}>
                <Ionicons name="navigate" size={18} color={CultureTokens.indigo} />
                <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.indigo }}>Open in Maps</Text>
              </Pressable>
              <Pressable onPress={() => onSelectCity(null)} style={[webStyles.mapButton, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary }}>Clear City</Text>
              </Pressable>
            </View>
          </View>
        )}

        {groupEntries.length === 0 || visibleEvents.length === 0 ? (
          <View style={webStyles.emptyContainer}>
            <Ionicons name="calendar-clear-outline" size={48} color={colors.textTertiary} />
            <Text style={webStyles.emptyTitle}>No events found</Text>
            <Text style={webStyles.emptySubtitle}>Try another city or clear filters</Text>
          </View>
        ) : (
          <>
            <Text style={webStyles.sectionTitle}>
              {selectedCity ? `${selectedCity} Events` : 'All Upcoming Events'}
            </Text>

            <View style={webStyles.eventGrid}>
              {visibleEvents.map((event) => (
                <Pressable
                  key={event.id}
                  style={[styles.eventCard, webStyles.eventCardEnhanced]}
                  onPress={() => onEventPress(event.id)}
                  onLongPress={() => onOpenEventMap(event)}
                >
                  {eventListImageUrl(event) ? (
                    <Image source={{ uri: eventListImageUrl(event)! }} style={styles.eventImage} contentFit="cover" transition={200} />
                  ) : (
                    <View style={[styles.eventImage, { backgroundColor: CultureTokens.indigo + '12', alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="calendar" size={40} color={CultureTokens.indigo + '80'} />
                    </View>
                  )}

                  <View style={styles.eventInfo}>
                    <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {event.title}
                    </Text>
                    {event.venue && (
                      <View style={styles.eventMeta}>
                        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.eventVenue} numberOfLines={1}>
                          {event.venue}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 20 : insets.bottom;
  const { state } = useOnboarding();
  const { isDesktop } = useLayout();
  const params = useLocalSearchParams<{ city?: string }>();
  const styles = getStyles(colors);
  const webStyles = getWebStyles(colors);

  const [selectedCity, setSelectedCity] = useState<string | null>(params.city || null);
  const [indigenousOnly, setIndigenousOnly] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const { data: events = [], isLoading } = useQuery<EventData[]>({
    queryKey: ['/api/events/map', state.city, state.country],
    queryFn: async () => {
      const today = new Date().toLocaleDateString('en-CA');
      const res = await api.events.list({
        city: state.city || undefined,
        country: state.country || undefined,
        pageSize: 200,
        dateFrom: today,
      });
      return Array.isArray(res.events) ? res.events : [];
    },
    staleTime: 60_000,
  });

  const filteredEvents = useMemo(
    () => (indigenousOnly ? events.filter((event) => isIndigenousEvent(event)) : events),
    [events, indigenousOnly],
  );

  const allMapGroups = useMemo<Record<string, MapGroup>>(() => {
    const groups: Record<string, MapGroup> = {};
    for (const event of filteredEvents) {
      // Use exact coordinates if present, fallback to city centers
      const hasCoords = event.lat && event.lng;
      const key = hasCoords ? `${event.lat},${event.lng}` : (event.city || 'Australia').trim();
      const label = hasCoords ? (event.venue || event.city || 'Venue') : (event.city || 'Australia');

      if (!groups[key]) {
        let latitude = event.lat || -25.0;
        let longitude = event.lng || 134.0;

        if (!hasCoords && event.city) {
          const place = getPostcodesByPlace(event.city.trim())[0];
          if (place) {
            latitude = place.latitude;
            longitude = place.longitude;
          }
        }

        groups[key] = {
          label,
          coords: { latitude, longitude },
          events: [],
          count: 0,
        };
      }
      groups[key].events.push(event);
      groups[key].count += 1;
    }
    return groups;
  }, [filteredEvents]);

  const groupEntries = useMemo(
    () =>
      Object.entries(allMapGroups)
        .filter(([_, group]) => group.label.toLowerCase().includes(citySearch.trim().toLowerCase()))
        .sort((a, b) => b[1].count - a[1].count),
    [allMapGroups, citySearch],
  );
  const selectedEvents = selectedCity ? allMapGroups[selectedCity]?.events ?? [] : [];
  const totalEvents = filteredEvents.length;
  const hasActiveFilters = Boolean(selectedCity || indigenousOnly);

  const shellStyle: ViewStyle | null = isDesktop ? { maxWidth: 1160, width: '100%', alignSelf: 'center' } : null;

  const clearMapState = () => {
    setSelectedCity(null);
    setIndigenousOnly(false);
    setCitySearch('');
  };

  const onEventPress = (id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/event/[id]', params: { id } });
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={mapAmbient.mesh}
        pointerEvents="none"
      />
      <LiquidGlassPanel
        borderRadius={0}
        bordered={false}
        style={{
          borderBottomWidth: StyleSheet.hairlineWidth * 2,
          borderBottomColor: colors.borderLight,
        }}
        contentStyle={styles.headerGlassOuter}
      >
        <View style={shellStyle ?? undefined}>
        <View style={styles.headerMainRow}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Explore Events</Text>
            <Text style={styles.screenSubtitle}>
              Find what&apos;s on near you · {groupEntries.length} locations · {totalEvents} events
            </Text>
          </View>

          <Pressable
            onPress={clearMapState}
            style={[styles.resetButton, !hasActiveFilters && styles.resetDisabled]}
            disabled={!hasActiveFilters}
            accessibilityLabel="Clear map filters"
            accessibilityRole="button"
          >
            <Ionicons name="refresh-outline" size={20} color={hasActiveFilters ? CultureTokens.indigo : colors.textTertiary} />
          </Pressable>
        </View>

        {Platform.OS === 'web' && (
          <View
            style={[
              webStyles.searchContainer,
              {
                marginBottom: 12,
                backgroundColor: colors.primarySoft,
                borderRadius: LiquidGlassTokens.corner.valueRibbon,
              },
            ]}
          >
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              value={citySearch}
              onChangeText={setCitySearch}
              placeholder="Search cities..."
              placeholderTextColor={colors.textTertiary}
              style={webStyles.searchInput}
              autoCapitalize="words"
            />
            {!!citySearch && (
              <Pressable onPress={() => setCitySearch('')} hitSlop={12}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.discoveryRailContainer}>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.discoveryRow}
            style={styles.discoveryRail}
          >
            <Pressable 
              style={[styles.filterChip, !indigenousOnly && styles.filterChipActive]} 
              onPress={() => setIndigenousOnly(false)}
            >
              <Text style={[styles.chipText, !indigenousOnly && styles.chipTextActive]}>All</Text>
            </Pressable>
            <Pressable 
              style={[styles.filterChip, indigenousOnly && styles.filterChipActive]} 
              onPress={() => setIndigenousOnly((p) => !p)}
            >
              <Ionicons name="leaf" size={12} color={indigenousOnly ? CultureTokens.indigo : colors.textTertiary} />
              <Text style={[styles.chipText, indigenousOnly && styles.chipTextActive]}>Indigenous</Text>
            </Pressable>

            {groupEntries.slice(0, 24).map(([key, group]) => (
              <Pressable
                key={key}
                style={[webStyles.cityChip, selectedCity === key && webStyles.cityChipActive]}
                onPress={() => setSelectedCity(selectedCity === key ? null : key)}
              >
                <Text style={[webStyles.cityChipText, selectedCity === key && webStyles.cityChipTextActive]}>{group.label}</Text>
                <Text style={[webStyles.cityChipCount, selectedCity === key && webStyles.cityChipTextActive]}>{group.count}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        </View>
      </LiquidGlassPanel>

      {isLoading ? (
        <View style={styles.centeredLoading}>
          <ActivityIndicator size="large" color={CultureTokens.indigo} />
          <Text style={styles.loadingMessage}>Discovering events...</Text>
        </View>
      ) : Platform.OS === 'web' ? (
        <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column' }}>
          <View style={{ flex: isDesktop ? 1 : undefined }}>
            <WebCityList
              cityGroups={allMapGroups}
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
              onEventPress={onEventPress}
              colors={colors}
              webStyles={webStyles}
              styles={styles}
              onOpenSystemMap={openCityInMaps}
              onOpenEventMap={(event) => openCityInMaps(event.city || event.venue || '')}
              totalEvents={totalEvents}
              shellStyle={isDesktop ? { maxWidth: '100%', paddingHorizontal: 20 } : shellStyle}
              onClearFilters={clearMapState}
              indigenousOnly={indigenousOnly}
              setIndigenousOnly={setIndigenousOnly}
              groupEntries={groupEntries}
            />
          </View>
          {isDesktop && (
             <View style={{ flex: 1.5, borderLeftWidth: 1, borderLeftColor: colors.borderLight }}>
                <NativeMapView
                  cityGroups={allMapGroups}
                  groupEntries={groupEntries}
                  preferredCity={state.city || null}
                  selectedCity={selectedCity}
                  selectedEvents={selectedEvents}
                  onMarkerPress={setSelectedCity}
                  onSelectCity={setSelectedCity}
                  onClearCity={() => setSelectedCity(null)}
                  onEventPress={onEventPress}
                  onOpenSystemMap={(key) => openCityInMaps(allMapGroups[key]?.label || key)}
                  onOpenEventMap={(event) => openCityInMaps(event.city || event.venue || '')}
                  bottomInset={bottomInset}
                />
             </View>
          )}
        </View>
      ) : (
        <NativeMapView
          cityGroups={allMapGroups}
          groupEntries={groupEntries}
          preferredCity={state.city || null}
          selectedCity={selectedCity}
          selectedEvents={selectedEvents}
          onMarkerPress={setSelectedCity}
          onSelectCity={setSelectedCity}
          onClearCity={() => setSelectedCity(null)}
          onEventPress={onEventPress}
          onOpenSystemMap={(key) => openCityInMaps(allMapGroups[key]?.label || key)}
          onOpenEventMap={(event) => openCityInMaps(event.city || event.venue || '')}
          bottomInset={bottomInset}
        />
      )}
    </View>
  );
}

const mapAmbient = StyleSheet.create({
  mesh: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },
});

const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerGlassOuter: {
      paddingHorizontal: LayoutRules.screenHorizontalPadding,
      paddingTop: 16,
      paddingBottom: 16,
    },
    headerMainRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    screenTitle: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: colors.text, letterSpacing: -0.4 },
    screenSubtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 2 },
    resetButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: CultureTokens.indigo + '40',
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetDisabled: { borderColor: colors.borderLight, opacity: 0.5 },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: 'transparent',
    },
    filterChipActive: { backgroundColor: colors.primarySoft, borderColor: CultureTokens.indigo + '40' },
    chipText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },
    chipTextActive: { color: CultureTokens.indigo },
    discoveryRailContainer: { marginTop: 4 },
    discoveryRail: { marginBottom: 12 },
    discoveryRow: { alignItems: 'center', gap: 10 },
    compactStatChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    compactStatLabel: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textTertiary },
    statDivider: { width: 1, height: 20, backgroundColor: colors.borderLight, marginHorizontal: 4 },
    centeredLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
    loadingMessage: { fontSize: 16, color: colors.textSecondary },
    eventCard: {
      width: '100%', backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.borderLight,
      overflow: 'hidden', marginBottom: 16,
    },
    eventImage: { width: '100%', height: 130 },
    eventInfo: { padding: 12 },
    eventDate: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.indigo, marginBottom: 4 },
    eventTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text, lineHeight: 20, marginBottom: 6 },
    eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    eventVenue: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, flex: 1 },
  });

const getWebStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    controlPanel: { paddingHorizontal: 0, paddingVertical: 4, marginBottom: 14 },
    searchRow: { marginBottom: 12 },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    searchInput: { flex: 1, fontSize: 15, color: colors.text },
    filterMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    metaText: { fontSize: 13, color: colors.textSecondary },
    clearButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: CultureTokens.indigo + '12' },
    clearText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.indigo },
    cityChipRow: { gap: 8, paddingBottom: 2 },
    cityChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.borderLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: 'transparent',
    },
    cityChipActive: { borderColor: CultureTokens.indigo + '55', backgroundColor: colors.primarySoft },
    cityChipText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: colors.text },
    cityChipCount: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: colors.textSecondary },
    cityChipTextActive: { color: CultureTokens.indigo },
    statsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: CultureTokens.indigo + '08',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: CultureTokens.indigo + '15',
    },
    statsPillText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },
    statDividerVertical: { width: 1, height: 24, backgroundColor: colors.borderLight, marginHorizontal: 8 },
    selectedCityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 2,
      gap: 12,
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    selectedCityName: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text },
    selectedCityCount: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    mapButton: { padding: 10, borderRadius: 12, backgroundColor: CultureTokens.indigo + '12' },
    sectionTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 16 },
    eventGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    eventCardEnhanced: { width: '47.5%', minWidth: 260, maxWidth: 360 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
    emptyTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
    emptySubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  });
