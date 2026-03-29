import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
  ActivityIndicator,
  Share,
  Alert,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useQuery } from "@tanstack/react-query";
import { CultureTokens } from "@/constants/theme";
import SocialLinksBar from "@/components/SocialLinksBar";
import * as Haptics from "expo-haptics";
import type { Profile } from "@shared/schema";
import { api } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useColors } from "@/hooks/useColors";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
import * as ImagePicker from "expo-image-picker";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { TextStyles } from "@/constants/theme";

function VenueDetailSkeleton() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 0 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Skeleton width="100%" height={260} borderRadius={0} />
        <View style={{ padding: 20, gap: 20 }}>
          {/* Info Card Skeleton */}
          <View style={{ 
            marginTop: -40, 
            backgroundColor: colors.surface, 
            borderRadius: 16, 
            padding: 16, 
            gap: 12,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}>
            <Skeleton width="30%" height={20} borderRadius={10} />
            <Skeleton width="70%" height={32} borderRadius={10} />
            <Skeleton width="50%" height={16} borderRadius={8} />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Skeleton width="31%" height={80} borderRadius={16} />
            <Skeleton width="31%" height={80} borderRadius={16} />
            <Skeleton width="31%" height={80} borderRadius={16} />
          </View>
          
          <Skeleton width="100%" height={80} borderRadius={16} />
          
          <View style={{ gap: 12, marginTop: 12 }}>
            <Skeleton width="25%" height={24} borderRadius={8} />
            <Skeleton width="100%" height={120} borderRadius={16} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function VenueDetailScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const topInset = Platform.OS === "web" ? 0 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const isWeb = Platform.OS === "web";

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [navigation]);

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['/api/profiles', id],
    queryFn: () => api.profiles.get(id),
  });

  const { userId } = useAuth();
  const { uploadImage, deleteImage, uploading } = useImageUpload();

  const handlePickCover = useCallback(async () => {
    if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]) {
      try {
        if (profile?.coverImageUrl || profile?.avatarUrl) {
          const oldUrl = profile.coverImageUrl || profile.avatarUrl;
          await deleteImage('profiles', profile.id, oldUrl!, profile.coverImageUrl ? 'coverImageUrl' : 'avatarUrl');
        }
        await uploadImage(result, 'profiles', profile!.id, 'coverImageUrl');
        queryClient.invalidateQueries({ queryKey: ['/api/profiles', id] });
      } catch (err) {
        Alert.alert('Upload Error', String(err));
      }
    }
  }, [profile, id, uploadImage, deleteImage]);

  const canEdit = userId === profile?.ownerId || userId === profile?.creatorId || __DEV__;

  const handleShare = useCallback(async () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const url = `https://culturepass.app/venue/${id}`;
      const location = [profile?.city, profile?.country].filter(Boolean).join(", ");
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title: profile?.name ?? "Venue on CulturePass", url });
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          Alert.alert("Link Copied", "Link copied to clipboard");
        }
      } else {
        await Share.share({
          title: `${profile?.name ?? 'Venue'} on CulturePass`,
          message: `Check out ${profile?.name} on CulturePass!${location ? ` Located in ${location}.` : ''}\n\n${url}`,
          url: url,
        });
      }
    } catch {}
  }, [id, profile]);

  const openDirections = useCallback(() => {
    if (!profile) return;
    const locationText = [profile.address, profile.city, profile.country].filter(Boolean).join(', ');
    const hasCoordinates = !!(profile.location?.lat && profile.location?.lng) || !!(profile.latitude && profile.longitude);

    if (hasCoordinates) {
      const lat = profile.location?.lat || profile.latitude;
      const lng = profile.location?.lng || profile.longitude;
      Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
    } else if (locationText) {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(locationText)}`);
    }
  }, [profile]);

  if (isLoading) {
    return <VenueDetailSkeleton />;
  }

  if (!profile) {
    return (
      <ErrorBoundary>
        <View style={[styles.container, { paddingTop: topInset }]}> 
          <View style={styles.loadingContainer}>
            <Ionicons name="alert-circle" size={48} color={colors.textTertiary} />
            <Text style={styles.errorText}>Venue not found</Text>
            <Pressable onPress={goBack} style={styles.backLinkBtn}>
              <Text style={styles.backLinkText}>Go Back</Text>
            </Pressable>
          </View>
        </View>
      </ErrorBoundary>
    );
  }

  const heroImage = profile.coverImageUrl || profile.avatarUrl || (profile.images && profile.images.length > 0 ? profile.images[0] : null);
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
        >
          <View style={styles.heroContainer}>
            {heroImage ? (
              <Image source={{ uri: heroImage }} style={styles.heroImage} contentFit="cover" transition={300} />
            ) : (
              <LinearGradient
                colors={[CultureTokens.teal, colors.background]}
                style={styles.heroImage}
              />
            )}
            
            {canEdit && (
              <Pressable 
                onPress={handlePickCover} 
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' }]}
                accessibilityLabel="Change cover image"
              >
                {uploading ? (
                  <ActivityIndicator size="large" color="white" />
                ) : (
                  <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }}>
                    <Ionicons name="camera" size={24} color="white" />
                  </View>
                )}
              </Pressable>
            )}
            <LinearGradient
              colors={['rgba(11,11,20,0.2)', 'rgba(11,11,20,0.8)']}
              style={styles.heroGradient}
            />
            <View style={[styles.heroTopBar, { top: topInset + 12 }]}>
              <Pressable 
                onPress={() => {
                  if(Platform.OS !== 'web') Haptics.selectionAsync();
                  goBack();
                }} 
                style={styles.heroBtn}
              >
                <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                <Ionicons name="chevron-back" size={24} color="white" />
              </Pressable>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable 
                  onPress={() => {
                    if(Platform.OS !== 'web') Haptics.selectionAsync();
                    handleShare();
                  }} 
                  style={styles.heroBtn}
                >
                  <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                  <Ionicons name="share-outline" size={22} color="white" />
                </Pressable>
                {profile.address && (
                  <Pressable 
                    onPress={() => {
                      if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      openDirections();
                    }} 
                    style={styles.heroBtn}
                  >
                    <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                    <Ionicons name="navigate" size={22} color="white" />
                  </Pressable>
                )}
              </View>
            </View>
            <View style={styles.heroInfo} />
          </View>

          <View style={styles.content}>
            <Animated.View entering={FadeInUp.delay(80).springify().damping(18)} style={styles.heroInfoCard}>
              {profile.isVerified ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={CultureTokens.success} />
                  <Text style={styles.verifiedBadgeText}>Verified</Text>
                </View>
              ) : null}
              <Text style={styles.heroTitle}>{profile.name}</Text>
              {location ? (
                <View style={styles.heroLocationRow}>
                  <Ionicons name="location" size={16} color={colors.textSecondary} />
                  <Text style={styles.heroLocation}>{location}</Text>
                </View>
              ) : null}
              <View style={styles.cpidRow}>
                <Ionicons name="finger-print" size={16} color={CultureTokens.indigo} />
                <Text style={styles.cpidText}>CPID: {profile.culturePassId ?? profile.id}</Text>
              </View>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(160).springify().damping(18)} style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: CultureTokens.indigo + '15' }]}>
                  <Ionicons name="people" size={20} color={CultureTokens.indigo} />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{profile.followersCount ?? 0}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: CultureTokens.gold + '15' }]}>
                  <Ionicons name="star" size={20} color={CultureTokens.gold} />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{profile.rating ? profile.rating.toFixed(1) : "—"}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View>
              {profile.membersCount != null && profile.membersCount > 0 && (
                <View style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: CultureTokens.teal + '15' }]}>
                    <Ionicons name="person-add" size={20} color={CultureTokens.teal} />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValue}>{profile.membersCount}</Text>
                    <Text style={styles.statLabel}>Members</Text>
                  </View>
                </View>
              )}
            </Animated.View>

            {profile.address && (
              <Animated.View entering={FadeInDown.delay(220).springify().damping(18)}>
                <Pressable onPress={openDirections} style={styles.addressCard}>
                  <View style={styles.addressIconBox}>
                    <Ionicons name="location" size={20} color={CultureTokens.teal} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressText}>{profile.address}</Text>
                  </View>
                  <View style={styles.directionsBtn}>
                    <Ionicons name="navigate" size={16} color={colors.background} />
                    <Text style={styles.directionsBtnText}>Directions</Text>
                  </View>
                </Pressable>
              </Animated.View>
            )}

            {(profile.bio || profile.description) && (
              <Animated.View entering={FadeInDown.delay(270).springify().damping(18)} style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.descriptionText}>{profile.bio || profile.description}</Text>
              </Animated.View>
            )}

            {profile.tags && profile.tags.length > 0 && (
              <Animated.View entering={FadeInDown.delay(310).springify().damping(18)} style={styles.section}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.tagsGrid}>
                  {profile.tags.map((tag, idx) => (
                    <View key={`venue-tag-${tag}-${idx}`} style={styles.tagChip}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {profile.openingHours && (
              <Animated.View entering={FadeInDown.delay(340).springify().damping(18)} style={styles.section}>
                <Text style={styles.sectionTitle}>Opening Hours</Text>
                <View style={styles.hoursCard}>
                  <Text style={styles.hoursText}>{profile.openingHours}</Text>
                </View>
              </Animated.View>
            )}

            {(profile.email || profile.contactEmail || profile.phone || profile.website) && (
              <Animated.View entering={FadeInDown.delay(370).springify().damping(18)} style={styles.section}>
                <Text style={styles.sectionTitle}>Contact</Text>
                {(profile.email || profile.contactEmail) && (
                  <Pressable
                    style={styles.contactRow}
                    onPress={() => Linking.openURL(`mailto:${profile.email || profile.contactEmail}`)}
                  >
                    <View style={styles.contactIconBox}>
                      <Ionicons name="mail" size={18} color={CultureTokens.indigo} />
                    </View>
                    <Text style={styles.contactText}>{profile.email || profile.contactEmail}</Text>
                  </Pressable>
                )}
                {profile.phone && (
                  <Pressable
                    style={styles.contactRow}
                    onPress={() => Linking.openURL(`tel:${profile.phone}`)}
                  >
                    <View style={styles.contactIconBox}>
                      <Ionicons name="call" size={18} color={CultureTokens.indigo} />
                    </View>
                    <Text style={styles.contactText}>{profile.phone}</Text>
                  </Pressable>
                )}
                {profile.website && (
                  <Pressable
                    style={styles.contactRow}
                    onPress={() => Linking.openURL(profile.website!)}
                  >
                    <View style={styles.contactIconBox}>
                      <Ionicons name="globe" size={18} color={CultureTokens.indigo} />
                    </View>
                    <Text style={styles.contactText}>{profile.website}</Text>
                  </Pressable>
                )}
              </Animated.View>
            )}

            {(profile.socialLinks && Object.values(profile.socialLinks).some(Boolean)) && (
              <Animated.View entering={FadeInDown.delay(400).springify().damping(18)} style={styles.section}>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Follow Us</Text>
                <SocialLinksBar socialLinks={profile.socialLinks} website={profile.website} />
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  errorText: { fontFamily: "Poppins_500Medium", fontSize: 16, color: colors.textSecondary },
  backLinkBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: CultureTokens.teal + '15' },
  backLinkText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: CultureTokens.teal },

  heroContainer: { height: 260, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroTopBar: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  heroBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(11,11,20,0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroInfo: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 2,
  },
  heroInfoCard: {
    marginTop: -18,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 8,
    ...Platform.select({
      web: { boxShadow: '0px 8px 32px rgba(0,0,0,0.6)' },
      ios: { 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      },
      android: { elevation: 12 }
    }),
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  verifiedBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: CultureTokens.success,
  },
  heroTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  heroLocationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroLocation: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: colors.textSecondary,
  },

  content: { padding: 20 },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: { gap: 2 },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: colors.text,
  },
  statLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: colors.textSecondary,
  },

  cpidRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: CultureTokens.indigo + "15",
    borderRadius: 14,
    alignSelf: "flex-start",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: CultureTokens.indigo + "30",
  },
  cpidText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: CultureTokens.indigo,
  },

  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.45)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
      android: { elevation: 4 }
    })
  },
  addressIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: CultureTokens.teal + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  addressText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CultureTokens.teal,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  directionsBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    color: "black",
  },

  section: { marginBottom: 28 },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: colors.text,
    marginBottom: 14,
  },
  descriptionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tagChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tagText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: colors.text,
  },

  hoursCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  hoursText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  contactIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: CultureTokens.indigo + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 20,
    opacity: 0.5,
  },
});
