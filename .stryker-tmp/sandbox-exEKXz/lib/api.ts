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
 *
 * Architecture:
 *   • Transport: apiRequest / apiRequestMultipart from ./query-client (base URL, auth headers, JSON).
 *   • Surface: a single `api` object with domain namespaces (events, tickets, profiles, …).
 *   • New endpoints: add methods on the appropriate namespace; keep paths aligned with functions/src/routes/*.
 */
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { apiRequest, apiRequestMultipart, getApiUrl } from './query-client';
import type { EventData, User, UserRole, Ticket, PaginatedEventsResponse, Profile, Community, Notification, NotificationType, PerkData, WidgetSpotlightItem, WidgetNearbyEventItem, WidgetUpcomingTicketItem, PrivacySettings, MembershipSummary, WalletTransaction, RewardsSummary, WalletSummary, WalletPassLinkResponse, GoogleWalletClassBootstrapResponse, WalletBusinessCardReadinessResponse, ActivityData, ActivityInput, CouncilData, CouncilLgaContext, CouncilListResponse, AdminAuditLog, AppUpdate, UpdateCategory, DiscoverCurationResponse, DiscoverCurationConfig, IngestSource, IngestionJob, IngestScheduleInterval } from '@/shared/schema';
export type { MembershipSummary, Notification, CouncilData, CouncilLgaContext, RewardsSummary, WalletSummary, WalletTransaction, WidgetSpotlightItem, WidgetNearbyEventItem, WidgetUpcomingTicketItem, CouncilListResponse, ActivityData, ActivityInput, AdminAuditLog, AppUpdate, UpdateCategory, IngestSource, IngestionJob, IngestScheduleInterval } from '@/shared/schema';

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
  constructor(public readonly status: number, message: string, public readonly body?: string) {
    super(message);
    this.name = stryMutAct_9fa48("39") ? "" : (stryCov_9fa48("39"), 'ApiError');
  }
  get isNotFound() {
    if (stryMutAct_9fa48("40")) {
      {}
    } else {
      stryCov_9fa48("40");
      return stryMutAct_9fa48("43") ? this.status !== 404 : stryMutAct_9fa48("42") ? false : stryMutAct_9fa48("41") ? true : (stryCov_9fa48("41", "42", "43"), this.status === 404);
    }
  }
  get isUnauthorized() {
    if (stryMutAct_9fa48("44")) {
      {}
    } else {
      stryCov_9fa48("44");
      return stryMutAct_9fa48("47") ? this.status !== 401 : stryMutAct_9fa48("46") ? false : stryMutAct_9fa48("45") ? true : (stryCov_9fa48("45", "46", "47"), this.status === 401);
    }
  }
  get isForbidden() {
    if (stryMutAct_9fa48("48")) {
      {}
    } else {
      stryCov_9fa48("48");
      return stryMutAct_9fa48("51") ? this.status !== 403 : stryMutAct_9fa48("50") ? false : stryMutAct_9fa48("49") ? true : (stryCov_9fa48("49", "50", "51"), this.status === 403);
    }
  }
  get isRateLimited() {
    if (stryMutAct_9fa48("52")) {
      {}
    } else {
      stryCov_9fa48("52");
      return stryMutAct_9fa48("55") ? this.status !== 429 : stryMutAct_9fa48("54") ? false : stryMutAct_9fa48("53") ? true : (stryCov_9fa48("53", "54", "55"), this.status === 429);
    }
  }
  get isServerError() {
    if (stryMutAct_9fa48("56")) {
      {}
    } else {
      stryCov_9fa48("56");
      return stryMutAct_9fa48("60") ? this.status < 500 : stryMutAct_9fa48("59") ? this.status > 500 : stryMutAct_9fa48("58") ? false : stryMutAct_9fa48("57") ? true : (stryCov_9fa48("57", "58", "59", "60"), this.status >= 500);
    }
  }
  get isNetworkError() {
    if (stryMutAct_9fa48("61")) {
      {}
    } else {
      stryCov_9fa48("61");
      return stryMutAct_9fa48("64") ? this.status !== 0 : stryMutAct_9fa48("63") ? false : stryMutAct_9fa48("62") ? true : (stryCov_9fa48("62", "63", "64"), this.status === 0);
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helper — parse response and surface ApiError on failure
// ---------------------------------------------------------------------------
async function parseJson<T>(res: Response): Promise<T> {
  if (stryMutAct_9fa48("65")) {
    {}
  } else {
    stryCov_9fa48("65");
    const text = await res.text();
    try {
      if (stryMutAct_9fa48("66")) {
        {}
      } else {
        stryCov_9fa48("66");
        return JSON.parse(text) as T;
      }
    } catch {
      if (stryMutAct_9fa48("67")) {
        {}
      } else {
        stryCov_9fa48("67");
        throw new ApiError(res.status, stryMutAct_9fa48("68") ? `` : (stryCov_9fa48("68"), `Non-JSON response: ${stryMutAct_9fa48("69") ? text : (stryCov_9fa48("69"), text.slice(0, 200))}`));
      }
    }
  }
}
async function request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', route: string, data?: unknown): Promise<T> {
  if (stryMutAct_9fa48("70")) {
    {}
  } else {
    stryCov_9fa48("70");
    try {
      if (stryMutAct_9fa48("71")) {
        {}
      } else {
        stryCov_9fa48("71");
        const res = await apiRequest(method, route, data);
        return parseJson<T>(res);
      }
    } catch (err) {
      if (stryMutAct_9fa48("72")) {
        {}
      } else {
        stryCov_9fa48("72");
        if (stryMutAct_9fa48("74") ? false : stryMutAct_9fa48("73") ? true : (stryCov_9fa48("73", "74"), err instanceof ApiError)) throw err;
        if (stryMutAct_9fa48("76") ? false : stryMutAct_9fa48("75") ? true : (stryCov_9fa48("75", "76"), err instanceof Error)) {
          if (stryMutAct_9fa48("77")) {
            {}
          } else {
            stryCov_9fa48("77");
            const match = err.message.match(stryMutAct_9fa48("83") ? /^(\d{3}):\s*(.)/s : stryMutAct_9fa48("82") ? /^(\d{3}):\S*(.*)/s : stryMutAct_9fa48("81") ? /^(\d{3}):\s(.*)/s : stryMutAct_9fa48("80") ? /^(\D{3}):\s*(.*)/s : stryMutAct_9fa48("79") ? /^(\d):\s*(.*)/s : stryMutAct_9fa48("78") ? /(\d{3}):\s*(.*)/s : (stryCov_9fa48("78", "79", "80", "81", "82", "83"), /^(\d{3}):\s*(.*)/s));
            if (stryMutAct_9fa48("85") ? false : stryMutAct_9fa48("84") ? true : (stryCov_9fa48("84", "85"), match)) throw new ApiError(parseInt(match[1]), match[2]);
          }
        }
        throw new ApiError(0, err instanceof Error ? err.message : stryMutAct_9fa48("86") ? "" : (stryCov_9fa48("86"), 'Network error'));
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
const auth = stryMutAct_9fa48("87") ? {} : (stryCov_9fa48("87"), {
  me: stryMutAct_9fa48("88") ? () => undefined : (stryCov_9fa48("88"), () => request<User>(stryMutAct_9fa48("89") ? "" : (stryCov_9fa48("89"), 'GET'), stryMutAct_9fa48("90") ? "" : (stryCov_9fa48("90"), 'api/auth/me'))),
  makeMeAdmin: stryMutAct_9fa48("91") ? () => undefined : (stryCov_9fa48("91"), () => request<{
    success: boolean;
    message: string;
  }>(stryMutAct_9fa48("92") ? "" : (stryCov_9fa48("92"), 'GET'), stryMutAct_9fa48("93") ? "" : (stryCov_9fa48("93"), 'api/auth/make-me-admin'))),
  register: stryMutAct_9fa48("94") ? () => undefined : (stryCov_9fa48("94"), (payload: {
    displayName?: string;
    username?: string;
    city?: string;
    state?: string;
    postcode?: number;
    country?: string;
    role?: 'user' | 'organizer';
  }) => request<User>(stryMutAct_9fa48("95") ? "" : (stryCov_9fa48("95"), 'POST'), stryMutAct_9fa48("96") ? "" : (stryCov_9fa48("96"), 'api/auth/register'), payload))
});

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
  /** Filter by canonical publisher profile id (GET /api/events) */
  publisherProfileId?: string;
  /** Filter by linked venue profile id */
  venueProfileId?: string;
}
const events = stryMutAct_9fa48("97") ? {} : (stryCov_9fa48("97"), {
  list: (params: EventListParams = {}) => {
    if (stryMutAct_9fa48("98")) {
      {}
    } else {
      stryCov_9fa48("98");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("100") ? false : stryMutAct_9fa48("99") ? true : (stryCov_9fa48("99", "100"), params.city)) qs.set(stryMutAct_9fa48("101") ? "" : (stryCov_9fa48("101"), 'city'), params.city);
      if (stryMutAct_9fa48("103") ? false : stryMutAct_9fa48("102") ? true : (stryCov_9fa48("102", "103"), params.country)) qs.set(stryMutAct_9fa48("104") ? "" : (stryCov_9fa48("104"), 'country'), params.country);
      if (stryMutAct_9fa48("106") ? false : stryMutAct_9fa48("105") ? true : (stryCov_9fa48("105", "106"), params.category)) qs.set(stryMutAct_9fa48("107") ? "" : (stryCov_9fa48("107"), 'category'), params.category);
      if (stryMutAct_9fa48("109") ? false : stryMutAct_9fa48("108") ? true : (stryCov_9fa48("108", "109"), params.communityId)) qs.set(stryMutAct_9fa48("110") ? "" : (stryCov_9fa48("110"), 'communityId'), params.communityId);
      if (stryMutAct_9fa48("113") ? params.page == null : stryMutAct_9fa48("112") ? false : stryMutAct_9fa48("111") ? true : (stryCov_9fa48("111", "112", "113"), params.page != null)) qs.set(stryMutAct_9fa48("114") ? "" : (stryCov_9fa48("114"), 'page'), String(params.page));
      if (stryMutAct_9fa48("117") ? params.pageSize == null : stryMutAct_9fa48("116") ? false : stryMutAct_9fa48("115") ? true : (stryCov_9fa48("115", "116", "117"), params.pageSize != null)) qs.set(stryMutAct_9fa48("118") ? "" : (stryCov_9fa48("118"), 'pageSize'), String(params.pageSize));
      if (stryMutAct_9fa48("120") ? false : stryMutAct_9fa48("119") ? true : (stryCov_9fa48("119", "120"), params.search)) qs.set(stryMutAct_9fa48("121") ? "" : (stryCov_9fa48("121"), 'search'), params.search);
      if (stryMutAct_9fa48("123") ? false : stryMutAct_9fa48("122") ? true : (stryCov_9fa48("122", "123"), params.dateFrom)) qs.set(stryMutAct_9fa48("124") ? "" : (stryCov_9fa48("124"), 'dateFrom'), params.dateFrom);
      if (stryMutAct_9fa48("126") ? false : stryMutAct_9fa48("125") ? true : (stryCov_9fa48("125", "126"), params.dateTo)) qs.set(stryMutAct_9fa48("127") ? "" : (stryCov_9fa48("127"), 'dateTo'), params.dateTo);
      if (stryMutAct_9fa48("129") ? false : stryMutAct_9fa48("128") ? true : (stryCov_9fa48("128", "129"), params.eventType)) qs.set(stryMutAct_9fa48("130") ? "" : (stryCov_9fa48("130"), 'eventType'), params.eventType);
      if (stryMutAct_9fa48("133") ? params.isFeatured === undefined : stryMutAct_9fa48("132") ? false : stryMutAct_9fa48("131") ? true : (stryCov_9fa48("131", "132", "133"), params.isFeatured !== undefined)) qs.set(stryMutAct_9fa48("134") ? "" : (stryCov_9fa48("134"), 'isFeatured'), String(params.isFeatured));
      if (stryMutAct_9fa48("136") ? false : stryMutAct_9fa48("135") ? true : (stryCov_9fa48("135", "136"), params.organizerId)) qs.set(stryMutAct_9fa48("137") ? "" : (stryCov_9fa48("137"), 'organizerId'), params.organizerId);
      if (stryMutAct_9fa48("140") ? params.isFree === undefined : stryMutAct_9fa48("139") ? false : stryMutAct_9fa48("138") ? true : (stryCov_9fa48("138", "139", "140"), params.isFree !== undefined)) qs.set(stryMutAct_9fa48("141") ? "" : (stryCov_9fa48("141"), 'isFree'), String(params.isFree));
      if (stryMutAct_9fa48("143") ? false : stryMutAct_9fa48("142") ? true : (stryCov_9fa48("142", "143"), params.publisherProfileId)) qs.set(stryMutAct_9fa48("144") ? "" : (stryCov_9fa48("144"), 'publisherProfileId'), params.publisherProfileId);
      if (stryMutAct_9fa48("146") ? false : stryMutAct_9fa48("145") ? true : (stryCov_9fa48("145", "146"), params.venueProfileId)) qs.set(stryMutAct_9fa48("147") ? "" : (stryCov_9fa48("147"), 'venueProfileId'), params.venueProfileId);
      const query = qs.toString();
      return request<PaginatedEventsResponse>(stryMutAct_9fa48("148") ? "" : (stryCov_9fa48("148"), 'GET'), stryMutAct_9fa48("149") ? `` : (stryCov_9fa48("149"), `api/events${query ? stryMutAct_9fa48("150") ? `` : (stryCov_9fa48("150"), `?${query}`) : stryMutAct_9fa48("151") ? "Stryker was here!" : (stryCov_9fa48("151"), '')}`));
    }
  },
  get: stryMutAct_9fa48("152") ? () => undefined : (stryCov_9fa48("152"), (id: string) => request<EventData>(stryMutAct_9fa48("153") ? "" : (stryCov_9fa48("153"), 'GET'), stryMutAct_9fa48("154") ? `` : (stryCov_9fa48("154"), `api/events/${id}`))),
  create: stryMutAct_9fa48("155") ? () => undefined : (stryCov_9fa48("155"), (data: Partial<EventData>) => request<EventData>(stryMutAct_9fa48("156") ? "" : (stryCov_9fa48("156"), 'POST'), stryMutAct_9fa48("157") ? "" : (stryCov_9fa48("157"), 'api/events'), data)),
  update: stryMutAct_9fa48("158") ? () => undefined : (stryCov_9fa48("158"), (id: string, data: Partial<EventData>) => request<EventData>(stryMutAct_9fa48("159") ? "" : (stryCov_9fa48("159"), 'PUT'), stryMutAct_9fa48("160") ? `` : (stryCov_9fa48("160"), `api/events/${id}`), data)),
  publish: stryMutAct_9fa48("161") ? () => undefined : (stryCov_9fa48("161"), (id: string) => request<{
    success: boolean;
  }>(stryMutAct_9fa48("162") ? "" : (stryCov_9fa48("162"), 'POST'), stryMutAct_9fa48("163") ? `` : (stryCov_9fa48("163"), `api/events/${id}/publish`))),
  nearby: (params: {
    lat: number;
    lng: number;
    radius?: number;
    pageSize?: number;
  }) => {
    if (stryMutAct_9fa48("164")) {
      {}
    } else {
      stryCov_9fa48("164");
      const qs = new URLSearchParams(stryMutAct_9fa48("165") ? {} : (stryCov_9fa48("165"), {
        lat: String(params.lat),
        lng: String(params.lng)
      }));
      if (stryMutAct_9fa48("168") ? params.radius == null : stryMutAct_9fa48("167") ? false : stryMutAct_9fa48("166") ? true : (stryCov_9fa48("166", "167", "168"), params.radius != null)) qs.set(stryMutAct_9fa48("169") ? "" : (stryCov_9fa48("169"), 'radius'), String(params.radius));
      if (stryMutAct_9fa48("172") ? params.pageSize == null : stryMutAct_9fa48("171") ? false : stryMutAct_9fa48("170") ? true : (stryCov_9fa48("170", "171", "172"), params.pageSize != null)) qs.set(stryMutAct_9fa48("173") ? "" : (stryCov_9fa48("173"), 'pageSize'), String(params.pageSize));
      return request<{
        events: EventData[];
        total: number;
        radiusKm: number;
      }>(stryMutAct_9fa48("174") ? "" : (stryCov_9fa48("174"), 'GET'), stryMutAct_9fa48("175") ? `` : (stryCov_9fa48("175"), `api/events/nearby?${qs}`));
    }
  },
  /** RSVP to a free/open event */
  rsvp: stryMutAct_9fa48("176") ? () => undefined : (stryCov_9fa48("176"), (eventId: string, status: 'going' | 'maybe' | 'not_going') => request<{
    status: string;
  }>(stryMutAct_9fa48("177") ? "" : (stryCov_9fa48("177"), 'POST'), stryMutAct_9fa48("178") ? `` : (stryCov_9fa48("178"), `api/events/${eventId}/rsvp`), stryMutAct_9fa48("179") ? {} : (stryCov_9fa48("179"), {
    status
  }))),
  /** Get the authenticated user's RSVP status for an event */
  myRsvp: stryMutAct_9fa48("180") ? () => undefined : (stryCov_9fa48("180"), (eventId: string) => request<{
    status: 'going' | 'maybe' | 'not_going' | null;
  }>(stryMutAct_9fa48("181") ? "" : (stryCov_9fa48("181"), 'GET'), stryMutAct_9fa48("182") ? `` : (stryCov_9fa48("182"), `api/events/${eventId}/rsvp/me`))),
  /** Track a click on an external ticket link (no auth required) */
  trackTicketClick: stryMutAct_9fa48("183") ? () => undefined : (stryCov_9fa48("183"), (eventId: string) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("184") ? "" : (stryCov_9fa48("184"), 'POST'), stryMutAct_9fa48("185") ? `` : (stryCov_9fa48("185"), `api/events/${eventId}/ticket-click`))),
  favorite: stryMutAct_9fa48("186") ? () => undefined : (stryCov_9fa48("186"), (eventId: string, favorite: boolean) => request<{
    success?: boolean;
    favorite?: boolean;
  }>(stryMutAct_9fa48("187") ? "" : (stryCov_9fa48("187"), 'POST'), stryMutAct_9fa48("188") ? `` : (stryCov_9fa48("188"), `api/events/${eventId}/favorite`), stryMutAct_9fa48("189") ? {} : (stryCov_9fa48("189"), {
    favorite
  }))),
  remove: stryMutAct_9fa48("190") ? () => undefined : (stryCov_9fa48("190"), (id: string) => request<{
    success: boolean;
  }>(stryMutAct_9fa48("191") ? "" : (stryCov_9fa48("191"), 'DELETE'), stryMutAct_9fa48("192") ? `` : (stryCov_9fa48("192"), `api/events/${id}`)))
});

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------
const tickets = stryMutAct_9fa48("193") ? {} : (stryCov_9fa48("193"), {
  forUser: stryMutAct_9fa48("194") ? () => undefined : (stryCov_9fa48("194"), (userId: string) => request<Ticket[]>(stryMutAct_9fa48("195") ? "" : (stryCov_9fa48("195"), 'GET'), stryMutAct_9fa48("196") ? `` : (stryCov_9fa48("196"), `api/tickets/${userId}`))),
  get: stryMutAct_9fa48("197") ? () => undefined : (stryCov_9fa48("197"), (id: string) => request<Ticket>(stryMutAct_9fa48("198") ? "" : (stryCov_9fa48("198"), 'GET'), stryMutAct_9fa48("199") ? `` : (stryCov_9fa48("199"), `api/ticket/${id}`))),
  purchase: stryMutAct_9fa48("200") ? () => undefined : (stryCov_9fa48("200"), (data: {
    eventId: string;
    tierId?: string;
    quantity?: number;
  }) => request<Ticket>(stryMutAct_9fa48("201") ? "" : (stryCov_9fa48("201"), 'POST'), stryMutAct_9fa48("202") ? "" : (stryCov_9fa48("202"), 'api/tickets'), data)),
  cancel: stryMutAct_9fa48("203") ? () => undefined : (stryCov_9fa48("203"), (id: string) => request<{
    success: boolean;
  }>(stryMutAct_9fa48("204") ? "" : (stryCov_9fa48("204"), 'PUT'), stryMutAct_9fa48("205") ? `` : (stryCov_9fa48("205"), `api/tickets/${id}/cancel`))),
  scan: stryMutAct_9fa48("206") ? () => undefined : (stryCov_9fa48("206"), (data: {
    ticketCode: string;
    scannedBy?: string;
  }) => request<{
    valid: boolean;
    message: string;
    outcome?: string;
    ticket?: Ticket;
  }>(stryMutAct_9fa48("207") ? "" : (stryCov_9fa48("207"), 'POST'), stryMutAct_9fa48("208") ? "" : (stryCov_9fa48("208"), 'api/tickets/scan'), data)),
  walletApple: stryMutAct_9fa48("209") ? () => undefined : (stryCov_9fa48("209"), (ticketId: string) => request<WalletPassLinkResponse>(stryMutAct_9fa48("210") ? "" : (stryCov_9fa48("210"), 'GET'), stryMutAct_9fa48("211") ? `` : (stryCov_9fa48("211"), `api/tickets/${ticketId}/wallet/apple`))),
  walletGoogle: stryMutAct_9fa48("212") ? () => undefined : (stryCov_9fa48("212"), (ticketId: string) => request<WalletPassLinkResponse>(stryMutAct_9fa48("213") ? "" : (stryCov_9fa48("213"), 'GET'), stryMutAct_9fa48("214") ? `` : (stryCov_9fa48("214"), `api/tickets/${ticketId}/wallet/google`)))
});
const stripeApi = stryMutAct_9fa48("215") ? {} : (stryCov_9fa48("215"), {
  createCheckoutSession: stryMutAct_9fa48("216") ? () => undefined : (stryCov_9fa48("216"), (ticketData: {
    eventId: string;
    eventTitle?: string;
    eventDate?: string;
    tierName?: string;
    quantity?: number;
    totalPriceCents?: number;
    currency?: string;
  }) => request<{
    checkoutUrl: string;
    ticketId: string;
    sessionId: string;
  }>(stryMutAct_9fa48("217") ? "" : (stryCov_9fa48("217"), 'POST'), stryMutAct_9fa48("218") ? "" : (stryCov_9fa48("218"), 'api/stripe/create-checkout-session'), stryMutAct_9fa48("219") ? {} : (stryCov_9fa48("219"), {
    ticketData
  }))),
  refund: stryMutAct_9fa48("220") ? () => undefined : (stryCov_9fa48("220"), (ticketId: string) => request<Record<string, unknown>>(stryMutAct_9fa48("221") ? "" : (stryCov_9fa48("221"), 'POST'), stryMutAct_9fa48("222") ? "" : (stryCov_9fa48("222"), 'api/stripe/refund'), stryMutAct_9fa48("223") ? {} : (stryCov_9fa48("223"), {
    ticketId
  }))),
  connectCreateAccount: stryMutAct_9fa48("224") ? () => undefined : (stryCov_9fa48("224"), (profileId: string) => request<{
    accountId: string;
    alreadyExists?: boolean;
    onboardingStatus?: string;
    payoutsEnabled?: boolean;
  }>(stryMutAct_9fa48("225") ? "" : (stryCov_9fa48("225"), 'POST'), stryMutAct_9fa48("226") ? "" : (stryCov_9fa48("226"), 'api/stripe/connect/create-account'), stryMutAct_9fa48("227") ? {} : (stryCov_9fa48("227"), {
    profileId
  }))),
  connectAccountLink: stryMutAct_9fa48("228") ? () => undefined : (stryCov_9fa48("228"), (profileId: string, refreshUrl?: string, returnUrl?: string) => request<{
    url: string;
  }>(stryMutAct_9fa48("229") ? "" : (stryCov_9fa48("229"), 'POST'), stryMutAct_9fa48("230") ? "" : (stryCov_9fa48("230"), 'api/stripe/connect/account-link'), stryMutAct_9fa48("231") ? {} : (stryCov_9fa48("231"), {
    profileId,
    ...(refreshUrl ? stryMutAct_9fa48("232") ? {} : (stryCov_9fa48("232"), {
      refreshUrl
    }) : {}),
    ...(returnUrl ? stryMutAct_9fa48("233") ? {} : (stryCov_9fa48("233"), {
      returnUrl
    }) : {})
  }))),
  connectStatus: stryMutAct_9fa48("234") ? () => undefined : (stryCov_9fa48("234"), (profileId: string) => request<{
    accountId: string | null;
    stripeConnectOnboardingStatus: 'not_started' | 'pending' | 'restricted' | 'complete';
    payoutsEnabled: boolean;
    chargesEnabled?: boolean;
    detailsSubmitted?: boolean;
  }>(stryMutAct_9fa48("235") ? "" : (stryCov_9fa48("235"), 'GET'), stryMutAct_9fa48("236") ? `` : (stryCov_9fa48("236"), `api/stripe/connect/status?profileId=${encodeURIComponent(profileId)}`)))
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
export interface SearchParams {
  q: string;
  type?: string;
  city?: string;
  country?: string;
  category?: string;
  cultureTag?: string;
  entryType?: string;
  eventType?: string;
  publisherProfileId?: string;
  venueProfileId?: string;
  page?: number;
  pageSize?: number;
}
const search = stryMutAct_9fa48("237") ? {} : (stryCov_9fa48("237"), {
  query: (params: SearchParams) => {
    if (stryMutAct_9fa48("238")) {
      {}
    } else {
      stryCov_9fa48("238");
      const qs = new URLSearchParams(stryMutAct_9fa48("239") ? {} : (stryCov_9fa48("239"), {
        q: params.q
      }));
      if (stryMutAct_9fa48("241") ? false : stryMutAct_9fa48("240") ? true : (stryCov_9fa48("240", "241"), params.type)) qs.set(stryMutAct_9fa48("242") ? "" : (stryCov_9fa48("242"), 'type'), params.type);
      if (stryMutAct_9fa48("244") ? false : stryMutAct_9fa48("243") ? true : (stryCov_9fa48("243", "244"), params.city)) qs.set(stryMutAct_9fa48("245") ? "" : (stryCov_9fa48("245"), 'city'), params.city);
      if (stryMutAct_9fa48("247") ? false : stryMutAct_9fa48("246") ? true : (stryCov_9fa48("246", "247"), params.country)) qs.set(stryMutAct_9fa48("248") ? "" : (stryCov_9fa48("248"), 'country'), params.country);
      if (stryMutAct_9fa48("250") ? false : stryMutAct_9fa48("249") ? true : (stryCov_9fa48("249", "250"), params.category)) qs.set(stryMutAct_9fa48("251") ? "" : (stryCov_9fa48("251"), 'category'), params.category);
      if (stryMutAct_9fa48("253") ? false : stryMutAct_9fa48("252") ? true : (stryCov_9fa48("252", "253"), params.cultureTag)) qs.set(stryMutAct_9fa48("254") ? "" : (stryCov_9fa48("254"), 'cultureTag'), params.cultureTag);
      if (stryMutAct_9fa48("256") ? false : stryMutAct_9fa48("255") ? true : (stryCov_9fa48("255", "256"), params.entryType)) qs.set(stryMutAct_9fa48("257") ? "" : (stryCov_9fa48("257"), 'entryType'), params.entryType);
      if (stryMutAct_9fa48("259") ? false : stryMutAct_9fa48("258") ? true : (stryCov_9fa48("258", "259"), params.eventType)) qs.set(stryMutAct_9fa48("260") ? "" : (stryCov_9fa48("260"), 'eventType'), params.eventType);
      if (stryMutAct_9fa48("262") ? false : stryMutAct_9fa48("261") ? true : (stryCov_9fa48("261", "262"), params.publisherProfileId)) qs.set(stryMutAct_9fa48("263") ? "" : (stryCov_9fa48("263"), 'publisherProfileId'), params.publisherProfileId);
      if (stryMutAct_9fa48("265") ? false : stryMutAct_9fa48("264") ? true : (stryCov_9fa48("264", "265"), params.venueProfileId)) qs.set(stryMutAct_9fa48("266") ? "" : (stryCov_9fa48("266"), 'venueProfileId'), params.venueProfileId);
      if (stryMutAct_9fa48("269") ? params.page == null : stryMutAct_9fa48("268") ? false : stryMutAct_9fa48("267") ? true : (stryCov_9fa48("267", "268", "269"), params.page != null)) qs.set(stryMutAct_9fa48("270") ? "" : (stryCov_9fa48("270"), 'page'), String(params.page));
      if (stryMutAct_9fa48("273") ? params.pageSize == null : stryMutAct_9fa48("272") ? false : stryMutAct_9fa48("271") ? true : (stryCov_9fa48("271", "272", "273"), params.pageSize != null)) qs.set(stryMutAct_9fa48("274") ? "" : (stryCov_9fa48("274"), 'pageSize'), String(params.pageSize));
      return request<{
        events: EventData[];
        profiles: Profile[];
        movies: import('@shared/schema').MovieData[];
        users: User[];
      }>(stryMutAct_9fa48("275") ? "" : (stryCov_9fa48("275"), 'GET'), stryMutAct_9fa48("276") ? `` : (stryCov_9fa48("276"), `api/search?${qs}`));
    }
  },
  suggest: stryMutAct_9fa48("277") ? () => undefined : (stryCov_9fa48("277"), (q: string) => request<{
    suggestions: string[];
  }>(stryMutAct_9fa48("278") ? "" : (stryCov_9fa48("278"), 'GET'), stryMutAct_9fa48("279") ? `` : (stryCov_9fa48("279"), `api/search/suggest?q=${encodeURIComponent(q)}`)))
});
const discover = stryMutAct_9fa48("280") ? {} : (stryCov_9fa48("280"), {
  trending: stryMutAct_9fa48("281") ? () => undefined : (stryCov_9fa48("281"), () => request<EventData[]>(stryMutAct_9fa48("282") ? "" : (stryCov_9fa48("282"), 'GET'), stryMutAct_9fa48("283") ? "" : (stryCov_9fa48("283"), 'api/discover/trending'))),
  feed: (userId: string, params?: {
    city?: string;
    country?: string;
  }) => {
    if (stryMutAct_9fa48("284")) {
      {}
    } else {
      stryCov_9fa48("284");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("287") ? params.city : stryMutAct_9fa48("286") ? false : stryMutAct_9fa48("285") ? true : (stryCov_9fa48("285", "286", "287"), params?.city)) qs.set(stryMutAct_9fa48("288") ? "" : (stryCov_9fa48("288"), 'city'), params.city);
      if (stryMutAct_9fa48("291") ? params.country : stryMutAct_9fa48("290") ? false : stryMutAct_9fa48("289") ? true : (stryCov_9fa48("289", "290", "291"), params?.country)) qs.set(stryMutAct_9fa48("292") ? "" : (stryCov_9fa48("292"), 'country'), params.country);
      const q = qs.toString();
      return request<{
        sections: import('@shared/schema').FeedSection[];
      }>(stryMutAct_9fa48("293") ? "" : (stryCov_9fa48("293"), 'GET'), stryMutAct_9fa48("294") ? `` : (stryCov_9fa48("294"), `api/discover/${userId}${q ? stryMutAct_9fa48("295") ? `` : (stryCov_9fa48("295"), `?${q}`) : stryMutAct_9fa48("296") ? "Stryker was here!" : (stryCov_9fa48("296"), '')}`));
    }
  },
  feedback: stryMutAct_9fa48("297") ? () => undefined : (stryCov_9fa48("297"), (payload: Record<string, unknown>) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("298") ? "" : (stryCov_9fa48("298"), 'POST'), stryMutAct_9fa48("299") ? "" : (stryCov_9fa48("299"), 'api/discover/feedback'), payload)),
  curation: (params?: {
    city?: string;
    country?: string;
    cultureIds?: string[];
  }) => {
    if (stryMutAct_9fa48("300")) {
      {}
    } else {
      stryCov_9fa48("300");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("303") ? params.city : stryMutAct_9fa48("302") ? false : stryMutAct_9fa48("301") ? true : (stryCov_9fa48("301", "302", "303"), params?.city)) qs.set(stryMutAct_9fa48("304") ? "" : (stryCov_9fa48("304"), 'city'), params.city);
      if (stryMutAct_9fa48("307") ? params.country : stryMutAct_9fa48("306") ? false : stryMutAct_9fa48("305") ? true : (stryCov_9fa48("305", "306", "307"), params?.country)) qs.set(stryMutAct_9fa48("308") ? "" : (stryCov_9fa48("308"), 'country'), params.country);
      if (stryMutAct_9fa48("312") ? params.cultureIds?.length : stryMutAct_9fa48("311") ? params?.cultureIds.length : stryMutAct_9fa48("310") ? false : stryMutAct_9fa48("309") ? true : (stryCov_9fa48("309", "310", "311", "312"), params?.cultureIds?.length)) qs.set(stryMutAct_9fa48("313") ? "" : (stryCov_9fa48("313"), 'cultureIds'), params.cultureIds.join(stryMutAct_9fa48("314") ? "" : (stryCov_9fa48("314"), ',')));
      const q = qs.toString();
      return request<DiscoverCurationResponse>(stryMutAct_9fa48("315") ? "" : (stryCov_9fa48("315"), 'GET'), stryMutAct_9fa48("316") ? `` : (stryCov_9fa48("316"), `api/discover/curation${q ? stryMutAct_9fa48("317") ? `` : (stryCov_9fa48("317"), `?${q}`) : stryMutAct_9fa48("318") ? "Stryker was here!" : (stryCov_9fa48("318"), '')}`));
    }
  }
});

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
const culture = stryMutAct_9fa48("319") ? {} : (stryCov_9fa48("319"), {
  suggest: (params: CultureSuggestParams) => {
    if (stryMutAct_9fa48("320")) {
      {}
    } else {
      stryCov_9fa48("320");
      const qs = new URLSearchParams(stryMutAct_9fa48("321") ? {} : (stryCov_9fa48("321"), {
        q: params.q
      }));
      if (stryMutAct_9fa48("323") ? false : stryMutAct_9fa48("322") ? true : (stryCov_9fa48("322", "323"), params.type)) qs.set(stryMutAct_9fa48("324") ? "" : (stryCov_9fa48("324"), 'type'), params.type);
      if (stryMutAct_9fa48("327") ? params.limit == null : stryMutAct_9fa48("326") ? false : stryMutAct_9fa48("325") ? true : (stryCov_9fa48("325", "326", "327"), params.limit != null)) qs.set(stryMutAct_9fa48("328") ? "" : (stryCov_9fa48("328"), 'limit'), String(params.limit));
      return request<{
        suggestions: string[];
        source?: string;
      }>(stryMutAct_9fa48("329") ? "" : (stryCov_9fa48("329"), 'GET'), stryMutAct_9fa48("330") ? `` : (stryCov_9fa48("330"), `api/culture/suggest?${qs}`));
    }
  },
  indigenousOrganisations: async (params?: {
    q?: string;
    country?: string;
    featured?: boolean;
    limit?: number;
  }) => {
    if (stryMutAct_9fa48("331")) {
      {}
    } else {
      stryCov_9fa48("331");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("334") ? params.q : stryMutAct_9fa48("333") ? false : stryMutAct_9fa48("332") ? true : (stryCov_9fa48("332", "333", "334"), params?.q)) qs.set(stryMutAct_9fa48("335") ? "" : (stryCov_9fa48("335"), 'q'), params.q);
      if (stryMutAct_9fa48("338") ? params.country : stryMutAct_9fa48("337") ? false : stryMutAct_9fa48("336") ? true : (stryCov_9fa48("336", "337", "338"), params?.country)) qs.set(stryMutAct_9fa48("339") ? "" : (stryCov_9fa48("339"), 'country'), params.country);
      if (stryMutAct_9fa48("342") ? params.featured : stryMutAct_9fa48("341") ? false : stryMutAct_9fa48("340") ? true : (stryCov_9fa48("340", "341", "342"), params?.featured)) qs.set(stryMutAct_9fa48("343") ? "" : (stryCov_9fa48("343"), 'featured'), stryMutAct_9fa48("344") ? "" : (stryCov_9fa48("344"), 'true'));
      if (stryMutAct_9fa48("347") ? params?.limit == null : stryMutAct_9fa48("346") ? false : stryMutAct_9fa48("345") ? true : (stryCov_9fa48("345", "346", "347"), (stryMutAct_9fa48("348") ? params.limit : (stryCov_9fa48("348"), params?.limit)) != null)) qs.set(stryMutAct_9fa48("349") ? "" : (stryCov_9fa48("349"), 'limit'), String(params.limit));
      const query = qs.toString();
      const res = await request<IndigenousOrganisation[] | {
        organisations: IndigenousOrganisation[];
      }>(stryMutAct_9fa48("350") ? "" : (stryCov_9fa48("350"), 'GET'), stryMutAct_9fa48("351") ? `` : (stryCov_9fa48("351"), `api/indigenous/organisations${query ? stryMutAct_9fa48("352") ? `` : (stryCov_9fa48("352"), `?${query}`) : stryMutAct_9fa48("353") ? "Stryker was here!" : (stryCov_9fa48("353"), '')}`));
      return Array.isArray(res) ? res : stryMutAct_9fa48("356") ? (res as {
        organisations: IndigenousOrganisation[];
      }).organisations && [] : stryMutAct_9fa48("355") ? false : stryMutAct_9fa48("354") ? true : (stryCov_9fa48("354", "355", "356"), (res as {
        organisations: IndigenousOrganisation[];
      }).organisations || (stryMutAct_9fa48("357") ? ["Stryker was here"] : (stryCov_9fa48("357"), [])));
    }
  },
  indigenousFestivals: async (params?: {
    region?: IndigenousFestival['region'];
    indigenousOnly?: boolean;
    limit?: number;
  }) => {
    if (stryMutAct_9fa48("358")) {
      {}
    } else {
      stryCov_9fa48("358");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("361") ? params.region : stryMutAct_9fa48("360") ? false : stryMutAct_9fa48("359") ? true : (stryCov_9fa48("359", "360", "361"), params?.region)) qs.set(stryMutAct_9fa48("362") ? "" : (stryCov_9fa48("362"), 'region'), params.region);
      if (stryMutAct_9fa48("365") ? params.indigenousOnly : stryMutAct_9fa48("364") ? false : stryMutAct_9fa48("363") ? true : (stryCov_9fa48("363", "364", "365"), params?.indigenousOnly)) qs.set(stryMutAct_9fa48("366") ? "" : (stryCov_9fa48("366"), 'indigenousOnly'), stryMutAct_9fa48("367") ? "" : (stryCov_9fa48("367"), 'true'));
      if (stryMutAct_9fa48("370") ? params?.limit == null : stryMutAct_9fa48("369") ? false : stryMutAct_9fa48("368") ? true : (stryCov_9fa48("368", "369", "370"), (stryMutAct_9fa48("371") ? params.limit : (stryCov_9fa48("371"), params?.limit)) != null)) qs.set(stryMutAct_9fa48("372") ? "" : (stryCov_9fa48("372"), 'limit'), String(params.limit));
      const query = qs.toString();
      const res = await request<IndigenousFestival[] | {
        festivals: IndigenousFestival[];
      }>(stryMutAct_9fa48("373") ? "" : (stryCov_9fa48("373"), 'GET'), stryMutAct_9fa48("374") ? `` : (stryCov_9fa48("374"), `api/indigenous/festivals${query ? stryMutAct_9fa48("375") ? `` : (stryCov_9fa48("375"), `?${query}`) : stryMutAct_9fa48("376") ? "Stryker was here!" : (stryCov_9fa48("376"), '')}`));
      return Array.isArray(res) ? res : stryMutAct_9fa48("379") ? (res as {
        festivals: IndigenousFestival[];
      }).festivals && [] : stryMutAct_9fa48("378") ? false : stryMutAct_9fa48("377") ? true : (stryCov_9fa48("377", "378", "379"), (res as {
        festivals: IndigenousFestival[];
      }).festivals || (stryMutAct_9fa48("380") ? ["Stryker was here"] : (stryCov_9fa48("380"), [])));
    }
  },
  indigenousBusinesses: async (params?: {
    q?: string;
    country?: string;
    featured?: boolean;
    limit?: number;
  }) => {
    if (stryMutAct_9fa48("381")) {
      {}
    } else {
      stryCov_9fa48("381");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("384") ? params.q : stryMutAct_9fa48("383") ? false : stryMutAct_9fa48("382") ? true : (stryCov_9fa48("382", "383", "384"), params?.q)) qs.set(stryMutAct_9fa48("385") ? "" : (stryCov_9fa48("385"), 'q'), params.q);
      if (stryMutAct_9fa48("388") ? params.country : stryMutAct_9fa48("387") ? false : stryMutAct_9fa48("386") ? true : (stryCov_9fa48("386", "387", "388"), params?.country)) qs.set(stryMutAct_9fa48("389") ? "" : (stryCov_9fa48("389"), 'country'), params.country);
      if (stryMutAct_9fa48("392") ? params.featured : stryMutAct_9fa48("391") ? false : stryMutAct_9fa48("390") ? true : (stryCov_9fa48("390", "391", "392"), params?.featured)) qs.set(stryMutAct_9fa48("393") ? "" : (stryCov_9fa48("393"), 'featured'), stryMutAct_9fa48("394") ? "" : (stryCov_9fa48("394"), 'true'));
      if (stryMutAct_9fa48("397") ? params?.limit == null : stryMutAct_9fa48("396") ? false : stryMutAct_9fa48("395") ? true : (stryCov_9fa48("395", "396", "397"), (stryMutAct_9fa48("398") ? params.limit : (stryCov_9fa48("398"), params?.limit)) != null)) qs.set(stryMutAct_9fa48("399") ? "" : (stryCov_9fa48("399"), 'limit'), String(params.limit));
      const query = qs.toString();
      const res = await request<IndigenousBusiness[] | {
        businesses: IndigenousBusiness[];
      }>(stryMutAct_9fa48("400") ? "" : (stryCov_9fa48("400"), 'GET'), stryMutAct_9fa48("401") ? `` : (stryCov_9fa48("401"), `api/indigenous/businesses${query ? stryMutAct_9fa48("402") ? `` : (stryCov_9fa48("402"), `?${query}`) : stryMutAct_9fa48("403") ? "Stryker was here!" : (stryCov_9fa48("403"), '')}`));
      return Array.isArray(res) ? res : stryMutAct_9fa48("406") ? (res as {
        businesses: IndigenousBusiness[];
      }).businesses && [] : stryMutAct_9fa48("405") ? false : stryMutAct_9fa48("404") ? true : (stryCov_9fa48("404", "405", "406"), (res as {
        businesses: IndigenousBusiness[];
      }).businesses || (stryMutAct_9fa48("407") ? ["Stryker was here"] : (stryCov_9fa48("407"), [])));
    }
  },
  indigenousTraditionalLands: async (city?: string) => {
    if (stryMutAct_9fa48("408")) {
      {}
    } else {
      stryCov_9fa48("408");
      const qs = city ? stryMutAct_9fa48("409") ? `` : (stryCov_9fa48("409"), `?city=${encodeURIComponent(city)}`) : stryMutAct_9fa48("410") ? "Stryker was here!" : (stryCov_9fa48("410"), '');
      const res = await request<{
        lands: IndigenousTraditionalLand[];
      } | IndigenousTraditionalLand[]>(stryMutAct_9fa48("411") ? "" : (stryCov_9fa48("411"), 'GET'), stryMutAct_9fa48("412") ? `` : (stryCov_9fa48("412"), `api/indigenous/traditional-lands${qs}`));
      return Array.isArray(res) ? res : stryMutAct_9fa48("415") ? (res as {
        lands: IndigenousTraditionalLand[];
      }).lands && [] : stryMutAct_9fa48("414") ? false : stryMutAct_9fa48("413") ? true : (stryCov_9fa48("413", "414", "415"), (res as {
        lands: IndigenousTraditionalLand[];
      }).lands || (stryMutAct_9fa48("416") ? ["Stryker was here"] : (stryCov_9fa48("416"), [])));
    }
  }
});

// ---------------------------------------------------------------------------
// Widgets (web dashboard cards first; native widgets can reuse contracts)
// ---------------------------------------------------------------------------
function parseEventStartIso(event: EventData): string | null {
  if (stryMutAct_9fa48("417")) {
    {}
  } else {
    stryCov_9fa48("417");
    if (stryMutAct_9fa48("420") ? false : stryMutAct_9fa48("419") ? true : stryMutAct_9fa48("418") ? event.date : (stryCov_9fa48("418", "419", "420"), !event.date)) return null;
    const datePart = stryMutAct_9fa48("421") ? event.date : (stryCov_9fa48("421"), event.date.trim());
    const timePart = stryMutAct_9fa48("422") ? event.time ?? '00:00' : (stryCov_9fa48("422"), (stryMutAct_9fa48("423") ? event.time && '00:00' : (stryCov_9fa48("423"), event.time ?? (stryMutAct_9fa48("424") ? "" : (stryCov_9fa48("424"), '00:00')))).trim());
    if (stryMutAct_9fa48("427") ? false : stryMutAct_9fa48("426") ? true : stryMutAct_9fa48("425") ? datePart : (stryCov_9fa48("425", "426", "427"), !datePart)) return null;
    // Keep parsing deterministic for sorting/countdown calculations.
    return stryMutAct_9fa48("428") ? `` : (stryCov_9fa48("428"), `${datePart}T${(stryMutAct_9fa48("432") ? timePart.length <= 0 : stryMutAct_9fa48("431") ? timePart.length >= 0 : stryMutAct_9fa48("430") ? false : stryMutAct_9fa48("429") ? true : (stryCov_9fa48("429", "430", "431", "432"), timePart.length > 0)) ? timePart : stryMutAct_9fa48("433") ? "" : (stryCov_9fa48("433"), '00:00')}:00`);
  }
}
const widgets = stryMutAct_9fa48("434") ? {} : (stryCov_9fa48("434"), {
  spotlight: stryMutAct_9fa48("435") ? () => undefined : (stryCov_9fa48("435"), (limit = 1) => request<WidgetSpotlightItem[]>(stryMutAct_9fa48("436") ? "" : (stryCov_9fa48("436"), 'GET'), stryMutAct_9fa48("437") ? `` : (stryCov_9fa48("437"), `api/indigenous/spotlights?limit=${stryMutAct_9fa48("438") ? Math.min(1, limit) : (stryCov_9fa48("438"), Math.max(1, limit))}`))),
  happeningNearYou: async (params: {
    city?: string;
    country?: string;
    limit?: number;
  } = {}) => {
    if (stryMutAct_9fa48("439")) {
      {}
    } else {
      stryCov_9fa48("439");
      const limit = stryMutAct_9fa48("440") ? params.limit && 3 : (stryCov_9fa48("440"), params.limit ?? 3);
      const response = await events.list(stryMutAct_9fa48("441") ? {} : (stryCov_9fa48("441"), {
        city: params.city,
        country: params.country,
        page: 1,
        pageSize: stryMutAct_9fa48("442") ? Math.min(6, limit * 3) : (stryCov_9fa48("442"), Math.max(6, stryMutAct_9fa48("443") ? limit / 3 : (stryCov_9fa48("443"), limit * 3)))
      }));
      const now = Date.now();
      const upcoming = stryMutAct_9fa48("446") ? response.events.map(event => ({
        event,
        startsAt: parseEventStartIso(event)
      })).sort((a, b) => Date.parse(a.startsAt!) - Date.parse(b.startsAt!)).slice(0, limit).map(item => item.event) : stryMutAct_9fa48("445") ? response.events.map(event => ({
        event,
        startsAt: parseEventStartIso(event)
      })).filter(item => item.startsAt !== null && Date.parse(item.startsAt) >= now).slice(0, limit).map(item => item.event) : stryMutAct_9fa48("444") ? response.events.map(event => ({
        event,
        startsAt: parseEventStartIso(event)
      })).filter(item => item.startsAt !== null && Date.parse(item.startsAt) >= now).sort((a, b) => Date.parse(a.startsAt!) - Date.parse(b.startsAt!)).map(item => item.event) : (stryCov_9fa48("444", "445", "446"), response.events.map(stryMutAct_9fa48("447") ? () => undefined : (stryCov_9fa48("447"), event => stryMutAct_9fa48("448") ? {} : (stryCov_9fa48("448"), {
        event,
        startsAt: parseEventStartIso(event)
      }))).filter(stryMutAct_9fa48("449") ? () => undefined : (stryCov_9fa48("449"), item => stryMutAct_9fa48("452") ? item.startsAt !== null || Date.parse(item.startsAt) >= now : stryMutAct_9fa48("451") ? false : stryMutAct_9fa48("450") ? true : (stryCov_9fa48("450", "451", "452"), (stryMutAct_9fa48("454") ? item.startsAt === null : stryMutAct_9fa48("453") ? true : (stryCov_9fa48("453", "454"), item.startsAt !== null)) && (stryMutAct_9fa48("457") ? Date.parse(item.startsAt) < now : stryMutAct_9fa48("456") ? Date.parse(item.startsAt) > now : stryMutAct_9fa48("455") ? true : (stryCov_9fa48("455", "456", "457"), Date.parse(item.startsAt) >= now))))).sort(stryMutAct_9fa48("458") ? () => undefined : (stryCov_9fa48("458"), (a, b) => stryMutAct_9fa48("459") ? Date.parse(a.startsAt!) + Date.parse(b.startsAt!) : (stryCov_9fa48("459"), Date.parse(a.startsAt!) - Date.parse(b.startsAt!)))).slice(0, limit).map(stryMutAct_9fa48("460") ? () => undefined : (stryCov_9fa48("460"), item => item.event)));
      return upcoming as WidgetNearbyEventItem[];
    }
  },
  upcomingTicket: async (userId: string): Promise<WidgetUpcomingTicketItem | null> => {
    if (stryMutAct_9fa48("461")) {
      {}
    } else {
      stryCov_9fa48("461");
      const userTickets = await tickets.forUser(userId);
      const now = Date.now();
      const candidate = stryMutAct_9fa48("464") ? userTickets.map(ticket => {
        const snapshotStart = ticket.eventSnapshot?.startAt ?? null;
        const flatDate = ticket.eventDate ?? ticket.date;
        const flatTime = (ticket.eventTime ?? '00:00').trim();
        const fromFlat = flatDate != null && flatDate.length > 0 ? `${flatDate.trim()}T${flatTime.length > 0 ? flatTime : '00:00'}:00` : null;
        const startsAt = snapshotStart ?? fromFlat;
        const startsAtMs = startsAt ? Date.parse(startsAt) : Number.POSITIVE_INFINITY;
        return {
          ticket,
          startsAtMs
        };
      }).filter(item => Number.isFinite(item.startsAtMs) && item.startsAtMs >= now).sort((a, b) => a.startsAtMs - b.startsAtMs)[0] : stryMutAct_9fa48("463") ? userTickets.filter(ticket => ticket.status === 'confirmed' || ticket.status === 'reserved').map(ticket => {
        const snapshotStart = ticket.eventSnapshot?.startAt ?? null;
        const flatDate = ticket.eventDate ?? ticket.date;
        const flatTime = (ticket.eventTime ?? '00:00').trim();
        const fromFlat = flatDate != null && flatDate.length > 0 ? `${flatDate.trim()}T${flatTime.length > 0 ? flatTime : '00:00'}:00` : null;
        const startsAt = snapshotStart ?? fromFlat;
        const startsAtMs = startsAt ? Date.parse(startsAt) : Number.POSITIVE_INFINITY;
        return {
          ticket,
          startsAtMs
        };
      }).sort((a, b) => a.startsAtMs - b.startsAtMs)[0] : stryMutAct_9fa48("462") ? userTickets.filter(ticket => ticket.status === 'confirmed' || ticket.status === 'reserved').map(ticket => {
        const snapshotStart = ticket.eventSnapshot?.startAt ?? null;
        const flatDate = ticket.eventDate ?? ticket.date;
        const flatTime = (ticket.eventTime ?? '00:00').trim();
        const fromFlat = flatDate != null && flatDate.length > 0 ? `${flatDate.trim()}T${flatTime.length > 0 ? flatTime : '00:00'}:00` : null;
        const startsAt = snapshotStart ?? fromFlat;
        const startsAtMs = startsAt ? Date.parse(startsAt) : Number.POSITIVE_INFINITY;
        return {
          ticket,
          startsAtMs
        };
      }).filter(item => Number.isFinite(item.startsAtMs) && item.startsAtMs >= now)[0] : (stryCov_9fa48("462", "463", "464"), userTickets.filter(stryMutAct_9fa48("465") ? () => undefined : (stryCov_9fa48("465"), ticket => stryMutAct_9fa48("468") ? ticket.status === 'confirmed' && ticket.status === 'reserved' : stryMutAct_9fa48("467") ? false : stryMutAct_9fa48("466") ? true : (stryCov_9fa48("466", "467", "468"), (stryMutAct_9fa48("470") ? ticket.status !== 'confirmed' : stryMutAct_9fa48("469") ? false : (stryCov_9fa48("469", "470"), ticket.status === (stryMutAct_9fa48("471") ? "" : (stryCov_9fa48("471"), 'confirmed')))) || (stryMutAct_9fa48("473") ? ticket.status !== 'reserved' : stryMutAct_9fa48("472") ? false : (stryCov_9fa48("472", "473"), ticket.status === (stryMutAct_9fa48("474") ? "" : (stryCov_9fa48("474"), 'reserved'))))))).map(ticket => {
        if (stryMutAct_9fa48("475")) {
          {}
        } else {
          stryCov_9fa48("475");
          const snapshotStart = stryMutAct_9fa48("476") ? ticket.eventSnapshot?.startAt && null : (stryCov_9fa48("476"), (stryMutAct_9fa48("477") ? ticket.eventSnapshot.startAt : (stryCov_9fa48("477"), ticket.eventSnapshot?.startAt)) ?? null);
          const flatDate = stryMutAct_9fa48("478") ? ticket.eventDate && ticket.date : (stryCov_9fa48("478"), ticket.eventDate ?? ticket.date);
          const flatTime = stryMutAct_9fa48("479") ? ticket.eventTime ?? '00:00' : (stryCov_9fa48("479"), (stryMutAct_9fa48("480") ? ticket.eventTime && '00:00' : (stryCov_9fa48("480"), ticket.eventTime ?? (stryMutAct_9fa48("481") ? "" : (stryCov_9fa48("481"), '00:00')))).trim());
          const fromFlat = (stryMutAct_9fa48("484") ? flatDate != null || flatDate.length > 0 : stryMutAct_9fa48("483") ? false : stryMutAct_9fa48("482") ? true : (stryCov_9fa48("482", "483", "484"), (stryMutAct_9fa48("486") ? flatDate == null : stryMutAct_9fa48("485") ? true : (stryCov_9fa48("485", "486"), flatDate != null)) && (stryMutAct_9fa48("489") ? flatDate.length <= 0 : stryMutAct_9fa48("488") ? flatDate.length >= 0 : stryMutAct_9fa48("487") ? true : (stryCov_9fa48("487", "488", "489"), flatDate.length > 0)))) ? stryMutAct_9fa48("490") ? `` : (stryCov_9fa48("490"), `${stryMutAct_9fa48("491") ? flatDate : (stryCov_9fa48("491"), flatDate.trim())}T${(stryMutAct_9fa48("495") ? flatTime.length <= 0 : stryMutAct_9fa48("494") ? flatTime.length >= 0 : stryMutAct_9fa48("493") ? false : stryMutAct_9fa48("492") ? true : (stryCov_9fa48("492", "493", "494", "495"), flatTime.length > 0)) ? flatTime : stryMutAct_9fa48("496") ? "" : (stryCov_9fa48("496"), '00:00')}:00`) : null;
          const startsAt = stryMutAct_9fa48("497") ? snapshotStart && fromFlat : (stryCov_9fa48("497"), snapshotStart ?? fromFlat);
          const startsAtMs = startsAt ? Date.parse(startsAt) : Number.POSITIVE_INFINITY;
          return stryMutAct_9fa48("498") ? {} : (stryCov_9fa48("498"), {
            ticket,
            startsAtMs
          });
        }
      }).filter(stryMutAct_9fa48("499") ? () => undefined : (stryCov_9fa48("499"), item => stryMutAct_9fa48("502") ? Number.isFinite(item.startsAtMs) || item.startsAtMs >= now : stryMutAct_9fa48("501") ? false : stryMutAct_9fa48("500") ? true : (stryCov_9fa48("500", "501", "502"), Number.isFinite(item.startsAtMs) && (stryMutAct_9fa48("505") ? item.startsAtMs < now : stryMutAct_9fa48("504") ? item.startsAtMs > now : stryMutAct_9fa48("503") ? true : (stryCov_9fa48("503", "504", "505"), item.startsAtMs >= now))))).sort(stryMutAct_9fa48("506") ? () => undefined : (stryCov_9fa48("506"), (a, b) => stryMutAct_9fa48("507") ? a.startsAtMs + b.startsAtMs : (stryCov_9fa48("507"), a.startsAtMs - b.startsAtMs)))[0]);
      if (stryMutAct_9fa48("510") ? false : stryMutAct_9fa48("509") ? true : stryMutAct_9fa48("508") ? candidate : (stryCov_9fa48("508", "509", "510"), !candidate)) return null;
      let event: EventData | null = null;
      try {
        if (stryMutAct_9fa48("511")) {
          {}
        } else {
          stryCov_9fa48("511");
          event = await events.get(candidate.ticket.eventId);
        }
      } catch {
        if (stryMutAct_9fa48("512")) {
          {}
        } else {
          stryCov_9fa48("512");
          event = null;
        }
      }
      const startsAt = stryMutAct_9fa48("513") ? candidate.ticket.eventSnapshot?.startAt && (event ? parseEventStartIso(event) : null) : (stryCov_9fa48("513"), (stryMutAct_9fa48("514") ? candidate.ticket.eventSnapshot.startAt : (stryCov_9fa48("514"), candidate.ticket.eventSnapshot?.startAt)) ?? (event ? parseEventStartIso(event) : null));
      return stryMutAct_9fa48("515") ? {} : (stryCov_9fa48("515"), {
        ticket: candidate.ticket,
        event,
        startsAt
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
const users = stryMutAct_9fa48("516") ? {} : (stryCov_9fa48("516"), {
  me: stryMutAct_9fa48("517") ? () => undefined : (stryCov_9fa48("517"), () => request<User>(stryMutAct_9fa48("518") ? "" : (stryCov_9fa48("518"), 'GET'), stryMutAct_9fa48("519") ? "" : (stryCov_9fa48("519"), 'api/users/me'))),
  get: stryMutAct_9fa48("520") ? () => undefined : (stryCov_9fa48("520"), (id: string) => request<User>(stryMutAct_9fa48("521") ? "" : (stryCov_9fa48("521"), 'GET'), stryMutAct_9fa48("522") ? `` : (stryCov_9fa48("522"), `api/users/${id}`))),
  getByHandle: stryMutAct_9fa48("523") ? () => undefined : (stryCov_9fa48("523"), (handle: string) => request<User>(stryMutAct_9fa48("524") ? "" : (stryCov_9fa48("524"), 'GET'), stryMutAct_9fa48("525") ? `` : (stryCov_9fa48("525"), `api/users/handle/${encodeURIComponent(handle)}`))),
  update: stryMutAct_9fa48("526") ? () => undefined : (stryCov_9fa48("526"), (id: string, data: Partial<User>) => request<User>(stryMutAct_9fa48("527") ? "" : (stryCov_9fa48("527"), 'PUT'), stryMutAct_9fa48("528") ? `` : (stryCov_9fa48("528"), `api/users/${id}`), data))
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
const notifications = stryMutAct_9fa48("529") ? {} : (stryCov_9fa48("529"), {
  list: stryMutAct_9fa48("530") ? () => undefined : (stryCov_9fa48("530"), () => request<Notification[]>(stryMutAct_9fa48("531") ? "" : (stryCov_9fa48("531"), 'GET'), stryMutAct_9fa48("532") ? "" : (stryCov_9fa48("532"), 'api/notifications'))),
  unreadCount: stryMutAct_9fa48("533") ? () => undefined : (stryCov_9fa48("533"), () => request<{
    count: number;
  }>(stryMutAct_9fa48("534") ? "" : (stryCov_9fa48("534"), 'GET'), stryMutAct_9fa48("535") ? "" : (stryCov_9fa48("535"), 'api/notifications/unread-count'))),
  markRead: stryMutAct_9fa48("536") ? () => undefined : (stryCov_9fa48("536"), (notificationId: string) => request<{
    success: boolean;
  }>(stryMutAct_9fa48("537") ? "" : (stryCov_9fa48("537"), 'PUT'), stryMutAct_9fa48("538") ? `` : (stryCov_9fa48("538"), `api/notifications/${notificationId}/read`))),
  markAllRead: stryMutAct_9fa48("539") ? () => undefined : (stryCov_9fa48("539"), () => request<{
    success: boolean;
  }>(stryMutAct_9fa48("540") ? "" : (stryCov_9fa48("540"), 'POST'), stryMutAct_9fa48("541") ? "" : (stryCov_9fa48("541"), 'api/notifications/mark-all-read'))),
  approvalStatus: stryMutAct_9fa48("542") ? () => undefined : (stryCov_9fa48("542"), (payload: {
    approvalToken: string;
  }) => request<{
    valid: boolean;
    expiresAt?: string;
    remainingMs: number;
  }>(stryMutAct_9fa48("543") ? "" : (stryCov_9fa48("543"), 'POST'), stryMutAct_9fa48("544") ? "" : (stryCov_9fa48("544"), 'api/notifications/approval-status'), payload)),
  targeted: stryMutAct_9fa48("545") ? () => undefined : (stryCov_9fa48("545"), (payload: {
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
  }) => request<{
    dryRun: boolean;
    targetedCount: number;
    audiencePreview: {
      userId: string;
      city: string;
      country: string;
    }[];
    idempotentReplay?: boolean;
    approvalToken?: string;
    approvalExpiresAt?: string;
  }>(stryMutAct_9fa48("546") ? "" : (stryCov_9fa48("546"), 'POST'), stryMutAct_9fa48("547") ? "" : (stryCov_9fa48("547"), 'api/notifications/targeted'), payload))
});
const admin = stryMutAct_9fa48("548") ? {} : (stryCov_9fa48("548"), {
  stats: stryMutAct_9fa48("549") ? () => undefined : (stryCov_9fa48("549"), () => request<{
    totalUsers: number;
    totalEvents: number;
    totalTicketsSold: number;
    activeCouncils: number;
    pendingHandlesCount: number;
    newUsersThisWeek: number;
    activeOrganizers: number;
    pendingModerationCount: number;
  }>(stryMutAct_9fa48("550") ? "" : (stryCov_9fa48("550"), 'GET'), stryMutAct_9fa48("551") ? "" : (stryCov_9fa48("551"), 'api/admin/stats'))),
  listUsers: (params?: {
    limit?: number;
    page?: number;
    search?: string;
    role?: string;
  }) => {
    if (stryMutAct_9fa48("552")) {
      {}
    } else {
      stryCov_9fa48("552");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("555") ? params?.limit == null : stryMutAct_9fa48("554") ? false : stryMutAct_9fa48("553") ? true : (stryCov_9fa48("553", "554", "555"), (stryMutAct_9fa48("556") ? params.limit : (stryCov_9fa48("556"), params?.limit)) != null)) qs.set(stryMutAct_9fa48("557") ? "" : (stryCov_9fa48("557"), 'limit'), String(params.limit));
      if (stryMutAct_9fa48("560") ? params?.page == null : stryMutAct_9fa48("559") ? false : stryMutAct_9fa48("558") ? true : (stryCov_9fa48("558", "559", "560"), (stryMutAct_9fa48("561") ? params.page : (stryCov_9fa48("561"), params?.page)) != null)) qs.set(stryMutAct_9fa48("562") ? "" : (stryCov_9fa48("562"), 'page'), String(params.page));
      if (stryMutAct_9fa48("565") ? params.search : stryMutAct_9fa48("564") ? false : stryMutAct_9fa48("563") ? true : (stryCov_9fa48("563", "564", "565"), params?.search)) qs.set(stryMutAct_9fa48("566") ? "" : (stryCov_9fa48("566"), 'search'), params.search);
      if (stryMutAct_9fa48("569") ? params.role : stryMutAct_9fa48("568") ? false : stryMutAct_9fa48("567") ? true : (stryCov_9fa48("567", "568", "569"), params?.role)) qs.set(stryMutAct_9fa48("570") ? "" : (stryCov_9fa48("570"), 'role'), params.role);
      const q = qs.toString();
      return request<{
        users: {
          id: string;
          username?: string;
          displayName?: string;
          email?: string;
          role?: UserRole;
          avatarUrl?: string;
          city?: string;
          country?: string;
          handle?: string;
          handleStatus?: string;
          isSydneyVerified?: boolean;
          membershipTier?: string;
          createdAt?: string;
          lastActiveAt?: string;
        }[];
        total: number;
        page: number;
        limit: number;
      }>(stryMutAct_9fa48("571") ? "" : (stryCov_9fa48("571"), 'GET'), stryMutAct_9fa48("572") ? `` : (stryCov_9fa48("572"), `api/admin/users${q ? stryMutAct_9fa48("573") ? `` : (stryCov_9fa48("573"), `?${q}`) : stryMutAct_9fa48("574") ? "Stryker was here!" : (stryCov_9fa48("574"), '')}`));
    }
  },
  setUserRole: stryMutAct_9fa48("575") ? () => undefined : (stryCov_9fa48("575"), (userId: string, role: UserRole) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("576") ? "" : (stryCov_9fa48("576"), 'PUT'), stryMutAct_9fa48("577") ? `` : (stryCov_9fa48("577"), `api/admin/users/${userId}/role`), stryMutAct_9fa48("578") ? {} : (stryCov_9fa48("578"), {
    role
  }))),
  setUserVerified: stryMutAct_9fa48("579") ? () => undefined : (stryCov_9fa48("579"), (userId: string, verified: boolean) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("580") ? "" : (stryCov_9fa48("580"), 'PUT'), stryMutAct_9fa48("581") ? `` : (stryCov_9fa48("581"), `api/admin/users/${userId}/verify`), stryMutAct_9fa48("582") ? {} : (stryCov_9fa48("582"), {
    verified
  }))),
  listReports: (params?: {
    status?: 'pending' | 'resolved' | 'dismissed' | 'all';
    limit?: number;
  }) => {
    if (stryMutAct_9fa48("583")) {
      {}
    } else {
      stryCov_9fa48("583");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("586") ? params.status : stryMutAct_9fa48("585") ? false : stryMutAct_9fa48("584") ? true : (stryCov_9fa48("584", "585", "586"), params?.status)) qs.set(stryMutAct_9fa48("587") ? "" : (stryCov_9fa48("587"), 'status'), params.status);
      if (stryMutAct_9fa48("590") ? params?.limit == null : stryMutAct_9fa48("589") ? false : stryMutAct_9fa48("588") ? true : (stryCov_9fa48("588", "589", "590"), (stryMutAct_9fa48("591") ? params.limit : (stryCov_9fa48("591"), params?.limit)) != null)) qs.set(stryMutAct_9fa48("592") ? "" : (stryCov_9fa48("592"), 'limit'), String(params.limit));
      const q = qs.toString();
      return request<{
        reports: {
          id: string;
          targetType: string;
          targetId: string;
          reason: string;
          details?: string;
          reporterUserId: string;
          status: string;
          createdAt: string;
        }[];
        total: number;
      }>(stryMutAct_9fa48("593") ? "" : (stryCov_9fa48("593"), 'GET'), stryMutAct_9fa48("594") ? `` : (stryCov_9fa48("594"), `api/admin/reports${q ? stryMutAct_9fa48("595") ? `` : (stryCov_9fa48("595"), `?${q}`) : stryMutAct_9fa48("596") ? "Stryker was here!" : (stryCov_9fa48("596"), '')}`));
    }
  },
  resolveReport: stryMutAct_9fa48("597") ? () => undefined : (stryCov_9fa48("597"), (id: string, status: 'resolved' | 'dismissed') => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("598") ? "" : (stryCov_9fa48("598"), 'PATCH'), stryMutAct_9fa48("599") ? `` : (stryCov_9fa48("599"), `api/admin/reports/${id}/status`), stryMutAct_9fa48("600") ? {} : (stryCov_9fa48("600"), {
    status
  }))),
  pendingEvents: stryMutAct_9fa48("601") ? () => undefined : (stryCov_9fa48("601"), (limit = 50) => request<{
    events: {
      id: string;
      title?: string;
      category?: string;
      city?: string;
      country?: string;
      date?: string;
      imageUrl?: string;
      organizerId?: string;
      createdAt?: string;
      isFree?: boolean;
      priceCents?: number;
    }[];
    total: number;
  }>(stryMutAct_9fa48("602") ? "" : (stryCov_9fa48("602"), 'GET'), stryMutAct_9fa48("603") ? `` : (stryCov_9fa48("603"), `api/admin/events/pending?limit=${limit}`))),
  financeSummary: stryMutAct_9fa48("604") ? () => undefined : (stryCov_9fa48("604"), () => request<{
    activeSubscriptions: number;
    paidTickets: number;
    sampleRevenueCents: number;
    sampleSize: number;
  }>(stryMutAct_9fa48("605") ? "" : (stryCov_9fa48("605"), 'GET'), stryMutAct_9fa48("606") ? "" : (stryCov_9fa48("606"), 'api/admin/finance/summary'))),
  auditLogs: (params?: {
    limit?: number;
    action?: string;
    actorId?: string;
    from?: string;
    to?: string;
  }) => {
    if (stryMutAct_9fa48("607")) {
      {}
    } else {
      stryCov_9fa48("607");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("610") ? params?.limit == null : stryMutAct_9fa48("609") ? false : stryMutAct_9fa48("608") ? true : (stryCov_9fa48("608", "609", "610"), (stryMutAct_9fa48("611") ? params.limit : (stryCov_9fa48("611"), params?.limit)) != null)) qs.set(stryMutAct_9fa48("612") ? "" : (stryCov_9fa48("612"), 'limit'), String(params.limit));
      if (stryMutAct_9fa48("615") ? params.action : stryMutAct_9fa48("614") ? false : stryMutAct_9fa48("613") ? true : (stryCov_9fa48("613", "614", "615"), params?.action)) qs.set(stryMutAct_9fa48("616") ? "" : (stryCov_9fa48("616"), 'action'), params.action);
      if (stryMutAct_9fa48("619") ? params.actorId : stryMutAct_9fa48("618") ? false : stryMutAct_9fa48("617") ? true : (stryCov_9fa48("617", "618", "619"), params?.actorId)) qs.set(stryMutAct_9fa48("620") ? "" : (stryCov_9fa48("620"), 'actorId'), params.actorId);
      if (stryMutAct_9fa48("623") ? params.from : stryMutAct_9fa48("622") ? false : stryMutAct_9fa48("621") ? true : (stryCov_9fa48("621", "622", "623"), params?.from)) qs.set(stryMutAct_9fa48("624") ? "" : (stryCov_9fa48("624"), 'from'), params.from);
      if (stryMutAct_9fa48("627") ? params.to : stryMutAct_9fa48("626") ? false : stryMutAct_9fa48("625") ? true : (stryCov_9fa48("625", "626", "627"), params?.to)) qs.set(stryMutAct_9fa48("628") ? "" : (stryCov_9fa48("628"), 'to'), params.to);
      const q = qs.toString();
      return request<{
        logs: AdminAuditLog[];
        limit: number;
        count: number;
      }>(stryMutAct_9fa48("629") ? "" : (stryCov_9fa48("629"), 'GET'), stryMutAct_9fa48("630") ? `` : (stryCov_9fa48("630"), `api/admin/audit-logs${q ? stryMutAct_9fa48("631") ? `` : (stryCov_9fa48("631"), `?${q}`) : stryMutAct_9fa48("632") ? "Stryker was here!" : (stryCov_9fa48("632"), '')}`));
    }
  },
  geohashBackfill: stryMutAct_9fa48("633") ? () => undefined : (stryCov_9fa48("633"), (payload?: {
    forceGeoHash?: boolean;
    overwriteCoordinates?: boolean;
  }) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("634") ? "" : (stryCov_9fa48("634"), 'POST'), stryMutAct_9fa48("635") ? "" : (stryCov_9fa48("635"), 'api/admin/geohash-backfill'), payload)),
  getSystemConfig: stryMutAct_9fa48("636") ? () => undefined : (stryCov_9fa48("636"), () => request<{
    config: {
      maintenanceMode: boolean;
      maintenanceMessage?: string;
      minAppVersion?: string;
      updatedAt: string;
    };
  }>(stryMutAct_9fa48("637") ? "" : (stryCov_9fa48("637"), 'GET'), stryMutAct_9fa48("638") ? "" : (stryCov_9fa48("638"), 'api/admin/config'))),
  updateSystemConfig: stryMutAct_9fa48("639") ? () => undefined : (stryCov_9fa48("639"), (config: {
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
    minAppVersion?: string;
  }) => request<{
    ok: boolean;
    config: any;
  }>(stryMutAct_9fa48("640") ? "" : (stryCov_9fa48("640"), 'PUT'), stryMutAct_9fa48("641") ? "" : (stryCov_9fa48("641"), 'api/admin/config'), config)),
  getTaxonomy: stryMutAct_9fa48("642") ? () => undefined : (stryCov_9fa48("642"), () => request<{
    categories: {
      id: string;
      title: string;
      tags: string[];
      accentColor: string;
      updatedAt: string;
    }[];
  }>(stryMutAct_9fa48("643") ? "" : (stryCov_9fa48("643"), 'GET'), stryMutAct_9fa48("644") ? "" : (stryCov_9fa48("644"), 'api/admin/taxonomy'))),
  updateTaxonomy: stryMutAct_9fa48("645") ? () => undefined : (stryCov_9fa48("645"), (categoryId: string, tags: string[]) => request<{
    ok: boolean;
    category: any;
  }>(stryMutAct_9fa48("646") ? "" : (stryCov_9fa48("646"), 'PUT'), stryMutAct_9fa48("647") ? `` : (stryCov_9fa48("647"), `api/admin/taxonomy/${categoryId}`), stryMutAct_9fa48("648") ? {} : (stryCov_9fa48("648"), {
    tags
  }))),
  auditLogsCsv: async (params?: {
    limit?: number;
    action?: string;
    actorId?: string;
    from?: string;
    to?: string;
  }) => {
    if (stryMutAct_9fa48("649")) {
      {}
    } else {
      stryCov_9fa48("649");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("652") ? params?.limit == null : stryMutAct_9fa48("651") ? false : stryMutAct_9fa48("650") ? true : (stryCov_9fa48("650", "651", "652"), (stryMutAct_9fa48("653") ? params.limit : (stryCov_9fa48("653"), params?.limit)) != null)) qs.set(stryMutAct_9fa48("654") ? "" : (stryCov_9fa48("654"), 'limit'), String(params.limit));
      if (stryMutAct_9fa48("657") ? params.action : stryMutAct_9fa48("656") ? false : stryMutAct_9fa48("655") ? true : (stryCov_9fa48("655", "656", "657"), params?.action)) qs.set(stryMutAct_9fa48("658") ? "" : (stryCov_9fa48("658"), 'action'), params.action);
      if (stryMutAct_9fa48("661") ? params.actorId : stryMutAct_9fa48("660") ? false : stryMutAct_9fa48("659") ? true : (stryCov_9fa48("659", "660", "661"), params?.actorId)) qs.set(stryMutAct_9fa48("662") ? "" : (stryCov_9fa48("662"), 'actorId'), params.actorId);
      if (stryMutAct_9fa48("665") ? params.from : stryMutAct_9fa48("664") ? false : stryMutAct_9fa48("663") ? true : (stryCov_9fa48("663", "664", "665"), params?.from)) qs.set(stryMutAct_9fa48("666") ? "" : (stryCov_9fa48("666"), 'from'), params.from);
      if (stryMutAct_9fa48("669") ? params.to : stryMutAct_9fa48("668") ? false : stryMutAct_9fa48("667") ? true : (stryCov_9fa48("667", "668", "669"), params?.to)) qs.set(stryMutAct_9fa48("670") ? "" : (stryCov_9fa48("670"), 'to'), params.to);
      const q = qs.toString();
      const res = await apiRequest(stryMutAct_9fa48("671") ? "" : (stryCov_9fa48("671"), 'GET'), stryMutAct_9fa48("672") ? `` : (stryCov_9fa48("672"), `api/admin/audit-logs.csv${q ? stryMutAct_9fa48("673") ? `` : (stryCov_9fa48("673"), `?${q}`) : stryMutAct_9fa48("674") ? "Stryker was here!" : (stryCov_9fa48("674"), '')}`));
      return res.text();
    }
  },
  bootstrapGoogleWalletBusinessCardClass: stryMutAct_9fa48("675") ? () => undefined : (stryCov_9fa48("675"), () => request<GoogleWalletClassBootstrapResponse>(stryMutAct_9fa48("676") ? "" : (stryCov_9fa48("676"), 'POST'), stryMutAct_9fa48("677") ? "" : (stryCov_9fa48("677"), 'api/admin/wallet/business-card/google/bootstrap-class'), {})),
  walletBusinessCardReadiness: stryMutAct_9fa48("678") ? () => undefined : (stryCov_9fa48("678"), () => request<WalletBusinessCardReadinessResponse>(stryMutAct_9fa48("679") ? "" : (stryCov_9fa48("679"), 'GET'), stryMutAct_9fa48("680") ? "" : (stryCov_9fa48("680"), 'api/admin/wallet/business-card/readiness'))),
  pendingHandles: (params?: {
    limit?: number;
  }) => {
    if (stryMutAct_9fa48("681")) {
      {}
    } else {
      stryCov_9fa48("681");
      const qs = (stryMutAct_9fa48("684") ? params?.limit == null : stryMutAct_9fa48("683") ? false : stryMutAct_9fa48("682") ? true : (stryCov_9fa48("682", "683", "684"), (stryMutAct_9fa48("685") ? params.limit : (stryCov_9fa48("685"), params?.limit)) != null)) ? stryMutAct_9fa48("686") ? `` : (stryCov_9fa48("686"), `?limit=${params.limit}`) : stryMutAct_9fa48("687") ? "Stryker was here!" : (stryCov_9fa48("687"), '');
      return request<{
        handles: PendingHandleItem[];
        count: number;
      }>(stryMutAct_9fa48("688") ? "" : (stryCov_9fa48("688"), 'GET'), stryMutAct_9fa48("689") ? `` : (stryCov_9fa48("689"), `api/admin/handles/pending${qs}`));
    }
  },
  approveHandle: stryMutAct_9fa48("690") ? () => undefined : (stryCov_9fa48("690"), (type: 'user' | 'profile', id: string) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("691") ? "" : (stryCov_9fa48("691"), 'POST'), stryMutAct_9fa48("692") ? `` : (stryCov_9fa48("692"), `api/admin/handles/${type}/${id}/approve`), {})),
  rejectHandle: stryMutAct_9fa48("693") ? () => undefined : (stryCov_9fa48("693"), (type: 'user' | 'profile', id: string, reason?: string) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("694") ? "" : (stryCov_9fa48("694"), 'POST'), stryMutAct_9fa48("695") ? `` : (stryCov_9fa48("695"), `api/admin/handles/${type}/${id}/reject`), stryMutAct_9fa48("696") ? {} : (stryCov_9fa48("696"), {
    reason
  }))),
  // ── Data Import ──────────────────────────────────────────────────────────
  importJson: stryMutAct_9fa48("697") ? () => undefined : (stryCov_9fa48("697"), (payload: {
    events: Record<string, unknown>[];
    source?: 'manual' | 'json-api';
    city?: string;
    country?: string;
  }) => request<{
    ok: boolean;
    imported: number;
    updated: number;
    skipped: number;
    errors: string[];
    source: string;
  }>(stryMutAct_9fa48("698") ? "" : (stryCov_9fa48("698"), 'POST'), stryMutAct_9fa48("699") ? "" : (stryCov_9fa48("699"), 'api/admin/import/json'), payload)),
  importUrl: stryMutAct_9fa48("700") ? () => undefined : (stryCov_9fa48("700"), (payload: {
    url: string;
    city?: string;
    country?: string;
  }) => request<{
    ok: boolean;
    imported: number;
    updated: number;
    skipped: number;
    errors: string[];
    source: string;
  }>(stryMutAct_9fa48("701") ? "" : (stryCov_9fa48("701"), 'POST'), stryMutAct_9fa48("702") ? "" : (stryCov_9fa48("702"), 'api/admin/import/url'), payload)),
  importClear: stryMutAct_9fa48("703") ? () => undefined : (stryCov_9fa48("703"), (source: 'manual' | 'url-scrape' | 'cityofsydney' | 'json-api' | 'all' = stryMutAct_9fa48("704") ? "" : (stryCov_9fa48("704"), 'all')) => request<{
    ok: boolean;
    deleted: number;
    source: string;
  }>(stryMutAct_9fa48("705") ? "" : (stryCov_9fa48("705"), 'DELETE'), stryMutAct_9fa48("706") ? "" : (stryCov_9fa48("706"), 'api/admin/import/clear'), stryMutAct_9fa48("707") ? {} : (stryCov_9fa48("707"), {
    source,
    confirm: stryMutAct_9fa48("708") ? false : (stryCov_9fa48("708"), true)
  }))),
  importSources: stryMutAct_9fa48("709") ? () => undefined : (stryCov_9fa48("709"), () => request<{
    sources: {
      source: string;
      count: number;
      latest: string;
    }[];
    total: number;
  }>(stryMutAct_9fa48("710") ? "" : (stryCov_9fa48("710"), 'GET'), stryMutAct_9fa48("711") ? "" : (stryCov_9fa48("711"), 'api/admin/import/sources'))),
  // ── Ingest Source Management ─────────────────────────────────────────────
  ingestSourcesList: stryMutAct_9fa48("712") ? () => undefined : (stryCov_9fa48("712"), () => request<{
    sources: IngestSource[];
  }>(stryMutAct_9fa48("713") ? "" : (stryCov_9fa48("713"), 'GET'), stryMutAct_9fa48("714") ? "" : (stryCov_9fa48("714"), 'api/admin/ingest/sources'))),
  ingestSourceCreate: stryMutAct_9fa48("715") ? () => undefined : (stryCov_9fa48("715"), (payload: {
    name: string;
    url: string;
    city?: string;
    country?: string;
    enabled?: boolean;
    scheduleInterval?: IngestScheduleInterval | null;
  }) => request<{
    ok: boolean;
    source: IngestSource;
  }>(stryMutAct_9fa48("716") ? "" : (stryCov_9fa48("716"), 'POST'), stryMutAct_9fa48("717") ? "" : (stryCov_9fa48("717"), 'api/admin/ingest/sources'), payload)),
  ingestSourceUpdate: stryMutAct_9fa48("718") ? () => undefined : (stryCov_9fa48("718"), (id: string, payload: Partial<{
    name: string;
    url: string;
    city: string;
    country: string;
    enabled: boolean;
    scheduleInterval: IngestScheduleInterval | null;
  }>) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("719") ? "" : (stryCov_9fa48("719"), 'PUT'), stryMutAct_9fa48("720") ? `` : (stryCov_9fa48("720"), `api/admin/ingest/sources/${id}`), payload)),
  ingestSourceDelete: stryMutAct_9fa48("721") ? () => undefined : (stryCov_9fa48("721"), (id: string) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("722") ? "" : (stryCov_9fa48("722"), 'DELETE'), stryMutAct_9fa48("723") ? `` : (stryCov_9fa48("723"), `api/admin/ingest/sources/${id}`))),
  ingestSourceRun: stryMutAct_9fa48("724") ? () => undefined : (stryCov_9fa48("724"), (id: string) => request<{
    ok: boolean;
    imported: number;
    updated: number;
    skipped: number;
    errors: string[];
    source: string;
    jobId?: string;
  }>(stryMutAct_9fa48("725") ? "" : (stryCov_9fa48("725"), 'POST'), stryMutAct_9fa48("726") ? `` : (stryCov_9fa48("726"), `api/admin/ingest/sources/${id}/run`))),
  // ── Ingestion Job History ────────────────────────────────────────────────
  ingestJobsList: (params?: {
    limit?: number;
    sourceId?: string;
    status?: string;
  }) => {
    if (stryMutAct_9fa48("727")) {
      {}
    } else {
      stryCov_9fa48("727");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("730") ? params?.limit == null : stryMutAct_9fa48("729") ? false : stryMutAct_9fa48("728") ? true : (stryCov_9fa48("728", "729", "730"), (stryMutAct_9fa48("731") ? params.limit : (stryCov_9fa48("731"), params?.limit)) != null)) qs.set(stryMutAct_9fa48("732") ? "" : (stryCov_9fa48("732"), 'limit'), String(params.limit));
      if (stryMutAct_9fa48("735") ? params.sourceId : stryMutAct_9fa48("734") ? false : stryMutAct_9fa48("733") ? true : (stryCov_9fa48("733", "734", "735"), params?.sourceId)) qs.set(stryMutAct_9fa48("736") ? "" : (stryCov_9fa48("736"), 'sourceId'), params.sourceId);
      if (stryMutAct_9fa48("739") ? params.status : stryMutAct_9fa48("738") ? false : stryMutAct_9fa48("737") ? true : (stryCov_9fa48("737", "738", "739"), params?.status)) qs.set(stryMutAct_9fa48("740") ? "" : (stryCov_9fa48("740"), 'status'), params.status);
      const q = qs.toString();
      return request<{
        jobs: IngestionJob[];
      }>(stryMutAct_9fa48("741") ? "" : (stryCov_9fa48("741"), 'GET'), stryMutAct_9fa48("742") ? `` : (stryCov_9fa48("742"), `api/admin/ingest/jobs${q ? stryMutAct_9fa48("743") ? `` : (stryCov_9fa48("743"), `?${q}`) : stryMutAct_9fa48("744") ? "Stryker was here!" : (stryCov_9fa48("744"), '')}`));
    }
  },
  ingestJobRetry: stryMutAct_9fa48("745") ? () => undefined : (stryCov_9fa48("745"), (id: string) => request<{
    ok: boolean;
    imported: number;
    updated: number;
    skipped: number;
    jobId?: string;
  }>(stryMutAct_9fa48("746") ? "" : (stryCov_9fa48("746"), 'POST'), stryMutAct_9fa48("747") ? `` : (stryCov_9fa48("747"), `api/admin/ingest/jobs/${id}/retry`))),
  /** List all updates (including drafts) — admin only */
  listUpdates: (params?: {
    category?: UpdateCategory;
    limit?: number;
    offset?: number;
  }) => {
    if (stryMutAct_9fa48("748")) {
      {}
    } else {
      stryCov_9fa48("748");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("751") ? params.category : stryMutAct_9fa48("750") ? false : stryMutAct_9fa48("749") ? true : (stryCov_9fa48("749", "750", "751"), params?.category)) qs.set(stryMutAct_9fa48("752") ? "" : (stryCov_9fa48("752"), 'category'), params.category);
      if (stryMutAct_9fa48("755") ? params?.limit == null : stryMutAct_9fa48("754") ? false : stryMutAct_9fa48("753") ? true : (stryCov_9fa48("753", "754", "755"), (stryMutAct_9fa48("756") ? params.limit : (stryCov_9fa48("756"), params?.limit)) != null)) qs.set(stryMutAct_9fa48("757") ? "" : (stryCov_9fa48("757"), 'limit'), String(params.limit));
      if (stryMutAct_9fa48("760") ? params?.offset == null : stryMutAct_9fa48("759") ? false : stryMutAct_9fa48("758") ? true : (stryCov_9fa48("758", "759", "760"), (stryMutAct_9fa48("761") ? params.offset : (stryCov_9fa48("761"), params?.offset)) != null)) qs.set(stryMutAct_9fa48("762") ? "" : (stryCov_9fa48("762"), 'offset'), String(params.offset));
      const q = qs.toString();
      return request<{
        updates: AppUpdate[];
        total: number;
      }>(stryMutAct_9fa48("763") ? "" : (stryCov_9fa48("763"), 'GET'), stryMutAct_9fa48("764") ? `` : (stryCov_9fa48("764"), `api/admin/updates${q ? stryMutAct_9fa48("765") ? `` : (stryCov_9fa48("765"), `?${q}`) : stryMutAct_9fa48("766") ? "Stryker was here!" : (stryCov_9fa48("766"), '')}`));
    }
  },
  getDiscoverCuration: stryMutAct_9fa48("767") ? () => undefined : (stryCov_9fa48("767"), () => request<{
    config: DiscoverCurationConfig;
    source: 'default' | 'firestore';
  }>(stryMutAct_9fa48("768") ? "" : (stryCov_9fa48("768"), 'GET'), stryMutAct_9fa48("769") ? "" : (stryCov_9fa48("769"), 'api/admin/discover-curation'))),
  saveDiscoverCuration: stryMutAct_9fa48("770") ? () => undefined : (stryCov_9fa48("770"), (config: DiscoverCurationConfig) => request<{
    ok: boolean;
    config: DiscoverCurationConfig;
  }>(stryMutAct_9fa48("771") ? "" : (stryCov_9fa48("771"), 'PUT'), stryMutAct_9fa48("772") ? "" : (stryCov_9fa48("772"), 'api/admin/discover-curation'), config))
});

// ---------------------------------------------------------------------------
// Updates (public release notes / microblog)
// ---------------------------------------------------------------------------
const updates = stryMutAct_9fa48("773") ? {} : (stryCov_9fa48("773"), {
  list: (params?: {
    category?: UpdateCategory;
    limit?: number;
    offset?: number;
  }) => {
    if (stryMutAct_9fa48("774")) {
      {}
    } else {
      stryCov_9fa48("774");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("777") ? params.category : stryMutAct_9fa48("776") ? false : stryMutAct_9fa48("775") ? true : (stryCov_9fa48("775", "776", "777"), params?.category)) qs.set(stryMutAct_9fa48("778") ? "" : (stryCov_9fa48("778"), 'category'), params.category);
      if (stryMutAct_9fa48("781") ? params?.limit == null : stryMutAct_9fa48("780") ? false : stryMutAct_9fa48("779") ? true : (stryCov_9fa48("779", "780", "781"), (stryMutAct_9fa48("782") ? params.limit : (stryCov_9fa48("782"), params?.limit)) != null)) qs.set(stryMutAct_9fa48("783") ? "" : (stryCov_9fa48("783"), 'limit'), String(params.limit));
      if (stryMutAct_9fa48("786") ? params?.offset == null : stryMutAct_9fa48("785") ? false : stryMutAct_9fa48("784") ? true : (stryCov_9fa48("784", "785", "786"), (stryMutAct_9fa48("787") ? params.offset : (stryCov_9fa48("787"), params?.offset)) != null)) qs.set(stryMutAct_9fa48("788") ? "" : (stryCov_9fa48("788"), 'offset'), String(params.offset));
      const q = qs.toString();
      return request<{
        updates: AppUpdate[];
        total: number;
      }>(stryMutAct_9fa48("789") ? "" : (stryCov_9fa48("789"), 'GET'), stryMutAct_9fa48("790") ? `` : (stryCov_9fa48("790"), `api/updates${q ? stryMutAct_9fa48("791") ? `` : (stryCov_9fa48("791"), `?${q}`) : stryMutAct_9fa48("792") ? "Stryker was here!" : (stryCov_9fa48("792"), '')}`));
    }
  },
  get: stryMutAct_9fa48("793") ? () => undefined : (stryCov_9fa48("793"), (id: string) => request<AppUpdate>(stryMutAct_9fa48("794") ? "" : (stryCov_9fa48("794"), 'GET'), stryMutAct_9fa48("795") ? `` : (stryCov_9fa48("795"), `api/updates/${id}`))),
  create: stryMutAct_9fa48("796") ? () => undefined : (stryCov_9fa48("796"), (payload: Omit<AppUpdate, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>) => request<AppUpdate>(stryMutAct_9fa48("797") ? "" : (stryCov_9fa48("797"), 'POST'), stryMutAct_9fa48("798") ? "" : (stryCov_9fa48("798"), 'api/updates'), payload)),
  update: stryMutAct_9fa48("799") ? () => undefined : (stryCov_9fa48("799"), (id: string, payload: Partial<AppUpdate>) => request<AppUpdate>(stryMutAct_9fa48("800") ? "" : (stryCov_9fa48("800"), 'PUT'), stryMutAct_9fa48("801") ? `` : (stryCov_9fa48("801"), `api/updates/${id}`), payload)),
  remove: stryMutAct_9fa48("802") ? () => undefined : (stryCov_9fa48("802"), (id: string) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("803") ? "" : (stryCov_9fa48("803"), 'DELETE'), stryMutAct_9fa48("804") ? `` : (stryCov_9fa48("804"), `api/updates/${id}`))),
  publish: stryMutAct_9fa48("805") ? () => undefined : (stryCov_9fa48("805"), (id: string) => request<AppUpdate>(stryMutAct_9fa48("806") ? "" : (stryCov_9fa48("806"), 'POST'), stryMutAct_9fa48("807") ? `` : (stryCov_9fa48("807"), `api/updates/${id}/publish`), {}))
});

// ---------------------------------------------------------------------------
// Membership
// ---------------------------------------------------------------------------
const membership = stryMutAct_9fa48("808") ? {} : (stryCov_9fa48("808"), {
  get: stryMutAct_9fa48("809") ? () => undefined : (stryCov_9fa48("809"), (userId: string) => request<MembershipSummary>(stryMutAct_9fa48("810") ? "" : (stryCov_9fa48("810"), 'GET'), stryMutAct_9fa48("811") ? `` : (stryCov_9fa48("811"), `api/membership/${userId}`))),
  memberCount: stryMutAct_9fa48("812") ? () => undefined : (stryCov_9fa48("812"), () => request<{
    count: number;
  }>(stryMutAct_9fa48("813") ? "" : (stryCov_9fa48("813"), 'GET'), stryMutAct_9fa48("814") ? "" : (stryCov_9fa48("814"), 'api/membership/member-count'))),
  subscribe: stryMutAct_9fa48("815") ? () => undefined : (stryCov_9fa48("815"), (data: {
    billingPeriod: 'monthly' | 'yearly';
  }) => request<{
    checkoutUrl: string | null;
    sessionId?: string;
    devMode?: boolean;
    alreadyActive?: boolean;
    membership?: MembershipSummary;
  }>(stryMutAct_9fa48("816") ? "" : (stryCov_9fa48("816"), 'POST'), stryMutAct_9fa48("817") ? "" : (stryCov_9fa48("817"), 'api/membership/subscribe'), data)),
  cancel: stryMutAct_9fa48("818") ? () => undefined : (stryCov_9fa48("818"), () => request<{
    success: boolean;
    membership?: MembershipSummary;
  }>(stryMutAct_9fa48("819") ? "" : (stryCov_9fa48("819"), 'POST'), stryMutAct_9fa48("820") ? "" : (stryCov_9fa48("820"), 'api/membership/cancel-subscription')))
});
const wallet = stryMutAct_9fa48("821") ? {} : (stryCov_9fa48("821"), {
  get: stryMutAct_9fa48("822") ? () => undefined : (stryCov_9fa48("822"), (userId: string) => request<WalletSummary>(stryMutAct_9fa48("823") ? "" : (stryCov_9fa48("823"), 'GET'), stryMutAct_9fa48("824") ? `` : (stryCov_9fa48("824"), `api/wallet/${userId}`))),
  transactions: stryMutAct_9fa48("825") ? () => undefined : (stryCov_9fa48("825"), (userId: string) => request<WalletTransaction[]>(stryMutAct_9fa48("826") ? "" : (stryCov_9fa48("826"), 'GET'), stryMutAct_9fa48("827") ? `` : (stryCov_9fa48("827"), `api/transactions/${userId}`))),
  topup: stryMutAct_9fa48("828") ? () => undefined : (stryCov_9fa48("828"), (userId: string, amount: number) => request<WalletSummary>(stryMutAct_9fa48("829") ? "" : (stryCov_9fa48("829"), 'POST'), stryMutAct_9fa48("830") ? `` : (stryCov_9fa48("830"), `api/wallet/${userId}/topup`), stryMutAct_9fa48("831") ? {} : (stryCov_9fa48("831"), {
    amount
  }))),
  businessCardApple: stryMutAct_9fa48("832") ? () => undefined : (stryCov_9fa48("832"), () => request<WalletPassLinkResponse>(stryMutAct_9fa48("833") ? "" : (stryCov_9fa48("833"), 'GET'), stryMutAct_9fa48("834") ? "" : (stryCov_9fa48("834"), 'api/wallet/business-card/apple'))),
  businessCardGoogle: stryMutAct_9fa48("835") ? () => undefined : (stryCov_9fa48("835"), () => request<WalletPassLinkResponse>(stryMutAct_9fa48("836") ? "" : (stryCov_9fa48("836"), 'GET'), stryMutAct_9fa48("837") ? "" : (stryCov_9fa48("837"), 'api/wallet/business-card/google')))
});
const rewards = stryMutAct_9fa48("838") ? {} : (stryCov_9fa48("838"), {
  get: stryMutAct_9fa48("839") ? () => undefined : (stryCov_9fa48("839"), (userId: string) => request<RewardsSummary>(stryMutAct_9fa48("840") ? "" : (stryCov_9fa48("840"), 'GET'), stryMutAct_9fa48("841") ? `` : (stryCov_9fa48("841"), `api/rewards/${userId}`)))
});

// ---------------------------------------------------------------------------
// Perks
// ---------------------------------------------------------------------------
const perks = stryMutAct_9fa48("842") ? {} : (stryCov_9fa48("842"), {
  list: async (params?: {
    city?: string;
    country?: string;
    category?: string;
    q?: string;
    status?: string;
    pageSize?: number;
  }) => {
    if (stryMutAct_9fa48("843")) {
      {}
    } else {
      stryCov_9fa48("843");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("846") ? params.city : stryMutAct_9fa48("845") ? false : stryMutAct_9fa48("844") ? true : (stryCov_9fa48("844", "845", "846"), params?.city)) qs.set(stryMutAct_9fa48("847") ? "" : (stryCov_9fa48("847"), 'city'), params.city);
      if (stryMutAct_9fa48("850") ? params.country : stryMutAct_9fa48("849") ? false : stryMutAct_9fa48("848") ? true : (stryCov_9fa48("848", "849", "850"), params?.country)) qs.set(stryMutAct_9fa48("851") ? "" : (stryCov_9fa48("851"), 'country'), params.country);
      if (stryMutAct_9fa48("854") ? params.category : stryMutAct_9fa48("853") ? false : stryMutAct_9fa48("852") ? true : (stryCov_9fa48("852", "853", "854"), params?.category)) qs.set(stryMutAct_9fa48("855") ? "" : (stryCov_9fa48("855"), 'category'), params.category);
      if (stryMutAct_9fa48("858") ? params.q : stryMutAct_9fa48("857") ? false : stryMutAct_9fa48("856") ? true : (stryCov_9fa48("856", "857", "858"), params?.q)) qs.set(stryMutAct_9fa48("859") ? "" : (stryCov_9fa48("859"), 'q'), params.q);
      if (stryMutAct_9fa48("862") ? params.status : stryMutAct_9fa48("861") ? false : stryMutAct_9fa48("860") ? true : (stryCov_9fa48("860", "861", "862"), params?.status)) qs.set(stryMutAct_9fa48("863") ? "" : (stryCov_9fa48("863"), 'status'), params.status);
      if (stryMutAct_9fa48("866") ? params?.pageSize == null : stryMutAct_9fa48("865") ? false : stryMutAct_9fa48("864") ? true : (stryCov_9fa48("864", "865", "866"), (stryMutAct_9fa48("867") ? params.pageSize : (stryCov_9fa48("867"), params?.pageSize)) != null)) qs.set(stryMutAct_9fa48("868") ? "" : (stryCov_9fa48("868"), 'pageSize'), String(params.pageSize));
      const query = qs.toString();
      const res = await request<PerkData[] | {
        perks: PerkData[];
      }>(stryMutAct_9fa48("869") ? "" : (stryCov_9fa48("869"), 'GET'), stryMutAct_9fa48("870") ? `` : (stryCov_9fa48("870"), `api/perks${query ? stryMutAct_9fa48("871") ? `` : (stryCov_9fa48("871"), `?${query}`) : stryMutAct_9fa48("872") ? "Stryker was here!" : (stryCov_9fa48("872"), '')}`));
      return Array.isArray(res) ? res : stryMutAct_9fa48("875") ? (res as {
        perks: PerkData[];
      }).perks && [] : stryMutAct_9fa48("874") ? false : stryMutAct_9fa48("873") ? true : (stryCov_9fa48("873", "874", "875"), (res as {
        perks: PerkData[];
      }).perks || (stryMutAct_9fa48("876") ? ["Stryker was here"] : (stryCov_9fa48("876"), [])));
    }
  },
  get: stryMutAct_9fa48("877") ? () => undefined : (stryCov_9fa48("877"), (id: string) => request<PerkData>(stryMutAct_9fa48("878") ? "" : (stryCov_9fa48("878"), 'GET'), stryMutAct_9fa48("879") ? `` : (stryCov_9fa48("879"), `api/perks/${id}`))),
  create: stryMutAct_9fa48("880") ? () => undefined : (stryCov_9fa48("880"), (data: Record<string, unknown>) => request<PerkData>(stryMutAct_9fa48("881") ? "" : (stryCov_9fa48("881"), 'POST'), stryMutAct_9fa48("882") ? "" : (stryCov_9fa48("882"), 'api/perks'), data)),
  redeem: stryMutAct_9fa48("883") ? () => undefined : (stryCov_9fa48("883"), (id: string) => request<{
    success: boolean;
    redemption?: Record<string, unknown>;
  }>(stryMutAct_9fa48("884") ? "" : (stryCov_9fa48("884"), 'POST'), stryMutAct_9fa48("885") ? `` : (stryCov_9fa48("885"), `api/perks/${id}/redeem`))),
  redemptions: stryMutAct_9fa48("886") ? () => undefined : (stryCov_9fa48("886"), () => request<{
    redemptions: {
      id: string;
      perkId: string;
      userId: string;
      redeemedAt: string;
      status?: string;
    }[];
  }>(stryMutAct_9fa48("887") ? "" : (stryCov_9fa48("887"), 'GET'), stryMutAct_9fa48("888") ? "" : (stryCov_9fa48("888"), 'api/redemptions'))),
  update: stryMutAct_9fa48("889") ? () => undefined : (stryCov_9fa48("889"), (id: string, data: Partial<PerkData>) => request<PerkData>(stryMutAct_9fa48("890") ? "" : (stryCov_9fa48("890"), 'PUT'), stryMutAct_9fa48("891") ? `` : (stryCov_9fa48("891"), `api/perks/${id}`), data)),
  remove: stryMutAct_9fa48("892") ? () => undefined : (stryCov_9fa48("892"), (id: string) => request<{
    success: boolean;
  }>(stryMutAct_9fa48("893") ? "" : (stryCov_9fa48("893"), 'DELETE'), stryMutAct_9fa48("894") ? `` : (stryCov_9fa48("894"), `api/perks/${id}`)))
});
const media = stryMutAct_9fa48("895") ? {} : (stryCov_9fa48("895"), {
  attach: stryMutAct_9fa48("896") ? () => undefined : (stryCov_9fa48("896"), (data: {
    targetType: string;
    targetId: string;
    imageUrl: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
  }) => request<{
    success?: boolean;
    id?: string;
  }>(stryMutAct_9fa48("897") ? "" : (stryCov_9fa48("897"), 'POST'), stryMutAct_9fa48("898") ? "" : (stryCov_9fa48("898"), 'api/media/attach'), data))
});
const paymentMethods = stryMutAct_9fa48("899") ? {} : (stryCov_9fa48("899"), {
  create: stryMutAct_9fa48("900") ? () => undefined : (stryCov_9fa48("900"), (data: Record<string, unknown>) => request<{
    success?: boolean;
    id?: string;
  }>(stryMutAct_9fa48("901") ? "" : (stryCov_9fa48("901"), 'POST'), stryMutAct_9fa48("902") ? "" : (stryCov_9fa48("902"), 'api/payment-methods'), data)),
  remove: stryMutAct_9fa48("903") ? () => undefined : (stryCov_9fa48("903"), (id: string) => request<{
    success?: boolean;
  }>(stryMutAct_9fa48("904") ? "" : (stryCov_9fa48("904"), 'DELETE'), stryMutAct_9fa48("905") ? `` : (stryCov_9fa48("905"), `api/payment-methods/${id}`))),
  setDefault: stryMutAct_9fa48("906") ? () => undefined : (stryCov_9fa48("906"), (userId: string, methodId: string) => request<{
    success?: boolean;
  }>(stryMutAct_9fa48("907") ? "" : (stryCov_9fa48("907"), 'PUT'), stryMutAct_9fa48("908") ? `` : (stryCov_9fa48("908"), `api/payment-methods/${userId}/default/${methodId}`)))
});
const rollout = stryMutAct_9fa48("909") ? {} : (stryCov_9fa48("909"), {
  config: stryMutAct_9fa48("910") ? () => undefined : (stryCov_9fa48("910"), () => request<{
    phase: string;
    features: Record<string, boolean>;
  }>(stryMutAct_9fa48("911") ? "" : (stryCov_9fa48("911"), 'GET'), stryMutAct_9fa48("912") ? "" : (stryCov_9fa48("912"), 'api/rollout/config')))
});

// ---------------------------------------------------------------------------
// Temporarily Mocked namespaces (for preventing crashes on missing routes)
// ---------------------------------------------------------------------------
const rsvps = stryMutAct_9fa48("913") ? {} : (stryCov_9fa48("913"), {
  listForUser: stryMutAct_9fa48("914") ? () => undefined : (stryCov_9fa48("914"), async (userId: string) => stryMutAct_9fa48("915") ? ["Stryker was here"] : (stryCov_9fa48("915"), []))
});
const likes = stryMutAct_9fa48("916") ? {} : (stryCov_9fa48("916"), {
  listForUser: stryMutAct_9fa48("917") ? () => undefined : (stryCov_9fa48("917"), async (userId: string) => stryMutAct_9fa48("918") ? ["Stryker was here"] : (stryCov_9fa48("918"), []))
});
const interests = stryMutAct_9fa48("919") ? {} : (stryCov_9fa48("919"), {
  listForUser: stryMutAct_9fa48("920") ? () => undefined : (stryCov_9fa48("920"), async (userId: string) => stryMutAct_9fa48("921") ? ["Stryker was here"] : (stryCov_9fa48("921"), []))
});

// ---------------------------------------------------------------------------
// Profiles (artist / business / venue / community directory)
// ---------------------------------------------------------------------------
const profiles = stryMutAct_9fa48("922") ? {} : (stryCov_9fa48("922"), {
  list: async (params?: {
    entityType?: string;
    city?: string;
    country?: string;
    search?: string;
    pageSize?: number;
  }) => {
    if (stryMutAct_9fa48("923")) {
      {}
    } else {
      stryCov_9fa48("923");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("926") ? params.entityType : stryMutAct_9fa48("925") ? false : stryMutAct_9fa48("924") ? true : (stryCov_9fa48("924", "925", "926"), params?.entityType)) qs.set(stryMutAct_9fa48("927") ? "" : (stryCov_9fa48("927"), 'entityType'), params.entityType);
      if (stryMutAct_9fa48("930") ? params.city : stryMutAct_9fa48("929") ? false : stryMutAct_9fa48("928") ? true : (stryCov_9fa48("928", "929", "930"), params?.city)) qs.set(stryMutAct_9fa48("931") ? "" : (stryCov_9fa48("931"), 'city'), params.city);
      if (stryMutAct_9fa48("934") ? params.country : stryMutAct_9fa48("933") ? false : stryMutAct_9fa48("932") ? true : (stryCov_9fa48("932", "933", "934"), params?.country)) qs.set(stryMutAct_9fa48("935") ? "" : (stryCov_9fa48("935"), 'country'), params.country);
      if (stryMutAct_9fa48("938") ? params.search : stryMutAct_9fa48("937") ? false : stryMutAct_9fa48("936") ? true : (stryCov_9fa48("936", "937", "938"), params?.search)) qs.set(stryMutAct_9fa48("939") ? "" : (stryCov_9fa48("939"), 'search'), params.search);
      if (stryMutAct_9fa48("942") ? params?.pageSize == null : stryMutAct_9fa48("941") ? false : stryMutAct_9fa48("940") ? true : (stryCov_9fa48("940", "941", "942"), (stryMutAct_9fa48("943") ? params.pageSize : (stryCov_9fa48("943"), params?.pageSize)) != null)) qs.set(stryMutAct_9fa48("944") ? "" : (stryCov_9fa48("944"), 'pageSize'), String(params.pageSize));
      const q = qs.toString();
      const res = await request<{
        profiles: Profile[];
      }>(stryMutAct_9fa48("945") ? "" : (stryCov_9fa48("945"), 'GET'), stryMutAct_9fa48("946") ? `` : (stryCov_9fa48("946"), `api/profiles${q ? stryMutAct_9fa48("947") ? `` : (stryCov_9fa48("947"), `?${q}`) : stryMutAct_9fa48("948") ? "Stryker was here!" : (stryCov_9fa48("948"), '')}`));
      return stryMutAct_9fa48("949") ? res.profiles && [] : (stryCov_9fa48("949"), res.profiles ?? (stryMutAct_9fa48("950") ? ["Stryker was here"] : (stryCov_9fa48("950"), [])));
    }
  },
  get: stryMutAct_9fa48("951") ? () => undefined : (stryCov_9fa48("951"), (id: string) => request<Profile>(stryMutAct_9fa48("952") ? "" : (stryCov_9fa48("952"), 'GET'), stryMutAct_9fa48("953") ? `` : (stryCov_9fa48("953"), `api/profiles/${id}`))),
  my: async (params?: {
    entityType?: string;
  }) => {
    if (stryMutAct_9fa48("954")) {
      {}
    } else {
      stryCov_9fa48("954");
      const res = await request<{
        profiles: Profile[];
      }>(stryMutAct_9fa48("955") ? "" : (stryCov_9fa48("955"), 'GET'), stryMutAct_9fa48("956") ? "" : (stryCov_9fa48("956"), 'api/profiles/my'));
      let list = stryMutAct_9fa48("957") ? res.profiles && [] : (stryCov_9fa48("957"), res.profiles ?? (stryMutAct_9fa48("958") ? ["Stryker was here"] : (stryCov_9fa48("958"), [])));
      if (stryMutAct_9fa48("961") ? params.entityType : stryMutAct_9fa48("960") ? false : stryMutAct_9fa48("959") ? true : (stryCov_9fa48("959", "960", "961"), params?.entityType)) {
        if (stryMutAct_9fa48("962")) {
          {}
        } else {
          stryCov_9fa48("962");
          list = stryMutAct_9fa48("963") ? list : (stryCov_9fa48("963"), list.filter(stryMutAct_9fa48("964") ? () => undefined : (stryCov_9fa48("964"), p => stryMutAct_9fa48("967") ? p.entityType !== params.entityType : stryMutAct_9fa48("966") ? false : stryMutAct_9fa48("965") ? true : (stryCov_9fa48("965", "966", "967"), p.entityType === params.entityType))));
        }
      }
      return list;
    }
  },
  create: stryMutAct_9fa48("968") ? () => undefined : (stryCov_9fa48("968"), (payload: Partial<Profile>) => request<Profile>(stryMutAct_9fa48("969") ? "" : (stryCov_9fa48("969"), 'POST'), stryMutAct_9fa48("970") ? "" : (stryCov_9fa48("970"), 'api/profiles'), payload)),
  update: stryMutAct_9fa48("971") ? () => undefined : (stryCov_9fa48("971"), (id: string, payload: Record<string, unknown>) => request<Profile>(stryMutAct_9fa48("972") ? "" : (stryCov_9fa48("972"), 'PUT'), stryMutAct_9fa48("973") ? `` : (stryCov_9fa48("973"), `api/profiles/${id}`), payload)),
  remove: stryMutAct_9fa48("974") ? () => undefined : (stryCov_9fa48("974"), (id: string) => request<{
    success: boolean;
  }>(stryMutAct_9fa48("975") ? "" : (stryCov_9fa48("975"), 'DELETE'), stryMutAct_9fa48("976") ? `` : (stryCov_9fa48("976"), `api/profiles/${id}`)))
});

// ---------------------------------------------------------------------------
// Communities
// ---------------------------------------------------------------------------
const communities = stryMutAct_9fa48("977") ? {} : (stryCov_9fa48("977"), {
  list: async (params?: {
    city?: string;
    country?: string;
    nationalityId?: string;
    cultureId?: string;
  }) => {
    if (stryMutAct_9fa48("978")) {
      {}
    } else {
      stryCov_9fa48("978");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("981") ? params.city : stryMutAct_9fa48("980") ? false : stryMutAct_9fa48("979") ? true : (stryCov_9fa48("979", "980", "981"), params?.city)) qs.set(stryMutAct_9fa48("982") ? "" : (stryCov_9fa48("982"), 'city'), params.city);
      if (stryMutAct_9fa48("985") ? params.country : stryMutAct_9fa48("984") ? false : stryMutAct_9fa48("983") ? true : (stryCov_9fa48("983", "984", "985"), params?.country)) qs.set(stryMutAct_9fa48("986") ? "" : (stryCov_9fa48("986"), 'country'), params.country);
      if (stryMutAct_9fa48("989") ? params.nationalityId : stryMutAct_9fa48("988") ? false : stryMutAct_9fa48("987") ? true : (stryCov_9fa48("987", "988", "989"), params?.nationalityId)) qs.set(stryMutAct_9fa48("990") ? "" : (stryCov_9fa48("990"), 'nationalityId'), params.nationalityId);
      if (stryMutAct_9fa48("993") ? params.cultureId : stryMutAct_9fa48("992") ? false : stryMutAct_9fa48("991") ? true : (stryCov_9fa48("991", "992", "993"), params?.cultureId)) qs.set(stryMutAct_9fa48("994") ? "" : (stryCov_9fa48("994"), 'cultureId'), params.cultureId);
      const q = qs.toString();
      const res = await request<Community[] | {
        communities: Community[];
      }>(stryMutAct_9fa48("995") ? "" : (stryCov_9fa48("995"), 'GET'), stryMutAct_9fa48("996") ? `` : (stryCov_9fa48("996"), `api/communities${q ? stryMutAct_9fa48("997") ? `` : (stryCov_9fa48("997"), `?${q}`) : stryMutAct_9fa48("998") ? "Stryker was here!" : (stryCov_9fa48("998"), '')}`));
      if (stryMutAct_9fa48("1000") ? false : stryMutAct_9fa48("999") ? true : (stryCov_9fa48("999", "1000"), Array.isArray(res))) return res;
      return stryMutAct_9fa48("1001") ? (res as {
        communities: Community[];
      }).communities && [] : (stryCov_9fa48("1001"), (res as {
        communities: Community[];
      }).communities ?? (stryMutAct_9fa48("1002") ? ["Stryker was here"] : (stryCov_9fa48("1002"), [])));
    }
  },
  get: stryMutAct_9fa48("1003") ? () => undefined : (stryCov_9fa48("1003"), (id: string) => request<Community>(stryMutAct_9fa48("1004") ? "" : (stryCov_9fa48("1004"), 'GET'), stryMutAct_9fa48("1005") ? `` : (stryCov_9fa48("1005"), `api/communities/${id}`))),
  join: stryMutAct_9fa48("1006") ? () => undefined : (stryCov_9fa48("1006"), (id: string) => request<{
    success: boolean;
    communityId: string;
  }>(stryMutAct_9fa48("1007") ? "" : (stryCov_9fa48("1007"), 'POST'), stryMutAct_9fa48("1008") ? `` : (stryCov_9fa48("1008"), `api/communities/${id}/join`))),
  leave: stryMutAct_9fa48("1009") ? () => undefined : (stryCov_9fa48("1009"), (id: string) => request<{
    success: boolean;
  }>(stryMutAct_9fa48("1010") ? "" : (stryCov_9fa48("1010"), 'DELETE'), stryMutAct_9fa48("1011") ? `` : (stryCov_9fa48("1011"), `api/communities/${id}/leave`))),
  joined: stryMutAct_9fa48("1012") ? () => undefined : (stryCov_9fa48("1012"), () => request<{
    communityIds: string[];
  }>(stryMutAct_9fa48("1013") ? "" : (stryCov_9fa48("1013"), 'GET'), stryMutAct_9fa48("1014") ? "" : (stryCov_9fa48("1014"), 'api/communities/joined'))),
  create: stryMutAct_9fa48("1015") ? () => undefined : (stryCov_9fa48("1015"), (data: {
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
  }) => request<{
    community: Community;
  }>(stryMutAct_9fa48("1016") ? "" : (stryCov_9fa48("1016"), 'POST'), stryMutAct_9fa48("1017") ? "" : (stryCov_9fa48("1017"), 'api/communities'), data).then(stryMutAct_9fa48("1018") ? () => undefined : (stryCov_9fa48("1018"), r => r.community))),
  update: stryMutAct_9fa48("1019") ? () => undefined : (stryCov_9fa48("1019"), (id: string, data: Partial<Community>) => request<Community>(stryMutAct_9fa48("1020") ? "" : (stryCov_9fa48("1020"), 'PUT'), stryMutAct_9fa48("1021") ? `` : (stryCov_9fa48("1021"), `api/communities/${id}`), data)),
  remove: stryMutAct_9fa48("1022") ? () => undefined : (stryCov_9fa48("1022"), (id: string) => request<{
    success: boolean;
  }>(stryMutAct_9fa48("1023") ? "" : (stryCov_9fa48("1023"), 'DELETE'), stryMutAct_9fa48("1024") ? `` : (stryCov_9fa48("1024"), `api/communities/${id}`)))
});

// ---------------------------------------------------------------------------
// Privacy settings
// ---------------------------------------------------------------------------
const privacy = stryMutAct_9fa48("1025") ? {} : (stryCov_9fa48("1025"), {
  get: stryMutAct_9fa48("1026") ? () => undefined : (stryCov_9fa48("1026"), () => request<PrivacySettings>(stryMutAct_9fa48("1027") ? "" : (stryCov_9fa48("1027"), 'GET'), stryMutAct_9fa48("1028") ? "" : (stryCov_9fa48("1028"), 'api/privacy/settings'))),
  update: stryMutAct_9fa48("1029") ? () => undefined : (stryCov_9fa48("1029"), (data: Partial<PrivacySettings>) => request<PrivacySettings>(stryMutAct_9fa48("1030") ? "" : (stryCov_9fa48("1030"), 'PUT'), stryMutAct_9fa48("1031") ? "" : (stryCov_9fa48("1031"), 'api/privacy/settings'), data))
});

// ---------------------------------------------------------------------------
// Account management
// ---------------------------------------------------------------------------
const account = stryMutAct_9fa48("1032") ? {} : (stryCov_9fa48("1032"), {
  delete: stryMutAct_9fa48("1033") ? () => undefined : (stryCov_9fa48("1033"), () => request<{
    success: boolean;
  }>(stryMutAct_9fa48("1034") ? "" : (stryCov_9fa48("1034"), 'DELETE'), stryMutAct_9fa48("1035") ? "" : (stryCov_9fa48("1035"), 'api/account')))
});

// ---------------------------------------------------------------------------
// Directory — restaurants, shopping, movies, activities, businesses
// All follow the same list + get pattern
// ---------------------------------------------------------------------------
function directoryNamespace<T = Profile>(basePath: string) {
  if (stryMutAct_9fa48("1036")) {
    {}
  } else {
    stryCov_9fa48("1036");
    return stryMutAct_9fa48("1037") ? {} : (stryCov_9fa48("1037"), {
      list: (params?: Record<string, string>) => {
        if (stryMutAct_9fa48("1038")) {
          {}
        } else {
          stryCov_9fa48("1038");
          const qs = params ? new URLSearchParams(params).toString() : stryMutAct_9fa48("1039") ? "Stryker was here!" : (stryCov_9fa48("1039"), '');
          return request<T[]>(stryMutAct_9fa48("1040") ? "" : (stryCov_9fa48("1040"), 'GET'), stryMutAct_9fa48("1041") ? `` : (stryCov_9fa48("1041"), `${basePath}${qs ? stryMutAct_9fa48("1042") ? `` : (stryCov_9fa48("1042"), `?${qs}`) : stryMutAct_9fa48("1043") ? "Stryker was here!" : (stryCov_9fa48("1043"), '')}`));
        }
      },
      get: stryMutAct_9fa48("1044") ? () => undefined : (stryCov_9fa48("1044"), (id: string) => request<T>(stryMutAct_9fa48("1045") ? "" : (stryCov_9fa48("1045"), 'GET'), stryMutAct_9fa48("1046") ? `` : (stryCov_9fa48("1046"), `${basePath}/${id}`)))
    });
  }
}
const restaurants = stryMutAct_9fa48("1047") ? {} : (stryCov_9fa48("1047"), {
  list: (params?: {
    city?: string;
    country?: string;
    cuisine?: string;
  }) => {
    if (stryMutAct_9fa48("1048")) {
      {}
    } else {
      stryCov_9fa48("1048");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("1051") ? params.city : stryMutAct_9fa48("1050") ? false : stryMutAct_9fa48("1049") ? true : (stryCov_9fa48("1049", "1050", "1051"), params?.city)) qs.set(stryMutAct_9fa48("1052") ? "" : (stryCov_9fa48("1052"), 'city'), params.city);
      if (stryMutAct_9fa48("1055") ? params.country : stryMutAct_9fa48("1054") ? false : stryMutAct_9fa48("1053") ? true : (stryCov_9fa48("1053", "1054", "1055"), params?.country)) qs.set(stryMutAct_9fa48("1056") ? "" : (stryCov_9fa48("1056"), 'country'), params.country);
      if (stryMutAct_9fa48("1059") ? params.cuisine : stryMutAct_9fa48("1058") ? false : stryMutAct_9fa48("1057") ? true : (stryCov_9fa48("1057", "1058", "1059"), params?.cuisine)) qs.set(stryMutAct_9fa48("1060") ? "" : (stryCov_9fa48("1060"), 'cuisine'), params.cuisine);
      const q = qs.toString();
      return request<import('@shared/schema').RestaurantData[]>(stryMutAct_9fa48("1061") ? "" : (stryCov_9fa48("1061"), 'GET'), stryMutAct_9fa48("1062") ? `` : (stryCov_9fa48("1062"), `api/restaurants${q ? stryMutAct_9fa48("1063") ? `` : (stryCov_9fa48("1063"), `?${q}`) : stryMutAct_9fa48("1064") ? "Stryker was here!" : (stryCov_9fa48("1064"), '')}`));
    }
  },
  get: stryMutAct_9fa48("1065") ? () => undefined : (stryCov_9fa48("1065"), (id: string) => request<import('@shared/schema').RestaurantData>(stryMutAct_9fa48("1066") ? "" : (stryCov_9fa48("1066"), 'GET'), stryMutAct_9fa48("1067") ? `` : (stryCov_9fa48("1067"), `api/restaurants/${id}`))),
  create: stryMutAct_9fa48("1068") ? () => undefined : (stryCov_9fa48("1068"), (payload: import('@shared/schema').RestaurantInput) => request<import('@shared/schema').RestaurantData>(stryMutAct_9fa48("1069") ? "" : (stryCov_9fa48("1069"), 'POST'), stryMutAct_9fa48("1070") ? "" : (stryCov_9fa48("1070"), 'api/restaurants'), payload)),
  update: stryMutAct_9fa48("1071") ? () => undefined : (stryCov_9fa48("1071"), (id: string, payload: Partial<import('@shared/schema').RestaurantInput>) => request<import('@shared/schema').RestaurantData>(stryMutAct_9fa48("1072") ? "" : (stryCov_9fa48("1072"), 'PUT'), stryMutAct_9fa48("1073") ? `` : (stryCov_9fa48("1073"), `api/restaurants/${id}`), payload)),
  remove: stryMutAct_9fa48("1074") ? () => undefined : (stryCov_9fa48("1074"), (id: string) => request<{
    success: boolean;
  }>(stryMutAct_9fa48("1075") ? "" : (stryCov_9fa48("1075"), 'DELETE'), stryMutAct_9fa48("1076") ? `` : (stryCov_9fa48("1076"), `api/restaurants/${id}`))),
  setPromoted: stryMutAct_9fa48("1077") ? () => undefined : (stryCov_9fa48("1077"), (id: string, isPromoted: boolean) => request<import('@shared/schema').RestaurantData>(stryMutAct_9fa48("1078") ? "" : (stryCov_9fa48("1078"), 'POST'), stryMutAct_9fa48("1079") ? `` : (stryCov_9fa48("1079"), `api/restaurants/${id}/promote`), stryMutAct_9fa48("1080") ? {} : (stryCov_9fa48("1080"), {
    isPromoted
  })))
});
const shopping = stryMutAct_9fa48("1081") ? {} : (stryCov_9fa48("1081"), {
  list: (params?: {
    city?: string;
    country?: string;
    category?: string;
  }) => {
    if (stryMutAct_9fa48("1082")) {
      {}
    } else {
      stryCov_9fa48("1082");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("1085") ? params.city : stryMutAct_9fa48("1084") ? false : stryMutAct_9fa48("1083") ? true : (stryCov_9fa48("1083", "1084", "1085"), params?.city)) qs.set(stryMutAct_9fa48("1086") ? "" : (stryCov_9fa48("1086"), 'city'), params.city);
      if (stryMutAct_9fa48("1089") ? params.country : stryMutAct_9fa48("1088") ? false : stryMutAct_9fa48("1087") ? true : (stryCov_9fa48("1087", "1088", "1089"), params?.country)) qs.set(stryMutAct_9fa48("1090") ? "" : (stryCov_9fa48("1090"), 'country'), params.country);
      if (stryMutAct_9fa48("1093") ? params.category : stryMutAct_9fa48("1092") ? false : stryMutAct_9fa48("1091") ? true : (stryCov_9fa48("1091", "1092", "1093"), params?.category)) qs.set(stryMutAct_9fa48("1094") ? "" : (stryCov_9fa48("1094"), 'category'), params.category);
      const q = qs.toString();
      return request<import('@shared/schema').ShopData[]>(stryMutAct_9fa48("1095") ? "" : (stryCov_9fa48("1095"), 'GET'), stryMutAct_9fa48("1096") ? `` : (stryCov_9fa48("1096"), `api/shopping${q ? stryMutAct_9fa48("1097") ? `` : (stryCov_9fa48("1097"), `?${q}`) : stryMutAct_9fa48("1098") ? "Stryker was here!" : (stryCov_9fa48("1098"), '')}`));
    }
  },
  get: stryMutAct_9fa48("1099") ? () => undefined : (stryCov_9fa48("1099"), (id: string) => request<import('@shared/schema').ShopData>(stryMutAct_9fa48("1100") ? "" : (stryCov_9fa48("1100"), 'GET'), stryMutAct_9fa48("1101") ? `` : (stryCov_9fa48("1101"), `api/shopping/${id}`))),
  create: stryMutAct_9fa48("1102") ? () => undefined : (stryCov_9fa48("1102"), (payload: import('@shared/schema').ShopInput) => request<import('@shared/schema').ShopData>(stryMutAct_9fa48("1103") ? "" : (stryCov_9fa48("1103"), 'POST'), stryMutAct_9fa48("1104") ? "" : (stryCov_9fa48("1104"), 'api/shopping'), payload)),
  update: stryMutAct_9fa48("1105") ? () => undefined : (stryCov_9fa48("1105"), (id: string, payload: Partial<import('@shared/schema').ShopInput>) => request<import('@shared/schema').ShopData>(stryMutAct_9fa48("1106") ? "" : (stryCov_9fa48("1106"), 'PUT'), stryMutAct_9fa48("1107") ? `` : (stryCov_9fa48("1107"), `api/shopping/${id}`), payload)),
  remove: stryMutAct_9fa48("1108") ? () => undefined : (stryCov_9fa48("1108"), (id: string) => request<{
    success: boolean;
  }>(stryMutAct_9fa48("1109") ? "" : (stryCov_9fa48("1109"), 'DELETE'), stryMutAct_9fa48("1110") ? `` : (stryCov_9fa48("1110"), `api/shopping/${id}`))),
  setPromoted: stryMutAct_9fa48("1111") ? () => undefined : (stryCov_9fa48("1111"), (id: string, isPromoted: boolean) => request<import('@shared/schema').ShopData>(stryMutAct_9fa48("1112") ? "" : (stryCov_9fa48("1112"), 'POST'), stryMutAct_9fa48("1113") ? `` : (stryCov_9fa48("1113"), `api/shopping/${id}/promote`), stryMutAct_9fa48("1114") ? {} : (stryCov_9fa48("1114"), {
    isPromoted
  })))
});
const movies = stryMutAct_9fa48("1115") ? {} : (stryCov_9fa48("1115"), {
  list: (params?: Record<string, string>) => {
    if (stryMutAct_9fa48("1116")) {
      {}
    } else {
      stryCov_9fa48("1116");
      const qs = params ? new URLSearchParams(params).toString() : stryMutAct_9fa48("1117") ? "Stryker was here!" : (stryCov_9fa48("1117"), '');
      return request<import('@shared/schema').MovieData[]>(stryMutAct_9fa48("1118") ? "" : (stryCov_9fa48("1118"), 'GET'), stryMutAct_9fa48("1119") ? `` : (stryCov_9fa48("1119"), `api/movies${qs ? stryMutAct_9fa48("1120") ? `` : (stryCov_9fa48("1120"), `?${qs}`) : stryMutAct_9fa48("1121") ? "Stryker was here!" : (stryCov_9fa48("1121"), '')}`));
    }
  },
  get: stryMutAct_9fa48("1122") ? () => undefined : (stryCov_9fa48("1122"), (id: string) => request<import('@shared/schema').MovieData>(stryMutAct_9fa48("1123") ? "" : (stryCov_9fa48("1123"), 'GET'), stryMutAct_9fa48("1124") ? `` : (stryCov_9fa48("1124"), `api/movies/${id}`))),
  create: stryMutAct_9fa48("1125") ? () => undefined : (stryCov_9fa48("1125"), (payload: import('@shared/schema').MovieInput) => request<import('@shared/schema').MovieData>(stryMutAct_9fa48("1126") ? "" : (stryCov_9fa48("1126"), 'POST'), stryMutAct_9fa48("1127") ? "" : (stryCov_9fa48("1127"), 'api/movies'), payload)),
  update: stryMutAct_9fa48("1128") ? () => undefined : (stryCov_9fa48("1128"), (id: string, payload: Partial<import('@shared/schema').MovieInput>) => request<import('@shared/schema').MovieData>(stryMutAct_9fa48("1129") ? "" : (stryCov_9fa48("1129"), 'PUT'), stryMutAct_9fa48("1130") ? `` : (stryCov_9fa48("1130"), `api/movies/${id}`), payload)),
  remove: stryMutAct_9fa48("1131") ? () => undefined : (stryCov_9fa48("1131"), (id: string) => request<{
    success: boolean;
  }>(stryMutAct_9fa48("1132") ? "" : (stryCov_9fa48("1132"), 'DELETE'), stryMutAct_9fa48("1133") ? `` : (stryCov_9fa48("1133"), `api/movies/${id}`)))
});
const activities = stryMutAct_9fa48("1134") ? {} : (stryCov_9fa48("1134"), {
  list: async (params?: {
    city?: string;
    country?: string;
    category?: string;
    ownerId?: string;
    promoted?: boolean;
  }) => {
    if (stryMutAct_9fa48("1135")) {
      {}
    } else {
      stryCov_9fa48("1135");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("1138") ? params.city : stryMutAct_9fa48("1137") ? false : stryMutAct_9fa48("1136") ? true : (stryCov_9fa48("1136", "1137", "1138"), params?.city)) qs.set(stryMutAct_9fa48("1139") ? "" : (stryCov_9fa48("1139"), 'city'), params.city);
      if (stryMutAct_9fa48("1142") ? params.country : stryMutAct_9fa48("1141") ? false : stryMutAct_9fa48("1140") ? true : (stryCov_9fa48("1140", "1141", "1142"), params?.country)) qs.set(stryMutAct_9fa48("1143") ? "" : (stryCov_9fa48("1143"), 'country'), params.country);
      if (stryMutAct_9fa48("1146") ? params.category : stryMutAct_9fa48("1145") ? false : stryMutAct_9fa48("1144") ? true : (stryCov_9fa48("1144", "1145", "1146"), params?.category)) qs.set(stryMutAct_9fa48("1147") ? "" : (stryCov_9fa48("1147"), 'category'), params.category);
      if (stryMutAct_9fa48("1150") ? params.ownerId : stryMutAct_9fa48("1149") ? false : stryMutAct_9fa48("1148") ? true : (stryCov_9fa48("1148", "1149", "1150"), params?.ownerId)) qs.set(stryMutAct_9fa48("1151") ? "" : (stryCov_9fa48("1151"), 'ownerId'), params.ownerId);
      if (stryMutAct_9fa48("1154") ? params.promoted : stryMutAct_9fa48("1153") ? false : stryMutAct_9fa48("1152") ? true : (stryCov_9fa48("1152", "1153", "1154"), params?.promoted)) qs.set(stryMutAct_9fa48("1155") ? "" : (stryCov_9fa48("1155"), 'promoted'), stryMutAct_9fa48("1156") ? "" : (stryCov_9fa48("1156"), 'true'));
      const q = qs.toString();
      const res = await request<ActivityData[] | {
        activities: ActivityData[];
      }>(stryMutAct_9fa48("1157") ? "" : (stryCov_9fa48("1157"), 'GET'), stryMutAct_9fa48("1158") ? `` : (stryCov_9fa48("1158"), `api/activities${q ? stryMutAct_9fa48("1159") ? `` : (stryCov_9fa48("1159"), `?${q}`) : stryMutAct_9fa48("1160") ? "Stryker was here!" : (stryCov_9fa48("1160"), '')}`));
      if (stryMutAct_9fa48("1162") ? false : stryMutAct_9fa48("1161") ? true : (stryCov_9fa48("1161", "1162"), Array.isArray(res))) return res;
      return stryMutAct_9fa48("1163") ? (res as {
        activities: ActivityData[];
      }).activities && [] : (stryCov_9fa48("1163"), (res as {
        activities: ActivityData[];
      }).activities ?? (stryMutAct_9fa48("1164") ? ["Stryker was here"] : (stryCov_9fa48("1164"), [])));
    }
  },
  get: stryMutAct_9fa48("1165") ? () => undefined : (stryCov_9fa48("1165"), (id: string) => request<ActivityData>(stryMutAct_9fa48("1166") ? "" : (stryCov_9fa48("1166"), 'GET'), stryMutAct_9fa48("1167") ? `` : (stryCov_9fa48("1167"), `api/activities/${id}`))),
  create: stryMutAct_9fa48("1168") ? () => undefined : (stryCov_9fa48("1168"), (payload: ActivityInput) => request<ActivityData>(stryMutAct_9fa48("1169") ? "" : (stryCov_9fa48("1169"), 'POST'), stryMutAct_9fa48("1170") ? "" : (stryCov_9fa48("1170"), 'api/activities'), payload)),
  update: stryMutAct_9fa48("1171") ? () => undefined : (stryCov_9fa48("1171"), (id: string, payload: Partial<ActivityInput>) => request<ActivityData>(stryMutAct_9fa48("1172") ? "" : (stryCov_9fa48("1172"), 'PUT'), stryMutAct_9fa48("1173") ? `` : (stryCov_9fa48("1173"), `api/activities/${id}`), payload)),
  remove: stryMutAct_9fa48("1174") ? () => undefined : (stryCov_9fa48("1174"), (id: string) => request<{
    success: boolean;
  }>(stryMutAct_9fa48("1175") ? "" : (stryCov_9fa48("1175"), 'DELETE'), stryMutAct_9fa48("1176") ? `` : (stryCov_9fa48("1176"), `api/activities/${id}`))),
  promote: stryMutAct_9fa48("1177") ? () => undefined : (stryCov_9fa48("1177"), (id: string, isPromoted = stryMutAct_9fa48("1178") ? false : (stryCov_9fa48("1178"), true)) => request<ActivityData>(stryMutAct_9fa48("1179") ? "" : (stryCov_9fa48("1179"), 'POST'), stryMutAct_9fa48("1180") ? `` : (stryCov_9fa48("1180"), `api/activities/${id}/promote`), stryMutAct_9fa48("1181") ? {} : (stryCov_9fa48("1181"), {
    isPromoted
  })))
});

/** Phase 5 — unified browse model (deals, menu lines, activities, movie showtimes). */
const offerings = stryMutAct_9fa48("1182") ? {} : (stryCov_9fa48("1182"), {
  list: (params?: {
    city?: string;
    country?: string;
    kinds?: string;
    domains?: string;
    limit?: number;
  }) => {
    if (stryMutAct_9fa48("1183")) {
      {}
    } else {
      stryCov_9fa48("1183");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("1186") ? params.city : stryMutAct_9fa48("1185") ? false : stryMutAct_9fa48("1184") ? true : (stryCov_9fa48("1184", "1185", "1186"), params?.city)) qs.set(stryMutAct_9fa48("1187") ? "" : (stryCov_9fa48("1187"), 'city'), params.city);
      if (stryMutAct_9fa48("1190") ? params.country : stryMutAct_9fa48("1189") ? false : stryMutAct_9fa48("1188") ? true : (stryCov_9fa48("1188", "1189", "1190"), params?.country)) qs.set(stryMutAct_9fa48("1191") ? "" : (stryCov_9fa48("1191"), 'country'), params.country);
      if (stryMutAct_9fa48("1194") ? params.kinds : stryMutAct_9fa48("1193") ? false : stryMutAct_9fa48("1192") ? true : (stryCov_9fa48("1192", "1193", "1194"), params?.kinds)) qs.set(stryMutAct_9fa48("1195") ? "" : (stryCov_9fa48("1195"), 'kinds'), params.kinds);
      if (stryMutAct_9fa48("1198") ? params.domains : stryMutAct_9fa48("1197") ? false : stryMutAct_9fa48("1196") ? true : (stryCov_9fa48("1196", "1197", "1198"), params?.domains)) qs.set(stryMutAct_9fa48("1199") ? "" : (stryCov_9fa48("1199"), 'domains'), params.domains);
      if (stryMutAct_9fa48("1202") ? params?.limit == null : stryMutAct_9fa48("1201") ? false : stryMutAct_9fa48("1200") ? true : (stryCov_9fa48("1200", "1201", "1202"), (stryMutAct_9fa48("1203") ? params.limit : (stryCov_9fa48("1203"), params?.limit)) != null)) qs.set(stryMutAct_9fa48("1204") ? "" : (stryCov_9fa48("1204"), 'limit'), String(params.limit));
      const q = qs.toString();
      return request<{
        offerings: import('@shared/schema').UnifiedOffering[];
        total: number;
      }>(stryMutAct_9fa48("1205") ? "" : (stryCov_9fa48("1205"), 'GET'), stryMutAct_9fa48("1206") ? `` : (stryCov_9fa48("1206"), `api/offerings${q ? stryMutAct_9fa48("1207") ? `` : (stryCov_9fa48("1207"), `?${q}`) : stryMutAct_9fa48("1208") ? "Stryker was here!" : (stryCov_9fa48("1208"), '')}`));
    }
  }
});
const businesses = stryMutAct_9fa48("1209") ? {} : (stryCov_9fa48("1209"), {
  ...directoryNamespace<Profile>(stryMutAct_9fa48("1210") ? "" : (stryCov_9fa48("1210"), 'api/businesses')),
  /** List businesses, optionally filtering by location or sponsored-only */
  list: async (params?: {
    city?: string;
    country?: string;
    sponsored?: boolean;
  }) => {
    if (stryMutAct_9fa48("1211")) {
      {}
    } else {
      stryCov_9fa48("1211");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("1214") ? params.city : stryMutAct_9fa48("1213") ? false : stryMutAct_9fa48("1212") ? true : (stryCov_9fa48("1212", "1213", "1214"), params?.city)) qs.set(stryMutAct_9fa48("1215") ? "" : (stryCov_9fa48("1215"), 'city'), params.city);
      if (stryMutAct_9fa48("1218") ? params.country : stryMutAct_9fa48("1217") ? false : stryMutAct_9fa48("1216") ? true : (stryCov_9fa48("1216", "1217", "1218"), params?.country)) qs.set(stryMutAct_9fa48("1219") ? "" : (stryCov_9fa48("1219"), 'country'), params.country);
      if (stryMutAct_9fa48("1222") ? params.sponsored : stryMutAct_9fa48("1221") ? false : stryMutAct_9fa48("1220") ? true : (stryCov_9fa48("1220", "1221", "1222"), params?.sponsored)) qs.set(stryMutAct_9fa48("1223") ? "" : (stryCov_9fa48("1223"), 'sponsored'), stryMutAct_9fa48("1224") ? "" : (stryCov_9fa48("1224"), 'true'));
      const q = qs.toString();
      const res = await request<{
        businesses: Profile[];
      }>(stryMutAct_9fa48("1225") ? "" : (stryCov_9fa48("1225"), 'GET'), stryMutAct_9fa48("1226") ? `` : (stryCov_9fa48("1226"), `api/businesses${q ? stryMutAct_9fa48("1227") ? `` : (stryCov_9fa48("1227"), `?${q}`) : stryMutAct_9fa48("1228") ? "Stryker was here!" : (stryCov_9fa48("1228"), '')}`));
      return stryMutAct_9fa48("1229") ? res.businesses && [] : (stryCov_9fa48("1229"), res.businesses ?? (stryMutAct_9fa48("1230") ? ["Stryker was here"] : (stryCov_9fa48("1230"), [])));
    }
  }
});
const council = stryMutAct_9fa48("1231") ? {} : (stryCov_9fa48("1231"), {
  /** Browse LGAs for directory / location pickers */
  list: async (params?: {
    q?: string;
    state?: string;
    verificationStatus?: 'verified' | 'unverified';
    sortBy?: 'name' | 'state' | 'verification';
    sortDir?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }) => {
    if (stryMutAct_9fa48("1232")) {
      {}
    } else {
      stryCov_9fa48("1232");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("1235") ? params.q : stryMutAct_9fa48("1234") ? false : stryMutAct_9fa48("1233") ? true : (stryCov_9fa48("1233", "1234", "1235"), params?.q)) qs.set(stryMutAct_9fa48("1236") ? "" : (stryCov_9fa48("1236"), 'q'), params.q);
      if (stryMutAct_9fa48("1239") ? params.state : stryMutAct_9fa48("1238") ? false : stryMutAct_9fa48("1237") ? true : (stryCov_9fa48("1237", "1238", "1239"), params?.state)) qs.set(stryMutAct_9fa48("1240") ? "" : (stryCov_9fa48("1240"), 'state'), params.state);
      if (stryMutAct_9fa48("1243") ? params.verificationStatus : stryMutAct_9fa48("1242") ? false : stryMutAct_9fa48("1241") ? true : (stryCov_9fa48("1241", "1242", "1243"), params?.verificationStatus)) qs.set(stryMutAct_9fa48("1244") ? "" : (stryCov_9fa48("1244"), 'verificationStatus'), params.verificationStatus);
      if (stryMutAct_9fa48("1247") ? params.sortBy : stryMutAct_9fa48("1246") ? false : stryMutAct_9fa48("1245") ? true : (stryCov_9fa48("1245", "1246", "1247"), params?.sortBy)) qs.set(stryMutAct_9fa48("1248") ? "" : (stryCov_9fa48("1248"), 'sortBy'), params.sortBy);
      if (stryMutAct_9fa48("1251") ? params.sortDir : stryMutAct_9fa48("1250") ? false : stryMutAct_9fa48("1249") ? true : (stryCov_9fa48("1249", "1250", "1251"), params?.sortDir)) qs.set(stryMutAct_9fa48("1252") ? "" : (stryCov_9fa48("1252"), 'sortDir'), params.sortDir);
      if (stryMutAct_9fa48("1255") ? params.page : stryMutAct_9fa48("1254") ? false : stryMutAct_9fa48("1253") ? true : (stryCov_9fa48("1253", "1254", "1255"), params?.page)) qs.set(stryMutAct_9fa48("1256") ? "" : (stryCov_9fa48("1256"), 'page'), String(params.page));
      if (stryMutAct_9fa48("1259") ? params.pageSize : stryMutAct_9fa48("1258") ? false : stryMutAct_9fa48("1257") ? true : (stryCov_9fa48("1257", "1258", "1259"), params?.pageSize)) qs.set(stryMutAct_9fa48("1260") ? "" : (stryCov_9fa48("1260"), 'pageSize'), String(params.pageSize));
      const q = qs.toString();
      const res = await request<{
        councils: CouncilData[];
        hasNextPage?: boolean;
        totalCount?: number;
        source?: string;
      } | CouncilData[]>(stryMutAct_9fa48("1261") ? "" : (stryCov_9fa48("1261"), 'GET'), stryMutAct_9fa48("1262") ? `` : (stryCov_9fa48("1262"), `api/council/list${q ? stryMutAct_9fa48("1263") ? `` : (stryCov_9fa48("1263"), `?${q}`) : stryMutAct_9fa48("1264") ? "Stryker was here!" : (stryCov_9fa48("1264"), '')}`));
      return stryMutAct_9fa48("1265") ? {} : (stryCov_9fa48("1265"), {
        councils: Array.isArray(res) ? res : stryMutAct_9fa48("1266") ? (res as {
          councils: CouncilData[];
        }).councils && [] : (stryCov_9fa48("1266"), (res as {
          councils: CouncilData[];
        }).councils ?? (stryMutAct_9fa48("1267") ? ["Stryker was here"] : (stryCov_9fa48("1267"), []))),
        hasNextPage: stryMutAct_9fa48("1268") ? !(res as {
          hasNextPage?: boolean;
        }).hasNextPage : (stryCov_9fa48("1268"), !(stryMutAct_9fa48("1269") ? (res as {
          hasNextPage?: boolean;
        }).hasNextPage : (stryCov_9fa48("1269"), !(res as {
          hasNextPage?: boolean;
        }).hasNextPage))),
        totalCount: stryMutAct_9fa48("1270") ? (res as {
          totalCount?: number;
        }).totalCount && 0 : (stryCov_9fa48("1270"), (res as {
          totalCount?: number;
        }).totalCount ?? 0),
        source: (res as {
          source?: string;
        }).source
      });
    }
  },
  /** Public: best LGA match for a place (e.g. business detail) */
  resolve: async (params?: {
    city?: string;
    state?: string;
    country?: string;
  }) => {
    if (stryMutAct_9fa48("1271")) {
      {}
    } else {
      stryCov_9fa48("1271");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("1274") ? params.city : stryMutAct_9fa48("1273") ? false : stryMutAct_9fa48("1272") ? true : (stryCov_9fa48("1272", "1273", "1274"), params?.city)) qs.set(stryMutAct_9fa48("1275") ? "" : (stryCov_9fa48("1275"), 'city'), params.city);
      if (stryMutAct_9fa48("1278") ? params.state : stryMutAct_9fa48("1277") ? false : stryMutAct_9fa48("1276") ? true : (stryCov_9fa48("1276", "1277", "1278"), params?.state)) qs.set(stryMutAct_9fa48("1279") ? "" : (stryCov_9fa48("1279"), 'state'), params.state);
      if (stryMutAct_9fa48("1282") ? params.country : stryMutAct_9fa48("1281") ? false : stryMutAct_9fa48("1280") ? true : (stryCov_9fa48("1280", "1281", "1282"), params?.country)) qs.set(stryMutAct_9fa48("1283") ? "" : (stryCov_9fa48("1283"), 'country'), params.country);
      const q = qs.toString();
      return request<CouncilLgaContext>(stryMutAct_9fa48("1284") ? "" : (stryCov_9fa48("1284"), 'GET'), stryMutAct_9fa48("1285") ? `` : (stryCov_9fa48("1285"), `api/council/resolve${q ? stryMutAct_9fa48("1286") ? `` : (stryCov_9fa48("1286"), `?${q}`) : stryMutAct_9fa48("1287") ? "Stryker was here!" : (stryCov_9fa48("1287"), '')}`));
    }
  },
  getSelected: async () => {
    if (stryMutAct_9fa48("1288")) {
      {}
    } else {
      stryCov_9fa48("1288");
      const res = await request<CouncilLgaContext>(stryMutAct_9fa48("1289") ? "" : (stryCov_9fa48("1289"), 'GET'), stryMutAct_9fa48("1290") ? "" : (stryCov_9fa48("1290"), 'api/council/selected'));
      return (stryMutAct_9fa48("1291") ? res.council : (stryCov_9fa48("1291"), res?.council)) ? res : null;
    }
  },
  select: stryMutAct_9fa48("1292") ? () => undefined : (stryCov_9fa48("1292"), (councilId: string) => request<{
    success: boolean;
    councilId: string;
    lgaCode: string | null;
  }>(stryMutAct_9fa48("1293") ? "" : (stryCov_9fa48("1293"), 'POST'), stryMutAct_9fa48("1294") ? "" : (stryCov_9fa48("1294"), 'api/council/select'), stryMutAct_9fa48("1295") ? {} : (stryCov_9fa48("1295"), {
    councilId
  }))),
  /** Signed-in user’s LGA context for discover / calendar */
  my: async (params?: {
    postcode?: number;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  }) => {
    if (stryMutAct_9fa48("1296")) {
      {}
    } else {
      stryCov_9fa48("1296");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("1299") ? params.postcode : stryMutAct_9fa48("1298") ? false : stryMutAct_9fa48("1297") ? true : (stryCov_9fa48("1297", "1298", "1299"), params?.postcode)) qs.set(stryMutAct_9fa48("1300") ? "" : (stryCov_9fa48("1300"), 'postcode'), String(params.postcode));
      if (stryMutAct_9fa48("1303") ? params.suburb : stryMutAct_9fa48("1302") ? false : stryMutAct_9fa48("1301") ? true : (stryCov_9fa48("1301", "1302", "1303"), params?.suburb)) qs.set(stryMutAct_9fa48("1304") ? "" : (stryCov_9fa48("1304"), 'suburb'), params.suburb);
      if (stryMutAct_9fa48("1307") ? params.city : stryMutAct_9fa48("1306") ? false : stryMutAct_9fa48("1305") ? true : (stryCov_9fa48("1305", "1306", "1307"), params?.city)) qs.set(stryMutAct_9fa48("1308") ? "" : (stryCov_9fa48("1308"), 'city'), params.city);
      if (stryMutAct_9fa48("1311") ? params.state : stryMutAct_9fa48("1310") ? false : stryMutAct_9fa48("1309") ? true : (stryCov_9fa48("1309", "1310", "1311"), params?.state)) qs.set(stryMutAct_9fa48("1312") ? "" : (stryCov_9fa48("1312"), 'state'), params.state);
      if (stryMutAct_9fa48("1315") ? params.country : stryMutAct_9fa48("1314") ? false : stryMutAct_9fa48("1313") ? true : (stryCov_9fa48("1313", "1314", "1315"), params?.country)) qs.set(stryMutAct_9fa48("1316") ? "" : (stryCov_9fa48("1316"), 'country'), params.country);
      const q = qs.toString();
      const res = await request<CouncilLgaContext>(stryMutAct_9fa48("1317") ? "" : (stryCov_9fa48("1317"), 'GET'), stryMutAct_9fa48("1318") ? `` : (stryCov_9fa48("1318"), `api/council/my${q ? stryMutAct_9fa48("1319") ? `` : (stryCov_9fa48("1319"), `?${q}`) : stryMutAct_9fa48("1320") ? "Stryker was here!" : (stryCov_9fa48("1320"), '')}`));
      return (stryMutAct_9fa48("1321") ? res.council : (stryCov_9fa48("1321"), res?.council)) ? res : null;
    }
  },
  get: stryMutAct_9fa48("1322") ? () => undefined : (stryCov_9fa48("1322"), (id: string) => request<CouncilData>(stryMutAct_9fa48("1323") ? "" : (stryCov_9fa48("1323"), 'GET'), stryMutAct_9fa48("1324") ? `` : (stryCov_9fa48("1324"), `api/council/${id}`)))
});

// ---------------------------------------------------------------------------
// Locations — Firestore-backed hierarchy
// ---------------------------------------------------------------------------
export interface AustralianState {
  name: string; // e.g. 'New South Wales'
  code: string; // e.g. 'NSW'
  emoji: string; // e.g. '🏙️'
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
const locations = stryMutAct_9fa48("1325") ? {} : (stryCov_9fa48("1325"), {
  /** Fetch all location data (states + cities). Cache-first on backend (30 min TTL). */
  list: stryMutAct_9fa48("1326") ? () => undefined : (stryCov_9fa48("1326"), () => request<LocationsResponse>(stryMutAct_9fa48("1327") ? "" : (stryCov_9fa48("1327"), 'GET'), stryMutAct_9fa48("1328") ? "" : (stryCov_9fa48("1328"), 'api/locations'))),
  // ── Admin mutations ──────────────────────────────────────────────────────

  /** Re-seed the AU location document with the default dataset. Admin only. */
  seed: stryMutAct_9fa48("1329") ? () => undefined : (stryCov_9fa48("1329"), (countryCode = stryMutAct_9fa48("1330") ? "" : (stryCov_9fa48("1330"), 'AU')) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("1331") ? "" : (stryCov_9fa48("1331"), 'POST'), stryMutAct_9fa48("1332") ? `` : (stryCov_9fa48("1332"), `api/locations/${countryCode}/seed`))),
  /** Add a new state/territory. Admin only. */
  addState: stryMutAct_9fa48("1333") ? () => undefined : (stryCov_9fa48("1333"), (countryCode: string, state: Omit<AustralianState, 'cities'> & {
    cities?: string[];
  }) => request<{
    ok: boolean;
    code: string;
  }>(stryMutAct_9fa48("1334") ? "" : (stryCov_9fa48("1334"), 'POST'), stryMutAct_9fa48("1335") ? `` : (stryCov_9fa48("1335"), `api/locations/${countryCode}/states`), state)),
  /** Update a state's name or emoji. Admin only. */
  updateState: stryMutAct_9fa48("1336") ? () => undefined : (stryCov_9fa48("1336"), (countryCode: string, stateCode: string, patch: Partial<Pick<AustralianState, 'name' | 'emoji'>>) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("1337") ? "" : (stryCov_9fa48("1337"), 'PATCH'), stryMutAct_9fa48("1338") ? `` : (stryCov_9fa48("1338"), `api/locations/${countryCode}/states/${stateCode}`), patch)),
  /** Remove a state entirely. Admin only. */
  removeState: stryMutAct_9fa48("1339") ? () => undefined : (stryCov_9fa48("1339"), (countryCode: string, stateCode: string) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("1340") ? "" : (stryCov_9fa48("1340"), 'DELETE'), stryMutAct_9fa48("1341") ? `` : (stryCov_9fa48("1341"), `api/locations/${countryCode}/states/${stateCode}`))),
  /** Add a city to a state. Admin only. */
  addCity: stryMutAct_9fa48("1342") ? () => undefined : (stryCov_9fa48("1342"), (countryCode: string, stateCode: string, city: string) => request<{
    ok: boolean;
    city: string;
  }>(stryMutAct_9fa48("1343") ? "" : (stryCov_9fa48("1343"), 'POST'), stryMutAct_9fa48("1344") ? `` : (stryCov_9fa48("1344"), `api/locations/${countryCode}/states/${stateCode}/cities`), stryMutAct_9fa48("1345") ? {} : (stryCov_9fa48("1345"), {
    city
  }))),
  /** Remove a city from a state. Admin only. */
  removeCity: stryMutAct_9fa48("1346") ? () => undefined : (stryCov_9fa48("1346"), (countryCode: string, stateCode: string, city: string) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("1347") ? "" : (stryCov_9fa48("1347"), 'DELETE'), stryMutAct_9fa48("1348") ? `` : (stryCov_9fa48("1348"), `api/locations/${countryCode}/states/${stateCode}/cities/${encodeURIComponent(city)}`)))
});

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
  postStyle?: 'standard' | 'story';
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
const feed = stryMutAct_9fa48("1349") ? {} : (stryCov_9fa48("1349"), {
  list: (params: {
    city?: string;
    country?: string;
    page?: number;
    pageSize?: number;
  }) => {
    if (stryMutAct_9fa48("1350")) {
      {}
    } else {
      stryCov_9fa48("1350");
      const qs = new URLSearchParams();
      if (stryMutAct_9fa48("1352") ? false : stryMutAct_9fa48("1351") ? true : (stryCov_9fa48("1351", "1352"), params.city)) qs.set(stryMutAct_9fa48("1353") ? "" : (stryCov_9fa48("1353"), 'city'), params.city);
      if (stryMutAct_9fa48("1355") ? false : stryMutAct_9fa48("1354") ? true : (stryCov_9fa48("1354", "1355"), params.country)) qs.set(stryMutAct_9fa48("1356") ? "" : (stryCov_9fa48("1356"), 'country'), params.country);
      if (stryMutAct_9fa48("1359") ? params.page == null : stryMutAct_9fa48("1358") ? false : stryMutAct_9fa48("1357") ? true : (stryCov_9fa48("1357", "1358", "1359"), params.page != null)) qs.set(stryMutAct_9fa48("1360") ? "" : (stryCov_9fa48("1360"), 'page'), String(params.page));
      if (stryMutAct_9fa48("1363") ? params.pageSize == null : stryMutAct_9fa48("1362") ? false : stryMutAct_9fa48("1361") ? true : (stryCov_9fa48("1361", "1362", "1363"), params.pageSize != null)) qs.set(stryMutAct_9fa48("1364") ? "" : (stryCov_9fa48("1364"), 'pageSize'), String(params.pageSize));
      return request<{
        items: FeedItem[];
        total: number;
        page: number;
        pageSize: number;
        hasNextPage: boolean;
      }>(stryMutAct_9fa48("1365") ? "" : (stryCov_9fa48("1365"), 'GET'), stryMutAct_9fa48("1366") ? `` : (stryCov_9fa48("1366"), `api/feed${qs.toString() ? stryMutAct_9fa48("1367") ? `` : (stryCov_9fa48("1367"), `?${qs}`) : stryMutAct_9fa48("1368") ? "Stryker was here!" : (stryCov_9fa48("1368"), '')}`));
    }
  },
  createPost: stryMutAct_9fa48("1369") ? () => undefined : (stryCov_9fa48("1369"), (payload: {
    communityId: string;
    communityName: string;
    body: string;
    imageUrl?: string;
    postStyle?: 'standard' | 'story';
  }) => request<{
    id: string;
    createdAt: string;
  }>(stryMutAct_9fa48("1370") ? "" : (stryCov_9fa48("1370"), 'POST'), stryMutAct_9fa48("1371") ? "" : (stryCov_9fa48("1371"), 'api/feed/posts'), payload)),
  deletePost: stryMutAct_9fa48("1372") ? () => undefined : (stryCov_9fa48("1372"), (postId: string) => request<{
    success: boolean;
  }>(stryMutAct_9fa48("1373") ? "" : (stryCov_9fa48("1373"), 'DELETE'), stryMutAct_9fa48("1374") ? `` : (stryCov_9fa48("1374"), `api/feed/posts/${encodeURIComponent(postId)}`))),
  getComments: stryMutAct_9fa48("1375") ? () => undefined : (stryCov_9fa48("1375"), (postId: string) => request<{
    comments: FeedComment[];
  }>(stryMutAct_9fa48("1376") ? "" : (stryCov_9fa48("1376"), 'GET'), stryMutAct_9fa48("1377") ? `` : (stryCov_9fa48("1377"), `api/feed/posts/${encodeURIComponent(postId)}/comments`))),
  addComment: stryMutAct_9fa48("1378") ? () => undefined : (stryCov_9fa48("1378"), (postId: string, body: string) => request<FeedComment>(stryMutAct_9fa48("1379") ? "" : (stryCov_9fa48("1379"), 'POST'), stryMutAct_9fa48("1380") ? `` : (stryCov_9fa48("1380"), `api/feed/posts/${encodeURIComponent(postId)}/comments`), stryMutAct_9fa48("1381") ? {} : (stryCov_9fa48("1381"), {
    body
  }))),
  toggleLike: stryMutAct_9fa48("1382") ? () => undefined : (stryCov_9fa48("1382"), (postId: string) => request<{
    liked: boolean;
    likesCount: number;
  }>(stryMutAct_9fa48("1383") ? "" : (stryCov_9fa48("1383"), 'POST'), stryMutAct_9fa48("1384") ? `` : (stryCov_9fa48("1384"), `api/feed/posts/${encodeURIComponent(postId)}/like`))),
  getLike: stryMutAct_9fa48("1385") ? () => undefined : (stryCov_9fa48("1385"), (postId: string) => request<{
    liked: boolean;
    likesCount: number;
  }>(stryMutAct_9fa48("1386") ? "" : (stryCov_9fa48("1386"), 'GET'), stryMutAct_9fa48("1387") ? `` : (stryCov_9fa48("1387"), `api/feed/posts/${encodeURIComponent(postId)}/like`)))
});

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
const cities = stryMutAct_9fa48("1388") ? {} : (stryCov_9fa48("1388"), {
  /** Public — returns featured cities for Discover CityRail */
  featured: stryMutAct_9fa48("1389") ? () => undefined : (stryCov_9fa48("1389"), () => request<{
    cities: FeaturedCityData[];
  }>(stryMutAct_9fa48("1390") ? "" : (stryCov_9fa48("1390"), 'GET'), stryMutAct_9fa48("1391") ? "" : (stryCov_9fa48("1391"), 'api/cities/featured')).then(stryMutAct_9fa48("1392") ? () => undefined : (stryCov_9fa48("1392"), r => r.cities))),
  /** Admin — all cities */
  list: stryMutAct_9fa48("1393") ? () => undefined : (stryCov_9fa48("1393"), () => request<{
    cities: FeaturedCityData[];
  }>(stryMutAct_9fa48("1394") ? "" : (stryCov_9fa48("1394"), 'GET'), stryMutAct_9fa48("1395") ? "" : (stryCov_9fa48("1395"), 'api/cities')).then(stryMutAct_9fa48("1396") ? () => undefined : (stryCov_9fa48("1396"), r => r.cities))),
  /** Admin — create */
  create: stryMutAct_9fa48("1397") ? () => undefined : (stryCov_9fa48("1397"), (input: Omit<FeaturedCityData, 'id' | 'slug' | 'createdAt' | 'updatedAt'>) => request<{
    city: FeaturedCityData;
  }>(stryMutAct_9fa48("1398") ? "" : (stryCov_9fa48("1398"), 'POST'), stryMutAct_9fa48("1399") ? "" : (stryCov_9fa48("1399"), 'api/cities'), input).then(stryMutAct_9fa48("1400") ? () => undefined : (stryCov_9fa48("1400"), r => r.city))),
  /** Admin — update */
  update: stryMutAct_9fa48("1401") ? () => undefined : (stryCov_9fa48("1401"), (id: string, patch: Partial<Omit<FeaturedCityData, 'id' | 'slug' | 'createdAt' | 'updatedAt'>>) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("1402") ? "" : (stryCov_9fa48("1402"), 'PATCH'), stryMutAct_9fa48("1403") ? `` : (stryCov_9fa48("1403"), `api/cities/${id}`), patch)),
  /** Admin — delete */
  delete: stryMutAct_9fa48("1404") ? () => undefined : (stryCov_9fa48("1404"), (id: string) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("1405") ? "" : (stryCov_9fa48("1405"), 'DELETE'), stryMutAct_9fa48("1406") ? `` : (stryCov_9fa48("1406"), `api/cities/${id}`))),
  /** Admin — re-seed defaults */
  seed: stryMutAct_9fa48("1407") ? () => undefined : (stryCov_9fa48("1407"), () => request<{
    ok: boolean;
    message: string;
  }>(stryMutAct_9fa48("1408") ? "" : (stryCov_9fa48("1408"), 'POST'), stryMutAct_9fa48("1409") ? "" : (stryCov_9fa48("1409"), 'api/cities/seed')))
});

// ---------------------------------------------------------------------------
// Social (Following / Saving contacts)
// ---------------------------------------------------------------------------
const social = stryMutAct_9fa48("1410") ? {} : (stryCov_9fa48("1410"), {
  follow: stryMutAct_9fa48("1411") ? () => undefined : (stryCov_9fa48("1411"), (targetType: 'user' | 'profile' | 'community', targetId: string) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("1412") ? "" : (stryCov_9fa48("1412"), 'POST'), stryMutAct_9fa48("1413") ? `` : (stryCov_9fa48("1413"), `api/social/follow/${targetType}/${targetId}`))),
  unfollow: stryMutAct_9fa48("1414") ? () => undefined : (stryCov_9fa48("1414"), (targetType: 'user' | 'profile' | 'community', targetId: string) => request<{
    ok: boolean;
  }>(stryMutAct_9fa48("1415") ? "" : (stryCov_9fa48("1415"), 'DELETE'), stryMutAct_9fa48("1416") ? `` : (stryCov_9fa48("1416"), `api/social/follow/${targetType}/${targetId}`))),
  /** Check if the current user is following the target */
  isFollowing: async (targetType: 'user' | 'profile' | 'community', targetId: string) => {
    if (stryMutAct_9fa48("1417")) {
      {}
    } else {
      stryCov_9fa48("1417");
      try {
        if (stryMutAct_9fa48("1418")) {
          {}
        } else {
          stryCov_9fa48("1418");
          const res = await request<{
            following: boolean;
          }>(stryMutAct_9fa48("1419") ? "" : (stryCov_9fa48("1419"), 'GET'), stryMutAct_9fa48("1420") ? `` : (stryCov_9fa48("1420"), `api/social/is-following/${targetType}/${targetId}`));
          return res.following;
        }
      } catch {
        if (stryMutAct_9fa48("1421")) {
          {}
        } else {
          stryCov_9fa48("1421");
          return stryMutAct_9fa48("1422") ? true : (stryCov_9fa48("1422"), false);
        }
      }
    }
  }
});
const reports = stryMutAct_9fa48("1423") ? {} : (stryCov_9fa48("1423"), {
  submit: stryMutAct_9fa48("1424") ? () => undefined : (stryCov_9fa48("1424"), (payload: {
    targetType: string;
    targetId: string;
    reason: string;
    details?: string;
    userAgent?: string;
  }) => request<{
    id: string;
  }>(stryMutAct_9fa48("1425") ? "" : (stryCov_9fa48("1425"), 'POST'), stryMutAct_9fa48("1426") ? "" : (stryCov_9fa48("1426"), 'api/reports/v2'), payload))
});

// ---------------------------------------------------------------------------
// CulturePass ID lookup
// ---------------------------------------------------------------------------
const cpid = stryMutAct_9fa48("1427") ? {} : (stryCov_9fa48("1427"), {
  lookup: stryMutAct_9fa48("1428") ? () => undefined : (stryCov_9fa48("1428"), (id: string) => request<{
    cpid: string;
    name: string;
    username?: string;
    tier?: string;
    org?: string;
    avatarUrl?: string;
    city?: string;
    country?: string;
    bio?: string;
    targetId?: string;
    userId?: string;
  }>(stryMutAct_9fa48("1429") ? "" : (stryCov_9fa48("1429"), 'GET'), stryMutAct_9fa48("1430") ? `` : (stryCov_9fa48("1430"), `api/cpid/lookup/${encodeURIComponent(id)}`)))
});

// ---------------------------------------------------------------------------
// Uploads (multipart / FormData — not JSON)
// ---------------------------------------------------------------------------
export interface ImageUploadResponse {
  imageUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}
const uploads = stryMutAct_9fa48("1431") ? {} : (stryCov_9fa48("1431"), {
  image: async (formData: FormData): Promise<ImageUploadResponse> => {
    if (stryMutAct_9fa48("1432")) {
      {}
    } else {
      stryCov_9fa48("1432");
      try {
        if (stryMutAct_9fa48("1433")) {
          {}
        } else {
          stryCov_9fa48("1433");
          const res = await apiRequestMultipart(stryMutAct_9fa48("1434") ? "" : (stryCov_9fa48("1434"), 'POST'), stryMutAct_9fa48("1435") ? "" : (stryCov_9fa48("1435"), 'api/uploads/image'), formData);
          return parseJson<ImageUploadResponse>(res);
        }
      } catch (err) {
        if (stryMutAct_9fa48("1436")) {
          {}
        } else {
          stryCov_9fa48("1436");
          if (stryMutAct_9fa48("1438") ? false : stryMutAct_9fa48("1437") ? true : (stryCov_9fa48("1437", "1438"), err instanceof ApiError)) throw err;
          if (stryMutAct_9fa48("1440") ? false : stryMutAct_9fa48("1439") ? true : (stryCov_9fa48("1439", "1440"), err instanceof Error)) {
            if (stryMutAct_9fa48("1441")) {
              {}
            } else {
              stryCov_9fa48("1441");
              const match = err.message.match(stryMutAct_9fa48("1447") ? /^(\d{3}):\s*(.)/s : stryMutAct_9fa48("1446") ? /^(\d{3}):\S*(.*)/s : stryMutAct_9fa48("1445") ? /^(\d{3}):\s(.*)/s : stryMutAct_9fa48("1444") ? /^(\D{3}):\s*(.*)/s : stryMutAct_9fa48("1443") ? /^(\d):\s*(.*)/s : stryMutAct_9fa48("1442") ? /(\d{3}):\s*(.*)/s : (stryCov_9fa48("1442", "1443", "1444", "1445", "1446", "1447"), /^(\d{3}):\s*(.*)/s));
              if (stryMutAct_9fa48("1449") ? false : stryMutAct_9fa48("1448") ? true : (stryCov_9fa48("1448", "1449"), match)) throw new ApiError(parseInt(match[1], 10), match[2]);
            }
          }
          throw new ApiError(0, err instanceof Error ? err.message : stryMutAct_9fa48("1450") ? "" : (stryCov_9fa48("1450"), 'Network error'));
        }
      }
    }
  },
  /** Server fetches https URL, runs Sharp pipeline, stores in Firebase Storage — returns token URLs. */
  ingestFromUrl: async (url: string): Promise<ImageUploadResponse> => {
    if (stryMutAct_9fa48("1451")) {
      {}
    } else {
      stryCov_9fa48("1451");
      return request<ImageUploadResponse>(stryMutAct_9fa48("1452") ? "" : (stryCov_9fa48("1452"), 'POST'), stryMutAct_9fa48("1453") ? "" : (stryCov_9fa48("1453"), 'api/uploads/ingest-url'), stryMutAct_9fa48("1454") ? {} : (stryCov_9fa48("1454"), {
        url
      }));
    }
  }
});
const calendar = stryMutAct_9fa48("1455") ? {} : (stryCov_9fa48("1455"), {
  getSettings: stryMutAct_9fa48("1456") ? () => undefined : (stryCov_9fa48("1456"), () => request<import('@/shared/schema/user').CalendarSettings>(stryMutAct_9fa48("1457") ? "" : (stryCov_9fa48("1457"), 'GET'), stryMutAct_9fa48("1458") ? "" : (stryCov_9fa48("1458"), 'api/calendar/settings'))),
  updateSettings: stryMutAct_9fa48("1459") ? () => undefined : (stryCov_9fa48("1459"), (settings: Partial<import('@/shared/schema/user').CalendarSettings>) => request<import('@/shared/schema/user').CalendarSettings>(stryMutAct_9fa48("1460") ? "" : (stryCov_9fa48("1460"), 'PUT'), stryMutAct_9fa48("1461") ? "" : (stryCov_9fa48("1461"), 'api/calendar/settings'), settings))
});

// ---------------------------------------------------------------------------
// Named export — single surface for all API calls
// ---------------------------------------------------------------------------
export const api = stryMutAct_9fa48("1462") ? {} : (stryCov_9fa48("1462"), {
  auth,
  uploads,
  media,
  paymentMethods,
  rollout,
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
  offerings,
  businesses,
  council,
  locations,
  cities,
  cpid,
  social,
  reports,
  admin,
  culture,
  widgets,
  rsvps,
  likes,
  interests,
  updates,
  feed,
  calendar,
  /** Raw request — use when a specific endpoint isn't covered above */
  raw: request,
  /** Base URL — useful for constructing non-JSON endpoints (e.g. image URLs) */
  baseUrl: getApiUrl,
  ingest: stryMutAct_9fa48("1463") ? {} : (stryCov_9fa48("1463"), {
    trigger: stryMutAct_9fa48("1464") ? () => undefined : (stryCov_9fa48("1464"), (url: string) => request<{
      status: string;
      url: string;
    }>(stryMutAct_9fa48("1465") ? "" : (stryCov_9fa48("1465"), 'POST'), stryMutAct_9fa48("1466") ? "" : (stryCov_9fa48("1466"), 'api/ingest'), stryMutAct_9fa48("1467") ? {} : (stryCov_9fa48("1467"), {
      url
    })))
  })
});