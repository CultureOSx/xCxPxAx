import { memo } from 'react';
import { useColors } from '@/hooks/useColors';
import { View, Text } from 'react-native';
import { getStyles } from '../_styles';

export const SectionHeader = memo(({ title }: { title: string }) => {
  const colors = useColors();
  const styles = getStyles(colors);
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
});
SectionHeader.displayName = 'SectionHeader';
export default SectionHeader;
