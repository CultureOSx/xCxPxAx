import { Redirect, useLocalSearchParams } from 'expo-router';

export default function CreateTypeRedirect() {
  const { type, ...rest } = useLocalSearchParams<Record<string, string | string[] | undefined>>();
  const params = new URLSearchParams();

  if (typeof type === 'string' && type.length > 0) {
    params.set('type', type);
  }

  for (const [key, value] of Object.entries(rest)) {
    if (typeof value === 'string' && value.length > 0) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return <Redirect href={query ? `/workspace?${query}` : '/workspace'} />;
}

