// @ts-nocheck
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { api, type CouncilLgaContext } from '@/lib/api';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';

function buildCouncilParams(city?: string, country?: string) {
  const fallbackPostcode = city ? getPostcodesByPlace(city)[0] : undefined;
  return {
    city: city || undefined,
    country: country || 'Australia',
    postcode: fallbackPostcode?.postcode,
    suburb: fallbackPostcode?.place_name,
    state: fallbackPostcode?.state_code,
  };
}

/**
 * Signed-in user’s LGA (council) context for discover, calendar, and proximity rails.
 * Council is a location dimension only — no follow/preferences/waste APIs.
 */
export function useCouncil() {
  const queryClient = useQueryClient();
  const { state } = useOnboarding();
  const { isAuthenticated } = useAuth();

  const councilParams = useMemo(
    () => buildCouncilParams(state.city, state.country),
    [state.city, state.country],
  );

  const queryKey = ['/api/council/my', councilParams.city, councilParams.postcode, councilParams.state] as const;

  const { data, isLoading, isError, refetch } = useQuery<CouncilLgaContext | null>({
    queryKey,
    queryFn: () => api.council.my(councilParams),
    enabled: isAuthenticated,
  });

  const council = data?.council ?? null;
  const councilId = council?.id;
  const lgaCode = council?.lgaCode;

  const reload = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/council/my'] });
  };

  return {
    data,
    council,
    councilId,
    lgaCode,
    isLoading,
    isError,
    isAuthenticated,
    refetch,
    reload,
  };
}
