/**
 * Performance Optimization Utilities
 * Provides tools for monitoring and optimizing application performance
 */

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
}

interface PerformanceThreshold {
  name: string
  max: number
  unit: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private thresholds: PerformanceThreshold[] = [
    { name: 'render-time', max: 2000, unit: 'ms' },
    { name: 'api-call', max: 5000, unit: 'ms' },
    { name: 'memory-usage', max: 100 * 1024 * 1024, unit: 'bytes' },
    { name: 'chart-render', max: 3000, unit: 'ms' },
  ]

  private observers: Map<string, PerformanceObserver> = new Map()

  constructor() {
    this.setupPerformanceObservers()
  }

  /**
   * Start measuring a performance metric
   */
  startMeasurement(name: string): () => PerformanceMetric {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const metric: PerformanceMetric = {
        name,
        value: endTime - startTime,
        unit: 'ms',
        timestamp: Date.now(),
      }

      this.addMetric(metric)
      this.checkThreshold(metric)

      return metric
    }
  }

  /**
   * Add a performance metric
   */
  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }

  /**
   * Get metrics for a specific name
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name)
  }

  /**
   * Get average performance for a metric
   */
  getAverage(name: string): number {
    const metrics = this.getMetrics(name)
    if (metrics.length === 0) return 0

    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0)
    return sum / metrics.length
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): any {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      }
    }
    return null
  }

  /**
   * Check if metric exceeds threshold
   */
  private checkThreshold(metric: PerformanceMetric): void {
    const threshold = this.thresholds.find(t => t.name === metric.name)
    if (threshold && metric.value > threshold.max) {
      console.warn(`Performance threshold exceeded: ${metric.name} (${metric.value}${metric.unit} > ${threshold.max}${threshold.unit})`)
    }
  }

  /**
   * Setup performance observers
   */
  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined') return

    // Observe long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Long task threshold: 50ms
              console.warn('Long task detected:', {
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
              })
            }
          }
        })

        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.set('longtask', longTaskObserver)
      } catch (error) {
        console.log('Long task observer not supported:', error)
      }

      // Observe navigation timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming
              const loadTime = navEntry.loadEventEnd - navEntry.loadEventStart

              this.addMetric({
                name: 'page-load',
                value: loadTime,
                unit: 'ms',
                timestamp: Date.now(),
              })
            }
          }
        })

        navigationObserver.observe({ entryTypes: ['navigation'] })
        this.observers.set('navigation', navigationObserver)
      } catch (error) {
        console.log('Navigation observer not supported:', error)
      }
    }
  }

  /**
   * Disconnect all observers
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Debounce utility for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle utility for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Memoize expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = func(...args)
    cache.set(key, result)

    return result
  }) as T
}

/**
 * Virtual scroll utility for large lists
 */
export class VirtualScroll {
  private containerHeight: number
  private itemHeight: number
  private totalItems: number
  private scrollTop: number = 0

  constructor(containerHeight: number, itemHeight: number, totalItems: number) {
    this.containerHeight = containerHeight
    this.itemHeight = itemHeight
    this.totalItems = totalItems
  }

  /**
   * Calculate visible items range
   */
  getVisibleRange(): { start: number; end: number; offsetY: number } {
    const start = Math.floor(this.scrollTop / this.itemHeight)
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight)
    const end = Math.min(start + visibleCount + 1, this.totalItems)
    const offsetY = start * this.itemHeight

    return { start, end, offsetY }
  }

  /**
   * Update scroll position
   */
  updateScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop
  }
}

/**
 * Resource loading optimization
 */
export class ResourceOptimizer {
  private loadedImages = new Map<string, HTMLImageElement>()
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>()

  /**
   * Lazy load images
   */
  async loadImage(src: string): Promise<HTMLImageElement> {
    // Return cached image if already loaded
    if (this.loadedImages.has(src)) {
      return this.loadedImages.get(src)!
    }

    // Return existing loading promise
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!
    }

    // Start loading image
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.loadedImages.set(src, img)
        this.loadingPromises.delete(src)
        resolve(img)
      }
      img.onerror = () => {
        this.loadingPromises.delete(src)
        reject(new Error(`Failed to load image: ${src}`))
      }
      img.src = src
    })

    this.loadingPromises.set(src, promise)
    return promise
  }

  /**
   * Preload critical resources
   */
  async preloadResources(resources: string[]): Promise<void> {
    const promises = resources.map(resource => {
      if (resource.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return this.loadImage(resource)
      }
      return Promise.resolve()
    })

    await Promise.all(promises)
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.loadedImages.clear()
    this.loadingPromises.clear()
  }
}

// Global resource optimizer instance
export const resourceOptimizer = new ResourceOptimizer()

/**
 * Chart performance optimization
 */
export class ChartOptimizer {
  private static readonly MAX_DATA_POINTS = 1000
  private static readonly ANIMATION_DURATION = 300

  /**
   * Optimize data for charts
   */
  static optimizeData<T extends Record<string, any>>(
    data: T[],
    maxPoints: number = this.MAX_DATA_POINTS
  ): T[] {
    if (data.length <= maxPoints) return data

    const step = Math.ceil(data.length / maxPoints)
    return data.filter((_, index) => index % step === 0)
  }

  /**
   * Get optimized chart animation settings
   */
  static getAnimationSettings() {
    return {
      animationBegin: 0,
      animationDuration: this.ANIMATION_DURATION,
      animationEasing: 'ease-out' as const,
    }
  }

  /**
   * Debounce chart updates
   */
  static debounceChartUpdate = debounce((callback: () => void) => {
    callback()
  }, 100)
}

/**
 * API call optimization
 */
export class APIOptimizer {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private pendingCalls = new Map<string, Promise<any>>()

  /**
   * Cache API response
   */
  private setCache(key: string, data: any, ttl: number = 300000): void { // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    })
  }

  /**
   * Get cached response
   */
  private getCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && cached.timestamp > Date.now()) {
      return cached.data
    }
    if (cached) {
      this.cache.delete(key)
    }
    return null
  }

  /**
   * Optimized API call with caching and deduplication
   */
  async call<T>(
    key: string,
    apiCall: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> {
    // Check cache first
    const cached = this.getCache(key)
    if (cached) {
      return cached
    }

    // Check if call is already pending
    if (this.pendingCalls.has(key)) {
      return this.pendingCalls.get(key)
    }

    // Make API call
    const promise = apiCall()
      .then(data => {
        this.setCache(key, data, ttl)
        this.pendingCalls.delete(key)
        return data
      })
      .catch(error => {
        this.pendingCalls.delete(key)
        throw error
      })

    this.pendingCalls.set(key, promise)
    return promise
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    this.pendingCalls.clear()
  }

  /**
   * Invalidate cache entry
   */
  invalidateCache(key: string): void {
    this.cache.delete(key)
    this.pendingCalls.delete(key)
  }
}

// Global API optimizer instance
export const apiOptimizer = new APIOptimizer()

/**
 * Performance monitoring wrapper for React components
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  const MonitoredComponent: React.FC<P> = (props: P) => {
    React.useEffect(() => {
      const endMeasurement = performanceMonitor.startMeasurement(`component-${componentName}-mount`)

      return () => {
        endMeasurement()
      }
    }, [])

    return React.createElement(Component, props)
  }
  return MonitoredComponent
}

/**
 * Performance metrics collector
 */
export function collectPerformanceMetrics(): {
  memory: any
  metrics: PerformanceMetric[]
  averages: Record<string, number>
} {
  return {
    memory: performanceMonitor.getMemoryUsage(),
    metrics: performanceMonitor.metrics,
    averages: {
      'render-time': performanceMonitor.getAverage('render-time'),
      'api-call': performanceMonitor.getAverage('api-call'),
      'page-load': performanceMonitor.getAverage('page-load'),
    },
  }
}

/**
 * Initialize performance monitoring in development
 */
export function initializePerformanceMonitoring(): void {
  if (process.env.NODE_ENV === 'development') {
    // Monitor React render warnings
    const originalConsoleError = console.error
    console.error = (...args) => {
      const message = args[0]
      if (typeof message === 'string' && message.includes('Warning:')) {
        performanceMonitor.addMetric({
          name: 'react-warning',
          value: 1,
          unit: 'count',
          timestamp: Date.now(),
        })
      }
      originalConsoleError(...args)
    }

    // Monitor performance in intervals
    setInterval(() => {
      const memory = performanceMonitor.getMemoryUsage()
      if (memory) {
        performanceMonitor.addMetric({
          name: 'memory-usage',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          timestamp: Date.now(),
        })
      }
    }, 30000) // Every 30 seconds
  }
}