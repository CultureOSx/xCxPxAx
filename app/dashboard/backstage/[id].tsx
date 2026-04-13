// app/dashboard/backstage/[id].tsx — organiser backstage (launch: no simulated stream or chat)
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CultureTokens, TextStyles } from '@/constants/theme';

const MOCK_MESSAGES = [
  { id: '1', user: 'CultureEnthusiast', text: 'This performance is incredible! Loving the visuals.', color: CultureTokens.indigo },
  { id: '2', user: 'SukiFan_99', text: 'Suki is on fire tonight! 🔥', color: '#CD2E3A' },
  { id: '3', user: 'TablaKing', text: 'The rhythm section is so tight.', color: '#FF9933' },
];

export default function ArtistBackstagePortal() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { title } = useLocalSearchParams<{ id?: string; title?: string }>();
  const heading = typeof title === 'string' && title.trim() ? title.trim() : 'Backstage';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[...gradients.midnight]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.safe, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
        <Button
          variant="ghost"
          size="sm"
          leftIcon="chevron-back"
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          accessibilityLabel="Go back"
        >
          Back
        </Button>

        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]}>{heading}</Text>
          <Text style={[styles.copy, { color: colors.textSecondary }]}>
            Live stream and audience chat will appear here when your organiser runs a backstage session. There is nothing
            to preview until that experience is enabled for a real event.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  videoContainer: { flex: 0.65, position: 'relative' },
  backBtn: { position: 'absolute', left: 24, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  liveBadge: { position: 'absolute', left: 80, zIndex: 10, backgroundColor: 'rgba(238, 28, 37, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveText: { color: '#fff', ...TextStyles.badge, letterSpacing: 0.5 },
  artistInfo: { position: 'absolute', bottom: 24, left: 24, right: 24, flexDirection: 'row', alignItems: 'center', gap: 14 },
  artistAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#fff' },
  artistName: { color: '#fff', ...TextStyles.title3 },
  viewerCount: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  viewerText: { color: 'rgba(255,255,255,0.7)', ...TextStyles.caption },
  followBtn: { marginLeft: 'auto', backgroundColor: CultureTokens.indigo, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  followText: { color: '#fff', ...TextStyles.chip },

  interactionPortal: { flex: 0.35, borderTopLeftRadius: 36, borderTopRightRadius: 36, overflow: 'hidden' },
  chatFeed: { flex: 1, padding: 24 },
  chatScroll: { gap: 16 },
  msgContainer: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 2 },
  msgUser: { ...TextStyles.badge, textTransform: 'uppercase' },
  msgText: { color: '#fff', ...TextStyles.cardBody, marginTop: 2 },
  inputArea: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 10, alignItems: 'center' },
  inputBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 16, height: 56 },
  input: { flex: 1, color: '#fff', ...TextStyles.cardBody },
  sendIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  giftBtn: { width: 56, height: 56, borderRadius: 20, overflow: 'hidden' },
  giftFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1, backgroundColor: '#000' },
  videoContainer: { flex: 0.65, position: 'relative' },
  backBtn: { position: 'absolute', left: 24, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  liveBadge: { position: 'absolute', left: 80, zIndex: 10, backgroundColor: 'rgba(238, 28, 37, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_800ExtraBold', letterSpacing: 0.5 },
  artistInfo: { position: 'absolute', bottom: 24, left: 24, right: 24, flexDirection: 'row', alignItems: 'center', gap: 14 },
  artistAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#fff' },
  artistName: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_700Bold' },
  viewerCount: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  viewerText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Poppins_500Medium' },
  followBtn: { marginLeft: 'auto', backgroundColor: CultureTokens.indigo, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  followText: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_700Bold' },

  interactionPortal: { flex: 0.35, borderTopLeftRadius: 36, borderTopRightRadius: 36, overflow: 'hidden' },
  chatFeed: { flex: 1, padding: 24 },
  chatScroll: { gap: 16 },
  msgContainer: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 2 },
  msgUser: { fontSize: 11, fontFamily: 'Poppins_800ExtraBold', textTransform: 'uppercase' },
  msgText: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_500Medium', marginTop: 2 },
  inputArea: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 10, alignItems: 'center' },
  inputBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 16, height: 56 },
  input: { flex: 1, color: '#fff', fontFamily: 'Poppins_500Medium', fontSize: 14 },
  sendIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  giftBtn: { width: 56, height: 56, borderRadius: 20, overflow: 'hidden' },
  giftFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'center', gap: 16, maxWidth: 520 },
  title: { ...TextStyles.title, fontSize: 28 },
  copy: { ...TextStyles.body, lineHeight: 24 },
>>>>>>> cursor/onboarding-brand-lint-fixes
});
