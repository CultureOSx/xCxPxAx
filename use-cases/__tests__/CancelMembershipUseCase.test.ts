import { CancelMembershipUseCase } from '../CancelMembershipUseCase';
import { membershipRepository } from '@/repositories/MembershipRepository';

// Mock the repository
jest.mock('@/repositories/MembershipRepository', () => ({
  membershipRepository: {
    cancelMembership: jest.fn(),
  },
}));

describe('CancelMembershipUseCase', () => {
  let useCase: CancelMembershipUseCase;

  beforeEach(() => {
    useCase = new CancelMembershipUseCase();
    jest.clearAllMocks();
  });

  it('should return status success when cancelMembership resolves', async () => {
    (membershipRepository.cancelMembership as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await useCase.execute();

    expect(membershipRepository.cancelMembership).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'success' });
  });

  it('should return status error with error message when cancelMembership throws a standard Error', async () => {
    const errorMessage = 'Network error';
    (membershipRepository.cancelMembership as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const result = await useCase.execute();

    expect(membershipRepository.cancelMembership).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'error', message: errorMessage });
  });

  it('should return status error with generic message when cancelMembership throws a non-Error object', async () => {
    (membershipRepository.cancelMembership as jest.Mock).mockRejectedValueOnce('Some string error');

    const result = await useCase.execute();

    expect(membershipRepository.cancelMembership).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'error', message: 'Failed to cancel membership' });
  });
});
