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
import { api } from '@/lib/api';

/** Persist country + city to the signed-in user profile (best-effort). */
export async function syncUserMarketplaceLocation(userId: string | null | undefined, country: string, city: string): Promise<void> {
  if (stryMutAct_9fa48("4954")) {
    {}
  } else {
    stryCov_9fa48("4954");
    if (stryMutAct_9fa48("4957") ? (!userId || !country.trim()) && !city.trim() : stryMutAct_9fa48("4956") ? false : stryMutAct_9fa48("4955") ? true : (stryCov_9fa48("4955", "4956", "4957"), (stryMutAct_9fa48("4959") ? !userId && !country.trim() : stryMutAct_9fa48("4958") ? false : (stryCov_9fa48("4958", "4959"), (stryMutAct_9fa48("4960") ? userId : (stryCov_9fa48("4960"), !userId)) || (stryMutAct_9fa48("4961") ? country.trim() : (stryCov_9fa48("4961"), !(stryMutAct_9fa48("4962") ? country : (stryCov_9fa48("4962"), country.trim())))))) || (stryMutAct_9fa48("4963") ? city.trim() : (stryCov_9fa48("4963"), !(stryMutAct_9fa48("4964") ? city : (stryCov_9fa48("4964"), city.trim())))))) return;
    try {
      if (stryMutAct_9fa48("4965")) {
        {}
      } else {
        stryCov_9fa48("4965");
        await api.users.update(userId, stryMutAct_9fa48("4966") ? {} : (stryCov_9fa48("4966"), {
          country: stryMutAct_9fa48("4967") ? country : (stryCov_9fa48("4967"), country.trim()),
          city: stryMutAct_9fa48("4968") ? city : (stryCov_9fa48("4968"), city.trim())
        }));
      }
    } catch (e) {
      if (stryMutAct_9fa48("4969")) {
        {}
      } else {
        stryCov_9fa48("4969");
        if (stryMutAct_9fa48("4971") ? false : stryMutAct_9fa48("4970") ? true : (stryCov_9fa48("4970", "4971"), __DEV__)) {
          if (stryMutAct_9fa48("4972")) {
            {}
          } else {
            stryCov_9fa48("4972");
            console.warn(stryMutAct_9fa48("4973") ? "" : (stryCov_9fa48("4973"), '[syncUserMarketplaceLocation] failed'), e);
          }
        }
      }
    }
  }
}