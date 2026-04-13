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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from './firebase';

/**
 * Uploads a file (blob or uri) to Firebase Storage.
 * @param uri The local URI of the file to upload.
 * @param path The destination path in Storage (e.g., 'posts/image.jpg').
 * @returns The download URL of the uploaded file.
 */
export async function uploadFile(uri: string, path: string): Promise<string> {
  if (stryMutAct_9fa48("4894")) {
    {}
  } else {
    stryCov_9fa48("4894");
    // XHR is more reliable than fetch() for local file URIs on React Native
    const blob = await new Promise<Blob>((resolve, reject) => {
      if (stryMutAct_9fa48("4895")) {
        {}
      } else {
        stryCov_9fa48("4895");
        const xhr = new XMLHttpRequest();
        xhr.responseType = stryMutAct_9fa48("4896") ? "" : (stryCov_9fa48("4896"), 'blob');
        xhr.onload = stryMutAct_9fa48("4897") ? () => undefined : (stryCov_9fa48("4897"), () => resolve(xhr.response as Blob));
        xhr.onerror = stryMutAct_9fa48("4898") ? () => undefined : (stryCov_9fa48("4898"), () => reject(new Error(stryMutAct_9fa48("4899") ? "" : (stryCov_9fa48("4899"), 'Failed to load image file'))));
        xhr.open(stryMutAct_9fa48("4900") ? "" : (stryCov_9fa48("4900"), 'GET'), uri);
        xhr.send();
      }
    });
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  }
}
export async function uploadPostImage(uri: string, userId: string): Promise<string> {
  if (stryMutAct_9fa48("4901")) {
    {}
  } else {
    stryCov_9fa48("4901");
    const filename = stryMutAct_9fa48("4902") ? `` : (stryCov_9fa48("4902"), `${Date.now()}-${stryMutAct_9fa48("4903") ? Math.random().toString(36) : (stryCov_9fa48("4903"), Math.random().toString(36).slice(2, 8))}.jpg`);
    const path = stryMutAct_9fa48("4904") ? `` : (stryCov_9fa48("4904"), `posts/${userId}/${filename}`);
    return uploadFile(uri, path);
  }
}
export async function uploadEventHeroImage(uri: string, eventId: string): Promise<string> {
  if (stryMutAct_9fa48("4905")) {
    {}
  } else {
    stryCov_9fa48("4905");
    const filename = stryMutAct_9fa48("4906") ? `` : (stryCov_9fa48("4906"), `hero-${Date.now()}.jpg`);
    const path = stryMutAct_9fa48("4907") ? `` : (stryCov_9fa48("4907"), `events/${eventId}/${filename}`);
    return uploadFile(uri, path);
  }
}
export async function uploadEventImageTemp(uri: string, userId: string): Promise<string> {
  if (stryMutAct_9fa48("4908")) {
    {}
  } else {
    stryCov_9fa48("4908");
    const filename = stryMutAct_9fa48("4909") ? `` : (stryCov_9fa48("4909"), `${Date.now()}-${stryMutAct_9fa48("4910") ? Math.random().toString(36) : (stryCov_9fa48("4910"), Math.random().toString(36).slice(2, 8))}.jpg`);
    const path = stryMutAct_9fa48("4911") ? `` : (stryCov_9fa48("4911"), `events/temp/${userId}/${filename}`);
    return uploadFile(uri, path);
  }
}
export interface LayoverPlannerPreferences {
  layoverWindowId: '2_4' | '4_8' | '8_16';
  anchorId: 'city' | 'airport' | 'port';
  routeProfileId: 'fast' | 'balanced' | 'safe';
  openNowOnly: boolean;
  quietOnly: boolean;
  crewFriendlyOnly: boolean;
}
const LAYOVER_PREFS_STORAGE_KEY = stryMutAct_9fa48("4912") ? "" : (stryCov_9fa48("4912"), '@culturepass:discover:layover-prefs:v1');
const TRAVEL_MODE_STORAGE_KEY = stryMutAct_9fa48("4913") ? "" : (stryCov_9fa48("4913"), '@culturepass:discover:travel-mode:v1');
function layoverPrefsKey(userId?: string | null) {
  if (stryMutAct_9fa48("4914")) {
    {}
  } else {
    stryCov_9fa48("4914");
    return userId ? stryMutAct_9fa48("4915") ? `` : (stryCov_9fa48("4915"), `${LAYOVER_PREFS_STORAGE_KEY}:${userId}`) : stryMutAct_9fa48("4916") ? `` : (stryCov_9fa48("4916"), `${LAYOVER_PREFS_STORAGE_KEY}:guest`);
  }
}
function travelModeKey(userId?: string | null) {
  if (stryMutAct_9fa48("4917")) {
    {}
  } else {
    stryCov_9fa48("4917");
    return userId ? stryMutAct_9fa48("4918") ? `` : (stryCov_9fa48("4918"), `${TRAVEL_MODE_STORAGE_KEY}:${userId}`) : stryMutAct_9fa48("4919") ? `` : (stryCov_9fa48("4919"), `${TRAVEL_MODE_STORAGE_KEY}:guest`);
  }
}
export async function getLayoverPlannerPreferences(userId?: string | null): Promise<LayoverPlannerPreferences | null> {
  if (stryMutAct_9fa48("4920")) {
    {}
  } else {
    stryCov_9fa48("4920");
    try {
      if (stryMutAct_9fa48("4921")) {
        {}
      } else {
        stryCov_9fa48("4921");
        const raw = await AsyncStorage.getItem(layoverPrefsKey(userId));
        if (stryMutAct_9fa48("4924") ? false : stryMutAct_9fa48("4923") ? true : stryMutAct_9fa48("4922") ? raw : (stryCov_9fa48("4922", "4923", "4924"), !raw)) return null;
        const parsed = JSON.parse(raw) as Partial<LayoverPlannerPreferences>;
        if (stryMutAct_9fa48("4927") ? false : stryMutAct_9fa48("4926") ? true : stryMutAct_9fa48("4925") ? parsed : (stryCov_9fa48("4925", "4926", "4927"), !parsed)) return null;
        return stryMutAct_9fa48("4928") ? {} : (stryCov_9fa48("4928"), {
          layoverWindowId: stryMutAct_9fa48("4929") ? parsed.layoverWindowId && '4_8' : (stryCov_9fa48("4929"), parsed.layoverWindowId ?? (stryMutAct_9fa48("4930") ? "" : (stryCov_9fa48("4930"), '4_8'))),
          anchorId: stryMutAct_9fa48("4931") ? parsed.anchorId && 'city' : (stryCov_9fa48("4931"), parsed.anchorId ?? (stryMutAct_9fa48("4932") ? "" : (stryCov_9fa48("4932"), 'city'))),
          routeProfileId: stryMutAct_9fa48("4933") ? parsed.routeProfileId && 'balanced' : (stryCov_9fa48("4933"), parsed.routeProfileId ?? (stryMutAct_9fa48("4934") ? "" : (stryCov_9fa48("4934"), 'balanced'))),
          openNowOnly: Boolean(parsed.openNowOnly),
          quietOnly: Boolean(parsed.quietOnly),
          crewFriendlyOnly: Boolean(parsed.crewFriendlyOnly)
        });
      }
    } catch {
      if (stryMutAct_9fa48("4935")) {
        {}
      } else {
        stryCov_9fa48("4935");
        return null;
      }
    }
  }
}
export async function saveLayoverPlannerPreferences(prefs: LayoverPlannerPreferences, userId?: string | null): Promise<void> {
  if (stryMutAct_9fa48("4936")) {
    {}
  } else {
    stryCov_9fa48("4936");
    try {
      if (stryMutAct_9fa48("4937")) {
        {}
      } else {
        stryCov_9fa48("4937");
        await AsyncStorage.setItem(layoverPrefsKey(userId), JSON.stringify(prefs));
      }
    } catch {
      // No-op: this cache is a convenience enhancement and should never block UX.
    }
  }
}
export async function getTravelModeEnabled(userId?: string | null): Promise<boolean> {
  if (stryMutAct_9fa48("4938")) {
    {}
  } else {
    stryCov_9fa48("4938");
    try {
      if (stryMutAct_9fa48("4939")) {
        {}
      } else {
        stryCov_9fa48("4939");
        const raw = await AsyncStorage.getItem(travelModeKey(userId));
        if (stryMutAct_9fa48("4942") ? raw != null : stryMutAct_9fa48("4941") ? false : stryMutAct_9fa48("4940") ? true : (stryCov_9fa48("4940", "4941", "4942"), raw == null)) return stryMutAct_9fa48("4943") ? true : (stryCov_9fa48("4943"), false);
        return stryMutAct_9fa48("4946") ? raw !== '1' : stryMutAct_9fa48("4945") ? false : stryMutAct_9fa48("4944") ? true : (stryCov_9fa48("4944", "4945", "4946"), raw === (stryMutAct_9fa48("4947") ? "" : (stryCov_9fa48("4947"), '1')));
      }
    } catch {
      if (stryMutAct_9fa48("4948")) {
        {}
      } else {
        stryCov_9fa48("4948");
        return stryMutAct_9fa48("4949") ? true : (stryCov_9fa48("4949"), false);
      }
    }
  }
}
export async function saveTravelModeEnabled(enabled: boolean, userId?: string | null): Promise<void> {
  if (stryMutAct_9fa48("4950")) {
    {}
  } else {
    stryCov_9fa48("4950");
    try {
      if (stryMutAct_9fa48("4951")) {
        {}
      } else {
        stryCov_9fa48("4951");
        await AsyncStorage.setItem(travelModeKey(userId), enabled ? stryMutAct_9fa48("4952") ? "" : (stryCov_9fa48("4952"), '1') : stryMutAct_9fa48("4953") ? "" : (stryCov_9fa48("4953"), '0'));
      }
    } catch {
      // No-op: preference persistence should never block core flows.
    }
  }
}