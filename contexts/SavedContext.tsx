import { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface SavedContextValue {
  savedEvents: string[];
  joinedCommunities: string[];
  toggleSaveEvent: (id: string) => void;
  toggleJoinCommunity: (id: string) => Promise<void>;
  isEventSaved: (id: string) => boolean;
  isCommunityJoined: (id: string) => boolean;
}

const SAVED_EVENTS_KEY = '@culturepass_saved_events';
const JOINED_COMMUNITIES_KEY = '@culturepass_joined_communities';

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([]);
  const { isAuthenticated, userId } = useAuth();
  const didSyncFromApi = useRef(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(SAVED_EVENTS_KEY),
      AsyncStorage.getItem(JOINED_COMMUNITIES_KEY),
    ]).then(([events, communities]) => {
      if (events) setSavedEvents(JSON.parse(events));
      if (communities) setJoinedCommunities(JSON.parse(communities));
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

  const value = useMemo(() => ({
    savedEvents,
    joinedCommunities,
    toggleSaveEvent,
    toggleJoinCommunity,
    isEventSaved,
    isCommunityJoined,
  }), [savedEvents, joinedCommunities, toggleSaveEvent, toggleJoinCommunity, isEventSaved, isCommunityJoined]);

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
