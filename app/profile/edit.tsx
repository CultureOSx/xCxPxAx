import {
  View, Text, Pressable, StyleSheet, ScrollView, Platform,
  TextInput, Alert, KeyboardAvoidingView, ActivityIndicator, Switch
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, buildApiUrl, queryClient, getAccessToken } from '@/lib/query-client';
import { api } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from '@/lib/image-manipulator';
import { fetch } from 'expo/fetch';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Button } from '@/components/ui/Button';
import { goBackOrReplace } from '@/lib/navigation';
import { Card } from '@/components/ui/Card';
import { TextStyles } from '@/constants/typography';
import { CultureTokens } from '@/constants/theme';
import { BackButton } from '@/components/ui/BackButton';

// ─── Brand constants ──────────────────────────────────────────────────────────
const BLUE   = CultureTokens.indigo;
const YELLOW = CultureTokens.indigo + '20';
const AVATAR = 110;

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserData {
  id: string;
  username: string;
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
  privacySettings?: {
    profileVisible?: boolean;
    locationVisible?: boolean;
  };
}

type UploadedImage = {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
};

const SOCIAL_FIELDS: {
  icon: string; color: string;
  field: 'instagram' | 'twitter' | 'tiktok' | 'youtube' | 'linkedin' | 'facebook' | 'website';
  label: string; placeholder: string;
}[] = [
  { icon: 'logo-instagram', color: '#E4405F', field: 'instagram', label: 'Instagram', placeholder: '@username or URL' },
  { icon: 'logo-twitter',   color: '#1DA1F2', field: 'twitter',   label: 'X / Twitter', placeholder: '@username or URL' },
  { icon: 'logo-tiktok',    color: '#010101', field: 'tiktok',   label: 'TikTok',   placeholder: '@username or URL'  },
  { icon: 'logo-youtube',   color: '#FF0000', field: 'youtube',  label: 'YouTube',  placeholder: 'Channel URL'       },
  { icon: 'logo-linkedin',  color: '#0A66C2', field: 'linkedin',  label: 'LinkedIn',  placeholder: 'Profile URL'      },
  { icon: 'logo-facebook',  color: '#1877F2', field: 'facebook',  label: 'Facebook',  placeholder: 'Profile URL'      },
  { icon: 'globe-outline',  color: BLUE,      field: 'website',   label: 'Website',   placeholder: 'https://…'        },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children, colors }: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Card 
      style={{ marginBottom: 16 }}
      padding={0}
    >
      <View style={[sc.cardHeader, { borderBottomColor: colors.borderLight }]}>
        <Text style={[TextStyles.labelSemibold, { color: colors.text, textTransform: 'uppercase', letterSpacing: 1 }]}>{title}</Text>
      </View>
      <View style={sc.cardBody}>{children}</View>
    </Card>
  );
}

const sc = StyleSheet.create({
  cardHeader: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  cardBody:   { padding: 20, gap: 16 },
});

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={fr.wrap}>
      <Text style={fr.label}>{label}</Text>
      {children}
    </View>
  );
}

const fr = StyleSheet.create({
  wrap:  { gap: 8 },
  label: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#8D8D8D', letterSpacing: 0.5, textTransform: 'uppercase' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const colors        = useColors();
  const insets        = useSafeAreaInsets();
  const { isDesktop } = useLayout();
  const topInset      = Platform.OS === 'web' ? 0 : insets.top;
  const { userId }    = useAuth();

  const { data: user } = useQuery<UserData>({
    queryKey: ['/api/users/me', userId],
    enabled: !!userId,
    queryFn:  () => api.users.me() as Promise<UserData>,
  });

  const [form, setForm] = useState({
    displayName: '', email: '', phone: '', bio: '',
    city: '', state: '', postcode: '', country: 'Australia',
    website: '', instagram: '', twitter: '', tiktok: '', youtube: '', linkedin: '', facebook: '',
    languages: '', ethnicityText: '',
    isPublicProfile: true, showLocation: true,
  });
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || '',
        email:       user.email       || '',
        phone:       user.phone       || '',
        bio:         user.bio         || '',
        city:        user.city        || '',
        state:       user.state       || '',
        postcode:    user.postcode != null ? String(user.postcode) : '',
        country:     user.country     || 'Australia',
        website:     user.website     || '',
        instagram:    user.socialLinks?.instagram || '',
        twitter:      user.socialLinks?.twitter   || '',
        tiktok:       user.socialLinks?.tiktok    || '',
        youtube:      user.socialLinks?.youtube   || '',
        linkedin:     user.socialLinks?.linkedin  || '',
        facebook:     user.socialLinks?.facebook  || '',
        languages:    (user.languages ?? []).join(', '),
        ethnicityText: user.ethnicityText || '',
        isPublicProfile: user.privacySettings?.profileVisible ?? true,
        showLocation: user.privacySettings?.locationVisible ?? true,
      });
      setAvatarUri(user.avatarUrl || null);
    }
  }, [user]);

  // ── Upload mutation ──────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async (uri: string): Promise<UploadedImage> => {
      let uploadUri = uri;
      try {
        const jpegFormat = SaveFormat && typeof SaveFormat === 'object' && 'JPEG' in SaveFormat
          ? SaveFormat.JPEG : undefined;
        const processed = await manipulateAsync(
          uri,
          [{ resize: { width: 1200 } }],
          jpegFormat ? { compress: 0.90, format: jpegFormat } : { compress: 0.90 },
        );
        uploadUri = processed.uri;
      } catch { /* use original */ }

      const formData = new FormData();
      const isDataUrl = uploadUri.startsWith('data:');

      if (Platform.OS === 'web' || isDataUrl) {
        // On web, expo-image-picker returns a blob: URL; fetch it then append.
        const blobRes = await fetch(uploadUri);
        const blob    = await blobRes.blob();
        formData.append('image', blob as unknown as Blob, 'profile.jpg');
      } else {
        const mimeType = uploadUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        formData.append('image', { uri: uploadUri, name: 'profile.jpg', type: mimeType } as unknown as Blob);
      }

      const token = getAccessToken();
      const uploadRes = await fetch(buildApiUrl('api/uploads/image'), {
        method: 'POST',
        body:   formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: typeof document !== 'undefined' ? 'omit' : undefined,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`Upload failed (${uploadRes.status}): ${err}`);
      }
      return uploadRes.json() as Promise<UploadedImage>;
    },
  });

  // ── Save mutation ────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (!userId) throw new Error('Not authenticated');
      await api.users.update(userId, data as Partial<import('@/shared/schema').User>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me', userId] });
      queryClient.invalidateQueries({ queryKey: ['api/auth/me'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Your profile has been updated.');
      goBackOrReplace('/(tabs)');
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const isBusy = updateMutation.isPending || uploadMutation.isPending;

  // ── Photo picker ─────────────────────────────────────────────────────────
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
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // ── Web drag-and-drop ────────────────────────────────────────────────────
  const handleDrop = (event: {
    preventDefault: () => void;
    nativeEvent?: { dataTransfer?: { files?: File[] } };
  }) => {
    if (Platform.OS !== 'web') return;
    event.preventDefault();
    const file = event?.nativeEvent?.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setAvatarUri(String(reader.result)); };
    reader.readAsDataURL(file);
  };

  // ── Save handler ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.displayName.trim()) {
      Alert.alert('Required', 'Please enter your display name.');
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let avatarUrl = user?.avatarUrl || null;
    if (avatarUri && avatarUri !== user?.avatarUrl) {
      try {
        const uploaded = await uploadMutation.mutateAsync(avatarUri);
        avatarUrl = uploaded.imageUrl;
        await apiRequest('POST', '/api/media/attach', {
          targetType: 'user', targetId: userId,
          imageUrl: uploaded.imageUrl, thumbnailUrl: uploaded.thumbnailUrl,
          width: uploaded.width, height: uploaded.height,
        });
      } catch (error) {
        Alert.alert('Upload failed', String(error));
        return;
      }
    }

    const city    = form.city.trim();
    const country = form.country.trim() || 'Australia';
    const formatLink = (url: string, domain: string) => {
      if (!url.trim()) return undefined;
      const clean = url.trim().replace(/^@/, '');
      return clean.startsWith('http') ? clean : `https://${domain}/${clean}`;
    };

    updateMutation.mutate({
      displayName: form.displayName.trim(),
      email:    form.email.trim()    || null,
      phone:    form.phone.trim()    || null,
      bio:      form.bio.trim()      || null,
      city:     city                 || null,
      state:    form.state.trim().toUpperCase() || null,
      postcode: form.postcode.trim() ? Number(form.postcode.trim()) : null,
      country,
      location: city ? `${city}, ${country}` : null,
      avatarUrl,
      website: form.website.trim() || null,
      socialLinks: {
        instagram: formatLink(form.instagram, 'instagram.com'),
        twitter:   formatLink(form.twitter, 'x.com'),
        tiktok:    formatLink(form.tiktok, 'tiktok.com/@'),
        youtube:   formatLink(form.youtube, 'youtube.com/@'),
        linkedin:  formatLink(form.linkedin, 'linkedin.com/in'),
        facebook:  formatLink(form.facebook, 'facebook.com'),
      },
      languages:    form.languages.trim() ? form.languages.split(',').map(l => l.trim()).filter(Boolean) : [],
      ethnicityText: form.ethnicityText.trim() || null,
      privacySettings: {
        profileVisible: form.isPublicProfile,
        locationVisible: form.showLocation,
      }
    });
  };

  const field  = (f: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [f]: v }));
  const initials = ((form.displayName || user?.username || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase());

  // ── Input style helper ───────────────────────────────────────────────────
  const inputStyle = [
    s.input, 
    { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight, color: colors.text }
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={[s.root, { backgroundColor: colors.background }]}>

        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <View style={[s.topBar, { paddingTop: topInset + 8, borderBottomColor: colors.borderLight }]}>
          <BackButton fallback="/(tabs)" style={[s.topBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} />

          <View style={s.topCenter}>
            <Text style={[TextStyles.headline, { color: colors.text }]}>Edit Profile</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => router.push(`/profile/${userId}` as any)}
              style={[s.topBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              accessibilityLabel="Preview profile"
            >
              <Ionicons name="eye-outline" size={18} color={BLUE} />
            </Pressable>

            <Button
              variant="primary"
              size="sm"
              onPress={handleSave}
              loading={isBusy}
              style={{ backgroundColor: BLUE, minWidth: 68 }}
            >
              Save
            </Button>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.scroll, isDesktop && s.scrollDesktop, { paddingBottom: insets.bottom + 48 }]}
        >
          {/* ── Avatar hero ─────────────────────────────────────────── */}
          <View style={s.heroWrap}>
            <LinearGradient
              colors={[BLUE, '#004EA8']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Decorative orb */}
            <View style={s.heroOrb} />

            <Pressable
              style={s.avatarBtn}
              onPress={handleChoosePhoto}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              {...(Platform.OS === 'web' ? {
                onDrop: handleDrop,
                onDragOver: (e: { preventDefault: () => void }) => e.preventDefault(),
              } : {}) as object}
            >
              {/* Avatar ring */}
              <View style={[s.avatarRing, { borderColor: YELLOW }]}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={s.avatarImg} contentFit="cover" />
                ) : (
                  <LinearGradient colors={['#1A3D70', '#0E2040']} style={StyleSheet.absoluteFill}>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[TextStyles.title, { color: "white" }]}>{initials}</Text>
                    </View>
                  </LinearGradient>
                )}
              </View>

              {/* Camera badge */}
              <View style={[s.cameraBadge, { backgroundColor: YELLOW, borderColor: BLUE }]}>
                {uploadMutation.isPending
                  ? <ActivityIndicator size="small" color={BLUE} />
                  : <Ionicons name="camera" size={14} color={BLUE} />
                }
              </View>
            </Pressable>

            <Text style={[TextStyles.title2, { color: "white", textAlign: 'center' }]}>{form.displayName || user?.username || 'Your Name'}</Text>
            <Text style={[TextStyles.caption, { color: 'rgba(255,255,255,0.6)' }]}>
              {Platform.OS === 'web' ? 'Tap to change · drag & drop' : 'Tap avatar to change photo'}
            </Text>
          </View>

          {/* ── Form body ───────────────────────────────────────────── */}
          <View style={[s.body, isDesktop && s.bodyDesktop]}>

            {/* Personal Information */}
            <SectionCard title="Personal Information" colors={colors}>
              <FieldRow label="Display Name *">
                <TextInput
                  style={inputStyle}
                  value={form.displayName}
                  onChangeText={field('displayName')}
                  placeholder="Your full name"
                  placeholderTextColor={colors.textTertiary}
                  accessibilityLabel="Display name"
                />
              </FieldRow>

              <FieldRow label="Email">
                <TextInput
                  style={inputStyle}
                  value={form.email}
                  onChangeText={field('email')}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessibilityLabel="Email"
                />
              </FieldRow>

              <FieldRow label="Phone">
                <TextInput
                  style={inputStyle}
                  value={form.phone}
                  onChangeText={field('phone')}
                  placeholder="+61 400 000 000"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                  accessibilityLabel="Phone"
                />
              </FieldRow>

              <FieldRow label="Bio">
                <TextInput
                  style={[inputStyle, s.bioInput]}
                  value={form.bio}
                  onChangeText={field('bio')}
                  placeholder="Tell the community about yourself…"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={280}
                  accessibilityLabel="Bio"
                />
                <Text style={[s.charCount, { color: colors.textTertiary }]}>{form.bio.length}/280</Text>
              </FieldRow>
            </SectionCard>

            {/* About Me — Languages & Cultural Background */}
            <SectionCard title="About Me" colors={colors}>
              <FieldRow label="Languages (comma-separated)">
                <TextInput
                  style={inputStyle}
                  value={form.languages}
                  onChangeText={field('languages')}
                  placeholder="English, Hindi, Tamil…"
                  placeholderTextColor={colors.textTertiary}
                  accessibilityLabel="Languages"
                />
              </FieldRow>
              <FieldRow label="Cultural Background">
                <TextInput
                  style={inputStyle}
                  value={form.ethnicityText}
                  onChangeText={field('ethnicityText')}
                  placeholder="e.g. South Indian, Lebanese, Filipino…"
                  placeholderTextColor={colors.textTertiary}
                  accessibilityLabel="Cultural background"
                />
              </FieldRow>
            </SectionCard>

            {/* Privacy & Visibility */}
            <SectionCard title="Privacy Settings" colors={colors}>
              <View style={[s.privacyRow, { borderBottomColor: colors.borderLight }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[TextStyles.callout, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>Make Profile Public</Text>
                  <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>Allow other users to search and view your profile</Text>
                </View>
                <Switch 
                  value={form.isPublicProfile} 
                  onValueChange={v => setForm(p => ({ ...p, isPublicProfile: v }))}
                  trackColor={{ true: BLUE }}
                />
              </View>
              <View style={s.privacyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[TextStyles.callout, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>Show Active City</Text>
                  <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>Display your location on your public page</Text>
                </View>
                <Switch 
                  value={form.showLocation} 
                  onValueChange={v => setForm(p => ({ ...p, showLocation: v }))}
                  trackColor={{ true: BLUE }}
                />
              </View>
            </SectionCard>

            {/* Location */}
            <SectionCard title="Location" colors={colors}>
              <View style={s.twoCol}>
                <View style={{ flex: 1 }}>
                  <FieldRow label="City">
                    <TextInput
                      style={inputStyle}
                      value={form.city}
                      onChangeText={field('city')}
                      placeholder="Sydney"
                      placeholderTextColor={colors.textTertiary}
                      accessibilityLabel="City"
                    />
                  </FieldRow>
                </View>
                <View style={{ flex: 1 }}>
                  <FieldRow label="State">
                    <TextInput
                      style={inputStyle}
                      value={form.state}
                      onChangeText={field('state')}
                      placeholder="NSW"
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="characters"
                      accessibilityLabel="State"
                    />
                  </FieldRow>
                </View>
              </View>
              <View style={s.twoCol}>
                <View style={{ flex: 1 }}>
                  <FieldRow label="Postcode">
                    <TextInput
                      style={inputStyle}
                      value={form.postcode}
                      onChangeText={field('postcode')}
                      placeholder="2000"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                      accessibilityLabel="Postcode"
                    />
                  </FieldRow>
                </View>
                <View style={{ flex: 1 }}>
                  <FieldRow label="Country">
                    <TextInput
                      style={inputStyle}
                      value={form.country}
                      onChangeText={field('country')}
                      placeholder="Australia"
                      placeholderTextColor={colors.textTertiary}
                      accessibilityLabel="Country"
                    />
                  </FieldRow>
                </View>
              </View>
            </SectionCard>

            {/* Social Links */}
            <SectionCard title="Social & Web" colors={colors}>
              {SOCIAL_FIELDS.map(({ icon, color, field: f, label, placeholder }) => (
                <View key={f} style={s.socialRow}>
                  <View style={[s.socialIcon, { backgroundColor: color + '18' }]}>
                    <Ionicons name={icon as never} size={18} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[fr.label, { marginBottom: 4 }]}>{label}</Text>
                    <TextInput
                      style={inputStyle}
                      value={form[f]}
                      onChangeText={v => setForm(p => ({ ...p, [f]: v }))}
                      placeholder={placeholder}
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="none"
                      keyboardType="url"
                      accessibilityLabel={label}
                    />
                  </View>
                </View>
              ))}
            </SectionCard>

            {/* Save button */}
            <Button
              variant="gradient"
              gradientColors={[BLUE, '#004EA8']}
              size="lg"
              leftIcon="checkmark-circle"
              onPress={handleSave}
              loading={isBusy}
              style={{ marginTop: 4 }}
              labelStyle={TextStyles.headline}
            >
              Save Profile
            </Button>

          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBtn: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  topCenter: { flex: 1, alignItems: 'center' },
  topTitle:  { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  saveTopBtn: {
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 11, backgroundColor: BLUE,
    minWidth: 68, alignItems: 'center',
  },
  saveTopText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: "white" },

  // Scroll
  scroll:        { flexGrow: 1 },
  scrollDesktop: { paddingHorizontal: 0 },

  // Hero
  heroWrap: {
    alignItems: 'center',
    paddingTop: 36, paddingBottom: 28,
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,204,0,0.12)',
  },
  avatarBtn:    { position: 'relative', marginBottom: 14 },
  avatarRing:   {
    width: AVATAR + 8, height: AVATAR + 8,
    borderRadius: (AVATAR + 8) / 2,
    borderWidth: 3, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg:      { width: AVATAR, height: AVATAR },
  avatarInitials: { fontSize: 36, fontFamily: 'Poppins_700Bold', color: "white" },
  cameraBadge: {
    position: 'absolute', bottom: 4, right: 0,
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5,
  },
  heroName: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: "white", marginBottom: 4 },
  heroHint: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.55)' },

  // Body
  body:        { padding: 16, gap: 12 },
  bodyDesktop: { maxWidth: 700, width: '100%', alignSelf: 'center', paddingHorizontal: 24 },

  // Input
  input: {
    height: 52, borderRadius: 14, paddingHorizontal: 16,
    fontSize: 15, fontFamily: 'Poppins_500Medium',
    borderWidth: 1,
  },
  bioInput:  { height: 110, paddingTop: 14, paddingBottom: 14 },
  charCount: { fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'right', marginTop: 4 },

  // Two-column row
  twoCol: { flexDirection: 'row', gap: 12 },

  // Social
  socialRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  socialIcon: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 22,
  },

  // Privacy
  privacyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 16, marginBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 16,
  },

  // Save button
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 54, borderRadius: 16, overflow: 'hidden', marginTop: 4,
    ...Platform.select({
      web:     { boxShadow: '0px 4px 20px rgba(0,102,204,0.35)' },
      default: { shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
    }),
  },
  saveBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: "white" },
});
