import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import { goBackOrReplace } from '@/lib/navigation';

const SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By downloading, installing, or using the CulturePass application, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.' },
  { title: '2. User Accounts', body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration. You must be at least 16 years old to use the CulturePass platform.' },
  { title: '3. Platform Usage', body: 'CulturePass serves as a cultural discovery platform and ticketing marketplace. We grant you a limited, non-exclusive, non-transferable license to use the app for personal, non-commercial purposes. You agree not to misuse the platform, including engaging in unauthorized scraping, fraud, or violations of our community guidelines.' },
  { title: '4. Ticketing & Payments', body: 'All ticket sales are subject to the specific terms set by the event organisers. CulturePass acts as an intermediary for transactions. Payments are processed securely via third-party providers. Refunds, cancellations, and dispute resolutions are handled in accordance with the event organiser\'s policies and our standard platform guidelines.' },
  { title: '5. Memberships & Perks', body: 'CulturePass may offer exclusive memberships (e.g., CulturePass+) and perks. Subscription fees, billing cycles, and cancellation terms will be presented clearly prior to purchase. CulturePass reserves the right to modify or discontinue specific perks at any time.' },
  { title: '6. User Content', body: 'By posting content (such as reviews or community messages) on CulturePass, you grant us a non-exclusive, royalty-free license to use, reproduce, and display that content. You are solely responsible for the content you post and must ensure it does not violate intellectual property rights or community standards.' },
  { title: '7. Intellectual Property', body: 'All original content, features, branding, and functionality of CulturePass are owned by CulturePass Pty Ltd and are protected by international copyright, trademark, and other intellectual property laws. You may not copy or distribute our intellectual property without written permission.' },
  { title: '8. Limitation of Liability', body: 'To the maximum extent permitted by law, CulturePass shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform, attendance at events, or unauthorized access to your data. Events are organized by third parties, and we do not guarantee the safety, quality, or legality of any event.' },
  { title: '9. Changes to Terms', body: 'We reserve the right to modify these Terms at any time. We will provide notice of significant changes within the app. Your continued use of the platform following such changes constitutes your acceptance of the new Terms.' },
  { title: '10. Governing Law', body: 'These Terms shall be governed by and construed in accordance with the laws of New South Wales, Australia, without regard to its conflict of law provisions.' },
  { title: '11. Contact Us', body: 'If you have any questions about these Terms, please contact us at legal@culturepass.au.' },
];

export default function TermsScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const webTop = 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop }]}>
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrReplace('/settings')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 + (Platform.OS === 'web' ? 34 : insets.bottom), paddingTop: 10 }} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text" size={28} color={CultureTokens.indigo} />
          </View>
          <Text style={styles.introTitle}>Terms of Service</Text>
          <Text style={styles.introDate}>Last updated: March 2026</Text>
          <Text style={styles.introPara}>These terms outline the rules and regulations for the use of the CulturePass platform. By accessing this app, we assume you accept these terms in full.</Text>
        </View>

        {SECTIONS.map((sec, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Text style={styles.sectionBody}>{sec.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  headerTitle:  { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text },
  intro:        { marginHorizontal: 20, marginBottom: 24, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface, alignItems: 'center' },
  iconWrap:     { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: CultureTokens.indigo + '15' },
  introTitle:   { fontSize: 20, fontFamily: 'Poppins_700Bold', marginBottom: 4, color: colors.text },
  introDate:    { fontSize: 12, fontFamily: 'Poppins_500Medium', marginBottom: 14, color: CultureTokens.indigo },
  introPara:    { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, color: colors.textSecondary },
  section:      { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 8, color: colors.text, letterSpacing: 0.3 },
  sectionBody:  { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 24, color: colors.textSecondary },
});
