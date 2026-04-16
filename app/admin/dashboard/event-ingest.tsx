import { Redirect } from 'expo-router';

/**
 * Legacy event-ingest page now redirects to the full Data Ingestion hub.
 * The full feature lives at /admin/import with tabs for ad-hoc, sources, and job history.
 */
export default function EventIngestRedirect() {
  return <Redirect href="/admin/import" />;
}
