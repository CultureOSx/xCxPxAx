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
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { goBackOrReplace } from '@/lib/navigation';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient, getQueryFn } from '@/lib/query-client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { routeWithRedirect } from '@/lib/routes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ticket } from '@shared/schema';
import { CardTokens, CultureTokens } from '@/constants/theme';
import { AppHeaderBar } from '@/components/AppHeaderBar';
import { useLayout } from '@/hooks/useLayout';
import { useColors } from '@/hooks/useColors';
import { Skeleton } from '@/components/ui/Skeleton';

const isWeb = Platform.OS === 'web';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    const date = new Date(y!, m! - 1, d);
    return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

const QR_CACHE_PREFIX = '@culturepass_ticket_qr:';

function cacheTicketQr(ticketId: string, qrCode: string) {
  AsyncStorage.setItem(`${QR_CACHE_PREFIX}${ticketId}`, qrCode).catch((err) => {
    if (__DEV__) console.warn('QR cache write failed:', err);
  });
}

async function getCachedTicketQr(ticketId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(`${QR_CACHE_PREFIX}${ticketId}`);
  } catch {
    return null;
  }
}

export default function TicketDetailScreen() {
  const { isAuthenticated } = useAuth();
  const colors = useColors();
  const s = getStyles(colors);
  const { isDesktop, hPad } = useLayout();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(routeWithRedirect('/(onboarding)/login', `/tickets/${id}`));
    }
  }, [isAuthenticated, id]);
  
  // The WebTopBar handles top spacing on desktop, so only pad on mobile
  const topInset = isDesktop ? 0 : (isWeb ? 0 : insets.top);
  const bottomInset = isWeb ? 34 : insets.bottom;

  const [cachedQr, setCachedQr] = useState<string | null>(null);

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ['/api/ticket', id],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!id,
  });

  useEffect(() => {
    if (ticket?.qrCode && id) {
      cacheTicketQr(id as string, ticket.qrCode);
    }
  }, [ticket?.qrCode, id]);

  useEffect(() => {
    if (id) {
      getCachedTicketQr(id as string).then(setCachedQr);
    }
  }, [id]);

  const cancelMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const res = await apiRequest('POST', '/api/stripe/refund', { ticketId });
      return await res.json() as Record<string, unknown>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      if(!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const msg = data.refundId
        ? 'Your ticket has been cancelled and a refund has been initiated to your card.'
        : 'Your ticket has been cancelled.';
      Alert.alert('Ticket Cancelled', msg);
    },
    onError: (error: Error) => {
      Alert.alert('Refund Failed', error.message || 'Could not process the refund. Please try again.');
    },
  });

  const handleCancel = useCallback(() => {
    if (!ticket) return;
    const hasPayment = !!ticket.stripePaymentIntentId;
    const title = hasPayment ? 'Cancel & Refund' : 'Cancel Ticket';
    const message = hasPayment
      ? `Are you sure you want to cancel your ticket for "${ticket.eventTitle}"? A refund will be processed to your card.`
      : `Are you sure you want to cancel your ticket for "${ticket.eventTitle}"?`;
    Alert.alert(title, message, [
      { text: 'Keep Ticket', style: 'cancel' },
      {
        text: hasPayment ? 'Cancel & Refund' : 'Cancel Ticket',
        style: 'destructive',
        onPress: () => {
          if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          cancelMutation.mutate(ticket.id);
        },
      },
    ]);
  }, [ticket, cancelMutation]);

  const handleShare = useCallback(async () => {
    if (!ticket) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const shareUrl = `https://culturepass.app/tickets/${ticket.id}`;
      await Share.share({
        title: ticket.eventTitle,
        message: `I'm going to ${ticket.eventTitle}! 🎫\n${ticket.eventVenue ? `📍 ${ticket.eventVenue}` : ''}\n${ticket.eventDate ? `📅 ${formatDate(ticket.eventDate)}` : ''}\n\nTicket Code: ${ticket.ticketCode || 'N/A'}\n\nGet yours on CulturePass!\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch {}
  }, [ticket]);

  const handlePrint = useCallback(() => {
    if (!ticket) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/tickets/print/[id]',
      params: { id: ticket.id, layout: ticket.status === 'used' ? 'badge' : 'full', autoPrint: '1' },
    });
  }, [ticket]);

  const handleAddToWallet = useCallback(async (walletType: 'apple' | 'google') => {
    if (!ticket) return;
    if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const walletName = walletType === 'apple' ? 'Apple Wallet' : 'Google Wallet';
    Alert.alert(`Add to ${walletName}`, `Your ticket for "${ticket.eventTitle}" will be added to ${walletName}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add',
        onPress: async () => {
          try {
            const endpoint = walletType === 'apple'
              ? `/api/tickets/${ticket.id}/wallet/apple`
              : `/api/tickets/${ticket.id}/wallet/google`;
            const res  = await apiRequest('GET', endpoint);
            const data = await res.json() as { url?: string; code?: string };
            if (data.url) {
              await Linking.openURL(data.url);
            } else if (data.code === 'WALLET_NOT_IMPLEMENTED') {
              Alert.alert('Coming Soon', `${walletName} passes will be available in a future update.`);
            } else {
              Alert.alert('Success', `Ticket added to ${walletName}!`);
            }
          } catch {
            Alert.alert('Coming Soon', `${walletName} passes will be available in a future update.`);
          }
        },
      },
    ]);
  }, [ticket]);

  if (isLoading) {
    return (
      <View style={s.container}>
        <AppHeaderBar title="Ticket Details" backFallback="/tickets/index" topInset={topInset} />
        <View style={isDesktop && s.desktopShellWrapper}>
          <View style={isDesktop && s.desktopShell}>
            <View style={{ paddingTop: 12, paddingHorizontal: CardTokens.padding + 4 }}>
              <View style={[s.ticketContainer, { padding: 0, borderWidth: 1, borderColor: colors.borderLight }]}>
                <Skeleton width="100%" height={120} borderRadius={0} />
                <View style={[s.ticketNotchContainer, { zIndex: 10 }]}>
                   <View style={[s.ticketNotchBackground, { backgroundColor: colors.background }]} />
                   <View style={s.ticketNotch}>
                     <View style={[s.notchCircle, s.notchLeft, { backgroundColor: colors.background, borderColor: colors.borderLight }]} />
                     <View style={[s.notchLine, { borderColor: colors.borderLight }]} />
                     <View style={[s.notchCircle, s.notchRight, { backgroundColor: colors.background, borderColor: colors.borderLight }]} />
                   </View>
                </View>
                <View style={{ padding: CardTokens.paddingLarge + 4, gap: 16 }}>
                  <Skeleton width="80%" height={28} borderRadius={8} style={{ marginBottom: 8 }} />
                  <Skeleton width={120} height={24} borderRadius={10} />
                  <View style={{ gap: 12, marginTop: 12 }}>
                    <Skeleton width="60%" height={20} borderRadius={6} />
                    <Skeleton width="50%" height={20} borderRadius={6} />
                    <Skeleton width="70%" height={20} borderRadius={6} />
                  </View>
                  <View style={{ height: 1, backgroundColor: colors.borderLight, marginVertical: 4 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Skeleton width={60} height={40} borderRadius={8} />
                    <Skeleton width={60} height={40} borderRadius={8} />
                    <Skeleton width={60} height={40} borderRadius={8} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={s.container}>
        <AppHeaderBar title="Ticket Details" backFallback="/tickets/index" topInset={topInset} />
        <View style={isDesktop && s.desktopShellWrapper}>
          <View style={isDesktop && s.desktopShell}>
            <View style={s.loadingState}>
              <View style={s.emptyIconContainer}>
                <Ionicons name="ticket-outline" size={48} color={colors.textTertiary} />
              </View>
              <Text style={s.emptyTitle}>Ticket Not Found</Text>
              <Pressable onPress={() => goBackOrReplace('/(tabs)')}>
                <Text style={s.backLink}>Go Back</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const ticketStatus = ticket.status as string | null;
  const statusInfo =
    ticketStatus === 'confirmed' ? { color: CultureTokens.teal,      bg: CultureTokens.teal + '20',      label: 'Confirmed',      icon: 'checkmark-circle' as const } :
    ticketStatus === 'pending'   ? { color: CultureTokens.gold,   bg: CultureTokens.gold + '20',   label: 'Payment Pending',icon: 'time'             as const } :
    ticketStatus === 'used'      ? { color: colors.textSecondary,    bg: colors.borderLight,             label: 'Scanned',        icon: 'checkmark-done'   as const } :
    ticketStatus === 'cancelled' ? { color: CultureTokens.coral,     bg: CultureTokens.coral + '20',     label: 'Cancelled',      icon: 'close-circle'     as const } :
    ticketStatus === 'expired'   ? { color: CultureTokens.gold,   bg: CultureTokens.gold + '20',   label: 'Expired',        icon: 'time'             as const } :
                                   { color: colors.textSecondary,    bg: colors.borderLight,             label: ticketStatus || 'Unknown', icon: 'help-circle' as const };

  const isActive  = ticket.status === 'confirmed';
  const isScanned = ticket.status === 'used';
  const bannerColor = ticket.imageColor || CultureTokens.indigo;

  return (
    <View style={s.container}>
      <AppHeaderBar
        title="Ticket Details"
        backFallback="/tickets/index"
        topInset={topInset}
        rightAction={{ icon: 'share-outline', onPress: handleShare, label: 'Share' }}
      />
      <View style={[isDesktop && s.desktopShellWrapper]}>
        <View style={[isDesktop && s.desktopShell, { paddingHorizontal: hPad }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + bottomInset }}>
            {/* Ticket card */}
            <View style={s.ticketContainer}>
              <View style={[s.ticketTop, { backgroundColor: bannerColor }]}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }} />
                <View style={s.ticketTopOverlay}>
                  <View style={[s.statusBadge, { backgroundColor: statusInfo.bg, borderColor: statusInfo.color + '40', borderWidth: 1 }]}>
                    <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
                    <Text style={[s.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </View>
                  <Ionicons name="ticket" size={32} color="rgba(255,255,255,0.8)" />
                </View>
              </View>

              {/* Tear notch matching dynamic background color */}
              <View style={s.ticketNotchContainer}>
                 <View style={[s.ticketNotchBackground, { backgroundColor: colors.background }]} />
                 <View style={s.ticketNotch}>
                   <View style={[s.notchCircle, s.notchLeft, { backgroundColor: colors.background, borderColor: colors.borderLight }]} />
                   <View style={[s.notchLine, { borderColor: colors.borderLight }]} />
                   <View style={[s.notchCircle, s.notchRight, { backgroundColor: colors.background, borderColor: colors.borderLight }]} />
                 </View>
              </View>

              <View style={s.ticketBody}>
                <Text style={s.eventTitle}>{ticket.eventTitle}</Text>
                <View style={s.cpidRow}>
                  <Ionicons name="finger-print-outline" size={15} color={CultureTokens.indigo} />
                  <Text style={s.cpidText}>CPID: {ticket.culturePassId || ticket.cpTicketId || ticket.id}</Text>
                </View>

                <View style={s.infoGrid}>
                  {ticket.eventDate && (
                    <View style={s.infoItem}>
                      <View style={[s.infoIconWrap, { backgroundColor: CultureTokens.indigo + '15' }]}>
                        <Ionicons name="calendar" size={16} color={CultureTokens.indigo} />
                      </View>
                      <View>
                        <Text style={s.infoLabel}>Date</Text>
                        <Text style={s.infoValue}>{formatDate(ticket.eventDate)}</Text>
                      </View>
                    </View>
                  )}
                  {ticket.eventTime && (
                    <View style={s.infoItem}>
                      <View style={[s.infoIconWrap, { backgroundColor: CultureTokens.gold + '15' }]}>
                        <Ionicons name="time" size={16} color={CultureTokens.gold} />
                      </View>
                      <View>
                        <Text style={s.infoLabel}>Time</Text>
                        <Text style={s.infoValue}>{ticket.eventTime}</Text>
                      </View>
                    </View>
                  )}
                  {ticket.eventVenue && (
                    <View style={s.infoItem}>
                      <View style={[s.infoIconWrap, { backgroundColor: CultureTokens.teal + '15' }]}>
                        <Ionicons name="location" size={16} color={CultureTokens.teal} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.infoLabel}>Venue</Text>
                        <Text style={s.infoValue} numberOfLines={2}>{ticket.eventVenue}</Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={s.divider} />

                <View style={s.detailsRow}>
                  {ticket.tierName && (
                    <View style={s.detailItem}>
                      <Text style={s.detailLabel}>Tier</Text>
                      <Text style={s.detailValue}>{ticket.tierName}</Text>
                    </View>
                  )}
                  <View style={s.detailItem}>
                    <Text style={s.detailLabel}>Quantity</Text>
                    <Text style={s.detailValue}>{ticket.quantity || 1}</Text>
                  </View>
                  <View style={s.detailItem}>
                    <Text style={s.detailLabel}>Total</Text>
                    <Text style={[s.detailValue, { color: CultureTokens.indigo }]}>
                      ${((ticket.totalPriceCents || 0) / 100).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {ticket.ticketCode && (
                  <>
                    <View style={s.divider} />
                    <View style={s.qrSection}>
                      <Text style={s.qrTitle}> 
                        {isScanned ? 'Ticket Scanned' : isActive ? 'Scan at Entry' : 'Ticket Code'}
                      </Text>
                      {(ticket.qrCode || cachedQr) && isActive ? (
                        <View style={s.qrImageContainer}>
                           <Image source={{ uri: ticket.qrCode ?? cachedQr ?? '' }} style={s.qrImage} contentFit="contain" />
                        </View>
                      ) : isScanned ? (
                        <View style={s.scannedOverlay}>
                          <Ionicons name="checkmark-circle" size={48} color={colors.textSecondary} />
                          <Text style={s.scannedText}>Checked In</Text>
                          {ticket.scannedAt && (
                            <Text style={s.scannedTime}> 
                              {new Date(ticket.scannedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                            </Text>
                          )}
                        </View>
                      ) : null}
                      <Text style={s.ticketCodeText}>{ticket.ticketCode}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Add to wallet */}
            {isActive && (
              <View style={s.walletSection}>
                <Text style={s.walletTitle}>Add to Wallet</Text>
                <View style={s.walletButtons}>
                  {(Platform.OS === 'ios' || isWeb) && (
                    <Pressable 
                      style={({pressed}) => [s.walletBtn, { backgroundColor: '#111111', borderWidth: 1, borderColor: '#333' }, pressed && { opacity: 0.8 }]} 
                      onPress={() => handleAddToWallet('apple')}
                    >
                      <Ionicons name="wallet" size={20} color="#FFF" />
                      <Text style={s.walletBtnTextApple}>Apple Wallet</Text>
                    </Pressable>
                  )}
                  <Pressable 
                    style={({pressed}) => [s.walletBtn, { backgroundColor: '#4285F4' }, pressed && { opacity: 0.8 }]} 
                    onPress={() => handleAddToWallet('google')}
                  >
                    <Ionicons name="logo-google" size={18} color="#FFF" />
                    <Text style={s.walletBtnTextGoogle}>Google Wallet</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Actions list */}
            <View style={s.actionsSection}>
              <Pressable
                style={({pressed}) => [s.actionBtn, pressed && { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: ticket.eventId } })}
              >
                <View style={[s.actionIcon, { backgroundColor: CultureTokens.indigo + '15' }]}>
                  <Ionicons name="calendar" size={18} color={CultureTokens.indigo} />
                </View>
                <Text style={s.actionText}>View Event</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>

              <Pressable 
                style={({pressed}) => [s.actionBtn, pressed && { backgroundColor: colors.backgroundSecondary }]} 
                onPress={handleShare}
              >
                <View style={[s.actionIcon, { backgroundColor: CultureTokens.gold + '15' }]}>
                  <Ionicons name="share-outline" size={18} color={CultureTokens.gold} />
                </View>
                <Text style={s.actionText}>Share Ticket</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </Pressable>

              {(isActive || isScanned) && (
                <Pressable 
                   style={({pressed}) => [s.actionBtn, pressed && { backgroundColor: colors.backgroundSecondary }]} 
                   onPress={handlePrint}
                >
                  <View style={[s.actionIcon, { backgroundColor: CultureTokens.teal + '15' }]}>
                    <Ionicons name="print-outline" size={18} color={CultureTokens.teal} />
                  </View>
                  <Text style={s.actionText}>Print Ticket / Badge</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>
              )}

              {isActive && (
                <Pressable 
                  style={({pressed}) => [s.actionBtn, { borderBottomWidth: 0 }, pressed && { backgroundColor: colors.backgroundSecondary }]} 
                  onPress={handleCancel}
                >
                  <View style={[s.actionIcon, { backgroundColor: CultureTokens.coral + '15' }]}>
                    <Ionicons name="close-circle-outline" size={18} color={CultureTokens.coral} />
                  </View>
                  <Text style={[s.actionText, { color: CultureTokens.coral }]}>Cancel Ticket</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  desktopShellWrapper: { flex: 1, alignItems: 'center' },
  desktopShell:    { width: '100%', maxWidth: 640 },

  loadingState:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:        { fontSize: 15, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  emptyIconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:         { fontSize: 17, fontFamily: 'Poppins_700Bold', marginTop: 8, color: colors.text },
  backLink:           { fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginTop: 8, color: CultureTokens.indigo },

  ticketContainer: { 
    marginHorizontal: CardTokens.padding + 4, 
    marginTop: 12, 
    borderRadius: CardTokens.radiusLarge + 4, 
    overflow: 'hidden', 
    backgroundColor: colors.surface, 
    borderWidth: 1, 
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0px 8px 32px rgba(0,0,0,0.5)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
      android: { elevation: 12 }
    })
  },
  ticketTop:       { height: 120, justifyContent: 'center', position: 'relative' },
  ticketTopOverlay:{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 1 },
  statusBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText:      { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  ticketNotchContainer: { position: 'relative', height: 20, marginTop: -10, marginBottom: -10, zIndex: 2 },
  ticketNotchBackground: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, opacity: 0 },
  ticketNotch:  { flexDirection: 'row', alignItems: 'center', height: '100%' },
  notchCircle:  { width: 30, height: 30, borderRadius: 15, borderWidth: 1 },
  notchLeft:    { marginLeft: -16 },
  notchRight:   { marginRight: -16 },
  notchLine:    { flex: 1, height: 1, borderStyle: 'dashed', borderWidth: 1, opacity: 0.5, marginHorizontal: 10 },

  ticketBody:   { padding: CardTokens.paddingLarge + 4 },
  eventTitle:   { fontSize: 22, fontFamily: 'Poppins_700Bold', marginBottom: 24, color: colors.text },
  cpidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CultureTokens.indigo + '33',
    backgroundColor: CultureTokens.indigo + '14',
    marginBottom: 16,
  },
  cpidText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.indigo },
  infoGrid:     { gap: 16 },
  infoItem:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoLabel:    { fontSize: 11, fontFamily: 'Poppins_500Medium', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textSecondary },
  infoValue:    { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  divider:      { height: 1, backgroundColor: colors.borderLight, marginVertical: 20 },
  detailsRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  detailItem:   { alignItems: 'center', flex: 1 },
  detailLabel:  { fontSize: 11, fontFamily: 'Poppins_500Medium', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, color: colors.textSecondary },
  detailValue:  { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.text },

  qrSection:        { alignItems: 'center', gap: 16 },
  qrTitle:          { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  qrImageContainer: { padding: CardTokens.padding, backgroundColor: '#FFFFFF', borderRadius: CardTokens.radius, borderWidth: 1, borderColor: colors.borderLight },
  qrImage:          { width: 220, height: 220 },
  scannedOverlay:   { alignItems: 'center', gap: 6, paddingVertical: 16 },
  scannedText:      { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.textSecondary },
  scannedTime:      { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textTertiary },
  ticketCodeText:   { fontSize: 20, fontFamily: 'Poppins_700Bold', letterSpacing: 3, color: CultureTokens.indigo, marginTop: 4 },

  walletSection: { marginHorizontal: CardTokens.padding + 4, marginTop: 24 },
  walletTitle:   { fontSize: 11, fontFamily: 'Poppins_600SemiBold', marginBottom: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.textTertiary },
  walletButtons: { flexDirection: 'row', gap: 12 },
  walletBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 13 },
  walletBtnTextApple: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.background },
  walletBtnTextGoogle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.background },

  actionsSection: { marginHorizontal: CardTokens.padding + 4, marginTop: 24, borderRadius: CardTokens.radius, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', gap: 16, padding: CardTokens.padding, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  actionIcon:     { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  actionText:     { flex: 1, fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
});