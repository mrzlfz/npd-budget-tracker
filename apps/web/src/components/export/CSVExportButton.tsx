'use client'

import { useState } from 'react'
import {
  Button,
  Group,
  Modal,
  Stack,
  Title,
  Text,
  Select,
  MultiSelect,
  DateInput,
  Switch,
  Divider,
  Checkbox,
  NumberInput,
} from '@mantine/core'
import { IconDownload, IconFilter } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import {
  exportToCSV,
  CSVExportOptions,
  CSVColumn,
  NPD_EXPORT_COLUMNS,
  SP2D_EXPORT_COLUMNS,
  PERFORMANCE_EXPORT_COLUMNS,
  RKA_EXPORT_COLUMNS,
} from '@/lib/export/csv'

interface CSVExportButtonProps {
  data: any[]
  type: 'npd' | 'sp2d' | 'performance' | 'rka'
  onExport?: (filename: string) => void
  disabled?: boolean
}

export default function CSVExportButton({
  data,
  type,
  onExport,
  disabled = false,
}: CSVExportButtonProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [options, setOptions] = useState<CSVExportOptions>({
    filename: `${type}-export-${new Date().toISOString().split('T')[0]}.csv`,
    encoding: 'utf-8',
    separator: ',',
    includeHeaders: true,
    dateFormat: 'id',
    numberFormat: 'id',
    currencyFormat: 'symbol',
  })

  const [filterEnabled, setFilterEnabled] = useState(false)
  const [columnSelectionEnabled, setColumnSelectionEnabled] = useState(false)

  // Get columns for the current type
  const getColumns = (): CSVColumn[] => {
    switch (type) {
      case 'npd':
        return NPD_EXPORT_COLUMNS
      case 'sp2d':
        return SP2D_EXPORT_COLUMNS
      case 'performance':
        return PERFORMANCE_EXPORT_COLUMNS
      case 'rka':
        return RKA_EXPORT_COLUMNS
      default:
        return []
    }
  }

  const columns = getColumns()
  const availableStatuses = Array.from(new Set(data.map(item => item.status).filter(Boolean)))
  const uniqueOrganizations = Array.from(
    new Set(data.map(item => item.organizationId).filter(Boolean))
  )

  const handleExport = async () => {
    if (data.length === 0) {
      notifications.show({
        title: 'No Data',
        message: 'Tidak ada data untuk diekspor',
        color: 'yellow',
      })
      return
    }

    setIsExporting(true)

    try {
      const exportOptions: CSVExportOptions = {
        ...options,
        filter: filterEnabled ? {
          dateRange: options.filter?.dateRange,
          status: options.filter?.status,
          organizationId: options.filter?.organizationId,
        } : undefined,
        columns: columnSelectionEnabled ? options.columns : undefined,
      }

      await exportToCSV(data, columns, exportOptions)

      notifications.show({
        title: 'Export Berhasil',
        message: `Data berhasil diekspor ke ${options.filename}`,
        color: 'green',
      })

      onExport?.(options.filename!)
      setShowSettings(false)
    } catch (error) {
      console.error('Export error:', error)
      notifications.show({
        title: 'Export Gagal',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengekspor data',
        color: 'red',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <Group>
        <Button
          leftSection={<IconDownload size={16} />}
          onClick={handleExport}
          loading={isExporting}
          disabled={disabled || data.length === 0}
          variant="filled"
        >
          Export CSV
        </Button>

        <Button
          variant="outline"
          leftSection={<IconFilter size={16} />}
          onClick={() => setShowSettings(true)}
          disabled={disabled}
        >
          Export Options
        </Button>

        <Text size="sm" color="dimmed">
          {data.length} data available
        </Text>
      </Group>

      <Modal
        opened={showSettings}
        onClose={() => setShowSettings(false)}
        title="Export Settings"
        size="lg"
      >
        <Stack gap="md">
          {/* Basic Settings */}
          <Title order={4}>Basic Settings</Title>

          <Text size="sm" weight={600}>File Name:</Text>
          <Text size="sm">{options.filename}</Text>

          <Select
            label="Separator"
            data={[
              { value: ',', label: 'Comma (,)' },
              { value: ';', label: 'Semicolon (;)' },
              { value: '\t', label: 'Tab' },
            ]}
            value={options.separator}
            onChange={(value) => setOptions(prev => ({
              ...prev,
              separator: value as ',' | ';' | '\t'
            }))}
          />

          <Select
            label="Date Format"
            data={[
              { value: 'id', label: 'Indonesian (31 Desember 2023)' },
              { value: 'iso', label: 'ISO (2023-12-31T00:00:00.000Z)' },
              { value: 'timestamp', label: 'Timestamp (1704067200000)' },
            ]}
            value={options.dateFormat}
            onChange={(value) => setOptions(prev => ({
              ...prev,
              dateFormat: value as 'id' | 'iso' | 'timestamp'
            }))}
          />

          <Select
            label="Number Format"
            data={[
              { value: 'id', label: 'Indonesian (1.234.567,89)' },
              { value: 'en', label: 'English (1,234,567.89)' },
            ]}
            value={options.numberFormat}
            onChange={(value) => setOptions(prev => ({
              ...prev,
              numberFormat: value as 'id' | 'en'
            }))}
          />

          <Select
            label="Currency Format"
            data={[
              { value: 'symbol', label: 'Symbol (Rp 1.234.567)' },
              { value: 'code', label: 'Code (IDR 1,234,567)' },
              { value: 'none', label: 'None (1.234.567)' },
            ]}
            value={options.currencyFormat}
            onChange={(value) => setOptions(prev => ({
              ...prev,
              currencyFormat: value as 'symbol' | 'code' | 'none'
            }))}
          />

          <Switch
            label="Include Headers"
            checked={options.includeHeaders}
            onChange={(e) => setOptions(prev => ({
              ...prev,
              includeHeaders: e.currentTarget.checked
            }))}
          />

          <Divider />

          {/* Filter Settings */}
          <Group justify="space-between">
            <Title order={4}>Filters</Title>
            <Switch
              label="Enable Filters"
              checked={filterEnabled}
              onChange={(e) => setFilterEnabled(e.currentTarget.checked)}
            />
          </Group>

          {filterEnabled && (
            <Stack gap="sm" pl="md">
              <DateInput
                label="Start Date"
                placeholder="Select start date"
                value={options.filter?.dateRange?.start}
                onChange={(date) => setOptions(prev => ({
                  ...prev,
                  filter: {
                    ...prev.filter,
                    dateRange: {
                      ...prev.filter?.dateRange,
                      start: date,
                    }
                  }
                }))}
              />

              <DateInput
                label="End Date"
                placeholder="Select end date"
                value={options.filter?.dateRange?.end}
                onChange={(date) => setOptions(prev => ({
                  ...prev,
                  filter: {
                    ...prev.filter,
                    dateRange: {
                      ...prev.filter?.dateRange,
                      end: date,
                    }
                  }
                }))}
              />

              {availableStatuses.length > 0 && (
                <MultiSelect
                  label="Status"
                  data={availableStatuses.map(status => ({
                    value: status,
                    label: status.charAt(0).toUpperCase() + status.slice(1)
                  }))}
                  value={options.filter?.status || []}
                  onChange={(values) => setOptions(prev => ({
                    ...prev,
                    filter: {
                      ...prev.filter,
                      status: values,
                    }
                  }))}
                />
              )}

              {uniqueOrganizations.length > 0 && (
                <Select
                  label="Organization"
                  data={[
                    { value: '', label: 'All Organizations' },
                    ...uniqueOrganizations.map(orgId => ({
                      value: orgId,
                      label: orgId,
                    }))
                  ]}
                  value={options.filter?.organizationId || ''}
                  onChange={(value) => setOptions(prev => ({
                    ...prev,
                    filter: {
                      ...prev.filter,
                      organizationId: value || undefined,
                    }
                  }))}
                />
              )}
            </Stack>
          )}

          <Divider />

          {/* Column Selection */}
          <Group justify="space-between">
            <Title order={4}>Column Selection</Title>
            <Switch
              label="Select Columns"
              checked={columnSelectionEnabled}
              onChange={(e) => setColumnSelectionEnabled(e.currentTarget.checked)}
            />
          </Group>

          {columnSelectionEnabled && (
            <Checkbox.Group
              value={options.columns || columns.map(col => col.key)}
              onChange={(values) => setOptions(prev => ({
                ...prev,
                columns: values,
              }))}
            >
              <Stack gap="xs" pl="md">
                {columns.map((column) => (
                  <Checkbox
                    key={column.key}
                    value={column.key}
                    label={`${column.label} (${column.key})`}
                  />
                ))}
              </Stack>
            </Checkbox.Group>
          )}

          <Divider />

          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              loading={isExporting}
              disabled={data.length === 0}
            >
              Export Now
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}