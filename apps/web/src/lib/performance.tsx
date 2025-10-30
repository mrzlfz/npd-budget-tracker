import React, { useMemo, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

// Virtual scrolling for large lists
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;

  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, 0 - overscan);
    const endIndex = Math.min(items.length, visibleCount + overscan);

    return {
      visibleItems: items.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, overscan]);
}

// Data pagination hook
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function usePagination(initialLimit = 20) {
  const [state, setState] = React.useState<PaginationState>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  const setTotal = useCallback((total: number) => {
    setState(prev => ({
      ...prev,
      total,
      totalPages: Math.ceil(total / prev.limit),
    }));
  }, []);

  const nextPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      page: Math.min(prev.page + 1, prev.totalPages),
    }));
  }, []);

  const prevPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      page: Math.max(prev.page - 1, 1),
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      page: Math.min(Math.max(page, 1), prev.totalPages),
    }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setState(prev => ({
      ...prev,
      limit,
      page: 1,
      totalPages: Math.ceil(prev.total / limit),
    }));
  }, []);

  return {
    ...state,
    setTotal,
    nextPage,
    prevPage,
    goToPage,
    setLimit,
  };
}

// Debounced search for large datasets
export function useDebounceSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  delay = 300
) {
  const [results, setResults] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const debouncedSearch = useMemo(
    () => debounce(async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchResults = await searchFn(query);
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }, delay),
    [searchFn, delay]
  );

  const search = useCallback((query: string) => {
    debouncedSearch(query);
  }, [debouncedSearch]);

  React.useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return { results, loading, error, search };
}

// Data chunking for processing large datasets
export function useDataChunking<T, R>(
  data: T[],
  chunkSize: number,
  processor: (chunk: T[]) => Promise<R[]>
) {
  const [processedData, setProcessedData] = React.useState<R[]>([]);
  const [processing, setProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const processChunks = useCallback(async () => {
    setProcessing(true);
    setProgress(0);
    const results: R[] = [];

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const chunkResults = await processor(chunk);
      results.push(...chunkResults);
      setProgress((i + chunkSize) / data.length * 100);
    }

    setProcessedData(results);
    setProcessing(false);
    setProgress(100);
  }, [data, chunkSize, processor]);

  return { processedData, processing, progress, processChunks };
}

// Cache management for frequently accessed data
export class DataCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();

  constructor(private defaultTTL = 5 * 60 * 1000) {} // 5 minutes default

  set(key: string, data: T, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  size() {
    return this.cache.size;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Optimized data fetching with caching
export function useOptimizedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    staleWhileRevalidate?: boolean;
  } = {}
) {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true } = options;
  const cache = useMemo(() => new DataCache<T>(ttl), [ttl]);

  const [data, setData] = React.useState<T | null>(() => {
    return cache.get(key);
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cachedData = cache.get(key);
    
    if (cachedData && !forceRefresh) {
      setData(cachedData);
      return cachedData;
    }

    if (staleWhileRevalidate && cachedData) {
      setData(cachedData);
    }

    setLoading(true);
    setError(null);

    try {
      const freshData = await fetcher();
      cache.set(key, freshData, ttl);
      setData(freshData);
      return freshData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fetch failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, cache, ttl, staleWhileRevalidate]);

  React.useEffect(() => {
    if (!data) {
      fetchData();
    }
  }, []);

  // Periodic cache cleanup
  React.useEffect(() => {
    const interval = setInterval(() => {
      cache.cleanup();
    }, 60 * 1000); // Every minute

    return () => clearInterval(interval);
  }, [cache]);

  return { data, loading, error, refetch: () => fetchData(true) };
}

// Performance monitoring utilities
export interface PerformanceMetrics {
  renderTime: number;
  dataProcessingTime: number;
  apiCallTime: number;
  memoryUsage?: number;
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({
    renderTime: 0,
    dataProcessingTime: 0,
    apiCallTime: 0,
  });

  const startTimer = useCallback((name: keyof PerformanceMetrics) => {
    return (endTime: number) => {
      const duration = performance.now() - endTime;
      setMetrics(prev => ({
        ...prev,
        [name]: duration,
      }));
    };
  }, []);

  const measureRender = useCallback((fn: () => void) => {
    const startTime = performance.now();
    fn();
    const endTime = performance.now();
    setMetrics(prev => ({
      ...prev,
      renderTime: endTime - startTime,
    }));
  }, []);

  const measureDataProcessing = useCallback(async <T,>(
    fn: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    setMetrics(prev => ({
      ...prev,
      dataProcessingTime: endTime - startTime,
    }));
    return result;
  }, []);

  const measureApiCall = useCallback(async <T,>(
    fn: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    setMetrics(prev => ({
      ...prev,
      apiCallTime: endTime - startTime,
    }));
    return result;
  }, []);

  // Memory usage (if supported)
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize,
      }));
    }
  }, []);

  return {
    metrics,
    startTimer,
    measureRender,
    measureDataProcessing,
    measureApiCall,
    getMemoryUsage,
  };
}

// Lazy loading for components
export function useLazyLoad<T>(
  loader: () => Promise<{ default: React.ComponentType<T> }>,
  options: {
    fallback?: React.ComponentType;
    delay?: number;
  } = {}
) {
  const [Component, setComponent] = React.useState<React.ComponentType<T> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadComponent = useCallback(async () => {
    if (Component) return Component;

    setLoading(true);
    setError(null);

    try {
      const { default: LoadedComponent } = await loader();
      setComponent(() => LoadedComponent);
      return LoadedComponent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Component load failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loader, Component]);

  const LazyComponent = React.useMemo(() => {
    if (!Component) return options.fallback || null;
    return Component;
  }, [Component, options.fallback]);

  return {
    LazyComponent,
    loading,
    error,
    loadComponent,
  };
}

// Optimized list rendering with item keys
export function useOptimizedList<T>(
  items: T[],
  getItemKey: (item: T) => string,
  renderItem: (item: T, index: number) => React.ReactNode
) {
  return useMemo(() => {
    return items.map((item, index) => (
      <React.Fragment key={getItemKey(item)}>
        {renderItem(item, index)}
      </React.Fragment>
    ));
  }, [items, getItemKey, renderItem]);
}

// Infinite scroll implementation
export function useInfiniteScroll<T>(
  fetcher: (page: number) => Promise<{
    items: T[];
    hasMore: boolean;
    total: number;
  }>,
  initialPage = 1
) {
  const [items, setItems] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [page, setPage] = React.useState(initialPage);
  const [total, setTotal] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher(page);
      setItems(prev => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(prev => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Load more failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, fetcher]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setTotal(0);
    setError(null);
  }, [initialPage]);

  React.useEffect(() => {
    loadMore();
  }, []);

  return {
    items,
    loading,
    hasMore,
    total,
    error,
    loadMore,
    reset,
  };
}
