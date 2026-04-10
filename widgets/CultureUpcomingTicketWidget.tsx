import { Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  cornerRadius,
  font,
  foregroundColor,
  lineLimit,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';
import { CultureTokens } from '@/constants/theme';

export type CultureUpcomingTicketWidgetProps = {
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  venue?: string;
  ticketCode?: string;
  /** Use `empty` when there is no upcoming ticket (clears stale home-screen data). */
  status: string;
};

const CultureUpcomingTicketLayout = (props: CultureUpcomingTicketWidgetProps) => {
  'widget';

  const isEmpty = props.status === 'empty' || !props.eventTitle?.trim();

  return (
    <VStack
      spacing={6}
      modifiers={[
        padding({ all: 12 }),
        background('#0B0B14'),
        cornerRadius(16),
      ]}
    >
      <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundColor(CultureTokens.gold)]}>
        NEXT TICKET
      </Text>
      {isEmpty ? (
        <>
          <Text modifiers={[font({ size: 13, weight: 'semibold' }), lineLimit(2), foregroundColor('white')]}>
            No upcoming events
          </Text>
          <Text modifiers={[font({ size: 11 }), lineLimit(2), foregroundColor('gray')]}>
            Open CulturePass to browse tickets
          </Text>
        </>
      ) : (
        <>
          <Text modifiers={[font({ size: 15, weight: 'bold' }), lineLimit(2), foregroundColor('white')]}>
            {props.eventTitle}
          </Text>
          <Text modifiers={[font({ size: 12 }), lineLimit(2), foregroundColor(CultureTokens.teal)]}>
            {[props.eventDate, props.eventTime].filter(Boolean).join(' · ')}
          </Text>
          <Text modifiers={[font({ size: 11 }), lineLimit(2), foregroundColor('gray')]}>
            {props.venue ?? 'Venue TBA'}
          </Text>
          <Text modifiers={[font({ size: 10, weight: 'semibold' }), lineLimit(1), foregroundColor(CultureTokens.gold)]}>
            {(props.status ?? 'confirmed').toUpperCase()}
          </Text>
        </>
      )}
    </VStack>
  );
};

const CultureUpcomingTicketWidget = createWidget<CultureUpcomingTicketWidgetProps>(
  'CultureUpcomingTicketWidget',
  CultureUpcomingTicketLayout
);

export default CultureUpcomingTicketWidget;
