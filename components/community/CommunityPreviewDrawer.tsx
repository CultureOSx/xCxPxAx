import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Platform,
  Alert,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CultureTokens, shadows } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/ui/Button';
import {
  getCommunityAccent,
  getCommunityActivityMeta,
  getCommunityEventsCount,
  getCommunityHeadline,
  getCommunityLabel,
  getCommunityMemberCount,
  getCommunitySignals,
} from '@/lib/community';
import { useJoinCommunity } from '@/hooks/queries/useCommunities';
import type { Community } from '@/shared/schema';

interface CommunityPreviewDrawerProps {
  profile: Community | null;
  onClose: () => void;
}

export function CommunityPreviewDrawer({ profile, onClose }: CommunityPreviewDrawerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { mutate: joinCommunity } = useJoinCommunity();

  const accentColor = profile ? getCommunityAccent(profile, CultureTokens.indigo) : CultureTokens.indigo;
  const memberCount = profile ? getCommunityMemberCount(profile) : 0;
  const eventsCount = profile ? getCommunityEventsCount(profile) : 0;
  const activity = profile ? getCommunityActivityMeta(profile) : { label: '', color: '' };
  const signals = profile ? getCommunitySignals(profile) : [];
  const headline = profile ? getCommunityHeadline(profile) : '';

  if (!profile) return null;

  function handleJoin() {
    joinCommunity(profile!.id, {
      onSuccess: () => {
        onClose();
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
      onError: (e: any) => {
        if (Platform.OS === 'web') {
          alert('Failed to join community. Please try again.');
        } else {
          Alert.alert('Join failed', 'Failed to join community. Please try again.');
        }
      },
    });
  }

  function handleViewProfile() {
    onClose();
    router.push({ pathname: '/community/[id]', params: { id: profile!.id } });
  }

  return (
    <Modal visible={!!profile} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidOverlay]} />
          )}
        </Pressable>

        <Animated.View
          entering={Platform.OS !== 'web' ? SlideInDown.springify().damping(22) : undefined}
          style={[
            styles.sheet,
            { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.coverWrap}>
            <Image
              source={{ uri: profile.imageUrl ?? '' }}
              style={styles.cover}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={StyleSheet.absoluteFill}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Text style={[styles.name, { color: colors.text }]}>{profile.name}</Text>
                {profile.isVerified && (
                  <Ionicons name="checkmark-circle" size={20} color={CultureTokens.indigo} />
                )}
              </View>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>
                {getCommunityLabel(profile)} ·{' '}
                {[profile.city, profile.country].filter(Boolean).join(', ') || 'Australia'}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statVal, { color: colors.text }]}>
                  {memberCount > 0 ? memberCount.toLocaleString() : '—'}
                </Text>
                <Text style={[styles.statLab, { color: colors.textTertiary }]}>Members</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statVal, { color: colors.text }]}>
                  {eventsCount > 0 ? eventsCount : '—'}
                </Text>
                <Text style={[styles.statLab, { color: colors.textTertiary }]}>Events</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.statVal, { color: activity.color }]}>{activity.label}</Text>
                <Text style={[styles.statLab, { color: colors.textTertiary }]}>Momentum</Text>
              </View>
            </View>

            {signals.length > 1 && (
              <View style={styles.signalRow}>
                {signals.slice(1).map((signal) => (
                  <View
                    key={signal}
                    style={[styles.signalChip, { backgroundColor: colors.backgroundSecondary }]}
                  >
                    <Text style={[styles.signalChipText, { color: colors.textSecondary }]}>
                      {signal}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={3}>
              {headline}
            </Text>

            <View style={styles.actions}>
              <Button style={[styles.joinBtn, { backgroundColor: accentColor }]} onPress={handleJoin}>
                <Text style={styles.btnText}>Join Community</Text>
              </Button>
              <TouchableOpacity
                style={[styles.profileBtn, { borderColor: colors.borderLight }]}
                onPress={handleViewProfile}
              >
                <Text style={[styles.profileBtnText, { color: colors.text }]}>
                  View Full Profile
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  androidOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    ...shadows.large,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  coverWrap: { height: 180, position: 'relative' },
  cover: { width: '100%', height: '100%' },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 24 },
  header: { marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 24, fontFamily: 'Poppins_700Bold' },
  sub: { fontSize: 13, fontFamily: 'Poppins_500Medium', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center' },
  statVal: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  statLab: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  signalChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  signalChipText: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  desc: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: { gap: 12 },
  joinBtn: { height: 56, borderRadius: 16, justifyContent: 'center' },
  btnText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 16 },
  profileBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
});
