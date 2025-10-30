import { useState, useEffect, useRef } from 'react';

// Breakpoint definitions
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Hook to get current breakpoint
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < breakpoints.sm) setBreakpoint('xs');
      else if (width < breakpoints.md) setBreakpoint('sm');
      else if (width < breakpoints.lg) setBreakpoint('md');
      else if (width < breakpoints.xl) setBreakpoint('lg');
      else if (width < breakpoints.xxl) setBreakpoint('xl');
      else setBreakpoint('xxl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

// Responsive value helper
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>): T {
  const breakpoint = useBreakpoint();
  
  const breakpointOrder: Breakpoint[] = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];
  
  for (const bp of breakpointOrder) {
    if (breakpoint >= bp && values[bp] !== undefined) {
      return values[bp]!;
    }
  }
  
  // Fallback to first available value
  const firstValue = Object.values(values)[0];
  return firstValue as T;
}

// Media query hooks
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Common media query hooks
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${breakpoints.md - 1}px)`);
}

export function useIsTablet() {
  return useMediaQuery(`(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`);
}

export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
}

// Responsive grid helpers
export interface ResponsiveGridProps {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
  gap?: number | string;
  children: React.ReactNode;
}

export function useResponsiveGrid(props: ResponsiveGridProps) {
  const breakpoint = useBreakpoint();
  
  const getColumns = () => {
    const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    
    for (const bp of breakpointOrder) {
      if (breakpoint >= bp && props[bp] !== undefined) {
        return props[bp]!;
      }
    }
    
    return 1; // Default to 1 column
  };
  
  const getGap = () => {
    return props.gap || '1rem';
  };
  
  return {
    columns: getColumns(),
    gap: getGap(),
    gridTemplateColumns: `repeat(${getColumns()}, minmax(0, 1fr))`,
  };
}

// Mobile-first layout utilities
export interface MobileLayoutProps {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  content: React.ReactNode;
  footer?: React.ReactNode;
  sidebarWidth?: string;
  sidebarCollapsedWidth?: string;
}

export function useMobileLayout(props: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const sidebarWidth = props.sidebarWidth || '280px';
  const sidebarCollapsedWidth = props.sidebarCollapsedWidth || '60px';
  
  // Auto-close sidebar on mobile when content changes
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isMobile, sidebarOpen]);
  
  return {
    sidebarOpen,
    setSidebarOpen,
    isMobile,
    sidebarWidth,
    sidebarCollapsedWidth,
    sidebarStyles: {
      width: isMobile ? '100%' : (sidebarOpen ? sidebarWidth : sidebarCollapsedWidth),
      transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
      transition: 'all 0.3s ease',
      position: isMobile ? 'fixed' : 'relative',
      zIndex: isMobile ? 1000 : 'auto',
      height: isMobile ? '100vh' : 'auto',
    },
    overlayStyles: {
      display: isMobile && sidebarOpen ? 'block' : 'none',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 999,
    },
    contentStyles: {
      marginLeft: isMobile ? 0 : (sidebarOpen ? sidebarWidth : sidebarCollapsedWidth),
      transition: 'margin-left 0.3s ease',
    },
  };
}

// Responsive table utilities
export interface ResponsiveTableConfig {
  breakpoint?: Breakpoint;
  cardTitle?: (item: any, index: number) => string;
  mobileColumns?: string[];
  hiddenColumns?: string[];
}

export function useResponsiveTable<T extends Record<string, any>>(
  data: T[],
  config: ResponsiveTableConfig = {}
) {
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();
  const shouldUseCardView = config.breakpoint 
    ? breakpoint < breakpoints[config.breakpoint]
    : isMobile;
  
  const getVisibleColumns = (columns: string[]) => {
    if (!config.hiddenColumns) return columns;
    return columns.filter(col => !config.hiddenColumns!.includes(col));
  };
  
  const getMobileColumns = (columns: string[]) => {
    if (!config.mobileColumns) return columns.slice(0, 3); // Show first 3 columns by default
    return config.mobileColumns;
  };
  
  const prepareCardData = (item: T, index: number) => {
    const columns = Object.keys(item);
    const visibleColumns = shouldUseCardView 
      ? getMobileColumns(columns)
      : getVisibleColumns(columns);
    
    return {
      title: config.cardTitle ? config.cardTitle(item, index) : `Item ${index + 1}`,
      data: visibleColumns.reduce((acc, col) => {
        acc[col] = item[col];
        return acc;
      }, {} as Record<string, any>),
      fullData: item,
    };
  };
  
  return {
    shouldUseCardView,
    data: shouldUseCardView 
      ? data.map((item, index) => prepareCardData(item, index))
      : data,
    getVisibleColumns,
    getMobileColumns,
  };
}

// Touch gesture utilities
export interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefault?: boolean;
}

export function useSwipeGestures(config: SwipeConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefault = true,
  } = config;
  
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    
    if (!touchStart.current) return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };
    
    const deltaX = touchEnd.x - touchStart.current.x;
    const deltaY = touchEnd.y - touchStart.current.y;
    
    // Check if the swipe distance exceeds threshold
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }
    
    touchStart.current = null;
  };
  
  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

// Responsive form utilities
export interface ResponsiveFormConfig {
  layout?: 'vertical' | 'horizontal' | 'grid';
  stackOnMobile?: boolean;
  fieldWidth?: Partial<Record<Breakpoint, string>>;
  gap?: string;
}

export function useResponsiveForm(config: ResponsiveFormConfig = {}) {
  const {
    layout = 'vertical',
    stackOnMobile = true,
    fieldWidth = { xs: '100%', sm: '50%', md: '33.333%', lg: '25%' },
    gap = '1rem',
  } = config;
  
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();
  
  const getFieldWidth = () => {
    if (stackOnMobile && isMobile) return '100%';
    return useResponsiveValue(fieldWidth);
  };
  
  const getFormLayout = () => {
    if (stackOnMobile && isMobile) return 'vertical';
    return layout;
  };
  
  const getFormStyles = () => {
    return {
      display: layout === 'grid' ? 'grid' : 'flex',
      flexDirection: getFormLayout() === 'vertical' ? 'column' : 'row',
      gridTemplateColumns: layout === 'grid' ? `repeat(auto-fit, minmax(${getFieldWidth()}, 1fr))` : 'none',
      gap,
      flexWrap: layout === 'horizontal' ? 'wrap' : 'nowrap',
    };
  };
  
  return {
    getFieldWidth,
    getFormLayout,
    getFormStyles,
    isMobile,
    breakpoint,
  };
}

// Viewport utilities
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });
  
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return viewport;
}

// Device detection
export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTouchDevice: false,
    orientation: 'portrait' as 'portrait' | 'landscape',
  });
  
  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const isMobile = width < breakpoints.md;
      const isTablet = width >= breakpoints.md && width < breakpoints.lg;
      const isDesktop = width >= breakpoints.lg;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const orientation = width > height ? 'landscape' : 'portrait';
      
      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        orientation,
      });
    };
    
    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);
  
  return deviceInfo;
}

// Responsive navigation utilities
export interface ResponsiveNavConfig {
  mobileMenuType?: 'drawer' | 'dropdown' | 'bottom-tabs';
  collapseOn?: Breakpoint;
  showLabels?: boolean;
  iconSize?: Partial<Record<Breakpoint, number>>;
}

export function useResponsiveNav(config: ResponsiveNavConfig = {}) {
  const {
    mobileMenuType = 'drawer',
    collapseOn = 'md',
    showLabels = true,
    iconSize = { xs: 16, sm: 18, md: 20, lg: 22 },
  } = config;
  
  const breakpoint = useBreakpoint();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isCollapsed = breakpoint < breakpoints[collapseOn];
  
  const getIconSize = () => {
    return useResponsiveValue(iconSize);
  };
  
  const shouldShowLabels = () => {
    if (!showLabels) return false;
    return !isCollapsed;
  };
  
  return {
    isCollapsed,
    mobileMenuType,
    mobileMenuOpen,
    setMobileMenuOpen,
    getIconSize,
    shouldShowLabels,
  };
}
