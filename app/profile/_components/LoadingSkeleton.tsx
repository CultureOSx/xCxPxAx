import { useColors } from '@/hooks/useColors';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Skeleton } from '@/components/ui/Skeleton';
import { gradients } from '@/constants/theme';

export function LoadingSkeleton({ topInset }: { topInset: number }) {
  const colors = useColors();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.midnight as unknown as [string, string]}
        style={[styles.hero, { paddingTop: topInset + 40 }]}
      >
        <Skeleton width={110} height={110} borderRadius={55} style={styles.avatar} />
        <Skeleton width={180} height={28} borderRadius={8} style={styles.name} />
        <Skeleton width={120} height={16} borderRadius={4} />
        
        <View style={styles.statsRow}>
          <Skeleton width={60} height={32} borderRadius={6} />
          <Skeleton width={60} height={32} borderRadius={6} />
          <Skeleton width={60} height={32} borderRadius={6} />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.section}>
          <Skeleton width={80} height={20} borderRadius={4} style={styles.sectionTitle} />
          <Skeleton width="100%" height={80} borderRadius={16} />
        </View>
        <View style={styles.section}>
          <Skeleton width={100} height={20} borderRadius={4} style={styles.sectionTitle} />
          <Skeleton width="100%" height={160} borderRadius={16} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { 
    alignItems: 'center', 
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatar: { marginBottom: 16 },
  name: { marginBottom: 8 },
  statsRow: { 
    flexDirection: 'row', 
    gap: 24, 
    marginTop: 32,
    opacity: 0.5,
  },
  body: { padding: 20, gap: 32 },
  section: { gap: 12 },
  sectionTitle: { marginBottom: 4 },
});

export default LoadingSkeleton;
