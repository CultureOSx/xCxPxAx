/**
 * useRole — Role and permission hook for CulturePassAU.
 *
 * Returns role flags and loading state for the current user.
 *
 * @returns {
 *   isAdmin: boolean,
 *   isOrganizer: boolean,
 *   isLoading: boolean,
 *   hasMinRole: (role: string) => boolean,
 * }
 */
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
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/shared/schema';
const ROLE_RANK: Record<UserRole, number> = stryMutAct_9fa48("100") ? {} : (stryCov_9fa48("100"), {
  user: 0,
  organizer: 1,
  business: 1,
  sponsor: 1,
  cityAdmin: 2,
  moderator: 3,
  admin: 4,
  platformAdmin: 4,
  superAdmin: 5
});
const SUPER_ADMIN_IDS = stryMutAct_9fa48("101") ? [] : (stryCov_9fa48("101"), [stryMutAct_9fa48("102") ? "" : (stryCov_9fa48("102"), '1VLiq1SEUzWNM7J2XScWn3UbFI52')]);

/**
 * Role-aware hook.
 *
 * Usage:
 *   const { isOrganizer, isAdmin, role } = useRole();
 *   if (!isOrganizer) return <AccessDenied />;
 */
export function useRole() {
  if (stryMutAct_9fa48("103")) {
    {}
  } else {
    stryCov_9fa48("103");
    const {
      user,
      isAuthenticated,
      isLoading,
      isRestoring
    } = useAuth();

    // Set role based on hardcoded ID list or existing user role
    let role: UserRole = stryMutAct_9fa48("104") ? user?.role as UserRole && 'user' : (stryCov_9fa48("104"), user?.role as UserRole ?? (stryMutAct_9fa48("105") ? "" : (stryCov_9fa48("105"), 'user')));
    if (stryMutAct_9fa48("108") ? user?.id || SUPER_ADMIN_IDS.includes(user.id) : stryMutAct_9fa48("107") ? false : stryMutAct_9fa48("106") ? true : (stryCov_9fa48("106", "107", "108"), (stryMutAct_9fa48("109") ? user.id : (stryCov_9fa48("109"), user?.id)) && SUPER_ADMIN_IDS.includes(user.id))) {
      if (stryMutAct_9fa48("110")) {
        {}
      } else {
        stryCov_9fa48("110");
        role = stryMutAct_9fa48("111") ? "" : (stryCov_9fa48("111"), 'superAdmin');
      }
    }
    return stryMutAct_9fa48("112") ? {} : (stryCov_9fa48("112"), {
      role,
      isAuthenticated,
      isLoading: stryMutAct_9fa48("115") ? isLoading && isRestoring : stryMutAct_9fa48("114") ? false : stryMutAct_9fa48("113") ? true : (stryCov_9fa48("113", "114", "115"), isLoading || isRestoring),
      /** rank >= organizer */
      isOrganizer: stryMutAct_9fa48("118") ? isAuthenticated || ROLE_RANK[role] >= ROLE_RANK['organizer'] : stryMutAct_9fa48("117") ? false : stryMutAct_9fa48("116") ? true : (stryCov_9fa48("116", "117", "118"), isAuthenticated && (stryMutAct_9fa48("121") ? ROLE_RANK[role] < ROLE_RANK['organizer'] : stryMutAct_9fa48("120") ? ROLE_RANK[role] > ROLE_RANK['organizer'] : stryMutAct_9fa48("119") ? true : (stryCov_9fa48("119", "120", "121"), ROLE_RANK[role] >= ROLE_RANK[stryMutAct_9fa48("122") ? "" : (stryCov_9fa48("122"), 'organizer')]))),
      /** rank >= cityAdmin */
      isCityAdmin: stryMutAct_9fa48("125") ? isAuthenticated || ROLE_RANK[role] >= ROLE_RANK['cityAdmin'] : stryMutAct_9fa48("124") ? false : stryMutAct_9fa48("123") ? true : (stryCov_9fa48("123", "124", "125"), isAuthenticated && (stryMutAct_9fa48("128") ? ROLE_RANK[role] < ROLE_RANK['cityAdmin'] : stryMutAct_9fa48("127") ? ROLE_RANK[role] > ROLE_RANK['cityAdmin'] : stryMutAct_9fa48("126") ? true : (stryCov_9fa48("126", "127", "128"), ROLE_RANK[role] >= ROLE_RANK[stryMutAct_9fa48("129") ? "" : (stryCov_9fa48("129"), 'cityAdmin')]))),
      /** rank >= moderator */
      isModerator: stryMutAct_9fa48("132") ? isAuthenticated || ROLE_RANK[role] >= ROLE_RANK['moderator'] : stryMutAct_9fa48("131") ? false : stryMutAct_9fa48("130") ? true : (stryCov_9fa48("130", "131", "132"), isAuthenticated && (stryMutAct_9fa48("135") ? ROLE_RANK[role] < ROLE_RANK['moderator'] : stryMutAct_9fa48("134") ? ROLE_RANK[role] > ROLE_RANK['moderator'] : stryMutAct_9fa48("133") ? true : (stryCov_9fa48("133", "134", "135"), ROLE_RANK[role] >= ROLE_RANK[stryMutAct_9fa48("136") ? "" : (stryCov_9fa48("136"), 'moderator')]))),
      /** rank >= admin */
      isAdmin: stryMutAct_9fa48("139") ? isAuthenticated || ROLE_RANK[role] >= ROLE_RANK['admin'] : stryMutAct_9fa48("138") ? false : stryMutAct_9fa48("137") ? true : (stryCov_9fa48("137", "138", "139"), isAuthenticated && (stryMutAct_9fa48("142") ? ROLE_RANK[role] < ROLE_RANK['admin'] : stryMutAct_9fa48("141") ? ROLE_RANK[role] > ROLE_RANK['admin'] : stryMutAct_9fa48("140") ? true : (stryCov_9fa48("140", "141", "142"), ROLE_RANK[role] >= ROLE_RANK[stryMutAct_9fa48("143") ? "" : (stryCov_9fa48("143"), 'admin')]))),
      /** exact super admin check */
      isSuperAdmin: stryMutAct_9fa48("146") ? isAuthenticated || ROLE_RANK[role] >= ROLE_RANK['superAdmin'] : stryMutAct_9fa48("145") ? false : stryMutAct_9fa48("144") ? true : (stryCov_9fa48("144", "145", "146"), isAuthenticated && (stryMutAct_9fa48("149") ? ROLE_RANK[role] < ROLE_RANK['superAdmin'] : stryMutAct_9fa48("148") ? ROLE_RANK[role] > ROLE_RANK['superAdmin'] : stryMutAct_9fa48("147") ? true : (stryCov_9fa48("147", "148", "149"), ROLE_RANK[role] >= ROLE_RANK[stryMutAct_9fa48("150") ? "" : (stryCov_9fa48("150"), 'superAdmin')]))),
      /** exact role match — use for specific roles like 'business' */
      hasRole: stryMutAct_9fa48("151") ? () => undefined : (stryCov_9fa48("151"), (...roles: UserRole[]) => stryMutAct_9fa48("154") ? isAuthenticated || roles.includes(role) : stryMutAct_9fa48("153") ? false : stryMutAct_9fa48("152") ? true : (stryCov_9fa48("152", "153", "154"), isAuthenticated && roles.includes(role))),
      /** rank comparison — use for "at least" checks */
      hasMinRole: stryMutAct_9fa48("155") ? () => undefined : (stryCov_9fa48("155"), (min: UserRole) => stryMutAct_9fa48("158") ? isAuthenticated || ROLE_RANK[role] >= ROLE_RANK[min] : stryMutAct_9fa48("157") ? false : stryMutAct_9fa48("156") ? true : (stryCov_9fa48("156", "157", "158"), isAuthenticated && (stryMutAct_9fa48("161") ? ROLE_RANK[role] < ROLE_RANK[min] : stryMutAct_9fa48("160") ? ROLE_RANK[role] > ROLE_RANK[min] : stryMutAct_9fa48("159") ? true : (stryCov_9fa48("159", "160", "161"), ROLE_RANK[role] >= ROLE_RANK[min]))))
    });
  }
}