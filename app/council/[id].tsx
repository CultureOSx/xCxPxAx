import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type CouncilData } from '@/lib/api';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Linking, Share, Alert, StyleSheet, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CultureTokens } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import * as Haptics from 'expo-haptics';

export default function CouncilDetailScreen() {
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/council/detail', id],
    queryFn: () => api.council.get(id as string),
    enabled: !!id,
  });
  const council = data;

  if (isLoading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 64 }} />;
  if (error || !council) return <Text style={{ color: colors.error, marginTop: 64 }}>Council not found.</Text>;
  const s = getStyles(colors);

  return (
    <ErrorBoundary>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <View style={s.hero}>
          <View style={s.titleRow}>
            <View style={s.iconWrap}>
              <Ionicons name="business" size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{council.name}</Text>
              <Text style={s.subtitle}>{council.state} · {council.suburb} · {council.country}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: council.verificationStatus === 'verified' ? CultureTokens.teal + '22' : colors.backgroundSecondary }]}>
              <Text style={[s.statusPillText, { color: council.verificationStatus === 'verified' ? CultureTokens.teal : colors.textSecondary }]}>
                {council.verificationStatus === 'verified' ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </View>
          <Text style={s.description}>{council.description || 'Local council profile and contact details.'}</Text>
          <View style={s.cpidRow}>
            <Ionicons name="finger-print-outline" size={15} color={CultureTokens.indigo} />
            <Text style={s.cpidText}>CPID: {council.id}</Text>
          </View>
        </View>

        <View style={s.infoCard}>
          <Text style={s.infoHeading}>Contacts</Text>
          {council.websiteUrl ? (
            <Pressable style={s.linkRow} onPress={() => Linking.openURL(council.websiteUrl || '')}>
              <Ionicons name="globe-outline" size={16} color={colors.primary} />
              <Text style={s.linkText}>Website</Text>
            </Pressable>
          ) : null}
          {council.email ? (
            <Pressable style={s.linkRow} onPress={() => Linking.openURL(`mailto:${council.email}`)}>
              <Ionicons name="mail-outline" size={16} color={colors.primary} />
              <Text style={s.linkText}>Email</Text>
            </Pressable>
          ) : null}
          {council.phone ? (
            <Pressable style={s.linkRow} onPress={() => Linking.openURL(`tel:${council.phone}`)}>
              <Ionicons name="call-outline" size={16} color={colors.primary} />
              <Text style={s.linkText}>{council.phone}</Text>
            </Pressable>
          ) : null}
          <Text style={s.metaText}>LGA: {council.lgaCode}</Text>
          <Text style={s.metaText}>Postcode: {council.postcode}</Text>
        </View>
        <CouncilDetailActions council={council} />
      </ScrollView>
    </ErrorBoundary>
  );
}

function CouncilDetailActions({ council }: { council: CouncilData }) {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const followMutation = useMutation({
    mutationFn: () => api.council.follow(council.id),
    onSuccess: (data) => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['/api/council/detail', council.id] });
      Alert.alert(
        data.following ? 'Following' : 'Unfollowed',
        data.following
          ? `You are now following ${council.name}. You'll receive local alerts and updates.`
          : `You've unfollowed ${council.name}.`,
      );
    },
    onError: () => Alert.alert('Error', 'Could not follow this council. Please try again.'),
  });

  const handleFollow = () => {
    if (!isAuthenticated) {
      Alert.alert('Sign in required', 'Sign in to follow councils and receive alerts.', [
        { text: 'Cancel' },
        { text: 'Sign In', onPress: () => router.push('/(onboarding)/login') },
      ]);
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    followMutation.mutate();
  };

  const handleClaim = () => {
    if (!isAuthenticated) {
      Alert.alert('Sign in required', 'Sign in to claim a council profile.', [
        { text: 'Cancel' },
        { text: 'Sign In', onPress: () => router.push('/(onboarding)/login') },
      ]);
      return;
    }
    router.push({ pathname: '/council/claim', params: { councilId: council.id, councilName: council.name } } as never);
  };

  const handleShare = async () => {
    const url = `https://culturepass.app/council/${council.id}`;
    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({ title: council.name, url });
      } else {
        await Share.share({ title: council.name, message: `${council.name} on CulturePass\n${url}`, url });
      }
    } catch {}
  };

  return (
    <View style={{ marginTop: 24, gap: 12 }}>
      <Button
        onPress={handleFollow}
        disabled={followMutation.isPending}
      >
        {followMutation.isPending ? 'Following…' : 'Follow Council'}
      </Button>
      <Button
        onPress={handleClaim}
        variant="secondary"
        style={{ borderColor: colors.borderLight }}
      >
        Claim Council
      </Button>
      <Button onPress={handleShare} variant="secondary" style={{ borderColor: colors.borderLight }}>
        Share Council
      </Button>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 16, paddingBottom: 80 },
    hero: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 10,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    title: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
    subtitle: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
    statusPillText: { fontSize: 11, fontFamily: 'Poppins_700Bold' },
    description: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 22 },
    cpidRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: CultureTokens.indigo + '33',
      backgroundColor: CultureTokens.indigo + '14',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    cpidText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.indigo },
    infoCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 10,
    },
    infoHeading: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.text },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    linkText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.primary },
    metaText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  });
