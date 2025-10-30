'use client';

import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from 'convex/values';
import { notifications } from '@mantine/notifications';
import {
  IconUpload,
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

interface UseFileUploadOptions {
  npdId?: Id<"npdDocuments">;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: Record<string, string[]>;
  onSuccess?: (files: FileWithPreview[]) => void;
  onError?: (error: string) => void;
}

export function useFileUpload({
  npdId,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
  },
  onSuccess,
  onError,
}: UseFileUploadOptions = {}) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useMutation(api.files.uploadUrl);
  const confirmUpload = useMutation(api.files.confirmUpload);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File ${file.name} terlalu besar. Maksimal ${formatFileSize(maxSize)}`;
    }

    // Check file type
    const isValidType = Object.entries(acceptedTypes).some(([mimeType]) =>
      file.type === mimeType || acceptedTypes[mimeType].some(ext =>
        file.name.toLowerCase().endsWith(ext)
      )
    );

    if (!isValidType) {
      return `File ${file.name} tidak valid. Hanya file PDF, DOC, DOCX, XLS, XLSX, JPG, PNG yang diperbolehkan`;
    }

    return null;
  }, [acceptedTypes, maxSize]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const processFile = useCallback(async (file: FileWithPreview): Promise<void> => {
    if (!npdId) {
      throw new Error('NPD ID is required for file upload');
    }

    try {
      // Update status to uploading
      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      // Get upload URL from Convex
      const uploadResult = await uploadFile({
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        npdId: npdId!,
      });

      // Simulate file upload (in production, this would be actual upload)
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, progress } : f
        ));
      }

      // Upload file to the URL (simulation)
      const response = await fetch(uploadResult.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // Confirm upload with Convex
      await confirmUpload({ fileId: uploadResult.fileId });

      // Update status to success
      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'success', progress: 100 } : f
      ));

      notifications.show({
        title: 'Upload Berhasil',
        message: `File ${file.name} berhasil diupload`,
        color: 'green',
      });

    } catch (error) {
      console.error('Upload error:', error);

      // Update status to error
      setFiles(prev => prev.map(f =>
        f.id === file.id ? {
          ...f,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload gagal'
        } : f
      ));

      const errorMessage = error instanceof Error ? error.message : 'Upload gagal';

      notifications.show({
        title: 'Upload Error',
        message: errorMessage,
        color: 'red',
      });

      onError?.(errorMessage);
    }
  }, [npdId, uploadFile, confirmUpload, onError]);

  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: FileWithPreview[] = [];

    for (const file of newFiles) {
      // Skip if too many files
      if (files.length + validFiles.length >= maxFiles) {
        notifications.show({
          title: 'Error',
          message: `Maksimal ${maxFiles} file`,
          color: 'red',
        });
        break;
      }

      const validationError = validateFile(file);
      if (validationError) {
        notifications.show({
          title: 'Error',
          message: validationError,
          color: 'red',
        });
        continue;
      }

      const fileWithPreview: FileWithPreview = {
        ...file,
        id: Math.random().toString(36).substr(2, 9),
        status: 'pending',
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      };

      validFiles.push(fileWithPreview);
    }

    const updatedFiles = [...files, ...validFiles].slice(0, maxFiles);
    setFiles(updatedFiles);

    // Process files for upload
    validFiles.forEach(file => {
      if (file.status === 'pending') {
        processFile(file);
      }
    });

    if (validFiles.length > 0) {
      onSuccess?.(updatedFiles);
    }
  }, [files, maxFiles, validateFile, processFile, onSuccess]);

  const removeFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file && file.status === 'uploading') {
      // Don't allow removing uploading files
      return;
    }

    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, [files]);

  const clearFiles = useCallback(() => {
    const uploadingFiles = files.filter(f => f.status === 'uploading');
    if (uploadingFiles.length > 0) {
      // Don't clear if files are still uploading
      return;
    }
    setFiles([]);
  }, [files]);

  const retryUpload = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      const retryFile = { ...file, status: 'pending', error: undefined, progress: 0 };
      setFiles(prev => prev.map(f => f.id === fileId ? retryFile : f));
      processFile(retryFile);
    }
  }, [files, processFile]);

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    clearFiles,
    retryUpload,
    formatFileSize,
  };
}