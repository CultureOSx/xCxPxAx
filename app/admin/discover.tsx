import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { CultureTokens } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type {
  DiscoverCurationConfig,
  DiscoverFeaturedArtistEntry,
  DiscoverFocus,
  HeritagePlaylistEntry,
  HeritagePlaylistType,
} from '@/shared/schema';
import {
  DEFAULT_DISCOVER_CURATION,
  DISCOVER_FOCUS_OPTIONS,
  HERITAGE_PLAYLIST_TYPES,
} from '@/shared/schema';

const isWeb = Platform.OS === 'web';

function cloneConfig(config: DiscoverCurationConfig): DiscoverCurationConfig {
  return {
    featuredArtists: config.featuredArtists.map((item) => ({ ...item })),
    heritagePlaylists: config.heritagePlaylists.map((item) => ({
      ...item,
      matchKeys: item.matchKeys ? [...item.matchKeys] : undefined,
    })),
    updatedAt: config.updatedAt,
    updatedBy: config.updatedBy,
  };
}

function createArtistDraft(): DiscoverFeaturedArtistEntry {
  return {
    id: `artist-${Date.now()}`,
    name: '',
    subtitle: '',
    meta: '',
    imageUrl: '',
    accentColor: CultureTokens.indigo,
    focus: 'heritage',
    ctaLabel: 'View artist',
    active: true,
  };
}

function createPlaylistDraft(): HeritagePlaylistEntry {
  return {
    id: `playlist-${Date.now()}`,
    title: '',
    artist: '',
    culture: '',
    imageUrl: '',
    typeLabel: 'Music',
    accentColor: CultureTokens.gold,
    focus: 'heritage',
    active: true,
    matchKeys: [],
  };
}

function SectionLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionLabelWrap}>
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

function ChipOption({
  label,
  active,
  onPress,
  accent,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accent: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? accent + '18' : colors.backgroundSecondary,
          borderColor: active ? accent + '40' : colors.borderLight,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.chipText, { color: active ? accent : colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

function DiscoverAdminContent() {
  const colors = useColors();
  const { hPad } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = isWeb ? 0 : insets.top;
  const { role, isLoading: roleLoading } = useRole();
  const isSuperAdmin = role === 'platformAdmin';

  const [config, setConfig] = useState<DiscoverCurationConfig>(cloneConfig(DEFAULT_DISCOVER_CURATION));
  const [selectedArtistIndex, setSelectedArtistIndex] = useState(0);
  const [selectedPlaylistIndex, setSelectedPlaylistIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      router.replace('/admin/dashboard');
    }
  }, [isSuperAdmin, roleLoading]);

  const configQuery = useQuery({
    queryKey: ['admin-discover-curation'],
    queryFn: () => api.admin.getDiscoverCuration(),
    enabled: isSuperAdmin,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (hydrated || !configQuery.data?.config) return;
    setConfig(cloneConfig(configQuery.data.config));
    setHydrated(true);
  }, [configQuery.data, hydrated]);

  const saveMutation = useMutation({
    mutationFn: () => api.admin.saveDiscoverCuration(config),
    onSuccess: ({ config: nextConfig }) => {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfig(cloneConfig(nextConfig));
      queryClient.invalidateQueries({ queryKey: ['admin-discover-curation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/discover/curation'] });
    },
    onError: (err: Error) => Alert.alert('Unable to save', err.message),
  });

  const selectedArtist = config.featuredArtists[selectedArtistIndex] ?? null;
  const selectedPlaylist = config.heritagePlaylists[selectedPlaylistIndex] ?? null;

  const sourceLabel = useMemo(() => configQuery.data?.source ?? 'default', [configQuery.data?.source]);

  const updateArtist = <K extends keyof DiscoverFeaturedArtistEntry>(key: K, value: DiscoverFeaturedArtistEntry[K]) => {
    setConfig((current) => {
      const featuredArtists = [...current.featuredArtists];
      if (!featuredArtists[selectedArtistIndex]) return current;
      featuredArtists[selectedArtistIndex] = { ...featuredArtists[selectedArtistIndex], [key]: value };
      return { ...current, featuredArtists };
    });
  };

  const updatePlaylist = <K extends keyof HeritagePlaylistEntry>(key: K, value: HeritagePlaylistEntry[K]) => {
    setConfig((current) => {
      const heritagePlaylists = [...current.heritagePlaylists];
      if (!heritagePlaylists[selectedPlaylistIndex]) return current;
      heritagePlaylists[selectedPlaylistIndex] = { ...heritagePlaylists[selectedPlaylistIndex], [key]: value };
      return { ...current, heritagePlaylists };
    });
  };

  const moveItem = (collection: 'featuredArtists' | 'heritagePlaylists', index: number, direction: -1 | 1) => {
    setConfig((current) => {
      const nextIndex = index + direction;
      const list = [...current[collection]];
      if (nextIndex < 0 || nextIndex >= list.length) return current;
      const temp = list[index];
      list[index] = list[nextIndex];
      list[nextIndex] = temp;
      return { ...current, [collection]: list };
    });
    if (collection === 'featuredArtists') {
      setSelectedArtistIndex((current) => Math.max(0, Math.min(config.featuredArtists.length - 1, current + direction)));
    } else {
      setSelectedPlaylistIndex((current) => Math.max(0, Math.min(config.heritagePlaylists.length - 1, current + direction)));
    }
  };

  const removeArtist = () => {
    setConfig((current) => ({
      ...current,
      featuredArtists: current.featuredArtists.filter((_, index) => index !== selectedArtistIndex),
    }));
    setSelectedArtistIndex((current) => Math.max(0, current - 1));
  };

  const removePlaylist = () => {
    setConfig((current) => ({
      ...current,
      heritagePlaylists: current.heritagePlaylists.filter((_, index) => index !== selectedPlaylistIndex),
    }));
    setSelectedPlaylistIndex((current) => Math.max(0, current - 1));
  };

  const addArtist = () => {
    const nextArtist = createArtistDraft();
    setConfig((current) => ({
      ...current,
      featuredArtists: [...current.featuredArtists, nextArtist],
    }));
    setSelectedArtistIndex(config.featuredArtists.length);
  };

  const addPlaylist = () => {
    const nextPlaylist = createPlaylistDraft();
    setConfig((current) => ({
      ...current,
      heritagePlaylists: [...current.heritagePlaylists, nextPlaylist],
    }));
    setSelectedPlaylistIndex(config.heritagePlaylists.length);
  };

  const loadDefaults = () => {
    Alert.alert('Load defaults', 'Replace current edits with the default discover curation set?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Load Defaults',
        onPress: () => {
          setConfig(cloneConfig(DEFAULT_DISCOVER_CURATION));
          setSelectedArtistIndex(0);
          setSelectedPlaylistIndex(0);
        },
      },
    ]);
  };

  const handleSave = () => {
    if (config.featuredArtists.length === 0) {
      Alert.alert('Missing artists', 'Add at least one featured artist before saving.');
      return;
    }
    if (config.heritagePlaylists.length === 0) {
      Alert.alert('Missing playlist', 'Add at least one heritage playlist before saving.');
      return;
    }
    saveMutation.mutate();
  };

  if (!isSuperAdmin && !roleLoading) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, paddingHorizontal: hPad, borderBottomColor: colors.borderLight }]}>
        <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/admin/dashboard')} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Discover Curation</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Manage Featured Artists and Heritage Playlist content</Text>
        </View>
        <View style={[styles.sourceBadge, { backgroundColor: sourceLabel === 'firestore' ? CultureTokens.teal + '18' : CultureTokens.gold + '18' }]}>
          <Text style={[styles.sourceBadgeText, { color: sourceLabel === 'firestore' ? CultureTokens.teal : CultureTokens.gold }]}>
            {sourceLabel === 'firestore' ? 'Live Config' : 'Defaults'}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {configQuery.isLoading && !hydrated ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={CultureTokens.indigo} size="large" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading discover curation…</Text>
          </View>
        ) : (
          <>
            <View style={[styles.actionsCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text style={[styles.actionsTitle, { color: colors.text }]}>Publishing Workflow</Text>
              <Text style={[styles.actionsSub, { color: colors.textSecondary }]}>
                Edit rail content here, save to Firestore, then refresh Discover to see the result immediately.
              </Text>
              <View style={styles.actionsRow}>
                <Pressable style={[styles.secondaryBtn, { borderColor: colors.borderLight, backgroundColor: colors.backgroundSecondary }]} onPress={loadDefaults}>
                  <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Load Defaults</Text>
                </Pressable>
                <Pressable style={[styles.primaryBtn, { backgroundColor: CultureTokens.indigo }, saveMutation.isPending && { opacity: 0.7 }]} onPress={handleSave} disabled={saveMutation.isPending}>
                  <Text style={styles.primaryBtnText}>{saveMutation.isPending ? 'Saving…' : 'Save Curation'}</Text>
                </Pressable>
              </View>
            </View>

            <SectionLabel title="FEATURED ARTISTS" subtitle="These cards can route to a real artist profile via profileId or to Explore via focus." />
            <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
                {config.featuredArtists.map((artist, index) => (
                  <Pressable
                    key={artist.id}
                    onPress={() => setSelectedArtistIndex(index)}
                    style={[
                      styles.selectorCard,
                      {
                        backgroundColor: selectedArtistIndex === index ? (artist.accentColor || CultureTokens.indigo) + '15' : colors.backgroundSecondary,
                        borderColor: selectedArtistIndex === index ? (artist.accentColor || CultureTokens.indigo) + '40' : colors.borderLight,
                      },
                    ]}
                  >
                    <Text style={[styles.selectorTitle, { color: colors.text }]} numberOfLines={1}>{artist.name || artist.profileId || 'Untitled artist'}</Text>
                    <Text style={[styles.selectorSub, { color: colors.textSecondary }]} numberOfLines={1}>{artist.focus || 'heritage'}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.inlineActions}>
                <Pressable style={[styles.smallActionBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]} onPress={addArtist}>
                  <Ionicons name="add" size={14} color={colors.text} />
                  <Text style={[styles.smallActionText, { color: colors.text }]}>Add</Text>
                </Pressable>
                <Pressable style={[styles.smallActionBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]} onPress={() => moveItem('featuredArtists', selectedArtistIndex, -1)}>
                  <Ionicons name="arrow-up" size={14} color={colors.text} />
                </Pressable>
                <Pressable style={[styles.smallActionBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]} onPress={() => moveItem('featuredArtists', selectedArtistIndex, 1)}>
                  <Ionicons name="arrow-down" size={14} color={colors.text} />
                </Pressable>
                <Pressable style={[styles.smallActionBtn, { backgroundColor: CultureTokens.coral + '12', borderColor: CultureTokens.coral + '35' }]} onPress={removeArtist}>
                  <Ionicons name="trash-outline" size={14} color={CultureTokens.coral} />
                </Pressable>
              </View>

              {selectedArtist ? (
                <View style={styles.formGrid}>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedArtist.id}
                    onChangeText={(value) => updateArtist('id', value)}
                    placeholder="artist-id"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedArtist.profileId || ''}
                    onChangeText={(value) => updateArtist('profileId', value || undefined)}
                    placeholder="profileId (optional)"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedArtist.name || ''}
                    onChangeText={(value) => updateArtist('name', value || undefined)}
                    placeholder="Display name"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedArtist.subtitle || ''}
                    onChangeText={(value) => updateArtist('subtitle', value || undefined)}
                    placeholder="Subtitle"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedArtist.meta || ''}
                    onChangeText={(value) => updateArtist('meta', value || undefined)}
                    placeholder="Meta line"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedArtist.imageUrl || ''}
                    onChangeText={(value) => updateArtist('imageUrl', value || undefined)}
                    placeholder="Image URL"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedArtist.accentColor || ''}
                    onChangeText={(value) => updateArtist('accentColor', value || undefined)}
                    placeholder="Accent color"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedArtist.ctaLabel || ''}
                    onChangeText={(value) => updateArtist('ctaLabel', value || undefined)}
                    placeholder="CTA label"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedArtist.city || ''}
                    onChangeText={(value) => updateArtist('city', value || undefined)}
                    placeholder="City filter (optional)"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedArtist.country || ''}
                    onChangeText={(value) => updateArtist('country', value || undefined)}
                    placeholder="Country filter (optional)"
                    placeholderTextColor={colors.textTertiary}
                  />

                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Focus</Text>
                  <View style={styles.chipWrap}>
                    {DISCOVER_FOCUS_OPTIONS.map((focus) => (
                      <ChipOption
                        key={focus}
                        label={focus}
                        active={(selectedArtist.focus || 'heritage') === focus}
                        onPress={() => updateArtist('focus', focus)}
                        accent={selectedArtist.accentColor || CultureTokens.indigo}
                      />
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Status</Text>
                  <View style={styles.inlineActions}>
                    <ChipOption
                      label="Active"
                      active={selectedArtist.active !== false}
                      onPress={() => updateArtist('active', true)}
                      accent={CultureTokens.teal}
                    />
                    <ChipOption
                      label="Hidden"
                      active={selectedArtist.active === false}
                      onPress={() => updateArtist('active', false)}
                      accent={CultureTokens.coral}
                    />
                  </View>
                </View>
              ) : null}
            </View>

            <SectionLabel
              title="HERITAGE PLAYLIST"
              subtitle="Cards open Explore for matched cultural discovery. Optional Listen URL (Spotify, Apple Music, web) opens in the user’s browser or app."
            />
            <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
                {config.heritagePlaylists.map((item, index) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedPlaylistIndex(index)}
                    style={[
                      styles.selectorCard,
                      {
                        backgroundColor: selectedPlaylistIndex === index ? item.accentColor + '15' : colors.backgroundSecondary,
                        borderColor: selectedPlaylistIndex === index ? item.accentColor + '40' : colors.borderLight,
                      },
                    ]}
                  >
                    <Text style={[styles.selectorTitle, { color: colors.text }]} numberOfLines={1}>{item.title || 'Untitled playlist'}</Text>
                    <Text style={[styles.selectorSub, { color: colors.textSecondary }]} numberOfLines={1}>{item.typeLabel}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.inlineActions}>
                <Pressable style={[styles.smallActionBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]} onPress={addPlaylist}>
                  <Ionicons name="add" size={14} color={colors.text} />
                  <Text style={[styles.smallActionText, { color: colors.text }]}>Add</Text>
                </Pressable>
                <Pressable style={[styles.smallActionBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]} onPress={() => moveItem('heritagePlaylists', selectedPlaylistIndex, -1)}>
                  <Ionicons name="arrow-up" size={14} color={colors.text} />
                </Pressable>
                <Pressable style={[styles.smallActionBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]} onPress={() => moveItem('heritagePlaylists', selectedPlaylistIndex, 1)}>
                  <Ionicons name="arrow-down" size={14} color={colors.text} />
                </Pressable>
                <Pressable style={[styles.smallActionBtn, { backgroundColor: CultureTokens.coral + '12', borderColor: CultureTokens.coral + '35' }]} onPress={removePlaylist}>
                  <Ionicons name="trash-outline" size={14} color={CultureTokens.coral} />
                </Pressable>
              </View>

              {selectedPlaylist ? (
                <View style={styles.formGrid}>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedPlaylist.id}
                    onChangeText={(value) => updatePlaylist('id', value)}
                    placeholder="playlist-id"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedPlaylist.title}
                    onChangeText={(value) => updatePlaylist('title', value)}
                    placeholder="Title"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedPlaylist.artist}
                    onChangeText={(value) => updatePlaylist('artist', value)}
                    placeholder="Artist"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedPlaylist.culture}
                    onChangeText={(value) => updatePlaylist('culture', value)}
                    placeholder="Culture"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedPlaylist.imageUrl}
                    onChangeText={(value) => updatePlaylist('imageUrl', value)}
                    placeholder="Image URL"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedPlaylist.externalUrl || ''}
                    onChangeText={(value) => updatePlaylist('externalUrl', value.trim() ? value.trim() : undefined)}
                    placeholder="Listen URL (optional — Spotify / Apple Music / https)"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedPlaylist.accentColor}
                    onChangeText={(value) => updatePlaylist('accentColor', value)}
                    placeholder="Accent color"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedPlaylist.city || ''}
                    onChangeText={(value) => updatePlaylist('city', value || undefined)}
                    placeholder="City filter (optional)"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={selectedPlaylist.country || ''}
                    onChangeText={(value) => updatePlaylist('country', value || undefined)}
                    placeholder="Country filter (optional)"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}
                    value={(selectedPlaylist.matchKeys || []).join(', ')}
                    onChangeText={(value) =>
                      updatePlaylist(
                        'matchKeys',
                        value.split(',').map((item) => item.trim()).filter(Boolean),
                      )
                    }
                    placeholder="match key, second key"
                    placeholderTextColor={colors.textTertiary}
                  />

                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type</Text>
                  <View style={styles.inlineActions}>
                    {HERITAGE_PLAYLIST_TYPES.map((typeLabel) => (
                      <ChipOption
                        key={typeLabel}
                        label={typeLabel}
                        active={selectedPlaylist.typeLabel === typeLabel}
                        onPress={() => updatePlaylist('typeLabel', typeLabel as HeritagePlaylistType)}
                        accent={selectedPlaylist.accentColor}
                      />
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Focus</Text>
                  <View style={styles.chipWrap}>
                    {DISCOVER_FOCUS_OPTIONS.map((focus) => (
                      <ChipOption
                        key={focus}
                        label={focus}
                        active={selectedPlaylist.focus === focus}
                        onPress={() => updatePlaylist('focus', focus as DiscoverFocus)}
                        accent={selectedPlaylist.accentColor}
                      />
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Status</Text>
                  <View style={styles.inlineActions}>
                    <ChipOption
                      label="Active"
                      active={selectedPlaylist.active !== false}
                      onPress={() => updatePlaylist('active', true)}
                      accent={CultureTokens.teal}
                    />
                    <ChipOption
                      label="Hidden"
                      active={selectedPlaylist.active === false}
                      onPress={() => updatePlaylist('active', false)}
                      accent={CultureTokens.coral}
                    />
                    <ChipOption
                      label="Live Badge"
                      active={selectedPlaylist.isLive === true}
                      onPress={() => updatePlaylist('isLive', !(selectedPlaylist.isLive === true))}
                      accent={CultureTokens.gold}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export default function DiscoverAdminScreen() {
  return (
    <ErrorBoundary>
      <DiscoverAdminContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  sourceBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  content: {
    paddingTop: 20,
    gap: 20,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  actionsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  actionsTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  actionsSub: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  sectionLabelWrap: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1.4,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  selectorRow: {
    gap: 10,
    paddingBottom: 2,
  },
  selectorCard: {
    width: 168,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  selectorTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  selectorSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  smallActionBtn: {
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  smallActionText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  formGrid: {
    gap: 12,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 46,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
});
