import React from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/Button';
import type { EventData } from '@/shared/schema';
import type { ColorTheme } from '@/constants/colors';

interface PrimaryActionSectionProps {
  event: EventData;
  saved: boolean;
  isFreeOrOpen: boolean;
  myRsvp: 'going' | 'maybe' | 'not_going' | null;
  userId: string | null;
  pathname: string;
  rsvpMutation: { isPending: boolean };
  handlePrimaryGoingPress: () => void;
  handleRsvp: (status: 'going' | 'maybe' | 'not_going') => void;
  handleExternalTicketPress?: () => void;
  openTicketModal?: () => void;
  handleShare: () => void;
  handleSave: () => void;
  colors: ColorTheme;
  s: Record<string, unknown>;
}

export function PrimaryActionSection({
  isFreeOrOpen,
  handlePrimaryGoingPress,
  openTicketModal,
  rsvpMutation,
}: PrimaryActionSectionProps) {
  return (
    <View style={{ gap: 12, paddingVertical: 8 }}>
      <Button
        variant="gold"
        size="lg"
        fullWidth
        haptic
        loading={rsvpMutation.isPending}
        onPress={isFreeOrOpen ? handlePrimaryGoingPress : (openTicketModal ?? handlePrimaryGoingPress)}
        accessibilityLabel={isFreeOrOpen ? "I'm Going" : 'Get Tickets'}
      >
        {isFreeOrOpen ? "I'm Going" : 'Get Tickets'}
      </Button>
    </View>
  );
}
