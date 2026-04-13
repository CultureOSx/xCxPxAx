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
import { findNodeHandle, UIManager } from 'react-native';
import type { ScrollView, View } from 'react-native';
import type React from 'react';

/** Native node for ScrollView scrollable content (for measureLayout). */
export function getScrollContentNode(scrollRef: React.RefObject<ScrollView | null>): number | null {
  if (stryMutAct_9fa48("4805")) {
    {}
  } else {
    stryCov_9fa48("4805");
    const sc = scrollRef.current as unknown as {
      getInnerViewRef?: () => unknown;
    } | null;
    if (stryMutAct_9fa48("4808") ? false : stryMutAct_9fa48("4807") ? true : stryMutAct_9fa48("4806") ? sc : (stryCov_9fa48("4806", "4807", "4808"), !sc)) return null;
    const inner = stryMutAct_9fa48("4809") ? sc.getInnerViewRef() : (stryCov_9fa48("4809"), sc.getInnerViewRef?.());
    if (stryMutAct_9fa48("4812") ? inner == null : stryMutAct_9fa48("4811") ? false : stryMutAct_9fa48("4810") ? true : (stryCov_9fa48("4810", "4811", "4812"), inner != null)) return findNodeHandle(inner as never);
    return findNodeHandle(sc as never);
  }
}

/** Scroll so `childRef` is near the top of the scroll content, with Y fallback if measure fails. */
export function scrollToChildInScrollView(scrollRef: React.RefObject<ScrollView | null>, childRef: React.RefObject<View | null>, options: {
  offset?: number;
  fallbackY?: number;
}): void {
  if (stryMutAct_9fa48("4813")) {
    {}
  } else {
    stryCov_9fa48("4813");
    const offset = stryMutAct_9fa48("4814") ? options.offset && 8 : (stryCov_9fa48("4814"), options.offset ?? 8);
    const fallbackY = stryMutAct_9fa48("4815") ? options.fallbackY && 0 : (stryCov_9fa48("4815"), options.fallbackY ?? 0);
    const rel = getScrollContentNode(scrollRef);
    const target = findNodeHandle(childRef.current);
    if (stryMutAct_9fa48("4818") ? rel != null || target != null : stryMutAct_9fa48("4817") ? false : stryMutAct_9fa48("4816") ? true : (stryCov_9fa48("4816", "4817", "4818"), (stryMutAct_9fa48("4820") ? rel == null : stryMutAct_9fa48("4819") ? true : (stryCov_9fa48("4819", "4820"), rel != null)) && (stryMutAct_9fa48("4822") ? target == null : stryMutAct_9fa48("4821") ? true : (stryCov_9fa48("4821", "4822"), target != null)))) {
      if (stryMutAct_9fa48("4823")) {
        {}
      } else {
        stryCov_9fa48("4823");
        UIManager.measureLayout(target, rel, () => {
          if (stryMutAct_9fa48("4824")) {
            {}
          } else {
            stryCov_9fa48("4824");
            stryMutAct_9fa48("4825") ? scrollRef.current.scrollTo({
              y: Math.max(0, fallbackY - offset),
              animated: true
            }) : (stryCov_9fa48("4825"), scrollRef.current?.scrollTo(stryMutAct_9fa48("4826") ? {} : (stryCov_9fa48("4826"), {
              y: stryMutAct_9fa48("4827") ? Math.min(0, fallbackY - offset) : (stryCov_9fa48("4827"), Math.max(0, stryMutAct_9fa48("4828") ? fallbackY + offset : (stryCov_9fa48("4828"), fallbackY - offset))),
              animated: stryMutAct_9fa48("4829") ? false : (stryCov_9fa48("4829"), true)
            })));
          }
        }, (_x, y) => {
          if (stryMutAct_9fa48("4830")) {
            {}
          } else {
            stryCov_9fa48("4830");
            stryMutAct_9fa48("4831") ? scrollRef.current.scrollTo({
              y: Math.max(0, y - offset),
              animated: true
            }) : (stryCov_9fa48("4831"), scrollRef.current?.scrollTo(stryMutAct_9fa48("4832") ? {} : (stryCov_9fa48("4832"), {
              y: stryMutAct_9fa48("4833") ? Math.min(0, y - offset) : (stryCov_9fa48("4833"), Math.max(0, stryMutAct_9fa48("4834") ? y + offset : (stryCov_9fa48("4834"), y - offset))),
              animated: stryMutAct_9fa48("4835") ? false : (stryCov_9fa48("4835"), true)
            })));
          }
        });
        return;
      }
    }
    stryMutAct_9fa48("4836") ? scrollRef.current.scrollTo({
      y: Math.max(0, fallbackY - offset),
      animated: true
    }) : (stryCov_9fa48("4836"), scrollRef.current?.scrollTo(stryMutAct_9fa48("4837") ? {} : (stryCov_9fa48("4837"), {
      y: stryMutAct_9fa48("4838") ? Math.min(0, fallbackY - offset) : (stryCov_9fa48("4838"), Math.max(0, stryMutAct_9fa48("4839") ? fallbackY + offset : (stryCov_9fa48("4839"), fallbackY - offset))),
      animated: stryMutAct_9fa48("4840") ? false : (stryCov_9fa48("4840"), true)
    })));
  }
}