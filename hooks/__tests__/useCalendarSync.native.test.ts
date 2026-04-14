import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Platform, Alert, Linking } from 'react-native';

// Try to mock the module by putting it into the global require cache manually or using doMock.
// But earlier we saw `jest.mock` actually works fine if we mock the module properly,
// The problem was our virtual mock somehow got lost or `isCalendarLinked` evaluated to false.
// By putting the mock in `__mocks__/expo-calendar.js`, Jest automatically resolves it!

// Now import the hook
import { useCalendarSync } from '../useCalendarSync.native';

// Retrieve the mocked functions from the automatically mocked module
// eslint-disable-next-line @typescript-eslint/no-require-imports
const expoCalendar = require('expo-calendar');

// Mock React Native Alert & Linking
jest.spyOn(Alert, 'alert');
jest.spyOn(Linking, 'openSettings');

// Mock @tanstack/react-query
const mockQueryClient = { setQueryData: jest.fn() };
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(() => mockQueryClient),
  useQuery: jest.fn((...args) => mockUseQuery(...args)),
  useMutation: jest.fn((...args) => mockUseMutation(...args)),
}));

// Mock api
const mockGetSettings = jest.fn();
const mockUpdateSettings = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    calendar: {
      getSettings: mockGetSettings,
      updateSettings: mockUpdateSettings,
    },
  },
}));

describe('useCalendarSync.native', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseQuery.mockReturnValue({
      data: { deviceConnected: false, showPersonalEvents: true, autoAddTickets: false },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockUpdateSettings,
      isPending: false,
    });

    mockUpdateSettings.mockImplementation(async (prefs) => {
      // Simulate success callback
      const [, options] = mockUseMutation.mock.calls[0];
      if (options && options.onSuccess) {
        options.onSuccess({ ...prefs });
      }
      return prefs;
    });

    expoCalendar.getCalendarPermissionsAsync.mockResolvedValue({ granted: true });
    expoCalendar.requestCalendarPermissionsAsync.mockResolvedValue({ granted: true });

    Object.defineProperty(Platform, 'OS', { get: jest.fn(() => 'ios') });
  });

  it('should initialize correctly', async () => {
    const { result } = renderHook(() => useCalendarSync());
    expect(result.current.prefs).toBeDefined();
    // if the mock loaded correctly, isCalendarLinked should be true
    expect(result.current.isCalendarLinked).toBe(true);

    // Wait for the useEffect permission check
    await waitFor(() => {
      expect(expoCalendar.getCalendarPermissionsAsync).toHaveBeenCalled();
    });
  });

  describe('Permissions', () => {
    it('should check permissions on mount', async () => {
      renderHook(() => useCalendarSync());
      await waitFor(() => {
        expect(expoCalendar.getCalendarPermissionsAsync).toHaveBeenCalled();
      });
    });

    it('should connect device calendar when permission is granted', async () => {
      const { result } = renderHook(() => useCalendarSync());

      await act(async () => {
        await result.current.connectDeviceCalendar();
      });

      expect(expoCalendar.requestCalendarPermissionsAsync).toHaveBeenCalled();
      expect(mockUpdateSettings).toHaveBeenCalledWith({ deviceConnected: true });
    });

    it('should not connect device calendar when permission is denied', async () => {
      expoCalendar.requestCalendarPermissionsAsync.mockResolvedValueOnce({ granted: false });
      const { result } = renderHook(() => useCalendarSync());

      await act(async () => {
        await result.current.connectDeviceCalendar();
      });

      expect(expoCalendar.requestCalendarPermissionsAsync).toHaveBeenCalled();
      expect(mockUpdateSettings).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Calendar Permission Required',
        expect.any(String),
        expect.any(Array)
      );
    });

    it('should disconnect device calendar', async () => {
      const { result } = renderHook(() => useCalendarSync());

      await act(async () => {
        await result.current.disconnectDeviceCalendar();
      });

      expect(mockUpdateSettings).toHaveBeenCalledWith({ deviceConnected: false });
      expect(result.current.personalEvents).toEqual([]);
    });
  });

  describe('fetchPersonalEvents', () => {
    it('should fetch and map personal events', async () => {
      mockUseQuery.mockReturnValue({
        data: { deviceConnected: true, showPersonalEvents: true, autoAddTickets: false },
        isLoading: false,
      });

      const { result } = renderHook(() => useCalendarSync());

      // Wait for mount useEffect to finish setting permissionGranted to true
      await waitFor(() => {
        expect(result.current.permissionGranted).toBe(true);
      });

      const mockCalendars = [
        { id: 'cal1', title: 'Work', color: '#ff0000' }
      ];
      expoCalendar.getCalendarsAsync.mockResolvedValueOnce(mockCalendars);

      const mockEvents = [
        { id: 'ev1', title: 'Meeting', startDate: '2023-01-01T10:00:00Z', endDate: '2023-01-01T11:00:00Z', calendarId: 'cal1' }
      ];
      expoCalendar.getEventsAsync.mockResolvedValueOnce(mockEvents);

      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-01-01T23:59:59Z');

      await act(async () => {
        await result.current.fetchPersonalEvents(startDate, endDate);
      });

      expect(expoCalendar.getCalendarsAsync).toHaveBeenCalledWith('EVENT');
      expect(expoCalendar.getEventsAsync).toHaveBeenCalledWith(['cal1'], startDate, endDate);
      expect(result.current.personalEvents).toHaveLength(1);
      expect(result.current.personalEvents[0]).toMatchObject({
        id: 'ev1',
        title: 'Meeting',
        calendarName: 'Work',
        color: '#ff0000'
      });
    });

    it('should return early if device not connected', async () => {
      mockUseQuery.mockReturnValue({
        data: { deviceConnected: false, showPersonalEvents: true, autoAddTickets: false },
        isLoading: false,
      });

      const { result } = renderHook(() => useCalendarSync());

      await act(async () => {
        await result.current.fetchPersonalEvents(new Date(), new Date());
      });

      expect(expoCalendar.getCalendarsAsync).not.toHaveBeenCalled();
    });
  });

  describe('exportEventToCalendar', () => {
    it('should export event to writable calendar', async () => {
      const { result } = renderHook(() => useCalendarSync());

      await waitFor(() => {
        expect(result.current.permissionGranted).toBe(true);
      });

      expoCalendar.getCalendarsAsync.mockResolvedValueOnce([
        { id: 'cal1', allowsModifications: false },
        { id: 'cal2', allowsModifications: true, isPrimary: true }
      ]);

      const mockEventData = {
        id: '123',
        title: 'Test Event',
        date: new Date('2023-01-01T12:00:00Z'),
        venue: 'Test Venue',
        description: 'Test Description',
      };

      let success;
      await act(async () => {
        // @ts-ignore - mock event data
        success = await result.current.exportEventToCalendar(mockEventData);
      });

      expect(success).toBe(true);
      expect(expoCalendar.createEventAsync).toHaveBeenCalledWith('cal2', expect.objectContaining({
        title: 'Test Event',
        notes: 'Test Description',
        location: 'Test Venue',
      }));
      expect(Alert.alert).toHaveBeenCalledWith('Added to Calendar', expect.any(String));
    });

    it('should show alert if no writable calendar found', async () => {
      const { result } = renderHook(() => useCalendarSync());

      await waitFor(() => {
        expect(result.current.permissionGranted).toBe(true);
      });

      expoCalendar.getCalendarsAsync.mockResolvedValueOnce([
        { id: 'cal1', allowsModifications: false },
      ]);

      let success;
      await act(async () => {
        // @ts-ignore
        success = await result.current.exportEventToCalendar({ id: '123' });
      });

      expect(success).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith('No writable calendar found', expect.any(String));
    });

    it('should handle exportAllTickets', async () => {
      const { result } = renderHook(() => useCalendarSync());

      await waitFor(() => {
        expect(result.current.permissionGranted).toBe(true);
      });

      expoCalendar.getCalendarsAsync.mockResolvedValue([
        { id: 'cal1', allowsModifications: true, isPrimary: true }
      ]);

      const mockEvents = [
        { id: '1', title: 'Ev1' },
        { id: '2', title: 'Ev2' }
      ];

      await act(async () => {
        // @ts-ignore
        await result.current.exportAllTickets(mockEvents);
      });

      expect(expoCalendar.createEventAsync).toHaveBeenCalledTimes(2);
      expect(Alert.alert).toHaveBeenCalledWith('Sync Complete', expect.any(String));
    });
  });

  describe('Preferences', () => {
    it('should set showPersonalEvents', async () => {
      const { result } = renderHook(() => useCalendarSync());

      await act(async () => {
        await result.current.setShowPersonalEvents(false);
      });

      expect(mockUpdateSettings).toHaveBeenCalledWith({ showPersonalEvents: false });
    });

    it('should set autoAddTickets', async () => {
      const { result } = renderHook(() => useCalendarSync());

      await act(async () => {
        await result.current.setAutoAddTickets(true);
      });

      expect(mockUpdateSettings).toHaveBeenCalledWith({ autoAddTickets: true });
    });
  });
});
