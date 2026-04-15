import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert, Linking, Platform } from 'react-native';
import type { EventData } from '@/shared/schema';

const mockExpoCalendar = {
  requestCalendarPermissionsAsync: jest.fn(async () => ({ granted: true })),
  getCalendarPermissionsAsync: jest.fn(async () => ({ granted: true })),
  getCalendarsAsync: jest.fn(async () => [] as any[]),
  getEventsAsync: jest.fn(async () => []),
  getEventsAsync: jest.fn(async () => [] as any[]),
  createEventAsync: jest.fn(async () => 'ev-1'),
  EntityTypes: { EVENT: 'event' },
};

jest.mock('expo-calendar', () => mockExpoCalendar);

const mockMutateAsync = jest.fn();
const mockQueryClient = { setQueryData: jest.fn() };

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: { deviceConnected: true, showPersonalEvents: true, autoAddTickets: false },
    isLoading: false,
  })),
  useMutation: jest.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
  useQueryClient: jest.fn(() => mockQueryClient),
}));

jest.mock('@/lib/api', () => ({
  api: {
    calendar: {
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
    },
  },
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// URL and Blob mocks for web
global.Blob = jest.fn() as unknown as typeof Blob;
global.URL.createObjectURL = jest.fn(() => 'blob:mock');
global.URL.revokeObjectURL = jest.fn();

const { useCalendarSync, parseEventDate, buildICS } = require('../useCalendarSync.native');

describe('useCalendarSync.native', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Linking, 'openSettings').mockImplementation(async () => undefined);
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' });
  });

  describe('parseEventDate', () => {
    it('returns Date object correctly if raw is a Date', () => {
      const d = new Date('2025-01-01T10:00:00Z');
      const event = { date: d } as unknown as EventData;
      expect(parseEventDate(event)).toEqual(d);
    });

    it('returns Date object correctly if raw is string without T', () => {
      const event = { date: '2025-01-01' } as unknown as EventData;
      expect(parseEventDate(event).toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });

    it('returns Date object correctly if raw is string with T', () => {
      const event = { date: '2025-01-01T10:00:00Z' } as unknown as EventData;
      expect(parseEventDate(event).toISOString()).toBe('2025-01-01T10:00:00.000Z');
    });

    it('handles Firestore Timestamp correctly', () => {
      const d = new Date('2025-01-01T10:00:00Z');
      const timestamp = { toDate: () => d };
      const event = { date: timestamp } as unknown as EventData;
      expect(parseEventDate(event)).toEqual(d);
    });

    it('falls back to new Date() if string is invalid', () => {
      const event = { date: 'invalid date' } as unknown as EventData;
      const parsed = parseEventDate(event);
      // It should return a valid Date object fallback
      expect(parsed).toBeInstanceOf(Date);
      expect(isNaN(parsed.getTime())).toBe(false);
    });

    it('falls back to new Date() if raw is null or undefined', () => {
      const event = { date: null } as unknown as EventData;
      const parsed = parseEventDate(event);
      expect(parsed).toBeInstanceOf(Date);
      expect(isNaN(parsed.getTime())).toBe(false);
    });

    it('falls back to new Date() if error thrown internally', () => {
      // e.g. raw object where toDate is not a function
      const event = { date: { toDate: "not a function" } } as unknown as EventData;
      const parsed = parseEventDate(event);
      expect(parsed).toBeInstanceOf(Date);
      expect(isNaN(parsed.getTime())).toBe(false);
    });
  });

  describe('buildICS', () => {
    it('builds ICS successfully without description or location', () => {
      const d = new Date('2025-01-01T10:00:00Z');
      const event = {
        id: '123',
        title: 'Test Event',
        date: d,
      } as unknown as EventData;

      const ics = buildICS(event);
      expect(ics).toContain('UID:culturepass-123@culturepass.app');
      expect(ics).toContain('SUMMARY:Test Event');
      expect(ics).not.toContain('LOCATION:');
      expect(ics).not.toContain('DESCRIPTION:');
    });

    it('builds ICS successfully with description and location', () => {
      const d = new Date('2025-01-01T10:00:00Z');
      const event = {
        id: '123',
        title: 'Test Event',
        date: d,
        description: 'Test Description',
        venue: 'Test Venue',
        address: '123 Test St',
        city: 'Test City',
      } as unknown as EventData;

      const ics = buildICS(event);
      expect(ics).toContain('LOCATION:Test Venue, 123 Test St, Test City');
      expect(ics).toContain('DESCRIPTION:Test Description');
    });
  });

  describe('exportEventToCalendar error paths', () => {
    const origPlatformOS = Platform.OS;
    beforeEach(() => {
      Platform.OS = 'ios';
      mockExpoCalendar.requestCalendarPermissionsAsync.mockImplementation(() => Promise.resolve({ status: 'granted', granted: true }));
      mockExpoCalendar.getCalendarPermissionsAsync.mockImplementation(() => Promise.resolve({ status: 'granted', granted: true }));
    });
    afterEach(() => {
      Platform.OS = origPlatformOS;
    });

    it('returns false and alerts if permission denied', async () => {
      mockExpoCalendar.requestCalendarPermissionsAsync.mockImplementationOnce(() => Promise.resolve({ status: 'denied', granted: false }));
      const { result } = renderHook(() => useCalendarSync());

      const event = { id: '123', title: 'Test Event', date: new Date() } as unknown as EventData;
      let success;
      await act(async () => {
        success = await result.current.exportEventToCalendar(event);
      });

      expect(success).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Calendar Permission Required',
        expect.any(String),
        expect.any(Array)
      );
    });

    it('returns false and alerts if no writable calendar found', async () => {
      mockExpoCalendar.getCalendarsAsync.mockImplementationOnce(() => Promise.resolve([
        { id: '1', allowsModifications: false },
      ]));
      const { result } = renderHook(() => useCalendarSync());

      const event = { id: '123', title: 'Test Event', date: new Date() } as unknown as EventData;
      let success;
      await act(async () => {
        success = await result.current.exportEventToCalendar(event);
      });

      expect(success).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith('No writable calendar found', 'Unable to add event to your calendar.');
    });

    it('returns false and alerts if createEventAsync throws', async () => {
      mockExpoCalendar.getCalendarsAsync.mockImplementationOnce(() => Promise.resolve([
        { id: '1', allowsModifications: true },
      ]));
      mockExpoCalendar.createEventAsync.mockImplementationOnce(() => Promise.reject(new Error('Failed')));

      const { result } = renderHook(() => useCalendarSync());

      const event = { id: '123', title: 'Test Event', date: new Date() } as unknown as EventData;
      let success;
      await act(async () => {
        success = await result.current.exportEventToCalendar(event);
      });

      expect(success).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Could not add event to calendar. Please try again.');
    });

    it('returns true if createEventAsync succeeds', async () => {
      mockExpoCalendar.getCalendarsAsync.mockImplementationOnce(() => Promise.resolve([
        { id: '1', allowsModifications: true },
      ]));
      mockExpoCalendar.createEventAsync.mockImplementationOnce(() => Promise.resolve('event-123'));

      const { result } = renderHook(() => useCalendarSync());

      const event = { id: '123', title: 'Test Event', date: new Date() } as unknown as EventData;
      let success;
      await act(async () => {
        success = await result.current.exportEventToCalendar(event);
      });

      expect(success).toBe(true);
      expect(Alert.alert).toHaveBeenCalledWith('Added to Calendar', '"Test Event" has been added to your calendar.');
    });
  });

  describe('fetchPersonalEvents error paths', () => {
    const origPlatformOS = Platform.OS;
    beforeEach(() => {
      Platform.OS = 'ios';
      mockExpoCalendar.requestCalendarPermissionsAsync.mockImplementation(() => Promise.resolve({ status: 'granted', granted: true }));
      mockExpoCalendar.getCalendarPermissionsAsync.mockImplementation(() => Promise.resolve({ status: 'granted', granted: true }));
    });
    afterEach(() => {
      Platform.OS = origPlatformOS;
    });

    it('silently ignores errors from getCalendarsAsync', async () => {
      mockExpoCalendar.getCalendarsAsync.mockImplementationOnce(() => Promise.reject(new Error('Failed')));
      const { result } = renderHook(() => useCalendarSync());

      await act(async () => {
        await result.current.connectDeviceCalendar();
      });

      await act(async () => {
        await result.current.fetchPersonalEvents(new Date(), new Date());
      });

      expect(result.current.personalEvents).toEqual([]);
    });

    it('silently ignores errors from getEventsAsync', async () => {
      mockExpoCalendar.getCalendarsAsync.mockImplementationOnce(() => Promise.resolve([
        { id: '1', allowsModifications: true },
      ]));
      mockExpoCalendar.getEventsAsync.mockImplementationOnce(() => Promise.reject(new Error('Failed')));

      const { result } = renderHook(() => useCalendarSync());

      await act(async () => {
        await result.current.connectDeviceCalendar();
      });

      await act(async () => {
        await result.current.fetchPersonalEvents(new Date(), new Date());
      });

      expect(result.current.personalEvents).toEqual([]);
    });
  });

  describe('exportAllTickets error paths', () => {
    const origPlatformOS = Platform.OS;
    beforeEach(() => {
      Platform.OS = 'ios';
      mockExpoCalendar.requestCalendarPermissionsAsync.mockImplementation(() => Promise.resolve({ status: 'granted', granted: true }));
      mockExpoCalendar.getCalendarPermissionsAsync.mockImplementation(() => Promise.resolve({ status: 'granted', granted: true }));
    });
    afterEach(() => {
      Platform.OS = origPlatformOS;
    });

    it('does not alert if all exports fail', async () => {
      mockExpoCalendar.getCalendarsAsync.mockImplementation(() => Promise.resolve([
        { id: '1', allowsModifications: true },
      ]));
      mockExpoCalendar.createEventAsync.mockImplementation(() => Promise.reject(new Error('Failed')));

      const { result } = renderHook(() => useCalendarSync());
      const events = [
        { id: '1', title: 'Event 1', date: new Date() },
        { id: '2', title: 'Event 2', date: new Date() }
      ] as unknown as EventData[];

      await act(async () => {
        await result.current.exportAllTickets(events);
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Could not add event to calendar. Please try again.'); // Called per event
      // Should not call the Sync Complete alert because count == 0
      expect(Alert.alert).not.toHaveBeenCalledWith('Sync Complete', expect.any(String));
    });

    it('alerts with correct count if partial success', async () => {
      mockExpoCalendar.getCalendarsAsync.mockImplementation(() => Promise.resolve([
        { id: '1', allowsModifications: true },
      ]));
      mockExpoCalendar.createEventAsync
        .mockImplementationOnce(() => Promise.resolve('event-1'))
        .mockImplementationOnce(() => Promise.reject(new Error('Failed')));

      const { result } = renderHook(() => useCalendarSync());
      const events = [
        { id: '1', title: 'Event 1', date: new Date() },
        { id: '2', title: 'Event 2', date: new Date() }
      ] as unknown as EventData[];

      await act(async () => {
        await result.current.exportAllTickets(events);
      });

      expect(Alert.alert).toHaveBeenCalledWith('Sync Complete', '1 event added to your calendar.');
    });
  });
});
