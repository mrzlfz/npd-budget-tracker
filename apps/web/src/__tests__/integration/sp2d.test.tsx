/**
 * SP2D Integration Tests
 * Tests SP2D creation, distribution, and realisasi calculations
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { BrowserRouter } from 'react-router-dom'
import { ConvexProvider } from 'convex/react'
import { mockConvexClient } from '@/__tests__/mocks/convex'
import SP2DPage from '@/app/sp2d/page'
import SP2DDetailPage from '@/app/sp2d/[id]/page'
import { api } from '@/convex/_generated/api'
import { formatCurrency } from '@/lib/utils/format'

// Mock data
const mockNPDData = [
  {
    _id: 'npd1',
    documentNumber: 'NPD-2024-001',
    title: 'Pengadaan Barang Kantor',
    status: 'final',
    totalAmount: 50000000,
    subkegiatan: { kode: '1.2.1', nama: 'Belanja Barang Kantor' },
    lines: [
      {
        _id: 'line1',
        accountId: 'acc1',
        uraian: 'Kertas HVS A4',
        jumlah: 10000000,
        account: {
          kode: '5.1.1.01.01',
          uraian: 'Kertas HVS',
          paguTahun: 50000000,
          realisasiTahun: 20000000,
          sisaPagu: 30000000,
        },
      },
      {
        _id: 'line2',
        accountId: 'acc2',
        uraian: 'Tinta Printer',
        jumlah: 15000000,
        account: {
          kode: '5.1.1.01.02',
          uraian: 'Tinta Printer',
          paguTahun: 30000000,
          realisasiTahun: 10000000,
          sisaPagu: 20000000,
        },
      },
    ],
  },
]

const mockSP2DData = [
  {
    _id: 'sp2d1',
    npdId: 'npd1',
    noSP2D: 'SP2D-2024-001',
    noSPM: 'SPM-2024-001',
    tglSP2D: Date.now(),
    nilaiCair: 25000000,
    catatan: 'Pembayaran bulanan',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

// Mock Convex functions
const mockApi = {
  sp2d: {
    list: jest.fn().mockResolvedValue(mockSP2DData),
    create: jest.fn().mockResolvedValue({ success: true }),
    getByNPD: jest.fn().mockResolvedValue(mockSP2DData[0]),
    distributeToRealizations: jest.fn().mockResolvedValue({ success: true }),
  },
  npd: {
    list: jest.fn().mockResolvedValue(mockNPDData),
    getNPDWithLines: jest.fn().mockResolvedValue(mockNPDData[0]),
  },
}

jest.mock('@/convex/_generated/api', () => ({
  api: mockApi,
}))

jest.mock('@mantine/notifications', () => ({
  notifications: {
    show: jest.fn(),
  },
}))

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
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

describe('SP2D Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('SP2D List Page', () => {
    test('should display SP2D list with correct data', async () => {
      render(
        <TestWrapper>
          <SP2DPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('SP2D')).toBeInTheDocument()
        expect(screen.getByText('SP2D-2024-001')).toBeInTheDocument()
        expect(screen.getByText(formatCurrency(25000000))).toBeInTheDocument()
      })
    })

    test('should filter SP2D by status', async () => {
      render(
        <TestWrapper>
          <SP2DPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument()
      })

      // Test status filter
      const statusFilter = screen.getByLabelText(/status/i)
      fireEvent.change(statusFilter, { target: { value: 'processed' } })

      // Should call API with filter
      await waitFor(() => {
        expect(mockApi.sp2d.list).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'processed',
          })
        )
      })
    })

    test('should create new SP2D successfully', async () => {
      render(
        <TestWrapper>
          <SP2DPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /buat sp2d/i })).toBeInTheDocument()
      })

      // Open create modal
      fireEvent.click(screen.getByRole('button', { name: /buat sp2d/i }))

      await waitFor(() => {
        expect(screen.getByText(/buat sp2d baru/i)).toBeInTheDocument()
      })

      // Fill form
      const noSP2DInput = screen.getByLabelText(/no. sp2d/i)
      const nilaiCairInput = screen.getByLabelText(/nilai cair/i)

      fireEvent.change(noSP2DInput, { target: { value: 'SP2D-TEST-001' } })
      fireEvent.change(nilaiCairInput, { target: { value: '50000000' } })

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /simpan/i }))

      await waitFor(() => {
        expect(mockApi.sp2d.create).toHaveBeenCalledWith(
          expect.objectContaining({
            noSP2D: 'SP2D-TEST-001',
            nilaiCair: 50000000,
          })
        )
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Berhasil',
            color: 'green',
          })
        )
      })
    })
  })

  describe('SP2D Detail Page', () => {
    const mockParams = { id: 'sp2d1' }

    test('should display SP2D details correctly', async () => {
      render(
        <TestWrapper>
          <SP2DDetailPage params={mockParams} />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Detail SP2D')).toBeInTheDocument()
        expect(screen.getByText('SP2D-2024-001')).toBeInTheDocument()
        expect(screen.getByText(formatCurrency(25000000))).toBeInTheDocument()
        expect(screen.getByText('Pembayaran bulanan')).toBeInTheDocument()
      })
    })

    test('should display NPD reference information', async () => {
      render(
        <TestWrapper>
          <SP2DDetailPage params={mockParams} />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Referensi NPD')).toBeInTheDocument()
        expect(screen.getByText('NPD-2024-001')).toBeInTheDocument()
        expect(screen.getByText('Pengadaan Barang Kantor')).toBeInTheDocument()
      })
    })

    test('should handle SP2D distribution correctly', async () => {
      render(
        <TestWrapper>
          <SP2DDetailPage params={mockParams} />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mulai distribusi/i })).toBeInTheDocument()
      })

      // Start distribution
      fireEvent.click(screen.getByRole('button', { name: /mulai distribusi/i }))

      await waitFor(() => {
        expect(screen.getByText('Baris NPD untuk Distribusi')).toBeInTheDocument()
      })

      // Set distribution amounts
      const amountInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(amountInputs[0], { target: { value: '15000000' } })
      fireEvent.change(amountInputs[1], { target: { value: '10000000' } })

      // Confirm distribution
      fireEvent.click(screen.getByRole('button', { name: /ya, distribusikan/i }))

      await waitFor(() => {
        expect(mockApi.sp2d.distributeToRealizations).toHaveBeenCalledWith(
          expect.objectContaining({
            sp2dId: 'sp2d1',
            distributionMap: expect.objectContaining({
              line1: 15000000,
              line2: 10000000,
            }),
          })
        )
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Berhasil',
            message: 'Realisasi berhasil didistribusikan',
          })
        )
      })
    })

    test('should validate distribution constraints', async () => {
      render(
        <TestWrapper>
          <SP2DDetailPage params={mockParams} />
        </TestWrapper>
      )

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /mulai distribusi/i }))
      })

      // Try to exceed remaining budget
      const amountInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(amountInputs[0], { target: { value: '40000000' } })

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            color: 'red',
          })
        )
      })
    })

    test('should validate total distribution matches SP2D amount', async () => {
      render(
        <TestWrapper>
          <SP2DDetailPage params={mockParams} />
        </TestWrapper>
      )

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /mulai distribusi/i }))
      })

      // Set amounts that don't match SP2D total
      const amountInputs = screen.getAllByRole('spinbutton')
      fireEvent.change(amountInputs[0], { target: { value: '10000000' } })
      fireEvent.change(amountInputs[1], { target: { value: '10000000' } })

      // Try to confirm
      fireEvent.click(screen.getByRole('button', { name: /ya, distribusikan/i }))

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            message: expect.stringContaining('Total distribusi harus sama dengan nilai cair SP2D'),
          })
        )
      })
    })
  })

  describe('SP2D Budget Constraints', () => {
    test('should prevent distribution exceeding remaining budget', async () => {
      const mockNPDWithLowBudget = {
        ...mockNPDData[0],
        lines: [
          {
            ...mockNPDData[0].lines[0],
            account: {
              ...mockNPDData[0].lines[0].account,
              sisaPagu: 5000000, // Less than distribution amount
            },
          },
        ],
      }

      mockApi.npd.getNPDWithLines.mockResolvedValue(mockNPDWithLowBudget)

      render(
        <TestWrapper>
          <SP2DDetailPage params={mockParams} />
        </TestWrapper>
      )

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /mulai distribusi/i }))
      })

      const amountInput = screen.getByRole('spinbutton')
      fireEvent.change(amountInput, { target: { value: '10000000' } })

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            message: expect.stringContaining('Melebihi sisa pagu'),
          })
        )
      })
    })
  })

  describe('SP2D Real-time Updates', () => {
    test('should update when SP2D data changes', async () => {
      const { rerender } = render(
        <TestWrapper>
          <SP2DPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('SP2D-2024-001')).toBeInTheDocument()
      })

      // Simulate data update
      const updatedSP2DData = [
        ...mockSP2DData,
        {
          _id: 'sp2d2',
          npdId: 'npd2',
          noSP2D: 'SP2D-2024-002',
          tglSP2D: Date.now(),
          nilaiCair: 30000000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]

      mockApi.sp2d.list.mockResolvedValue(updatedSP2DData)

      rerender(
        <TestWrapper>
          <SP2DPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('SP2D-2024-002')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      mockApi.sp2d.list.mockRejectedValue(new Error('API Error'))

      render(
        <TestWrapper>
          <SP2DPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/gagal memuat data/i)).toBeInTheDocument()
      })
    })

    test('should handle create SP2D errors', async () => {
      mockApi.sp2d.create.mockRejectedValue(new Error('Create failed'))

      render(
        <TestWrapper>
          <SP2DPage />
        </TestWrapper>
      )

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /buat sp2d/i }))
      })

      const noSP2DInput = screen.getByLabelText(/no. sp2d/i)
      fireEvent.change(noSP2DInput, { target: { value: 'SP2D-TEST-001' } })

      fireEvent.click(screen.getByRole('button', { name: /simpan/i }))

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            color: 'red',
          })
        )
      })
    })
  })

  describe('Performance and Optimization', () => {
    test('should handle large data sets efficiently', async () => {
      // Generate large dataset
      const largeSP2DData = Array.from({ length: 1000 }, (_, i) => ({
        _id: `sp2d${i}`,
        npdId: `npd${i}`,
        noSP2D: `SP2D-2024-${String(i + 1).padStart(3, '0')}`,
        tglSP2D: Date.now(),
        nilaiCair: Math.floor(Math.random() * 100000000),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }))

      mockApi.sp2d.list.mockResolvedValue(largeSP2DData)

      const startTime = performance.now()
      render(
        <TestWrapper>
          <SP2DPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('SP2D')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(1000)
    })
  })
})