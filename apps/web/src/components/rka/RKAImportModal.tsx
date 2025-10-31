"use client";

import React, { useState, useCallback } from "react";
import {
  Group,
  Button,
  Text,
  Title,
  Stack,
  Paper,
  Progress,
  Alert,
  Table,
  Badge,
  ActionIcon,
  Tooltip,
  NumberFormatter,
  ScrollArea,
} from "@mantine/core";
import { IconCloudUpload, IconFileDownload, IconX, IconCheck, IconAlertTriangle } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { parseCSV } from "@/lib/utils/csvParser";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";

interface ImportResult {
  success: boolean;
  summary?: {
    totalRows: number;
    programsCreated: number;
    kegiatansCreated: number;
    subkegiatansCreated: number;
    accountsCreated: number;
    errors: number;
    fiscalYear: number;
  };
  details?: any;
  error?: string;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

const REQUIRED_HEADERS = [
  'programKode', 'programNama',
  'kegiatanKode', 'kegiatanNama',
  'subkegiatanKode', 'subkegiatanNama',
  'akunKode', 'akunUraian',
  'paguTahun'
];

const OPTIONAL_HEADERS = [
  'satuan', 'volume', 'hargaSatuan'
];

export function RKAImportModal({ opened, onClose, organizationId }: {
  opened: boolean;
  onClose: () => void;
  organizationId: string;
}) {
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
  } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Mutations
  const validateCSV = useMutation(api.csvImport.validateCSVStructure);
  const importRKA = useMutation(api.csvImport.importRKA);
  const createProgress = useMutation(api.importProgress.createImportProgress);
  const updateProgress = useMutation(api.importProgress.updateImportProgress);

  // Query for import history and progress
  const { data: importHistoryData } = useQuery(api.auditLogs.getAuditLogs, {
    organizationId,
    filters: {
      entityTable: "csv_import",
    },
    paginationOpts: {
      numItems: 10,
    }
  });

  const { data: activeProgress } = useQuery(api.importProgress.getImportProgress, {
    organizationId,
    importType: "rka",
  });

  const importHistory = importHistoryData?.page || [];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Read and parse file
      const text = await file.text();
      setUploadProgress(25);

      const parsed = parseCSV(text);
      setUploadProgress(50);
      setCsvData(parsed.data);

      // Validate CSV structure
      const validation = await validateCSV({
        headers: parsed.headers,
        sampleRow: parsed.data.length > 0 ? parsed.data[0].map((cell: any) => cell.toString()) : []
      });
      setUploadProgress(75);

      setValidationResult(validation);
      setIsUploading(false);
      setUploadProgress(100);

      if (!validation.valid) {
        notifications.show({
          title: "Validasi CSV Gagal",
          message: validation.errors.join(", "),
          color: "red",
          icon: <IconAlertTriangle size="16" />,
        });
      }
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      notifications.show({
        title: "Error Membaca File",
        message: error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui",
        color: "red",
        icon: <IconAlertTriangle size="16" />,
      });
    }
  };

  const handleImport = async () => {
    if (!validationResult?.valid || csvData.length === 0) {
      notifications.show({
        title: "Data Tidak Valid",
        message: "Harap validasi CSV terlebih dahulu",
        color: "red",
      });
      return;
    }

    let progressId: string | null = null;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create initial progress tracking
      const progress = await createProgress({
        organizationId,
        importType: "rka",
        totalRows: csvData.length,
        status: "started",
        currentRow: 0,
        errors: [],
        metadata: {
          filename: "RKA Import",
          fiscalYear,
          timestamp: new Date().toISOString(),
        }
      });
      progressId = progress;

      setUploadProgress(25);

      const result = await importRKA({
        organizationId,
        fiscalYear,
        csvData
      });

      setUploadProgress(100);

      // Update progress to completed
      if (progressId) {
        await updateProgress({
          progressId,
          status: "completed",
          currentRow: csvData.length,
          errors: [],
          metadata: {
            ...result.summary,
            completedAt: new Date().toISOString(),
          }
        });
      }

      setImportResult(result);

      if (result.success) {
        notifications.show({
          title: "Import Berhasil",
          message: `${result.summary?.accountsCreated} akun berhasil diimport`,
          color: "green",
          icon: <IconCheck size="16" />,
        });
      }
    } catch (error) {
      // Update progress to failed
      if (progressId) {
        await updateProgress({
          progressId,
          status: "failed",
          errors: [{
            row: 0,
            field: "general",
            message: error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui"
          }],
          metadata: {
            error: error instanceof Error ? error.message : "Unknown error",
            failedAt: new Date().toISOString(),
          }
        });
      }

      notifications.show({
        title: "Import Gagal",
        message: error instanceof Error ? error.message : "Terjadi kesalahan",
        color: "red",
        icon: <IconAlertTriangle size="16" />,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];
    const sampleData = [
      [
        "1.01.01.01",
        "Program Contoh",
        "1.01.01.01.01",
        "Kegiatan Contoh",
        "1.01.01.01.01.01",
        "Sub Kegiatan Contoh",
        "5.1.01.01.01.001",
        "Belanja Barang Kebutuhan Kantor Lainnya",
        "Unit",
        10,
        100000,
        1000000000
      ]
    ];

    const csvContent = [headers, sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_rka.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setCsvData([]);
    setValidationResult(null);
    setImportResult(null);
    setUploadProgress(0);
  };

  return (
    <Stack size="md">
      <Group justify="space-between">
        <Title order={3}>Import Data RKA</Title>
        <Button variant="subtle" onClick={onClose}>
          <IconX size="16" />
        </Button>
      </Group>

      {/* File Upload Area */}
      <Paper
        {...getRootProps()}
        p="xl"
        withBorder
        style={{
          backgroundColor: isDragActive ? "#f8f9fa" : "transparent",
          cursor: "pointer",
          borderStyle: "dashed",
        }}
      >
        <input {...getInputProps()} />
        <Stack align="center" gap="md">
          <IconCloudUpload size={48} color="#6366f1" />
          <Text ta="center" size="lg" fw={500}>
            {isDragActive ? "Drop file CSV di sini" : "Drag & Drop file CSV atau klik untuk browse"}
          </Text>
          <Text ta="center" size="sm" c="dimmed">
            Format: CSV (.csv), maksimal 10MB
          </Text>
          <Button variant="outline" onClick={downloadTemplate}>
            <IconFileDownload size="16" />
            Download Template
          </Button>
        </Stack>
      </Paper>

      {/* Progress Bar */}
      {(isUploading || uploadProgress > 0) && (
        <Stack>
          <Group justify="space-between">
            <Text size="sm">Memproses file...</Text>
            <Text size="sm">{uploadProgress}%</Text>
          </Group>
          <Progress value={uploadProgress} color="blue" />
        </Stack>
      )}

      {/* Active Import Progress */}
      {activeProgress && activeProgress.length > 0 && (
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Title order={4}>Progress Import Aktif</Title>
            <ScrollArea h={200}>
              {activeProgress.map((progress) => (
                <Paper key={progress._id} p="sm" mb="sm" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>{progress.importType.toUpperCase()}</Text>
                    <Badge
                      color={
                        progress.status === 'completed' ? 'green' :
                        progress.status === 'failed' ? 'red' : 'blue'
                      }
                      variant="light"
                    >
                      {progress.status}
                    </Badge>
                  </Group>

                  <Stack gap="xs">
                    <Group>
                      <Text size="xs" c="dimmed">Progress:</Text>
                      <Text size="xs">
                        {progress.currentRow} / {progress.totalRows} baris
                      </Text>
                    </Group>

                    <Progress
                      value={(progress.currentRow / progress.totalRows) * 100}
                      color={
                        progress.status === 'completed' ? 'green' :
                        progress.status === 'failed' ? 'red' : 'blue'
                      }
                      size="sm"
                    />

                    {progress.errors.length > 0 && (
                      <Group align="flex-start" gap="xs">
                        <Text size="xs" c="dimmed">Errors:</Text>
                        <Stack gap="2">
                          {progress.errors.slice(0, 3).map((error, index) => (
                            <Text key={index} size="xs" c="red">
                              Baris {error.row}: {error.message}
                            </Text>
                          ))}
                          {progress.errors.length > 3 && (
                            <Text size="xs" c="red">
                              ...+{progress.errors.length - 3} error lainnya
                            </Text>
                          )}
                        </Stack>
                      </Group>
                    )}

                    <Text size="xs" c="dimmed">
                      Dimulai: {new Date(progress.createdAt).toLocaleString('id-ID')}
                    </Text>
                  </Stack>
                </Paper>
              ))}
            </ScrollArea>
          </Stack>
        </Paper>
      )}

      {/* Validation Result */}
      {validationResult && (
        <Alert
          color={validationResult.valid ? "green" : "red"}
          icon={validationResult.valid ? <IconCheck /> : <IconAlertTriangle />}
        >
          <Text fw={500}>
            {validationResult.valid ? "✅ Validasi Berhasil" : "❌ Validasi Gagal"}
          </Text>
          {!validationResult.valid && (
            <Stack mt="sm" gap="xs">
              {validationResult.errors.map((error, index) => (
                <Text key={index} size="sm">• {error}</Text>
              ))}
            </Stack>
          )}
        </Alert>
      )}

      {/* Import Result */}
      {importResult && (
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Title order={4}>Hasil Import</Title>
            <Group>
              <Badge
                color={importResult.success ? "green" : "red"}
                variant="light"
              >
                {importResult.success ? "Berhasil" : "Gagal"}
              </Badge>
            </Group>

            {importResult.success && importResult.summary && (
              <Table>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Th>Total Baris</Table.Th>
                    <Table.Td>
                      <NumberFormatter thousandSeparator="." decimalSeparator="," />
                      {importResult.summary.totalRows}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>Program Dibuat</Table.Th>
                    <Table.Td>{importResult.summary.programsCreated}</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>Kegiatan Dibuat</Table.Th>
                    <Table.Td>{importResult.summary.kegiatansCreated}</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>Sub Kegiatan Dibuat</Table.Th>
                    <Table.Td>{importResult.summary.subkegiatansCreated}</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>Akun Dibuat</Table.Th>
                    <Table.Td>{importResult.summary.accountsCreated}</Table.Td>
                  </Table.Tr>
                  {importResult.summary.errors > 0 && (
                    <Table.Tr>
                      <Table.Th>Error</Table.Th>
                      <Table.Td c="red">{importResult.summary.errors}</Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            )}

            {importResult.error && (
              <Alert color="red">
                <Text>{importResult.error}</Text>
              </Alert>
            )}
          </Stack>
        </Paper>
      )}

      {/* Import History */}
      {importHistory && importHistory.length > 0 && (
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Title order={4}>Riwayat Import</Title>
            <ScrollArea h={200}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Tanggal</Table.Th>
                    <Table.Th>Jenis</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Aksi</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {importHistory.map((log) => (
                    <Table.Tr key={log._id}>
                      <Table.Td>
                        {new Date(log.createdAt).toLocaleDateString("id-ID")}
                      </Table.Td>
                      <Table.Td>{log.action}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={log.action.includes("failed") ? "red" : "green"}
                          variant="light"
                          size="sm"
                        >
                          {log.action.includes("failed") ? "Gagal" : "Berhasil"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Tooltip label="Lihat Detail">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            onClick={() => console.log("Show detail:", log.entityData)}
                          >
                            📋
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Stack>
        </Paper>
      )}

      {/* Action Buttons */}
      <Group justify="flex-end">
        <Button variant="outline" onClick={resetForm}>
          Reset
        </Button>
        {validationResult?.valid && csvData.length > 0 && (
          <Button
            onClick={handleImport}
            loading={isUploading}
            disabled={isUploading}
          >
            Import Data RKA
          </Button>
        )}
      </Group>
    </Stack>
  );
}