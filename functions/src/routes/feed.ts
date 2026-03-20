/**
 * Feed route — GET /api/feed
 *
 * Server-side ranked feed. Fetches events + communities for the user's city,
 * applies the same multi-signal ranking algorithm that previously ran on the
 * client, and returns paginated FeedItem results.
 *
 * Ranking signals:
 *   Cultural Relevance (30%) · Date Proximity (25%) · Location (15%)
 *   Interest Match (12%)     · Community Affinity (10%)
 *   Social Proof (5%)        · Freshness Decay (8%)
 */

import { Router, Request, Response } from 'express';
import { eventsService, profilesService, usersService } from '../services/firestore';
import { isFirestoreConfigured } from '../admin';
import type { FirestoreEvent } from '../services/firestore';

export const feedRouter = Router();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FeedItem = {
  id: string;
  kind: 'event' | 'announcement' | 'welcome' | 'milestone';
  score: number;
  matchReasons: string[];
  // kind-specific payloads (clients pick what they need)
  event?: FirestoreEvent;
  communityId?: string;
  communityName?: string;
  communityImageUrl?: string | null;
  body?: string;
  imageUrl?: string | null;
  members?: number;
  createdAt: string;
};

type UserContext = {
  city: string;
  interests: string[];
  culturalIdentity: { nationalityId?: string; cultureIds?: string[]; languageIds?: string[] };
  followingIds: Set<string>;
};

// ---------------------------------------------------------------------------
// Ranking helpers
// ---------------------------------------------------------------------------

function scoreItem(item: FeedItem, user: UserContext, todayMs: number): number {
  let score = 0;

  // 1. Cultural Relevance (30%)
  if (item.event) {
    const cultureTags  = item.event.cultureTag  ?? [];
    const languageTags = (item.event as any).languageTags ?? [];
    const cid = user.culturalIdentity;

    let cultureRaw = 0;
    const cultureOverlap = cultureTags.some((t: string) => {
      const lt = t.toLowerCase();
      return lt === cid.nationalityId?.toLowerCase()
        || cid.cultureIds?.some((id: string) => id.toLowerCase() === lt);
    });
    const languageOverlap = languageTags.some((t: string) =>
      cid.languageIds?.some((id: string) => id.toLowerCase() === t.toLowerCase()),
    );

    if (cultureOverlap)  cultureRaw += 0.8;
    if (languageOverlap) cultureRaw += 0.2;
    if (cultureRaw > 0) {
      score += cultureRaw * 0.30;
      item.matchReasons.push('Matches your culture');
    }
  }

  // 2. Date Proximity (25%)
  if (item.event?.date) {
    const eventMs  = new Date(item.event.date).setHours(0, 0, 0, 0);
    const diffDays = (eventMs - todayMs) / 86_400_000;
    if (diffDays >= 0 && diffDays < 1)  { score += 0.35; item.matchReasons.unshift('Happening today!'); }
    else if (diffDays < 3)              { score += 0.25; item.matchReasons.unshift('Happening soon'); }
    else if (diffDays <= 7)             { score += 0.12; item.matchReasons.unshift('This week'); }
    else if (diffDays > 90)             { score -= 0.08; }
  }

  // 3. Location Relevance (15%)
  const itemCity = (item.event?.city ?? '').toLowerCase();
  if (itemCity && itemCity === user.city.toLowerCase()) {
    score += 0.15;
  } else if (itemCity) {
    score += 0.04;
  }

  // 4. Interest Matching (12%)
  if (item.event) {
    const tags = item.event.tags ?? [];
    let matchCount = 0;
    tags.forEach((tag: string) => { if (user.interests.includes(tag.toLowerCase())) matchCount++; });
    if (matchCount > 0) {
      score += Math.min(1, matchCount / 3) * 0.12;
      item.matchReasons.push(`${matchCount} interest match${matchCount > 1 ? 'es' : ''}`);
    }
  }

  // 5. Community Affinity (10%)
  if (item.communityId && user.followingIds.has(item.communityId)) {
    score += 0.10;
    item.matchReasons.push('From your communities');
  }

  // 6. Social Proof (5%)
  if (item.kind === 'event' && item.event) {
    score += Math.min(1, (item.event.attending ?? 0) / 500) * 0.05;
  } else if (item.kind === 'milestone') {
    score += 0.05;
  }

  // 7. Freshness Decay (8%)
  const ageHrs  = (Date.now() - new Date(item.createdAt).getTime()) / 3_600_000;
  const freshness = Math.exp(-ageHrs / 168); // half-life ~1 week
  score += freshness * 0.08;

  return score;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

/**
 * GET /api/feed
 *
 * Query params:
 *   city, country   — filter scope (required for relevant results)
 *   pageSize        — items per page (default 30, max 50)
 *   page            — 1-based page (default 1)
 */
feedRouter.get('/feed', async (req: Request, res: Response) => {
  const city     = String(req.query.city    ?? '').trim();
  const country  = String(req.query.country ?? '').trim();
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? '30'), 10) || 30));
  const page     = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);

  try {
    // ── 1. Fetch events + communities in parallel ──────────────────────────
    const [eventsResult, communitiesResult] = await Promise.all([
      eventsService.list(
        { city: city || undefined, country: country || undefined, status: 'published' as any },
        { page: 1, pageSize: 60 },
      ),
      profilesService.list({ entityType: 'community', city: city || undefined }),
    ]);

    const events      = eventsResult.items;
    const communities = communitiesResult;

    // ── 2. Resolve user context (personalised ranking when authenticated) ──
    let userCtx: UserContext = {
      city: city || 'Sydney',
      interests: [],
      culturalIdentity: {},
      followingIds: new Set(),
    };

    if (isFirestoreConfigured && req.user?.id) {
      const profile = await usersService.getById(req.user.id);
      if (profile) {
        userCtx = {
          city: profile.city ?? city ?? 'Sydney',
          interests: (profile.interests ?? []).map((i: string) => i.toLowerCase()),
          culturalIdentity: (profile as any).culturalIdentity ?? {},
          followingIds: new Set(profile.communities ?? []),
        };
      }
    }

    // ── 3. Build feed item list ────────────────────────────────────────────
    const now    = Date.now();
    const items: FeedItem[] = [];

    // Event cards
    events.forEach((event, i) => {
      const comm = communities[i % Math.max(communities.length, 1)];
      items.push({
        id: `ev-${event.id}`,
        kind: 'event',
        score: 0,
        matchReasons: [],
        event,
        communityId:       comm?.id,
        communityName:     comm?.name,
        communityImageUrl: comm?.imageUrl ?? null,
        createdAt: event.createdAt ?? new Date(now - i * 3_600_000).toISOString(),
      });
    });

    // Community cards (announcements, welcome, milestones)
    communities.forEach((comm, i) => {
      if (i % 3 === 1) {
        items.push({
          id: `ann-${comm.id}-${i}`,
          kind: 'announcement',
          score: 0,
          matchReasons: [],
          communityId:       comm.id,
          communityName:     comm.name,
          communityImageUrl: comm.imageUrl ?? null,
          body: `Join ${comm.name} — new events and updates coming soon!`,
          createdAt: new Date(now - i * 7_200_000).toISOString(),
        });
      } else if (i % 5 === 0) {
        const members = (comm as any).membersCount ?? 0;
        items.push({
          id: `ms-${comm.id}-${i}`,
          kind: members > 100 ? 'milestone' : 'welcome',
          score: 0,
          matchReasons: [],
          communityId:       comm.id,
          communityName:     comm.name,
          communityImageUrl: comm.imageUrl ?? null,
          members,
          createdAt: new Date(now - i * 10_800_000).toISOString(),
        });
      }
    });

    // ── 4. Rank ────────────────────────────────────────────────────────────
    const todayMs = new Date().setHours(0, 0, 0, 0);
    const ranked = items
      .map(item => ({ ...item, score: scoreItem(item, userCtx, todayMs) }))
      .sort((a, b) => b.score - a.score);

    // ── 5. Paginate ────────────────────────────────────────────────────────
    const total   = ranked.length;
    const offset  = (page - 1) * pageSize;
    const paginated = ranked.slice(offset, offset + pageSize);

    return res.json({
      items: paginated,
      total,
      page,
      pageSize,
      hasNextPage: offset + pageSize < total,
    });
  } catch (err) {
    console.error('[GET /api/feed]:', err);
    return res.status(500).json({ error: 'Failed to fetch feed' });
  }
});
