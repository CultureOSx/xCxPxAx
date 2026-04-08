import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useLocations } from '@/hooks/useLocations';
import { useNearestCity } from '@/hooks/useNearestCity';
import { Button } from '@/components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CultureTokens,
  gradients,
  CardTokens,
  glass,
  shadows,
  Spacing,
  FontFamily,
  FontSize,
  TextStyles,
  IconSize,
} from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import {
  getCountryForCity,
  getRegionsForCountry,
  listMarketplaceCountries,
} from '@/lib/marketplaceLocation';
import { useAuth } from '@/lib/auth';
import { syncUserMarketplaceLocation } from '@/lib/syncMarketplaceLocation';
import { CountrySelectList } from '@/components/location/CountrySelectList';

type LocStep = 'country' | 'region' | 'city';

export default function LocationScreen() {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const { user } = useAuth();
  const { state, setCountry, setCity } = useOnboarding();
  const { states, getStateForCity, isLoading: locationsLoading, error: locationsError } = useLocations();
  const { detect, status: detectStatus } = useNearestCity();
  const isDetecting = detectStatus === 'requesting';

  const [step, setStep] = useState<LocStep>('country');
  const [pendingCountry, setPendingCountry] = useState('');
  const [pendingState, setPendingState] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const countries = useMemo(() => listMarketplaceCountries(), []);

  const regions = useMemo(
    () => (pendingCountry ? getRegionsForCountry(pendingCountry, states) : []),
    [pendingCountry, states],
  );

  useEffect(() => {
    if (!state.city) return;
    const c = state.country || getCountryForCity(state.city) || 'Australia';
    const stateCode = getStateForCity(state.city);
    if (stateCode) {
      setPendingCountry(c);
      setPendingState(stateCode);
      setStep('city');
    }
  }, [state.city, state.country, getStateForCity]);

  const selectMarketplaceCountry = (countryName: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setPendingCountry(countryName);
    setCitySearch('');
    const regs = getRegionsForCountry(countryName, states);
    if (countryName === 'Australia') {
      setPendingState('');
      setStep('region');
    } else if (regs.length === 1) {
      setPendingState(regs[0].code);
      setStep('city');
    } else {
      setPendingState('');
      setStep('region');
    }
  };

  const selectRegion = (stateCode: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setPendingState(stateCode);
    setCitySearch('');
    setStep('city');
  };

  const selectCity = (city: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const c = pendingCountry || state.country || 'Australia';
    setCountry(c);
    setCity(city);
    void syncUserMarketplaceLocation(user?.id, c, city);
  };

  const handleDetectLocation = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const r = await detect();
    if (r) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCountry('Australia');
      setCity(r.city);
      setPendingCountry('Australia');
      void syncUserMarketplaceLocation(user?.id, 'Australia', r.city);
      const stateCode = getStateForCity(r.city);
      if (stateCode) {
        setPendingState(stateCode);
        setStep('city');
      }
    } else {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (detectStatus === 'denied') {
        Alert.alert('Location Permission Required', 'Please allow location access to detect your city automatically, or select it manually below.');
      } else if (detectStatus === 'unavailable') {
        Alert.alert('Location Services Off', 'Turn on location services to auto-detect your city, or select it manually below.');
      } else {
        Alert.alert('Could Not Detect Location', 'We could not detect your city. Please choose your city manually.');
      }
    }
  };

  const handleNext = () => {
    if (state.country && state.city) {
      router.replace(routeWithRedirect('/(onboarding)/communities', redirectTo) as string);
      return;
    }
    Alert.alert('Select Location', 'Please choose your state and city to continue.');
  };

  const pendingRegionMeta = useMemo(
    () => regions.find((r) => r.code === pendingState),
    [regions, pendingState],
  );
  const allCitiesForState = pendingRegionMeta?.cities ?? [];
  const citiesToShow = useMemo(() => {
    if (!citySearch.trim()) return allCitiesForState;
    const q = citySearch.trim().toLowerCase();
    return allCitiesForState.filter((c) => c.toLowerCase().includes(q));
  }, [allCitiesForState, citySearch]);

  const goBackWithinFlow = () => {
    if (step === 'city') {
      setCitySearch('');
      if (pendingCountry === 'Australia') setStep('region');
      else {
        setStep('country');
        setPendingState('');
        setPendingCountry('');
      }
      return;
    }
    if (step === 'region') {
      setStep('country');
      setPendingState('');
      setPendingCountry('');
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.gradientBg}
      />

      {Platform.OS === 'web' && (
        <>
          <View style={[s.orb, { top: -40, right: -60, backgroundColor: CultureTokens.indigo, opacity: 0.4 }]} />
          <View style={[s.orb, { bottom: -80, left: -40, backgroundColor: CultureTokens.teal, opacity: 0.25 }]} />
        </>
      )}

      {isDesktop && (
        <View style={s.desktopBackRow}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace(routeWithRedirect('/(onboarding)/signup', redirectTo) as string)}
            hitSlop={Spacing.sm}
            style={[s.desktopBackBtn, { backgroundColor: glass.overlay.backgroundColor, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={IconSize.md - 2} color={colors.textInverse} />
            <Text style={[s.desktopBackText, { color: colors.textInverse }]}>Back</Text>
          </Pressable>
        </View>
      )}

      {!isDesktop && (
        <View style={[s.mobileHeader, { paddingTop: topInset + Spacing.sm + 4 }]}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace(routeWithRedirect('/(onboarding)/signup', redirectTo) as string)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={28} color={colors.textInverse} />
          </Pressable>
          <Text style={[s.stepText, { color: colors.textSecondary }]}>1 of 4</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={s.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={[
            s.scrollContent,
            isDesktop && s.scrollContentDesktop,
            !isDesktop && { paddingTop: 20 },
            Platform.OS !== 'web' && { paddingBottom: 60 + insets.bottom },
          ]}
        >
          <View style={[s.formContainer, isDesktop && s.formContainerDesktop, { borderRadius: 32 }]}>
            {Platform.OS === 'ios' || Platform.OS === 'web' ? (
              <BlurView
                intensity={80}
                tint="dark"
                style={[StyleSheet.absoluteFill, s.formBlur, { borderRadius: 32, borderColor: 'rgba(255,255,255,0.15)' }]}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, s.formBlur, { backgroundColor: 'rgba(20,20,35,0.9)', borderRadius: 32 }]} />
            )}

            <View style={[s.formContent, { padding: CardTokens.paddingLarge * 2 }]}>
              <View style={s.headerBlock}>
                <View style={[s.iconWrapper, { borderColor: CultureTokens.teal, backgroundColor: `${CultureTokens.teal}15` }]}>
                  <Ionicons
                    name={step === 'country' ? 'earth' : step === 'region' ? 'compass' : 'location'}
                    size={36}
                    color={CultureTokens.teal}
                  />
                </View>
                <Text style={[s.title, { color: colors.textInverse }]}>
                  {step === 'country'
                    ? 'Choose your country'
                    : step === 'region'
                      ? pendingCountry === 'Australia'
                        ? 'Your home state'
                        : 'Your region'
                      : 'Select your city'}
                </Text>
                <Text style={s.subtitle}>
                  {step === 'country'
                    ? 'CulturePass is scoped to your country first — then city. Change anytime in Settings → Location.'
                    : step === 'region'
                      ? `We'll find cultural events and communities near you.`
                      : `Pick your city and we'll show you what's happening nearby.`}
                </Text>
              </View>

              {step === 'country' ? (
                <CountrySelectList
                  key={step}
                  countries={countries}
                  selectedName={state.country || undefined}
                  onSelect={selectMarketplaceCountry}
                  variant="onboarding"
                  colors={colors}
                  showFooterHint={false}
                />
              ) : null}

              {step === 'region' ? (
                <View>
                  {pendingCountry === 'Australia' ? (
                    <Pressable
                      style={({ pressed }) => [
                        s.detectBtn,
                        { backgroundColor: pressed ? `${CultureTokens.gold}33` : `${CultureTokens.gold}1A`, borderColor: `${CultureTokens.gold}80` },
                        isDetecting && { opacity: 0.7 },
                      ]}
                      onPress={handleDetectLocation}
                      disabled={isDetecting}
                      accessibilityLabel={isDetecting ? 'Detecting location' : 'Use current location'}
                      accessibilityRole="button"
                      {...(Platform.OS === 'android'
                        ? { android_ripple: { color: `${CultureTokens.gold}40`, borderless: false } }
                        : {})}
                    >
                      {isDetecting ? (
                        <ActivityIndicator size="small" color={CultureTokens.gold} />
                      ) : (
                        <Ionicons name="navigate" size={IconSize.md - 2} color={CultureTokens.gold} />
                      )}
                      <Text style={[s.detectBtnText, { color: CultureTokens.gold }]}>
                        {isDetecting ? 'Detecting location...' : 'Use my location (Australia)'}
                      </Text>
                    </Pressable>
                  ) : null}

                  {pendingCountry === 'Australia' && locationsLoading && (
                    <ActivityIndicator size="large" color={CultureTokens.indigo} style={{ paddingVertical: 20 }} />
                  )}

                  {pendingCountry === 'Australia' && !!locationsError && (
                    <View style={[s.errorBanner, { backgroundColor: `${CultureTokens.coral}20`, borderColor: `${CultureTokens.coral}50` }]}>
                      <Ionicons name="alert-circle" size={IconSize.md} color={CultureTokens.coral} />
                      <Text style={[s.errorText, { color: CultureTokens.coral }]}>Failed to load locations.</Text>
                    </View>
                  )}

                  <View style={s.cityStepHeader}>
                    <Pressable
                      onPress={goBackWithinFlow}
                      style={({ pressed }) => [s.backToStateRow, { opacity: pressed ? 0.7 : 1 }]}
                      hitSlop={12}
                      accessibilityRole="button"
                      accessibilityLabel="Back"
                    >
                      <Ionicons name="arrow-back" size={IconSize.sm} color={CultureTokens.gold} />
                      <Text style={[s.backToStateText, { color: CultureTokens.gold }]}>Back</Text>
                    </Pressable>
                  </View>

                  <View style={s.stateGrid}>
                    {regions.map((st) => (
                      <Pressable
                        key={st.code}
                        style={({ pressed }) => [
                          s.stateCard,
                          {
                            backgroundColor: pressed ? `${CultureTokens.teal}18` : 'rgba(255,255,255,0.05)',
                            borderColor: pressed ? `${CultureTokens.teal}50` : 'rgba(255,255,255,0.12)',
                          },
                        ]}
                        onPress={() => selectRegion(st.code)}
                        accessibilityRole="button"
                        accessibilityLabel={`${st.name}, ${st.cities.length} cities`}
                        {...(Platform.OS === 'android'
                          ? { android_ripple: { color: `${CultureTokens.teal}35`, borderless: false } }
                          : {})}
                      >
                        <Text style={s.stateEmoji}>{st.emoji}</Text>
                        <Text style={[s.stateName, { color: colors.textInverse }]}>{st.name}</Text>
                        <Text style={[s.cityCount, { color: colors.textSecondary }]}>{st.cities.length} cities</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              {step === 'city' ? (
                <View>
                  <View style={s.cityStepHeader}>
                    <Pressable
                      onPress={goBackWithinFlow}
                      style={({ pressed }) => [s.backToStateRow, { opacity: pressed ? 0.7 : 1 }]}
                      hitSlop={12}
                      accessibilityRole="button"
                      accessibilityLabel="Back"
                    >
                      <Ionicons name="arrow-back" size={IconSize.sm} color={CultureTokens.gold} />
                      <Text style={[s.backToStateText, { color: CultureTokens.gold }]}>Back</Text>
                    </Pressable>
                    <View style={[s.selectedStatePill, { backgroundColor: `${CultureTokens.indigo}25`, borderColor: `${CultureTokens.indigo}50` }]}>
                      <Text style={s.stateEmojiSmall}>{pendingRegionMeta?.emoji}</Text>
                      <Text style={[s.selectedStatePillText, { color: colors.textInverse }]} numberOfLines={1}>
                        {pendingRegionMeta?.name}
                      </Text>
                    </View>
                  </View>

                  <View style={[s.searchRow, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                    <Ionicons name="search" size={IconSize.sm + 2} color={colors.textSecondary} />
                    <TextInput
                      style={[s.searchInput, { color: colors.textInverse }]}
                      placeholder={`Search ${allCitiesForState.length} cities…`}
                      placeholderTextColor={colors.textSecondary}
                      value={citySearch}
                      onChangeText={setCitySearch}
                      autoCorrect={false}
                      autoCapitalize="words"
                      returnKeyType="search"
                      clearButtonMode="while-editing"
                      accessibilityLabel="Search cities"
                      selectionColor={CultureTokens.gold}
                      underlineColorAndroid="transparent"
                      {...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : {})}
                    />
                    {citySearch.length > 0 && Platform.OS !== 'ios' && (
                      <Pressable onPress={() => setCitySearch('')} hitSlop={8} accessibilityLabel="Clear search">
                        <Ionicons name="close-circle" size={IconSize.sm + 2} color={colors.textSecondary} />
                      </Pressable>
                    )}
                  </View>

                  {citiesToShow.length === 0 ? (
                    <View style={s.noResults}>
                      <Ionicons name="search-outline" size={36} color={colors.textSecondary} />
                      <Text style={[s.noResultsText, { color: colors.textSecondary }]}>No cities match "{citySearch}"</Text>
                      <Pressable onPress={() => setCitySearch('')} hitSlop={8}>
                        <Text style={[s.noResultsClear, { color: CultureTokens.gold }]}>Clear search</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={s.cityGrid}>
                      {citiesToShow.map((city) => {
                        const isActive = state.city === city;
                        return (
                          <Pressable
                            key={city}
                            style={({ pressed }) => [
                              s.cityCard,
                              {
                                backgroundColor: isActive
                                  ? CultureTokens.indigo
                                  : pressed ? `${CultureTokens.indigo}20` : 'rgba(255,255,255,0.05)',
                                borderColor: isActive ? CultureTokens.indigo : 'rgba(255,255,255,0.12)',
                              },
                            ]}
                            onPress={() => selectCity(city)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: isActive }}
                            accessibilityLabel={city}
                            {...(Platform.OS === 'android'
                              ? {
                                  android_ripple: {
                                    color: isActive ? 'rgba(255,255,255,0.22)' : `${CultureTokens.indigo}28`,
                                    borderless: false,
                                  },
                                }
                              : {})}
                          >
                            {isActive ? (
                              <Ionicons name="checkmark-circle" size={IconSize.md - 2} color={colors.textInverse} />
                            ) : (
                              <Ionicons name="location-outline" size={IconSize.md - 2} color={colors.textSecondary} />
                            )}
                            <Text style={[s.cityName, { color: isActive ? colors.textInverse : colors.text, fontFamily: isActive ? FontFamily.semibold : FontFamily.medium }]} numberOfLines={1}>{city}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              ) : null}

              <View style={s.spacer} />

              <Button
                variant="primary"
                size="lg"
                fullWidth
                rightIcon="arrow-forward"
                disabled={!state.country || !state.city}
                onPress={handleNext}
                style={[s.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold }]}
              >
                Continue
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — static StyleSheet
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  container: { flex: 1 },
  gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.85 },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    ...Platform.select({
      web: { filter: 'blur(50px)' } as Record<string, string>,
      default: {},
    }),
  },
  keyboardAvoid: { flex: 1 },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: Spacing.sm + 4,
  },
  stepText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.chip,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  desktopBackRow: { position: 'absolute', top: Spacing.xl, left: Spacing.xxl, zIndex: 10 },
  desktopBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
  },
  desktopBackText: { fontFamily: FontFamily.medium, fontSize: FontSize.body2 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60, justifyContent: 'center' },
  scrollContentDesktop: { paddingVertical: 60 },
  formContainer: { width: '100%', maxWidth: 460, alignSelf: 'center', overflow: 'hidden' },
  formContainerDesktop: { maxWidth: 520 },
  formBlur: { borderWidth: 1 },
  formContent: { paddingTop: Spacing.xxl },

  headerBlock: { alignItems: 'center', marginBottom: 28 },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1.5,
  },
  title: {
    ...TextStyles.display,
    fontSize: 32,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...TextStyles.callout,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.75)',
  },

  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: Spacing.md,
    borderRadius: CardTokens.radius,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
  },
  detectBtnText: { fontFamily: FontFamily.bold, fontSize: FontSize.body2, letterSpacing: 1 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: CardTokens.radius,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  errorText: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.body2 },

  stateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: CardTokens.radius,
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderWidth: 1,
    width: '47.5%',
  },
  stateEmoji: { fontSize: 34 },
  stateName: { fontFamily: FontFamily.semibold, fontSize: FontSize.body2, textAlign: 'center' },
  cityCount: { fontFamily: FontFamily.regular, fontSize: FontSize.chip, textAlign: 'center' },

  cityStepHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  backToStateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backToStateText: { fontFamily: FontFamily.semibold, fontSize: FontSize.body2 },
  selectedStatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  stateEmojiSmall: { fontSize: 16 },
  selectedStatePillText: { fontFamily: FontFamily.semibold, fontSize: FontSize.body2 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: CardTokens.radius,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    padding: 0,
  },

  noResults: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  noResultsText: { fontFamily: FontFamily.regular, fontSize: FontSize.body2, textAlign: 'center' },
  noResultsClear: { fontFamily: FontFamily.semibold, fontSize: FontSize.body2, marginTop: 4 },

  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: CardTokens.radius,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    width: '47.5%',
  },
  cityName: { flex: 1, fontSize: FontSize.body2 },
  spacer: { height: Spacing.xl },
  submitBtn: { height: 60, borderRadius: 20 },
});
