import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import CityScreen from '../city/[name]';

/**
 * My City Tab — personalised city view
 * Reuses the generic CityScreen but falls back to the user's onboarding city
 * when no [name]/country route params are present.
 */
export default function MyCityTabScreen() {
  return (
    <ErrorBoundary>
      <CityScreen />
    </ErrorBoundary>
  );
}

