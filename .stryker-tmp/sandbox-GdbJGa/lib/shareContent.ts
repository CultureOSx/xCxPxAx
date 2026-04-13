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
import { Platform, Share } from 'react-native';
export type ShareLinkOptions = {
  title?: string;
  /** Primary text (without URL is fine if `url` is set). */
  message: string;
  /** Optional link; merged into the payload so Messages / WhatsApp / Mail receive a tappable link on iOS. */
  url?: string;
};

/**
 * System share sheet tuned for iOS: many apps only consume a single well-formed `message`
 * string; passing `url` alone often yields empty content in Messages/WhatsApp.
 */
export async function shareLinkContent(opts: ShareLinkOptions): Promise<void> {
  if (stryMutAct_9fa48("4841")) {
    {}
  } else {
    stryCov_9fa48("4841");
    const url = stryMutAct_9fa48("4842") ? opts.url ?? '' : (stryCov_9fa48("4842"), (stryMutAct_9fa48("4843") ? opts.url && '' : (stryCov_9fa48("4843"), opts.url ?? (stryMutAct_9fa48("4844") ? "Stryker was here!" : (stryCov_9fa48("4844"), '')))).trim());
    const msg = stryMutAct_9fa48("4845") ? opts.message : (stryCov_9fa48("4845"), opts.message.trim());
    const combined = (stryMutAct_9fa48("4848") ? url || !msg.includes(url) : stryMutAct_9fa48("4847") ? false : stryMutAct_9fa48("4846") ? true : (stryCov_9fa48("4846", "4847", "4848"), url && (stryMutAct_9fa48("4849") ? msg.includes(url) : (stryCov_9fa48("4849"), !msg.includes(url))))) ? stryMutAct_9fa48("4850") ? msg ? `${msg}\n\n${url}` : url : (stryCov_9fa48("4850"), (msg ? stryMutAct_9fa48("4851") ? `` : (stryCov_9fa48("4851"), `${msg}\n\n${url}`) : url).trim()) : stryMutAct_9fa48("4854") ? msg && url : stryMutAct_9fa48("4853") ? false : stryMutAct_9fa48("4852") ? true : (stryCov_9fa48("4852", "4853", "4854"), msg || url);
    if (stryMutAct_9fa48("4857") ? false : stryMutAct_9fa48("4856") ? true : stryMutAct_9fa48("4855") ? combined : (stryCov_9fa48("4855", "4856", "4857"), !combined)) return;
    if (stryMutAct_9fa48("4860") ? Platform.OS !== 'web' : stryMutAct_9fa48("4859") ? false : stryMutAct_9fa48("4858") ? true : (stryCov_9fa48("4858", "4859", "4860"), Platform.OS === (stryMutAct_9fa48("4861") ? "" : (stryCov_9fa48("4861"), 'web')))) {
      if (stryMutAct_9fa48("4862")) {
        {}
      } else {
        stryCov_9fa48("4862");
        if (stryMutAct_9fa48("4865") ? typeof navigator !== 'undefined' || typeof navigator.share === 'function' : stryMutAct_9fa48("4864") ? false : stryMutAct_9fa48("4863") ? true : (stryCov_9fa48("4863", "4864", "4865"), (stryMutAct_9fa48("4867") ? typeof navigator === 'undefined' : stryMutAct_9fa48("4866") ? true : (stryCov_9fa48("4866", "4867"), typeof navigator !== (stryMutAct_9fa48("4868") ? "" : (stryCov_9fa48("4868"), 'undefined')))) && (stryMutAct_9fa48("4870") ? typeof navigator.share !== 'function' : stryMutAct_9fa48("4869") ? true : (stryCov_9fa48("4869", "4870"), typeof navigator.share === (stryMutAct_9fa48("4871") ? "" : (stryCov_9fa48("4871"), 'function')))))) {
          if (stryMutAct_9fa48("4872")) {
            {}
          } else {
            stryCov_9fa48("4872");
            await navigator.share(stryMutAct_9fa48("4873") ? {} : (stryCov_9fa48("4873"), {
              title: opts.title,
              text: combined,
              ...(url ? stryMutAct_9fa48("4874") ? {} : (stryCov_9fa48("4874"), {
                url
              }) : {})
            }));
            return;
          }
        }
        if (stryMutAct_9fa48("4877") ? url || typeof window !== 'undefined' : stryMutAct_9fa48("4876") ? false : stryMutAct_9fa48("4875") ? true : (stryCov_9fa48("4875", "4876", "4877"), url && (stryMutAct_9fa48("4879") ? typeof window === 'undefined' : stryMutAct_9fa48("4878") ? true : (stryCov_9fa48("4878", "4879"), typeof window !== (stryMutAct_9fa48("4880") ? "" : (stryCov_9fa48("4880"), 'undefined')))))) {
          if (stryMutAct_9fa48("4881")) {
            {}
          } else {
            stryCov_9fa48("4881");
            window.open(url, stryMutAct_9fa48("4882") ? "" : (stryCov_9fa48("4882"), '_blank'), stryMutAct_9fa48("4883") ? "" : (stryCov_9fa48("4883"), 'noopener,noreferrer'));
          }
        }
        return;
      }
    }
    if (stryMutAct_9fa48("4886") ? Platform.OS !== 'ios' : stryMutAct_9fa48("4885") ? false : stryMutAct_9fa48("4884") ? true : (stryCov_9fa48("4884", "4885", "4886"), Platform.OS === (stryMutAct_9fa48("4887") ? "" : (stryCov_9fa48("4887"), 'ios')))) {
      if (stryMutAct_9fa48("4888")) {
        {}
      } else {
        stryCov_9fa48("4888");
        await Share.share(stryMutAct_9fa48("4889") ? {} : (stryCov_9fa48("4889"), {
          title: opts.title,
          message: combined
        }));
        return;
      }
    }
    await Share.share(stryMutAct_9fa48("4890") ? {} : (stryCov_9fa48("4890"), {
      title: stryMutAct_9fa48("4891") ? opts.title && 'CulturePass' : (stryCov_9fa48("4891"), opts.title ?? (stryMutAct_9fa48("4892") ? "" : (stryCov_9fa48("4892"), 'CulturePass'))),
      message: combined,
      ...(url ? stryMutAct_9fa48("4893") ? {} : (stryCov_9fa48("4893"), {
        url
      }) : {})
    }));
  }
}