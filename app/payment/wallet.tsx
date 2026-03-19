import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api, type MembershipSummary, type RewardsSummary } from '@/lib/api';
import type { Ticket as ApiTicket } from '@/shared/schema';
import { AuthGuard } from '@/components/AuthGuard';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/constants/theme';
import { AppHeaderBar } from '@/components/AppHeaderBar';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WalletTicket {
  id: string;
  eventTitle: string;
  eventDate: string | null;
  eventTime: string | null;
  eventVenue: string | null;
  tierName: string | null;
  quantity: number | null;
  status: ApiTicket['status'];
  imageColor: string | null;
  price?: number | null;
}

function toWalletTicket(ticket: any): WalletTicket {
  return {
    id: ticket.id,
    eventTitle: ticket.eventTitle ?? ticket.eventName ?? ticket.title ?? 'Untitled Event',
    eventDate: ticket.eventDate ?? ticket.date ?? null,
    eventTime: ticket.eventTime ?? null,
    eventVenue: ticket.eventVenue ?? ticket.venue ?? null,
    tierName: ticket.tierName ?? null,
    quantity: ticket.quantity ?? null,
    status: ticket.status ?? null,
    imageColor: ticket.imageColor ?? null,
    price: ticket.totalPriceCents != null ? ticket.totalPriceCents / 100 : null,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return 'TBA';
  const d = new Date(dateStr);
  const isThisYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(isThisYear ? {} : { year: 'numeric' }),
  });
}

function isUpcoming(dateStr: string | null): boolean {
  if (!dateStr) return true;
  return new Date(dateStr) >= new Date();
}

const isWeb = Platform.OS === 'web';
const LOYALTY_CYCLE_DAYS = 365;
const LOYALTY_CYCLE_COLORS = [
  CultureTokens.indigo,
  CultureTokens.teal,
  CultureTokens.saffron,
  CultureTokens.coral,
  CultureTokens.gold,
] as const;

// ─── Ticket card ──────────────────────────────────────────────────────────────

interface TicketCardProps { ticket: WalletTicket; }

function TicketCard({
  ticket,
  styles: s,
  onAddAppleWallet,
  onAddGoogleWallet,
  pendingAction,
}: TicketCardProps & {
  styles: ReturnType<typeof getStyles>;
  onAddAppleWallet: (ticketId: string) => void;
  onAddGoogleWallet: (ticketId: string) => void;
  pendingAction: { ticketId: string; provider: 'apple' | 'google' } | null;
}) {
  const accentColor = ticket.imageColor || CultureTokens.indigo;
  const upcoming = isUpcoming(ticket.eventDate);
  const colors = useColors();

  const isApplePending = pendingAction?.ticketId === ticket.id && pendingAction.provider === 'apple';
  const isGooglePending = pendingAction?.ticketId === ticket.id && pendingAction.provider === 'google';

  return (
    <View style={s.ticketCardWrapper}>
      <Pressable
        style={({pressed}) => [s.ticketCard, { borderLeftColor: accentColor, borderLeftWidth: 4 }, pressed && { opacity: 0.9 }]}
        onPress={() => {
          if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: '/tickets/[id]', params: { id: ticket.id } });
        }}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
        accessibilityLabel={`Ticket for ${ticket.eventTitle}`}
      >
        <View style={[s.ticketStatusDot, { backgroundColor: upcoming ? CultureTokens.teal : 'rgba(255,255,255,0.4)' }]} />

        <View style={{ flex: 1 }}>
          <Text style={s.ticketTitle} numberOfLines={1}>{ticket.eventTitle}</Text>
          <View style={s.ticketMeta}>
            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
            <Text style={s.ticketMetaText}>{formatEventDate(ticket.eventDate)}</Text>
            {ticket.eventTime && (
              <>
                <Text style={s.ticketMetaDot}>·</Text>
                <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                <Text style={s.ticketMetaText}>{ticket.eventTime}</Text>
              </>
            )}
          </View>
          {ticket.eventVenue && (
            <View style={s.ticketMeta}>
              <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
              <Text style={s.ticketMetaText} numberOfLines={1}>{ticket.eventVenue}</Text>
            </View>
          )}
        </View>

        <View style={{ alignItems: 'flex-end', gap: 4, paddingBottom: 24 }}>
          {ticket.tierName && (
            <View style={[s.tierPill, { backgroundColor: accentColor + '20' }]}>
              <Text style={[s.tierPillText, { color: accentColor }]}>{ticket.tierName}</Text>
            </View>
          )}
          {ticket.quantity != null && ticket.quantity > 1 && (
            <Text style={s.quantityText}>×{ticket.quantity}</Text>
          )}
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </View>
      </Pressable>

      <View style={s.ticketWalletActions}>
        {(Platform.OS === 'ios' || isWeb) && (
          <Button
            variant="outline"
            size="sm"
            onPress={() => onAddAppleWallet(ticket.id)}
            loading={isApplePending}
            disabled={isGooglePending}
            leftIcon="logo-apple"
            style={{ flex: 1, height: 32, borderRadius: 8 }}
          >
            Apple
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onPress={() => onAddGoogleWallet(ticket.id)}
          loading={isGooglePending}
          disabled={isApplePending}
          leftIcon="logo-google"
          style={{ flex: 1, height: 32, borderRadius: 8 }}
        >
          Google
        </Button>
      </View>
    </View>
  );
}

// ─── Stats box ────────────────────────────────────────────────────────────────

interface StatBoxProps { value: string | number; label: string; icon: string; }

function StatBox({ value, label, icon, styles: s }: StatBoxProps & { styles: ReturnType<typeof getStyles> }) {
  return (
    <View style={s.statBox}>
      <View style={[s.statIconWrap, { backgroundColor: CultureTokens.indigo + '15' }]}>
        <Ionicons name={icon as never} size={20} color={CultureTokens.indigo} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type WalletTab = 'upcoming' | 'past';

export default function WalletScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { isDesktop } = useLayout();
  const insets      = useSafeAreaInsets();
  const topInset    = isWeb ? 0 : insets.top;
  const bottomInset = isWeb ? 34 : insets.bottom;
  const { userId, user }  = useAuth();
  const [tab, setTab] = useState<WalletTab>('upcoming');
  const [pendingTicketWalletAction, setPendingTicketWalletAction] = useState<{ ticketId: string; provider: 'apple' | 'google' } | null>(null);
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tierConfigMap = useMemo<Record<string, { label: string; colors: [string, string]; icon: string }>>(() => ({
    free:    { label: 'Standard', colors: ['#2A2A35', '#1B1B25'], icon: 'shield-outline' },
    plus:    { label: 'Plus',     colors: [CultureTokens.indigo, '#1E1C59'], icon: 'star' },
    premium: { label: 'Premium',  colors: [CultureTokens.saffron, '#CC6F33'], icon: 'diamond' },
    elite:   { label: 'Elite',    colors: [CultureTokens.teal, '#1A8F84'], icon: 'trophy' },
    vip:     { label: 'VIP',      colors: [CultureTokens.coral, '#CC4745'], icon: 'ribbon' },
    pro:     { label: 'Pro',      colors: ['#3A86FF', '#285FCC'], icon: 'briefcase' },
  }), []);

  const { data: ticketsData = [], isLoading } = useQuery<WalletTicket[]>({
    queryKey: ['tickets', 'wallet', userId],
    queryFn: async () => {
      const tickets = await api.tickets.forUser(userId!);
      return Array.isArray(tickets) ? tickets.map(toWalletTicket) : [];
    },
    enabled: !!userId,
  });

  const { data: membership } = useQuery<MembershipSummary>({
    queryKey: ['membership', userId],
    queryFn: () => api.membership.get(userId!),
    enabled: !!userId,
  });

  const { data: rewards } = useQuery<RewardsSummary>({
    queryKey: ['rewards', userId],
    queryFn: () => api.rewards.get(userId!),
    enabled: !!userId,
  });

  const confirmed     = ticketsData.filter((t) => t.status === 'confirmed' || t.status === 'used');
  const upcoming      = confirmed.filter((t) =>  isUpcoming(t.eventDate));
  const past          = confirmed.filter((t) => !isUpcoming(t.eventDate));
  const tierConfig    = tierConfigMap[membership?.tier || 'free'] ?? tierConfigMap.free;
  const memberSinceDate = useMemo(() => {
    const createdAt = user?.createdAt ? new Date(user.createdAt) : null;
    if (createdAt && !Number.isNaN(createdAt.getTime())) return createdAt;
    if (membership?.expiresAt) {
      const expiresAt = new Date(membership.expiresAt);
      if (!Number.isNaN(expiresAt.getTime())) {
        const estimatedJoin = new Date(expiresAt);
        estimatedJoin.setDate(estimatedJoin.getDate() - LOYALTY_CYCLE_DAYS);
        return estimatedJoin;
      }
    }
    return new Date();
  }, [membership?.expiresAt, user?.createdAt]);
  const loyaltyProgress = useMemo(() => {
    const now = new Date();
    const diffMs = Math.max(now.getTime() - memberSinceDate.getTime(), 0);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const completedCycles = Math.floor(diffDays / LOYALTY_CYCLE_DAYS);
    const dayInCycle = (diffDays % LOYALTY_CYCLE_DAYS) + 1;
    const cyclePercent = Math.min((dayInCycle / LOYALTY_CYCLE_DAYS) * 100, 100);
    const cycleColor = LOYALTY_CYCLE_COLORS[completedCycles % LOYALTY_CYCLE_COLORS.length];
    return {
      completedCycles,
      dayInCycle,
      cyclePercent,
      cycleColor,
    };
  }, [memberSinceDate]);
  const displayTickets = tab === 'upcoming' ? upcoming : past;
  const businessCardQrValue = useMemo(() => {
    if (user?.username) return `https://culturepass.app/u/${encodeURIComponent(user.username)}`;
    return `https://culturepass.app/u/${encodeURIComponent(userId ?? 'guest')}`;
  }, [user?.username, userId]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  const showFlash = (type: 'success' | 'error', text: string) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashMessage({ type, text });
    flashTimerRef.current = setTimeout(() => setFlashMessage(null), 2600);
  };

  const handleAddAppleWalletCard = async () => {
    if (!userId) return;
    try {
      const result = await api.wallet.businessCardApple();
      await Linking.openURL(result.url);
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showFlash('success', 'Apple Wallet business card opened');
    } catch (err) {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', err instanceof Error ? err.message : 'Unable to open Apple Wallet pass.');
    }
  };

  const handleAddGoogleWalletCard = async () => {
    if (!userId) return;
    try {
      const result = await api.wallet.businessCardGoogle();
      await Linking.openURL(result.url);
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showFlash('success', 'Google Wallet business card opened');
    } catch (err) {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', err instanceof Error ? err.message : 'Unable to open Google Wallet pass.');
    }
  };

  const handleAddAppleTicketWallet = async (ticketId: string) => {
    try {
      setPendingTicketWalletAction({ ticketId, provider: 'apple' });
      const result = await api.tickets.walletApple(ticketId);
      await Linking.openURL(result.url);
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showFlash('success', 'Apple Wallet ticket pass opened');
    } catch (err) {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', err instanceof Error ? err.message : 'Unable to open Apple Wallet ticket pass.');
    } finally {
      setPendingTicketWalletAction(null);
    }
  };

  const handleAddGoogleTicketWallet = async (ticketId: string) => {
    try {
      setPendingTicketWalletAction({ ticketId, provider: 'google' });
      const result = await api.tickets.walletGoogle(ticketId);
      await Linking.openURL(result.url);
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showFlash('success', 'Google Wallet ticket pass opened');
    } catch (err) {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showFlash('error', err instanceof Error ? err.message : 'Unable to open Google Wallet ticket pass.');
    } finally {
      setPendingTicketWalletAction(null);
    }
  };

  return (
    <AuthGuard icon="wallet-outline" title="My Wallet" message="Sign in to access your wallet, tickets, and rewards.">
      <View style={styles.container}>
        <AppHeaderBar
          title="My Wallet"
          backFallback="/(tabs)/profile"
          topInset={topInset}
          rightAction={{
            icon: 'ticket',
            onPress: () => router.push('/tickets/index'),
            label: 'My Tickets',
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            { paddingBottom: bottomInset + 24 },
            isDesktop && { alignItems: 'center' },
          ]}
          style={styles.scrollContent}
        >
          <View style={[styles.contentWrap, isDesktop && styles.contentWrapDesktop]}>
          {flashMessage ? (
            <View
              style={[
                styles.flashBanner,
                {
                  backgroundColor:
                    flashMessage.type === 'success'
                      ? CultureTokens.teal + '25'
                      : CultureTokens.coral + '25',
                  borderColor:
                    flashMessage.type === 'success'
                      ? CultureTokens.teal + '55'
                      : CultureTokens.coral + '55',
                },
              ]}
            >
              <Ionicons
                name={flashMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={flashMessage.type === 'success' ? CultureTokens.teal : CultureTokens.coral}
              />
              <Text style={styles.flashBannerText}>{flashMessage.text}</Text>
            </View>
          ) : null}

          {/* Membership card */}
          <View style={styles.membershipCardWrap}>
            <LinearGradient
              colors={tierConfig.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.membershipCard}
            >
              <View style={styles.membershipTop}>
                <View>
                  <Text style={styles.membershipLabel}>CULTUREPASS ID</Text>
                  <Text style={styles.membershipTier}>{tierConfig.label}</Text>
                  <View style={styles.membershipMetaRow}>
                    <Text style={styles.membershipMetaText}>
                      Member since {memberSinceDate.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                    </Text>
                    <View style={[styles.cycleBadge, { borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                      <Text style={[styles.cycleBadgeText, { color: '#FFFFFF' }]}>
                        Day {loyaltyProgress.dayInCycle}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.membershipIconWrap}>
                  <Ionicons name={tierConfig.icon as never} size={28} color="rgba(255,255,255,1)" />
                </View>
              </View>

              <View style={styles.cycleTrack}>
                <View
                  style={[
                    styles.cycleFill,
                    {
                      width: `${loyaltyProgress.cyclePercent}%`,
                      backgroundColor: '#FFFFFF',
                      ...Platform.select({ web: { boxShadow: '0px 0px 4px rgba(255,255,255,0.5)' }, default: { shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 4 } }),
                    },
                  ]}
                />
              </View>

              <View style={styles.membershipBottom}>
                <View>
                  <Text style={styles.membershipStatLabel}>EVENTS</Text>
                  <Text style={styles.membershipStatValue}>{membership?.eventsAttended ?? confirmed.length}</Text>
                </View>
                <View>
                  <Text style={styles.membershipStatLabel}>CYCLE</Text>
                  <Text style={styles.membershipStatValue}>Year {loyaltyProgress.completedCycles + 1}</Text>
                </View>
                {membership?.cashbackMultiplier != null && membership.cashbackMultiplier > 1 && (
                  <View>
                    <Text style={styles.membershipStatLabel}>REBATE</Text>
                    <Text style={styles.membershipStatValue}>{((membership.cashbackMultiplier - 1) * 100).toFixed(0)}%</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* Rewards strip */}
          <View style={[styles.rewardsStrip, { borderColor: colors.borderLight }]}>
            <View style={styles.rewardsLeft}>
              <View style={[styles.rewardsIconWrap, { backgroundColor: CultureTokens.gold + '15' }]}>
                <Ionicons name="gift" size={18} color={CultureTokens.gold} />
              </View>
              <View>
                <Text style={styles.rewardsTitle}>
                  {rewards?.tierLabel ?? 'Silver'} Rewards
                </Text>
                <Text style={styles.rewardsSub}>
                  {rewards?.nextTierLabel
                    ? `${rewards.pointsToNextTier} pts to ${rewards.nextTierLabel}`
                    : 'Top tier unlocked'}
                </Text>
              </View>
            </View>
            <View style={styles.rewardsPointsWrap}>
              <Text style={styles.rewardsPoints}>
                {rewards?.points ?? 0}
              </Text>
              <Text style={styles.rewardsPointsLabel}>PTS</Text>
            </View>
          </View>

          {/* Upgrade prompt for free tier */}
          {(!membership || membership.tier === 'free') && (
            <Pressable
              style={({pressed}) => [styles.upgradePrompt, pressed && { opacity: 0.8 }]}
              onPress={() => router.push({ pathname: '/membership/upgrade' } as any)}
            >
              <Ionicons name="star" size={18} color={CultureTokens.gold} />
              <Text style={styles.upgradePromptText}>
                Upgrade to Plus for 2% cashback on all tickets
              </Text>
              <Ionicons name="chevron-forward" size={16} color={CultureTokens.gold} />
            </Pressable>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatBox value={upcoming.length}  label="Upcoming" icon="calendar" styles={styles} />
            <View style={styles.statsDivider} />
            <StatBox value={past.length}      label="Attended" icon="checkmark-circle" styles={styles} />
            <View style={styles.statsDivider} />
            <StatBox value={confirmed.length} label="Total"    icon="ticket" styles={styles} />
          </View>

          {/* Apple/Google Wallet promo */}
          <View style={styles.digitalWalletRow}>
            {(Platform.OS === 'ios' || isWeb) && (
            <Pressable
              style={({ pressed }) => [
                styles.walletPassBtn,
                { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handleAddAppleWalletCard}
            >
              <Ionicons name="logo-apple" size={20} color="#fff" />
              <View>
                <Text style={styles.walletPassTextLight}>Apple Wallet</Text>
                <Text style={styles.walletPassSoonLight}>Add business card</Text>
              </View>
            </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.walletPassBtn,
                { backgroundColor: '#4285F4', opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handleAddGoogleWalletCard}
            >
              <Ionicons name="logo-google" size={18} color="#fff" />
              <View>
                <Text style={styles.walletPassTextLight}>Google Wallet</Text>
                <Text style={styles.walletPassSoonLight}>Add business card</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.businessCardPreview}>
            <View style={styles.businessCardHeader}>
              <Text style={styles.businessCardTitle}>Smart Business Card</Text>
              <Text style={styles.businessCardSub}>Share profile instantly via QR</Text>
            </View>
            <View style={styles.businessCardBody}>
              <View style={styles.businessCardMeta}>
                <Text style={styles.businessCardName}>{user?.displayName ?? user?.username ?? 'CulturePass Member'}</Text>
                <Text style={styles.businessCardId}>{user?.culturePassId ?? userId ?? 'CP-ID'}</Text>
              </View>
              <View style={styles.businessCardQrWrap}>
                <QRCode
                  value={businessCardQrValue}
                  size={86}
                  color={colors.text}
                  backgroundColor="transparent"
                />
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsRow}>
            {(['upcoming', 'past'] as WalletTab[]).map((t) => {
              const isActive = tab === t;
              return (
                <Pressable
                  key={t}
                  style={[
                    styles.tab,
                    isActive
                      ? { backgroundColor: CultureTokens.indigo + '15', borderColor: CultureTokens.indigo + '50' }
                      : { backgroundColor: colors.surface },
                  ]}
                  onPress={() => { if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }}
                >
                  <Text style={[styles.tabText, isActive ? { color: CultureTokens.indigo, fontFamily: 'Poppins_700Bold' } : { color: colors.textSecondary }]}> 
                    {t === 'upcoming'
                      ? `Upcoming${upcoming.length > 0 ? ` (${upcoming.length})` : ''}`
                      : `Past${past.length > 0 ? ` (${past.length})` : ''}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Ticket list */}
          <View style={styles.ticketList}>
            {isLoading ? (
              <>
                {[0, 1, 2].map((k) => (
                  <View key={k} style={[styles.ticketCard, { borderLeftWidth: 4, borderLeftColor: CultureTokens.indigo + '40' }]}>
                    <Skeleton width={8} height={8} borderRadius={4} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <Skeleton width="75%" height={16} borderRadius={8} />
                      <Skeleton width="55%" height={12} borderRadius={6} />
                      <Skeleton width="45%" height={12} borderRadius={6} />
                    </View>
                    <Skeleton width={60} height={24} borderRadius={8} />
                  </View>
                ))}
              </>
            ) : displayTickets.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name={tab === 'upcoming' ? 'ticket-outline' : 'time-outline'}
                  size={48}
                  color={colors.textTertiary}
                />
                <Text style={styles.emptyTitle}>
                  {tab === 'upcoming' ? 'No upcoming tickets' : 'No past events'}
                </Text>
                <Text style={styles.emptySubtitle}> 
                  {tab === 'upcoming'
                    ? 'Browse events and grab your first ticket!'
                    : 'Your attended events will appear here.'}
                </Text>
                {tab === 'upcoming' && (
                  <Pressable
                    style={({pressed}) => [styles.browseBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                    onPress={() => router.push('/(tabs)')}
                  >
                    <Text style={styles.browseBtnText}>Discover Events</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              displayTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  styles={styles}
                  onAddAppleWallet={handleAddAppleTicketWallet}
                  onAddGoogleWallet={handleAddGoogleTicketWallet}
                  pendingAction={pendingTicketWalletAction}
                />
              ))
            )}
          </View>

          {/* View all link */}
          {displayTickets.length > 0 && (
            <Pressable style={({pressed}) => [styles.viewAllBtn, pressed && { opacity: 0.7 }]} onPress={() => router.push('/tickets/index')}>
              <Text style={styles.viewAllBtnText}>View All Tickets</Text>
              <Ionicons name="chevron-forward" size={14} color={CultureTokens.indigo} />
            </Pressable>
          )}
          </View>
        </ScrollView>
      </View>
    </AuthGuard>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  contentWrap: { width: '100%' },
  contentWrapDesktop: { maxWidth: 640 },

  flashBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flashBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
  },

  // Membership card
  membershipCardWrap: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(44,42,114,0.25)' },
      default: {
        shadowColor: CultureTokens.indigo,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  membershipCard: {
    padding: 24,
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 160,
  },
  membershipTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  membershipLabel:    { fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1.2, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' },
  membershipTier:     { fontSize: 24, fontFamily: 'Poppins_700Bold', marginTop: 4, color: '#fff' },
  membershipMetaRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  membershipMetaText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.85)' },
  cycleBadge:         { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  cycleBadgeText:     { fontSize: 11, fontFamily: 'Poppins_700Bold' },
  membershipIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  cycleTrack:         { height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 16 },
  cycleFill:          { height: '100%', borderRadius: 999 },
  membershipBottom:   { flexDirection: 'row', gap: 32 },
  membershipStatLabel:{ fontSize: 10, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.8, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' },
  membershipStatValue:{ fontSize: 18, fontFamily: 'Poppins_700Bold', marginTop: 2, color: '#fff' },

  // Rewards strip
  rewardsStrip: {
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
      default: { elevation: 2 },
    }),
  },
  rewardsLeft:    { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  rewardsIconWrap:{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: CultureTokens.gold + '18' },
  rewardsTitle:   { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 2 },
  rewardsSub:     { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  rewardsPointsWrap: { alignItems: 'flex-end', justifyContent: 'center' },
  rewardsPoints:  { fontSize: 24, fontFamily: 'Poppins_700Bold', color: CultureTokens.gold, lineHeight: 26 },
  rewardsPointsLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.gold, opacity: 0.8, marginTop: 2 },

  // Upgrade prompt
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
    borderWidth: 1,
    backgroundColor: CultureTokens.gold + '15',
    borderColor: CultureTokens.gold + '40',
  },
  upgradePromptText: { flex: 1, fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.gold },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
      default: { elevation: 2 },
    }),
  },
  statBox:      { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue:    { fontSize: 22, fontFamily: 'Poppins_700Bold', color: CultureTokens.indigo },
  statLabel:    { fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 4, color: colors.textSecondary },
  statsDivider: { width: 1, marginVertical: 14, backgroundColor: colors.borderLight },

  // Digital wallet
  digitalWalletRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, gap: 12 },
  walletPassBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
      default: { elevation: 2 },
    }),
  },
  walletPassText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  walletPassSoon: { fontSize: 11, fontFamily: 'Poppins_500Medium', marginTop: 2, color: colors.textSecondary },
  walletPassTextLight: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  walletPassSoonLight: { fontSize: 11, fontFamily: 'Poppins_500Medium', marginTop: 2, color: 'rgba(255,255,255,0.85)' },
  walletPassDisabled: { opacity: 0.6 },

  // Tabs
  tabsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 20 },
  tab:     { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.borderLight },
  tabText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  // Ticket list
  ticketList: { paddingHorizontal: 20, gap: 14 },
  ticketCardWrapper: { position: 'relative', marginBottom: 14 },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 16,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },

  ticketStatusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 2 },
  ticketTitle:     { fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 4, color: colors.text },
  ticketMeta:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  ticketMetaText:  { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  ticketMetaDot:   { fontSize: 12, color: colors.textTertiary, marginHorizontal: 2 },
  tierPill:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tierPillText:    { fontSize: 10, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase' },
  quantityText:    { fontSize: 13, fontFamily: 'Poppins_700Bold', color: colors.textSecondary },
  ticketWalletActions: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    flexDirection: 'row',
    gap: 8,
  },
  ticketWalletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ticketWalletBtnText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
  },

  // Business Card preview
  businessCardPreview: {
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(44,42,114,0.12)' },
      default: {
        shadowColor: CultureTokens.indigo,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  businessCardHeader: { gap: 4 },
  businessCardTitle: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  businessCardSub: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  businessCardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginTop: 8 },
  businessCardMeta: { flex: 1, gap: 8 },
  businessCardName: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },
  businessCardId: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.indigo, letterSpacing: 1.2 },
  businessCardQrWrap: {
    width: 104,
    height: 104,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 10,
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 56, gap: 12 },
  emptyTitle: { fontSize: 19, fontFamily: 'Poppins_700Bold', marginTop: 12, color: colors.text },
  emptySubtitle: { fontSize: 15, fontFamily: 'Poppins_500Medium', textAlign: 'center', paddingHorizontal: 40, color: colors.textSecondary, lineHeight: 22 },
  browseBtn: { marginTop: 20, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, backgroundColor: CultureTokens.indigo },
  browseBtnText: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  // View all
  viewAllBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24, marginTop: 12 },
  viewAllBtnText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.indigo },
});
