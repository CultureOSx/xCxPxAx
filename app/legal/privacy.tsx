import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, LayoutRules } from '@/constants/theme';
import { goBackOrReplace } from '@/lib/navigation';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { EMAIL_PRIVACY } from '@/lib/app-meta';

const SECTIONS = [
  { title: '1. Information We Collect', body: 'We collect information you provide directly, including: full name, email address, location preferences, and user profile details. When you purchase tickets, payment information is collected securely by our payment processor (Stripe) and is not stored on our servers. We also automatically collect log data, device information, and interaction metrics to improve your experience.' },
  { title: '2. How We Use Information', body: 'We use your data to:\n\n• Provide, maintain, and improve the CulturePass platform.\n• Facilitate event ticketing and community features.\n• Personalise content, event recommendations, and perks.\n• Communicate with you about your account, transactions, and platform updates.\n• Monitor platform security and prevent fraudulent activities.' },
  { title: '3. Information Sharing', body: 'We do not sell your personal data. We may share information with:\n\n• Event Organisers: For ticketing, attendance management, and support (limited to necessary details).\n• Service Providers: Companies that assist with payment processing, hosting (Firebase), and analytics.\n• Legal Authorities: When required by law or to protect our legal rights.' },
  { title: '4. Data Storage & Security', body: 'We use industry-standard security measures, including encryption in transit and at rest, to protect your data. Your information is securely stored on Firebase servers. While we strive to protect your personal information, no method of transmission over the internet or electronic storage is completely secure.' },
  { title: '5. Your Data Rights', body: 'You have the right to:\n\n• Access the personal data we hold about you.\n• Request correction of inaccurate information.\n• Delete your account and associated data completely.\n• Opt-out of marketing communications at any time.\n\nTo manage your data or request deletion, please use the settings in the app or contact our support team.' },
  { title: '6. Children\'s Privacy', body: 'CulturePass is strictly intended for users who are 16 years of age or older. We do not knowingly collect personal data from anyone under 16. If we become aware that we have collected information from a minor without parental consent, we will take steps to securely delete that information immediately.' },
  { title: '7. Updates to This Policy', body: 'We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the new policy in the app and updating the "Last updated" date.' },
  { title: '8. Contact Information', body: `If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:\n\nEmail: ${EMAIL_PRIVACY}\nAddress: CulturePass Pty Ltd, Sydney NSW 2000, Australia` },
];

export default function PrivacyScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={legalAmbient.mesh}
        pointerEvents="none"
      />
      <LiquidGlassPanel
        borderRadius={0}
        bordered={false}
        style={{
          borderBottomWidth: StyleSheet.hairlineWidth * 2,
          borderBottomColor: colors.borderLight,
        }}
        contentStyle={styles.headerGlassInner}
      >
        <Pressable
          onPress={() => goBackOrReplace('/settings')}
          style={styles.headerBackBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </LiquidGlassPanel>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 + (Platform.OS === 'web' ? 34 : insets.bottom), paddingTop: 10 }} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={28} color={CultureTokens.success} />
          </View>
          <Text style={styles.introTitle}>Privacy Policy</Text>
          <Text style={styles.introDate}>Last updated: March 2026</Text>
          <Text style={styles.introPara}>Welcome to CulturePass. We are committed to protecting your personal information and your right to privacy. This policy outlines how we handle your data.</Text>
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

const legalAmbient = StyleSheet.create({
  mesh: { ...StyleSheet.absoluteFillObject, opacity: 0.07 },
});

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:    { flex: 1 },
  headerGlassInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LayoutRules.screenHorizontalPadding,
    paddingVertical: LayoutRules.iconTextGap,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: LayoutRules.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle:  { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  intro:        { marginHorizontal: 20, marginBottom: 24, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface, alignItems: 'center' },
  iconWrap:     { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: CultureTokens.success + '15' },
  introTitle:   { fontSize: 20, fontFamily: 'Poppins_700Bold', marginBottom: 4, color: colors.text },
  introDate:    { fontSize: 12, fontFamily: 'Poppins_500Medium', marginBottom: 14, color: CultureTokens.indigo },
  introPara:    { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, color: colors.textSecondary },
  section:      { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 8, color: colors.text, letterSpacing: 0.3 },
  sectionBody:  { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 24, color: colors.textSecondary },
});
