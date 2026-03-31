import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Share,
  Alert,
  Linking,
} from "react-native";
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
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useColors } from "@/hooks/useColors";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
import * as ImagePicker from "expo-image-picker";
import { captureEvent } from "@/lib/analytics";
import { Skeleton } from "@/components/ui/Skeleton";

function ArtistDetailSkeleton() {
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Skeleton width="100%" height={280} borderRadius={0} />
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 16 }}>
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
            <Skeleton width="40%" height={20} borderRadius={10} />
            <Skeleton width="80%" height={36} borderRadius={10} />
            <Skeleton width="50%" height={20} borderRadius={10} />
          </View>

          {/* Stats Skeleton */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Skeleton width="48%" height={80} borderRadius={16} />
            <Skeleton width="48%" height={80} borderRadius={16} />
          </View>

          {/* Bio Skeleton */}
          <View style={{ gap: 12, marginTop: 12 }}>
            <Skeleton width="30%" height={24} borderRadius={8} />
            <Skeleton width="100%" height={100} borderRadius={16} />
          </View>

          {/* Tags Skeleton */}
          <View style={{ gap: 12, marginTop: 12 }}>
            <Skeleton width="25%" height={24} borderRadius={8} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3].map(i => <Skeleton key={i} width={70} height={32} borderRadius={12} />)}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function ArtistDetailScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { id, source, featuredArtistId } = useLocalSearchParams<{ id: string; source?: string; featuredArtistId?: string }>();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const topInset = Platform.OS === "web" ? 0 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const isWeb = Platform.OS === "web";

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["/api/profiles", id],
    queryFn: () => api.profiles.get(id),
  });

  React.useEffect(() => {
    if (!profile) return;
    captureEvent('artist_profile_viewed', {
      artistId: profile.id,
      artistName: profile.name,
      source,
      featuredArtistId,
    });
  }, [featuredArtistId, profile, source]);

  const goBack = useCallback(() => (
    navigation.canGoBack() ? router.back() : router.replace("/")
  ), [navigation]);

  const { userId } = useAuth();
  const { uploadImage, deleteImage, uploading } = useImageUpload();

  const handlePickCover = useCallback(async () => {
    if(!Platform.OS.match(/web/)) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const url = `https://culturepass.app/artist/${id}`;
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title: profile?.name ?? "Artist on CulturePass", url });
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          Alert.alert("Link Copied", "Link copied to clipboard");
        }
      } else {
        await Share.share({
          title: `${profile?.name ?? 'Artist'} on CulturePass`,
          message: `Check out ${profile?.name} on CulturePass!${profile?.category ? ` ${profile.category}.` : ''}\n\n${url}`,
          url: url,
        });
      }
    } catch {}
  }, [id, profile, isWeb]);

  if (isLoading) {
    return <ArtistDetailSkeleton />;
  }

  if (!profile) {
    return (
      <ErrorBoundary>
        <View style={styles.notFound}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.textTertiary}
          />
          <Text style={styles.notFoundText}>Artist not found</Text>
          <Pressable onPress={goBack} style={styles.backLinkBtn}>
            <Text style={styles.backLink}>Return Home</Text>
          </Pressable>
        </View>
      </ErrorBoundary>
    );
  }

  const heroImage = profile.coverImageUrl || (profile.images && profile.images.length > 0 ? profile.images[0] : null) || profile.avatarUrl;
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <View style={styles.heroContainer}>
            {heroImage ? (
              <Image
                source={{ uri: heroImage }}
                style={styles.heroImage}
                contentFit="cover"
                transition={300}
              />
            ) : (
              <LinearGradient
                colors={[CultureTokens.coral, colors.background]}
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
              style={StyleSheet.absoluteFill}
            />

            {/* Top buttons */}
            <View style={[styles.heroTopBar, { top: topInset + 12 }]}>
              <Pressable
                onPress={() => {
                  if(Platform.OS !== 'web') Haptics.selectionAsync();
                  goBack();
                }}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                <Ionicons name="chevron-back" size={24} color="white" />
              </Pressable>

              <Pressable
                onPress={() => {
                  if(Platform.OS !== 'web') Haptics.selectionAsync();
                  handleShare();
                }}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel={`Share ${profile.name}`}
              >
                <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                <Ionicons name="share-outline" size={22} color="white" />
              </Pressable>
            </View>

            <View style={styles.heroContent} />
          </View>

          {/* CONTENT */}
          <View style={styles.content}>
            <View style={styles.heroInfoCard}>
              {profile.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={CultureTokens.success} />
                  <Text style={styles.verifiedText}>Verified Artist</Text>
                </View>
              )}
              <Text style={styles.artistName}>{profile.name}</Text>
              {profile.category ? (
                <Text style={styles.artistGenre}>{profile.category}</Text>
              ) : null}
              <View style={styles.cpidChip}>
                <Ionicons name="finger-print" size={16} color={CultureTokens.coral} />
                <Text style={styles.cpidText}>CPID: {profile.culturePassId ?? profile.id}</Text>
              </View>
            </View>
            {/* Stats */}
            <View style={styles.statsRow}>
              <StatCard
                icon="people"
                value={profile.followersCount ?? 0}
                label="Followers"
                color={CultureTokens.coral}
              />
              {location ? (
                <StatCard
                  icon="location"
                  value={profile.city ?? "—"}
                  label={profile.country ?? "Location"}
                  color={CultureTokens.indigo}
                  onPress={() => {
                    const q = encodeURIComponent(location);
                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
                  }}
                />
              ) : (
                <StatCard
                  icon="star"
                  value={profile.rating ? profile.rating.toFixed(1) : "—"}
                  label="Rating"
                  color={CultureTokens.gold}
                />
              )}
            </View>

            {/* About */}
            {(profile.bio || profile.description) && (
              <View style={styles.section}>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bio}>
                  {profile.bio || profile.description}
                </Text>
              </View>
            )}

            {/* Tags */}
            {(profile.tags?.length ?? 0) > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.tagsRow}>
                  {(profile.tags ?? []).map((tag: string, idx: number) => (
                    <View key={`artist-tag-${tag}-${idx}`} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Social */}
            {(profile.socialLinks && Object.values(profile.socialLinks).some(Boolean)) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Follow</Text>
                <SocialLinksBar
                  socialLinks={profile.socialLinks}
                  website={profile.website}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

/* ---------------- Components ---------------- */

function StatCard({
  icon,
  value,
  label,
  color,
  onPress,
}: any) {
  const colors = useColors();
  const styles = getStyles(colors);
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper 
      style={styles.statCard} 
      onPress={() => {
        if(onPress && Platform.OS !== 'web') Haptics.selectionAsync();
        onPress?.();
      }}
    >
      <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ gap: 2 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </Wrapper>
  );
}

/* ---------------- Styles ---------------- */

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  heroContainer: {
    height: 280,
    position: 'relative'
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  heroTopBar: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(11,11,20,0.78)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },

  heroContent: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
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
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  verifiedText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: CultureTokens.success,
  },

  artistName: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    color: colors.text,
    letterSpacing: -0.5,
  },

  artistGenre: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: colors.textSecondary,
    marginTop: 4,
  },

  content: {
    padding: 20,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },

  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
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

  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },

  statValue: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: colors.text,
  },

  statLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: colors.textSecondary,
  },

  cpidChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: CultureTokens.coral + "15",
    alignSelf: "flex-start",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: CultureTokens.coral + "30",
  },

  cpidText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: CultureTokens.coral,
  },

  section: {
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: colors.text,
    marginBottom: 12,
  },

  bio: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
    lineHeight: 24,
  },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight
  },

  tagText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: colors.text,
  },

  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.background,
  },

  notFoundText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: colors.textSecondary,
  },

  backLinkBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: CultureTokens.coral + '15'
  },

  backLink: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: CultureTokens.coral,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 20,
    opacity: 0.5,
  },
});
