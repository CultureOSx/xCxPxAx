import React, { useState, useCallback, useEffect } from 'react';
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
import { apiRequest, queryClient, getApiUrl, getAccessToken } from '@/lib/query-client';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from '@/lib/image-manipulator';
import { fetch } from 'expo/fetch';
import { useRole } from '@/hooks/useRole';
import { AuthGuard } from '@/components/AuthGuard';
import { CultureTokens } from '@/constants/theme';
import { useLayout } from '@/hooks/useLayout';
import { getPostcodeData, getPostcodesByPlace } from '@shared/location/australian-postcodes';

// ─── Types ────────────────────────────────────────────────────────────────────

type SubmitType = 'event' | 'organisation' | 'business' | 'artist' | 'perk';

const TYPE_CONFIG: Record<SubmitType, { label: string; description: string; icon: string; color: string }> = {
  event:        { label: 'Event',        description: 'Festivals, concerts & workshops', icon: 'calendar',     color: CultureTokens.saffron },
  organisation: { label: 'Organisation', description: 'Cultural groups & communities',   icon: 'people',       color: CultureTokens.teal    },
  business:     { label: 'Business',     description: 'Shops, restaurants & services',   icon: 'business',     color: CultureTokens.indigo  },
  artist:       { label: 'Artist',       description: 'Musicians, dancers & creatives',  icon: 'color-palette',color: CultureTokens.coral   },
  perk:         { label: 'Perk',         description: 'Discounts & member benefits',     icon: 'gift',         color: CultureTokens.gold    },
};

const EVENT_CATEGORIES   = ['Cultural', 'Music', 'Dance', 'Festival', 'Workshop', 'Religious', 'Food', 'Sports'];
const ORG_CATEGORIES     = ['Cultural', 'Religious', 'Community', 'Youth', 'Professional', 'Charity'];
const BIZ_CATEGORIES     = ['Restaurant', 'Retail', 'Services', 'Beauty', 'Tech', 'Grocery'];
const ARTIST_GENRES      = ['Music', 'Dance', 'Visual Arts', 'Theatre', 'Film', 'Literature'];
const PERK_TYPES = [
  { key: 'discount_percent', label: '% Discount',  icon: 'pricetag-outline'    },
  { key: 'discount_fixed',   label: '$ Discount',  icon: 'cash-outline'        },
  { key: 'free_ticket',      label: 'Free Ticket', icon: 'ticket-outline'      },
  { key: 'early_access',     label: 'Early Access',icon: 'time-outline'        },
  { key: 'vip_upgrade',      label: 'VIP Upgrade', icon: 'star-outline'        },
  { key: 'cashback',         label: 'Cashback',    icon: 'refresh-circle-outline' },
];
const PERK_CATEGORIES = ['tickets', 'events', 'dining', 'shopping', 'wallet'];

const initialForm = {
  name: '', description: '', city: '', state: '', postcode: '', country: 'Australia',
  contactEmail: '', phone: '', website: '', category: '', abn: '',
  instagram: '', facebook: '', youtube: '', twitterX: '', linkedin: '', airpal: '',
  date: '', time: '', venue: '', address: '',
  price: '', capacity: '', externalTicketUrl: '', communityId: '',
  hostName: '', hostEmail: '', hostPhone: '', sponsors: '',
  perkType: '', discountValue: '', providerName: '', perkCategory: '',
};

type FormState = typeof initialForm;
type FieldErrors = Partial<Record<keyof FormState | 'perkType', string>>;
type DerivedLocation = { city: string; state: string; country: string; postcode: number; latitude: number; longitude: number };

// ─── Helper components ────────────────────────────────────────────────────────

function Card({ children, colors, hPad }: { children: React.ReactNode; colors: ReturnType<typeof useColors>; hPad: number }) {
  return (
    <View style={[card.wrap, { backgroundColor: colors.surface, borderColor: colors.borderLight, marginHorizontal: hPad }]}>
      {children}
    </View>
  );
}

function SectionLabel({ label, icon, accent, colors }: { label: string; icon: string; accent: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={card.sectionHead}>
      <View style={[card.sectionIconBg, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon as never} size={14} color={accent} />
      </View>
      <Text style={[card.sectionTitle, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

function Field({
  label, required, hint, error, children,
}: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={card.field}>
      <View style={card.fieldLabelRow}>
        <Text style={[card.fieldLabel, { color: colors.textSecondary }]}>
          {label}{required ? <Text style={{ color: colors.error }}> *</Text> : null}
        </Text>
        {hint ? <Text style={[card.fieldHint, { color: colors.textTertiary }]}>{hint}</Text> : null}
      </View>
      {children}
      {error ? <Text style={[card.fieldError, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    padding: 16, marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: '0px 1px 6px rgba(0,0,0,0.06)' } as object,
      default: { shadowColor: "black", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    }),
  },
  sectionHead:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIconBg: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  field:         { marginBottom: 12 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  fieldLabel:    { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  fieldHint:     { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  fieldError:    { fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 4 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SubmitScreen() {
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const { hPad, isDesktop } = useLayout();
  const { isAdmin, isOrganizer } = useRole();
  const params  = useLocalSearchParams<{ type?: string }>();

  // Pre-select type from URL param (e.g. /submit?type=organisation)
  const initialType = ((): SubmitType => {
    const t = params.type;
    if (t && Object.keys(TYPE_CONFIG).includes(t)) return t as SubmitType;
    return 'event';
  })();

  const [activeTab, setActiveTab]   = useState<SubmitType>(initialType);
  const [form, setForm]             = useState<FormState>({ ...initialForm });
  const [isFree, setIsFree]         = useState(false);
  const [imageUri, setImageUri]     = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted]   = useState(false);
  const [submittedType, setSubmittedType] = useState<SubmitType>('event');

  const accent = TYPE_CONFIG[activeTab].color;
  const visibleTypes = (Object.keys(TYPE_CONFIG) as SubmitType[]).filter(t => t !== 'perk' || isAdmin);

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
      const res = await apiRequest('POST', '/api/events', data);
      return res.json() as Promise<Record<string, unknown>>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmittedType('event');
      setSubmitted(true);
      setForm({ ...initialForm });
      setImageUri(null);
      setIsFree(false);
    },
    onError: (err: Error) => setFieldErrors({ name: err.message }),
  });

  const submitProfileMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest('POST', '/api/profiles', data);
      return res.json() as Promise<Record<string, unknown>>;
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
      await apiRequest('POST', '/api/perks', data);
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

  const isPending = submitEventMutation.isPending || submitProfileMutation.isPending || submitPerkMutation.isPending;

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

  const uploadAndAttach = async (targetType: string, targetId: string) => {
    if (!imageUri) return;
    try {
      const processed = await manipulateAsync(imageUri, [{ resize: { width: 1600 } }], { compress: 0.9, format: SaveFormat.JPEG });
      const blobRes = await fetch(processed.uri);
      const blob = await blobRes.blob();
      const formData = new FormData();
      formData.append('image', blob as unknown as Blob, 'upload.jpg');
      const base = getApiUrl();
      const token = getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const uploadRes = await fetch(`${base}api/uploads/image`, {
        method: 'POST', body: formData, headers,
        credentials: typeof document !== 'undefined' ? 'omit' : undefined,
      });
      if (!uploadRes.ok) return;
      const uploaded = await uploadRes.json() as Record<string, unknown>;
      await apiRequest('POST', '/api/media/attach', {
        targetType, targetId,
        imageUrl: uploaded.imageUrl, thumbnailUrl: uploaded.thumbnailUrl,
        width: uploaded.width, height: uploaded.height,
      });
    } catch {}
  };

  useEffect(() => {
    const created = submitProfileMutation.data;
    if (!created?.id || !imageUri) return;
    uploadAndAttach(activeTab === 'business' ? 'business' : 'profile', String(created.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitProfileMutation.data]);

  useEffect(() => {
    const created = submitEventMutation.data;
    if (!created?.id || !imageUri) return;
    uploadAndAttach('event', String(created.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitEventMutation.data]);

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

  const handleSubmit = () => {
    const errors: FieldErrors = {};
    if (!form.name.trim()) errors.name = activeTab === 'event' ? 'Event title is required' : 'Name is required';
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) errors.contactEmail = 'Invalid email address';
    if (form.website && !/^https?:\/\/.+/.test(form.website)) errors.website = 'Must start with https://';
    if (activeTab !== 'event' && activeTab !== 'perk' && !form.contactEmail.trim()) errors.contactEmail = 'Contact email is required';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (activeTab === 'event') {
      if (!form.date.trim()) { setFieldErrors(p => ({ ...p, date: 'Date is required' })); return; }
      const location = deriveLocation();
      if (!location) return;
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
        category:    form.category || 'Cultural',
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
    } else {
      const location = deriveLocation();
      if (!location) return;
      submitProfileMutation.mutate({
        entityType:   activeTab,
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
        category:     form.category || null,
        instagram:    form.instagram.trim() ? `https://instagram.com/${form.instagram.trim().replace(/^@/, '')}` : null,
        facebook:     form.facebook.trim() ? `https://facebook.com/${form.facebook.trim()}` : null,
        youtube:      form.youtube.trim() ? `https://youtube.com/@${form.youtube.trim().replace(/^@/, '')}` : null,
        twitterX:     form.twitterX.trim() ? `https://x.com/${form.twitterX.trim().replace(/^@/, '')}` : null,
        linkedin:     form.linkedin.trim() ? `https://linkedin.com/in/${form.linkedin.trim().replace(/^@/, '')}` : null,
        airpal:       form.airpal.trim() ? `https://airpal.me/@${form.airpal.trim().replace(/^@/, '')}` : null,
      });
    }
  };

  const getCategoryOptions = () => {
    if (activeTab === 'event')        return EVENT_CATEGORIES;
    if (activeTab === 'organisation') return ORG_CATEGORIES;
    if (activeTab === 'business')     return BIZ_CATEGORIES;
    if (activeTab === 'artist')       return ARTIST_GENRES;
    return [];
  };

  // ── Success screen ─────────────────────────────────────────────────────────

  if (submitted) {
    const conf = TYPE_CONFIG[submittedType];
    return (
      <View style={[s.successRoot, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <LinearGradient colors={[conf.color + '20', 'transparent']} style={StyleSheet.absoluteFillObject} />
        <View style={[s.successCard, { backgroundColor: colors.surface, borderColor: conf.color + '30' }]}>
          <View style={[s.successIconWrap, { backgroundColor: conf.color + '15' }]}>
            <Ionicons name={conf.icon as never} size={40} color={conf.color} />
          </View>
          <View style={[s.successCheckCircle, { backgroundColor: conf.color }]}>
            <Ionicons name="checkmark" size={14} color="white" />
          </View>
          <Text style={[s.successTitle, { color: colors.text }]}>
            {submittedType === 'event' ? 'Event Submitted!'
            : submittedType === 'perk' ? 'Perk Created!'
            : 'Listing Submitted!'}
          </Text>
          <Text style={[s.successSub, { color: colors.textSecondary }]}>
            {submittedType === 'perk'
              ? 'Your perk is now active and available to members.'
              : "Our team will review your submission within 2\u20133 business days. You'll receive an email once approved."}
          </Text>
          <Pressable style={[s.successBtn, { backgroundColor: conf.color }]} onPress={() => setSubmitted(false)}>
            <Text style={s.successBtnText}>Submit Another</Text>
          </Pressable>
          <Pressable
            style={[s.successBtnOutline, { borderColor: conf.color + '50' }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={[s.successBtnOutlineText, { color: conf.color }]}>Go to Discover</Text>
          </Pressable>
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
        <View style={[s.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>

          {/* Header */}
          <View style={[s.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
              style={[s.backBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[s.headerTitle, { color: colors.text }]}>Create New</Text>
              <Text style={[s.headerSub, { color: accent }]}>{TYPE_CONFIG[activeTab].label}</Text>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              s.scroll,
              { paddingBottom: insets.bottom + 48 },
              isDesktop && s.scrollDesktop,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Type Selector ── */}
            <View style={s.typeSection}>
              <Text style={[s.typeSectionLabel, { color: colors.textSecondary, paddingHorizontal: hPad }]}>
                WHAT ARE YOU SUBMITTING?
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[s.typeScroll, { paddingHorizontal: hPad }]}
              >
                {visibleTypes.map(type => {
                  const conf = TYPE_CONFIG[type];
                  const isActive = activeTab === type;
                  return (
                    <Pressable
                      key={type}
                      style={[
                        s.typeCard,
                        {
                          backgroundColor: isActive ? conf.color : colors.surface,
                          borderColor: isActive ? conf.color : colors.borderLight,
                        },
                      ]}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.selectionAsync();
                        setActiveTab(type);
                        setForm({ ...initialForm });
                        setImageUri(null);
                        setFieldErrors({});
                        setIsFree(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={conf.label}
                    >
                      <View style={[s.typeCardIconWrap, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : conf.color + '18' }]}>
                        <Ionicons name={conf.icon as never} size={20} color={isActive ? 'white' : conf.color} />
                      </View>
                      <Text style={[s.typeCardLabel, { color: isActive ? '#fff' : colors.text }]}>{conf.label}</Text>
                      <Text style={[s.typeCardDesc, { color: isActive ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]} numberOfLines={2}>
                        {conf.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Organizer notice for events */}
            {activeTab === 'event' && !isOrganizer && (
              <View style={[s.notice, { backgroundColor: colors.warning + '12', borderColor: colors.warning + '40', marginHorizontal: hPad }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
                <Text style={[s.noticeText, { color: colors.textSecondary }]}>
                  Only organizer or admin accounts can publish events. Your submission will be saved as a draft.
                </Text>
              </View>
            )}

            {/* ── Basic Information ── */}
            <Card colors={colors} hPad={hPad}>
              <SectionLabel colors={colors} accent={accent} icon="document-text-outline" label="Basic Information" />

              <Field
                label={activeTab === 'event' ? 'Event Title' : activeTab === 'perk' ? 'Perk Title' : 'Name'}
                required
                error={fieldErrors.name}
              >
                <TextInput
                  style={[s.input, {
                    backgroundColor: colors.background,
                    borderColor: fieldErrors.name ? colors.error : colors.borderLight,
                    color: colors.text,
                  }]}
                  value={form.name}
                  onChangeText={v => set('name', v)}
                  placeholder={
                    activeTab === 'event'        ? 'e.g. Diwali Festival 2026'  :
                    activeTab === 'perk'         ? 'e.g. 20% off event tickets' :
                    activeTab === 'artist'       ? 'Artist or stage name'       :
                    activeTab === 'business'     ? 'Business name'              : 'Organisation name'
                  }
                  placeholderTextColor={colors.textTertiary}
                  returnKeyType="next"
                />
              </Field>

              <Field label="Description" hint={`${form.description.length}/500`}>
                <TextInput
                  style={[s.input, s.textArea, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                  value={form.description}
                  onChangeText={v => set('description', v)}
                  placeholder="Tell us more about this…"
                  placeholderTextColor={colors.textTertiary}
                  multiline numberOfLines={4} textAlignVertical="top" maxLength={500}
                />
              </Field>

              {/* Image upload / preview */}
              {imageUri ? (
                <Pressable
                  style={[s.mediaPreviewWrap, { borderColor: accent + '60' }]}
                  onPress={uploadImage}
                  accessibilityRole="button"
                  accessibilityLabel="Replace image"
                >
                  <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFillObject} />
                  <View style={s.mediaReplaceBtn}>
                    <Ionicons name="camera-outline" size={13} color="white" />
                    <Text style={s.mediaReplaceBtnText}>Replace Image</Text>
                  </View>
                </Pressable>
              ) : (
                <Pressable
                  style={[s.mediaEmpty, { backgroundColor: colors.background, borderColor: colors.borderLight }]}
                  onPress={uploadImage}
                  accessibilityRole="button"
                  accessibilityLabel="Upload cover image"
                >
                  <View style={[s.mediaEmptyIcon, { backgroundColor: accent + '15' }]}>
                    <Ionicons name="image-outline" size={22} color={accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.mediaEmptyTitle, { color: colors.text }]}>Add Cover Image</Text>
                    <Text style={[s.mediaEmptySub, { color: colors.textTertiary }]}>Recommended: 1600 × 900 px</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </Pressable>
              )}
            </Card>

            {/* ── Event Details ── */}
            {activeTab === 'event' && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="calendar-outline" label="Event Details" />

                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Field label="Date" required error={fieldErrors.date}>
                      <TextInput
                        style={[s.input, {
                          backgroundColor: colors.background,
                          borderColor: fieldErrors.date ? colors.error : colors.borderLight,
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
                        style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
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
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                    value={form.venue} onChangeText={v => set('venue', v)}
                    placeholder="Venue name" placeholderTextColor={colors.textTertiary}
                  />
                </Field>

                <Field label="Address">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                    value={form.address} onChangeText={v => set('address', v)}
                    placeholder="Full street address" placeholderTextColor={colors.textTertiary}
                  />
                </Field>

                {/* Free toggle */}
                <View style={[s.toggleRow, { borderTopColor: colors.divider, borderBottomColor: colors.divider }]}>
                  <View style={[s.toggleIconWrap, { backgroundColor: isFree ? accent + '18' : colors.backgroundSecondary }]}>
                    <Ionicons name="ticket-outline" size={16} color={isFree ? accent : colors.textSecondary} />
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
                          style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                          value={form.price} onChangeText={v => set('price', v)}
                          placeholder="0.00" placeholderTextColor={colors.textTertiary} keyboardType="decimal-pad"
                        />
                      </Field>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="Capacity">
                        <TextInput
                          style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                          value={form.capacity} onChangeText={v => set('capacity', v)}
                          placeholder="Unlimited" placeholderTextColor={colors.textTertiary} keyboardType="number-pad"
                        />
                      </Field>
                    </View>
                  </View>
                )}

                <Field label="External Ticket Link" hint="Optional">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                    value={form.externalTicketUrl} onChangeText={v => set('externalTicketUrl', v)}
                    placeholder="https://eventbrite.com/…" placeholderTextColor={colors.textTertiary}
                    keyboardType="url" autoCapitalize="none"
                  />
                </Field>

                <Field label="Community" hint="Optional">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                    value={form.communityId} onChangeText={v => set('communityId', v)}
                    placeholder="Community ID" placeholderTextColor={colors.textTertiary} autoCapitalize="none"
                  />
                </Field>
              </Card>
            )}

            {/* ── Host & Sponsors (event only) ── */}
            {activeTab === 'event' && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="people-circle-outline" label="Host & Sponsors" />

                <Field label="Host Name" hint="Optional">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                    value={form.hostName} onChangeText={v => set('hostName', v)}
                    placeholder="e.g. CulturePass Events Team" placeholderTextColor={colors.textTertiary}
                  />
                </Field>

                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Field label="Host Email" hint="Optional">
                      <TextInput
                        style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                        value={form.hostEmail} onChangeText={v => set('hostEmail', v)}
                        placeholder="host@example.com" placeholderTextColor={colors.textTertiary}
                        keyboardType="email-address" autoCapitalize="none"
                      />
                    </Field>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Host Phone" hint="Optional">
                      <TextInput
                        style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                        value={form.hostPhone} onChangeText={v => set('hostPhone', v)}
                        placeholder="+61 400 000 000" placeholderTextColor={colors.textTertiary}
                        keyboardType="phone-pad"
                      />
                    </Field>
                  </View>
                </View>

                <Field label="Sponsors" hint="Optional — comma-separated names">
                  <TextInput
                    style={[s.input, s.textArea, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                    value={form.sponsors} onChangeText={v => set('sponsors', v)}
                    placeholder="e.g. Brand A, Brand B, Brand C" placeholderTextColor={colors.textTertiary}
                    multiline numberOfLines={3} textAlignVertical="top"
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
                          style={[s.chip, { backgroundColor: isActive ? accent : colors.background, borderColor: isActive ? accent : colors.borderLight }]}
                          onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); set('perkType', isActive ? '' : pt.key); }}
                          accessibilityRole="button" accessibilityLabel={pt.label}
                        >
                          <Ionicons name={pt.icon as never} size={13} color={isActive ? 'white' : accent} />
                          <Text style={[s.chipText, { color: isActive ? '#fff' : colors.text }]}>{pt.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>

                {(form.perkType === 'discount_percent' || form.perkType === 'discount_fixed' || form.perkType === 'cashback') && (
                  <Field label={form.perkType === 'discount_percent' ? 'Discount (%)' : 'Amount ($)'}>
                    <TextInput
                      style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                      value={form.discountValue} onChangeText={v => set('discountValue', v)}
                      placeholder={form.perkType === 'discount_percent' ? '20' : '10'}
                      placeholderTextColor={colors.textTertiary} keyboardType="numeric"
                    />
                  </Field>
                )}

                <Field label="Provider Name">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
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
                          style={[s.chip, { backgroundColor: isActive ? accent : colors.background, borderColor: isActive ? accent : colors.borderLight }]}
                          onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); set('perkCategory', isActive ? '' : cat); }}
                          accessibilityRole="button" accessibilityLabel={cat}
                        >
                          <Text style={[s.chipText, { color: isActive ? '#fff' : colors.text }]}>
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

                <View style={s.row}>
                  <View style={{ flex: 2 }}>
                    <Field label="City" error={fieldErrors.city}>
                      <TextInput
                        style={[s.input, {
                          backgroundColor: colors.background,
                          borderColor: fieldErrors.city ? colors.error : colors.borderLight,
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
                          borderColor: fieldErrors.state ? colors.error : colors.borderLight,
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
                          borderColor: fieldErrors.postcode ? colors.error : colors.borderLight,
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
                        style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                        value={form.country} onChangeText={v => set('country', v)}
                        placeholder="Australia" placeholderTextColor={colors.textTertiary}
                      />
                    </Field>
                  </View>
                </View>
              </Card>
            )}

            {/* ── Contact Details ── */}
            {activeTab !== 'perk' && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="mail-outline" label="Contact Details" />

                <Field label="Email" required={activeTab !== 'event'} error={fieldErrors.contactEmail}>
                  <TextInput
                    style={[s.input, {
                      backgroundColor: colors.background,
                      borderColor: fieldErrors.contactEmail ? colors.error : colors.borderLight,
                      color: colors.text,
                    }]}
                    value={form.contactEmail} onChangeText={v => set('contactEmail', v)}
                    placeholder="contact@example.com" placeholderTextColor={colors.textTertiary}
                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                  />
                </Field>

                <Field label="Phone">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                    value={form.phone} onChangeText={v => set('phone', v)}
                    placeholder="+61 400 000 000" placeholderTextColor={colors.textTertiary} keyboardType="phone-pad"
                  />
                </Field>

                <Field label="Website" error={fieldErrors.website}>
                  <TextInput
                    style={[s.input, {
                      backgroundColor: colors.background,
                      borderColor: fieldErrors.website ? colors.error : colors.borderLight,
                      color: colors.text,
                    }]}
                    value={form.website} onChangeText={v => set('website', v)}
                    placeholder="https://example.com" placeholderTextColor={colors.textTertiary}
                    keyboardType="url" autoCapitalize="none"
                  />
                </Field>
              </Card>
            )}

            {/* ── Category / Genre ── */}
            {activeTab !== 'perk' && getCategoryOptions().length > 0 && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="grid-outline" label={activeTab === 'artist' ? 'Genre' : 'Category'} />
                <View style={s.chipGrid}>
                  {getCategoryOptions().map(cat => {
                    const isActive = form.category === cat;
                    return (
                      <Pressable
                        key={cat}
                        style={[s.chip, { backgroundColor: isActive ? accent : colors.background, borderColor: isActive ? accent : colors.borderLight }]}
                        onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); set('category', isActive ? '' : cat); }}
                        accessibilityRole="button" accessibilityLabel={cat}
                      >
                        <Text style={[s.chipText, { color: isActive ? '#fff' : colors.text }]}>{cat}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>
            )}

            {/* ── Business: ABN ── */}
            {activeTab === 'business' && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="card-outline" label="Business Details" />
                <Field label="ABN (Australian Business Number)">
                  <TextInput
                    style={[s.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                    value={form.abn} onChangeText={v => set('abn', v)}
                    placeholder="XX XXX XXX XXX" placeholderTextColor={colors.textTertiary} keyboardType="number-pad"
                  />
                </Field>
              </Card>
            )}

            {/* ── Social Media (organisation, business, artist) ── */}
            {activeTab !== 'event' && activeTab !== 'perk' && (
              <Card colors={colors} hPad={hPad}>
                <SectionLabel colors={colors} accent={accent} icon="share-social-outline" label="Social Media" />
                {([
                  { field: 'instagram' as const, icon: 'logo-instagram', label: 'Instagram',   prefix: 'instagram.com/'  },
                  { field: 'facebook'  as const, icon: 'logo-facebook',  label: 'Facebook',    prefix: 'facebook.com/'   },
                  { field: 'youtube'   as const, icon: 'logo-youtube',   label: 'YouTube',     prefix: 'youtube.com/@'   },
                  { field: 'twitterX'  as const, icon: 'logo-twitter',   label: 'X (Twitter)', prefix: 'x.com/'          },
                  { field: 'linkedin'  as const, icon: 'logo-linkedin',  label: 'LinkedIn',    prefix: 'linkedin.com/in/'},
                  { field: 'airpal'    as const, icon: 'person-circle-outline', label: 'AirPal', prefix: 'airpal.me/@'   },
                ] as const).map(({ field, icon, label, prefix }) => (
                  <Field key={field} label={label}>
                    <View style={[s.inputWithIcon, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
                      <Ionicons name={icon as never} size={16} color={colors.textTertiary} />
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
                style={[s.submitBtn, { backgroundColor: accent }, isPending && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={isPending}
                accessibilityRole="button"
                accessibilityLabel={`Submit ${TYPE_CONFIG[activeTab].label}`}
              >
                {isPending
                  ? <ActivityIndicator size="small" color="white" />
                  : <Ionicons name="checkmark-circle" size={20} color="white" />
                }
                <Text style={s.submitBtnText}>
                  {isPending ? 'Submitting…' : `Submit ${TYPE_CONFIG[activeTab].label}`}
                </Text>
              </Pressable>
              <Text style={[s.submitNote, { color: colors.textTertiary }]}>
                {activeTab === 'perk'
                  ? 'Your perk will be created and made available immediately.'
                  : 'All submissions are reviewed within 2–3 business days.'}
              </Text>
            </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AuthGuard>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:     { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  headerSub:   { fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginTop: 1 },

  scroll:        { paddingTop: 20 },
  scrollDesktop: { maxWidth: 720, width: '100%', alignSelf: 'center' },

  typeSection:      { marginBottom: 16 },
  typeSectionLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 0.8, marginBottom: 10 },
  typeScroll:       { gap: 10, paddingBottom: 4 },
  typeCard: {
    width: 118, borderRadius: 14, borderWidth: 1,
    padding: 14, gap: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as object, default: {} }),
  },
  typeCardIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  typeCardLabel: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  typeCardDesc:  { fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 15 },

  notice:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  noticeText: { fontSize: 13, fontFamily: 'Poppins_400Regular', flex: 1, lineHeight: 18 },

  input:    { borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Poppins_400Regular', borderWidth: 1 },
  textArea: { minHeight: 100, paddingTop: 12 },

  inputWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11 },
  inputInner:    { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', padding: 0 },
  inputPrefix:   { fontSize: 13, fontFamily: 'Poppins_400Regular' },

  row: { flexDirection: 'row', gap: 10 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  toggleIconWrap: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  toggleLabel:    { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  toggleSub:      { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },

  mediaPreviewWrap: {
    height: 150, borderRadius: 12, borderWidth: 1, overflow: 'hidden',
    position: 'relative', marginBottom: 4,
  },
  mediaReplaceBtn: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  mediaReplaceBtnText: { color: "white", fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  mediaEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 4,
  },
  mediaEmptyIcon:  { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mediaEmptyTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  mediaEmptySub:   { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  submitWrap: { marginTop: 4, marginBottom: 8 },
  submitBtn:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16,
    ...Platform.select({
      web: { boxShadow: '0px 4px 16px rgba(0,0,0,0.15)' } as object,
      default: { shadowColor: "black", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    }),
  },
  submitBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: "white" },
  submitNote:    { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 10, textAlign: 'center', lineHeight: 18 },

  // Success screen
  successRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successCard: {
    width: '100%', maxWidth: 400, borderRadius: 20, borderWidth: 1,
    padding: 28, alignItems: 'center', gap: 10,
    ...Platform.select({
      web: { boxShadow: '0px 8px 32px rgba(0,0,0,0.08)' } as object,
      default: { shadowColor: "black", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
    }),
  },
  successIconWrap:  { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  successCheckCircle: {
    width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    position: 'absolute', top: 26, left: '50%' as never, marginLeft: 16,
  },
  successTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginTop: 4 },
  successSub:   { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, paddingHorizontal: 8, marginBottom: 8 },
  successBtn:        { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  successBtnText:    { fontSize: 15, fontFamily: 'Poppins_700Bold', color: "white" },
  successBtnOutline: { width: '100%', paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1, marginTop: 4 },
  successBtnOutlineText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
});
