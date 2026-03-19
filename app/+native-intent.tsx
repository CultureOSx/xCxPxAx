import { normalizeSystemPath } from '@/lib/routes';

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  return normalizeSystemPath(path, initial);
}
