import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, type ColorTheme } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function ContentStudioScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const [activeTab, setActiveTab] = useState<'playlists' | 'posts'>('playlists');

  const handleTabChange = useCallback((tab: 'playlists' | 'posts') => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  }, []);

  const header = (
    <LinearGradient
      colors={gradients.midnight as unknown as [string, string]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.headerCard}
    >
      <View style={styles.headerRow}>
        <Pressable 
          onPress={() => router.back()} 
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Content Studio</Text>
          <Text style={styles.headerSub}>Manage heritage playlists & cultural stories</Text>
        </View>
        <View style={styles.studioBadge}>
          <Ionicons name="sparkles" size={12} color={CultureTokens.gold} />
          <Text style={styles.studioBadgeText}>Studio</Text>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <DashboardShell header={<Animated.View entering={FadeInUp.duration(400)}>{header}</Animated.View>}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable 
          onPress={() => handleTabChange('playlists')} 
          style={[styles.tab, activeTab === 'playlists' && { backgroundColor: CultureTokens.indigo + '15', borderColor: CultureTokens.indigo + '40' }]}
        >
          <Ionicons 
            name="musical-notes" 
            size={18} 
            color={activeTab === 'playlists' ? CultureTokens.indigo : colors.textTertiary} 
          />
          <Text style={[styles.tabText, { color: activeTab === 'playlists' ? colors.text : colors.textTertiary }]}>
            Playlists
          </Text>
        </Pressable>
        <Pressable 
          onPress={() => handleTabChange('posts')} 
          style={[styles.tab, activeTab === 'posts' && { backgroundColor: CultureTokens.coral + '15', borderColor: CultureTokens.coral + '40' }]}
        >
          <Ionicons 
            name="document-text" 
            size={18} 
            color={activeTab === 'posts' ? CultureTokens.coral : colors.textTertiary} 
          />
          <Text style={[styles.tabText, { color: activeTab === 'posts' ? colors.text : colors.textTertiary }]}>
            Stories
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'playlists' ? (
          <Animated.View entering={FadeInDown.duration(400)} key="playlists">
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <LinearGradient
                colors={[CultureTokens.indigo + '20', 'transparent'] as [string, string]}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.iconCircle, { backgroundColor: CultureTokens.indigo + '20' }]}>
                <Ionicons name="musical-notes" size={32} color={CultureTokens.indigo} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Heritage Playlists</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Connect your community{"'"}s sounds. Sync Spotify playlists to your profile to create an immersive cultural experience for your visitors.
              </Text>
              <Button 
                variant="primary" 
                leftIcon={"logo-spotify" as any}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                style={{ marginTop: 28, backgroundColor: '#1DB954', width: '100%', borderRadius: 16 }}
              >
                Connect Spotify
              </Button>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)} key="posts">
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <LinearGradient
                colors={[CultureTokens.coral + '20', 'transparent'] as [string, string]}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.iconCircle, { backgroundColor: CultureTokens.coral + '20' }]}>
                <Ionicons name="document-text" size={32} color={CultureTokens.coral} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Share Your Story</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Publish definitive origin stories, community news, and cultural guides that appear directly on your entity page.
              </Text>
              <Button 
                variant="primary" 
                leftIcon="add-circle"
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                style={{ marginTop: 28, backgroundColor: CultureTokens.coral, width: '100%', borderRadius: 16 }}
              >
                Draft New Story
              </Button>
            </View>
          </Animated.View>
        )}
      </View>
    </DashboardShell>
  );
}

const getStyles = (colors: ColorTheme) => StyleSheet.create({
  container: { flex: 1 },
  // Header
  headerCard: { borderRadius: 20, padding: 16, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { 
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', 
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' 
  },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: '#fff' },
  headerSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  studioBadge: { 
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, 
    borderRadius: 10, backgroundColor: 'rgba(255,200,87,0.15)', borderWidth: 1, borderColor: CultureTokens.gold + '60' 
  },
  studioBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: CultureTokens.gold },

  // Tabs
  tabsContainer: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  tab: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, 
    paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'transparent' 
  },
  tabText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  // Content
  content: { flex: 1 },
  emptyState: { 
    alignItems: 'center', paddingHorizontal: 24, paddingVertical: 48, borderRadius: 24, borderWidth: 1, overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 10px 40px rgba(0,0,0,0.15)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', marginTop: 12, marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 24 },
});
