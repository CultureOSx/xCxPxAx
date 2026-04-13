// @ts-nocheck
import { act, renderHook } from '@testing-library/react-native';
import { useCouncil } from '../useCouncil';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRefetch = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
}));

jest.mock('../../contexts/OnboardingContext', () => ({
  useOnboarding: jest.fn(() => ({
    state: { city: 'Sydney', country: 'Australia' },
  })),
}));

jest.mock('../../lib/auth', () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    userId: 'test-uid',
  })),
}));

jest.mock('../../lib/api', () => ({
  api: {
    council: {
      my: jest.fn(),
    },
  },
}));

jest.mock('@shared/location/australian-postcodes', () => ({
  getPostcodesByPlace: jest.fn(() => [
    { postcode: 2000, place_name: 'Sydney', state_code: 'NSW' },
  ]),
}));

const { useQuery } = require('@tanstack/react-query');
const { useQueryClient } = require('@tanstack/react-query');
const { useOnboarding } = require('../../contexts/OnboardingContext');
const { useAuth } = require('../../lib/auth');
const { api } = require('../../lib/api');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCouncil hook', () => {
  const mockInvalidateQueries = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });
    (useQueryClient as jest.Mock).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    });
    (useOnboarding as jest.Mock).mockReturnValue({
      state: { city: 'Sydney', country: 'Australia' },
    });
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      userId: 'test-uid',
    });
  });

  it('should pass enabled: true when authenticated', () => {
    renderHook(() => useCouncil());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
      }),
    );
  });

  it('should pass enabled: false when not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      userId: null,
    });

    renderHook(() => useCouncil());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should expose council, councilId, lgaCode from LGA context', () => {
    const mockData = {
      council: { id: 'c1', name: 'City of Sydney', lgaCode: 'LGA12345' },
    };

    (useQuery as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useCouncil());

    expect(result.current.data).toBe(mockData);
    expect(result.current.council).toEqual(mockData.council);
    expect(result.current.councilId).toBe('c1');
    expect(result.current.lgaCode).toBe('LGA12345');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should include the correct query key with city, postcode, and state', () => {
    renderHook(() => useCouncil());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['/api/council/my', 'Sydney', 2000, 'NSW'],
      }),
    );
  });

  it('should default country to Australia when onboarding country is empty', async () => {
    (useOnboarding as jest.Mock).mockReturnValue({
      state: { city: 'Sydney', country: '' },
    });

    renderHook(() => useCouncil());
    const [{ queryFn }] = (useQuery as jest.Mock).mock.calls[0];
    await queryFn();

    expect(api.council.my).toHaveBeenCalledWith(
      expect.objectContaining({
        country: 'Australia',
      }),
    );
  });

  it('should invalidate council query when reload is called', async () => {
    const { result } = renderHook(() => useCouncil());

    await act(async () => {
      await result.current.reload();
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/council/my'],
    });
  });
});
