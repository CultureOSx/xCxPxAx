import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function DynamicCulturalHubScreen() {
  const params = useLocalSearchParams<{ state?: string; language?: string }>();
  const stateCode = String(params.state ?? 'nsw').toLowerCase();
  const languageCode = String(params.language ?? 'eng').toLowerCase();
  return <Redirect href={`/hub/australia/${stateCode}?lang=${encodeURIComponent(languageCode)}`} />;
}
