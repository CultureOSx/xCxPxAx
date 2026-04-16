import { useLocalSearchParams } from 'expo-router';

import CommunityHubRedirect from '@/components/community/CommunityHubRedirect';

export default function CommunitiesMembersRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CommunityHubRedirect href={`/community/${id}/members`} label="Opening community members..." />;
}
