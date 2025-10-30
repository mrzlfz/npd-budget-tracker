import { renderHook, act } from '@testing-library/react';
import {
  useBreakpoint,
  useResponsiveValue,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
} from '@/lib/responsive';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Responsive Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('useBreakpoint', () => {
    it('should return lg breakpoint for desktop width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('lg');
    });

    it('should return xs breakpoint for mobile width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe('xs');
    });

    it('should update breakpoint on window resize', () => {
      const { result } = renderHook(() => useBreakpoint());
      
      expect(result.current).toBe('lg');

      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 480,
        });
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current).toBe('xs');
    });
  });

  describe('useResponsiveValue', () => {
    it('should return correct value for current breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      const values = {
        xs: 'mobile',
        sm: 'small',
        md: 'medium',
        lg: 'large',
      };

      const { result } = renderHook(() => useResponsiveValue(values));
      expect(result.current).toBe('mobile');
    });

    it('should fallback to first available value', () => {
      const values = {
        lg: 'large',
        xl: 'extra-large',
      };

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      const { result } = renderHook(() => useResponsiveValue(values));
      expect(result.current).toBe('large');
    });
  });

  describe('useMediaQuery', () => {
    it('should return false for non-matching query', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
      expect(result.current).toBe(false);
    });

    it('should return true for matching query', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
      expect(result.current).toBe(true);
    });
  });

  describe('useIsMobile', () => {
    it('should return true for mobile width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should return false for desktop width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsTablet', () => {
    it('should return true for tablet width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });

      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(true);
    });

    it('should return false for mobile width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(false);
    });
  });

  describe('useIsDesktop', () => {
    it('should return true for desktop width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });

    it('should return false for mobile width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);
    });
  });
});
