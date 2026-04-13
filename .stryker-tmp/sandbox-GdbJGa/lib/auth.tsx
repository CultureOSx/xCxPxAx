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
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from 'react';
import { Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { setAccessToken, setTokenRefresher } from '@/lib/query-client';
import { router } from 'expo-router';
import { auth as firebaseAuth } from '@/lib/firebase';
import { signOut, onAuthStateChanged, sendEmailVerification, type User as FirebaseUser } from 'firebase/auth';
import { api, ApiError } from '@/lib/api';
import type { User, UserRole } from '@/shared/schema';
import { logError } from '@/lib/reporting';

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
  profileSyncStatus: 'ok' | 'degraded';
  profileSyncMessage: string | null;
  retryProfileSync: () => Promise<void>;
  emailVerified: boolean;
  sendVerificationEmail: () => Promise<void>;
  checkEmailVerified: () => Promise<boolean>;
}
const AuthContext = createContext<AuthContextType>(stryMutAct_9fa48("1551") ? {} : (stryCov_9fa48("1551"), {
  isAuthenticated: stryMutAct_9fa48("1552") ? true : (stryCov_9fa48("1552"), false),
  userId: null,
  user: null,
  accessToken: null,
  isLoading: stryMutAct_9fa48("1553") ? false : (stryCov_9fa48("1553"), true),
  isRestoring: stryMutAct_9fa48("1554") ? true : (stryCov_9fa48("1554"), false),
  login: async () => {},
  logout: async () => {},
  refreshSession: async () => {},
  hasRole: stryMutAct_9fa48("1555") ? () => undefined : (stryCov_9fa48("1555"), () => stryMutAct_9fa48("1556") ? true : (stryCov_9fa48("1556"), false)),
  isSydneyUser: stryMutAct_9fa48("1557") ? true : (stryCov_9fa48("1557"), false),
  isSydneyVerified: stryMutAct_9fa48("1558") ? true : (stryCov_9fa48("1558"), false),
  showSydneyWelcome: stryMutAct_9fa48("1559") ? true : (stryCov_9fa48("1559"), false),
  profileSyncStatus: stryMutAct_9fa48("1560") ? "" : (stryCov_9fa48("1560"), 'ok'),
  profileSyncMessage: null,
  retryProfileSync: async () => {},
  emailVerified: stryMutAct_9fa48("1561") ? true : (stryCov_9fa48("1561"), false),
  sendVerificationEmail: async () => {},
  checkEmailVerified: stryMutAct_9fa48("1562") ? () => undefined : (stryCov_9fa48("1562"), async () => stryMutAct_9fa48("1563") ? true : (stryCov_9fa48("1563"), false))
}));
export function useAuth() {
  if (stryMutAct_9fa48("1564")) {
    {}
  } else {
    stryCov_9fa48("1564");
    return useContext(AuthContext);
  }
}
function devErrorLog(scope: string, error: unknown): void {
  if (stryMutAct_9fa48("1565")) {
    {}
  } else {
    stryCov_9fa48("1565");
    if (stryMutAct_9fa48("1567") ? false : stryMutAct_9fa48("1566") ? true : (stryCov_9fa48("1566", "1567"), __DEV__)) {
      if (stryMutAct_9fa48("1568")) {
        {}
      } else {
        stryCov_9fa48("1568");
        console.error(stryMutAct_9fa48("1569") ? `` : (stryCov_9fa48("1569"), `[auth] ${scope}:`), error);
      }
    } else {
      if (stryMutAct_9fa48("1570")) {
        {}
      } else {
        stryCov_9fa48("1570");
        console.error(stryMutAct_9fa48("1571") ? `` : (stryCov_9fa48("1571"), `[auth] ${scope}`));
      }
    }
  }
}
function isTransientProfileError(error: unknown): boolean {
  if (stryMutAct_9fa48("1572")) {
    {}
  } else {
    stryCov_9fa48("1572");
    return stryMutAct_9fa48("1575") ? error instanceof ApiError && (error.isRateLimited || error.isNetworkError || error.isServerError) && error instanceof TypeError && error.message === 'Failed to fetch' : stryMutAct_9fa48("1574") ? false : stryMutAct_9fa48("1573") ? true : (stryCov_9fa48("1573", "1574", "1575"), (stryMutAct_9fa48("1577") ? error instanceof ApiError || error.isRateLimited || error.isNetworkError || error.isServerError : stryMutAct_9fa48("1576") ? false : (stryCov_9fa48("1576", "1577"), error instanceof ApiError && (stryMutAct_9fa48("1579") ? (error.isRateLimited || error.isNetworkError) && error.isServerError : stryMutAct_9fa48("1578") ? true : (stryCov_9fa48("1578", "1579"), (stryMutAct_9fa48("1581") ? error.isRateLimited && error.isNetworkError : stryMutAct_9fa48("1580") ? false : (stryCov_9fa48("1580", "1581"), error.isRateLimited || error.isNetworkError)) || error.isServerError)))) || (stryMutAct_9fa48("1583") ? error instanceof TypeError || error.message === 'Failed to fetch' : stryMutAct_9fa48("1582") ? false : (stryCov_9fa48("1582", "1583"), error instanceof TypeError && (stryMutAct_9fa48("1585") ? error.message !== 'Failed to fetch' : stryMutAct_9fa48("1584") ? true : (stryCov_9fa48("1584", "1585"), error.message === (stryMutAct_9fa48("1586") ? "" : (stryCov_9fa48("1586"), 'Failed to fetch')))))));
  }
}
function normalizeSubscriptionTier(value: unknown): AuthUser['subscriptionTier'] {
  if (stryMutAct_9fa48("1587")) {
    {}
  } else {
    stryCov_9fa48("1587");
    switch (value) {
      case stryMutAct_9fa48("1588") ? "" : (stryCov_9fa48("1588"), 'free'):
      case stryMutAct_9fa48("1589") ? "" : (stryCov_9fa48("1589"), 'plus'):
      case stryMutAct_9fa48("1590") ? "" : (stryCov_9fa48("1590"), 'elite'):
      case stryMutAct_9fa48("1592") ? "" : (stryCov_9fa48("1592"), 'sydney-local'):
        if (stryMutAct_9fa48("1591")) {} else {
          stryCov_9fa48("1591");
          return value;
        }
      default:
        if (stryMutAct_9fa48("1593")) {} else {
          stryCov_9fa48("1593");
          return stryMutAct_9fa48("1594") ? "" : (stryCov_9fa48("1594"), 'free');
        }
    }
  }
}
export function AuthProvider({
  children
}: {
  children: ReactNode;
}) {
  if (stryMutAct_9fa48("1595")) {
    {}
  } else {
    stryCov_9fa48("1595");
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(stryMutAct_9fa48("1596") ? true : (stryCov_9fa48("1596"), false));
    const [isRestoring, setIsRestoring] = useState(stryMutAct_9fa48("1597") ? false : (stryCov_9fa48("1597"), true));
    const [profileSyncStatus, setProfileSyncStatus] = useState<'ok' | 'degraded'>(stryMutAct_9fa48("1598") ? "" : (stryCov_9fa48("1598"), 'ok'));
    const [profileSyncMessage, setProfileSyncMessage] = useState<string | null>(null);
    const [profileRetryCount, setProfileRetryCount] = useState(0);
    const [emailVerified, setEmailVerified] = useState(stryMutAct_9fa48("1599") ? true : (stryCov_9fa48("1599"), false));

    // ------------------------------------------------------------------
    // Firebase Auth state observer
    // ------------------------------------------------------------------
    useEffect(() => {
      if (stryMutAct_9fa48("1600")) {
        {}
      } else {
        stryCov_9fa48("1600");
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser: FirebaseUser | null) => {
          if (stryMutAct_9fa48("1601")) {
            {}
          } else {
            stryCov_9fa48("1601");
            if (stryMutAct_9fa48("1604") ? false : stryMutAct_9fa48("1603") ? true : stryMutAct_9fa48("1602") ? firebaseUser : (stryCov_9fa48("1602", "1603", "1604"), !firebaseUser)) {
              if (stryMutAct_9fa48("1605")) {
                {}
              } else {
                stryCov_9fa48("1605");
                setSession(null);
                setAccessToken(null);
                setTokenRefresher(null);
                setProfileSyncStatus(stryMutAct_9fa48("1606") ? "" : (stryCov_9fa48("1606"), 'ok'));
                setProfileSyncMessage(null);
                setProfileRetryCount(0);
                setEmailVerified(stryMutAct_9fa48("1607") ? true : (stryCov_9fa48("1607"), false));
                setIsRestoring(stryMutAct_9fa48("1608") ? true : (stryCov_9fa48("1608"), false));
                return;
              }
            }
            setEmailVerified(firebaseUser.emailVerified);
            try {
              if (stryMutAct_9fa48("1609")) {
                {}
              } else {
                stryCov_9fa48("1609");
                const idToken = await firebaseUser.getIdToken();
                setAccessToken(idToken);
                // Inject refresher so apiRequest can self-heal on 401 without
                // importing Firebase directly (avoids circular dependency).
                setTokenRefresher(async () => {
                  if (stryMutAct_9fa48("1610")) {
                    {}
                  } else {
                    stryCov_9fa48("1610");
                    const u = firebaseAuth.currentUser;
                    if (stryMutAct_9fa48("1613") ? false : stryMutAct_9fa48("1612") ? true : stryMutAct_9fa48("1611") ? u : (stryCov_9fa48("1611", "1612", "1613"), !u)) return null;
                    const t = await u.getIdToken(stryMutAct_9fa48("1614") ? false : (stryCov_9fa48("1614"), true));
                    setAccessToken(t);
                    return t;
                  }
                });
                let profileData: Partial<User> = {};

                // Robust API Retry Logic to prevent Ghost Sessions
                const fetchProfileWithRetry = async (retries = 2, waitMs = 1200): Promise<User> => {
                  if (stryMutAct_9fa48("1615")) {
                    {}
                  } else {
                    stryCov_9fa48("1615");
                    try {
                      if (stryMutAct_9fa48("1616")) {
                        {}
                      } else {
                        stryCov_9fa48("1616");
                        return (await api.auth.me()) as User;
                      }
                    } catch (err) {
                      if (stryMutAct_9fa48("1617")) {
                        {}
                      } else {
                        stryCov_9fa48("1617");
                        if (stryMutAct_9fa48("1620") ? retries > 0 || isTransientProfileError(err) : stryMutAct_9fa48("1619") ? false : stryMutAct_9fa48("1618") ? true : (stryCov_9fa48("1618", "1619", "1620"), (stryMutAct_9fa48("1623") ? retries <= 0 : stryMutAct_9fa48("1622") ? retries >= 0 : stryMutAct_9fa48("1621") ? true : (stryCov_9fa48("1621", "1622", "1623"), retries > 0)) && isTransientProfileError(err))) {
                          if (stryMutAct_9fa48("1624")) {
                            {}
                          } else {
                            stryCov_9fa48("1624");
                            await new Promise(stryMutAct_9fa48("1625") ? () => undefined : (stryCov_9fa48("1625"), r => setTimeout(r, waitMs)));
                            return fetchProfileWithRetry(stryMutAct_9fa48("1626") ? retries + 1 : (stryCov_9fa48("1626"), retries - 1), stryMutAct_9fa48("1627") ? Math.max(waitMs * 2, 5000) : (stryCov_9fa48("1627"), Math.min(stryMutAct_9fa48("1628") ? waitMs / 2 : (stryCov_9fa48("1628"), waitMs * 2), 5000)));
                          }
                        }
                        throw err;
                      }
                    }
                  }
                };
                try {
                  if (stryMutAct_9fa48("1629")) {
                    {}
                  } else {
                    stryCov_9fa48("1629");
                    try {
                      if (stryMutAct_9fa48("1630")) {
                        {}
                      } else {
                        stryCov_9fa48("1630");
                        profileData = await fetchProfileWithRetry();
                      }
                    } catch (profileErr) {
                      if (stryMutAct_9fa48("1631")) {
                        {}
                      } else {
                        stryCov_9fa48("1631");
                        // 404 means the user is authenticated in Firebase but no Firestore profile exists yet.
                        if (stryMutAct_9fa48("1634") ? profileErr instanceof ApiError || profileErr.status === 404 : stryMutAct_9fa48("1633") ? false : stryMutAct_9fa48("1632") ? true : (stryCov_9fa48("1632", "1633", "1634"), profileErr instanceof ApiError && (stryMutAct_9fa48("1636") ? profileErr.status !== 404 : stryMutAct_9fa48("1635") ? true : (stryCov_9fa48("1635", "1636"), profileErr.status === 404)))) {
                          if (stryMutAct_9fa48("1637")) {
                            {}
                          } else {
                            stryCov_9fa48("1637");
                            profileData = {};
                          }
                        } else {
                          if (stryMutAct_9fa48("1638")) {
                            {}
                          } else {
                            stryCov_9fa48("1638");
                            throw profileErr; // Re-throw to be caught by the outer handler
                          }
                        }
                      }
                    }

                    // Firestore profile is materialized on first GET /api/auth/me (functions).
                    // Avoid POST /auth/register here — stale deploys returned HTML 404 for that path.
                  }
                } catch (error) {
                  if (stryMutAct_9fa48("1639")) {
                    {}
                  } else {
                    stryCov_9fa48("1639");
                    // The user is still authenticated via Firebase; profile data may be sparse.
                    if (stryMutAct_9fa48("1641") ? false : stryMutAct_9fa48("1640") ? true : (stryCov_9fa48("1640", "1641"), isTransientProfileError(error))) {
                      if (stryMutAct_9fa48("1642")) {
                        {}
                      } else {
                        stryCov_9fa48("1642");
                        setProfileSyncStatus(stryMutAct_9fa48("1643") ? "" : (stryCov_9fa48("1643"), 'degraded'));
                        setProfileSyncMessage(stryMutAct_9fa48("1644") ? "" : (stryCov_9fa48("1644"), 'Limited profile sync. Check network/CORS settings, then tap Retry.'));
                        setProfileRetryCount(0);
                        logError(error, stryMutAct_9fa48("1645") ? {} : (stryCov_9fa48("1645"), {
                          context: stryMutAct_9fa48("1646") ? "" : (stryCov_9fa48("1646"), 'auth.profile_sync.degraded'),
                          platform: Platform.OS
                        }));
                        if (stryMutAct_9fa48("1648") ? false : stryMutAct_9fa48("1647") ? true : (stryCov_9fa48("1647", "1648"), __DEV__)) {
                          if (stryMutAct_9fa48("1649")) {
                            {}
                          } else {
                            stryCov_9fa48("1649");
                            console.warn(stryMutAct_9fa48("1650") ? "" : (stryCov_9fa48("1650"), '[auth] Profile fetch degraded (network/CORS/transient server error).'));
                          }
                        }
                      }
                    } else {
                      if (stryMutAct_9fa48("1651")) {
                        {}
                      } else {
                        stryCov_9fa48("1651");
                        devErrorLog(stryMutAct_9fa48("1652") ? "" : (stryCov_9fa48("1652"), 'Critical profile fetch error. User may have limited access'), error);
                        logError(error, stryMutAct_9fa48("1653") ? {} : (stryCov_9fa48("1653"), {
                          context: stryMutAct_9fa48("1654") ? "" : (stryCov_9fa48("1654"), 'auth.profile_sync.failed_non_transient'),
                          platform: Platform.OS
                        }));
                      }
                    }
                  }
                }
                const authUser: AuthUser = stryMutAct_9fa48("1655") ? {} : (stryCov_9fa48("1655"), {
                  ...profileData,
                  id: firebaseUser.uid,
                  username: stryMutAct_9fa48("1656") ? (profileData.username ?? firebaseUser.email?.split('@')[0]) && firebaseUser.uid : (stryCov_9fa48("1656"), (stryMutAct_9fa48("1657") ? profileData.username && firebaseUser.email?.split('@')[0] : (stryCov_9fa48("1657"), profileData.username ?? (stryMutAct_9fa48("1658") ? firebaseUser.email.split('@')[0] : (stryCov_9fa48("1658"), firebaseUser.email?.split(stryMutAct_9fa48("1659") ? "" : (stryCov_9fa48("1659"), '@'))[0])))) ?? firebaseUser.uid),
                  displayName: stryMutAct_9fa48("1660") ? (profileData.displayName ?? firebaseUser.displayName) && undefined : (stryCov_9fa48("1660"), (stryMutAct_9fa48("1661") ? profileData.displayName && firebaseUser.displayName : (stryCov_9fa48("1661"), profileData.displayName ?? firebaseUser.displayName)) ?? undefined),
                  email: stryMutAct_9fa48("1662") ? (profileData.email ?? firebaseUser.email) && undefined : (stryCov_9fa48("1662"), (stryMutAct_9fa48("1663") ? profileData.email && firebaseUser.email : (stryCov_9fa48("1663"), profileData.email ?? firebaseUser.email)) ?? undefined),
                  role: stryMutAct_9fa48("1664") ? profileData.role && 'user' : (stryCov_9fa48("1664"), profileData.role ?? (stryMutAct_9fa48("1665") ? "" : (stryCov_9fa48("1665"), 'user'))),
                  subscriptionTier: normalizeSubscriptionTier(stryMutAct_9fa48("1666") ? profileData.membership.tier : (stryCov_9fa48("1666"), profileData.membership?.tier)),
                  avatarUrl: stryMutAct_9fa48("1667") ? profileData.avatarUrl && (firebaseUser.photoURL ?? undefined) : (stryCov_9fa48("1667"), profileData.avatarUrl ?? (stryMutAct_9fa48("1668") ? firebaseUser.photoURL && undefined : (stryCov_9fa48("1668"), firebaseUser.photoURL ?? undefined))),
                  createdAt: stryMutAct_9fa48("1669") ? profileData.createdAt && new Date().toISOString() : (stryCov_9fa48("1669"), profileData.createdAt ?? new Date().toISOString())
                });
                setProfileSyncStatus(stryMutAct_9fa48("1670") ? "" : (stryCov_9fa48("1670"), 'ok'));
                setProfileSyncMessage(null);
                setSession(stryMutAct_9fa48("1671") ? {} : (stryCov_9fa48("1671"), {
                  user: authUser,
                  accessToken: idToken,
                  expiresAt: stryMutAct_9fa48("1672") ? Date.now() - 60 * 60 * 1000 : (stryCov_9fa48("1672"), Date.now() + (stryMutAct_9fa48("1673") ? 60 * 60 / 1000 : (stryCov_9fa48("1673"), (stryMutAct_9fa48("1674") ? 60 / 60 : (stryCov_9fa48("1674"), 60 * 60)) * 1000)))
                }));
                // NOTE: city/country sync to OnboardingContext is handled by
                // the DataSync component in _layout.tsx (avoids circular dep).
              }
            } catch (error) {
              if (stryMutAct_9fa48("1675")) {
                {}
              } else {
                stryCov_9fa48("1675");
                devErrorLog(stryMutAct_9fa48("1676") ? "" : (stryCov_9fa48("1676"), 'onAuthStateChanged error'), error);
                await signOut(firebaseAuth); // Force cleanup on critical failure
                setSession(null);
                setAccessToken(null);
              }
            } finally {
              if (stryMutAct_9fa48("1677")) {
                {}
              } else {
                stryCov_9fa48("1677");
                setIsRestoring(stryMutAct_9fa48("1678") ? true : (stryCov_9fa48("1678"), false));
              }
            }
          }
        });
        return unsubscribe;
      }
    }, stryMutAct_9fa48("1679") ? ["Stryker was here"] : (stryCov_9fa48("1679"), []));
    const retryProfileSync = useCallback(async () => {
      if (stryMutAct_9fa48("1680")) {
        {}
      } else {
        stryCov_9fa48("1680");
        const currentUser = firebaseAuth.currentUser;
        if (stryMutAct_9fa48("1683") ? false : stryMutAct_9fa48("1682") ? true : stryMutAct_9fa48("1681") ? currentUser : (stryCov_9fa48("1681", "1682", "1683"), !currentUser)) return;
        try {
          if (stryMutAct_9fa48("1684")) {
            {}
          } else {
            stryCov_9fa48("1684");
            const profile = await api.auth.me();
            setSession(prev => {
              if (stryMutAct_9fa48("1685")) {
                {}
              } else {
                stryCov_9fa48("1685");
                if (stryMutAct_9fa48("1688") ? false : stryMutAct_9fa48("1687") ? true : stryMutAct_9fa48("1686") ? prev : (stryCov_9fa48("1686", "1687", "1688"), !prev)) return prev;
                return stryMutAct_9fa48("1689") ? {} : (stryCov_9fa48("1689"), {
                  ...prev,
                  user: stryMutAct_9fa48("1690") ? {} : (stryCov_9fa48("1690"), {
                    ...prev.user,
                    ...profile,
                    id: prev.user.id,
                    subscriptionTier: normalizeSubscriptionTier(stryMutAct_9fa48("1691") ? profile.membership?.tier && prev.user.subscriptionTier : (stryCov_9fa48("1691"), (stryMutAct_9fa48("1692") ? profile.membership.tier : (stryCov_9fa48("1692"), profile.membership?.tier)) ?? prev.user.subscriptionTier))
                  })
                });
              }
            });
            setProfileSyncStatus(stryMutAct_9fa48("1693") ? "" : (stryCov_9fa48("1693"), 'ok'));
            setProfileSyncMessage(null);
            setProfileRetryCount(0);
          }
        } catch (error) {
          if (stryMutAct_9fa48("1694")) {
            {}
          } else {
            stryCov_9fa48("1694");
            setProfileSyncStatus(stryMutAct_9fa48("1695") ? "" : (stryCov_9fa48("1695"), 'degraded'));
            setProfileSyncMessage(stryMutAct_9fa48("1696") ? "" : (stryCov_9fa48("1696"), 'Limited profile sync. Check network/CORS settings, then tap Retry.'));
            setProfileRetryCount(stryMutAct_9fa48("1697") ? () => undefined : (stryCov_9fa48("1697"), n => stryMutAct_9fa48("1698") ? n - 1 : (stryCov_9fa48("1698"), n + 1)));
            logError(error, stryMutAct_9fa48("1699") ? {} : (stryCov_9fa48("1699"), {
              context: stryMutAct_9fa48("1700") ? "" : (stryCov_9fa48("1700"), 'auth.profile_sync.retry_failed'),
              platform: Platform.OS
            }));
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("1701") ? ["Stryker was here"] : (stryCov_9fa48("1701"), []));
    useEffect(() => {
      if (stryMutAct_9fa48("1702")) {
        {}
      } else {
        stryCov_9fa48("1702");
        if (stryMutAct_9fa48("1705") ? (!session || profileSyncStatus !== 'degraded') && profileRetryCount >= 6 : stryMutAct_9fa48("1704") ? false : stryMutAct_9fa48("1703") ? true : (stryCov_9fa48("1703", "1704", "1705"), (stryMutAct_9fa48("1707") ? !session && profileSyncStatus !== 'degraded' : stryMutAct_9fa48("1706") ? false : (stryCov_9fa48("1706", "1707"), (stryMutAct_9fa48("1708") ? session : (stryCov_9fa48("1708"), !session)) || (stryMutAct_9fa48("1710") ? profileSyncStatus === 'degraded' : stryMutAct_9fa48("1709") ? false : (stryCov_9fa48("1709", "1710"), profileSyncStatus !== (stryMutAct_9fa48("1711") ? "" : (stryCov_9fa48("1711"), 'degraded')))))) || (stryMutAct_9fa48("1714") ? profileRetryCount < 6 : stryMutAct_9fa48("1713") ? profileRetryCount > 6 : stryMutAct_9fa48("1712") ? false : (stryCov_9fa48("1712", "1713", "1714"), profileRetryCount >= 6)))) return;
        const timer = setTimeout(() => {
          if (stryMutAct_9fa48("1715")) {
            {}
          } else {
            stryCov_9fa48("1715");
            retryProfileSync().catch(() => {});
          }
        }, 30000);
        return stryMutAct_9fa48("1716") ? () => undefined : (stryCov_9fa48("1716"), () => clearTimeout(timer));
      }
    }, stryMutAct_9fa48("1717") ? [] : (stryCov_9fa48("1717"), [profileRetryCount, profileSyncStatus, retryProfileSync, session]));

    // ------------------------------------------------------------------
    // Force-refresh ID token every 50 min to keep query-client in sync
    // ------------------------------------------------------------------
    useEffect(() => {
      if (stryMutAct_9fa48("1718")) {
        {}
      } else {
        stryCov_9fa48("1718");
        if (stryMutAct_9fa48("1721") ? false : stryMutAct_9fa48("1720") ? true : stryMutAct_9fa48("1719") ? session : (stryCov_9fa48("1719", "1720", "1721"), !session)) return;
        const interval = setInterval(async () => {
          if (stryMutAct_9fa48("1722")) {
            {}
          } else {
            stryCov_9fa48("1722");
            try {
              if (stryMutAct_9fa48("1723")) {
                {}
              } else {
                stryCov_9fa48("1723");
                const user = firebaseAuth.currentUser;
                if (stryMutAct_9fa48("1725") ? false : stryMutAct_9fa48("1724") ? true : (stryCov_9fa48("1724", "1725"), user)) {
                  if (stryMutAct_9fa48("1726")) {
                    {}
                  } else {
                    stryCov_9fa48("1726");
                    const freshToken = await user.getIdToken(stryMutAct_9fa48("1727") ? false : (stryCov_9fa48("1727"), true));
                    setAccessToken(freshToken);
                    setSession(stryMutAct_9fa48("1728") ? () => undefined : (stryCov_9fa48("1728"), prev => prev ? stryMutAct_9fa48("1729") ? {} : (stryCov_9fa48("1729"), {
                      ...prev,
                      accessToken: freshToken
                    }) : prev));
                  }
                }
              }
            } catch {
              // Firebase will sign out via onAuthStateChanged if token is truly invalid
            }
          }
        }, stryMutAct_9fa48("1730") ? 50 * 60 / 1000 : (stryCov_9fa48("1730"), (stryMutAct_9fa48("1731") ? 50 / 60 : (stryCov_9fa48("1731"), 50 * 60)) * 1000));
        return stryMutAct_9fa48("1732") ? () => undefined : (stryCov_9fa48("1732"), () => clearInterval(interval));
      }
    }, stryMutAct_9fa48("1733") ? [] : (stryCov_9fa48("1733"), [stryMutAct_9fa48("1734") ? !session : (stryCov_9fa48("1734"), !(stryMutAct_9fa48("1735") ? session : (stryCov_9fa48("1735"), !session)))])); // eslint-disable-line react-hooks/exhaustive-deps

    // ------------------------------------------------------------------
    // login() — kept for compatibility with manual session injection
    // ------------------------------------------------------------------
    const login = useCallback(async (newSession: AuthSession) => {
      if (stryMutAct_9fa48("1736")) {
        {}
      } else {
        stryCov_9fa48("1736");
        if (stryMutAct_9fa48("1739") ? Platform.OS === 'web' : stryMutAct_9fa48("1738") ? false : stryMutAct_9fa48("1737") ? true : (stryCov_9fa48("1737", "1738", "1739"), Platform.OS !== (stryMutAct_9fa48("1740") ? "" : (stryCov_9fa48("1740"), 'web')))) {
          if (stryMutAct_9fa48("1741")) {
            {}
          } else {
            stryCov_9fa48("1741");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
        setIsLoading(stryMutAct_9fa48("1742") ? false : (stryCov_9fa48("1742"), true));
        try {
          if (stryMutAct_9fa48("1743")) {
            {}
          } else {
            stryCov_9fa48("1743");
            setSession(newSession);
            setAccessToken(newSession.accessToken);
            router.replace(stryMutAct_9fa48("1744") ? "" : (stryCov_9fa48("1744"), '/(tabs)'));
          }
        } catch (error) {
          if (stryMutAct_9fa48("1745")) {
            {}
          } else {
            stryCov_9fa48("1745");
            devErrorLog(stryMutAct_9fa48("1746") ? "" : (stryCov_9fa48("1746"), 'login failed'), error);
            Alert.alert(stryMutAct_9fa48("1747") ? "" : (stryCov_9fa48("1747"), 'Login Failed'), stryMutAct_9fa48("1748") ? "" : (stryCov_9fa48("1748"), 'Please try again'));
            throw error;
          }
        } finally {
          if (stryMutAct_9fa48("1749")) {
            {}
          } else {
            stryCov_9fa48("1749");
            setIsLoading(stryMutAct_9fa48("1750") ? true : (stryCov_9fa48("1750"), false));
          }
        }
      }
    }, stryMutAct_9fa48("1751") ? ["Stryker was here"] : (stryCov_9fa48("1751"), []));

    // ------------------------------------------------------------------
    // logout() — signs out of Firebase; onAuthStateChanged clears session.
    // OnboardingContext reset is handled by DataSync watching user → null.
    // Default lands on Discovery so guests can still browse the app.
    // ------------------------------------------------------------------
    const logout = useCallback(async (redirectTo = stryMutAct_9fa48("1752") ? "" : (stryCov_9fa48("1752"), '/(tabs)')) => {
      if (stryMutAct_9fa48("1753")) {
        {}
      } else {
        stryCov_9fa48("1753");
        if (stryMutAct_9fa48("1756") ? Platform.OS === 'web' : stryMutAct_9fa48("1755") ? false : stryMutAct_9fa48("1754") ? true : (stryCov_9fa48("1754", "1755", "1756"), Platform.OS !== (stryMutAct_9fa48("1757") ? "" : (stryCov_9fa48("1757"), 'web')))) {
          if (stryMutAct_9fa48("1758")) {
            {}
          } else {
            stryCov_9fa48("1758");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }
        }
        setIsLoading(stryMutAct_9fa48("1759") ? false : (stryCov_9fa48("1759"), true));
        try {
          if (stryMutAct_9fa48("1760")) {
            {}
          } else {
            stryCov_9fa48("1760");
            await signOut(firebaseAuth);
            router.replace(redirectTo as never);
          }
        } catch (error) {
          if (stryMutAct_9fa48("1761")) {
            {}
          } else {
            stryCov_9fa48("1761");
            devErrorLog(stryMutAct_9fa48("1762") ? "" : (stryCov_9fa48("1762"), 'logout failed'), error);
          }
        } finally {
          if (stryMutAct_9fa48("1763")) {
            {}
          } else {
            stryCov_9fa48("1763");
            setIsLoading(stryMutAct_9fa48("1764") ? true : (stryCov_9fa48("1764"), false));
          }
        }
      }
    }, stryMutAct_9fa48("1765") ? ["Stryker was here"] : (stryCov_9fa48("1765"), []));

    // ------------------------------------------------------------------
    // refreshSession() — force a fresh ID token
    // ------------------------------------------------------------------
    const refreshSession = useCallback(async () => {
      if (stryMutAct_9fa48("1766")) {
        {}
      } else {
        stryCov_9fa48("1766");
        try {
          if (stryMutAct_9fa48("1767")) {
            {}
          } else {
            stryCov_9fa48("1767");
            const user = firebaseAuth.currentUser;
            if (stryMutAct_9fa48("1770") ? false : stryMutAct_9fa48("1769") ? true : stryMutAct_9fa48("1768") ? user : (stryCov_9fa48("1768", "1769", "1770"), !user)) throw new Error(stryMutAct_9fa48("1771") ? "" : (stryCov_9fa48("1771"), 'No authenticated user'));
            const freshToken = await user.getIdToken(stryMutAct_9fa48("1772") ? false : (stryCov_9fa48("1772"), true));
            setAccessToken(freshToken);
            setSession(stryMutAct_9fa48("1773") ? () => undefined : (stryCov_9fa48("1773"), prev => prev ? stryMutAct_9fa48("1774") ? {} : (stryCov_9fa48("1774"), {
              ...prev,
              accessToken: freshToken
            }) : prev));
          }
        } catch (error) {
          if (stryMutAct_9fa48("1775")) {
            {}
          } else {
            stryCov_9fa48("1775");
            devErrorLog(stryMutAct_9fa48("1776") ? "" : (stryCov_9fa48("1776"), 'refreshSession failed'), error);
            await logout(stryMutAct_9fa48("1777") ? "" : (stryCov_9fa48("1777"), '/(onboarding)/login'));
            throw error;
          }
        }
      }
    }, stryMutAct_9fa48("1778") ? [] : (stryCov_9fa48("1778"), [logout]));
    const sendVerificationEmail = useCallback(async () => {
      if (stryMutAct_9fa48("1779")) {
        {}
      } else {
        stryCov_9fa48("1779");
        const user = firebaseAuth.currentUser;
        if (stryMutAct_9fa48("1782") ? false : stryMutAct_9fa48("1781") ? true : stryMutAct_9fa48("1780") ? user : (stryCov_9fa48("1780", "1781", "1782"), !user)) throw new Error(stryMutAct_9fa48("1783") ? "" : (stryCov_9fa48("1783"), 'No authenticated user'));
        if (stryMutAct_9fa48("1785") ? false : stryMutAct_9fa48("1784") ? true : (stryCov_9fa48("1784", "1785"), user.emailVerified)) return;
        await sendEmailVerification(user);
      }
    }, stryMutAct_9fa48("1786") ? ["Stryker was here"] : (stryCov_9fa48("1786"), []));
    const checkEmailVerified = useCallback(async (): Promise<boolean> => {
      if (stryMutAct_9fa48("1787")) {
        {}
      } else {
        stryCov_9fa48("1787");
        const user = firebaseAuth.currentUser;
        if (stryMutAct_9fa48("1790") ? false : stryMutAct_9fa48("1789") ? true : stryMutAct_9fa48("1788") ? user : (stryCov_9fa48("1788", "1789", "1790"), !user)) return stryMutAct_9fa48("1791") ? true : (stryCov_9fa48("1791"), false);
        await user.reload();
        const verified = stryMutAct_9fa48("1792") ? firebaseAuth.currentUser?.emailVerified && false : (stryCov_9fa48("1792"), (stryMutAct_9fa48("1793") ? firebaseAuth.currentUser.emailVerified : (stryCov_9fa48("1793"), firebaseAuth.currentUser?.emailVerified)) ?? (stryMutAct_9fa48("1794") ? true : (stryCov_9fa48("1794"), false)));
        setEmailVerified(verified);
        return verified;
      }
    }, stryMutAct_9fa48("1795") ? ["Stryker was here"] : (stryCov_9fa48("1795"), []));
    const isSydneyUser = stryMutAct_9fa48("1796") ? !session?.user.city?.toLowerCase().includes('sydney') : (stryCov_9fa48("1796"), !(stryMutAct_9fa48("1797") ? session?.user.city?.toLowerCase().includes('sydney') : (stryCov_9fa48("1797"), !(stryMutAct_9fa48("1800") ? session.user.city?.toLowerCase().includes('sydney') : stryMutAct_9fa48("1799") ? session?.user.city.toLowerCase().includes('sydney') : stryMutAct_9fa48("1798") ? session?.user.city?.toUpperCase().includes('sydney') : (stryCov_9fa48("1798", "1799", "1800"), session?.user.city?.toLowerCase().includes(stryMutAct_9fa48("1801") ? "" : (stryCov_9fa48("1801"), 'sydney')))))));
    const isSydneyVerified = stryMutAct_9fa48("1802") ? !session?.user.isSydneyVerified : (stryCov_9fa48("1802"), !(stryMutAct_9fa48("1803") ? session?.user.isSydneyVerified : (stryCov_9fa48("1803"), !(stryMutAct_9fa48("1804") ? session.user.isSydneyVerified : (stryCov_9fa48("1804"), session?.user.isSydneyVerified)))));
    const hasRole = useCallback((...roles: UserRole[]): boolean => {
      if (stryMutAct_9fa48("1805")) {
        {}
      } else {
        stryCov_9fa48("1805");
        if (stryMutAct_9fa48("1808") ? false : stryMutAct_9fa48("1807") ? true : stryMutAct_9fa48("1806") ? session : (stryCov_9fa48("1806", "1807", "1808"), !session)) return stryMutAct_9fa48("1809") ? true : (stryCov_9fa48("1809"), false);
        return roles.includes(stryMutAct_9fa48("1810") ? session.user.role && 'user' : (stryCov_9fa48("1810"), session.user.role ?? (stryMutAct_9fa48("1811") ? "" : (stryCov_9fa48("1811"), 'user'))));
      }
    }, stryMutAct_9fa48("1812") ? [] : (stryCov_9fa48("1812"), [session]));
    const value = useMemo(stryMutAct_9fa48("1813") ? () => undefined : (stryCov_9fa48("1813"), () => stryMutAct_9fa48("1814") ? {} : (stryCov_9fa48("1814"), {
      isAuthenticated: stryMutAct_9fa48("1815") ? !session : (stryCov_9fa48("1815"), !(stryMutAct_9fa48("1816") ? session : (stryCov_9fa48("1816"), !session))),
      userId: stryMutAct_9fa48("1817") ? session?.user.id && null : (stryCov_9fa48("1817"), (stryMutAct_9fa48("1818") ? session.user.id : (stryCov_9fa48("1818"), session?.user.id)) ?? null),
      user: stryMutAct_9fa48("1819") ? session?.user && null : (stryCov_9fa48("1819"), (stryMutAct_9fa48("1820") ? session.user : (stryCov_9fa48("1820"), session?.user)) ?? null),
      accessToken: stryMutAct_9fa48("1821") ? session?.accessToken && null : (stryCov_9fa48("1821"), (stryMutAct_9fa48("1822") ? session.accessToken : (stryCov_9fa48("1822"), session?.accessToken)) ?? null),
      isLoading,
      isRestoring,
      login,
      logout,
      refreshSession,
      hasRole,
      isSydneyUser,
      isSydneyVerified,
      showSydneyWelcome: isSydneyUser,
      profileSyncStatus,
      profileSyncMessage,
      retryProfileSync,
      emailVerified,
      sendVerificationEmail,
      checkEmailVerified
    })), stryMutAct_9fa48("1823") ? [] : (stryCov_9fa48("1823"), [session, isLoading, isRestoring, login, logout, refreshSession, hasRole, isSydneyUser, isSydneyVerified, profileSyncStatus, profileSyncMessage, retryProfileSync, emailVerified, sendVerificationEmail, checkEmailVerified]));
    return <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>;
  }
}

/**
 * useAutoRefresh — no-op in Firebase mode.
 * Firebase SDK handles token refresh automatically.
 * Kept for backward compatibility.
 */
export function useAutoRefresh() {
  // Firebase ID tokens are refreshed silently by the SDK.
}