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
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
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
}
const STORAGE_KEY = stryMutAct_9fa48("0") ? "" : (stryCov_9fa48("0"), '@culturepass_onboarding');
const defaultState: OnboardingState = stryMutAct_9fa48("1") ? {} : (stryCov_9fa48("1"), {
  isComplete: stryMutAct_9fa48("2") ? true : (stryCov_9fa48("2"), false),
  country: stryMutAct_9fa48("3") ? "Stryker was here!" : (stryCov_9fa48("3"), ''),
  city: stryMutAct_9fa48("4") ? "Stryker was here!" : (stryCov_9fa48("4"), ''),
  communities: stryMutAct_9fa48("5") ? ["Stryker was here"] : (stryCov_9fa48("5"), []),
  nationalityId: stryMutAct_9fa48("6") ? "Stryker was here!" : (stryCov_9fa48("6"), ''),
  cultureIds: stryMutAct_9fa48("7") ? ["Stryker was here"] : (stryCov_9fa48("7"), []),
  languageIds: stryMutAct_9fa48("8") ? ["Stryker was here"] : (stryCov_9fa48("8"), []),
  diasporaGroupIds: stryMutAct_9fa48("9") ? ["Stryker was here"] : (stryCov_9fa48("9"), []),
  ethnicityText: stryMutAct_9fa48("10") ? "Stryker was here!" : (stryCov_9fa48("10"), ''),
  languages: stryMutAct_9fa48("11") ? ["Stryker was here"] : (stryCov_9fa48("11"), []),
  interests: stryMutAct_9fa48("12") ? ["Stryker was here"] : (stryCov_9fa48("12"), []),
  subscriptionTier: stryMutAct_9fa48("13") ? "" : (stryCov_9fa48("13"), 'free')
});
export const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);
export function OnboardingProvider({
  children
}: {
  children: ReactNode;
}) {
  if (stryMutAct_9fa48("14")) {
    {}
  } else {
    stryCov_9fa48("14");
    const [state, setState] = useState<OnboardingState>(defaultState);
    const [isLoading, setIsLoading] = useState(stryMutAct_9fa48("15") ? false : (stryCov_9fa48("15"), true));
    useEffect(() => {
      if (stryMutAct_9fa48("16")) {
        {}
      } else {
        stryCov_9fa48("16");
        const loadData = async () => {
          if (stryMutAct_9fa48("17")) {
            {}
          } else {
            stryCov_9fa48("17");
            try {
              if (stryMutAct_9fa48("18")) {
                {}
              } else {
                stryCov_9fa48("18");
                const data = await AsyncStorage.getItem(STORAGE_KEY);
                if (stryMutAct_9fa48("20") ? false : stryMutAct_9fa48("19") ? true : (stryCov_9fa48("19", "20"), data)) {
                  if (stryMutAct_9fa48("21")) {
                    {}
                  } else {
                    stryCov_9fa48("21");
                    const parsed = JSON.parse(data) as Partial<OnboardingState>;
                    setState(stryMutAct_9fa48("22") ? {} : (stryCov_9fa48("22"), {
                      ...defaultState,
                      ...parsed
                    }));
                  }
                }
              }
            } catch {
              // AsyncStorage unavailable (e.g. private browsing on web) — use defaults
            } finally {
              if (stryMutAct_9fa48("23")) {
                {}
              } else {
                stryCov_9fa48("23");
                setIsLoading(stryMutAct_9fa48("24") ? true : (stryCov_9fa48("24"), false));
              }
            }
          }
        };
        loadData();
        /* Stryker disable next-line all */
      }
    }, stryMutAct_9fa48("25") ? ["Stryker was here"] : (stryCov_9fa48("25"), []));
    const persistUpdate = async (patch: Partial<OnboardingState>) => {
      if (stryMutAct_9fa48("26")) {
        {}
      } else {
        stryCov_9fa48("26");
        setState(prev => {
          if (stryMutAct_9fa48("27")) {
            {}
          } else {
            stryCov_9fa48("27");
            const newState = stryMutAct_9fa48("28") ? {} : (stryCov_9fa48("28"), {
              ...prev,
              ...patch
            });
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState)).catch(err => {
              if (stryMutAct_9fa48("29")) {
                {}
              } else {
                stryCov_9fa48("29");
                if (stryMutAct_9fa48("31") ? false : stryMutAct_9fa48("30") ? true : (stryCov_9fa48("30", "31"), __DEV__)) {
                  if (stryMutAct_9fa48("32")) {
                    {}
                  } else {
                    stryCov_9fa48("32");
                    console.warn(stryMutAct_9fa48("33") ? "" : (stryCov_9fa48("33"), '[OnboardingContext] AsyncStorage.setItem failed — onboarding state will not persist across sessions.'), err);
                  }
                }
              }
            });
            return newState;
          }
        });
      }
    };
    const value = useMemo(stryMutAct_9fa48("34") ? () => undefined : (stryCov_9fa48("34"), () => stryMutAct_9fa48("35") ? {} : (stryCov_9fa48("35"), {
      state,
      isLoading,
      setCountry: stryMutAct_9fa48("36") ? () => undefined : (stryCov_9fa48("36"), (country: string) => persistUpdate(stryMutAct_9fa48("37") ? {} : (stryCov_9fa48("37"), {
        country
      }))),
      setCity: stryMutAct_9fa48("38") ? () => undefined : (stryCov_9fa48("38"), (city: string) => persistUpdate(stryMutAct_9fa48("39") ? {} : (stryCov_9fa48("39"), {
        city
      }))),
      setCommunities: stryMutAct_9fa48("40") ? () => undefined : (stryCov_9fa48("40"), (communities: string[]) => persistUpdate(stryMutAct_9fa48("41") ? {} : (stryCov_9fa48("41"), {
        communities
      }))),
      setNationalityId: stryMutAct_9fa48("42") ? () => undefined : (stryCov_9fa48("42"), (nationalityId: string) => persistUpdate(stryMutAct_9fa48("43") ? {} : (stryCov_9fa48("43"), {
        nationalityId
      }))),
      setCultureIds: stryMutAct_9fa48("44") ? () => undefined : (stryCov_9fa48("44"), (cultureIds: string[]) => persistUpdate(stryMutAct_9fa48("45") ? {} : (stryCov_9fa48("45"), {
        cultureIds
      }))),
      setLanguageIds: stryMutAct_9fa48("46") ? () => undefined : (stryCov_9fa48("46"), (languageIds: string[]) => persistUpdate(stryMutAct_9fa48("47") ? {} : (stryCov_9fa48("47"), {
        languageIds
      }))),
      setDiasporaGroupIds: stryMutAct_9fa48("48") ? () => undefined : (stryCov_9fa48("48"), (diasporaGroupIds: string[]) => persistUpdate(stryMutAct_9fa48("49") ? {} : (stryCov_9fa48("49"), {
        diasporaGroupIds
      }))),
      setEthnicityText: stryMutAct_9fa48("50") ? () => undefined : (stryCov_9fa48("50"), (ethnicityText: string) => persistUpdate(stryMutAct_9fa48("51") ? {} : (stryCov_9fa48("51"), {
        ethnicityText
      }))),
      setLanguages: stryMutAct_9fa48("52") ? () => undefined : (stryCov_9fa48("52"), (languages: string[]) => persistUpdate(stryMutAct_9fa48("53") ? {} : (stryCov_9fa48("53"), {
        languages
      }))),
      setInterests: stryMutAct_9fa48("54") ? () => undefined : (stryCov_9fa48("54"), (interests: string[]) => persistUpdate(stryMutAct_9fa48("55") ? {} : (stryCov_9fa48("55"), {
        interests
      }))),
      setSubscriptionTier: stryMutAct_9fa48("56") ? () => undefined : (stryCov_9fa48("56"), (subscriptionTier: OnboardingState['subscriptionTier']) => persistUpdate(stryMutAct_9fa48("57") ? {} : (stryCov_9fa48("57"), {
        subscriptionTier
      }))),
      completeOnboarding: stryMutAct_9fa48("58") ? () => undefined : (stryCov_9fa48("58"), () => persistUpdate(stryMutAct_9fa48("59") ? {} : (stryCov_9fa48("59"), {
        isComplete: stryMutAct_9fa48("60") ? false : (stryCov_9fa48("60"), true)
      }))),
      restartOnboarding: stryMutAct_9fa48("61") ? () => undefined : (stryCov_9fa48("61"), () => persistUpdate(stryMutAct_9fa48("62") ? {} : (stryCov_9fa48("62"), {
        isComplete: stryMutAct_9fa48("63") ? true : (stryCov_9fa48("63"), false)
      }))),
      resetOnboarding: async () => {
        if (stryMutAct_9fa48("64")) {
          {}
        } else {
          stryCov_9fa48("64");
          setState(defaultState);
          await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        }
      },
      updateLocation: stryMutAct_9fa48("65") ? () => undefined : (stryCov_9fa48("65"), (country: string, city: string) => persistUpdate(stryMutAct_9fa48("66") ? {} : (stryCov_9fa48("66"), {
        country,
        city
      })))
    })), stryMutAct_9fa48("67") ? [] : (stryCov_9fa48("67"), [state, isLoading]));
    return <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>;
  }
}
export function useOnboarding(): OnboardingContextValue {
  if (stryMutAct_9fa48("68")) {
    {}
  } else {
    stryCov_9fa48("68");
    const context = useContext(OnboardingContext);
    if (stryMutAct_9fa48("71") ? false : stryMutAct_9fa48("70") ? true : stryMutAct_9fa48("69") ? context : (stryCov_9fa48("69", "70", "71"), !context)) {
      if (stryMutAct_9fa48("72")) {
        {}
      } else {
        stryCov_9fa48("72");
        throw new Error(stryMutAct_9fa48("73") ? "" : (stryCov_9fa48("73"), 'useOnboarding must be used within an OnboardingProvider'));
      }
    }
    return context;
  }
}