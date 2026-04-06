/**
 * CulturePass Digital ID — Apple Wallet style pass
 *
 * Layout mirrors an Apple Wallet event ticket:
 *   ┌─ Yellow top stripe ──────────────────────────┐
 *   │  Header: logo · CULTUREPASS · tier badge      │  ← blue gradient
 *   │  Primary: avatar + full name (28px bold)      │
 *   │  Secondary fields: tier · since · location    │
 *   │  CPID bar                                     │
 *   ├─ Perforation ─────────────────────────────────┤
 *   │  QR code (white zone)                         │
 *   │  Scan hint                                    │
 *   └─ Footer: verified · member since ─────────────┘
 */

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Share,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { User, Membership } from '@shared/schema';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { CultureTokens , gradients } from '@/constants/theme';
import { Skeleton } from '@/components/ui/Skeleton';
import { AppHeaderBar } from '@/components/AppHeaderBar';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { AuthGuard } from '@/components/AuthGuard';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

// ─── Constants ────────────────────────────────────────────────────────────────
// Fixed card dimensions for consistent look across iOS, Android, Web
const CARD_WIDTH_FIXED = 340;
const QR_SIZE_FIXED    = 180;
const AVATAR_SIZE      = 64;

// Card is always the brand blue — never follows app theme
const BLUE        = '#0066CC';
const BLUE_MID    = '#004EA8';
const BLUE_DARK   = '#003380';
const BLUE_DEEP   = '#002060';
const YELLOW      = '#FFCC00';
const CARD_WHITE  = '#F7FAFF';   // off-white QR zone — feels premium

const TIER_CONFIG: Record<string, { label: string; icon: string }> = {
  free:    { label: 'Standard', icon: 'shield-checkmark-outline' },
  plus:    { label: 'Plus',     icon: 'star'                     },
  pro:     { label: 'Pro',      icon: 'star'                     },
  premium: { label: 'Premium',  icon: 'diamond'                  },
  vip:     { label: 'VIP',      icon: 'diamond'                  },
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PassField({ label, value }: { label: string; value: string }) {
  return (
    <View style={f.field}>
      <Text style={f.label}>{label}</Text>
      <Text style={f.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const f = StyleSheet.create({
  field: { flex: 1, gap: 3 },
  label: { fontSize: 9, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.50)', letterSpacing: 1.4, textTransform: 'uppercase' },
  value: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#FFFFFF', letterSpacing: -0.2 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function QRScreen() {
  const colors      = useColors();
  const insets      = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const topInset    = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const [copied, setCopied] = useState(false);

  // Same card size everywhere: fixed 340px, or screen - 32 on very narrow
  const cardWidth = Math.min(screenWidth - 32, CARD_WIDTH_FIXED);
  const qrSize    = Math.min(cardWidth - 64, QR_SIZE_FIXED);

  const { userId: authUserId, isRestoring } = useAuth();
  const { data: user, isPending: userPending } = useQuery<User>({
    queryKey: ['/api/auth/me', 'profile-qr', authUserId],
    queryFn: () => api.auth.me(),
    enabled: Boolean(authUserId) && !isRestoring,
  });
  const userId = user?.id ?? authUserId;

  const { data: membership, isLoading: membershipLoading } = useQuery<Membership>({
    queryKey: [`/api/membership/${userId}`],
    enabled: !!userId,
  });

  const userProfileLoading =
    isRestoring || (Boolean(authUserId) && userPending && !user);
  const isLoading = userProfileLoading || (!!userId && membershipLoading);

  const tier     = membership?.tier ?? 'free';
  const tierConf = TIER_CONFIG[tier] ?? TIER_CONFIG.free;
  const cpid     = user?.culturePassId ?? 'CP-000000';
  const name     = user?.displayName ?? 'CulturePass User';
  const username = user?.username ?? 'user';
  const avatarUrl = user?.avatarUrl;
  const interests = (user?.interests ?? []).slice(0, 5);
  const location  = [user?.city, user?.country].filter(Boolean).join(', ');

  const initials = useMemo(
    () => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    [name],
  );

  const qrValue = useMemo(
    () => JSON.stringify({ type: 'culturepass_id', cpid, name, username }),
    [cpid, name, username],
  );

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return '—';
    return new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }, [user?.createdAt]);

  // Wallet pass URLs — fetched lazily only when user is loaded
  const { data: appleWallet } = useQuery<{ url: string }>({
    queryKey: ['/api/wallet/business-card/apple', userId],
    queryFn: () => api.wallet.businessCardApple() as Promise<{ url: string }>,
    enabled: !!userId && Platform.OS === 'ios',
    staleTime: 8 * 60 * 1000, // 8 min (token expires in 10 min)
  });

  const { data: googleWallet } = useQuery<{ url: string }>({
    queryKey: ['/api/wallet/business-card/google', userId],
    queryFn: () => api.wallet.businessCardGoogle() as Promise<{ url: string }>,
    enabled: !!userId && Platform.OS === 'android',
    staleTime: 30 * 60 * 1000,
  });

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: `${name} — CulturePass`,
        message: `${name} (@${username})\nCPID: ${cpid}\n\nhttps://culturepass.app/u/${username}`,
      });
    } catch {}
  };

  const handleCopy = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(cpid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <AuthGuard
      icon="qr-code-outline"
      title="Digital ID"
      message="Sign in to view and share your CulturePass Digital ID — your business card and conference badge."
    >
    <View style={s.root}>
      <LinearGradient
        colors={gradients.midnight as unknown as [string, string]}
        style={StyleSheet.absoluteFillObject}
      />
      <AppHeaderBar
        title="Digital ID"
        subtitle="CulturePass"
        backFallback="/(tabs)/profile"
        topInset={topInset}
        rightAction={{
          icon: 'scan-outline',
          onPress: () => { 
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/scanner'); 
          },
          label: 'Scan a CulturePass',
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: bottomInset + 40 }]}
      >
        {isLoading ? (
          <View style={{ gap: 14, alignItems: 'center', paddingTop: 20 }}>
            <Skeleton width={cardWidth} height={480} borderRadius={24} />
            <View style={{ flexDirection: 'row', gap: 10, width: cardWidth }}>
              <Skeleton width="32%" height={66} borderRadius={14} />
              <Skeleton width="32%" height={66} borderRadius={14} />
              <Skeleton width="32%" height={66} borderRadius={14} />
            </View>
          </View>
        ) : (
          <>
            {/* ── THE PASS ────────────────────────────────────── */}
            <Animated.View entering={FadeInDown.duration(800)} style={[s.cardShadow, { width: cardWidth }]}>
              <View style={s.card}>

                {/* ── BLUE BODY ─────────────────────────────── */}
                <LinearGradient
                  colors={[BLUE, BLUE_MID, BLUE_DARK]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={s.cardBlue}
                >
                  {/* Shine overlay */}
                  <LinearGradient
                    colors={['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.0)']}
                    start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                  />

                  {/* Punch hole — style for conference necktag / print */}
                  <View style={s.lanyardHoleWrap}>
                    <View style={s.lanyardHoleOuter}>
                      <View style={s.lanyardHoleInner} />
                    </View>
                  </View>
                  {/* Yellow top accent stripe */}
                  <View style={s.topStripe} />

                  {/* ── Pass header: logo + name + tier ───── */}
                  <View style={s.passHeader}>
                    <View style={s.passLogoWrap}>
                      <LinearGradient
                        colors={[YELLOW, YELLOW + 'CC']}
                        style={s.passLogo}
                      >
                        <Ionicons name="globe" size={13} color={BLUE_DARK} />
                      </LinearGradient>
                      <View>
                        <Text style={s.orgName}>CULTUREPASS</Text>
                        <Text style={s.orgTagline}>We Belong Anywhere</Text>
                      </View>
                    </View>
                    <View style={s.tierPill}>
                      <Ionicons name={tierConf.icon as keyof typeof Ionicons.glyphMap} size={10} color={YELLOW} />
                      <Text style={s.tierText}>{tierConf.label.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* ── Primary field: avatar + name ──────── */}
                  <View style={s.primaryRow}>
                    {/* Avatar */}
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={s.avatar} contentFit="cover" />
                    ) : (
                      <LinearGradient
                        colors={[YELLOW, YELLOW + 'BB']}
                        style={s.avatarFallback}
                      >
                        <Text style={s.avatarInitials}>{initials}</Text>
                      </LinearGradient>
                    )}

                    {/* Name block */}
                    <View style={s.nameBlock}>
                      <Text style={s.nameText} numberOfLines={2}>{name}</Text>
                      <Text style={s.handleText}>@{username}</Text>
                      {location ? (
                        <View style={s.locationRow}>
                          <Ionicons name="location" size={11} color={YELLOW + 'CC'} />
                          <Text style={s.locationText}>{location}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* ── Secondary fields row (no duplication with primary/footer) ─────────────── */}
                  <View style={s.fieldsRow}>
                    <PassField label="Membership" value={tierConf.label} />
                    <View style={s.fieldDivider} />
                    <PassField label="Member Since" value={memberSince} />
                  </View>
                </LinearGradient>

                {/* ── PERFORATION DIVIDER ───────────────── */}
                <View style={s.perfZone}>
                  {/* Left notch (colored to match card blue above) */}
                  <View style={[s.perfNotch, s.perfNotchLeft, { backgroundColor: BLUE_DARK }]} />
                  {/* Dashed line */}
                  <View style={s.perfLine} />
                  {/* Right notch */}
                  <View style={[s.perfNotch, s.perfNotchRight, { backgroundColor: BLUE_DARK }]} />
                </View>

                {/* ── WHITE QR ZONE ─────────────────────── */}
                <View style={s.qrZone}>
                  {/* Blue corner accents — Apple-style */}
                  <View style={[s.cornerTL, { borderColor: BLUE + '30' }]} />
                  <View style={[s.cornerTR, { borderColor: BLUE + '30' }]} />
                  <View style={[s.cornerBL, { borderColor: BLUE + '30' }]} />
                  <View style={[s.cornerBR, { borderColor: BLUE + '30' }]} />

                  <QRCode
                    value={qrValue}
                    size={qrSize}
                    color={BLUE_DARK}
                    backgroundColor={CARD_WHITE}
                    ecl="H"
                  />
                  <Text style={s.qrHint}>Scan to verify identity</Text>
                  {/* Pass ID printed beneath QR — for print & lanyard cards */}
                  <View style={s.passIdBelowQr}>
                    <Text style={s.passIdBelowLabel}>PASS ID</Text>
                    <Text style={s.passIdBelowValue}>{cpid}</Text>
                  </View>
                </View>

                {/* ── FOOTER ────────────────────────────── */}
                <LinearGradient
                  colors={[BLUE_DARK, BLUE_DEEP]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.cardFooter}
                >
                  <View style={s.verifiedRow}>
                    <View style={s.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={12} color={BLUE_DARK} />
                    </View>
                    <Text style={s.verifiedText}>Verified Member</Text>
                  </View>
                </LinearGradient>

              </View>{/* card */}
            </Animated.View>{/* cardShadow */}

            {/* ── ACTION BUTTONS ──────────────────────── */}
            <Animated.View entering={FadeInUp.delay(300).duration(600)} style={[s.actionsRow, { width: cardWidth }]}>
              {([
                { icon: 'share-outline',  label: 'Share',   color: BLUE,               onPress: handleShare },
                { icon: copied ? 'checkmark' : 'copy-outline', label: copied ? 'Copied' : 'Copy ID', color: copied ? '#34C759' : YELLOW, onPress: handleCopy },
                { icon: 'scan-outline',   label: 'Scan',    color: CultureTokens.coral, onPress: () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/scanner'); } },
              ] as const).map((btn) => (
                <Pressable
                  key={btn.label}
                  style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight, opacity: pressed ? 0.72 : 1 }]}
                  onPress={btn.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={btn.label}
                >
                  <View style={[s.actionIcon, { backgroundColor: (btn.color as string) + '18' }]}>
                    <Ionicons name={btn.icon as keyof typeof Ionicons.glyphMap} size={18} color={btn.color as string} />
                  </View>
                  <Text style={[s.actionLabel, { color: colors.textSecondary }]}>{btn.label}</Text>
                </Pressable>
              ))}
            </Animated.View>

            {/* ── ADD TO WALLET ───────────────────────── */}
            {(appleWallet?.url || googleWallet?.url) && (
              <Animated.View entering={FadeInUp.delay(500).duration(600)} style={[s.walletSection, { width: cardWidth }]}>
                <Text style={[s.walletHeading, { color: colors.textTertiary }]}>ADD TO WALLET</Text>

                {/* Apple Wallet */}
                {appleWallet?.url && Platform.OS === 'ios' && (
                  <Pressable
                    style={({ pressed }) => [s.walletBtn, s.walletBtnApple, { opacity: pressed ? 0.82 : 1 }]}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      try { await Linking.openURL(appleWallet.url); }
                      catch { Alert.alert('Error', 'Could not open Apple Wallet.'); }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Add to Apple Wallet"
                  >
                    <LinearGradient
                      colors={['#1C1C1E', '#000000']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
                    <View style={s.walletBtnText}>
                      <Text style={s.walletBtnSub}>Add to</Text>
                      <Text style={s.walletBtnTitle}>Apple Wallet</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.40)" />
                  </Pressable>
                )}

                {/* Google Wallet */}
                {googleWallet?.url && Platform.OS === 'android' && (
                  <Pressable
                    style={({ pressed }) => [s.walletBtn, s.walletBtnGoogle, { opacity: pressed ? 0.82 : 1 }]}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      try { await Linking.openURL(googleWallet.url); }
                      catch { Alert.alert('Error', 'Could not open Google Wallet.'); }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Add to Google Wallet"
                  >
                    <LinearGradient
                      colors={['#1A73E8', '#1557B0']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                    <View style={s.walletBtnText}>
                      <Text style={s.walletBtnSub}>Save to</Text>
                      <Text style={s.walletBtnTitle}>Google Wallet</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.40)" />
                  </Pressable>
                )}
              </Animated.View>
            )}

            {/* ── INTEREST TAGS ───────────────────────── */}
            {interests.length > 0 && (
              <Animated.View entering={FadeInUp.delay(700).duration(600)} style={[s.tagsSection, { width: cardWidth }]}>
                <Text style={[s.tagsHeading, { color: colors.textTertiary }]}>INTERESTS</Text>
                <View style={s.tagsRow}>
                  {interests.map(interest => (
                    <View key={interest} style={[s.tag, { backgroundColor: BLUE + '12', borderColor: BLUE + '28' }]}>
                      <Text style={[s.tagText, { color: BLUE }]}>{capitalize(interest)}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
    </AuthGuard>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:        { flex: 1 },

  // Scroll
  scroll: { alignItems: 'center', paddingTop: 24, gap: 20 },

  // Card shell
  cardShadow: {
    borderRadius: 24,
    ...Platform.select({
      web:     { boxShadow: '0px 24px 64px rgba(0,102,204,0.4), 0px 8px 32px rgba(0,0,0,0.15)' },
      default: { shadowColor: BLUE, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 36, elevation: 20 },
    }),
  },
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  // ── Blue body ──────────────────────────────────────────────────────────────
  cardBlue: { paddingBottom: 24, overflow: 'hidden' },

  lanyardHoleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  lanyardHoleOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lanyardHoleInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topStripe: { height: 4, backgroundColor: YELLOW },

  passHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 6,
  },
  passLogoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passLogo:     { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  orgName:      { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#FFFFFF', letterSpacing: 2.5 },
  orgTagline:   { fontSize: 9,  fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 },

  tierPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
    borderColor: YELLOW + '55', backgroundColor: YELLOW + '15',
  },
  tierText: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: YELLOW, letterSpacing: 1 },

  // Primary field
  primaryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 18,
    paddingHorizontal: 24, paddingTop: 26, paddingBottom: 22,
  },
  avatar:       { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: 20, borderWidth: 3, borderColor: 'rgba(255,180,0,0.4)' },
  avatarFallback:{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: YELLOW + '60' },
  avatarInitials:{ fontSize: 24, fontFamily: 'Poppins_700Bold', color: BLUE_DARK },
  nameBlock:    { flex: 1, gap: 4 },
  nameText:     { fontSize: 28, fontFamily: 'Poppins_700Bold', color: '#FFFFFF', letterSpacing: -0.5, lineHeight: 32 },
  handleText:   { fontSize: 14, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.7)' },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  locationText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.65)' },

  // Secondary fields
  fieldsRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginHorizontal: 20, marginBottom: 20,
    paddingVertical: 18, paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  fieldDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 16, alignSelf: 'center' },

  // ── Perforation ───────────────────────────
  perfZone: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BLUE_DARK,
    height: 24,
    overflow: 'hidden',
  },
  perfNotch: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: CARD_WHITE,
    position: 'absolute', zIndex: 2,
  },
  perfNotchLeft:  { left: -14 },
  perfNotchRight: { right: -14 },
  perfLine: {
    flex: 1,
    marginHorizontal: 24,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.25)',
  },

  // ── QR zone ─────────────────────
  qrZone: {
    backgroundColor: CARD_WHITE,
    alignItems: 'center',
    paddingVertical: 32, paddingHorizontal: 28,
    gap: 6,
  },
  cornerTL: { position: 'absolute', top: 18, left: 18, width: 18, height: 18, borderTopWidth: 2, borderLeftWidth: 2, borderRadius: 4 },
  cornerTR: { position: 'absolute', top: 18, right: 18, width: 18, height: 18, borderTopWidth: 2, borderRightWidth: 2, borderRadius: 4 },
  cornerBL: { position: 'absolute', bottom: 56, left: 18, width: 18, height: 18, borderBottomWidth: 2, borderLeftWidth: 2, borderRadius: 4 },
  cornerBR: { position: 'absolute', bottom: 56, right: 18, width: 18, height: 18, borderBottomWidth: 2, borderRightWidth: 2, borderRadius: 4 },
  qrHint: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: 'rgba(0,0,0,0.4)', letterSpacing: 0.5, marginTop: 4 },
  passIdBelowQr: { alignItems: 'center', marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', width: '100%', gap: 6 },
  passIdBelowLabel: { fontSize: 9, fontFamily: 'Poppins_700Bold', color: 'rgba(0,0,0,0.45)', letterSpacing: 2.5, textTransform: 'uppercase' },
  passIdBelowValue: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: BLUE_DARK, letterSpacing: 3 },

  // ── Footer ──────────────────────
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 18,
  },
  verifiedRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  verifiedBadge: { width: 24, height: 24, borderRadius: 8, backgroundColor: YELLOW, alignItems: 'center', justifyContent: 'center' },
  verifiedText:  { fontSize: 14, fontFamily: 'Poppins_700Bold', color: '#FFFFFF', letterSpacing: 0.5 },

  // ── Action buttons ────────────────────────
  actionsRow: { flexDirection: 'row', gap: 14 },
  actionBtn: {
    flex: 1, alignItems: 'center', gap: 10,
    paddingVertical: 18, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      web: { boxShadow: '0px 8px 24px rgba(0,0,0,0.2)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
    }),
  },
  actionIcon:  { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#fff' },

  // ── Wallet buttons ────────────────────────
  walletSection:   { gap: 12, marginTop: 10 },
  walletHeading:   { fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 2, marginLeft: 4 },
  walletBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 18, paddingHorizontal: 22,
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      web:     { boxShadow: '0px 12px 32px rgba(0,0,0,0.4)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 12 },
    }),
  },
  walletBtnApple:  {},
  walletBtnGoogle: {},
  walletBtnText:   { flex: 1, gap: 2 },
  walletBtnSub:    { fontSize: 11, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5 },
  walletBtnTitle:  { fontSize: 18, fontFamily: 'Poppins_800ExtraBold', color: '#FFFFFF', letterSpacing: -0.3 },

  // ── Interest tags ─────────────────────────
  tagsSection: { gap: 12, marginTop: 10 },
  tagsHeading: { fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 2, marginLeft: 4 },
  tagsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag:         { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, backgroundColor: 'rgba(0,102,204,0.1)', borderColor: 'rgba(0,102,204,0.3)' },
  tagText:     { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#fff' },
});
