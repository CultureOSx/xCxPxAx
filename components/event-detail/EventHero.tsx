import { View, Text, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CultureTokens, TextStyles } from '@/constants/theme';
import { HeroGlassIconButton } from './HeroGlassIconButton';
import { useColors } from '@/hooks/useColors';
import { getStyles } from './styles';
import { formatDate, isWeb } from './utils';
import type { EventData } from '@/shared/schema';

interface EventHeroProps {
  event: EventData;
  heroDisplayUri: string | null | undefined;
  saved: boolean;
  canEdit: boolean;
  uploading: boolean;
  isDesktop: boolean;
  topInset: number;
  handleShare: () => void;
  handleSave: () => void;
  handlePickCover: () => void;
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof getStyles>;
}

export function EventHero({
  event,
  heroDisplayUri,
  saved,
  canEdit,
  uploading,
  isDesktop,
  topInset,
  handleShare,
  handleSave,
  handlePickCover,
  colors,
  s,
}: EventHeroProps) {
  return (
    <View style={s.heroWrapper}>
      <View
        style={[
          s.heroSection,
          { height: isDesktop ? 450 : 380 + topInset },
          isDesktop && { borderRadius: 32, marginHorizontal: 20, marginTop: 20, overflow: 'hidden' },
        ]}
      >
        {heroDisplayUri ? (
          <Image
            source={{ uri: heroDisplayUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={400}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backgroundSecondary }]} />
        )}

        <LinearGradient
          colors={['rgba(11,11,20,0.5)', 'transparent', 'rgba(11,11,20,0.85)']}
          style={StyleSheet.absoluteFill}
        />

        {/* CulturePass Verified watermark */}
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            alignSelf: 'center',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: 'rgba(0,0,0,0.24)',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: 'rgba(255,255,255,0.14)',
          }}
          pointerEvents="none"
        >
          <Text
            style={{
              color: 'rgba(255,255,255,0.58)',
              fontFamily: 'Poppins_600SemiBold',
              fontSize: 10,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            CulturePass Verified
          </Text>
        </View>

        <View style={[s.heroOverlay, { paddingTop: topInset + 12 }]}>
          {/* Nav row */}
          <View style={s.heroNav}>
            <HeroGlassIconButton
              onPress={() => {
                if (!isWeb) Haptics.selectionAsync();
                router.replace('/(tabs)');
              }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color={colors.textOnBrandGradient} />
            </HeroGlassIconButton>

            <View style={s.heroActions}>
              {canEdit ? (
                <HeroGlassIconButton
                  onPress={handlePickCover}
                  accessibilityRole="button"
                  accessibilityLabel="Change cover image"
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.textOnBrandGradient} />
                  ) : (
                    <Ionicons name="create-outline" size={18} color={colors.textOnBrandGradient} />
                  )}
                </HeroGlassIconButton>
              ) : null}
              <HeroGlassIconButton
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share"
              >
                <Ionicons name="share-outline" size={18} color={colors.textOnBrandGradient} />
              </HeroGlassIconButton>
              <HeroGlassIconButton
                onPress={() => {
                  if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleSave();
                }}
                accessibilityRole="button"
                accessibilityLabel="Save event"
              >
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={saved ? CultureTokens.gold : colors.textOnBrandGradient}
                />
              </HeroGlassIconButton>
            </View>
          </View>

          {/* Title + category + date */}
          <View style={s.heroBottomContent}>
            <View style={s.heroTitleRibbon}>
              <Text
                style={[
                  TextStyles.hero,
                  {
                    color: colors.textOnBrandGradient,
                    ...Platform.select({
                      web: { textShadow: '0px 2px 6px rgba(0,0,0,0.5)' },
                      default: {
                        textShadowColor: 'rgba(0,0,0,0.5)',
                        textShadowOffset: { width: 0, height: 2 },
                        textShadowRadius: 6,
                      },
                    }),
                  },
                ]}
                numberOfLines={3}
                maxFontSizeMultiplier={1.5}
              >
                {event.title}
              </Text>
            </View>
            <View style={s.heroMetaRow}>
              <View style={[s.heroCardBadge, { backgroundColor: CultureTokens.gold }]}>
                <Text style={[TextStyles.badgeCaps, { color: 'black' }]}>
                  {event.category || 'Event'}
                </Text>
              </View>
              <Text style={[TextStyles.captionSemibold, { color: colors.textOnBrandGradient, opacity: 0.92 }]}>
                {formatDate(event.date)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
