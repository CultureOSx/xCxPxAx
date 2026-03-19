import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, ActivityIndicator, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { EventData, Profile } from '@/shared/schema';
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { goBackOrReplace } from '@/lib/navigation';
import { Card } from '@/components/ui/Card';
import { TextStyles } from '@/constants/typography';

const ENTITY_COLORS: Record<string, string> = {
  community: CultureTokens.indigo,
  organisation: CultureTokens.teal,
  venue: CultureTokens.indigo,
  business: CultureTokens.saffron,
  council: CultureTokens.teal,
  government: CultureTokens.coral,
};

const ENTITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  community: 'people',
  organisation: 'business',
  venue: 'location',
  business: 'storefront',
  council: 'shield-checkmark',
  government: 'flag',
};

const SOCIAL_ICONS: { key: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'facebook', icon: 'logo-facebook' },
  { key: 'instagram', icon: 'logo-instagram' },
  { key: 'twitter', icon: 'logo-twitter' },
  { key: 'linkedin', icon: 'logo-linkedin' },
  { key: 'youtube', icon: 'logo-youtube' },
  { key: 'tiktok', icon: 'logo-tiktok' },
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

function toCalendarDate(date: string, time?: string): Date | null {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return null;
  const dt = new Date(year, month - 1, day, 18, 0, 0, 0);
  const match = (time ?? '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    dt.setHours(hour, minute, 0, 0);
  }
  return dt;
}

function toGoogleCalendarTimestamp(value: Date): string {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export default function ProfileDetailScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['/api/profiles', id as string],
    queryFn: () => api.profiles.get(id as string),
    enabled: !!id,
  });

  const { data: allEventsData = [] } = useQuery<EventData[]>({
    queryKey: ['/api/events', profile?.city, profile?.country],
    queryFn: async () => {
      const response = await api.events.list({
        city: profile?.city,
        country: profile?.country,
        pageSize: 80,
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

  const entityColor = ENTITY_COLORS[profile.entityType] || CultureTokens.indigo;
  const entityIcon = ENTITY_ICONS[profile.entityType] || 'person';
  const socialLinks = (profile.socialLinks || {}) as Record<string, string | undefined>;
  const activeSocials = SOCIAL_ICONS.filter(s => socialLinks[s.key] || (profile as any)[s.key]);
  const tags = (profile.tags || []) as string[];
  const locationText = [profile.address, profile.city, profile.country].filter(Boolean).join(', ');
  
  const heroImage = profile.coverImageUrl || profile.avatarUrl;

  const profileName = (profile.name || '').toLowerCase();
  const profileTags = (profile.tags || []) as string[];
  const profileLocation = (profile.city || profile.location || '').toString().toLowerCase();

  const matchedEvents = allEventsData.filter((ev) => {
    const tag = (ev.communityId || '').toLowerCase();
    const organizer = (ev.organizerId || '').toLowerCase();
    const venue = (ev.venue || '').toLowerCase();
    const nameWords = profileName.split(/\s+/).filter((w: string) => w.length > 2);
    return nameWords.some((w: string) => tag.includes(w) || organizer.includes(w)) ||
      profileTags.some((t: string) => tag.includes(t.toLowerCase()) || (ev.category || '').toLowerCase().includes(t.toLowerCase())) ||
      (profileLocation && venue.includes(profileLocation));
  });
  const upcomingEvents = matchedEvents.length > 0
    ? matchedEvents.slice(0, 4)
    : allEventsData.filter((ev) => ev.isFeatured || ev.priceCents === 0).slice(0, 4);

  const stats = [
    profile.followersCount ? { label: 'Followers', value: profile.followersCount } : null,
    profile.likes ? { label: 'Likes', value: profile.likes } : null,
    profile.membersCount ? { label: 'Members', value: profile.membersCount } : null,
    profile.reviewsCount ? { label: 'Reviews', value: profile.reviewsCount } : null,
  ].filter(Boolean) as { label: string; value: number }[];

  if (stats.length === 0) {
    stats.push({ label: 'Followers', value: 0 }, { label: 'Members', value: 0 });
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 100 }}>
          
          {/* Hero */}
          <View style={styles.heroContainer}>
            {heroImage ? (
              <Image source={{ uri: heroImage }} style={styles.heroImage} contentFit="cover" transition={300} />
            ) : (
              <LinearGradient colors={[entityColor, colors.background]} style={styles.heroImage} />
            )}

            <View style={[styles.heroTopBar, { top: topInset + 12 }]}>
              <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={styles.iconBtn}>
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </Pressable>

              <Pressable onPress={() => { Haptics.impactAsync(); }} style={styles.iconBtn}>
                <Ionicons name="share-outline" size={22} color="#FFF" />
              </Pressable>
            </View>
          </View>
          
          <View style={styles.content}>
            <Card 
              style={styles.heroInfoCard}
              padding={16}
            >
              <View style={[styles.entityBadge, { backgroundColor: entityColor + '20', borderColor: entityColor + '40' }]}>
                <Ionicons name={entityIcon} size={14} color={entityColor} />
                <Text style={[TextStyles.badgeCaps, { color: entityColor, fontSize: 10 }]}>{profile.entityType}</Text>
              </View>
              <Text style={[TextStyles.title, { color: colors.text }]}>{profile.name}</Text>
              {locationText ? (
                <View style={[styles.heroMetaRow, { marginTop: 4 }]}>
                  <Ionicons name="location" size={14} color={colors.textSecondary} />
                  <Text style={[TextStyles.cardBody, { color: colors.textSecondary }]}>{locationText}</Text>
                </View>
              ) : null}
              <View style={[styles.cpidChip, { backgroundColor: entityColor + '15', borderColor: entityColor + '30', marginTop: 12 }]}>
                <Ionicons name="finger-print" size={16} color={entityColor} />
                <Text style={[TextStyles.labelSemibold, { color: entityColor, fontSize: 11, letterSpacing: 1 }]}>
                  CPID: {(profile as any).culturePassId ?? profile.id}
                </Text>
              </View>
            </Card>
            
            {/* Stats */}
            <View style={styles.statsRow}>
              {stats.map((stat) => (
                <Card key={`profile-stat-${stat.label}`} style={styles.statCard} padding={16}>
                  <Text style={[TextStyles.title2, { color: colors.text }]}>{formatNumber(stat.value)}</Text>
                  <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>{stat.label}</Text>
                </Card>
              ))}
            </View>
            
            {/* About */}
            {(profile.bio || profile.description) && (
              <View style={styles.section}>
                <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>About</Text>
                <Text style={[TextStyles.body, { color: colors.textSecondary, lineHeight: 24 }]}>{profile.bio || profile.description}</Text>
              </View>
            )}

            {/* Contact */}
            {(profile.phone || profile.contactEmail || profile.website) && (
              <View style={styles.section}>
                <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>Contact</Text>
                <Card padding={0}>
                  {profile.website && (
                    <Pressable 
                       style={styles.contactRow}
                       onPress={() => profile.website && Linking.openURL(profile.website)}
                    >
                      <View style={[styles.contactIconBox, { backgroundColor: entityColor + '15' }]}>
                        <Ionicons name="globe-outline" size={20} color={entityColor} />
                      </View>
                      <Text style={[TextStyles.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>{profile.website}</Text>
                    </Pressable>
                  )}
                  {profile.phone && (
                    <Pressable 
                       style={[styles.contactRow, profile.website && styles.contactDivider, { borderTopColor: colors.borderLight }]}
                       onPress={() => profile.phone && Linking.openURL(`tel:${profile.phone}`)}
                    >
                      <View style={[styles.contactIconBox, { backgroundColor: entityColor + '15' }]}>
                        <Ionicons name="call-outline" size={20} color={entityColor} />
                      </View>
                      <Text style={[TextStyles.body, { color: colors.text, flex: 1 }]}>{profile.phone}</Text>
                    </Pressable>
                  )}
                  {profile.contactEmail && (
                    <Pressable 
                       style={[styles.contactRow, (profile.website || profile.phone) && styles.contactDivider, { borderTopColor: colors.borderLight }]}
                       onPress={() => profile.contactEmail && Linking.openURL(`mailto:${profile.contactEmail}`)}
                    >
                      <View style={[styles.contactIconBox, { backgroundColor: entityColor + '15' }]}>
                        <Ionicons name="mail-outline" size={20} color={entityColor} />
                      </View>
                      <Text style={[TextStyles.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>{profile.contactEmail}</Text>
                    </Pressable>
                  )}
                </Card>
              </View>
            )}

            {/* Socials */}
            {activeSocials.length > 0 && (
               <View style={styles.section}>
                 <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>Socials</Text>
                 <View style={styles.socialsRow}>
                   {activeSocials.map(social => {
                     const link = socialLinks[social.key] || (profile as any)[social.key];
                     if (!link) return null;
                     return (
                       <Pressable 
                         key={social.key} 
                         style={[styles.socialBtn, { borderColor: entityColor + '30', backgroundColor: colors.surface }]} 
                         onPress={() => Linking.openURL(link)}
                       >
                         <Ionicons name={social.icon} size={22} color={entityColor} />
                       </Pressable>
                     );
                   })}
                 </View>
               </View>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <View style={styles.section}>
                <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>Tags</Text>
                <View style={styles.tagsRow}>
                  {tags.map((tag, idx) => (
                    <View key={`profile-tag-${tag}-${idx}`} style={[styles.tag, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                      <Text style={[TextStyles.captionSemibold, { color: colors.text }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Events */}
            {upcomingEvents.length > 0 && (
               <View style={styles.section}>
                 <View style={styles.sectionHeaderRow}>
                   <Text style={[TextStyles.title3, { color: colors.text }]}>Related Events</Text>
                   <Pressable onPress={() => router.push('/(tabs)')}>
                     <Text style={[TextStyles.labelSemibold, { color: entityColor }]}>See all</Text>
                   </Pressable>
                 </View>
                 <View style={styles.eventsStack}>
                   {upcomingEvents.map((event) => (
                     <Card key={event.id} padding={12}>
                       <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                         <Pressable
                           style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 }}
                           onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
                         >
                           <Image source={{ uri: event.imageUrl }} style={styles.eventImg} />
                           <View style={styles.eventInfo}>
                             <Text style={[TextStyles.headline, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
                             <Text style={[TextStyles.caption, { color: colors.textSecondary }]} numberOfLines={1}>{formatEventDate(event.date, event.time)}</Text>
                           </View>
                         </Pressable>
                         <Pressable
                           style={[styles.eventCalendarBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                           onPress={() => {
                             const start = toCalendarDate(event.date, event.time);
                             if (!start) return;
                             const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
                             const details = event.description || 'Event on CulturePass';
                             const location = [event.venue, event.city, event.country].filter(Boolean).join(', ');
                             const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${toGoogleCalendarTimestamp(start)}/${toGoogleCalendarTimestamp(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
                             Linking.openURL(url).catch(() => {});
                           }}
                         >
                           <Ionicons name="calendar-number-outline" size={18} color={entityColor} />
                         </Pressable>
                          <Pressable onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })} hitSlop={10}>
                            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                          </Pressable>
                       </View>
                     </Card>
                   ))}
                 </View>
               </View>
            )}
            
            {/* Members Join Prompt */}
            {profile.entityType === 'community' && (
              <View style={styles.section}>
                <Card padding={16}>
                  <View style={styles.membersInfo}>
                    <Ionicons name="people" size={24} color={entityColor} />
                    <View>
                      <Text style={[TextStyles.headline, { color: colors.text }]}>{formatNumber(profile.membersCount || 0)} Members</Text>
                      <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>Join this {profile.entityType}</Text>
                    </View>
                  </View>
                </Card>
              </View>
            )}
            
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: bottomInset + 16 }]}>
          <Pressable 
            style={({pressed}) => [styles.actionBtn, pressed && { opacity: 0.8 }, { flex: 1, backgroundColor: isFollowing ? 'transparent' : entityColor, borderColor: isFollowing ? entityColor + '50' : 'transparent', borderWidth: 1 }]}
            onPress={() => { Haptics.impactAsync(); setIsFollowing(!isFollowing); }}
          >
            <Ionicons name={isFollowing ? "checkmark" : "person-add"} size={20} color={isFollowing ? entityColor : '#0B0B14'} />
            <Text style={[styles.actionBtnText, { color: isFollowing ? entityColor : '#0B0B14' }]}>{isFollowing ? 'Following' : 'Follow'}</Text>
          </Pressable>
          
          <Pressable 
            style={({pressed}) => [styles.iconActionBtn, pressed && { opacity: 0.8 }, { borderColor: entityColor + '40' }]}
            onPress={() => { Haptics.impactAsync(); setIsLiked(!isLiked); }}
          >
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? CultureTokens.coral : entityColor} />
          </Pressable>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  errorText: { fontSize: 16, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  backLinkBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: CultureTokens.indigo + '15' },
  backLink: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.indigo },
  
  heroContainer: { height: 300, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroTopBar: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight },
  heroInfoCard: { marginTop: -20, marginBottom: 20, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight, padding: 14, gap: 8 },
  
  entityBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  entityBadgeText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  profileName: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: colors.text, letterSpacing: -0.5, marginBottom: 8 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  
  content: { padding: 20 },
  
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  statValue: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
  statLabel: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textTertiary, marginTop: 2 },
  
  cpidChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 24, borderWidth: 1 },
  cpidText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1 },
  
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 14 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  seeAllText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  
  bio: { fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 24 },
  
  contactCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  contactDivider: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  contactIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  contactText: { fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.text, flex: 1 },
  
  socialsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  socialBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  tagText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.text },
  
  eventsStack: { gap: 12 },
  eventItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  eventImg: { width: 56, height: 56, borderRadius: 12 },
  eventInfo: { flex: 1, gap: 4 },
  eventTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  eventDate: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  eventCalendarBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  
  membersCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  membersInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  membersTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.text },
  membersSubtitle: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textTertiary },
  
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 16, backgroundColor: 'rgba(11,11,20,0.95)', borderTopWidth: 1, borderTopColor: colors.borderLight },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, height: 56 },
  actionBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  iconActionBtn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1 },
});
