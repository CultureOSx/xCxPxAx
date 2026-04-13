/**
 * Sharp resize + Firebase Storage write — shared by multipart upload and URL ingest.
 */

import { randomBytes, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { storageBucket } from '../admin';

const MAX_BYTES = 8 * 1024 * 1024;

/** Firebase download URL (token) for private buckets + uniform bucket-level access. */
export function firebaseDownloadUrl(bucketName: string, objectPath: string, token: string): string {
  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`;
}

export type ProcessedImageUpload = {
  imageUrl: string;
  thumbnailUrl: string;
  width?: number;
  height?: number;
};

/**
 * JPEG main (max edge 1600) + square thumb 480; returns Firebase token URLs.
 */
export async function processBufferToJpegAndStore(
  buffer: Buffer,
  uid: string,
  idPart?: string,
): Promise<ProcessedImageUpload> {
  if (!storageBucket) {
    throw new Error('Storage is not configured for this environment');
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error('Image exceeds maximum size');
  }

  const id = idPart ?? `${Date.now()}-${randomBytes(6).toString('hex')}`;
  const basePath = `uploads/${uid}/${id}`;

  const pipeline = sharp(buffer).rotate();
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
      metadata: { firebaseStorageDownloadTokens: mainToken },
    },
  });
  await thumbFile.save(thumbBuf, {
    contentType: 'image/jpeg',
    resumable: false,
    metadata: {
      cacheControl: 'public, max-age=31536000',
      metadata: { firebaseStorageDownloadTokens: thumbToken },
    },
  });

  const bucketName = storageBucket.name;
  return {
    imageUrl: firebaseDownloadUrl(bucketName, `${basePath}.jpg`, mainToken),
    thumbnailUrl: firebaseDownloadUrl(bucketName, `${basePath}_thumb.jpg`, thumbToken),
    width: meta.width ?? undefined,
    height: meta.height ?? undefined,
  };
}
