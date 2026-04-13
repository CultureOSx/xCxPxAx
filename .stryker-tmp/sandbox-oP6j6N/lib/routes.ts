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
export const LEGACY_ROUTE_REMAPS = [['/events/', '/event/'], ['/artists/', '/artist/'], ['/communities/', '/community/'], ['/profiles/', '/profile/'], ['/tickets/', '/tickets/'], ['/users/', '/user/'], ['/businesses/', '/business/']] as const;
type RedirectValue = string | string[] | null | undefined;
export function remapLegacyPath(path: string): string {
  if (stryMutAct_9fa48("4728")) {
    {}
  } else {
    stryCov_9fa48("4728");
    if (stryMutAct_9fa48("4731") ? false : stryMutAct_9fa48("4730") ? true : stryMutAct_9fa48("4729") ? path : (stryCov_9fa48("4729", "4730", "4731"), !path)) return stryMutAct_9fa48("4732") ? "" : (stryCov_9fa48("4732"), '/');
    const [rawPath, rawQuery] = path.split(stryMutAct_9fa48("4733") ? "" : (stryCov_9fa48("4733"), '?'));
    const cleanPath = stryMutAct_9fa48("4736") ? rawPath && '/' : stryMutAct_9fa48("4735") ? false : stryMutAct_9fa48("4734") ? true : (stryCov_9fa48("4734", "4735", "4736"), rawPath || (stryMutAct_9fa48("4737") ? "" : (stryCov_9fa48("4737"), '/')));
    const querySuffix = rawQuery ? stryMutAct_9fa48("4738") ? `` : (stryCov_9fa48("4738"), `?${rawQuery}`) : stryMutAct_9fa48("4739") ? "Stryker was here!" : (stryCov_9fa48("4739"), '');
    for (const [from, to] of LEGACY_ROUTE_REMAPS) {
      if (stryMutAct_9fa48("4740")) {
        {}
      } else {
        stryCov_9fa48("4740");
        if (stryMutAct_9fa48("4743") ? cleanPath.endsWith(from) : stryMutAct_9fa48("4742") ? false : stryMutAct_9fa48("4741") ? true : (stryCov_9fa48("4741", "4742", "4743"), cleanPath.startsWith(from))) {
          if (stryMutAct_9fa48("4744")) {
            {}
          } else {
            stryCov_9fa48("4744");
            return stryMutAct_9fa48("4745") ? `` : (stryCov_9fa48("4745"), `${cleanPath.replace(from, to)}${querySuffix}`);
          }
        }
      }
    }
    return stryMutAct_9fa48("4746") ? `` : (stryCov_9fa48("4746"), `${cleanPath}${querySuffix}`);
  }
}
export function normalizeSystemPath(path: string, initial = stryMutAct_9fa48("4747") ? true : (stryCov_9fa48("4747"), false)): string {
  if (stryMutAct_9fa48("4748")) {
    {}
  } else {
    stryCov_9fa48("4748");
    if (stryMutAct_9fa48("4751") ? false : stryMutAct_9fa48("4750") ? true : stryMutAct_9fa48("4749") ? path : (stryCov_9fa48("4749", "4750", "4751"), !path)) return stryMutAct_9fa48("4752") ? "" : (stryCov_9fa48("4752"), '/');
    const remapped = remapLegacyPath(path);
    const [rawPath, rawQuery] = remapped.split(stryMutAct_9fa48("4753") ? "" : (stryCov_9fa48("4753"), '?'));
    const cleanPath = stryMutAct_9fa48("4756") ? rawPath && '/' : stryMutAct_9fa48("4755") ? false : stryMutAct_9fa48("4754") ? true : (stryCov_9fa48("4754", "4755", "4756"), rawPath || (stryMutAct_9fa48("4757") ? "" : (stryCov_9fa48("4757"), '/')));
    const querySuffix = rawQuery ? stryMutAct_9fa48("4758") ? `` : (stryCov_9fa48("4758"), `?${rawQuery}`) : stryMutAct_9fa48("4759") ? "Stryker was here!" : (stryCov_9fa48("4759"), '');
    if (stryMutAct_9fa48("4762") ? initial || cleanPath === '/home' : stryMutAct_9fa48("4761") ? false : stryMutAct_9fa48("4760") ? true : (stryCov_9fa48("4760", "4761", "4762"), initial && (stryMutAct_9fa48("4764") ? cleanPath !== '/home' : stryMutAct_9fa48("4763") ? true : (stryCov_9fa48("4763", "4764"), cleanPath === (stryMutAct_9fa48("4765") ? "" : (stryCov_9fa48("4765"), '/home')))))) {
      if (stryMutAct_9fa48("4766")) {
        {}
      } else {
        stryCov_9fa48("4766");
        return stryMutAct_9fa48("4767") ? `` : (stryCov_9fa48("4767"), `/(tabs)${querySuffix}`);
      }
    }
    return stryMutAct_9fa48("4768") ? `` : (stryCov_9fa48("4768"), `${cleanPath}${querySuffix}`);
  }
}
export function sanitizeInternalRedirect(value: RedirectValue): string | null {
  if (stryMutAct_9fa48("4769")) {
    {}
  } else {
    stryCov_9fa48("4769");
    const candidate = Array.isArray(value) ? value[0] : value;
    if (stryMutAct_9fa48("4772") ? false : stryMutAct_9fa48("4771") ? true : stryMutAct_9fa48("4770") ? candidate : (stryCov_9fa48("4770", "4771", "4772"), !candidate)) return null;
    if (stryMutAct_9fa48("4775") ? (!candidate.startsWith('/') || candidate.startsWith('//')) && candidate.includes('://') : stryMutAct_9fa48("4774") ? false : stryMutAct_9fa48("4773") ? true : (stryCov_9fa48("4773", "4774", "4775"), (stryMutAct_9fa48("4777") ? !candidate.startsWith('/') && candidate.startsWith('//') : stryMutAct_9fa48("4776") ? false : (stryCov_9fa48("4776", "4777"), (stryMutAct_9fa48("4778") ? candidate.startsWith('/') : (stryCov_9fa48("4778"), !(stryMutAct_9fa48("4779") ? candidate.endsWith('/') : (stryCov_9fa48("4779"), candidate.startsWith(stryMutAct_9fa48("4780") ? "" : (stryCov_9fa48("4780"), '/')))))) || (stryMutAct_9fa48("4781") ? candidate.endsWith('//') : (stryCov_9fa48("4781"), candidate.startsWith(stryMutAct_9fa48("4782") ? "" : (stryCov_9fa48("4782"), '//')))))) || candidate.includes(stryMutAct_9fa48("4783") ? "" : (stryCov_9fa48("4783"), '://')))) {
      if (stryMutAct_9fa48("4784")) {
        {}
      } else {
        stryCov_9fa48("4784");
        return null;
      }
    }
    const normalized = remapLegacyPath(candidate);
    const cleanPath = stryMutAct_9fa48("4787") ? normalized.split('?')[0] && '/' : stryMutAct_9fa48("4786") ? false : stryMutAct_9fa48("4785") ? true : (stryCov_9fa48("4785", "4786", "4787"), normalized.split(stryMutAct_9fa48("4788") ? "" : (stryCov_9fa48("4788"), '?'))[0] || (stryMutAct_9fa48("4789") ? "" : (stryCov_9fa48("4789"), '/')));

    // Redirects should always leave the auth/onboarding shell.
    if (stryMutAct_9fa48("4792") ? cleanPath.startsWith('/(onboarding)') && cleanPath === '/landing' : stryMutAct_9fa48("4791") ? false : stryMutAct_9fa48("4790") ? true : (stryCov_9fa48("4790", "4791", "4792"), (stryMutAct_9fa48("4793") ? cleanPath.endsWith('/(onboarding)') : (stryCov_9fa48("4793"), cleanPath.startsWith(stryMutAct_9fa48("4794") ? "" : (stryCov_9fa48("4794"), '/(onboarding)')))) || (stryMutAct_9fa48("4796") ? cleanPath !== '/landing' : stryMutAct_9fa48("4795") ? false : (stryCov_9fa48("4795", "4796"), cleanPath === (stryMutAct_9fa48("4797") ? "" : (stryCov_9fa48("4797"), '/landing')))))) {
      if (stryMutAct_9fa48("4798")) {
        {}
      } else {
        stryCov_9fa48("4798");
        return null;
      }
    }
    return normalized;
  }
}
export function routeWithRedirect(pathname: string, redirectTo: RedirectValue) {
  if (stryMutAct_9fa48("4799")) {
    {}
  } else {
    stryCov_9fa48("4799");
    const safeRedirect = sanitizeInternalRedirect(redirectTo);
    if (stryMutAct_9fa48("4802") ? false : stryMutAct_9fa48("4801") ? true : stryMutAct_9fa48("4800") ? safeRedirect : (stryCov_9fa48("4800", "4801", "4802"), !safeRedirect)) return pathname;
    return stryMutAct_9fa48("4803") ? {} : (stryCov_9fa48("4803"), {
      pathname,
      params: stryMutAct_9fa48("4804") ? {} : (stryCov_9fa48("4804"), {
        redirectTo: safeRedirect
      })
    });
  }
}