import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CardTokens, CultureTokens, gradients } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { TextStyles } from '@/constants/typography';

interface WidgetIdentityQRCardProps {
  displayName: string;
  culturePassId: string;
  role?: string;
}

export function WidgetIdentityQRCard({ displayName, culturePassId, role }: WidgetIdentityQRCardProps) {
  const colors = useColors();

  const roleLabel = role === 'business' ? 'BUSINESS CARD' :
                  role === 'organizer' ? 'ORGANIZER CARD' : 
                  'DIGITAL IDENTITY';

  return (
    <Pressable
      style={[styles.card, { borderColor: CultureTokens.indigo + '30' }]}
      onPress={() => router.push('/profile/qr')}
      accessibilityRole="button"
      accessibilityLabel="Open Identity QR Code"
    >
      <LinearGradient
        colors={[CultureTokens.indigo, gradients.primary[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.cardContent}>
        <View style={styles.infoSide}>
          <Text style={[TextStyles.labelSemibold, { color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }]}>
            {roleLabel}
          </Text>
          <Text style={[TextStyles.title3, { color: '#FFFFFF', marginTop: 4 }]} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.idChip}>
             <Ionicons name="finger-print" size={14} color="#FFFFFF" />
             <Text style={[TextStyles.captionSemibold, { color: '#FFFFFF' }]}>
               {culturePassId}
             </Text>
          </View>
        </View>

        <View style={styles.qrSide}>
          <View style={styles.qrContainer}>
            <Ionicons name="qr-code" size={48} color={CultureTokens.indigo} />
          </View>
          <Text style={[TextStyles.badgeCaps, { color: '#FFFFFF', marginTop: 8, fontSize: 8 }]}>
            SCAN TO CONNECT
          </Text>
        </View>
      </View>

      {/* Gloss Effect */}
      <View style={styles.gloss} pointerEvents="none" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    elevation: 4,
    ...Platform.select({ 
      web: { boxShadow: '0px 8px 16px rgba(44, 42, 114, 0.2)' },
      default: { shadowColor: CultureTokens.indigo, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 }
    }),
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoSide: {
    flex: 1,
    justifyContent: 'center',
  },
  idChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  qrSide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    width: 72,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { boxShadow: 'inset 0px 0px 10px rgba(0,0,0,0.1)' } }),
  },
  gloss: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
  }
});
