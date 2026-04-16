import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens, EntityTypeColors, CardTokens, FontFamily, FontSize, LineHeight } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import type { Profile, EventData } from '@/shared/schema';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/dateUtils';

export const isWeb = Platform.OS === 'web';

// ─── Constants ────────────────────────────────────────────────────────────────

export const TYPE_ICONS: Record<string, string> = {
  business:     'storefront',
  venue:        'location',
  organisation: 'business',
  council:      'shield-checkmark',
  government:   'flag',
  charity:      'heart',
  artist:       'brush',
  brand:        'ribbon',
};

export const ENTITY_FILTERS = [
  { label: 'All',          icon: 'grid',             color: CultureTokens.indigo,          display: 'All' },
  { label: 'event',        icon: 'calendar',          color: CultureTokens.gold,            display: 'Events' },
  { label: 'indigenous',   icon: 'leaf',              color: CultureTokens.teal,            display: '🪃 Indigenous' },
  { label: 'business',     icon: 'storefront',        color: EntityTypeColors.business,      display: 'Businesses' },
  { label: 'venue',        icon: 'location',          color: EntityTypeColors.venue,         display: 'Venues' },
  { label: 'organisation', icon: 'business',          color: EntityTypeColors.organisation,  display: 'Organisations' },
  { label: 'council',      icon: 'shield-checkmark',  color: EntityTypeColors.council,       display: 'Councils' },
  { label: 'government',   icon: 'flag',              color: EntityTypeColors.government,    display: 'Government' },
  { label: 'charity',      icon: 'heart',             color: EntityTypeColors.charity,       display: 'Charities' },
  { label: 'artist',       icon: 'mic',               color: CultureTokens.coral,           display: 'Artists' },
  { label: 'creator',      icon: 'sparkles',          color: CultureTokens.gold,            display: 'Creators' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTags(profile: Profile): string[] {
  return Array.isArray(profile.tags) ? (profile.tags as string[]) : [];
}

export function getDirectoryListingType(profile: Profile): string {
  const category = (profile.category ?? '').toLowerCase();
  if (category === 'council') return 'council';
  return profile.entityType;
}

export function getOptionalString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

// ─── FilterDivider ────────────────────────────────────────────────────────────

export function FilterDivider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ width: 1, height: 18, backgroundColor: colors.borderLight, marginHorizontal: 4, alignSelf: 'center' }} />
  );
}

// ─── FeaturedRail ─────────────────────────────────────────────────────────────

export function FeaturedRail({
  profiles,
  colors,
}: {
  profiles: Profile[];
  colors: ReturnType<typeof useColors>;
}) {
  if (profiles.length === 0) return null;

  return (
    <View style={fr.wrap}>
      <View style={fr.header}>
        <View style={fr.headerLeft}>
          <View style={[fr.accentBar, { backgroundColor: CultureTokens.gold }]} />
          <Text style={[fr.title, { color: colors.text }]}>Featured</Text>
        </View>
        <Ionicons name="star" size={14} color={CultureTokens.gold} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={fr.scroll}
      >
        {profiles.slice(0, 8).map(p => {
          const color = (EntityTypeColors as Record<string, string>)[p.entityType] ?? CultureTokens.indigo;
          return (
            <Pressable
              key={p.id}
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: p.id } })}
              style={({ pressed }) => [
                fr.card,
                { borderColor: colors.borderLight },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`View ${p.name} profile`}
            >
              {p.imageUrl ? (
                <Image source={{ uri: p.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
              ) : (
                <View style={[fr.imgPlaceholder, { backgroundColor: color + '33' }]}>
                  <Ionicons
                    name={(TYPE_ICONS[p.entityType] ?? 'business') as keyof typeof Ionicons.glyphMap}
                    size={30}
                    color={color}
                  />
                </View>
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0.3 }}
                end={{ x: 0, y: 1 }}
              />
              <View style={fr.cardInfo}>
                {p.isVerified && (
                  <View style={[fr.verifiedBadge, { backgroundColor: CultureTokens.indigo }]}>
                    <Ionicons name="shield-checkmark" size={9} color={colors.textInverse} />
                  </View>
                )}
                <Text style={[fr.cardName, { color: colors.textInverse }]} numberOfLines={2}>{p.name}</Text>
                <Text style={[fr.cardType, { color: colors.textInverse, opacity: 0.86 }]} numberOfLines={1}>
                  {p.category ?? p.entityType}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const fr = StyleSheet.create({
  wrap:       { marginBottom: 8, paddingTop: 4 },
  header:     {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  accentBar:  { width: 3, height: 20, borderRadius: 2 },
  title:      { fontSize: FontSize.title3, fontFamily: FontFamily.bold, lineHeight: LineHeight.title3, letterSpacing: -0.2 },
  scroll:     { paddingHorizontal: 20, gap: 10, paddingRight: 32 },
  card: {
    width: 118,
    height: 156,
    borderRadius: CardTokens.radius,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 5, shadowColor: '#000' },
      web:     { boxShadow: '0 6px 20px rgba(0,0,0,0.18)' },
    }),
  },
  imgPlaceholder: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  cardInfo:       { position: 'absolute', bottom: 10, left: 10, right: 10 },
  verifiedBadge:  {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  cardName: { fontSize: FontSize.caption, fontFamily: FontFamily.bold, lineHeight: LineHeight.caption },
  cardType: {
    fontSize: FontSize.micro,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.micro,
    textTransform: 'capitalize',
    marginTop: 2,
  },
});

// ─── DirectoryEventCard ───────────────────────────────────────────────────────

export function DirectoryEventCard({
  event,
  isSaved,
  onSave,
  colors,
}: {
  event: EventData;
  isSaved: boolean;
  onSave: (id: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const heartScale = useSharedValue(1);
  const animatedHeart = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  const handleSave = () => {
    heartScale.value = withSpring(1.4, { damping: 8 });
    setTimeout(() => { heartScale.value = withSpring(1, { damping: 10 }); }, 200);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(event.id);
  };

  const priceLabel = event.isFree ? 'Free' : event.priceCents ? formatPrice(event.priceCents, event.country) : null;
  const categoryColor = CultureTokens.gold;
  const priceAccent = priceLabel === 'Free' ? CultureTokens.teal : categoryColor;

  let dayNum = '', monthStr = '';
  const dateObj = new Date(event.date);
  if (!isNaN(dateObj.getTime())) {
    dayNum = dateObj.toLocaleString(undefined, { day: 'numeric' });
    monthStr = dateObj.toLocaleString(undefined, { month: 'short' });
  }

  const hasImage = Boolean(event.imageUrl);

  return (
    <View style={{ marginBottom: 12, position: 'relative' }}>
      <Pressable
        onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
        style={({ pressed }) => [
          s.directoryCard,
          pressed && { opacity: 0.93, transform: [{ scale: 0.99 }] },
        ]}
        accessibilityRole="link"
        accessibilityLabel={`View event: ${event.title}`}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderColor: colors.borderLight,
              borderWidth: StyleSheet.hairlineWidth,
              backgroundColor: colors.surface,
            },
          ]}
        />
        <View style={s.eventCardInner}>
          {/* Left: image thumbnail with date overlay, or plain date block */}
          {hasImage ? (
            <View style={s.eventImgBlock}>
              <Image source={{ uri: event.imageUrl! }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient
                colors={['transparent', categoryColor + 'E6']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0.2 }}
                end={{ x: 0, y: 1 }}
              />
              <View style={s.eventDateOverlay}>
                <Text style={[s.eventDateDay, { color: colors.textInverse }]}>{dayNum}</Text>
                <Text style={[s.eventDateMonth, { color: colors.textInverse }]}>{monthStr.toUpperCase().slice(0, 3)}</Text>
              </View>
            </View>
          ) : (
            <BlurView
              intensity={Platform.OS === 'ios' ? 30 : 60}
              tint="dark"
              style={[s.eventDateBlock, { backgroundColor: categoryColor + 'AA' }]}
            >
              <Text style={[s.eventDateDay, { color: colors.textInverse }]}>{dayNum}</Text>
              <Text style={[s.eventDateMonth, { color: colors.textInverse }]}>{monthStr.toUpperCase().slice(0, 3)}</Text>
            </BlurView>
          )}

          {/* Content */}
          <View style={s.eventCardContent}>
            {event.category ? (
              <View style={[s.eventCatBadge, { backgroundColor: categoryColor + '1A', borderColor: categoryColor + '30', borderWidth: 1 }]}>
                <Text style={[s.eventCatText, { color: categoryColor }]}>{event.category}</Text>
              </View>
            ) : null}
            <Text style={[s.eventCardTitle, { color: colors.text }]} numberOfLines={2}>
              {event.title}
            </Text>
            {event.city ? (
              <View style={s.eventLocationRow}>
                <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                <Text style={[s.eventLocationText, { color: colors.textTertiary }]} numberOfLines={1}>
                  {event.city}
                </Text>
              </View>
            ) : null}
            <View style={s.eventCardFooter}>
              {priceLabel ? (
                <View style={[s.eventPriceBadge, { backgroundColor: priceAccent + '1A', borderWidth: 1, borderColor: priceAccent + '30' }]}>
                  <Text style={[s.eventPriceText, { color: priceAccent }]}>{priceLabel}</Text>
                </View>
              ) : null}
              <Text style={[s.viewLink, { color: categoryColor }]}>View →</Text>
            </View>
          </View>
        </View>
      </Pressable>

      {/* Floating save button */}
      <Pressable
        onPress={handleSave}
        style={({ pressed }) => [s.saveBtn, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel={isSaved ? 'Unsave event' : 'Save event'}
        hitSlop={15}
      >
        <Animated.View style={animatedHeart}>
          <View style={[s.heartBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={18}
              color={isSaved ? CultureTokens.coral : colors.text}
            />
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

// ─── DirectoryCard ────────────────────────────────────────────────────────────

export function DirectoryCard({
  profile,
  colors,
}: {
  profile: Profile;
  colors: ReturnType<typeof useColors>;
}) {
  const color = (EntityTypeColors as Record<string, string>)[profile.entityType] ?? CultureTokens.indigo;
  const icon = TYPE_ICONS[profile.entityType] ?? 'business';
  const tags = getTags(profile);
  const profileRecord = profile as unknown as Record<string, unknown>;
  const address = getOptionalString(profileRecord, 'address');
  const isCouncil = (profile.category ?? '').toLowerCase() === 'council';
  const isProfessional = ['artist', 'creator', 'brand'].includes(profile.entityType);
  const accent = isProfessional ? CultureTokens.gold : color;
  const followersCount = (profileRecord.followersCount as number | undefined) ?? 0;

  const handlePress = () => {
    router.push({ pathname: '/profile/[id]', params: { id: profile.id } });
  };

  const renderStars = (rating: number) =>
    [1, 2, 3, 4, 5].map((star) => (
      <Ionicons key={star} name={star <= Math.round(rating) ? 'star' : 'star-outline'} size={11} color={CultureTokens.gold} />
    ));

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        s.directoryCard,
        (isCouncil || isProfessional) && { borderWidth: 0 },
        pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
      ]}
      accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
      accessibilityLabel={`View ${profile.name} profile`}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colors.surface,
            borderWidth: (isCouncil || isProfessional) ? 1.5 : StyleSheet.hairlineWidth,
            borderColor: isProfessional
              ? CultureTokens.gold + '60'
              : isCouncil
              ? CultureTokens.indigo + '60'
              : colors.borderLight,
          },
        ]}
      />
      {(isCouncil || isProfessional) && (
        <LinearGradient
          colors={isProfessional
            ? [`${CultureTokens.gold}1A`, 'transparent']
            : [CultureTokens.indigo + '1F', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      <View style={s.profileCardInner}>
        {/* Avatar / Icon */}
        {profile.imageUrl ? (
          <Image
            source={{ uri: profile.imageUrl }}
            style={s.profileAvatar}
            contentFit="cover"
            accessibilityLabel={`${profile.name} logo`}
            transition={300}
          />
        ) : (
          <View style={[s.profileIconBox, { backgroundColor: color + '15', borderWidth: 1, borderColor: color + '30' }]}>
            <Ionicons
              name={isCouncil ? 'shield-checkmark' : (icon as keyof typeof Ionicons.glyphMap)}
              size={28}
              color={color}
            />
          </View>
        )}

        {/* Content */}
        <View style={s.profileCardContent}>
          {/* Name + verified icon */}
          <View style={s.profileNameRow}>
            <Text style={[s.profileName, { color: colors.text }]} numberOfLines={1}>
              {profile.name}
            </Text>
            {(profile.isVerified || isProfessional) && (
              <Ionicons
                name="shield-checkmark"
                size={15}
                color={isProfessional ? CultureTokens.gold : CultureTokens.indigo}
              />
            )}
          </View>

          {/* Category badge + location on same row */}
          <View style={s.profileBadgeRow}>
            <View style={[s.categoryBadge, { backgroundColor: accent + '15', borderWidth: 1, borderColor: accent + '30' }]}>
              <Text style={[s.categoryBadgeText, { color: accent }]} numberOfLines={1}>
                {profile.category ?? profile.entityType}
              </Text>
            </View>
            {(address || profile.city) ? (
              <View style={s.profileLocationRow}>
                <Ionicons name="location-outline" size={10} color={colors.textTertiary} />
                <Text style={[s.profileLocationText, { color: colors.textTertiary }]} numberOfLines={1}>
                  {address ?? (profile.city ?? '')}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Short description */}
          {profile.description ? (
            <Text style={[s.profileDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {profile.description}
            </Text>
          ) : null}

          {/* Meta row: rating / followers / tags + view link */}
          <View style={s.profileMetaRow}>
            {profile.rating != null ? (
              <View style={s.starsRow}>
                {renderStars(profile.rating)}
                {(profile.reviewsCount ?? 0) > 0 ? (
                  <Text style={[s.reviewCountText, { color: colors.textTertiary }]}>
                    ({profile.reviewsCount})
                  </Text>
                ) : null}
              </View>
            ) : followersCount > 0 ? (
              <Text style={[s.followersText, { color: colors.textTertiary }]}>
                {followersCount >= 1000
                  ? `${(followersCount / 1000).toFixed(1)}k`
                  : followersCount}{' '}followers
              </Text>
            ) : tags.length > 0 ? (
              <View style={s.tagsRow}>
                {tags.slice(0, 2).map(tag => (
                  <View key={tag} style={[s.tagPill, { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderLight }]}>
                    <Text style={[s.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                  </View>
                ))}
                {tags.length > 2 ? (
                  <Text style={[s.moreTagsText, { color }]}>+{tags.length - 2}</Text>
                ) : null}
              </View>
            ) : null}

            <Text style={[s.viewLink, { color }]}>View →</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── DirectoryEmptyState ──────────────────────────────────────────────────────

export function DirectoryEmptyState({
  selectedType,
  city,
  hasActiveFilters,
  colors,
  onReset,
}: {
  selectedType: string;
  city: string | null | undefined;
  hasActiveFilters: boolean;
  colors: ReturnType<typeof useColors>;
  onReset: () => void;
}) {
  const filter = ENTITY_FILTERS.find(f => f.label === selectedType);
  const entityLabel = filter?.display ?? 'listings';
  const icon = filter?.icon ?? 'storefront-outline';
  const cityLabel = city ? ` in ${city}` : '';

  return (
    <View style={s.emptyState}>
      <View style={[s.emptyIconBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={40} color={colors.textTertiary} />
      </View>
      <Text style={[s.emptyTitle, { color: colors.text }]}>
        No {entityLabel.replace('🪃 ', '')} found{cityLabel}
      </Text>
      <Text style={[s.emptySubtext, { color: colors.textSecondary }]}>
        {hasActiveFilters
          ? 'Try a different filter or search term'
          : 'Check back soon — new listings are added regularly'}
      </Text>
      {hasActiveFilters && (
        <View style={{ marginTop: 12 }}>
          <Button variant="secondary" size="md" onPress={onReset}>
            Reset Filters
          </Button>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

export const s = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, overflow: 'hidden',
  },
  title: {
    fontSize: FontSize.title,
    fontFamily: FontFamily.bold,
    lineHeight: LineHeight.title,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    lineHeight: LineHeight.caption,
  },

  // ── Search ──
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 12,
    paddingHorizontal: 10,
    gap: 6,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.chip,
    fontFamily: FontFamily.regular,
    lineHeight: LineHeight.chip,
    height: 38,
    padding: 0,
    minWidth: 0,
  },

  // ── Filter block ──
  filterBlock:  { borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingBottom: 4 },
  filterRow:    { flexDirection: 'row', alignItems: 'center', gap: 7 },
  clearBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  clearBtnText: { fontSize: FontSize.caption, fontFamily: FontFamily.semibold, lineHeight: LineHeight.caption },

  // ── Divider ──
  divider: { height: StyleSheet.hairlineWidth },

  // ── List ──
  list: { paddingTop: 14 },

  // ── Web 2-col grid ──
  resultsGridWeb:     { flexDirection: 'row', flexWrap: 'wrap' },
  resultsGridItemWeb: { width: isWeb ? '100%' : '100%' },

  // ── Directory card (shared base) ──
  directoryCard: {
    borderRadius: CardTokens.radius,
    borderWidth: 0,
    marginBottom: 12,
    overflow: 'hidden',
  },

  // ── Event card ──
  eventCardInner: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 92,
  },
  // Image thumbnail (when event has imageUrl)
  eventImgBlock: {
    width: 90,
    position: 'relative',
    overflow: 'hidden',
  },
  eventDateOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 1,
  },
  // Plain date block (when no image)
  eventDateBlock: {
    width: 62,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 2,
  },
  eventDateDay: {
    fontSize: FontSize.title2,
    fontFamily: FontFamily.bold,
    lineHeight: LineHeight.title2,
  },
  eventDateMonth: {
    fontSize: FontSize.tab,
    fontFamily: FontFamily.bold,
    lineHeight: LineHeight.tab,
    letterSpacing: 0.5,
  },
  eventCardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 3,
    justifyContent: 'center',
  },
  eventCatBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 2,
  },
  eventCatText: {
    fontSize: FontSize.tab,
    fontFamily: FontFamily.bold,
    lineHeight: LineHeight.tab,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  eventCardTitle: {
    fontSize: FontSize.callout,
    fontFamily: FontFamily.bold,
    lineHeight: LineHeight.callout,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocationText: {
    fontSize: FontSize.micro,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.micro,
  },
  eventCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  eventPriceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  eventPriceText: {
    fontSize: FontSize.micro,
    fontFamily: FontFamily.bold,
    lineHeight: LineHeight.micro,
  },
  saveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },

  // ── Profile card ──
  profileCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  profileAvatar: {
    width: 76,
    height: 76,
    borderRadius: CardTokens.radius,
  },
  profileIconBox: {
    width: 76,
    height: 76,
    borderRadius: CardTokens.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCardContent: {
    flex: 1,
    gap: 4,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  profileName: {
    fontSize: FontSize.callout,
    fontFamily: FontFamily.bold,
    flexShrink: 1,
    lineHeight: LineHeight.callout,
  },
  profileBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  categoryBadgeText: {
    fontSize: FontSize.micro,
    fontFamily: FontFamily.semibold,
    lineHeight: LineHeight.micro,
    textTransform: 'capitalize',
  },
  profileLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  profileLocationText: {
    fontSize: FontSize.micro,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.micro,
    flexShrink: 1,
  },
  profileDesc: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    lineHeight: LineHeight.caption,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewCountText: {
    fontSize: FontSize.tab,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.tab,
    marginLeft: 3,
  },
  followersText: {
    fontSize: FontSize.micro,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.micro,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    flexWrap: 'nowrap',
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tagText: {
    fontSize: FontSize.tab,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.tab,
  },
  moreTagsText: {
    fontSize: FontSize.tab,
    fontFamily: FontFamily.bold,
    lineHeight: LineHeight.tab,
  },
  viewLink: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.bold,
    lineHeight: LineHeight.caption,
    marginLeft: 'auto',
  },

  // ── Empty state ──
  emptyState:  { alignItems: 'center', paddingVertical: 72, gap: 12 },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle:   { fontSize: FontSize.title3, fontFamily: FontFamily.semibold, lineHeight: LineHeight.title3, textAlign: 'center' },
  emptySubtext: {
    fontSize: FontSize.chip,
    fontFamily: FontFamily.regular,
    lineHeight: LineHeight.chip,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // ── Acknowledgement footer ──
  acknowledgementWrap: {
    padding: 24,
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    gap: 12,
  },
  acknowledgementText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.chip,
    textAlign: 'center',
    lineHeight: LineHeight.chip,
    maxWidth: 400,
  },
});
