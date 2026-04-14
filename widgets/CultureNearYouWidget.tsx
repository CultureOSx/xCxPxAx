import { HStack, Text, VStack } from '@expo/ui/swift-ui';
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

export type CultureNearYouWidgetEvent = {
  title: string;
  startsAt: string;
};

export type CultureNearYouWidgetProps = {
  locationLabel: string;
  events: CultureNearYouWidgetEvent[];
};

const CultureNearYouLayout = (props: CultureNearYouWidgetProps) => {
  'widget';

  return (
    <VStack
      spacing={6}
      modifiers={[
        padding({ all: 12 }),
        background('black'),
        cornerRadius(16),
      ]}
    >
      <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundColor(CultureTokens.gold)]}>
        CULTURE NEAR YOU
      </Text>
      <Text modifiers={[font({ size: 12 }), lineLimit(1), foregroundColor('white')]}>
        {props.locationLabel}
      </Text>
      {props.events.slice(0, 3).map((event, index) => (
        <HStack key={`${event.title}-${index}`} spacing={6}>
          <Text modifiers={[font({ size: 12 }), foregroundColor(CultureTokens.teal)]}>
            •
          </Text>
          <VStack spacing={1}>
            <Text modifiers={[font({ size: 12, weight: 'semibold' }), lineLimit(1), foregroundColor('white')]}>
              {event.title}
            </Text>
            <Text modifiers={[font({ size: 11 }), lineLimit(1), foregroundColor('gray')]}>
              {event.startsAt}
            </Text>
          </VStack>
        </HStack>
      ))}
      {props.events.length === 0 ? (
        <Text modifiers={[font({ size: 12 }), foregroundColor('gray')]}>
          No upcoming events.
        </Text>
      ) : null}
    </VStack>
  );
};

const CultureNearYouWidget = createWidget<CultureNearYouWidgetProps>(
  'CultureNearYouWidget',
  CultureNearYouLayout
);

export default CultureNearYouWidget;
