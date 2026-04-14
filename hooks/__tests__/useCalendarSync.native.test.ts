import { renderHook, act } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';

// Mock expo-calendar with jest.fn() directly in the factory (avoids TDZ issues with hoisting)
jest.mock('expo-calendar', () => ({
  EntityTypes: { EVENT: 'EVENT' },
  getCalendarsAsync: jest.fn(),
  createEventAsync: jest.fn(),
  requestCalendarPermissionsAsync: jest.fn(),
  getCalendarPermissionsAsync: jest.fn(),
}));

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Alert.alert = jest.fn();
  return rn;
});

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({ data: undefined, isLoading: false })),
  useMutation: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
  useQueryClient: jest.fn(() => ({ setQueryData: jest.fn() })),
}));

jest.mock('@/lib/api', () => ({
  api: {
    calendar: {
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
    },
  },
}));

import { useCalendarSync } from '../useCalendarSync.native';

// Get typed references to the mock functions after the module registry is set up
// eslint-disable-next-line @typescript-eslint/no-require-imports
const calendarMocks = jest.requireMock('expo-calendar') as {
  getCalendarsAsync: jest.Mock;
  createEventAsync: jest.Mock;
  requestCalendarPermissionsAsync: jest.Mock;
  getCalendarPermissionsAsync: jest.Mock;
};

describe('useCalendarSync.native hook', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
    calendarMocks.getCalendarPermissionsAsync.mockResolvedValue({ granted: false });
  });

  afterAll(() => {
    Platform.OS = originalOS;
  });

  const dummyEvent = {
    id: 'e1',
    title: 'Test Event',
    description: 'Test Desc',
    venue: 'Test Venue',
    address: '123 Main St',
    city: 'Sydney',
    date: new Date('2025-01-01T10:00:00Z'),
  };

  describe('exportEventToCalendar error paths', () => {
    it('returns false and alerts if permission is denied', async () => {
      calendarMocks.requestCalendarPermissionsAsync.mockResolvedValueOnce({ granted: false });

      const { result } = renderHook(() => useCalendarSync());

      let success;
      await act(async () => {
        success = await result.current.exportEventToCalendar(dummyEvent as any);
      });

      expect(success).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Calendar Permission Required',
        expect.any(String),
        expect.any(Array)
      );
    });

    it('returns false and alerts if no writable calendar is found', async () => {
      calendarMocks.requestCalendarPermissionsAsync.mockResolvedValueOnce({ granted: true });
      calendarMocks.getCalendarsAsync.mockResolvedValueOnce([
        { id: 'cal1', allowsModifications: false },
      ]);

      const { result } = renderHook(() => useCalendarSync());

      let success;
      await act(async () => {
        success = await result.current.exportEventToCalendar(dummyEvent as any);
      });

      expect(success).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        'No writable calendar found',
        'Unable to add event to your calendar.'
      );
    });

    it('returns false and alerts if createEventAsync throws an error', async () => {
      calendarMocks.requestCalendarPermissionsAsync.mockResolvedValueOnce({ granted: true });
      calendarMocks.getCalendarsAsync.mockResolvedValueOnce([
        { id: 'cal1', allowsModifications: true },
      ]);
      calendarMocks.createEventAsync.mockRejectedValueOnce(new Error('Failed to create event'));

      const { result } = renderHook(() => useCalendarSync());

      let success;
      await act(async () => {
        success = await result.current.exportEventToCalendar(dummyEvent as any);
      });

      expect(success).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Could not add event to calendar. Please try again.'
      );
    });
  });
});
