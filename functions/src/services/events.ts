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
  hostName?: string | null;
  hostEmail?: string | null;
  hostPhone?: string | null;
  sponsors?: string | null;
  tiers?: { name: string; priceCents: number; available: number }[];
  cpid?: string;
  status: 'draft' | 'published' | 'deleted';
  
  viewCount?: number;
  favoriteCount?: number;
  shareCount?: number;
  ticketSalesCount?: number;
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
    // Date inequalities and complex secondary filters are shifted safely to memory-level checks 
    // to bypass Firestore's rigid Composite Index requirements while maintaining 0(n) speed.

    const isGeoQuery = filters.centerLat != null && filters.centerLng != null && filters.radiusInKm != null;
    let items: FirestoreEvent[] = [];
    let total = 0;

    if (isGeoQuery) {
      const center: [number, number] = [filters.centerLat!, filters.centerLng!];
      const radiusInM = filters.radiusInKm! * 1000;
      const bounds = geofire.geohashQueryBounds(center, radiusInM);
      const promises = [];

      for (const b of bounds) {
        const q = baseQuery.orderBy('geoHash').startAt(b[0]).endAt(b[1]);
        promises.push(q.get());
      }
      const snapshots = await Promise.all(promises);
      const matchingDocs: FirestoreEvent[] = [];

      for (const snap of snapshots) {
        for (const doc of snap.docs) {
          const data = { ...doc.data(), id: doc.id } as FirestoreEvent;
          
          let matchesAdvanced = true;
          if (filters.dateFrom && data.date < filters.dateFrom) matchesAdvanced = false;
          if (filters.dateTo && data.date > filters.dateTo) matchesAdvanced = false;
          if (filters.isFree !== undefined && data.isFree !== filters.isFree) matchesAdvanced = false;
          if (filters.venue && data.venue !== filters.venue) matchesAdvanced = false;
          if (filters.time && data.time !== filters.time) matchesAdvanced = false;

          if (matchesAdvanced && data.latitude != null && data.longitude != null) {
            const distanceInKm = geofire.distanceBetween([data.latitude, data.longitude], center);
            if (distanceInKm <= filters.radiusInKm!) {
              matchingDocs.push(data);
            }
          }
        }
      }

      matchingDocs.sort((a, b) => a.date.localeCompare(b.date));
      total = matchingDocs.length;
      
      const { page, pageSize } = pagination;
      items = matchingDocs.slice((page - 1) * pageSize, page * pageSize);

      return {
        items,
        total,
        page,
        pageSize,
        hasNextPage: page * pageSize < total,
      };
    }

      const { page, pageSize } = pagination;
      
      const snap = await baseQuery.get();
      let memItems = snap.docs.map(doc => ({ ...doc.data() as FirestoreEvent, id: doc.id }));

      // Memory filtering for unindexed complex metrics
      if (filters.dateFrom) memItems = memItems.filter(e => e.date >= filters.dateFrom!);
      if (filters.dateTo) memItems = memItems.filter(e => e.date <= filters.dateTo!);
      if (filters.isFree !== undefined) memItems = memItems.filter(e => e.isFree === filters.isFree);
      if (filters.venue) memItems = memItems.filter(e => e.venue === filters.venue);
      if (filters.time) memItems = memItems.filter(e => e.time === filters.time);

      memItems.sort((a, b) => a.date.localeCompare(b.date));
      total = memItems.length;

      const offset = (page - 1) * pageSize;
      items = memItems.slice(offset, offset + pageSize);
      
      return {
        items,
        total,
        page,
        pageSize,
        hasNextPage: offset + items.length < total,
      };
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
