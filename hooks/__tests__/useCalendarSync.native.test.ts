import { renderHook, act } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';

const mockGetCalendarsAsync = jest.fn();
const mockCreateEventAsync = jest.fn();
const mockRequestCalendarPermissionsAsync = jest.fn();
const mockGetCalendarPermissionsAsync = jest.fn();

const calendarMock = {
  EntityTypes: { EVENT: 'EVENT' },
  getCalendarsAsync: mockGetCalendarsAsync,
  createEventAsync: mockCreateEventAsync,
  requestCalendarPermissionsAsync: mockRequestCalendarPermissionsAsync,
  getCalendarPermissionsAsync: mockGetCalendarPermissionsAsync,
};

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

import { useCalendarSync, __test_setCalendarLinked } from '../useCalendarSync.native';

describe('useCalendarSync.native hook', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
    // Make sure we pass the full mock obj with functions attached, because `isCalendarLinked` expects functions on the object
    __test_setCalendarLinked(true, calendarMock);

    // We must ensure the mock function returns a valid result for the useEffect hook on mount
    mockGetCalendarPermissionsAsync.mockResolvedValue({ granted: false });
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
      mockRequestCalendarPermissionsAsync.mockResolvedValueOnce({ granted: false });

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
      mockRequestCalendarPermissionsAsync.mockResolvedValueOnce({ granted: true });

      mockGetCalendarsAsync.mockResolvedValueOnce([
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
      mockRequestCalendarPermissionsAsync.mockResolvedValueOnce({ granted: true });

      mockGetCalendarsAsync.mockResolvedValueOnce([
        { id: 'cal1', allowsModifications: true },
      ]);
      mockCreateEventAsync.mockRejectedValueOnce(new Error('Failed to create event'));

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

  describe('isCalendarLinked = false', () => {
    it('returns false and alerts when calendar module is missing', async () => {
      __test_setCalendarLinked(false, null);

      const { result } = renderHook(() => useCalendarSync());

      let success;
      await act(async () => {
        success = await result.current.exportEventToCalendar(dummyEvent as any);
      });

      expect(success).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Calendar Module Missing',
        expect.any(String)
      );
    });
  });
});
