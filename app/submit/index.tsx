import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Platform,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Switch, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { TextStyles } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from '@/lib/image-manipulator';
import { useRole } from '@/hooks/useRole';
import { AuthGuard } from '@/components/AuthGuard';
import { useLayout } from '@/hooks/useLayout';
import { getPostcodeData, getPostcodesByPlace } from '@shared/location/australian-postcodes';
import {
  ACTIVITY_CATEGORIES,
  BIZ_CATEGORIES,
  CUISINE_OPTIONS,
  EVENT_CATEGORIES,
  EVENT_CULTURE_TAGS,
  LISTING_PLACEHOLDER_IMG,
  MOVIE_GENRES,
  ORG_CATEGORIES,
  ORG_DISCOVERY_TAGS,
  ORG_LISTING_TABS,
  PERK_CATEGORIES,
  PERK_TYPES,
  PROFESSIONAL_CATEGORIES,
  PRICE_RANGE_OPTS,
  PROFILE_TABS,
  SHOP_CATEGORIES,
  TYPE_CONFIG,
  initialForm,
  isEventLike,
  normalizeSubmitType,
  resolveEventCategory,
  type DerivedLocation,
  type FieldErrors,
  type FormState,
  type SubmitType,
} from '@/features/submit/config';
import type { EventData, Profile } from '@/shared/schema';
import {
  creatorListingBlockedHint,
  listingTypesForUser,
} from '@/features/submit/creatorAccess';
import { mapSubmitMutationError } from '@/features/submit/mapSubmitMutationError';
import { Card, Field, SectionLabel } from '@/components/submit/FormPrimitives';

/** Local aside width (submit studio); separate from app sidebar */
const SUBMIT_ASIDE_WIDTH = 288;

type SubmitStudioLayoutProps = {
  isWebDesktop: boolean;
  isDesktop: boolean;
  hPad: number;
  paddingBottom: number;
  aside: React.ReactNode;
  rail: React.ReactNode;
  children: React.ReactNode;
};

function SubmitStudioLayout({
  isWebDesktop,
  isDesktop,
  hPad,
  paddingBottom,
  aside,
  rail,
  children,
}: SubmitStudioLayoutProps) {
  if (isWebDesktop) {
    return (
      <View style={s.splitLayout}>
        {aside}
        <ScrollView
          style={s.splitMainScroll}
          contentContainerStyle={[s.scroll, { paddingBottom }, s.splitMainContent]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          {children}
        </ScrollView>
      </View>
    );
  }
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        s.scroll,
        { paddingBottom },
        isDesktop && s.scrollDesktop,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
    >
      {rail}
      {children}
    </ScrollView>
  );
}

const COMMUNITY_PLATFORM_PILLARS = [
  'Flexibility for different association models',
  'Scalability as membership and programs grow',
  'Tools to build, manage, and engage your community',
] as const;

const ASSOCIATION_PROBLEM_AREAS = [
  {
    title: 'Fragmented member experience',
    icon: 'people-outline' as const,
    points: [
      'Members struggle with multiple accounts and logins across various systems.',
      'Complex onboarding processes deter engagement and participation.',
      'Scattered tools reduce activity and split attention across every platform.',
    ],
  },
  {
    title: 'Administrative inefficiencies',
    icon: 'construct-outline' as const,
    points: [
      'SIG leaders and volunteers lose time navigating and managing too many tools.',
      'Compiling data and analytics across disconnected systems makes success hard to measure.',
      'Managing multiple contracts and vendors adds unnecessary cost and complexity.',
    ],
  },
  {
    title: 'Organizational implications',
    icon: 'analytics-outline' as const,
    points: [
      'Costs and operational overhead increase as systems and vendor relationships multiply.',
      'Programs and services become harder to scale efficiently.',
      'Innovation slows compared with associations using integrated systems.',
      'Leaders have less usable data for long-term planning and decision-making.',
    ],
  },
] as const;

const ASSOCIATION_SOLUTION_AREAS = [
  {
    title: 'One member journey',
    icon: 'person-circle-outline' as const,
    points: [
      'Bring identity, onboarding, communication, events, and participation into one connected experience.',
      'Reduce login friction and make it easier for members to discover where they belong.',
    ],
  },
  {
    title: 'One operational system',
    icon: 'grid-outline' as const,
    points: [
      'Give association teams and volunteer leaders a shared platform instead of a patchwork of tools.',
      'Simplify administration, reporting, and day-to-day community management.',
    ],
  },
  {
    title: 'One scalable foundation',
    icon: 'rocket-outline' as const,
    points: [
      'Use unified data to measure engagement, guide decisions, and support long-term planning.',
      'Launch new programs faster and scale services without multiplying operational complexity.',
    ],
  },
] as const;

const WORKSPACE_STATUS_FILTERS = ['all', 'draft', 'published', 'archived'] as const;

type WorkspaceStatusFilter = (typeof WORKSPACE_STATUS_FILTERS)[number];

type ManagedWorkspaceItem =
  | { kind: 'event'; id: string; title: string; subtitle?: string; status: 'draft' | 'published' | 'archived'; raw: EventData }
  | { kind: 'profile'; id: string; title: string; subtitle?: string; status: 'draft' | 'published' | 'archived'; raw: Profile };

const emptyToUndefined = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isIsoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isAustralianDate = (value: string): boolean => /^\d{2}\/\d{2}\/\d{4}$/.test(value);

const toIsoDate = (value: string): string | null => {
  const trimmed = value.trim();
  if (isIsoDate(trimmed)) return trimmed;
  if (isAustralianDate(trimmed)) {
    const [day, month, year] = trimmed.split('/');
    return `${year}-${month}-${day}`;
  }
  return null;
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SubmitScreen() {
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const { hPad, isDesktop, isWeb } = useLayout();
  const isWebDesktop = isWeb && isDesktop;
  const { isAdmin, isOrganizer } = useRole();
  const { userId } = useAuth();
  const params  = useLocalSearchParams<{ type?: string; variant?: string }>();

  // Pre-select from URL, e.g. /create?type=event&variant=festival (synced in effect after role gates load)
  const [activeTab, setActiveTab]   = useState<SubmitType>(() => {
    const raw = typeof params.type === 'string' ? params.type.trim() : '';
    if (!raw) return normalizeSubmitType(undefined, undefined);
    return normalizeSubmitType(raw, typeof params.variant === 'string' ? params.variant : undefined);
  });
  const [form, setForm]             = useState<FormState>({ ...initialForm });
  const [isFree, setIsFree]         = useState(false);
  const [imageUri, setImageUri]     = useState<string | null>(null);
  const [eventCultureTags, setEventCultureTags] = useState<string[]>([]);
  const [orgDiscoveryTags, setOrgDiscoveryTags] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [imageUploadWarning, setImageUploadWarning] = useState<string | null>(null);
  const [submitted, setSubmitted]   = useState(false);
  const [submittedType, setSubmittedType] = useState<SubmitType>('event');
  const [editingItem, setEditingItem] = useState<ManagedWorkspaceItem | null>(null);
  const [workspaceStatusFilter, setWorkspaceStatusFilter] = useState<WorkspaceStatusFilter>('all');

  const accent = TYPE_CONFIG[activeTab].color;
  const accessFlags = useMemo(() => ({ isAdmin, isOrganizer }), [isAdmin, isOrganizer]);
  const visibleTypes = useMemo(() => listingTypesForUser(accessFlags), [accessFlags]);
  const urlSubmitType = useMemo((): SubmitType | null => {
    const raw = typeof params.type === 'string' ? params.type.trim() : '';
    if (!raw) return null;
    return normalizeSubmitType(raw, typeof params.variant === 'string' ? params.variant : undefined);
  }, [params.type, params.variant]);
  const [accessGateHint, setAccessGateHint] = useState<string | null>(null);

  const myProfilesQuery = useQuery({
    queryKey: ['workspace', 'profiles', userId],
    queryFn: () => api.profiles.my(),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const myEventsQuery = useQuery({
    queryKey: ['workspace', 'events', userId],
    queryFn: () => api.events.list({ organizerId: userId ?? undefined, pageSize: 100, page: 1 }),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const approvedWorkspaceProfiles = useMemo(() => {
    const profiles = myProfilesQuery.data ?? [];
    return profiles.filter((profile) => {
      const entityType = String(profile.entityType ?? '').toLowerCase();
      const category = String(profile.category ?? '').toLowerCase();
      const isEligibleEntity =
        entityType === 'business' ||
        entityType === 'organisation' ||
        (entityType === 'artist');
      const isProfessional = entityType === 'organisation' && category === 'professional';
      return (isEligibleEntity || isProfessional) && profile.handleStatus === 'approved';
    });
  }, [myProfilesQuery.data]);

  const canManageWorkspace = approvedWorkspaceProfiles.length > 0;
  const supportsWorkspaceManagement = isEventLike(activeTab) || ORG_LISTING_TABS.includes(activeTab);

  const set = useCallback((field: keyof FormState, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    setFieldErrors(p => ({ ...p, [field]: undefined }));
  }, []);

  const resetEditor = useCallback(() => {
    setEditingItem(null);
    setForm({ ...initialForm });
    setImageUri(null);
    setEventCultureTags([]);
    setOrgDiscoveryTags([]);
    setFieldErrors({});
    setNetworkError(null);
    setImageUploadWarning(null);
    setIsFree(false);
  }, []);

  const workspaceItems = useMemo(() => {
    const eventItems: ManagedWorkspaceItem[] = isEventLike(activeTab)
      ? (myEventsQuery.data?.events ?? []).map((event) => ({
          kind: 'event',
          id: event.id,
          title: event.title,
          subtitle: [event.date, event.city].filter(Boolean).join(' · '),
          status: event.status === 'cancelled' ? 'archived' : (event.status ?? 'draft'),
          raw: event,
        }))
      : [];

    const profileItems: ManagedWorkspaceItem[] = ORG_LISTING_TABS.includes(activeTab)
      ? (myProfilesQuery.data ?? [])
          .filter((profile) => {
            const entityType = String(profile.entityType ?? '').toLowerCase();
            const category = String(profile.category ?? '').toLowerCase();
            if (activeTab === 'organisation') return entityType === 'organisation' && category !== 'professional';
            if (activeTab === 'business') return entityType === 'business';
            if (activeTab === 'professional') {
              return entityType === 'artist' || (entityType === 'organisation' && category === 'professional');
            }
            return false;
          })
          .map((profile) => ({
            kind: 'profile',
            id: profile.id,
            title: profile.name,
            subtitle: [profile.category, profile.city].filter(Boolean).join(' · '),
            status: profile.status === 'suspended' ? 'archived' : (profile.status ?? 'draft'),
            raw: profile,
          }))
      : [];

    const merged = [...eventItems, ...profileItems];
    if (workspaceStatusFilter === 'all') return merged;
    return merged.filter((item) => item.status === workspaceStatusFilter);
  }, [activeTab, myEventsQuery.data, myProfilesQuery.data, workspaceStatusFilter]);

  // Auto-fill city/state from postcode
  useEffect(() => {
    const pc = parseInt(form.postcode, 10);
    if (form.postcode.length === 4 && !Number.isNaN(pc)) {
      const data = getPostcodeData(pc);
      if (data) {
        setForm(p => ({
          ...p,
          city: p.city || data.place_name,
          state: p.state || data.state_code,
        }));
      }
    }
  }, [form.postcode]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const handleMutationError = (err: unknown) => {
    const { networkBanner, fieldPatch } = mapSubmitMutationError(err);
    setNetworkError(networkBanner);
    if (Object.keys(fieldPatch).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...fieldPatch }));
    }
  };

  const submitEventMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return api.events.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNetworkError(null);
      setImageUploadWarning(null);
      setSubmittedType('event');
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
      setEventCultureTags([]);
      setIsFree(false);
    },
    onError: handleMutationError,
  });

  const submitProfileMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return api.profiles.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNetworkError(null);
      setImageUploadWarning(null);
      setSubmittedType(activeTab);
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
      setOrgDiscoveryTags([]);
    },
    onError: handleMutationError,
  });

  const submitPerkMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await api.perks.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/perks'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNetworkError(null);
      setImageUploadWarning(null);
      setSubmittedType('perk');
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
    },
    onError: handleMutationError,
  });

  const submitActivityMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.activities.create>[0]) => api.activities.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNetworkError(null);
      setImageUploadWarning(null);
      setSubmittedType('activity');
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
    },
    onError: handleMutationError,
  });

  const submitRestaurantMutation = useMutation({
    mutationFn: (data: import('@shared/schema').RestaurantInput) => api.restaurants.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNetworkError(null);
      setImageUploadWarning(null);
      setSubmittedType('restaurant');
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
    },
    onError: handleMutationError,
  });

  const submitShopMutation = useMutation({
    mutationFn: (data: import('@shared/schema').ShopInput) => api.shopping.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNetworkError(null);
      setImageUploadWarning(null);
      setSubmittedType('shop');
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
    },
    onError: handleMutationError,
  });

  const submitMovieMutation = useMutation({
    mutationFn: (data: import('@shared/schema').MovieInput) => api.movies.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/movies'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNetworkError(null);
      setImageUploadWarning(null);
      setSubmittedType('movie');
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
    },
    onError: handleMutationError,
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EventData> }) => api.events.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', 'events', userId] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNetworkError(null);
      setImageUploadWarning(null);
      resetEditor();
    },
    onError: handleMutationError,
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.profiles.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', 'profiles', userId] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNetworkError(null);
      setImageUploadWarning(null);
      resetEditor();
    },
    onError: handleMutationError,
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (item: ManagedWorkspaceItem) => {
      if (item.kind === 'event') return api.events.remove(item.id);
      return api.profiles.remove(item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', 'events', userId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', 'profiles', userId] });
      resetEditor();
    },
    onError: handleMutationError,
  });

  const archiveWorkspaceMutation = useMutation({
    mutationFn: async (item: ManagedWorkspaceItem) => {
      if (item.kind === 'event') return api.events.update(item.id, { status: 'cancelled' });
      return api.profiles.update(item.id, { status: 'suspended' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', 'events', userId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', 'profiles', userId] });
      resetEditor();
    },
    onError: handleMutationError,
  });

  const isPending =
    submitEventMutation.isPending ||
    updateEventMutation.isPending ||
    submitProfileMutation.isPending ||
    updateProfileMutation.isPending ||
    submitPerkMutation.isPending ||
    submitActivityMutation.isPending ||
    submitRestaurantMutation.isPending ||
    submitShopMutation.isPending ||
    submitMovieMutation.isPending ||
    deleteWorkspaceMutation.isPending ||
    archiveWorkspaceMutation.isPending;

  // ── Image upload ───────────────────────────────────────────────────────────

  const pickCoverFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]?.uri) setImageUri(result.assets[0].uri);
  };

  const pickCoverFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]?.uri) setImageUri(result.assets[0].uri);
  };

  const openCoverImagePicker = () => {
    if (Platform.OS === 'web') {
      void pickCoverFromLibrary();
      return;
    }
    Alert.alert('Add cover image', 'Take a new photo or choose from your library.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Photo library', onPress: () => void pickCoverFromLibrary() },
      { text: 'Take photo', onPress: () => void pickCoverFromCamera() },
    ]);
  };

  /**
   * Attempts to upload the selected cover image.
   * Returns the public URL on success, or null on failure.
   * On failure, sets `imageUploadWarning` so the caller can continue
   * submission with a placeholder instead of blocking the user.
   *
   * Upload strategy (web):
   *   1. Firebase Storage SDK direct upload (works if storage rules deployed + CORS allowed)
   *   2. Cloud Functions multipart via native window.fetch (reliable multipart on web)
   *
   * Upload strategy (native):
   *   Cloud Functions multipart via api.uploads.image (global fetch + RN FormData).
   */
  const uploadCoverIfNeeded = async (): Promise<string | null> => {
    if (!imageUri) return null;
    setImageUploadWarning(null);
    const apiBase = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/?$/, '/');

    try {
      const processed = await manipulateAsync(imageUri, [{ resize: { width: 1600 } }], { compress: 0.9, format: SaveFormat.JPEG });
      const blobRes =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? await window.fetch(processed.uri)
          : await fetch(processed.uri);
      const blob = await blobRes.blob();

      const uid = auth?.currentUser?.uid ?? userId ?? null;

      if (Platform.OS === 'web') {
        if (uid && storage) {
          try {
            const storageFolder = isEventLike(activeTab) ? `events/${uid}` : `listings/${uid}`;
            const objectPath = `${storageFolder}/submit-cover-${Date.now()}.jpg`;
            const storageRef = ref(storage, objectPath);
            await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
            return await getDownloadURL(storageRef);
          } catch (storageErr) {
            if (__DEV__) console.warn('[upload] Storage SDK failed, trying API', storageErr);
          }
        }

        try {
          if (typeof window !== 'undefined' && window.fetch && apiBase) {
            const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
            const fd = new FormData();
            fd.append('image', blob, 'upload.jpg');
            const resp = await window.fetch(`${apiBase}uploads/image`, {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: fd,
            });
            if (resp.ok) {
              const json = (await resp.json()) as { imageUrl: string };
              if (json.imageUrl) return json.imageUrl;
            }
            if (__DEV__) {
              const errBody = await resp.text().catch(() => '');
              console.warn('[upload] API uploads/image', resp.status, errBody.slice(0, 200));
            }
          }
        } catch (apiFetchErr) {
          if (__DEV__) console.warn('[upload] API via window.fetch failed', apiFetchErr);
        }
      } else {
        try {
          const formData = new FormData();
          formData.append('image', blob as unknown as Blob, 'upload.jpg');
          const uploaded = await api.uploads.image(formData);
          return uploaded.imageUrl;
        } catch (nativeErr) {
          if (__DEV__) console.warn('[upload] Native API upload failed', nativeErr);
        }
      }
    } catch (err) {
      if (__DEV__) console.warn('[uploadCoverIfNeeded] image processing failed', err);
    }

    setImageUploadWarning(
      'Cover photo could not be uploaded (often: Storage CORS on localhost, or Functions not running). Your listing will still submit — add a photo later from your dashboard.',
    );
    return null;
  };

  // ── Validation + submit ────────────────────────────────────────────────────

  const deriveLocation = (): DerivedLocation | null => {
    const city     = form.city.trim();
    const state    = form.state.trim().toUpperCase();
    const country  = form.country.trim() || 'Australia';
    const postcode = parseInt(form.postcode.trim(), 10);
    const errors: FieldErrors = {};
    if (!city)              errors.city     = 'City is required';
    if (!state)             errors.state    = 'State is required';
    if (!form.postcode.trim()) errors.postcode = 'Postcode is required';
    else if (Number.isNaN(postcode)) errors.postcode = 'Invalid postcode';
    if (Object.keys(errors).length) { setFieldErrors(p => ({ ...p, ...errors })); return null; }
    const byPostcode = getPostcodeData(postcode);
    if (!byPostcode) { setFieldErrors(p => ({ ...p, postcode: 'Invalid Australian postcode' })); return null; }
    const cityMatch = getPostcodesByPlace(city).find(e => e.state_code.toUpperCase() === state);
    const resolved  = cityMatch ?? byPostcode;
    return { city: resolved.place_name, state: resolved.state_code, country, postcode: resolved.postcode, latitude: resolved.latitude, longitude: resolved.longitude };
  };

  const handleEditWorkspaceItem = (item: ManagedWorkspaceItem) => {
    setEditingItem(item);
    setFieldErrors({});
    setNetworkError(null);
    setImageUploadWarning(null);
    setWorkspaceStatusFilter('all');

    if (item.kind === 'event') {
      const event = item.raw as EventData & { postcode?: number; contactEmail?: string };
      setForm({
        ...initialForm,
        name: event.title ?? '',
        description: event.description ?? '',
        city: event.city ?? '',
        state: event.state ?? '',
        postcode: event.postcode ? String(event.postcode) : '',
        country: event.country ?? 'Australia',
        contactEmail: event.contactEmail ?? '',
        category: event.category ?? '',
        date: event.date ? (() => {
          const iso = event.date.trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
            const [year, month, day] = iso.split('-');
            return `${day}/${month}/${year}`;
          }
          return event.date;
        })() : '',
        time: event.time ?? '',
        venue: event.venue ?? '',
        address: event.address ?? '',
        price: event.priceCents != null ? String(event.priceCents / 100) : '',
        capacity: event.capacity != null ? String(event.capacity) : '',
        externalTicketUrl: event.externalTicketUrl ?? '',
        communityId: event.communityId ?? '',
        hostName: event.hostName ?? '',
        hostEmail: event.hostEmail ?? '',
        hostPhone: event.hostPhone ?? '',
        sponsors: event.sponsors ?? '',
      });
      setImageUri(event.heroImageUrl ?? event.imageUrl ?? null);
      setEventCultureTags(event.cultureTag ?? []);
      setIsFree(Boolean(event.isFree || (event.priceCents ?? 0) <= 0));
      return;
    }

    const profile = item.raw as Profile & { twitter?: string; linkedin?: string };
    setForm({
      ...initialForm,
      name: profile.name ?? '',
      description: profile.description ?? '',
      city: profile.city ?? '',
      country: profile.country ?? 'Australia',
      category: profile.category ?? '',
      contactEmail: profile.contactEmail ?? profile.email ?? '',
      phone: profile.phone ?? '',
      website: profile.website ?? '',
      profileTags: (profile.tags ?? []).join(', '),
      instagram: profile.instagram ?? '',
      facebook: profile.facebook ?? '',
      youtube: profile.youtube ?? '',
      twitterX: profile.twitter ?? '',
      linkedin: profile.linkedin ?? '',
      address: profile.address ?? '',
    });
    setImageUri(profile.imageUrl ?? null);
    setOrgDiscoveryTags([]);
    setIsFree(false);
  };

  const confirmDeleteWorkspaceItem = (item: ManagedWorkspaceItem) => {
    Alert.alert(
      'Delete listing',
      `Delete "${item.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWorkspaceMutation.mutate(item),
        },
      ],
    );
  };

  const confirmArchiveWorkspaceItem = (item: ManagedWorkspaceItem) => {
    Alert.alert(
      'Archive listing',
      `Archive "${item.title}"? You can keep it out of the published view without deleting it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: () => archiveWorkspaceMutation.mutate(item),
        },
      ],
    );
  };

  const handleSubmit = async () => {
    if (!visibleTypes.includes(activeTab)) {
      setNetworkError('This listing type is not available for your account.');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const errors: FieldErrors = {};
    const nameLabel =
      isEventLike(activeTab) ? 'Event title is required'
        : activeTab === 'movie' ? 'Film title is required'
        : activeTab === 'perk' ? 'Perk title is required'
        : 'Name is required';
    if (!form.name.trim()) errors.name = nameLabel;
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) errors.contactEmail = 'Invalid email address';
    if (form.website && !/^https?:\/\/.+/.test(form.website)) errors.website = 'Must start with https://';
    if (PROFILE_TABS.includes(activeTab) && !form.contactEmail.trim()) errors.contactEmail = 'Contact email is required';
    if ((isEventLike(activeTab) || activeTab === 'movie') && form.date.trim() && !toIsoDate(form.date.trim())) {
      errors.date = 'Date must be DD/MM/YYYY';
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const normalizedDate = toIsoDate(form.date);

    if (isEventLike(activeTab)) {
      if (!normalizedDate) { setFieldErrors(p => ({ ...p, date: 'Date is required (DD/MM/YYYY)' })); return; }
      const location = deriveLocation();
      if (!location) return;
      let imageUrl: string | undefined;
      let heroImageUrl: string | undefined;
      if (imageUri) {
        const url = await uploadCoverIfNeeded();
        if (url) {
          imageUrl = url;
          heroImageUrl = url;
        } else {
          imageUrl = LISTING_PLACEHOLDER_IMG;
          heroImageUrl = LISTING_PLACEHOLDER_IMG;
        }
      }
      const eventPayload = {
        title:       form.name.trim(),
        description: emptyToUndefined(form.description),
        date:        normalizedDate,
        time:        emptyToUndefined(form.time),
        venue:       emptyToUndefined(form.venue),
        address:     emptyToUndefined(form.address),
        city:        location.city,
        state:       location.state,
        postcode:    location.postcode,
        country:     location.country,
        latitude:    location.latitude,
        longitude:   location.longitude,
        category:    resolveEventCategory(activeTab, form.category.trim()),
        contactEmail: emptyToUndefined(form.contactEmail),
        priceCents:  isFree ? 0 : (form.price.trim() ? Math.round(Number(form.price.trim()) * 100) : 0),
        isFree:      isFree || !form.price.trim() || Number(form.price.trim()) <= 0,
        capacity:    form.capacity.trim() ? Number(form.capacity.trim()) : undefined,
        externalTicketUrl: emptyToUndefined(form.externalTicketUrl),
        communityId: emptyToUndefined(form.communityId),
        hostName:    emptyToUndefined(form.hostName),
        hostEmail:   emptyToUndefined(form.hostEmail),
        hostPhone:   emptyToUndefined(form.hostPhone),
        sponsors:    emptyToUndefined(form.sponsors),
        cultureTag:  eventCultureTags.length > 0 ? eventCultureTags : undefined,
        imageUrl,
        heroImageUrl,
      };
      if (editingItem?.kind === 'event') {
        updateEventMutation.mutate({ id: editingItem.id, data: eventPayload });
      } else {
        submitEventMutation.mutate(eventPayload);
      }
    } else if (activeTab === 'perk') {
      if (!form.perkType) { setFieldErrors(p => ({ ...p, perkType: 'Please select a perk type' })); return; }
      const discountVal = parseInt(form.discountValue || '0', 10);
      submitPerkMutation.mutate({
        title:        form.name.trim(),
        description:  form.description.trim() || null,
        perkType:     form.perkType,
        discountPercent: form.perkType === 'discount_percent' ? discountVal : null,
        discountFixedCents: (form.perkType === 'discount_fixed' || form.perkType === 'cashback') ? discountVal * 100 : null,
        providerName: form.providerName.trim() || null,
        providerType: 'sponsor',
        category:     form.perkCategory || null,
        isMembershipRequired: false,
        status: 'active',
      });
    } else if (activeTab === 'activity') {
      const location = deriveLocation();
      if (!location) return;
      let imageUrl: string | undefined;
      if (imageUri) {
        const url = await uploadCoverIfNeeded();
        imageUrl = url ?? LISTING_PLACEHOLDER_IMG;
      }
      submitActivityMutation.mutate({
        name: form.name.trim(),
        description: form.description.trim() || '—',
        category: form.category || 'Experience',
        city: location.city,
        country: location.country,
        state: location.state,
        postcode: location.postcode,
        latitude: location.latitude,
        longitude: location.longitude,
        location: form.venue.trim() || form.address.trim() || undefined,
        imageUrl,
        status: 'published',
      });
    } else if (activeTab === 'restaurant') {
      if (!form.address.trim()) { setFieldErrors(p => ({ ...p, address: 'Street address is required' })); return; }
      const location = deriveLocation();
      if (!location) return;
      let imageUrl = LISTING_PLACEHOLDER_IMG;
      if (imageUri) {
        const url = await uploadCoverIfNeeded();
        if (url) imageUrl = url;
      }
      submitRestaurantMutation.mutate({
        name: form.name.trim(),
        cuisine: form.category || 'General',
        priceRange: (form.priceRange || '$$') as (typeof PRICE_RANGE_OPTS)[number],
        description: form.description.trim() || '—',
        imageUrl,
        address: form.address.trim(),
        city: location.city,
        country: location.country,
        rating: 0,
        reviewsCount: 0,
        isOpen: true,
        isPromoted: false,
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined,
        deals: [],
        reservationAvailable: false,
        deliveryAvailable: false,
      });
    } else if (activeTab === 'shop') {
      if (!form.address.trim()) { setFieldErrors(p => ({ ...p, address: 'Street address is required' })); return; }
      const location = deriveLocation();
      if (!location) return;
      let imageUrl = LISTING_PLACEHOLDER_IMG;
      if (imageUri) {
        const url = await uploadCoverIfNeeded();
        if (url) imageUrl = url;
      }
      submitShopMutation.mutate({
        name: form.name.trim(),
        category: form.category || 'General',
        description: form.description.trim() || '—',
        imageUrl,
        address: form.address.trim(),
        city: location.city,
        country: location.country,
        isOpen: true,
        isPromoted: false,
        deliveryAvailable: false,
        rating: 0,
        reviewsCount: 0,
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined,
        deals: [],
      });
    } else if (activeTab === 'movie') {
      if (!normalizedDate) { setFieldErrors(p => ({ ...p, date: 'Release date is required (DD/MM/YYYY)' })); return; }
      const location = deriveLocation();
      if (!location) return;
      let posterUrl = LISTING_PLACEHOLDER_IMG;
      if (imageUri) {
        const url = await uploadCoverIfNeeded();
        if (url) posterUrl = url;
      }
      submitMovieMutation.mutate({
        title: form.name.trim(),
        description: form.description.trim() || '—',
        language: form.language.trim() || 'English',
        duration: form.runtime.trim() || '2h',
        rating: form.movieRating.trim() || 'M',
        posterUrl,
        releaseDate: normalizedDate,
        genre: form.category ? [form.category] : ['Drama'],
        cast: [],
        director: form.director.trim() || '—',
        showtimes: [],
        imdbScore: 0,
        isPromoted: false,
        city: location.city,
        country: location.country,
      });
    } else if (ORG_LISTING_TABS.includes(activeTab)) {
      const location = deriveLocation();
      if (!location) return;
      let imageUrl: string | undefined;
      if (imageUri) {
        const url = await uploadCoverIfNeeded();
        if (url) imageUrl = url;
      }
      const tags = [
        ...orgDiscoveryTags,
        ...form.profileTags.split(',').map((t) => t.trim()).filter(Boolean),
      ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 20);
      const instagramHandle = emptyToUndefined(form.instagram)?.replace(/^@/, '');
      const facebookHandle = emptyToUndefined(form.facebook);
      const youtubeHandle = emptyToUndefined(form.youtube)?.replace(/^@/, '');
      const twitterHandle = emptyToUndefined(form.twitterX)?.replace(/^@/, '');
      const linkedinHandle = emptyToUndefined(form.linkedin)?.replace(/^@/, '');
      const airpalHandle = emptyToUndefined(form.airpal)?.replace(/^@/, '');
      const profilePayload = {
        entityType: activeTab === 'professional' ? 'organisation' : activeTab,
        name:         form.name.trim(),
        description:  emptyToUndefined(form.description),
        city:         location.city,
        state:        location.state,
        postcode:     location.postcode,
        country:      location.country,
        latitude:     location.latitude,
        longitude:    location.longitude,
        contactEmail: emptyToUndefined(form.contactEmail),
        phone:        emptyToUndefined(form.phone),
        website:      emptyToUndefined(form.website),
        category:     activeTab === 'professional' ? 'Professional' : emptyToUndefined(form.category),
        imageUrl,
        tags:         tags.length > 0 ? tags : undefined,
        instagram:    instagramHandle ? `https://instagram.com/${instagramHandle}` : undefined,
        facebook:     facebookHandle ? `https://facebook.com/${facebookHandle}` : undefined,
        youtube:      youtubeHandle ? `https://youtube.com/@${youtubeHandle}` : undefined,
        twitterX:     twitterHandle ? `https://x.com/${twitterHandle}` : undefined,
        linkedin:     linkedinHandle ? `https://linkedin.com/in/${linkedinHandle}` : undefined,
        airpal:       airpalHandle ? `https://airpal.me/@${airpalHandle}` : undefined,
      };
      if (editingItem?.kind === 'profile') {
        updateProfileMutation.mutate({
          id: editingItem.id,
          data: profilePayload,
        });
      } else {
        submitProfileMutation.mutate(profilePayload);
      }
    }
  };

  const getCategoryOptions = (): string[] => {
    if (isEventLike(activeTab)) return EVENT_CATEGORIES;
    if (activeTab === 'organisation') return ORG_CATEGORIES;
    if (activeTab === 'professional') return [...PROFESSIONAL_CATEGORIES];
    if (activeTab === 'business') return BIZ_CATEGORIES;
    if (activeTab === 'activity') return ACTIVITY_CATEGORIES;
    if (activeTab === 'restaurant') return CUISINE_OPTIONS;
    if (activeTab === 'shop') return SHOP_CATEGORIES;
    if (activeTab === 'movie') return MOVIE_GENRES;
    return [];
  };

  const getCategorySectionLabel = (): string => {
    if (activeTab === 'professional') return 'Professional category';
    if (activeTab === 'restaurant') return 'Cuisine';
    if (activeTab === 'movie') return 'Genre';
    return 'Category';
  };

  const handleSelectType = useCallback((type: SubmitType) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setActiveTab(type);
    setEditingItem(null);
    setWorkspaceStatusFilter('all');
    const next = { ...initialForm };
    if (type === 'festival') next.category = 'Festival';
    else if (type === 'concert') next.category = 'Music';
    else if (type === 'workshop') next.category = 'Workshop';
    else if (type === 'professional') next.category = 'Artist';
    setForm(next);
    setImageUri(null);
    setEventCultureTags([]);
    setOrgDiscoveryTags([]);
    setFieldErrors({});
    setNetworkError(null);
    setImageUploadWarning(null);
    setIsFree(false);
  }, []);

  // Deep-linked type from URL (do not depend on activeTab — user may switch type while keeping the same URL)
  useEffect(() => {
    if (urlSubmitType == null) return;
    const blocked = creatorListingBlockedHint(urlSubmitType, accessFlags);
    setAccessGateHint(blocked);
    if (blocked) {
      handleSelectType(visibleTypes[0] ?? 'organisation');
      return;
    }
    handleSelectType(urlSubmitType);
  }, [urlSubmitType, accessFlags, visibleTypes, handleSelectType]);

  // No type in URL: clear gate; if role gates hide the current tab (e.g. default event for a plain user), snap to a valid type
  useEffect(() => {
    if (urlSubmitType != null) return;
    setAccessGateHint(null);
    if (!visibleTypes.includes(activeTab)) {
      const preferred =
        visibleTypes.find((t) => t === 'event') ??
        visibleTypes[0] ??
        'organisation';
      handleSelectType(preferred);
    }
  }, [urlSubmitType, visibleTypes, handleSelectType, activeTab]);

  const headerGradientStops = useMemo(() => {
    if (Platform.OS === 'web' && isDesktop) {
      return {
        colors: ['#070712', '#0E1424', accent + '38', '#0A0A12'] as const,
        locations: [0, 0.28, 0.58, 1] as const,
      };
    }
    return {
      colors: ['#050508', accent + '48', '#0B0B14'] as const,
      locations: [0, 0.45, 1] as const,
    };
  }, [accent, isDesktop]);

  // ── Success screen ─────────────────────────────────────────────────────────

  if (submitted) {
    const conf = TYPE_CONFIG[submittedType];
    return (
      <View style={[s.successRoot, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <LinearGradient colors={[conf.color + '20', 'transparent']} style={StyleSheet.absoluteFillObject} />
        <View style={[s.successCard, { backgroundColor: colors.surface, borderColor: conf.color + '30' }]}>
          {/* Outer ring */}
          <View style={[s.successIconRing, { borderColor: conf.color + '30' }]}>
            <View style={[s.successIconWrap, { backgroundColor: conf.color + '15' }]}>
              <Ionicons name={conf.icon as keyof typeof Ionicons.glyphMap} size={40} color={conf.color} />
            </View>
          </View>
          <View style={[s.successCheckCircle, { backgroundColor: conf.color }]}>
            <Ionicons name="checkmark" size={14} color="#fff" />
          </View>
          <Text style={[s.successTitle, { color: colors.text }]}>
            {isEventLike(submittedType)
              ? 'Event Submitted!'
              : submittedType === 'perk'
                ? 'Perk Created!'
                : `${TYPE_CONFIG[submittedType].label} submitted!`}
          </Text>
            <Text style={[s.successSub, { color: colors.textSecondary }]}>
            {submittedType === 'perk'
              ? 'Your perk is now active and available to members.'
              : submittedType === 'activity'
                ? 'Your activity is published. You can edit it later from the activities tool if needed.'
                : "Your listing is created and sent for review within 2\u20133 business days. You'll receive an email once approved."}
          </Text>
          <Pressable
            style={[s.successBtn, { backgroundColor: conf.color }]}
            onPress={() => setSubmitted(false)}
            accessibilityRole="button"
            accessibilityLabel="Create another"
          >
            <Text style={s.successBtnText}>Create Another</Text>
          </Pressable>
          <Pressable
            style={[s.successBtnOutline, { borderColor: conf.color + '50' }]}
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="Go to Discover"
          >
            <Text style={[s.successBtnOutlineText, { color: conf.color }]}>Go to Discover</Text>
          </Pressable>
          <Text style={[s.successTagline, { color: colors.textTertiary }]}>Powered by CulturePass ✦</Text>
        </View>
      </View>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────

  return (
    <AuthGuard icon="add-circle-outline" title="Workspace" message="Sign in to access your Workspace for events, organisations, and more.">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 8 : 0}
      >
        <View style={[s.root, { flex: 1, backgroundColor: colors.background, paddingTop: insets.top }]}>

          {/* ── Header with gradient backdrop ── */}
          <LinearGradient
            colors={[...headerGradientStops.colors]}
            locations={[...headerGradientStops.locations]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[s.headerGradient, { paddingHorizontal: hPad, borderBottomColor: colors.border }]}
          >
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
              style={s.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Workspace</Text>
              <Text style={[s.headerSub, { color: accent }]}>{TYPE_CONFIG[activeTab].description}</Text>
            </View>
            <View style={[s.headerTypeBadge, { backgroundColor: accent + '22', borderColor: accent + '50' }]}>
              <Ionicons name={TYPE_CONFIG[activeTab].icon as keyof typeof Ionicons.glyphMap} size={14} color={accent} />
            </View>
          </LinearGradient>

          <SubmitStudioLayout
            isWebDesktop={isWebDesktop}
            isDesktop={isDesktop}
            hPad={hPad}
            paddingBottom={insets.bottom + 48}
            aside={(
              <ScrollView
                style={[
                  s.listingAside,
                  {
                    width: SUBMIT_ASIDE_WIDTH,
                    borderRightColor: colors.border,
                    backgroundColor: colors.surfaceSecondary,
                  },
                  Platform.select({
                    web: {
                      position: 'sticky',
                      top: 0,
                      alignSelf: 'flex-start',
                      maxHeight: 'calc(100vh - 88px)',
                    } as object,
                    default: {},
                  }),
                ]}
                contentContainerStyle={s.listingAsideContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[s.asideOverline, { color: colors.textSecondary }]}>Workspace</Text>
                <Text style={[s.asideTitle, { color: colors.text }]}>Listing type</Text>
                <Text style={[s.asideSubtitle, { color: colors.textSecondary }]}>
                  Choose a category to load the correct fields for your listing.
                </Text>
                <View style={{ height: 20 }} />
                {visibleTypes.map((type) => {
                  const conf = TYPE_CONFIG[type];
                  const isActive = activeTab === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => handleSelectType(type)}
                      style={[
                        s.asideRow,
                        {
                          backgroundColor: isActive ? colors.surface : colors.background,
                          borderColor: isActive ? conf.color + '99' : colors.border,
                          borderLeftWidth: isActive ? 4 : 1,
                          borderLeftColor: isActive ? conf.color : colors.border,
                        },
                        Platform.select({
                          web: { cursor: 'pointer' } as object,
                          default: {},
                        }),
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={conf.label}
                    >
                      <View
                        style={[
                          s.asideIconWrap,
                          { backgroundColor: isActive ? conf.color + '32' : conf.color + '1C' },
                        ]}
                      >
                        <Ionicons
                          name={conf.icon as keyof typeof Ionicons.glyphMap}
                          size={20}
                          color={conf.color}
                        />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[s.asideRowTitle, { color: colors.text }]} numberOfLines={1}>
                          {conf.label}
                        </Text>
                        <Text
                          style={[s.asideRowDesc, { color: colors.textSecondary }]}
                          numberOfLines={2}
                        >
                          {conf.description}
                        </Text>
                      </View>
                      {isActive ? (
                        <Ionicons name="checkmark-circle" size={22} color={conf.color} />
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            rail={(
              <View style={s.typeSection}>
                <View style={[s.railHeader, { paddingHorizontal: hPad }]}>
                  <Text style={[s.railTitle, { color: colors.text }]}>Choose listing type</Text>
                  <Text style={[s.railHint, { color: colors.textSecondary }]}>
                    {Platform.OS !== 'web' ? 'Swipe for more · ' : ''}
                    Each type uses its own fields and review path.
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[s.typeRailScroll, { paddingHorizontal: hPad }]}
                  decelerationRate="fast"
                  {...(Platform.OS === 'ios'
                    ? { snapToInterval: 164, snapToAlignment: 'start' as const }
                    : {})}
                  keyboardShouldPersistTaps="handled"
                >
                  {visibleTypes.map((type) => {
                    const conf = TYPE_CONFIG[type];
                    const isActive = activeTab === type;
                    return (
                      <Pressable
                        key={type}
                        style={[
                          s.typeCardPremium,
                          {
                            borderColor: isActive ? conf.color : colors.border,
                            backgroundColor: isActive ? colors.surface : colors.surfaceSecondary,
                            ...(isActive
                              ? Platform.select({
                                  web: { boxShadow: `0 10px 32px ${conf.color}40` } as object,
                                  default: {
                                    shadowColor: conf.color,
                                    shadowOpacity: 0.38,
                                    shadowRadius: 14,
                                    shadowOffset: { width: 0, height: 6 },
                                    elevation: 8,
                                  },
                                })
                              : Platform.select({
                                  web: { boxShadow: '0 2px 14px rgba(0,0,0,0.12)' } as object,
                                  default: {
                                    shadowColor: '#000',
                                    shadowOpacity: 0.16,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 4 },
                                    elevation: 3,
                                  },
                                })),
                          },
                          Platform.select({ web: { cursor: 'pointer' } as object, default: {} }),
                        ]}
                        onPress={() => handleSelectType(type)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                        accessibilityLabel={conf.label}
                      >
                        {isActive ? (
                          <LinearGradient
                            colors={[conf.color + '33', conf.color + '08']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
                          />
                        ) : null}
                        <View
                          style={[
                            s.typeCardIconPremium,
                            { backgroundColor: isActive ? conf.color + '38' : conf.color + '24' },
                          ]}
                        >
                          <Ionicons
                            name={conf.icon as keyof typeof Ionicons.glyphMap}
                            size={22}
                            color={conf.color}
                          />
                        </View>
                        <Text style={[s.typeCardLabelPremium, { color: colors.text }]}>
                          {conf.label}
                        </Text>
                        <Text
                          style={[s.typeCardDescPremium, { color: colors.textSecondary }]}
                          numberOfLines={2}
                        >
                          {conf.description}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          >
            <>
            {accessGateHint ? (
              <View style={[s.notice, { backgroundColor: colors.surface, marginHorizontal: hPad }]}>
                <View style={[s.noticeStrip, { backgroundColor: colors.warning }]} />
                <Ionicons name="shield-outline" size={18} color={colors.warning} style={{ marginLeft: 12 }} />
                <Text style={[s.noticeText, { color: colors.textSecondary }]}>{accessGateHint}</Text>
              </View>
            ) : null}

            {activeTab === 'organisation' ? (
              <>
                <View
                  style={[
                    s.associationHero,
                    {
                      marginHorizontal: hPad,
                      backgroundColor: colors.surface,
                      borderColor: accent + '36',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[accent + '1f', accent + '08', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={[s.associationBadge, { backgroundColor: accent + '14', borderColor: accent + '30' }]}>
                    <Ionicons name="people-circle-outline" size={13} color={accent} />
                    <Text style={[s.associationBadgeText, { color: accent }]}>ASSOCIATION COMMUNITY PLATFORM</Text>
                  </View>
                  <Text style={[s.associationTitle, { color: colors.text }]}>
                    Empower Your Association with CulturePass
                  </Text>
                  <Text style={[s.associationBody, { color: colors.textSecondary }]}>
                    CulturePass offers a full-stack online community platform designed for flexibility and scalability,
                    empowering associations to build, manage, and engage vibrant communities with ease.
                  </Text>
                  <View style={s.associationPillars}>
                    {COMMUNITY_PLATFORM_PILLARS.map((pillar) => (
                      <View
                        key={pillar}
                        style={[
                          s.associationPillar,
                          {
                            backgroundColor: colors.surfaceSecondary,
                            borderColor: colors.borderLight,
                          },
                        ]}
                      >
                        <Ionicons name="checkmark-circle" size={14} color={accent} />
                        <Text style={[s.associationPillarText, { color: colors.textSecondary }]}>{pillar}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View
                  style={[
                    s.problemCard,
                    {
                      marginHorizontal: hPad,
                      backgroundColor: colors.surface,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <Text style={[s.problemEyebrow, { color: accent }]}>The Problem</Text>
                  <Text style={[s.problemTitle, { color: colors.text }]}>
                    Fragmented tech, fragmented community
                  </Text>
                  <Text style={[s.problemIntro, { color: colors.textSecondary }]}>
                    The true cost of using multiple disparate technologies to run your association&apos;s community.
                  </Text>

                  <View style={s.problemGrid}>
                    {ASSOCIATION_PROBLEM_AREAS.map((area) => (
                      <View
                        key={area.title}
                        style={[
                          s.problemPanel,
                          {
                            backgroundColor: colors.surfaceSecondary,
                            borderColor: colors.borderLight,
                          },
                        ]}
                      >
                        <View style={[s.problemPanelIcon, { backgroundColor: accent + '14' }]}>
                          <Ionicons name={area.icon} size={16} color={accent} />
                        </View>
                        <Text style={[s.problemPanelTitle, { color: colors.text }]}>{area.title}</Text>
                        {area.points.map((point) => (
                          <View key={point} style={s.problemPointRow}>
                            <Ionicons name="remove" size={14} color={colors.textTertiary} />
                            <Text style={[s.problemPointText, { color: colors.textSecondary }]}>{point}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </View>

                <View
                  style={[
                    s.solutionCard,
                    {
                      marginHorizontal: hPad,
                      backgroundColor: colors.surface,
                      borderColor: accent + '30',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[accent + '18', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={[s.solutionEyebrow, { color: accent }]}>The Solution</Text>
                  <Text style={[s.solutionTitle, { color: colors.text }]}>
                    One integrated platform for association growth
                  </Text>
                  <Text style={[s.solutionIntro, { color: colors.textSecondary }]}>
                    CulturePass brings community infrastructure into a single system so your association can
                    build, manage, and grow member engagement without the drag of fragmented tools.
                  </Text>

                  <View style={s.solutionGrid}>
                    {ASSOCIATION_SOLUTION_AREAS.map((area) => (
                      <View
                        key={area.title}
                        style={[
                          s.solutionPanel,
                          {
                            backgroundColor: colors.surfaceSecondary,
                            borderColor: colors.borderLight,
                          },
                        ]}
                      >
                        <View style={[s.solutionPanelIcon, { backgroundColor: accent + '14' }]}>
                          <Ionicons name={area.icon} size={16} color={accent} />
                        </View>
                        <Text style={[s.solutionPanelTitle, { color: colors.text }]}>{area.title}</Text>
                        {area.points.map((point) => (
                          <View key={point} style={s.solutionPointRow}>
                            <Ionicons name="checkmark" size={14} color={accent} />
                            <Text style={[s.solutionPointText, { color: colors.textSecondary }]}>{point}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : null}

            {supportsWorkspaceManagement ? (
              canManageWorkspace ? (
                <View
                  style={[
                    s.workspaceSection,
                    {
                      marginHorizontal: hPad,
                      backgroundColor: colors.surface,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <View style={s.workspaceSectionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.workspaceTitle, { color: colors.text }]}>My listings</Text>
                      <Text style={[s.workspaceSubtitle, { color: colors.textSecondary }]}>
                        Edit, update, archive, or delete your {TYPE_CONFIG[activeTab].label.toLowerCase()} listings on this page.
                      </Text>
                    </View>
                    {editingItem ? (
                      <Pressable
                        onPress={resetEditor}
                        style={[s.workspaceGhostBtn, { borderColor: colors.borderLight }]}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel editing"
                      >
                        <Text style={[s.workspaceGhostBtnText, { color: colors.textSecondary }]}>Cancel editing</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.workspaceFilterRow}>
                    {WORKSPACE_STATUS_FILTERS.map((filter) => {
                      const active = workspaceStatusFilter === filter;
                      return (
                        <Pressable
                          key={filter}
                          onPress={() => setWorkspaceStatusFilter(filter)}
                          style={[
                            s.workspaceFilterChip,
                            {
                              backgroundColor: active ? accent + '16' : colors.surfaceSecondary,
                              borderColor: active ? accent : colors.borderLight,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Show ${filter} listings`}
                          accessibilityState={{ selected: active }}
                        >
                          <Text style={[s.workspaceFilterChipText, { color: active ? accent : colors.textSecondary }]}>
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <View style={s.workspaceList}>
                    {workspaceItems.length > 0 ? (
                      workspaceItems.map((item) => {
                        const isEditing = editingItem?.id === item.id;
                        return (
                          <View
                            key={item.id}
                            style={[
                              s.workspaceCard,
                              {
                                backgroundColor: colors.surfaceSecondary,
                                borderColor: isEditing ? accent : colors.borderLight,
                              },
                            ]}
                          >
                            <View style={s.workspaceCardHeader}>
                              <View style={{ flex: 1 }}>
                                <Text style={[s.workspaceCardTitle, { color: colors.text }]} numberOfLines={1}>
                                  {item.title}
                                </Text>
                                {item.subtitle ? (
                                  <Text style={[s.workspaceCardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                                    {item.subtitle}
                                  </Text>
                                ) : null}
                              </View>
                              <View
                                style={[
                                  s.workspaceStatusPill,
                                  {
                                    backgroundColor: item.status === 'archived' ? colors.surface : accent + '12',
                                    borderColor: item.status === 'archived' ? colors.borderLight : accent + '30',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    s.workspaceStatusPillText,
                                    { color: item.status === 'archived' ? colors.textTertiary : accent },
                                  ]}
                                >
                                  {item.status}
                                </Text>
                              </View>
                            </View>
                            <View style={s.workspaceActionRow}>
                              <Pressable
                                onPress={() => handleEditWorkspaceItem(item)}
                                style={[s.workspaceActionBtn, { borderColor: colors.borderLight }]}
                                accessibilityRole="button"
                                accessibilityLabel={`Edit ${item.title}`}
                              >
                                <Text style={[s.workspaceActionBtnText, { color: colors.text }]}>Edit</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => confirmArchiveWorkspaceItem(item)}
                                style={[s.workspaceActionBtn, { borderColor: colors.borderLight }]}
                                accessibilityRole="button"
                                accessibilityLabel={`Archive ${item.title}`}
                              >
                                <Text style={[s.workspaceActionBtnText, { color: colors.textSecondary }]}>Archive</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => confirmDeleteWorkspaceItem(item)}
                                style={[s.workspaceActionBtn, { borderColor: colors.error + '33' }]}
                                accessibilityRole="button"
                                accessibilityLabel={`Delete ${item.title}`}
                              >
                                <Text style={[s.workspaceActionBtnText, { color: colors.error }]}>Delete</Text>
                              </Pressable>
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <View style={[s.workspaceEmpty, { borderColor: colors.borderLight, backgroundColor: colors.surfaceSecondary }]}>
                        <Ionicons name="albums-outline" size={18} color={colors.textTertiary} />
                        <Text style={[s.workspaceEmptyText, { color: colors.textSecondary }]}>
                          No {TYPE_CONFIG[activeTab].label.toLowerCase()} listings in this filter yet.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    s.workspaceNotice,
                    {
                      marginHorizontal: hPad,
                      backgroundColor: colors.surface,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.textTertiary} />
                  <Text style={[s.workspaceNoticeText, { color: colors.textSecondary }]}>
                    Workspace management is available for approved organisation, business, and professional owners.
                  </Text>
                </View>
              )
            ) : null}

            {/* ── Network error banner ── */}
            {networkError ? (
              <View style={[s.networkErrorBanner, { marginHorizontal: hPad, backgroundColor: colors.surface, borderColor: colors.error + '60' }]}>
                <View style={[s.networkErrorStrip, { backgroundColor: colors.error }]} />
                <Ionicons name="cloud-offline-outline" size={18} color={colors.error} style={{ marginLeft: 12 }} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[s.networkErrorTitle, { color: colors.text }]}>Submission failed</Text>
                  <Text style={[s.networkErrorMsg, { color: colors.textSecondary }]}>{networkError}</Text>
                </View>
                <Pressable onPress={() => setNetworkError(null)} hitSlop={8} accessibilityLabel="Dismiss">
                  <Ionicons name="close" size={18} color={colors.textTertiary} />
                </Pressable>
              </View>
            ) : null}

            {imageUploadWarning ? (
              <View style={[s.networkErrorBanner, { marginHorizontal: hPad, backgroundColor: colors.surface, borderColor: colors.warning + '55' }]}>
                <View style={[s.networkErrorStrip, { backgroundColor: colors.warning }]} />
                <Ionicons name="image-outline" size={18} color={colors.warning} style={{ marginLeft: 12 }} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[s.networkErrorTitle, { color: colors.text }]}>Photo upload skipped</Text>
                  <Text style={[s.networkErrorMsg, { color: colors.textSecondary }]}>{imageUploadWarning}</Text>
                </View>
                <Pressable onPress={() => setImageUploadWarning(null)} hitSlop={8} accessibilityLabel="Dismiss photo warning">
                  <Ionicons name="close" size={18} color={colors.textTertiary} />
                </Pressable>
              </View>
            ) : null}

            {/* ── Cover Photo (standalone full-bleed section) ── */}
            {imageUri ? (
              <Pressable
                style={[s.mediaPrevieFull, { marginHorizontal: hPad }]}
                onPress={openCoverImagePicker}
                accessibilityRole="button"
                accessibilityLabel="Replace image"
              >
                <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.55)']}
                  style={[StyleSheet.absoluteFillObject, s.mediaGradientOverlay]}
                />
                <View style={s.mediaReplaceBtn}>
                  <Ionicons name="camera-outline" size={13} color="#fff" />
                  <Text style={s.mediaReplaceBtnText}>Replace</Text>
                </View>
              </Pressable>
            ) : (
              <Pressable
                style={[s.mediaEmpty, { borderColor: accent + '50', marginHorizontal: hPad }]}
                onPress={openCoverImagePicker}
                accessibilityRole="button"
                accessibilityLabel="Upload cover photo"
              >
                <View style={[s.mediaEmptyIconWrap, { backgroundColor: accent + '18' }]}>
                  <Ionicons name="image-outline" size={28} color={accent} />
                </View>
                <Text style={[s.mediaEmptyTitle, { color: colors.text }]}>Add Cover Photo</Text>
                <Text style={[s.mediaEmptySub, { color: colors.textSecondary }]}>
                  {activeTab === 'movie'
                    ? 'Poster: 2:3 ratio · min 600×900 px · JPEG or PNG'
                    : activeTab === 'professional'
                      ? 'Profile photo: 1:1 square · min 800×800 px · JPEG or PNG'
                      : 'Banner: 16:9 · min 1200×675 px · JPEG or PNG · max 10 MB'}
                </Text>
                <Text style={[s.mediaEmptyFormats, { color: colors.textTertiary }]}>
                  JPEG · PNG · WebP · HEIC accepted
                </Text>
              </Pressable>
            )}

            {/* ── Basic Information (name + description only) ── */}
            <Card colors={colors} hPad={hPad}>
              <SectionLabel colors={colors} accent={accent} icon="document-text-outline" label="Listing details" />

              <Field
                label={
                  isEventLike(activeTab) ? 'Event title'
                    : activeTab === 'movie' ? 'Film title'
                    : activeTab === 'perk' ? 'Perk title'
                    : 'Name'
                }
                required
                error={fieldErrors.name}
              >
                <TextInput
                  style={[s.input, {
                    backgroundColor: colors.background,
                    borderColor: fieldErrors.name ? colors.error : colors.border,
                    color: colors.text,
                  }]}
                  value={form.name}
                  onChangeText={v => set('name', v)}
                  placeholder={
                    activeTab === 'movie'        ? 'e.g. Road to Nation'        :
                    activeTab === 'restaurant'   ? 'e.g. Carriageworks Kitchen' :
                    activeTab === 'shop'        ? 'e.g. Heritage Bookshop'     :
                    activeTab === 'activity'     ? 'e.g. Barangaroo walking tour' :
                    isEventLike(activeTab)       ? 'e.g. Diwali Festival 2026'  :
                    activeTab === 'perk'         ? 'e.g. 20% off event tickets' :
                    activeTab === 'business'     ? 'Business name'              :
                    activeTab === 'professional' ? 'Practice, artist or studio name' :
                    'Organisation name'
                  }
                  placeholderTextColor={colors.textTertiary}
                  returnKeyType="next"
                />
              </Field>

              <Field label="Description" hint={`${form.description.length}/500`}>
                <TextInput
                  style={[s.input, s.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={form.description}
                  onChangeText={v => set('description', v)}
                  placeholder="Tell us more about this…"
                  placeholderTextColor={colors.textTertiary}
                  multiline numberOfLines={4} textAlignVertical="top" maxLength={500}
                />
              </Field>
            </Card>

            {/* ── Event Details ── */}
            {isEventLike(activeTab) && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="calendar-outline" label="Event Details" />

                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Field label="Date" required error={fieldErrors.date}>
                      <TextInput
                        style={[s.input, {
                          backgroundColor: colors.background,
                          borderColor: fieldErrors.date ? colors.error : colors.border,
                          color: colors.text,
                        }]}
                        value={form.date}
                        onChangeText={v => set('date', v)}
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="numbers-and-punctuation"
                      />
                    </Field>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Time">
                      <TextInput
                        style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                        value={form.time}
                        onChangeText={v => set('time', v)}
                        placeholder="e.g. 6:00 PM"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </Field>
                  </View>
                </View>

                <Field label="Venue">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={form.venue} onChangeText={v => set('venue', v)}
                    placeholder="Venue name" placeholderTextColor={colors.textTertiary}
                  />
                </Field>

                <Field label="Address">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={form.address} onChangeText={v => set('address', v)}
                    placeholder="Full street address" placeholderTextColor={colors.textTertiary}
                  />
                </Field>

                {/* Free toggle — card style */}
                <View style={[s.toggleRow, { backgroundColor: colors.surface, borderRadius: 14 }]}>
                  <View style={[s.toggleIconWrap, { backgroundColor: isFree ? accent + '18' : colors.background }]}>
                    <Ionicons name="ticket-outline" size={18} color={isFree ? accent : colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.toggleLabel, { color: colors.text }]}>Free event</Text>
                    <Text style={[s.toggleSub, { color: colors.textTertiary }]}>No ticket price required</Text>
                  </View>
                  <Switch
                    value={isFree}
                    onValueChange={v => {
                      setIsFree(v);
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                    }}
                    trackColor={{ false: colors.borderLight, true: accent + '70' }}
                    thumbColor={isFree ? accent : colors.textTertiary}
                    ios_backgroundColor={colors.borderLight}
                  />
                </View>

                {!isFree && (
                  <View style={s.row}>
                    <View style={{ flex: 1 }}>
                      <Field label="Price (A$)">
                        <TextInput
                          style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                          value={form.price} onChangeText={v => set('price', v)}
                          placeholder="0.00" placeholderTextColor={colors.textTertiary} keyboardType="decimal-pad"
                        />
                      </Field>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="Capacity">
                        <TextInput
                          style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                          value={form.capacity} onChangeText={v => set('capacity', v)}
                          placeholder="Unlimited" placeholderTextColor={colors.textTertiary} keyboardType="number-pad"
                        />
                      </Field>
                    </View>
                  </View>
                )}

                <Field label="External Ticket Link" hint="Optional">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={form.externalTicketUrl} onChangeText={v => set('externalTicketUrl', v)}
                    placeholder="https://eventbrite.com/…" placeholderTextColor={colors.textTertiary}
                    keyboardType="url" autoCapitalize="none"
                  />
                </Field>

                <Field label="Community" hint="Optional">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={form.communityId} onChangeText={v => set('communityId', v)}
                    placeholder="Community ID" placeholderTextColor={colors.textTertiary} autoCapitalize="none"
                  />
                </Field>
              </Card>
            )}

            {isEventLike(activeTab) && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="people-outline" label="Culture & communities" />
                <Text style={{ color: colors.textTertiary, fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 18, marginBottom: 10 }}>
                  Optional. These become culture tags on your event and power discovery.
                </Text>
                <View style={s.chipGrid}>
                  {EVENT_CULTURE_TAGS.map((tag) => {
                    const isActive = eventCultureTags.includes(tag);
                    return (
                      <Pressable
                        key={tag}
                        style={[
                          s.chip,
                          isActive
                            ? { backgroundColor: accent, borderColor: accent, borderWidth: 0 }
                            : { backgroundColor: 'transparent', borderColor: colors.borderLight, borderWidth: 1 },
                        ]}
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.selectionAsync();
                          setEventCultureTags((prev) => {
                            if (prev.includes(tag)) return prev.filter((t) => t !== tag);
                            if (prev.length >= 12) return prev;
                            return [...prev, tag];
                          });
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Culture tag ${tag}`}
                      >
                        <Text style={[s.chipText, { color: isActive ? '#fff' : colors.textSecondary }]}>{tag}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>
            )}

            {/* ── Host & Sponsors (event only) ── */}
            {isEventLike(activeTab) && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="people-circle-outline" label="Host & Sponsors" />

                <Field label="Host Name" hint="Optional">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={form.hostName} onChangeText={v => set('hostName', v)}
                    placeholder="e.g. CulturePass Events Team" placeholderTextColor={colors.textTertiary}
                  />
                </Field>

                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Field label="Host Email" hint="Optional">
                      <TextInput
                        style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                        value={form.hostEmail} onChangeText={v => set('hostEmail', v)}
                        placeholder="host@example.com" placeholderTextColor={colors.textTertiary}
                        keyboardType="email-address" autoCapitalize="none"
                      />
                    </Field>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Host Phone" hint="Optional">
                      <TextInput
                        style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                        value={form.hostPhone} onChangeText={v => set('hostPhone', v)}
                        placeholder="+61 400 000 000" placeholderTextColor={colors.textTertiary}
                        keyboardType="phone-pad"
                      />
                    </Field>
                  </View>
                </View>

                <Field label="Sponsors" hint="Optional — comma-separated names">
                  <TextInput
                    style={[s.input, s.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={form.sponsors} onChangeText={v => set('sponsors', v)}
                    placeholder="e.g. Brand A, Brand B, Brand C" placeholderTextColor={colors.textTertiary}
                    multiline numberOfLines={3} textAlignVertical="top"
                  />
                </Field>
              </Card>
            )}

            {/* ── Movie / cinema listing ── */}
            {activeTab === 'movie' && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="film-outline" label="Film details" />
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Field label="Release date" required error={fieldErrors.date}>
                      <TextInput
                        style={[s.input, {
                          backgroundColor: colors.background,
                          borderColor: fieldErrors.date ? colors.error : colors.border,
                          color: colors.text,
                        }]}
                        value={form.date}
                        onChangeText={v => set('date', v)}
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="numbers-and-punctuation"
                      />
                    </Field>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Runtime" hint="e.g. 2h 15m">
                      <TextInput
                        style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                        value={form.runtime}
                        onChangeText={v => set('runtime', v)}
                        placeholder="2h"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </Field>
                  </View>
                </View>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Field label="Classification" hint="e.g. M, PG">
                      <TextInput
                        style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                        value={form.movieRating}
                        onChangeText={v => set('movieRating', v)}
                        placeholder="M"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </Field>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Primary language">
                      <TextInput
                        style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                        value={form.language}
                        onChangeText={v => set('language', v)}
                        placeholder="English"
                        placeholderTextColor={colors.textTertiary}
                      />
                    </Field>
                  </View>
                </View>
                <Field label="Director">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={form.director}
                    onChangeText={v => set('director', v)}
                    placeholder="Director name"
                    placeholderTextColor={colors.textTertiary}
                  />
                </Field>
              </Card>
            )}

            {/* ── Perk Details ── */}
            {activeTab === 'perk' && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="gift-outline" label="Perk Details" />

                <Field label="Perk Type" required error={fieldErrors.perkType}>
                  <View style={s.chipGrid}>
                    {PERK_TYPES.map(pt => {
                      const isActive = form.perkType === pt.key;
                      return (
                        <Pressable
                          key={pt.key}
                          style={[
                            s.chip,
                            isActive
                              ? { backgroundColor: accent, borderColor: accent, borderWidth: 0 }
                              : { backgroundColor: 'transparent', borderColor: colors.borderLight, borderWidth: 1 },
                          ]}
                          onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); set('perkType', isActive ? '' : pt.key); }}
                          accessibilityRole="button" accessibilityLabel={pt.label}
                        >
                          <Ionicons name={pt.icon as keyof typeof Ionicons.glyphMap} size={13} color={isActive ? '#fff' : accent} />
                          <Text style={[s.chipText, { color: isActive ? '#fff' : colors.textSecondary }]}>{pt.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>

                {(form.perkType === 'discount_percent' || form.perkType === 'discount_fixed' || form.perkType === 'cashback') && (
                  <Field label={form.perkType === 'discount_percent' ? 'Discount (%)' : 'Amount ($)'}>
                    <TextInput
                      style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      value={form.discountValue} onChangeText={v => set('discountValue', v)}
                      placeholder={form.perkType === 'discount_percent' ? '20' : '10'}
                      placeholderTextColor={colors.textTertiary} keyboardType="numeric"
                    />
                  </Field>
                )}

                <Field label="Provider Name">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={form.providerName} onChangeText={v => set('providerName', v)}
                    placeholder="e.g. CulturePass" placeholderTextColor={colors.textTertiary}
                  />
                </Field>

                <Field label="Perk Category">
                  <View style={s.chipGrid}>
                    {PERK_CATEGORIES.map(cat => {
                      const isActive = form.perkCategory === cat;
                      return (
                        <Pressable
                          key={cat}
                          style={[
                            s.chip,
                            isActive
                              ? { backgroundColor: accent, borderColor: accent, borderWidth: 0 }
                              : { backgroundColor: 'transparent', borderColor: colors.borderLight, borderWidth: 1 },
                          ]}
                          onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); set('perkCategory', isActive ? '' : cat); }}
                          accessibilityRole="button" accessibilityLabel={cat}
                        >
                          <Text style={[s.chipText, { color: isActive ? '#fff' : colors.textSecondary }]}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>
              </Card>
            )}

            {/* ── Location (single, for all non-perk types) ── */}
            {activeTab !== 'perk' && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="location-outline" label="Location" />

                {(activeTab === 'restaurant' || activeTab === 'shop') && (
                  <Field label="Street address" required error={fieldErrors.address}>
                    <TextInput
                      style={[s.input, {
                        backgroundColor: colors.background,
                        borderColor: fieldErrors.address ? colors.error : colors.border,
                        color: colors.text,
                      }]}
                      value={form.address}
                      onChangeText={v => set('address', v)}
                      placeholder="Building & street"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </Field>
                )}

                {activeTab === 'organisation' && (
                  <Field label="Street address" hint="Optional — shown on your profile page">
                    <TextInput
                      style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      value={form.address}
                      onChangeText={v => set('address', v)}
                      placeholder="e.g. 123 George St, Sydney"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </Field>
                )}

                <View style={s.row}>
                  <View style={{ flex: 2 }}>
                    <Field label="City" error={fieldErrors.city}>
                      <TextInput
                        style={[s.input, {
                          backgroundColor: colors.background,
                          borderColor: fieldErrors.city ? colors.error : colors.border,
                          color: colors.text,
                        }]}
                        value={form.city} onChangeText={v => set('city', v)}
                        placeholder="Sydney" placeholderTextColor={colors.textTertiary}
                      />
                    </Field>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="State" error={fieldErrors.state}>
                      <TextInput
                        style={[s.input, {
                          backgroundColor: colors.background,
                          borderColor: fieldErrors.state ? colors.error : colors.border,
                          color: colors.text,
                        }]}
                        value={form.state} onChangeText={v => set('state', v)}
                        placeholder="NSW" placeholderTextColor={colors.textTertiary} autoCapitalize="characters"
                      />
                    </Field>
                  </View>
                </View>

                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Field label="Postcode" hint="Auto-fills city" error={fieldErrors.postcode}>
                      <TextInput
                        style={[s.input, {
                          backgroundColor: colors.background,
                          borderColor: fieldErrors.postcode ? colors.error : colors.border,
                          color: colors.text,
                        }]}
                        value={form.postcode} onChangeText={v => set('postcode', v)}
                        placeholder="2000" placeholderTextColor={colors.textTertiary}
                        keyboardType="number-pad" maxLength={4}
                      />
                    </Field>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Country">
                      <TextInput
                        style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                        value={form.country} onChangeText={v => set('country', v)}
                        placeholder="Australia" placeholderTextColor={colors.textTertiary}
                      />
                    </Field>
                  </View>
                </View>
              </Card>
            )}

            {/* ── Activity: meeting point ── */}
            {activeTab === 'activity' && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="navigate-outline" label="Where it happens" />
                <Field label="Venue or meeting point" hint="Optional — shown on your activity page">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={form.venue}
                    onChangeText={v => set('venue', v)}
                    placeholder="e.g. Circular Quay Wharf 6"
                    placeholderTextColor={colors.textTertiary}
                  />
                </Field>
                <Field label="Street address" hint="Optional">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={form.address}
                    onChangeText={v => set('address', v)}
                    placeholder="For maps & directions"
                    placeholderTextColor={colors.textTertiary}
                  />
                </Field>
              </Card>
            )}

            {/* ── Contact Details ── */}
            {activeTab !== 'perk' && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="mail-outline" label="Contact Details" />

                <Field
                  label="Email"
                  required={PROFILE_TABS.includes(activeTab)}
                  hint={activeTab === 'activity' ? 'Optional for activities' : undefined}
                  error={fieldErrors.contactEmail}
                >
                  <TextInput
                    style={[s.input, {
                      backgroundColor: colors.background,
                      borderColor: fieldErrors.contactEmail ? colors.error : colors.border,
                      color: colors.text,
                    }]}
                    value={form.contactEmail} onChangeText={v => set('contactEmail', v)}
                    placeholder="contact@example.com" placeholderTextColor={colors.textTertiary}
                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                  />
                </Field>

                <Field label="Phone">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={form.phone} onChangeText={v => set('phone', v)}
                    placeholder="+61 400 000 000" placeholderTextColor={colors.textTertiary} keyboardType="phone-pad"
                  />
                </Field>

                <Field label="Website" error={fieldErrors.website}>
                  <TextInput
                    style={[s.input, {
                      backgroundColor: colors.background,
                      borderColor: fieldErrors.website ? colors.error : colors.border,
                      color: colors.text,
                    }]}
                    value={form.website} onChangeText={v => set('website', v)}
                    placeholder="https://example.com" placeholderTextColor={colors.textTertiary}
                    keyboardType="url" autoCapitalize="none"
                  />
                </Field>
              </Card>
            )}

            {/* ── Category / Genre / Cuisine ── */}
            {activeTab === 'professional' && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="briefcase-outline" label="Professional listing" />
                <Text style={{ color: colors.textSecondary, fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20 }}>
                  This creates a professional workspace profile for practices, artists, consultants, and studios. Choose the professional category that best fits your work.
                </Text>
              </Card>
            )}

            {activeTab !== 'perk' && getCategoryOptions().length > 0 && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="grid-outline" label={getCategorySectionLabel()} />
                <View style={s.chipGrid}>
                  {getCategoryOptions().map(cat => {
                    const isActive = form.category === cat;
                    return (
                      <Pressable
                        key={cat}
                        style={[
                          s.chip,
                          isActive
                            ? { backgroundColor: accent, borderColor: accent, borderWidth: 0 }
                            : { backgroundColor: 'transparent', borderColor: colors.borderLight, borderWidth: 1 },
                        ]}
                        onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); set('category', isActive ? '' : cat); }}
                        accessibilityRole="button" accessibilityLabel={cat}
                      >
                        <Text style={[s.chipText, { color: isActive ? '#fff' : colors.textSecondary }]}>{cat}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {activeTab === 'restaurant' && (
                  <>
                    <SectionLabel colors={colors} accent={accent} icon="cash-outline" label="Price range" />
                    <View style={s.chipGrid}>
                      {PRICE_RANGE_OPTS.map((tier) => {
                        const isActive = form.priceRange === tier;
                        return (
                          <Pressable
                            key={tier}
                            style={[
                              s.chip,
                              isActive
                                ? { backgroundColor: accent, borderColor: accent, borderWidth: 0 }
                                : { backgroundColor: 'transparent', borderColor: colors.borderLight, borderWidth: 1 },
                            ]}
                            onPress={() => {
                              if (Platform.OS !== 'web') Haptics.selectionAsync();
                              set('priceRange', tier);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Price range ${tier}`}
                          >
                            <Text style={[s.chipText, { color: isActive ? '#fff' : colors.textSecondary }]}>{tier}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}
              </Card>
            )}

            {/* ── Business: ABN ── */}
            {activeTab === 'business' && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="card-outline" label="Business Details" />
                <Field label="ABN (Australian Business Number)">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={form.abn} onChangeText={v => set('abn', v)}
                    placeholder="XX XXX XXX XXX" placeholderTextColor={colors.textTertiary} keyboardType="number-pad"
                  />
                </Field>
              </Card>
            )}

            {/* ── Social Media (profiles) ── */}
            {PROFILE_TABS.includes(activeTab) && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="pricetag-outline" label="Discovery tags" />

                {/* Suggested tag chips — organisation, business, professional */}
                {ORG_LISTING_TABS.includes(activeTab) && (
                  <>
                    <Text style={[s.tagHint, { color: colors.textSecondary }]}>
                      Tap to add · helps people find you on Discover
                    </Text>
                    <View style={s.chipGrid}>
                      {ORG_DISCOVERY_TAGS.map((tag) => {
                        const isActive = orgDiscoveryTags.includes(tag);
                        return (
                          <Pressable
                            key={tag}
                            style={[
                              s.chip,
                              isActive
                                ? { backgroundColor: accent, borderColor: accent, borderWidth: 0 }
                                : { backgroundColor: 'transparent', borderColor: colors.borderLight, borderWidth: 1 },
                            ]}
                            onPress={() => {
                              if (Platform.OS !== 'web') Haptics.selectionAsync();
                              setOrgDiscoveryTags((prev) =>
                                prev.includes(tag)
                                  ? prev.filter((t) => t !== tag)
                                  : prev.length >= 15 ? prev : [...prev, tag],
                              );
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Tag: ${tag}`}
                            accessibilityState={{ selected: isActive }}
                          >
                            {isActive && (
                              <Ionicons name="checkmark" size={11} color="#fff" />
                            )}
                            <Text style={[s.chipText, { color: isActive ? '#fff' : colors.textSecondary }]}>{tag}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {orgDiscoveryTags.length > 0 && (
                      <View style={[s.tagCountRow, { borderColor: colors.borderLight }]}>
                        <Ionicons name="pricetag" size={13} color={accent} />
                        <Text style={[s.tagCountText, { color: accent }]}>
                          {orgDiscoveryTags.length} tag{orgDiscoveryTags.length !== 1 ? 's' : ''} selected
                        </Text>
                        <Pressable
                          onPress={() => setOrgDiscoveryTags([])}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel="Clear all tags"
                        >
                          <Text style={[s.tagClearText, { color: colors.textTertiary }]}>Clear all</Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}

                <Field
                  label="Custom tags"
                  hint={`Comma-separated${orgDiscoveryTags.length > 0 ? ' · merged with selected above' : ' — e.g. Diwali, dance, Western Sydney'}`}
                >
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={form.profileTags}
                    onChangeText={v => set('profileTags', v)}
                    placeholder="e.g. community, festival, language class…"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                  />
                </Field>
                <SectionLabel colors={colors} accent={accent} icon="share-social-outline" label="Social links" />
                {([
                  { field: 'instagram' as const, icon: 'logo-instagram', label: 'Instagram',   prefix: 'instagram.com/'  },
                  { field: 'facebook'  as const, icon: 'logo-facebook',  label: 'Facebook',    prefix: 'facebook.com/'   },
                  { field: 'youtube'   as const, icon: 'logo-youtube',   label: 'YouTube',     prefix: 'youtube.com/@'   },
                  { field: 'twitterX'  as const, icon: 'logo-twitter',   label: 'X (Twitter)', prefix: 'x.com/'          },
                  { field: 'linkedin'  as const, icon: 'logo-linkedin',  label: 'LinkedIn',    prefix: 'linkedin.com/in/'},
                  { field: 'airpal'    as const, icon: 'person-circle-outline', label: 'AirPal', prefix: 'airpal.me/@'   },
                ] as const).map(({ field, icon, label, prefix }) => (
                  <Field key={field} label={label}>
                    <View style={[s.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={colors.textTertiary} />
                      <Text style={[s.inputPrefix, { color: colors.textTertiary }]}>{prefix}</Text>
                      <TextInput
                        style={[s.inputInner, { color: colors.text }]}
                        value={form[field]} onChangeText={v => set(field, v)}
                        placeholder="username" placeholderTextColor={colors.textTertiary}
                        autoCapitalize="none" autoCorrect={false}
                      />
                    </View>
                  </Field>
                ))}
              </Card>
            )}

            {/* ── Create ── */}
            <View style={[s.submitWrap, { paddingHorizontal: hPad }]}>
              <Pressable
                onPress={() => void handleSubmit()}
                disabled={isPending}
                accessibilityRole="button"
                accessibilityLabel={`${editingItem ? 'Update' : 'Create'} ${TYPE_CONFIG[activeTab].label}`}
                style={[isPending && { opacity: 0.7 }]}
              >
                <LinearGradient
                  colors={[accent, accent + 'BB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.submitBtn}
                >
                  {isPending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  }
                  <Text style={s.submitBtnText}>
                    {isPending ? (editingItem ? 'Updating…' : 'Creating…') : `${editingItem ? 'Update' : 'Create'} ${TYPE_CONFIG[activeTab].label}`}
                  </Text>
                </LinearGradient>
              </Pressable>
              <View style={s.submitNoteRow}>
                <Ionicons name="lock-closed-outline" size={12} color={colors.textSecondary} />
                <Text style={[s.submitNote, { color: colors.textSecondary }]}>
                  {activeTab === 'perk'
                    ? 'Your perk will be created and made available immediately.'
                    : activeTab === 'activity'
                      ? 'Activities go live after creation (subject to moderation).'
                      : 'Reviewed within 2–3 business days'}
                </Text>
              </View>
            </View>

            </>
          </SubmitStudioLayout>
        </View>
      </KeyboardAvoidingView>
    </AuthGuard>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  headerGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: {
        backdropFilter: 'saturate(140%) blur(12px)',
      } as object,
      default: {},
    }),
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#FAFAFF',
    letterSpacing: -0.3,
    ...Platform.select({
      web: { textShadow: '0 1px 18px rgba(0,0,0,0.45)' } as object,
      default: {},
    }),
  },
  headerSub:   { ...TextStyles.captionSemibold, marginTop: 2, opacity: 0.95 },
  headerTypeBadge: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },

  scroll:        { paddingTop: 20 },
  scrollDesktop: { maxWidth: 720, width: '100%', alignSelf: 'center' },

  splitLayout: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
    minWidth: 0,
  },
  listingAside: {
    flexGrow: 0,
    flexShrink: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  listingAsideContent: {
    paddingTop: 22,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  asideOverline: {
    ...TextStyles.tabLabel,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
    opacity: 0.95,
  },
  asideTitle: {
    ...TextStyles.title2,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  asideSubtitle: {
    ...TextStyles.chip,
    lineHeight: 19,
    marginTop: 4,
    opacity: 0.92,
  },
  asideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  asideIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  asideRowTitle: {
    ...TextStyles.callout,
    letterSpacing: -0.2,
  },
  asideRowDesc: {
    ...TextStyles.caption,
    lineHeight: 16,
    marginTop: 2,
  },

  splitMainScroll: {
    flex: 1,
    minWidth: 0,
  },
  splitMainContent: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },

  typeSection: { marginBottom: 20 },
  railHeader: { marginBottom: 12 },
  railTitle: {
    ...TextStyles.title3,
    letterSpacing: -0.35,
  },
  railHint: {
    ...TextStyles.caption,
    lineHeight: 17,
    marginTop: 4,
    opacity: 0.95,
  },
  typeRailScroll: {
    gap: 12,
    paddingBottom: 8,
    flexDirection: 'row',
  },
  typeCardPremium: {
    width: 152,
    minHeight: 118,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    gap: 8,
    overflow: 'hidden',
    ...Platform.select({ web: { cursor: 'pointer' } as object, default: {} }),
  },
  typeCardIconPremium: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeCardLabelPremium: {
    ...TextStyles.callout,
    letterSpacing: -0.25,
  },
  typeCardDescPremium: {
    ...TextStyles.badge,
    lineHeight: 15,
  },

  notice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 12, padding: 12, marginBottom: 12, overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 1px 6px rgba(0,0,0,0.06)' } as object,
      default: { shadowColor: 'black', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    }),
  },
  noticeStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  noticeText:  { ...TextStyles.chip, flex: 1, lineHeight: 18 },
  workspaceSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  workspaceSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  workspaceTitle: {
    ...TextStyles.title3,
    letterSpacing: -0.35,
  },
  workspaceSubtitle: {
    ...TextStyles.caption,
    lineHeight: 18,
    marginTop: 4,
  },
  workspaceGhostBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  workspaceGhostBtnText: {
    ...TextStyles.captionSemibold,
  },
  workspaceFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  workspaceFilterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  workspaceFilterChipText: {
    ...TextStyles.captionSemibold,
  },
  workspaceList: {
    gap: 10,
  },
  workspaceCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  workspaceCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  workspaceCardTitle: {
    ...TextStyles.callout,
  },
  workspaceCardMeta: {
    ...TextStyles.caption,
    marginTop: 3,
  },
  workspaceStatusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  workspaceStatusPillText: {
    ...TextStyles.badge,
    textTransform: 'capitalize',
  },
  workspaceActionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  workspaceActionBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  workspaceActionBtnText: {
    ...TextStyles.captionSemibold,
  },
  workspaceEmpty: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workspaceEmptyText: {
    ...TextStyles.caption,
    flex: 1,
  },
  workspaceNotice: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workspaceNoticeText: {
    ...TextStyles.caption,
    flex: 1,
    lineHeight: 18,
  },
  associationHero: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    ...Platform.select({
      web: { boxShadow: '0px 6px 24px rgba(0,0,0,0.08)' } as object,
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      },
    }),
  },
  associationBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  associationBadgeText: {
    ...TextStyles.tabLabel,
    fontSize: 10,
    letterSpacing: 1,
  },
  associationTitle: {
    ...TextStyles.title3,
    lineHeight: 26,
    letterSpacing: -0.35,
  },
  associationBody: {
    ...TextStyles.cardBody,
    lineHeight: 22,
  },
  associationPillars: {
    gap: 8,
  },
  associationPillar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  associationPillarText: {
    ...TextStyles.captionSemibold,
    flex: 1,
    lineHeight: 18,
  },
  problemCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  problemEyebrow: {
    ...TextStyles.tabLabel,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  problemTitle: {
    ...TextStyles.title3,
    lineHeight: 26,
    letterSpacing: -0.35,
  },
  problemIntro: {
    ...TextStyles.cardBody,
    lineHeight: 22,
  },
  problemGrid: {
    gap: 10,
  },
  problemPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  problemPanelIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  problemPanelTitle: {
    ...TextStyles.callout,
    lineHeight: 20,
  },
  problemPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  problemPointText: {
    ...TextStyles.caption,
    flex: 1,
    lineHeight: 18,
  },
  solutionCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    ...Platform.select({
      web: { boxShadow: '0px 6px 24px rgba(0,0,0,0.08)' } as object,
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      },
    }),
  },
  solutionEyebrow: {
    ...TextStyles.tabLabel,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  solutionTitle: {
    ...TextStyles.title3,
    lineHeight: 26,
    letterSpacing: -0.35,
  },
  solutionIntro: {
    ...TextStyles.cardBody,
    lineHeight: 22,
  },
  solutionGrid: {
    gap: 10,
  },
  solutionPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  solutionPanelIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solutionPanelTitle: {
    ...TextStyles.callout,
    lineHeight: 20,
  },
  solutionPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  solutionPointText: {
    ...TextStyles.caption,
    flex: 1,
    lineHeight: 18,
  },

  // Cover photo
  mediaPrevieFull: {
    height: 220, borderRadius: 14, overflow: 'hidden',
    position: 'relative', marginBottom: 12,
  },
  mediaGradientOverlay: { borderRadius: 14 },
  mediaReplaceBtn: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  mediaReplaceBtnText: { color: '#fff', ...TextStyles.captionSemibold },
  mediaEmpty: {
    height: 200, borderRadius: 14, borderWidth: 2,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 12,
  },
  mediaEmptyIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  mediaEmptyTitle:   { ...TextStyles.callout },
  mediaEmptySub:     { ...TextStyles.caption, marginTop: 1, textAlign: 'center' },
  mediaEmptyFormats: { ...TextStyles.caption, marginTop: 2, opacity: 0.6, textAlign: 'center' },

  networkErrorBanner: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    borderWidth: 1, marginBottom: 10, overflow: 'hidden',
    paddingVertical: 12, paddingRight: 14,
  },
  networkErrorStrip:  { width: 4, alignSelf: 'stretch', marginRight: 0 },
  networkErrorTitle:  { ...TextStyles.chip, fontWeight: '600' },
  networkErrorMsg:    { ...TextStyles.caption, marginTop: 1 },

  input:    { borderRadius: 12, padding: 14, ...TextStyles.cardBody, borderWidth: 1 },
  textArea: { minHeight: 100, paddingTop: 12 },

  inputWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  inputInner:    { flex: 1, ...TextStyles.cardBody, padding: 0 },
  inputPrefix:   { ...TextStyles.chip },

  row: { flexDirection: 'row', gap: 10 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, marginVertical: 8,
  },
  toggleIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleLabel:    { ...TextStyles.cardTitle },
  toggleSub:      { ...TextStyles.badge, marginTop: 1 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 },
  chipText: { ...TextStyles.chip },

  tagHint:      { ...TextStyles.caption, lineHeight: 18, marginBottom: 10, opacity: 0.85 },
  tagCountRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  tagCountText: { ...TextStyles.chip, flex: 1 },
  tagClearText: { ...TextStyles.chip },

  submitWrap: { marginTop: 4, marginBottom: 8 },
  submitBtn:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 17,
    ...Platform.select({
      web: { boxShadow: '0px 4px 16px rgba(0,0,0,0.15)' } as object,
      default: { shadowColor: 'black', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    }),
  },
  submitBtnText: { ...TextStyles.headline, color: '#fff' },
  submitNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginTop: 10 },
  submitNote:    { ...TextStyles.caption, lineHeight: 18 },

  // Success screen
  successRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successCard: {
    width: '100%', maxWidth: 400, borderRadius: 20, borderWidth: 1,
    padding: 28, alignItems: 'center', gap: 10,
    ...Platform.select({
      web: { boxShadow: '0px 8px 32px rgba(0,0,0,0.08)' } as object,
      default: { shadowColor: 'black', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
    }),
  },
  successIconRing: {
    width: 96, height: 96, borderRadius: 24 + 4,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, marginBottom: 4,
  },
  successIconWrap:  { width: 88, height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  successCheckCircle: {
    width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    position: 'absolute', top: 26, left: '50%' as never, marginLeft: 16,
  },
  successTitle: { ...TextStyles.title, textAlign: 'center', marginTop: 4 },
  successSub:   { ...TextStyles.cardBody, textAlign: 'center', lineHeight: 22, paddingHorizontal: 8, marginBottom: 8 },
  successBtn:        { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  successBtnText:    { ...TextStyles.callout, color: '#fff' },
  successBtnOutline: { width: '100%', paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1, marginTop: 4 },
  successBtnOutlineText: { ...TextStyles.callout },
  successTagline: { ...TextStyles.caption, marginTop: 8 },
});
