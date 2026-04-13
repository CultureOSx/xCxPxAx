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
import { CultureTokens } from '@/constants/theme';
import type { Community, CommunityActivityLevel, CommunityCadence, CommunityJoinMode } from '@/shared/schema';
const CATEGORY_ACCENTS: Record<string, string> = stryMutAct_9fa48("1824") ? {} : (stryCov_9fa48("1824"), {
  cultural: CultureTokens.indigo,
  club: CultureTokens.gold,
  professional: CultureTokens.teal,
  business: CultureTokens.gold,
  council: CultureTokens.teal,
  charity: CultureTokens.coral
});
const JOIN_MODE_LABELS: Record<CommunityJoinMode, string> = stryMutAct_9fa48("1825") ? {} : (stryCov_9fa48("1825"), {
  open: stryMutAct_9fa48("1826") ? "" : (stryCov_9fa48("1826"), 'Open join'),
  request: stryMutAct_9fa48("1827") ? "" : (stryCov_9fa48("1827"), 'Approval required'),
  invite: stryMutAct_9fa48("1828") ? "" : (stryCov_9fa48("1828"), 'Invite only')
});
const CADENCE_LABELS: Record<CommunityCadence, string> = stryMutAct_9fa48("1829") ? {} : (stryCov_9fa48("1829"), {
  weekly: stryMutAct_9fa48("1830") ? "" : (stryCov_9fa48("1830"), 'Weekly gatherings'),
  fortnightly: stryMutAct_9fa48("1831") ? "" : (stryCov_9fa48("1831"), 'Fortnightly gatherings'),
  monthly: stryMutAct_9fa48("1832") ? "" : (stryCov_9fa48("1832"), 'Monthly gatherings'),
  quarterly: stryMutAct_9fa48("1833") ? "" : (stryCov_9fa48("1833"), 'Quarterly gatherings'),
  seasonal: stryMutAct_9fa48("1834") ? "" : (stryCov_9fa48("1834"), 'Seasonal programming')
});
const ACTIVITY_LABELS: Record<CommunityActivityLevel, string> = stryMutAct_9fa48("1835") ? {} : (stryCov_9fa48("1835"), {
  new: stryMutAct_9fa48("1836") ? "" : (stryCov_9fa48("1836"), 'New'),
  steady: stryMutAct_9fa48("1837") ? "" : (stryCov_9fa48("1837"), 'Steady'),
  active: stryMutAct_9fa48("1838") ? "" : (stryCov_9fa48("1838"), 'Active'),
  thriving: stryMutAct_9fa48("1839") ? "" : (stryCov_9fa48("1839"), 'Thriving')
});
const ACTIVITY_COLORS: Record<CommunityActivityLevel, string> = stryMutAct_9fa48("1840") ? {} : (stryCov_9fa48("1840"), {
  new: CultureTokens.gold,
  steady: CultureTokens.teal,
  active: CultureTokens.indigo,
  thriving: CultureTokens.coral
});
export function getCommunityMemberCount(community: Partial<Community>): number {
  if (stryMutAct_9fa48("1841")) {
    {}
  } else {
    stryCov_9fa48("1841");
    return stryMutAct_9fa48("1842") ? (community.memberCount ?? community.membersCount) && 0 : (stryCov_9fa48("1842"), (stryMutAct_9fa48("1843") ? community.memberCount && community.membersCount : (stryCov_9fa48("1843"), community.memberCount ?? community.membersCount)) ?? 0);
  }
}
export function getCommunityEventsCount(community: Partial<Community>): number {
  if (stryMutAct_9fa48("1844")) {
    {}
  } else {
    stryCov_9fa48("1844");
    return stryMutAct_9fa48("1845") ? (community.communityHealth?.upcomingEventsCount ?? community.upcomingEventsCount ?? community.eventsCount) && 0 : (stryCov_9fa48("1845"), (stryMutAct_9fa48("1846") ? (community.communityHealth?.upcomingEventsCount ?? community.upcomingEventsCount) && community.eventsCount : (stryCov_9fa48("1846"), (stryMutAct_9fa48("1847") ? community.communityHealth?.upcomingEventsCount && community.upcomingEventsCount : (stryCov_9fa48("1847"), (stryMutAct_9fa48("1848") ? community.communityHealth.upcomingEventsCount : (stryCov_9fa48("1848"), community.communityHealth?.upcomingEventsCount)) ?? community.upcomingEventsCount)) ?? community.eventsCount)) ?? 0);
  }
}
export function getCommunityAccent(community: Partial<Community>, fallback: string = CultureTokens.indigo): string {
  if (stryMutAct_9fa48("1849")) {
    {}
  } else {
    stryCov_9fa48("1849");
    if (stryMutAct_9fa48("1851") ? false : stryMutAct_9fa48("1850") ? true : (stryCov_9fa48("1850", "1851"), community.color)) return community.color;
    if (stryMutAct_9fa48("1854") ? community.communityCategory || CATEGORY_ACCENTS[community.communityCategory] : stryMutAct_9fa48("1853") ? false : stryMutAct_9fa48("1852") ? true : (stryCov_9fa48("1852", "1853", "1854"), community.communityCategory && CATEGORY_ACCENTS[community.communityCategory])) {
      if (stryMutAct_9fa48("1855")) {
        {}
      } else {
        stryCov_9fa48("1855");
        return CATEGORY_ACCENTS[community.communityCategory];
      }
    }
    if (stryMutAct_9fa48("1858") ? community.category || CATEGORY_ACCENTS[community.category.toLowerCase()] : stryMutAct_9fa48("1857") ? false : stryMutAct_9fa48("1856") ? true : (stryCov_9fa48("1856", "1857", "1858"), community.category && CATEGORY_ACCENTS[stryMutAct_9fa48("1859") ? community.category.toUpperCase() : (stryCov_9fa48("1859"), community.category.toLowerCase())])) {
      if (stryMutAct_9fa48("1860")) {
        {}
      } else {
        stryCov_9fa48("1860");
        return CATEGORY_ACCENTS[stryMutAct_9fa48("1861") ? community.category.toUpperCase() : (stryCov_9fa48("1861"), community.category.toLowerCase())];
      }
    }
    return fallback;
  }
}
export function getCommunityHeadline(community: Partial<Community>): string {
  if (stryMutAct_9fa48("1862")) {
    {}
  } else {
    stryCov_9fa48("1862");
    return stryMutAct_9fa48("1863") ? (community.headline ?? community.mission ?? community.description) && 'Connecting culture, belonging, and real-world experiences.' : (stryCov_9fa48("1863"), (stryMutAct_9fa48("1864") ? (community.headline ?? community.mission) && community.description : (stryCov_9fa48("1864"), (stryMutAct_9fa48("1865") ? community.headline && community.mission : (stryCov_9fa48("1865"), community.headline ?? community.mission)) ?? community.description)) ?? (stryMutAct_9fa48("1866") ? "" : (stryCov_9fa48("1866"), 'Connecting culture, belonging, and real-world experiences.')));
  }
}
export function getCommunityLabel(community: Partial<Community>): string {
  if (stryMutAct_9fa48("1867")) {
    {}
  } else {
    stryCov_9fa48("1867");
    return stryMutAct_9fa48("1868") ? (community.communityType ?? community.category ?? community.communityCategory) && 'Community' : (stryCov_9fa48("1868"), (stryMutAct_9fa48("1869") ? (community.communityType ?? community.category) && community.communityCategory : (stryCov_9fa48("1869"), (stryMutAct_9fa48("1870") ? community.communityType && community.category : (stryCov_9fa48("1870"), community.communityType ?? community.category)) ?? community.communityCategory)) ?? (stryMutAct_9fa48("1871") ? "" : (stryCov_9fa48("1871"), 'Community')));
  }
}
export function getCommunityActivityLevel(community: Partial<Community>): CommunityActivityLevel {
  if (stryMutAct_9fa48("1872")) {
    {}
  } else {
    stryCov_9fa48("1872");
    if (stryMutAct_9fa48("1874") ? false : stryMutAct_9fa48("1873") ? true : (stryCov_9fa48("1873", "1874"), community.activityLevel)) return community.activityLevel;
    const growth = stryMutAct_9fa48("1875") ? community.communityHealth?.memberGrowth30d && 0 : (stryCov_9fa48("1875"), (stryMutAct_9fa48("1876") ? community.communityHealth.memberGrowth30d : (stryCov_9fa48("1876"), community.communityHealth?.memberGrowth30d)) ?? 0);
    const weeklyPosts = stryMutAct_9fa48("1877") ? community.communityHealth?.weeklyPosts && 0 : (stryCov_9fa48("1877"), (stryMutAct_9fa48("1878") ? community.communityHealth.weeklyPosts : (stryCov_9fa48("1878"), community.communityHealth?.weeklyPosts)) ?? 0);
    const events = getCommunityEventsCount(community);
    const members = getCommunityMemberCount(community);
    if (stryMutAct_9fa48("1881") ? (growth >= 12 || weeklyPosts >= 6) && events >= 5 : stryMutAct_9fa48("1880") ? false : stryMutAct_9fa48("1879") ? true : (stryCov_9fa48("1879", "1880", "1881"), (stryMutAct_9fa48("1883") ? growth >= 12 && weeklyPosts >= 6 : stryMutAct_9fa48("1882") ? false : (stryCov_9fa48("1882", "1883"), (stryMutAct_9fa48("1886") ? growth < 12 : stryMutAct_9fa48("1885") ? growth > 12 : stryMutAct_9fa48("1884") ? false : (stryCov_9fa48("1884", "1885", "1886"), growth >= 12)) || (stryMutAct_9fa48("1889") ? weeklyPosts < 6 : stryMutAct_9fa48("1888") ? weeklyPosts > 6 : stryMutAct_9fa48("1887") ? false : (stryCov_9fa48("1887", "1888", "1889"), weeklyPosts >= 6)))) || (stryMutAct_9fa48("1892") ? events < 5 : stryMutAct_9fa48("1891") ? events > 5 : stryMutAct_9fa48("1890") ? false : (stryCov_9fa48("1890", "1891", "1892"), events >= 5)))) return stryMutAct_9fa48("1893") ? "" : (stryCov_9fa48("1893"), 'thriving');
    if (stryMutAct_9fa48("1896") ? (growth >= 4 || weeklyPosts >= 2) && events >= 2 : stryMutAct_9fa48("1895") ? false : stryMutAct_9fa48("1894") ? true : (stryCov_9fa48("1894", "1895", "1896"), (stryMutAct_9fa48("1898") ? growth >= 4 && weeklyPosts >= 2 : stryMutAct_9fa48("1897") ? false : (stryCov_9fa48("1897", "1898"), (stryMutAct_9fa48("1901") ? growth < 4 : stryMutAct_9fa48("1900") ? growth > 4 : stryMutAct_9fa48("1899") ? false : (stryCov_9fa48("1899", "1900", "1901"), growth >= 4)) || (stryMutAct_9fa48("1904") ? weeklyPosts < 2 : stryMutAct_9fa48("1903") ? weeklyPosts > 2 : stryMutAct_9fa48("1902") ? false : (stryCov_9fa48("1902", "1903", "1904"), weeklyPosts >= 2)))) || (stryMutAct_9fa48("1907") ? events < 2 : stryMutAct_9fa48("1906") ? events > 2 : stryMutAct_9fa48("1905") ? false : (stryCov_9fa48("1905", "1906", "1907"), events >= 2)))) return stryMutAct_9fa48("1908") ? "" : (stryCov_9fa48("1908"), 'active');
    if (stryMutAct_9fa48("1912") ? members <= 0 : stryMutAct_9fa48("1911") ? members >= 0 : stryMutAct_9fa48("1910") ? false : stryMutAct_9fa48("1909") ? true : (stryCov_9fa48("1909", "1910", "1911", "1912"), members > 0)) return stryMutAct_9fa48("1913") ? "" : (stryCov_9fa48("1913"), 'steady');
    return stryMutAct_9fa48("1914") ? "" : (stryCov_9fa48("1914"), 'new');
  }
}
export function getCommunityActivityMeta(community: Partial<Community>) {
  if (stryMutAct_9fa48("1915")) {
    {}
  } else {
    stryCov_9fa48("1915");
    const level = getCommunityActivityLevel(community);
    return stryMutAct_9fa48("1916") ? {} : (stryCov_9fa48("1916"), {
      level,
      label: ACTIVITY_LABELS[level],
      color: ACTIVITY_COLORS[level]
    });
  }
}
export function getCommunityJoinLabel(community: Partial<Community>): string | null {
  if (stryMutAct_9fa48("1917")) {
    {}
  } else {
    stryCov_9fa48("1917");
    if (stryMutAct_9fa48("1920") ? false : stryMutAct_9fa48("1919") ? true : stryMutAct_9fa48("1918") ? community.joinMode : (stryCov_9fa48("1918", "1919", "1920"), !community.joinMode)) return null;
    return JOIN_MODE_LABELS[community.joinMode];
  }
}
export function getCommunityCadenceLabel(community: Partial<Community>): string | null {
  if (stryMutAct_9fa48("1921")) {
    {}
  } else {
    stryCov_9fa48("1921");
    if (stryMutAct_9fa48("1924") ? false : stryMutAct_9fa48("1923") ? true : stryMutAct_9fa48("1922") ? community.meetingCadence : (stryCov_9fa48("1922", "1923", "1924"), !community.meetingCadence)) return null;
    return CADENCE_LABELS[community.meetingCadence];
  }
}
export function getCommunityLocationLabel(community: Partial<Community>): string | null {
  if (stryMutAct_9fa48("1925")) {
    {}
  } else {
    stryCov_9fa48("1925");
    const location = stryMutAct_9fa48("1926") ? [community.city, community.country].join(', ') : (stryCov_9fa48("1926"), (stryMutAct_9fa48("1927") ? [] : (stryCov_9fa48("1927"), [community.city, community.country])).filter(Boolean).join(stryMutAct_9fa48("1928") ? "" : (stryCov_9fa48("1928"), ', ')));
    return stryMutAct_9fa48("1931") ? location && null : stryMutAct_9fa48("1930") ? false : stryMutAct_9fa48("1929") ? true : (stryCov_9fa48("1929", "1930", "1931"), location || null);
  }
}
export function getCommunitySignals(community: Partial<Community>): string[] {
  if (stryMutAct_9fa48("1932")) {
    {}
  } else {
    stryCov_9fa48("1932");
    const signals: string[] = stryMutAct_9fa48("1933") ? ["Stryker was here"] : (stryCov_9fa48("1933"), []);
    const label = getCommunityLabel(community);
    if (stryMutAct_9fa48("1935") ? false : stryMutAct_9fa48("1934") ? true : (stryCov_9fa48("1934", "1935"), label)) signals.push(label);
    if (stryMutAct_9fa48("1937") ? false : stryMutAct_9fa48("1936") ? true : (stryCov_9fa48("1936", "1937"), community.countryOfOrigin)) signals.push(community.countryOfOrigin);
    if (stryMutAct_9fa48("1939") ? false : stryMutAct_9fa48("1938") ? true : (stryCov_9fa48("1938", "1939"), community.primaryLanguageLabel)) signals.push(community.primaryLanguageLabel);
    if (stryMutAct_9fa48("1942") ? community.chapterCount || community.chapterCount > 1 : stryMutAct_9fa48("1941") ? false : stryMutAct_9fa48("1940") ? true : (stryCov_9fa48("1940", "1941", "1942"), community.chapterCount && (stryMutAct_9fa48("1945") ? community.chapterCount <= 1 : stryMutAct_9fa48("1944") ? community.chapterCount >= 1 : stryMutAct_9fa48("1943") ? true : (stryCov_9fa48("1943", "1944", "1945"), community.chapterCount > 1)))) {
      if (stryMutAct_9fa48("1946")) {
        {}
      } else {
        stryCov_9fa48("1946");
        signals.push(stryMutAct_9fa48("1947") ? `` : (stryCov_9fa48("1947"), `${community.chapterCount} chapters`));
      }
    }
    const joinLabel = getCommunityJoinLabel(community);
    if (stryMutAct_9fa48("1949") ? false : stryMutAct_9fa48("1948") ? true : (stryCov_9fa48("1948", "1949"), joinLabel)) signals.push(joinLabel);
    if (stryMutAct_9fa48("1952") ? community.trustSignals.safeSpacePolicy : stryMutAct_9fa48("1951") ? false : stryMutAct_9fa48("1950") ? true : (stryCov_9fa48("1950", "1951", "1952"), community.trustSignals?.safeSpacePolicy)) signals.push(stryMutAct_9fa48("1953") ? "" : (stryCov_9fa48("1953"), 'Safe space'));
    return stryMutAct_9fa48("1954") ? signals : (stryCov_9fa48("1954"), signals.slice(0, 4));
  }
}
export function getCommunityTrustSignals(community: Partial<Community>): string[] {
  if (stryMutAct_9fa48("1955")) {
    {}
  } else {
    stryCov_9fa48("1955");
    const signals: string[] = stryMutAct_9fa48("1956") ? ["Stryker was here"] : (stryCov_9fa48("1956"), []);
    if (stryMutAct_9fa48("1958") ? false : stryMutAct_9fa48("1957") ? true : (stryCov_9fa48("1957", "1958"), community.isVerified)) signals.push(stryMutAct_9fa48("1959") ? "" : (stryCov_9fa48("1959"), 'Verified community'));
    if (stryMutAct_9fa48("1962") ? community.trustSignals.safeSpacePolicy : stryMutAct_9fa48("1961") ? false : stryMutAct_9fa48("1960") ? true : (stryCov_9fa48("1960", "1961", "1962"), community.trustSignals?.safeSpacePolicy)) signals.push(stryMutAct_9fa48("1963") ? "" : (stryCov_9fa48("1963"), 'Safe space policy'));
    if (stryMutAct_9fa48("1966") ? community.trustSignals.moderationEnabled : stryMutAct_9fa48("1965") ? false : stryMutAct_9fa48("1964") ? true : (stryCov_9fa48("1964", "1965", "1966"), community.trustSignals?.moderationEnabled)) signals.push(stryMutAct_9fa48("1967") ? "" : (stryCov_9fa48("1967"), 'Moderated space'));
    const verifiedLeaders = stryMutAct_9fa48("1968") ? community.trustSignals?.verifiedLeadersCount && 0 : (stryCov_9fa48("1968"), (stryMutAct_9fa48("1969") ? community.trustSignals.verifiedLeadersCount : (stryCov_9fa48("1969"), community.trustSignals?.verifiedLeadersCount)) ?? 0);
    if (stryMutAct_9fa48("1973") ? verifiedLeaders <= 0 : stryMutAct_9fa48("1972") ? verifiedLeaders >= 0 : stryMutAct_9fa48("1971") ? false : stryMutAct_9fa48("1970") ? true : (stryCov_9fa48("1970", "1971", "1972", "1973"), verifiedLeaders > 0)) {
      if (stryMutAct_9fa48("1974")) {
        {}
      } else {
        stryCov_9fa48("1974");
        signals.push((stryMutAct_9fa48("1977") ? verifiedLeaders !== 1 : stryMutAct_9fa48("1976") ? false : stryMutAct_9fa48("1975") ? true : (stryCov_9fa48("1975", "1976", "1977"), verifiedLeaders === 1)) ? stryMutAct_9fa48("1978") ? "" : (stryCov_9fa48("1978"), '1 verified leader') : stryMutAct_9fa48("1979") ? `` : (stryCov_9fa48("1979"), `${verifiedLeaders} verified leaders`));
      }
    }
    const responseRate = stryMutAct_9fa48("1980") ? (community.trustSignals?.responseRate ?? community.communityHealth?.responseRate) && 0 : (stryCov_9fa48("1980"), (stryMutAct_9fa48("1981") ? community.trustSignals?.responseRate && community.communityHealth?.responseRate : (stryCov_9fa48("1981"), (stryMutAct_9fa48("1982") ? community.trustSignals.responseRate : (stryCov_9fa48("1982"), community.trustSignals?.responseRate)) ?? (stryMutAct_9fa48("1983") ? community.communityHealth.responseRate : (stryCov_9fa48("1983"), community.communityHealth?.responseRate)))) ?? 0);
    if (stryMutAct_9fa48("1987") ? responseRate <= 0 : stryMutAct_9fa48("1986") ? responseRate >= 0 : stryMutAct_9fa48("1985") ? false : stryMutAct_9fa48("1984") ? true : (stryCov_9fa48("1984", "1985", "1986", "1987"), responseRate > 0)) signals.push(stryMutAct_9fa48("1988") ? `` : (stryCov_9fa48("1988"), `${responseRate}% response rate`));
    return stryMutAct_9fa48("1989") ? signals : (stryCov_9fa48("1989"), signals.slice(0, 4));
  }
}
export function getCommunityDiscoveryReasons(community: Partial<Community>): string[] {
  if (stryMutAct_9fa48("1990")) {
    {}
  } else {
    stryCov_9fa48("1990");
    const reasons: string[] = stryMutAct_9fa48("1991") ? ["Stryker was here"] : (stryCov_9fa48("1991"), []);
    if (stryMutAct_9fa48("1994") ? community.discoverySignals.featuredReason : stryMutAct_9fa48("1993") ? false : stryMutAct_9fa48("1992") ? true : (stryCov_9fa48("1992", "1993", "1994"), community.discoverySignals?.featuredReason)) {
      if (stryMutAct_9fa48("1995")) {
        {}
      } else {
        stryCov_9fa48("1995");
        reasons.push(community.discoverySignals.featuredReason);
      }
    }
    const mutualMembers = stryMutAct_9fa48("1996") ? community.discoverySignals?.mutualMembersCount && 0 : (stryCov_9fa48("1996"), (stryMutAct_9fa48("1997") ? community.discoverySignals.mutualMembersCount : (stryCov_9fa48("1997"), community.discoverySignals?.mutualMembersCount)) ?? 0);
    if (stryMutAct_9fa48("2001") ? mutualMembers <= 0 : stryMutAct_9fa48("2000") ? mutualMembers >= 0 : stryMutAct_9fa48("1999") ? false : stryMutAct_9fa48("1998") ? true : (stryCov_9fa48("1998", "1999", "2000", "2001"), mutualMembers > 0)) {
      if (stryMutAct_9fa48("2002")) {
        {}
      } else {
        stryCov_9fa48("2002");
        reasons.push((stryMutAct_9fa48("2005") ? mutualMembers !== 1 : stryMutAct_9fa48("2004") ? false : stryMutAct_9fa48("2003") ? true : (stryCov_9fa48("2003", "2004", "2005"), mutualMembers === 1)) ? stryMutAct_9fa48("2006") ? "" : (stryCov_9fa48("2006"), '1 mutual member') : stryMutAct_9fa48("2007") ? `` : (stryCov_9fa48("2007"), `${mutualMembers} mutual members`));
      }
    }
    const matchScore = stryMutAct_9fa48("2008") ? community.discoverySignals?.matchScore && 0 : (stryCov_9fa48("2008"), (stryMutAct_9fa48("2009") ? community.discoverySignals.matchScore : (stryCov_9fa48("2009"), community.discoverySignals?.matchScore)) ?? 0);
    if (stryMutAct_9fa48("2013") ? matchScore <= 0 : stryMutAct_9fa48("2012") ? matchScore >= 0 : stryMutAct_9fa48("2011") ? false : stryMutAct_9fa48("2010") ? true : (stryCov_9fa48("2010", "2011", "2012", "2013"), matchScore > 0)) {
      if (stryMutAct_9fa48("2014")) {
        {}
      } else {
        stryCov_9fa48("2014");
        const percentage = (stryMutAct_9fa48("2018") ? matchScore > 1 : stryMutAct_9fa48("2017") ? matchScore < 1 : stryMutAct_9fa48("2016") ? false : stryMutAct_9fa48("2015") ? true : (stryCov_9fa48("2015", "2016", "2017", "2018"), matchScore <= 1)) ? Math.round(stryMutAct_9fa48("2019") ? matchScore / 100 : (stryCov_9fa48("2019"), matchScore * 100)) : Math.round(matchScore);
        reasons.push(stryMutAct_9fa48("2020") ? `` : (stryCov_9fa48("2020"), `${percentage}% culture match`));
      }
    }
    return stryMutAct_9fa48("2021") ? reasons : (stryCov_9fa48("2021"), reasons.slice(0, 3));
  }
}