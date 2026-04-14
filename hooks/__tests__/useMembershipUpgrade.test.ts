import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router, usePathname } from 'expo-router';

import { useMembershipUpgrade } from '../useMembershipUpgrade';
import { useAuth } from '@/lib/auth';
import { queryClient } from '@/lib/query-client';
import { HapticManager } from '@/lib/haptics';
import { membershipRepository } from '@/repositories/MembershipRepository';
import { purchaseMembershipUseCase } from '@/use-cases/PurchaseMembershipUseCase';
import { cancelMembershipUseCase } from '@/use-cases/CancelMembershipUseCase';
import type { MembershipSummary } from '@/lib/api';

// Mocks
jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  usePathname: jest.fn(() => '/test-path'),
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn(),
  };
});

jest.mock('@/lib/query-client', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
    getQueryData: jest.fn(),
    setQueryData: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/haptics', () => ({
  HapticManager: {
    medium: jest.fn(),
    success: jest.fn(),
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

import { useQuery } from '@tanstack/react-query';

const mockUseQuery = useQuery as jest.Mock;

describe('useMembershipUpgrade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock setup for useQuery
    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'membership') {
        return { data: null, isLoading: false };
      }
      if (queryKey[0] === 'membership-member-count') {
        return { data: { count: 0 } };
      }
      return { data: null };
    });

    (useAuth as jest.Mock).mockReturnValue({
      userId: 'test-user-id',
      isAuthenticated: true,
    });
  });

  describe('Initial State', () => {
    it('should initialize with expected defaults', () => {
      const { result } = renderHook(() => useMembershipUpgrade());

      expect(result.current.loading).toBe(false);
      expect(result.current.billingPeriod).toBe('monthly');
      expect(result.current.price).toBe('$7.99');
      expect(result.current.perMonth).toBe('$7.99');
      expect(result.current.isPlus).toBe(false);
      expect(result.current.memberCount).toBe(0);
    });

    it('should compute isPlus correctly when membership data exists', () => {
      mockUseQuery.mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'membership') {
          return {
            data: { tier: 'plus', status: 'active' } as MembershipSummary,
            isLoading: false,
          };
        }
        return { data: null };
      });

      const { result } = renderHook(() => useMembershipUpgrade());
      expect(result.current.isPlus).toBe(true);
    });

    it('should update billing period and pricing', () => {
      const { result } = renderHook(() => useMembershipUpgrade());

      act(() => {
        result.current.setBillingPeriod('yearly');
      });

      expect(result.current.billingPeriod).toBe('yearly');
      expect(result.current.price).toBe('$69');
      expect(result.current.perMonth).toBe('$5.75');
    });
  });

  describe('Authentication requirements', () => {
    it('should require login for subscribe', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        userId: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeSubscribe();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Login required',
        'Please sign in to activate CulturePass+.',
        expect.any(Array)
      );

      // Verify routing when 'Sign in' is pressed
      const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
      const signinAction = alertArgs[2].find((btn: any) => btn.text === 'Sign in');

      act(() => {
        signinAction.onPress();
      });

      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/(onboarding)/login' })
      );
      expect(purchaseMembershipUseCase.execute).not.toHaveBeenCalled();
    });

    it('should silently return if executing cancel when not logged in', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        userId: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeCancel();
      });

      expect(Alert.alert).not.toHaveBeenCalled();
      expect(cancelMembershipUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('executeSubscribe', () => {
    it('should handle dev_mode_success response', async () => {
      (purchaseMembershipUseCase.execute as jest.Mock).mockResolvedValue({
        status: 'dev_mode_success',
      });

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeSubscribe();
      });

      expect(purchaseMembershipUseCase.execute).toHaveBeenCalledWith('monthly');
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['membership', 'test-user-id'] });
      expect(HapticManager.success).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Dev Mode', 'Membership upgraded to Plus (dev mode — no Stripe charge).');
    });

    it('should handle already_active response', async () => {
      (purchaseMembershipUseCase.execute as jest.Mock).mockResolvedValue({
        status: 'already_active',
      });

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeSubscribe();
      });

      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['membership', 'test-user-id'] });
      expect(Alert.alert).toHaveBeenCalledWith('Already Active', 'Your CulturePass+ membership is already active.');
    });

    it('should handle error response', async () => {
      (purchaseMembershipUseCase.execute as jest.Mock).mockResolvedValue({
        status: 'error',
        message: 'Something went wrong',
      });

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeSubscribe();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Something went wrong');
    });

    it('should handle thrown error', async () => {
      (purchaseMembershipUseCase.execute as jest.Mock).mockRejectedValue(new Error('Network failure'));

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeSubscribe();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network failure');
    });

    it('should show default error message when a non-Error value is thrown', async () => {
      (purchaseMembershipUseCase.execute as jest.Mock).mockRejectedValue('Some string error');

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeSubscribe();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to start subscription');
    });

    it('should handle checkout_required response and poll for updates', async () => {
      (purchaseMembershipUseCase.execute as jest.Mock).mockResolvedValue({
        status: 'checkout_required',
        url: 'https://checkout.stripe.com/test',
      });

      // Mock repository to simulate successful polling on the first try
      (membershipRepository.getMembership as jest.Mock).mockResolvedValue({
        tier: 'plus',
        status: 'active',
      });

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeSubscribe();
      });

      expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://checkout.stripe.com/test');
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['membership', 'test-user-id'] });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['membership-member-count'] });

      // Verification of polling
      expect(membershipRepository.getMembership).toHaveBeenCalledWith('test-user-id');
      expect(HapticManager.success).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Welcome to CulturePass+!',
        'Your membership is now active. Enjoy early access, cashback rewards, and exclusive perks!'
      );
    });
  });

  describe('executeCancel', () => {
    it('should display confirmation dialog and cancel membership', async () => {
      (cancelMembershipUseCase.execute as jest.Mock).mockResolvedValue({
        status: 'success',
      });

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeCancel();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Cancel Membership',
        expect.any(String),
        expect.any(Array)
      );

      // Trigger the actual cancellation press
      const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
      const cancelAction = alertArgs[2].find((btn: any) => btn.text === 'Cancel Membership');

      await act(async () => {
        await cancelAction.onPress();
      });

      expect(cancelMembershipUseCase.execute).toHaveBeenCalled();
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['membership', 'test-user-id'] });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['membership-member-count'] });
      expect(queryClient.setQueryData).toHaveBeenCalledWith(
        ['membership', 'test-user-id'],
        expect.objectContaining({ tier: 'free', status: 'inactive' })
      );
      expect(HapticManager.success).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Membership Cancelled',
        'Your CulturePass+ membership has been cancelled. You can re-subscribe anytime.'
      );
    });

    it('should handle cancel failure from use case', async () => {
      (cancelMembershipUseCase.execute as jest.Mock).mockResolvedValue({
        status: 'error',
        message: 'Could not cancel right now',
      });

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeCancel();
      });

      const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
      const cancelAction = alertArgs[2].find((btn: any) => btn.text === 'Cancel Membership');

      await act(async () => {
        await cancelAction.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Could not cancel right now');
    });

    it('should handle thrown error during cancellation', async () => {
      (cancelMembershipUseCase.execute as jest.Mock).mockRejectedValue(new Error('Network failure during cancellation'));

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeCancel();
      });

      const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
      const cancelAction = alertArgs[2].find((btn: any) => btn.text === 'Cancel Membership');

      await act(async () => {
        await cancelAction.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network failure during cancellation');
    });

    it('should show default error message when a non-Error value is thrown during cancellation', async () => {
      (cancelMembershipUseCase.execute as jest.Mock).mockRejectedValue(12345);

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeCancel();
      });

      const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
      const cancelAction = alertArgs[2].find((btn: any) => btn.text === 'Cancel Membership');

      await act(async () => {
        await cancelAction.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to cancel');
    });
  });
});
