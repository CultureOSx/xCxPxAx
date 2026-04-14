import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { captureRouteError, qparam, qstr } from './utils';
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

export const feedsRouter = Router();

feedsRouter.get('/feeds/:format/:scope/:value', (req, res) => {
  void sendFeed(req, res);
});

feedsRouter.get('/feeds/:scope/:value.:format', (req, res) => {
  void sendFeed(req, res);
});
