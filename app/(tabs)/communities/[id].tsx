import { useLocalSearchParams } from 'expo-router';

import { CommunityHubRedirect } from '@/components/community/CommunityHubRedirect';

export default function CommunitiesDetailRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CommunityHubRedirect href={`/community/${id}`} label="Opening community details..." />;
}
