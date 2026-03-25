import { Redirect } from 'expo-router';

/** Creating a community is handled by the Organisation type in the Submit screen. */
export default function CreateCommunityRedirect() {
  return <Redirect href={'/submit?type=organisation' as any} />;
}
