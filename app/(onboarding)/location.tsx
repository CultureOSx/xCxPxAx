import React, { useState, useEffect } from 'react';
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

export default function LocationScreen() {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const { state, setCountry, setCity } = useOnboarding();
  const { states, citiesByState, getStateForCity, isLoading: locationsLoading, error: locationsError } = useLocations();
  const { detect, status: detectStatus } = useNearestCity();
  const isDetecting = detectStatus === 'requesting';

  const [step, setStep] = useState<'state' | 'city'>('state');
  const [pendingState, setPendingState] = useState('');

  useEffect(() => {
    if (state.city) {
      const stateCode = getStateForCity(state.city);
      if (stateCode) {
        setPendingState(stateCode);
        setStep('city');
      }
    }
  }, [state.city, getStateForCity]);

  const selectState = (stateCode: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setPendingState(stateCode);
    setStep('city');
  };

  const selectCity = (city: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setCountry('Australia');
    setCity(city);
  };

  const handleDetectLocation = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const r = await detect();
    if (r) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCountry('Australia');
      setCity(r.city);
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

  const pendingStateMeta = states.find(s => s.code === pendingState);
  const citiesToShow = pendingState ? (citiesByState[pendingState] ?? []) : [];

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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            s.scrollContent,
            isDesktop && s.scrollContentDesktop,
            !isDesktop && { paddingTop: 20 },
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
                  <Ionicons name={step === 'state' ? 'map' : 'location'} size={36} color={CultureTokens.teal} />
                </View>
                <Text style={[s.title, { color: colors.textInverse }]}>
                  {step === 'state' ? 'Where are you?' : 'Select your city'}
                </Text>
                <Text style={[s.subtitle, { color: colors.textSecondary }]}>
                  {step === 'state'
                    ? 'Select your state to discover culture near you.'
                    : 'Choose your home city for local recommendations.'}
                </Text>
              </View>

              {step === 'state' ? (
                <View>
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
                  >
                    {isDetecting ? (
                      <ActivityIndicator size="small" color={CultureTokens.gold} />
                    ) : (
                      <Ionicons name="navigate" size={IconSize.md - 2} color={CultureTokens.gold} />
                    )}
                    <Text style={[s.detectBtnText, { color: CultureTokens.gold }]}>
                      {isDetecting ? 'Detecting location...' : 'Use My Location'}
                    </Text>
                  </Pressable>

                  {locationsLoading && (
                    <ActivityIndicator size="large" color={CultureTokens.indigo} style={{ paddingVertical: 20 }} />
                  )}

                  {!!locationsError && (
                    <View style={[s.errorBanner, { backgroundColor: `${CultureTokens.coral}20`, borderColor: `${CultureTokens.coral}50` }]}>
                      <Ionicons name="alert-circle" size={IconSize.md} color={CultureTokens.coral} />
                      <Text style={[s.errorText, { color: CultureTokens.coral }]}>Failed to load locations.</Text>
                    </View>
                  )}

                  <View style={s.grid}>
                    {states.map((st) => (
                      <Pressable
                        key={st.code}
                        style={({ pressed }) => [
                          s.stateCard,
                          {
                            backgroundColor: pressed ? colors.primaryGlow : 'transparent',
                            borderColor: colors.borderLight,
                          },
                        ]}
                        onPress={() => selectState(st.code)}
                        accessibilityRole="button"
                        accessibilityLabel={`${st.name}, ${st.cities.length} cities`}
                      >
                        <Text style={s.stateEmoji}>{st.emoji}</Text>
                        <View style={s.stateInfo}>
                          <Text style={[s.stateName, { color: colors.textInverse }]}>{st.name}</Text>
                          <Text style={[s.cityCount, { color: colors.textSecondary }]}>{st.cities.length} cities</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={IconSize.md - 2} color={colors.textSecondary} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                <View>
                  <Pressable
                    onPress={() => setStep('state')}
                    style={({ pressed }) => [s.backToStateRow, { opacity: pressed ? 0.7 : 1 }]}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Back to states"
                  >
                    <Ionicons name="arrow-back" size={IconSize.sm} color={CultureTokens.gold} />
                    <Text style={[s.backToStateText, { color: CultureTokens.gold }]}>Back to states</Text>
                  </Pressable>

                  <View style={[s.selectedStateRow, { borderColor: colors.borderLight }]}>
                    <Text style={s.stateEmojiLarge}>{pendingStateMeta?.emoji}</Text>
                    <Text style={[s.selectedStateText, { color: colors.textInverse }]}>
                      {pendingStateMeta?.name}
                    </Text>
                  </View>

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
                                : pressed ? colors.primaryGlow : 'transparent',
                              borderColor: isActive ? 'transparent' : colors.borderLight,
                            },
                          ]}
                          onPress={() => selectCity(city)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isActive }}
                          accessibilityLabel={city}
                        >
                          <Ionicons
                            name="location"
                            size={IconSize.md - 2}
                            color={isActive ? colors.textInverse : colors.textSecondary}
                          />
                          <Text style={[s.cityName, { color: colors.textInverse }]}>{city}</Text>
                          {isActive && (
                            <Ionicons name="checkmark-circle" size={IconSize.md - 2} color={colors.textInverse} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
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

  grid: { gap: Spacing.sm + 4 },
  stateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: CardTokens.radius,
    padding: 18,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    marginBottom: Spacing.sm,
  },
  stateEmoji: { fontSize: 28 },
  stateInfo: { flex: 1 },
  stateName: { fontFamily: FontFamily.semibold, fontSize: FontSize.body, marginBottom: 2 },
  cityCount: { fontFamily: FontFamily.regular, fontSize: FontSize.chip },

  backToStateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, alignSelf: 'flex-start' },
  backToStateText: { fontFamily: FontFamily.semibold, fontSize: FontSize.body2 },
  selectedStateRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.lg, paddingBottom: 20, borderBottomWidth: 1 },
  stateEmojiLarge: { fontSize: 36 },
  selectedStateText: { fontFamily: FontFamily.bold, fontSize: 22 },

  cityGrid: { gap: 10 },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: CardTokens.radius,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  cityName: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.callout },
  spacer: { height: Spacing.xl },
  submitBtn: { height: 60, borderRadius: 20 },
});
