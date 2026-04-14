/**
 * Isolated test for the isCalendarLinked = false path.
 *
 * This file mocks expo-calendar to throw at require time, simulating a build
 * where the native Calendar module is not linked. It must be in a separate
 * file from the main suite so Jest loads it with a fresh module registry where
 * expo-calendar is absent from the start.
 */
import { renderHook, act } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';

// Simulate missing native module — the try/catch in useCalendarSync.native.ts
// will catch this and leave ExpoCalendar = null, making isCalendarLinked = false.
jest.mock('expo-calendar', () => {
  throw new Error('Native module not found');
});

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

describe('useCalendarSync.native hook — calendar module missing', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
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

  it('returns false and alerts when calendar module is missing', async () => {
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

  it('exposes isCalendarLinked as false', () => {
    const { result } = renderHook(() => useCalendarSync());
    expect(result.current.isCalendarLinked).toBe(false);
  });
});
