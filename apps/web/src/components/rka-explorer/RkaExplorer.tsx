'use client'

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { SearchInput } from './SearchInput';
import { StatusFilter } from './StatusFilter';
import { FiscalYearFilter } from './FiscalYearFilter';
import { RkaTable } from './RkaTable';
import { Pagination } from './Pagination';
import { RkaDocument } from '@/types/rka';

export function RkaExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const itemsPerPage = 10;

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter, fiscalYearFilter]);

  // Fetch RKA documents with filters
  const { data: rkaData, isLoading, error } = useQuery(
    api.rka.searchAndFilter,
    {
      filters: {
        searchQuery: debouncedSearchQuery,
        status: statusFilter === 'all' ? undefined : statusFilter,
        fiscalYear: fiscalYearFilter === 'all' ? undefined : fiscalYearFilter,
      },
      pagination: {
        page: currentPage,
        limit: itemsPerPage,
      },
    }
  );

  const { documents: rkaDocuments, pagination } = rkaData || { documents: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } };

  // Fetch available fiscal years for filter
  const { data: fiscalYears } = useQuery(api.rka.getFiscalYears);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
  };

  const handleFiscalYearFilterChange = (fiscalYear: string) => {
    setFiscalYearFilter(fiscalYear);
  };

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
        <div className="text-sm text-red-800 dark:text-red-200">
          Error loading RKA documents: {error.message}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <RkaExplorerSkeleton />;
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <div className="bg-white px-4 py-5 sm:p-6 dark:bg-gray-800">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              RKA Explorer
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {pagination.totalItems} document{pagination.totalItems !== 1 ? 's' : ''} found
            </div>
          </div>

          <Suspense fallback={<RkaExplorerSkeleton />}>
            <RkaTable
              documents={rkaDocuments}
              isLoading={isLoading}
              pagination={pagination}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}