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
import Constants from 'expo-constants';

/** Short name: home screen, app switcher, PWA `short_name` (keep ≤ ~12 chars for iOS). */
export const APP_NAME = stryMutAct_9fa48("1468") ? "" : (stryCov_9fa48("1468"), 'CulturePass');

/** Regional marketing label (settings, AU-specific copy). */
export const APP_NAME_AU = stryMutAct_9fa48("1469") ? "" : (stryCov_9fa48("1469"), 'CulturePass AU');

/** Hostname only (no scheme) — matches Android intent host & universal links. */
export const APP_DOMAIN = stryMutAct_9fa48("1470") ? "" : (stryCov_9fa48("1470"), 'culturepass.app');

/** Canonical site origin — matches `expo-router` `origin` in app.json. */
export const SITE_ORIGIN = stryMutAct_9fa48("1471") ? `` : (stryCov_9fa48("1471"), `https://${APP_DOMAIN}`);

/** Optional apex alias for schema.org `sameAs` / marketing. */
export const SITE_ORIGIN_WWW = stryMutAct_9fa48("1472") ? "" : (stryCov_9fa48("1472"), 'https://www.culturepass.app');

/** Web `<title>` / Open Graph primary title. */
export const APP_WEB_TITLE = stryMutAct_9fa48("1473") ? "" : (stryCov_9fa48("1473"), 'CulturePass — Celebrate Your Culture, Connect Your Community');

/** Default meta description — keep in sync with `expo.web.description` in app.json. */
export const APP_WEB_DESCRIPTION = stryMutAct_9fa48("1474") ? "" : (stryCov_9fa48("1474"), 'Discover cultural events and communities built for diaspora cities. Organizers reach the right audience; attendees find festivals, tickets, and belonging in one place.');
export const APP_WEB_KEYWORDS = stryMutAct_9fa48("1475") ? "" : (stryCov_9fa48("1475"), 'CulturePass, cultural events, diaspora communities, event organizers, community events, festivals, tickets, Australia, New Zealand, UK, UAE, Canada, cultural discovery');

/** Subtitle / alternateName in structured data. */
export const APP_WEB_TAGLINE = stryMutAct_9fa48("1476") ? "" : (stryCov_9fa48("1476"), 'Celebrate Your Culture, Connect Your Community');

/** Install / browser UI — matches `expo.web.themeColor`. */
export const THEME_COLOR_WEB = stryMutAct_9fa48("1477") ? "" : (stryCov_9fa48("1477"), '#0B0B14');
export const TAGLINE_PRIMARY = stryMutAct_9fa48("1478") ? "" : (stryCov_9fa48("1478"), 'BELONG ANYWHERE');
export const TAGLINE_SECONDARY = stryMutAct_9fa48("1479") ? "" : (stryCov_9fa48("1479"), 'Discover. Connect. Belong.');
export const PLATFORM_TAGLINE = stryMutAct_9fa48("1480") ? "" : (stryCov_9fa48("1480"), 'Your one-stop lifestyle platform for cultural diaspora communities');
export const AVAILABILITY_MARKETS = stryMutAct_9fa48("1481") ? "" : (stryCov_9fa48("1481"), 'Available in United States · Canada · United Arab Emirates · United Kingdom · Australia · Singapore · New Zealand');
export const PRIMARY_REGION = stryMutAct_9fa48("1482") ? "" : (stryCov_9fa48("1482"), 'Australia');

/** Public contact addresses (product domain — align with SITE_ORIGIN). */
export const EMAIL_LEGAL = stryMutAct_9fa48("1483") ? "" : (stryCov_9fa48("1483"), 'legal@culturepass.app');
export const EMAIL_PRIVACY = stryMutAct_9fa48("1484") ? "" : (stryCov_9fa48("1484"), 'privacy@culturepass.app');
export const EMAIL_SUPPORT = stryMutAct_9fa48("1485") ? "" : (stryCov_9fa48("1485"), 'support@culturepass.app');
export const EMAIL_BUGS = stryMutAct_9fa48("1486") ? "" : (stryCov_9fa48("1486"), 'bugs@culturepass.app');
function getBuildNumber(): string | null {
  if (stryMutAct_9fa48("1487")) {
    {}
  } else {
    stryCov_9fa48("1487");
    const iosBuild = stryMutAct_9fa48("1489") ? Constants.expoConfig.ios?.buildNumber : stryMutAct_9fa48("1488") ? Constants.expoConfig?.ios.buildNumber : (stryCov_9fa48("1488", "1489"), Constants.expoConfig?.ios?.buildNumber);
    if (stryMutAct_9fa48("1492") ? typeof iosBuild === 'string' || iosBuild.trim().length > 0 : stryMutAct_9fa48("1491") ? false : stryMutAct_9fa48("1490") ? true : (stryCov_9fa48("1490", "1491", "1492"), (stryMutAct_9fa48("1494") ? typeof iosBuild !== 'string' : stryMutAct_9fa48("1493") ? true : (stryCov_9fa48("1493", "1494"), typeof iosBuild === (stryMutAct_9fa48("1495") ? "" : (stryCov_9fa48("1495"), 'string')))) && (stryMutAct_9fa48("1498") ? iosBuild.trim().length <= 0 : stryMutAct_9fa48("1497") ? iosBuild.trim().length >= 0 : stryMutAct_9fa48("1496") ? true : (stryCov_9fa48("1496", "1497", "1498"), (stryMutAct_9fa48("1499") ? iosBuild.length : (stryCov_9fa48("1499"), iosBuild.trim().length)) > 0)))) return stryMutAct_9fa48("1500") ? iosBuild : (stryCov_9fa48("1500"), iosBuild.trim());
    const androidVersionCode = stryMutAct_9fa48("1502") ? Constants.expoConfig.android?.versionCode : stryMutAct_9fa48("1501") ? Constants.expoConfig?.android.versionCode : (stryCov_9fa48("1501", "1502"), Constants.expoConfig?.android?.versionCode);
    if (stryMutAct_9fa48("1505") ? typeof androidVersionCode === 'number' || Number.isFinite(androidVersionCode) : stryMutAct_9fa48("1504") ? false : stryMutAct_9fa48("1503") ? true : (stryCov_9fa48("1503", "1504", "1505"), (stryMutAct_9fa48("1507") ? typeof androidVersionCode !== 'number' : stryMutAct_9fa48("1506") ? true : (stryCov_9fa48("1506", "1507"), typeof androidVersionCode === (stryMutAct_9fa48("1508") ? "" : (stryCov_9fa48("1508"), 'number')))) && Number.isFinite(androidVersionCode))) {
      if (stryMutAct_9fa48("1509")) {
        {}
      } else {
        stryCov_9fa48("1509");
        return String(androidVersionCode);
      }
    }
    if (stryMutAct_9fa48("1512") ? typeof Constants.nativeBuildVersion === 'string' || Constants.nativeBuildVersion.trim().length > 0 : stryMutAct_9fa48("1511") ? false : stryMutAct_9fa48("1510") ? true : (stryCov_9fa48("1510", "1511", "1512"), (stryMutAct_9fa48("1514") ? typeof Constants.nativeBuildVersion !== 'string' : stryMutAct_9fa48("1513") ? true : (stryCov_9fa48("1513", "1514"), typeof Constants.nativeBuildVersion === (stryMutAct_9fa48("1515") ? "" : (stryCov_9fa48("1515"), 'string')))) && (stryMutAct_9fa48("1518") ? Constants.nativeBuildVersion.trim().length <= 0 : stryMutAct_9fa48("1517") ? Constants.nativeBuildVersion.trim().length >= 0 : stryMutAct_9fa48("1516") ? true : (stryCov_9fa48("1516", "1517", "1518"), (stryMutAct_9fa48("1519") ? Constants.nativeBuildVersion.length : (stryCov_9fa48("1519"), Constants.nativeBuildVersion.trim().length)) > 0)))) {
      if (stryMutAct_9fa48("1520")) {
        {}
      } else {
        stryCov_9fa48("1520");
        return stryMutAct_9fa48("1521") ? Constants.nativeBuildVersion : (stryCov_9fa48("1521"), Constants.nativeBuildVersion.trim());
      }
    }
    return null;
  }
}
export function getAppVersion(): string {
  if (stryMutAct_9fa48("1522")) {
    {}
  } else {
    stryCov_9fa48("1522");
    const configured = stryMutAct_9fa48("1523") ? Constants.expoConfig.version : (stryCov_9fa48("1523"), Constants.expoConfig?.version);
    if (stryMutAct_9fa48("1526") ? typeof configured === 'string' || configured.trim().length > 0 : stryMutAct_9fa48("1525") ? false : stryMutAct_9fa48("1524") ? true : (stryCov_9fa48("1524", "1525", "1526"), (stryMutAct_9fa48("1528") ? typeof configured !== 'string' : stryMutAct_9fa48("1527") ? true : (stryCov_9fa48("1527", "1528"), typeof configured === (stryMutAct_9fa48("1529") ? "" : (stryCov_9fa48("1529"), 'string')))) && (stryMutAct_9fa48("1532") ? configured.trim().length <= 0 : stryMutAct_9fa48("1531") ? configured.trim().length >= 0 : stryMutAct_9fa48("1530") ? true : (stryCov_9fa48("1530", "1531", "1532"), (stryMutAct_9fa48("1533") ? configured.length : (stryCov_9fa48("1533"), configured.trim().length)) > 0)))) return stryMutAct_9fa48("1534") ? configured : (stryCov_9fa48("1534"), configured.trim());
    const nativeVersion = Constants.nativeApplicationVersion;
    if (stryMutAct_9fa48("1537") ? typeof nativeVersion === 'string' || nativeVersion.trim().length > 0 : stryMutAct_9fa48("1536") ? false : stryMutAct_9fa48("1535") ? true : (stryCov_9fa48("1535", "1536", "1537"), (stryMutAct_9fa48("1539") ? typeof nativeVersion !== 'string' : stryMutAct_9fa48("1538") ? true : (stryCov_9fa48("1538", "1539"), typeof nativeVersion === (stryMutAct_9fa48("1540") ? "" : (stryCov_9fa48("1540"), 'string')))) && (stryMutAct_9fa48("1543") ? nativeVersion.trim().length <= 0 : stryMutAct_9fa48("1542") ? nativeVersion.trim().length >= 0 : stryMutAct_9fa48("1541") ? true : (stryCov_9fa48("1541", "1542", "1543"), (stryMutAct_9fa48("1544") ? nativeVersion.length : (stryCov_9fa48("1544"), nativeVersion.trim().length)) > 0)))) return stryMutAct_9fa48("1545") ? nativeVersion : (stryCov_9fa48("1545"), nativeVersion.trim());
    return stryMutAct_9fa48("1546") ? "" : (stryCov_9fa48("1546"), 'dev');
  }
}
export function getAppVersionWithBuild(): string {
  if (stryMutAct_9fa48("1547")) {
    {}
  } else {
    stryCov_9fa48("1547");
    const version = getAppVersion();
    const build = getBuildNumber();
    return build ? stryMutAct_9fa48("1548") ? `` : (stryCov_9fa48("1548"), `${version} (${build})`) : version;
  }
}
export function getAuVersionLabel(): string {
  if (stryMutAct_9fa48("1549")) {
    {}
  } else {
    stryCov_9fa48("1549");
    return stryMutAct_9fa48("1550") ? `` : (stryCov_9fa48("1550"), `v${getAppVersion()} · ${APP_NAME_AU}`);
  }
}