/**
 * POST /api/uploads/image — multipart image upload (authenticated).
 * Stores under uploads/{uid}/… in the default bucket; returns public HTTPS URLs.
 */

import { randomBytes, randomUUID } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { requireAuth } from '../middleware/auth';
import { storageBucket } from '../admin';
import { captureRouteError } from './utils';

export const uploadsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

/**
 * Firebase-compatible download URL (works with private buckets + uniform access).
 * Plain storage.googleapis.com links often 403 when object ACLs / public access are disabled.
 */
function firebaseDownloadUrl(bucketName: string, objectPath: string, token: string): string {
  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`;
}

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
  const basePath = `uploads/${uid}/${id}`;

  try {
    const pipeline = sharp(file.buffer).rotate();
    const mainBuf = await pipeline
      .clone()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
    const meta = await sharp(mainBuf).metadata();
    const thumbBuf = await sharp(mainBuf)
      .resize(480, 480, { fit: 'cover' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    const mainFile = storageBucket.file(`${basePath}.jpg`);
    const thumbFile = storageBucket.file(`${basePath}_thumb.jpg`);

    const mainToken = randomUUID();
    const thumbToken = randomUUID();

    await mainFile.save(mainBuf, {
      contentType: 'image/jpeg',
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        metadata: {
          firebaseStorageDownloadTokens: mainToken,
        },
      },
    });
    await thumbFile.save(thumbBuf, {
      contentType: 'image/jpeg',
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        metadata: {
          firebaseStorageDownloadTokens: thumbToken,
        },
      },
    });

    const bucketName = storageBucket.name;
    const imageUrl = firebaseDownloadUrl(bucketName, `${basePath}.jpg`, mainToken);
    const thumbnailUrl = firebaseDownloadUrl(bucketName, `${basePath}_thumb.jpg`, thumbToken);

    return res.status(201).json({
      imageUrl,
      thumbnailUrl,
      width: meta.width ?? undefined,
      height: meta.height ?? undefined,
    });
  } catch (err) {
    captureRouteError(err, 'POST /uploads/image');
    return res.status(500).json({ error: 'Failed to process or store image' });
  }
});
