import {
  View,
  Text,
  Pressable,
  TextInput,
  Platform,
  Alert,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  Vibration,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useReducedMotion,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useContacts } from '@/contexts/ContactsContext';
import { api } from '@/lib/api';
import { captureAttend } from '@/lib/analytics-funnel';
import { useRole } from '@/hooks/useRole';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthGuard } from '@/components/AuthGuard';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';

import { getStyles } from '@/components/scanner/Scanner.styles';
import {
  ScanMode,
  TicketScanResult,
  CulturePassContact,
  SessionStats,
} from '@/components/scanner/types';
import {
  INITIAL_STATS,
  getOutcomeConfig,
  parseCulturePassInput,
} from '@/components/scanner/utils';
import { TicketResultCard } from '@/components/scanner/TicketResultCard';

const isWeb = Platform.OS === 'web';

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  
  const { isOrganizer } = useRole();
  const canUseStaffScanner = isOrganizer;

  // Render static glass styles since we migrated out of theme
  const colors = useColors();
  const s = useMemo(() => getStyles(colors), [colors]);
  const reducedMotion = useReducedMotion();

  const [mode, setMode] = useState<ScanMode>('culturepass');

  useEffect(() => {
    if (!canUseStaffScanner && mode === 'tickets') {
      setMode('culturepass');
    }
  }, [canUseStaffScanner, mode]);

  const [ticketCode, setTicketCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [ticketResult, setTicketResult] = useState<TicketScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<TicketScanResult[]>([]);
  const [ticketCameraActive, setTicketCameraActive] = useState(false);
  const [session, setSession] = useState<SessionStats>({ ...INITIAL_STATS, startedAt: new Date() });
  const ticketLastScanned = useRef('');

  // Live session timer — ticks every second
  const [, setTimerTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTimerTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-dismiss on valid scan results (5 seconds)
  const autoDismissTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dismissCountdown, setDismissCountdown] = useState<number | null>(null);
  useEffect(() => {
    if (ticketResult?.valid) {
      setDismissCountdown(5);
      autoDismissTimeout.current = setTimeout(() => {
        setTicketResult(null);
        setDismissCountdown(null);
      }, 5000);
      const interval = setInterval(() => setDismissCountdown(c => (c !== null && c > 1 ? c - 1 : null)), 1000);
      return () => {
        clearTimeout(autoDismissTimeout.current ?? undefined);
        clearInterval(interval);
      };
    } else {
      setDismissCountdown(null);
    }
  }, [ticketResult]);

  const [cpInput, setCpInput] = useState('');
  const [cpContact, setCpContact] = useState<CulturePassContact | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [cpCameraActive, setCpCameraActive] = useState(false);
  const cpLastScanned = useRef('');

  const [permission, requestPermission] = useCameraPermissions();
  const { addContact, isContactSaved } = useContacts();

  const TIER_DISPLAY = useMemo((): Record<string, { label: string; color: string; icon: string }> => ({
    free:    { label: 'Free',    color: colors.textSecondary, icon: 'shield-outline' },
    plus:    { label: 'Plus',    color: CultureTokens.indigo,     icon: 'star' },
    premium: { label: 'Premium', color: CultureTokens.gold,       icon: 'diamond' },
    vip:     { label: 'VIP',     color: CultureTokens.gold,    icon: 'diamond' },
  }), [colors.textSecondary]);

  useEffect(() => {
    if (!ticketResult) ticketLastScanned.current = '';
  }, [ticketResult]);

  const ensureCameraPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      Alert.alert('Camera', 'Camera scanning works best on a physical device. Use manual input on web.');
      return false;
    }
    if (permission?.granted) return true;
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert('Camera Permission', 'Camera access is required to scan QR codes. Please enable it in your device settings.');
      return false;
    }
    return true;
  }, [permission, requestPermission]);

  const doTicketScan = useCallback(async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setIsScanning(true);
    Keyboard.dismiss();

    try {
      const data = await api.tickets.scan({ ticketCode: trimmed, scannedBy: 'staff' });
      const valid = data.valid !== false;

      const result: TicketScanResult = {
        valid,
        message: data.message || (valid ? 'Ticket accepted' : 'Invalid ticket'),
        outcome: (data.outcome as TicketScanResult['outcome']) ?? (valid ? 'accepted' : 'rejected'),
        ticket: (data.ticket as unknown as TicketScanResult['ticket']) ?? undefined,
        scannedAt: new Date().toISOString(),
      };

      setTicketResult(result);
      setScanHistory(prev => [result, ...prev.slice(0, 49)]);
      setSession(prev => ({
        ...prev,
        accepted:   prev.accepted   + (valid ? 1 : 0),
        duplicates: prev.duplicates + (!valid && result.outcome === 'duplicate' ? 1 : 0),
        rejected:   prev.rejected   + (!valid && result.outcome !== 'duplicate' ? 1 : 0),
      }));

      if (valid) {
        captureAttend(undefined, undefined, 'ticket_scanner');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result.outcome === 'duplicate') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        if (Platform.OS !== 'web') Vibration.vibrate([0, 100, 50, 100]);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (Platform.OS !== 'web') Vibration.vibrate([0, 300]);
      }

      setTicketCode('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      const result: TicketScanResult = { valid: false, outcome: 'rejected', message: msg, scannedAt: new Date().toISOString() };
      setTicketResult(result);
      setScanHistory(prev => [result, ...prev.slice(0, 49)]);
      setSession(prev => ({ ...prev, rejected: prev.rejected + 1 }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsScanning(false);
      setTicketCameraActive(false);
    }
  }, []);

  const handleTicketBarcodeScanned = useCallback(({ data }: { data: string }) => {
    if (ticketLastScanned.current === data) return;
    ticketLastScanned.current = data;
    setTicketCameraActive(false);
    doTicketScan(data);
  }, [doTicketScan]);

  const handleManualTicketScan = useCallback(() => {
    if (!ticketCode.trim()) { Alert.alert('Enter Code', 'Please enter a ticket code.'); return; }
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    doTicketScan(ticketCode);
  }, [ticketCode, doTicketScan]);

  const startTicketCamera = useCallback(async () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await ensureCameraPermission();
    if (!ok) return;
    setTicketResult(null);
    ticketLastScanned.current = '';
    setTicketCameraActive(true);
  }, [ensureCameraPermission]);

  const resetSession = useCallback(() => {
    Alert.alert('Reset Session', 'Clear all scan history and reset stats?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => {
        setSession({ ...INITIAL_STATS, startedAt: new Date() });
        setScanHistory([]);
        setTicketResult(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }},
    ]);
  }, []);

  const lookupCpid = useCallback(async (cpid: string): Promise<CulturePassContact | null> => {
    try {
      const data = await api.cpid.lookup(cpid);
      if (data.userId || data.targetId) {
        const userId = data.userId || data.targetId!;
        const u = await api.users.get(userId) as unknown as Record<string, unknown>;
        return {
          cpid,
          name: String(u.displayName || u.username || ''),
          username: String(u.username || ''),
          tier: 'free',
          avatarUrl: String(u.avatarUrl || ''),
          city: String(u.city || ''),
          country: String(u.country || ''),
          bio: String(u.bio || ''),
          userId: String(u.id || ''),
        };
      }
      return data.name ? {
        cpid: data.cpid, name: data.name, username: data.username, tier: data.tier,
        org: data.org, avatarUrl: data.avatarUrl, city: data.city, country: data.country, bio: data.bio,
      } : null;
    } catch {
      return null;
    }
  }, []);

  const processScannedCpData = useCallback(async (input: string) => {
    if (cpLastScanned.current === input) return;
    cpLastScanned.current = input;
    const contact = parseCulturePassInput(input);
    if (!contact) return;

    setCpCameraActive(false);
    setIsLookingUp(true);
    if (contact.cpid && contact.cpid !== 'Unknown') {
      const full = await lookupCpid(contact.cpid);
      setCpContact(full ?? contact);
    } else {
      setCpContact(contact);
    }
    setIsLookingUp(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [lookupCpid]);

  const handleCpBarcodeScanned = useCallback(({ data }: { data: string }) => {
    processScannedCpData(data);
  }, [processScannedCpData]);

  const handleCpManualScan = useCallback(async () => {
    const input = cpInput.trim();
    if (!input) { Alert.alert('Enter Data', 'Enter a CulturePass ID or paste QR data.'); return; }
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    setIsLookingUp(true);
    const contact = parseCulturePassInput(input);
    if (contact) {
      if (contact.cpid && contact.cpid !== 'Unknown') {
        const full = await lookupCpid(contact.cpid);
        setCpContact(full ?? contact);
      } else {
        setCpContact(contact);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCpInput('');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Data', 'Enter a CulturePass ID (CP-XXXXXX), JSON, or vCard data.');
    }
    setIsLookingUp(false);
  }, [cpInput, lookupCpid]);

  const startCpCamera = useCallback(async () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ok = await ensureCameraPermission();
    if (!ok) return;
    cpLastScanned.current = '';
    setCpCameraActive(true);
  }, [ensureCameraPermission]);

  const handleSaveContact = useCallback(() => {
    if (!cpContact) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addContact({ cpid: cpContact.cpid, name: cpContact.name, username: cpContact.username, tier: cpContact.tier, org: cpContact.org, avatarUrl: cpContact.avatarUrl, city: cpContact.city, country: cpContact.country, bio: cpContact.bio, userId: cpContact.userId });
    Alert.alert('Contact Saved', `${cpContact.name || cpContact.cpid} added to your CulturePass contacts.`);
  }, [cpContact, addContact]);

  const contactAlreadySaved = cpContact ? isContactSaved(cpContact.cpid) : false;

  const handleViewProfile = useCallback(() => {
    if (!cpContact) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!contactAlreadySaved) handleSaveContact();
    router.push({ pathname: '/contacts/[cpid]', params: { cpid: cpContact.cpid } });
  }, [cpContact, contactAlreadySaved, handleSaveContact]);

  // Recomputes on every 1-second tick (setTimerTick causes re-render)
  const sessionDuration = (() => {
    const elapsed = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    if (mins < 60) return `${mins}:${String(secs).padStart(2, '0')}`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  })();

  // Animated scanning line — sweeps top-to-bottom inside the camera frame
  const scanLineY = useSharedValue(0);
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));
  useEffect(() => {
    scanLineY.value = withRepeat(
      withTiming(220, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hintItems = useMemo(() => [
    { icon: 'finger-print',          color: CultureTokens.indigo,  label: 'CulturePass ID',  example: 'CP-123456' },
    { icon: 'code-slash',             color: CultureTokens.gold, label: 'JSON QR Data',    example: '{"type":"culturepass_id","cpid":"CP-..."}' },
    { icon: 'document-text-outline',  color: CultureTokens.coral,   label: 'vCard Data',      example: 'BEGIN:VCARD...' },
  ], []);

  return (
    <AuthGuard icon="scan-outline" title="Scanner" message="Sign in to scan CulturePass QR cards and manage contacts.">
    <View style={[s.container, { paddingTop: topInset }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={scannerAmbient.mesh}
        pointerEvents="none"
      />

      {/* Header */}
      <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(280)}>
        <LiquidGlassPanel
          borderRadius={0}
          bordered={false}
          style={{
            borderBottomWidth: StyleSheet.hairlineWidth * 2,
            borderBottomColor: colors.borderLight,
          }}
          contentStyle={s.headerGlassInner}
        >
          <View style={{ width: 34 }} />
          <Text style={s.headerTitle}>
            {mode === 'tickets' ? 'Check-In' : 'Scanner'}
          </Text>
          <View style={s.headerRight}>
            {mode === 'tickets' ? (
              <Pressable style={s.headerBtn} onPress={resetSession} accessibilityRole="button" accessibilityLabel="Reset session">
                <Ionicons name="refresh-outline" size={16} color={CultureTokens.error} />
              </Pressable>
            ) : (
              <Pressable style={s.headerBtn} onPress={() => router.push('/contacts')} accessibilityRole="button" accessibilityLabel="View contacts">
                <Ionicons name="people-outline" size={16} color={colors.text} />
              </Pressable>
            )}
          </View>
        </LiquidGlassPanel>
      </Animated.View>

      {/* Mode toggle */}
      <LiquidGlassPanel
        borderRadius={10}
        bordered={false}
        style={s.toggleGlassOuter}
        contentStyle={s.toggleGlassInner}
      >
        <Pressable
          style={[s.toggleTab, mode === 'culturepass' && { backgroundColor: colors.surface }]}
          onPress={() => { setMode('culturepass'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          accessibilityRole="tab"
        >
          <Text style={[s.toggleText, mode === 'culturepass' && { color: colors.text }]}>CulturePass</Text>
        </Pressable>
        {canUseStaffScanner && (
          <Pressable
            style={[s.toggleTab, mode === 'tickets' && { backgroundColor: colors.surface }]}
            onPress={() => { setMode('tickets'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            accessibilityRole="tab"
          >
            <Text style={[s.toggleText, mode === 'tickets' && { color: colors.text }]}>Staff Check-In</Text>
          </Pressable>
        )}
      </LiquidGlassPanel>

      {/* Loading overlay */}
      {isLookingUp && (
        <View style={s.lookupOverlay}>
          <ActivityIndicator size="large" color={CultureTokens.indigo} />
          <Text style={s.lookupText}>Looking up profile…</Text>
        </View>
      )}

      {/* ═══════════ STAFF TICKET MODE ═══════════ */}
      {mode === 'tickets' && (
        <>
          <Animated.View entering={reducedMotion ? undefined : FadeInUp.springify()}>
            <LiquidGlassPanel
              borderRadius={10}
              bordered={false}
              style={s.statsGlassOuter}
              contentStyle={s.statsGlassInner}
            >
              <View style={s.statItem}>
                <Text style={[s.statNum, { color: CultureTokens.success }]}>{session.accepted}</Text>
                <Text style={s.statLabel}>Accepted</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={[s.statNum, { color: CultureTokens.warning }]}>{session.duplicates}</Text>
                <Text style={s.statLabel}>Dup</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={[s.statNum, { color: CultureTokens.error }]}>{session.rejected}</Text>
                <Text style={s.statLabel}>Invalid</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={[s.statNum, { color: colors.text }]}>{session.accepted + session.duplicates + session.rejected}</Text>
                <Text style={s.statLabel}>Total</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={[s.statNum, { color: colors.textSecondary, fontSize: 16 }]}>{sessionDuration}</Text>
                <Text style={s.statLabel}>Session</Text>
              </View>
            </LiquidGlassPanel>
          </Animated.View>

          {ticketCameraActive && (
            <View style={s.cameraContainer}>
              <CameraView
                style={s.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13'] }}
                onBarcodeScanned={handleTicketBarcodeScanned}
              />
              <View style={s.cameraOverlay}>
                <View style={s.cameraFrame}>
                  <View style={[s.cCorner, s.cTL]} />
                  <View style={[s.cCorner, s.cTR]} />
                  <View style={[s.cCorner, s.cBL]} />
                  <View style={[s.cCorner, s.cBR]} />
                  {/* Animated scan line */}
                  <Animated.View style={[s.scanLine, scanLineStyle]} />
                </View>
                <Text style={s.cameraHint}>Point at a ticket QR code</Text>
              </View>
              <Pressable
                style={s.closeCameraBtn}
                onPress={() => setTicketCameraActive(false)}
                accessibilityRole="button"
                accessibilityLabel="Close camera"
              >
                <Ionicons name="close" size={16} color="white" />
              </Pressable>
            </View>
          )}

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 40 + bottomInset }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!ticketCameraActive && (
              <View style={s.scanInputSection}>
                <Pressable style={s.camScanBtn} onPress={startTicketCamera}>
                  <LinearGradient
                    colors={[CultureTokens.indigo, CultureTokens.gold]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.camScanGradient}
                  >
                    <Ionicons name="camera" size={28} color={colors.background} />
                    <View>
                      <Text style={[s.camScanTitle, { color: colors.background }]}>Scan QR Code</Text>
                      <Text style={[s.camScanSub, { color: colors.textTertiary }]}>Camera · QR · Barcode</Text>
                    </View>
                  </LinearGradient>
                </Pressable>

                <View style={s.orRow}>
                  <View style={s.orLine} />
                  <Text style={s.orText}>or enter manually</Text>
                  <View style={s.orLine} />
                </View>

                <View style={s.inputRow}>
                  <TextInput
                    style={s.codeInput}
                    placeholder="Enter ticket code…"
                    placeholderTextColor={colors.textTertiary}
                    value={ticketCode}
                    onChangeText={v => setTicketCode(v.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={handleManualTicketScan}
                  />
                  <Pressable
                    style={[s.scanBtn, { backgroundColor: CultureTokens.indigo }, isScanning && s.scanBtnDisabled]}
                    onPress={handleManualTicketScan}
                    disabled={isScanning}
                  >
                    {isScanning
                      ? <ActivityIndicator size="small" color={colors.background} />
                      : <Ionicons name="checkmark-circle" size={24} color={colors.background} />
                    }
                  </Pressable>
                </View>
              </View>
            )}

            {ticketResult && !ticketCameraActive && (
              <View style={s.resultWrapper}>
                {ticketResult.valid && dismissCountdown !== null && (
                  <Text style={{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textTertiary, textAlign: 'right', marginBottom: 4 }}>
                    Auto-closing in {dismissCountdown}s
                  </Text>
                )}
                <TicketResultCard
                  result={ticketResult}
                  onClose={() => { setTicketResult(null); setDismissCountdown(null); clearTimeout(autoDismissTimeout.current ?? undefined); }}
                  onScanNext={() => { setTicketResult(null); setDismissCountdown(null); startTicketCamera(); }}
                  onPrintBadge={() => {
                    if (!ticketResult.ticket?.id) return;
                    router.push({ pathname: '/tickets/print/[id]', params: { id: ticketResult.ticket.id, layout: 'badge', autoPrint: '1' } });
                  }}
                />
              </View>
            )}

            {scanHistory.length > 0 && !ticketCameraActive && (
              <View style={s.historySection}>
                <View style={s.historySectionHeader}>
                  <Text style={s.historyTitle}>Scan Log ({scanHistory.length})</Text>
                </View>
                {scanHistory.map((item, idx) => {
                  const cfg = getOutcomeConfig(item);
                  return (
                    <View key={idx} style={[s.historyItem, { borderLeftColor: cfg.color }]}>
                      <View style={[s.historyIconWrap, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.icon as keyof typeof Ionicons.glyphMap} size={20} color={cfg.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.historyEventTitle} numberOfLines={1}>
                          {item.ticket?.eventTitle || 'Unknown Event'}
                        </Text>
                        <Text style={[s.historyStatus, { color: cfg.color }]} numberOfLines={1}>
                          {cfg.title} · {item.message}
                        </Text>
                        {item.scannedAt && (
                          <Text style={{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.textTertiary, marginTop: 2 }}>
                            {new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </Text>
                        )}
                      </View>
                      {item.ticket?.tierName && (
                        <View style={[s.historyTierChip, { backgroundColor: CultureTokens.indigo + '15' }]}>
                          <Text style={[s.historyTierText, { color: CultureTokens.indigo }]}>{item.ticket.tierName}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {scanHistory.length === 0 && !ticketResult && !ticketCameraActive && (
              <View style={s.emptyState}>
                <View style={s.emptyIconBg}>
                  <Ionicons name="scan" size={44} color={CultureTokens.indigo} />
                </View>
                <Text style={s.emptyTitle}>Ready to Check In</Text>
                <Text style={s.emptyDesc}>Scan a QR code or enter a ticket code above to verify and mark attendance.</Text>
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* ═══════════ CULTUREPASS CONTACT MODE ═══════════ */}
      {mode === 'culturepass' && (
        <>
          {cpCameraActive && (
            <View style={s.cameraContainer}>
              <CameraView
                style={s.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleCpBarcodeScanned}
              />
              <View style={s.cameraOverlay}>
                <View style={s.cameraFrame}>
                  <View style={[s.cCorner, s.cTL]} />
                  <View style={[s.cCorner, s.cTR]} />
                  <View style={[s.cCorner, s.cBL]} />
                  <View style={[s.cCorner, s.cBR]} />
                  {/* Animated scan line */}
                  <Animated.View style={[s.scanLine, scanLineStyle]} />
                </View>
                <Text style={s.cameraHint}>Point at a CulturePass QR code</Text>
              </View>
              <Pressable
                style={s.closeCameraBtn}
                onPress={() => setCpCameraActive(false)}
                accessibilityRole="button"
                accessibilityLabel="Close camera"
              >
                <Ionicons name="close" size={16} color="white" />
              </Pressable>
            </View>
          )}

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 40 + bottomInset }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!cpCameraActive && !cpContact && (
              <View style={s.scanInputSection}>
                <Pressable style={s.camScanBtn} onPress={startCpCamera}>
                  <LinearGradient
                    colors={[CultureTokens.indigo, CultureTokens.teal]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.camScanGradient}
                  >
                    <Ionicons name="qr-code" size={28} color={colors.background} />
                    <View>
                      <Text style={[s.camScanTitle, { color: colors.background }]}>Scan CulturePass</Text>
                      <Text style={[s.camScanSub, { color: 'rgba(255,255,255,0.8)' }]}>
                        {Platform.OS === 'web' ? 'Use manual input on web' : 'Camera · QR code'}
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>

                <View style={s.orRow}>
                  <View style={s.orLine} />
                  <Text style={s.orText}>or enter manually</Text>
                  <View style={s.orLine} />
                </View>

                <View style={s.inputRow}>
                  <TextInput
                    style={s.codeInput}
                    placeholder="CP-123456 or paste QR data…"
                    placeholderTextColor={colors.textTertiary}
                    value={cpInput}
                    onChangeText={setCpInput}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={handleCpManualScan}
                  />
                  <Pressable
                    style={[s.scanBtn, { backgroundColor: CultureTokens.indigo }]}
                    onPress={handleCpManualScan}
                    disabled={isLookingUp}
                  >
                    <Ionicons name="search" size={24} color={colors.background} />
                  </Pressable>
                </View>
              </View>
            )}

            {cpContact && (
              <View style={s.cpCard}>
                <View style={s.cpCardHeader}>
                  <View style={[s.cpAvatar, { backgroundColor: CultureTokens.indigo + '20' }]}>
                    <Text style={[s.cpAvatarText, { color: CultureTokens.indigo }]}>
                      {(cpContact.name || cpContact.cpid).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => { setCpContact(null); setCpInput(''); cpLastScanned.current = ''; }}
                    style={s.closeBtn}
                  >
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>

                <Text style={s.cpName}>{cpContact.name || 'CulturePass User'}</Text>
                {cpContact.username && <Text style={s.cpUsername}>+{cpContact.username}</Text>}

                <View style={s.cpChipRow}>
                  <View style={[s.cpIdChip, { backgroundColor: CultureTokens.indigo + '20' }]}>
                    <Ionicons name="finger-print" size={14} color={CultureTokens.indigo} />
                    <Text style={[s.cpIdText, { color: CultureTokens.indigo }]}>{cpContact.cpid}</Text>
                  </View>
                  {cpContact.tier && (
                    <View style={[s.cpTierChip, { backgroundColor: (TIER_DISPLAY[cpContact.tier]?.color ?? colors.textSecondary) + '15' }]}>
                      <Ionicons name={(TIER_DISPLAY[cpContact.tier]?.icon ?? 'shield-outline') as keyof typeof Ionicons.glyphMap} size={13} color={TIER_DISPLAY[cpContact.tier]?.color ?? colors.textSecondary} />
                      <Text style={[s.cpTierText, { color: TIER_DISPLAY[cpContact.tier]?.color ?? colors.textSecondary }]}>
                        {TIER_DISPLAY[cpContact.tier]?.label ?? 'Free'}
                      </Text>
                    </View>
                  )}
                </View>

                {cpContact.city && (
                  <View style={s.cpLocationRow}>
                    <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                    <Text style={s.cpLocationText}>{cpContact.city}{cpContact.country ? `, ${cpContact.country}` : ''}</Text>
                  </View>
                )}
                {cpContact.bio && <Text style={s.cpBio} numberOfLines={2}>{cpContact.bio}</Text>}
                {cpContact.org && (
                  <View style={s.cpLocationRow}>
                    <Ionicons name="business-outline" size={16} color={colors.textSecondary} />
                    <Text style={s.cpLocationText}>{cpContact.org}</Text>
                  </View>
                )}

                <View style={s.cpActions}>
                  <Pressable style={s.cpActionBtn} onPress={handleViewProfile}>
                    <Ionicons name="person-outline" size={18} color={CultureTokens.indigo} />
                    <Text style={[s.cpActionText, { color: CultureTokens.indigo }]}>View Profile</Text>
                  </Pressable>
                  <Pressable
                    style={[s.cpActionBtn, contactAlreadySaved && { backgroundColor: CultureTokens.success + '15', borderColor: CultureTokens.success + '30' }]}
                    onPress={handleSaveContact}
                    disabled={contactAlreadySaved}
                  >
                    <Ionicons
                      name={contactAlreadySaved ? 'checkmark-circle' : 'bookmark-outline'}
                      size={18}
                      color={contactAlreadySaved ? CultureTokens.success : CultureTokens.gold}
                    />
                    <Text style={[s.cpActionText, { color: contactAlreadySaved ? CultureTokens.success : CultureTokens.gold }]}>
                      {contactAlreadySaved ? 'Saved' : 'Save Contact'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {!cpContact && !cpCameraActive && (
              <View style={s.hintSection}>
                <Text style={s.hintTitle}>Supported Formats</Text>
                {hintItems.map(item => (
                  <View key={item.label} style={s.hintItem}>
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={item.color} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.hintLabel}>{item.label}</Text>
                      <Text style={s.hintExample} numberOfLines={1}>{item.example}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </>
      )}
    </View>
    </AuthGuard>
  );
}

const scannerAmbient = StyleSheet.create({
  mesh: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },
});
