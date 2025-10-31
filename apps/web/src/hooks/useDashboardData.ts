'use client';

import { useState, useEffect } from 'react';
import { useQuery, useSubscription } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from 'convex/values';

export function useDashboardData(organizationId?: Id<"organizations">, fiscalYear?: number) {
  const [loading, setLoading] = useState(true);

  // Get dashboard KPIs
  const { data: summary, isLoading: summaryLoading } = useQuery(
    api.npd.getSummary,
    organizationId && fiscalYear ? {
      organizationId,
      tahun: fiscalYear,
    } : "skip"
  );

  // Get NPDs for charts
  const { data: npds, isLoading: npdsLoading } = useQuery(
    api.npd.list,
    organizationId && fiscalYear ? {
      organizationId,
      tahun: fiscalYear,
    } : "skip"
  );

  // Real-time subscriptions for automatic dashboard updates
  useSubscription(
    api.npd.onStatusChange,
    organizationId ? { organizationId } : "skip"
  );

  useSubscription(
    api.sp2d.onCreate,
    organizationId ? { organizationId } : "skip"
  );

  useSubscription(
    api.rkaAccounts.onRealizationUpdate,
    organizationId ? { organizationId } : "skip"
  );

  // Get RKA accounts for budget data
  const { data: accounts, isLoading: accountsLoading } = useQuery(
    api.rkaAccounts.list,
    organizationId ? {
      organizationId,
    } : "skip"
  );

  // Calculate budget utilization
  const totalPagu = accounts?.reduce((sum, acc) => sum + acc.paguTahun, 0) || 0;
  const totalRealisasi = accounts?.reduce((sum, acc) => sum + acc.realisasiTahun, 0) || 0;
  const utilizationRate = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

  useEffect(() => {
    const isLoading = summaryLoading || npdsLoading || accountsLoading;
    setLoading(isLoading);
  }, [summaryLoading, npdsLoading, accountsLoading]);

  // Process data for charts
  const processMonthlyData = () => {
    if (!npds) return [];

    // Group by month for demo purposes
    const monthlyData = [
      { month: 'Jan', pagu: 1000000000, realisasi: 850000000, target: 900000000 },
      { month: 'Feb', pagu: 1000000000, realisasi: 920000000, target: 900000000 },
      { month: 'Mar', pagu: 1100000000, realisasi: 880000000, target: 1000000000 },
      { month: 'Apr', pagu: 1000000000, realisasi: 950000000, target: 950000000 },
      { month: 'Mei', pagu: 1200000000, realisasi: 840000000, target: 1100000000 },
      { month: 'Jun', pagu: 1000000000, realisasi: 980000000, target: 1000000000 },
    ];

    return monthlyData;
  };

  const processBudgetBreakdown = () => {
    if (!accounts) return [];

    const budgetData = [
      { name: 'Belanja Pegawai', value: totalPagu * 0.4, percentage: 40 },
      { name: 'Belanja Barang & Jasa', value: totalPagu * 0.3, percentage: 30 },
      { name: 'Belanja Modal', value: totalPagu * 0.2, percentage: 20 },
      { name: 'Belanja Tak Terduga', value: totalPagu * 0.1, percentage: 10 },
    ];

    return budgetData;
  };

  const processStatusData = () => {
    if (!summary) return [];

    const statusData = [
      { name: 'Selesai', value: summary?.byStatus?.final || 0, percentage: 74 },
      { name: 'Dalam Proses', value: summary?.byStatus?.diajukan || 0, percentage: 16 },
      { name: 'Draft', value: summary?.byStatus?.draft || 0, percentage: 10 },
    ];

    return statusData;
  };

  return {
    loading,
    summary: summary || {
      total: 0,
      byStatus: { draft: 0, diajukan: 0, diverifikasi: 0, final: 0 },
      totalNilai: 0,
      rataRata: 0,
    },
    npds: npds || [],
    accounts: accounts || [],
    totalPagu,
    totalRealisasi,
    utilizationRate,
    monthlyData: processMonthlyData(),
    pieData: processBudgetBreakdown(),
    statusData: processStatusData(),
  };
}