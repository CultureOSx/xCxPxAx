/**
 * useCalendarSync
 * ---------------
 * Manages device calendar integration for CulturePass.
 * - Requests calendar read/write permissions (expo-calendar)
 * - Reads personal device calendar events (shown as busy blocks)
 * - Exports CulturePass events to device calendar
 * - Persists sync preferences via AsyncStorage
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Calendar from 'expo-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EventData } from '@/shared/schema';

const STORAGE_KEY = '@culturepass_calendar_prefs';

export interface PersonalEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  calendarName: string;
  color: string;
}

export interface CalendarSyncPrefs {
  deviceConnected: boolean;
  showPersonalEvents: boolean;
  autoAddTickets: boolean;
}

const DEFAULT_PREFS: CalendarSyncPrefs = {
  deviceConnected: false,
  showPersonalEvents: true,
  autoAddTickets: false,
};

export function useCalendarSync() {
  const [prefs, setPrefs] = useState<CalendarSyncPrefs>(DEFAULT_PREFS);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted prefs on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Partial<CalendarSyncPrefs>;
          setPrefs({ ...DEFAULT_PREFS, ...saved });
        }
      })
      .catch(() => {/* ignore */})
      .finally(() => setIsLoading(false));
  }, []);

  // Check existing permission state on mount
  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsLoading(false);
      return;
    }
    Calendar.getCalendarPermissionsAsync()
      .then(({ granted }) => setPermissionGranted(granted))
      .catch(() => {/* ignore */});
  }, []);

  const savePrefs = useCallback(async (next: CalendarSyncPrefs) => {
    setPrefs(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  /** Request read+write calendar permissions from the OS */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    const { granted } = await Calendar.requestCalendarPermissionsAsync();
    setPermissionGranted(granted);
    if (!granted) {
      Alert.alert(
        'Calendar Permission Required',
        'To sync events with your calendar, please enable Calendar access in your device Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
    }
    return granted;
  }, []);

  /** Connect device calendar: request permission + load events */
  const connectDeviceCalendar = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) return;
    const next = { ...prefs, deviceConnected: true };
    await savePrefs(next);
  }, [prefs, requestPermission, savePrefs]);

  /** Disconnect device calendar */
  const disconnectDeviceCalendar = useCallback(async () => {
    const next = { ...prefs, deviceConnected: false };
    await savePrefs(next);
    setPersonalEvents([]);
  }, [prefs, savePrefs]);

  /** Fetch personal calendar events for a date range */
  const fetchPersonalEvents = useCallback(async (startDate: Date, endDate: Date) => {
    if (Platform.OS === 'web' || !permissionGranted || !prefs.deviceConnected) return;
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const calendarIds = calendars.map((c) => c.id);
      if (!calendarIds.length) return;

      const raw = await Calendar.getEventsAsync(calendarIds, startDate, endDate);
      const mapped: PersonalEvent[] = raw.map((ev) => ({
        id: ev.id,
        title: ev.title ?? 'Busy',
        startDate: new Date(ev.startDate),
        endDate: new Date(ev.endDate),
        calendarName: calendars.find((c) => c.id === ev.calendarId)?.title ?? 'Calendar',
        color: calendars.find((c) => c.id === ev.calendarId)?.color ?? '#888',
      }));
      setPersonalEvents(mapped);
    } catch {
      // Permission revoked or unavailable — silently ignore
    }
  }, [permissionGranted, prefs.deviceConnected]);

  /** Export a single CulturePass event to the device calendar */
  const exportEventToCalendar = useCallback(async (event: EventData): Promise<boolean> => {
    if (Platform.OS === 'web') {
      // Web: offer ICS download via data URI
      const ics = buildICS(event);
      const blob = new Blob([ics], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(event.title ?? 'event').replace(/[^a-z0-9]/gi, '_')}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    }

    const granted = permissionGranted || (await requestPermission());
    if (!granted) return false;

    try {
      setIsSyncing(true);
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      // Prefer the default calendar
      const writable = calendars.find(
        (c) =>
          c.allowsModifications &&
          (c.source?.isLocalAccount || c.isPrimary),
      ) ?? calendars.find((c) => c.allowsModifications);

      if (!writable) {
        Alert.alert('No writable calendar found', 'Unable to add event to your calendar.');
        return false;
      }

      const startDate = parseEventDate(event);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // default 2h duration

      await Calendar.createEventAsync(writable.id, {
        title: event.title ?? 'CulturePass Event',
        notes: event.description ?? '',
        location: [event.venue, event.address, event.city].filter(Boolean).join(', '),
        startDate,
        endDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [{ relativeOffset: -60 }], // 1h reminder
        url: `https://culturepass.app/event/${event.id}`,
      });

      Alert.alert('Added to Calendar', `"${event.title}" has been added to your calendar.`);
      return true;
    } catch {
      Alert.alert('Error', 'Could not add event to calendar. Please try again.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [permissionGranted, requestPermission]);

  /** Bulk export all ticket events to device calendar */
  const exportAllTickets = useCallback(async (events: EventData[]) => {
    if (!events.length) return;
    setIsSyncing(true);
    let count = 0;
    for (const ev of events) {
      const ok = await exportEventToCalendar(ev);
      if (ok) count++;
    }
    setIsSyncing(false);
    if (count > 0) {
      Alert.alert('Sync Complete', `${count} event${count !== 1 ? 's' : ''} added to your calendar.`);
    }
  }, [exportEventToCalendar]);

  /** Toggle showPersonalEvents preference */
  const setShowPersonalEvents = useCallback(async (val: boolean) => {
    await savePrefs({ ...prefs, showPersonalEvents: val });
  }, [prefs, savePrefs]);

  /** Toggle autoAddTickets preference */
  const setAutoAddTickets = useCallback(async (val: boolean) => {
    await savePrefs({ ...prefs, autoAddTickets: val });
  }, [prefs, savePrefs]);

  return {
    prefs,
    isLoading,
    isSyncing,
    permissionGranted,
    personalEvents,
    connectDeviceCalendar,
    disconnectDeviceCalendar,
    fetchPersonalEvents,
    exportEventToCalendar,
    exportAllTickets,
    setShowPersonalEvents,
    setAutoAddTickets,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseEventDate(event: EventData): Date {
  try {
    const raw: unknown = event.date;
    if (raw instanceof Date) return raw;
    if (typeof raw === 'string' && raw.length) {
      const clean = raw.includes('T') ? raw : `${raw}T00:00:00`;
      const d = new Date(clean);
      if (!isNaN(d.getTime())) return d;
    }
    // Firestore Timestamp
    if (raw && typeof raw === 'object' && 'toDate' in raw) {
      return (raw as { toDate: () => Date }).toDate();
    }
  } catch { /* fall through */ }
  return new Date();
}

function buildICS(event: EventData): string {
  const start = parseEventDate(event);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const location = [event.venue, event.address, event.city].filter(Boolean).join(', ');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CulturePass//CulturePass//EN',
    'BEGIN:VEVENT',
    `UID:culturepass-${event.id}@culturepass.app`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${(event.title ?? 'CulturePass Event').replace(/\n/g, '\\n')}`,
    location ? `LOCATION:${location.replace(/\n/g, '\\n')}` : '',
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n').substring(0, 500)}` : '',
    `URL:https://culturepass.app/event/${event.id}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}
