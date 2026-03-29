import React from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  ScrollView, 
  Platform, 
  Alert, 
  Share 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/query-client';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { AuthGuard } from '@/components/AuthGuard';
import { CultureTokens, gradients } from '@/constants/theme';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextStyles } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Ticket {
  id: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string | null;
  eventTime: string | null;
  eventVenue: string | null;
  tierName: string | null;
  quantity: number | null;
  totalPriceCents: number | null;
  currency: string | null;
  status: string | null;
  paymentStatus?: string | null;
  priority?: 'low' | 'normal' | 'high' | 'vip' | null;
  ticketCode: string | null;
  imageColor: string | null;
  createdAt: string | null;
}

function formatDate(dateStr: string | null, options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, options).format(d);
}

async function handleShare(ticket: Ticket) {
  try {
    const dateStr  = ticket.eventDate ? formatDate(ticket.eventDate) : '';
    const timeStr  = ticket.eventTime ? ` at ${ticket.eventTime}` : '';
    const venueStr = ticket.eventVenue ? `\nVenue: ${ticket.eventVenue}` : '';
    const shareUrl = ticket.eventId
      ? `https://culturepass.app/event/${ticket.eventId}`
      : 'https://culturepass.app';
    await Share.share({
      message: `Check out my ticket for ${ticket.eventTitle}!\n${dateStr}${timeStr}${venueStr}\n\n${shareUrl}`,
      title:   ticket.eventTitle,
      url:     shareUrl,
    });
  } catch {}
}

interface TicketCardProps {
  ticket: Ticket;
  onCancel: (t: Ticket) => void;
}

function TicketCardInner({ ticket, onCancel }: TicketCardProps) {
  const colors = useColors();
  const isActive = ticket.status === 'confirmed';

  const statusStyle = 
    ticket.status === 'confirmed' ? { bg: CultureTokens.teal + '20', color: CultureTokens.teal, label: 'Confirmed' } :
    ticket.status === 'used'      ? { bg: colors.surfaceElevated, color: colors.textTertiary, label: 'Used' } :
    ticket.status === 'cancelled' ? { bg: CultureTokens.coral + '15', color: CultureTokens.coral, label: 'Cancelled' } :
    ticket.status === 'expired'   ? { bg: CultureTokens.gold + '15', color: CultureTokens.gold, label: 'Expired' } :
                                    { bg: colors.surfaceElevated, color: colors.textTertiary, label: ticket.status || 'Unknown' };

  const bannerColor = ticket.imageColor || CultureTokens.indigo;

  return (
    <Card 
      style={styles.ticketCard}
      padding={0}
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/tickets/[id]', params: { id: ticket.id } });
      }}
    >
      <View style={styles.ticketTapArea}>
        {/* Banner */}
        <View style={[styles.ticketBanner, { backgroundColor: bannerColor }]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.bannerContent}>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={[styles.statusText, { color: '#FFFFFF' }]}>{statusStyle.label}</Text>
              </View>
            </View>

            {isActive && (
              <View style={[styles.liveBadge, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }]}>
                <View style={[styles.liveDot, { backgroundColor: '#FFFFFF' }]} />
                <Text style={[styles.liveText, { color: '#FFFFFF' }]}>Active Ticket</Text>
              </View>
            )}
          </View>
        </View>

        {/* Main content */}
        <View style={styles.ticketBody}>
          <Text style={[TextStyles.title3, { color: colors.text }]} numberOfLines={2}>
            {ticket.eventTitle}
          </Text>

          <View style={styles.dateTimeContainer}>
            <View style={[styles.dateBlock, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[TextStyles.title2, { color: colors.text, lineHeight: 28 }]}>
                {ticket.eventDate ? new Date(ticket.eventDate).getDate() : '--'}
              </Text>
              <Text style={[TextStyles.captionSemibold, { color: colors.textSecondary }]}>
                {ticket.eventDate ? formatDate(ticket.eventDate, { month: 'short' }).toUpperCase() : '---'}
              </Text>
            </View>

            <View style={styles.timeVenueBlock}>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color={CultureTokens.indigo} />
                <Text style={[TextStyles.headline, { color: colors.text }]}>{ticket.eventTime || 'TBA'}</Text>
              </View>
              <View style={styles.venueRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={[TextStyles.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                  {ticket.eventVenue || 'Online / TBA'}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.ticketFooter, { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 12 }]}>
            <View style={styles.metaLeft}>
              <View style={[styles.tierBadge, { backgroundColor: CultureTokens.indigo + '15' }]}>
                <Text style={[TextStyles.badge, { color: CultureTokens.indigo }]}>{ticket.tierName || 'Standard'}</Text>
              </View>
              <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
                ×{ticket.quantity || 1}
              </Text>
            </View>

            <Text style={[TextStyles.headline, { color: colors.text }]}>
              ${( (ticket.totalPriceCents || 0) / 100 ).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Action bar */}
      {isActive && (
        <View style={[styles.actionBar, { borderTopColor: colors.borderLight, backgroundColor: colors.backgroundSecondary + '40' }]}>
          <View style={styles.actionIcons}>
            <Pressable
              style={styles.iconButton}
              onPress={() => handleShare(ticket)}
              accessibilityRole="button"
              accessibilityLabel="Share ticket"
            >
              <Ionicons name="share-social-outline" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => Alert.alert('Saved to Wallet')}
              accessibilityRole="button"
              accessibilityLabel="Save to wallet"
            >
              <Ionicons name="wallet-outline" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => onCancel(ticket)}
            accessibilityRole="button"
            accessibilityLabel="Cancel ticket"
          >
            <Text style={[TextStyles.labelSemibold, { color: CultureTokens.coral }]}>Cancel Ticket</Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

TicketCardInner.displayName = 'TicketCard';
const TicketCard = React.memo(TicketCardInner);

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors = useColors();
  const { isDesktop } = useLayout();
  const { userId } = useAuth();

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets', userId],
    enabled: !!userId,
  });

  const cancelMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      await apiRequest('PUT', `/api/tickets/${ticketId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', userId] });
      Alert.alert('Ticket Cancelled', 'Your ticket has been cancelled. Refund processing may take 5–7 business days.');
    },
  });

  const handleCancel = (ticket: Ticket) => {
    Alert.alert(
      'Cancel Ticket',
      `Are you sure you want to cancel "${ticket.eventTitle}"?`,
      [
        { text: 'Keep Ticket', style: 'cancel' },
        {
          text: 'Cancel Ticket',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            cancelMutation.mutate(ticket.id);
          },
        },
      ]
    );
  };

  const activeTickets = tickets.filter(t => t.status === 'confirmed');
  const pastTickets = tickets.filter(t => t.status !== 'confirmed');

  return (
    <AuthGuard icon="ticket-outline" title="My Tickets" message="Sign in to view and manage your event tickets.">
      <Stack.Screen options={{ title: 'My Tickets | CulturePass' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={gradients.culturepassBrand as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: topInset }}
        >
          <View style={styles.header}>
            <BackButton fallback="/(tabs)/profile" color="#FFFFFF" style={styles.headerBackBtn} />
            <Text style={[TextStyles.headline, { color: '#FFFFFF', flex: 1, textAlign: 'center', marginRight: 44 }]}>My Tickets</Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 40 + (Platform.OS === 'web' ? 0 : insets.bottom) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentWrapper, isDesktop && styles.contentWrapperDesktop]}>
            {isLoading ? (
              <View style={{ gap: 16, paddingTop: 12 }}>
                {[1, 2, 3].map(i => (
                  <View key={i} style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <Skeleton width="100%" height={72} borderRadius={0} />
                    <View style={styles.ticketBody}>
                      <Skeleton width="80%" height={24} borderRadius={6} style={{ marginBottom: 16 }} />
                      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                        <Skeleton width={64} height={64} borderRadius={12} />
                        <View style={{ flex: 1, gap: 8 }}>
                          <Skeleton width="50%" height={16} borderRadius={4} />
                          <Skeleton width="70%" height={14} borderRadius={4} />
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
                        <Skeleton width={100} height={28} borderRadius={8} />
                        <Skeleton width={60} height={24} borderRadius={4} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : tickets.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                  <Ionicons name="ticket-outline" size={48} color={CultureTokens.indigo} />
                </View>
                <Text style={[TextStyles.title2, { color: colors.text }]}>No Tickets Yet</Text>
                <Text style={[TextStyles.body, { color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 }]}>
                  When you book tickets for events or festivals, they will appear here.
                </Text>
                <Button
                  onPress={() => router.push('/(tabs)/explore')}
                  variant="primary"
                  style={{ marginTop: 12, paddingHorizontal: 32 }}
                  leftIcon="search-outline"
                >
                  Discover Events
                </Button>
              </View>
            ) : (
              <>
                {activeTickets.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                      Upcoming • {activeTickets.length}
                    </Text>
                    {activeTickets.map(ticket => (
                      <TicketCard key={ticket.id} ticket={ticket} onCancel={handleCancel} />
                    ))}
                  </View>
                )}

                {pastTickets.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                      Past Tickets • {pastTickets.length}
                    </Text>
                    {pastTickets.map(ticket => (
                      <TicketCard key={ticket.id} ticket={ticket} onCancel={handleCancel} />
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 12 },
  contentWrapper: { paddingHorizontal: 16 },
  contentWrapperDesktop: {
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 0,
  },

  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 14 
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },

  // Ticket Card
  ticketCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    ...Platform.select({ web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 } }),
  },
  ticketTapArea: { width: '100%' },

  // Banner
  ticketBanner: { height: 72, justifyContent: 'center' },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,200,140,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,200,140,0.35)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C88C',
  },
  liveText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#00C88C',
  },

  // Perforation
  perfDivider: {
    height: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: 16,
  },

  // Body
  ticketBody: { padding: 16 },
  ticketTitle: {
    fontSize: 19,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 26,
    marginBottom: 16,
  },

  dateTimeContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dateBlock: {
    alignItems: 'center',
    backgroundColor: 'rgba(100,100,120,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 64,
  },
  dayNumber: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 28,
  },
  monthText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#888',
    marginTop: 2,
  },
  timeVenueBlock: { flex: 1 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  timeText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  venueText: {
    fontSize: 14,
    flex: 1,
  },

  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: CultureTokens.indigo,
  },
  qtyText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  priceText: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },

  qrContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  qrText: {
    fontSize: 15,
    fontFamily: 'monospace',
    letterSpacing: 1.2,
    flex: 1,
  },

  // Action Bar
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(120,120,140,0.08)',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: CultureTokens.coral + '15',
  },
  cancelText: {
    color: CultureTokens.coral,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
    gap: 16,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(120,120,140,0.12)',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  browseButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
});
