import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { CultureTokens, CardTokens, ButtonTokens } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { ShopData, ShopInput } from '@/shared/schema';

const SHOP_CATEGORIES = [
  'Groceries',
  'Fashion',
  'Jewellery',
  'Electronics',
  'Health & Wellness',
  'Books & Gifts',
  'Other',
] as const;

type Tab = 'stores' | 'add';

interface FormState {
  name: string;
  category: string;
  description: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  website: string;
  isOpen: boolean;
  deliveryAvailable: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  category: 'Groceries',
  description: '',
  city: '',
  country: 'Australia',
  address: '',
  phone: '',
  website: '',
  isOpen: true,
  deliveryAvailable: false,
};

export default function AdminShoppingScreen() {
  const colors = useColors();
  const { hPad } = useLayout();
  const { isAdmin } = useRole();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const [activeTab, setActiveTab] = useState<Tab>('stores');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['/api/shopping'],
    queryFn: () => api.shopping.list(),
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (payload: ShopInput) => api.shopping.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping'] });
      setForm(EMPTY_FORM);
      setEditingId(null);
      Alert.alert('Success', 'Shop created successfully.');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.isUnauthorized) {
        router.push('/(onboarding)/login');
        return;
      }
      Alert.alert('Error', 'Failed to create shop. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ShopInput> }) =>
      api.shopping.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shopping'] });
      setForm(EMPTY_FORM);
      setEditingId(null);
      setActiveTab('stores');
      Alert.alert('Success', 'Shop updated successfully.');
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.isUnauthorized) {
        router.push('/(onboarding)/login');
        return;
      }
      Alert.alert('Error', 'Failed to update shop. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.shopping.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shopping'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete shop. Please try again.');
    },
  });

  const promoteMutation = useMutation({
    mutationFn: ({ id, isPromoted }: { id: string; isPromoted: boolean }) =>
      api.shopping.setPromoted(id, isPromoted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shopping/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shopping'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update shop promotion. Please try again.');
    },
  });

  if (!isAdmin) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed" size={48} color={colors.textSecondary} />
        <Text style={[styles.accessDeniedText, { color: colors.textSecondary }]}>
          Admin access required
        </Text>
      </View>
    );
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Store name is required.');
      return;
    }
    if (!form.city.trim() || !form.country.trim()) {
      Alert.alert('Validation', 'City and country are required.');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const payload: ShopInput = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      address: form.address.trim(),
      phone: form.phone.trim() || undefined,
      website: form.website.trim() || undefined,
      isOpen: form.isOpen,
      deliveryAvailable: form.deliveryAvailable,
      isPromoted: false,
      rating: 0,
      reviewsCount: 0,
      imageUrl: '',
      deals: [],
      status: 'active',
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (store: ShopData) => {
    setForm({
      name: store.name,
      category: store.category,
      description: store.description,
      city: store.city,
      country: store.country,
      address: store.address ?? '',
      phone: store.phone ?? '',
      website: store.website ?? '',
      isOpen: store.isOpen,
      deliveryAvailable: store.deliveryAvailable,
    });
    setEditingId(store.id);
    setActiveTab('add');
  };

  const handleDelete = (store: ShopData) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    Alert.alert(
      'Delete Store',
      `Are you sure you want to delete "${store.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(store.id),
        },
      ],
    );
  };

  const handleTogglePromoted = (store: ShopData) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    promoteMutation.mutate({ id: store.id, isPromoted: !store.isPromoted });
  };

  const handleCancelEdit = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setActiveTab('stores');
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topInset + 12, paddingHorizontal: hPad }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={[styles.titleText, { color: colors.text }]}>Shopping Admin</Text>
            <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
              Manage stores and deals
            </Text>
          </View>
          <View style={[styles.accentBadge, { backgroundColor: CultureTokens.teal + '20' }]}>
            <Ionicons name="bag-handle" size={20} color={CultureTokens.teal} />
          </View>
        </View>

        {/* Tab bar */}
        <View style={[styles.tabBar, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
          <Pressable
            onPress={() => { setActiveTab('stores'); setForm(EMPTY_FORM); setEditingId(null); }}
            style={[styles.tab, activeTab === 'stores' && styles.tabActive]}
            accessibilityLabel="Stores tab"
            accessibilityRole="tab"
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'stores' ? CultureTokens.teal : colors.textSecondary },
            ]}>
              Stores
            </Text>
            {activeTab === 'stores' && (
              <View style={[styles.tabUnderline, { backgroundColor: CultureTokens.teal }]} />
            )}
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('add')}
            style={[styles.tab, activeTab === 'add' && styles.tabActive]}
            accessibilityLabel={editingId ? 'Edit store tab' : 'Add store tab'}
            accessibilityRole="tab"
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'add' ? CultureTokens.teal : colors.textSecondary },
            ]}>
              {editingId ? 'Edit Store' : 'Add Store'}
            </Text>
            {activeTab === 'add' && (
              <View style={[styles.tabUnderline, { backgroundColor: CultureTokens.teal }]} />
            )}
          </Pressable>
        </View>

        {/* Stores tab */}
        {activeTab === 'stores' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal: hPad }]}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color={CultureTokens.teal} style={styles.loader} />
            ) : stores.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bag-handle-outline" size={56} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No stores yet</Text>
                <Pressable
                  onPress={() => setActiveTab('add')}
                  style={[styles.emptyAction, { backgroundColor: CultureTokens.teal }]}
                  accessibilityLabel="Add first store"
                  accessibilityRole="button"
                >
                  <Text style={[styles.emptyActionText, { color: colors.background }]}>Add First Store</Text>
                </Pressable>
              </View>
            ) : (
              stores.map((store: ShopData) => (
                <View
                  key={store.id}
                  style={[styles.storeCard, {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                  }]}
                >
                  <View style={styles.storeCardTop}>
                    <View style={styles.storeInfo}>
                      <Text style={[styles.storeName, { color: colors.text }]} numberOfLines={1}>
                        {store.name}
                      </Text>
                      <Text style={[styles.storeMeta, { color: colors.textSecondary }]}>
                        {store.category} · {store.city}
                      </Text>
                    </View>
                    <View style={styles.storeBadges}>
                      {store.isPromoted && (
                        <View style={[styles.promotedBadge, { backgroundColor: CultureTokens.teal + '20' }]}>
                          <Text style={[styles.promotedText, { color: CultureTokens.teal }]}>Featured</Text>
                        </View>
                      )}
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: store.isOpen ? CultureTokens.success : colors.textTertiary },
                      ]} />
                    </View>
                  </View>
                  <View style={[styles.storeActions, { borderTopColor: colors.borderLight }]}>
                    <Pressable
                      onPress={() => handleTogglePromoted(store)}
                      style={[styles.actionBtn, { borderColor: CultureTokens.teal + '40' }]}
                      accessibilityLabel={store.isPromoted ? 'Remove from featured' : 'Mark as featured'}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name={store.isPromoted ? 'star' : 'star-outline'}
                        size={16}
                        color={CultureTokens.teal}
                      />
                      <Text style={[styles.actionText, { color: CultureTokens.teal }]}>
                        {store.isPromoted ? 'Unfeature' : 'Feature'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleEdit(store)}
                      style={[styles.actionBtn, { borderColor: colors.borderLight }]}
                      accessibilityLabel={`Edit ${store.name}`}
                      accessibilityRole="button"
                    >
                      <Ionicons name="pencil-outline" size={16} color={colors.text} />
                      <Text style={[styles.actionText, { color: colors.text }]}>Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(store)}
                      style={[styles.actionBtn, { borderColor: CultureTokens.coral + '40' }]}
                      accessibilityLabel={`Delete ${store.name}`}
                      accessibilityRole="button"
                    >
                      <Ionicons name="trash-outline" size={16} color={CultureTokens.coral} />
                      <Text style={[styles.actionText, { color: CultureTokens.coral }]}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Add / Edit Store tab */}
        {activeTab === 'add' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal: hPad }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {editingId && (
              <Pressable
                onPress={handleCancelEdit}
                style={styles.cancelRow}
                accessibilityLabel="Cancel editing"
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                  Cancel editing
                </Text>
              </Pressable>
            )}

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Store Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Spice Garden Superstore"
              placeholderTextColor={colors.textTertiary}
              accessibilityLabel="Store name input"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category *</Text>
            <View style={styles.categoryGrid}>
              {SHOP_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setForm((f) => ({ ...f, category: cat }))}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: form.category === cat ? CultureTokens.teal + '20' : colors.surface,
                      borderColor: form.category === cat ? CultureTokens.teal : colors.borderLight,
                    },
                  ]}
                  accessibilityLabel={`Select category ${cat}`}
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles.categoryChipText,
                    { color: form.category === cat ? CultureTokens.teal : colors.textSecondary },
                  ]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              placeholder="Describe the store..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel="Description input"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>City *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.city}
              onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
              placeholder="e.g. Sydney"
              placeholderTextColor={colors.textTertiary}
              accessibilityLabel="City input"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Country *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.country}
              onChangeText={(v) => setForm((f) => ({ ...f, country: v }))}
              placeholder="e.g. Australia"
              placeholderTextColor={colors.textTertiary}
              accessibilityLabel="Country input"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.address}
              onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
              placeholder="e.g. 123 King St, Sydney NSW 2000"
              placeholderTextColor={colors.textTertiary}
              accessibilityLabel="Address input"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Phone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.phone}
              onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="e.g. +61 2 9000 0000"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              accessibilityLabel="Phone input"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Website</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={form.website}
              onChangeText={(v) => setForm((f) => ({ ...f, website: v }))}
              placeholder="e.g. https://store.com.au"
              placeholderTextColor={colors.textTertiary}
              keyboardType="url"
              autoCapitalize="none"
              accessibilityLabel="Website input"
            />

            <View style={[styles.toggleRow, { borderColor: colors.borderLight }]}>
              <View>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Currently Open</Text>
                <Text style={[styles.toggleSub, { color: colors.textSecondary }]}>
                  Show as open to customers
                </Text>
              </View>
              <Switch
                value={form.isOpen}
                onValueChange={(v) => setForm((f) => ({ ...f, isOpen: v }))}
                trackColor={{ false: colors.borderLight, true: CultureTokens.teal + '80' }}
                thumbColor={form.isOpen ? CultureTokens.teal : colors.textTertiary}
                accessibilityLabel="Toggle open status"
              />
            </View>

            <View style={[styles.toggleRow, { borderColor: colors.borderLight }]}>
              <View>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Delivery Available</Text>
                <Text style={[styles.toggleSub, { color: colors.textSecondary }]}>
                  Offer delivery to customers
                </Text>
              </View>
              <Switch
                value={form.deliveryAvailable}
                onValueChange={(v) => setForm((f) => ({ ...f, deliveryAvailable: v }))}
                trackColor={{ false: colors.borderLight, true: CultureTokens.teal + '80' }}
                thumbColor={form.deliveryAvailable ? CultureTokens.teal : colors.textTertiary}
                accessibilityLabel="Toggle delivery availability"
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={isSaving}
              style={[
                styles.submitBtn,
                { backgroundColor: isSaving ? CultureTokens.teal + '80' : CultureTokens.teal },
              ]}
              accessibilityLabel={editingId ? 'Save store changes' : 'Create store'}
              accessibilityRole="button"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name={editingId ? 'checkmark' : 'add'} size={20} color="#fff" />
                  <Text style={styles.submitText}>
                    {editingId ? 'Save Changes' : 'Create Store'}
                  </Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        )}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  accessDeniedText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: ButtonTokens.radiusPill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    gap: 2,
  },
  titleText: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  accentBadge: {
    width: 44,
    height: 44,
    borderRadius: CardTokens.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginRight: 24,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 48,
    gap: 12,
  },
  loader: {
    marginTop: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  emptyAction: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: ButtonTokens.radius,
  },
  emptyActionText: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  storeCard: {
    borderRadius: CardTokens.radius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  storeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: CardTokens.padding,
    gap: 12,
  },
  storeInfo: {
    flex: 1,
    gap: 4,
  },
  storeName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  storeMeta: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  storeBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promotedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  promotedText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  storeActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    gap: 0,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRightWidth: 0,
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  cancelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -4,
    marginTop: 4,
  },
  input: {
    height: 48,
    borderRadius: CardTokens.radius - 4,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  textArea: {
    height: 88,
    paddingTop: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  toggleSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: ButtonTokens.height.md,
    borderRadius: ButtonTokens.radius,
    marginTop: 8,
  },
  submitText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
});
