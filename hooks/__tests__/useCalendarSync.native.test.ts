import { renderHook, act } from '@testing-library/react-native';
import { Alert, Platform, Linking } from 'react-native';
import { useCalendarSync } from '../useCalendarSync.native';

const mockMutateAsync = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: {
      deviceConnected: false,
      showPersonalEvents: true,
      autoAddTickets: false,
    },
    isLoading: false,
  })),
  useMutation: jest.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
  useQueryClient: jest.fn(() => ({
    setQueryData: jest.fn(),
  })),
}));

jest.mock('@/lib/api', () => ({
  api: {
    calendar: {
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
    },
  },
}));

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Alert.alert = jest.fn();
  rn.Platform.OS = 'ios';
  rn.Linking.openSettings = jest.fn();
  return rn;
});

const mockRequestPermissions = jest.fn(() => Promise.resolve({ granted: false }));
const mockCreateEventAsync = jest.fn();
const mockGetCalendarsAsync = jest.fn();

jest.mock('expo-calendar', () => {
  return {
    requestCalendarPermissionsAsync: () => mockRequestPermissions(),
    getCalendarPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
    getCalendarsAsync: (entityType: any) => mockGetCalendarsAsync(entityType),
    createEventAsync: (calendarId: any, details: any) => mockCreateEventAsync(calendarId, details),
    EntityTypes: { EVENT: 'event' },
  };
}, { virtual: true });


describe('useCalendarSync.native error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  describe('permissions error handling', () => {
    it('requestPermission should alert if user declines', async () => {
      mockRequestPermissions.mockResolvedValueOnce({ granted: false });
      const { result } = renderHook(() => useCalendarSync());

      await act(async () => {
        await result.current.connectDeviceCalendar();
      });

      expect(mockRequestPermissions).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Calendar Permission Required',
        'To sync events with your calendar, please enable Calendar access in your device Settings.',
        expect.any(Array)
      );
    });

    // We can simulate missing module without dynamic requiring by simply modifying the underlying mock in the tests if we wanted to
    // But since the actual code evaluates `isCalendarLinked` globally using `typeof ExpoCalendar.requestCalendarPermissionsAsync === 'function'`,
    // it's tricky to re-evaluate it per test without a fresh jest environment.
    // Testing the decline path covers the most important user-facing error branch of `requestPermission`.
  });

  describe('exportEventToCalendar error handling', () => {
    const mockEvent: any = {
      id: '1',
      title: 'Test Event',
      date: new Date('2024-01-01T12:00:00Z'),
      venue: 'Test Venue',
      address: '123 Test St',
      city: 'Test City',
    };

    it('should alert if no writable calendar is found', async () => {
      mockRequestPermissions.mockResolvedValueOnce({ granted: true });
      mockGetCalendarsAsync.mockResolvedValueOnce([
        { id: '1', allowsModifications: false, isPrimary: true },
      ]);

      const { result } = renderHook(() => useCalendarSync());

      await act(async () => {
        const success = await result.current.exportEventToCalendar(mockEvent);
        expect(success).toBe(false);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'No writable calendar found',
        'Unable to add event to your calendar.'
      );
    });

    it('should alert if createEventAsync throws', async () => {
      mockRequestPermissions.mockResolvedValueOnce({ granted: true });
      mockGetCalendarsAsync.mockResolvedValueOnce([
        { id: '1', allowsModifications: true, isPrimary: true, source: { isLocalAccount: true } },
      ]);
      mockCreateEventAsync.mockRejectedValueOnce(new Error('Test Error'));

      const { result } = renderHook(() => useCalendarSync());

      await act(async () => {
        const success = await result.current.exportEventToCalendar(mockEvent);
        expect(success).toBe(false);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Could not add event to calendar. Please try again.'
      );
    });
  });
});
