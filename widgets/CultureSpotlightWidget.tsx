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

export type CultureSpotlightWidgetProps = {
  title: string;
  subtitle?: string;
  city?: string;
  startsAt?: string;
};

const CultureSpotlightLayout = (props: CultureSpotlightWidgetProps) => {
  'widget';

  return (
    <VStack
      spacing={6}
      modifiers={[
        padding({ all: 12 }),
        background(CultureTokens.indigo),
        cornerRadius(16),
      ]}
    >
      <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundColor(CultureTokens.gold)]}>
        SPOTLIGHT
      </Text>
      <Text modifiers={[font({ size: 15, weight: 'bold' }), lineLimit(2), foregroundColor('white')]}>
        {props.title}
      </Text>
      <Text modifiers={[font({ size: 12 }), lineLimit(1), foregroundColor('white')]}>
        {props.subtitle ?? 'Featured cultural event'}
      </Text>
      <Text modifiers={[font({ size: 11 }), lineLimit(1), foregroundColor(CultureTokens.gold)]}>
        {[props.city, props.startsAt].filter(Boolean).join(' • ')}
      </Text>
    </VStack>
  );
};

const CultureSpotlightWidget = createWidget<CultureSpotlightWidgetProps>(
  'CultureSpotlightWidget',
  CultureSpotlightLayout
);

export default CultureSpotlightWidget;
