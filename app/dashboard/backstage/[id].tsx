// app/dashboard/backstage/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  FadeInLeft,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CultureTokens, shadows } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/ui/Button';

const MOCK_MESSAGES = [
  { id: '1', user: 'CultureEnthusiast', text: 'This performance is incredible! Loving the visuals.', color: CultureTokens.indigo },
  { id: '2', user: 'SukiFan_99', text: 'Suki is on fire tonight! 🔥', color: '#CD2E3A' },
  { id: '3', user: 'TablaKing', text: 'The rhythm section is so tight.', color: '#FF9933' },
];

export default function ArtistBackstagePortal() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [chat, setChat] = useState(MOCK_MESSAGES);
  const [msg, setMsg] = useState('');
  const [isLive, setIsLive] = useState(true);

  // Live indicator animation
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.2, { duration: 600 }), withTiming(1, { duration: 600 })), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: pulse.value }],
  }));

  const handleSend = () => {
    if (!msg.trim()) return;
    setChat([...chat, { id: Date.now().toString(), user: 'You', text: msg, color: CultureTokens.teal }]);
    setMsg('');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.root}>
      {/* High-Impact Video Background / Placeholder */}
      <View style={styles.videoContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200' }} 
          style={StyleSheet.absoluteFill} 
          contentFit="cover"
        />
        <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
        
        {/* Back Button */}
        <TouchableOpacity style={[styles.backBtn, { top: insets.top + 16 }]} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Live Indicator */}
        <View style={[styles.liveBadge, { top: insets.top + 16 }]}>
          <Animated.View style={[styles.liveDot, pulseStyle]} />
          <Text style={styles.liveText}>LIVE: Artist Backstage</Text>
        </View>

        {/* Artist Profile Overay */}
        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.artistInfo}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400' }} style={styles.artistAvatar} />
          <View>
            <Text style={styles.artistName}>Suki Park</Text>
            <View style={styles.viewerCount}>
              <Ionicons name="people" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.viewerText}>1,429 watching</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.followBtn}><Text style={styles.followText}>Follow</Text></TouchableOpacity>
        </Animated.View>
      </View>

      {/* Chat & Interaction Portal */}
      <BlurView intensity={30} tint="dark" style={[styles.interactionPortal, { paddingBottom: insets.bottom + 20 }]}>
        <ScrollView style={styles.chatFeed} showsVerticalScrollIndicator={false} contentContainerStyle={styles.chatScroll}>
          {chat.map((m, idx) => (
            <Animated.View key={m.id} entering={FadeInLeft.delay(idx * 100).springify()} style={[styles.msgContainer, { borderLeftColor: m.color }]}>
              <Text style={[styles.msgUser, { color: m.color }]}>{m.user}</Text>
              <Text style={styles.msgText}>{m.text}</Text>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputArea}>
          <View style={styles.inputBar}>
            <TextInput 
              style={styles.input}
              placeholder="Join the conversation..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={msg}
              onChangeText={setMsg}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendIcon}>
              <Ionicons name="send" size={20} color={CultureTokens.indigo} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.giftBtn}>
            <LinearGradient colors={[CultureTokens.gold, CultureTokens.saffron]} style={styles.giftFill}>
              <Ionicons name="gift" size={24} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
