'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  TextInput,
  Group,
  Button,
  Select,
  ActionIcon,
  Tooltip,
  Loader,
} from '@mantine/core'
import {
  IconSearch,
  IconX,
  IconFilter,
} from '@tabler/icons-react'
import { useDebouncedCallback } from '@mantine/hooks'

interface RKASearchProps {
  onSearch: (query: string) => void
  onFilter: (filters: SearchFilters) => void
  loading?: boolean
  placeholder?: string
  value?: string
}

interface SearchFilters {
  type?: 'all' | 'program' | 'kegiatan' | 'subkegiatan' | 'account'
  status?: 'all' | 'active' | 'inactive'
  sortBy?: 'kode' | 'nama' | 'pagu' | 'realisasi'
}

export function RKASearch({
  onSearch,
  onFilter,
  loading = false,
  placeholder = 'Cari Program, Kegiatan, atau Akun...',
  value = '',
}: RKASearchProps) {
  const [searchQuery, setSearchQuery] = useState(value)
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    status: 'all',
    sortBy: 'kode',
  })
  const [showFilters, setShowFilters] = useState(false)

  // Debounced search callback
  const debouncedSearch = useDebouncedCallback((query: string) => {
    onSearch(query)
  }, 300)

  // Handle search input change
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value
    setSearchQuery(query)
    debouncedSearch(query)
  }, [debouncedSearch])

  // Handle filter change
  const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilter(newFilters)
  }, [filters, onFilter])

  // Clear search
  const handleClear = useCallback(() => {
    setSearchQuery('')
    debouncedSearch('')
  }, [debouncedSearch])

  // Get filter options
  const filterOptions = useMemo(() => ({
    type: [
      { value: 'all', label: 'Semua Jenis' },
      { value: 'program', label: 'Program' },
      { value: 'kegiatan', label: 'Kegiatan' },
      { value: 'subkegiatan', label: 'Sub Kegiatan' },
      { value: 'account', label: 'Akun' },
    ],
    status: [
      { value: 'all', label: 'Semua Status' },
      { value: 'active', label: 'Aktif' },
      { value: 'inactive', label: 'Tidak Aktif' },
    ],
    sortBy: [
      { value: 'kode', label: 'Kode' },
      { value: 'nama', label: 'Nama' },
      { value: 'pagu', label: 'Pagu' },
      { value: 'realisasi', label: 'Realisasi' },
    ],
  }), [])

  return (
    <Group mb="md" justify="space-between" align="flex-start">
      <Group style={{ flex: 1 }}>
        {/* Search Input */}
        <TextInput
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchChange}
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchQuery && (
              <ActionIcon
                size="sm"
                variant="transparent"
                onClick={handleClear}
                title="Hapus pencarian"
              >
                <IconX size={14} />
              </ActionIcon>
            )
          }
          style={{ flex: 1, minWidth: 300 }}
          radius="md"
          size="md"
        />

        {/* Filter Toggle */}
        <Tooltip label="Filter Pencarian">
          <ActionIcon
            size="lg"
            variant={showFilters ? 'filled' : 'light'}
            onClick={() => setShowFilters(!showFilters)}
            title="Filter"
          >
            <IconFilter size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* Filters Panel */}
      {showFilters && (
        <Group mb="sm" p="md" bg="gray.0" style={{ borderRadius: 8 }}>
          <Select
            label="Jenis"
            data={filterOptions.type}
            value={filters.type}
            onChange={(value) => handleFilterChange('type', value)}
            w={150}
            size="sm"
            clearable
          />

          <Select
            label="Status"
            data={filterOptions.status}
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            w={120}
            size="sm"
            clearable
          />

          <Select
            label="Urutkan"
            data={filterOptions.sortBy}
            value={filters.sortBy}
            onChange={(value) => handleFilterChange('sortBy', value)}
            w={120}
            size="sm"
          />

          {loading && <Loader size="sm" />}
        </Group>
      )}
    </Group>
  )
}