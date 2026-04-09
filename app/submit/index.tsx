import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Platform,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { api } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from '@/lib/image-manipulator';
import { fetch } from 'expo/fetch';
import { useRole } from '@/hooks/useRole';
import { AuthGuard } from '@/components/AuthGuard';
import { useLayout } from '@/hooks/useLayout';
import { getPostcodeData, getPostcodesByPlace } from '@shared/location/australian-postcodes';
import {
  ACTIVITY_CATEGORIES,
  ARTIST_GENRES,
  BIZ_CATEGORIES,
  CUISINE_OPTIONS,
  EVENT_CATEGORIES,
  EVENT_CULTURE_TAGS,
  LISTING_PLACEHOLDER_IMG,
  MOVIE_GENRES,
  ORG_CATEGORIES,
  ORG_LISTING_TABS,
  PERK_CATEGORIES,
  PERK_TYPES,
  PRICE_RANGE_OPTS,
  PROFILE_TABS,
  SHOP_CATEGORIES,
  TYPE_CONFIG,
  TYPE_ORDER,
  initialForm,
  isEventLike,
  normalizeSubmitType,
  resolveEventCategory,
  type DerivedLocation,
  type FieldErrors,
  type FormState,
  type SubmitType,
} from '@/features/submit/config';
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
    >
      {rail}
      {children}
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SubmitScreen() {
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const { hPad, isDesktop, isWeb } = useLayout();
  const isWebDesktop = isWeb && isDesktop;
  const { isAdmin, isOrganizer } = useRole();
  const params  = useLocalSearchParams<{ type?: string; variant?: string }>();

  // Pre-select from URL, e.g. /submit?type=event&variant=festival or /submit?type=restaurant
  const initialType = normalizeSubmitType(
    typeof params.type === 'string' ? params.type : undefined,
    typeof params.variant === 'string' ? params.variant : undefined,
  );

  const [activeTab, setActiveTab]   = useState<SubmitType>(initialType);
  const [form, setForm]             = useState<FormState>({ ...initialForm });
  const [isFree, setIsFree]         = useState(false);
  const [imageUri, setImageUri]     = useState<string | null>(null);
  const [eventCultureTags, setEventCultureTags] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted]   = useState(false);
  const [submittedType, setSubmittedType] = useState<SubmitType>('event');

  const accent = TYPE_CONFIG[activeTab].color;
  const visibleTypes = TYPE_ORDER.filter((t) => {
    if (t === 'perk' && !isAdmin) return false;
    if (['movie', 'restaurant', 'shop'].includes(t) && !isOrganizer && !isAdmin) return false;
    return true;
  });

  const set = useCallback((field: keyof FormState, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    setFieldErrors(p => ({ ...p, [field]: undefined }));
  }, []);

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

  const submitEventMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return api.events.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmittedType('event');
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
      setEventCultureTags([]);
      setIsFree(false);
    },
    onError: (err: Error) => setFieldErrors({ name: err.message }),
  });

  const submitProfileMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return api.profiles.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmittedType(activeTab);
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
    },
    onError: (err: Error) => setFieldErrors({ name: err.message }),
  });

  const submitPerkMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await api.perks.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/perks'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmittedType('perk');
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
    },
    onError: (err: Error) => setFieldErrors({ name: err.message }),
  });

  const submitActivityMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.activities.create>[0]) => api.activities.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmittedType('activity');
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
    },
    onError: (err: Error) => setFieldErrors({ name: err.message }),
  });

  const submitRestaurantMutation = useMutation({
    mutationFn: (data: import('@shared/schema').RestaurantInput) => api.restaurants.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmittedType('restaurant');
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
    },
    onError: (err: Error) => setFieldErrors({ name: err.message }),
  });

  const submitShopMutation = useMutation({
    mutationFn: (data: import('@shared/schema').ShopInput) => api.shopping.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmittedType('shop');
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
    },
    onError: (err: Error) => setFieldErrors({ name: err.message }),
  });

  const submitMovieMutation = useMutation({
    mutationFn: (data: import('@shared/schema').MovieInput) => api.movies.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/movies'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmittedType('movie');
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
    },
    onError: (err: Error) => setFieldErrors({ name: err.message }),
  });

  const isPending =
    submitEventMutation.isPending ||
    submitProfileMutation.isPending ||
    submitPerkMutation.isPending ||
    submitActivityMutation.isPending ||
    submitRestaurantMutation.isPending ||
    submitShopMutation.isPending ||
    submitMovieMutation.isPending;

  // ── Image upload ───────────────────────────────────────────────────────────

  const uploadImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]?.uri) setImageUri(result.assets[0].uri);
  };

  const uploadCoverIfNeeded = async (): Promise<string | null> => {
    if (!imageUri) return null;
    try {
      const processed = await manipulateAsync(imageUri, [{ resize: { width: 1600 } }], { compress: 0.9, format: SaveFormat.JPEG });
      const blobRes = await fetch(processed.uri);
      const blob = await blobRes.blob();
      const formData = new FormData();
      formData.append('image', blob as unknown as Blob, 'upload.jpg');
      const uploaded = await api.uploads.image(formData);
      return uploaded.imageUrl;
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[uploadCoverIfNeeded] Failed to upload cover image', { imageUri, error: err });
      }
      return null;
    }
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

  const handleSubmit = async () => {
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
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isEventLike(activeTab)) {
      if (!form.date.trim()) { setFieldErrors(p => ({ ...p, date: 'Date is required' })); return; }
      const location = deriveLocation();
      if (!location) return;
      let imageUrl: string | undefined;
      let heroImageUrl: string | undefined;
      if (imageUri) {
        const url = await uploadCoverIfNeeded();
        if (!url) {
          setFieldErrors({ name: 'Could not upload your image. Check your connection and try again, or remove the photo.' });
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        imageUrl = url;
        heroImageUrl = url;
      }
      submitEventMutation.mutate({
        title:       form.name.trim(),
        description: form.description.trim() || null,
        date:        form.date.trim(),
        time:        form.time.trim() || null,
        venue:       form.venue.trim() || null,
        address:     form.address.trim() || null,
        city:        location.city,
        state:       location.state,
        postcode:    location.postcode,
        country:     location.country,
        latitude:    location.latitude,
        longitude:   location.longitude,
        category:    resolveEventCategory(activeTab, form.category.trim()),
        contactEmail: form.contactEmail.trim() || null,
        priceCents:  isFree ? 0 : (form.price.trim() ? Math.round(Number(form.price.trim()) * 100) : 0),
        isFree:      isFree || !form.price.trim() || Number(form.price.trim()) <= 0,
        capacity:    form.capacity.trim() ? Number(form.capacity.trim()) : null,
        externalTicketUrl: form.externalTicketUrl.trim() || null,
        communityId: form.communityId || null,
        hostName:    form.hostName.trim() || null,
        hostEmail:   form.hostEmail.trim() || null,
        hostPhone:   form.hostPhone.trim() || null,
        sponsors:    form.sponsors.trim() || null,
        cultureTag:  eventCultureTags.length > 0 ? eventCultureTags : undefined,
        imageUrl,
        heroImageUrl,
      });
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
        if (!url) {
          setFieldErrors({ name: 'Could not upload your image. Check your connection and try again, or remove the photo.' });
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        imageUrl = url;
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
        if (!url) {
          setFieldErrors({ name: 'Could not upload your image. Check your connection and try again, or remove the photo.' });
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        imageUrl = url;
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
        if (!url) {
          setFieldErrors({ name: 'Could not upload your image. Check your connection and try again, or remove the photo.' });
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        imageUrl = url;
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
      if (!form.date.trim()) { setFieldErrors(p => ({ ...p, date: 'Release date is required' })); return; }
      const location = deriveLocation();
      if (!location) return;
      let posterUrl = LISTING_PLACEHOLDER_IMG;
      if (imageUri) {
        const url = await uploadCoverIfNeeded();
        if (!url) {
          setFieldErrors({ name: 'Could not upload your image. Check your connection and try again, or remove the photo.' });
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        posterUrl = url;
      }
      submitMovieMutation.mutate({
        title: form.name.trim(),
        description: form.description.trim() || '—',
        language: form.language.trim() || 'English',
        duration: form.runtime.trim() || '2h',
        rating: form.movieRating.trim() || 'M',
        posterUrl,
        releaseDate: form.date.trim(),
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
        if (!url) {
          setFieldErrors({ name: 'Could not upload your image. Check your connection and try again, or remove the photo.' });
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        imageUrl = url;
      }
      const tags = form.profileTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 20);
      submitProfileMutation.mutate({
        entityType: activeTab === 'professional' ? 'organisation' : activeTab,
        name:         form.name.trim(),
        description:  form.description.trim() || null,
        city:         location.city,
        state:        location.state,
        postcode:     location.postcode,
        country:      location.country,
        latitude:     location.latitude,
        longitude:    location.longitude,
        contactEmail: form.contactEmail.trim() || null,
        phone:        form.phone.trim() || null,
        website:      form.website.trim() || null,
        category:     activeTab === 'professional' ? 'Professional' : (form.category || null),
        imageUrl,
        tags:         tags.length > 0 ? tags : undefined,
        instagram:    form.instagram.trim() ? `https://instagram.com/${form.instagram.trim().replace(/^@/, '')}` : null,
        facebook:     form.facebook.trim() ? `https://facebook.com/${form.facebook.trim()}` : null,
        youtube:      form.youtube.trim() ? `https://youtube.com/@${form.youtube.trim().replace(/^@/, '')}` : null,
        twitterX:     form.twitterX.trim() ? `https://x.com/${form.twitterX.trim().replace(/^@/, '')}` : null,
        linkedin:     form.linkedin.trim() ? `https://linkedin.com/in/${form.linkedin.trim().replace(/^@/, '')}` : null,
        airpal:       form.airpal.trim() ? `https://airpal.me/@${form.airpal.trim().replace(/^@/, '')}` : null,
      });
    }
  };

  const getCategoryOptions = (): string[] => {
    if (isEventLike(activeTab)) return EVENT_CATEGORIES;
    if (activeTab === 'organisation') return ORG_CATEGORIES;
    if (activeTab === 'professional') return [];
    if (activeTab === 'business') return BIZ_CATEGORIES;
    if (activeTab === 'artist') return ARTIST_GENRES;
    if (activeTab === 'activity') return ACTIVITY_CATEGORIES;
    if (activeTab === 'restaurant') return CUISINE_OPTIONS;
    if (activeTab === 'shop') return SHOP_CATEGORIES;
    if (activeTab === 'movie') return MOVIE_GENRES;
    return [];
  };

  const getCategorySectionLabel = (): string => {
    if (activeTab === 'artist') return 'Genre';
    if (activeTab === 'restaurant') return 'Cuisine';
    if (activeTab === 'movie') return 'Genre';
    return 'Category';
  };

  const handleSelectType = useCallback((type: SubmitType) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setActiveTab(type);
    const next = { ...initialForm };
    if (type === 'festival') next.category = 'Festival';
    else if (type === 'concert') next.category = 'Music';
    else if (type === 'workshop') next.category = 'Workshop';
    else if (type === 'professional') next.category = 'Professional';
    setForm(next);
    setImageUri(null);
    setEventCultureTags([]);
    setFieldErrors({});
    setIsFree(false);
  }, []);

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
                : "Our team will review your submission within 2\u20133 business days. You'll receive an email once approved."}
          </Text>
          <Pressable
            style={[s.successBtn, { backgroundColor: conf.color }]}
            onPress={() => setSubmitted(false)}
            accessibilityRole="button"
            accessibilityLabel="Submit another"
          >
            <Text style={s.successBtnText}>Submit Another</Text>
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
    <AuthGuard icon="add-circle-outline" title="Submit Content" message="Sign in to submit events, organisations, and more.">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
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
              <Text style={s.headerTitle}>List on CulturePass</Text>
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
                <Text style={[s.asideOverline, { color: colors.textSecondary }]}>Creator studio</Text>
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
            {/* Organizer notice — events, movies, dining & shops */}
            {(['movie', 'restaurant', 'shop'] as SubmitType[]).includes(activeTab) || isEventLike(activeTab) ? (
              !isOrganizer && !isAdmin ? (
              <View style={[s.notice, { backgroundColor: colors.surface, marginHorizontal: hPad }]}>
                <View style={[s.noticeStrip, { backgroundColor: colors.warning }]} />
                <Ionicons name="information-circle-outline" size={18} color={colors.warning} style={{ marginLeft: 12 }} />
                <Text style={[s.noticeText, { color: colors.textSecondary }]}>
                  {isEventLike(activeTab)
                    ? 'Only organizer or admin accounts can create events. Request organizer access or sign in with an eligible account.'
                    : 'Movies, dining, and shop listings require an organizer or admin account.'}
                </Text>
              </View>
              ) : null
            ) : null}

            {/* ── Cover Photo (standalone full-bleed section) ── */}
            {imageUri ? (
              <Pressable
                style={[s.mediaPrevieFull, { marginHorizontal: hPad }]}
                onPress={uploadImage}
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
                onPress={uploadImage}
                accessibilityRole="button"
                accessibilityLabel="Upload cover photo"
              >
                <View style={[s.mediaEmptyIconWrap, { backgroundColor: accent + '18' }]}>
                  <Ionicons name="image-outline" size={28} color={accent} />
                </View>
                <Text style={[s.mediaEmptyTitle, { color: colors.text }]}>Add Cover Photo</Text>
                <Text style={[s.mediaEmptySub, { color: colors.textSecondary }]}>16:9 recommended · high-resolution looks best</Text>
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
                    activeTab === 'artist'       ? 'Artist or stage name'       :
                    activeTab === 'business'     ? 'Business name'              :
                    activeTab === 'professional' ? 'Practice or studio name'    :
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
                        placeholder="YYYY-MM-DD"
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
                      <Field label="Price (AUD)">
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
                        placeholder="YYYY-MM-DD"
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
                  This creates an organisation profile with category <Text style={{ fontFamily: 'Poppins_700Bold', color: colors.text }}>Professional</Text> — ideal for accountants, lawyers, cultural consultants, and other practices.
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
                <Field label="Tags" hint="Comma-separated — e.g. Diwali, dance, Western Sydney">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={form.profileTags}
                    onChangeText={v => set('profileTags', v)}
                    placeholder="community, festival, language class…"
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

            {/* ── Submit ── */}
            <View style={[s.submitWrap, { paddingHorizontal: hPad }]}>
              <Pressable
                onPress={() => void handleSubmit()}
                disabled={isPending}
                accessibilityRole="button"
                accessibilityLabel={`Submit ${TYPE_CONFIG[activeTab].label}`}
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
                    {isPending ? 'Submitting…' : `Submit ${TYPE_CONFIG[activeTab].label}`}
                  </Text>
                </LinearGradient>
              </Pressable>
              <View style={s.submitNoteRow}>
                <Ionicons name="lock-closed-outline" size={12} color={colors.textSecondary} />
                <Text style={[s.submitNote, { color: colors.textSecondary }]}>
                  {activeTab === 'perk'
                    ? 'Your perk will be created and made available immediately.'
                    : activeTab === 'activity'
                      ? 'Activities go live after submission (subject to moderation).'
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
  headerSub:   { fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 2, opacity: 0.95 },
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
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
    opacity: 0.95,
  },
  asideTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  asideSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
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
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.2,
  },
  asideRowDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
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
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.35,
  },
  railHint: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
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
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.25,
  },
  typeCardDescPremium: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
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
  noticeText:  { fontSize: 13, fontFamily: 'Poppins_400Regular', flex: 1, lineHeight: 18 },

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
  mediaReplaceBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  mediaEmpty: {
    height: 200, borderRadius: 14, borderWidth: 2,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 12,
  },
  mediaEmptyIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  mediaEmptyTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  mediaEmptySub:   { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },

  input:    { borderRadius: 12, padding: 14, fontSize: 14, fontFamily: 'Poppins_400Regular', borderWidth: 1 },
  textArea: { minHeight: 100, paddingTop: 12 },

  inputWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  inputInner:    { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', padding: 0 },
  inputPrefix:   { fontSize: 13, fontFamily: 'Poppins_400Regular' },

  row: { flexDirection: 'row', gap: 10 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, marginVertical: 8,
  },
  toggleIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleLabel:    { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  toggleSub:      { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 },
  chipText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  submitWrap: { marginTop: 4, marginBottom: 8 },
  submitBtn:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 17,
    ...Platform.select({
      web: { boxShadow: '0px 4px 16px rgba(0,0,0,0.15)' } as object,
      default: { shadowColor: 'black', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    }),
  },
  submitBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#fff' },
  submitNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginTop: 10 },
  submitNote:    { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },

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
  successTitle: { fontSize: 24, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginTop: 4 },
  successSub:   { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, paddingHorizontal: 8, marginBottom: 8 },
  successBtn:        { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  successBtnText:    { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#fff' },
  successBtnOutline: { width: '100%', paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1, marginTop: 4 },
  successBtnOutlineText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  successTagline: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 8 },
});
