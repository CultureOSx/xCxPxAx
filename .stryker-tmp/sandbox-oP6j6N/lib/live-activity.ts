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
import CultureLiveEventTracker, { type CultureLiveEventTrackerProps } from '@/widgets/CultureLiveEventTracker';
let activeEventTracker: Awaited<ReturnType<typeof CultureLiveEventTracker.start>> | null = null;
export async function startEventReminderActivity(payload: CultureLiveEventTrackerProps, deepLinkUrl?: string): Promise<void> {
  if (stryMutAct_9fa48("3732")) {
    {}
  } else {
    stryCov_9fa48("3732");
    if (stryMutAct_9fa48("3735") ? Platform.OS === 'ios' : stryMutAct_9fa48("3734") ? false : stryMutAct_9fa48("3733") ? true : (stryCov_9fa48("3733", "3734", "3735"), Platform.OS !== (stryMutAct_9fa48("3736") ? "" : (stryCov_9fa48("3736"), 'ios')))) return;
    activeEventTracker = await Promise.resolve(CultureLiveEventTracker.start(payload, deepLinkUrl));
  }
}
export async function updateEventReminderActivity(payload: CultureLiveEventTrackerProps): Promise<void> {
  if (stryMutAct_9fa48("3737")) {
    {}
  } else {
    stryCov_9fa48("3737");
    if (stryMutAct_9fa48("3740") ? Platform.OS !== 'ios' && !activeEventTracker : stryMutAct_9fa48("3739") ? false : stryMutAct_9fa48("3738") ? true : (stryCov_9fa48("3738", "3739", "3740"), (stryMutAct_9fa48("3742") ? Platform.OS === 'ios' : stryMutAct_9fa48("3741") ? false : (stryCov_9fa48("3741", "3742"), Platform.OS !== (stryMutAct_9fa48("3743") ? "" : (stryCov_9fa48("3743"), 'ios')))) || (stryMutAct_9fa48("3744") ? activeEventTracker : (stryCov_9fa48("3744"), !activeEventTracker)))) return;
    await activeEventTracker.update(payload);
  }
}
export async function endEventReminderActivity(): Promise<void> {
  if (stryMutAct_9fa48("3745")) {
    {}
  } else {
    stryCov_9fa48("3745");
    if (stryMutAct_9fa48("3748") ? Platform.OS !== 'ios' && !activeEventTracker : stryMutAct_9fa48("3747") ? false : stryMutAct_9fa48("3746") ? true : (stryCov_9fa48("3746", "3747", "3748"), (stryMutAct_9fa48("3750") ? Platform.OS === 'ios' : stryMutAct_9fa48("3749") ? false : (stryCov_9fa48("3749", "3750"), Platform.OS !== (stryMutAct_9fa48("3751") ? "" : (stryCov_9fa48("3751"), 'ios')))) || (stryMutAct_9fa48("3752") ? activeEventTracker : (stryCov_9fa48("3752"), !activeEventTracker)))) return;
    await activeEventTracker.end(stryMutAct_9fa48("3753") ? "" : (stryCov_9fa48("3753"), 'default'));
    activeEventTracker = null;
  }
}