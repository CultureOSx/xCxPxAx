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
import { type Href, router, useLocalSearchParams, usePathname } from 'expo-router';
import { useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * CulturePassAU Navigation Utilities v2.1
 *
 * All route helpers are plain functions (no hooks inside).
 * Hooks (useSafeBack, useEventNavigation, etc.) are kept for component use.
 */

// ---------------------------------------------------------------------------
// Plain navigation helpers
// ---------------------------------------------------------------------------

export function goHome() {
  if (stryMutAct_9fa48("3859")) {
    {}
  } else {
    stryCov_9fa48("3859");
    router.replace(stryMutAct_9fa48("3860") ? "" : (stryCov_9fa48("3860"), '/(tabs)'));
  }
}
export function navigateToEvent(eventId: string) {
  if (stryMutAct_9fa48("3861")) {
    {}
  } else {
    stryCov_9fa48("3861");
    router.push(stryMutAct_9fa48("3862") ? {} : (stryCov_9fa48("3862"), {
      pathname: stryMutAct_9fa48("3863") ? "" : (stryCov_9fa48("3863"), '/event/[id]'),
      params: stryMutAct_9fa48("3864") ? {} : (stryCov_9fa48("3864"), {
        id: eventId
      })
    }));
  }
}
export function navigateToProfile(identifier: string) {
  if (stryMutAct_9fa48("3865")) {
    {}
  } else {
    stryCov_9fa48("3865");
    if (stryMutAct_9fa48("3868") ? identifier.startsWith('CP-USER-') && identifier.startsWith('CP-U') : stryMutAct_9fa48("3867") ? false : stryMutAct_9fa48("3866") ? true : (stryCov_9fa48("3866", "3867", "3868"), (stryMutAct_9fa48("3869") ? identifier.endsWith('CP-USER-') : (stryCov_9fa48("3869"), identifier.startsWith(stryMutAct_9fa48("3870") ? "" : (stryCov_9fa48("3870"), 'CP-USER-')))) || (stryMutAct_9fa48("3871") ? identifier.endsWith('CP-U') : (stryCov_9fa48("3871"), identifier.startsWith(stryMutAct_9fa48("3872") ? "" : (stryCov_9fa48("3872"), 'CP-U')))))) {
      if (stryMutAct_9fa48("3873")) {
        {}
      } else {
        stryCov_9fa48("3873");
        router.push(stryMutAct_9fa48("3874") ? {} : (stryCov_9fa48("3874"), {
          pathname: stryMutAct_9fa48("3875") ? "" : (stryCov_9fa48("3875"), '/contacts/[cpid]'),
          params: stryMutAct_9fa48("3876") ? {} : (stryCov_9fa48("3876"), {
            cpid: identifier
          })
        }));
      }
    } else if (stryMutAct_9fa48("3879") ? identifier.endsWith('@') : stryMutAct_9fa48("3878") ? false : stryMutAct_9fa48("3877") ? true : (stryCov_9fa48("3877", "3878", "3879"), identifier.startsWith(stryMutAct_9fa48("3880") ? "" : (stryCov_9fa48("3880"), '@')))) {
      if (stryMutAct_9fa48("3881")) {
        {}
      } else {
        stryCov_9fa48("3881");
        router.push(stryMutAct_9fa48("3882") ? {} : (stryCov_9fa48("3882"), {
          pathname: stryMutAct_9fa48("3883") ? "" : (stryCov_9fa48("3883"), '/user/[id]'),
          params: stryMutAct_9fa48("3884") ? {} : (stryCov_9fa48("3884"), {
            id: stryMutAct_9fa48("3885") ? identifier : (stryCov_9fa48("3885"), identifier.slice(1))
          })
        }));
      }
    } else {
      if (stryMutAct_9fa48("3886")) {
        {}
      } else {
        stryCov_9fa48("3886");
        router.push(stryMutAct_9fa48("3887") ? {} : (stryCov_9fa48("3887"), {
          pathname: stryMutAct_9fa48("3888") ? "" : (stryCov_9fa48("3888"), '/user/[id]'),
          params: stryMutAct_9fa48("3889") ? {} : (stryCov_9fa48("3889"), {
            id: identifier
          })
        }));
      }
    }
  }
}
export function goBackOrReplace(fallback: string) {
  if (stryMutAct_9fa48("3890")) {
    {}
  } else {
    stryCov_9fa48("3890");
    if (stryMutAct_9fa48("3892") ? false : stryMutAct_9fa48("3891") ? true : (stryCov_9fa48("3891", "3892"), router.canGoBack())) {
      if (stryMutAct_9fa48("3893")) {
        {}
      } else {
        stryCov_9fa48("3893");
        router.back();
      }
    } else {
      if (stryMutAct_9fa48("3894")) {
        {}
      } else {
        stryCov_9fa48("3894");
        router.replace(fallback as Href);
      }
    }
  }
}

/** Short alias used across the app — back if possible, else replace with fallback. */
export const n = goBackOrReplace;
export function shareEventLink(event: {
  id: string;
  title: string;
}) {
  if (stryMutAct_9fa48("3895")) {
    {}
  } else {
    stryCov_9fa48("3895");
    const url = stryMutAct_9fa48("3896") ? `` : (stryCov_9fa48("3896"), `culturepass://event/${event.id}`);
    if (stryMutAct_9fa48("3899") ? Platform.OS === 'web' || typeof navigator !== 'undefined' : stryMutAct_9fa48("3898") ? false : stryMutAct_9fa48("3897") ? true : (stryCov_9fa48("3897", "3898", "3899"), (stryMutAct_9fa48("3901") ? Platform.OS !== 'web' : stryMutAct_9fa48("3900") ? true : (stryCov_9fa48("3900", "3901"), Platform.OS === (stryMutAct_9fa48("3902") ? "" : (stryCov_9fa48("3902"), 'web')))) && (stryMutAct_9fa48("3904") ? typeof navigator === 'undefined' : stryMutAct_9fa48("3903") ? true : (stryCov_9fa48("3903", "3904"), typeof navigator !== (stryMutAct_9fa48("3905") ? "" : (stryCov_9fa48("3905"), 'undefined')))))) {
      if (stryMutAct_9fa48("3906")) {
        {}
      } else {
        stryCov_9fa48("3906");
        stryMutAct_9fa48("3907") ? navigator.clipboard.writeText(url) : (stryCov_9fa48("3907"), navigator.clipboard?.writeText(url));
      }
    }
    // Native: use expo-sharing when needed
  }
}

// ---------------------------------------------------------------------------
// React hooks (safe to use inside components)
// ---------------------------------------------------------------------------

// Safe back navigation hook
export function useSafeBack(fallback: string) {
  if (stryMutAct_9fa48("3908")) {
    {}
  } else {
    stryCov_9fa48("3908");
    return useCallback(() => {
      if (stryMutAct_9fa48("3909")) {
        {}
      } else {
        stryCov_9fa48("3909");
        if (stryMutAct_9fa48("3911") ? false : stryMutAct_9fa48("3910") ? true : (stryCov_9fa48("3910", "3911"), router.canGoBack())) {
          if (stryMutAct_9fa48("3912")) {
            {}
          } else {
            stryCov_9fa48("3912");
            router.back();
          }
        } else {
          if (stryMutAct_9fa48("3913")) {
            {}
          } else {
            stryCov_9fa48("3913");
            router.replace(fallback);
          }
        }
      }
    }, stryMutAct_9fa48("3914") ? [] : (stryCov_9fa48("3914"), [fallback]));
  }
}
export function useEventNavigation() {
  if (stryMutAct_9fa48("3915")) {
    {}
  } else {
    stryCov_9fa48("3915");
    return stryMutAct_9fa48("3916") ? {} : (stryCov_9fa48("3916"), {
      goToEvent: stryMutAct_9fa48("3917") ? () => undefined : (stryCov_9fa48("3917"), (eventId: string) => navigateToEvent(eventId)),
      goToEventCpid: stryMutAct_9fa48("3918") ? () => undefined : (stryCov_9fa48("3918"), (cpid: string) => navigateToEvent(cpid.replace(stryMutAct_9fa48("3919") ? "" : (stryCov_9fa48("3919"), 'CP-EVT-'), stryMutAct_9fa48("3920") ? "Stryker was here!" : (stryCov_9fa48("3920"), ''))))
    });
  }
}
export function useProfileNavigation() {
  if (stryMutAct_9fa48("3921")) {
    {}
  } else {
    stryCov_9fa48("3921");
    return stryMutAct_9fa48("3922") ? {} : (stryCov_9fa48("3922"), {
      goToProfile: stryMutAct_9fa48("3923") ? () => undefined : (stryCov_9fa48("3923"), (identifier: string) => navigateToProfile(identifier))
    });
  }
}
export function useDeepLinkSafe(href: Href) {
  if (stryMutAct_9fa48("3924")) {
    {}
  } else {
    stryCov_9fa48("3924");
    const pathname = usePathname();
    useLocalSearchParams(); // keep the hook call so it re-renders on param changes

    return useCallback(() => {
      if (stryMutAct_9fa48("3925")) {
        {}
      } else {
        stryCov_9fa48("3925");
        const target = (stryMutAct_9fa48("3928") ? typeof href !== 'string' : stryMutAct_9fa48("3927") ? false : stryMutAct_9fa48("3926") ? true : (stryCov_9fa48("3926", "3927", "3928"), typeof href === (stryMutAct_9fa48("3929") ? "" : (stryCov_9fa48("3929"), 'string')))) ? href : href.pathname;
        if (stryMutAct_9fa48("3932") ? pathname !== target : stryMutAct_9fa48("3931") ? false : stryMutAct_9fa48("3930") ? true : (stryCov_9fa48("3930", "3931", "3932"), pathname === target)) return;
        router.push(href);
      }
    }, stryMutAct_9fa48("3933") ? [] : (stryCov_9fa48("3933"), [href, pathname]));
  }
}