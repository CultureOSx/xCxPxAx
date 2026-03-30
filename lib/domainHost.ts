import { Platform } from 'react-native';

const KERALA_HOSTS = new Set(['culturekerala.com', 'www.culturekerala.com']);

function currentHostname(): string {
  if (Platform.OS !== 'web') return '';
  if (typeof window === 'undefined') return '';
  return window.location.hostname.toLowerCase();
}

export function isCultureKeralaHost(): boolean {
  return KERALA_HOSTS.has(currentHostname());
}

