import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router, usePathname } from 'expo-router';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/lib/auth';
import { HapticManager } from '@/lib/haptics';

import { membershipRepository } from '@/repositories/MembershipRepository';
import { purchaseMembershipUseCase } from '@/use-cases/PurchaseMembershipUseCase';
import { cancelMembershipUseCase } from '@/use-cases/CancelMembershipUseCase';
import { useMembershipUpgrade } from '../useMembershipUpgrade';

// --- Mocks ---

jest.spyOn(Alert, 'alert');

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn().mockReturnValue({
    data: null,
    isLoading: false,
  }),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  usePathname: jest.fn().mockReturnValue('/test-path'),
}));

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

// --- Tests ---

describe('useMembershipUpgrade error paths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      userId: 'user123',
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('executeSubscribe', () => {
    it('handles unexpected errors gracefully during subscription', async () => {
      const mockError = new Error('Network failure');
      (purchaseMembershipUseCase.execute as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeSubscribe();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network failure');
      expect(result.current.loading).toBe(false);
    });

    it('handles non-Error objects thrown during subscription', async () => {
      (purchaseMembershipUseCase.execute as jest.Mock).mockRejectedValue('String error');

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeSubscribe();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to start subscription');
      expect(result.current.loading).toBe(false);
    });

    it('shows error alert when use-case returns error status', async () => {
      (purchaseMembershipUseCase.execute as jest.Mock).mockResolvedValue({
        status: 'error',
        message: 'Insufficient funds',
      });

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeSubscribe();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Insufficient funds');
      expect(result.current.loading).toBe(false);
    });

    it('handles unauthenticated state', async () => {
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
      expect(purchaseMembershipUseCase.execute).not.toHaveBeenCalled();
    });

    describe('checkout polling', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      it('continues polling even if getMembership throws an error, and eventually succeeds', async () => {
        (purchaseMembershipUseCase.execute as jest.Mock).mockResolvedValue({
          status: 'checkout_required',
          url: 'https://checkout.stripe.com/test',
        });

        // Fail once, fail twice, succeed on third attempt
        (membershipRepository.getMembership as jest.Mock)
          .mockRejectedValueOnce(new Error('Network error 1'))
          .mockRejectedValueOnce(new Error('Network error 2'))
          .mockResolvedValueOnce({ tier: 'plus', status: 'active' });

        const { result } = renderHook(() => useMembershipUpgrade());

        // Start execution
        let executePromise: Promise<void>;
        await act(async () => {
          executePromise = result.current.executeSubscribe();
        });

        // Advance timer for 1st retry
        await act(async () => {
          jest.advanceTimersByTime(2000);
        });

        // Advance timer for 2nd retry
        await act(async () => {
          jest.advanceTimersByTime(2000);
        });

        // Wait for it to finish
        await act(async () => {
          await executePromise;
        });

        expect(membershipRepository.getMembership).toHaveBeenCalledTimes(3);
        expect(Alert.alert).toHaveBeenCalledWith(
          'Welcome to CulturePass+!',
          expect.any(String)
        );
      });

      it('stops polling after max retries and fails silently as designed', async () => {
        (purchaseMembershipUseCase.execute as jest.Mock).mockResolvedValue({
          status: 'checkout_required',
          url: 'https://checkout.stripe.com/test',
        });

        (membershipRepository.getMembership as jest.Mock).mockRejectedValue(new Error('Persistent error'));

        const { result } = renderHook(() => useMembershipUpgrade());

        let executePromise: Promise<void>;
        await act(async () => {
          executePromise = result.current.executeSubscribe();
        });

        // Advance time for 8 retries (8 * 2000 = 16000ms)
        for (let i = 0; i < 9; i++) {
          await act(async () => {
             jest.advanceTimersByTime(2000);
          });
        }

        await act(async () => {
           await executePromise;
        });

        expect(membershipRepository.getMembership).toHaveBeenCalledTimes(8);
        expect(Alert.alert).not.toHaveBeenCalledWith('Welcome to CulturePass+!', expect.any(String));
      });
    });
  });

  describe('executeCancel', () => {
    it('handles unexpected errors gracefully during cancellation', async () => {
      const mockError = new Error('Database failure');
      (cancelMembershipUseCase.execute as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeCancel();
      });

      // Find the cancel button press callback in the Alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(call => call[0] === 'Cancel Membership');
      expect(alertCall).toBeDefined();

      const cancelAction = alertCall[2].find((button: any) => button.style === 'destructive');
      expect(cancelAction).toBeDefined();

      await act(async () => {
        await cancelAction.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Database failure');
      expect(result.current.loading).toBe(false);
    });

    it('handles non-Error objects thrown during cancellation', async () => {
       (cancelMembershipUseCase.execute as jest.Mock).mockRejectedValue('Some error');

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeCancel();
      });

      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(call => call[0] === 'Cancel Membership');
      const cancelAction = alertCall[2].find((button: any) => button.style === 'destructive');

      await act(async () => {
        await cancelAction.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to cancel');
      expect(result.current.loading).toBe(false);
    });

    it('shows error alert when use-case returns error status on cancellation', async () => {
      (cancelMembershipUseCase.execute as jest.Mock).mockResolvedValue({
        status: 'error',
        message: 'Cannot cancel right now',
      });

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeCancel();
      });

      const alertCall = (Alert.alert as jest.Mock).mock.calls.find(call => call[0] === 'Cancel Membership');
      const cancelAction = alertCall[2].find((button: any) => button.style === 'destructive');

      await act(async () => {
        await cancelAction.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Cannot cancel right now');
      expect(result.current.loading).toBe(false);
    });
  });
});
