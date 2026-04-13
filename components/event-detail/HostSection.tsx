import { View, Text } from 'react-native';
import { TextStyles } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { getStyles } from './styles';
import type { EventData } from '@/shared/schema';
import type { ResolvedEventOrganizer } from './utils';

interface HostSectionProps {
  event: EventData;
  organizer: ResolvedEventOrganizer;
  displayCategory: string;
  canContactOrganizer?: boolean;
  contactPending?: boolean;
  handleContactOrganizer: () => void;
  handleEmailHost: () => void;
  handleCallHost: () => void;
  handleVisitWebsite: () => void;
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof getStyles>;
}

export function HostSection({
  event,
  organizer,
  displayCategory,
  canContactOrganizer = false,
  contactPending = false,
  handleContactOrganizer,
  handleEmailHost,
  handleCallHost,
  handleVisitWebsite,
  colors,
  s,
}: HostSectionProps) {
  return (
    <>
      <View style={s.divider} />
      <View style={s.section}>
        <Text style={s.sectionTitle}>Host</Text>
        <Card
          style={s.hostCard}
          padding={18}
          onPress={
            organizer.profileId
              ? () =>
                  router.push({
                    pathname: '/profile/[id]',
                    params: { id: organizer.profileId! },
                  })
              : undefined
          }
          accessibilityLabel={
            organizer.profileId
              ? `Open organiser profile ${organizer.name}`
              : `Organiser: ${organizer.name}`
          }
          accessibilityHint={
            organizer.profileId
              ? 'Opens organiser profile'
              : 'Organiser information (not interactive)'
          }
        >
          <View style={s.hostHeader}>
            <View style={[s.metricIconBg, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            </View>
            <View style={s.hostContent}>
              <Text style={[TextStyles.headline, { color: colors.text }]}>{organizer.name}</Text>
              <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
                {displayCategory} in {event.city}
              </Text>
            </View>
          </View>
          <View style={[s.chipRow, { marginTop: 14 }]}>
            {canContactOrganizer ? (
              <View>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon="chatbubble-ellipses-outline"
                  onPress={handleContactOrganizer}
                  loading={contactPending}
                >
                  Contact organiser
                </Button>
                <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 6 }]}>
                  Sends an in-app enquiry to the organiser for this event.
                </Text>
              </View>
            ) : null}
            {organizer.email ? (
              <Button variant="outline" size="sm" leftIcon="mail-outline" onPress={handleEmailHost}>
                Email host
              </Button>
            ) : null}
            {organizer.phone ? (
              <Button variant="outline" size="sm" leftIcon="call-outline" onPress={handleCallHost}>
                Call host
              </Button>
            ) : null}
            {organizer.website ? (
              <Button variant="outline" size="sm" leftIcon="globe-outline" onPress={handleVisitWebsite}>
                Visit website
              </Button>
            ) : null}
          </View>
        </Card>
      </View>
    </>
  );
}
