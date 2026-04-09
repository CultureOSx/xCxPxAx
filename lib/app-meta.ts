import Constants from 'expo-constants';

/** Short name: home screen, app switcher, PWA `short_name` (keep ≤ ~12 chars for iOS). */
export const APP_NAME = 'CulturePass';

/** Regional marketing label (settings, AU-specific copy). */
export const APP_NAME_AU = 'CulturePass AU';

/** Hostname only (no scheme) — matches Android intent host & universal links. */
export const APP_DOMAIN = 'culturepass.app';

/** Canonical site origin — matches `expo-router` `origin` in app.json. */
export const SITE_ORIGIN = `https://${APP_DOMAIN}`;

/** Optional apex alias for schema.org `sameAs` / marketing. */
export const SITE_ORIGIN_WWW = 'https://www.culturepass.app';

/** Web `<title>` / Open Graph primary title. */
export const APP_WEB_TITLE = 'CulturePass — Celebrate Your Culture, Connect Your Community';

/** Default meta description — keep in sync with `expo.web.description` in app.json. */
export const APP_WEB_DESCRIPTION =
  'Discover cultural events and communities built for diaspora cities. Organizers reach the right audience; attendees find festivals, tickets, and belonging in one place.';

export const APP_WEB_KEYWORDS =
  'CulturePass, cultural events, diaspora communities, event organizers, community events, festivals, tickets, Australia, New Zealand, UK, UAE, Canada, cultural discovery';

/** Subtitle / alternateName in structured data. */
export const APP_WEB_TAGLINE = 'Celebrate Your Culture, Connect Your Community';

/** Install / browser UI — matches `expo.web.themeColor`. */
export const THEME_COLOR_WEB = '#0B0B14';

export const TAGLINE_PRIMARY = 'BELONG ANYWHERE';
export const TAGLINE_SECONDARY = 'Discover. Connect. Belong.';
export const PLATFORM_TAGLINE = 'Your one-stop lifestyle platform for cultural diaspora communities';
export const AVAILABILITY_MARKETS =
  'Available in United States · Canada · United Arab Emirates · United Kingdom · Australia · Singapore · New Zealand';
export const PRIMARY_REGION = 'Australia';

/** Public contact addresses (product domain — align with SITE_ORIGIN). */
export const EMAIL_LEGAL = 'legal@culturepass.app';
export const EMAIL_PRIVACY = 'privacy@culturepass.app';
export const EMAIL_SUPPORT = 'support@culturepass.app';
export const EMAIL_BUGS = 'bugs@culturepass.app';

function getBuildNumber(): string | null {
  const iosBuild = Constants.expoConfig?.ios?.buildNumber;
  if (typeof iosBuild === 'string' && iosBuild.trim().length > 0) return iosBuild.trim();

  const androidVersionCode = Constants.expoConfig?.android?.versionCode;
  if (typeof androidVersionCode === 'number' && Number.isFinite(androidVersionCode)) {
    return String(androidVersionCode);
  }

  if (typeof Constants.nativeBuildVersion === 'string' && Constants.nativeBuildVersion.trim().length > 0) {
    return Constants.nativeBuildVersion.trim();
  }

  return null;
}

export function getAppVersion(): string {
  const configured = Constants.expoConfig?.version;
  if (typeof configured === 'string' && configured.trim().length > 0) return configured.trim();

  const nativeVersion = Constants.nativeApplicationVersion;
  if (typeof nativeVersion === 'string' && nativeVersion.trim().length > 0) return nativeVersion.trim();

  return 'dev';
}

export function getAppVersionWithBuild(): string {
  const version = getAppVersion();
  const build = getBuildNumber();
  return build ? `${version} (${build})` : version;
}

export function getAuVersionLabel(): string {
  return `v${getAppVersion()} · ${APP_NAME_AU}`;
}

