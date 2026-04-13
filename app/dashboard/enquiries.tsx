import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScreenStateCard, ScreenStateLoading } from '@/components/ui/ScreenState';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CardTokens, FontFamily, FontSize, IconSize, Spacing, TextStyles } from '@/constants/theme';

function EnquiriesScreenContent() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { isDesktop } = useLayout();
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const [replyText, setReplyText] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(typeof requestId === 'string' ? requestId : null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['organizer', 'contact-requests'],
    queryFn: () => api.events.listContactRequests(),
    enabled: Boolean(userId),
  });

  const requests = useMemo(() => data?.requests ?? [], [data?.requests]);
  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedId) ?? requests[0] ?? null,
    [requests, selectedId],
  );

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRequest) throw new Error('No enquiry selected');
      const message = replyText.trim();
      if (message.length < 2) throw new Error('Reply is too short');
      return api.events.replyContactRequest(selectedRequest.id, message);
    },
    onSuccess: async () => {
      setReplyText('');
      await queryClient.invalidateQueries({ queryKey: ['organizer', 'contact-requests'] });
      Alert.alert('Reply sent', 'Your response has been sent to the attendee.');
    },
    onError: (mutationError: unknown) => {
      const message = mutationError instanceof Error ? mutationError.message : 'Could not send reply.';
      Alert.alert('Reply failed', message);
    },
  });

  if (!userId) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ScreenStateCard
          icon="lock-closed-outline"
          title="Sign in required"
          message="You need to be signed in as an organiser to view enquiries."
          actionLabel="Go to login"
          onAction={() => router.replace('/(onboarding)/login')}
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ScreenStateLoading label="Loading enquiries..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ScreenStateCard
          icon="alert-circle-outline"
          title="Could not load enquiries"
          message="Please refresh and try again."
          actionLabel="Back to dashboard"
          onAction={() => router.replace('/dashboard/organizer')}
          tone="error"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderLight, backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={IconSize.lg} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Organiser enquiries</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Event contact threads from attendees
          </Text>
        </View>
      </View>

      {requests.length === 0 ? (
        <View style={styles.center}>
          <ScreenStateCard
            icon="chatbubble-outline"
            title="No enquiries yet"
            message="When attendees tap Contact organiser, threads will appear here."
          />
        </View>
      ) : (
        <View style={[styles.content, !isDesktop && styles.contentMobile]}>
          <ScrollView
            style={[styles.listCol, !isDesktop && styles.listColMobile]}
            contentContainerStyle={styles.listContent}
          >
            {requests.map((request) => {
              const selected = selectedRequest?.id === request.id;
              return (
                <Pressable
                  key={request.id}
                  onPress={() => setSelectedId(request.id)}
                  style={[
                    styles.listCard,
                    {
                      borderColor: selected ? colors.primary : colors.borderLight,
                      backgroundColor: selected ? colors.primarySoft : colors.surface,
                    },
                  ]}
                >
                  <Text style={[styles.listEvent, { color: colors.text }]} numberOfLines={1}>
                    {request.eventTitle ?? 'Event enquiry'}
                  </Text>
                  <Text style={[styles.listMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                    From {request.requesterHandle || request.requesterEmail || request.requesterId}
                  </Text>
                  <Text style={[styles.listPreview, { color: colors.textSecondary }]} numberOfLines={2}>
                    {request.message}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View
            style={[
              styles.threadCol,
              !isDesktop && styles.threadColMobile,
              { borderColor: colors.borderLight, backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.threadTitle, { color: colors.text }]}>{selectedRequest?.eventTitle ?? 'Thread'}</Text>
            <ScrollView style={styles.threadFeed} contentContainerStyle={styles.threadFeedContent}>
              {(selectedRequest?.thread?.length ? selectedRequest.thread : []).map((item) => {
                const isOrganizer = item.authorRole === 'organizer';
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.bubble,
                      {
                        alignSelf: isOrganizer ? 'flex-end' : 'flex-start',
                        backgroundColor: isOrganizer ? colors.primarySoft : colors.backgroundSecondary,
                        borderColor: colors.borderLight,
                      },
                    ]}
                  >
                    <Text style={[styles.bubbleRole, { color: isOrganizer ? colors.primary : colors.textSecondary }]}>
                      {isOrganizer ? 'You' : 'Attendee'}
                    </Text>
                    <Text style={[TextStyles.body, { color: colors.text }]}>{item.message}</Text>
                  </View>
                );
              })}
            </ScrollView>

            <View style={[styles.replyRow, { borderTopColor: colors.borderLight }]}>
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Write a reply..."
                placeholderTextColor={colors.textTertiary}
                style={[styles.replyInput, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.background }]}
                multiline
              />
              <Pressable
                onPress={() => replyMutation.mutate()}
                style={[styles.replyBtn, { backgroundColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Send organiser reply"
              >
                <Ionicons name="send" size={IconSize.sm + 2} color={colors.background} />
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: IconSize.xl + 2,
    height: IconSize.xl + 2,
    borderRadius: CardTokens.radius - 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...TextStyles.title3 },
  subtitle: { ...TextStyles.caption, marginTop: Spacing.xs - 2 },
  content: { flex: 1, flexDirection: 'row' },
  contentMobile: { flexDirection: 'column' },
  listCol: { width: 320, borderRightWidth: 1 },
  listColMobile: { width: '100%', maxHeight: 260, borderRightWidth: 0, borderBottomWidth: 1 },
  listContent: { padding: Spacing.md, gap: Spacing.sm },
  listCard: {
    borderWidth: 1,
    borderRadius: CardTokens.radius,
    padding: CardTokens.padding,
    gap: Spacing.xs,
  },
  listEvent: { fontSize: FontSize.body2, fontFamily: FontFamily.semibold },
  listMeta: { ...TextStyles.caption },
  listPreview: { ...TextStyles.caption },
  threadCol: {
    flex: 1,
    borderLeftWidth: 1,
  },
  threadColMobile: { borderLeftWidth: 0 },
  threadTitle: {
    ...TextStyles.title3,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  threadFeed: { flex: 1 },
  threadFeedContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.sm },
  bubble: {
    maxWidth: '85%',
    borderWidth: 1,
    borderRadius: CardTokens.radius,
    paddingHorizontal: CardTokens.padding,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs - 2,
  },
  bubbleRole: { ...TextStyles.badgeCaps },
  replyRow: {
    borderTopWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  replyInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: CardTokens.radius,
    paddingHorizontal: CardTokens.padding,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.body2,
    fontFamily: FontFamily.regular,
  },
  replyBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function OrganizerEnquiriesScreen() {
  return (
    <ErrorBoundary>
      <EnquiriesScreenContent />
    </ErrorBoundary>
  );
}
