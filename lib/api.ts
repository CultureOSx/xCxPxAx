/**
 * CulturePassAU — Typed API Client
 *
 * Wraps apiRequest() with structured error handling, typed responses,
 * and consistent route helpers. Use this instead of calling apiRequest()
 * directly in screens — it eliminates duplicated fetch logic and gives
 * you full TypeScript inference throughout the app.
 *
 * Usage:
 *   import { api } from '@/lib/api';
 *   const events = await api.events.list({ city: 'Sydney', page: 1 });
 */

import { apiRequest, apiRequestMultipart, getApiUrl } from './query-client';
import type {
  EventData,
  User,
  UserRole,
  Ticket,
  PaginatedEventsResponse,
  Profile,
  Community,
  Notification,
  NotificationType,
  PerkData,
  WidgetSpotlightItem,
  WidgetNearbyEventItem,
  WidgetUpcomingTicketItem,
  PrivacySettings,
  MembershipSummary,
  WalletTransaction,
  RewardsSummary,
  WalletSummary,
  WalletPassLinkResponse,
  GoogleWalletClassBootstrapResponse,
  WalletBusinessCardReadinessResponse,
  ActivityData,
  ActivityInput,
  CouncilData,
  CouncilWasteSchedule,
  CouncilAlert,
  CouncilFacility,
  CouncilGrant,
  CouncilLink,
  CouncilPreference,
  CouncilWasteReminder,
  CouncilDashboard,
  CouncilListResponse,
  CouncilClaim,
  CouncilClaimLetter,
  AdminAuditLog,
  AppUpdate,
  UpdateCategory,
  DiscoverCurationResponse,
  DiscoverCurationConfig,
  IngestSource,
  IngestionJob,
  IngestScheduleInterval,
} from '@/shared/schema';

export type { MembershipSummary, Notification, CouncilData, RewardsSummary, WalletSummary, WalletTransaction, WidgetSpotlightItem, WidgetNearbyEventItem, WidgetUpcomingTicketItem, CouncilDashboard, ActivityData, ActivityInput, CouncilPreference, CouncilFacility, CouncilGrant, CouncilAlert, CouncilLink, CouncilWasteSchedule, CouncilWasteReminder, CouncilListResponse, CouncilClaim, CouncilClaimLetter, AdminAuditLog, AppUpdate, UpdateCategory, IngestSource, IngestionJob, IngestScheduleInterval } from '@/shared/schema';

// ---------------------------------------------------------------------------
// Pending handle item — returned by admin handle approval endpoint
// ---------------------------------------------------------------------------
export interface PendingHandleItem {
  id: string;
  type: 'user' | 'profile';
  handle?: string;
  name: string;
  entityType?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Structured error — always carry HTTP status for conditional handling
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNotFound() { return this.status === 404; }
  get isUnauthorized() { return this.status === 401; }
  get isForbidden() { return this.status === 403; }
  get isRateLimited() { return this.status === 429; }
  get isServerError() { return this.status >= 500; }
  get isNetworkError() { return this.status === 0; }
}

// ---------------------------------------------------------------------------
// Internal helper — parse response and surface ApiError on failure
// ---------------------------------------------------------------------------
async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(res.status, `Non-JSON response: ${text.slice(0, 200)}`);
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  route: string,
  data?: unknown
): Promise<T> {
  try {
    const res = await apiRequest(method, route, data);
    return parseJson<T>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Error) {
      const match = err.message.match(/^(\d{3}):\s*(.*)/s);
      if (match) throw new ApiError(parseInt(match[1]), match[2]);
    }
    throw new ApiError(0, err instanceof Error ? err.message : 'Network error');
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
const auth = {
  me: () =>
    request<User>('GET', 'api/auth/me'),
  register: (payload: { displayName?: string; username?: string; city?: string; state?: string; postcode?: number; country?: string; role?: 'user' | 'organizer' }) =>
    request<User>('POST', 'api/auth/register', payload),
};

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export interface EventListParams {
  city?: string;
  country?: string;
  category?: string;
  communityId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  eventType?: string;
  isFeatured?: boolean;
  organizerId?: string;
  isFree?: boolean;
}

const events = {
  list: (params: EventListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.city) qs.set('city', params.city);
    if (params.country) qs.set('country', params.country);
    if (params.category) qs.set('category', params.category);
    if (params.communityId) qs.set('communityId', params.communityId);
    if (params.page != null) qs.set('page', String(params.page));
    if (params.pageSize != null) qs.set('pageSize', String(params.pageSize));
    if (params.search) qs.set('search', params.search);
    if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params.dateTo) qs.set('dateTo', params.dateTo);
    if (params.eventType) qs.set('eventType', params.eventType);
    if (params.isFeatured !== undefined) qs.set('isFeatured', String(params.isFeatured));
    if (params.organizerId) qs.set('organizerId', params.organizerId);
    if (params.isFree !== undefined) qs.set('isFree', String(params.isFree));
    
    const query = qs.toString();
    return request<PaginatedEventsResponse>('GET', `api/events${query ? `?${query}` : ''}`);
  },

  get: (id: string) =>
    request<EventData>('GET', `api/events/${id}`),

  create: (data: Partial<EventData>) =>
    request<EventData>('POST', 'api/events', data),

  update: (id: string, data: Partial<EventData>) =>
    request<EventData>('PUT', `api/events/${id}`, data),

  publish: (id: string) =>
    request<{ success: boolean }>('POST', `api/events/${id}/publish`),

  nearby: (params: { lat: number; lng: number; radius?: number; pageSize?: number }) => {
    const qs = new URLSearchParams({ lat: String(params.lat), lng: String(params.lng) });
    if (params.radius != null) qs.set('radius', String(params.radius));
    if (params.pageSize != null) qs.set('pageSize', String(params.pageSize));
    return request<{ events: EventData[]; total: number; radiusKm: number }>('GET', `api/events/nearby?${qs}`);
  },

  /** RSVP to a free/open event */
  rsvp: (eventId: string, status: 'going' | 'maybe' | 'not_going') =>
    request<{ status: string }>('POST', `api/events/${eventId}/rsvp`, { status }),

  /** Get the authenticated user's RSVP status for an event */
  myRsvp: (eventId: string) =>
    request<{ status: 'going' | 'maybe' | 'not_going' | null }>('GET', `api/events/${eventId}/rsvp/me`),

  /** Track a click on an external ticket link (no auth required) */
  trackTicketClick: (eventId: string) =>
    request<{ ok: boolean }>('POST', `api/events/${eventId}/ticket-click`),
};

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------
const tickets = {
  forUser: (userId: string) =>
    request<Ticket[]>('GET', `api/tickets/${userId}`),

  get: (id: string) =>
    request<Ticket>('GET', `api/ticket/${id}`),

  purchase: (data: { eventId: string; tierId?: string; quantity?: number }) =>
    request<Ticket>('POST', 'api/tickets', data),

  cancel: (id: string) =>
    request<{ success: boolean }>('PUT', `api/tickets/${id}/cancel`),

  scan: (data: { ticketCode: string; scannedBy?: string }) =>
    request<{ valid: boolean; message: string; outcome?: string; ticket?: Ticket }>('POST', 'api/tickets/scan', data),
  walletApple: (ticketId: string) =>
    request<WalletPassLinkResponse>('GET', `api/tickets/${ticketId}/wallet/apple`),
  walletGoogle: (ticketId: string) =>
    request<WalletPassLinkResponse>('GET', `api/tickets/${ticketId}/wallet/google`),
};

const stripeApi = {
  createCheckoutSession: (ticketData: {
    eventId: string;
    eventTitle?: string;
    eventDate?: string;
    tierName?: string;
    quantity?: number;
    totalPriceCents?: number;
    currency?: string;
  }) => request<{ checkoutUrl: string; ticketId: string; sessionId: string }>('POST', 'api/stripe/create-checkout-session', { ticketData }),
};

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
export interface SearchParams {
  q: string;
  type?: string;
  city?: string;
  country?: string;
  page?: number;
  pageSize?: number;
}

const search = {
  query: (params: SearchParams) => {
    const qs = new URLSearchParams({ q: params.q });
    if (params.type) qs.set('type', params.type);
    if (params.city) qs.set('city', params.city);
    if (params.country) qs.set('country', params.country);
    if (params.page != null) qs.set('page', String(params.page));
    if (params.pageSize != null) qs.set('pageSize', String(params.pageSize));
    return request<{ events: EventData[]; profiles: Profile[]; movies: import('@shared/schema').MovieData[]; users: User[] }>('GET', `api/search?${qs}`);
  },

  suggest: (q: string) =>
    request<{ suggestions: string[] }>('GET', `api/search/suggest?q=${encodeURIComponent(q)}`),
};

const discover = {
  trending: () => request<EventData[]>('GET', 'api/discover/trending'),
  feed: (userId: string, params?: { city?: string; country?: string }) => {
    const qs = new URLSearchParams();
    if (params?.city) qs.set('city', params.city);
    if (params?.country) qs.set('country', params.country);
    const q = qs.toString();
    return request<{ sections: import('@shared/schema').FeedSection[] }>('GET', `api/discover/${userId}${q ? `?${q}` : ''}`);
  },
  feedback: (payload: Record<string, unknown>) => request<{ ok: boolean }>('POST', 'api/discover/feedback', payload),
  curation: (params?: { city?: string; country?: string; cultureIds?: string[] }) => {
    const qs = new URLSearchParams();
    if (params?.city) qs.set('city', params.city);
    if (params?.country) qs.set('country', params.country);
    if (params?.cultureIds?.length) qs.set('cultureIds', params.cultureIds.join(','));
    const q = qs.toString();
    return request<DiscoverCurationResponse>('GET', `api/discover/curation${q ? `?${q}` : ''}`);
  },
};

// ---------------------------------------------------------------------------
// Culture suggestions (onboarding ethnicity/language)
// ---------------------------------------------------------------------------
export interface CultureSuggestParams {
  q: string;
  type?: 'language' | 'ethnicity' | 'all';
  limit?: number;
}

export interface IndigenousOrganisation {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  nationOrPeople?: string;
  focusAreas: string[];
  featured: boolean;
  websiteUrl?: string;
  description: string;
  updatedAt?: string;
}

export interface IndigenousFestival {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  region: 'australia' | 'americas' | 'europe' | 'asia-pacific' | 'africa';
  indigenousLed?: boolean;
  monthHint?: string;
  significance: string;
  sourceName?: string;
  sourceUrl?: string;
  updatedAt?: string;
}

export interface IndigenousBusiness {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  category: 'art' | 'food' | 'tourism' | 'retail' | 'services';
  indigenousOwned: boolean;
  nationOrPeople?: string;
  description: string;
  websiteUrl?: string;
  featured: boolean;
  updatedAt?: string;
}

export interface IndigenousTraditionalLand {
  id: string;
  city: string;
  country: string;
  nationOrPeople: string;
  landName: string;
  traditionalCustodians: string;
  languageGroup?: string;
  description?: string;
  sourceUrl?: string;
  updatedAt?: string;
}

const culture = {
  suggest: (params: CultureSuggestParams) => {
    const qs = new URLSearchParams({ q: params.q });
    if (params.type) qs.set('type', params.type);
    if (params.limit != null) qs.set('limit', String(params.limit));
    return request<{ suggestions: string[]; source?: string }>('GET', `api/culture/suggest?${qs}`);
  },
  indigenousOrganisations: async (params?: { q?: string; country?: string; featured?: boolean; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.country) qs.set('country', params.country);
    if (params?.featured) qs.set('featured', 'true');
    if (params?.limit != null) qs.set('limit', String(params.limit));
    const query = qs.toString();
    const res = await request<IndigenousOrganisation[] | { organisations: IndigenousOrganisation[] }>('GET', `api/indigenous/organisations${query ? `?${query}` : ''}`);
    return Array.isArray(res) ? res : (res as { organisations: IndigenousOrganisation[] }).organisations || [];
  },
  indigenousFestivals: async (params?: {
    region?: IndigenousFestival['region'];
    indigenousOnly?: boolean;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.region) qs.set('region', params.region);
    if (params?.indigenousOnly) qs.set('indigenousOnly', 'true');
    if (params?.limit != null) qs.set('limit', String(params.limit));
    const query = qs.toString();
    const res = await request<IndigenousFestival[] | { festivals: IndigenousFestival[] }>('GET', `api/indigenous/festivals${query ? `?${query}` : ''}`);
    return Array.isArray(res) ? res : (res as { festivals: IndigenousFestival[] }).festivals || [];
  },
  indigenousBusinesses: async (params?: {
    q?: string;
    country?: string;
    featured?: boolean;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.country) qs.set('country', params.country);
    if (params?.featured) qs.set('featured', 'true');
    if (params?.limit != null) qs.set('limit', String(params.limit));
    const query = qs.toString();
    const res = await request<IndigenousBusiness[] | { businesses: IndigenousBusiness[] }>('GET', `api/indigenous/businesses${query ? `?${query}` : ''}`);
    return Array.isArray(res) ? res : (res as { businesses: IndigenousBusiness[] }).businesses || [];
  },
  indigenousTraditionalLands: async (city?: string) => {
    const qs = city ? `?city=${encodeURIComponent(city)}` : '';
    const res = await request<{ lands: IndigenousTraditionalLand[] } | IndigenousTraditionalLand[]>('GET', `api/indigenous/traditional-lands${qs}`);
    return Array.isArray(res) ? res : (res as { lands: IndigenousTraditionalLand[] }).lands || [];
  },
};

// ---------------------------------------------------------------------------
// Widgets (web dashboard cards first; native widgets can reuse contracts)
// ---------------------------------------------------------------------------
function parseEventStartIso(event: EventData): string | null {
  if (!event.date) return null;
  const datePart = event.date.trim();
  const timePart = (event.time ?? '00:00').trim();
  if (!datePart) return null;
  // Keep parsing deterministic for sorting/countdown calculations.
  return `${datePart}T${timePart.length > 0 ? timePart : '00:00'}:00`;
}

const widgets = {
  spotlight: (limit = 1) =>
    request<WidgetSpotlightItem[]>('GET', `api/indigenous/spotlights?limit=${Math.max(1, limit)}`),

  happeningNearYou: async (params: { city?: string; country?: string; limit?: number } = {}) => {
    const limit = params.limit ?? 3;
    const response = await events.list({
      city: params.city,
      country: params.country,
      page: 1,
      pageSize: Math.max(6, limit * 3),
    });
    const now = Date.now();
    const upcoming = response.events
      .map((event) => ({ event, startsAt: parseEventStartIso(event) }))
      .filter((item) => item.startsAt !== null && Date.parse(item.startsAt) >= now)
      .sort((a, b) => Date.parse(a.startsAt!) - Date.parse(b.startsAt!))
      .slice(0, limit)
      .map((item) => item.event);
    return upcoming as WidgetNearbyEventItem[];
  },

  upcomingTicket: async (userId: string): Promise<WidgetUpcomingTicketItem | null> => {
    const userTickets = await tickets.forUser(userId);
    const now = Date.now();
    const candidate = userTickets
      .filter((ticket) => ticket.status === 'confirmed' || ticket.status === 'reserved')
      .map((ticket) => {
        const startsAt = ticket.eventSnapshot?.startAt ?? null;
        return { ticket, startsAtMs: startsAt ? Date.parse(startsAt) : Number.POSITIVE_INFINITY };
      })
      .filter((item) => Number.isFinite(item.startsAtMs) && item.startsAtMs >= now)
      .sort((a, b) => a.startsAtMs - b.startsAtMs)[0];

    if (!candidate) return null;

    let event: EventData | null = null;
    try {
      event = await events.get(candidate.ticket.eventId);
    } catch {
      event = null;
    }

    const startsAt = candidate.ticket.eventSnapshot?.startAt ?? (event ? parseEventStartIso(event) : null);
    return { ticket: candidate.ticket, event, startsAt };
  },
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
const users = {
  me: () =>
    request<User>('GET', 'api/users/me'),

  get: (id: string) =>
    request<User>('GET', `api/users/${id}`),

  getByHandle: (handle: string) =>
    request<User>('GET', `api/users/handle/${encodeURIComponent(handle)}`),

  update: (id: string, data: Partial<User>) =>
    request<User>('PUT', `api/users/${id}`, data),
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
const notifications = {
  list: () =>
    request<Notification[]>(
      'GET', 'api/notifications'
    ),

  unreadCount: () =>
    request<{ count: number }>('GET', 'api/notifications/unread-count'),

  markRead: (notificationId: string) =>
    request<{ success: boolean }>('PUT', `api/notifications/${notificationId}/read`),

  markAllRead: () =>
    request<{ success: boolean }>('POST', 'api/notifications/mark-all-read'),

  approvalStatus: (payload: { approvalToken: string }) =>
    request<{ valid: boolean; expiresAt?: string; remainingMs: number }>(
      'POST', 'api/notifications/approval-status', payload,
    ),

  targeted: (payload: {
    title: string;
    message: string;
    type?: NotificationType;
    idempotencyKey?: string;
    approvalToken?: string;
    city?: string;
    country?: string;
    interestsAny?: string[];
    communitiesAny?: string[];
    languagesAny?: string[];
    categoryIdsAny?: string[];
    ethnicityContains?: string;
    dryRun?: boolean;
    limit?: number;
    metadata?: Record<string, unknown>;
  }) =>
    request<{ dryRun: boolean; targetedCount: number; audiencePreview: { userId: string; city: string; country: string }[]; idempotentReplay?: boolean; approvalToken?: string; approvalExpiresAt?: string }>(
      'POST', 'api/notifications/targeted', payload,
    ),
};

const admin = {
  stats: () =>
    request<{
      totalUsers: number;
      totalEvents: number;
      totalTicketsSold: number;
      activeCouncils: number;
      pendingHandlesCount: number;
      newUsersThisWeek: number;
      activeOrganizers: number;
      pendingModerationCount: number;
    }>('GET', 'api/admin/stats'),

  listUsers: (params?: { limit?: number; page?: number; search?: string; role?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit  != null) qs.set('limit',  String(params.limit));
    if (params?.page   != null) qs.set('page',   String(params.page));
    if (params?.search)         qs.set('search', params.search);
    if (params?.role)           qs.set('role',   params.role);
    const q = qs.toString();
    return request<{
      users: {
        id: string; username?: string; displayName?: string; email?: string;
        role?: UserRole; avatarUrl?: string; city?: string; country?: string;
        handle?: string; handleStatus?: string; isSydneyVerified?: boolean;
        membershipTier?: string; createdAt?: string; lastActiveAt?: string;
      }[];
      total: number; page: number; limit: number;
    }>('GET', `api/admin/users${q ? `?${q}` : ''}`);
  },

  setUserRole: (userId: string, role: UserRole) =>
    request<{ ok: boolean }>('PUT', `api/admin/users/${userId}/role`, { role }),

  setUserVerified: (userId: string, verified: boolean) =>
    request<{ ok: boolean }>('PUT', `api/admin/users/${userId}/verify`, { verified }),

  listReports: (params?: { status?: 'pending' | 'resolved' | 'dismissed' | 'all'; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.limit != null) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return request<{
      reports: {
        id: string; targetType: string; targetId: string; reason: string;
        details?: string; reporterUserId: string; status: string; createdAt: string;
      }[];
      total: number;
    }>('GET', `api/admin/reports${q ? `?${q}` : ''}`);
  },

  resolveReport: (id: string, status: 'resolved' | 'dismissed') =>
    request<{ ok: boolean }>('PATCH', `api/admin/reports/${id}/status`, { status }),

  pendingEvents: (limit = 50) =>
    request<{
      events: {
        id: string; title?: string; category?: string; city?: string; country?: string;
        date?: string; imageUrl?: string; organizerId?: string; createdAt?: string;
        isFree?: boolean; priceCents?: number;
      }[];
      total: number;
    }>('GET', `api/admin/events/pending?limit=${limit}`),

  financeSummary: () =>
    request<{
      activeSubscriptions: number;
      paidTickets: number;
      sampleRevenueCents: number;
      sampleSize: number;
    }>('GET', 'api/admin/finance/summary'),

  auditLogs: (params?: { limit?: number; action?: string; actorId?: string; from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit != null) qs.set('limit', String(params.limit));
    if (params?.action) qs.set('action', params.action);
    if (params?.actorId) qs.set('actorId', params.actorId);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const q = qs.toString();
    return request<{ logs: AdminAuditLog[]; limit: number; count: number }>('GET', `api/admin/audit-logs${q ? `?${q}` : ''}`);
  },
  auditLogsCsv: async (params?: { limit?: number; action?: string; actorId?: string; from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit != null) qs.set('limit', String(params.limit));
    if (params?.action) qs.set('action', params.action);
    if (params?.actorId) qs.set('actorId', params.actorId);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const q = qs.toString();
    const res = await apiRequest('GET', `api/admin/audit-logs.csv${q ? `?${q}` : ''}`);
    return res.text();
  },
  bootstrapGoogleWalletBusinessCardClass: () =>
    request<GoogleWalletClassBootstrapResponse>(
      'POST',
      'api/admin/wallet/business-card/google/bootstrap-class',
      {},
    ),
  walletBusinessCardReadiness: () =>
    request<WalletBusinessCardReadinessResponse>(
      'GET',
      'api/admin/wallet/business-card/readiness',
    ),
  pendingHandles: (params?: { limit?: number }) => {
    const qs = params?.limit != null ? `?limit=${params.limit}` : '';
    return request<{ handles: PendingHandleItem[]; count: number }>('GET', `api/admin/handles/pending${qs}`);
  },
  approveHandle: (type: 'user' | 'profile', id: string) =>
    request<{ ok: boolean }>('POST', `api/admin/handles/${type}/${id}/approve`, {}),
  rejectHandle: (type: 'user' | 'profile', id: string, reason?: string) =>
    request<{ ok: boolean }>('POST', `api/admin/handles/${type}/${id}/reject`, { reason }),

  // ── Data Import ──────────────────────────────────────────────────────────
  importJson: (payload: {
    events: Record<string, unknown>[];
    source?: 'manual' | 'json-api';
    city?: string;
    country?: string;
  }) => request<{ ok: boolean; imported: number; updated: number; skipped: number; errors: string[]; source: string }>('POST', 'api/admin/import/json', payload),

  importUrl: (payload: { url: string; city?: string; country?: string }) =>
    request<{ ok: boolean; imported: number; updated: number; skipped: number; errors: string[]; source: string }>('POST', 'api/admin/import/url', payload),

  importClear: (source: 'manual' | 'url-scrape' | 'cityofsydney' | 'json-api' | 'all' = 'all') =>
    request<{ ok: boolean; deleted: number; source: string }>('DELETE', 'api/admin/import/clear', { source, confirm: true }),

  importSources: () =>
    request<{ sources: { source: string; count: number; latest: string }[]; total: number }>('GET', 'api/admin/import/sources'),

  // ── Ingest Source Management ─────────────────────────────────────────────
  ingestSourcesList: () =>
    request<{ sources: IngestSource[] }>('GET', 'api/admin/ingest/sources'),

  ingestSourceCreate: (payload: { name: string; url: string; city?: string; country?: string; enabled?: boolean; scheduleInterval?: IngestScheduleInterval | null }) =>
    request<{ ok: boolean; source: IngestSource }>('POST', 'api/admin/ingest/sources', payload),

  ingestSourceUpdate: (id: string, payload: Partial<{ name: string; url: string; city: string; country: string; enabled: boolean; scheduleInterval: IngestScheduleInterval | null }>) =>
    request<{ ok: boolean }>('PUT', `api/admin/ingest/sources/${id}`, payload),

  ingestSourceDelete: (id: string) =>
    request<{ ok: boolean }>('DELETE', `api/admin/ingest/sources/${id}`),

  ingestSourceRun: (id: string) =>
    request<{ ok: boolean; imported: number; updated: number; skipped: number; errors: string[]; source: string; jobId?: string }>('POST', `api/admin/ingest/sources/${id}/run`),

  // ── Ingestion Job History ────────────────────────────────────────────────
  ingestJobsList: (params?: { limit?: number; sourceId?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit != null) qs.set('limit', String(params.limit));
    if (params?.sourceId) qs.set('sourceId', params.sourceId);
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString();
    return request<{ jobs: IngestionJob[] }>('GET', `api/admin/ingest/jobs${q ? `?${q}` : ''}`);
  },

  ingestJobRetry: (id: string) =>
    request<{ ok: boolean; imported: number; updated: number; skipped: number; jobId?: string }>('POST', `api/admin/ingest/jobs/${id}/retry`),

  /** List all updates (including drafts) — admin only */
  listUpdates: (params?: { category?: UpdateCategory; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.limit != null) qs.set('limit', String(params.limit));
    if (params?.offset != null) qs.set('offset', String(params.offset));
    const q = qs.toString();
    return request<{ updates: AppUpdate[]; total: number }>('GET', `api/admin/updates${q ? `?${q}` : ''}`);
  },
  getDiscoverCuration: () =>
    request<{ config: DiscoverCurationConfig; source: 'default' | 'firestore' }>('GET', 'api/admin/discover-curation'),
  saveDiscoverCuration: (config: DiscoverCurationConfig) =>
    request<{ ok: boolean; config: DiscoverCurationConfig }>('PUT', 'api/admin/discover-curation', config),
};

// ---------------------------------------------------------------------------
// Updates (public release notes / microblog)
// ---------------------------------------------------------------------------
const updates = {
  list: (params?: { category?: UpdateCategory; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.limit != null) qs.set('limit', String(params.limit));
    if (params?.offset != null) qs.set('offset', String(params.offset));
    const q = qs.toString();
    return request<{ updates: AppUpdate[]; total: number }>('GET', `api/updates${q ? `?${q}` : ''}`);
  },
  get: (id: string) =>
    request<AppUpdate>('GET', `api/updates/${id}`),
  create: (payload: Omit<AppUpdate, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>) =>
    request<AppUpdate>('POST', 'api/updates', payload),
  update: (id: string, payload: Partial<AppUpdate>) =>
    request<AppUpdate>('PUT', `api/updates/${id}`, payload),
  remove: (id: string) =>
    request<{ ok: boolean }>('DELETE', `api/updates/${id}`),
  publish: (id: string) =>
    request<AppUpdate>('POST', `api/updates/${id}/publish`, {}),
};

// ---------------------------------------------------------------------------
// Membership
// ---------------------------------------------------------------------------
const membership = {
  get: (userId: string) =>
    request<MembershipSummary>(
      'GET', `api/membership/${userId}`
    ),

  memberCount: () =>
    request<{ count: number }>('GET', 'api/membership/member-count'),

  subscribe: (data: { billingPeriod: 'monthly' | 'yearly' }) =>
    request<{ checkoutUrl: string | null; sessionId?: string; devMode?: boolean; alreadyActive?: boolean; membership?: MembershipSummary }>(
      'POST', 'api/membership/subscribe', data
    ),

  cancel: () =>
    request<{ success: boolean; membership?: MembershipSummary }>('POST', 'api/membership/cancel-subscription'),
};

const wallet = {
  get: (userId: string) =>
    request<WalletSummary>('GET', `api/wallet/${userId}`),
  transactions: (userId: string) =>
    request<WalletTransaction[]>('GET', `api/transactions/${userId}`),
  topup: (userId: string, amount: number) =>
    request<WalletSummary>('POST', `api/wallet/${userId}/topup`, { amount }),
  businessCardApple: () =>
    request<WalletPassLinkResponse>('GET', 'api/wallet/business-card/apple'),
  businessCardGoogle: () =>
    request<WalletPassLinkResponse>('GET', 'api/wallet/business-card/google'),
};

const rewards = {
  get: (userId: string) =>
    request<RewardsSummary>('GET', `api/rewards/${userId}`),
};

// ---------------------------------------------------------------------------
// Perks
// ---------------------------------------------------------------------------
const perks = {
  list: async () => {
    const res = await request<PerkData[] | { perks: PerkData[] }>('GET', 'api/perks');
    return Array.isArray(res) ? res : (res as { perks: PerkData[] }).perks || [];
  },

  get: (id: string) => request<PerkData>('GET', `api/perks/${id}`),

  redeem: (id: string) =>
    request<{ success: boolean; redemption?: Record<string, unknown> }>(
      'POST', `api/perks/${id}/redeem`
    ),
};

// ---------------------------------------------------------------------------
// Temporarily Mocked namespaces (for preventing crashes on missing routes)
// ---------------------------------------------------------------------------
const rsvps = {
  listForUser: async (userId: string) => [],
};

const likes = {
  listForUser: async (userId: string) => [],
};

const interests = {
  listForUser: async (userId: string) => [],
};

// ---------------------------------------------------------------------------
// Profiles (artist / business / venue / community directory)
// ---------------------------------------------------------------------------
const profiles = {
  list: async (params?: { entityType?: string; city?: string; country?: string; search?: string; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params?.entityType) qs.set('entityType', params.entityType);
    if (params?.city) qs.set('city', params.city);
    if (params?.country) qs.set('country', params.country);
    if (params?.search) qs.set('search', params.search);
    if (params?.pageSize != null) qs.set('pageSize', String(params.pageSize));
    const q = qs.toString();
    const res = await request<{ profiles: Profile[] }>('GET', `api/profiles${q ? `?${q}` : ''}`);
    return res.profiles ?? [];
  },

  get: (id: string) => request<Profile>('GET', `api/profiles/${id}`),

  create: (payload: Partial<Profile>) =>
    request<Profile>('POST', 'api/profiles', payload),

  update: (id: string, payload: Record<string, unknown>) =>
    request<Profile>('PUT', `api/profiles/${id}`, payload),

  remove: (id: string) =>
    request<{ success: boolean }>('DELETE', `api/profiles/${id}`),
};

// ---------------------------------------------------------------------------
// Communities
// ---------------------------------------------------------------------------
const communities = {
  list: async (params?: { city?: string; country?: string; nationalityId?: string; cultureId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.city) qs.set('city', params.city);
    if (params?.country) qs.set('country', params.country);
    if (params?.nationalityId) qs.set('nationalityId', params.nationalityId);
    if (params?.cultureId) qs.set('cultureId', params.cultureId);
    const q = qs.toString();
    const res = await request<Community[] | { communities: Community[] }>('GET', `api/communities${q ? `?${q}` : ''}`);
    if (Array.isArray(res)) return res;
    return (res as { communities: Community[] }).communities ?? [];
  },

  get: (id: string) => request<Community>('GET', `api/communities/${id}`),

  join: (id: string) =>
    request<{ success: boolean; communityId: string }>('POST', `api/communities/${id}/join`),

  leave: (id: string) =>
    request<{ success: boolean }>('DELETE', `api/communities/${id}/leave`),

  joined: () =>
    request<{ communityIds: string[] }>('GET', 'api/communities/joined'),

  create: (data: {
    name: string;
    description?: string;
    communityCategory?: string;
    city?: string;
    country?: string;
    imageUrl?: string;
    nationalityId?: string;
    cultureIds?: string[];
    languageIds?: string[];
    diasporaGroupIds?: string[];
    website?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    telegram?: string;
    joinMode?: 'open' | 'request' | 'invite';
  }) => request<{ community: Community }>('POST', 'api/communities', data).then(r => r.community),
};

// ---------------------------------------------------------------------------
// Privacy settings
// ---------------------------------------------------------------------------
const privacy = {
  get: () =>
    request<PrivacySettings>('GET', 'api/privacy/settings'),

  update: (data: Partial<PrivacySettings>) =>
    request<PrivacySettings>('PUT', 'api/privacy/settings', data),
};

// ---------------------------------------------------------------------------
// Account management
// ---------------------------------------------------------------------------
const account = {
  delete: () =>
    request<{ success: boolean }>('DELETE', 'api/account'),
};

// ---------------------------------------------------------------------------
// Directory — restaurants, shopping, movies, activities, businesses
// All follow the same list + get pattern
// ---------------------------------------------------------------------------
function directoryNamespace<T = Profile>(basePath: string) {
  return {
    list: (params?: Record<string, string>) => {
      const qs = params ? new URLSearchParams(params).toString() : '';
      return request<T[]>('GET', `${basePath}${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<T>('GET', `${basePath}/${id}`),
  };
}

const restaurants = {
  list: (params?: { city?: string; country?: string; cuisine?: string }) => {
    const qs = new URLSearchParams();
    if (params?.city) qs.set('city', params.city);
    if (params?.country) qs.set('country', params.country);
    if (params?.cuisine) qs.set('cuisine', params.cuisine);
    const q = qs.toString();
    return request<import('@shared/schema').RestaurantData[]>('GET', `api/restaurants${q ? `?${q}` : ''}`);
  },
  get: (id: string) => request<import('@shared/schema').RestaurantData>('GET', `api/restaurants/${id}`),
  create: (payload: import('@shared/schema').RestaurantInput) =>
    request<import('@shared/schema').RestaurantData>('POST', 'api/restaurants', payload),
  update: (id: string, payload: Partial<import('@shared/schema').RestaurantInput>) =>
    request<import('@shared/schema').RestaurantData>('PUT', `api/restaurants/${id}`, payload),
  remove: (id: string) => request<{ success: boolean }>('DELETE', `api/restaurants/${id}`),
  setPromoted: (id: string, isPromoted: boolean) =>
    request<import('@shared/schema').RestaurantData>('POST', `api/restaurants/${id}/promote`, { isPromoted }),
};
const shopping = {
  list: (params?: { city?: string; country?: string; category?: string }) => {
    const qs = new URLSearchParams();
    if (params?.city) qs.set('city', params.city);
    if (params?.country) qs.set('country', params.country);
    if (params?.category) qs.set('category', params.category);
    const q = qs.toString();
    return request<import('@shared/schema').ShopData[]>('GET', `api/shopping${q ? `?${q}` : ''}`);
  },
  get: (id: string) => request<import('@shared/schema').ShopData>('GET', `api/shopping/${id}`),
  create: (payload: import('@shared/schema').ShopInput) =>
    request<import('@shared/schema').ShopData>('POST', 'api/shopping', payload),
  update: (id: string, payload: Partial<import('@shared/schema').ShopInput>) =>
    request<import('@shared/schema').ShopData>('PUT', `api/shopping/${id}`, payload),
  remove: (id: string) => request<{ success: boolean }>('DELETE', `api/shopping/${id}`),
  setPromoted: (id: string, isPromoted: boolean) =>
    request<import('@shared/schema').ShopData>('POST', `api/shopping/${id}/promote`, { isPromoted }),
};
const movies = {
  list: (params?: Record<string, string>) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return request<import('@shared/schema').MovieData[]>('GET', `api/movies${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<import('@shared/schema').MovieData>('GET', `api/movies/${id}`),
  create: (payload: import('@shared/schema').MovieInput) =>
    request<import('@shared/schema').MovieData>('POST', 'api/movies', payload),
  update: (id: string, payload: Partial<import('@shared/schema').MovieInput>) =>
    request<import('@shared/schema').MovieData>('PUT', `api/movies/${id}`, payload),
  remove: (id: string) => request<{ success: boolean }>('DELETE', `api/movies/${id}`),
};
const activities = {
  list: async (params?: { city?: string; country?: string; category?: string; ownerId?: string; promoted?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.city) qs.set('city', params.city);
    if (params?.country) qs.set('country', params.country);
    if (params?.category) qs.set('category', params.category);
    if (params?.ownerId) qs.set('ownerId', params.ownerId);
    if (params?.promoted) qs.set('promoted', 'true');
    const q = qs.toString();
    const res = await request<ActivityData[] | { activities: ActivityData[] }>('GET', `api/activities${q ? `?${q}` : ''}`);
    if (Array.isArray(res)) return res;
    return (res as { activities: ActivityData[] }).activities ?? [];
  },
  get: (id: string) => request<ActivityData>('GET', `api/activities/${id}`),
  create: (payload: ActivityInput) => request<ActivityData>('POST', 'api/activities', payload),
  update: (id: string, payload: Partial<ActivityInput>) => request<ActivityData>('PUT', `api/activities/${id}`, payload),
  remove: (id: string) => request<{ success: boolean }>('DELETE', `api/activities/${id}`),
  promote: (id: string, isPromoted = true) =>
    request<ActivityData>('POST', `api/activities/${id}/promote`, { isPromoted }),
};
const businesses  = {
  ...directoryNamespace<Profile>('api/businesses'),
  /** List businesses, optionally filtering by location or sponsored-only */
  list: async (params?: { city?: string; country?: string; sponsored?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.city) qs.set('city', params.city);
    if (params?.country) qs.set('country', params.country);
    if (params?.sponsored) qs.set('sponsored', 'true');
    const q = qs.toString();
    const res = await request<{ businesses: Profile[] }>('GET', `api/businesses${q ? `?${q}` : ''}`);
    return res.businesses ?? [];
  },
};

const council = {
  list: async (params?: { q?: string; state?: string; verificationStatus?: 'verified' | 'unverified'; sortBy?: 'name' | 'state' | 'verification'; sortDir?: 'asc' | 'desc'; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.state) qs.set('state', params.state);
    if (params?.verificationStatus) qs.set('verificationStatus', params.verificationStatus);
    if (params?.sortBy) qs.set('sortBy', params.sortBy);
    if (params?.sortDir) qs.set('sortDir', params.sortDir);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    const q = qs.toString();
    const res = await request<{ councils: CouncilData[]; hasNextPage?: boolean; totalCount?: number; source?: string } | CouncilData[]>('GET', `api/council/list${q ? `?${q}` : ''}`);
    return {
      councils: Array.isArray(res) ? res : ((res as { councils: CouncilData[] }).councils ?? []),
      hasNextPage: !!(res as { hasNextPage?: boolean }).hasNextPage,
      totalCount: (res as { totalCount?: number }).totalCount ?? 0,
      source: (res as { source?: string }).source,
    };
  },
  getSelected: () => request<{ council: CouncilData | null }>('GET', 'api/council/selected'),
  select: (councilId: string) => request<{ success: boolean; councilId: string }>('POST', 'api/council/select', { councilId }),
  my: async (params?: { postcode?: number; suburb?: string; city?: string; state?: string; country?: string }) => {
    const qs = new URLSearchParams();
    if (params?.postcode) qs.set('postcode', String(params.postcode));
    if (params?.suburb) qs.set('suburb', params.suburb);
    if (params?.city) qs.set('city', params.city);
    if (params?.state) qs.set('state', params.state);
    if (params?.country) qs.set('country', params.country);
    const q = qs.toString();
    const res = await request<CouncilDashboard | null>('GET', `api/council/my${q ? `?${q}` : ''}`);
    if (!res || !(res as CouncilDashboard).council) return null;
    return {
      ...res as CouncilDashboard,
      events: Array.isArray((res as CouncilDashboard).events) ? (res as CouncilDashboard).events : [],
      preferences: Array.isArray((res as CouncilDashboard).preferences) ? (res as CouncilDashboard).preferences : [],
      alerts: Array.isArray((res as CouncilDashboard).alerts) ? (res as CouncilDashboard).alerts : [],
    };
  },
  get: (id: string) => request<CouncilData>('GET', `api/council/${id}`),
  waste: (id: string, params?: { postcode?: number; suburb?: string }) => {
    const qs = new URLSearchParams();
    if (params?.postcode) qs.set('postcode', String(params.postcode));
    if (params?.suburb) qs.set('suburb', params.suburb);
    const q = qs.toString();
    return request<CouncilWasteSchedule>('GET', `api/council/${id}/waste${q ? `?${q}` : ''}`);
  },
  alerts: (id: string, category?: string) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return request<CouncilAlert[]>('GET', `api/council/${id}/alerts${q}`);
  },
  events: (id: string) => request<EventData[]>('GET', `api/council/${id}/events`),
  facilities: (id: string) => request<CouncilFacility[]>('GET', `api/council/${id}/facilities`),
  grants: (id: string) => request<CouncilGrant[]>('GET', `api/council/${id}/grants`),
  links: (id: string) => request<CouncilLink[]>('GET', `api/council/${id}/links`),
  follow: (id: string) => request<{ success: boolean; following: boolean; institutionId: string }>('POST', `api/council/${id}/follow`),
  unfollow: (id: string) => request<{ success: boolean; following: boolean; institutionId: string }>('DELETE', `api/council/${id}/follow`),
  getPreferences: (id: string) => request<CouncilPreference[]>('GET', `api/council/${id}/preferences`),
  updatePreferences: (id: string, preferences: CouncilPreference[]) =>
    request<{ success: boolean; preferences: CouncilPreference[] }>('PUT', `api/council/${id}/preferences`, { preferences }),
  getWasteReminder: (id: string) => request<CouncilWasteReminder | null>('GET', `api/council/${id}/waste-reminder`),
  updateWasteReminder: (id: string, payload: { reminderTime: string; enabled: boolean; postcode?: number; suburb?: string }) =>
    request<{ success: boolean; reminder: CouncilWasteReminder }>('PUT', `api/council/${id}/waste-reminder`, payload),
  claim: (id: string, payload: { workEmail: string; roleTitle: string; note?: string }) =>
    request<CouncilClaim>('POST', `api/council/${id}/claim`, payload),
  myClaims: (id: string) => request<CouncilClaim[]>('GET', `api/council/${id}/claims/me`),
  updateProfileMedia: (id: string, payload: { logoUrl?: string; bannerUrl?: string }) =>
    request<CouncilData>('PATCH', `api/council/${id}/profile-media`, payload),
  admin: {
    createAlert: (id: string, payload: Pick<CouncilAlert, 'title' | 'description' | 'category' | 'severity' | 'startAt' | 'endAt' | 'status'>) =>
      request<CouncilAlert>('POST', `api/council/${id}/alerts`, payload),
    updateAlert: (id: string, alertId: string, payload: Partial<Pick<CouncilAlert, 'title' | 'description' | 'category' | 'severity' | 'startAt' | 'endAt' | 'status'>>) =>
      request<CouncilAlert>('PATCH', `api/council/${id}/alerts/${alertId}`, payload),
    deleteAlert: (id: string, alertId: string) =>
      request<{ success: boolean }>('DELETE', `api/council/${id}/alerts/${alertId}`),
    createGrant: (id: string, payload: Pick<CouncilGrant, 'title' | 'description' | 'category' | 'fundingMin' | 'fundingMax' | 'opensAt' | 'closesAt' | 'applicationUrl' | 'status'>) =>
      request<CouncilGrant>('POST', `api/council/${id}/grants`, payload),
    updateGrant: (id: string, grantId: string, payload: Partial<Pick<CouncilGrant, 'title' | 'description' | 'category' | 'fundingMin' | 'fundingMax' | 'opensAt' | 'closesAt' | 'applicationUrl' | 'status'>>) =>
      request<CouncilGrant>('PATCH', `api/council/${id}/grants/${grantId}`, payload),
    deleteGrant: (id: string, grantId: string) =>
      request<{ success: boolean }>('DELETE', `api/council/${id}/grants/${grantId}`),
    listClaims: (status?: 'pending_admin_review' | 'approved' | 'rejected') => {
      const q = status ? `?status=${encodeURIComponent(status)}` : '';
      return request<CouncilClaim[]>('GET', `api/admin/council/claims${q}`);
    },
    approveClaim: (claimId: string) =>
      request<{ success: boolean; claim: CouncilClaim }>('POST', `api/admin/council/claims/${claimId}/approve`),
    rejectClaim: (claimId: string, reason?: string) =>
      request<{ success: boolean; claim: CouncilClaim }>('POST', `api/admin/council/claims/${claimId}/reject`, reason ? { reason } : {}),
    sendClaimLetter: (councilId: string, recipientEmail?: string) =>
      request<{ success: boolean; letter: CouncilClaimLetter; message: string }>(
        'POST',
        `api/admin/council/${councilId}/send-claim-letter`,
        recipientEmail ? { recipientEmail } : {},
      ),
  },
};

// ---------------------------------------------------------------------------
// Locations — Firestore-backed hierarchy
// ---------------------------------------------------------------------------
export interface AustralianState {
  name: string;   // e.g. 'New South Wales'
  code: string;   // e.g. 'NSW'
  emoji: string;  // e.g. '🏙️'
  cities: string[];
}

export interface LocationEntry {
  country: string;
  countryCode: string;
  /** State/territory breakdown with city lists */
  states: AustralianState[];
  /** Flat list of all cities across all states (backward compat) */
  cities: string[];
}

export interface LocationsResponse {
  locations: LocationEntry[];
  acknowledgementOfCountry: string;
}

const locations = {
  /** Fetch all location data (states + cities). Cache-first on backend (30 min TTL). */
  list: () => request<LocationsResponse>('GET', 'api/locations'),

  // ── Admin mutations ──────────────────────────────────────────────────────

  /** Re-seed the AU location document with the default dataset. Admin only. */
  seed: (countryCode = 'AU') =>
    request<{ ok: boolean }>('POST', `api/locations/${countryCode}/seed`),

  /** Add a new state/territory. Admin only. */
  addState: (countryCode: string, state: Omit<AustralianState, 'cities'> & { cities?: string[] }) =>
    request<{ ok: boolean; code: string }>('POST', `api/locations/${countryCode}/states`, state),

  /** Update a state's name or emoji. Admin only. */
  updateState: (countryCode: string, stateCode: string, patch: Partial<Pick<AustralianState, 'name' | 'emoji'>>) =>
    request<{ ok: boolean }>('PATCH', `api/locations/${countryCode}/states/${stateCode}`, patch),

  /** Remove a state entirely. Admin only. */
  removeState: (countryCode: string, stateCode: string) =>
    request<{ ok: boolean }>('DELETE', `api/locations/${countryCode}/states/${stateCode}`),

  /** Add a city to a state. Admin only. */
  addCity: (countryCode: string, stateCode: string, city: string) =>
    request<{ ok: boolean; city: string }>('POST', `api/locations/${countryCode}/states/${stateCode}/cities`, { city }),

  /** Remove a city from a state. Admin only. */
  removeCity: (countryCode: string, stateCode: string, city: string) =>
    request<{ ok: boolean }>('DELETE', `api/locations/${countryCode}/states/${stateCode}/cities/${encodeURIComponent(city)}`),
};

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Feed (server-ranked)
// ---------------------------------------------------------------------------
export type FeedItem = {
  id: string;
  kind: 'event' | 'announcement' | 'welcome' | 'milestone';
  score: number;
  matchReasons: string[];
  event?: EventData;
  communityId?: string;
  communityName?: string;
  communityImageUrl?: string | null;
  body?: string;
  imageUrl?: string | null;
  authorId?: string;
  likesCount?: number;
  commentsCount?: number;
  members?: number;
  createdAt: string;
};

export type FeedComment = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  body: string;
  createdAt: string;
};

const feed = {
  list: (params: { city?: string; country?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params.city) qs.set('city', params.city);
    if (params.country) qs.set('country', params.country);
    if (params.page != null) qs.set('page', String(params.page));
    if (params.pageSize != null) qs.set('pageSize', String(params.pageSize));
    return request<{
      items: FeedItem[];
      total: number;
      page: number;
      pageSize: number;
      hasNextPage: boolean;
    }>('GET', `api/feed${qs.toString() ? `?${qs}` : ''}`);
  },

  createPost: (payload: { communityId: string; communityName: string; body: string; imageUrl?: string }) =>
    request<{ id: string; createdAt: string }>('POST', 'api/feed/posts', payload),

  deletePost: (postId: string) =>
    request<{ success: boolean }>('DELETE', `api/feed/posts/${encodeURIComponent(postId)}`),

  getComments: (postId: string) =>
    request<{ comments: FeedComment[] }>('GET', `api/feed/posts/${encodeURIComponent(postId)}/comments`),

  addComment: (postId: string, body: string) =>
    request<FeedComment>('POST', `api/feed/posts/${encodeURIComponent(postId)}/comments`, { body }),

  toggleLike: (postId: string) =>
    request<{ liked: boolean; likesCount: number }>('POST', `api/feed/posts/${encodeURIComponent(postId)}/like`),

  getLike: (postId: string) =>
    request<{ liked: boolean; likesCount: number }>('GET', `api/feed/posts/${encodeURIComponent(postId)}/like`),
};

// ---------------------------------------------------------------------------
// Featured Cities
// ---------------------------------------------------------------------------

export interface FeaturedCityData {
  id: string;
  name: string;
  slug: string;
  countryCode: string;
  countryName: string;
  countryEmoji: string;
  stateCode?: string;
  imageUrl?: string;
  featured: boolean;
  order: number;
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

const cities = {
  /** Public — returns featured cities for Discover CityRail */
  featured: () =>
    request<{ cities: FeaturedCityData[] }>('GET', 'api/cities/featured').then((r) => r.cities),

  /** Admin — all cities */
  list: () =>
    request<{ cities: FeaturedCityData[] }>('GET', 'api/cities').then((r) => r.cities),

  /** Admin — create */
  create: (input: Omit<FeaturedCityData, 'id' | 'slug' | 'createdAt' | 'updatedAt'>) =>
    request<{ city: FeaturedCityData }>('POST', 'api/cities', input).then((r) => r.city),

  /** Admin — update */
  update: (id: string, patch: Partial<Omit<FeaturedCityData, 'id' | 'slug' | 'createdAt' | 'updatedAt'>>) =>
    request<{ ok: boolean }>('PATCH', `api/cities/${id}`, patch),

  /** Admin — delete */
  delete: (id: string) =>
    request<{ ok: boolean }>('DELETE', `api/cities/${id}`),

  /** Admin — re-seed defaults */
  seed: () =>
    request<{ ok: boolean; message: string }>('POST', 'api/cities/seed'),
};

// ---------------------------------------------------------------------------
// Social (Following / Saving contacts)
// ---------------------------------------------------------------------------
const social = {
  follow: (targetType: 'user' | 'profile' | 'community', targetId: string) =>
    request<{ ok: boolean }>('POST', `api/social/follow/${targetType}/${targetId}`),

  unfollow: (targetType: 'user' | 'profile' | 'community', targetId: string) =>
    request<{ ok: boolean }>('DELETE', `api/social/follow/${targetType}/${targetId}`),

  /** Check if the current user is following the target */
  isFollowing: async (targetType: 'user' | 'profile' | 'community', targetId: string) => {
    try {
      const res = await request<{ following: boolean }>('GET', `api/social/is-following/${targetType}/${targetId}`);
      return res.following;
    } catch {
      return false;
    }
  },
};

// ---------------------------------------------------------------------------
// CulturePass ID lookup
// ---------------------------------------------------------------------------
const cpid = {
  lookup: (id: string) =>
    request<{ cpid: string; name: string; username?: string; tier?: string; org?: string; avatarUrl?: string; city?: string; country?: string; bio?: string; targetId?: string; userId?: string }>('GET', `api/cpid/lookup/${encodeURIComponent(id)}`),
};

// ---------------------------------------------------------------------------
// Uploads (multipart / FormData — not JSON)
// ---------------------------------------------------------------------------
export interface ImageUploadResponse {
  imageUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

const uploads = {
  image: async (formData: FormData): Promise<ImageUploadResponse> => {
    try {
      const res = await apiRequestMultipart('POST', 'api/uploads/image', formData);
      return parseJson<ImageUploadResponse>(res);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error) {
        const match = err.message.match(/^(\d{3}):\s*(.*)/s);
        if (match) throw new ApiError(parseInt(match[1], 10), match[2]);
      }
      throw new ApiError(0, err instanceof Error ? err.message : 'Network error');
    }
  },
};

// ---------------------------------------------------------------------------
// Named export — single surface for all API calls
// ---------------------------------------------------------------------------
export const api = {
  auth,
  uploads,
  events,
  tickets,
  stripe: stripeApi,
  search,
  discover,
  users,
  notifications,
  membership,
  wallet,
  rewards,
  perks,
  profiles,
  communities,
  privacy,
  account,
  restaurants,
  shopping,
  movies,
  activities,
  businesses,
  council,
  locations,
  cities,
  cpid,
  social,
  admin,
  culture,
  widgets,
  rsvps,
  likes,
  interests,
  updates,
  feed,
  /** Raw request — use when a specific endpoint isn't covered above */
  raw: request,
  /** Base URL — useful for constructing non-JSON endpoints (e.g. image URLs) */
  baseUrl: getApiUrl,
  ingest: {
    trigger: (url: string) => request<{ status: string; url: string }>('POST', 'api/ingest', { url }),
  },
};
