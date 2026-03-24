import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useIsDark } from '@/hooks/useColors';
import { TextStyles } from '@/constants/typography';
import { CultureTokens } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

const POPULAR_CULTURES = [
  'Indigenous Australian',
  'Chinese',
  'Indian',
  'Greek',
  'Italian',
  'Lebanese',
  'Vietnamese',
  'Filipino',
  'British',
  'Korean',
  'Maori',
  'Nigerian',
  'Japanese',
  'Polynesian',
  'Latin American',
  'Thai',
  'Tamil',
  'Irish',
  'Sudanese',
  'Indonesian',
];

export default function CultureMatchScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const s = getStyles(colors);
  const isDark = useIsDark();
  const { userId } = useAuth();

  const [selectedCultures, setSelectedCultures] = useState<string[]>([]);

  const toggleCulture = (culture: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    
    if (selectedCultures.includes(culture)) {
      setSelectedCultures(prev => prev.filter(c => c !== culture));
    } else {
      setSelectedCultures(prev => [...prev, culture]);
    }
  };

  const updateCultureMutation = useMutation({
    mutationFn: async () => {
      if (userId && selectedCultures.length > 0) {
        await api.users.update(userId, { culturalIdentity: { cultureIds: selectedCultures } });
      }
    },
    onSuccess: () => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // After cultures, redirect to home structure
      router.replace('/(tabs)');
    }
  });

  const handleFinish = () => {
    updateCultureMutation.mutate();
  };

  return (
    <View style={[s.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}>
      <View style={s.header}>
        <View style={s.iconWrap}>
          <Ionicons name="earth" size={32} color={CultureTokens.indigo} />
        </View>
        <Text style={[TextStyles.headline, { color: colors.text, fontSize: 26, marginTop: 24, textAlign: 'center' }]}>
          Which cultures do you connect with?
        </Text>
        <Text style={[TextStyles.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: 12, paddingHorizontal: 20 }]}>
          Select your heritage, languages spoken, or cultures you're passionate about. 
          We'll personalise your feed to match.
        </Text>
      </View>

      <ScrollView contentContainerStyle={s.chipContainer} bounces={false}>
        {POPULAR_CULTURES.map((culture) => {
          const isSelected = selectedCultures.includes(culture);
          return (
            <Pressable
              key={culture}
              onPress={() => toggleCulture(culture)}
              style={[
                s.chip,
                { backgroundColor: colors.surface, borderColor: colors.borderLight },
                isSelected && s.chipSelected,
              ]}
            >
              {isSelected && <Ionicons name="checkmark" size={16} color="white" style={{ marginRight: 6 }} />}
              <Text style={[
                s.chipText,
                { color: colors.text },
                isSelected && { color: 'white' }
              ]}>
                {culture}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={s.footer}>
        <Button
          variant="ghost"
          size="md"
          onPress={handleFinish}
          style={{ marginBottom: 16 }}
        >
          <Text style={{ color: colors.textSecondary, fontFamily: 'Poppins_500Medium' }}>Skip for now</Text>
        </Button>
        <Button
          variant="gradient"
          size="lg"
          fullWidth
          onPress={handleFinish}
          loading={updateCultureMutation.isPending}
          disabled={selectedCultures.length === 0 || updateCultureMutation.isPending}
          rightIcon="checkmark-circle"
        >
          Got it
        </Button>
      </View>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 64, height: 64,
    borderRadius: 20,
    backgroundColor: CultureTokens.indigo + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CultureTokens.indigo + '30'
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 24,
    justifyContent: 'center'
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: CultureTokens.indigo,
    borderColor: CultureTokens.indigo,
  },
  chipText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 24,
    paddingTop: 20,
  }
});
