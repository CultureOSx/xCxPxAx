import { View, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { CardTokens, Spacing } from '@/constants/theme';

export function EventDetailSkeleton() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useLayout();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Skeleton
          width="100%"
          height={isDesktop ? 450 : 380 + topInset}
          borderRadius={isDesktop ? CardTokens.radiusLarge + 12 : 0}
          style={isDesktop ? styles.desktopHero : undefined}
        />
        <View style={styles.contentWrap}>
          <View
            style={[
              styles.primaryCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Skeleton width={120} height={20} borderRadius={10} />
            <Skeleton width="80%" height={32} borderRadius={10} style={styles.innerGap} />
            <Skeleton width="100%" height={16} borderRadius={Spacing.xs} />
          </View>

          <View style={styles.rowCards}>
            <Skeleton width="48%" height={100} borderRadius={CardTokens.radiusLarge} />
            <Skeleton width="48%" height={100} borderRadius={CardTokens.radiusLarge} />
          </View>

          <Skeleton width="100%" height={120} borderRadius={CardTokens.radiusLarge} style={styles.innerGap} />

          <View style={styles.listCards}>
            {[1, 2].map(i => (
              <Skeleton key={i} width="100%" height={80} borderRadius={CardTokens.radiusLarge} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default EventDetailSkeleton;

const styles = StyleSheet.create({
  root: { flex: 1 },
  desktopHero: { margin: CardTokens.paddingLarge, alignSelf: 'center', width: '90%' },
  contentWrap: { padding: CardTokens.paddingLarge, gap: Spacing.md },
  primaryCard: {
    borderRadius: CardTokens.radius,
    padding: CardTokens.paddingLarge,
    marginVertical: Spacing.sm + 2,
    borderWidth: 1,
  },
  innerGap: { marginVertical: Spacing.sm + 4 },
  rowCards: { flexDirection: 'row', gap: Spacing.sm + 4, marginTop: Spacing.sm + 2 },
  listCards: { gap: Spacing.sm + 4, marginTop: CardTokens.paddingLarge },
});
