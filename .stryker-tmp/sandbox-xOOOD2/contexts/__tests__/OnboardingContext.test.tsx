// @ts-nocheck
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { OnboardingProvider, useOnboarding } from '../OnboardingContext';

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockGetItem(...args),
    setItem: (...args: unknown[]) => mockSetItem(...args),
    removeItem: (...args: unknown[]) => mockRemoveItem(...args),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <OnboardingProvider>{children}</OnboardingProvider>
);

describe('OnboardingContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
    mockRemoveItem.mockResolvedValue(undefined);
  });

  it('hydrates state from AsyncStorage on mount', async () => {
    mockGetItem.mockResolvedValueOnce(
      JSON.stringify({
        city: 'Melbourne',
        country: 'Australia',
        isComplete: true,
      }),
    );

    const { result } = renderHook(() => useOnboarding(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.state.city).toBe('Melbourne');
    expect(result.current.state.country).toBe('Australia');
    expect(result.current.state.isComplete).toBe(true);
  });

  it('updates location and persists the new value', async () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateLocation('Australia', 'Perth');
    });

    expect(result.current.state.country).toBe('Australia');
    expect(result.current.state.city).toBe('Perth');
    expect(mockSetItem).toHaveBeenCalled();
    const lastPersistedPayload = mockSetItem.mock.calls.at(-1)?.[1] as string;
    expect(lastPersistedPayload).toContain('"country":"Australia"');
    expect(lastPersistedPayload).toContain('"city":"Perth"');
  });

  it('resets onboarding state and removes persisted storage', async () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.completeOnboarding();
      await result.current.setInterests(['food', 'music']);
      await result.current.resetOnboarding();
    });

    expect(result.current.state.isComplete).toBe(false);
    expect(result.current.state.interests).toEqual([]);
    expect(result.current.state.city).toBe('');
    expect(mockRemoveItem).toHaveBeenCalledWith('@culturepass_onboarding');
  });

  it('throws a helpful error when hook is used outside provider', () => {
    expect(() => renderHook(() => useOnboarding())).toThrow(
      'useOnboarding must be used within an OnboardingProvider',
    );
  });
});
