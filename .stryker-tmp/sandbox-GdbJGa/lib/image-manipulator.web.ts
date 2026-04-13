/**
 * CulturePassAU Sydney Web Image Manipulator v2.1
 * Production Canvas + Sydney event photo perfection
 * Kerala festival galleries + Sydney avatars optimized
 */
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
export enum SaveFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
}
export interface ImageResult {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  mimeType: string;
  fileSizeKB?: number;
}
type ActionResize = {
  resize: {
    width?: number;
    height?: number;
    method?: 'contain' | 'cover' | 'stretch' | 'fill';
  };
};
type ActionRotate = {
  rotate: number;
};
type ActionFlip = {
  flip: 'vertical' | 'horizontal';
};
type ActionCrop = {
  crop: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
};
export type Action = ActionResize | ActionRotate | ActionFlip | ActionCrop;
interface SaveOptions {
  base64?: boolean;
  compress?: number;
  format?: SaveFormat;
  exif?: boolean;
}
function loadImage(uri: string): Promise<HTMLImageElement> {
  if (stryMutAct_9fa48("3541")) {
    {}
  } else {
    stryCov_9fa48("3541");
    return new Promise((resolve, reject) => {
      if (stryMutAct_9fa48("3542")) {
        {}
      } else {
        stryCov_9fa48("3542");
        const img = new Image();
        img.crossOrigin = stryMutAct_9fa48("3543") ? "" : (stryCov_9fa48("3543"), 'anonymous');
        img.loading = stryMutAct_9fa48("3544") ? "" : (stryCov_9fa48("3544"), 'eager');
        img.decoding = stryMutAct_9fa48("3545") ? "" : (stryCov_9fa48("3545"), 'sync');
        img.onload = stryMutAct_9fa48("3546") ? () => undefined : (stryCov_9fa48("3546"), () => resolve(img));
        img.onerror = stryMutAct_9fa48("3547") ? () => undefined : (stryCov_9fa48("3547"), () => reject(new Error(stryMutAct_9fa48("3548") ? `` : (stryCov_9fa48("3548"), `Failed to load: ${uri}`))));

        // Sydney event photo optimization
        img.src = stryMutAct_9fa48("3549") ? uri - (uri.includes('event') ? '?w=1600' : '') : (stryCov_9fa48("3549"), uri + (uri.includes(stryMutAct_9fa48("3550") ? "" : (stryCov_9fa48("3550"), 'event')) ? stryMutAct_9fa48("3551") ? "" : (stryCov_9fa48("3551"), '?w=1600') : stryMutAct_9fa48("3552") ? "Stryker was here!" : (stryCov_9fa48("3552"), '')));
      }
    });
  }
}
function getMimeType(format: SaveFormat): string {
  if (stryMutAct_9fa48("3553")) {
    {}
  } else {
    stryCov_9fa48("3553");
    const types: Record<SaveFormat, string> = stryMutAct_9fa48("3554") ? {} : (stryCov_9fa48("3554"), {
      [SaveFormat.PNG]: stryMutAct_9fa48("3555") ? "" : (stryCov_9fa48("3555"), 'image/png'),
      [SaveFormat.WEBP]: stryMutAct_9fa48("3556") ? "" : (stryCov_9fa48("3556"), 'image/webp'),
      [SaveFormat.JPEG]: stryMutAct_9fa48("3557") ? "" : (stryCov_9fa48("3557"), 'image/jpeg')
    });
    return stryMutAct_9fa48("3558") ? types[format] && 'image/jpeg' : (stryCov_9fa48("3558"), types[format] ?? (stryMutAct_9fa48("3559") ? "" : (stryCov_9fa48("3559"), 'image/jpeg')));
  }
}
function calculateFileSize(dataUrl: string): number {
  if (stryMutAct_9fa48("3560")) {
    {}
  } else {
    stryCov_9fa48("3560");
    // Base64 → bytes (33% overhead)
    return Math.round(stryMutAct_9fa48("3561") ? (dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75 * 1024 : (stryCov_9fa48("3561"), (stryMutAct_9fa48("3562") ? (dataUrl.length - dataUrl.indexOf(',') - 1) / 0.75 : (stryCov_9fa48("3562"), (stryMutAct_9fa48("3563") ? dataUrl.length - dataUrl.indexOf(',') + 1 : (stryCov_9fa48("3563"), (stryMutAct_9fa48("3564") ? dataUrl.length + dataUrl.indexOf(',') : (stryCov_9fa48("3564"), dataUrl.length - dataUrl.indexOf(stryMutAct_9fa48("3565") ? "" : (stryCov_9fa48("3565"), ',')))) - 1)) * 0.75)) / 1024));
  }
}
function resizeSmart(canvas: HTMLCanvasElement, targetWidth: number, targetHeight: number, method: 'contain' | 'cover' | 'stretch' | 'fill' = stryMutAct_9fa48("3566") ? "" : (stryCov_9fa48("3566"), 'contain')): HTMLCanvasElement {
  if (stryMutAct_9fa48("3567")) {
    {}
  } else {
    stryCov_9fa48("3567");
    const ctx = canvas.getContext(stryMutAct_9fa48("3568") ? "" : (stryCov_9fa48("3568"), '2d'))!;
    const aspect = stryMutAct_9fa48("3569") ? canvas.width * canvas.height : (stryCov_9fa48("3569"), canvas.width / canvas.height);
    let drawWidth = targetWidth;
    let drawHeight = targetHeight;
    let offsetX = 0;
    let offsetY = 0;
    if (stryMutAct_9fa48("3572") ? method !== 'contain' : stryMutAct_9fa48("3571") ? false : stryMutAct_9fa48("3570") ? true : (stryCov_9fa48("3570", "3571", "3572"), method === (stryMutAct_9fa48("3573") ? "" : (stryCov_9fa48("3573"), 'contain')))) {
      if (stryMutAct_9fa48("3574")) {
        {}
      } else {
        stryCov_9fa48("3574");
        if (stryMutAct_9fa48("3578") ? aspect <= targetWidth / targetHeight : stryMutAct_9fa48("3577") ? aspect >= targetWidth / targetHeight : stryMutAct_9fa48("3576") ? false : stryMutAct_9fa48("3575") ? true : (stryCov_9fa48("3575", "3576", "3577", "3578"), aspect > (stryMutAct_9fa48("3579") ? targetWidth * targetHeight : (stryCov_9fa48("3579"), targetWidth / targetHeight)))) {
          if (stryMutAct_9fa48("3580")) {
            {}
          } else {
            stryCov_9fa48("3580");
            drawHeight = stryMutAct_9fa48("3581") ? targetWidth * aspect : (stryCov_9fa48("3581"), targetWidth / aspect);
            offsetY = stryMutAct_9fa48("3582") ? (targetHeight - drawHeight) * 2 : (stryCov_9fa48("3582"), (stryMutAct_9fa48("3583") ? targetHeight + drawHeight : (stryCov_9fa48("3583"), targetHeight - drawHeight)) / 2);
          }
        } else {
          if (stryMutAct_9fa48("3584")) {
            {}
          } else {
            stryCov_9fa48("3584");
            drawWidth = stryMutAct_9fa48("3585") ? targetHeight / aspect : (stryCov_9fa48("3585"), targetHeight * aspect);
            offsetX = stryMutAct_9fa48("3586") ? (targetWidth - drawWidth) * 2 : (stryCov_9fa48("3586"), (stryMutAct_9fa48("3587") ? targetWidth + drawWidth : (stryCov_9fa48("3587"), targetWidth - drawWidth)) / 2);
          }
        }
      }
    } else if (stryMutAct_9fa48("3590") ? method !== 'cover' : stryMutAct_9fa48("3589") ? false : stryMutAct_9fa48("3588") ? true : (stryCov_9fa48("3588", "3589", "3590"), method === (stryMutAct_9fa48("3591") ? "" : (stryCov_9fa48("3591"), 'cover')))) {
      if (stryMutAct_9fa48("3592")) {
        {}
      } else {
        stryCov_9fa48("3592");
        if (stryMutAct_9fa48("3596") ? aspect <= targetWidth / targetHeight : stryMutAct_9fa48("3595") ? aspect >= targetWidth / targetHeight : stryMutAct_9fa48("3594") ? false : stryMutAct_9fa48("3593") ? true : (stryCov_9fa48("3593", "3594", "3595", "3596"), aspect > (stryMutAct_9fa48("3597") ? targetWidth * targetHeight : (stryCov_9fa48("3597"), targetWidth / targetHeight)))) {
          if (stryMutAct_9fa48("3598")) {
            {}
          } else {
            stryCov_9fa48("3598");
            drawWidth = targetWidth;
            drawHeight = stryMutAct_9fa48("3599") ? targetWidth * aspect : (stryCov_9fa48("3599"), targetWidth / aspect);
            offsetY = stryMutAct_9fa48("3600") ? (targetHeight - drawHeight) * 2 : (stryCov_9fa48("3600"), (stryMutAct_9fa48("3601") ? targetHeight + drawHeight : (stryCov_9fa48("3601"), targetHeight - drawHeight)) / 2);
          }
        } else {
          if (stryMutAct_9fa48("3602")) {
            {}
          } else {
            stryCov_9fa48("3602");
            drawHeight = targetHeight;
            drawWidth = stryMutAct_9fa48("3603") ? targetHeight / aspect : (stryCov_9fa48("3603"), targetHeight * aspect);
            offsetX = stryMutAct_9fa48("3604") ? (targetWidth - drawWidth) * 2 : (stryCov_9fa48("3604"), (stryMutAct_9fa48("3605") ? targetWidth + drawWidth : (stryCov_9fa48("3605"), targetWidth - drawWidth)) / 2);
          }
        }
      }
    }

    // High-quality resampling
    ctx.imageSmoothingEnabled = stryMutAct_9fa48("3606") ? false : (stryCov_9fa48("3606"), true);
    ctx.imageSmoothingQuality = stryMutAct_9fa48("3607") ? "" : (stryCov_9fa48("3607"), 'high');
    const resized = document.createElement(stryMutAct_9fa48("3608") ? "" : (stryCov_9fa48("3608"), 'canvas'));
    resized.width = targetWidth;
    resized.height = targetHeight;
    const rCtx = resized.getContext(stryMutAct_9fa48("3609") ? "" : (stryCov_9fa48("3609"), '2d'))!;
    rCtx.imageSmoothingEnabled = stryMutAct_9fa48("3610") ? false : (stryCov_9fa48("3610"), true);
    rCtx.imageSmoothingQuality = stryMutAct_9fa48("3611") ? "" : (stryCov_9fa48("3611"), 'high');
    rCtx.fillStyle = stryMutAct_9fa48("3612") ? "" : (stryCov_9fa48("3612"), 'white'); // Sydney white background
    rCtx.fillRect(0, 0, targetWidth, targetHeight);
    rCtx.drawImage(canvas, offsetX, offsetY, drawWidth, drawHeight);
    return resized;
  }
}

/**
 * Sydney-optimized production image manipulator
 * Avatars (1:1), Events (16:9), Stories (9:16)
 */
export async function manipulateAsync(uri: string, actions: Action[] = stryMutAct_9fa48("3613") ? ["Stryker was here"] : (stryCov_9fa48("3613"), []), saveOptions: SaveOptions = {}): Promise<ImageResult> {
  if (stryMutAct_9fa48("3614")) {
    {}
  } else {
    stryCov_9fa48("3614");
    try {
      if (stryMutAct_9fa48("3615")) {
        {}
      } else {
        stryCov_9fa48("3615");
        const img = await loadImage(uri);
        let canvas = document.createElement(stryMutAct_9fa48("3616") ? "" : (stryCov_9fa48("3616"), 'canvas'));
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext(stryMutAct_9fa48("3617") ? "" : (stryCov_9fa48("3617"), '2d'))!;
        ctx.imageSmoothingQuality = stryMutAct_9fa48("3618") ? "" : (stryCov_9fa48("3618"), 'high');
        ctx.imageSmoothingEnabled = stryMutAct_9fa48("3619") ? false : (stryCov_9fa48("3619"), true);
        ctx.drawImage(img, 0, 0);

        // Process actions (Sydney event photo optimized)
        for (const action of actions) {
          if (stryMutAct_9fa48("3620")) {
            {}
          } else {
            stryCov_9fa48("3620");
            if (stryMutAct_9fa48("3622") ? false : stryMutAct_9fa48("3621") ? true : (stryCov_9fa48("3621", "3622"), (stryMutAct_9fa48("3623") ? "" : (stryCov_9fa48("3623"), 'resize')) in action)) {
              if (stryMutAct_9fa48("3624")) {
                {}
              } else {
                stryCov_9fa48("3624");
                const targetW = stryMutAct_9fa48("3625") ? action.resize.width && 1080 : (stryCov_9fa48("3625"), action.resize.width ?? 1080); // Sydney event default
                const targetH = stryMutAct_9fa48("3626") ? action.resize.height && 1080 : (stryCov_9fa48("3626"), action.resize.height ?? 1080);
                canvas = resizeSmart(canvas, targetW, targetH, stryMutAct_9fa48("3627") ? action.resize.method && 'contain' : (stryCov_9fa48("3627"), action.resize.method ?? (stryMutAct_9fa48("3628") ? "" : (stryCov_9fa48("3628"), 'contain'))));
              }
            } else if (stryMutAct_9fa48("3630") ? false : stryMutAct_9fa48("3629") ? true : (stryCov_9fa48("3629", "3630"), (stryMutAct_9fa48("3631") ? "" : (stryCov_9fa48("3631"), 'rotate')) in action)) {
              if (stryMutAct_9fa48("3632")) {
                {}
              } else {
                stryCov_9fa48("3632");
                const radians = stryMutAct_9fa48("3633") ? action.rotate * Math.PI * 180 : (stryCov_9fa48("3633"), (stryMutAct_9fa48("3634") ? action.rotate / Math.PI : (stryCov_9fa48("3634"), action.rotate * Math.PI)) / 180);
                const newW = Math.round(stryMutAct_9fa48("3635") ? canvas.width * Math.abs(Math.cos(radians)) - canvas.height * Math.abs(Math.sin(radians)) : (stryCov_9fa48("3635"), (stryMutAct_9fa48("3636") ? canvas.width / Math.abs(Math.cos(radians)) : (stryCov_9fa48("3636"), canvas.width * Math.abs(Math.cos(radians)))) + (stryMutAct_9fa48("3637") ? canvas.height / Math.abs(Math.sin(radians)) : (stryCov_9fa48("3637"), canvas.height * Math.abs(Math.sin(radians))))));
                const newH = Math.round(stryMutAct_9fa48("3638") ? canvas.width * Math.abs(Math.sin(radians)) - canvas.height * Math.abs(Math.cos(radians)) : (stryCov_9fa48("3638"), (stryMutAct_9fa48("3639") ? canvas.width / Math.abs(Math.sin(radians)) : (stryCov_9fa48("3639"), canvas.width * Math.abs(Math.sin(radians)))) + (stryMutAct_9fa48("3640") ? canvas.height / Math.abs(Math.cos(radians)) : (stryCov_9fa48("3640"), canvas.height * Math.abs(Math.cos(radians))))));
                const rotated = document.createElement(stryMutAct_9fa48("3641") ? "" : (stryCov_9fa48("3641"), 'canvas'));
                rotated.width = newW;
                rotated.height = newH;
                const rCtx = rotated.getContext(stryMutAct_9fa48("3642") ? "" : (stryCov_9fa48("3642"), '2d'))!;
                rCtx.translate(stryMutAct_9fa48("3643") ? newW * 2 : (stryCov_9fa48("3643"), newW / 2), stryMutAct_9fa48("3644") ? newH * 2 : (stryCov_9fa48("3644"), newH / 2));
                rCtx.rotate(radians);
                rCtx.drawImage(canvas, stryMutAct_9fa48("3645") ? -canvas.width * 2 : (stryCov_9fa48("3645"), (stryMutAct_9fa48("3646") ? +canvas.width : (stryCov_9fa48("3646"), -canvas.width)) / 2), stryMutAct_9fa48("3647") ? -canvas.height * 2 : (stryCov_9fa48("3647"), (stryMutAct_9fa48("3648") ? +canvas.height : (stryCov_9fa48("3648"), -canvas.height)) / 2));
                canvas = rotated;
              }
            } else if (stryMutAct_9fa48("3650") ? false : stryMutAct_9fa48("3649") ? true : (stryCov_9fa48("3649", "3650"), (stryMutAct_9fa48("3651") ? "" : (stryCov_9fa48("3651"), 'flip')) in action)) {
              if (stryMutAct_9fa48("3652")) {
                {}
              } else {
                stryCov_9fa48("3652");
                const flipped = document.createElement(stryMutAct_9fa48("3653") ? "" : (stryCov_9fa48("3653"), 'canvas'));
                flipped.width = canvas.width;
                flipped.height = canvas.height;
                const fCtx = flipped.getContext(stryMutAct_9fa48("3654") ? "" : (stryCov_9fa48("3654"), '2d'))!;
                if (stryMutAct_9fa48("3657") ? action.flip !== 'horizontal' : stryMutAct_9fa48("3656") ? false : stryMutAct_9fa48("3655") ? true : (stryCov_9fa48("3655", "3656", "3657"), action.flip === (stryMutAct_9fa48("3658") ? "" : (stryCov_9fa48("3658"), 'horizontal')))) {
                  if (stryMutAct_9fa48("3659")) {
                    {}
                  } else {
                    stryCov_9fa48("3659");
                    fCtx.scale(stryMutAct_9fa48("3660") ? +1 : (stryCov_9fa48("3660"), -1), 1);
                    fCtx.drawImage(canvas, stryMutAct_9fa48("3661") ? +canvas.width : (stryCov_9fa48("3661"), -canvas.width), 0);
                  }
                } else {
                  if (stryMutAct_9fa48("3662")) {
                    {}
                  } else {
                    stryCov_9fa48("3662");
                    fCtx.scale(1, stryMutAct_9fa48("3663") ? +1 : (stryCov_9fa48("3663"), -1));
                    fCtx.drawImage(canvas, 0, stryMutAct_9fa48("3664") ? +canvas.height : (stryCov_9fa48("3664"), -canvas.height));
                  }
                }
                canvas = flipped;
              }
            } else if (stryMutAct_9fa48("3666") ? false : stryMutAct_9fa48("3665") ? true : (stryCov_9fa48("3665", "3666"), (stryMutAct_9fa48("3667") ? "" : (stryCov_9fa48("3667"), 'crop')) in action)) {
              if (stryMutAct_9fa48("3668")) {
                {}
              } else {
                stryCov_9fa48("3668");
                const {
                  originX,
                  originY,
                  width,
                  height
                } = action.crop;
                const cropped = document.createElement(stryMutAct_9fa48("3669") ? "" : (stryCov_9fa48("3669"), 'canvas'));
                cropped.width = width;
                cropped.height = height;
                const cCtx = cropped.getContext(stryMutAct_9fa48("3670") ? "" : (stryCov_9fa48("3670"), '2d'))!;
                cCtx.imageSmoothingQuality = stryMutAct_9fa48("3671") ? "" : (stryCov_9fa48("3671"), 'high');
                cCtx.drawImage(canvas, originX, originY, width, height, 0, 0, width, height);
                canvas = cropped;
              }
            }
          }
        }

        // Production save options
        const format = stryMutAct_9fa48("3672") ? saveOptions.format && SaveFormat.WEBP : (stryCov_9fa48("3672"), saveOptions.format ?? SaveFormat.WEBP);
        const quality = stryMutAct_9fa48("3673") ? Math.min(0.7, Math.min(saveOptions.compress ?? 0.88, 0.95)) : (stryCov_9fa48("3673"), Math.max(0.7, stryMutAct_9fa48("3674") ? Math.max(saveOptions.compress ?? 0.88, 0.95) : (stryCov_9fa48("3674"), Math.min(stryMutAct_9fa48("3675") ? saveOptions.compress && 0.88 : (stryCov_9fa48("3675"), saveOptions.compress ?? 0.88), 0.95))));
        const mimeType = getMimeType(format);
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const result: ImageResult = stryMutAct_9fa48("3676") ? {} : (stryCov_9fa48("3676"), {
          uri: dataUrl,
          width: canvas.width,
          height: canvas.height,
          mimeType,
          fileSizeKB: calculateFileSize(dataUrl)
        });
        if (stryMutAct_9fa48("3678") ? false : stryMutAct_9fa48("3677") ? true : (stryCov_9fa48("3677", "3678"), saveOptions.base64)) {
          if (stryMutAct_9fa48("3679")) {
            {}
          } else {
            stryCov_9fa48("3679");
            result.base64 = dataUrl.split(stryMutAct_9fa48("3680") ? "" : (stryCov_9fa48("3680"), ','))[1];
          }
        }

        // Sydney production logging

        return result;
      }
    } catch (error) {
      if (stryMutAct_9fa48("3681")) {
        {}
      } else {
        stryCov_9fa48("3681");
        console.error(stryMutAct_9fa48("3682") ? "" : (stryCov_9fa48("3682"), 'Image manipulation failed:'), error);
        throw error;
      }
    }
  }
}

// Sydney production presets
export const SydneyPresets = stryMutAct_9fa48("3683") ? {} : (stryCov_9fa48("3683"), {
  // Perfect Sydney avatars (1:1, <200KB)
  avatar: [{
    resize: {
      width: 512,
      height: 512,
      method: 'cover'
    }
  }] as Action[],
  // Event photos (16:9, Instagram-ready)
  eventPhoto: [{
    resize: {
      width: 1080,
      height: 608,
      method: 'cover'
    }
  }] as Action[],
  // Stories (9:16, vertical)
  story: [{
    resize: {
      width: 1080,
      height: 1920,
      method: 'cover'
    }
  }] as Action[],
  // Thumbnails (1:1, fast load)
  thumbnail: [{
    resize: {
      width: 400,
      height: 400,
      method: 'cover'
    }
  }] as Action[],
  // Open Graph / Twitter cards
  socialCard: [{
    resize: {
      width: 1200,
      height: 630,
      method: 'cover'
    }
  }] as Action[]
});

// Batch processor (Sydney event galleries)
export async function batchProcess(images: string[], preset: (typeof SydneyPresets)[keyof typeof SydneyPresets], maxConcurrent = 3): Promise<ImageResult[]> {
  if (stryMutAct_9fa48("3684")) {
    {}
  } else {
    stryCov_9fa48("3684");
    const results: ImageResult[] = stryMutAct_9fa48("3685") ? ["Stryker was here"] : (stryCov_9fa48("3685"), []);
    for (let i = 0; stryMutAct_9fa48("3688") ? i >= images.length : stryMutAct_9fa48("3687") ? i <= images.length : stryMutAct_9fa48("3686") ? false : (stryCov_9fa48("3686", "3687", "3688"), i < images.length); stryMutAct_9fa48("3689") ? i -= maxConcurrent : (stryCov_9fa48("3689"), i += maxConcurrent)) {
      if (stryMutAct_9fa48("3690")) {
        {}
      } else {
        stryCov_9fa48("3690");
        const batch = stryMutAct_9fa48("3691") ? images : (stryCov_9fa48("3691"), images.slice(i, stryMutAct_9fa48("3692") ? i - maxConcurrent : (stryCov_9fa48("3692"), i + maxConcurrent)));
        const batchResults = await Promise.allSettled(batch.map(stryMutAct_9fa48("3693") ? () => undefined : (stryCov_9fa48("3693"), uri => manipulateAsync(uri, preset))));
        batchResults.forEach((result, idx) => {
          if (stryMutAct_9fa48("3694")) {
            {}
          } else {
            stryCov_9fa48("3694");
            if (stryMutAct_9fa48("3697") ? result.status !== 'fulfilled' : stryMutAct_9fa48("3696") ? false : stryMutAct_9fa48("3695") ? true : (stryCov_9fa48("3695", "3696", "3697"), result.status === (stryMutAct_9fa48("3698") ? "" : (stryCov_9fa48("3698"), 'fulfilled')))) {
              if (stryMutAct_9fa48("3699")) {
                {}
              } else {
                stryCov_9fa48("3699");
                results.push(result.value);
              }
            } else {
              if (stryMutAct_9fa48("3700")) {
                {}
              } else {
                stryCov_9fa48("3700");
                console.warn(stryMutAct_9fa48("3701") ? `` : (stryCov_9fa48("3701"), `Batch failed ${stryMutAct_9fa48("3702") ? i + idx - 1 : (stryCov_9fa48("3702"), (stryMutAct_9fa48("3703") ? i - idx : (stryCov_9fa48("3703"), i + idx)) + 1)}:`), result.reason);
              }
            }
          }
        });
      }
    }
    return results;
  }
}