import { useQuery } from '@tanstack/react-query';
import { api, type FeaturedCityData } from '@/lib/api';

export type { FeaturedCityData };

/**
 * Deterministic gradient pairs for city cards when no imageUrl is set.
 * Keyed by countryCode; unknown countries fall back to the default pair.
 */
export const CITY_GRADIENTS: Record<string, [string, string]> = {
  AU: ['#FF8C42', '#1B0F2E'],   // saffron → midnight
  NZ: ['#22C55E', '#0F2A1A'],   // green → dark green
  AE: ['#FFC857', '#6B0F0F'],   // gold → deep red
  GB: ['#3B82F6', '#0F1E3F'],   // blue → navy
  CA: ['#EF4444', '#2D0A0A'],   // red → dark red
  US: ['#6366F1', '#0F0F2E'],   // indigo → deep indigo
  SG: ['#F43F5E', '#1A0F1A'],   // rose → deep plum
  DEFAULT: ['#2C2A72', '#0B0B14'], // indigo → near-black
};

export function cityGradient(countryCode: string): [string, string] {
  return CITY_GRADIENTS[countryCode] ?? CITY_GRADIENTS.DEFAULT;
}

export function useFeaturedCities() {
  const { data: cities = [], isLoading, isError, refetch } = useQuery<FeaturedCityData[]>({
    queryKey: ['/api/cities/featured'],
    queryFn: () => api.cities.featured(),
    select: (rows) => {
      const seen = new Set<string>();
      const unique: FeaturedCityData[] = [];
      for (const city of rows) {
        const key = `${(city.slug || city.name).toLowerCase()}::${city.countryCode.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(city);
      }
      return unique;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return { cities, isLoading, isError, refetch };
}
