import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, gradients, TextStyles } from '@/constants/theme';
import { interestCategories as staticCategories } from '@/constants/onboardingInterests';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const isWeb = Platform.OS === 'web';

function TaxonomyTag({ label, color, onRemove }: { label: string, color: string, onRemove: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.tag, { backgroundColor: color + '15', borderColor: color + '40' }]}>
      <Text style={[styles.tagText, { color: colors.text }]}>{label}</Text>
      <Pressable 
        onPress={() => {
          if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onRemove();
        }}
        style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name="close-circle" size={14} color={color} />
      </Pressable>
    </View>
  );
}

export default function AdminTaxonomyScreen() {
  const insets = useSafeAreaInsets();
  const topInset = isWeb ? 0 : insets.top;
  const colors = useColors();
  const { hPad, contentWidth, isDesktop } = useLayout();
  
  const { data: taxonomyData, isLoading, refetch } = useQuery({
    queryKey: ['admin-taxonomy'],
    queryFn: api.admin.getTaxonomy,
  });

  const categories = taxonomyData?.categories || staticCategories.map(c => ({ 
    id: c.id, 
    title: c.title, 
    tags: c.interests, 
    accentColor: c.accentColor,
    updatedAt: new Date().toISOString()
  }));

  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const currentCategory = categories.find(c => c.id === activeCategory) || categories[0];
  const filteredTags = (currentCategory.tags || []).filter(i => 
    i.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mutation = useMutation({
    mutationFn: ({ id, tags }: { id: string, tags: string[] }) => api.admin.updateTaxonomy(id, tags),
    onSuccess: () => {
      refetch();
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      Alert.alert('Taxonomy Error', err?.message || 'Failed to update tags');
    }
  });

  const handleRemoveTag = (tag: string) => {
    Alert.alert('Remove Tag', `Are you sure you want to remove "${tag}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Remove', 
        style: 'destructive',
        onPress: () => {
          const newTags = currentCategory.tags.filter(t => t !== tag);
          mutation.mutate({ id: currentCategory.id, tags: newTags });
        }
      }
    ]);
  };

  const handleAddTag = () => {
    if (isWeb) {
      const tag = window.prompt('Enter new tag name:');
      if (tag && tag.trim()) {
        const newTags = [...currentCategory.tags, tag.trim()];
        mutation.mutate({ id: currentCategory.id, tags: newTags });
      }
      return;
    }

    Alert.prompt(
      'New Tag',
      `Add a new tag to the ${currentCategory.title} category`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: (tag?: string) => {
            if (tag && tag.trim()) {
              const newTags = [...currentCategory.tags, tag.trim()];
              mutation.mutate({ id: currentCategory.id, tags: newTags });
            }
          }
        }
      ],
      'plain-text'
    );
  };

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <LinearGradient
          colors={gradients.midnight as unknown as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingTop: topInset, zIndex: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}
        >
          <Animated.View entering={FadeInUp.duration(300)} style={[styles.header, { paddingHorizontal: hPad }]}>
            <View style={[styles.headerControlGlass, { backgroundColor: 'rgba(24,28,48,0.92)' }]}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
                accessibilityRole="button" accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </Pressable>
            </View>
            
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Taxonomy Manager</Text>
              <Text style={[styles.headerSub, { color: CultureTokens.purple }]}>Cultural Metadata & Interests</Text>
            </View>

            <View style={[styles.headerControlGlass, { backgroundColor: 'rgba(24,28,48,0.92)' }]}>
              <Pressable 
                onPress={() => {
                  if (!isWeb) Haptics.selectionAsync();
                }}
                style={styles.badgeWrap}
              >
                <Ionicons name="add" size={16} color={CultureTokens.gold} />
                <Text style={[styles.badgeText, { color: CultureTokens.gold }]}>NEW CATEGORY</Text>
              </Pressable>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── Tabs / Category Selector ───────────────────────────────────────── */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: hPad, paddingVertical: 12, gap: 8 }}
          >
            {categories.map(cat => (
              <Pressable
                key={cat.id}
                onPress={() => {
                  setActiveCategory(cat.id);
                  if (!isWeb) Haptics.selectionAsync();
                }}
                style={[
                  styles.tab, 
                  { backgroundColor: activeCategory === cat.id ? (cat.accentColor || '#666') + '20' : 'transparent', 
                    borderColor: activeCategory === cat.id ? (cat.accentColor || '#666') : colors.borderLight }
                ]}
              >
                <Text style={[
                  styles.tabText, 
                  { color: activeCategory === cat.id ? colors.text : colors.textTertiary,
                    fontFamily: activeCategory === cat.id ? 'Poppins_600SemiBold' : 'Poppins_400Regular' }
                ]}>
                  {cat.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: hPad, paddingBottom: insets.bottom + 40 },
            isDesktop && { width: contentWidth, alignSelf: 'center' }
          ]}
        >
          {/* Search & Actions */}
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Ionicons name="search" size={18} color={colors.textTertiary} />
            <TextInput
              placeholder="Search tags..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {currentCategory.title} — {filteredTags.length} Tags
            </Text>
          </View>

          <View style={[styles.tagGridCard, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
            {isLoading ? (
              <ActivityIndicator color={currentCategory.accentColor} style={{ padding: 20 }} />
            ) : (
              <View style={styles.tagGrid}>
                {filteredTags.map((tag, i) => (
                  <Animated.View key={tag} entering={FadeInDown.delay(i * 10).duration(200)}>
                    <TaxonomyTag 
                      label={tag} 
                      color={currentCategory.accentColor || '#666'} 
                      onRemove={() => handleRemoveTag(tag)} 
                    />
                  </Animated.View>
                ))}
                <Pressable 
                  style={[styles.addTag, { borderColor: currentCategory.accentColor, borderStyle: 'dashed' }]}
                  onPress={handleAddTag}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <ActivityIndicator size="small" color={currentCategory.accentColor} />
                  ) : (
                    <>
                      <Ionicons name="add" size={16} color={currentCategory.accentColor} />
                      <Text style={[styles.addTagText, { color: currentCategory.accentColor }]}>Add Tag</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: CultureTokens.indigo + '10', borderColor: CultureTokens.indigo + '30' }]}>
            <Ionicons name="information-circle-outline" size={18} color={CultureTokens.indigo} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Taxonomy tags defined here power user onboarding interests, event categorization, and the Discovery Engine matching logic.
            </Text>
          </View>

        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerControlGlass: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  backBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TextStyles.title2,
    letterSpacing: -0.5,
    marginBottom: -2,
  },
  headerSub: {
    ...TextStyles.badge,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  badgeText: {
    ...TextStyles.tabLabel,
    letterSpacing: 1,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
  },
  content: {
    paddingTop: 24,
    gap: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...TextStyles.cardBody,
    padding: 0,
  },
  sectionHeader: {
    marginBottom: -10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    ...TextStyles.captionSemibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tagGridCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  tagText: {
    ...TextStyles.chip,
  },
  addTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  addTagText: {
    ...TextStyles.chip,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  infoText: {
    flex: 1,
    ...TextStyles.caption,
    lineHeight: 18,
  },
});
