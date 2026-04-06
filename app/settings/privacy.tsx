import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Switch, Alert, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import { CultureTokens, gradients } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { goBackOrReplace } from '@/lib/navigation';

const PRIVACY_SETTINGS = [
  { key: 'profileVisibility', title: 'Profile Visibility', description: 'Your profile is public and visible to all users. Disable to make it private.',              icon: 'eye-outline'       as const, color: CultureTokens.teal },
  { key: 'dataSharing',       title: 'Data Sharing',       description: 'Allow CulturePass to use anonymised usage data to improve the platform.',                  icon: 'analytics-outline' as const, color: CultureTokens.indigo },
  { key: 'activityStatus',    title: 'Activity Status',    description: 'Show other users when you are online or recently active.',                                  icon: 'pulse-outline'     as const, color: CultureTokens.gold },
  { key: 'showLocation',      title: 'Show Location',      description: 'Display your city and country on your public profile.',                                    icon: 'location-outline'  as const, color: CultureTokens.coral },
];

interface PrivacySettings {
  profileVisibility: boolean;
  dataSharing: boolean;
  activityStatus: boolean;
  showLocation: boolean;
}

export default function PrivacySettingsScreen() {
  const colors = useColors();
  const s = getStyles(colors);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/privacy/settings', userId],
    enabled: !!userId,
    queryFn: (): Promise<PrivacySettings> => api.privacy.get() as Promise<PrivacySettings>,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<PrivacySettings>) => api.privacy.update(updates),
    onSuccess: (data) => { queryClient.setQueryData(['/api/privacy/settings', userId], data); },
  });

  const deleteMutation = useMutation({
    mutationFn: (_password: string) => api.account.delete(),
    onSuccess: () => { logout(); router.replace('/(onboarding)'); },
    onError: (e: Error) => { setDeleteError(e.message); },
  });

  const toggleSetting = (key: string) => {
    if (!settings) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = !settings[key as keyof PrivacySettings];
    updateMutation.mutate({ [key]: newValue });
    queryClient.setQueryData(['/api/privacy/settings', userId], { ...settings, [key]: newValue });
  };

  const handleDeleteAccount = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Account',
      'This is permanent and cannot be undone. All your data, tickets, and wallet balance will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: () => { setDeletePassword(''); setDeleteError(''); setShowDeleteConfirm(true); } },
      ]
    );
  };

  const handleConfirmDelete = () => {
    if (!deletePassword.trim()) { setDeleteError('Please enter your password to confirm.'); return; }
    deleteMutation.mutate(deletePassword);
  };

  const current: PrivacySettings = settings ?? { profileVisibility: true, dataSharing: false, activityStatus: true, showLocation: true };

  return (
    <View style={[s.container, { paddingTop: topInset }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={privacyAmbient.mesh}
        pointerEvents="none"
      />
      <LiquidGlassPanel
        borderRadius={0}
        bordered={false}
        style={{
          borderBottomWidth: StyleSheet.hairlineWidth * 2,
          borderBottomColor: colors.borderLight,
        }}
        contentStyle={s.headerInner}
      >
        <Pressable
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => goBackOrReplace('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 34 }} />
      </LiquidGlassPanel>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + (Platform.OS === 'web' ? 34 : insets.bottom), paddingTop: 16 }}>
        {/* Toggles */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Privacy</Text>
          <LiquidGlassPanel borderRadius={20} contentStyle={{ padding: 0 }}>
            {isLoading ? (
              <ActivityIndicator color={CultureTokens.indigo} style={{ marginVertical: 20 }} />
            ) : (
              PRIVACY_SETTINGS.map((item, i) => (
                <View key={item.key}>
                  <View style={s.settingRow}>
                    <View style={[s.settingIcon, { backgroundColor: item.color + '18' }]}>
                      <Ionicons name={item.icon} size={18} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.settingLabel}>{item.title}</Text>
                      <Text style={s.settingDesc}>{item.description}</Text>
                    </View>
                    <Switch
                      value={current[item.key as keyof PrivacySettings]}
                      onValueChange={() => toggleSetting(item.key)}
                      trackColor={{ false: colors.border, true: CultureTokens.indigo + '80' }}
                      thumbColor={current[item.key as keyof PrivacySettings] ? CultureTokens.indigo : colors.surface}
                    />
                  </View>
                  {item.key === 'profileVisibility' && (
                    <View style={[s.statusBadge]}>
                      <View style={[s.statusDot, { backgroundColor: current.profileVisibility ? colors.success : colors.textSecondary }]} />
                      <Text style={s.statusText}>{current.profileVisibility ? 'Public' : 'Private'}</Text>
                    </View>
                  )}
                  {i < PRIVACY_SETTINGS.length - 1 && <View style={s.divider} />}
                </View>
              ))
            )}
          </LiquidGlassPanel>
        </View>

        {/* Danger zone */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: CultureTokens.coral + 'CC' }]}>Danger Zone</Text>
          {showDeleteConfirm ? (
            <View style={s.deleteConfirmCard}>
              <Text style={s.deleteConfirmTitle}>Confirm Account Deletion</Text>
              <Text style={s.deleteConfirmDesc}>
                Enter your password to permanently delete your account. This cannot be undone.
              </Text>
              <TextInput
                style={[s.passwordInput, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                value={deletePassword}
                onChangeText={(v) => { setDeletePassword(v); setDeleteError(''); }}
                autoCapitalize="none"
              />
              {deleteError ? <Text style={s.deleteError}>{deleteError}</Text> : null}
              <View style={s.deleteConfirmRow}>
                <Pressable
                  style={[s.cancelBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                  onPress={() => setShowDeleteConfirm(false)}
                  accessibilityRole="button"
                >
                  <Text style={[s.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[s.deleteConfirmBtn, deleteMutation.isPending && { opacity: 0.6 }]}
                  onPress={handleConfirmDelete}
                  disabled={deleteMutation.isPending}
                  accessibilityRole="button"
                >
                  {deleteMutation.isPending
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.deleteConfirmBtnText}>Delete Forever</Text>
                  }
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [s.deleteBtn, pressed && { opacity: 0.8 }]}
              onPress={handleDeleteAccount}
              accessibilityRole="button"
              accessibilityLabel="Delete account"
            >
              <Ionicons name="trash-outline" size={16} color={CultureTokens.coral} />
              <Text style={s.deleteBtnText}>Delete Account</Text>
            </Pressable>
          )}
          <Text style={s.dangerNote}>
            Permanently deletes your account, tickets, wallet balance, and community memberships.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const privacyAmbient = StyleSheet.create({
  mesh: { ...StyleSheet.absoluteFillObject, opacity: 0.07 },
});

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  headerInner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:      { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  headerTitle:  { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.text },

  section:      { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginLeft: 4, color: colors.textTertiary },
  settingRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 18, gap: 14 },
  settingIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  settingDesc:  { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2, lineHeight: 18, color: colors.textTertiary, width: '90%' },
  divider:      { height: 1, marginLeft: 74, backgroundColor: colors.borderLight, opacity: 0.5 },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 74, marginBottom: 14, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },
  statusText:   { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },

  deleteBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: CultureTokens.coral + '30', backgroundColor: CultureTokens.coral + '08' },
  deleteBtnText:{ fontSize: 14, fontFamily: 'Poppins_700Bold', color: CultureTokens.coral },
  dangerNote:   { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 12, lineHeight: 18, color: colors.textTertiary, textAlign: 'center', paddingHorizontal: 10 },

  deleteConfirmCard:     { 
    borderRadius: 20, padding: 20, borderWidth: 1, backgroundColor: colors.surface, borderColor: CultureTokens.coral + '40' ,
    ...Platform.select({
      web: { boxShadow: '0px 8px 32px rgba(255, 94, 91, 0.12)' },
      default: { shadowColor: CultureTokens.coral, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 4 },
    }),
  },
  deleteConfirmTitle:    { fontSize: 17, fontFamily: 'Poppins_700Bold', marginBottom: 8, color: CultureTokens.coral },
  deleteConfirmDesc:     { fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 16, lineHeight: 20, color: colors.textSecondary },
  passwordInput:         { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Poppins_400Regular', borderWidth: 1, marginBottom: 12 },
  deleteError:           { fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginBottom: 10, color: CultureTokens.coral },
  deleteConfirmRow:      { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn:             { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, borderWidth: 1 },
  cancelBtnText:         { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  deleteConfirmBtn:      { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, backgroundColor: CultureTokens.coral },
  deleteConfirmBtnText:  { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#fff' },
});
