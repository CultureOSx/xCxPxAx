// @ts-nocheck
import { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export type SavedHubBookmark = {
  id: string;
  href: string;
  slug: string;
  state: string;
  language: string;
  title: string;
  subtitle?: string;
  savedAt: string;
};

export function hubBookmarkId(slug: string, state: string, language: string): string {
  return `${slug}::${state.toUpperCase()}::${language.toLowerCase()}`;
}

interface SavedContextValue {
  savedEvents: string[];
  joinedCommunities: string[];
  /** Bookmark community IDs to revisit (separate from join). */
  savedCommunityBookmarks: string[];
  savedHubs: SavedHubBookmark[];
  toggleSaveEvent: (id: string) => void;
  toggleJoinCommunity: (id: string) => Promise<void>;
  toggleSaveCommunityBookmark: (id: string) => void;
  toggleSaveHub: (payload: Omit<SavedHubBookmark, 'id' | 'savedAt'>) => void;
  isEventSaved: (id: string) => boolean;
  isCommunityJoined: (id: string) => boolean;
  isCommunityBookmarked: (id: string) => boolean;
  isHubSaved: (slug: string, state: string, language: string) => boolean;
}

const SAVED_EVENTS_KEY = '@culturepass_saved_events';
const JOINED_COMMUNITIES_KEY = '@culturepass_joined_communities';
const SAVED_COMMUNITY_BOOKMARKS_KEY = '@culturepass_saved_community_bookmarks';
const SAVED_HUBS_KEY = '@culturepass_saved_hubs';

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([]);
  const [savedCommunityBookmarks, setSavedCommunityBookmarks] = useState<string[]>([]);
  const [savedHubs, setSavedHubs] = useState<SavedHubBookmark[]>([]);
  const { isAuthenticated, userId } = useAuth();
  const didSyncFromApi = useRef(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(SAVED_EVENTS_KEY),
      AsyncStorage.getItem(JOINED_COMMUNITIES_KEY),
      AsyncStorage.getItem(SAVED_COMMUNITY_BOOKMARKS_KEY),
      AsyncStorage.getItem(SAVED_HUBS_KEY),
    ]).then(([events, communities, bookmarks, hubs]) => {
      if (events) setSavedEvents(JSON.parse(events));
      if (communities) setJoinedCommunities(JSON.parse(communities));
      if (bookmarks) {
        try {
          const b = JSON.parse(bookmarks) as string[];
          if (Array.isArray(b)) setSavedCommunityBookmarks(b);
        } catch {
          /* ignore */
        }
      }
      if (hubs) {
        try {
          const parsed = JSON.parse(hubs) as SavedHubBookmark[];
          if (Array.isArray(parsed)) setSavedHubs(parsed);
        } catch {
          /* ignore corrupt */
        }
      }
    });
  }, []);

  // Sync joined communities from API when authenticated
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      didSyncFromApi.current = false;
      return;
    }
    if (didSyncFromApi.current) return;
    didSyncFromApi.current = true;

    api.communities.joined()
      .then(({ communityIds }) => {
        setJoinedCommunities(communityIds);
        AsyncStorage.setItem(JOINED_COMMUNITIES_KEY, JSON.stringify(communityIds));
      })
      .catch(() => { /* keep local state on error */ });
  }, [isAuthenticated, userId]);

  const toggleSaveEvent = useCallback((id: string) => {
    setSavedEvents(prev => {
      const next = prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id];
      AsyncStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleSaveCommunityBookmark = useCallback((id: string) => {
    setSavedCommunityBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      AsyncStorage.setItem(SAVED_COMMUNITY_BOOKMARKS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleSaveHub = useCallback((payload: Omit<SavedHubBookmark, 'id' | 'savedAt'>) => {
    const id = hubBookmarkId(payload.slug, payload.state, payload.language);
    setSavedHubs((prev) => {
      const exists = prev.some((h) => h.id === id);
      const next = exists
        ? prev.filter((h) => h.id !== id)
        : [
            ...prev,
            {
              ...payload,
              id,
              savedAt: new Date().toISOString(),
            },
          ];
      AsyncStorage.setItem(SAVED_HUBS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleJoinCommunity = useCallback(async (id: string) => {
    const isJoined = (prev: string[]) => prev.includes(id);

    // Optimistic update
    let wasJoined = false;
    setJoinedCommunities(prev => {
      wasJoined = isJoined(prev);
      const next = wasJoined ? prev.filter(c => c !== id) : [...prev, id];
      AsyncStorage.setItem(JOINED_COMMUNITIES_KEY, JSON.stringify(next));
      return next;
    });

    if (!isAuthenticated) return;

    try {
      if (wasJoined) {
        await api.communities.leave(id);
      } else {
        await api.communities.join(id);
      }
    } catch {
      // Revert on error
      setJoinedCommunities(prev => {
        const next = wasJoined ? [...prev, id] : prev.filter(c => c !== id);
        AsyncStorage.setItem(JOINED_COMMUNITIES_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, [isAuthenticated]);

  const isEventSaved = useCallback((id: string) => savedEvents.includes(id), [savedEvents]);
  const isCommunityJoined = useCallback((id: string) => joinedCommunities.includes(id), [joinedCommunities]);
  const isCommunityBookmarked = useCallback(
    (id: string) => savedCommunityBookmarks.includes(id),
    [savedCommunityBookmarks],
  );
  const isHubSaved = useCallback(
    (slug: string, state: string, language: string) =>
      savedHubs.some((h) => h.id === hubBookmarkId(slug, state, language)),
    [savedHubs],
  );

  const value = useMemo(
    () => ({
      savedEvents,
      joinedCommunities,
      savedCommunityBookmarks,
      savedHubs,
      toggleSaveEvent,
      toggleJoinCommunity,
      toggleSaveCommunityBookmark,
      toggleSaveHub,
      isEventSaved,
      isCommunityJoined,
      isCommunityBookmarked,
      isHubSaved,
    }),
    [
      savedEvents,
      joinedCommunities,
      savedCommunityBookmarks,
      savedHubs,
      toggleSaveEvent,
      toggleJoinCommunity,
      toggleSaveCommunityBookmark,
      toggleSaveHub,
      isEventSaved,
      isCommunityJoined,
      isCommunityBookmarked,
      isHubSaved,
    ],
  );

  return (
    <SavedContext.Provider value={value}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) throw new Error('useSaved must be used within SavedProvider');
  return context;
}
