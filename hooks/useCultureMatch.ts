import { useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import {
  ALL_NATIONALITIES,
  getCulturesForNationality,
  getDiasporaGroupsForNationality,
  searchNationalities,
  type Nationality,
  type Culture,
} from '@/constants/cultures';
import { COMMON_LANGUAGES, searchLanguages, type Language } from '@/constants/languages';

export type Step = 'nationality' | 'culture' | 'language';

const commonLanguagesMap = new Map(COMMON_LANGUAGES.map(l => [l.id, l]));

export function useCultureMatch() {
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const {
    state,
    setNationalityId,
    setCultureIds,
    setLanguageIds,
    setDiasporaGroupIds,
    setEthnicityText,
    setLanguages,
  } = useOnboarding();

  const [step, setStep] = useState<Step>('nationality');
  const [nationalityQuery, setNationalityQuery] = useState('');
  const [cultureQuery, setCultureQuery] = useState('');
  const [languageQuery, setLanguageQuery] = useState('');

  const [selectedNationality, setSelectedNationality] = useState<Nationality | null>(
    state.nationalityId ? (ALL_NATIONALITIES.find((n) => n.id === state.nationalityId) ?? null) : null,
  );
  const [selectedCultureIds, setSelectedCultureIds] = useState<string[]>(state.cultureIds ?? []);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<string[]>(state.languageIds ?? []);

  const filteredNationalities = useMemo(() => searchNationalities(nationalityQuery), [nationalityQuery]);

  const availableCultures = useMemo(() => selectedNationality ? getCulturesForNationality(selectedNationality.id) : [], [selectedNationality]);

  const filteredCultures = useMemo(() => {
    const needle = cultureQuery.trim().toLowerCase();
    if (!needle) return availableCultures;
    return availableCultures.filter((c) => c.label.toLowerCase().includes(needle));
  }, [availableCultures, cultureQuery]);

  const filteredLanguages = useMemo(() => {
    const pool = languageQuery.trim().length >= 2 ? searchLanguages(languageQuery) : COMMON_LANGUAGES;
    return pool.filter((l) => !selectedLanguageIds.includes(l.id));
  }, [languageQuery, selectedLanguageIds]);

  const selectedLanguageObjects = useMemo(() => selectedLanguageIds.map((id) => commonLanguagesMap.get(id) ?? searchLanguages(id)[0]).filter(Boolean) as Language[], [selectedLanguageIds]);

  const triggerHaptic = useCallback(async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const pickNationality = useCallback(async (nat: Nationality) => {
    await triggerHaptic();
    setSelectedNationality(nat);
    setNationalityId(nat.id);
    setStep('culture');
    setSelectedCultureIds([]);
  }, [setNationalityId, triggerHaptic]);

  const toggleCulture = useCallback(async (culture: Culture) => {
    await triggerHaptic();
    setSelectedCultureIds((prev) => prev.includes(culture.id) ? prev.filter((id) => id !== culture.id) : [...prev, culture.id]);
  }, [triggerHaptic]);

  const toggleLanguage = useCallback(async (lang: Language) => {
    await triggerHaptic();
    setSelectedLanguageIds((prev) => prev.includes(lang.id) ? prev.filter((id) => id !== lang.id) : [...prev, lang.id]);
  }, [triggerHaptic]);

  const removeLanguage = useCallback(async (langId: string) => {
    await triggerHaptic();
    setSelectedLanguageIds((prev) => prev.filter((id) => id !== langId));
  }, [triggerHaptic]);

  const goBack = useCallback(async () => {
    await triggerHaptic();
    if (step === 'culture') { setStep('nationality'); return; }
    if (step === 'language') { setStep('culture'); return; }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(routeWithRedirect('/(onboarding)/communities', redirectTo) as string);
    }
  }, [step, redirectTo, triggerHaptic]);

  const goNext = useCallback(async () => {
    await triggerHaptic();
    if (step === 'nationality') { setStep('culture'); return; }
    if (step === 'culture') { setStep('language'); return; }

    setCultureIds(selectedCultureIds);
    setLanguageIds(selectedLanguageIds);

    const diasporaGroups = selectedNationality ? getDiasporaGroupsForNationality(selectedNationality.id).map((g) => g.id) : [];
    setDiasporaGroupIds(diasporaGroups);

    setEthnicityText(selectedNationality?.label ?? '');
    setLanguages(selectedLanguageObjects.map((l) => l.name));

    router.push(routeWithRedirect('/(onboarding)/interests', redirectTo) as string);
  }, [step, selectedCultureIds, selectedLanguageIds, selectedNationality, selectedLanguageObjects, setCultureIds, setLanguageIds, setDiasporaGroupIds, setEthnicityText, setLanguages, redirectTo, triggerHaptic]);

  const skipStep = useCallback(async () => {
    await triggerHaptic();
    if (step === 'nationality') setStep('culture');
    else if (step === 'culture') setStep('language');
    else router.push(routeWithRedirect('/(onboarding)/interests', redirectTo) as string);
  }, [step, redirectTo, triggerHaptic]);

  const stepIndex = step === 'nationality' ? 0 : step === 'culture' ? 1 : 2;
  const canProceed = step === 'nationality' ? !!selectedNationality : step === 'culture' ? selectedCultureIds.length > 0 : selectedLanguageIds.length > 0;

  return {
    step,
    setStep,
    stepIndex,
    canProceed,
    nationalityQuery, setNationalityQuery,
    cultureQuery, setCultureQuery,
    languageQuery, setLanguageQuery,
    selectedNationality,
    selectedCultureIds,
    selectedLanguageIds,
    filteredNationalities,
    availableCultures,
    filteredCultures,
    filteredLanguages,
    selectedLanguageObjects,
    pickNationality,
    toggleCulture,
    toggleLanguage,
    removeLanguage,
    goBack,
    goNext,
    skipStep
  };
}
