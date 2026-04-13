import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { 
  FadeInDown, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CultureTokens, Spacing, webShadow } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';

interface AdminToolbarProps {
  onDelete: () => void;
  onToggleFeatured: () => void;
  isFeatured: boolean;
  onClose: () => void;
}

/**
 * ToolbarAction — Interactive sub-component with scale feedback and haptics.
 */
function ToolbarAction({ 
  onPress, 
  icon, 
  label, 
  color, 
  isActive = false, 
  activeColor 
}: { 
  onPress: () => void; 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  color: string; 
  isActive?: boolean;
  activeColor?: string;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.92);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable 
        onPress={handlePress} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.actionBtn}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons 
          name={isActive && icon.endsWith('-outline') ? (icon.replace('-outline', '') as any) : icon} 
          size={18} 
          color={isActive ? (activeColor || color) : color} 
        />
        <Text style={[styles.actionText, { color: isActive ? (activeColor || color) : color }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * AdminToolbar — World-class overlay for high-privilege event management.
 * Provides instant access to critical moderation tools from within the detail view.
 * 
 * DESIGN: Solid elevated dark bar
 * ANIMATION: Reanimated 4 Slide-in
 */
export function AdminToolbar({ onDelete, onToggleFeatured, isFeatured, onClose }: AdminToolbarProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { hPad } = useLayout();
  
  // Web remains at the very top (0 inset), Native handles the notch + spacing
  const topInset = Platform.OS === 'web' ? 0 : insets.top + Spacing.sm;

  return (
    <Animated.View 
      entering={FadeInDown.duration(400).springify().damping(15)}
      style={[
        styles.container, 
        { 
          top: topInset,
          marginHorizontal: hPad,
        }
      ]}
    >
      <View style={[styles.blur, { backgroundColor: '#1C1D28' }]}>
        <View style={styles.inner}>
          <View style={styles.labelGroup}>
            <View style={[styles.adminIndicator, { backgroundColor: colors.success }]} />
            <View>
              <Text style={styles.label}>ADMIN MODE</Text>
              <Text style={styles.subLabel}>High privilege session</Text>
            </View>
          </View>
          
          <View style={styles.actions}>
            <ToolbarAction 
              onPress={onToggleFeatured}
              icon="sparkles-outline"
              isActive={isFeatured}
              label={isFeatured ? 'Featured' : 'Feature'}
              color="rgba(255,255,255,0.8)"
              activeColor={CultureTokens.gold}
            />

            <View style={styles.divider} />

            <ToolbarAction 
              onPress={onDelete}
              icon="trash-outline"
              label="Delete"
              color={CultureTokens.coral}
            />

            <View style={styles.divider} />

            <Pressable 
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                onClose();
              }} 
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close admin toolbar"
            >
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.4)" />
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      web: {
        marginTop: 20,
        ...webShadow('0 8px 32px rgba(0,0,0,0.4)'),
      }
    })
  },
  blur: { paddingVertical: 10, paddingHorizontal: 16 },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  labelGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  adminIndicator: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    shadowColor: '#10B981',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 }
  },
  label: { 
    color: '#fff', 
    fontSize: 10, 
    fontFamily: 'Poppins_700Bold', 
    letterSpacing: 1,
    lineHeight: 12
  },
  subLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontFamily: 'Poppins_400Regular',
    marginTop: -2
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 10, 
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  divider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 4 },
  closeBtn: { marginLeft: 8, padding: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)' },
});

