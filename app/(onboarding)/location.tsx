import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInLeft,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useLocations } from '@/hooks/useLocations';
import { useNearestCity } from '@/hooks/useNearestCity';
import { useDetectCountry } from '@/hooks/useDetectCountry';

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
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import {
  getCountryFlag,
  getCountryForCity,
  getRegionsForCountry,
  listMarketplaceCountries,
} from '@/lib/marketplaceLocation';
import { useAuth } from '@/lib/auth';
import { syncUserMarketplaceLocation } from '@/lib/syncMarketplaceLocation';
import { CountrySelectList } from '@/components/location/CountrySelectList';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type LocStep = 'country' | 'region' | 'city';

const STEPS: LocStep[] = ['country', 'region', 'city'];
const STEP_LABELS = ['Country', 'State', 'City'];

const STEP_ICON: Record<LocStep, string> = {
  country: 'earth',
  region: 'compass',
  city: 'location',
};

const STEP_TITLE: Record<LocStep, (country?: string) => string> = {
  country: () => 'Where are you based?',
  region: (c) => (c === 'Australia' ? 'Your home state' : 'Your region'),
  city: () => 'Choose your city',
};

const STEP_SUBTITLE: Record<LocStep, string> = {
  country: 'CulturePass shows events, communities and deals tailored to your location.',
  region: "We'll surface cultural events and communities near you.",
  city: "Pick your city and we'll show what's happening nearby.",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LocationScreen() {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const { user } = useAuth();
  const { state, setCountry, setCity } = useOnboarding();
  const { states, getStateForCity, isLoading: locationsLoading, error: locationsError } = useLocations();

  // City detection (AU only — region step)
  const { detect: detectCity, status: cityDetectStatus } = useNearestCity();
  const isDetectingCity = cityDetectStatus === 'requesting';

  // Country detection (country step)
  const {
    detect: detectCountry,
    country: gpsCountry,
    status: countryDetectStatus,
    reset: resetGpsCountry,
  } = useDetectCountry();
  const isDetectingCountry = countryDetectStatus === 'requesting';

  const [step, setStep] = useState<LocStep>('country');
  const [stepDir, setStepDir] = useState<'forward' | 'back'>('forward');
  const [pendingCountry, setPendingCountry] = useState('');
  const [pendingState, setPendingState] = useState('');
  const [citySearch, setCitySearch] = useState('');

  // ---------------------------------------------------------------------------
  // Animated progress bar
  // ---------------------------------------------------------------------------

  const progressWidth = useSharedValue(0);
  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    progressWidth.value = withTiming((stepIndex + 1) / STEPS.length, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
  }, [stepIndex, progressWidth]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as any,
  }));

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const countries = useMemo(() => listMarketplaceCountries(), []);

  const regions = useMemo(
    () => (pendingCountry ? getRegionsForCountry(pendingCountry, states) : []),
    [pendingCountry, states],
  );

  // Pre-fill if user already has a location
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

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  const goToStep = (next: LocStep, dir: 'forward' | 'back') => {
    setStepDir(dir);
    setStep(next);
  };

  const goBackWithinFlow = () => {
    if (step === 'city') {
      setCitySearch('');
      if (pendingCountry === 'Australia') {
        goToStep('region', 'back');
      } else {
        goToStep('country', 'back');
        setPendingState('');
        setPendingCountry('');
      }
      return;
    }
    if (step === 'region') {
      goToStep('country', 'back');
      setPendingState('');
      setPendingCountry('');
    }
  };

  // ---------------------------------------------------------------------------
  // Selection handlers
  // ---------------------------------------------------------------------------

  const selectMarketplaceCountry = (countryName: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    resetGpsCountry();
    setPendingCountry(countryName);
    setCitySearch('');
    const regs = getRegionsForCountry(countryName, states);
    if (regs.length === 1) {
      setPendingState(regs[0].code);
      goToStep('city', 'forward');
    } else {
      setPendingState('');
      goToStep('region', 'forward');
    }
  };

  const selectRegion = (stateCode: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setPendingState(stateCode);
    setCitySearch('');
    goToStep('city', 'forward');
  };

  const selectCity = (city: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const c = pendingCountry || state.country || 'Australia';
    setCountry(c);
    setCity(city);
    void syncUserMarketplaceLocation(user?.id, c, city);
  };

  // ---------------------------------------------------------------------------
  // GPS handlers
  // ---------------------------------------------------------------------------

  const handleDetectCountry = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await detectCountry();
    if (result.country) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (result.status === 'denied') {
        Alert.alert(
          'Location Permission Required',
          'Please allow location access to detect your country, or select it manually below.',
        );
      } else if (result.status === 'unavailable') {
        Alert.alert(
          'Location Services Off',
          'Turn on location services to auto-detect your country, or select it manually.',
        );
      }
    }
  };

  const handleDetectCity = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const r = await detectCity();
    if (r) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCountry('Australia');
      setCity(r.city);
      setPendingCountry('Australia');
      void syncUserMarketplaceLocation(user?.id, 'Australia', r.city);
      const stateCode = getStateForCity(r.city);
      if (stateCode) setPendingState(stateCode);
      goToStep('city', 'forward');
    } else {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (cityDetectStatus === 'denied') {
        Alert.alert(
          'Location Permission Required',
          'Please allow location access to detect your city automatically, or select it manually below.',
        );
      } else if (cityDetectStatus === 'unavailable') {
        Alert.alert(
          'Location Services Off',
          'Turn on location services to auto-detect your city, or select it manually below.',
        );
      } else {
        Alert.alert('Could Not Detect Location', 'We could not detect your city. Please choose your city manually.');
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Finish
  // ---------------------------------------------------------------------------

  const handleNext = () => {
    if (state.country && state.city) {
      router.replace(routeWithRedirect('/(onboarding)/communities', redirectTo) as string);
      return;
    }
    Alert.alert('Select Location', 'Please choose your state and city to continue.');
  };

  // ---------------------------------------------------------------------------
  // Derived UI values
  // ---------------------------------------------------------------------------

  const pendingRegionMeta = useMemo(
    () => regions.find((r) => r.code === pendingState),
    [regions, pendingState],
  );

  const allCitiesForState = useMemo(() => pendingRegionMeta?.cities ?? [], [pendingRegionMeta]);

  const citiesToShow = useMemo(() => {
    if (!citySearch.trim()) return allCitiesForState;
    const q = citySearch.trim().toLowerCase();
    return allCitiesForState.filter((c) => c.toLowerCase().includes(q));
  }, [allCitiesForState, citySearch]);

  const breadcrumbItems = useMemo(() => {
    const items: { label: string; active: boolean; done: boolean }[] = [
      {
        label: pendingCountry || 'Country',
        active: step === 'country',
        done: step !== 'country' && !!pendingCountry,
      },
    ];
    if (step !== 'country') {
      items.push({
        label: pendingRegionMeta?.name || 'State',
        active: step === 'region',
        done: step === 'city' && !!pendingState,
      });
    }
    if (step === 'city') {
      items.push({
        label: state.city || 'City',
        active: step === 'city',
        done: false,
      });
    }
    return items;
  }, [step, pendingCountry, pendingRegionMeta, pendingState, state.city]);

  const stepEntering =
    stepDir === 'forward'
      ? FadeInRight.duration(260).springify().damping(22).stiffness(130)
      : FadeInLeft.duration(260).springify().damping(22).stiffness(130);

  const enter = (delay: number) => FadeInDown.delay(delay).springify().damping(20).stiffness(120);

  // ---------------------------------------------------------------------------
  // GPS country suggestion slot (shown at top of country list)
  // Plain render — no useMemo so onPress always has a fresh handler reference.
  // ---------------------------------------------------------------------------

  const renderGpsSuggestionSlot = () => {
    if (gpsCountry) {
      return (
        <Pressable
          style={({ pressed }) => [
            s.gpsSuggestCard,
            {
              backgroundColor: pressed ? `${CultureTokens.teal}28` : `${CultureTokens.teal}18`,
              borderColor: pressed ? `${CultureTokens.teal}90` : `${CultureTokens.teal}55`,
            },
          ]}
          onPress={() => selectMarketplaceCountry(gpsCountry)}
          accessibilityRole="button"
          accessibilityLabel={`Use suggested country: ${gpsCountry}`}
        >
          <View style={[s.gpsSuggestIconWrap, { backgroundColor: `${CultureTokens.teal}22` }]}>
            <Ionicons name="navigate-circle" size={22} color={CultureTokens.teal} />
          </View>
          <View style={s.gpsSuggestTextWrap}>
            <Text style={s.gpsSuggestEyebrow}>Suggested for you</Text>
            <Text style={s.gpsSuggestCountry}>
              {getCountryFlag(gpsCountry)}{'  '}{gpsCountry}
            </Text>
            <Text style={s.gpsSuggestSub}>Based on your GPS · tap to select</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={`${CultureTokens.teal}80`} />
        </Pressable>
      );
    }

    return (
      <Pressable
        style={({ pressed }) => [
          s.detectBtn,
          {
            backgroundColor: pressed ? `${CultureTokens.teal}28` : `${CultureTokens.teal}14`,
            borderColor: pressed ? `${CultureTokens.teal}90` : `${CultureTokens.teal}55`,
          },
          isDetectingCountry && { opacity: 0.65 },
        ]}
        onPress={handleDetectCountry}
        disabled={isDetectingCountry}
        accessibilityRole="button"
        accessibilityLabel={isDetectingCountry ? 'Detecting country' : 'Detect my location'}
      >
        {isDetectingCountry ? (
          <ActivityIndicator size="small" color={CultureTokens.teal} />
        ) : (
          <Ionicons name="navigate-circle" size={22} color={CultureTokens.teal} />
        )}
        <View style={s.detectBtnTextWrap}>
          <Text style={[s.detectBtnPrimary, { color: CultureTokens.teal }]}>
            {isDetectingCountry ? 'Detecting…' : 'Detect my location'}
          </Text>
          {!isDetectingCountry && (
            <Text style={[s.detectBtnSub, { color: `${CultureTokens.teal}99` }]}>
              Use GPS to suggest your country
            </Text>
          )}
        </View>
        {!isDetectingCountry && (
          <Ionicons name="chevron-forward" size={16} color={`${CultureTokens.teal}80`} />
        )}
      </Pressable>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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

      {/* Desktop Back Button */}
      {isDesktop && (
        <View style={s.desktopBackRow}>
          <Pressable
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace(routeWithRedirect('/(onboarding)/signup', redirectTo) as string)
            }
            style={[s.desktopBackBtn, { backgroundColor: glass.overlay.backgroundColor, borderColor: 'rgba(255,255,255,0.20)' }]}
            hitSlop={Spacing.sm}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={IconSize.md - 2} color="#FFFFFF" />
            <Text style={[s.desktopBackText, { color: '#FFFFFF' }]}>Back</Text>
          </Pressable>
        </View>
      )}

      {/* Mobile Header */}
      {!isDesktop && (
        <View style={[s.mobileHeader, { paddingTop: insets.top + Spacing.sm + 4 }]}>
          <Pressable
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace(routeWithRedirect('/(onboarding)/signup', redirectTo) as string)
            }
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={s.mobileBackBtn}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </Pressable>

          <View style={s.stepIndicatorWrap}>
            <Text style={[s.stepText, { color: 'rgba(255,255,255,0.6)' }]}>Step 1 of 4</Text>
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, progressBarStyle]} />
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[s.scrollContent, isDesktop && s.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={enter(40)} style={[s.formContainer, isDesktop && s.formContainerDesktop]}>
          <View style={[StyleSheet.absoluteFill, s.formBlur, { borderRadius: 32 }]} />

          <View style={s.formContent}>

            {/* Breadcrumb — shown after country is chosen */}
            {step !== 'country' && (
              <Animated.View entering={FadeIn.duration(240)} style={s.breadcrumbRow}>
                {breadcrumbItems.map((item, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.35)" />
                    )}
                    <Text
                      style={[
                        s.breadcrumbSegment,
                        item.done && s.breadcrumbDone,
                        item.active && s.breadcrumbActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </React.Fragment>
                ))}
              </Animated.View>
            )}

            {/* Desktop step progress dots */}
            {isDesktop && (
              <Animated.View entering={enter(0)} style={s.desktopStepRow}>
                {STEPS.map((st, i) => {
                  const isDone = i < stepIndex;
                  const isActive = i === stepIndex;
                  return (
                    <React.Fragment key={st}>
                      <View style={s.desktopStepItem}>
                        <View
                          style={[
                            s.desktopStepDot,
                            isDone && { backgroundColor: CultureTokens.teal, borderColor: CultureTokens.teal },
                            isActive && { borderColor: CultureTokens.gold, borderWidth: 2.5 },
                          ]}
                        >
                          {isDone ? (
                            <Ionicons name="checkmark" size={10} color="#fff" />
                          ) : (
                            <View style={[s.desktopDotInner, isActive && { backgroundColor: CultureTokens.gold }]} />
                          )}
                        </View>
                        <Text style={[s.desktopStepLabel, isActive && { color: 'rgba(255,255,255,0.9)' }]}>
                          {STEP_LABELS[i]}
                        </Text>
                      </View>
                      {i < STEPS.length - 1 && (
                        <View style={[s.desktopStepLine, isDone && { backgroundColor: CultureTokens.teal }]} />
                      )}
                    </React.Fragment>
                  );
                })}
              </Animated.View>
            )}

            {/* Step icon + title */}
            <View style={s.headerBlock}>
              <View style={[s.iconWrapper, { borderColor: CultureTokens.teal, backgroundColor: `${CultureTokens.teal}18` }]}>
                <Animated.View key={step} entering={FadeIn.duration(200)}>
                  <Ionicons name={STEP_ICON[step] as any} size={34} color={CultureTokens.teal} />
                </Animated.View>
              </View>
              <Text style={[s.title, { color: '#FFFFFF' }]}>{STEP_TITLE[step](pendingCountry)}</Text>
              <Text style={s.subtitle}>{STEP_SUBTITLE[step]}</Text>
            </View>

            {/* Step content */}
            <Animated.View key={step} entering={stepEntering}>

              {/* ── Country Step ── */}
              {step === 'country' && (
                <CountrySelectList
                  countries={countries}
                  selectedName={state.country || undefined}
                  onSelect={selectMarketplaceCountry}
                  variant="onboarding"
                  colors={colors}
                  showFooterHint={false}
                  leadingSlot={renderGpsSuggestionSlot()}
                />
              )}

              {/* ── Region Step ── */}
              {step === 'region' && (
                <View>
                  {/* GPS city detect — AU only */}
                  {pendingCountry === 'Australia' && (
                    <Pressable
                      style={({ pressed }) => [
                        s.detectBtn,
                        {
                          backgroundColor: pressed ? `${CultureTokens.gold}2E` : `${CultureTokens.gold}14`,
                          borderColor: pressed ? `${CultureTokens.gold}90` : `${CultureTokens.gold}55`,
                        },
                        isDetectingCity && { opacity: 0.65 },
                      ]}
                      onPress={handleDetectCity}
                      disabled={isDetectingCity}
                      accessibilityLabel={isDetectingCity ? 'Detecting location' : 'Detect my location'}
                      accessibilityRole="button"
                    >
                      {isDetectingCity ? (
                        <ActivityIndicator size="small" color={CultureTokens.gold} />
                      ) : (
                        <Ionicons name="navigate-circle" size={22} color={CultureTokens.gold} />
                      )}
                      <View style={s.detectBtnTextWrap}>
                        <Text style={[s.detectBtnPrimary, { color: CultureTokens.gold }]}>
                          {isDetectingCity ? 'Detecting…' : 'Use my location'}
                        </Text>
                        {!isDetectingCity && (
                          <Text style={[s.detectBtnSub, { color: `${CultureTokens.gold}99` }]}>
                            Auto-detect your nearest city
                          </Text>
                        )}
                      </View>
                      {!isDetectingCity && (
                        <Ionicons name="chevron-forward" size={16} color={`${CultureTokens.gold}80`} />
                      )}
                    </Pressable>
                  )}

                  {pendingCountry === 'Australia' && locationsLoading && (
                    <ActivityIndicator size="large" color={CultureTokens.indigo} style={{ paddingVertical: 20 }} />
                  )}

                  {pendingCountry === 'Australia' && !!locationsError && (
                    <View style={[s.errorBanner, { backgroundColor: `${CultureTokens.coral}20`, borderColor: `${CultureTokens.coral}50` }]}>
                      <Ionicons name="alert-circle" size={IconSize.md} color={CultureTokens.coral} />
                      <Text style={[s.errorText, { color: CultureTokens.coral }]}>Failed to load locations.</Text>
                    </View>
                  )}

                  {pendingCountry === 'Australia' && !locationsLoading && (
                    <View style={s.orDivider}>
                      <View style={s.orDividerLine} />
                      <Text style={s.orDividerText}>or choose a state</Text>
                      <View style={s.orDividerLine} />
                    </View>
                  )}

                  <View style={s.stateGrid}>
                    {regions.map((st) => {
                      const isSelected = st.code === pendingState;
                      return (
                        <Pressable
                          key={st.code}
                          style={({ pressed }) => [
                            s.stateCard,
                            {
                              backgroundColor: isSelected
                                ? `${CultureTokens.teal}20`
                                : pressed
                                  ? `${CultureTokens.teal}12`
                                  : 'rgba(255,255,255,0.05)',
                              borderColor: isSelected
                                ? `${CultureTokens.teal}80`
                                : pressed
                                  ? `${CultureTokens.teal}40`
                                  : 'rgba(255,255,255,0.12)',
                              borderWidth: isSelected ? 1.5 : 1,
                            },
                          ]}
                          onPress={() => selectRegion(st.code)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected }}
                          accessibilityLabel={`${st.name}, ${st.cities.length} cities`}
                        >
                          <Text style={s.stateEmoji}>{st.emoji}</Text>
                          <Text style={[s.stateName, { color: isSelected ? CultureTokens.teal : '#FFFFFF' }]}>
                            {st.name}
                          </Text>
                          <Text style={[s.cityCount, { color: 'rgba(255,255,255,0.50)' }]}>
                            {st.cities.length} cities
                          </Text>
                          {isSelected && (
                            <View style={[s.stateCheckBadge, { backgroundColor: CultureTokens.teal }]}>
                              <Ionicons name="checkmark" size={10} color="#fff" />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* ── City Step ── */}
              {step === 'city' && (
                <View>
                  <View
                    style={[
                      s.searchRow,
                      { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' },
                    ]}
                  >
                    <Ionicons name="search" size={IconSize.sm + 2} color="rgba(255,255,255,0.45)" />
                    <TextInput
                      style={[s.searchInput, { color: '#FFFFFF' }]}
                      placeholder={`Search ${allCitiesForState.length} cities…`}
                      placeholderTextColor="rgba(255,255,255,0.38)"
                      value={citySearch}
                      onChangeText={setCitySearch}
                      autoCorrect={false}
                      autoCapitalize="words"
                      returnKeyType="search"
                      clearButtonMode="while-editing"
                      selectionColor={CultureTokens.gold}
                      underlineColorAndroid="transparent"
                    />
                    {citySearch.length > 0 && Platform.OS !== 'ios' && (
                      <Pressable onPress={() => setCitySearch('')} hitSlop={8} accessibilityLabel="Clear search">
                        <Ionicons name="close-circle" size={IconSize.sm + 2} color="rgba(255,255,255,0.45)" />
                      </Pressable>
                    )}
                  </View>

                  {citiesToShow.length === 0 ? (
                    <View style={s.noResults}>
                      <Ionicons name="search-outline" size={36} color="rgba(255,255,255,0.35)" />
                      <Text style={[s.noResultsText, { color: 'rgba(255,255,255,0.55)' }]}>
                        {`No cities match "${citySearch}"`}
                      </Text>
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
                                  : pressed
                                    ? `${CultureTokens.indigo}22`
                                    : 'rgba(255,255,255,0.05)',
                                borderColor: isActive
                                  ? CultureTokens.indigo
                                  : pressed
                                    ? `${CultureTokens.indigo}55`
                                    : 'rgba(255,255,255,0.12)',
                                borderWidth: isActive ? 1.5 : 1,
                              },
                            ]}
                            onPress={() => selectCity(city)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: isActive }}
                            accessibilityLabel={city}
                          >
                            {isActive ? (
                              <Ionicons name="checkmark-circle" size={IconSize.md - 2} color="#fff" />
                            ) : (
                              <Ionicons name="location-outline" size={IconSize.md - 2} color="rgba(255,255,255,0.40)" />
                            )}
                            <Text
                              style={[
                                s.cityName,
                                {
                                  color: isActive ? '#fff' : 'rgba(255,255,255,0.90)',
                                  fontFamily: isActive ? FontFamily.semibold : FontFamily.medium,
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {city}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </Animated.View>

            {/* Back-within-flow link */}
            {step !== 'country' && (
              <Animated.View entering={FadeIn.duration(200)} style={s.backLinkRow}>
                <Pressable
                  onPress={goBackWithinFlow}
                  style={({ pressed }) => [s.backLink, { opacity: pressed ? 0.6 : 1 }]}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={`Back to ${
                    step === 'city'
                      ? pendingCountry === 'Australia'
                        ? 'state'
                        : 'country'
                      : 'country'
                  }`}
                >
                  <Ionicons name="arrow-back" size={14} color={`${CultureTokens.gold}CC`} />
                  <Text style={[s.backLinkText, { color: `${CultureTokens.gold}CC` }]}>
                    {step === 'city'
                      ? `Back to ${pendingCountry === 'Australia' ? 'states' : 'countries'}`
                      : 'Back to countries'}
                  </Text>
                </Pressable>
              </Animated.View>
            )}

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

            {(!state.country || !state.city) && (
              <Text style={s.continueHint}>
                {step === 'country'
                  ? 'Select a country to continue'
                  : step === 'region'
                    ? 'Select your state to continue'
                    : 'Choose a city to continue'}
              </Text>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: { flex: 1 },
  gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.85 },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    ...Platform.select({ web: { filter: 'blur(50px)' } as any }),
  },

  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 80,
    justifyContent: 'center',
  },
  scrollContentDesktop: { paddingVertical: 80 },

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

  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: Spacing.sm + 4,
    gap: 12,
  },
  mobileBackBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  stepIndicatorWrap: { flex: 1, alignItems: 'flex-end', gap: 6 },
  stepText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.chip,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  progressTrack: {
    width: 80,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: CultureTokens.gold },

  // Desktop step stepper
  desktopStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    gap: 0,
  },
  desktopStepItem: { alignItems: 'center', gap: 6 },
  desktopStepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  desktopDotInner: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  desktopStepLabel: { fontFamily: FontFamily.medium, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.3 },
  desktopStepLine: {
    width: 40,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 18,
    marginHorizontal: 6,
  },

  formContainer: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 32,
  },
  formContainerDesktop: { maxWidth: 520 },

  formBlur: {
    backgroundColor: 'rgba(20,20,35,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  formContent: { padding: 28 },

  // Breadcrumb
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
    flexWrap: 'nowrap',
  },
  breadcrumbSegment: { fontFamily: FontFamily.medium, fontSize: 12, color: 'rgba(255,255,255,0.35)', flexShrink: 1 },
  breadcrumbDone: { color: CultureTokens.teal },
  breadcrumbActive: { color: 'rgba(255,255,255,0.85)', fontFamily: FontFamily.semibold },

  // Header
  headerBlock: { alignItems: 'center', marginBottom: 24 },
  iconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1.5,
  },
  title: { ...TextStyles.display, fontSize: 28, textAlign: 'center', marginBottom: Spacing.xs },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.65)',
    maxWidth: 320,
  },

  // GPS suggestion card (country detected)
  gpsSuggestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: CardTokens.radius,
    borderWidth: 1.5,
    minHeight: 72,
  },
  gpsSuggestIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsSuggestTextWrap: { flex: 1, gap: 2 },
  gpsSuggestEyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: `${CultureTokens.teal}BB`,
  },
  gpsSuggestCountry: { fontFamily: FontFamily.bold, fontSize: FontSize.body, color: '#FFFFFF', letterSpacing: -0.2 },
  gpsSuggestSub: { fontFamily: FontFamily.regular, fontSize: 12, color: `${CultureTokens.teal}CC` },

  // GPS detect button (before detection)
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: CardTokens.radius,
    borderWidth: 1.5,
    marginBottom: 16,
    minHeight: 64,
  },
  detectBtnTextWrap: { flex: 1 },
  detectBtnPrimary: { fontFamily: FontFamily.bold, fontSize: FontSize.body2, letterSpacing: 0.3 },
  detectBtnSub: { fontFamily: FontFamily.regular, fontSize: 12, marginTop: 2 },

  // Or divider
  orDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  orDividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  orDividerText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

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

  // Back link
  backLinkRow: { marginTop: Spacing.md, alignItems: 'flex-start' },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 36 },
  backLinkText: { fontFamily: FontFamily.semibold, fontSize: 13 },

  // State grid
  stateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: CardTokens.radius,
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderWidth: 1,
    width: '47.5%',
    position: 'relative',
    minHeight: 90,
  },
  stateEmoji: { fontSize: 32 },
  stateName: { fontFamily: FontFamily.semibold, fontSize: FontSize.body2, textAlign: 'center' },
  cityCount: { fontFamily: FontFamily.regular, fontSize: FontSize.chip, textAlign: 'center' },
  stateCheckBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // City search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: CardTokens.radius,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    marginBottom: Spacing.md,
    minHeight: 50,
  },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.body2, padding: 0 },
  noResults: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  noResultsText: { fontFamily: FontFamily.regular, fontSize: FontSize.body2, textAlign: 'center' },
  noResultsClear: { fontFamily: FontFamily.semibold, fontSize: FontSize.body2, marginTop: 4 },

  // City grid
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: CardTokens.radius,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    width: '47.5%',
    minHeight: 48,
  },
  cityName: { flex: 1, fontSize: FontSize.body2 },

  spacer: { height: Spacing.lg },
  submitBtn: { height: 58, borderRadius: 20 },
  continueHint: {
    textAlign: 'center',
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 10,
  },
});
