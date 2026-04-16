import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  isComplete: boolean;
  country: string;
  city: string;
  communities: string[];
  // Cultural Identity Layer
  nationalityId: string;
  cultureIds: string[];
  languageIds: string[];
  diasporaGroupIds: string[];
  // Legacy free-text fields (kept for backward compat with existing profiles)
  ethnicityText: string;
  languages: string[];
  // Interests
  interests: string[];
  subscriptionTier: 'free' | 'plus' | 'elite' | 'sydney-local';
}

interface OnboardingContextValue {
  state: OnboardingState;
  isLoading: boolean;
  setCountry: (country: string) => void;
  setCity: (city: string) => void;
  setCommunities: (communities: string[]) => void;
  // Cultural Identity
  setNationalityId: (nationalityId: string) => void;
  setCultureIds: (cultureIds: string[]) => void;
  setLanguageIds: (languageIds: string[]) => void;
  setDiasporaGroupIds: (diasporaGroupIds: string[]) => void;
  // Legacy
  setEthnicityText: (ethnicityText: string) => void;
  setLanguages: (languages: string[]) => void;
  setInterests: (interests: string[]) => void;
  setSubscriptionTier: (tier: OnboardingState['subscriptionTier']) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  restartOnboarding: () => Promise<void>;
  updateLocation: (country: string, city: string) => Promise<void>;
  /** Resolves after the initial AsyncStorage read used to hydrate onboarding (avoids post-login routing on stale defaults). */
  waitForHydration: () => Promise<void>;
  /** Latest onboarding snapshot (synced with persist + initial load); safe to read right after `waitForHydration()`. */
  getSnapshot: () => OnboardingState;
}

const STORAGE_KEY = '@culturepass_onboarding';

const defaultState: OnboardingState = {
  isComplete: false,
  country: '',
  city: '',
  communities: [],
  nationalityId: '',
  cultureIds: [],
  languageIds: [],
  diasporaGroupIds: [],
  ethnicityText: '',
  languages: [],
  interests: [],
  subscriptionTier: 'free',
};

export const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  /** Mirrors the latest persisted onboarding (incl. immediately after AsyncStorage read, before React re-renders). */
  const stateSnapshotRef = useRef<OnboardingState>(defaultState);
  const hydrationDoneRef = useRef(false);
  const hydrationWaitersRef = useRef<Array<() => void>>([]);

  const flushHydrationWaiters = useCallback(() => {
    if (hydrationDoneRef.current) return;
    hydrationDoneRef.current = true;
    const waiters = hydrationWaitersRef.current.splice(0);
    waiters.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    });
  }, []);

  const waitForHydration = useCallback((): Promise<void> => {
    if (hydrationDoneRef.current) return Promise.resolve();
    return new Promise<void>((resolve) => {
      hydrationWaitersRef.current.push(resolve);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (data) {
          const parsed = JSON.parse(data) as Partial<OnboardingState>;
          const merged = { ...defaultState, ...parsed };
          stateSnapshotRef.current = merged;
          setState(merged);
        }
      } catch {
        // AsyncStorage unavailable (e.g. private browsing on web) — use defaults
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          flushHydrationWaiters();
        }
      }
    };
    void loadData();
    return () => {
      cancelled = true;
    };
  }, [flushHydrationWaiters]);

  const persistUpdate = (patch: Partial<OnboardingState>) => {
    setState((prev) => {
      const newState = { ...prev, ...patch };
      stateSnapshotRef.current = newState;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch((err) => {
        if (__DEV__) {
          console.warn('[OnboardingContext] AsyncStorage.setItem failed — onboarding state will not persist across sessions.', err);
        }
      });
      return newState;
    });
  };

  const getSnapshot = useCallback(() => stateSnapshotRef.current, []);

  const value = useMemo(() => ({
    state,
    isLoading,
    setCountry:          (country: string) => persistUpdate({ country }),
    setCity:             (city: string) => persistUpdate({ city }),
    setCommunities:      (communities: string[]) => persistUpdate({ communities }),
    setNationalityId:    (nationalityId: string) => persistUpdate({ nationalityId }),
    setCultureIds:       (cultureIds: string[]) => persistUpdate({ cultureIds }),
    setLanguageIds:      (languageIds: string[]) => persistUpdate({ languageIds }),
    setDiasporaGroupIds: (diasporaGroupIds: string[]) => persistUpdate({ diasporaGroupIds }),
    setEthnicityText:    (ethnicityText: string) => persistUpdate({ ethnicityText }),
    setLanguages:        (languages: string[]) => persistUpdate({ languages }),
    setInterests:        (interests: string[]) => persistUpdate({ interests }),
    setSubscriptionTier: (subscriptionTier: OnboardingState['subscriptionTier']) => persistUpdate({ subscriptionTier }),
    completeOnboarding: async () => {
      persistUpdate({ isComplete: true });
    },
    restartOnboarding: async () => {
      persistUpdate({ isComplete: false });
    },
    resetOnboarding: async () => {
      stateSnapshotRef.current = defaultState;
      setState(defaultState);
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    },
    updateLocation: async (country: string, city: string) => {
      persistUpdate({ country, city });
    },
    waitForHydration,
    getSnapshot,
  }), [state, isLoading, waitForHydration, getSnapshot]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
