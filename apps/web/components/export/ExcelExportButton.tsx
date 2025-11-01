'use client';

import React, { useState } from 'react';
import {
  Button,
  Group,
  Modal,
  Select,
  TextInput,
  Stack,
  Checkbox,
  Text,
  List,
  ActionIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconCalendar, IconFileSpreadsheet } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import ExcelJS from 'exceljs';

interface ExportFilter {
  startDate: string;
  endDate: string;
  status: string[];
  documentType: string[];
  includeHeaders: boolean;
}

interface ExportColumn {
  key: string;
  label: string;
  width: number;
  formatter?: (value: any) => string;
}

export default function ExcelExportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const [filters, setFilters] = useState<ExportFilter>({
    startDate: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
    endDate: format(new Date(new Date().getFullYear(), 11, 30), 'yyyy-MM-dd'),
    status: ['diajukan', 'diverifikasi', 'final'],
    documentType: ['UP', 'GU', 'TU', 'LS'],
    includeHeaders: true,
  });

  const exportColumns: ExportColumn[] = [
    { key: 'documentNumber', label: 'Nomor NPD', width: 150 },
    { key: 'title', label: 'Judul', width: 200 },
    { key: 'jenis', label: 'Jenis', width: 100 },
    { key: 'status', label: 'Status', width: 100 },
    { key: 'createdBy', label: 'Dibuat Oleh', width: 150 },
    { key: 'createdAt', label: 'Tanggal', width: 120 },
    { key: 'totalAmount', label: 'Total', width: 120 },
    { key: 'organizationName', label: 'OPD', width: 200 },
  ];

  // Mock data - replace with real Convex calls
  const mockData = [
    {
      documentNumber: 'NPD-2025-001',
      title: 'Pengadaan ATK Kantor',
      jenis: 'UP',
      status: 'final',
      createdBy: 'Ahmad Wijaya',
      createdAt: Date.now() - 86400000 * 60,
      totalAmount: 50000000,
      organizationName: 'Dinas Pendidikan'
    },
    {
      documentNumber: 'NPD-2025-002',
      title: 'Biaya Operasional',
      jenis: 'GU',
      status: 'final',
      createdBy: 'Siti Nurhaliza',
      createdAt: Date.now() - 86400000 * 45,
      totalAmount: 75000000,
      organizationName: 'Dinas Pendidikan'
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);

    try {
      // Filter data based on filters
      const filteredData = mockData.filter(item => {
        const itemDate = new Date(item.createdAt);
        const start = filters.startDate ? parseISO(filters.startDate) : new Date(0);
        const end = filters.endDate ? parseISO(filters.endDate) : new Date();

        return (
          itemDate >= start &&
          itemDate <= end &&
          filters.status.length === 0 || filters.status.includes(item.status) &&
          filters.documentType.length === 0 || filters.documentType.includes(item.jenis)
        );
      });

      // Create workbook using ExcelJS
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'NPD Tracker';
      workbook.created = new Date();
      
      const worksheet = workbook.addWorksheet('NPD Data');

      // Add header row
      if (filters.includeHeaders) {
        const headerRow = worksheet.addRow(exportColumns.map(col => col.label));
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Add data rows
      filteredData.forEach(item => {
        worksheet.addRow([
          item.documentNumber,
          item.title,
          item.jenis,
          item.status,
          item.createdBy,
          format(new Date(item.createdAt), 'dd/MM/yyyy'),
          item.totalAmount,
          item.organizationName,
        ]);
      });

      // Set column widths
      exportColumns.forEach((col, idx) => {
        worksheet.getColumn(idx + 1).width = col.width / 7; // Convert pixels to Excel width units
      });

      // Generate Excel file
      const excelBuffer = await workbook.xlsx.writeBuffer();

      // Create download
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `npd-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(link);
      link.click();

      notifications.show({
        title: 'Export Berhasil',
        message: `Data ${filteredData.length} dokumen NPD berhasil diekspor ke Excel`,
        color: 'green',
      });

      setIsExporting(false);
      setProgress(100);

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);

    } catch (error) {
      notifications.show({
        title: 'Export Gagal',
        message: 'Gagal mengekspor data ke Excel',
        color: 'red',
      });
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        leftSection={<IconFileSpreadsheet size={16} />}
        onClick={() => setIsOpen(true)}
      >
        Export ke Excel
      </Button>

      {/* Progress Modal */}
      {isExporting && (
        <Modal
          opened={isOpen}
          onClose={() => setIsOpen(false)}
          size="md"
          closeOnClickOutside={false}
        >
          <Stack gap="md">
            <Group>
              <IconFileSpreadsheet size={48} color="blue" />
              <Text fw="bold">Mengekspor Data NPD</Text>
            </Group>

            <Text c="dimmed" mb="md">
              Sedang menyiapkan data untuk diekspor. Mohon tunggu...
            </Text>

            <div
              style={{
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                height: '8px',
                transition: 'all 0.3s ease'
              }}
            />
          </Stack>
        </Modal>
      )}

      {/* Filter Modal Content */}
      {isOpen && !isExporting && (
        <Modal
          opened={isOpen}
          onClose={() => setIsOpen(false)}
          title="Filter dan Konfigurasi Export"
          size="lg"
        >
          <Stack gap="md">
            <Text fw="bold" mb="md">Filter Export</Text>

            <TextInput
              label="Tanggal Mulai"
              type="date"
              value={filters.startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, startDate: e.currentTarget.value }))}
            />

            <TextInput
              label="Tanggal Selesai"
              type="date"
              value={filters.endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, endDate: e.currentTarget.value }))}
            />

            <TextInput
              label="Filter Status (pisahkan dengan koma)"
              placeholder="diajukan, diverifikasi, final"
              value={filters.status.join(', ')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, status: e.currentTarget.value.split(',').map((s: string) => s.trim()) }))}
            />

            <TextInput
              label="Filter Jenis (pisahkan dengan koma)"
              placeholder="UP, GU, TU, LS"
              value={filters.documentType.join(', ')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, documentType: e.currentTarget.value.split(',').map((s: string) => s.trim()) }))}
            />

            <Checkbox
              label="Sertakan Header"
              checked={filters.includeHeaders}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, includeHeaders: event.currentTarget.checked }))}
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleExport}>
                Export Data
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </>
  );
}