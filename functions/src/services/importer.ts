/**
 * Event Import Service
 *
 * Normalizes external event data (scraped HTML, JSON APIs, manual JSON payloads)
 * into the CulturePass FirestoreEvent schema and batch-upserts into Firestore
 * using externalId for deduplication.
 *
 * Supported sources:
 *   - Generic JSON arrays
 *   - JSON-LD embedded in HTML pages (schema.org Event)
 *   - City of Sydney whatson site (Drupal JSON:API)
 *   - Generic HTML with common event card selectors
 */

import * as cheerio from 'cheerio';
import { db, isFirestoreConfigured } from '../admin';
import * as geofireCommon from 'geofire-common';
import { sanitizeImportImageUrl } from '../utils/httpsImageUrl';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImportSource =
  | 'manual'
  | 'url-scrape'
  | 'cityofsydney'
  | 'json-api';

export type RawImportEvent = Record<string, unknown>;

export type NormalizedEvent = {
  title: string;
  description?: string;
  date: string;             // YYYY-MM-DD
  time?: string;
  endDate?: string;
  endTime?: string;
  venue?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  imageUrl?: string;
  externalUrl?: string;       // event detail page URL
  externalTicketUrl?: string; // direct ticket purchase / RSVP link
  entryType?: 'ticketed' | 'free_open';
  externalId?: string;
  category?: string;
  tags?: string[];
  cultureTag?: string[];
  isFree?: boolean;
  priceCents?: number;
  priceLabel?: string;
  latitude?: number;
  longitude?: number;
  importSource: ImportSource;
  organizerId: string;
  organizer?: string;
};

export type ImportResult = {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
  source: ImportSource;
};

// ---------------------------------------------------------------------------
// Category normalization (mirrors constants/eventCategories.ts)
// ---------------------------------------------------------------------------

const CATEGORY_MAP: Record<string, string> = {
  'children and family':          'Children & Family',
  'children & family':            'Children & Family',
  'family':                       'Children & Family',
  'kids':                         'Children & Family',
  'community':                    'Community & Causes',
  'community & causes':           'Community & Causes',
  'community and causes':         'Community & Causes',
  'cultural':                     'Community & Causes',
  'charity':                      'Community & Causes',
  'exhibitions':                  'Exhibitions',
  'exhibition':                   'Exhibitions',
  'gallery':                      'Exhibitions',
  'art':                          'Exhibitions',
  'arts and culture':             'Exhibitions',
  'arts & culture':               'Exhibitions',
  'festival':                     'Festival',
  'festivals':                    'Festival',
  'food and drink':               'Food & Drink',
  'food & drink':                 'Food & Drink',
  'food':                         'Food & Drink',
  'dining':                       'Food & Drink',
  'music':                        'Music',
  'live music':                   'Music',
  'concert':                      'Music',
  'nightlife':                    'Nightlife',
  'party':                        'Nightlife',
  'shopping, markets & fairs':    'Shopping, Markets & Fairs',
  'shopping':                     'Shopping, Markets & Fairs',
  'market':                       'Shopping, Markets & Fairs',
  'markets':                      'Shopping, Markets & Fairs',
  'fair':                         'Shopping, Markets & Fairs',
  'sport and fitness':            'Sport & Fitness',
  'sport & fitness':              'Sport & Fitness',
  'sport':                        'Sport & Fitness',
  'fitness':                      'Sport & Fitness',
  'sports':                       'Sport & Fitness',
  'outdoor':                      'Sport & Fitness',
  'talks, courses & workshops':   'Talks, Courses & Workshops',
  'workshop':                     'Talks, Courses & Workshops',
  'workshops':                    'Talks, Courses & Workshops',
  'talk':                         'Talks, Courses & Workshops',
  'course':                       'Talks, Courses & Workshops',
  'education':                    'Talks, Courses & Workshops',
  'seminar':                      'Talks, Courses & Workshops',
  'theatre, dance & film':        'Theatre, Dance & Film',
  'theatre':                      'Theatre, Dance & Film',
  'theater':                      'Theatre, Dance & Film',
  'dance':                        'Theatre, Dance & Film',
  'film':                         'Theatre, Dance & Film',
  'cinema':                       'Theatre, Dance & Film',
  'performance':                  'Theatre, Dance & Film',
  'tours & experiences':          'Tours & Experiences',
  'tour':                         'Tours & Experiences',
  'tours':                        'Tours & Experiences',
  'experience':                   'Tours & Experiences',
};

function mapCategory(raw?: string): string | undefined {
  if (!raw) return undefined;
  return CATEGORY_MAP[raw.trim().toLowerCase()] ?? raw.trim();
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function parseToYMD(value: unknown): string | undefined {
  if (!value) return undefined;
  const str = String(value);

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // ISO string
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toLocaleDateString('en-CA'); // en-CA = YYYY-MM-DD

  return undefined;
}

function parseTime(value: unknown): string | undefined {
  if (!value) return undefined;
  const str = String(value);
  // HH:MM or H:MM AM/PM
  const match = str.match(/(\d{1,2}:\d{2}(?:\s*[APap][Mm])?)/);
  return match?.[1]?.trim();
}

// ---------------------------------------------------------------------------
// JSON-LD extraction
// ---------------------------------------------------------------------------

function extractJsonLdEvents(html: string): RawImportEvent[] {
  const $ = cheerio.load(html);
  const events: RawImportEvent[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() ?? '{}');
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        if (item['@type'] === 'Event' || item['@type'] === 'EventSeries') {
          events.push(item as RawImportEvent);
        }
      }
    } catch {
      // invalid JSON — skip
    }
  });

  return events;
}

// ---------------------------------------------------------------------------
// City of Sydney adapter
// ---------------------------------------------------------------------------

async function fetchCityOfSydney(url: string): Promise<RawImportEvent[]> {
  // The City of Sydney What's On site is a Drupal app.
  // Try JSON:API endpoint first.
  const base = 'https://whatson.cityofsydney.nsw.gov.au';
  const jsonApiUrl = `${base}/jsonapi/node/event?include=field_event_categories,field_image&filter[status]=1&page[limit]=50&sort=-field_date_range`;

  try {
    const apiRes = await fetch(jsonApiUrl, {
      headers: { Accept: 'application/vnd.api+json, application/json' },
    });
    if (apiRes.ok) {
      const data = await apiRes.json() as any;
      if (Array.isArray(data?.data)) {
        return data.data.map((node: any): RawImportEvent => {
          const attrs = node.attributes ?? {};
          const dateRange = attrs.field_date_range ?? {};
          const eventPageUrl = attrs.path?.alias ? `${base}${attrs.path.alias}` : undefined;
          // Try common Drupal field names for ticket/booking links
          const ticketUrl =
            attrs.field_ticket_link?.uri ??
            attrs.field_ticketing_link?.uri ??
            attrs.field_buy_tickets?.uri ??
            attrs.field_booking_link?.uri ??
            attrs.field_registration_link?.uri ??
            (attrs.field_is_free ? null : eventPageUrl);    // if paid, event page is ticket page
          return {
            _source: 'cityofsydney',
            externalId: node.id ?? attrs.drupal_internal__nid,
            title: attrs.title ?? '',
            description: attrs.body?.processed ?? attrs.field_short_description ?? '',
            startDate: dateRange.value,
            endDate: dateRange.end_value,
            venue: attrs.field_location ?? '',
            address: attrs.field_street_address ?? '',
            externalUrl: eventPageUrl,
            externalTicketUrl: ticketUrl ?? undefined,
            isFree: attrs.field_is_free ?? false,
            categories: (node.relationships?.field_event_categories?.data ?? []).map((c: any) => c.meta?.label ?? ''),
          };
        });
      }
    }
  } catch {
    // JSON:API failed — fall back to HTML scrape
  }

  // HTML fallback
  const res = await fetch(url, { headers: { 'User-Agent': 'CulturePass/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const html = await res.text();
  return extractJsonLdEvents(html);
}

// ---------------------------------------------------------------------------
// Generic URL fetcher
// ---------------------------------------------------------------------------

async function fetchFromUrl(url: string): Promise<RawImportEvent[]> {
  const isCityOfSydney = url.includes('cityofsydney.nsw.gov.au') || url.includes('whatson.cityofsydney');
  if (isCityOfSydney) return fetchCityOfSydney(url);

  const res = await fetch(url, {
    headers: { 'User-Agent': 'CulturePass/1.0', Accept: 'application/json, text/html, */*' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);

  const contentType = res.headers.get('content-type') ?? '';

  // JSON response — try to find an array of events
  if (contentType.includes('json')) {
    const json = await res.json() as any;
    const candidates = json?.events ?? json?.data ?? json?.results ?? json?.items ?? json;
    if (Array.isArray(candidates)) return candidates as RawImportEvent[];
    return [];
  }

  // HTML response — extract JSON-LD first, then fall back to generic selectors
  const html = await res.text();
  const jsonLdEvents = extractJsonLdEvents(html);
  if (jsonLdEvents.length > 0) return jsonLdEvents;

  // Generic HTML scrape using common class names
  return scrapeGenericHtml(html, url);
}

// ---------------------------------------------------------------------------
// Generic HTML scraper
// ---------------------------------------------------------------------------

function scrapeGenericHtml(html: string, baseUrl: string): RawImportEvent[] {
  const $ = cheerio.load(html);
  const events: RawImportEvent[] = [];

  // Common event card selectors (covers many CMS patterns)
  const cardSelectors = [
    '[class*="event-card"]',
    '[class*="event-item"]',
    '[class*="event-listing"]',
    '[data-event-id]',
    'article[class*="event"]',
    '.event',
  ];

  for (const sel of cardSelectors) {
    const cards = $(sel);
    if (cards.length === 0) continue;

    cards.each((_, el) => {
      const $el = $(el);
      const title =
        $el.find('h1, h2, h3, h4, [class*="title"], [class*="name"]').first().text().trim();
      if (!title) return;

      const dateText =
        $el.find('[class*="date"], time, [datetime]').first().attr('datetime')
        ?? $el.find('[class*="date"], time').first().text().trim();

      const description =
        $el.find('[class*="description"], [class*="excerpt"], p').first().text().trim();

      const linkEl = $el.find('a[href]').first();
      const href = linkEl.attr('href') ?? '';
      const externalUrl = href.startsWith('http') ? href : href ? `${new URL(baseUrl).origin}${href}` : undefined;

      // Detect dedicated ticket/booking link — higher priority than generic event page link
      const TICKET_TEXT_RE = /\b(ticket|buy|book|register|rsvp|get\s+tickets?|purchase)\b/i;
      let externalTicketUrl: string | undefined;
      $el.find('a[href]').each((_, a) => {
        const aHref = $(a).attr('href') ?? '';
        const aText = $(a).text().trim();
        if (TICKET_TEXT_RE.test(aText) || TICKET_TEXT_RE.test(aHref)) {
          const resolved = aHref.startsWith('http') ? aHref : aHref ? `${new URL(baseUrl).origin}${aHref}` : undefined;
          if (resolved) { externalTicketUrl = resolved; return false; } // break
        }
      });

      const imageUrl = $el.find('img').first().attr('src') ?? $el.find('[style*="background-image"]').first().attr('data-src');

      // Detect free events by looking for "free" keyword in title, description, or price elements
      const priceText = $el.find('[class*="price"], [class*="cost"], [class*="ticket"]').first().text().trim().toLowerCase();
      const isFree = /\bfree\b/.test(priceText) || /\bfree\s+entry\b|\bfree\s+event\b/i.test(title + ' ' + description);

      events.push({ title, description, rawDate: dateText, externalUrl, externalTicketUrl, imageUrl, isFree });
    });

    if (events.length > 0) break; // stop at first matching selector
  }

  return events;
}

// ---------------------------------------------------------------------------
// Normalizer — any source format → NormalizedEvent
// ---------------------------------------------------------------------------

export function normalizeRawEvent(raw: RawImportEvent, importSource: ImportSource, defaultCity = 'Sydney', defaultCountry = 'Australia'): NormalizedEvent | null {
  // Schema.org Event (JSON-LD)
  if ((raw['@type'] as string) === 'Event') {
    const title = String(raw.name ?? '').trim();
    if (!title) return null;

    const startDate = raw.startDate as string;
    const date = parseToYMD(startDate);
    if (!date) return null;

    const location = (raw.location as any) ?? {};
    const address = typeof location === 'string'
      ? location
      : location?.address?.streetAddress ?? location?.name ?? '';
    const venue = typeof location === 'string' ? location : location?.name ?? '';

    const offers = raw.offers as any;
    const isFree = offers?.price === '0' || offers?.price === 0 || String(offers?.price).toLowerCase() === 'free';
    const priceNum = offers?.price ? parseFloat(String(offers.price)) : undefined;
    const priceCents = !isNaN(priceNum ?? NaN) ? Math.round((priceNum ?? 0) * 100) : undefined;

    return {
      title,
      description: String(raw.description ?? '').trim() || undefined,
      date,
      time: parseTime(startDate),
      endDate: parseToYMD(raw.endDate),
      venue,
      address,
      city: (raw as any).city ?? (location?.address?.addressLocality) ?? defaultCity,
      state: (location?.address?.addressRegion) ?? undefined,
      country: (location?.address?.addressCountry) ?? defaultCountry,
      imageUrl: (raw.image as any)?.url ?? (raw.image as string) ?? undefined,
      externalUrl: (raw.url ?? raw['@id']) as string | undefined,
      externalTicketUrl: (offers as any)?.url ?? undefined,
      externalId: (raw['@id'] ?? raw.identifier) as string | undefined,
      category: mapCategory((raw.eventAttendanceMode ?? raw['@type']) as string),
      isFree: isFree || priceCents === 0,
      entryType: (isFree || priceCents === 0) ? 'free_open' : 'ticketed',
      priceCents: isFree ? 0 : priceCents,
      priceLabel: isFree ? 'Free' : offers?.priceCurrency ? `${offers.priceCurrency}${priceNum}` : undefined,
      importSource,
      organizerId: 'import',
      organizer: (raw.organizer as any)?.name ?? undefined,
    };
  }

  // City of Sydney adapter output
  if ((raw as any)._source === 'cityofsydney') {
    const title = String(raw.title ?? '').trim();
    if (!title) return null;
    const date = parseToYMD(raw.startDate);
    if (!date) return null;

    const cats = (raw.categories as string[]) ?? [];
    const category = cats.map(c => mapCategory(c)).find(Boolean);

    return {
      title,
      description: String(raw.description ?? '').trim() || undefined,
      date,
      time: parseTime(raw.startDate),
      endDate: parseToYMD(raw.endDate),
      venue: String(raw.venue ?? '').trim() || undefined,
      address: String(raw.address ?? '').trim() || undefined,
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia',
      externalUrl: raw.externalUrl as string | undefined,
      externalTicketUrl: raw.externalTicketUrl as string | undefined,
      externalId: raw.externalId as string | undefined,
      category,
      tags: cats.map(c => c.toLowerCase()),
      isFree: Boolean(raw.isFree),
      entryType: Boolean(raw.isFree) ? 'free_open' : 'ticketed',
      importSource: 'cityofsydney',
      organizerId: 'import',
    };
  }

  // Generic / manual JSON
  const title = String(raw.title ?? raw.name ?? '').trim();
  if (!title) return null;

  const date = parseToYMD(raw.date ?? raw.startDate ?? raw.start_date ?? raw.start_time ?? raw.rawDate);
  if (!date) return null;

  const rawCat = (raw.category ?? raw.type ?? raw.event_type ?? '') as string;
  const category = mapCategory(rawCat);

  const rawPrice = raw.price ?? raw.priceCents ?? raw.cost;
  const isFreeRaw = raw.isFree ?? raw.is_free ?? raw.free ?? (rawPrice === 0 || rawPrice === '0' || String(rawPrice).toLowerCase() === 'free');
  const priceCents = typeof rawPrice === 'number' ? rawPrice : undefined;

  return {
    title,
    description: String(raw.description ?? raw.summary ?? raw.body ?? '').trim() || undefined,
    date,
    time: parseTime(raw.time ?? raw.startTime ?? raw.start_time ?? raw.startDate),
    endDate: parseToYMD(raw.endDate ?? raw.end_date ?? raw.end_time),
    endTime: parseTime(raw.endTime ?? raw.end_time),
    venue: String(raw.venue ?? raw.location ?? raw.place ?? '').trim() || undefined,
    address: String(raw.address ?? raw.street ?? '').trim() || undefined,
    city: String(raw.city ?? raw.suburb ?? defaultCity).trim(),
    state: String(raw.state ?? raw.region ?? '').trim() || undefined,
    country: String(raw.country ?? defaultCountry).trim(),
    imageUrl: (raw.imageUrl ?? raw.image ?? raw.image_url ?? raw.thumbnail) as string | undefined,
    externalUrl: (raw.url ?? raw.link ?? raw.externalUrl ?? raw.event_url) as string | undefined,
    externalTicketUrl: (
      raw.ticketUrl ?? raw.ticket_url ?? raw.ticketLink ?? raw.ticket_link ??
      raw.bookingUrl ?? raw.booking_url ?? raw.registrationUrl ?? raw.registration_url ??
      raw.externalTicketUrl
    ) as string | undefined,
    entryType: (Boolean(isFreeRaw) || priceCents === 0) ? 'free_open' : (priceCents != null ? 'ticketed' : undefined),
    externalId: String(raw.id ?? raw.externalId ?? raw.external_id ?? '').trim() || undefined,
    category,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : undefined,
    cultureTag: Array.isArray(raw.cultureTag) ? raw.cultureTag.map(String) : undefined,
    isFree: Boolean(isFreeRaw) || priceCents === 0,
    priceCents: typeof rawPrice === 'number' ? rawPrice : undefined,
    priceLabel: String(raw.priceLabel ?? raw.price_label ?? '').trim() || undefined,
    latitude: typeof raw.latitude === 'number' ? raw.latitude : undefined,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : undefined,
    importSource,
    organizerId: 'import',
    organizer: String(raw.organizer ?? raw.host ?? raw.organiser ?? '').trim() || undefined,
  };
}

// ---------------------------------------------------------------------------
// Batch upsert into Firestore
// ---------------------------------------------------------------------------

const BATCH_SIZE = 400;

export async function importEvents(
  rawEvents: RawImportEvent[],
  source: ImportSource,
  options: { city?: string; country?: string } = {},
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, updated: 0, skipped: 0, errors: [], source };

  if (!isFirestoreConfigured) {
    result.errors.push('Firestore not configured — running in dev/emulator mode');
    return result;
  }

  const normalized = rawEvents.flatMap(raw => {
    const n = normalizeRawEvent(raw, source, options.city ?? 'Sydney', options.country ?? 'Australia');
    return n ? [n] : [];
  });

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
    const chunk = normalized.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    const now = new Date().toISOString();

    for (const event of chunk) {
      try {
        // Check for existing event by externalId
        let existingRef = null;
        if (event.externalId) {
          const existing = await db.collection('events')
            .where('externalId', '==', event.externalId)
            .where('importSource', '==', source)
            .limit(1)
            .get();
          if (!existing.empty) {
            existingRef = existing.docs[0].ref;
            result.updated++;
          }
        }

        const geoHash = (event.latitude != null && event.longitude != null)
          ? geofireCommon.geohashForLocation([event.latitude, event.longitude])
          : undefined;

        const docData = {
          title:        event.title,
          description:  event.description ?? '',
          date:         event.date,
          time:         event.time ?? '',
          endDate:      event.endDate ?? null,
          endTime:      event.endTime ?? null,
          venue:        event.venue ?? '',
          address:      event.address ?? '',
          city:         event.city ?? 'Sydney',
          state:        event.state ?? null,
          country:      event.country ?? 'Australia',
          imageUrl:          sanitizeImportImageUrl(event.imageUrl) ?? null,
          externalUrl:       event.externalUrl ?? null,
          externalTicketUrl: event.externalTicketUrl ?? null,
          entryType:         event.entryType ?? (event.isFree ? 'free_open' : 'ticketed'),
          externalId:        event.externalId ?? null,
          category:     event.category ?? null,
          tags:         event.tags ?? [],
          cultureTag:   event.cultureTag ?? [],
          isFree:       event.isFree ?? false,
          priceCents:   event.priceCents ?? 0,
          priceLabel:   event.priceLabel ?? (event.isFree ? 'Free' : null),
          latitude:     event.latitude ?? null,
          longitude:    event.longitude ?? null,
          geoHash:      geoHash ?? null,
          importSource: event.importSource,
          organizerId:  event.organizerId,
          organizer:    event.organizer ?? null,
          status:       'published',
          attending:    0,
          updatedAt:    now,
        };

        if (existingRef) {
          batch.update(existingRef, docData);
        } else {
          const ref = db.collection('events').doc();
          batch.set(ref, {
            ...docData,
            id:              ref.id,
            cpid:            `CP-E-IMP-${ref.id.slice(0, 8).toUpperCase()}`,
            createdAt:       now,
            ticketClickCount: 0,
            rsvpGoing:       0,
            rsvpMaybe:       0,
            rsvpNotGoing:    0,
          });
          result.imported++;
        }
      } catch (err) {
        result.errors.push(`Failed to import "${event.title}": ${String(err)}`);
      }
    }

    await batch.commit();
  }

  return result;
}

// ---------------------------------------------------------------------------
// Clear imported events
// ---------------------------------------------------------------------------

export async function clearImportedEvents(source?: ImportSource): Promise<{ deleted: number }> {
  let query = db.collection('events') as FirebaseFirestore.Query;

  if (source) {
    query = query.where('importSource', '==', source);
  } else {
    // Clear all non-manually-created events (importSource is set on all imported events)
    query = query.where('importSource', '!=', 'manual');
  }

  let deleted = 0;
  let snap = await query.limit(400).get();

  while (!snap.empty) {
    const batch = db.batch();
    snap.docs.forEach(doc => { batch.delete(doc.ref); deleted++; });
    await batch.commit();
    snap = await query.limit(400).get();
  }

  return { deleted };
}

// ---------------------------------------------------------------------------
// Public fetch-and-import from URL
// ---------------------------------------------------------------------------

export async function importFromUrl(url: string, options: { city?: string; country?: string } = {}): Promise<ImportResult> {
  const isCityOfSydney = url.includes('cityofsydney.nsw.gov.au');
  const source: ImportSource = isCityOfSydney ? 'cityofsydney' : 'url-scrape';

  const rawEvents = await fetchFromUrl(url);
  return importEvents(rawEvents, source, options);
}
