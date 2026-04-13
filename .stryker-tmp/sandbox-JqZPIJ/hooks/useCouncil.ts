// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { api, type CouncilLgaContext } from '@/lib/api';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';
function buildCouncilParams(city?: string, country?: string) {
  if (stryMutAct_9fa48("74")) {
    {}
  } else {
    stryCov_9fa48("74");
    const fallbackPostcode = city ? getPostcodesByPlace(city)[0] : undefined;
    return stryMutAct_9fa48("75") ? {} : (stryCov_9fa48("75"), {
      city: stryMutAct_9fa48("78") ? city && undefined : stryMutAct_9fa48("77") ? false : stryMutAct_9fa48("76") ? true : (stryCov_9fa48("76", "77", "78"), city || undefined),
      country: stryMutAct_9fa48("81") ? country && 'Australia' : stryMutAct_9fa48("80") ? false : stryMutAct_9fa48("79") ? true : (stryCov_9fa48("79", "80", "81"), country || (stryMutAct_9fa48("82") ? "" : (stryCov_9fa48("82"), 'Australia'))),
      postcode: stryMutAct_9fa48("83") ? fallbackPostcode.postcode : (stryCov_9fa48("83"), fallbackPostcode?.postcode),
      suburb: stryMutAct_9fa48("84") ? fallbackPostcode.place_name : (stryCov_9fa48("84"), fallbackPostcode?.place_name),
      state: stryMutAct_9fa48("85") ? fallbackPostcode.state_code : (stryCov_9fa48("85"), fallbackPostcode?.state_code)
    });
  }
}

/**
 * Signed-in user’s LGA (council) context for discover, calendar, and proximity rails.
 * Council is a location dimension only — no follow/preferences/waste APIs.
 */
export function useCouncil() {
  if (stryMutAct_9fa48("86")) {
    {}
  } else {
    stryCov_9fa48("86");
    const queryClient = useQueryClient();
    const {
      state
    } = useOnboarding();
    const {
      isAuthenticated
    } = useAuth();
    const councilParams = useMemo(stryMutAct_9fa48("87") ? () => undefined : (stryCov_9fa48("87"), () => buildCouncilParams(state.city, state.country)), stryMutAct_9fa48("88") ? [] : (stryCov_9fa48("88"), [state.city, state.country]));
    const queryKey = ['/api/council/my', councilParams.city, councilParams.postcode, councilParams.state] as const;
    const {
      data,
      isLoading,
      isError,
      refetch
    } = useQuery<CouncilLgaContext | null>(stryMutAct_9fa48("89") ? {} : (stryCov_9fa48("89"), {
      queryKey,
      queryFn: stryMutAct_9fa48("90") ? () => undefined : (stryCov_9fa48("90"), () => api.council.my(councilParams)),
      enabled: isAuthenticated
    }));
    const council = stryMutAct_9fa48("91") ? data?.council && null : (stryCov_9fa48("91"), (stryMutAct_9fa48("92") ? data.council : (stryCov_9fa48("92"), data?.council)) ?? null);
    const councilId = stryMutAct_9fa48("93") ? council.id : (stryCov_9fa48("93"), council?.id);
    const lgaCode = stryMutAct_9fa48("94") ? council.lgaCode : (stryCov_9fa48("94"), council?.lgaCode);
    const reload = async () => {
      if (stryMutAct_9fa48("95")) {
        {}
      } else {
        stryCov_9fa48("95");
        await queryClient.invalidateQueries(stryMutAct_9fa48("96") ? {} : (stryCov_9fa48("96"), {
          queryKey: stryMutAct_9fa48("97") ? [] : (stryCov_9fa48("97"), [stryMutAct_9fa48("98") ? "" : (stryCov_9fa48("98"), '/api/council/my')])
        }));
      }
    };
    return stryMutAct_9fa48("99") ? {} : (stryCov_9fa48("99"), {
      data,
      council,
      councilId,
      lgaCode,
      isLoading,
      isError,
      isAuthenticated,
      refetch,
      reload
    });
  }
}