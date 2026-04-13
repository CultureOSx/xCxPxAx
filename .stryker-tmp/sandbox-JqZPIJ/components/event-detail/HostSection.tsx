// @ts-nocheck
import { View, Text } from 'react-native';
import { TextStyles, CultureTokens } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { getStyles } from './styles';
import type { EventData } from '@/shared/schema';

interface HostSectionProps {
  event: EventData;
  hostName: string;
  displayCategory: string;
  hostEmail?: string | null;
  hostPhone?: string | null;
  hostWebsite?: string | null;
  handleEmailHost: () => void;
  handleCallHost: () => void;
  handleVisitWebsite: () => void;
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof getStyles>;
}

export function HostSection({
  event,
  hostName,
  displayCategory,
  hostEmail,
  hostPhone,
  hostWebsite,
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
            event.publisherProfileId
              ? () =>
                  router.push({
                    pathname: '/profile/[id]',
                    params: { id: event.publisherProfileId! },
                  })
              : undefined
          }
          accessibilityLabel={
            event.publisherProfileId
              ? `Open organiser profile ${hostName}`
              : `Organiser: ${hostName}`
          }
          accessibilityHint={
            event.publisherProfileId
              ? 'Opens organiser profile'
              : 'Organiser information (not interactive)'
          }
        >
          <View style={s.hostHeader}>
            <View style={[s.metricIconBg, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            </View>
            <View style={s.hostContent}>
              <Text style={[TextStyles.headline, { color: colors.text }]}>{hostName}</Text>
              <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
                {displayCategory} in {event.city}
              </Text>
            </View>
          </View>
          <View style={[s.chipRow, { marginTop: 14 }]}>
            {hostEmail ? (
              <Button variant="outline" size="sm" leftIcon="mail-outline" onPress={handleEmailHost}>
                Email host
              </Button>
            ) : null}
            {hostPhone ? (
              <Button variant="outline" size="sm" leftIcon="call-outline" onPress={handleCallHost}>
                Call host
              </Button>
            ) : null}
            {hostWebsite ? (
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
