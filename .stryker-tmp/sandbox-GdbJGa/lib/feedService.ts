/**
 * Feed interaction service — comments, likes, post creation.
 *
 * All mutations are persisted to Firestore via the `/api/feed/*` routes.
 * Optimistic in-memory state is maintained for instant UI feedback while the
 * async API call completes. Subscribers are notified on every state change.
 *
 * The `events` collection path is kept for forward-compatibility but
 * API calls are only made for `communityPosts` which have backend support.
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
import { api } from '@/lib/api';
import type { FeedComment } from '@/lib/api';
export type { FeedComment };
export type PostCollection = 'events' | 'communityPosts';
type Unsubscribe = () => void;
type CommentSubscriber = (comments: FeedComment[]) => void;
type NumberSubscriber = (value: number) => void;
type BooleanSubscriber = (value: boolean) => void;
interface PostState {
  comments: FeedComment[];
  likedBy: Set<string>;
}
const stateByPost = new Map<string, PostState>();
const commentsSubscribers = new Map<string, Set<CommentSubscriber>>();
const likeCountSubscribers = new Map<string, Set<NumberSubscriber>>();
const commentCountSubs = new Map<string, Set<NumberSubscriber>>();
const likedSubscribers = new Map<string, Map<string, Set<BooleanSubscriber>>>();

// Community post IDs in the feed are prefixed with "post-" (e.g. "post-abc123").
// Strip the prefix to get the Firestore document ID for API calls.
function firestoreId(postId: string): string {
  if (stryMutAct_9fa48("3098")) {
    {}
  } else {
    stryCov_9fa48("3098");
    return (stryMutAct_9fa48("3099") ? postId.endsWith('post-') : (stryCov_9fa48("3099"), postId.startsWith(stryMutAct_9fa48("3100") ? "" : (stryCov_9fa48("3100"), 'post-')))) ? stryMutAct_9fa48("3101") ? postId : (stryCov_9fa48("3101"), postId.slice(5)) : postId;
  }
}
function key(postId: string, collection: PostCollection): string {
  if (stryMutAct_9fa48("3102")) {
    {}
  } else {
    stryCov_9fa48("3102");
    return stryMutAct_9fa48("3103") ? `` : (stryCov_9fa48("3103"), `${collection}:${postId}`);
  }
}
function ensureState(postKey: string): PostState {
  if (stryMutAct_9fa48("3104")) {
    {}
  } else {
    stryCov_9fa48("3104");
    const existing = stateByPost.get(postKey);
    if (stryMutAct_9fa48("3106") ? false : stryMutAct_9fa48("3105") ? true : (stryCov_9fa48("3105", "3106"), existing)) return existing;
    const created: PostState = stryMutAct_9fa48("3107") ? {} : (stryCov_9fa48("3107"), {
      comments: stryMutAct_9fa48("3108") ? ["Stryker was here"] : (stryCov_9fa48("3108"), []),
      likedBy: new Set<string>()
    });
    stateByPost.set(postKey, created);
    return created;
  }
}
function emitComments(postKey: string, comments: FeedComment[]): void {
  if (stryMutAct_9fa48("3109")) {
    {}
  } else {
    stryCov_9fa48("3109");
    stryMutAct_9fa48("3110") ? commentsSubscribers.get(postKey).forEach(cb => cb([...comments])) : (stryCov_9fa48("3110"), commentsSubscribers.get(postKey)?.forEach(stryMutAct_9fa48("3111") ? () => undefined : (stryCov_9fa48("3111"), cb => cb(stryMutAct_9fa48("3112") ? [] : (stryCov_9fa48("3112"), [...comments])))));
  }
}
function emitLikeCount(postKey: string, count: number): void {
  if (stryMutAct_9fa48("3113")) {
    {}
  } else {
    stryCov_9fa48("3113");
    stryMutAct_9fa48("3114") ? likeCountSubscribers.get(postKey).forEach(cb => cb(count)) : (stryCov_9fa48("3114"), likeCountSubscribers.get(postKey)?.forEach(stryMutAct_9fa48("3115") ? () => undefined : (stryCov_9fa48("3115"), cb => cb(count))));
  }
}
function emitCommentCount(postKey: string, count: number): void {
  if (stryMutAct_9fa48("3116")) {
    {}
  } else {
    stryCov_9fa48("3116");
    stryMutAct_9fa48("3117") ? commentCountSubs.get(postKey).forEach(cb => cb(count)) : (stryCov_9fa48("3117"), commentCountSubs.get(postKey)?.forEach(stryMutAct_9fa48("3118") ? () => undefined : (stryCov_9fa48("3118"), cb => cb(count))));
  }
}
function emitLiked(postKey: string, userId: string, liked: boolean): void {
  if (stryMutAct_9fa48("3119")) {
    {}
  } else {
    stryCov_9fa48("3119");
    stryMutAct_9fa48("3121") ? likedSubscribers.get(postKey).get(userId)?.forEach(cb => cb(liked)) : stryMutAct_9fa48("3120") ? likedSubscribers.get(postKey)?.get(userId).forEach(cb => cb(liked)) : (stryCov_9fa48("3120", "3121"), likedSubscribers.get(postKey)?.get(userId)?.forEach(stryMutAct_9fa48("3122") ? () => undefined : (stryCov_9fa48("3122"), cb => cb(liked))));
  }
}
function subscribeSet<T>(map: Map<string, Set<T>>, postKey: string, cb: T): Unsubscribe {
  if (stryMutAct_9fa48("3123")) {
    {}
  } else {
    stryCov_9fa48("3123");
    const bucket = stryMutAct_9fa48("3124") ? map.get(postKey) && new Set<T>() : (stryCov_9fa48("3124"), map.get(postKey) ?? new Set<T>());
    bucket.add(cb);
    map.set(postKey, bucket);
    return () => {
      if (stryMutAct_9fa48("3125")) {
        {}
      } else {
        stryCov_9fa48("3125");
        bucket.delete(cb);
        if (stryMutAct_9fa48("3128") ? bucket.size !== 0 : stryMutAct_9fa48("3127") ? false : stryMutAct_9fa48("3126") ? true : (stryCov_9fa48("3126", "3127", "3128"), bucket.size === 0)) map.delete(postKey);
      }
    };
  }
}

// ---------------------------------------------------------------------------
// createCommunityPost — persisted to Firestore
// ---------------------------------------------------------------------------

export async function createCommunityPost(payload: {
  authorId: string;
  authorName: string;
  communityId: string;
  communityName: string;
  body: string;
  imageUrl?: string;
  postStyle?: 'standard' | 'story';
}): Promise<void> {
  if (stryMutAct_9fa48("3129")) {
    {}
  } else {
    stryCov_9fa48("3129");
    await api.feed.createPost(stryMutAct_9fa48("3130") ? {} : (stryCov_9fa48("3130"), {
      communityId: payload.communityId,
      communityName: payload.communityName,
      body: payload.body,
      imageUrl: payload.imageUrl,
      postStyle: payload.postStyle
    }));
  }
}

// ---------------------------------------------------------------------------
// subscribeComments
// ---------------------------------------------------------------------------

export function subscribeComments(postId: string, collection: PostCollection, callback: CommentSubscriber): Unsubscribe {
  if (stryMutAct_9fa48("3131")) {
    {}
  } else {
    stryCov_9fa48("3131");
    const postKey = key(postId, collection);
    const state = ensureState(postKey);

    // Emit current (possibly empty) local state immediately
    callback(stryMutAct_9fa48("3132") ? [] : (stryCov_9fa48("3132"), [...state.comments]));
    const unsub = subscribeSet(commentsSubscribers, postKey, callback);

    // Fetch real comments from the API for community posts
    if (stryMutAct_9fa48("3135") ? collection !== 'communityPosts' : stryMutAct_9fa48("3134") ? false : stryMutAct_9fa48("3133") ? true : (stryCov_9fa48("3133", "3134", "3135"), collection === (stryMutAct_9fa48("3136") ? "" : (stryCov_9fa48("3136"), 'communityPosts')))) {
      if (stryMutAct_9fa48("3137")) {
        {}
      } else {
        stryCov_9fa48("3137");
        api.feed.getComments(firestoreId(postId)).then(({
          comments
        }) => {
          if (stryMutAct_9fa48("3138")) {
            {}
          } else {
            stryCov_9fa48("3138");
            state.comments = comments;
            emitComments(postKey, comments);
            emitCommentCount(postKey, comments.length);
          }
        }).catch((err: unknown) => {
          if (stryMutAct_9fa48("3139")) {
            {}
          } else {
            stryCov_9fa48("3139");
            if (stryMutAct_9fa48("3141") ? false : stryMutAct_9fa48("3140") ? true : (stryCov_9fa48("3140", "3141"), __DEV__)) console.error(stryMutAct_9fa48("3142") ? "" : (stryCov_9fa48("3142"), '[feedService] getComments failed:'), err);
          }
        });
      }
    }
    return unsub;
  }
}

// ---------------------------------------------------------------------------
// addComment — optimistic + persisted
// ---------------------------------------------------------------------------

export async function addComment(postId: string, collection: PostCollection, comment: Omit<FeedComment, 'id' | 'createdAt'>): Promise<void> {
  if (stryMutAct_9fa48("3143")) {
    {}
  } else {
    stryCov_9fa48("3143");
    const postKey = key(postId, collection);
    const state = ensureState(postKey);

    // Optimistic local add
    const tempComment: FeedComment = stryMutAct_9fa48("3144") ? {} : (stryCov_9fa48("3144"), {
      id: stryMutAct_9fa48("3145") ? `` : (stryCov_9fa48("3145"), `temp-${Date.now()}`),
      createdAt: new Date().toISOString(),
      ...comment
    });
    state.comments = stryMutAct_9fa48("3146") ? [] : (stryCov_9fa48("3146"), [...state.comments, tempComment]);
    emitComments(postKey, state.comments);
    emitCommentCount(postKey, state.comments.length);
    if (stryMutAct_9fa48("3149") ? collection !== 'communityPosts' : stryMutAct_9fa48("3148") ? false : stryMutAct_9fa48("3147") ? true : (stryCov_9fa48("3147", "3148", "3149"), collection === (stryMutAct_9fa48("3150") ? "" : (stryCov_9fa48("3150"), 'communityPosts')))) {
      if (stryMutAct_9fa48("3151")) {
        {}
      } else {
        stryCov_9fa48("3151");
        try {
          if (stryMutAct_9fa48("3152")) {
            {}
          } else {
            stryCov_9fa48("3152");
            const saved = await api.feed.addComment(firestoreId(postId), comment.body);
            // Replace temp with the persisted comment
            state.comments = state.comments.map(stryMutAct_9fa48("3153") ? () => undefined : (stryCov_9fa48("3153"), c => (stryMutAct_9fa48("3156") ? c.id !== tempComment.id : stryMutAct_9fa48("3155") ? false : stryMutAct_9fa48("3154") ? true : (stryCov_9fa48("3154", "3155", "3156"), c.id === tempComment.id)) ? saved : c));
            emitComments(postKey, state.comments);
          }
        } catch {
          // Keep the optimistic comment if the API call fails
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// toggleLike — optimistic + persisted
// ---------------------------------------------------------------------------

export async function toggleLike(postId: string, collection: PostCollection, userId: string): Promise<void> {
  if (stryMutAct_9fa48("3157")) {
    {}
  } else {
    stryCov_9fa48("3157");
    const postKey = key(postId, collection);
    const state = ensureState(postKey);
    const wasLiked = state.likedBy.has(userId);
    if (stryMutAct_9fa48("3159") ? false : stryMutAct_9fa48("3158") ? true : (stryCov_9fa48("3158", "3159"), wasLiked)) {
      if (stryMutAct_9fa48("3160")) {
        {}
      } else {
        stryCov_9fa48("3160");
        state.likedBy.delete(userId);
      }
    } else {
      if (stryMutAct_9fa48("3161")) {
        {}
      } else {
        stryCov_9fa48("3161");
        state.likedBy.add(userId);
      }
    }
    const liked = state.likedBy.has(userId);
    emitLiked(postKey, userId, liked);
    emitLikeCount(postKey, state.likedBy.size);
    if (stryMutAct_9fa48("3164") ? collection !== 'communityPosts' : stryMutAct_9fa48("3163") ? false : stryMutAct_9fa48("3162") ? true : (stryCov_9fa48("3162", "3163", "3164"), collection === (stryMutAct_9fa48("3165") ? "" : (stryCov_9fa48("3165"), 'communityPosts')))) {
      if (stryMutAct_9fa48("3166")) {
        {}
      } else {
        stryCov_9fa48("3166");
        try {
          if (stryMutAct_9fa48("3167")) {
            {}
          } else {
            stryCov_9fa48("3167");
            const result = await api.feed.toggleLike(firestoreId(postId));
            // Sync actual count from server (handles concurrent likes accurately)
            emitLikeCount(postKey, result.likesCount);
          }
        } catch {
          if (stryMutAct_9fa48("3168")) {
            {}
          } else {
            stryCov_9fa48("3168");
            // Revert on error
            if (stryMutAct_9fa48("3170") ? false : stryMutAct_9fa48("3169") ? true : (stryCov_9fa48("3169", "3170"), liked)) {
              if (stryMutAct_9fa48("3171")) {
                {}
              } else {
                stryCov_9fa48("3171");
                state.likedBy.delete(userId);
              }
            } else {
              if (stryMutAct_9fa48("3172")) {
                {}
              } else {
                stryCov_9fa48("3172");
                state.likedBy.add(userId);
              }
            }
            emitLiked(postKey, userId, stryMutAct_9fa48("3173") ? liked : (stryCov_9fa48("3173"), !liked));
            emitLikeCount(postKey, state.likedBy.size);
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// subscribeLiked
// ---------------------------------------------------------------------------

export function subscribeLiked(postId: string, collection: PostCollection, userId: string, callback: BooleanSubscriber): Unsubscribe {
  if (stryMutAct_9fa48("3174")) {
    {}
  } else {
    stryCov_9fa48("3174");
    const postKey = key(postId, collection);
    const state = ensureState(postKey);
    callback(state.likedBy.has(userId));
    const byUser = stryMutAct_9fa48("3175") ? likedSubscribers.get(postKey) && new Map<string, Set<BooleanSubscriber>>() : (stryCov_9fa48("3175"), likedSubscribers.get(postKey) ?? new Map<string, Set<BooleanSubscriber>>());
    const userSubs = stryMutAct_9fa48("3176") ? byUser.get(userId) && new Set<BooleanSubscriber>() : (stryCov_9fa48("3176"), byUser.get(userId) ?? new Set<BooleanSubscriber>());
    userSubs.add(callback);
    byUser.set(userId, userSubs);
    likedSubscribers.set(postKey, byUser);

    // Fetch initial like status from API
    if (stryMutAct_9fa48("3179") ? collection !== 'communityPosts' : stryMutAct_9fa48("3178") ? false : stryMutAct_9fa48("3177") ? true : (stryCov_9fa48("3177", "3178", "3179"), collection === (stryMutAct_9fa48("3180") ? "" : (stryCov_9fa48("3180"), 'communityPosts')))) {
      if (stryMutAct_9fa48("3181")) {
        {}
      } else {
        stryCov_9fa48("3181");
        api.feed.getLike(firestoreId(postId)).then(({
          liked,
          likesCount
        }) => {
          if (stryMutAct_9fa48("3182")) {
            {}
          } else {
            stryCov_9fa48("3182");
            if (stryMutAct_9fa48("3185") ? liked || !state.likedBy.has(userId) : stryMutAct_9fa48("3184") ? false : stryMutAct_9fa48("3183") ? true : (stryCov_9fa48("3183", "3184", "3185"), liked && (stryMutAct_9fa48("3186") ? state.likedBy.has(userId) : (stryCov_9fa48("3186"), !state.likedBy.has(userId))))) {
              if (stryMutAct_9fa48("3187")) {
                {}
              } else {
                stryCov_9fa48("3187");
                state.likedBy.add(userId);
                emitLiked(postKey, userId, stryMutAct_9fa48("3188") ? false : (stryCov_9fa48("3188"), true));
              }
            } else if (stryMutAct_9fa48("3191") ? !liked || state.likedBy.has(userId) : stryMutAct_9fa48("3190") ? false : stryMutAct_9fa48("3189") ? true : (stryCov_9fa48("3189", "3190", "3191"), (stryMutAct_9fa48("3192") ? liked : (stryCov_9fa48("3192"), !liked)) && state.likedBy.has(userId))) {
              if (stryMutAct_9fa48("3193")) {
                {}
              } else {
                stryCov_9fa48("3193");
                state.likedBy.delete(userId);
                emitLiked(postKey, userId, stryMutAct_9fa48("3194") ? true : (stryCov_9fa48("3194"), false));
              }
            }
            emitLikeCount(postKey, likesCount);
          }
        }).catch((err: unknown) => {
          if (stryMutAct_9fa48("3195")) {
            {}
          } else {
            stryCov_9fa48("3195");
            if (stryMutAct_9fa48("3197") ? false : stryMutAct_9fa48("3196") ? true : (stryCov_9fa48("3196", "3197"), __DEV__)) console.error(stryMutAct_9fa48("3198") ? "" : (stryCov_9fa48("3198"), '[feedService] getLike failed:'), err);
          }
        });
      }
    }
    return () => {
      if (stryMutAct_9fa48("3199")) {
        {}
      } else {
        stryCov_9fa48("3199");
        userSubs.delete(callback);
        if (stryMutAct_9fa48("3202") ? userSubs.size !== 0 : stryMutAct_9fa48("3201") ? false : stryMutAct_9fa48("3200") ? true : (stryCov_9fa48("3200", "3201", "3202"), userSubs.size === 0)) byUser.delete(userId);
        if (stryMutAct_9fa48("3205") ? byUser.size !== 0 : stryMutAct_9fa48("3204") ? false : stryMutAct_9fa48("3203") ? true : (stryCov_9fa48("3203", "3204", "3205"), byUser.size === 0)) likedSubscribers.delete(postKey);
      }
    };
  }
}

// ---------------------------------------------------------------------------
// subscribeLikeCount
// ---------------------------------------------------------------------------

export function subscribeLikeCount(postId: string, collection: PostCollection, callback: NumberSubscriber): Unsubscribe {
  if (stryMutAct_9fa48("3206")) {
    {}
  } else {
    stryCov_9fa48("3206");
    const postKey = key(postId, collection);
    const state = ensureState(postKey);
    callback(state.likedBy.size);
    return subscribeSet(likeCountSubscribers, postKey, callback);
  }
}

// ---------------------------------------------------------------------------
// subscribeCommentCount
// ---------------------------------------------------------------------------

export function subscribeCommentCount(postId: string, collection: PostCollection, callback: NumberSubscriber): Unsubscribe {
  if (stryMutAct_9fa48("3207")) {
    {}
  } else {
    stryCov_9fa48("3207");
    const postKey = key(postId, collection);
    const state = ensureState(postKey);
    callback(state.comments.length);
    return subscribeSet(commentCountSubs, postKey, callback);
  }
}

// ---------------------------------------------------------------------------
// reportPost — submits a content report
// ---------------------------------------------------------------------------

export async function reportPost(reporterId: string, postId: string, collection: PostCollection, reason: string): Promise<void> {
  if (stryMutAct_9fa48("3208")) {
    {}
  } else {
    stryCov_9fa48("3208");
    try {
      if (stryMutAct_9fa48("3209")) {
        {}
      } else {
        stryCov_9fa48("3209");
        await api.raw(stryMutAct_9fa48("3210") ? "" : (stryCov_9fa48("3210"), 'POST'), stryMutAct_9fa48("3211") ? `` : (stryCov_9fa48("3211"), `api/posts/${collection}/${encodeURIComponent(firestoreId(postId))}/report`), stryMutAct_9fa48("3212") ? {} : (stryCov_9fa48("3212"), {
          reason
        }));
      }
    } catch {
      // Best-effort — don't surface errors to the user
    }
  }
}