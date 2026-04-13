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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/query-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * CulturePassAU Sydney Feature Flags v2.0
 * Sydney-first rollout + Kerala diaspora beta
 */

export type RolloutPhase = 'internal' | 'pilot' | 'sydney-beta' | 'kerala-diaspora' | 'half' | 'full';
export interface FeatureFlagsResponse {
  rollout: {
    phase: RolloutPhase;
    percentage: number;
    sydneyPercentage?: number;
    keralaPercentage?: number;
  };
  flags: Record<string, boolean>;
  experiments: Record<string, {
    variant: string;
    weight: number;
  }>;
  userSegment: 'guest' | 'sydney-local' | 'kerala-diaspora' | 'international';
}
const FLAGS_CACHE_KEY = stryMutAct_9fa48("2983") ? "" : (stryCov_9fa48("2983"), '@culturepass_flags_cache');
const FLAGS_CACHE_TTL = stryMutAct_9fa48("2984") ? 5 * 60 / 1000 : (stryCov_9fa48("2984"), (stryMutAct_9fa48("2985") ? 5 / 60 : (stryCov_9fa48("2985"), 5 * 60)) * 1000); // 5 minutes

const DEFAULT_FLAGS: FeatureFlagsResponse = stryMutAct_9fa48("2986") ? {} : (stryCov_9fa48("2986"), {
  rollout: stryMutAct_9fa48("2987") ? {} : (stryCov_9fa48("2987"), {
    phase: stryMutAct_9fa48("2988") ? "" : (stryCov_9fa48("2988"), 'pilot'),
    percentage: 10
  }),
  flags: {},
  experiments: {},
  userSegment: stryMutAct_9fa48("2989") ? "" : (stryCov_9fa48("2989"), 'guest')
});
export async function fetchFeatureFlags(userId: string = stryMutAct_9fa48("2990") ? "" : (stryCov_9fa48("2990"), 'guest'), overrideSegment?: string): Promise<FeatureFlagsResponse> {
  if (stryMutAct_9fa48("2991")) {
    {}
  } else {
    stryCov_9fa48("2991");
    const base = getApiUrl();
    const url = new URL(stryMutAct_9fa48("2992") ? `` : (stryCov_9fa48("2992"), `${base}api/rollout/flags`));
    url.searchParams.append(stryMutAct_9fa48("2993") ? "" : (stryCov_9fa48("2993"), 'userId'), userId);
    if (stryMutAct_9fa48("2995") ? false : stryMutAct_9fa48("2994") ? true : (stryCov_9fa48("2994", "2995"), overrideSegment)) url.searchParams.append(stryMutAct_9fa48("2996") ? "" : (stryCov_9fa48("2996"), 'segment'), overrideSegment);
    const res = await fetch(url.toString(), stryMutAct_9fa48("2997") ? {} : (stryCov_9fa48("2997"), {
      headers: stryMutAct_9fa48("2998") ? {} : (stryCov_9fa48("2998"), {
        'Cache-Control': stryMutAct_9fa48("2999") ? "" : (stryCov_9fa48("2999"), 'no-cache')
      }),
      credentials: (stryMutAct_9fa48("3002") ? Platform.OS !== 'web' : stryMutAct_9fa48("3001") ? false : stryMutAct_9fa48("3000") ? true : (stryCov_9fa48("3000", "3001", "3002"), Platform.OS === (stryMutAct_9fa48("3003") ? "" : (stryCov_9fa48("3003"), 'web')))) ? stryMutAct_9fa48("3004") ? "" : (stryCov_9fa48("3004"), 'omit') : undefined
    }));
    if (stryMutAct_9fa48("3007") ? false : stryMutAct_9fa48("3006") ? true : stryMutAct_9fa48("3005") ? res.ok : (stryCov_9fa48("3005", "3006", "3007"), !res.ok)) {
      if (stryMutAct_9fa48("3008")) {
        {}
      } else {
        stryCov_9fa48("3008");
        console.warn(stryMutAct_9fa48("3009") ? `` : (stryCov_9fa48("3009"), `Flags fetch failed (${res.status})`));
        return DEFAULT_FLAGS;
      }
    }
    return res.json();
  }
}
export async function fetchFeatureFlagsCached(userId: string = stryMutAct_9fa48("3010") ? "" : (stryCov_9fa48("3010"), 'guest')): Promise<FeatureFlagsResponse> {
  if (stryMutAct_9fa48("3011")) {
    {}
  } else {
    stryCov_9fa48("3011");
    try {
      if (stryMutAct_9fa48("3012")) {
        {}
      } else {
        stryCov_9fa48("3012");
        const cached = await AsyncStorage.getItem(FLAGS_CACHE_KEY);
        if (stryMutAct_9fa48("3014") ? false : stryMutAct_9fa48("3013") ? true : (stryCov_9fa48("3013", "3014"), cached)) {
          if (stryMutAct_9fa48("3015")) {
            {}
          } else {
            stryCov_9fa48("3015");
            const {
              data,
              timestamp
            } = JSON.parse(cached) as {
              data: FeatureFlagsResponse;
              timestamp: number;
            };
            if (stryMutAct_9fa48("3019") ? Date.now() - timestamp >= FLAGS_CACHE_TTL : stryMutAct_9fa48("3018") ? Date.now() - timestamp <= FLAGS_CACHE_TTL : stryMutAct_9fa48("3017") ? false : stryMutAct_9fa48("3016") ? true : (stryCov_9fa48("3016", "3017", "3018", "3019"), (stryMutAct_9fa48("3020") ? Date.now() + timestamp : (stryCov_9fa48("3020"), Date.now() - timestamp)) < FLAGS_CACHE_TTL)) return data;
          }
        }
        const flags = await fetchFeatureFlags(userId);
        await AsyncStorage.setItem(FLAGS_CACHE_KEY, JSON.stringify(stryMutAct_9fa48("3021") ? {} : (stryCov_9fa48("3021"), {
          data: flags,
          timestamp: Date.now()
        })));
        return flags;
      }
    } catch (error) {
      if (stryMutAct_9fa48("3022")) {
        {}
      } else {
        stryCov_9fa48("3022");
        console.error(stryMutAct_9fa48("3023") ? "" : (stryCov_9fa48("3023"), 'Cached flags fetch failed:'), error);
        return DEFAULT_FLAGS;
      }
    }
  }
}
export function useFeatureFlags() {
  if (stryMutAct_9fa48("3024")) {
    {}
  } else {
    stryCov_9fa48("3024");
    const {
      userId
    } = useAuth();
    return useQuery<FeatureFlagsResponse>(stryMutAct_9fa48("3025") ? {} : (stryCov_9fa48("3025"), {
      queryKey: stryMutAct_9fa48("3026") ? [] : (stryCov_9fa48("3026"), [stryMutAct_9fa48("3027") ? "" : (stryCov_9fa48("3027"), 'featureFlags'), userId]),
      queryFn: stryMutAct_9fa48("3028") ? () => undefined : (stryCov_9fa48("3028"), () => fetchFeatureFlagsCached(stryMutAct_9fa48("3029") ? userId && 'guest' : (stryCov_9fa48("3029"), userId ?? (stryMutAct_9fa48("3030") ? "" : (stryCov_9fa48("3030"), 'guest'))))),
      staleTime: FLAGS_CACHE_TTL,
      refetchOnWindowFocus: stryMutAct_9fa48("3031") ? true : (stryCov_9fa48("3031"), false),
      refetchInterval: stryMutAct_9fa48("3032") ? 10 * 60 / 1000 : (stryCov_9fa48("3032"), (stryMutAct_9fa48("3033") ? 10 / 60 : (stryCov_9fa48("3033"), 10 * 60)) * 1000),
      retry: 1,
      placeholderData: DEFAULT_FLAGS
    }));
  }
}
export function useSydneyFeatureFlags() {
  if (stryMutAct_9fa48("3034")) {
    {}
  } else {
    stryCov_9fa48("3034");
    const {
      user
    } = useAuth();
    const flags = useFeatureFlags();
    const isSydneyUser = stryMutAct_9fa48("3035") ? user?.city?.toLowerCase().includes('sydney') && false : (stryCov_9fa48("3035"), (stryMutAct_9fa48("3038") ? user.city?.toLowerCase().includes('sydney') : stryMutAct_9fa48("3037") ? user?.city.toLowerCase().includes('sydney') : stryMutAct_9fa48("3036") ? user?.city?.toUpperCase().includes('sydney') : (stryCov_9fa48("3036", "3037", "3038"), user?.city?.toLowerCase().includes(stryMutAct_9fa48("3039") ? "" : (stryCov_9fa48("3039"), 'sydney')))) ?? (stryMutAct_9fa48("3040") ? true : (stryCov_9fa48("3040"), false)));
    return useMemo(stryMutAct_9fa48("3041") ? () => undefined : (stryCov_9fa48("3041"), () => stryMutAct_9fa48("3042") ? {} : (stryCov_9fa48("3042"), {
      ...flags,
      isSydneyBeta: stryMutAct_9fa48("3043") ? flags.data?.flags['sydney-beta'] && isSydneyUser : (stryCov_9fa48("3043"), (stryMutAct_9fa48("3044") ? flags.data.flags['sydney-beta'] : (stryCov_9fa48("3044"), flags.data?.flags[stryMutAct_9fa48("3045") ? "" : (stryCov_9fa48("3045"), 'sydney-beta')])) ?? isSydneyUser),
      sydneyWallet: stryMutAct_9fa48("3046") ? flags.data?.flags['wallet-v2'] && true : (stryCov_9fa48("3046"), (stryMutAct_9fa48("3047") ? flags.data.flags['wallet-v2'] : (stryCov_9fa48("3047"), flags.data?.flags[stryMutAct_9fa48("3048") ? "" : (stryCov_9fa48("3048"), 'wallet-v2')])) ?? (stryMutAct_9fa48("3049") ? false : (stryCov_9fa48("3049"), true))),
      sydneyMap: stryMutAct_9fa48("3050") ? flags.data?.flags['native-maps'] && true : (stryCov_9fa48("3050"), (stryMutAct_9fa48("3051") ? flags.data.flags['native-maps'] : (stryCov_9fa48("3051"), flags.data?.flags[stryMutAct_9fa48("3052") ? "" : (stryCov_9fa48("3052"), 'native-maps')])) ?? (stryMutAct_9fa48("3053") ? false : (stryCov_9fa48("3053"), true))),
      eventTiers: stryMutAct_9fa48("3054") ? flags.data?.flags['tiered-pricing'] && true : (stryCov_9fa48("3054"), (stryMutAct_9fa48("3055") ? flags.data.flags['tiered-pricing'] : (stryCov_9fa48("3055"), flags.data?.flags[stryMutAct_9fa48("3056") ? "" : (stryCov_9fa48("3056"), 'tiered-pricing')])) ?? (stryMutAct_9fa48("3057") ? false : (stryCov_9fa48("3057"), true))),
      keralaPriority: stryMutAct_9fa48("3058") ? flags.data?.flags['kerala-events'] && true : (stryCov_9fa48("3058"), (stryMutAct_9fa48("3059") ? flags.data.flags['kerala-events'] : (stryCov_9fa48("3059"), flags.data?.flags[stryMutAct_9fa48("3060") ? "" : (stryCov_9fa48("3060"), 'kerala-events')])) ?? (stryMutAct_9fa48("3061") ? false : (stryCov_9fa48("3061"), true)))
    })), stryMutAct_9fa48("3062") ? [] : (stryCov_9fa48("3062"), [flags, isSydneyUser]));
  }
}
export function useFlagOverride(flag: string) {
  if (stryMutAct_9fa48("3063")) {
    {}
  } else {
    stryCov_9fa48("3063");
    const queryClient = useQueryClient();
    return stryMutAct_9fa48("3064") ? {} : (stryCov_9fa48("3064"), {
      value: stryMutAct_9fa48("3065") ? useFeatureFlags().data?.flags[flag] && false : (stryCov_9fa48("3065"), (stryMutAct_9fa48("3066") ? useFeatureFlags().data.flags[flag] : (stryCov_9fa48("3066"), useFeatureFlags().data?.flags[flag])) ?? (stryMutAct_9fa48("3067") ? true : (stryCov_9fa48("3067"), false))),
      override: (value: boolean) => {
        if (stryMutAct_9fa48("3068")) {
          {}
        } else {
          stryCov_9fa48("3068");
          queryClient.setQueryData<FeatureFlagsResponse>(stryMutAct_9fa48("3069") ? [] : (stryCov_9fa48("3069"), [stryMutAct_9fa48("3070") ? "" : (stryCov_9fa48("3070"), 'featureFlags')]), stryMutAct_9fa48("3071") ? () => undefined : (stryCov_9fa48("3071"), old => stryMutAct_9fa48("3072") ? {} : (stryCov_9fa48("3072"), {
            ...(stryMutAct_9fa48("3073") ? old && DEFAULT_FLAGS : (stryCov_9fa48("3073"), old ?? DEFAULT_FLAGS)),
            flags: stryMutAct_9fa48("3074") ? {} : (stryCov_9fa48("3074"), {
              ...(stryMutAct_9fa48("3075") ? old?.flags && {} : (stryCov_9fa48("3075"), (stryMutAct_9fa48("3076") ? old.flags : (stryCov_9fa48("3076"), old?.flags)) ?? {})),
              [flag]: value
            })
          })));
          if (stryMutAct_9fa48("3079") ? Platform.OS === 'web' : stryMutAct_9fa48("3078") ? false : stryMutAct_9fa48("3077") ? true : (stryCov_9fa48("3077", "3078", "3079"), Platform.OS !== (stryMutAct_9fa48("3080") ? "" : (stryCov_9fa48("3080"), 'web')))) {
            if (stryMutAct_9fa48("3081")) {
              {}
            } else {
              stryCov_9fa48("3081");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        }
      }
    });
  }
}
export function useSydneyRollout() {
  if (stryMutAct_9fa48("3082")) {
    {}
  } else {
    stryCov_9fa48("3082");
    const flags = useFeatureFlags();
    const rollout = stryMutAct_9fa48("3083") ? flags.data.rollout : (stryCov_9fa48("3083"), flags.data?.rollout);
    return stryMutAct_9fa48("3084") ? {} : (stryCov_9fa48("3084"), {
      phase: stryMutAct_9fa48("3085") ? rollout?.phase && 'pilot' : (stryCov_9fa48("3085"), (stryMutAct_9fa48("3086") ? rollout.phase : (stryCov_9fa48("3086"), rollout?.phase)) ?? (stryMutAct_9fa48("3087") ? "" : (stryCov_9fa48("3087"), 'pilot'))),
      isSydneyBeta: stryMutAct_9fa48("3090") ? rollout?.phase !== 'sydney-beta' : stryMutAct_9fa48("3089") ? false : stryMutAct_9fa48("3088") ? true : (stryCov_9fa48("3088", "3089", "3090"), (stryMutAct_9fa48("3091") ? rollout.phase : (stryCov_9fa48("3091"), rollout?.phase)) === (stryMutAct_9fa48("3092") ? "" : (stryCov_9fa48("3092"), 'sydney-beta'))),
      percentage: stryMutAct_9fa48("3093") ? rollout?.sydneyPercentage && 0 : (stryCov_9fa48("3093"), (stryMutAct_9fa48("3094") ? rollout.sydneyPercentage : (stryCov_9fa48("3094"), rollout?.sydneyPercentage)) ?? 0),
      segment: stryMutAct_9fa48("3095") ? flags.data?.userSegment && 'guest' : (stryCov_9fa48("3095"), (stryMutAct_9fa48("3096") ? flags.data.userSegment : (stryCov_9fa48("3096"), flags.data?.userSegment)) ?? (stryMutAct_9fa48("3097") ? "" : (stryCov_9fa48("3097"), 'guest')))
    });
  }
}