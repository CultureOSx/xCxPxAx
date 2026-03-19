import { View, Text, Pressable, StyleSheet, ScrollView, Platform, RefreshControlProps } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CultureTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { FilterChipRow, FilterItem } from '@/components/FilterChip';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextStyles } from '@/constants/typography';
import { Card } from '@/components/ui/Card';
import { LinearGradient } from 'expo-linear-gradient';

export interface CategoryFilter {
  label: string;
  icon: string;
  color: string;
  count?: number;
}

export interface BrowseItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  reviews?: number;
  priceLabel?: string;
  badge?: string;
  isPromoted?: boolean;
  meta?: string;
  [key: string]: any;
}

interface BrowsePageProps {
  title: string;
  accentColor?: string;
  accentIcon?: string;
  apiEndpoint?: string;
  categories: CategoryFilter[];
  categoryKey?: string;
  items: BrowseItem[];
  isLoading: boolean;
  promotedItems?: BrowseItem[];
  promotedTitle?: string;
  onItemPress: (item: BrowseItem) => void;
  renderItemExtra?: (item: BrowseItem) => React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  layout?: 'list' | 'grid';
  imageRatio?: number; // width/height
}

function canonicalizeCategoryToken(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

  const aliases: Record<string, string> = {
    movie: 'film',
    movies: 'film',
    cinema: 'film',
    wellbeing: 'wellness',
    'well being': 'wellness',
    'health and wellness': 'wellness',
    arts: 'art',
    artist: 'art',
    artists: 'art',
    workshops: 'workshop',
    'food and drink': 'food',
    cuisine: 'food',
    concerts: 'music',
    concert: 'music',
    'live music': 'music',
    cultural: 'heritage',
    culture: 'heritage',
  };

  return aliases[normalized] ?? normalized;
}

function matchesCategorySelection(value: unknown, selectedCategory: string): boolean {
  const selected = canonicalizeCategoryToken(selectedCategory);

  if (Array.isArray(value)) {
    return value.some((entry) => typeof entry === 'string' && canonicalizeCategoryToken(entry) === selected);
  }

  return typeof value === 'string' && canonicalizeCategoryToken(value) === selected;
}

export default function BrowsePage({
  title,
  tagline,
  accentColor = CultureTokens.indigo,
  accentIcon = 'compass',
  categories,
  categoryKey = 'category',
  items,
  isLoading,
  promotedItems = [],
  promotedTitle = 'Popular',
  onItemPress,
  renderItemExtra,
  emptyMessage = 'Nothing found',
  emptyIcon = 'search-outline',
  refreshControl,
  layout = 'list',
  imageRatio = 1,
}: BrowsePageProps & { tagline?: string }) {
  const colors = useColors();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const [selectedCat, setSelectedCat] = useState('All');

  const filtered = useMemo(() => {
    if (selectedCat === 'All') return items;
    return items.filter((item) => {
      const val = item[categoryKey];
      return matchesCategorySelection(val, selectedCat);
    });
  }, [selectedCat, items, categoryKey]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <Header title={title} accentColor={accentColor} accentIcon={accentIcon} colors={colors} styles={styles} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, gap: 14 }}>
          {[0, 1, 2, 3].map((k) => (
            <View key={k} style={[styles.card, { gap: 16 }]}>
              <Skeleton width={80} height={80} borderRadius={16} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="80%" height={16} borderRadius={8} />
                <Skeleton width="55%" height={13} borderRadius={6} />
                <Skeleton width="95%" height={13} borderRadius={6} />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <Skeleton width={60} height={22} borderRadius={10} />
                  <Skeleton width={48} height={22} borderRadius={10} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <Header title={title} tagline={tagline} accentColor={accentColor} accentIcon={accentIcon} colors={colors} styles={styles} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        refreshControl={refreshControl}
      >
        {promotedItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={[styles.sectionDot, { backgroundColor: accentColor }]} />
              <Text style={styles.sectionTitle}>{promotedTitle}</Text>
              <View style={[styles.promotedBadge, { borderColor: accentColor + '66' }]}>
                <Ionicons name="star" size={10} color={colors.text} />
                <Text style={styles.promotedBadgeText}>Promoted</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            >
              {promotedItems.map((item) => (
                <View key={item.id}>
                  <Pressable
                    style={({ pressed }) => [styles.promoCard, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onItemPress(item);
                    }}
                    accessibilityLabel={item.title}
                    accessibilityRole="button"
                    accessibilityHint="View details"
                  >
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.promoImage} contentFit="cover" transition={200} />
                    ) : (
                      <View style={[styles.promoImage, styles.promoImageFallback, { borderColor: accentColor + '55' }]}>
                        <Ionicons name={accentIcon as any} size={32} color={accentColor} />
                      </View>
                    )}
                    <View style={styles.promoInfo}>
                      <Text style={styles.promoName} numberOfLines={1}>{item.title}</Text>
                      {item.subtitle && <Text style={styles.promoSub} numberOfLines={1}>{item.subtitle}</Text>}
                      <View style={styles.promoBottom}>
                        {item.priceLabel && <Text style={[styles.promoPrice, { color: accentColor }]}>{item.priceLabel}</Text>}
                        {item.rating != null && (
                          <View style={styles.ratingRow}>
                            <Ionicons name="star" size={12} color={CultureTokens.gold} />
                            <Text style={styles.ratingText}>{item.rating}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {categories.length > 0 && (() => {
          const chipItems: FilterItem[] = categories.map((c) => {
            const count = c.label === 'All'
              ? items.length
              : items.filter((item) => {
                  const val = item[categoryKey];
                  return matchesCategorySelection(val, c.label);
                }).length;
            return {
              id: c.label,
              label: c.label,
              icon: c.icon,
              color: c.color,
              count,
            };
          });
          return (
            <FilterChipRow
              items={chipItems}
              selectedId={selectedCat}
              onSelect={setSelectedCat}
            />
          );
        })()}

        <View style={styles.listSection}>
          <View style={styles.listHeaderRow}>
             <Text style={styles.resultCount}>
               {filtered.length} {title.toLowerCase()} found
             </Text>
             {/* Future: Layout toggle here */}
          </View>

          {filtered.length === 0 ? (
            <View style={styles.emptyWrap} accessibilityLiveRegion="polite">
              <View style={styles.emptyIconBg}>
                <Ionicons name={emptyIcon as any} size={48} color="rgba(255,255,255,0.4)" />
              </View>
              <Text style={[TextStyles.bodyMedium, { color: colors.textSecondary }]}>
                {selectedCat !== 'All' ? `No ${title.toLowerCase()} in "${selectedCat}"` : emptyMessage}
              </Text>
              {selectedCat !== 'All' && (
                <Pressable
                  onPress={() => setSelectedCat('All')}
                  accessibilityLabel="Clear filter"
                  accessibilityRole="button"
                >
                  <Text style={[TextStyles.caption, { color: accentColor, textDecorationLine: 'underline', marginTop: 8 }]}>Show all {title.toLowerCase()}</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View
              style={layout === 'grid' ? styles.gridContainer : styles.listContainer}
            >
              {filtered.map((item, idx) => (
                <View
                  key={item.id}
                  style={layout === 'grid' ? styles.gridItem : styles.listItem}
                >
                  <Card
                    padding={layout === 'grid' ? 0 : 14}
                    style={[styles.card, layout === 'grid' && styles.gridCard]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onItemPress(item);
                    }}
                  >
                    <View style={layout === 'grid' ? [styles.gridImageWrap, { aspectRatio: imageRatio }] : styles.cardImage}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
                      ) : (
                        <View style={[StyleSheet.absoluteFillObject, styles.cardImageFallback, { borderColor: accentColor + '35' }]}>
                          <Ionicons name={accentIcon as any} size={layout === 'grid' ? 32 : 28} color={accentColor} />
                        </View>
                      )}
                      {layout === 'grid' && (
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.6)']}
                          style={StyleSheet.absoluteFillObject}
                        />
                      )}
                      {layout === 'grid' && item.badge && (
                        <View style={styles.gridBadge}>
                           <Text style={[TextStyles.badgeCaps, { color: '#FFFFFF', fontSize: 9 }]}>{item.badge}</Text>
                        </View>
                      )}
                    </View>

                    <View style={[styles.cardInfo, layout === 'grid' && styles.gridInfo]}>
                      <View style={styles.cardTitleRow}>
                        <Text style={[layout === 'grid' ? TextStyles.labelSemibold : TextStyles.headline, { color: layout === 'grid' ? '#FFFFFF' : colors.text }]} numberOfLines={1}>{item.title}</Text>
                        {item.isPromoted && (
                          <View style={[styles.miniPromoBadge, { borderColor: accentColor + '55' }]}>
                            <Ionicons name="star" size={10} color={layout === 'grid' ? '#FFFFFF' : colors.text} />
                          </View>
                        )}
                      </View>
                      
                      {item.subtitle && (
                        <Text style={[TextStyles.caption, { color: layout === 'grid' ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      )}

                      {layout === 'list' && item.description && (
                        <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 4 }]} numberOfLines={2}>
                          {item.description}
                        </Text>
                      )}

                      <View style={styles.cardBottom}>
                        {item.priceLabel && (
                          <Text style={[TextStyles.callout, { color: layout === 'grid' ? '#FFFFFF' : accentColor, fontWeight: '700' }]}>
                            {item.priceLabel}
                          </Text>
                        )}
                        {layout === 'list' && item.badge && (
                          <View style={[styles.cardBadge, { borderColor: accentColor + '30' }]}>
                            <Text style={[TextStyles.badgeCaps, { color: colors.textSecondary }]}>{item.badge}</Text>
                          </View>
                        )}
                        {item.rating != null && (
                          <View style={styles.ratingRow}>
                            <Ionicons name="star" size={12} color={CultureTokens.gold} />
                            <Text style={[TextStyles.captionSemibold, { color: layout === 'grid' ? '#FFFFFF' : colors.textSecondary }]}>
                              {item.rating}{item.reviews ? ` (${item.reviews})` : ''}
                            </Text>
                          </View>
                        )}
                      </View>
                      {renderItemExtra?.(item)}
                    </View>
                  </Card>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Header({ title, tagline, accentColor, accentIcon, colors, styles }: { title: string; tagline?: string; accentColor: string; accentIcon: string; colors: ReturnType<typeof useColors>; styles: any }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/'); }}
        style={({ pressed }) => [styles.backBtn, pressed && { backgroundColor: colors.backgroundSecondary }]}
        hitSlop={12}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <View style={styles.headerCenter}>
        <View style={[styles.headerIcon, { backgroundColor: accentColor + '15' }]}>
          <Ionicons name={accentIcon as any} size={18} color={accentColor} />
        </View>
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          {tagline ? <Text style={styles.headerTagline}>{tagline}</Text> : null}
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [styles.backBtn, pressed && { backgroundColor: colors.backgroundSecondary }]}
        hitSlop={12}
        onPress={() => router.push('/search')}
        accessibilityLabel="Search"
        accessibilityRole="button"
      >
        <Ionicons name="search-outline" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerTagline: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
    paddingTop: 10,
  },
  sectionDot: {
    width: 6,
    height: 20,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    flex: 1,
  },
  promotedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
  },
  promotedBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promoCard: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  promoImage: {
    width: '100%',
    height: 140,
  },
  promoImageFallback: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  promoInfo: {
    padding: 16,
    gap: 4,
  },
  promoName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    lineHeight: 22,
  },
  promoSub: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
  },
  promoBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  promoPrice: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textSecondary,
  },
  listSection: {
    paddingHorizontal: 20,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultCount: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.textTertiary,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyIconBg: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  listContainer: {
    gap: 14,
  },
  listItem: {
    width: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: Platform.OS === 'web' ? '18%' : '47%',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 14,
    overflow: 'hidden',
  },
  gridCard: {
    flexDirection: 'column',
    gap: 0,
    backgroundColor: '#111',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  gridImageWrap: {
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  cardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  gridBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  gridInfo: {
    padding: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    gap: 0,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniPromoBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  cardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
  },
});
