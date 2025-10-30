'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Group,
  Text,
  rem,
  Paper,
  ActionIcon,
  Stack,
  Progress,
  Badge,
  Tooltip,
} from '@mantine/core';
import {
  IconUpload,
  IconX,
  IconFileText,
  IconFile,
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { cn } from '@/lib/utils';

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

interface FileUploadProps {
  value?: FileWithPreview[];
  onChange?: (files: FileWithPreview[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: Record<string, string[]>;
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
}

// Default accepted file types for Indonesian government documents
const DEFAULT_ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
};

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_FILES = 5;

export default function FileUpload({
  value = [],
  onChange,
  maxFiles = DEFAULT_MAX_FILES,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false,
  showPreview = true,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>(value);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      // Handle rejected files
      if (fileRejections.length > 0) {
        fileRejections.forEach(({ file, errors }) => {
          errors.forEach((error: any) => {
            let message = '';
            switch (error.code) {
              case 'file-too-large':
                message = `File ${file.name} terlalu besar. Maksimal ${formatFileSize(maxSize)}`;
                break;
              case 'file-invalid-type':
                message = `File ${file.name} tidak valid. Hanya file PDF, DOC, DOCX, XLS, XLSX, JPG, PNG yang diperbolehkan`;
                break;
              case 'too-many-files':
                message = `Terlalu banyak file. Maksimal ${maxFiles} file`;
                break;
              default:
                message = `Error dengan file ${file.name}: ${error.message}`;
            }

            notifications.show({
              title: 'Error Upload',
              message,
              color: 'red',
              icon: <IconAlertTriangle size={16} />,
            });
          });
        });
        return;
      }

      // Process accepted files
      const newFiles: FileWithPreview[] = acceptedFiles.map((file) => ({
        ...file,
        id: Math.random().toString(36).substr(2, 9),
        status: 'pending' as const,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));

      const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
      setFiles(updatedFiles);
      onChange?.(updatedFiles);

      // Simulate upload progress
      newFiles.forEach((file) => {
        simulateFileUpload(file, updatedFiles, setFiles);
      });
    },
    [files, maxFiles, maxSize, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize,
    maxFiles: maxFiles - files.length,
    disabled,
  });

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter((file) => file.id !== fileId);
    setFiles(updatedFiles);
    onChange?.(updatedFiles);
  };

  const simulateFileUpload = async (
    file: FileWithPreview,
    currentFiles: FileWithPreview[],
    setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>
  ) => {
    // Update status to uploading
    setFiles((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, status: 'uploading' as const, progress: 0 } : f))
    );

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
      );
    }

    // Simulate success/error (90% success rate)
    const isSuccess = Math.random() > 0.1;

    setFiles((prev) =>
      prev.map((f) =>
        f.id === file.id
          ? {
              ...f,
              status: isSuccess ? 'success' : 'error',
              error: isSuccess ? undefined : 'Upload gagal. Silakan coba lagi.',
            }
          : f
      )
    );

    if (isSuccess) {
      notifications.show({
        title: 'Upload Berhasil',
        message: `File ${file.name} berhasil diupload`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: FileWithPreview) => {
    if (file.type.startsWith('image/')) {
      return <IconFile size={16} />;
    }
    return <IconFileText size={16} />;
  };

  const getStatusBadge = (file: FileWithPreview) => {
    switch (file.status) {
      case 'uploading':
        return (
          <Badge variant="light" color="blue" size="sm">
            Upload {file.progress}%
          </Badge>
        );
      case 'success':
        return (
          <Badge variant="light" color="green" size="sm">
            <IconCheck size={12} /> Berhasil
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="light" color="red" size="sm">
            <IconAlertTriangle size={12} /> Error
          </Badge>
        );
      default:
        return (
          <Badge variant="light" color="gray" size="sm">
            Menunggu
          </Badge>
        );
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Dropzone */}
      <Paper
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Group justify="center" mb="md">
          <IconUpload
            style={{ width: rem(52), height: rem(52) }}
            stroke={1.5}
            color={isDragActive ? '#3b82f6' : '#9ca3af'}
          />
        </Group>

        <div>
          <Text size="lg" inline c={isDragActive ? 'blue' : 'gray.7'}>
            {isDragActive
              ? 'Lepaskan file di sini...'
              : 'Seret file ke sini atau klik untuk memilih'}
          </Text>

          <Text size="sm" c="dimmed" mt="xs">
            Maksimal {maxFiles} file, {formatFileSize(maxSize)} per file.
            <br />
            Format yang diperbolehkan: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
          </Text>
        </div>
      </Paper>

      {/* File List */}
      {files.length > 0 && (
        <Stack gap="sm" mt="md">
          {files.map((file) => (
            <Paper key={file.id} p="sm" withBorder>
              <Group justify="space-between" align="center">
                <Group gap="sm">
                  {getFileIcon(file)}
                  <div>
                    <Text size="sm" fw={500} lineClamp={1}>
                      {file.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatFileSize(file.size)}
                    </Text>
                  </div>
                </Group>

                <Group gap="sm" align="center">
                  {getStatusBadge(file)}

                  {!disabled && file.status !== 'uploading' && (
                    <Tooltip label="Hapus file">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              </Group>

              {/* Progress Bar */}
              {file.status === 'uploading' && file.progress !== undefined && (
                <Progress
                  value={file.progress}
                  size="sm"
                  mt="xs"
                  color="blue"
                />
              )}

              {/* Error Message */}
              {file.status === 'error' && file.error && (
                <Text size="xs" c="red" mt="xs">
                  {file.error}
                </Text>
              )}

              {/* Image Preview */}
              {showPreview && file.preview && file.type.startsWith('image/') && (
                <div className="mt-2">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="max-w-full h-32 object-cover rounded"
                    onLoad={() => {
                      URL.revokeObjectURL(file.preview!);
                    }}
                  />
                </div>
              )}
            </Paper>
          ))}
        </Stack>
      )}

      {/* Info Alert */}
      <Text size="xs" c="dimmed" mt="md">
        <strong>Informasi:</strong> Upload lampiran wajib (RAB, BAST, Kontrak, dll)
        sesuai jenis NPD. Pastikan semua file dalam kondisi terbaca dan tidak rusak.
      </Text>
    </div>
  );
}