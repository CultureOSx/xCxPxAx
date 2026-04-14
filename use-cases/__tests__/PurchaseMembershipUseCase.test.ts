import { PurchaseMembershipUseCase } from '../PurchaseMembershipUseCase';
import { membershipRepository } from '@/repositories/MembershipRepository';

// Mock the repository
jest.mock('@/repositories/MembershipRepository', () => ({
  membershipRepository: {
    subscribe: jest.fn(),
  },
}));

describe('PurchaseMembershipUseCase', () => {
  let useCase: PurchaseMembershipUseCase;

  beforeEach(() => {
    useCase = new PurchaseMembershipUseCase();
    jest.clearAllMocks();
  });

  it('should return already_active status if data says already active', async () => {
    (membershipRepository.subscribe as jest.Mock).mockResolvedValue({
      alreadyActive: true,
    });

    const result = await useCase.execute('monthly');

    expect(membershipRepository.subscribe).toHaveBeenCalledWith('monthly');
    expect(result).toEqual({ status: 'already_active' });
  });

  it('should return checkout_required status with url if data has checkoutUrl', async () => {
    const testUrl = 'https://checkout.stripe.com/test';
    (membershipRepository.subscribe as jest.Mock).mockResolvedValue({
      checkoutUrl: testUrl,
    });

    const result = await useCase.execute('yearly');

    expect(membershipRepository.subscribe).toHaveBeenCalledWith('yearly');
    expect(result).toEqual({ status: 'checkout_required', url: testUrl });
  });

  it('should return dev_mode_success status if data has devMode true', async () => {
    (membershipRepository.subscribe as jest.Mock).mockResolvedValue({
      devMode: true,
    });

    const result = await useCase.execute('monthly');

    expect(membershipRepository.subscribe).toHaveBeenCalledWith('monthly');
    expect(result).toEqual({ status: 'dev_mode_success' });
  });

  it('should return error status for unknown checkout state', async () => {
    (membershipRepository.subscribe as jest.Mock).mockResolvedValue({});

    const result = await useCase.execute('monthly');

    expect(membershipRepository.subscribe).toHaveBeenCalledWith('monthly');
    expect(result).toEqual({ status: 'error', message: 'Unknown checkout state.' });
  });

  it('should return error status with message if an exception is thrown with Error object', async () => {
    const errorMessage = 'Network error occurred';
    (membershipRepository.subscribe as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const result = await useCase.execute('monthly');

    expect(membershipRepository.subscribe).toHaveBeenCalledWith('monthly');
    expect(result).toEqual({ status: 'error', message: errorMessage });
  });

  it('should return error status with default message if a non-Error exception is thrown', async () => {
    (membershipRepository.subscribe as jest.Mock).mockRejectedValue('String error');

    const result = await useCase.execute('monthly');

    expect(membershipRepository.subscribe).toHaveBeenCalledWith('monthly');
    expect(result).toEqual({ status: 'error', message: 'Failed to start subscription' });
  });
});
