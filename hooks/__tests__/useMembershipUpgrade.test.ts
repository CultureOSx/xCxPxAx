import { renderHook, act } from '@testing-library/react-native';
import { useMembershipUpgrade } from '../useMembershipUpgrade';
import { Alert } from 'react-native';
import { useAuth } from '@/lib/auth';
import { purchaseMembershipUseCase } from '@/use-cases/PurchaseMembershipUseCase';
import { cancelMembershipUseCase } from '@/use-cases/CancelMembershipUseCase';

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({ data: undefined, isLoading: false })),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  usePathname: jest.fn(() => '/mock-path'),
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

jest.mock('@/lib/routes', () => ({
  routeWithRedirect: jest.fn((route) => route),
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

describe('useMembershipUpgrade error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      userId: 'test-user',
      isAuthenticated: true,
    });
  });

  describe('executeSubscribe', () => {
    it('should show error alert when purchaseMembershipUseCase returns error status', async () => {
      (purchaseMembershipUseCase.execute as jest.Mock).mockResolvedValueOnce({
        status: 'error',
        message: 'Custom Error',
      });

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeSubscribe();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Custom Error');
    });

    it('should show error alert when purchaseMembershipUseCase throws an Error instance', async () => {
      (purchaseMembershipUseCase.execute as jest.Mock).mockRejectedValueOnce(
        new Error('Network failure')
      );

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeSubscribe();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network failure');
    });

    it('should show default error alert when purchaseMembershipUseCase throws a non-Error', async () => {
      (purchaseMembershipUseCase.execute as jest.Mock).mockRejectedValueOnce('Some string error');

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeSubscribe();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to start subscription');
    });
  });

  describe('executeCancel', () => {
    // Helper to simulate the user pressing "Cancel Membership" in the first alert
    const simulateConfirmCancel = async () => {
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      expect(alertCalls.length).toBeGreaterThan(0);
      const buttons = alertCalls[0][2];
      const confirmButton = buttons.find((b: any) => b.style === 'destructive');
      expect(confirmButton).toBeDefined();
      await act(async () => {
        await confirmButton.onPress();
      });
    };

    it('should show error alert when cancelMembershipUseCase returns error status', async () => {
      (cancelMembershipUseCase.execute as jest.Mock).mockResolvedValueOnce({
        status: 'error',
        message: 'Cancel Error',
      });

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeCancel();
      });

      await simulateConfirmCancel();

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Cancel Error');
    });

    it('should show error alert when cancelMembershipUseCase throws an Error instance', async () => {
      (cancelMembershipUseCase.execute as jest.Mock).mockRejectedValueOnce(
        new Error('Cancellation failed')
      );

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeCancel();
      });

      await simulateConfirmCancel();

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Cancellation failed');
    });

    it('should show default error alert when cancelMembershipUseCase throws a non-Error', async () => {
      (cancelMembershipUseCase.execute as jest.Mock).mockRejectedValueOnce(12345);

      const { result } = renderHook(() => useMembershipUpgrade());

      await act(async () => {
        await result.current.executeCancel();
      });

      await simulateConfirmCancel();

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to cancel');
    });
  });
});
