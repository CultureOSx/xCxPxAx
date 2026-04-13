import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from './firebase';

/**
 * Uploads a file (blob or uri) to Firebase Storage.
 * @param uri The local URI of the file to upload.
 * @param path The destination path in Storage (e.g., 'posts/image.jpg').
 * @returns The download URL of the uploaded file.
 */
export async function uploadFile(uri: string, path: string): Promise<string> {
  let blob: Blob;
  if (Platform.OS === 'web') {
    const res = await globalThis.fetch(uri);
    if (!res.ok) throw new Error('Failed to load image file');
    blob = await res.blob();
  } else {
    blob = await new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = () => resolve(xhr.response as Blob);
      xhr.onerror = () => reject(new Error('Failed to load image file'));
      xhr.open('GET', uri);
      xhr.send();
    });
  }
  const contentType =
    blob.type && /^image\//i.test(blob.type) ? blob.type : 'image/jpeg';
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType });
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

export interface LayoverPlannerPreferences {
  layoverWindowId: '2_4' | '4_8' | '8_16';
  anchorId: 'city' | 'airport' | 'port';
  routeProfileId: 'fast' | 'balanced' | 'safe';
  openNowOnly: boolean;
  quietOnly: boolean;
  crewFriendlyOnly: boolean;
}

const LAYOVER_PREFS_STORAGE_KEY = '@culturepass:discover:layover-prefs:v1';
const TRAVEL_MODE_STORAGE_KEY = '@culturepass:discover:travel-mode:v1';

function layoverPrefsKey(userId?: string | null) {
  return userId ? `${LAYOVER_PREFS_STORAGE_KEY}:${userId}` : `${LAYOVER_PREFS_STORAGE_KEY}:guest`;
}

function travelModeKey(userId?: string | null) {
  return userId ? `${TRAVEL_MODE_STORAGE_KEY}:${userId}` : `${TRAVEL_MODE_STORAGE_KEY}:guest`;
}

export async function getLayoverPlannerPreferences(
  userId?: string | null,
): Promise<LayoverPlannerPreferences | null> {
  try {
    const raw = await AsyncStorage.getItem(layoverPrefsKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LayoverPlannerPreferences>;
    if (!parsed) return null;
    return {
      layoverWindowId: parsed.layoverWindowId ?? '4_8',
      anchorId: parsed.anchorId ?? 'city',
      routeProfileId: parsed.routeProfileId ?? 'balanced',
      openNowOnly: Boolean(parsed.openNowOnly),
      quietOnly: Boolean(parsed.quietOnly),
      crewFriendlyOnly: Boolean(parsed.crewFriendlyOnly),
    };
  } catch {
    return null;
  }
}

export async function saveLayoverPlannerPreferences(
  prefs: LayoverPlannerPreferences,
  userId?: string | null,
): Promise<void> {
  try {
    await AsyncStorage.setItem(layoverPrefsKey(userId), JSON.stringify(prefs));
  } catch {
    // No-op: this cache is a convenience enhancement and should never block UX.
  }
}

export async function getTravelModeEnabled(userId?: string | null): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(travelModeKey(userId));
    if (raw == null) return false;
    return raw === '1';
  } catch {
    return false;
  }
}

export async function saveTravelModeEnabled(
  enabled: boolean,
  userId?: string | null,
): Promise<void> {
  try {
    await AsyncStorage.setItem(travelModeKey(userId), enabled ? '1' : '0');
  } catch {
    // No-op: preference persistence should never block core flows.
  }
}
