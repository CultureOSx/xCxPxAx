import "react-native-reanimated"; // <-- CRUCIAL FIX: Must be at the very top
import { Buffer } from "buffer";

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, useSegments, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Sentry from '@sentry/react-native';
import { PostHogProvider } from 'posthog-react-native';
import posthogClient, { identifyUser, resetUser } from '@/lib/analytics';
import React, { useCallback, useEffect, useRef } from "react";
import {
  Platform,
  View,
  StyleSheet,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient, queryPersister } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/lib/auth";
import {
  OnboardingProvider,
  useOnboarding,
} from "@/contexts/OnboardingContext";
import { SavedProvider } from "@/contexts/SavedContext";
import { ContactsProvider } from "@/contexts/ContactsContext";
import { useColors } from "@/hooks/useColors";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useLayout } from "@/hooks/useLayout";
import { initializeWidgets } from "@/lib/widgets/register";
import { WebSidebar } from "@/components/web/WebSidebar";
import { BackButton } from "@/components/ui/BackButton";

import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
// Web font loader for Expo web is automatically handled by @expo-google-fonts


Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  tracesSampleRate: 1.0,
  debug: false,
});

global.Buffer = Buffer;

// Suppress upstream React Native Web deprecation warning from @react-navigation/bottom-tabs
// BottomTabBar passes `pointerEvents` as a prop (old RN pattern); RNW ≥0.19 expects style.pointerEvents.
// Remove this block once the upstream library is patched.
if (Platform.OS === 'web' && typeof console !== 'undefined') {
  const _warn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('props.pointerEvents is deprecated')) return;
    _warn(...args);
  };
}

// Prevent splash auto-hide safely
SplashScreen.preventAutoHideAsync().catch(() => {});

// ---------------------------------------------------------------------------
// DataSync — bridges auth user state into OnboardingContext without making
// AuthProvider depend on OnboardingContext (breaks potential circular deps).
// Lives inside both OnboardingProvider AND AuthProvider.
// ---------------------------------------------------------------------------
function DataSync() {
  const { user } = useAuth();
  const {
    setCity,
    setCountry,
    setInterests,
    setCommunities,
    setSubscriptionTier,
    state,
    resetOnboarding,
    completeOnboarding,
  } = useOnboarding();
  // Track the previous user id so we can detect logout (authenticated → null)
  // without incorrectly resetting onboarding on the initial cold-start null state.
  const prevUserIdRef = useRef<string | null>(null);

  // Register for push notifications when user is authenticated
  usePushNotifications();

  useEffect(() => {
    async function syncOnboarding() {
      // After login: user transitions from null to defined
      if (user && prevUserIdRef.current !== user.id) {
        prevUserIdRef.current = user.id;
        // Sync user's stored city/country into onboarding state so Discover
        // page location filters work automatically after login.
        if (user.city && user.city !== state.city) setCity(user.city);
        if (user.country && user.country !== state.country) setCountry(user.country);
        if (JSON.stringify(user.interests ?? []) !== JSON.stringify(state.interests)) {
          setInterests(user.interests ?? []);
        }
        if (JSON.stringify(user.communities ?? []) !== JSON.stringify(state.communities)) {
          setCommunities(user.communities ?? []);
        }
        if ((user.subscriptionTier ?? 'free') !== state.subscriptionTier) {
          setSubscriptionTier(user.subscriptionTier ?? 'free');
        }
        // Fallback: If user profile is complete but onboarding is not, complete onboarding
        if (!state.isComplete && user.city && user.country && (user.interests?.length ?? 0) > 0) {
          await completeOnboarding();
        }
        // Analytics Tracking
        identifyUser(user.id, {
          email: user.email,
          city: user.city,
          country: user.country,
          subscriptionTier: user.subscriptionTier,
        });
      }
      // After logout: user transitions from defined to null
      else if (!user && prevUserIdRef.current !== null) {
        prevUserIdRef.current = null;
        resetUser();
        resetOnboarding();
      }
    }
    syncOnboarding();
    // Only re-run when the auth user's identity or profile fields change.
    // The setter functions (setCity, setCommunities, etc.) and resetOnboarding
    // are stable refs from OnboardingContext and don't need to be in the dep array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.id,
    user?.city,
    user?.country,
    user?.interests,
    user?.communities,
    user?.subscriptionTier,
    state.isComplete,
  ]);

  return null;
}

// ---------------------------------------------------------------------------
// AuthGuard — Global Route Protector
// Handles phase 2 auth-guard redirect rules and prevents unauthenticated
// users from bypassing login to access privileged areas.
// ---------------------------------------------------------------------------
function AuthGuard() {
  const { user, isRestoring } = useAuth();
  const { state: onboardingState } = useOnboarding();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (isRestoring) return;

    // Define strictly protected root-level screens
    const protectedRoutes = [
      'profile',
      'tickets',
      'payment',
      'saved',
      'settings',
      'membership',
      'submit',
      'scanner',
      'notifications',
      'contacts',
    ];

    // Some (tabs) are fully open to guests (index, communities, map). 
    // Others (like profile, perks, calendar) require login.
    const isProtected = 
      protectedRoutes.includes(segments[0] as string) || 
      (segments[0] === '(tabs)' && (segments[1] === 'profile' || segments[1] === 'perks' || segments[1] === 'calendar' || segments[1] === 'dashboard'));

    const inOnboardingGroup = segments[0] === '(onboarding)';
    const currentOnboardingScreen = segments[1] ?? 'index';
    const preAuthScreens = new Set(['index', 'login', 'signup', 'forgot-password']);

    if (!user && isProtected) {
      // Guests hitting a locked screen → route to login
      router.replace('/(onboarding)/login');
    } else if (user && inOnboardingGroup && preAuthScreens.has(currentOnboardingScreen)) {
      // Authenticated users should either finish onboarding or return to the app shell.
      router.replace(onboardingState.isComplete ? '/(tabs)' : '/(onboarding)/location');
    }
  }, [user, segments, isRestoring, onboardingState.isComplete, router]);

  return null;
}

// ---------------------------------------------------------------------------
// Stack navigator — all screens registered here so Expo Router can deep-link
// ---------------------------------------------------------------------------
function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        // Empty string removes the "Back" label next to the iOS chevron
        headerBackTitle: "",
        animation: Platform.OS === "web" ? "fade" : Platform.OS === "ios" ? "default" : "slide_from_right",
      }}
    >
      <Stack.Screen name="landing" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />

      <Stack.Screen name="event/[id]" />
      <Stack.Screen name="event/create" />
      <Stack.Screen name="community/[id]" />
      <Stack.Screen name="business/[id]" />
      <Stack.Screen name="artist/[id]" />
      <Stack.Screen name="venue/[id]" />
      <Stack.Screen name="user/[id]" />

      <Stack.Screen name="profile/[id]" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="profile/public" />
      <Stack.Screen name="profile/qr" />

      <Stack.Screen name="movies/index" />
      <Stack.Screen name="movies/[id]" />
      <Stack.Screen name="restaurants/index" />
      <Stack.Screen name="restaurants/[id]" />
      <Stack.Screen name="activities/index" />
      <Stack.Screen name="activities/[id]" />
      <Stack.Screen name="shopping/index" />
      <Stack.Screen name="shopping/[id]" />
      <Stack.Screen name="communities/index" />

      <Stack.Screen name="payment/methods" />
      <Stack.Screen name="payment/transactions" />
      <Stack.Screen name="payment/wallet" />
      <Stack.Screen name="payment/success" />
      <Stack.Screen name="payment/cancel" />

      <Stack.Screen name="tickets/index" />
      <Stack.Screen name="tickets/[id]" />
      <Stack.Screen name="tickets/print/[id]" />
      <Stack.Screen name="perks/[id]" />
      <Stack.Screen name="notifications/index" />

      <Stack.Screen name="contacts/index" />
      <Stack.Screen name="contacts/[cpid]" />
      <Stack.Screen name="scanner" />

      <Stack.Screen name="search/index" />
      <Stack.Screen name="saved/index" />
      <Stack.Screen name="submit/index" />
      <Stack.Screen name="events" />
      <Stack.Screen name="map" />
      <Stack.Screen name="membership/upgrade" />

      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/location" />
      <Stack.Screen name="settings/about" />
      <Stack.Screen name="settings/help" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/privacy" />
      <Stack.Screen name="dashboard" />

      <Stack.Screen name="help/index" />
      <Stack.Screen name="legal/terms" />
      <Stack.Screen name="legal/privacy" />
      <Stack.Screen name="legal/cookies" />
      <Stack.Screen name="legal/guidelines" />

      <Stack.Screen name="admin/users" />
      <Stack.Screen name="admin/dashboard" />
      <Stack.Screen name="admin/notifications" />
      <Stack.Screen name="admin/audit-logs" />
    </Stack>
  );
}

function GlobalBackButtonOverlay() {
  const segments = useSegments();
  const { isDesktop, sidebarWidth } = useLayout();
  const insets = useSafeAreaInsets();

  const first = segments.at(0) as string | undefined;
  const second = segments.at(1) as string | undefined;
  const hasCustomHeader =
    (first === "profile" && second === "qr") ||
    (first === "payment" && second === "wallet") ||
    first === "tickets" ||
    first === "help";
  // These screens render their own BackButton — suppress the global overlay to avoid duplicates
  const hasOwnBackButton =
    first === "events" ||
    first === "settings" ||
    first === "community" ||
    (first === "profile" && second === "edit");
  const hideBackButton =
    !first
    || first === "(tabs)"
    || first === "(onboarding)"
    || first === "landing"
    || hasCustomHeader
    || hasOwnBackButton;

  if (hideBackButton) return null;

  const left = Platform.OS === "web" && isDesktop ? sidebarWidth + 16 : 16;
  const top = (Platform.OS === "web" ? 0 : insets.top) + 10;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top,
        left,
        zIndex: 1200,
      }}
    >
      <BackButton circled />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Responsive web shell — centres content on wide screens, phone frame on small
// ---------------------------------------------------------------------------
function WebShell({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const { isDesktop } = useLayout();

  return (
    <View
      style={[
        webStyles.outerContainer,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {isDesktop ? (
        <>
          <WebSidebar />
          <View style={webStyles.contentContainer}>{children}</View>
        </>
      ) : (
        <View style={webStyles.contentContainer}>{children}</View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Root layout — provider order matters:
//   OnboardingProvider  (outermost — no deps)
//   └── AuthProvider    (can now use useOnboarding via DataSync child)
//       └── DataSync    (syncs auth user → onboarding state)
//       └── SavedProvider / ContactsProvider / ...
// ---------------------------------------------------------------------------
function RootLayoutContent() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    initializeWidgets();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const isWeb = Platform.OS === "web";

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {posthogClient ? (
          <PostHogProvider client={posthogClient}>
            <PersistQueryClientProvider 
              client={queryClient}
              persistOptions={{ persister: queryPersister }}
            >
              <OnboardingProvider>
                <AuthProvider>
                  <SavedProvider>
                    <ContactsProvider>
                      <GestureHandlerRootView
                        style={{ flex: 1 }}
                        onLayout={onLayoutRootView}
                      >
                        {/* Syncs auth user city/country → OnboardingContext */}
                        <DataSync />
                        <AuthGuard />
                        {isWeb ? (
                          <WebShell>
                            <RootLayoutNav />
                          </WebShell>
                        ) : (
                          <KeyboardProvider>
                            <RootLayoutNav />
                          </KeyboardProvider>
                        )}
                        <GlobalBackButtonOverlay />
                      </GestureHandlerRootView>
                    </ContactsProvider>
                  </SavedProvider>
                </AuthProvider>
              </OnboardingProvider>
            </PersistQueryClientProvider>
          </PostHogProvider>
        ) : (
          <PersistQueryClientProvider 
            client={queryClient}
            persistOptions={{ persister: queryPersister }}
          >
            <OnboardingProvider>
              <AuthProvider>
                <SavedProvider>
                  <ContactsProvider>
                    <GestureHandlerRootView
                      style={{ flex: 1 }}
                      onLayout={onLayoutRootView}
                    >
                      {/* Syncs auth user city/country → OnboardingContext */}
                      <DataSync />
                      <AuthGuard />
                      {isWeb ? (
                        <WebShell>
                          <RootLayoutNav />
                        </WebShell>
                      ) : (
                        <KeyboardProvider>
                          <RootLayoutNav />
                        </KeyboardProvider>
                      )}
                      <GlobalBackButtonOverlay />
                    </GestureHandlerRootView>
                  </ContactsProvider>
                </SavedProvider>
              </AuthProvider>
            </OnboardingProvider>
          </PersistQueryClientProvider>
        )}
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const webStyles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    flexDirection: "row",
    overflow: "hidden",
    ...(Platform.OS === "web" && { minHeight: "100vh" as unknown as number }),
  },
  contentContainer: {
    flex: 1,
    minWidth: 0,
  },
});

export default Sentry.wrap(RootLayoutContent);
