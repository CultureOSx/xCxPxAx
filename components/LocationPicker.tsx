import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ActivityIndicator,
  TextInput,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { syncUserMarketplaceLocation } from '@/lib/syncMarketplaceLocation';
import { useColors } from '@/hooks/useColors';
import { useLocations } from '@/hooks/useLocations';
import { useNearestCity } from '@/hooks/useNearestCity';
import {
  getCountryFlag,
  getCountryForCity,
  getRegionsForCountry,
  listMarketplaceCountries,
} from '@/lib/marketplaceLocation';
import { CountrySelectList } from '@/components/location/CountrySelectList';
import { CultureTokens } from '@/constants/theme';

const isWeb = Platform.OS === 'web';

function nativeCardShadow(colors: { primary: string }): ViewStyle {
  return (
    Platform.select<ViewStyle>({
      web: { boxShadow: '0px 2px 9px rgba(0,0,0,0.08)' } as ViewStyle,
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: { elevation: 2 },
    }) ?? {}
  );
}

export interface LocationPickerProps {
  variant?: 'icon' | 'full' | 'text';
  iconColor?: string;
  buttonStyle?: ViewStyle;
  textColor?: string;
}

type Step = 'country' | 'region' | 'city';

export function LocationPicker({ variant = 'full', iconColor, buttonStyle, textColor }: LocationPickerProps) {
  const { user } = useAuth();
  const { state, updateLocation } = useOnboarding();
  const colors = useColors();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { states, getStateForCity, isLoading: locationsLoading, error: locationsError } = useLocations();
  const { detect, status: detectStatus } = useNearestCity();
  const isDetecting = detectStatus === 'requesting';
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>('country');
  const [pendingCountry, setPendingCountry] = useState('');
  const [pendingState, setPendingState] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const insets = useSafeAreaInsets();
  const topInset = isWeb ? 0 : insets.top;
  const bottomInsetNative = isWeb ? 0 : Math.max(insets.bottom, 12);
  const listPadBottom = isWeb ? 80 : bottomInsetNative + 28;

  const scrollCommon = useMemo(
    () => ({
      keyboardShouldPersistTaps: 'handled' as const,
      keyboardDismissMode: (Platform.OS === 'ios' ? 'interactive' : 'on-drag') as 'interactive' | 'on-drag',
      showsVerticalScrollIndicator: false,
      automaticallyAdjustKeyboardInsets: Platform.OS === 'ios',
    }),
    [],
  );

  const countries = useMemo(() => listMarketplaceCountries(), []);

  const open = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('country');
    setPendingCountry('');
    setPendingState('');
    setCitySearch('');
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisible(false);
  }, []);

  const selectCountry = useCallback(
    (countryName: string) => {
      Haptics.selectionAsync();
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
    },
    [states],
  );

  const selectRegion = useCallback((code: string) => {
    Haptics.selectionAsync();
    setPendingState(code);
    setCitySearch('');
    setStep('city');
  }, []);

  const selectCity = useCallback(
    async (city: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const country = pendingCountry || state.country || 'Australia';
      await updateLocation(country, city);
      void syncUserMarketplaceLocation(user?.id, country, city);
      setVisible(false);
    },
    [pendingCountry, state.country, updateLocation, user?.id],
  );

  const handleDetectLocation = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const r = await detect();
    if (r) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateLocation('Australia', r.city);
      void syncUserMarketplaceLocation(user?.id, 'Australia', r.city);
      setVisible(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [detect, updateLocation, user?.id]);

  const regions = useMemo(
    () => (pendingCountry ? getRegionsForCountry(pendingCountry, states) : []),
    [pendingCountry, states],
  );

  const pendingRegionMeta = useMemo(
    () => regions.find((r) => r.code === pendingState),
    [regions, pendingState],
  );

  const citiesFiltered = useMemo(() => {
    const list = pendingRegionMeta?.cities ?? [];
    const q = citySearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => c.toLowerCase().includes(q));
  }, [pendingRegionMeta, citySearch]);

  const resolvedCountry =
    state.country || (state.city ? getCountryForCity(state.city) : '') || 'Australia';

  const homeRegions = useMemo(
    () => getRegionsForCountry(resolvedCountry, states),
    [resolvedCountry, states],
  );

  const currentStateCode = state.city ? getStateForCity(state.city) : undefined;
  const currentStateMeta = useMemo(
    () => (currentStateCode ? homeRegions.find((r) => r.code === currentStateCode) : undefined),
    [homeRegions, currentStateCode],
  );

  const country = resolvedCountry;
  const countryFlag = getCountryFlag(country);
  const headerFlag = getCountryFlag(pendingCountry || state.country || 'Australia');

  const locationLabel = state.city
    ? `${state.city}${
        currentStateCode && resolvedCountry === 'Australia' && currentStateMeta
          ? `, ${currentStateMeta.code}`
          : ''
      } · ${country}`
    : 'Select Location';

  const modalTitle =
    step === 'country' ? 'Country' : step === 'region' ? 'State or region' : 'City';

  const headerBack = () => {
    if (step === 'city') {
      setCitySearch('');
      if (pendingCountry === 'Australia') {
        setStep('region');
      } else {
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
      return;
    }
    close();
  };

  return (
    <View style={styles.pickerRoot}>
      {variant === 'text' ? (
        <Pressable
          style={styles.textTrigger}
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={state.city ? `Location: ${state.city}, ${country}. Tap to change` : 'Select location'}
        >
          <Text style={styles.textTriggerFlag}>{state.city ? countryFlag : '📍'}</Text>
          <Text style={[styles.textTriggerLabel, { color: textColor ?? colors.textSecondary }]} numberOfLines={1}>
            {locationLabel}
          </Text>
          <Ionicons name="chevron-down" size={12} color={textColor ?? colors.textTertiary} />
        </Pressable>
      ) : variant === 'icon' ? (
        <Pressable
          style={[
            styles.iconTrigger,
            { backgroundColor: 'rgba(255,255,255,0.15)' },
            buttonStyle,
          ]}
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={state.city ? `Location: ${state.city}, ${country}. Tap to change` : 'Select location'}
        >
          {state.city ? (
            <Text style={[styles.flagEmoji, { fontSize: 20 }]}>{countryFlag}</Text>
          ) : (
            <Ionicons name="location-outline" size={20} color={iconColor ?? '#fff'} />
          )}
        </Pressable>
      ) : (
        <Pressable
          style={[styles.trigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={open}
        >
          <View style={[styles.triggerDot, { backgroundColor: colors.primary }]}>
            <Text style={styles.triggerFlag}>{state.city ? countryFlag : '📍'}</Text>
          </View>
          <Text style={[styles.triggerText, { color: colors.text }]} numberOfLines={1}>
            {locationLabel}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textTertiary} />
        </Pressable>
      )}

      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={close}
        transparent={isWeb}
        statusBarTranslucent={Platform.OS === 'android'}
        {...(Platform.OS === 'ios' ? { presentationStyle: 'pageSheet' as const } : {})}
      >
        <View style={[styles.modal, { flex: 1, backgroundColor: colors.background }]}>
          {Platform.OS === 'ios' && (
            <BlurView
              intensity={60}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          )}

          <KeyboardAvoidingView
            style={styles.kavRoot}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            enabled={!isWeb}
          >
            <View
              style={[
                styles.modalInner,
                {
                  flex: 1,
                  paddingTop: topInset + 10,
                  paddingBottom: isWeb ? 0 : bottomInsetNative,
                },
              ]}
            >
            <View style={[styles.handle, { backgroundColor: colors.borderLight }]} />

            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable
                onPress={headerBack}
                hitSlop={14}
                {...(Platform.OS === 'android'
                  ? { android_ripple: { color: colors.primarySoft, borderless: true } }
                  : {})}
                style={({ pressed }) => [
                  styles.headerBtn,
                  styles.headerHit,
                  pressed && Platform.OS === 'ios' ? { opacity: 0.75 } : null,
                ]}
              >
                <Ionicons
                  name={step === 'country' ? 'close' : 'chevron-back'}
                  size={24}
                  color={colors.text}
                />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.text }]} accessibilityRole="header" aria-level={2}>
                {modalTitle}
              </Text>
              <Text style={styles.modalFlag}>{headerFlag}</Text>
            </View>

            {step === 'country' ? (
              <ScrollView
                {...scrollCommon}
                contentContainerStyle={[styles.listContent, { paddingBottom: listPadBottom }]}
              >
                <CountrySelectList
                  key="country-step"
                  countries={countries}
                  selectedName={state.country || undefined}
                  onSelect={selectCountry}
                  variant="sheet"
                  colors={colors}
                  introTitle="Where are you based?"
                  introSubtitle="We scope events, member perks, and search to your country. You can refine city in the next steps."
                  leadingSlot={
                    state.city ? (
                      <View
                        style={[
                          styles.currentLocationPill,
                          { backgroundColor: colors.primarySoft, borderColor: colors.primary + '40' },
                        ]}
                      >
                        <Text style={styles.currentLocationFlag}>{countryFlag}</Text>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.currentLocationLabel, { color: colors.textTertiary }]}>
                            Current selection
                          </Text>
                          <Text style={[styles.currentLocationCity, { color: colors.text }]} numberOfLines={1}>
                            {state.city}
                          </Text>
                          <Text style={[styles.currentLocationCountry, { color: colors.textSecondary }]}>{country}</Text>
                        </View>
                      </View>
                    ) : null
                  }
                />
              </ScrollView>
            ) : null}

            {step === 'region' ? (
              <ScrollView
                {...scrollCommon}
                contentContainerStyle={[styles.listContent, { paddingBottom: listPadBottom }]}
              >
                {pendingCountry === 'Australia' ? (
                  <>
                    <Pressable
                      style={[
                        styles.detectBtn,
                        {
                          backgroundColor: colors.primarySoft,
                          borderColor: colors.primary,
                          opacity: isDetecting ? 0.7 : 1,
                        },
                      ]}
                      onPress={handleDetectLocation}
                      disabled={isDetecting}
                      {...(Platform.OS === 'android'
                        ? { android_ripple: { color: `${CultureTokens.indigo}33`, borderless: false } }
                        : {})}
                    >
                      {isDetecting ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Ionicons name="navigate" size={18} color={colors.primary} />
                      )}
                      <Text style={[styles.detectBtnText, { color: colors.primary }]}>
                        {isDetecting ? 'Detecting location…' : 'Use my location (Australia)'}
                      </Text>
                    </Pressable>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Or choose your state</Text>
                    {locationsLoading && (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading locations…</Text>
                      </View>
                    )}
                    {!!locationsError && (
                      <Text style={[styles.feedbackText, { color: colors.error }]}>
                        Couldn&apos;t load updated locations. Showing fallback list.
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Choose a region in {pendingCountry}
                  </Text>
                )}

                {regions.map((s) => {
                  const isActive = s.code === currentStateCode && state.country === pendingCountry;
                  return (
                    <Pressable
                      key={s.code}
                      style={[
                        styles.stateCard,
                        {
                          backgroundColor: isActive ? colors.primarySoft : colors.surface,
                          borderColor: isActive ? colors.primary : colors.borderLight,
                          ...nativeCardShadow(colors),
                        },
                      ]}
                      onPress={() => selectRegion(s.code)}
                      {...(Platform.OS === 'android'
                        ? { android_ripple: { color: `${CultureTokens.indigo}22`, borderless: false } }
                        : {})}
                    >
                      <Text style={styles.stateEmoji}>{s.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stateName, { color: isActive ? colors.primary : colors.text }]}>{s.name}</Text>
                        <Text style={[styles.cityCount, { color: colors.textSecondary }]}>{s.cities.length} cities</Text>
                      </View>
                      {isActive ? (
                        <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      ) : null}
                      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {step === 'city' ? (
              <ScrollView
                {...scrollCommon}
                contentContainerStyle={[styles.listContent, { paddingBottom: listPadBottom }]}
              >
                <View style={styles.selectedStateRow}>
                  <Text style={styles.stateEmoji}>{pendingRegionMeta?.emoji}</Text>
                  <Text style={[styles.selectedStateText, { color: colors.text }]}>{pendingRegionMeta?.name}</Text>
                  <Text style={[styles.cityCount, { color: colors.textSecondary }]}> · {pendingCountry}</Text>
                </View>

                <View
                  style={[
                    styles.citySearchRow,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
                  ]}
                >
                  <Ionicons name="search" size={18} color={colors.textTertiary} />
                  <TextInput
                    style={[styles.citySearchInput, { color: colors.text }]}
                    placeholder="Search cities…"
                    placeholderTextColor={colors.textTertiary}
                    value={citySearch}
                    onChangeText={setCitySearch}
                    autoCorrect={false}
                    autoCapitalize="words"
                    returnKeyType="search"
                    accessibilityLabel="Filter cities"
                    selectionColor={CultureTokens.indigo}
                    underlineColorAndroid="transparent"
                    {...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : {})}
                  />
                  {citySearch.length > 0 ? (
                    <Pressable onPress={() => setCitySearch('')} hitSlop={8} accessibilityLabel="Clear city search">
                      <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </Pressable>
                  ) : null}
                </View>

                {citiesFiltered.length === 0 ? (
                  <Text style={[styles.feedbackText, { color: colors.textSecondary, textAlign: 'center' }]}>
                    No cities match. Try another spelling.
                  </Text>
                ) : (
                  <View style={styles.cityGrid}>
                    {citiesFiltered.map((city) => {
                      const isActive = state.city === city && state.country === pendingCountry;
                      const cf = getCountryFlag(pendingCountry);
                      return (
                        <Pressable
                          key={city}
                          style={[
                            styles.cityCard,
                            {
                              backgroundColor: isActive ? colors.primary : colors.surface,
                              borderColor: isActive ? colors.primary : colors.borderLight,
                              ...nativeCardShadow(colors),
                            },
                          ]}
                          onPress={() => selectCity(city)}
                          {...(Platform.OS === 'android'
                            ? {
                                android_ripple: {
                                  color: isActive ? 'rgba(255,255,255,0.2)' : `${CultureTokens.indigo}18`,
                                  borderless: false,
                                },
                              }
                            : {})}
                        >
                          <Text style={styles.cityCardFlag}>{cf}</Text>
                          <Text style={[styles.cityName, { color: isActive ? '#FFF' : colors.text }]}>{city}</Text>
                          {isActive ? <Ionicons name="checkmark-circle" size={20} color="#FFF" /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            ) : null}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerRoot: {
    ...Platform.select({
      web: { alignSelf: 'center' as const },
      default: { alignSelf: 'flex-start' as const },
    }),
  },
  iconTrigger: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
  },
  triggerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    maxWidth: 170,
  },
  kavRoot: {
    flex: 1,
  },
  modal: {
    flex: 1,
    ...Platform.select({
      web: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  modalInner: {
    flex: 1,
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 480,
        maxHeight: '85%',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
      },
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 4,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerHit: {
    ...Platform.select({
      ios: { minWidth: 44, minHeight: 44 },
      default: {},
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  modalFlag: {
    fontSize: 28,
    width: 44,
    textAlign: 'center',
  },
  flagEmoji: {},
  triggerFlag: {
    fontSize: 14,
  },
  currentLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  currentLocationFlag: {
    fontSize: 28,
  },
  currentLocationLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  currentLocationCity: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  currentLocationCountry: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
  },
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 16,
    marginBottom: 20,
  },
  detectBtnText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 18,
    lineHeight: 22,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  feedbackText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 10,
    lineHeight: 17,
  },
  listContent: {
    padding: 24,
    paddingBottom: 80,
  },
  stateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  stateEmoji: {
    fontSize: 26,
  },
  stateName: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  cityCount: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFF',
  },
  selectedStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  selectedStateText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  citySearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  citySearchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    padding: 0,
    minWidth: 0,
  },
  cityGrid: {
    gap: 12,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  cityCardFlag: {
    fontSize: 22,
  },
  cityName: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  textTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  textTriggerFlag: {
    fontSize: 15,
    lineHeight: 20,
  },
  textTriggerLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 20,
  },
});
