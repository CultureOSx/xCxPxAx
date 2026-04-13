// @ts-nocheck
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { TextStyles, CultureTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { getStyles } from './styles';
import { promptRsvpLogin, isWeb } from './utils';
import type { EventData } from '@/shared/schema';

interface PrimaryActionSectionProps {
  event: EventData;
  saved: boolean;
  isFreeOrOpen: boolean;
  myRsvp: string | null;
  userId: string | null | undefined;
  pathname: string;
  rsvpMutation: { isPending: boolean };
  handlePrimaryGoingPress: () => void;
  handleRsvp: (status: 'going' | 'maybe' | 'not_going') => void;
  handleExternalTicketPress: () => void;
  openTicketModal: (tierIdx?: number) => void;
  handleShare: () => void;
  handleSave: () => void;
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof getStyles>;
}

export function PrimaryActionSection({
  event,
  saved,
  isFreeOrOpen,
  myRsvp,
  userId,
  pathname,
  rsvpMutation,
  handlePrimaryGoingPress,
  handleRsvp,
  handleExternalTicketPress,
  openTicketModal,
  handleShare,
  handleSave,
  colors,
  s,
}: PrimaryActionSectionProps) {
  const hasExternal = !!(event.externalTicketUrl || event.externalUrl);
  const goingCount = Math.max(event.rsvpGoing ?? 0, event.attending ?? 0);
  const pillMaybeActive = myRsvp === 'maybe';
  const pillCantActive = myRsvp === 'not_going';

  const onMaybe = () => {
    if (!userId) { promptRsvpLogin(pathname); return; }
    if (!isWeb) Haptics.selectionAsync().catch(() => {});
    handleRsvp('maybe');
  };

  const onCant = () => {
    if (!userId) { promptRsvpLogin(pathname); return; }
    if (!isWeb) Haptics.selectionAsync().catch(() => {});
    handleRsvp('not_going');
  };

  const secondaryActions = [
    {
      key: 'share',
      label: 'Share',
      icon: 'share-social-outline' as const,
      onPress: handleShare,
      active: false,
      activeColor: colors.text,
    },
    {
      key: 'save',
      label: saved ? 'Saved' : 'Save',
      icon: saved ? ('bookmark' as const) : ('bookmark-outline' as const),
      onPress: handleSave,
      active: saved,
      activeColor: CultureTokens.gold,
    },
  ];

  return (
    <View style={s.primaryActionCard}>
      <View style={s.primaryActionHeader}>
        <Text style={s.sectionTitle}>Your next move</Text>
        <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
          {isFreeOrOpen ? `${goingCount.toLocaleString()} going` : event.priceLabel || 'Tickets available'}
        </Text>
      </View>

      {isFreeOrOpen ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.primaryActionRowContent}
          style={s.primaryActionRow}
        >
          <Button
            variant={myRsvp === 'going' ? 'gradient' : 'primary'}
            size="sm"
            leftIcon={myRsvp === 'going' ? 'checkmark-circle' : 'person-add-outline'}
            onPress={handlePrimaryGoingPress}
            loading={rsvpMutation.isPending}
            style={s.primaryCta}
            textStyle={{ fontFamily: 'Poppins_700Bold' }}
          >
            {myRsvp === 'going' ? "You're in" : 'RSVP'}
          </Button>

          <Pressable
            onPress={onMaybe}
            style={({ pressed }) => [
              s.primaryPill,
              {
                backgroundColor: pillMaybeActive ? CultureTokens.gold + '22' : colors.backgroundSecondary,
                borderColor: pillMaybeActive ? CultureTokens.gold : colors.borderLight,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="RSVP maybe"
            accessibilityState={{ selected: pillMaybeActive }}
          >
            <Text style={[s.primaryPillText, { color: pillMaybeActive ? CultureTokens.gold : colors.text }]}>
              Maybe
            </Text>
          </Pressable>

          <Pressable
            onPress={onCant}
            style={({ pressed }) => [
              s.primaryPill,
              {
                backgroundColor: pillCantActive ? colors.error + '22' : colors.backgroundSecondary,
                borderColor: pillCantActive ? colors.error : colors.borderLight,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="RSVP cannot attend"
            accessibilityState={{ selected: pillCantActive }}
          >
            <Text style={[s.primaryPillText, { color: pillCantActive ? colors.error : colors.text }]}>
              Can&apos;t go
            </Text>
          </Pressable>

          {secondaryActions.map((action) => {
            const isActive = Boolean(action.active);
            const chipColor = isActive ? action.activeColor : colors.text;
            return (
              <Pressable
                key={action.key}
                onPress={action.onPress}
                style={({ pressed }) => [
                  s.quickActionChipCompact,
                  {
                    backgroundColor: isActive ? action.activeColor + '16' : colors.backgroundSecondary,
                    borderColor: isActive ? action.activeColor + '66' : colors.borderLight,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <Ionicons name={action.icon} size={14} color={chipColor} />
                <Text style={[s.quickActionText, { color: chipColor }]}>{action.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.primaryActionRowContent}
          style={s.primaryActionRow}
        >
          <Button
            variant="gradient"
            size="sm"
            leftIcon={hasExternal ? 'ticket-outline' : 'ticket'}
            onPress={hasExternal ? handleExternalTicketPress : () => openTicketModal()}
            accessibilityLabel={hasExternal ? 'Buy tickets' : 'Reserve tickets'}
            style={s.primaryCta}
            textStyle={{ fontFamily: 'Poppins_700Bold' }}
          >
            {hasExternal ? 'Get tickets' : 'Reserve'}
          </Button>

          {secondaryActions.map((action) => {
            const isActive = Boolean(action.active);
            const chipColor = isActive ? action.activeColor : colors.text;
            return (
              <Pressable
                key={action.key}
                onPress={action.onPress}
                style={({ pressed }) => [
                  s.quickActionChipCompact,
                  {
                    backgroundColor: isActive ? action.activeColor + '16' : colors.backgroundSecondary,
                    borderColor: isActive ? action.activeColor + '66' : colors.borderLight,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <Ionicons name={action.icon} size={14} color={chipColor} />
                <Text style={[s.quickActionText, { color: chipColor }]}>{action.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

    </View>
  );
}
