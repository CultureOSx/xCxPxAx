import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScreenStateCard, ScreenStateLoading } from '@/components/ui/ScreenState';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { CardTokens, FontFamily, FontSize, IconSize, Spacing, TextStyles } from '@/constants/theme';

function EnquiryThreadScreenContent() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const requestId = typeof id === 'string' ? id : '';
  const { userId } = useAuth();
  const colors = useColors();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['contact-request', requestId],
    queryFn: () => api.events.getContactRequest(requestId),
    enabled: Boolean(userId && requestId),
  });

  const request = data?.request;
  const isOrganizerView = useMemo(() => Boolean(userId && request && request.organizerId === userId), [request, userId]);

  const replyMutation = useMutation({
    mutationFn: async () => {
      const message = reply.trim();
      if (message.length < 2) throw new Error('Reply is too short');
      return api.events.replyContactRequest(requestId, message);
    },
    onSuccess: async () => {
      setReply('');
      await queryClient.invalidateQueries({ queryKey: ['contact-request', requestId] });
      await queryClient.invalidateQueries({ queryKey: ['organizer', 'contact-requests'] });
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
          message="Please sign in to view enquiry threads."
          actionLabel="Go to login"
          onAction={() => router.replace('/(onboarding)/login')}
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ScreenStateLoading label="Loading conversation..." />
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ScreenStateCard
          icon="alert-circle-outline"
          title="Thread unavailable"
          message="This enquiry might have been removed or you may not have access."
          actionLabel="Back"
          onAction={() => router.back()}
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
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {request.eventTitle ?? 'Event enquiry'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {isOrganizerView ? 'Attendee thread' : 'Organiser thread'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.feed} contentContainerStyle={styles.feedContent}>
        {(request.thread ?? []).map((message) => {
          const isMine = message.authorId === userId;
          return (
            <View
              key={message.id}
              style={[
                styles.bubble,
                {
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  borderColor: colors.borderLight,
                  backgroundColor: isMine ? colors.primarySoft : colors.surface,
                },
              ]}
            >
              <Text style={[styles.role, { color: isMine ? colors.primary : colors.textSecondary }]}>
                {isMine ? 'You' : message.authorRole === 'organizer' ? 'Organiser' : 'Attendee'}
              </Text>
              <Text style={[TextStyles.body, { color: colors.text }]}>{message.message}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.composer, { borderTopColor: colors.borderLight, backgroundColor: colors.surface }]}>
        <TextInput
          value={reply}
          onChangeText={setReply}
          placeholder={isOrganizerView ? 'Reply to attendee...' : 'Reply to organiser...'}
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.background }]}
          multiline
        />
        <Pressable
          onPress={() => replyMutation.mutate()}
          style={[styles.sendBtn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Send reply"
        >
          <Ionicons name="send" size={IconSize.sm + 2} color={colors.background} />
        </Pressable>
      </View>
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
  feed: { flex: 1 },
  feedContent: { padding: Spacing.lg, gap: Spacing.sm },
  bubble: {
    maxWidth: '84%',
    borderWidth: 1,
    borderRadius: CardTokens.radius,
    paddingHorizontal: CardTokens.padding,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs - 2,
  },
  role: { ...TextStyles.badgeCaps },
  composer: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  input: {
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
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function EnquiryThreadScreen() {
  return (
    <ErrorBoundary>
      <EnquiryThreadScreenContent />
    </ErrorBoundary>
  );
}
