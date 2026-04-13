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
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * CulturePassAU Sydney Image Utils v2.0
 * Avatar optimization + Sydney event photos
 * Native + Web optimized
 */

export type { ImageResult, SaveFormat } from 'expo-image-manipulator';
export { manipulateAsync } from 'expo-image-manipulator';

/**
 * Sydney-optimized avatar compressor
 * Perfect for profile pics (300x300, <2MB)
 */
export async function compressAvatar(uri: string): Promise<string> {
  if (stryMutAct_9fa48("3320")) {
    {}
  } else {
    stryCov_9fa48("3320");
    try {
      if (stryMutAct_9fa48("3321")) {
        {}
      } else {
        stryCov_9fa48("3321");
        const result = await ImageManipulator.manipulateAsync(uri, stryMutAct_9fa48("3322") ? [] : (stryCov_9fa48("3322"), [stryMutAct_9fa48("3323") ? {} : (stryCov_9fa48("3323"), {
          resize: stryMutAct_9fa48("3324") ? {} : (stryCov_9fa48("3324"), {
            width: 400,
            height: 400
          })
        })]), // Square crop ready
        stryMutAct_9fa48("3325") ? {} : (stryCov_9fa48("3325"), {
          compress: 0.85,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: stryMutAct_9fa48("3326") ? true : (stryCov_9fa48("3326"), false)
        }));

        // Sydney naming convention
        const filename = stryMutAct_9fa48("3327") ? `` : (stryCov_9fa48("3327"), `avatar-${Date.now()}.jpg`);
        const path = stryMutAct_9fa48("3328") ? `` : (stryCov_9fa48("3328"), `${FileSystem.cacheDirectory}${filename}`);
        await FileSystem.moveAsync(stryMutAct_9fa48("3329") ? {} : (stryCov_9fa48("3329"), {
          from: result.uri,
          to: path
        }));
        return path;
      }
    } catch (error) {
      if (stryMutAct_9fa48("3330")) {
        {}
      } else {
        stryCov_9fa48("3330");
        console.error(stryMutAct_9fa48("3331") ? "" : (stryCov_9fa48("3331"), 'Avatar compression failed:'), error);
        return uri; // Fallback to original
      }
    }
  }
}

/**
 * Event photo optimizer (Sydney venues, Kerala festivals)
 * 1080x1080 max, WebP (web), JPEG (native)
 */
export async function optimizeEventPhoto(uri: string, options: {
  maxDimension?: number;
  quality?: number;
} = {}): Promise<string> {
  if (stryMutAct_9fa48("3332")) {
    {}
  } else {
    stryCov_9fa48("3332");
    const {
      maxDimension = 1080,
      quality = 0.88
    } = options;
    try {
      if (stryMutAct_9fa48("3333")) {
        {}
      } else {
        stryCov_9fa48("3333");
        const result = await ImageManipulator.manipulateAsync(uri, stryMutAct_9fa48("3334") ? [] : (stryCov_9fa48("3334"), [stryMutAct_9fa48("3335") ? {} : (stryCov_9fa48("3335"), {
          resize: stryMutAct_9fa48("3336") ? {} : (stryCov_9fa48("3336"), {
            width: maxDimension
          })
        })]), stryMutAct_9fa48("3337") ? {} : (stryCov_9fa48("3337"), {
          compress: quality,
          format: (stryMutAct_9fa48("3340") ? Platform.OS !== 'web' : stryMutAct_9fa48("3339") ? false : stryMutAct_9fa48("3338") ? true : (stryCov_9fa48("3338", "3339", "3340"), Platform.OS === (stryMutAct_9fa48("3341") ? "" : (stryCov_9fa48("3341"), 'web')))) ? ImageManipulator.SaveFormat.WEBP : ImageManipulator.SaveFormat.JPEG
        }));
        return result.uri;
      }
    } catch (error) {
      if (stryMutAct_9fa48("3342")) {
        {}
      } else {
        stryCov_9fa48("3342");
        console.error(stryMutAct_9fa48("3343") ? "" : (stryCov_9fa48("3343"), 'Event photo optimization failed:'), error);
        Alert.alert(stryMutAct_9fa48("3344") ? "" : (stryCov_9fa48("3344"), 'Image Error'), stryMutAct_9fa48("3345") ? "" : (stryCov_9fa48("3345"), 'Could not optimize photo'));
        return uri;
      }
    }
  }
}

/**
 * Sydney story thumbnail generator
 * Perfect for event previews (400x400)
 */
export async function generateThumbnail(uri: string): Promise<string> {
  if (stryMutAct_9fa48("3346")) {
    {}
  } else {
    stryCov_9fa48("3346");
    try {
      if (stryMutAct_9fa48("3347")) {
        {}
      } else {
        stryCov_9fa48("3347");
        const result = await ImageManipulator.manipulateAsync(uri, stryMutAct_9fa48("3348") ? [] : (stryCov_9fa48("3348"), [stryMutAct_9fa48("3349") ? {} : (stryCov_9fa48("3349"), {
          resize: stryMutAct_9fa48("3350") ? {} : (stryCov_9fa48("3350"), {
            width: 400
          })
        }), stryMutAct_9fa48("3351") ? {} : (stryCov_9fa48("3351"), {
          rotate: 0
        }) // Ensure upright
        ]), stryMutAct_9fa48("3352") ? {} : (stryCov_9fa48("3352"), {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG
        }));
        return result.uri;
      }
    } catch (error) {
      if (stryMutAct_9fa48("3353")) {
        {}
      } else {
        stryCov_9fa48("3353");
        console.error(stryMutAct_9fa48("3354") ? "" : (stryCov_9fa48("3354"), 'Thumbnail generation failed:'), error);
        return uri;
      }
    }
  }
}

/**
 * Multiple image batch processor (Sydney event galleries)
 */
export async function processImageBatch(uris: string[], options: Parameters<typeof optimizeEventPhoto>[1]): Promise<string[]> {
  if (stryMutAct_9fa48("3355")) {
    {}
  } else {
    stryCov_9fa48("3355");
    const results = await Promise.allSettled(uris.map(stryMutAct_9fa48("3356") ? () => undefined : (stryCov_9fa48("3356"), uri => optimizeEventPhoto(uri, options))));
    return stryMutAct_9fa48("3357") ? results.map(r => r.value) : (stryCov_9fa48("3357"), results.filter(stryMutAct_9fa48("3358") ? () => undefined : (stryCov_9fa48("3358"), (result): result is PromiseFulfilledResult<string> => stryMutAct_9fa48("3361") ? result.status !== 'fulfilled' : stryMutAct_9fa48("3360") ? false : stryMutAct_9fa48("3359") ? true : (stryCov_9fa48("3359", "3360", "3361"), result.status === (stryMutAct_9fa48("3362") ? "" : (stryCov_9fa48("3362"), 'fulfilled'))))).map(stryMutAct_9fa48("3363") ? () => undefined : (stryCov_9fa48("3363"), r => r.value)));
  }
}

/**
 * Profile photo presets (Sydney networking)
 */
export const ProfilePresets = stryMutAct_9fa48("3364") ? {} : (stryCov_9fa48("3364"), {
  avatar: stryMutAct_9fa48("3365") ? {} : (stryCov_9fa48("3365"), {
    maxDimension: 400,
    quality: 0.85
  }),
  coverPhoto: stryMutAct_9fa48("3366") ? {} : (stryCov_9fa48("3366"), {
    maxDimension: 1200,
    quality: 0.9
  }),
  storyThumbnail: stryMutAct_9fa48("3367") ? {} : (stryCov_9fa48("3367"), {
    maxDimension: 400,
    quality: 0.8
  })
});

/**
 * Image validation (Sydney upload limits)
 */
export function validateImage(uri: string): Promise<{
  valid: boolean;
  size: number;
  width: number;
  height: number;
}> {
  if (stryMutAct_9fa48("3368")) {
    {}
  } else {
    stryCov_9fa48("3368");
    return new Promise(resolve => {
      if (stryMutAct_9fa48("3369")) {
        {}
      } else {
        stryCov_9fa48("3369");
        ImageManipulator.manipulateAsync(uri, stryMutAct_9fa48("3370") ? ["Stryker was here"] : (stryCov_9fa48("3370"), []), stryMutAct_9fa48("3371") ? {} : (stryCov_9fa48("3371"), {
          base64: stryMutAct_9fa48("3372") ? false : (stryCov_9fa48("3372"), true)
        })).then(result => {
          if (stryMutAct_9fa48("3373")) {
            {}
          } else {
            stryCov_9fa48("3373");
            const sizeKB = stryMutAct_9fa48("3374") ? result.base64!.length * 3 / 4 * 1024 : (stryCov_9fa48("3374"), (stryMutAct_9fa48("3375") ? result.base64!.length * 3 * 4 : (stryCov_9fa48("3375"), (stryMutAct_9fa48("3376") ? result.base64!.length / 3 : (stryCov_9fa48("3376"), result.base64!.length * 3)) / 4)) / 1024); // Base64 overhead
            resolve(stryMutAct_9fa48("3377") ? {} : (stryCov_9fa48("3377"), {
              valid: stryMutAct_9fa48("3381") ? sizeKB >= 5000 : stryMutAct_9fa48("3380") ? sizeKB <= 5000 : stryMutAct_9fa48("3379") ? false : stryMutAct_9fa48("3378") ? true : (stryCov_9fa48("3378", "3379", "3380", "3381"), sizeKB < 5000),
              // 5MB max
              size: sizeKB,
              width: stryMutAct_9fa48("3384") ? result.width && 0 : stryMutAct_9fa48("3383") ? false : stryMutAct_9fa48("3382") ? true : (stryCov_9fa48("3382", "3383", "3384"), result.width || 0),
              height: stryMutAct_9fa48("3387") ? result.height && 0 : stryMutAct_9fa48("3386") ? false : stryMutAct_9fa48("3385") ? true : (stryCov_9fa48("3385", "3386", "3387"), result.height || 0)
            }));
          }
        }).catch(stryMutAct_9fa48("3388") ? () => undefined : (stryCov_9fa48("3388"), () => resolve(stryMutAct_9fa48("3389") ? {} : (stryCov_9fa48("3389"), {
          valid: stryMutAct_9fa48("3390") ? true : (stryCov_9fa48("3390"), false),
          size: 0,
          width: 0,
          height: 0
        }))));
      }
    });
  }
}

// Web Canvas fallback (already handled by .web.ts)
if (stryMutAct_9fa48("3393") ? Platform.OS !== 'web' : stryMutAct_9fa48("3392") ? false : stryMutAct_9fa48("3391") ? true : (stryCov_9fa48("3391", "3392", "3393"), Platform.OS === (stryMutAct_9fa48("3394") ? "" : (stryCov_9fa48("3394"), 'web')))) {}
export default stryMutAct_9fa48("3395") ? {} : (stryCov_9fa48("3395"), {
  compressAvatar,
  optimizeEventPhoto,
  generateThumbnail,
  processImageBatch,
  validateImage,
  ProfilePresets
});