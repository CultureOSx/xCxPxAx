import { memo } from 'react';
import { useColors } from '@/hooks/useColors';
import { View, Text } from 'react-native';
import { formatNumber, getStyles } from '../_styles';

export const StatItem = memo(({ value, label }: { value: number; label: string }) => {
  const colors = useColors();
  const styles = getStyles(colors);
  return (
    <View style={styles.statItem}>
      <Text style={styles.statNum}>{formatNumber(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
});
StatItem.displayName = 'StatItem';
export default StatItem;
