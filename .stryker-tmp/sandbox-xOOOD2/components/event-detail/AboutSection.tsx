// @ts-nocheck
import { View, Text } from 'react-native';
import { TextStyles } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { getStyles } from './styles';

interface AboutSectionProps {
  description?: string | null;
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof getStyles>;
}

export function AboutSection({ description, colors, s }: AboutSectionProps) {
  return (
    <View style={s.section}>
      <Text style={TextStyles.badgeCaps}>About</Text>
      <Text style={[TextStyles.body, { color: colors.textSecondary, lineHeight: 26, marginTop: 8 }]}>
        {description?.trim() || 'More details for this event will be announced soon.'}
      </Text>
    </View>
  );
}
