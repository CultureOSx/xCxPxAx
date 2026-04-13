// @ts-nocheck
import { View, Text, Pressable } from 'react-native';
import { TextStyles, CultureTokens } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/lib/currency';
import { useColors } from '@/hooks/useColors';
import { getStyles } from './styles';
import type { EventData } from '@/shared/schema';

interface TicketTier {
  name: string;
  priceCents: number;
  available: number;
}

interface TicketsSectionProps {
  event: EventData;
  eventTiers: TicketTier[];
  openTicketModal: (tierIdx?: number) => void;
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof getStyles>;
}

export function TicketsSection({ event, eventTiers, openTicketModal, colors, s }: TicketsSectionProps) {
  if (!eventTiers || eventTiers.length === 0) return null;

  return (
    <>
      <View style={s.divider} />
      <View style={s.section}>
        <Text style={TextStyles.badgeCaps}>Tickets</Text>
        {eventTiers.map((tier, idx) => (
          <Pressable
            key={`${tier.name}-${idx}`}
            onPress={() => openTicketModal(idx)}
            style={({ pressed }) => [
              s.tierRowMinimal,
              {
                borderColor: colors.borderLight,
                backgroundColor: colors.backgroundSecondary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Select ${tier.name} ticket`}
          >
            <View style={s.tierLeft}>
              <Text style={[TextStyles.headline, { color: colors.text }]}>{tier.name}</Text>
              <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
                {tier.available} available
              </Text>
            </View>
            <View style={s.tierRight}>
              <Text style={[TextStyles.title3, { color: CultureTokens.gold }]}>
                {tier.priceCents === 0 ? 'Free' : formatCurrency(tier.priceCents, event?.country)}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </View>
          </Pressable>
        ))}
      </View>
    </>
  );
}
