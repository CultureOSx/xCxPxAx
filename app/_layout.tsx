import "react-native-reanimated"; // <-- CRUCIAL FIX: Must be at the very top
import { Buffer } from "buffer";

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import Head from "expo-router/head";
import { Stack, useSegments, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { PostHogProvider } from 'posthog-react-native';
import posthogClient, { identifyUser, resetUser } from '@/lib/analytics';
import React, { useCallback, useEffect, useRef } from "react";
import { Ionicons } from '@expo/vector-icons';
import {
  Platform,
  Pressable,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient, queryPersister } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/lib/auth";
import {
  OnboardingProvider,
  useOnboarding,
} from "@/contexts/OnboardingContext";
import { SavedProvider } from "@/contexts/SavedContext";
import { ContactsProvider } from "@/contexts/ContactsContext";
import { LinearGradient } from "expo-linear-gradient";
import { CultureTokens, gradients } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useLayout } from "@/hooks/useLayout";
import { initializeWidgets } from "@/lib/widgets/register";
import { WidgetSync } from "@/components/WidgetSync";
import { WebSidebar } from "@/components/web/WebSidebar";
import { isCultureKeralaHost } from "@/lib/domainHost";
import {
  APP_NAME,
  APP_WEB_DESCRIPTION,
  APP_WEB_KEYWORDS,
  APP_WEB_TITLE,
  APP_WEB_TAGLINE,
  SITE_ORIGIN,
} from "@/lib/app-meta";

import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from "@expo-google-fonts/poppins";
// Web font loader for Expo web is automatically handled by @expo-google-fonts


global.Buffer = Buffer;

// Suppress known noisy warnings that are not actionable.
if (typeof console !== 'undefined') {
  const _warn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    // React Native Web ≥0.19 deprecations (web only)
    if (Platform.OS === 'web') {
      if (msg.includes('props.pointerEvents is deprecated')) return;
      if (msg.includes('"shadow') && msg.includes('style props are deprecated')) return;
    }
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
        // Fallback: If server profile clearly belongs to a returning member but local onboarding was cleared (e.g. logout), mark complete.
        const hasCulture =
          !!(user.culturalIdentity?.nationalityId || (user.culturalIdentity?.cultureIds?.length ?? 0) > 0);
        const profileLooksEstablished =
          !!user.city &&
          !!user.country &&
          (
            (user.interests?.length ?? 0) > 0 ||
            (user.communities?.length ?? 0) > 0 ||
            hasCulture ||
            !!user.lgaCode ||
            !!user.councilId
          );
        if (!state.isComplete && profileLooksEstablished) {
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
  const { state: onboardingState, isLoading: onboardingLoading } = useOnboarding();
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
      (segments[0] === '(tabs)' && (segments[1] === 'profile' || segments[1] === 'perks' || segments[1] === 'calendar' || segments[1] === 'dashboard')) ||
      (segments[0] === 'event' && segments[1] === 'create');

    const inOnboardingGroup = segments[0] === '(onboarding)';
    const currentOnboardingScreen = segments[1] ?? 'index';
    const preAuthScreens = new Set(['index', 'login', 'signup', 'forgot-password']);

    if (!user && isProtected) {
      // Guests hitting a locked screen → route to login
      router.replace('/(onboarding)/login');
    } else if (
      user &&
      !onboardingLoading &&
      inOnboardingGroup &&
      preAuthScreens.has(currentOnboardingScreen)
    ) {
      // Authenticated users should either finish onboarding or return to the app shell.
      // Wait for persisted onboarding to load — default `isComplete: false` would otherwise always send users to location.
      router.replace(onboardingState.isComplete ? '/(tabs)' : '/(onboarding)/location');
    } else if (
      user &&
      !onboardingLoading &&
      inOnboardingGroup &&
      !preAuthScreens.has(currentOnboardingScreen) &&
      onboardingState.isComplete
    ) {
      // DataSync marked the user complete while they were on a mid-flow screen
      // (e.g. /location). This happens when post-login routing races ahead of the
      // first DataSync profile-check. Send them straight to tabs.
      router.replace('/(tabs)');
    }
  }, [user, segments, isRestoring, onboardingLoading, onboardingState.isComplete, router]);

  return null;
}

function AuthSyncBanner() {
  const colors = useColors();
  const { profileSyncStatus, profileSyncMessage, retryProfileSync } = useAuth();

  if (profileSyncStatus !== 'degraded' || !profileSyncMessage) return null;

  return (
    <View style={[bannerStyles.container, { backgroundColor: `${CultureTokens.coral}1F`, borderColor: `${CultureTokens.coral}55` }]}>
      <Ionicons name="warning-outline" size={16} color={CultureTokens.coral} />
      <Text style={[bannerStyles.text, { color: colors.text }]} numberOfLines={2}>
        {profileSyncMessage}
      </Text>
      <Pressable
        style={[bannerStyles.retryButton, { borderColor: `${CultureTokens.coral}AA` }]}
        onPress={() => { retryProfileSync().catch(() => {}); }}
        accessibilityRole="button"
        accessibilityLabel="Retry profile sync"
      >
        <Text style={bannerStyles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
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
      <Stack.Screen name="kerala" />
      <Stack.Screen name="finder" />
      <Stack.Screen name="hub" />
      <Stack.Screen name="hubs" />
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
      <Stack.Screen name="offerings/index" />
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
      <Stack.Screen name="city/[name]" />
      <Stack.Screen name="events" />
      <Stack.Screen name="map" />
      <Stack.Screen name="membership/upgrade" />

      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/location" />
      <Stack.Screen name="settings/appearance" />
      <Stack.Screen name="settings/about" />
      <Stack.Screen name="settings/help" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/privacy" />
      <Stack.Screen name="settings/calendar-sync" />
      <Stack.Screen name="dashboard" />

      <Stack.Screen name="help/index" />
      <Stack.Screen name="legal/terms" />
      <Stack.Screen name="legal/privacy" />
      <Stack.Screen name="legal/cookies" />
      <Stack.Screen name="legal/guidelines" />

      <Stack.Screen name="admin/users" />
      <Stack.Screen name="admin/dashboard/index" />
      <Stack.Screen name="admin/notifications" />
      <Stack.Screen name="admin/audit-logs" />
      <Stack.Screen name="admin/handles" />
      <Stack.Screen name="admin/updates" />
      <Stack.Screen name="admin/import" />
      <Stack.Screen name="admin/moderation" />
      <Stack.Screen name="admin/finance" />
      <Stack.Screen name="admin/platform" />
      <Stack.Screen name="admin/discover" />
      <Stack.Screen name="admin/data-compliance" />
      <Stack.Screen name="admin/shopping" />
      <Stack.Screen name="admin/cockpit" />
      <Stack.Screen name="admin/taxonomy" />

      <Stack.Screen name="updates/index" />
      <Stack.Screen name="updates/[id]" />

      <Stack.Screen name="[handle]" />
    </Stack>
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
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={webStyles.ambientMesh}
        pointerEvents="none"
      />
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
  const colors = useColors();
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    ...Ionicons.font,
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

  const isWeb = Platform.OS === "web";
  const isKeralaDomain = isCultureKeralaHost();

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const appShell = (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
      onLayout={onLayoutRootView}
    >
      <DataSync />
      <WidgetSync />
      <AuthGuard />
      <AuthSyncBanner />
      {isWeb ? (
        <WebShell>
          <RootLayoutNav />
        </WebShell>
      ) : (
        <KeyboardProvider>
          <RootLayoutNav />
        </KeyboardProvider>
      )}
    </GestureHandlerRootView>
  );

  const queryAppTree = (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      <OnboardingProvider>
        <AuthProvider>
          <SavedProvider>
            <ContactsProvider>
              {posthogClient ? (
                <PostHogProvider client={posthogClient}>{appShell}</PostHogProvider>
              ) : (
                appShell
              )}
            </ContactsProvider>
          </SavedProvider>
        </AuthProvider>
      </OnboardingProvider>
    </PersistQueryClientProvider>
  );

  const siteOrigin = isKeralaDomain ? 'https://culturekerala.com' : SITE_ORIGIN;
  const siteUrl = `${siteOrigin}/`;
  const siteTitle = isKeralaDomain
    ? 'CultureKerala — Kerala & Malayalee Communities Worldwide'
    : APP_WEB_TITLE;
  const siteDescription = isKeralaDomain
    ? 'Discover Kerala and Malayalee communities, events, businesses, and culture around the world.'
    : APP_WEB_DESCRIPTION;
  const siteKeywords = isKeralaDomain
    ? 'CultureKerala, Kerala Communities, Malayalee, Malayalam, Kerala Events, Malayali Diaspora'
    : APP_WEB_KEYWORDS;
  const currentPath =
    isWeb && typeof window !== 'undefined' && window.location.pathname
      ? window.location.pathname
      : '/';
  const canonicalUrl = `${siteOrigin}${currentPath}`;
  const keralaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CultureKerala',
    url: 'https://culturekerala.com/',
    description: 'Discover Kerala and Malayalee communities, events, businesses, and culture around the world.',
    inLanguage: ['en', 'ml'],
    keywords: ['Kerala', 'Malayalee', 'Malayalam', 'Kerala events', 'Kerala communities'],
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://culturekerala.com/search?query={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const culturepassJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteOrigin}/#website`,
        name: APP_NAME,
        alternateName: APP_WEB_TAGLINE,
        url: siteUrl,
        description: siteDescription,
        inLanguage: 'en-AU',
        publisher: { '@id': `${siteOrigin}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteOrigin}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${siteOrigin}/#organization`,
        name: APP_NAME,
        url: siteUrl,
        description: siteDescription,
        slogan: APP_WEB_TAGLINE,
      },
    ],
  };

  return (
    <ErrorBoundary>
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <meta name="keywords" content={siteKeywords} />
        <link rel="canonical" href={canonicalUrl} />
        {isKeralaDomain && <meta name="robots" content="index,follow,max-image-preview:large" />}

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:image" content={`${siteUrl.replace(/\/$/, '')}/assets/images/social-preview.png`} />
        <meta property="og:site_name" content={isKeralaDomain ? 'CultureKerala' : APP_NAME} />
        <meta property="og:locale" content={isKeralaDomain ? 'ml_IN' : 'en_AU'} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={siteUrl} />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={`${siteUrl.replace(/\/$/, '')}/assets/images/social-preview.png`} />
        <meta name="application-name" content={isKeralaDomain ? 'CultureKerala' : APP_NAME} />
        <meta name="apple-mobile-web-app-title" content={isKeralaDomain ? 'CultureKerala' : APP_NAME} />
        {isKeralaDomain ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(keralaJsonLd) }}
          />
        ) : (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(culturepassJsonLd) }}
          />
        )}

        <meta name="theme-color" content={colors.background} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      <SafeAreaProvider>{queryAppTree}</SafeAreaProvider>
    </ErrorBoundary>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: CultureTokens.coral,
  },
});

const webStyles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    flexDirection: "row",
    overflow: "hidden",
    ...(Platform.OS === "web" && { minHeight: "100vh" as unknown as number }),
  },
  ambientMesh: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.038,
  },
  contentContainer: {
    flex: 1,
    minWidth: 0,
  },
});

export default RootLayoutContent;
