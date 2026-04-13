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
import type { EventData } from '@/shared/schema';

/**
 * Card/list hero: prefer `imageUrl`, fall back to `heroImageUrl` (wizard / legacy docs).
 * Server GET /api/events also coalesces these; this keeps older cached payloads and embeds working.
 */
export function eventListImageUrl(event: Pick<EventData, 'imageUrl' | 'heroImageUrl'>): string | undefined {
  if (stryMutAct_9fa48("2974")) {
    {}
  } else {
    stryCov_9fa48("2974");
    const primary = stryMutAct_9fa48("2976") ? event.imageUrl.trim() : stryMutAct_9fa48("2975") ? event.imageUrl : (stryCov_9fa48("2975", "2976"), event.imageUrl?.trim());
    if (stryMutAct_9fa48("2978") ? false : stryMutAct_9fa48("2977") ? true : (stryCov_9fa48("2977", "2978"), primary)) return primary;
    const hero = stryMutAct_9fa48("2980") ? event.heroImageUrl.trim() : stryMutAct_9fa48("2979") ? event.heroImageUrl : (stryCov_9fa48("2979", "2980"), event.heroImageUrl?.trim());
    if (stryMutAct_9fa48("2982") ? false : stryMutAct_9fa48("2981") ? true : (stryCov_9fa48("2981", "2982"), hero)) return hero;
    return undefined;
  }
}