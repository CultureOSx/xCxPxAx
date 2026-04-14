import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert, Linking, Platform } from 'react-native';
import type { EventData } from '@/shared/schema';

const mockExpoCalendar = {
  requestCalendarPermissionsAsync: jest.fn(async () => ({ granted: true })),
  getCalendarPermissionsAsync: jest.fn(async () => ({ granted: true })),
  getCalendarsAsync: jest.fn(async () => []),
  getEventsAsync: jest.fn(async () => []),
  createEventAsync: jest.fn(async () => 'ev-1'),
  EntityTypes: { EVENT: 'event' },
};

jest.mock('expo-calendar', () => mockExpoCalendar);

const mockGetSettings = jest.fn(async () => ({
  deviceConnected: true,
  showPersonalEvents: true,
  autoAddTickets: false,
}));
const mockUpdateSettings = jest.fn(async (prefs: Record<string, unknown>) => prefs);
const mockSetQueryData = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    calendar: {
      getSettings: mockGetSettings,
      updateSettings: mockUpdateSettings,
    },
  },
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(() => ({ setQueryData: mockSetQueryData })),
  useQuery: jest.fn(() => ({
    data: { deviceConnected: true, showPersonalEvents: true, autoAddTickets: false },
    isLoading: false,
  })),
  useMutation: jest.fn((opts: { mutationFn: (p: Record<string, unknown>) => Promise<unknown>; onSuccess?: (d: unknown) => void }) => ({
    mutateAsync: async (prefs: Record<string, unknown>) => {
      const out = await opts.mutationFn(prefs);
      opts.onSuccess?.(out);
      return out;
    },
    isPending: false,
  })),
}));

const { useCalendarSync, parseEventDate, buildICS } = require('../useCalendarSync.native');

describe('useCalendarSync.native', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Linking, 'openSettings').mockImplementation(async () => undefined);
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' });
  });

  it('initializes and checks permissions on mount', async () => {
    const { result } = renderHook(() => useCalendarSync());
    expect(result.current.isCalendarLinked).toBe(true);
    await waitFor(() => {
      expect(mockExpoCalendar.getCalendarPermissionsAsync).toHaveBeenCalled();
    });
  });

  it('connects device calendar when permission granted', async () => {
    const { result } = renderHook(() => useCalendarSync());
    await act(async () => {
      await result.current.connectDeviceCalendar();
    });
    expect(mockExpoCalendar.requestCalendarPermissionsAsync).toHaveBeenCalled();
    expect(mockUpdateSettings).toHaveBeenCalledWith({ deviceConnected: true });
  });

  it('alerts when permission denied', async () => {
    mockExpoCalendar.requestCalendarPermissionsAsync.mockResolvedValueOnce({ granted: false });
    const { result } = renderHook(() => useCalendarSync());
    await act(async () => {
      await result.current.connectDeviceCalendar();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Calendar Permission Required',
      expect.any(String),
      expect.any(Array),
    );
  });

  it('disconnects and clears personal events', async () => {
    const { result } = renderHook(() => useCalendarSync());
    await act(async () => {
      await result.current.disconnectDeviceCalendar();
    });
    expect(mockUpdateSettings).toHaveBeenCalledWith({ deviceConnected: false });
    expect(result.current.personalEvents).toEqual([]);
  });

  it('fetches and maps personal events', async () => {
    mockExpoCalendar.getCalendarsAsync.mockResolvedValueOnce([{ id: 'cal-1', title: 'Work', color: '#f00' }] as never);
    mockExpoCalendar.getEventsAsync.mockResolvedValueOnce([
      {
        id: 'ev-1',
        title: 'Meeting',
        startDate: '2026-04-14T10:00:00Z',
        endDate: '2026-04-14T11:00:00Z',
        calendarId: 'cal-1',
      },
    ] as never);
    const { result } = renderHook(() => useCalendarSync());
    const start = new Date('2026-04-14T00:00:00Z');
    const end = new Date('2026-04-14T23:59:59Z');
    await waitFor(() => {
      expect(mockExpoCalendar.getCalendarPermissionsAsync).toHaveBeenCalled();
    });
    await act(async () => {
      await result.current.connectDeviceCalendar();
    });
    await act(async () => {
      await result.current.fetchPersonalEvents(start, end);
    });
    expect(result.current.personalEvents).toHaveLength(1);
    expect(result.current.personalEvents[0]).toMatchObject({
      id: 'ev-1',
      title: 'Meeting',
      calendarName: 'Work',
      color: '#f00',
    });
  });

  it('returns false if no writable calendar found', async () => {
    mockExpoCalendar.getCalendarsAsync.mockResolvedValueOnce([{ id: 'cal-1', allowsModifications: false }] as never);
    const { result } = renderHook(() => useCalendarSync());
    let ok = true;
    await act(async () => {
      ok = await result.current.exportEventToCalendar({
        id: '1',
        title: 'Test Event',
        date: new Date(),
        description: '',
        city: 'Sydney',
        country: 'AU',
      } as unknown as EventData);
    });
    expect(ok).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith('No writable calendar found', 'Unable to add event to your calendar.');
  });

  it('exports event when writable calendar exists', async () => {
    mockExpoCalendar.getCalendarsAsync.mockResolvedValueOnce([{ id: 'cal-1', allowsModifications: true, isPrimary: true }] as never);
    const { result } = renderHook(() => useCalendarSync());
    let ok = false;
    await act(async () => {
      ok = await result.current.exportEventToCalendar({
        id: '2',
        title: 'Export Me',
        date: new Date('2026-04-14T10:00:00Z'),
        description: '',
        city: 'Sydney',
        country: 'AU',
      } as unknown as EventData);
    });
    expect(ok).toBe(true);
    expect(mockExpoCalendar.createEventAsync).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Added to Calendar', '"Export Me" has been added to your calendar.');
  });

  it('exports helper date values correctly', () => {
    const d = new Date('2026-04-14T10:00:00Z');
    expect(parseEventDate({ date: d } as unknown as EventData)).toEqual(d);
    expect(parseEventDate({ date: '2026-04-14' } as unknown as EventData).toISOString()).toContain('T');
  });

  it('builds ICS content with expected fields', () => {
    const out = buildICS({
      id: 'ics-1',
      title: 'ICS Event',
      date: new Date('2026-04-14T10:00:00Z'),
      description: 'Desc',
      venue: 'Venue',
      address: '123 St',
      city: 'Sydney',
      country: 'AU',
    } as unknown as EventData);
    expect(out).toContain('BEGIN:VCALENDAR');
    expect(out).toContain('UID:culturepass-ics-1@culturepass.app');
    expect(out).toContain('SUMMARY:ICS Event');
    expect(out).toContain('LOCATION:Venue, 123 St, Sydney');
  });
});
