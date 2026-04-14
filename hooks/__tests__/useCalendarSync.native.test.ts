import { renderHook, act } from '@testing-library/react-native';
import { Platform, Alert, Linking } from 'react-native';
import { useCalendarSync } from '../useCalendarSync.native';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Alert: { alert: jest.fn() },
  Linking: { openSettings: jest.fn() },
}));

const mockGetCalendarsAsync = jest.fn();
const mockGetEventsAsync = jest.fn();
const mockCreateEventAsync = jest.fn();
const mockGetCalendarPermissionsAsync = jest.fn();
const mockRequestCalendarPermissionsAsync = jest.fn();
const mockEntityTypes = { EVENT: 'event' };

jest.mock('expo-calendar', () => {
  return {
    getCalendarsAsync: (...args: any[]) => mockGetCalendarsAsync(...args),
    getEventsAsync: (...args: any[]) => mockGetEventsAsync(...args),
    createEventAsync: (...args: any[]) => mockCreateEventAsync(...args),
    getCalendarPermissionsAsync: (...args: any[]) => mockGetCalendarPermissionsAsync(...args),
    requestCalendarPermissionsAsync: (...args: any[]) => mockRequestCalendarPermissionsAsync(...args),
    EntityTypes: { EVENT: 'event' },
  };
});

const mockQueryClientSetQueryData = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    setQueryData: mockQueryClientSetQueryData,
  }),
  useQuery: () => ({
    data: { deviceConnected: true, showPersonalEvents: true, autoAddTickets: false },
    isLoading: false,
  }),
  useMutation: ({ mutationFn, onSuccess }: any) => ({
    mutateAsync: async (vars: any) => {
      const res = await mutationFn(vars);
      if (onSuccess) onSuccess(res);
      return res;
    },
    isPending: false,
  }),
}));

const mockApiCalendarUpdateSettings = jest.fn();
const mockApiCalendarGetSettings = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    calendar: {
      updateSettings: mockApiCalendarUpdateSettings,
      getSettings: mockApiCalendarGetSettings,
    },
  },
}));

describe('useCalendarSync.native', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCalendarPermissionsAsync.mockResolvedValue({ granted: true });
    mockRequestCalendarPermissionsAsync.mockResolvedValue({ granted: true });
    mockApiCalendarUpdateSettings.mockResolvedValue({ deviceConnected: true, showPersonalEvents: true, autoAddTickets: false });
  });

  const setupHookWithPermissions = async () => {
    const { result } = renderHook(() => useCalendarSync());
    // Simulate useEffect by granting permission explicitly if it didn't trigger
    await act(async () => {
      // the useCalendarSync hook checks permission on mount in a useEffect
      // so we wait a tick to allow the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // If still not granted, manually call requestPermission to grant it for the test
    if (!result.current.permissionGranted) {
      await act(async () => {
        await result.current.connectDeviceCalendar();
      });
    }
    return result;
  };

  describe('fetchPersonalEvents error handling', () => {
    it('should silently ignore errors from getCalendarsAsync', async () => {
      const result = await setupHookWithPermissions();

      mockGetCalendarsAsync.mockRejectedValue(new Error('Permission denied'));

      await act(async () => {
        await result.current.fetchPersonalEvents(new Date(), new Date());
      });

      expect(result.current.personalEvents).toEqual([]);
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('should silently ignore errors from getEventsAsync', async () => {
      const result = await setupHookWithPermissions();

      mockGetCalendarsAsync.mockResolvedValue([{ id: 'cal1' }]);
      mockGetEventsAsync.mockRejectedValue(new Error('Database locked'));

      await act(async () => {
        await result.current.fetchPersonalEvents(new Date(), new Date());
      });

      expect(result.current.personalEvents).toEqual([]);
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  describe('exportEventToCalendar error handling', () => {
    const mockEvent = {
      id: 'e1',
      title: 'Test Event',
      date: new Date().toISOString(),
      venue: 'Test Venue',
      address: 'Test Address',
      city: 'Test City',
    };

    it('should return false and alert if getCalendarsAsync fails', async () => {
      const result = await setupHookWithPermissions();

      mockGetCalendarsAsync.mockRejectedValue(new Error('Module missing'));

      let success = true;
      await act(async () => {
        success = await result.current.exportEventToCalendar(mockEvent as any);
      });

      expect(success).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Could not add event to calendar. Please try again.');
    });

    it('should return false and alert if no writable calendar is found', async () => {
      const result = await setupHookWithPermissions();

      mockGetCalendarsAsync.mockResolvedValue([{ id: 'cal1', allowsModifications: false }]);

      let success = true;
      await act(async () => {
        success = await result.current.exportEventToCalendar(mockEvent as any);
      });

      expect(success).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith('No writable calendar found', 'Unable to add event to your calendar.');
      expect(mockCreateEventAsync).not.toHaveBeenCalled();
    });

    it('should return false and alert if createEventAsync fails', async () => {
      const result = await setupHookWithPermissions();

      mockGetCalendarsAsync.mockResolvedValue([{ id: 'cal1', allowsModifications: true }]);
      mockCreateEventAsync.mockRejectedValue(new Error('Invalid date'));

      let success = true;
      await act(async () => {
        success = await result.current.exportEventToCalendar(mockEvent as any);
      });

      expect(success).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Could not add event to calendar. Please try again.');
    });
  });

  describe('exportAllTickets', () => {
    it('should handle partial failures', async () => {
      const result = await setupHookWithPermissions();

      const mockEvents = [
        { id: 'e1', title: 'Event 1' },
        { id: 'e2', title: 'Event 2' }
      ];

      mockGetCalendarsAsync.mockResolvedValue([{ id: 'cal1', allowsModifications: true }]);
      mockCreateEventAsync
        .mockResolvedValueOnce('id1') // Success for first event
        .mockRejectedValueOnce(new Error('Failed')); // Failure for second event

      await act(async () => {
        await result.current.exportAllTickets(mockEvents as any[]);
      });

      expect(mockCreateEventAsync).toHaveBeenCalledTimes(2);
      expect(Alert.alert).toHaveBeenCalledWith('Sync Complete', '1 event added to your calendar.');
    });
  });
});
