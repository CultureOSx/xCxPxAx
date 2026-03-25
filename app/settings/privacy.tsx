import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Switch, Alert, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import { CultureTokens } from '@/constants/theme';
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
      {/* Header */}
      <View style={s.header}>
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
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + (Platform.OS === 'web' ? 34 : insets.bottom), paddingTop: 16 }}>
        {/* Toggles */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Privacy</Text>
          <View style={s.sectionCard}>
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
          </View>
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

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  backBtn:      { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  headerTitle:  { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.text },

  section:      { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 2, color: colors.textTertiary },
  sectionCard:  { borderRadius: 12, borderWidth: 1, overflow: 'hidden', backgroundColor: colors.surface, borderColor: colors.borderLight },
  settingRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  settingIcon:  { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  settingDesc:  { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2, lineHeight: 16, color: colors.textTertiary },
  divider:      { height: 1, marginLeft: 62, backgroundColor: colors.borderLight },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 62, marginBottom: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', backgroundColor: colors.backgroundSecondary },
  statusDot:    { width: 6, height: 6, borderRadius: 3 },
  statusText:   { fontSize: 11, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },

  deleteBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 10, paddingVertical: 12, borderWidth: 1, borderColor: CultureTokens.coral + '40', backgroundColor: CultureTokens.coral + '0D' },
  deleteBtnText:{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.coral },
  dangerNote:   { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 10, lineHeight: 18, color: colors.textTertiary },

  deleteConfirmCard:     { borderRadius: 12, padding: 16, borderWidth: 1, backgroundColor: colors.surface, borderColor: CultureTokens.coral + '40' },
  deleteConfirmTitle:    { fontSize: 15, fontFamily: 'Poppins_700Bold', marginBottom: 6, color: CultureTokens.coral },
  deleteConfirmDesc:     { fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 14, lineHeight: 18, color: colors.textSecondary },
  passwordInput:         { borderRadius: 9, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, fontFamily: 'Poppins_400Regular', borderWidth: 1, marginBottom: 8 },
  deleteError:           { fontSize: 12, fontFamily: 'Poppins_500Medium', marginBottom: 8, color: CultureTokens.coral },
  deleteConfirmRow:      { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:             { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingVertical: 11, borderWidth: 1 },
  cancelBtnText:         { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  deleteConfirmBtn:      { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingVertical: 11, backgroundColor: CultureTokens.coral },
  deleteConfirmBtnText:  { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
});
