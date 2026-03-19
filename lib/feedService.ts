export type PostCollection = 'events' | 'communityPosts';

export interface FeedComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  body: string;
  createdAt: string;
}

type Unsubscribe = () => void;
type CommentSubscriber = (comments: FeedComment[]) => void;
type NumberSubscriber = (value: number) => void;
type BooleanSubscriber = (value: boolean) => void;

interface FeedPostState {
  comments: FeedComment[];
  likedBy: Set<string>;
}

const stateByPost = new Map<string, FeedPostState>();
const commentsSubscribers = new Map<string, Set<CommentSubscriber>>();
const likeCountSubscribers = new Map<string, Set<NumberSubscriber>>();
const commentCountSubscribers = new Map<string, Set<NumberSubscriber>>();
const likedSubscribers = new Map<string, Map<string, Set<BooleanSubscriber>>>();

function key(postId: string, collection: PostCollection): string {
  return `${collection}:${postId}`;
}

function ensureState(postKey: string): FeedPostState {
  const existing = stateByPost.get(postKey);
  if (existing) return existing;
  const created: FeedPostState = { comments: [], likedBy: new Set<string>() };
  stateByPost.set(postKey, created);
  return created;
}

function emitComments(postKey: string, comments: FeedComment[]): void {
  commentsSubscribers.get(postKey)?.forEach((cb) => cb([...comments]));
}

function emitLikeCount(postKey: string, count: number): void {
  likeCountSubscribers.get(postKey)?.forEach((cb) => cb(count));
}

function emitCommentCount(postKey: string, count: number): void {
  commentCountSubscribers.get(postKey)?.forEach((cb) => cb(count));
}

function emitLiked(postKey: string, userId: string, liked: boolean): void {
  likedSubscribers.get(postKey)?.get(userId)?.forEach((cb) => cb(liked));
}

function subscribeSet<T>(map: Map<string, Set<T>>, postKey: string, cb: T): Unsubscribe {
  const bucket = map.get(postKey) ?? new Set<T>();
  bucket.add(cb);
  map.set(postKey, bucket);
  return () => {
    bucket.delete(cb);
    if (bucket.size === 0) map.delete(postKey);
  };
}

export async function createCommunityPost(_payload: {
  authorId: string;
  authorName: string;
  communityId: string;
  communityName: string;
  body: string;
  imageUrl?: string;
}): Promise<void> {
  // Compatibility no-op: feed screen already does optimistic local insertion.
}


export function subscribeComments(
  postId: string,
  collection: PostCollection,
  callback: CommentSubscriber
): Unsubscribe {
  const postKey = key(postId, collection);
  const state = ensureState(postKey);
  callback([...state.comments]);
  return subscribeSet(commentsSubscribers, postKey, callback);
}

export async function addComment(
  postId: string,
  collection: PostCollection,
  comment: Omit<FeedComment, 'id' | 'createdAt'>
): Promise<void> {
  const postKey = key(postId, collection);
  const state = ensureState(postKey);
  state.comments.push({
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...comment,
  });
  emitComments(postKey, state.comments);
  emitCommentCount(postKey, state.comments.length);
}

export async function toggleLike(
  postId: string,
  collection: PostCollection,
  userId: string
): Promise<void> {
  const postKey = key(postId, collection);
  const state = ensureState(postKey);
  if (state.likedBy.has(userId)) {
    state.likedBy.delete(userId);
  } else {
    state.likedBy.add(userId);
  }
  const liked = state.likedBy.has(userId);
  emitLiked(postKey, userId, liked);
  emitLikeCount(postKey, state.likedBy.size);
}

export function subscribeLiked(
  postId: string,
  collection: PostCollection,
  userId: string,
  callback: BooleanSubscriber
): Unsubscribe {
  const postKey = key(postId, collection);
  const state = ensureState(postKey);
  callback(state.likedBy.has(userId));

  const byUser = likedSubscribers.get(postKey) ?? new Map<string, Set<BooleanSubscriber>>();
  const userSubscribers = byUser.get(userId) ?? new Set<BooleanSubscriber>();
  userSubscribers.add(callback);
  byUser.set(userId, userSubscribers);
  likedSubscribers.set(postKey, byUser);

  return () => {
    userSubscribers.delete(callback);
    if (userSubscribers.size === 0) byUser.delete(userId);
    if (byUser.size === 0) likedSubscribers.delete(postKey);
  };
}

export function subscribeLikeCount(
  postId: string,
  collection: PostCollection,
  callback: NumberSubscriber
): Unsubscribe {
  const postKey = key(postId, collection);
  const state = ensureState(postKey);
  callback(state.likedBy.size);
  return subscribeSet(likeCountSubscribers, postKey, callback);
}

export function subscribeCommentCount(
  postId: string,
  collection: PostCollection,
  callback: NumberSubscriber
): Unsubscribe {
  const postKey = key(postId, collection);
  const state = ensureState(postKey);
  callback(state.comments.length);
  return subscribeSet(commentCountSubscribers, postKey, callback);
}

export async function reportPost(
  _reporterId: string,
  _postId: string,
  _collection: PostCollection,
  _reason: string
): Promise<void> {
  // Compatibility no-op for local development.
}
