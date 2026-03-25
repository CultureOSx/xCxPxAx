/**
 * Centralized React Query key factory.
 *
 * Rules:
 *  - Keys are arrays — React Query matches by structural equality.
 *  - Coarser keys are prefixes of finer ones so that
 *    `invalidateQueries({ queryKey: eventKeys.all })` wipes every event query.
 *  - Keep this file as the single source of truth; never write raw string keys
 *    in query/mutation calls.
 */

// ─── Events ───────────────────────────────────────────────────────────────────

export const eventKeys = {
  /** Matches every event query */
  all: ['events'] as const,
  /** Matches every event list query */
  lists: () => [...eventKeys.all, 'list'] as const,
  /** Matches a specific filtered list */
  list: (params: Record<string, unknown>) => [...eventKeys.lists(), params] as const,
  /** Matches every event detail query */
  details: () => [...eventKeys.all, 'detail'] as const,
  /** Matches a single event by id */
  detail: (id: string) => [...eventKeys.details(), id] as const,
  /** Matches nearby-events queries */
  nearby: (params: Record<string, unknown>) => [...eventKeys.all, 'nearby', params] as const,
  /** Matches the current user's RSVP for an event */
  myRsvp: (eventId: string) => [...eventKeys.all, 'rsvp', eventId] as const,
};

// ─── Communities ──────────────────────────────────────────────────────────────

export const communityKeys = {
  all: ['communities'] as const,
  lists: () => [...communityKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...communityKeys.lists(), params] as const,
  detail: (id: string) => [...communityKeys.all, 'detail', id] as const,
  joined: () => [...communityKeys.all, 'joined'] as const,
};

// ─── Profiles ─────────────────────────────────────────────────────────────────

export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...profileKeys.lists(), params] as const,
  detail: (id: string) => [...profileKeys.all, 'detail', id] as const,
  me: () => [...profileKeys.all, 'me'] as const,
};

// ─── Perks ────────────────────────────────────────────────────────────────────

export const perkKeys = {
  all: ['perks'] as const,
  lists: () => [...perkKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...perkKeys.lists(), params] as const,
  detail: (id: string) => [...perkKeys.all, 'detail', id] as const,
};

// ─── Tickets ──────────────────────────────────────────────────────────────────

export const ticketKeys = {
  all: ['tickets'] as const,
  forUser: (userId: string) => [...ticketKeys.all, 'user', userId] as const,
  detail: (id: string) => [...ticketKeys.all, 'detail', id] as const,
};

// ─── Discover / Feed ──────────────────────────────────────────────────────────

export const discoverKeys = {
  all: ['discover'] as const,
  feed: (params: Record<string, unknown>) => [...discoverKeys.all, 'feed', params] as const,
  trending: () => [...discoverKeys.all, 'trending'] as const,
  curation: (params: Record<string, unknown>) => [...discoverKeys.all, 'curation', params] as const,
};

// ─── Feed ─────────────────────────────────────────────────────────────────────

export const feedKeys = {
  all: ['feed'] as const,
  list: (params: Record<string, unknown>) => [...feedKeys.all, 'list', params] as const,
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ['notifications'] as const,
  forUser: (userId: string) => [...notificationKeys.all, 'user', userId] as const,
};

// ─── Council ──────────────────────────────────────────────────────────────────

export const councilKeys = {
  all: ['council'] as const,
  lists: () => [...councilKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...councilKeys.lists(), params] as const,
  detail: (id: string) => [...councilKeys.all, 'detail', id] as const,
};

// ─── Search ───────────────────────────────────────────────────────────────────

export const searchKeys = {
  all: ['search'] as const,
  query: (params: Record<string, unknown>) => [...searchKeys.all, params] as const,
};
