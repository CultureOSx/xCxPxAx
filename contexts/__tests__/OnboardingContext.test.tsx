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

  it('uses expected default state shape when no persisted data exists', async () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.state.country).toBe('');
    expect(result.current.state.city).toBe('');
    expect(result.current.state.communities).toEqual([]);
    expect(result.current.state.nationalityId).toBe('');
    expect(result.current.state.cultureIds).toEqual([]);
    expect(result.current.state.languageIds).toEqual([]);
    expect(result.current.state.diasporaGroupIds).toEqual([]);
    expect(result.current.state.ethnicityText).toBe('');
    expect(result.current.state.languages).toEqual([]);
    expect(result.current.state.interests).toEqual([]);
    expect(result.current.state.subscriptionTier).toBe('free');
  });

  it('does not parse storage payload when getItem returns an empty string', async () => {
    const parseSpy = jest.spyOn(JSON, 'parse');
    mockGetItem.mockResolvedValueOnce('');

    const { result } = renderHook(() => useOnboarding(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(parseSpy).not.toHaveBeenCalled();
    parseSpy.mockRestore();
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

  it('updates key profile fields via setters and onboarding completion toggles', async () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setEthnicityText('Filipino');
      await result.current.setInterests(['food']);
      await result.current.setSubscriptionTier('plus');
      await result.current.completeOnboarding();
    });

    expect(result.current.state.ethnicityText).toBe('Filipino');
    expect(result.current.state.interests).toEqual(['food']);
    expect(result.current.state.subscriptionTier).toBe('plus');
    expect(result.current.state.isComplete).toBe(true);

    await act(async () => {
      await result.current.restartOnboarding();
    });

    expect(result.current.state.isComplete).toBe(false);
  });

  it('updates all location and identity setters with persisted state', async () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setCountry('Australia');
      await result.current.setCity('Brisbane');
      await result.current.setCommunities(['South Asian']);
      await result.current.setNationalityId('nat-au');
      await result.current.setCultureIds(['culture-1', 'culture-2']);
      await result.current.setLanguageIds(['en', 'hi']);
      await result.current.setDiasporaGroupIds(['diaspora-1']);
      await result.current.setLanguages(['English']);
    });

    expect(result.current.state.country).toBe('Australia');
    expect(result.current.state.city).toBe('Brisbane');
    expect(result.current.state.communities).toEqual(['South Asian']);
    expect(result.current.state.nationalityId).toBe('nat-au');
    expect(result.current.state.cultureIds).toEqual(['culture-1', 'culture-2']);
    expect(result.current.state.languageIds).toEqual(['en', 'hi']);
    expect(result.current.state.diasporaGroupIds).toEqual(['diaspora-1']);
    expect(result.current.state.languages).toEqual(['English']);

    const lastPersistedPayload = mockSetItem.mock.calls.at(-1)?.[1] as string;
    expect(lastPersistedPayload).toContain('"country":"Australia"');
    expect(lastPersistedPayload).toContain('"city":"Brisbane"');
    expect(lastPersistedPayload).toContain('"nationalityId":"nat-au"');
  });

  it('warns in dev when persistence fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockSetItem.mockRejectedValueOnce(new Error('persist-failed'));

    const { result } = renderHook(() => useOnboarding(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setCountry('Australia');
    });

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        '[OnboardingContext] AsyncStorage.setItem failed — onboarding state will not persist across sessions.',
        expect.any(Error),
      );
    });

    warnSpy.mockRestore();
  });

  it('does not warn in production mode when persistence fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const runtime = globalThis as unknown as { __DEV__?: boolean };
    const originalDev = runtime.__DEV__;
    runtime.__DEV__ = false;
    mockSetItem.mockRejectedValueOnce(new Error('persist-failed-prod'));

    const { result } = renderHook(() => useOnboarding(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setCountry('Australia');
    });

    await Promise.resolve();
    expect(warnSpy).not.toHaveBeenCalled();

    runtime.__DEV__ = originalDev;
    warnSpy.mockRestore();
  });

  it('throws a helpful error when hook is used outside provider', () => {
    expect(() => renderHook(() => useOnboarding())).toThrow(
      'useOnboarding must be used within an OnboardingProvider',
    );
  });
});
