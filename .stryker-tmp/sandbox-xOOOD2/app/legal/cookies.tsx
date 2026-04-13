// @ts-nocheck
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, LayoutRules } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { EMAIL_PRIVACY } from '@/lib/app-meta';

const COOKIE_TYPES = [
  { name: 'Essential Cookies',   desc: 'Required for the app to function. They enable core features like secure login, session management, and payment processing. These cannot be disabled.',                                                           icon: 'lock-closed' as const, color: CultureTokens.coral, required: true },
  { name: 'Analytics Cookies',   desc: 'Help us understand how users interact with CulturePass. We use anonymised analytics to improve the user experience, identify popular features, and fix issues.',                                                 icon: 'analytics' as const,   color: CultureTokens.indigo, required: false },
  { name: 'Preference Cookies',  desc: 'Remember your settings such as language preference, selected location, theme, and notification preferences. These make your experience more personalised.',                                                      icon: 'settings' as const,    color: CultureTokens.teal, required: false },
  { name: 'Marketing Cookies',   desc: 'Used to deliver relevant event recommendations and sponsor offers based on your interests and browsing behaviour. You can opt out of these at any time.',                                                        icon: 'megaphone' as const,   color: CultureTokens.gold, required: false },
];

const SECTIONS = [
  { title: '1. What Are Cookies & Local Storage?', body: 'Cookies are small text files stored on your device when you use a website. CulturePass also uses local storage (AsyncStorage on mobile) to save your preferences and session data. On mobile devices, we use equivalent technologies to cookies for the same purposes.' },
  { title: '2. How We Use Data', body: 'We use cookies and local storage to:\n\n• Keep you signed in securely\n• Remember your location and community preferences\n• Store your onboarding progress\n• Save your event bookmarks and joined communities\n• Analyse app performance and usage patterns\n• Personalise event recommendations\n• Deliver relevant sponsor content and perks' },
  { title: '3. Third-Party Data Collection', body: 'Some of our partners may collect data through their own cookies when you interact with their content on CulturePass:\n\n• Payment processors (Stripe) for secure transactions\n• Analytics providers for usage insights\n• Event organisers for ticket delivery\n\nThese third parties have their own privacy policies governing their data collection.' },
  { title: '4. Managing Your Preferences', body: `You can manage your data preferences through:\n\n• In-app settings: Profile > Notifications to control marketing communications\n• Device settings: Clear app data or cache through your device settings\n• Browser settings: For web users, manage cookies through your browser preferences\n• Contact us: Email ${EMAIL_PRIVACY} to request data deletion` },
  { title: '5. Data Retention for Cookies', body: 'Essential cookies: Expire when your session ends or after 30 days of inactivity\nAnalytics data: Retained for 26 months in anonymised form\nPreference cookies: Stored until you clear them or delete your account\nMarketing cookies: Expire after 12 months or when you opt out' },
  { title: '6. Compliance', body: 'This Data & Cookie Policy complies with:\n\n• Australian Privacy Act 1988\n• EU/UK General Data Protection Regulation (GDPR)\n• Canadian PIPEDA\n• UAE Federal Decree Law No. 45 of 2021\n• New Zealand Privacy Act 2020\n\nWe regularly review and update our practices to ensure ongoing compliance.' },
  { title: '7. Updates to This Policy', body: 'We may update this policy as our services evolve. Material changes will be communicated via in-app notifications or email. The "Last updated" date at the top indicates when the policy was last revised.' },
  { title: '8. Contact', body: `For questions about our data practices:\n\nData Protection Officer\nCulturePass Pty Ltd\nEmail: ${EMAIL_PRIVACY}\nPhone: 1800-CULTURE (1800 285 887)\nAddress: Level 10, 100 Market Street, Sydney NSW 2000, Australia` },
];

export default function CookiesScreen() {
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
        <View style={{ width: 40 }} />
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Data & Cookie Policy
        </Text>
        <View style={{ width: 40 }} />
      </LiquidGlassPanel>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 + (Platform.OS === 'web' ? 34 : insets.bottom), paddingTop: 10 }} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={styles.iconWrap}>
            <Ionicons name="finger-print" size={28} color={CultureTokens.gold} />
          </View>
          <Text style={styles.introTitle}>Data & Cookie Policy</Text>
          <Text style={styles.introDate}>Last updated: 1 February 2026</Text>
          <Text style={styles.introPara}>This policy explains how CulturePass uses cookies, local storage, and similar technologies to provide and improve our services.</Text>
        </View>

        <View style={styles.cookieSection}>
          <Text style={styles.cookieSectionTitle}>Types of Data We Collect</Text>
          {COOKIE_TYPES.map((ct, i) => {
            return (
            <View key={i} style={styles.cookieCard}>
              <View style={styles.cookieHeader}>
                <View style={[styles.cookieIcon, { backgroundColor: ct.color + '15' }]}>
                  <Ionicons name={ct.icon as keyof typeof Ionicons.glyphMap} size={20} color={ct.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cookieName}>{ct.name}</Text>
                  {ct.required && <View style={[styles.requiredBadge, { backgroundColor: CultureTokens.coral + '15' }]}><Text style={[styles.requiredText, { color: CultureTokens.coral }]}>Required</Text></View>}
                </View>
              </View>
              <Text style={styles.cookieDesc}>{ct.desc}</Text>
            </View>
            );
          })}
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
  headerTitle:  {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  intro:        { marginHorizontal: 20, marginBottom: 24, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface, alignItems: 'center' },
  iconWrap:     { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: CultureTokens.gold + '15' },
  introTitle:   { fontSize: 20, fontFamily: 'Poppins_700Bold', marginBottom: 4, color: colors.text },
  introDate:    { fontSize: 12, fontFamily: 'Poppins_500Medium', marginBottom: 14, color: CultureTokens.indigo },
  introPara:    { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, color: colors.textSecondary },
  cookieSection:     { paddingHorizontal: 20, marginBottom: 24 },
  cookieSectionTitle:{ fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 12, color: colors.text, letterSpacing: 0.3 },
  cookieCard:        { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface, marginBottom: 10 },
  cookieHeader:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  cookieIcon:        { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cookieName:        { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  requiredBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  requiredText:      { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  cookieDesc:        { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22, color: colors.textSecondary },
  section:      { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 8, color: colors.text, letterSpacing: 0.3 },
  sectionBody:  { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 24, color: colors.textSecondary },
});
