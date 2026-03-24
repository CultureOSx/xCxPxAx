import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useIsDark } from '@/hooks/useColors';
import { TextStyles } from '@/constants/typography';
import { CultureTokens } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';

export default function LocationPickerScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const s = getStyles(colors);
  const isDark = useIsDark();
  const { userId } = useAuth();

  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Australia');
  const [indigenousLand, setIndigenousLand] = useState<{name: string} | null>(null);
  const [loadingLand, setLoadingLand] = useState(false);

  // Auto-fetch indigenous land when city changes (debounce could be added, but simple for now)
  useEffect(() => {
    if (city.trim().length > 2) {
      const fetchLand = async () => {
        setLoadingLand(true);
        try {
          // Attempting to resolve traditional lands using backend API
          const res = await api.culture.indigenousTraditionalLands(city);
          if (res && res.length > 0) {
            setIndigenousLand(res[0]);
          } else {
            // Mock fallback logic based on explicit rule (e.g., Gadigal Lands if Sydney)
            if (city.toLowerCase() === 'sydney') {
              setIndigenousLand({ name: 'Gadigal Land' });
            } else if (city.toLowerCase() === 'melbourne') {
              setIndigenousLand({ name: 'Wurundjeri Land' });
            } else if (city.toLowerCase() === 'brisbane') {
              setIndigenousLand({ name: 'Turrbal and Yuggera Land' });
            } else {
              setIndigenousLand(null);
            }
          }
        } catch {
          setIndigenousLand(null);
        } finally {
          setLoadingLand(false);
        }
      };
      const debounce = setTimeout(fetchLand, 800);
      return () => clearTimeout(debounce);
    } else {
      setIndigenousLand(null);
    }
  }, [city]);

  const updateLocationMutation = useMutation({
    mutationFn: async () => {
      if (userId) {
        await api.users.update(userId, { city, country });
      }
      // Actually we just proceed to next step even if unauthenticated (guest flow)
    },
    onSuccess: () => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/onboarding/cultures');
    }
  });

  const handleNext = () => {
    if (!city.trim()) return;
    updateLocationMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[s.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]} bounces={false}>
        <View style={s.header}>
          <View style={s.iconWrap}>
            <Ionicons name="location" size={32} color={CultureTokens.coral} />
          </View>
          <Text style={[TextStyles.headline, { color: colors.text, fontSize: 28, marginTop: 24, textAlign: 'center' }]}>
            Where are you located?
          </Text>
          <Text style={[TextStyles.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: 12 }]}>
            We'll use this to find cultural events, communities, and experiences nearby.
          </Text>
        </View>

        <View style={s.form}>
          <Text style={s.label}>City or Suburb</Text>
          <TextInput
            style={[s.input, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.surface }]}
            placeholder="e.g. Sydney"
            placeholderTextColor={colors.textTertiary}
            value={city}
            onChangeText={setCity}
            autoFocus
          />

          <Text style={[s.label, { marginTop: 20 }]}>Country</Text>
          <TextInput
            style={[s.input, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.surface }]}
            value={country}
            onChangeText={setCountry}
            editable={false}
          />
        </View>

        {loadingLand ? (
          <View style={s.landBannerEmpty}>
            <ActivityIndicator size="small" color={CultureTokens.coral} />
          </View>
        ) : indigenousLand ? (
          <View style={s.landBanner}>
            <Ionicons name="leaf" size={20} color={CultureTokens.saffron} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.landTitle}>Indigenous Acknowledgment</Text>
              <Text style={s.landText}>
                You are on the traditional lands of the <Text style={{ fontFamily: 'Poppins_700Bold' }}>{indigenousLand.name}</Text>. 
                CulturePass honours their enduring connection to this land.
              </Text>
            </View>
          </View>
        ) : <View style={s.landBannerEmpty} />}

        <View style={s.footer}>
          <Button
            variant="gradient"
            size="lg"
            fullWidth
            onPress={handleNext}
            disabled={city.trim().length < 2 || updateLocationMutation.isPending}
            loading={updateLocationMutation.isPending}
            rightIcon="arrow-forward"
          >
            Continue
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrap: {
    width: 64, height: 64,
    borderRadius: 20,
    backgroundColor: CultureTokens.coral + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CultureTokens.coral + '30'
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
  },
  landBannerEmpty: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center'
  },
  landBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,140,66,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,140,66,0.3)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 20,
  },
  landTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: CultureTokens.saffron,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  landText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
  }
});
