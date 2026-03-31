/**
 * useCalendarSync — web stub
 * --------------------------
 * Native implementation lives in useCalendarSync.native.ts (loaded by Metro
 * on iOS/Android). This file is the web/fallback version — no expo-calendar
 * dependency, device-calendar features are no-ops, but ICS file export works.
 */

import { useState, useCallback } from 'react';
import type { EventData } from '@/shared/schema';

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

const noop = async () => {};

export function useCalendarSync() {
  const [prefs] = useState<CalendarSyncPrefs>(DEFAULT_PREFS);

  const exportEventToCalendar = useCallback(async (event: EventData): Promise<boolean> => {
    const ics = buildICS(event);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(event.title ?? 'event').replace(/[^a-z0-9]/gi, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }, []);

  const exportAllTickets = useCallback(async (events: EventData[]) => {
    for (const ev of events) {
      await exportEventToCalendar(ev);
    }
  }, [exportEventToCalendar]);

  return {
    prefs,
    isLoading: false,
    isSyncing: false,
    permissionGranted: false,
    personalEvents: [] as PersonalEvent[],
    connectDeviceCalendar: noop,
    disconnectDeviceCalendar: noop,
    fetchPersonalEvents: noop as (startDate: Date, endDate: Date) => Promise<void>,
    exportEventToCalendar,
    exportAllTickets,
    setShowPersonalEvents: noop as (val: boolean) => Promise<void>,
    setAutoAddTickets: noop as (val: boolean) => Promise<void>,
  };
}

// ---------------------------------------------------------------------------
// Helpers (duplicated from native version — keep in sync if buildICS changes)
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
