/**
 * Performance Tests for Dashboard
 * Tests dashboard performance with large datasets
 */

import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ConvexProvider } from 'convex/react'
import { mockConvexClient } from '@/__tests__/mocks/convex'
import Dashboard from '@/app/dashboard/page'
import { api } from '@/convex/_generated/api'

// Performance monitoring utilities
const measureRenderTime = async (component: React.ReactElement) => {
  const startTime = performance.now()
  const { unmount } = render(component)
  const endTime = performance.now()

  return {
    renderTime: endTime - startTime,
    cleanup: () => unmount(),
  }
}

const measureMemoryUsage = () => {
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

// Large datasets for performance testing
const generateLargeNPDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    _id: `npd${i}`,
    documentNumber: `NPD-2024-${String(i + 1).padStart(3, '0')}`,
    title: `NPD ${i + 1}`,
    status: ['draft', 'diajukan', 'diverifikasi', 'final'][i % 4],
    totalAmount: Math.floor(Math.random() * 100000000),
    createdAt: Date.now() - (i * 86400000), // Staggered over days
  }))
}

const generateLargeSP2DDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    _id: `sp2d${i}`,
    npdId: `npd${i % 100}`,
    noSP2D: `SP2D-2024-${String(i + 1).padStart(3, '0')}`,
    tglSP2D: Date.now() - (i * 86400000),
    nilaiCair: Math.floor(Math.random() * 50000000),
    status: ['draft', 'processed'][i % 2],
    createdAt: Date.now() - (i * 86400000),
  }))
}

const generateLargePerformanceDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    _id: `perf${i}`,
    indikatorNama: `Indikator ${i + 1}`,
    persenCapaian: Math.floor(Math.random() * 100),
    target: Math.floor(Math.random() * 1000),
    realisasi: Math.floor(Math.random() * 1000),
    subkegiatan: {
      kode: `1.${Math.floor(i / 10)}.${i % 10}`,
      nama: `Sub Kegiatan ${Math.floor(i / 10)}`,
    },
    createdAt: Date.now() - (i * 86400000),
  }))
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
    },
  })

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ConvexProvider client={mockConvexClient}>
          {children}
        </ConvexProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

describe('Dashboard Performance Tests', () => {
  const originalConsoleError = console.error

  beforeEach(() => {
    console.error = jest.fn()
    // Mock APIs with large datasets
    const largeNPDData = generateLargeNPDataset(1000)
    const largeSP2DData = generateLargeSP2DDataset(500)
    const largePerformanceData = generateLargePerformanceDataset(200)

    jest.spyOn(api, 'npd').mockImplementation(() => ({
      list: jest.fn().mockResolvedValue(largeNPDData),
      get: jest.fn().mockResolvedValue(largeNPDData[0]),
    } as any))

    jest.spyOn(api, 'sp2d').mockImplementation(() => ({
      list: jest.fn().mockResolvedValue(largeSP2DData),
      get: jest.fn().mockResolvedValue(largeSP2DData[0]),
    } as any))

    jest.spyOn(api, 'performance').mockImplementation(() => ({
      list: jest.fn().mockResolvedValue(largePerformanceData),
      getMetrics: jest.fn().mockResolvedValue({
        totalIndicators: largePerformanceData.length,
        avgPerformance: 75.5,
        highPerforming: largePerformanceData.filter(p => p.persenCapaian > 80).length,
      }),
    } as any))
  })

  afterEach(() => {
    console.error = originalConsoleError
    jest.restoreAllMocks()
  })

  describe('Render Performance', () => {
    test('should render dashboard with large datasets within acceptable time', async () => {
      const initialMemory = measureMemoryUsage()

      const { renderTime, cleanup } = await measureRenderTime(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      const finalMemory = measureMemoryUsage()

      // Performance assertions
      expect(renderTime).toBeLessThan(2000) // Should render within 2 seconds

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB increase
      }

      cleanup()
    })

    test('should handle rapid tab switching efficiently', async () => {
      const { container } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      // Simulate rapid tab switching
      const startTime = performance.now()

      for (let i = 0; i < 10; i++) {
        // Simulate changing fiscal year (triggers data reload)
        const selectElement = container.querySelector('select')
        if (selectElement) {
          fireEvent.change(selectElement, { target: { value: String(2024 + i) } })
        }

        // Small delay to simulate user interaction
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const endTime = performance.now()
      const interactionTime = endTime - startTime

      expect(interactionTime).toBeLessThan(5000) // Should handle 10 rapid interactions within 5 seconds
    })

    test('should maintain performance during data updates', async () => {
      const { container } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      // Simulate real-time data updates
      const startTime = performance.now()

      for (let i = 0; i < 50; i++) {
        // Simulate new data being added
        const newNPD = {
          _id: `new-npd-${i}`,
          documentNumber: `NPD-2024-${String(1001 + i).padStart(3, '0')}`,
          title: `New NPD ${i + 1}`,
          status: 'final',
          totalAmount: Math.floor(Math.random() * 100000000),
          createdAt: Date.now(),
        }

        // Simulate WebSocket update
        window.dispatchEvent(new CustomEvent('convex-update', {
          detail: { type: 'npd', data: newNPD }
        }))

        await new Promise(resolve => setTimeout(resolve, 50))
      }

      const endTime = performance.now()
      const updateTime = endTime - startTime

      expect(updateTime).toBeLessThan(10000) // Should handle 50 updates within 10 seconds
    })
  })

  describe('Memory Management', () => {
    test('should not leak memory on repeated renders', async () => {
      const memorySnapshots: any[] = []

      for (let i = 0; i < 10; i++) {
        const { cleanup } = render(
          <TestWrapper>
            <Dashboard />
          </TestWrapper>
        )

        await waitFor(() => {
          expect(screen.getByText('Dashboard')).toBeInTheDocument()
        })

        const memory = measureMemoryUsage()
        if (memory) {
          memorySnapshots.push({
            iteration: i,
            usedJSHeapSize: memory.usedJSHeapSize,
          })
        }

        cleanup()

        // Force garbage collection if available
        if (typeof window !== 'undefined' && 'gc' in window) {
          (window as any).gc()
        }
      }

      // Check memory growth
      if (memorySnapshots.length > 1) {
        const initialMemory = memorySnapshots[0].usedJSHeapSize
        const finalMemory = memorySnapshots[memorySnapshots.length - 1].usedJSHeapSize
        const memoryGrowth = finalMemory - initialMemory

        // Memory growth should be minimal (< 20MB over 10 renders)
        expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024)
      }
    })

    test('should clean up subscriptions on unmount', async () => {
      const { unmount } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      // Check that subscriptions are created
      expect(api.npd).toHaveBeenCalled()
      expect(api.sp2d).toHaveBeenCalled()
      expect(api.performance).toHaveBeenCalled()

      // Unmount component
      unmount()

      // Verify no errors occur during cleanup
      expect(console.error).not.toHaveBeenCalled()
    })
  })

  describe('Chart Performance', () => {
    test('should render charts efficiently with large datasets', async () => {
      const largeChartData = Array.from({ length: 1000 }, (_, i) => ({
        month: `Month ${i + 1}`,
        pagu: Math.floor(Math.random() * 1000000000),
        realisasi: Math.floor(Math.random() * 800000000),
        target: Math.floor(Math.random() * 900000000),
      }))

      // Mock chart data
      jest.spyOn(api, 'dashboard').mockImplementation(() => ({
        getMetrics: jest.fn().mockResolvedValue({
          chartData: largeChartData,
        }),
      } as any))

      const startTime = performance.now()

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const chartRenderTime = endTime - startTime

      // Charts with large datasets should render within 3 seconds
      expect(chartRenderTime).toBeLessThan(3000)
    })

    test('should handle chart interactions smoothly', async () => {
      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      // Find chart elements
      const charts = screen.getAllByRole('img') // Charts are rendered as SVG elements
      expect(charts.length).toBeGreaterThan(0)

      // Simulate chart interactions
      const startTime = performance.now()

      for (const chart of charts) {
        if (chart.parentElement) {
          // Simulate hover events
          fireEvent.mouseEnter(chart.parentElement)
          fireEvent.mouseMove(chart.parentElement)
          fireEvent.mouseLeave(chart.parentElement)
        }
      }

      const endTime = performance.now()
      const interactionTime = endTime - startTime

      // Chart interactions should be smooth (< 1 second)
      expect(interactionTime).toBeLessThan(1000)
    })
  })

  describe('Network Performance', () => {
    test('should batch API requests efficiently', async () => {
      const apiCallTimes: number[] = []

      // Wrap API calls to measure timing
      const originalApiCall = api.npd
      jest.spyOn(api, 'npd').mockImplementation(() => {
        const startTime = performance.now()
        const result = originalApiCall()

        return {
          ...result,
          list: async (...args: any[]) => {
            apiCallTimes.push(performance.now() - startTime)
            return result.list(...args)
          }
        }
      })

      const startTime = performance.now()

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should batch requests and complete within 5 seconds
      expect(totalTime).toBeLessThan(5000)

      // Should have made efficient use of API calls
      expect(apiCallTimes.length).toBeLessThan(10)
    })

    test('should handle network timeouts gracefully', async () => {
      // Mock slow API response
      jest.spyOn(api, 'npd').mockImplementation(() => ({
        list: jest.fn().mockImplementation(() =>
          new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Network timeout')), 10000)
          })
        ),
      } as any))

      const startTime = performance.now()

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/gagal memuat data/i)).toBeInTheDocument()
      })

      const endTime = performance.now()
      const timeoutTime = endTime - startTime

      // Should handle timeout within reasonable time (15 seconds including timeout)
      expect(timeoutTime).toBeLessThan(15000)
    })
  })

  describe('Accessibility Performance', () => {
    test('should maintain accessibility with large datasets', async () => {
      const { container } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      // Check for accessibility issues
      const startTime = performance.now()

      // Check for proper ARIA labels on interactive elements
      const interactiveElements = container.querySelectorAll('button, input, select')

      for (const element of interactiveElements) {
        if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
          console.warn('Interactive element missing accessibility label:', element)
        }
      }

      // Check for proper heading hierarchy
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
      expect(headings.length).toBeGreaterThan(0)

      const endTime = performance.now()
      const accessibilityTime = endTime - startTime

      // Accessibility checks should not significantly impact performance
      expect(accessibilityTime).toBeLessThan(1000)
    })
  })
})