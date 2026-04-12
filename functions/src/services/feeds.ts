import { DEFAULT_AU_STATES } from './locations';
import {
  eventsService,
  normalizeEventListForClient,
  type FirestoreEvent,
} from './events';
import { profilesService, type FirestoreProfile } from './profiles';
import { usersService, type FirestoreUser } from './users';

export type FeedScope =
  | 'community'
  | 'host'
  | 'city'
  | 'state'
  | 'artist'
  | 'venue'
  | 'tag';

export type FeedFormat = 'rss' | 'ical';

export interface FeedBuildQuery {
  scope: FeedScope;
  value: string;
  country?: string;
  limit?: number;
  origin?: string;
  feedUrl?: string;
}

export interface BuiltFeed {
  title: string;
  description: string;
  scope: FeedScope;
  value: string;
  country?: string;
  websiteUrl: string;
  feedUrl: string;
  origin: string;
  events: FirestoreEvent[];
  updatedAt: string;
}

export interface FeedMatchContext {
  scope: FeedScope;
  value: string;
  country?: string;
  profile?: FirestoreProfile | null;
  user?: FirestoreUser | null;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const MAX_SCAN_EVENTS = 1000;
const PAGE_SIZE = 200;
const DEFAULT_ORIGIN = 'https://culturepass.app';

const AU_STATE_NAME_TO_CODE = new Map<string, string>();
const AU_STATE_CODE_TO_NAME = new Map<string, string>();

for (const state of DEFAULT_AU_STATES) {
  AU_STATE_NAME_TO_CODE.set(state.name.toLowerCase(), state.code);
  AU_STATE_CODE_TO_NAME.set(state.code.toLowerCase(), state.name);
}

function trimString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeText(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function equalsLoose(left: string | undefined, right: string | undefined): boolean {
  const a = trimString(left);
  const b = trimString(right);
  if (!a || !b) return false;
  return normalizeText(a) === normalizeText(b) || slugify(a) === slugify(b);
}

function arrayStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => trimString(item))
    .filter((item): item is string => Boolean(item));
}

function objectRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null && !Array.isArray(item),
  );
}

function getEventRecord(event: FirestoreEvent): Record<string, unknown> {
  return event as unknown as Record<string, unknown>;
}

function getEventArtists(event: FirestoreEvent): Record<string, unknown>[] {
  return objectRecords(getEventRecord(event).artists);
}

function getEventHostInfo(event: FirestoreEvent): Record<string, unknown> | null {
  const hostInfo = getEventRecord(event).hostInfo;
  if (typeof hostInfo === 'object' && hostInfo !== null && !Array.isArray(hostInfo)) {
    return hostInfo as Record<string, unknown>;
  }
  return null;
}

function getTagBuckets(event: FirestoreEvent): string[] {
  const record = getEventRecord(event);
  return [
    ...arrayStrings(event.tags),
    ...arrayStrings(event.cultureTag),
    ...arrayStrings(record.cultureTags),
    ...arrayStrings(event.languageTags),
    ...arrayStrings(event.indigenousTags),
  ];
}

function buildStateAliases(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const lower = trimmed.toLowerCase();
  const aliases = new Set<string>([trimmed]);

  const stateCode = AU_STATE_NAME_TO_CODE.get(lower);
  if (stateCode) aliases.add(stateCode);

  const stateName = AU_STATE_CODE_TO_NAME.get(lower);
  if (stateName) aliases.add(stateName);

  return [...aliases];
}

function compareEvents(a: FirestoreEvent, b: FirestoreEvent): number {
  const left = `${a.date ?? ''}T${trimString(a.time) ?? '23:59'}`;
  const right = `${b.date ?? ''}T${trimString(b.time) ?? '23:59'}`;
  return left.localeCompare(right);
}

function maxIso(a: string | undefined, b: string | undefined): string {
  if (!a) return b ?? new Date().toISOString();
  if (!b) return a;
  return a > b ? a : b;
}

function buildUrl(origin: string, pathname: string, search?: URLSearchParams): string {
  const url = new URL(pathname.startsWith('/') ? pathname : `/${pathname}`, origin);
  if (search) url.search = search.toString();
  return url.toString();
}

function buildEventUrl(origin: string, event: FirestoreEvent): string {
  return buildUrl(origin, `/event/${encodeURIComponent(event.id)}`);
}

function profilePublicPath(profile: FirestoreProfile): string {
  const id = encodeURIComponent(profile.id);
  switch (String(profile.entityType ?? '').toLowerCase()) {
    case 'community':
      return `/community/${id}`;
    case 'venue':
      return `/venue/${id}`;
    case 'business':
    case 'brand':
      return `/business/${id}`;
    case 'artist':
    case 'creator':
      return `/artist/${id}`;
    case 'restaurant':
      return `/restaurants/${id}`;
    case 'organizer':
      return `/organiser/${id}`;
    default:
      return `/profile/${id}`;
  }
}

function hostPublicPath(profile: FirestoreProfile | null, user: FirestoreUser | null, value: string): string {
  if (profile) return profilePublicPath(profile);
  if (user) return `/organiser/${encodeURIComponent(user.id)}`;
  return `/search?publisherProfileId=${encodeURIComponent(value)}`;
}

function feedWebsiteUrl(origin: string, context: FeedMatchContext): string {
  const encodedValue = encodeURIComponent(context.value);
  switch (context.scope) {
    case 'community':
      return context.profile
        ? buildUrl(origin, profilePublicPath(context.profile))
        : buildUrl(origin, `/community/${encodedValue}`);
    case 'host':
      return buildUrl(origin, hostPublicPath(context.profile ?? null, context.user ?? null, context.value));
    case 'city': {
      const search = new URLSearchParams();
      if (context.country) search.set('country', context.country);
      return buildUrl(origin, `/city/${encodedValue}`, search);
    }
    case 'state': {
      const search = new URLSearchParams();
      search.set('state', context.value);
      if (context.country) search.set('country', context.country);
      return buildUrl(origin, '/culture', search);
    }
    case 'artist':
      return context.profile
        ? buildUrl(origin, profilePublicPath(context.profile))
        : buildUrl(origin, `/artist/${encodedValue}`);
    case 'venue':
      return context.profile
        ? buildUrl(origin, profilePublicPath(context.profile))
        : buildUrl(origin, `/venue/${encodedValue}`);
    case 'tag':
      return buildUrl(origin, '/search', new URLSearchParams({ q: context.value }));
    default:
      return origin;
  }
}

function feedLabel(context: FeedMatchContext): string {
  if (context.profile?.name) return context.profile.name;
  if (context.user?.displayName) return context.user.displayName;
  if (context.user?.username) return context.user.username;
  return context.value;
}

function feedTitle(context: FeedMatchContext): string {
  const label = feedLabel(context);
  switch (context.scope) {
    case 'community':
      return `${label} Events | CulturePass`;
    case 'host':
      return `${label} Hosted Events | CulturePass`;
    case 'city':
      return `${label} Events | CulturePass`;
    case 'state':
      return `${label} Events | CulturePass`;
    case 'artist':
      return `${label} Appearances | CulturePass`;
    case 'venue':
      return `${label} Venue Events | CulturePass`;
    case 'tag':
      return `${label} Tag Feed | CulturePass`;
    default:
      return `CulturePass Feed`;
  }
}

function feedDescription(context: FeedMatchContext): string {
  const label = feedLabel(context);
  switch (context.scope) {
    case 'community':
      return `Upcoming public events connected to the ${label} community on CulturePass.`;
    case 'host':
      return `Upcoming public events hosted by ${label} on CulturePass.`;
    case 'city':
      return `Upcoming public events happening in ${label}${context.country ? `, ${context.country}` : ''} on CulturePass.`;
    case 'state':
      return `Upcoming public events happening in ${label}${context.country ? `, ${context.country}` : ''} on CulturePass.`;
    case 'artist':
      return `Upcoming public events featuring ${label} on CulturePass.`;
    case 'venue':
      return `Upcoming public events happening at ${label} on CulturePass.`;
    case 'tag':
      return `Upcoming public events tagged ${label} on CulturePass.`;
    default:
      return `Upcoming public events on CulturePass.`;
  }
}

export function filterEventsForFeed(
  events: FirestoreEvent[],
  context: FeedMatchContext,
): FirestoreEvent[] {
  const scopeValue = trimString(context.value);
  if (!scopeValue) return [];

  const stateAliases = context.scope === 'state' ? buildStateAliases(scopeValue) : [];
  const profileId = trimString(context.profile?.id);
  const profileName = trimString(context.profile?.name);
  const ownerId = trimString(context.profile?.ownerId);
  const userId = trimString(context.user?.id);
  const userDisplayName = trimString(context.user?.displayName);
  const userUsername = trimString(context.user?.username);
  const userHandle = trimString(context.user?.handle);
  const targetLabels = [
    scopeValue,
    profileName,
    userDisplayName,
    userUsername,
    userHandle,
  ].filter((value): value is string => Boolean(value));

  return events.filter((event) => {
    if (context.country && !equalsLoose(event.country, context.country)) {
      return false;
    }

    switch (context.scope) {
      case 'community':
        return trimString(event.communityId) === scopeValue;

      case 'host': {
        const hostInfo = getEventHostInfo(event);
        const hostProfileId = trimString(hostInfo?.profileId);
        const hostName = trimString(hostInfo?.name) ?? trimString(event.hostName);
        const organizerName = trimString(event.organizer);
        const eventPublisherId = trimString(event.publisherProfileId);
        const organizerId = trimString(event.organizerId);

        const matchesId =
          eventPublisherId === scopeValue ||
          organizerId === scopeValue ||
          hostProfileId === scopeValue ||
          (profileId ? eventPublisherId === profileId : false) ||
          (ownerId ? organizerId === ownerId : false) ||
          (userId ? organizerId === userId : false);

        const matchesLabel = targetLabels.some(
          (label) => equalsLoose(hostName, label) || equalsLoose(organizerName, label),
        );

        return matchesId || matchesLabel;
      }

      case 'city':
        return equalsLoose(event.city, scopeValue);

      case 'state':
        return stateAliases.some((alias) => equalsLoose(event.state, alias));

      case 'artist': {
        const artists = getEventArtists(event);
        return artists.some((artist) => {
          const artistProfileId = trimString(artist.profileId);
          const artistName = trimString(artist.name);
          const matchesId =
            artistProfileId === scopeValue ||
            (profileId ? artistProfileId === profileId : false);
          const matchesLabel = targetLabels.some((label) => equalsLoose(artistName, label));
          return matchesId || matchesLabel;
        });
      }

      case 'venue': {
        const venueProfileId = trimString(event.venueProfileId);
        const matchesId =
          venueProfileId === scopeValue ||
          (profileId ? venueProfileId === profileId : false);
        const matchesLabel = targetLabels.some((label) => equalsLoose(event.venue, label));
        return matchesId || matchesLabel;
      }

      case 'tag':
        return getTagBuckets(event).some((tag) => equalsLoose(tag, scopeValue));

      default:
        return false;
    }
  });
}

function clampLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(limit ?? DEFAULT_LIMIT)));
}

async function fetchPublishedEvents(scanLimit: number): Promise<FirestoreEvent[]> {
  const items: FirestoreEvent[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage && items.length < scanLimit) {
    const pageSize = Math.min(PAGE_SIZE, scanLimit - items.length);
    const result = await eventsService.list(
      { status: 'published' },
      { page, pageSize },
    );
    items.push(...result.items);
    hasNextPage = result.hasNextPage;
    page += 1;
  }

  return items;
}

function buildFeedContext(
  scope: FeedScope,
  value: string,
  country: string | undefined,
  profile: FirestoreProfile | null,
  user: FirestoreUser | null,
): FeedMatchContext {
  return { scope, value, country, profile, user };
}

export async function buildFeed(query: FeedBuildQuery): Promise<BuiltFeed> {
  const value = trimString(query.value);
  if (!value) {
    throw new Error('Feed value is required');
  }

  const country = trimString(query.country);
  const limit = clampLimit(query.limit);
  const origin = trimString(query.origin) ?? trimString(process.env.APP_URL) ?? DEFAULT_ORIGIN;
  const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  const feedUrl = trimString(query.feedUrl)
    ?? buildUrl(
      normalizedOrigin,
      `/api/feeds/${query.scope}/${encodeURIComponent(value)}.rss`,
    );

  const [profile, user, rawEvents] = await Promise.all([
    query.scope === 'community' || query.scope === 'host' || query.scope === 'artist' || query.scope === 'venue'
      ? profilesService.getById(value)
      : Promise.resolve(null),
    query.scope === 'host'
      ? usersService.getById(value)
      : Promise.resolve(null),
    fetchPublishedEvents(MAX_SCAN_EVENTS),
  ]);

  const context = buildFeedContext(query.scope, value, country, profile, user);
  const matched = filterEventsForFeed(rawEvents, context)
    .sort(compareEvents)
    .slice(0, limit);
  const events = normalizeEventListForClient(matched);

  const updatedAt = events.reduce(
    (latest, event) => maxIso(latest, trimString(event.updatedAt) ?? trimString(event.createdAt)),
    new Date().toISOString(),
  );

  return {
    title: feedTitle(context),
    description: feedDescription(context),
    scope: query.scope,
    value,
    country,
    websiteUrl: feedWebsiteUrl(normalizedOrigin, context),
    feedUrl,
    origin: normalizedOrigin,
    events,
    updatedAt,
  };
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc822(value: string | undefined): string {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

function eventSummary(event: FirestoreEvent, eventUrl: string): string {
  const dateBits = [trimString(event.date), trimString(event.time)].filter(
    (value): value is string => Boolean(value),
  );
  const locationBits = [
    trimString(event.venue),
    trimString(event.city),
    trimString(event.state),
    trimString(event.country),
  ].filter((value): value is string => Boolean(value));

  const lines = [
    trimString(event.description),
    dateBits.length > 0 ? `When: ${dateBits.join(' ')}` : undefined,
    locationBits.length > 0 ? `Where: ${locationBits.join(', ')}` : undefined,
    `Event URL: ${eventUrl}`,
  ].filter((value): value is string => Boolean(value));

  return lines.join('\n');
}

export function buildRssFeed(feed: BuiltFeed): string {
  const items = feed.events
    .map((event) => {
      const eventUrl = buildEventUrl(feed.origin, event);
      const pubDate = toRfc822(trimString(event.updatedAt) ?? trimString(event.createdAt));
      const categories = [
        trimString(event.category),
        ...getTagBuckets(event),
      ].filter((value): value is string => Boolean(value));

      return [
        '    <item>',
        `      <title>${xmlEscape(event.title)}</title>`,
        `      <link>${xmlEscape(eventUrl)}</link>`,
        `      <guid isPermaLink="false">${xmlEscape(`culturepass:event:${event.id}`)}</guid>`,
        `      <pubDate>${xmlEscape(pubDate)}</pubDate>`,
        `      <description>${xmlEscape(eventSummary(event, eventUrl))}</description>`,
        ...categories.map((category) => `      <category>${xmlEscape(category)}</category>`),
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${xmlEscape(feed.title)}</title>`,
    `    <link>${xmlEscape(feed.websiteUrl)}</link>`,
    `    <atom:link href="${xmlEscape(feed.feedUrl)}" rel="self" type="application/rss+xml" />`,
    `    <description>${xmlEscape(feed.description)}</description>`,
    '    <language>en-AU</language>',
    `    <lastBuildDate>${xmlEscape(toRfc822(feed.updatedAt))}</lastBuildDate>`,
    '    <generator>CulturePass Feed Service</generator>',
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

function icalEscape(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function foldIcsLine(line: string): string {
  const chunkSize = 75;
  if (line.length <= chunkSize) return line;

  const chunks: string[] = [];
  for (let i = 0; i < line.length; i += chunkSize) {
    const chunk = line.slice(i, i + chunkSize);
    chunks.push(i === 0 ? chunk : ` ${chunk}`);
  }
  return chunks.join('\r\n');
}

function pad(num: number): string {
  return String(num).padStart(2, '0');
}

function parseDate(dateValue: string | undefined): { year: number; month: number; day: number } | null {
  const date = trimString(dateValue);
  if (!date) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseTime(timeValue: string | undefined): { hour: number; minute: number } | null {
  const time = trimString(timeValue);
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

function formatDateOnly(parts: { year: number; month: number; day: number }): string {
  return `${parts.year}${pad(parts.month)}${pad(parts.day)}`;
}

function formatDateTime(parts: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}): string {
  return `${parts.year}${pad(parts.month)}${pad(parts.day)}T${pad(parts.hour)}${pad(parts.minute)}00`;
}

function addDays(
  parts: { year: number; month: number; day: number },
  days: number,
): { year: number; month: number; day: number } {
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
}

function addMinutes(
  parts: { year: number; month: number; day: number; hour: number; minute: number },
  minutes: number,
): { year: number; month: number; day: number; hour: number; minute: number } {
  const next = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute + minutes),
  );
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
    hour: next.getUTCHours(),
    minute: next.getUTCMinutes(),
  };
}

function eventDateLines(event: FirestoreEvent): string[] {
  const startDate = parseDate(event.date);
  if (!startDate) return [];

  const startTime = parseTime(event.time);
  const endDate = parseDate(event.endDate) ?? startDate;
  const endTime = parseTime(event.endTime);

  if (!startTime) {
    const exclusiveEnd = addDays(endDate, 1);
    return [
      `DTSTART;VALUE=DATE:${formatDateOnly(startDate)}`,
      `DTEND;VALUE=DATE:${formatDateOnly(exclusiveEnd)}`,
    ];
  }

  const start = { ...startDate, ...startTime };
  let end = { ...endDate, ...(endTime ?? startTime) };

  if (!endTime && (!event.endDate || equalsLoose(event.endDate, event.date))) {
    end = addMinutes(start, 120);
  }

  return [
    `DTSTART:${formatDateTime(start)}`,
    `DTEND:${formatDateTime(end)}`,
  ];
}

function formatUtcStamp(value: string | undefined): string {
  const date = value ? new Date(value) : new Date();
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  return safe.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function eventLocation(event: FirestoreEvent): string | undefined {
  const bits = [
    trimString(event.venue),
    trimString(event.address),
    trimString(event.city),
    trimString(event.state),
    trimString(event.country),
  ].filter((value): value is string => Boolean(value));
  return bits.length > 0 ? bits.join(', ') : undefined;
}

export function buildICalFeed(feed: BuiltFeed): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CulturePass//Feed Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icalEscape(feed.title)}`,
    `X-WR-CALDESC:${icalEscape(feed.description)}`,
  ];

  for (const event of feed.events) {
    const eventUrl = buildEventUrl(feed.origin, event);
    const location = eventLocation(event);
    const description = eventSummary(event, eventUrl);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${icalEscape(`culturepass-event-${event.id}@culturepass.app`)}`);
    lines.push(`DTSTAMP:${formatUtcStamp(trimString(event.updatedAt) ?? trimString(event.createdAt))}`);
    lines.push(...eventDateLines(event));
    lines.push(`SUMMARY:${icalEscape(event.title)}`);
    lines.push(`DESCRIPTION:${icalEscape(description)}`);
    lines.push(`URL:${icalEscape(eventUrl)}`);
    if (location) {
      lines.push(`LOCATION:${icalEscape(location)}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`;
}
