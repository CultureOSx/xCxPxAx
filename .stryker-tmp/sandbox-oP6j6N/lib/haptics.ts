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
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
export const HapticManager = stryMutAct_9fa48("3283") ? {} : (stryCov_9fa48("3283"), {
  /**
   * For light navigation, small toggles, or minor interactions.
   */
  light: async (): Promise<void> => {
    if (stryMutAct_9fa48("3284")) {
      {}
    } else {
      stryCov_9fa48("3284");
      if (stryMutAct_9fa48("3287") ? Platform.OS === 'web' : stryMutAct_9fa48("3286") ? false : stryMutAct_9fa48("3285") ? true : (stryCov_9fa48("3285", "3286", "3287"), Platform.OS !== (stryMutAct_9fa48("3288") ? "" : (stryCov_9fa48("3288"), 'web')))) {
        if (stryMutAct_9fa48("3289")) {
          {}
        } else {
          stryCov_9fa48("3289");
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    }
  },
  /**
   * For standard button presses, form submissions, or important actions.
   */
  medium: async (): Promise<void> => {
    if (stryMutAct_9fa48("3290")) {
      {}
    } else {
      stryCov_9fa48("3290");
      if (stryMutAct_9fa48("3293") ? Platform.OS === 'web' : stryMutAct_9fa48("3292") ? false : stryMutAct_9fa48("3291") ? true : (stryCov_9fa48("3291", "3292", "3293"), Platform.OS !== (stryMutAct_9fa48("3294") ? "" : (stryCov_9fa48("3294"), 'web')))) {
        if (stryMutAct_9fa48("3295")) {
          {}
        } else {
          stryCov_9fa48("3295");
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    }
  },
  /**
   * For heavy, critical actions like destructive deletes or major transformations.
   */
  heavy: async (): Promise<void> => {
    if (stryMutAct_9fa48("3296")) {
      {}
    } else {
      stryCov_9fa48("3296");
      if (stryMutAct_9fa48("3299") ? Platform.OS === 'web' : stryMutAct_9fa48("3298") ? false : stryMutAct_9fa48("3297") ? true : (stryCov_9fa48("3297", "3298", "3299"), Platform.OS !== (stryMutAct_9fa48("3300") ? "" : (stryCov_9fa48("3300"), 'web')))) {
        if (stryMutAct_9fa48("3301")) {
          {}
        } else {
          stryCov_9fa48("3301");
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
      }
    }
  },
  /**
   * For successful completions (e.g., ticket purchased, profile saved).
   */
  success: async (): Promise<void> => {
    if (stryMutAct_9fa48("3302")) {
      {}
    } else {
      stryCov_9fa48("3302");
      if (stryMutAct_9fa48("3305") ? Platform.OS === 'web' : stryMutAct_9fa48("3304") ? false : stryMutAct_9fa48("3303") ? true : (stryCov_9fa48("3303", "3304", "3305"), Platform.OS !== (stryMutAct_9fa48("3306") ? "" : (stryCov_9fa48("3306"), 'web')))) {
        if (stryMutAct_9fa48("3307")) {
          {}
        } else {
          stryCov_9fa48("3307");
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }
  },
  /**
   * For warnings or destructive confirmations.
   */
  warning: async (): Promise<void> => {
    if (stryMutAct_9fa48("3308")) {
      {}
    } else {
      stryCov_9fa48("3308");
      if (stryMutAct_9fa48("3311") ? Platform.OS === 'web' : stryMutAct_9fa48("3310") ? false : stryMutAct_9fa48("3309") ? true : (stryCov_9fa48("3309", "3310", "3311"), Platform.OS !== (stryMutAct_9fa48("3312") ? "" : (stryCov_9fa48("3312"), 'web')))) {
        if (stryMutAct_9fa48("3313")) {
          {}
        } else {
          stryCov_9fa48("3313");
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    }
  },
  /**
   * For validation errors, failed API calls, or blocked actions.
   */
  error: async (): Promise<void> => {
    if (stryMutAct_9fa48("3314")) {
      {}
    } else {
      stryCov_9fa48("3314");
      if (stryMutAct_9fa48("3317") ? Platform.OS === 'web' : stryMutAct_9fa48("3316") ? false : stryMutAct_9fa48("3315") ? true : (stryCov_9fa48("3315", "3316", "3317"), Platform.OS !== (stryMutAct_9fa48("3318") ? "" : (stryCov_9fa48("3318"), 'web')))) {
        if (stryMutAct_9fa48("3319")) {
          {}
        } else {
          stryCov_9fa48("3319");
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    }
  }
});