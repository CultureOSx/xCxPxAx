import Constants from 'expo-constants';

export const APP_NAME = 'CulturePass';
export const APP_NAME_AU = 'CulturePass AU';
export const APP_DOMAIN = 'culturepass.app';
export const TAGLINE_PRIMARY = 'BELONG ANYWHERE';
export const TAGLINE_SECONDARY = 'Discover. Connect. Belong.';
export const PLATFORM_TAGLINE = 'Your one-stop lifestyle platform for cultural diaspora communities';
export const AVAILABILITY_MARKETS =
  'Available in United States · Canada · United Arab Emirates · United Kingdom · Australia · Singapore · New Zealand';
export const PRIMARY_REGION = 'Australia';

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

