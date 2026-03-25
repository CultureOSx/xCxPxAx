import { HStack, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  cornerRadius,
  font,
  foregroundColor,
  lineLimit,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';
import { CultureTokens } from '@/constants/theme';

export type CultureLiveEventTrackerProps = {
  title: string;
  status: 'countdown' | 'entry_open' | 'checked_in';
  startsAt: string;
  gate?: string;
};

const statusLabel = (status: CultureLiveEventTrackerProps['status']) => {
  if (status === 'entry_open') return 'Entry Open';
  if (status === 'checked_in') return 'Checked In';
  return 'Starts Soon';
};

const CultureLiveEventTrackerLayout = (props: CultureLiveEventTrackerProps) => {
  'widget';

  const status = statusLabel(props.status);

  return {
    banner: (
      <VStack
        spacing={6}
        modifiers={[
          padding({ all: 12 }),
          background('black'),
          cornerRadius(16),
        ]}
      >
        <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundColor(CultureTokens.gold)]}>
          LIVE EVENT
        </Text>
        <Text modifiers={[font({ size: 15, weight: 'bold' }), lineLimit(1), foregroundColor('white')]}>
          {props.title}
        </Text>
        <HStack spacing={8}>
          <Text modifiers={[font({ size: 12 }), foregroundColor(CultureTokens.teal)]}>
            {status}
          </Text>
          <Text modifiers={[font({ size: 12 }), foregroundColor('white')]}>
            {props.startsAt}
          </Text>
          {props.gate ? (
            <Text modifiers={[font({ size: 12 }), foregroundColor(CultureTokens.gold)]}>
              Gate {props.gate}
            </Text>
          ) : null}
        </HStack>
      </VStack>
    ),
    compactLeading: (
      <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundColor(CultureTokens.gold)]}>
        CP
      </Text>
    ),
    compactTrailing: (
      <Text modifiers={[font({ size: 11 }), lineLimit(1), foregroundColor(CultureTokens.gold)]}>
        {status}
      </Text>
    ),
    minimal: (
      <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundColor(CultureTokens.gold)]}>
        CP
      </Text>
    ),
  };
};

const CultureLiveEventTracker = createLiveActivity<CultureLiveEventTrackerProps>(
  'WidgetLiveActivity',
  CultureLiveEventTrackerLayout
);

export default CultureLiveEventTracker;
