// @ts-nocheck
// lib/firebase/explore.ts
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
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
export const getExploreItems = async (filters: any) => {
  if (stryMutAct_9fa48("3213")) {
    {}
  } else {
    stryCov_9fa48("3213");
    let q = query(collection(db, stryMutAct_9fa48("3214") ? "" : (stryCov_9fa48("3214"), 'events')), orderBy(stryMutAct_9fa48("3215") ? "" : (stryCov_9fa48("3215"), 'culturalRelevanceScore'), stryMutAct_9fa48("3216") ? "" : (stryCov_9fa48("3216"), 'desc')), orderBy(stryMutAct_9fa48("3217") ? "" : (stryCov_9fa48("3217"), 'startDate'), stryMutAct_9fa48("3218") ? "" : (stryCov_9fa48("3218"), 'asc')), limit(50));
    if (stryMutAct_9fa48("3221") ? filters.categories.length : stryMutAct_9fa48("3220") ? false : stryMutAct_9fa48("3219") ? true : (stryCov_9fa48("3219", "3220", "3221"), filters.categories?.length)) {
      if (stryMutAct_9fa48("3222")) {
        {}
      } else {
        stryCov_9fa48("3222");
        q = query(q, where(stryMutAct_9fa48("3223") ? "" : (stryCov_9fa48("3223"), 'categories'), stryMutAct_9fa48("3224") ? "" : (stryCov_9fa48("3224"), 'array-contains-any'), filters.categories));
      }
    }
    if (stryMutAct_9fa48("3227") ? filters.cultureTags.length : stryMutAct_9fa48("3226") ? false : stryMutAct_9fa48("3225") ? true : (stryCov_9fa48("3225", "3226", "3227"), filters.cultureTags?.length)) {
      if (stryMutAct_9fa48("3228")) {
        {}
      } else {
        stryCov_9fa48("3228");
        q = query(q, where(stryMutAct_9fa48("3229") ? "" : (stryCov_9fa48("3229"), 'cultureTags'), stryMutAct_9fa48("3230") ? "" : (stryCov_9fa48("3230"), 'array-contains-any'), filters.cultureTags));
      }
    }
    const snapshot = await getDocs(q);
    return stryMutAct_9fa48("3231") ? {} : (stryCov_9fa48("3231"), {
      events: snapshot.docs.map(stryMutAct_9fa48("3232") ? () => undefined : (stryCov_9fa48("3232"), doc => stryMutAct_9fa48("3233") ? {} : (stryCov_9fa48("3233"), {
        id: doc.id,
        ...doc.data()
      })))
    });
  }
};