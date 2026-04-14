import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { captureRouteError, qparam, qstr } from './utils';
import { db, isFirestoreConfigured } from '../admin';
import {
  buildFeed,
  buildICalFeed,
  buildRssFeed,
  type FeedFormat,
  type FeedScope,
} from '../services/feeds';

const feedScopeSchema = z.enum([
  'community',
  'host',
  'city',
  'state',
  'artist',
  'venue',
  'tag',
]);

const feedFormatSchema = z.enum(['rss', 'ical', 'ics']);
const postFeedKindSchema = z.enum(['status', 'story']);

type PostFeedKind = z.infer<typeof postFeedKindSchema>;

type CommunityFeedPost = {
  id: string;
  communityId: string;
  communityName: string;
  authorName: string;
  body: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  postStyle?: 'standard' | 'story';
};

const DEFAULT_POST_FEED_LIMIT = 50;
const MAX_POST_FEED_LIMIT = 200;

function normalizeFormat(raw: string): FeedFormat {
  const format = feedFormatSchema.parse(raw);
  return format === 'rss' ? 'rss' : 'ical';
}

function normalizeScope(raw: string): FeedScope {
  return feedScopeSchema.parse(raw);
}

function buildFeedUrl(req: Request, format: FeedFormat): string {
  const origin = (process.env.APP_URL ?? 'https://culturepass.app').trim().replace(/\/+$/, '');
  const original = req.originalUrl || req.url;
  const url = new URL(original, origin);
  if (format === 'ical' && url.pathname.endsWith('.ics')) {
    return url.toString();
  }
  if (format === 'ical' && url.pathname.endsWith('.ical')) {
    return url.toString();
  }
  if (format === 'rss' && url.pathname.endsWith('.rss')) {
    return url.toString();
  }
  return url.toString();
}

function trimString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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

function clampPostFeedLimit(limitRaw: string): number {
  const parsed = parseInt(limitRaw || String(DEFAULT_POST_FEED_LIMIT), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_POST_FEED_LIMIT;
  return Math.min(MAX_POST_FEED_LIMIT, Math.max(1, parsed));
}

async function fetchCommunityPostsForFeed(
  kind: PostFeedKind,
  communityId: string | undefined,
  limit: number,
): Promise<CommunityFeedPost[]> {
  if (!isFirestoreConfigured) return [];
  try {
    const scanSize = Math.min(MAX_POST_FEED_LIMIT, Math.max(limit * 3, limit));
    const snap = await db
      .collection('communityPosts')
      .orderBy('createdAt', 'desc')
      .limit(scanSize)
      .get();

    return snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as CommunityFeedPost))
      .filter((post) => !post.deletedAt)
      .filter((post) => !communityId || post.communityId === communityId)
      .filter((post) => (kind === 'story' ? post.postStyle === 'story' : post.postStyle !== 'story'))
      .slice(0, limit);
  } catch {
    return [];
  }
}

function buildCommunityPostRssFeed(args: {
  kind: PostFeedKind;
  posts: CommunityFeedPost[];
  feedUrl: string;
  origin: string;
  communityId?: string;
}): string {
  const kindLabel = args.kind === 'story' ? 'Stories' : 'Status Updates';
  const title = args.communityId
    ? `CulturePass ${kindLabel} (${args.communityId})`
    : `CulturePass ${kindLabel}`;
  const description = args.communityId
    ? `Latest ${kindLabel.toLowerCase()} for community ${args.communityId} on CulturePass.`
    : `Latest ${kindLabel.toLowerCase()} across CulturePass communities.`;
  const websiteUrl = args.communityId
    ? `${args.origin}/community/${encodeURIComponent(args.communityId)}`
    : `${args.origin}/community`;

  const items = args.posts
    .map((post) => {
      const link = `${args.origin}/community/${encodeURIComponent(post.communityId)}?post=${encodeURIComponent(post.id)}`;
      const titleText = `${post.communityName || 'Community'} · ${post.authorName || 'Member'}`;
      const desc = post.body || (args.kind === 'story' ? 'New story posted.' : 'New status update posted.');
      const pubDate = toRfc822(trimString(post.updatedAt) ?? trimString(post.createdAt));

      return [
        '    <item>',
        `      <title>${xmlEscape(titleText)}</title>`,
        `      <link>${xmlEscape(link)}</link>`,
        `      <guid isPermaLink="false">${xmlEscape(`culturepass:community-post:${post.id}`)}</guid>`,
        `      <pubDate>${xmlEscape(pubDate)}</pubDate>`,
        `      <description>${xmlEscape(desc)}</description>`,
        `      <category>${xmlEscape(args.kind)}</category>`,
        `      <category>${xmlEscape(post.communityName || 'community')}</category>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${xmlEscape(title)}</title>`,
    `    <link>${xmlEscape(websiteUrl)}</link>`,
    `    <atom:link href="${xmlEscape(args.feedUrl)}" rel="self" type="application/rss+xml" />`,
    `    <description>${xmlEscape(description)}</description>`,
    '    <language>en-AU</language>',
    `    <lastBuildDate>${xmlEscape(toRfc822(undefined))}</lastBuildDate>`,
    '    <generator>CulturePass Community Feed Service</generator>',
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

async function sendFeed(
  req: Request<{ format?: string; scope?: string; value?: string }>,
  res: Response,
): Promise<void> {
  try {
    const format = normalizeFormat(qparam(req.params.format));
    const scope = normalizeScope(qparam(req.params.scope));
    const value = qparam(req.params.value);
    const country = qstr(req.query.country).trim() || undefined;
    const limitRaw = parseInt(qstr(req.query.limit) || '50', 10);

    const feed = await buildFeed({
      scope,
      value,
      country,
      limit: Number.isFinite(limitRaw) ? limitRaw : undefined,
      origin: process.env.APP_URL ?? 'https://culturepass.app',
      feedUrl: buildFeedUrl(req, format),
    });

    if (format === 'rss') {
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.type('application/rss+xml; charset=utf-8');
      res.status(200).send(buildRssFeed(feed));
      return;
    }

    const filename = `${scope}-${value}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Content-Disposition', `inline; filename="${filename || 'culturepass-feed'}.ics"`);
    res.type('text/calendar; charset=utf-8');
    res.status(200).send(buildICalFeed(feed));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid feed request' });
      return;
    }

    if (err instanceof Error && err.message === 'Feed value is required') {
      res.status(400).json({ error: err.message });
      return;
    }

    captureRouteError(err, 'GET /api/feeds/*');
    res.status(500).json({ error: 'Failed to generate feed' });
  }
}

async function sendCommunityPostFeed(
  req: Request<{ kind?: string; communityId?: string }>,
  res: Response,
): Promise<void> {
  try {
    const kind = postFeedKindSchema.parse(qparam(req.params.kind));
    const communityId = trimString(qparam(req.params.communityId)) ?? trimString(qstr(req.query.communityId));
    const limit = clampPostFeedLimit(qstr(req.query.limit));
    const origin = (process.env.APP_URL ?? 'https://culturepass.app').trim().replace(/\/+$/, '');
    const feedUrl = new URL(req.originalUrl || req.url, origin).toString();
    const posts = await fetchCommunityPostsForFeed(kind, communityId, limit);
    const xml = buildCommunityPostRssFeed({
      kind,
      posts,
      feedUrl,
      origin,
      communityId,
    });

    res.setHeader('Cache-Control', 'public, max-age=300');
    res.type('application/rss+xml; charset=utf-8');
    res.status(200).send(xml);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid community feed request' });
      return;
    }
    captureRouteError(err, 'GET /api/feeds/{status|story}.rss');
    res.status(500).json({ error: 'Failed to generate community post feed' });
  }
}

export const feedsRouter = Router();

feedsRouter.get('/feeds/:format/:scope/:value', (req, res) => {
  void sendFeed(req, res);
});

feedsRouter.get('/feeds/:scope/:value.:format', (req, res) => {
  void sendFeed(req, res);
});

feedsRouter.get('/feeds/:kind.rss', (req, res) => {
  void sendCommunityPostFeed(req, res);
});

feedsRouter.get('/feeds/community/:communityId/:kind.rss', (req, res) => {
  void sendCommunityPostFeed(req, res);
});
