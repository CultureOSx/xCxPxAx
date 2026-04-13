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
import type { EventData, Profile } from '@/shared/schema';
const INDIGENOUS_KEYWORDS = ['indigenous', 'first nations', 'aboriginal', 'torres strait', 'naidoc', 'yolngu', 'gadigal'] as const;
function includesIndigenousKeyword(text: string): boolean {
  if (stryMutAct_9fa48("3704")) {
    {}
  } else {
    stryCov_9fa48("3704");
    const lowered = stryMutAct_9fa48("3705") ? text.toUpperCase() : (stryCov_9fa48("3705"), text.toLowerCase());
    return stryMutAct_9fa48("3706") ? INDIGENOUS_KEYWORDS.every(keyword => lowered.includes(keyword)) : (stryCov_9fa48("3706"), INDIGENOUS_KEYWORDS.some(stryMutAct_9fa48("3707") ? () => undefined : (stryCov_9fa48("3707"), keyword => lowered.includes(keyword))));
  }
}
export function isIndigenousEvent(event: EventData): boolean {
  if (stryMutAct_9fa48("3708")) {
    {}
  } else {
    stryCov_9fa48("3708");
    const record = event as unknown as Record<string, unknown>;
    const indigenousTags = Array.isArray(record.indigenousTags) ? (record.indigenousTags as unknown[]).map(stryMutAct_9fa48("3709") ? () => undefined : (stryCov_9fa48("3709"), value => String(value))) : stryMutAct_9fa48("3710") ? ["Stryker was here"] : (stryCov_9fa48("3710"), []);
    const haystack = (stryMutAct_9fa48("3711") ? [] : (stryCov_9fa48("3711"), [stryMutAct_9fa48("3712") ? event.title && '' : (stryCov_9fa48("3712"), event.title ?? (stryMutAct_9fa48("3713") ? "Stryker was here!" : (stryCov_9fa48("3713"), ''))), stryMutAct_9fa48("3714") ? event.description && '' : (stryCov_9fa48("3714"), event.description ?? (stryMutAct_9fa48("3715") ? "Stryker was here!" : (stryCov_9fa48("3715"), ''))), stryMutAct_9fa48("3716") ? event.category && '' : (stryCov_9fa48("3716"), event.category ?? (stryMutAct_9fa48("3717") ? "Stryker was here!" : (stryCov_9fa48("3717"), ''))), ...(stryMutAct_9fa48("3718") ? event.tags && [] : (stryCov_9fa48("3718"), event.tags ?? (stryMutAct_9fa48("3719") ? ["Stryker was here"] : (stryCov_9fa48("3719"), [])))), ...(stryMutAct_9fa48("3720") ? event.cultureTag && [] : (stryCov_9fa48("3720"), event.cultureTag ?? (stryMutAct_9fa48("3721") ? ["Stryker was here"] : (stryCov_9fa48("3721"), [])))), ...indigenousTags])).join(stryMutAct_9fa48("3722") ? "" : (stryCov_9fa48("3722"), ' '));
    return includesIndigenousKeyword(haystack);
  }
}
export function isIndigenousProfile(profile: Profile): boolean {
  if (stryMutAct_9fa48("3723")) {
    {}
  } else {
    stryCov_9fa48("3723");
    const tags = Array.isArray(profile.tags) ? profile.tags.join(stryMutAct_9fa48("3724") ? "" : (stryCov_9fa48("3724"), ' ')) : stryMutAct_9fa48("3725") ? "Stryker was here!" : (stryCov_9fa48("3725"), '');
    const haystack = (stryMutAct_9fa48("3726") ? [] : (stryCov_9fa48("3726"), [profile.name, stryMutAct_9fa48("3727") ? profile.description && '' : (stryCov_9fa48("3727"), profile.description ?? (stryMutAct_9fa48("3728") ? "Stryker was here!" : (stryCov_9fa48("3728"), ''))), stryMutAct_9fa48("3729") ? profile.category && '' : (stryCov_9fa48("3729"), profile.category ?? (stryMutAct_9fa48("3730") ? "Stryker was here!" : (stryCov_9fa48("3730"), ''))), profile.entityType, tags])).join(stryMutAct_9fa48("3731") ? "" : (stryCov_9fa48("3731"), ' '));
    return includesIndigenousKeyword(haystack);
  }
}