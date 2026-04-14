import { PurchaseMembershipUseCase } from '../PurchaseMembershipUseCase';
import { membershipRepository } from '@/repositories/MembershipRepository';

jest.mock('@/repositories/MembershipRepository', () => ({
  membershipRepository: {
    subscribe: jest.fn(),
  },
}));

describe('PurchaseMembershipUseCase', () => {
  let useCase: PurchaseMembershipUseCase;
  const mockSubscribe = membershipRepository.subscribe as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new PurchaseMembershipUseCase();
  });

  describe('execute', () => {
    it('should return already_active status when user is already active', async () => {
      mockSubscribe.mockResolvedValue({ alreadyActive: true });

      const result = await useCase.execute('monthly');

      expect(result).toEqual({ status: 'already_active' });
      expect(mockSubscribe).toHaveBeenCalledWith('monthly');
    });

    it('should return checkout_required status with URL when checkout is required', async () => {
      const checkoutUrl = 'https://example.com/checkout';
      mockSubscribe.mockResolvedValue({ checkoutUrl });

      const result = await useCase.execute('yearly');

      expect(result).toEqual({ status: 'checkout_required', url: checkoutUrl });
      expect(mockSubscribe).toHaveBeenCalledWith('yearly');
    });

    it('should return dev_mode_success status when in dev mode', async () => {
      mockSubscribe.mockResolvedValue({ devMode: true });

      const result = await useCase.execute('monthly');

      expect(result).toEqual({ status: 'dev_mode_success' });
      expect(mockSubscribe).toHaveBeenCalledWith('monthly');
    });

    it('should return error status for unknown checkout state', async () => {
      mockSubscribe.mockResolvedValue({});

      const result = await useCase.execute('monthly');

      expect(result).toEqual({ status: 'error', message: 'Unknown checkout state.' });
      expect(mockSubscribe).toHaveBeenCalledWith('monthly');
    });

    it('should return error status with message when repository throws an Error', async () => {
      const errorMessage = 'Network error occurred';
      mockSubscribe.mockRejectedValue(new Error(errorMessage));

      const result = await useCase.execute('monthly');

      expect(result).toEqual({ status: 'error', message: errorMessage });
      expect(mockSubscribe).toHaveBeenCalledWith('monthly');
    });

    it('should return error status with fallback message when repository throws a non-Error', async () => {
      mockSubscribe.mockRejectedValue('String error');

      const result = await useCase.execute('yearly');

      expect(result).toEqual({ status: 'error', message: 'Failed to start subscription' });
      expect(mockSubscribe).toHaveBeenCalledWith('yearly');
    });
  });
});
