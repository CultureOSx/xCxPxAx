import { db } from '../admin';
import * as geofire from 'geofire-common';
import { sanitizeStoredImagePointer } from '../utils/httpsImageUrl';
import type { PaginationParams, PaginatedResult } from './base';

export interface FirestoreEvent {
  id: string;
  title: string;
  description: string;
  communityId: string;
  venue: string;
  address?: string;
  date: string;
  time: string;
  city: string;
  state?: string;
  council?: string;
  suburb?: string;
  postcode?: number;
  latitude?: number;
  longitude?: number;
  country: string;
  imageUrl?: string;
  imageColor?: string;
  cultureTag?: string[];
  tags?: string[];
  indigenousTags?: string[];
  languageTags?: string[];
  geoHash?: string;
  eventType?: string;
  ageSuitability?: string;
  priceTier?: string;
  priceCents?: number;
  priceLabel?: string;
  category?: string;
  organizerId?: string;
  organizer?: string;
  /** Canonical publisher directory profile — Phase 1 */
  publisherProfileId?: string;
  /** Linked venue profile (venue | business | restaurant) — Phase 1 */
  venueProfileId?: string;
  organizerReputationScore?: number;
  capacity?: number;
  attending?: number;
  isFeatured?: boolean;
  isFree?: boolean;
  /** Submitter / organiser contact for review (listing form) */
  contactEmail?: string;
  externalTicketUrl?: string | null;
  // Entry type & end datetime (event creation wizard)
  entryType?: 'ticketed' | 'free_open';
  endDate?: string | null;
  endTime?: string | null;
  heroImageUrl?: string | null;

  // Core team (artists, sponsors, host)
  hostInfo?: { name?: string; email?: string; phone?: string } | null;
  hostName?: string | null;
  hostEmail?: string | null;
  hostPhone?: string | null;
  sponsors?: string | null;
  artists?: { name: string; role?: string; bio?: string; imageUrl?: string }[];
  eventSponsors?: { name: string; tier: 'title' | 'gold' | 'silver' | 'bronze' | 'partner'; logoUrl?: string; websiteUrl?: string; website?: string; profileId?: string }[];
  tiers?: { name: string; priceCents: number; available: number }[];

  // Location service (council LGA)
  lgaCode?: string | null;
  councilId?: string | null;
  cpid?: string;
  status: 'draft' | 'published' | 'deleted';
  
  viewCount?: number;
  favoriteCount?: number;
  shareCount?: number;
  ticketSalesCount?: number;
  ticketsSold?: number;
  ticketClickCount?: number;
  popularityScore?: number;
  sourceSystem?: string;
  searchTokens?: string[];
  metadata?: Record<string, any>;
  
  createdAt: string;
  updatedAt: string;
}

export interface EventFilters {
  city?: string;
  country?: string;
  category?: string;
  eventType?: string;
  isFeatured?: boolean;
  dateFrom?: string;
  dateTo?: string;
  organizerId?: string;
  communityId?: string;
  status?: FirestoreEvent['status'];
  centerLat?: number;
  centerLng?: number;
  radiusInKm?: number;
  isFree?: boolean;
  venue?: string;
  time?: string;
  publisherProfileId?: string;
  venueProfileId?: string;
  includeOngoing?: boolean;
}

const eventsCol = () => db.collection('events');

function parseYmd(value?: string | null): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const ts = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(ts) ? ts : null;
}

function getEventDateRange(event: Pick<FirestoreEvent, 'date' | 'endDate'>): { start: number; end: number } | null {
  const start = parseYmd(event.date);
  if (start == null) return null;
  const end = parseYmd(event.endDate ?? event.date) ?? start;
  return { start, end: Math.max(start, end) };
}

function overlapsRequestedDateRange(
  event: Pick<FirestoreEvent, 'date' | 'endDate'>,
  dateFrom?: string,
  dateTo?: string,
): boolean {
  if (!dateFrom && !dateTo) return true;
  const range = getEventDateRange(event);
  if (!range) return false;
  const reqStart = parseYmd(dateFrom) ?? Number.NEGATIVE_INFINITY;
  const reqEnd = parseYmd(dateTo) ?? Number.POSITIVE_INFINITY;
  return range.end >= reqStart && range.start <= reqEnd;
}

export const eventsService = {
  async getById(id: string): Promise<FirestoreEvent | null> {
    const snap = await eventsCol().doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as FirestoreEvent;
    if (data.status === 'deleted') return null;
    return { ...data, id: snap.id };
  },

  async list(
    filters: EventFilters = {},
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<PaginatedResult<FirestoreEvent>> {
    let baseQuery = eventsCol() as FirebaseFirestore.Query;

    if (filters.status) {
      baseQuery = baseQuery.where('status', '==', filters.status);
    } else if (!filters.organizerId) {
      baseQuery = baseQuery.where('status', '==', 'published');
    }

    if (filters.organizerId) baseQuery = baseQuery.where('organizerId', '==', filters.organizerId);
    if (filters.communityId) baseQuery = baseQuery.where('communityId', '==', filters.communityId);
    if (filters.city) baseQuery = baseQuery.where('city', '==', filters.city);
    if (filters.country) baseQuery = baseQuery.where('country', '==', filters.country);
    if (filters.category) baseQuery = baseQuery.where('category', '==', filters.category);
    if (filters.isFeatured !== undefined) baseQuery = baseQuery.where('isFeatured', '==', filters.isFeatured);

    const isGeoQuery = filters.centerLat != null && filters.centerLng != null && filters.radiusInKm != null;
    let items: FirestoreEvent[] = [];
    let total = 0;
    const { page, pageSize } = pagination;

    if (isGeoQuery) {
      const center: [number, number] = [filters.centerLat!, filters.centerLng!];
      const radiusInM = filters.radiusInKm! * 1000;
      const bounds = geofire.geohashQueryBounds(center, radiusInM);
      const promises = [];
      const matchingDocs: FirestoreEvent[] = [];

      try {
        for (const b of bounds) {
          const q = baseQuery.orderBy('geoHash').startAt(b[0]).endAt(b[1]);
          promises.push(q.get());
        }
        const snapshots = await Promise.all(promises);
        for (const snap of snapshots) {
          for (const doc of snap.docs) {
            matchingDocs.push({ ...doc.data(), id: doc.id } as FirestoreEvent);
          }
        }
      } catch (err: any) {
        if (err?.message?.includes('index') || err?.code === 9) {
          console.warn('[eventsService] Index missing for status+geoHash. Falling back to multi-bound search without order.');
          const fallbackPromises = [];
          for (const b of bounds) {
            const q = baseQuery.where('geoHash', '>=', b[0]).where('geoHash', '<=', b[1]);
            fallbackPromises.push(q.get());
          }
          const snapshots = await Promise.all(fallbackPromises);
          for (const snap of snapshots) {
            for (const doc of snap.docs) {
              matchingDocs.push({ ...doc.data(), id: doc.id } as FirestoreEvent);
            }
          }
        } else {
          throw err;
        }
      }

      const uniqueDocs = Array.from(new Map(matchingDocs.map(d => [d.id, d])).values());
      let filteredDocs: FirestoreEvent[] = [];

      for (const data of uniqueDocs) {
        let matchesAdvanced = true;
        if (filters.includeOngoing) {
          if (!overlapsRequestedDateRange(data, filters.dateFrom, filters.dateTo)) matchesAdvanced = false;
        } else {
          if (filters.dateFrom && data.date < filters.dateFrom) matchesAdvanced = false;
          if (filters.dateTo && data.date > filters.dateTo) matchesAdvanced = false;
        }
        if (filters.isFree !== undefined && data.isFree !== filters.isFree) matchesAdvanced = false;
        if (filters.venue && data.venue !== filters.venue) matchesAdvanced = false;
        if (filters.time && data.time !== filters.time) matchesAdvanced = false;
        if (filters.publisherProfileId && data.publisherProfileId !== filters.publisherProfileId) {
          matchesAdvanced = false;
        }
        if (filters.venueProfileId && data.venueProfileId !== filters.venueProfileId) {
          matchesAdvanced = false;
        }

        if (matchesAdvanced && data.latitude != null && data.longitude != null) {
          const distanceInKm = geofire.distanceBetween([data.latitude, data.longitude], center);
          if (distanceInKm <= filters.radiusInKm!) {
            filteredDocs.push(data);
          }
        }
      }

      filteredDocs.sort((a, b) => a.date.localeCompare(b.date));
      total = filteredDocs.length;
      const offset = (page - 1) * pageSize;
      items = filteredDocs.slice(offset, offset + pageSize);

      return {
        items,
        total,
        page,
        pageSize,
        hasNextPage: offset + items.length < total,
      };
    } else {
      // Non-geo query: equality filters + optional date range + orderBy('date').
      // Composite indexes must match; see firestore.indexes.json.
      if (filters.isFree !== undefined) {
        baseQuery = baseQuery.where('isFree', '==', filters.isFree);
      }
      if (!filters.includeOngoing) {
        if (filters.dateFrom) baseQuery = baseQuery.where('date', '>=', filters.dateFrom);
        if (filters.dateTo) baseQuery = baseQuery.where('date', '<=', filters.dateTo);
      }
      baseQuery = baseQuery.orderBy('date');

      const offset = (page - 1) * pageSize;
      const FETCH_CAP = 1000;

      const applyMemoryFilters = (raw: FirestoreEvent[]): FirestoreEvent[] => {
        let memItems = raw;
        if (filters.organizerId) memItems = memItems.filter(e => e.organizerId === filters.organizerId);
        if (filters.communityId) memItems = memItems.filter(e => e.communityId === filters.communityId);
        if (filters.city) memItems = memItems.filter(e => e.city === filters.city);
        if (filters.country) memItems = memItems.filter(e => e.country === filters.country);
        if (filters.category) memItems = memItems.filter(e => e.category === filters.category);
        if (filters.eventType) memItems = memItems.filter(e => e.eventType === filters.eventType);
        if (filters.isFeatured !== undefined) memItems = memItems.filter(e => e.isFeatured === filters.isFeatured);
        if (filters.isFree !== undefined) memItems = memItems.filter(e => e.isFree === filters.isFree);
        if (!filters.organizerId && !filters.status) {
          memItems = memItems.filter(e => e.status === 'published');
        } else if (filters.status) {
          memItems = memItems.filter(e => e.status === filters.status);
        }
        if (filters.includeOngoing) {
          memItems = memItems.filter((e) => overlapsRequestedDateRange(e, filters.dateFrom, filters.dateTo));
        } else {
          if (filters.dateFrom) memItems = memItems.filter(e => e.date >= filters.dateFrom!);
          if (filters.dateTo) memItems = memItems.filter(e => e.date <= filters.dateTo!);
        }
        if (filters.venue) memItems = memItems.filter(e => e.venue === filters.venue);
        if (filters.time) memItems = memItems.filter(e => e.time === filters.time);
        if (filters.publisherProfileId) {
          memItems = memItems.filter((e) => e.publisherProfileId === filters.publisherProfileId);
        }
        if (filters.venueProfileId) {
          memItems = memItems.filter((e) => e.venueProfileId === filters.venueProfileId);
        }
        memItems.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        return memItems;
      };

      const fallbackListInMemory = async (): Promise<PaginatedResult<FirestoreEvent>> => {
        let fq = eventsCol() as FirebaseFirestore.Query;
        if (filters.organizerId) {
          fq = fq.where('organizerId', '==', filters.organizerId);
        } else if (filters.status) {
          fq = fq.where('status', '==', filters.status);
        } else {
          fq = fq.where('status', '==', 'published');
        }
        const fbSnap = await fq.limit(FETCH_CAP).get();
        let memItems = fbSnap.docs.map(doc => ({ ...doc.data() as FirestoreEvent, id: doc.id }));
        memItems = applyMemoryFilters(memItems);
        total = memItems.length;
        items = memItems.slice(offset, offset + pageSize);
        return {
          items,
          total,
          page,
          pageSize,
          hasNextPage: offset + items.length < total,
        };
      };

      let memItems: FirestoreEvent[];
      try {
        const snap = await baseQuery.limit(FETCH_CAP).get();
        memItems = snap.docs.map(doc => ({ ...doc.data() as FirestoreEvent, id: doc.id }));
      } catch (err: unknown) {
        const code = (err as { code?: number | string })?.code;
        const msg = String((err as Error)?.message ?? '');
        const isIndexError =
          code === 9 ||
          code === 'failed-precondition' ||
          msg.toLowerCase().includes('index');
        if (!isIndexError) throw err;
        console.warn('[eventsService] Composite index missing; using in-memory list fallback.', msg);
        return fallbackListInMemory();
      }

      // Always run in-memory filters prior to pagination so includeOngoing/date overlap
      // semantics are applied consistently even when Firestore-side date range is skipped.
      memItems = applyMemoryFilters(memItems);

      total = memItems.length;
      items = memItems.slice(offset, offset + pageSize);

      return {
        items,
        total,
        page,
        pageSize,
        hasNextPage: offset + items.length < total,
      };
    }
  },

  async create(data: Omit<FirestoreEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<FirestoreEvent> {
    const now = new Date().toISOString();
    const ref = eventsCol().doc();
    
    let geoHash = data.geoHash;
    if (!geoHash && data.latitude != null && data.longitude != null) {
      geoHash = geofire.geohashForLocation([data.latitude, data.longitude]);
    }
    
    const event: FirestoreEvent = {
      ...data,
      id: ref.id,
      geoHash,
      status: data.status ?? 'draft',
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(event);
    return event;
  },

  async update(id: string, data: Record<string, unknown>): Promise<FirestoreEvent | null> {
    const ref = eventsCol().doc(id);
    const existingSnap = await ref.get();
    if (!existingSnap.exists) return null;

    const updates: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() };

    const lat = updates.latitude;
    const lng = updates.longitude;
    if (typeof lat === 'number' && typeof lng === 'number') {
      updates.geoHash = geofire.geohashForLocation([lat, lng]);
    }

    await ref.update(updates as FirebaseFirestore.UpdateData<FirestoreEvent>);
    const updated = await ref.get();
    return { ...(updated.data() as FirestoreEvent), id: updated.id };
  },

  async softDelete(id: string): Promise<void> {
    await eventsCol().doc(id).update({
      status: 'deleted',
      updatedAt: new Date().toISOString(),
    });
  },

  async publish(id: string): Promise<FirestoreEvent | null> {
    return this.update(id, { status: 'published' });
  },
};

/**
 * Many clients only read `imageUrl`; some records store the banner in `heroImageUrl` only.
 * Coalesce for API responses so Discover / lists / maps get a loadable URL on all platforms.
 */
export function normalizeEventImageForClient<T extends { imageUrl?: string | null; heroImageUrl?: string | null }>(
  e: T,
): T {
  const fromImage = sanitizeStoredImagePointer(e.imageUrl);
  const fromHero = sanitizeStoredImagePointer(e.heroImageUrl);
  const merged = fromImage || fromHero;
  const out = { ...e } as T & { imageUrl?: string | null; heroImageUrl?: string | null };
  out.imageUrl = merged ?? null;
  return out as T;
}

export function normalizeEventListForClient<T extends { imageUrl?: string | null; heroImageUrl?: string | null }>(
  items: T[],
): T[] {
  return items.map(normalizeEventImageForClient);
}
