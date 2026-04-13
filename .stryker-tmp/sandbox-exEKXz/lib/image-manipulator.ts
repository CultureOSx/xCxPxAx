/**
 * CulturePassAU Sydney Web Image Manipulator v2.0
 * Canvas-powered fallback + Sydney optimizations
 * Perfect avatars, event photos, Kerala festival galleries
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
  exif?: Record<string, any>;
}
type ActionResize = {
  resize: {
    width?: number;
    height?: number;
    method?: 'contain' | 'cover' | 'stretch';
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
}
function loadImage(uri: string): Promise<HTMLImageElement> {
  if (stryMutAct_9fa48("3396")) {
    {}
  } else {
    stryCov_9fa48("3396");
    return new Promise((resolve, reject) => {
      if (stryMutAct_9fa48("3397")) {
        {}
      } else {
        stryCov_9fa48("3397");
        const img = new Image();
        img.crossOrigin = stryMutAct_9fa48("3398") ? "" : (stryCov_9fa48("3398"), 'anonymous');
        img.loading = stryMutAct_9fa48("3399") ? "" : (stryCov_9fa48("3399"), 'eager');
        img.onload = () => {
          if (stryMutAct_9fa48("3400")) {
            {}
          } else {
            stryCov_9fa48("3400");
            resolve(img);
          }
        };
        img.onerror = e => {
          if (stryMutAct_9fa48("3401")) {
            {}
          } else {
            stryCov_9fa48("3401");
            console.error(stryMutAct_9fa48("3402") ? "" : (stryCov_9fa48("3402"), 'Image load failed:'), uri);
            reject(e);
          }
        };

        // Sydney avatar/event photo optimization
        img.src = (stryMutAct_9fa48("3405") ? uri.includes('avatar') && uri.includes('event') : stryMutAct_9fa48("3404") ? false : stryMutAct_9fa48("3403") ? true : (stryCov_9fa48("3403", "3404", "3405"), uri.includes(stryMutAct_9fa48("3406") ? "" : (stryCov_9fa48("3406"), 'avatar')) || uri.includes(stryMutAct_9fa48("3407") ? "" : (stryCov_9fa48("3407"), 'event')))) ? uri.replace(stryMutAct_9fa48("3409") ? /w=\D+/ : stryMutAct_9fa48("3408") ? /w=\d/ : (stryCov_9fa48("3408", "3409"), /w=\d+/), stryMutAct_9fa48("3410") ? "" : (stryCov_9fa48("3410"), 'w=1200')) // High-res fetch
        : uri;
      }
    });
  }
}
function getMimeType(format: SaveFormat): string {
  if (stryMutAct_9fa48("3411")) {
    {}
  } else {
    stryCov_9fa48("3411");
    return stryMutAct_9fa48("3412") ? {
      [SaveFormat.PNG]: 'image/png',
      [SaveFormat.WEBP]: 'image/webp',
      [SaveFormat.JPEG]: 'image/jpeg'
    }[format] && 'image/jpeg' : (stryCov_9fa48("3412"), (stryMutAct_9fa48("3413") ? {} : (stryCov_9fa48("3413"), {
      [SaveFormat.PNG]: stryMutAct_9fa48("3414") ? "" : (stryCov_9fa48("3414"), 'image/png'),
      [SaveFormat.WEBP]: stryMutAct_9fa48("3415") ? "" : (stryCov_9fa48("3415"), 'image/webp'),
      [SaveFormat.JPEG]: stryMutAct_9fa48("3416") ? "" : (stryCov_9fa48("3416"), 'image/jpeg')
    }))[format] ?? (stryMutAct_9fa48("3417") ? "" : (stryCov_9fa48("3417"), 'image/jpeg')));
  }
}
function resizeCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, width: number, height: number, method: 'contain' | 'cover' | 'stretch' = stryMutAct_9fa48("3418") ? "" : (stryCov_9fa48("3418"), 'contain')): HTMLCanvasElement {
  if (stryMutAct_9fa48("3419")) {
    {}
  } else {
    stryCov_9fa48("3419");
    const resized = document.createElement(stryMutAct_9fa48("3420") ? "" : (stryCov_9fa48("3420"), 'canvas'));
    const aspect = stryMutAct_9fa48("3421") ? canvas.width * canvas.height : (stryCov_9fa48("3421"), canvas.width / canvas.height);
    let targetW = width,
      targetH = height;
    if (stryMutAct_9fa48("3424") ? method !== 'contain' : stryMutAct_9fa48("3423") ? false : stryMutAct_9fa48("3422") ? true : (stryCov_9fa48("3422", "3423", "3424"), method === (stryMutAct_9fa48("3425") ? "" : (stryCov_9fa48("3425"), 'contain')))) {
      if (stryMutAct_9fa48("3426")) {
        {}
      } else {
        stryCov_9fa48("3426");
        if (stryMutAct_9fa48("3430") ? aspect <= width / height : stryMutAct_9fa48("3429") ? aspect >= width / height : stryMutAct_9fa48("3428") ? false : stryMutAct_9fa48("3427") ? true : (stryCov_9fa48("3427", "3428", "3429", "3430"), aspect > (stryMutAct_9fa48("3431") ? width * height : (stryCov_9fa48("3431"), width / height)))) {
          if (stryMutAct_9fa48("3432")) {
            {}
          } else {
            stryCov_9fa48("3432");
            targetH = stryMutAct_9fa48("3433") ? width * aspect : (stryCov_9fa48("3433"), width / aspect);
          }
        } else {
          if (stryMutAct_9fa48("3434")) {
            {}
          } else {
            stryCov_9fa48("3434");
            targetW = stryMutAct_9fa48("3435") ? height / aspect : (stryCov_9fa48("3435"), height * aspect);
          }
        }
      }
    } else if (stryMutAct_9fa48("3438") ? method !== 'cover' : stryMutAct_9fa48("3437") ? false : stryMutAct_9fa48("3436") ? true : (stryCov_9fa48("3436", "3437", "3438"), method === (stryMutAct_9fa48("3439") ? "" : (stryCov_9fa48("3439"), 'cover')))) {
      if (stryMutAct_9fa48("3440")) {
        {}
      } else {
        stryCov_9fa48("3440");
        if (stryMutAct_9fa48("3444") ? aspect <= width / height : stryMutAct_9fa48("3443") ? aspect >= width / height : stryMutAct_9fa48("3442") ? false : stryMutAct_9fa48("3441") ? true : (stryCov_9fa48("3441", "3442", "3443", "3444"), aspect > (stryMutAct_9fa48("3445") ? width * height : (stryCov_9fa48("3445"), width / height)))) {
          if (stryMutAct_9fa48("3446")) {
            {}
          } else {
            stryCov_9fa48("3446");
            targetW = width;
            targetH = stryMutAct_9fa48("3447") ? width * aspect : (stryCov_9fa48("3447"), width / aspect);
          }
        } else {
          if (stryMutAct_9fa48("3448")) {
            {}
          } else {
            stryCov_9fa48("3448");
            targetH = height;
            targetW = stryMutAct_9fa48("3449") ? height / aspect : (stryCov_9fa48("3449"), height * aspect);
          }
        }
      }
    }
    resized.width = targetW;
    resized.height = targetH;
    const rCtx = resized.getContext(stryMutAct_9fa48("3450") ? "" : (stryCov_9fa48("3450"), '2d'))!;

    // High-quality rendering
    rCtx.imageSmoothingQuality = stryMutAct_9fa48("3451") ? "" : (stryCov_9fa48("3451"), 'high');
    rCtx.imageSmoothingEnabled = stryMutAct_9fa48("3452") ? false : (stryCov_9fa48("3452"), true);
    rCtx.drawImage(canvas, 0, 0, targetW, targetH);
    return resized;
  }
}

/**
 * Sydney-optimized image manipulator
 * Perfect for avatars (1:1), event photos (16:9), stories (9:16)
 */
export async function manipulateAsync(uri: string, actions: Action[] = stryMutAct_9fa48("3453") ? ["Stryker was here"] : (stryCov_9fa48("3453"), []), saveOptions: SaveOptions = {}): Promise<ImageResult> {
  if (stryMutAct_9fa48("3454")) {
    {}
  } else {
    stryCov_9fa48("3454");
    try {
      if (stryMutAct_9fa48("3455")) {
        {}
      } else {
        stryCov_9fa48("3455");
        const img = await loadImage(uri);
        let canvas = document.createElement(stryMutAct_9fa48("3456") ? "" : (stryCov_9fa48("3456"), 'canvas'));
        let ctx = canvas.getContext(stryMutAct_9fa48("3457") ? "" : (stryCov_9fa48("3457"), '2d'))!;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Preserve aspect ratio + high quality
        ctx.imageSmoothingQuality = stryMutAct_9fa48("3458") ? "" : (stryCov_9fa48("3458"), 'high');
        ctx.imageSmoothingEnabled = stryMutAct_9fa48("3459") ? false : (stryCov_9fa48("3459"), true);
        ctx.drawImage(img, 0, 0);

        // Process actions
        for (const action of actions) {
          if (stryMutAct_9fa48("3460")) {
            {}
          } else {
            stryCov_9fa48("3460");
            if (stryMutAct_9fa48("3462") ? false : stryMutAct_9fa48("3461") ? true : (stryCov_9fa48("3461", "3462"), (stryMutAct_9fa48("3463") ? "" : (stryCov_9fa48("3463"), 'resize')) in action)) {
              if (stryMutAct_9fa48("3464")) {
                {}
              } else {
                stryCov_9fa48("3464");
                canvas = resizeCanvas(canvas, ctx, stryMutAct_9fa48("3465") ? action.resize.width && 1080 : (stryCov_9fa48("3465"), action.resize.width ?? 1080), // Sydney event photo default
                stryMutAct_9fa48("3466") ?
                // Sydney event photo default
                action.resize.height && 1080 : (stryCov_9fa48("3466"), action.resize.height ?? 1080), stryMutAct_9fa48("3467") ? action.resize.method && 'contain' : (stryCov_9fa48("3467"), action.resize.method ?? (stryMutAct_9fa48("3468") ? "" : (stryCov_9fa48("3468"), 'contain'))));
                ctx = canvas.getContext(stryMutAct_9fa48("3469") ? "" : (stryCov_9fa48("3469"), '2d'))!;
              }
            } else if (stryMutAct_9fa48("3471") ? false : stryMutAct_9fa48("3470") ? true : (stryCov_9fa48("3470", "3471"), (stryMutAct_9fa48("3472") ? "" : (stryCov_9fa48("3472"), 'rotate')) in action)) {
              if (stryMutAct_9fa48("3473")) {
                {}
              } else {
                stryCov_9fa48("3473");
                const radians = stryMutAct_9fa48("3474") ? action.rotate * Math.PI * 180 : (stryCov_9fa48("3474"), (stryMutAct_9fa48("3475") ? action.rotate / Math.PI : (stryCov_9fa48("3475"), action.rotate * Math.PI)) / 180);
                const cos = Math.cos(radians);
                const sin = Math.sin(radians);
                const newWidth = stryMutAct_9fa48("3476") ? Math.abs(canvas.width * cos) - Math.abs(canvas.height * sin) : (stryCov_9fa48("3476"), Math.abs(stryMutAct_9fa48("3477") ? canvas.width / cos : (stryCov_9fa48("3477"), canvas.width * cos)) + Math.abs(stryMutAct_9fa48("3478") ? canvas.height / sin : (stryCov_9fa48("3478"), canvas.height * sin)));
                const newHeight = stryMutAct_9fa48("3479") ? Math.abs(canvas.width * sin) - Math.abs(canvas.height * cos) : (stryCov_9fa48("3479"), Math.abs(stryMutAct_9fa48("3480") ? canvas.width / sin : (stryCov_9fa48("3480"), canvas.width * sin)) + Math.abs(stryMutAct_9fa48("3481") ? canvas.height / cos : (stryCov_9fa48("3481"), canvas.height * cos)));
                const rotated = document.createElement(stryMutAct_9fa48("3482") ? "" : (stryCov_9fa48("3482"), 'canvas'));
                rotated.width = newWidth;
                rotated.height = newHeight;
                const rCtx = rotated.getContext(stryMutAct_9fa48("3483") ? "" : (stryCov_9fa48("3483"), '2d'))!;
                rCtx.translate(stryMutAct_9fa48("3484") ? newWidth * 2 : (stryCov_9fa48("3484"), newWidth / 2), stryMutAct_9fa48("3485") ? newHeight * 2 : (stryCov_9fa48("3485"), newHeight / 2));
                rCtx.rotate(radians);
                rCtx.drawImage(canvas, stryMutAct_9fa48("3486") ? -canvas.width * 2 : (stryCov_9fa48("3486"), (stryMutAct_9fa48("3487") ? +canvas.width : (stryCov_9fa48("3487"), -canvas.width)) / 2), stryMutAct_9fa48("3488") ? -canvas.height * 2 : (stryCov_9fa48("3488"), (stryMutAct_9fa48("3489") ? +canvas.height : (stryCov_9fa48("3489"), -canvas.height)) / 2));
                canvas = rotated;
                ctx = rCtx;
              }
            } else if (stryMutAct_9fa48("3491") ? false : stryMutAct_9fa48("3490") ? true : (stryCov_9fa48("3490", "3491"), (stryMutAct_9fa48("3492") ? "" : (stryCov_9fa48("3492"), 'flip')) in action)) {
              if (stryMutAct_9fa48("3493")) {
                {}
              } else {
                stryCov_9fa48("3493");
                const flipped = document.createElement(stryMutAct_9fa48("3494") ? "" : (stryCov_9fa48("3494"), 'canvas'));
                flipped.width = canvas.width;
                flipped.height = canvas.height;
                const fCtx = flipped.getContext(stryMutAct_9fa48("3495") ? "" : (stryCov_9fa48("3495"), '2d'))!;
                if (stryMutAct_9fa48("3498") ? action.flip !== 'horizontal' : stryMutAct_9fa48("3497") ? false : stryMutAct_9fa48("3496") ? true : (stryCov_9fa48("3496", "3497", "3498"), action.flip === (stryMutAct_9fa48("3499") ? "" : (stryCov_9fa48("3499"), 'horizontal')))) {
                  if (stryMutAct_9fa48("3500")) {
                    {}
                  } else {
                    stryCov_9fa48("3500");
                    fCtx.scale(stryMutAct_9fa48("3501") ? +1 : (stryCov_9fa48("3501"), -1), 1);
                    fCtx.drawImage(canvas, stryMutAct_9fa48("3502") ? +canvas.width : (stryCov_9fa48("3502"), -canvas.width), 0);
                  }
                } else {
                  if (stryMutAct_9fa48("3503")) {
                    {}
                  } else {
                    stryCov_9fa48("3503");
                    fCtx.scale(1, stryMutAct_9fa48("3504") ? +1 : (stryCov_9fa48("3504"), -1));
                    fCtx.drawImage(canvas, 0, stryMutAct_9fa48("3505") ? +canvas.height : (stryCov_9fa48("3505"), -canvas.height));
                  }
                }
                canvas = flipped;
                ctx = fCtx;
              }
            } else if (stryMutAct_9fa48("3507") ? false : stryMutAct_9fa48("3506") ? true : (stryCov_9fa48("3506", "3507"), (stryMutAct_9fa48("3508") ? "" : (stryCov_9fa48("3508"), 'crop')) in action)) {
              if (stryMutAct_9fa48("3509")) {
                {}
              } else {
                stryCov_9fa48("3509");
                const {
                  originX,
                  originY,
                  width,
                  height
                } = action.crop;
                const cropped = document.createElement(stryMutAct_9fa48("3510") ? "" : (stryCov_9fa48("3510"), 'canvas'));
                cropped.width = width;
                cropped.height = height;
                ctx.drawImage(canvas, originX, originY, width, height, 0, 0, width, height);
                canvas = cropped;
                ctx = cropped.getContext(stryMutAct_9fa48("3511") ? "" : (stryCov_9fa48("3511"), '2d'))!;
              }
            }
          }
        }

        // Sydney-optimized save
        const format = stryMutAct_9fa48("3512") ? saveOptions.format && SaveFormat.WEBP : (stryCov_9fa48("3512"), saveOptions.format ?? SaveFormat.WEBP);
        const quality = stryMutAct_9fa48("3513") ? Math.max(saveOptions.compress ?? 0.92, 0.95) : (stryCov_9fa48("3513"), Math.min(stryMutAct_9fa48("3514") ? saveOptions.compress && 0.92 : (stryCov_9fa48("3514"), saveOptions.compress ?? 0.92), 0.95));
        const mimeType = getMimeType(format);
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const result: ImageResult = stryMutAct_9fa48("3515") ? {} : (stryCov_9fa48("3515"), {
          uri: dataUrl,
          width: canvas.width,
          height: canvas.height
        });
        if (stryMutAct_9fa48("3517") ? false : stryMutAct_9fa48("3516") ? true : (stryCov_9fa48("3516", "3517"), saveOptions.base64)) {
          if (stryMutAct_9fa48("3518")) {
            {}
          } else {
            stryCov_9fa48("3518");
            result.base64 = dataUrl.split(stryMutAct_9fa48("3519") ? "" : (stryCov_9fa48("3519"), ','))[1];
          }
        }

        // Sydney avatar square check
        if (stryMutAct_9fa48("3522") ? uri.includes('avatar') || canvas.width !== canvas.height : stryMutAct_9fa48("3521") ? false : stryMutAct_9fa48("3520") ? true : (stryCov_9fa48("3520", "3521", "3522"), uri.includes(stryMutAct_9fa48("3523") ? "" : (stryCov_9fa48("3523"), 'avatar')) && (stryMutAct_9fa48("3525") ? canvas.width === canvas.height : stryMutAct_9fa48("3524") ? true : (stryCov_9fa48("3524", "3525"), canvas.width !== canvas.height)))) {
          if (stryMutAct_9fa48("3526")) {
            {}
          } else {
            stryCov_9fa48("3526");
            console.warn(stryMutAct_9fa48("3527") ? "" : (stryCov_9fa48("3527"), 'Avatar not square - recommend crop'));
          }
        }
        return result;
      }
    } catch (error) {
      if (stryMutAct_9fa48("3528")) {
        {}
      } else {
        stryCov_9fa48("3528");
        console.error(stryMutAct_9fa48("3529") ? "" : (stryCov_9fa48("3529"), 'Image manipulation failed:'), error);
        throw new Error(stryMutAct_9fa48("3530") ? `` : (stryCov_9fa48("3530"), `Image processing failed: ${error}`));
      }
    }
  }
}

// Sydney presets
export const SydneyPresets = stryMutAct_9fa48("3531") ? {} : (stryCov_9fa48("3531"), {
  avatar: [{
    resize: {
      width: 400,
      height: 400,
      method: 'cover' as const
    }
  }] as Action[],
  eventPhoto: [{
    resize: {
      width: 1080,
      method: 'contain' as const
    }
  }] as Action[],
  storyThumbnail: [{
    resize: {
      width: 400,
      height: 400,
      method: 'cover' as const
    }
  }] as Action[],
  coverPhoto: [{
    resize: {
      width: 1200,
      height: 630,
      method: 'cover' as const
    }
  }] as Action[]
});

// Batch processor
export async function batchProcess(images: string[], preset: (typeof SydneyPresets)[keyof typeof SydneyPresets]): Promise<ImageResult[]> {
  if (stryMutAct_9fa48("3532")) {
    {}
  } else {
    stryCov_9fa48("3532");
    const results = await Promise.allSettled(images.map(stryMutAct_9fa48("3533") ? () => undefined : (stryCov_9fa48("3533"), async uri => manipulateAsync(uri, preset))));
    return stryMutAct_9fa48("3534") ? results.map(r => r.value) : (stryCov_9fa48("3534"), results.filter(stryMutAct_9fa48("3535") ? () => undefined : (stryCov_9fa48("3535"), (r): r is PromiseFulfilledResult<ImageResult> => stryMutAct_9fa48("3538") ? r.status !== 'fulfilled' : stryMutAct_9fa48("3537") ? false : stryMutAct_9fa48("3536") ? true : (stryCov_9fa48("3536", "3537", "3538"), r.status === (stryMutAct_9fa48("3539") ? "" : (stryCov_9fa48("3539"), 'fulfilled'))))).map(stryMutAct_9fa48("3540") ? () => undefined : (stryCov_9fa48("3540"), r => r.value)));
  }
}