import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { ConvexProvider } from 'convex/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock API
jest.mock('@/convex/_generated/api', () => ({
  api: {
    npd: {
      getSummary: jest.fn(),
      list: jest.fn(),
    },
    rkaAccounts: {
      list: jest.fn(),
    },
  },
}));

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      {children}
    </Provider>
  );
};

describe('useDashboardData', () => {
  const mockUseQuery = require('convex/react').useQuery;
  const mockApi = require('@/convex/_generated/api').api;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(
      () => useDashboardData('org123', 2024),
      { wrapper: createWrapper() }
    );

    expect(result.current.loading).toBe(true);
  });

  it('should process data correctly when loaded', async () => {
    const mockSummary = {
      total: 10,
      byStatus: { draft: 2, diajukan: 3, diverifikasi: 2, final: 3 },
      totalNilai: 1000000,
      rataRata: 100000,
    };

    const mockNpds = [
      { id: '1', nilai: 500000, status: 'final' },
      { id: '2', nilai: 300000, status: 'draft' },
    ];

    const mockAccounts = [
      { id: '1', paguTahun: 1000000, realisasiTahun: 800000 },
      { id: '2', paguTahun: 500000, realisasiTahun: 400000 },
    ];

    mockUseQuery.mockImplementation((query, args) => {
      if (query === mockApi.npd.getSummary) {
        return { data: args === 'skip' ? undefined : mockSummary, isLoading: false };
      }
      if (query === mockApi.npd.list) {
        return { data: args === 'skip' ? undefined : mockNpds, isLoading: false };
      }
      if (query === mockApi.rkaAccounts.list) {
        return { data: args === 'skip' ? undefined : mockAccounts, isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });

    const { result } = renderHook(
      () => useDashboardData('org123', 2024),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.summary).toEqual(mockSummary);
    expect(result.current.npds).toEqual(mockNpds);
    expect(result.current.accounts).toEqual(mockAccounts);
    expect(result.current.totalPagu).toBe(1500000);
    expect(result.current.totalRealisasi).toBe(1200000);
    expect(result.current.utilizationRate).toBe(80);
  });

  it('should handle missing organization ID', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false });

    const { result } = renderHook(
      () => useDashboardData(undefined, 2024),
      { wrapper: createWrapper() }
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.summary.total).toBe(0);
    expect(result.current.npds).toEqual([]);
    expect(result.current.accounts).toEqual([]);
  });
});
