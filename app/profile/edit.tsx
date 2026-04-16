import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
  Switch,
  type ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { api, ApiError } from '@/lib/api';
import { queryClient, setAccessToken } from '@/lib/query-client';
import { auth as firebaseAuth } from '@/lib/firebase';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Button } from '@/components/ui/Button';
import { BlurView } from 'expo-blur';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import type { ISODateString } from '@/components/ui/DatePickerInput';
import { goBackOrReplace } from '@/lib/navigation';
import { Card } from '@/components/ui/Card';
import { CultureTokens, gradients, shadows, TextStyles, LiquidGlassTokens, type ColorTheme } from '@/constants/theme';
import { BackButton } from '@/components/ui/BackButton';
import { Skeleton } from '@/components/ui/Skeleton';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { communityGroups, communityFlags } from '@/constants/onboardingCommunities';
import { interestCategories } from '@/constants/onboardingInterests';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const PRIMARY = CultureTokens.indigo;
const GEM_RING = CultureTokens.gold;
const AVATAR = 104;

type EditTab = 'personal' | 'culture' | 'social';

const TABS: { id: EditTab; label: string }[] = [
  { id: 'personal', label: 'Basics' },
  { id: 'culture', label: 'Culture' },
  { id: 'social', label: 'Social & privacy' },
];

function sectionCardShadow(isDark: boolean): ViewStyle {
  if (Platform.OS === 'web') return {};
  return (
    Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: isDark ? 4 : 2 },
        shadowOpacity: isDark ? 0.22 : 0.06,
        shadowRadius: isDark ? 14 : 10,
      },
      android: { elevation: isDark ? 3 : 1 },
      default: { elevation: isDark ? 3 : 1 },
    }) ?? {}
  );
}

interface UserData {
  id: string;
  username: string;
  handle?: string | null;
  culturePassId?: string | null;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  postcode: number | null;
  country: string | null;
  location: string | null;
  avatarUrl?: string | null;
  website: string | null;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
    facebook?: string;
  } | null;
  languages?: string[] | null;
  ethnicityText?: string | null;
  dateOfBirth?: string | null;
  communities?: string[] | null;
  interests?: string[] | null;
  privacySettings?: {
    profileVisible?: boolean;
    locationVisible?: boolean;
    showSocialLinks?: boolean;
    showCommunities?: boolean;
    showInterests?: boolean;
    showCulturalIdentity?: boolean;
    privateViewingMode?: boolean;
  };
}

const COMMUNITY_CHIP_COLOR: Record<string, string> = {};
for (const g of communityGroups) {
  for (const m of g.members) COMMUNITY_CHIP_COLOR[m] = g.color;
}

function accentForInterest(interest: string): string {
  for (const cat of interestCategories) {
    if (cat.interests.includes(interest)) return cat.accentColor;
  }
  return CultureTokens.coral;
}

const SOCIAL_FIELDS: {
  icon: string;
  color: string;
  field: 'instagram' | 'twitter' | 'tiktok' | 'youtube' | 'linkedin' | 'facebook' | 'website';
  label: string;
  placeholder: string;
}[] = [
  { icon: 'logo-instagram', color: '#E4405F', field: 'instagram', label: 'Instagram', placeholder: '@username or URL' },
  { icon: 'logo-twitter', color: '#1DA1F2', field: 'twitter', label: 'X / Twitter', placeholder: '@username or URL' },
  { icon: 'logo-tiktok', color: '#010101', field: 'tiktok', label: 'TikTok', placeholder: '@username or URL' },
  { icon: 'logo-youtube', color: '#FF0000', field: 'youtube', label: 'YouTube', placeholder: 'Channel URL' },
  { icon: 'logo-linkedin', color: '#0A66C2', field: 'linkedin', label: 'LinkedIn', placeholder: 'Profile URL' },
  { icon: 'logo-facebook', color: '#1877F2', field: 'facebook', label: 'Facebook', placeholder: 'Profile URL' },
  { icon: 'globe-outline', color: PRIMARY, field: 'website', label: 'Website', placeholder: 'https://…' },
];

function SectionHeader({
  title,
  subtitle,
  colors,
}: {
  title: string;
  subtitle?: string;
  colors: ColorTheme;
}) {
  return (
    <View style={[sc.cardHeader, { borderBottomColor: colors.divider, backgroundColor: colors.primarySoft }]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={[sc.gemAccent, { backgroundColor: CultureTokens.gold }]} />
        <View style={{ flex: 1, paddingTop: 1 }}>
          <Text style={[TextStyles.callout, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>{title}</Text>
          {subtitle ? (
            <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 4, lineHeight: 18 }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  colors,
  isDark,
  index = 0,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  colors: ColorTheme;
  isDark: boolean;
  index?: number;
}) {
  const inner = (
    <>
      <SectionHeader title={title} subtitle={subtitle} colors={colors} />
      <View style={sc.cardBody}>{children}</View>
    </>
  );

  return (
    <Animated.View entering={FadeInDown.delay(70 + index * 35).duration(380)} style={sc.cardRoot}>
      <LiquidGlassPanel
        borderRadius={LiquidGlassTokens.corner.mainCard}
        bordered
        style={sc.glassCard}
        contentStyle={sc.cardBody}
      >
        {inner}
      </LiquidGlassPanel>
    </Animated.View>
  );
}

function FieldRow({
  label,
  colors,
  children,
}: {
  label: string;
  colors: ColorTheme;
  children: React.ReactNode;
}) {
  return (
    <View style={fr.wrap}>
      <Text style={[fr.label, { color: colors.textTertiary }]}>{label}</Text>
      {children}
    </View>
  );
}

function IdentityPills({
  user,
  onCopied,
}: {
  user: UserData | undefined;
  onCopied: (label: string) => void;
}) {
  const pills: { key: string; icon: keyof typeof Ionicons.glyphMap; label: string; value: string; copy: string }[] = [];
  if (user?.culturePassId?.trim()) {
    pills.push({
      key: 'cpid',
      icon: 'diamond-outline',
      label: 'Member ID',
      value: user.culturePassId.trim(),
      copy: user.culturePassId.trim(),
    });
  }
  if (user?.handle?.trim()) {
    const h = user.handle.trim().replace(/^@/, '');
    pills.push({
      key: 'handle',
      icon: 'at-outline',
      label: 'Handle',
      value: `@${h}`,
      copy: `@${h}`,
    });
  }
  if (!pills.length) return null;

  return (
    <View style={id.pillRow}>
      {pills.map((p) => (
        <Pressable
          key={p.key}
          onPress={async () => {
            await Clipboard.setStringAsync(p.copy);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            onCopied(p.label);
          }}
          style={({ pressed }) => [
            id.pill,
            Platform.OS === 'ios' && pressed ? { opacity: 0.85 } : null,
          ]}
          {...(Platform.OS === 'android'
            ? { android_ripple: { color: 'rgba(255,255,255,0.2)', borderless: false } }
            : {})}
          accessibilityRole="button"
          accessibilityLabel={`Copy ${p.label}`}
        >
          <Ionicons name={p.icon} size={14} color="rgba(255,255,255,0.95)" />
          <Text style={id.pillText} numberOfLines={1}>
            {p.value}
          </Text>
          <Ionicons name="copy-outline" size={14} color="rgba(255,255,255,0.7)" />
        </Pressable>
      ))}
    </View>
  );
}

const sc = StyleSheet.create({
  cardRoot: { marginBottom: 14 },
  cardHeader: { paddingHorizontal: 18, paddingVertical: 14 },
  gemAccent: { width: 3, height: 36, borderRadius: 2, marginTop: 2 },
  cardBody: { paddingHorizontal: 18, paddingVertical: 16, gap: 14 },
});

const fr = StyleSheet.create({
  wrap: { gap: 8 },
  label: { ...TextStyles.badge, letterSpacing: 0.4 },
});

const id = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 10,
    maxWidth: 420,
    alignSelf: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  pillText: {
    ...TextStyles.captionSemibold,
    color: 'rgba(255,255,255,0.95)',
    maxWidth: 200,
  },
});

function ProfileEditSkeleton({
  topInset,
  insets,
  colors,
  isDesktop,
}: {
  topInset: number;
  insets: EdgeInsets;
  colors: ColorTheme;
  isDesktop: boolean;
}) {
  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.topBar, { paddingTop: topInset + 8, borderBottomColor: colors.borderLight }]}>
        <Skeleton width={38} height={38} borderRadius={11} />
        <Skeleton width={120} height={24} borderRadius={6} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={38} height={38} borderRadius={11} />
          <Skeleton width={68} height={38} borderRadius={11} />
        </View>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, isDesktop && s.scrollDesktop, { paddingBottom: insets.bottom + 48 }]}>
        <View style={s.heroWrap}>
          <Skeleton width={112} height={112} borderRadius={56} style={s.avatarBtn} />
          <Skeleton width={180} height={28} borderRadius={8} style={{ marginBottom: 8 }} />
          <Skeleton width={140} height={16} borderRadius={4} />
        </View>

        <View style={[s.body, isDesktop && s.bodyDesktop]}>
          {[1, 2, 3].map((i) => (
            <Card key={i} style={{ marginBottom: 16 }} padding={20}>
              <View style={{ gap: 20 }}>
                <View style={{ gap: 8 }}>
                  <Skeleton width={100} height={12} />
                  <Skeleton width="100%" height={52} borderRadius={14} />
                </View>
                <View style={{ gap: 8 }}>
                  <Skeleton width={80} height={12} />
                  <Skeleton width="100%" height={52} borderRadius={14} />
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default function EditProfileScreen() {
  const colors = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const { isDesktop, hPad } = useLayout();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const { userId, user: authUser, isRestoring, accessToken, refreshSession } = useAuth();
  const [copyToast, setCopyToast] = useState<string | null>(null);

  useEffect(() => {
    if (!copyToast) return;
    const t = setTimeout(() => setCopyToast(null), 2000);
    return () => clearTimeout(t);
  }, [copyToast]);

  const {
    data: user,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery<UserData>({
    queryKey: ['/api/auth/me', 'profile-edit', userId],
    enabled: Boolean(userId) && Boolean(accessToken) && !isRestoring,
    queryFn: async () => {
      if (firebaseAuth?.currentUser) {
        const t = await firebaseAuth.currentUser.getIdToken();
        setAccessToken(t);
      }
      return api.auth.me() as Promise<UserData>;
    },
  });

  const [activeTab, setActiveTab] = useState<EditTab>('personal');
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    phone: '',
    bio: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Australia',
    website: '',
    instagram: '',
    twitter: '',
    tiktok: '',
    youtube: '',
    linkedin: '',
    facebook: '',
    languages: '',
    ethnicityText: '',
    dateOfBirth: '',
    isPublicProfile: true,
    showLocation: true,
    showSocialLinks: true,
    showCommunities: true,
    showInterests: true,
    showCulturalIdentity: true,
    privateViewingMode: false,
  });
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        city: user.city || '',
        state: user.state || '',
        postcode: user.postcode != null ? String(user.postcode) : '',
        country: user.country || 'Australia',
        website: user.website || '',
        instagram: user.socialLinks?.instagram || '',
        twitter: user.socialLinks?.twitter || '',
        tiktok: user.socialLinks?.tiktok || '',
        youtube: user.socialLinks?.youtube || '',
        linkedin: user.socialLinks?.linkedin || '',
        facebook: user.socialLinks?.facebook || '',
        languages: (user.languages ?? []).join(', '),
        ethnicityText: user.ethnicityText || '',
        dateOfBirth: user.dateOfBirth || '',
        isPublicProfile: user.privacySettings?.profileVisible ?? true,
        showLocation: user.privacySettings?.locationVisible ?? true,
        showSocialLinks: user.privacySettings?.showSocialLinks ?? true,
        showCommunities: user.privacySettings?.showCommunities ?? true,
        showInterests: user.privacySettings?.showInterests ?? true,
        showCulturalIdentity: user.privacySettings?.showCulturalIdentity ?? true,
        privateViewingMode: user.privacySettings?.privateViewingMode ?? false,
      });
      setSelectedCommunities(user.communities ?? []);
      setSelectedInterests(user.interests ?? []);
      setAvatarUri(user.avatarUrl || null);
    }
  }, [user]);

  useEffect(() => {
    if (user || !authUser) return;
    setForm((prev) => ({
      ...prev,
      displayName: authUser.displayName || prev.displayName,
      email: authUser.email || prev.email,
      phone: (authUser as UserData).phone || prev.phone,
      bio: authUser.bio || prev.bio,
      city: authUser.city || prev.city,
      state: authUser.state || prev.state,
      postcode: authUser.postcode != null ? String(authUser.postcode) : prev.postcode,
      country: authUser.country || prev.country || 'Australia',
      website: authUser.website || prev.website,
      instagram: authUser.socialLinks?.instagram || prev.instagram,
      twitter: authUser.socialLinks?.twitter || prev.twitter,
      tiktok: authUser.socialLinks?.tiktok || prev.tiktok,
      youtube: authUser.socialLinks?.youtube || prev.youtube,
      linkedin: authUser.socialLinks?.linkedin || prev.linkedin,
      facebook: authUser.socialLinks?.facebook || prev.facebook,
      languages:
        (authUser.languages?.length ?? 0) > 0 ? (authUser.languages ?? []).join(', ') : prev.languages,
      ethnicityText: authUser.ethnicityText || prev.ethnicityText,
      isPublicProfile: authUser.privacySettings?.profileVisible ?? prev.isPublicProfile,
      showLocation: authUser.privacySettings?.locationVisible ?? prev.showLocation,
      showSocialLinks: authUser.privacySettings?.showSocialLinks ?? prev.showSocialLinks,
      showCommunities: authUser.privacySettings?.showCommunities ?? prev.showCommunities,
      showInterests: authUser.privacySettings?.showInterests ?? prev.showInterests,
      showCulturalIdentity: authUser.privacySettings?.showCulturalIdentity ?? prev.showCulturalIdentity,
      privateViewingMode: authUser.privacySettings?.privateViewingMode ?? prev.privateViewingMode,
    }));
    if (authUser.avatarUrl) setAvatarUri(authUser.avatarUrl);
  }, [user, authUser]);

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (!userId) throw new Error('Not authenticated');
      await api.users.update(userId, data as Partial<import('@/shared/schema').User>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Your profile has been updated.');
      goBackOrReplace('/(tabs)');
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const { uploadImage, deleteImage, uploading } = useImageUpload();
  const isBusy = updateMutation.isPending || uploading;

  const handleChoosePhoto = async () => {
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo access to upload your profile image.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]?.uri && userId) {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        if (user?.avatarUrl) {
          await deleteImage('users', userId, user.avatarUrl, 'avatarUrl');
        }
        const { downloadURL } = await uploadImage(result, 'users', userId, 'avatarUrl');
        setAvatarUri(downloadURL);
      } catch (err) {
        Alert.alert('Upload Failed', String(err));
      }
    }
  };

  const handleDrop = (event: { preventDefault?: () => void; dataTransfer?: { files?: FileList }; nativeEvent?: { dataTransfer?: { files?: FileList } } }) => {
    if (Platform.OS !== 'web') return;
    event.preventDefault?.();
    const dt = event?.dataTransfer || event?.nativeEvent?.dataTransfer;
    const file = dt?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUri(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.displayName.trim()) {
      Alert.alert('Required', 'Please enter your display name.');
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const city = form.city.trim();
    const country = form.country.trim() || 'Australia';
    const formatLink = (url: string, domain: string) => {
      if (!url.trim()) return undefined;
      const clean = url.trim().replace(/^@/, '');
      return clean.startsWith('http') ? clean : `https://${domain}/${clean}`;
    };

    updateMutation.mutate({
      displayName: form.displayName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      bio: form.bio.trim() || null,
      city: city || null,
      state: form.state.trim().toUpperCase() || null,
      postcode: form.postcode.trim() ? Number(form.postcode.trim()) : null,
      country,
      location: city ? `${city}, ${country}` : null,
      avatarUrl: avatarUri,
      website: form.website.trim() || null,
      socialLinks: {
        instagram: formatLink(form.instagram, 'instagram.com'),
        twitter: formatLink(form.twitter, 'x.com'),
        tiktok: formatLink(form.tiktok, 'tiktok.com/@'),
        youtube: formatLink(form.youtube, 'youtube.com/@'),
        linkedin: formatLink(form.linkedin, 'linkedin.com/in'),
        facebook: formatLink(form.facebook, 'facebook.com'),
      },
      languages: form.languages.trim() ? form.languages.split(',').map((l) => l.trim()).filter(Boolean) : [],
      ethnicityText: form.ethnicityText.trim() || null,
      dateOfBirth: form.dateOfBirth || null,
      communities: selectedCommunities,
      interests: selectedInterests,
      privacySettings: {
        profileVisible: form.isPublicProfile,
        locationVisible: form.showLocation,
        showSocialLinks: form.showSocialLinks,
        showCommunities: form.showCommunities,
        showInterests: form.showInterests,
        showCulturalIdentity: form.showCulturalIdentity,
        privateViewingMode: form.privateViewingMode,
      },
    });
  };

  const field = (f: keyof typeof form) => (v: string) => setForm((p) => ({ ...p, [f]: v }));

  const initials = (form.displayName || user?.username || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const inputStyle = [
    s.input,
    {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.primarySoft,
      borderColor: colors.borderLight,
      color: colors.text,
    },
  ];

  const inputExtras = useMemo(
    () => ({
      selectionColor: PRIMARY,
      underlineColorAndroid: 'transparent' as const,
      ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : {}),
    }),
    [],
  );

  const bioInputExtras = useMemo(
    () => ({
      selectionColor: PRIMARY,
      underlineColorAndroid: 'transparent' as const,
      textAlignVertical: 'top' as const,
    }),
    [],
  );

  const onIdentityCopied = useCallback((label: string) => {
    setCopyToast(`${label} copied`);
  }, []);

  if (isRestoring || (Boolean(userId) && isPending && !user)) {
    return <ProfileEditSkeleton topInset={topInset} insets={insets} colors={colors} isDesktop={isDesktop} />;
  }

  if (!userId && !isRestoring) {
    return null;
  }

  return (
    <ErrorBoundary>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS !== 'web'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? topInset + 6 : 0}
    >
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.topBar, { paddingTop: topInset + 8, borderBottomColor: colors.borderLight, paddingHorizontal: hPad }]}>
          <BackButton fallback="/(tabs)" style={[s.topBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} />

          <View style={s.topCenter}>
            <Text style={[TextStyles.headline, { color: colors.text }]}>Edit profile</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => router.push(`/profile/${userId}`)}
              style={[s.topBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              accessibilityRole="button"
              accessibilityLabel="Preview profile"
              {...(Platform.OS === 'android'
                ? { android_ripple: { color: `${PRIMARY}22`, borderless: true } }
                : {})}
            >
              <Ionicons name="eye-outline" size={18} color={PRIMARY} />
            </Pressable>

            <Button variant="primary" size="sm" onPress={handleSave} loading={isBusy} style={{ backgroundColor: PRIMARY, minWidth: 72 }}>
              Save
            </Button>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={[
            s.scroll,
            isDesktop && s.scrollDesktop,
            { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 48 : 56) },
          ]}
        >
          {isError ? (
            <View
              style={[s.loadError, { backgroundColor: colors.error + '14', borderColor: colors.error + '40', marginHorizontal: hPad }]}
              accessibilityRole="alert"
            >
              <Text style={[TextStyles.callout, { color: colors.text }]}>
                {error instanceof ApiError ? error.message : 'Could not load your profile from the server.'}
              </Text>
              {error instanceof ApiError && error.isUnauthorized ? (
                <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 6 }]}>
                  If you are signed in, your session token may not have reached the API (common after a web refresh). Try
                  refreshing your session, or sign in again. If you pointed the app at a local Functions URL, either run the
                  full Firebase emulator suite with matching Auth, or use production Auth + EXPO_PUBLIC_API_URL to hosted
                  Functions.
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                <Button variant="outline" size="sm" onPress={() => void refetch()} accessibilityLabel="Retry loading profile">
                  Retry
                </Button>
                {error instanceof ApiError && error.isUnauthorized ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onPress={() => {
                        void refreshSession()
                          .then(() => void refetch())
                          .catch(() => {});
                      }}
                      accessibilityLabel="Refresh session token"
                    >
                      Refresh session
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={() =>
                        router.push({
                          pathname: '/(onboarding)/login',
                          params: { redirectTo: '/profile/edit' },
                        })
                      }
                      accessibilityLabel="Sign in"
                    >
                      Sign in
                    </Button>
                  </>
                ) : null}
              </View>
            </View>
          ) : null}

          {copyToast ? (
            <View style={[s.toast, { backgroundColor: colors.text, alignSelf: 'center' }]} accessibilityLiveRegion="polite">
              <Text style={[TextStyles.caption, { color: colors.textInverse, fontFamily: 'Poppins_600SemiBold' }]}>{copyToast}</Text>
            </View>
          ) : null}

          <Animated.View entering={FadeInUp.duration(480)} style={s.heroWrap}>
            <LinearGradient
              colors={gradients.midnight as unknown as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.25)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0.5, y: 0.6 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={[s.heroOrb, { backgroundColor: `${CultureTokens.teal}22` }]} />
            <View style={[s.heroOrbSecondary, { backgroundColor: `${CultureTokens.gold}18` }]} />

            <Pressable
              style={s.avatarBtn}
              onPress={handleChoosePhoto}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              {...(Platform.OS === 'android'
                ? { android_ripple: { color: `${PRIMARY}30`, borderless: false } }
                : {})}
              {...(Platform.OS === 'web'
                ? {
                    onDrop: handleDrop,
                    onDragOver: (e: { preventDefault: () => void }) => e.preventDefault(),
                  }
                : {})}
            >
              <LinearGradient
                colors={[`${GEM_RING}55`, `${PRIMARY}33`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.avatarRingOuter}
              >
                <View style={[s.avatarRing, { borderColor: GEM_RING, backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 }}
                      contentFit="cover"
                    />
                  ) : (
                    <LinearGradient colors={['#1A3D70', '#0E2040']} style={StyleSheet.absoluteFill}>
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={[TextStyles.title, { color: colors.textOnBrandGradient }]}>{initials}</Text>
                      </View>
                    </LinearGradient>
                  )}
                </View>
              </LinearGradient>

              <View style={[s.cameraBadge, { backgroundColor: GEM_RING, borderColor: PRIMARY }]}>
                {uploading ? <ActivityIndicator size="small" color={PRIMARY} /> : <Ionicons name="camera" size={14} color={PRIMARY} />}
              </View>
            </Pressable>

            <Text style={[TextStyles.title2, { color: colors.textOnBrandGradient, textAlign: 'center' }]}>
              {form.displayName || user?.username || 'Your name'}
            </Text>
            <Text style={[TextStyles.caption, { color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginTop: 4 }]}>
              {Platform.OS === 'web' ? 'Tap or drop a photo to update' : 'Tap to update your photo'}
            </Text>

            <IdentityPills user={user} onCopied={onIdentityCopied} />
          </Animated.View>

          {isDesktop ? (
            <View style={[s.tabRail, s.tabRailDesktop, { paddingHorizontal: hPad }]}>
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveTab(tab.id);
                    }}
                    style={[
                      s.tabBtn,
                      s.tabBtnDesktop,
                      {
                        borderColor: active ? PRIMARY : colors.borderLight,
                        backgroundColor: active ? colors.primarySoft : colors.backgroundSecondary,
                      },
                    ]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    {...(Platform.OS === 'android'
                      ? { android_ripple: { color: `${PRIMARY}18`, borderless: false } }
                      : {})}
                  >
                    <Text
                      style={[
                        s.tabLabel,
                        { color: active ? PRIMARY : colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[s.tabRailScroll, { paddingHorizontal: hPad }]}
              accessibilityRole="tablist"
            >
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveTab(tab.id);
                    }}
                    style={[
                      s.tabBtn,
                      {
                        borderColor: active ? PRIMARY : colors.borderLight,
                        backgroundColor: active ? colors.primarySoft : colors.backgroundSecondary,
                      },
                    ]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    {...(Platform.OS === 'android'
                      ? { android_ripple: { color: `${PRIMARY}18`, borderless: false } }
                      : {})}
                  >
                    <Text
                      style={[
                        s.tabLabel,
                        { color: active ? PRIMARY : colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <View style={[s.body, { paddingHorizontal: hPad }, isDesktop && s.bodyDesktop]}>
            {activeTab === 'personal' ? (
              <>
                <SectionCard
                  title="About you"
                  subtitle="What others see first on your public profile."
                  colors={colors}
                  isDark={isDark}
                  index={0}
                >
                  <FieldRow label="Display name *" colors={colors}>
                    <TextInput
                      style={inputStyle}
                      value={form.displayName}
                      onChangeText={field('displayName')}
                      placeholder="Your name"
                      placeholderTextColor={colors.textTertiary}
                      accessibilityLabel="Display name"
                      {...inputExtras}
                    />
                  </FieldRow>

                  <FieldRow label="Email" colors={colors}>
                    <TextInput
                      style={inputStyle}
                      value={form.email}
                      onChangeText={field('email')}
                      placeholder="your@email.com"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      accessibilityLabel="Email"
                      {...inputExtras}
                    />
                  </FieldRow>

                  <FieldRow label="Phone" colors={colors}>
                    <TextInput
                      style={inputStyle}
                      value={form.phone}
                      onChangeText={field('phone')}
                      placeholder="+61 400 000 000"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="phone-pad"
                      accessibilityLabel="Phone"
                      {...inputExtras}
                    />
                  </FieldRow>

                  <FieldRow label="Date of birth" colors={colors}>
                    <DatePickerInput
                      value={form.dateOfBirth}
                      onChangeDate={(iso: ISODateString) => setForm((p) => ({ ...p, dateOfBirth: iso }))}
                      placeholder="Optional"
                      maxDate={new Date().toISOString().slice(0, 10)}
                      accessibilityLabel="Date of birth"
                    />
                  </FieldRow>

                  <FieldRow label="Bio" colors={colors}>
                    <TextInput
                      style={[inputStyle, s.bioInput]}
                      value={form.bio}
                      onChangeText={field('bio')}
                      placeholder="A short line about what you love in culture and community…"
                      placeholderTextColor={colors.textTertiary}
                      multiline
                      numberOfLines={4}
                      maxLength={280}
                      accessibilityLabel="Bio"
                      {...bioInputExtras}
                    />
                    <Text style={[s.charCount, { color: colors.textTertiary }]}>
                      {form.bio.length}/280
                    </Text>
                  </FieldRow>
                </SectionCard>

                <SectionCard title="Location" subtitle="Used for nearby events and local discovery." colors={colors} isDark={isDark} index={1}>
                  <View style={s.twoCol}>
                    <View style={{ flex: 1 }}>
                      <FieldRow label="City" colors={colors}>
                        <TextInput
                          style={inputStyle}
                          value={form.city}
                          onChangeText={field('city')}
                          placeholder="Sydney"
                          placeholderTextColor={colors.textTertiary}
                          accessibilityLabel="City"
                          {...inputExtras}
                        />
                      </FieldRow>
                    </View>
                    <View style={{ flex: 1 }}>
                      <FieldRow label="State" colors={colors}>
                        <TextInput
                          style={inputStyle}
                          value={form.state}
                          onChangeText={field('state')}
                          placeholder="NSW"
                          placeholderTextColor={colors.textTertiary}
                          autoCapitalize="characters"
                          accessibilityLabel="State"
                          {...inputExtras}
                        />
                      </FieldRow>
                    </View>
                  </View>
                  <View style={s.twoCol}>
                    <View style={{ flex: 1 }}>
                      <FieldRow label="Postcode" colors={colors}>
                        <TextInput
                          style={inputStyle}
                          value={form.postcode}
                          onChangeText={field('postcode')}
                          placeholder="2000"
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="number-pad"
                          accessibilityLabel="Postcode"
                          {...inputExtras}
                        />
                      </FieldRow>
                    </View>
                    <View style={{ flex: 1 }}>
                      <FieldRow label="Country" colors={colors}>
                        <TextInput
                          style={inputStyle}
                          value={form.country}
                          onChangeText={field('country')}
                          placeholder="Australia"
                          placeholderTextColor={colors.textTertiary}
                          accessibilityLabel="Country"
                          {...inputExtras}
                        />
                      </FieldRow>
                    </View>
                  </View>
                </SectionCard>
              </>
            ) : null}

            {activeTab === 'culture' ? (
              <>
                <SectionCard
                  title="Cultural profile"
                  subtitle="Helps us tune recommendations and community matches."
                  colors={colors}
                  isDark={isDark}
                  index={0}
                >
                  <FieldRow label="Languages" colors={colors}>
                    <TextInput
                      style={inputStyle}
                      value={form.languages}
                      onChangeText={field('languages')}
                      placeholder="Comma-separated, e.g. English, Hindi"
                      placeholderTextColor={colors.textTertiary}
                      accessibilityLabel="Languages"
                      {...inputExtras}
                    />
                  </FieldRow>
                  <FieldRow label="Cultural background" colors={colors}>
                    <TextInput
                      style={inputStyle}
                      value={form.ethnicityText}
                      onChangeText={field('ethnicityText')}
                      placeholder="Optional — however you describe your heritage"
                      placeholderTextColor={colors.textTertiary}
                      accessibilityLabel="Cultural background"
                      {...inputExtras}
                    />
                  </FieldRow>
                </SectionCard>

                <SectionCard title="Communities" subtitle="Diaspora and cultural groups you identify with." colors={colors} isDark={isDark} index={1}>
                  {selectedCommunities.length === 0 ? (
                    <View style={{ gap: 6 }}>
                      <Text style={[TextStyles.callout, { color: colors.textSecondary, lineHeight: 22 }]}>
                        None saved on your profile yet.
                      </Text>
                      <Text style={[TextStyles.caption, { color: colors.textTertiary, lineHeight: 18 }]}>
                        Join communities from the Community tab; your choices sync to your profile.
                      </Text>
                    </View>
                  ) : (
                    <View style={chip.row} accessibilityRole="list">
                      {selectedCommunities.map((community) => {
                        const bg = COMMUNITY_CHIP_COLOR[community] ?? PRIMARY;
                        const flag = communityFlags[community] ?? '🌐';
                        return (
                          <View
                            key={community}
                            style={[chip.chip, chip.chipReadOnly, { backgroundColor: bg, borderColor: bg }]}
                            accessibilityRole="text"
                            accessibilityLabel={community}
                          >
                            <Text style={chip.flag}>{flag}</Text>
                            <Text style={[chip.label, { color: '#fff' }]} numberOfLines={2}>
                              {community}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </SectionCard>

                <SectionCard title="Interests" subtitle="Events and scenes you care about." colors={colors} isDark={isDark} index={2}>
                  {selectedInterests.length === 0 ? (
                    <View style={{ gap: 6 }}>
                      <Text style={[TextStyles.callout, { color: colors.textSecondary, lineHeight: 22 }]}>
                        None saved on your profile yet.
                      </Text>
                      <Text style={[TextStyles.caption, { color: colors.textTertiary, lineHeight: 18 }]}>
                        Pick interests during onboarding or as we add profile editing for tags.
                      </Text>
                    </View>
                  ) : (
                    <View style={chip.row} accessibilityRole="list">
                      {selectedInterests.map((interest) => {
                        const bg = accentForInterest(interest);
                        return (
                          <View
                            key={interest}
                            style={[chip.chip, chip.chipReadOnly, { backgroundColor: bg, borderColor: bg }]}
                            accessibilityRole="text"
                            accessibilityLabel={interest}
                          >
                            <Text style={[chip.label, { color: '#fff' }]} numberOfLines={2}>
                              {interest}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </SectionCard>
              </>
            ) : null}

            {activeTab === 'social' ? (
              <>
                <SectionCard
                  title="Visibility"
                  subtitle="Who can find you and what appears on your public page."
                  colors={colors}
                  isDark={isDark}
                  index={0}
                >
                  {(
                    [
                      {
                        key: 'isPublicProfile' as const,
                        label: 'Public profile',
                        desc: 'Allow others to search and open your profile.',
                      },
                      {
                        key: 'showLocation' as const,
                        label: 'Show city',
                        desc: 'Display your city on your public profile.',
                      },
                      {
                        key: 'privateViewingMode' as const,
                        label: 'Private viewing',
                        desc: "Don't show your name when you browse other profiles.",
                      },
                    ] as const
                  ).map(({ key, label, desc }, i, arr) => (
                    <View
                      key={key}
                      style={[s.privacyRow, i < arr.length - 1 && { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth }]}
                    >
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text style={[TextStyles.callout, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>{label}</Text>
                        <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}>{desc}</Text>
                      </View>
                      <Switch
                        value={Boolean(form[key])}
                        onValueChange={(v) => {
                          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setForm((p) => ({ ...p, [key]: v }));
                        }}
                        trackColor={{ true: PRIMARY, false: colors.borderLight }}
                        thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                      />
                    </View>
                  ))}
                </SectionCard>

                <SectionCard
                  title="Profile details"
                  subtitle="Fine-grain what visitors see when your profile is public."
                  colors={colors}
                  isDark={isDark}
                  index={1}
                >
                  {(
                    [
                      {
                        key: 'showSocialLinks' as const,
                        label: 'Social links',
                        desc: 'Website, Instagram, X, and other links.',
                      },
                      {
                        key: 'showCommunities' as const,
                        label: 'Communities',
                        desc: 'Cultural groups you selected.',
                      },
                      {
                        key: 'showInterests' as const,
                        label: 'Interests',
                        desc: 'Activity tags from the Culture tab.',
                      },
                      {
                        key: 'showCulturalIdentity' as const,
                        label: 'Languages & background',
                        desc: 'Languages and cultural background fields.',
                      },
                    ] as const
                  ).map(({ key, label, desc }, i, arr) => (
                    <View
                      key={key}
                      style={[s.privacyRow, i < arr.length - 1 && { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth }]}
                    >
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text style={[TextStyles.callout, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>{label}</Text>
                        <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}>{desc}</Text>
                      </View>
                      <Switch
                        value={Boolean(form[key])}
                        onValueChange={(v) => {
                          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setForm((p) => ({ ...p, [key]: v }));
                        }}
                        trackColor={{ true: PRIMARY, false: colors.borderLight }}
                        thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                      />
                    </View>
                  ))}
                </SectionCard>

                <SectionCard title="Social & web" subtitle="Optional — only shown if you enable social links." colors={colors} isDark={isDark} index={2}>
                  {SOCIAL_FIELDS.map(({ icon, color, field: f, label, placeholder }) => (
                    <View key={f} style={s.socialRow}>
                      <View style={[s.socialIcon, { backgroundColor: color + '18' }]}>
                        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[fr.label, { color: colors.textTertiary, marginBottom: 4 }]}>{label}</Text>
                        <TextInput
                          style={inputStyle}
                          value={form[f]}
                          onChangeText={(v) => setForm((p) => ({ ...p, [f]: v }))}
                          placeholder={placeholder}
                          placeholderTextColor={colors.textTertiary}
                          autoCapitalize="none"
                          keyboardType="url"
                          accessibilityLabel={label}
                          {...inputExtras}
                        />
                      </View>
                    </View>
                  ))}
                </SectionCard>
              </>
            ) : null}

            <Animated.View entering={FadeInDown.delay(200).duration(420)}>
              <Button
                variant="gradient"
                gradientColors={gradients.culturepassBrand as unknown as [string, string]}
                size="lg"
                leftIcon="checkmark-circle"
                onPress={handleSave}
                loading={isBusy}
                style={s.saveBtn}
                labelStyle={TextStyles.headline}
              >
                Save profile
              </Button>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: { minWidth: 52, minHeight: 52 },
      default: {},
    }),
  },
  topCenter: { flex: 1, alignItems: 'center' },
  scroll: { flexGrow: 1 },
  scrollDesktop: { paddingHorizontal: 0 },
  loadError: {
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: 12,
  },
  toast: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  heroWrap: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  heroOrbSecondary: {
    position: 'absolute',
    bottom: -40,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  avatarBtn: { position: 'relative', marginBottom: 16 },
  avatarRingOuter: {
    padding: 4,
    borderRadius: 999,
  },
  avatarRing: {
    width: AVATAR + 12,
    height: AVATAR + 12,
    borderRadius: (AVATAR + 12) / 2,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    backgroundColor: CultureTokens.indigo,
  },
  tabRail: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  tabRailScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    flexGrow: 1,
  },
  tabRailDesktop: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  tabBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    minWidth: 110,
  },
  tabBtnDesktop: {
    flex: 1,
    alignItems: 'center',
  },
  tabLabel: {
    ...TextStyles.chip,
    textAlign: 'center',
    fontSize: 15,
  },
  body: { 
    paddingTop: 8, 
    gap: 32, 
    paddingHorizontal: 20, 
    paddingBottom: 40 
  },
  bodyDesktop: { maxWidth: 720, width: '100%', alignSelf: 'center', paddingHorizontal: 0 },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    ...TextStyles.callout,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bioInput: { 
    height: 120, 
    paddingTop: 16, 
    paddingBottom: 16,
    textAlignVertical: 'top' as const,
  },
  charCount: { 
    fontSize: 12, 
    fontFamily: 'Poppins_400Regular', 
    textAlign: 'right', 
    marginTop: 6,
    opacity: 0.6,
  },
  twoCol: { flexDirection: 'row', gap: 16 },
  socialRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  socialIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 28,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 32,
    ...Platform.select({
      web: { boxShadow: '0px 8px 32px rgba(0,102,204,0.25)' },
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      default: { elevation: 8 },
    }),
  },
});

const chip = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: '100%',
  },
  chipReadOnly: {
    flexShrink: 1,
  },
  flag: { fontSize: 13 },
  label: { fontSize: 12, fontFamily: 'Poppins_500Medium', flexShrink: 1 },
});
