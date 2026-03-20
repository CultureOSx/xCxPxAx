// ---------------------------------------------------------------------------
// Locale helpers
// ---------------------------------------------------------------------------

const US_CA_COUNTRIES = ['United States', 'USA', 'US', 'Canada', 'CA'];

/**
 * Returns the BCP 47 locale string for the given country.
 * AU / NZ / UK / most of the world → en-AU (DD/MM/YYYY)
 * US / CA → en-US (MM/DD/YYYY)
 */
export function getLocaleForCountry(country?: string): string {
  if (!country) return 'en-AU';
  if (US_CA_COUNTRIES.includes(country)) return 'en-US';
  return 'en-AU';
}

/**
 * Returns the ISO 4217 currency code for the given country name.
 */
export function getCurrencyForCountry(country?: string): string {
  const map: Record<string, string> = {
    'New Zealand': 'NZD',
    'United Kingdom': 'GBP',
    'United States': 'USD',
    'USA': 'USD',
    'Canada': 'CAD',
    'UAE': 'AED',
    'United Arab Emirates': 'AED',
  };
  return map[country ?? ''] ?? 'AUD';
}

/**
 * Formats a YYYY-MM-DD date string for display, respecting country locale.
 */
export function formatDateForCountry(dateStr: string, country?: string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const locale = getLocaleForCountry(country);
  return d.toLocaleDateString(locale, options ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Formats a price in cents to a currency string for a given country.
 */
export function formatPrice(priceCents: number, country?: string): string {
  const currency = getCurrencyForCountry(country);
  const locale = getLocaleForCountry(country);
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0 }).format(priceCents / 100);
}

// ---------------------------------------------------------------------------

function toDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  const parsed = date instanceof Date ? date : new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatEventDateTime(date: string, time?: string, country?: string): string {
  const day = toDate(date);
  if (!day) return date;

  const locale = getLocaleForCountry(country);
  const dateLabel = day.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  if (!time) return dateLabel;
  return `${dateLabel} • ${time}`;
}

export function formatEventDateTimeBadge(date: string, time?: string, country?: string): string {
  const day = toDate(date);
  if (!day) return time ? `${date} • ${time}` : date;

  const locale = getLocaleForCountry(country);
  const dateLabel = day.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });

  return time ? `${dateLabel} • ${time}` : dateLabel;
}

export function timeAgo(date: string | Date | null | undefined): string {
  const from = toDate(date);
  if (!from) return 'just now';

  const seconds = Math.max(1, Math.floor((Date.now() - from.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
