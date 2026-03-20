import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Uploads a file (blob or uri) to Firebase Storage.
 * @param uri The local URI of the file to upload.
 * @param path The destination path in Storage (e.g., 'posts/image.jpg').
 * @returns The download URL of the uploaded file.
 */
export async function uploadFile(uri: string, path: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function uploadPostImage(uri: string, userId: string): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const path = `posts/${userId}/${filename}`;
  return uploadFile(uri, path);
}

export async function uploadEventHeroImage(uri: string, eventId: string): Promise<string> {
  const filename = `hero-${Date.now()}.jpg`;
  const path = `events/${eventId}/${filename}`;
  return uploadFile(uri, path);
}

export async function uploadEventImageTemp(uri: string, userId: string): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const path = `events/temp/${userId}/${filename}`;
  return uploadFile(uri, path);
}
