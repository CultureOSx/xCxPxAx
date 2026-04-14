import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextStyles, CultureTokens } from '@/constants/theme';
import { CultureTagRow } from '@/components/ui/CultureTag';
import { useColors } from '@/hooks/useColors';
import { getStyles } from './styles';
import { formatDate, startCaseLabel } from './utils';
import { formatEventTime } from '@/lib/dateUtils';
import type { EventData } from '@/shared/schema';

interface Countdown {
  ended: boolean;
  days: number;
  hours: number;
  minutes: number;
}

interface DetailsSectionProps {
  event: EventData;
  countdown: Countdown | null;
  capacityPercent: number;
  distanceKm: number | null;
  cultureTags: string[];
  languageTags: string[];
  accessibilityTags: string[];
  artistSummary: string[];
  sponsorNames: string[];
  isPlus: boolean;
  displayCategory: string;
  displayCommunity: string;
  description?: string | null;
  openMap: () => void;
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof getStyles>;
}

export function DetailsSection({
  event,
  countdown,
  capacityPercent,
  distanceKm,
  cultureTags,
  languageTags,
  accessibilityTags,
  artistSummary,
  sponsorNames,
  isPlus,
  displayCategory,
  displayCommunity,
  description,
  openMap,
  colors,
  s,
}: DetailsSectionProps) {
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  return (
    <>
      {/* Countdown */}
      {countdown ? (
        <View style={s.countdownWrapper}>
          {countdown.ended ? (
            <View style={s.countdownEndedBox}>
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <Text style={[TextStyles.bodyMedium, { color: colors.textSecondary }]}>
                Event has ended
              </Text>
            </View>
          ) : (
            <View style={s.countdownRow}>
              <View style={s.countBlock}>
                <Text style={[TextStyles.title, { color: colors.text }]}>{countdown.days}</Text>
                <Text style={TextStyles.badgeCaps}>days</Text>
              </View>
              <Text style={s.countSep}>:</Text>
              <View style={s.countBlock}>
                <Text style={[TextStyles.title, { color: colors.text }]}>{countdown.hours}</Text>
                <Text style={TextStyles.badgeCaps}>hrs</Text>
              </View>
              <Text style={s.countSep}>:</Text>
              <View style={s.countBlock}>
                <Text style={[TextStyles.title, { color: colors.text }]}>{countdown.minutes}</Text>
                <Text style={TextStyles.badgeCaps}>mins</Text>
              </View>
            </View>
          )}
        </View>
      ) : null}

      {/* Date + Venue info (inline rows) */}
      <View style={s.inlineMetaList}>
        <View style={s.inlineMetaRow}>
          <View style={[s.inlineMetaIcon, { backgroundColor: CultureTokens.indigo + '12' }]}>
            <Ionicons name="calendar-outline" size={20} color={CultureTokens.indigo} />
          </View>
          <View style={s.inlineMetaContent}>
            <Text style={TextStyles.badgeCaps}>Date & Time</Text>
            <Text style={[TextStyles.headline, { color: colors.text }]}>{formatDate(event.date)}</Text>
            <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
              {formatEventTime(event.time)}
            </Text>
          </View>
        </View>

        <Pressable onPress={openMap} style={s.inlineMetaRow}>
          <View style={[s.inlineMetaIcon, { backgroundColor: CultureTokens.teal + '12' }]}>
            <Ionicons name="location-outline" size={20} color={CultureTokens.teal} />
          </View>
          <View style={s.inlineMetaContent}>
            <Text style={TextStyles.badgeCaps}>Venue</Text>
            <Text style={[TextStyles.headline, { color: colors.text }]}>
              {event.venue || event.city}
            </Text>
            <Text style={[TextStyles.caption, { color: colors.textSecondary }]} numberOfLines={1}>
              {event.address || event.city}
              {distanceKm !== null ? ` • ${distanceKm.toFixed(1)} km away` : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </Pressable>
      </View>

      {/* CulturePass+ member note */}
      {isPlus ? (
        <View style={[s.inlineFactRow, { marginTop: 2 }]}>
          <Ionicons name="star" size={16} color={CultureTokens.indigo} />
          <Text style={[TextStyles.captionSemibold, { color: colors.primary }]}>CulturePass+ Priority Member</Text>
        </View>
      ) : null}

      <View style={s.divider} />

      {/* About */}
      <View style={s.section}>
        <Text style={TextStyles.badgeCaps}>About</Text>
        <Text style={[TextStyles.body, { color: colors.textSecondary, lineHeight: 26, marginTop: 8 }]}>
          {description?.trim() || 'More details for this event will be announced soon.'}
        </Text>
      </View>

      {/* Culture & Access tags */}
      {(cultureTags.length > 0 || languageTags.length > 0 || accessibilityTags.length > 0) ? (
        <>
          <View style={s.divider} />
          <View style={s.section}>
            <Text style={s.sectionTitle}>Culture & Access</Text>
            {cultureTags.length > 0 ? (
              <View style={s.metaBlock}>
                <Text style={TextStyles.badgeCaps}>Culture</Text>
                <CultureTagRow tags={cultureTags} max={6} size="md" />
              </View>
            ) : null}
            {languageTags.length > 0 ? (
              <View style={s.metaBlock}>
                <Text style={TextStyles.badgeCaps}>Languages</Text>
                <View style={s.chipRow}>
                  {languageTags.map((tag) => (
                    <View
                      key={tag}
                      style={[
                        s.metaChip,
                        { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
                      ]}
                    >
                      <Text style={[s.metaChipText, { color: colors.primaryLight }]}>
                        {startCaseLabel(tag) ?? tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            {accessibilityTags.length > 0 ? (
              <View style={s.metaBlock}>
                <Text style={TextStyles.badgeCaps}>Accessibility</Text>
                <View style={s.chipRow}>
                  {accessibilityTags.map((tag) => (
                    <View
                      key={tag}
                      style={[
                        s.metaChip,
                        { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
                      ]}
                    >
                      <Text style={[s.metaChipText, { color: colors.text }]}>
                        {startCaseLabel(tag) ?? tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </>
      ) : null}

      {/* Capacity bar */}
      <View style={s.divider} />
      <View style={s.section}>
        <View style={s.capacityHeader}>
          <Text style={TextStyles.badgeCaps}>Capacity</Text>
          <Text style={[TextStyles.captionSemibold, { color: colors.textSecondary }]}>
            {capacityPercent}% filled
          </Text>
        </View>
        <View style={s.capacityBarBg}>
          <View
            style={[
              s.capacityBarFill,
              {
                width: `${capacityPercent}%`,
                backgroundColor: capacityPercent > 80 ? CultureTokens.coral : CultureTokens.teal,
              },
            ]}
          />
        </View>
        <View style={s.capacityFooter}>
          <Text style={[TextStyles.captionSemibold, { color: colors.textSecondary }]}>
            {event.attending || 0} attending
          </Text>
          <Text style={[TextStyles.captionSemibold, { color: colors.textSecondary }]}>
            {Math.max(0, (event.capacity || 0) - (event.attending || 0))} spots left
          </Text>
        </View>
      </View>

      <View style={s.divider} />
      <View style={s.section}>
        <Pressable
          onPress={() => setShowMoreDetails((v) => !v)}
          style={({ pressed }) => [
            s.moreDetailsToggle,
            { borderColor: colors.borderLight, opacity: pressed ? 0.8 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={showMoreDetails ? 'Hide extra event details' : 'Show more event details'}
        >
          <Text style={[s.moreDetailsToggleText, { color: colors.text }]}>
            {showMoreDetails ? 'Hide details' : 'More details'}
          </Text>
          <Ionicons
            name={showMoreDetails ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={16}
            color={colors.textSecondary}
          />
        </Pressable>

        {showMoreDetails ? (
          <View style={s.metaBlock}>
            <View style={s.inlineFactRow}>
              <Text style={s.inlineFactLabel}>Category</Text>
              <Text style={[s.inlineFactValue, { color: colors.text }]}>{displayCategory}</Text>
            </View>
            <View style={s.inlineFactRow}>
              <Text style={s.inlineFactLabel}>Community</Text>
              <Text style={[s.inlineFactValue, { color: colors.text }]}>{displayCommunity}</Text>
            </View>
            <View style={s.inlineFactRow}>
              <Text style={s.inlineFactLabel}>CPID</Text>
              <Text style={[s.inlineFactValue, { color: colors.text }]}>{event.culturePassId ?? event.id}</Text>
            </View>

            {artistSummary.length > 0 ? (
              <View style={s.metaBlock}>
                <Text style={TextStyles.badgeCaps}>Featuring</Text>
                <Text style={[TextStyles.bodyMedium, { color: colors.textSecondary }]}>
                  {artistSummary.join(', ')}
                </Text>
              </View>
            ) : null}

            {sponsorNames.length > 0 ? (
              <View style={s.metaBlock}>
                <Text style={TextStyles.badgeCaps}>Partners</Text>
                <View style={s.chipRow}>
                  {sponsorNames.map((name) => (
                    <View
                      key={name}
                      style={[
                        s.metaChip,
                        { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
                      ]}
                    >
                      <Text style={[s.metaChipText, { color: colors.text }]}>{name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </>
  );
}
