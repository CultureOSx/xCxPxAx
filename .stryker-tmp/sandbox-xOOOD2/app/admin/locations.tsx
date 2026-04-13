// @ts-nocheck
// app/admin/locations.tsx
//
// Admin screen — manage featured cities shown in the Discover CityRail.
// Super-admin can: add countries/cities, upload cover images, toggle featured,
// reorder, and delete. Uses the /api/cities/* endpoints.

import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type FeaturedCityData } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { useImageUpload } from '@/hooks/useImageUpload';
import { CultureTokens } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cityGradient } from '@/hooks/useFeaturedCities';
import * as Haptics from 'expo-haptics';

const isWeb = Platform.OS === 'web';

// ---------------------------------------------------------------------------
// Country options for the "Add City" form (expandable)
// ---------------------------------------------------------------------------

const COUNTRY_OPTIONS = [
  { code: 'AU', name: 'Australia',   emoji: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', emoji: '🇳🇿' },
  { code: 'AE', name: 'UAE',         emoji: '🇦🇪' },
  { code: 'GB', name: 'UK',          emoji: '🇬🇧' },
  { code: 'CA', name: 'Canada',      emoji: '🇨🇦' },
  { code: 'US', name: 'USA',         emoji: '🇺🇸' },
  { code: 'SG', name: 'Singapore',   emoji: '🇸🇬' },
];

// ---------------------------------------------------------------------------
// CityRow — individual list row with edit/delete actions
// ---------------------------------------------------------------------------

function CityRow({
  city,
  onEdit,
  onDelete,
  onToggleFeatured,
}: {
  city: FeaturedCityData;
  onEdit: (city: FeaturedCityData) => void;
  onDelete: (city: FeaturedCityData) => void;
  onToggleFeatured: (city: FeaturedCityData, value: boolean) => void;
}) {
  const colors = useColors();
  const gradient = cityGradient(city.countryCode);

  return (
    <View style={[row.wrap, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      {/* Thumbnail */}
      <View style={row.thumb}>
        {city.imageUrl ? (
          <Image source={{ uri: city.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        )}
        <Text style={row.thumbEmoji}>{city.countryEmoji}</Text>
      </View>

      {/* Info */}
      <View style={row.info}>
        <Text style={[row.name, { color: colors.text }]}>{city.name}</Text>
        <Text style={[row.country, { color: colors.textTertiary }]}>
          {city.countryEmoji} {city.countryName}{city.stateCode ? ` · ${city.stateCode}` : ''}
        </Text>
        <Text style={[row.order, { color: colors.textTertiary }]}>Order: {city.order}</Text>
      </View>

      {/* Featured toggle */}
      <View style={row.actions}>
        <Switch
          value={city.featured}
          onValueChange={(v) => onToggleFeatured(city, v)}
          trackColor={{ false: colors.borderLight, true: CultureTokens.teal + '80' }}
          thumbColor={city.featured ? CultureTokens.teal : colors.textTertiary}
        />

        {/* Edit */}
        <Pressable
          onPress={() => onEdit(city)}
          style={[row.btn, { backgroundColor: CultureTokens.indigo + '18' }]}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${city.name}`}
        >
          <Ionicons name="pencil-outline" size={15} color={CultureTokens.indigo} />
        </Pressable>

        {/* Delete */}
        <Pressable
          onPress={() => onDelete(city)}
          style={[row.btn, { backgroundColor: CultureTokens.coral + '18' }]}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${city.name}`}
        >
          <Ionicons name="trash-outline" size={15} color={CultureTokens.coral} />
        </Pressable>
      </View>
    </View>
  );
}

const row = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  thumb:   { width: 52, height: 52, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  thumbEmoji: { fontSize: 20, zIndex: 1 },
  info:    { flex: 1 },
  name:    { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  country: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  order:   { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btn:     { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});

// ---------------------------------------------------------------------------
// City Form Modal — Add / Edit
// ---------------------------------------------------------------------------

interface CityFormValues {
  name: string;
  countryCode: string;
  countryName: string;
  countryEmoji: string;
  stateCode: string;
  featured: boolean;
  order: string;
  imageUrl?: string;
}

function CityFormModal({
  visible,
  initial,
  onClose,
  onSubmit,
  isSaving,
}: {
  visible: boolean;
  initial?: Partial<CityFormValues>;
  onClose: () => void;
  onSubmit: (values: CityFormValues, localImageUri?: string) => void;
  isSaving: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { uploading, progress } = useImageUpload();

  const [form, setForm] = useState<CityFormValues>({
    name: '',
    countryCode: 'AU',
    countryName: 'Australia',
    countryEmoji: '🇦🇺',
    stateCode: '',
    featured: true,
    order: '0',
    imageUrl: undefined,
  });
  const [localImageUri, setLocalImageUri] = useState<string | undefined>();
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Reset form when opening
  useEffect(() => {
    if (visible) {
      setForm({
        name: initial?.name ?? '',
        countryCode: initial?.countryCode ?? 'AU',
        countryName: initial?.countryName ?? 'Australia',
        countryEmoji: initial?.countryEmoji ?? '🇦🇺',
        stateCode: initial?.stateCode ?? '',
        featured: initial?.featured ?? true,
        order: String(initial?.order ?? '0'),
        imageUrl: initial?.imageUrl,
      });
      setLocalImageUri(undefined);
    }
  }, [visible, initial]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const selectCountry = (opt: typeof COUNTRY_OPTIONS[number]) => {
    setForm((f) => ({ ...f, countryCode: opt.code, countryName: opt.name, countryEmoji: opt.emoji }));
    setShowCountryPicker(false);
  };

  const valid = form.name.trim().length > 0;

  const previewGradient = cityGradient(form.countryCode);
  const previewImage = localImageUri ?? form.imageUrl;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={fm.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[fm.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
          <View style={[fm.handle, { backgroundColor: colors.border }]} />

          <Text style={[fm.title, { color: colors.text }]}>
            {initial?.name ? `Edit ${initial.name}` : 'Add City'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={fm.body}>
            {/* Preview card */}
            <View style={fm.preview}>
              {previewImage ? (
                <Image source={{ uri: previewImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <LinearGradient colors={previewGradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              )}
              <View style={fm.previewOverlay} />
              <View style={fm.previewText}>
                <Text style={fm.previewEmoji}>{form.countryEmoji}</Text>
                <Text style={fm.previewName}>{form.name || 'City Name'}</Text>
                <Text style={fm.previewCountry}>{form.countryName}</Text>
              </View>
            </View>

            {/* Image upload button */}
            <Pressable
              onPress={pickImage}
              style={[fm.imageBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              accessibilityRole="button"
              accessibilityLabel="Choose cover image"
            >
              <Ionicons name="image-outline" size={18} color={CultureTokens.teal} />
              <Text style={[fm.imageBtnText, { color: colors.text }]}>
                {previewImage ? 'Change Cover Image' : 'Add Cover Image (optional)'}
              </Text>
              {uploading && (
                <Text style={[fm.progressText, { color: CultureTokens.teal }]}>{Math.round(progress)}%</Text>
              )}
            </Pressable>

            {previewImage && (
              <Pressable
                onPress={() => { setLocalImageUri(undefined); setForm((f) => ({ ...f, imageUrl: undefined })); }}
                accessibilityRole="button"
                accessibilityLabel="Remove cover image"
              >
                <Text style={[fm.removeImg, { color: CultureTokens.coral }]}>Remove image</Text>
              </Pressable>
            )}

            {/* City name */}
            <Text style={[fm.label, { color: colors.textSecondary }]}>City Name *</Text>
            <TextInput
              style={[fm.input, { backgroundColor: colors.surface, borderColor: colors.borderLight, color: colors.text }]}
              placeholder="e.g. Sydney"
              placeholderTextColor={colors.textTertiary}
              value={form.name}
              onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
              autoCapitalize="words"
            />

            {/* Country picker */}
            <Text style={[fm.label, { color: colors.textSecondary }]}>Country *</Text>
            <Pressable
              style={[fm.input, fm.pickerRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => setShowCountryPicker((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="Select country"
            >
              <Text style={[fm.pickerText, { color: colors.text }]}>{form.countryEmoji} {form.countryName}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
            </Pressable>

            {showCountryPicker && (
              <View style={[fm.dropdown, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                {COUNTRY_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.code}
                    style={[fm.dropdownRow, { borderBottomColor: colors.borderLight }]}
                    onPress={() => selectCountry(opt)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${opt.name}`}
                  >
                    <Text style={[fm.dropdownText, { color: colors.text }]}>{opt.emoji} {opt.name}</Text>
                    {opt.code === form.countryCode && (
                      <Ionicons name="checkmark" size={16} color={CultureTokens.teal} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {/* State code (optional) */}
            <Text style={[fm.label, { color: colors.textSecondary }]}>State / Region (optional)</Text>
            <TextInput
              style={[fm.input, { backgroundColor: colors.surface, borderColor: colors.borderLight, color: colors.text }]}
              placeholder="e.g. NSW"
              placeholderTextColor={colors.textTertiary}
              value={form.stateCode}
              onChangeText={(t) => setForm((f) => ({ ...f, stateCode: t.toUpperCase() }))}
              autoCapitalize="characters"
              maxLength={4}
            />

            {/* Order */}
            <Text style={[fm.label, { color: colors.textSecondary }]}>Sort Order</Text>
            <TextInput
              style={[fm.input, { backgroundColor: colors.surface, borderColor: colors.borderLight, color: colors.text }]}
              placeholder="0 = first"
              placeholderTextColor={colors.textTertiary}
              value={form.order}
              onChangeText={(t) => setForm((f) => ({ ...f, order: t.replace(/[^0-9]/g, '') }))}
              keyboardType="numeric"
            />

            {/* Featured toggle */}
            <View style={fm.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[fm.label, { color: colors.textSecondary, marginBottom: 0 }]}>Show in Discover CityRail</Text>
                <Text style={[fm.sublabel, { color: colors.textTertiary }]}>Featured cities appear on the home screen</Text>
              </View>
              <Switch
                value={form.featured}
                onValueChange={(v) => setForm((f) => ({ ...f, featured: v }))}
                trackColor={{ false: colors.borderLight, true: CultureTokens.teal + '80' }}
                thumbColor={form.featured ? CultureTokens.teal : colors.textTertiary}
              />
            </View>
          </ScrollView>

          {/* Submit */}
          <View style={[fm.footer, { borderTopColor: colors.borderLight }]}>
            <Pressable
              style={[fm.cancelBtn, { borderColor: colors.borderLight }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[fm.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[fm.submitBtn, { backgroundColor: valid ? CultureTokens.indigo : colors.border, opacity: valid && !isSaving ? 1 : 0.6 }]}
              onPress={() => valid && onSubmit(form, localImageUri)}
              disabled={!valid || isSaving}
              accessibilityRole="button"
              accessibilityLabel="Save city"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={fm.submitText}>{initial?.name ? 'Save Changes' : 'Add City'}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const fm = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  handle:       { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  title:        { fontSize: 18, fontFamily: 'Poppins_700Bold', paddingHorizontal: 20, paddingBottom: 8 },
  body:         { paddingHorizontal: 20, paddingBottom: 12, gap: 4 },
  // Preview card
  preview:      { width: '100%', height: 100, borderRadius: 16, overflow: 'hidden', marginBottom: 12, justifyContent: 'flex-end' },
  previewOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,11,20,0.35)' },
  previewText:  { padding: 10, gap: 2 },
  previewEmoji: { fontSize: 18, lineHeight: 22 },
  previewName:  { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#fff' },
  previewCountry: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)' },
  // Image button
  imageBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 4 },
  imageBtnText: { flex: 1, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  progressText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  removeImg:    { fontSize: 12, fontFamily: 'Poppins_500Medium', textAlign: 'center', marginBottom: 8 },
  // Form
  label:        { fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginTop: 12, marginBottom: 4 },
  sublabel:     { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  input:        { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  pickerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerText:   { fontSize: 14, fontFamily: 'Poppins_400Regular' },
  dropdown:     { borderRadius: 12, borderWidth: 1, marginTop: 4, overflow: 'hidden' },
  dropdownRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  dropdownText: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
  toggleRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 },
  // Footer
  footer:       { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  cancelBtn:    { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  cancelText:   { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  submitBtn:    { flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  submitText:   { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#fff' },
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

function LocationsContent() {
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const { hPad } = useLayout();
  const { role, isLoading: roleLoading } = useRole();
  const qc = useQueryClient();
  const { uploadImage } = useImageUpload();

  const isAdmin = role === 'admin' || role === 'platformAdmin';

  useEffect(() => {
    if (!roleLoading && !isAdmin) router.replace('/admin/dashboard');
  }, [isAdmin, roleLoading]);

  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<FeaturedCityData | undefined>();

  // Query
  const { data: cities = [], isLoading } = useQuery<FeaturedCityData[]>({
    queryKey: ['/api/cities'],
    queryFn: () => api.cities.list(),
    enabled: isAdmin,
    staleTime: 60_000,
  });

  // Mutations
  const createMut = useMutation({
    mutationFn: async ({ values, localImageUri }: { values: Parameters<typeof api.cities.create>[0]; localImageUri?: string }) => {
      const city = await api.cities.create(values);
      if (localImageUri) {
        const picker: ImagePicker.ImagePickerResult = {
          canceled: false,
          assets: [{ uri: localImageUri, width: 0, height: 0, type: 'image', fileName: 'cover.jpg', fileSize: 0, base64: undefined, exif: undefined, duration: undefined, mimeType: 'image/jpeg' }],
        };
        const { downloadURL } = await uploadImage(picker, 'featuredCities', city.id, 'imageUrl', false);
        await api.cities.update(city.id, { imageUrl: downloadURL });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/cities'] }),
    onError: () => Alert.alert('Error', 'Failed to add city. Please try again.'),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, values, localImageUri }: { id: string; values: Partial<FeaturedCityData>; localImageUri?: string }) => {
      if (localImageUri) {
        const picker: ImagePicker.ImagePickerResult = {
          canceled: false,
          assets: [{ uri: localImageUri, width: 0, height: 0, type: 'image', fileName: 'cover.jpg', fileSize: 0, base64: undefined, exif: undefined, duration: undefined, mimeType: 'image/jpeg' }],
        };
        const { downloadURL } = await uploadImage(picker, 'featuredCities', id, 'imageUrl', false);
        values = { ...values, imageUrl: downloadURL };
      }
      await api.cities.update(id, values);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/cities'] });
      qc.invalidateQueries({ queryKey: ['/api/cities/featured'] });
    },
    onError: () => Alert.alert('Error', 'Failed to update city.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.cities.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/cities'] });
      qc.invalidateQueries({ queryKey: ['/api/cities/featured'] });
    },
    onError: () => Alert.alert('Error', 'Failed to delete city.'),
  });

  const seedMut = useMutation({
    mutationFn: () => api.cities.seed(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/cities'] });
      qc.invalidateQueries({ queryKey: ['/api/cities/featured'] });
      Alert.alert('Done', 'Default cities have been seeded.');
    },
    onError: () => Alert.alert('Error', 'Seed failed. Please try again.'),
  });

  function formValuesToPayload(values: CityFormValues) {
    return {
      name: values.name.trim(),
      countryCode: values.countryCode,
      countryName: values.countryName,
      countryEmoji: values.countryEmoji,
      stateCode: values.stateCode.trim() || undefined,
      featured: values.featured,
      order: parseInt(values.order, 10) || 0,
      imageUrl: values.imageUrl,
    };
  }

  const handleSubmit = useCallback((values: CityFormValues, localImageUri?: string) => {
    const payload = formValuesToPayload(values);
    if (editTarget) {
      updateMut.mutate({ id: editTarget.id, values: payload, localImageUri });
    } else {
      createMut.mutate({ values: payload as Parameters<typeof api.cities.create>[0], localImageUri: localImageUri });
    }
    setFormVisible(false);
    setEditTarget(undefined);
  }, [editTarget, createMut, updateMut]);

  const handleEdit = useCallback((city: FeaturedCityData) => {
    setEditTarget(city);
    setFormVisible(true);
  }, []);

  const handleDelete = useCallback((city: FeaturedCityData) => {
    Alert.alert(
      `Delete ${city.name}?`,
      'This will remove it from the Discover CityRail.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate(city.id) },
      ],
    );
  }, [deleteMut]);

  const handleToggleFeatured = useCallback((city: FeaturedCityData, featured: boolean) => {
    if (!isWeb) Haptics.selectionAsync();
    updateMut.mutate({ id: city.id, values: { featured } });
  }, [updateMut]);

  const handleSeed = useCallback(() => {
    Alert.alert(
      'Seed Default Cities?',
      'This will add the default set of featured cities. Existing entries will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Seed', onPress: () => seedMut.mutate() },
      ],
    );
  }, [seedMut]);

  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const isSaving = createMut.isPending || updateMut.isPending;

  const grouped = cities.reduce<Record<string, FeaturedCityData[]>>((acc, c) => {
    if (!acc[c.countryCode]) acc[c.countryCode] = [];
    acc[c.countryCode].push(c);
    return acc;
  }, {});

  if (!isAdmin && !roleLoading) return null;

  return (
    <View style={[s.fill, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[CultureTokens.teal + 'cc', CultureTokens.indigo] as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: topInset }}
      >
        <View style={[s.header, { paddingHorizontal: hPad }]}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/admin/dashboard')}
            style={s.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Cities & Countries</Text>
            <Text style={s.headerSub}>Manage Discover CityRail content</Text>
          </View>
          <Pressable
            onPress={() => { setEditTarget(undefined); setFormVisible(true); }}
            style={s.addBtn}
            accessibilityRole="button"
            accessibilityLabel="Add city"
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={s.addBtnText}>Add</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Stats bar */}
      <View style={[s.statsBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={s.stat}>
          <Text style={[s.statNum, { color: colors.text }]}>{Object.keys(grouped).length}</Text>
          <Text style={[s.statLabel, { color: colors.textTertiary }]}>Countries</Text>
        </View>
        <View style={[s.statDivider, { backgroundColor: colors.borderLight }]} />
        <View style={s.stat}>
          <Text style={[s.statNum, { color: colors.text }]}>{cities.length}</Text>
          <Text style={[s.statLabel, { color: colors.textTertiary }]}>Cities</Text>
        </View>
        <View style={[s.statDivider, { backgroundColor: colors.borderLight }]} />
        <View style={s.stat}>
          <Text style={[s.statNum, { color: CultureTokens.teal }]}>
            {cities.filter((c) => c.featured).length}
          </Text>
          <Text style={[s.statLabel, { color: colors.textTertiary }]}>Featured</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 48 }]}
      >
        {isLoading || roleLoading ? (
          <ActivityIndicator color={CultureTokens.teal} size="large" style={{ marginVertical: 48 }} />
        ) : cities.length === 0 ? (
          // Empty state
          <View style={s.empty}>
            <Ionicons name="globe-outline" size={48} color={colors.textTertiary} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>No cities yet</Text>
            <Text style={[s.emptyBody, { color: colors.textSecondary }]}>
              Add your first city or seed the defaults to populate the Discover CityRail.
            </Text>
            <Pressable
              style={[s.seedBtn, { backgroundColor: CultureTokens.teal }]}
              onPress={handleSeed}
              accessibilityRole="button"
              accessibilityLabel="Seed default cities"
            >
              {seedMut.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={16} color="#fff" />
                  <Text style={s.seedBtnText}>Seed Default Cities</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <>
            {/* Grouped by country */}
            {Object.entries(grouped).map(([cc, ccCities]) => {
              const first = ccCities[0];
              return (
                <View key={cc} style={s.group}>
                  <Text style={[s.groupTitle, { color: colors.textSecondary }]}>
                    {first.countryEmoji} {first.countryName}
                  </Text>
                  {ccCities.map((city) => (
                    <CityRow
                      key={city.id}
                      city={city}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleFeatured={handleToggleFeatured}
                    />
                  ))}
                </View>
              );
            })}

            {/* Seed button at bottom */}
            <Pressable
              style={[s.seedBtnSmall, { borderColor: colors.borderLight }]}
              onPress={handleSeed}
              accessibilityRole="button"
              accessibilityLabel="Re-seed default cities"
            >
              <Ionicons name="refresh-outline" size={14} color={colors.textTertiary} />
              <Text style={[s.seedBtnSmallText, { color: colors.textTertiary }]}>Re-seed defaults</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* Add / Edit modal */}
      <CityFormModal
        visible={formVisible}
        initial={editTarget ? {
          name: editTarget.name,
          countryCode: editTarget.countryCode,
          countryName: editTarget.countryName,
          countryEmoji: editTarget.countryEmoji,
          stateCode: editTarget.stateCode,
          featured: editTarget.featured,
          order: String(editTarget.order),
          imageUrl: editTarget.imageUrl,
        } : undefined}
        onClose={() => { setFormVisible(false); setEditTarget(undefined); }}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />
    </View>
  );
}

export default function AdminLocationsScreen() {
  return <ErrorBoundary><LocationsContent /></ErrorBoundary>;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  fill:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  headerTitle:  { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -0.2 },
  headerSub:    { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  backBtn:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  addBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  addBtnText:   { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  // Stats bar
  statsBar:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  stat:         { flex: 1, alignItems: 'center' },
  statNum:      { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  statLabel:    { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  statDivider:  { width: 1, height: 32 },
  // Content
  scroll:       { paddingTop: 20 },
  group:        { marginBottom: 24 },
  groupTitle:   { fontSize: 12, fontFamily: 'Poppins_700Bold', letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' },
  // Empty state
  empty:        { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle:   { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  emptyBody:    { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  seedBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  seedBtnText:  { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#fff' },
  seedBtnSmall: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, borderWidth: 1, paddingVertical: 10, marginTop: 8 },
  seedBtnSmallText: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
});
