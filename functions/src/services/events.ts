import { db } from '../admin';
import * as geofire from 'geofire-common';
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
  organizerReputationScore?: number;
  capacity?: number;
  attending?: number;
  isFeatured?: boolean;
  isFree?: boolean;
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
}

const eventsCol = () => db.collection('events');

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
        if (filters.dateFrom && data.date < filters.dateFrom) matchesAdvanced = false;
        if (filters.dateTo && data.date > filters.dateTo) matchesAdvanced = false;
        if (filters.isFree !== undefined && data.isFree !== filters.isFree) matchesAdvanced = false;
        if (filters.venue && data.venue !== filters.venue) matchesAdvanced = false;
        if (filters.time && data.time !== filters.time) matchesAdvanced = false;

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
      // Non-geo query: push date/isFree filters into Firestore, cap reads to prevent
      // Cloud Functions timeout and excessive Firestore billing on large collections.
      if (filters.isFree !== undefined) {
        baseQuery = baseQuery.where('isFree', '==', filters.isFree);
      }
      // orderBy('date') enables range queries and consistent ordering.
      // Requires a composite index for each combination of equality filters + date.
      baseQuery = baseQuery.orderBy('date');
      if (filters.dateFrom) baseQuery = baseQuery.where('date', '>=', filters.dateFrom);
      if (filters.dateTo) baseQuery = baseQuery.where('date', '<=', filters.dateTo);

      const offset = (page - 1) * pageSize;
      // Hard cap: never read more than 1 000 docs in a single request.
      // Once proper composite indexes + cursor tokens are added this can be tightened.
      const FETCH_CAP = 1000;
      const snap = await baseQuery.limit(FETCH_CAP).get();
      let memItems = snap.docs.map(doc => ({ ...doc.data() as FirestoreEvent, id: doc.id }));

      // Remaining filters that can't be pushed to Firestore without extra indexes
      if (filters.venue) memItems = memItems.filter(e => e.venue === filters.venue);
      if (filters.time) memItems = memItems.filter(e => e.time === filters.time);

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

  async update(id: string, data: Partial<FirestoreEvent>): Promise<FirestoreEvent | null> {
    const ref = eventsCol().doc(id);
    const existingSnap = await ref.get();
    if (!existingSnap.exists) return null;
    
    const updates: Partial<FirestoreEvent> = { ...data, updatedAt: new Date().toISOString() };
    
    if (updates.latitude != null && updates.longitude != null) {
      updates.geoHash = geofire.geohashForLocation([updates.latitude, updates.longitude]);
    }

    await ref.update(updates);
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
