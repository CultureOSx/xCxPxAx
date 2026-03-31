import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ActivityIndicator, Linking } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, webShadow } from '@/constants/theme';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { EventData } from '@/shared/schema';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { goBackOrReplace } from '@/lib/navigation';
import { Card } from '@/components/ui/Card';
import { TextStyles } from '@/constants/typography';
import TabScreenShell from '@/components/tabs/TabScreenShell';
import { useLayout } from '@/hooks/useLayout';
import { BrandPlaylist } from '@/components/profile/BrandPlaylist';
import { DEFAULT_DISCOVER_CURATION } from '@/shared/schema/discover';

const ENTITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  community: 'people',
  organisation: 'business',
  venue: 'location',
  business: 'storefront',
  council: 'shield-checkmark',
  government: 'flag',
  user: 'person',
};

const SOCIAL_ICONS: { key: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'facebook',  icon: 'logo-facebook',  color: '#FFFFFF' },
  { key: 'instagram', icon: 'logo-instagram', color: '#FFFFFF' },
  { key: 'twitter',   icon: 'logo-twitter',   color: '#FFFFFF' },
  { key: 'linkedin',  icon: 'logo-linkedin',  color: '#FFFFFF' },
  { key: 'youtube',   icon: 'logo-youtube',   color: '#FFFFFF' },
  { key: 'tiktok',    icon: 'logo-tiktok',    color: '#FFFFFF' },
];

const _PD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const _PM = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatEventDate(dateStr: string, timeStr?: string | null): string {
  const p = dateStr.split('-');
  if (p.length !== 3) return dateStr;
  const year = parseInt(p[0], 10), mi = parseInt(p[1], 10) - 1, day = parseInt(p[2], 10);
  if (Number.isNaN(year) || Number.isNaN(mi) || Number.isNaN(day)) return dateStr;
  const dt   = new Date(year, mi, day);
  const base = `${_PD[dt.getDay()]}, ${day} ${_PM[mi]} ${year}`;
  if (!timeStr) return base;
  const m = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
  if (!m) return base;
  let h = parseInt(m[1], 10);
  const min = m[2], ap = m[3]?.toUpperCase();
  if (!ap) { const s = h >= 12 ? 'PM' : 'AM'; if (h === 0) h = 12; else if (h > 12) h -= 12; return `${base} · ${h}:${min}${s}`; }
  return `${base} · ${h}:${min}${ap}`;
}

function formatNumber(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

export default function ProfileDetailScreen() {
  const colors = useColors();
  const { isDesktop, width } = useLayout();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets, isDesktop);
  const { id } = useLocalSearchParams();
  
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  
  const contentMaxWidth = isDesktop ? 960 : width;

  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['/api/profiles-and-users', id as string],
    queryFn: async () => {
      try {
        const entity = await api.profiles.get(id as string);
        return entity;
      } catch (err: any) {
        if (err?.status === 404 || err?.status === 403 || err?.status === 401 || err?.status === 400 || err?.message?.includes('found')) {
          try {
            const user = await api.users.get(id as string);
            return {
              id: user.id,
              name: user.displayName || user.username || 'Anonymous User',
              entityType: 'user',
              avatarUrl: user.avatarUrl,
              bio: user.bio,
              city: user.city,
              country: user.country,
              location: user.location,
              socialLinks: user.socialLinks || {},
              website: user.website,
              address: '',
              tags: user.languages || [],
              followersCount: 0,
              membersCount: 0,
              privacySettings: user.privacySettings || { profileVisible: true, locationVisible: true },
            };
          } catch {
            throw new Error('Could not find an Entity or a User with that ID.');
          }
        }
        throw err;
      }
    },
    enabled: !!id,
  });

  const { userId: currentUserId } = useAuth();
  const isOwner = currentUserId === id;
  const isPrivate = profile?.entityType === 'user' && profile?.privacySettings?.profileVisible === false;

  const { data: allEventsData = [] } = useQuery<EventData[]>({
    queryKey: ['/api/events', profile?.city, profile?.country],
    queryFn: async () => {
      const response = await api.events.list({
        city: profile?.city,
        country: profile?.country,
        pageSize: 40,
      });
      return response.events ?? [];
    },
    enabled: Boolean(profile),
  });

  if (isLoading) {
    return (
      <ErrorBoundary>
        <View style={[styles.container, { paddingTop: topInset, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={CultureTokens.indigo} />
        </View>
      </ErrorBoundary>
    );
  }

  if (!profile) {
    return (
      <ErrorBoundary>
        <View style={[styles.container, { paddingTop: topInset, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.errorText}>Profile not found</Text>
          <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={styles.backLinkBtn}>
            <Text style={styles.backLink}>Go Back</Text>
          </Pressable>
        </View>
      </ErrorBoundary>
    );
  }

  if (isPrivate && !isOwner) {
    return (
      <ErrorBoundary>
        <View style={[styles.container, { paddingTop: topInset, justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
           <View style={[styles.glassBtn, { width: 80, height: 80, borderRadius: 40, marginBottom: 20, backgroundColor: colors.backgroundSecondary }]}>
             <Ionicons name="lock-closed" size={32} color={colors.textTertiary} />
           </View>
           <Text style={[TextStyles.title3, { color: colors.text, textAlign: 'center' }]}>This profile is private</Text>
           <Text style={[TextStyles.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>{"Only followers can see this user's details."}</Text>
           <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={[styles.backLinkBtn, { marginTop: 24 }]}>
              <Text style={styles.backLink}>Go Back</Text>
           </Pressable>
        </View>
      </ErrorBoundary>
    );
  }

  const entityColor = CultureTokens.indigo; 
  const entityIcon = profile.entityType === 'user' ? 'person' : ENTITY_ICONS[profile.entityType] || 'person';
  const socialLinks = (profile.socialLinks || {}) as Record<string, string | undefined>;
  const activeSocials = SOCIAL_ICONS.filter(s => socialLinks[s.key] || (profile as Record<string, unknown>)[s.key]);
  const tags = (profile.tags || []) as string[];
  
  const showLocation = isOwner || profile?.privacySettings?.locationVisible !== false;
  const locationText = showLocation ? [profile.city, profile.country].filter(Boolean).join(', ') : '';
  
  const heroImage = profile.coverImageUrl || profile.avatarUrl;
  const isProfessional = ['artist', 'creator', 'brand'].includes(profile.entityType);
  const accentColor = isProfessional ? CultureTokens.gold : CultureTokens.indigo;

  const matchedEvents = allEventsData.filter((ev) => {
    const pName = (profile.name || '').toLowerCase();
    const tag = (ev.communityId || '').toLowerCase();
    const organizerId = (ev.organizerId || '').toLowerCase();
    const pTags = (profile.tags || []) as string[];
    
    return tag.includes(pName) || organizerId.includes(pName) || pTags.some(t => tag.includes(t.toLowerCase()));
  });
  
  const displayEvents = matchedEvents.length > 0 ? matchedEvents.slice(0, 6) : allEventsData.slice(0, 6);

  const stats = [
    { label: 'Followers', value: profile.followersCount || 0 },
    profile.membersCount ? { label: 'Members', value: profile.membersCount } : null,
    profile.likes ? { label: 'Likes', value: profile.likes } : null,
  ].filter(Boolean) as { label: string; value: number }[];

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Stack.Screen options={{ title: profile.name || 'Profile' }} />
        <Head>
          <title>{`${profile.name} | CulturePass`}</title>
          <meta name="description" content={profile.bio || profile.description || `Discover ${profile.name} on CulturePass.`} />
          <meta property="og:title" content={`${profile.name} | CulturePass`} />
          <meta property="og:description" content={profile.bio || profile.description || `Discover ${profile.name} on CulturePass.`} />
          {heroImage && <meta property="og:image" content={heroImage} />}
          <meta property="og:url" content={`https://culturepass.app/profile/${id}`} />
          <meta name="twitter:card" content="summary_large_image" />
        </Head>

        <TabScreenShell 
          contentMaxWidth={contentMaxWidth} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        >
          <View style={styles.heroSection}>
            <LinearGradient
              colors={gradients.primary as [string, string]}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {heroImage && (
              <Image source={{ uri: heroImage }} style={styles.avatarLarge} contentFit="cover" transition={300} />
            )}
            
            <View style={styles.heroTopRow}>
              <Pressable
                onPress={() => goBackOrReplace('/(tabs)')}
                style={[styles.glassBtn, { width: 40, height: 40 }]}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </Pressable>

              <Pressable 
                onPress={async () => {
                  if (Platform.OS !== 'web') Haptics.impactAsync();
                  const handle = profile.handle;
                  const shareUrl = handle ? `https://culturepass.app/+${handle}` : `https://culturepass.app/profile/${id}`;
                  try {
                    if (Platform.OS === 'web' && navigator.share) {
                      await navigator.share({ 
                        title: `${profile.name} | CulturePass`, 
                        text: profile.bio || `Check out ${profile.name} on CulturePass`,
                        url: shareUrl 
                      });
                    } else {
                      const { Share } = await import('react-native');
                      await Share.share({ title: profile.name, message: shareUrl });
                    }
                  } catch {}
                }} 
                style={[styles.glassBtn, { width: 40, height: 40 }]}
              >
                <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.headerInfo}>
              {isProfessional && (
                <View style={styles.communityContext}>
                  <Ionicons name="sparkles" size={10} color={CultureTokens.gold} />
                  <Text style={[styles.communityContextText, { color: CultureTokens.gold }]}>
                    {`CREATORS OF ${profile.city?.toUpperCase() || 'YOUR CITY'}`}
                  </Text>
                </View>
              )}
              <Text style={styles.profileNameMain} numberOfLines={1}>{profile.name}</Text>
              <View style={styles.metaRowInline}>
                 <View style={[styles.roleBadge, isProfessional && { backgroundColor: 'rgba(255,200,87,0.2)' }]}>
                   <Ionicons name={entityIcon} size={12} color={isProfessional ? CultureTokens.gold : "rgba(255,255,255,0.8)"} />
                   <Text style={[styles.roleLabel, isProfessional && { color: CultureTokens.gold }]}>
                      {isProfessional ? (profile.entityType === 'artist' ? 'FEATURED ARTIST' : 'CITY CREATOR') : profile.entityType.toUpperCase()}
                   </Text>
                 </View>
                 {locationText ? (
                   <Text style={styles.locationLabel}> • {locationText}</Text>
                 ) : null}
                 {isProfessional && (
                   <View style={styles.verifiedBadge}>
                     <Ionicons name="shield-checkmark" size={12} color={CultureTokens.gold} />
                     <Text style={styles.verifiedText}>VERIFIED BRAND</Text>
                   </View>
                 )}
              </View>
            </View>

            {activeSocials.length > 0 && (
              <View style={styles.socialsHeroRow}>
                {activeSocials.map(social => {
                  const link = socialLinks[social.key] || String((profile as Record<string, unknown>)[social.key] ?? '');
                  if (!link) return null;
                  return (
                    <Pressable 
                      key={social.key} 
                      style={styles.socialCircle}
                      onPress={() => Linking.openURL(link)}
                    >
                      <Ionicons name={social.icon} size={18} color="#FFFFFF" />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.contentBody}>
            <View style={styles.statsRowPremium}>
              {stats.map((stat, idx) => (
                <View key={`stat-${idx}`} style={[styles.statBox, idx < stats.length - 1 && styles.statDivider]}>
                  <Text style={styles.statValue}>{formatNumber(stat.value)}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <Card style={styles.infoCard} padding={20}>
              <View style={styles.cardHeaderSmall}>
                <Ionicons name="information-circle" size={18} color={entityColor} />
                <Text style={[TextStyles.labelSemibold, { color: colors.textTertiary, letterSpacing: 1 }]}>ABOUT & CPID</Text>
              </View>
              <Text style={[TextStyles.body, { color: colors.text, lineHeight: 24, marginTop: 8 }]}>
                {profile.bio || profile.description || 'Welcome to my shared space on CulturePass. Discovery starts here.'}
              </Text>
              <View style={[styles.cpidSmallChip, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="finger-print" size={14} color={accentColor} />
                <Text style={[TextStyles.captionSemibold, { color: colors.textSecondary }]}>
                   CPID: {profile.culturePassId || profile.id}
                </Text>
              </View>
            </Card>

            {isProfessional && (
              <BrandPlaylist 
                playlist={DEFAULT_DISCOVER_CURATION.heritagePlaylists}
                title="Heritage Playlist"
                onItemPress={(item) => {
                  if (Platform.OS !== 'web') Haptics.impactAsync();
                  router.push('/(tabs)');
                }}
              />
            )}

            {(profile.website || profile.phone || profile.contactEmail) && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionHeading}>Contact Details</Text>
                <Card padding={0} style={{ overflow: 'hidden' }}>
                  {profile.website && (
                    <Pressable style={styles.contactRowItem} onPress={() => Linking.openURL(profile.website)}>
                      <View style={styles.iconCircleBlue}><Ionicons name="globe" size={18} color={entityColor} /></View>
                      <Text style={styles.contactTextLabel}>{profile.website}</Text>
                    </Pressable>
                  )}
                  {profile.contactEmail && (
                    <Pressable style={[styles.contactRowItem, styles.rowBorderTop]} onPress={() => Linking.openURL(`mailto:${profile.contactEmail}`)}>
                      <View style={styles.iconCircleBlue}><Ionicons name="mail" size={18} color={entityColor} /></View>
                      <Text style={styles.contactTextLabel}>{profile.contactEmail}</Text>
                    </Pressable>
                  )}
                </Card>
              </View>
            )}

            {displayEvents.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionDualHeader}>
                  <Text style={styles.sectionHeading}>Active Events</Text>
                  <Pressable onPress={() => router.push('/(tabs)/index')}>
                    <Text style={[TextStyles.labelSemibold, { color: entityColor }]}>See Discovery</Text>
                  </Pressable>
                </View>
                {displayEvents.map(event => (
                  <Pressable 
                    key={event.id} 
                    style={({pressed}) => [styles.eventCardCompact, pressed && { opacity: 0.8 }]}
                    onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
                  >
                    <Image source={{ uri: event.imageUrl }} style={styles.eventThumb} />
                    <View style={styles.eventTextSide}>
                      <Text style={styles.eventTitleMini} numberOfLines={1}>{event.title}</Text>
                      <Text style={styles.eventMetaMini}>{formatEventDate(event.date, event.time)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  </Pressable>
                ))}
              </View>
            )}

            {tags.length > 0 && (
              <View style={[styles.sectionWrap, { marginBottom: 40 }]}>
                <Text style={styles.sectionHeading}>Languages & Interests</Text>
                <View style={styles.tagCloud}>
                  {tags.map((tag, idx) => (
                    <View key={`tag-${idx}`} style={styles.cloudTag}>
                      <Text style={styles.cloudTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </TabScreenShell>

        <View style={[styles.premiumBottomBar, { paddingBottom: bottomInset + 8 }]}>
          <Pressable 
            style={({pressed}) => [styles.mainFollowBtn, pressed && { opacity: 0.8 }, isFollowing && styles.followingBtn]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsFollowing(!isFollowing);
            }}
          >
            <Ionicons name={isFollowing ? "checkmark-circle" : "person-add"} size={20} color={isFollowing ? entityColor : "#FFFFFF"} />
            <Text style={[styles.mainFollowBtnText, isFollowing && { color: entityColor }]}>
              {isFollowing ? 'Following' : 'Follow Profile'}
            </Text>
          </Pressable>
          
          <Pressable 
            style={styles.squareIconBtn}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync();
              setIsLiked(!isLiked);
            }}
          >
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? CultureTokens.coral : entityColor} />
          </Pressable>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const getStyles = (colors: any, insets: any, isDesktop: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroSection: {
    height: 320,
    backgroundColor: CultureTokens.indigo,
    justifyContent: 'flex-end',
    padding: 24,
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
    zIndex: 2,
  },
  heroTopRow: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : insets.top + 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  glassBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { backdropFilter: 'blur(10px)' } as any }),
  },
  headerInfo: { gap: 4, zIndex: 2 },
  profileNameMain: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  communityContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  communityContextText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1.2,
  },
  metaRowInline: { flexDirection: 'row', alignItems: 'center' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  locationLabel: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.7)' },
  
  socialsHeroRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    zIndex: 2,
  },
  socialCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  contentBody: { paddingHorizontal: 20, paddingTop: 32 },
  
  statsRowPremium: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 2, shadowColor: '#000' },
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.04)' },
    }),
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { borderRightWidth: 1, borderRightColor: colors.borderLight },
  statValue: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
  statLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },

  infoCard: { marginBottom: 24, borderLeftWidth: 4, borderLeftColor: CultureTokens.indigo },
  cardHeaderSmall: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cpidSmallChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
     marginTop: 16,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    backgroundColor: 'rgba(255,200,87,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,200,87,0.3)',
  },
  verifiedText: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    color: CultureTokens.gold,
    letterSpacing: 0.5,
  },

  sectionWrap: { marginBottom: 24 },
  sectionHeading: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 12 },
  sectionDualHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  
  contactRowItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rowBorderTop: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  iconCircleBlue: { width: 36, height: 36, borderRadius: 10, backgroundColor: CultureTokens.indigo + '10', alignItems: 'center', justifyContent: 'center' },
  contactTextLabel: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text, flex: 1 },

  eventCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
    gap: 12,
  },
  eventThumb: { width: 44, height: 44, borderRadius: 8 },
  eventTextSide: { flex: 1 },
  eventTitleMini: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  eventMetaMini: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },

  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cloudTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: CultureTokens.indigo + '10',
    borderWidth: 1,
    borderColor: CultureTokens.indigo + '20',
  },
  cloudTagText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.indigo },

  premiumBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
    ...Platform.select({ web: { backdropFilter: 'blur(10px)' } as any }),
  },
  mainFollowBtn: {
    flex: 1,
    height: 52,
    backgroundColor: CultureTokens.indigo,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: CultureTokens.indigo,
  },
  mainFollowBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  squareIconBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },

  errorText: { fontSize: 16, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  backLinkBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: CultureTokens.indigo + '15' },
  backLink: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.indigo },
});
