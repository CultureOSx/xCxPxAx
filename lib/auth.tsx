import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { setAccessToken, setTokenRefresher } from '@/lib/query-client';
import { router } from 'expo-router';
import { auth as firebaseAuth } from '@/lib/firebase';
import { signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { api, ApiError } from '@/lib/api';
import type { User, UserRole } from '@/shared/schema';

/**
 * CulturePassAU Auth — Firebase Auth SDK
 */

export interface AuthUser extends User {
  // We keep the AuthUser name for internal provider consistency
  // but it now extends the full shared schema User.
  subscriptionTier?: 'free' | 'plus' | 'elite' | 'sydney-local';
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isRestoring: boolean;

  login: (session: AuthSession) => Promise<void>;
  logout: (redirect?: string) => Promise<void>;
  refreshSession: () => Promise<void>;

  hasRole: (...roles: UserRole[]) => boolean;

  isSydneyUser: boolean;
  isSydneyVerified: boolean;
  showSydneyWelcome: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userId: null,
  user: null,
  accessToken: null,
  isLoading: true,
  isRestoring: false,
  login: async () => {},
  logout: async () => {},
  refreshSession: async () => {},
  hasRole: () => false,
  isSydneyUser: false,
  isSydneyVerified: false,
  showSydneyWelcome: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

function devErrorLog(scope: string, error: unknown): void {
  if (__DEV__) {
    console.error(`[auth] ${scope}:`, error);
  } else {
    console.error(`[auth] ${scope}`);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  // ------------------------------------------------------------------
  // Firebase Auth state observer
  // ------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setSession(null);
        setAccessToken(null);
        setTokenRefresher(null);
        setIsRestoring(false);
        return;
      }

      try {
        const idToken = await firebaseUser.getIdToken();
        setAccessToken(idToken);
        // Inject refresher so apiRequest can self-heal on 401 without
        // importing Firebase directly (avoids circular dependency).
        setTokenRefresher(async () => {
          const u = firebaseAuth.currentUser;
          if (!u) return null;
          const t = await u.getIdToken(true);
          setAccessToken(t);
          return t;
        });

        let profileData: Partial<User> = {};
        
        // Robust API Retry Logic to prevent Ghost Sessions
        const fetchProfileWithRetry = async (retries = 1): Promise<User> => {
          try {
            return await api.auth.me() as User;
          } catch (err) {
            if (retries > 0 && err instanceof ApiError && err.isRateLimited) {
              await new Promise((r) => setTimeout(r, 2000));
              return fetchProfileWithRetry(retries - 1);
            }
            throw err;
          }
        };
        try {
          try {
            profileData = await fetchProfileWithRetry();
          } catch (profileErr) {
            // 404 means the user is authenticated in Firebase but no Firestore profile exists yet.
            if (profileErr instanceof ApiError && profileErr.status === 404) {
              profileData = {};
            } else {
              throw profileErr; // Re-throw to be caught by the outer handler
            }
          }
          
          const needsBootstrap = !profileData.createdAt || !profileData.culturePassId;
          if (needsBootstrap) {
            await api.auth.register({
              displayName: firebaseUser.displayName ?? undefined,
              city: profileData.city,
              country: profileData.country ?? 'Australia',
            });
            profileData = await api.auth.me() as User;
          }
        } catch (error) {
          // "Failed to fetch" = network / CORS error (e.g. localhost hitting prod API without CORS origin).
          // The user is still authenticated via Firebase; profile data will be sparse.
          const isNetworkError = 
            (error instanceof TypeError && error.message === 'Failed to fetch') ||
            (error instanceof ApiError && error.status === 0);
            
          if (isNetworkError && __DEV__) {
            console.warn('[auth] Profile fetch failed (network/CORS) — app running without server profile. Deploy functions or use emulator.');
          } else {
            devErrorLog('Critical profile fetch error. User may have limited access', error);
          }
        }

        const authUser: AuthUser = {
          ...profileData,
          id: firebaseUser.uid,
          username: profileData.username ?? firebaseUser.email?.split('@')[0] ?? firebaseUser.uid,
          displayName: profileData.displayName ?? firebaseUser.displayName ?? undefined,
          email: profileData.email ?? firebaseUser.email ?? undefined,
          role: profileData.role ?? 'user',
          subscriptionTier: profileData.membership?.tier as any ?? 'free',
          avatarUrl: profileData.avatarUrl ?? (firebaseUser.photoURL ?? undefined),
          createdAt: profileData.createdAt ?? new Date().toISOString(),
        };

        setSession({
          user: authUser,
          accessToken: idToken,
          expiresAt: Date.now() + 60 * 60 * 1000,
        });
        // NOTE: city/country sync to OnboardingContext is handled by
        // the DataSync component in _layout.tsx (avoids circular dep).
      } catch (error) {
        devErrorLog('onAuthStateChanged error', error);
        await signOut(firebaseAuth); // Force cleanup on critical failure
        setSession(null);
        setAccessToken(null);
      } finally {
        setIsRestoring(false);
      }
    });

    return unsubscribe;
  }, []);  

  // ------------------------------------------------------------------
  // Force-refresh ID token every 50 min to keep query-client in sync
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      try {
        const user = firebaseAuth.currentUser;
        if (user) {
          const freshToken = await user.getIdToken(true);
          setAccessToken(freshToken);
          setSession((prev) => prev ? { ...prev, accessToken: freshToken } : prev);
        }
      } catch {
        // Firebase will sign out via onAuthStateChanged if token is truly invalid
      }
    }, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [!!session]); // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------------
  // login() — kept for compatibility with manual session injection
  // ------------------------------------------------------------------
  const login = useCallback(async (newSession: AuthSession) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsLoading(true);
    try {
      setSession(newSession);
      setAccessToken(newSession.accessToken);
      router.replace('/(tabs)');
    } catch (error) {
      devErrorLog('login failed', error);
      Alert.alert('Login Failed', 'Please try again');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ------------------------------------------------------------------
  // logout() — signs out of Firebase; onAuthStateChanged clears session.
  // OnboardingContext reset is handled by DataSync watching user → null.
  // Default lands on Discovery so guests can still browse the app.
  // ------------------------------------------------------------------
  const logout = useCallback(async (redirectTo = '/(tabs)') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setIsLoading(true);
    try {
      await signOut(firebaseAuth);
      router.replace(redirectTo as never);
    } catch (error) {
      devErrorLog('logout failed', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ------------------------------------------------------------------
  // refreshSession() — force a fresh ID token
  // ------------------------------------------------------------------
  const refreshSession = useCallback(async () => {
    try {
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error('No authenticated user');
      const freshToken = await user.getIdToken(true);
      setAccessToken(freshToken);
      setSession((prev) => prev ? { ...prev, accessToken: freshToken } : prev);
    } catch (error) {
      devErrorLog('refreshSession failed', error);
      await logout('/(onboarding)/login');
      throw error;
    }
  }, [logout]);

  const isSydneyUser = !!session?.user.city?.toLowerCase().includes('sydney');
  const isSydneyVerified = !!session?.user.isSydneyVerified;

  const hasRole = useCallback((...roles: UserRole[]): boolean => {
    if (!session) return false;
    return roles.includes(session.user.role ?? 'user');
  }, [session]);

  const value = useMemo(() => ({
    isAuthenticated: !!session,
    userId: session?.user.id ?? null,
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    isLoading,
    isRestoring,
    login,
    logout,
    refreshSession,
    hasRole,
    isSydneyUser,
    isSydneyVerified,
    showSydneyWelcome: isSydneyUser,
  }), [
    session, isLoading, isRestoring, login, logout, refreshSession,
    hasRole, isSydneyUser, isSydneyVerified,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAutoRefresh — no-op in Firebase mode.
 * Firebase SDK handles token refresh automatically.
 * Kept for backward compatibility.
 */
export function useAutoRefresh() {
  // Firebase ID tokens are refreshed silently by the SDK.
}