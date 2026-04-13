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
import { Platform } from 'react-native';
import { SITE_ORIGIN } from '@/lib/app-meta';
const KERALA_HOSTS = new Set(stryMutAct_9fa48("2942") ? [] : (stryCov_9fa48("2942"), [stryMutAct_9fa48("2943") ? "" : (stryCov_9fa48("2943"), 'culturekerala.com'), stryMutAct_9fa48("2944") ? "" : (stryCov_9fa48("2944"), 'www.culturekerala.com')]));
function currentHostname(): string {
  if (stryMutAct_9fa48("2945")) {
    {}
  } else {
    stryCov_9fa48("2945");
    if (stryMutAct_9fa48("2948") ? Platform.OS === 'web' : stryMutAct_9fa48("2947") ? false : stryMutAct_9fa48("2946") ? true : (stryCov_9fa48("2946", "2947", "2948"), Platform.OS !== (stryMutAct_9fa48("2949") ? "" : (stryCov_9fa48("2949"), 'web')))) return stryMutAct_9fa48("2950") ? "Stryker was here!" : (stryCov_9fa48("2950"), '');
    if (stryMutAct_9fa48("2953") ? typeof window !== 'undefined' : stryMutAct_9fa48("2952") ? false : stryMutAct_9fa48("2951") ? true : (stryCov_9fa48("2951", "2952", "2953"), typeof window === (stryMutAct_9fa48("2954") ? "" : (stryCov_9fa48("2954"), 'undefined')))) return stryMutAct_9fa48("2955") ? "Stryker was here!" : (stryCov_9fa48("2955"), '');
    return stryMutAct_9fa48("2956") ? window.location.hostname.toUpperCase() : (stryCov_9fa48("2956"), window.location.hostname.toLowerCase());
  }
}
export function isCultureKeralaHost(): boolean {
  if (stryMutAct_9fa48("2957")) {
    {}
  } else {
    stryCov_9fa48("2957");
    return KERALA_HOSTS.has(currentHostname());
  }
}

/** Canonical share / SEO origin: CultureKerala domain when on that host, else culturepass.app */
export function getMarketingWebOrigin(): string {
  if (stryMutAct_9fa48("2958")) {
    {}
  } else {
    stryCov_9fa48("2958");
    if (stryMutAct_9fa48("2961") ? Platform.OS === 'web' || typeof window !== 'undefined' : stryMutAct_9fa48("2960") ? false : stryMutAct_9fa48("2959") ? true : (stryCov_9fa48("2959", "2960", "2961"), (stryMutAct_9fa48("2963") ? Platform.OS !== 'web' : stryMutAct_9fa48("2962") ? true : (stryCov_9fa48("2962", "2963"), Platform.OS === (stryMutAct_9fa48("2964") ? "" : (stryCov_9fa48("2964"), 'web')))) && (stryMutAct_9fa48("2966") ? typeof window === 'undefined' : stryMutAct_9fa48("2965") ? true : (stryCov_9fa48("2965", "2966"), typeof window !== (stryMutAct_9fa48("2967") ? "" : (stryCov_9fa48("2967"), 'undefined')))))) {
      if (stryMutAct_9fa48("2968")) {
        {}
      } else {
        stryCov_9fa48("2968");
        const h = stryMutAct_9fa48("2969") ? window.location.hostname.toUpperCase() : (stryCov_9fa48("2969"), window.location.hostname.toLowerCase());
        if (stryMutAct_9fa48("2971") ? false : stryMutAct_9fa48("2970") ? true : (stryCov_9fa48("2970", "2971"), KERALA_HOSTS.has(h))) {
          if (stryMutAct_9fa48("2972")) {
            {}
          } else {
            stryCov_9fa48("2972");
            return stryMutAct_9fa48("2973") ? `` : (stryCov_9fa48("2973"), `${window.location.protocol}//${window.location.host}`);
          }
        }
      }
    }
    return SITE_ORIGIN;
  }
}