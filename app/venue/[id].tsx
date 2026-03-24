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
import { useQuery } from "@tanstack/react-query";
import { CultureTokens } from "@/constants/theme";
import SocialLinksBar from "@/components/SocialLinksBar";
import * as Haptics from "expo-haptics";
import type { Profile } from "@shared/schema";
import { api } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useColors } from "@/hooks/useColors";

export default function VenueDetailScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const topInset = Platform.OS === "web" ? 0 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

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

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    const hasCoordinates = !!((profile as any).location?.lat && (profile as any).location?.lng) || !!((profile as any).latitude && (profile as any).longitude);

    if (hasCoordinates) {
      const lat = (profile as any).location?.lat || (profile as any).latitude;
      const lng = (profile as any).location?.lng || (profile as any).longitude;
      Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
    } else if (locationText) {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(locationText)}`);
    }
  }, [profile]);

  if (isLoading) {
    return (
      <ErrorBoundary>
        <View style={[styles.container, { paddingTop: topInset, justifyContent: "center", alignItems: "center" }]}> 
          <ActivityIndicator size="large" color={CultureTokens.teal} />
        </View>
      </ErrorBoundary>
    );
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

  const heroImage = profile.coverImageUrl || profile.avatarUrl || ((profile as any).images && (profile as any).images.length > 0 ? (profile as any).images[0] : null);
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
            <LinearGradient
              colors={['rgba(11,11,20,0.18)', 'rgba(11,11,20,0.55)']}
              style={styles.heroGradient}
            />
            <View style={[styles.heroTopBar, { top: topInset + 12 }]}>
              <Pressable onPress={goBack} style={styles.heroBtn}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </Pressable>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={handleShare} style={styles.heroBtn}>
                  <Ionicons name="share-outline" size={22} color={colors.text} />
                </Pressable>
                {profile.address && (
                  <Pressable onPress={openDirections} style={styles.heroBtn}>
                    <Ionicons name="navigate" size={22} color={colors.text} />
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
                <Text style={styles.cpidText}>CPID: {(profile as any).culturePassId ?? profile.id}</Text>
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

            {((profile as any).email || profile.contactEmail || profile.phone || profile.website) && (
              <Animated.View entering={FadeInDown.delay(370).springify().damping(18)} style={styles.section}>
                <Text style={styles.sectionTitle}>Contact</Text>
                {((profile as any).email || profile.contactEmail) && (
                  <Pressable
                    style={styles.contactRow}
                    onPress={() => Linking.openURL(`mailto:${(profile as any).email || profile.contactEmail}`)}
                  >
                    <View style={styles.contactIconBox}>
                      <Ionicons name="mail" size={18} color={CultureTokens.indigo} />
                    </View>
                    <Text style={styles.contactText}>{(profile as any).email || profile.contactEmail}</Text>
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
});
