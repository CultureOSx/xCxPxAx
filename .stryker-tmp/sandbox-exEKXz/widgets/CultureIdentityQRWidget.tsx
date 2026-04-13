// @ts-nocheck
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

export type CultureIdentityQRWidgetProps = {
  displayName: string;
  culturePassId: string;
};

const CultureIdentityQRLayout = (props: CultureIdentityQRWidgetProps) => {
  'widget';

  return (
    <VStack
      spacing={8}
      modifiers={[
        padding({ all: 12 }),
        background(CultureTokens.indigo),
        cornerRadius(16),
      ]}
    >
      <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundColor(CultureTokens.gold)]}>
        CULTURE ID
      </Text>
      <Text modifiers={[font({ size: 13, weight: 'bold' }), lineLimit(1), foregroundColor('white')]}>
        {props.displayName}
      </Text>
      <Text modifiers={[font({ size: 12 }), lineLimit(1), foregroundColor(CultureTokens.teal)]}>
        {props.culturePassId}
      </Text>
      <Text modifiers={[font({ size: 11 }), lineLimit(1), foregroundColor('white')]}>
        Open app for QR scan
      </Text>
    </VStack>
  );
};

const CultureIdentityQRWidget = createWidget<CultureIdentityQRWidgetProps>(
  'CultureIdentityQRWidget',
  CultureIdentityQRLayout
);

export default CultureIdentityQRWidget;
