import { renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '@/hooks/useLayout';
import { useTabScrollBottomPadding } from '../useTabScrollBottomPadding';

// Mock dependencies
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(),
}));

jest.mock('@/hooks/useLayout', () => ({
  useLayout: jest.fn(),
}));

describe('useTabScrollBottomPadding', () => {
  const mockUseSafeAreaInsets = useSafeAreaInsets as jest.Mock;
  const mockUseLayout = useLayout as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
    mockUseSafeAreaInsets.mockReturnValue({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });
    mockUseLayout.mockReturnValue({
      isDesktop: false,
      tabBarHeight: 0,
    });
  });

  it('should use default extra padding and native safe area insets on mobile (iOS/Android)', () => {
    Platform.OS = 'ios';
    mockUseSafeAreaInsets.mockReturnValue({ bottom: 20 });
    mockUseLayout.mockReturnValue({ tabBarHeight: 50, isDesktop: false });

    const { result } = renderHook(() => useTabScrollBottomPadding());

    // tabBarHeight (50) + bottomSafe (20) + default extra (16) = 86
    expect(result.current).toBe(86);
  });

  it('should use default extra padding and native safe area insets on mobile (Android)', () => {
    Platform.OS = 'android';
    mockUseSafeAreaInsets.mockReturnValue({ bottom: 10 });
    mockUseLayout.mockReturnValue({ tabBarHeight: 60, isDesktop: false });

    const { result } = renderHook(() => useTabScrollBottomPadding());

    // tabBarHeight (60) + bottomSafe (10) + default extra (16) = 86
    expect(result.current).toBe(86);
  });

  it('should use custom extra padding on mobile', () => {
    Platform.OS = 'ios';
    mockUseSafeAreaInsets.mockReturnValue({ bottom: 15 });
    mockUseLayout.mockReturnValue({ tabBarHeight: 50, isDesktop: false });

    const { result } = renderHook(() => useTabScrollBottomPadding(20));

    // tabBarHeight (50) + bottomSafe (15) + custom extra (20) = 85
    expect(result.current).toBe(85);
  });

  it('should return extra + 32 on web desktop layout', () => {
    Platform.OS = 'web';
    mockUseLayout.mockReturnValue({ isDesktop: true, tabBarHeight: 0 });

    // With default extra (16)
    const { result: res1 } = renderHook(() => useTabScrollBottomPadding());
    // 16 + 32 = 48
    expect(res1.current).toBe(48);

    // With custom extra (10)
    const { result: res2 } = renderHook(() => useTabScrollBottomPadding(10));
    // 10 + 32 = 42
    expect(res2.current).toBe(42);
  });

  it('should use fixed 12 padding instead of insets.bottom on web non-desktop layout', () => {
    Platform.OS = 'web';
    mockUseSafeAreaInsets.mockReturnValue({ bottom: 50 }); // Should be ignored
    mockUseLayout.mockReturnValue({ isDesktop: false, tabBarHeight: 65 });

    // With default extra (16)
    const { result: res1 } = renderHook(() => useTabScrollBottomPadding());
    // tabBarHeight (65) + fixed bottomSafe (12) + default extra (16) = 93
    expect(res1.current).toBe(93);

    // With custom extra (5)
    const { result: res2 } = renderHook(() => useTabScrollBottomPadding(5));
    // tabBarHeight (65) + fixed bottomSafe (12) + custom extra (5) = 82
    expect(res2.current).toBe(82);
  });
});
