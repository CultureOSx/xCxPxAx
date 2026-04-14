import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useMembershipUpgrade } from '../useMembershipUpgrade';
import { cancelMembershipUseCase } from '@/use-cases/CancelMembershipUseCase';
import { purchaseMembershipUseCase } from '@/use-cases/PurchaseMembershipUseCase';
import { useAuth } from '@/lib/auth';
import { queryClient } from '@/lib/query-client';

// Mock dependencies
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({ data: undefined, isLoading: false })),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  usePathname: jest.fn(() => '/test'),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    userId: 'test-uid',
  })),
}));

jest.mock('@/lib/query-client', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
    getQueryData: jest.fn(),
    setQueryData: jest.fn(),
  },
}));

jest.mock('@/lib/haptics', () => ({
  HapticManager: {
    medium: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/repositories/MembershipRepository', () => ({
  membershipRepository: {
    getMembership: jest.fn(),
    getMemberCount: jest.fn(),
  },
}));

jest.mock('@/use-cases/PurchaseMembershipUseCase', () => ({
  purchaseMembershipUseCase: {
    execute: jest.fn(),
  },
}));

jest.mock('@/use-cases/CancelMembershipUseCase', () => ({
  cancelMembershipUseCase: {
    execute: jest.fn(),
  },
}));

describe('useMembershipUpgrade hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles cancel error result correctly', async () => {
    (cancelMembershipUseCase.execute as jest.Mock).mockResolvedValueOnce({
      status: 'error',
      message: 'Failed on server side',
    });

    const { result } = renderHook(() => useMembershipUpgrade());

    await act(async () => {
      await result.current.executeCancel();
    });

    // Alert should have been called to confirm cancellation
    expect(Alert.alert).toHaveBeenCalledWith(
      'Cancel Membership',
      expect.any(String),
      expect.any(Array)
    );

    // Get the onPress function from the second button
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const confirmButton = buttons.find((b: any) => b.text === 'Cancel Membership');

    await act(async () => {
      await confirmButton.onPress();
    });

    // It should show an error alert
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed on server side');
    expect(result.current.loading).toBe(false);
  });

  it('handles cancel exception correctly', async () => {
    (cancelMembershipUseCase.execute as jest.Mock).mockRejectedValueOnce(
      new Error('Network disconnected')
    );

    const { result } = renderHook(() => useMembershipUpgrade());

    await act(async () => {
      await result.current.executeCancel();
    });

    // Alert should have been called to confirm cancellation
    expect(Alert.alert).toHaveBeenCalledWith(
      'Cancel Membership',
      expect.any(String),
      expect.any(Array)
    );

    // Get the onPress function from the second button
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const confirmButton = buttons.find((b: any) => b.text === 'Cancel Membership');

    await act(async () => {
      await confirmButton.onPress();
    });

    // It should show an error alert with the exception message
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network disconnected');
    expect(result.current.loading).toBe(false);
  });

  it('handles subscribe exception correctly', async () => {
    (purchaseMembershipUseCase.execute as jest.Mock).mockRejectedValueOnce(
      new Error('Subscription failed')
    );

    const { result } = renderHook(() => useMembershipUpgrade());

    await act(async () => {
      await result.current.executeSubscribe();
    });

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Subscription failed');
    expect(result.current.loading).toBe(false);
  });

  it('handles subscribe error correctly', async () => {
    (purchaseMembershipUseCase.execute as jest.Mock).mockResolvedValueOnce({
      status: 'error',
      message: 'Payment failed'
    });

    const { result } = renderHook(() => useMembershipUpgrade());

    await act(async () => {
      await result.current.executeSubscribe();
    });

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Payment failed');
    expect(result.current.loading).toBe(false);
  });

  it('handles subscribe dev_mode_success correctly', async () => {
    (purchaseMembershipUseCase.execute as jest.Mock).mockResolvedValueOnce({
      status: 'dev_mode_success',
    });

    const { result } = renderHook(() => useMembershipUpgrade());

    await act(async () => {
      await result.current.executeSubscribe();
    });

    expect(Alert.alert).toHaveBeenCalledWith('Dev Mode', expect.any(String));
    expect(result.current.loading).toBe(false);
  });

  it('handles subscribe already_active correctly', async () => {
    (purchaseMembershipUseCase.execute as jest.Mock).mockResolvedValueOnce({
      status: 'already_active',
    });

    const { result } = renderHook(() => useMembershipUpgrade());

    await act(async () => {
      await result.current.executeSubscribe();
    });

    expect(Alert.alert).toHaveBeenCalledWith('Already Active', expect.any(String));
    expect(result.current.loading).toBe(false);
  });

  it('handles subscribe checkout_required correctly', async () => {
    (purchaseMembershipUseCase.execute as jest.Mock).mockResolvedValueOnce({
      status: 'checkout_required',
      url: 'https://checkout.stripe.com/test'
    });

    // For the retry polling
    const WebBrowser = require('expo-web-browser');
    WebBrowser.openBrowserAsync.mockResolvedValueOnce({});

    const { membershipRepository } = require('@/repositories/MembershipRepository');
    membershipRepository.getMembership.mockResolvedValueOnce({
      tier: 'plus',
      status: 'active'
    });

    const { result } = renderHook(() => useMembershipUpgrade());

    await act(async () => {
      await result.current.executeSubscribe();
    });

    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://checkout.stripe.com/test');
    expect(Alert.alert).toHaveBeenCalledWith('Welcome to CulturePass+!', expect.any(String));
    expect(result.current.loading).toBe(false);
  });

  it('shows unauthenticated alert when subscribing without user', async () => {
    (useAuth as jest.Mock).mockReturnValueOnce({
      isAuthenticated: false,
      userId: null,
    });

    const { result } = renderHook(() => useMembershipUpgrade());

    await act(async () => {
      await result.current.executeSubscribe();
    });

    expect(Alert.alert).toHaveBeenCalledWith('Login required', expect.any(String), expect.any(Array));
  });

  it('handles successful cancellation', async () => {
    (cancelMembershipUseCase.execute as jest.Mock).mockResolvedValueOnce({
      status: 'success',
    });

    const { result } = renderHook(() => useMembershipUpgrade());

    await act(async () => {
      await result.current.executeCancel();
    });

    // Alert should have been called to confirm cancellation
    expect(Alert.alert).toHaveBeenCalledWith(
      'Cancel Membership',
      expect.any(String),
      expect.any(Array)
    );

    // Get the onPress function from the second button
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const confirmButton = buttons.find((b: any) => b.text === 'Cancel Membership');

    await act(async () => {
      await confirmButton.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith('Membership Cancelled', expect.any(String));
    expect(result.current.loading).toBe(false);
  });
});
