/**
 * POST /api/uploads/image — multipart image upload (authenticated).
 * POST /api/uploads/ingest-url — fetch remote https image, process, store (authenticated).
 */

import { randomBytes } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { slidingWindowRateLimit } from '../middleware/rateLimit';
import { storageBucket } from '../admin';
import { captureRouteError, parseBody } from './utils';
import { processBufferToJpegAndStore } from '../services/imagePipeline';
import { isPrivateOrBlockedHostname, zIngestImageUrlBody } from '../utils/httpsImageUrl';

export const uploadsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const INGEST_MAX_BYTES = 8 * 1024 * 1024;
const INGEST_TIMEOUT_MS = 20_000;

uploadsRouter.post('/uploads/image', requireAuth, upload.single('image'), async (req: Request, res: Response) => {
  if (!storageBucket) {
    return res.status(503).json({ error: 'Storage is not configured for this environment' });
  }
  const file = req.file;
  if (!file?.buffer?.length) {
    return res.status(400).json({ error: 'Missing image file (field name: image)' });
  }
  const uid = req.user!.id;
  const id = `${Date.now()}-${randomBytes(6).toString('hex')}`;

  try {
    const out = await processBufferToJpegAndStore(file.buffer, uid, id);
    return res.status(201).json(out);
  } catch (err) {
    captureRouteError(err, 'POST /uploads/image');
    return res.status(500).json({ error: 'Failed to process or store image' });
  }
});

uploadsRouter.post(
  '/uploads/ingest-url',
  requireAuth,
  slidingWindowRateLimit(60_000, 20),
  async (req: Request, res: Response) => {
    if (!storageBucket) {
      return res.status(503).json({ error: 'Storage is not configured for this environment' });
    }
    let parsed: { url: string };
    try {
      parsed = parseBody(zIngestImageUrlBody, req.body ?? {});
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid body';
      return res.status(400).json({ error: msg });
    }

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), INGEST_TIMEOUT_MS);

    try {
      const r = await fetch(parsed.url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          Accept: 'image/*,*/*;q=0.8',
          'User-Agent': 'CulturePass-ImageIngest/1.0',
        },
      });
      clearTimeout(t);

      if (!r.ok) {
        return res.status(400).json({ error: `Remote image returned ${r.status}` });
      }

      const finalUrl = r.url;
      try {
        const u = new URL(finalUrl);
        if (u.protocol !== 'https:') {
          return res.status(400).json({ error: 'Redirect ended on a non-https URL' });
        }
        if (isPrivateOrBlockedHostname(u.hostname)) {
          return res.status(400).json({ error: 'Redirect target is not allowed' });
        }
      } catch {
        return res.status(400).json({ error: 'Invalid redirect URL' });
      }

      const ct = (r.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
      if (ct && !ct.startsWith('image/')) {
        return res.status(400).json({ error: 'URL did not return an image (Content-Type)' });
      }

      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > INGEST_MAX_BYTES) {
        return res.status(400).json({ error: 'Remote image exceeds size limit' });
      }

      const uid = req.user!.id;
      const id = `ingest-${Date.now()}-${randomBytes(6).toString('hex')}`;
      const out = await processBufferToJpegAndStore(buf, uid, id);
      return res.status(201).json(out);
    } catch (err) {
      clearTimeout(t);
      if (err instanceof Error && err.name === 'AbortError') {
        return res.status(400).json({ error: 'Image fetch timed out' });
      }
      captureRouteError(err, 'POST /uploads/ingest-url');
      return res.status(500).json({ error: 'Failed to ingest image' });
    }
  },
);
