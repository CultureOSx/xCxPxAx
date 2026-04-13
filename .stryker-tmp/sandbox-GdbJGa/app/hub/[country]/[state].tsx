// @ts-nocheck
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { CulturalHubPage } from '@/components/hubs/CulturalHubPage';
import { LANGUAGES, getLanguage } from '@/constants/languages';
import { GLOBAL_REGIONS } from '@/constants/locations';

export default function CountryStateHubScreen() {
  const params = useLocalSearchParams<{ country?: string; state?: string; lang?: string }>();
  const rawCountry = String(params.country ?? 'australia').toLowerCase();
  const rawState = String(params.state ?? 'nsw').toUpperCase();
  const rawLanguage = String(params.lang ?? 'eng').toLowerCase();

  const allowedStates = GLOBAL_REGIONS.filter((item) => item.country === 'Australia').map((item) => item.value);
  const stateCode = allowedStates.includes(rawState as (typeof allowedStates)[number]) ? rawState : 'NSW';
  const languageCode = rawLanguage in LANGUAGES ? rawLanguage : 'eng';

  const language = getLanguage(languageCode);
  const state = GLOBAL_REGIONS.find((item) => item.value === stateCode);
  const isAustralia = rawCountry === 'australia' || rawCountry === 'au';

  const languageLabel = language?.name ?? languageCode.toUpperCase();
  const stateLabel = state?.label ?? stateCode;
  const countryLabel = isAustralia ? 'Australia' : rawCountry.toUpperCase();

  return (
    <CulturalHubPage
      seed={{
        slug: `${countryLabel.toLowerCase()}-${stateCode.toLowerCase()}-${languageCode}`,
        title: `${stateLabel} ${languageLabel} Hub`,
        subtitle: `Communities, events, announcements, and links for ${languageLabel} in ${stateLabel}, ${countryLabel}.`,
        description: `Discover ${languageLabel} communities, events, announcements, and cultural links in ${stateLabel}, ${countryLabel}.`,
        defaultState: stateCode,
        defaultLanguage: languageCode,
        matchTerms: [languageLabel, stateLabel, countryLabel],
      }}
      showBuilder={false}
    />
  );
}
