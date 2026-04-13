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

/**
 * Avoid passing plain http:// URIs to native image loaders (iOS ATS blocks them).
 * Prefer https, Firebase token URLs, or same-origin assets.
 */
export function sanitizeRemoteImageUri(uri: string | null | undefined): string | undefined {
  if (stryMutAct_9fa48("4450")) {
    {}
  } else {
    stryCov_9fa48("4450");
    if (stryMutAct_9fa48("4453") ? uri == null && typeof uri !== 'string' : stryMutAct_9fa48("4452") ? false : stryMutAct_9fa48("4451") ? true : (stryCov_9fa48("4451", "4452", "4453"), (stryMutAct_9fa48("4455") ? uri != null : stryMutAct_9fa48("4454") ? false : (stryCov_9fa48("4454", "4455"), uri == null)) || (stryMutAct_9fa48("4457") ? typeof uri === 'string' : stryMutAct_9fa48("4456") ? false : (stryCov_9fa48("4456", "4457"), typeof uri !== (stryMutAct_9fa48("4458") ? "" : (stryCov_9fa48("4458"), 'string')))))) return undefined;
    const t = stryMutAct_9fa48("4459") ? uri : (stryCov_9fa48("4459"), uri.trim());
    if (stryMutAct_9fa48("4462") ? false : stryMutAct_9fa48("4461") ? true : stryMutAct_9fa48("4460") ? t : (stryCov_9fa48("4460", "4461", "4462"), !t)) return undefined;
    if (stryMutAct_9fa48("4465") ? t.endsWith('https://') : stryMutAct_9fa48("4464") ? false : stryMutAct_9fa48("4463") ? true : (stryCov_9fa48("4463", "4464", "4465"), t.startsWith(stryMutAct_9fa48("4466") ? "" : (stryCov_9fa48("4466"), 'https://')))) return t;
    if (stryMutAct_9fa48("4469") ? (t.startsWith('file://') || t.startsWith('content://') || t.startsWith('asset://')) && t.startsWith('ph://') : stryMutAct_9fa48("4468") ? false : stryMutAct_9fa48("4467") ? true : (stryCov_9fa48("4467", "4468", "4469"), (stryMutAct_9fa48("4471") ? (t.startsWith('file://') || t.startsWith('content://')) && t.startsWith('asset://') : stryMutAct_9fa48("4470") ? false : (stryCov_9fa48("4470", "4471"), (stryMutAct_9fa48("4473") ? t.startsWith('file://') && t.startsWith('content://') : stryMutAct_9fa48("4472") ? false : (stryCov_9fa48("4472", "4473"), (stryMutAct_9fa48("4474") ? t.endsWith('file://') : (stryCov_9fa48("4474"), t.startsWith(stryMutAct_9fa48("4475") ? "" : (stryCov_9fa48("4475"), 'file://')))) || (stryMutAct_9fa48("4476") ? t.endsWith('content://') : (stryCov_9fa48("4476"), t.startsWith(stryMutAct_9fa48("4477") ? "" : (stryCov_9fa48("4477"), 'content://')))))) || (stryMutAct_9fa48("4478") ? t.endsWith('asset://') : (stryCov_9fa48("4478"), t.startsWith(stryMutAct_9fa48("4479") ? "" : (stryCov_9fa48("4479"), 'asset://')))))) || (stryMutAct_9fa48("4480") ? t.endsWith('ph://') : (stryCov_9fa48("4480"), t.startsWith(stryMutAct_9fa48("4481") ? "" : (stryCov_9fa48("4481"), 'ph://')))))) {
      if (stryMutAct_9fa48("4482")) {
        {}
      } else {
        stryCov_9fa48("4482");
        return t;
      }
    }
    if (stryMutAct_9fa48("4485") ? t.endsWith('http://') : stryMutAct_9fa48("4484") ? false : stryMutAct_9fa48("4483") ? true : (stryCov_9fa48("4483", "4484", "4485"), t.startsWith(stryMutAct_9fa48("4486") ? "" : (stryCov_9fa48("4486"), 'http://')))) {
      if (stryMutAct_9fa48("4487")) {
        {}
      } else {
        stryCov_9fa48("4487");
        if (stryMutAct_9fa48("4490") ? Platform.OS !== 'web' : stryMutAct_9fa48("4489") ? false : stryMutAct_9fa48("4488") ? true : (stryCov_9fa48("4488", "4489", "4490"), Platform.OS === (stryMutAct_9fa48("4491") ? "" : (stryCov_9fa48("4491"), 'web')))) return t;
        return undefined;
      }
    }
    return t;
  }
}