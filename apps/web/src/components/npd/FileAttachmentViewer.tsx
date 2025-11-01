"use client";

import React, { useState } from "react";
import {
  Card,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Modal,
  Button,
  LoadingOverlay,
  ScrollArea,
  List,
  ThemeIcon,
  Progress,
  Alert,
  Title,
  Container,
  Grid,
  Box,
} from "@mantine/core";
import {
  IconDownload,
  IconEye,
  IconTrash,
  IconFile,
  IconFileText,
  IconFileSpreadsheet,
  IconFileDescription,
  IconFileCheck,
  IconPhoto,
  IconAlertTriangle,
  IconX,
} from "@tabler/icons-react";
import { useQuery as useConvexQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { notifications } from "@mantine/notifications";

interface FileAttachmentViewerProps {
  npdId: string;
  npdStatus?: string;
  readonly?: boolean;
  onFileDeleted?: () => void;
}

interface FileItem {
  _id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  status: string;
  uploadedBy: any;
  uploadedAt?: number;
}

export function FileAttachmentViewer({
  npdId,
  npdStatus,
  readonly = false,
  onFileDeleted,
}: FileAttachmentViewerProps) {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  const { data: files, isLoading } = useConvexQuery(
    api.files.getByNpd,
    npdId ? { npdId: npdId as any } : "skip"
  );

  const { data: downloadData, refetch: getDownloadUrl } = useConvexQuery(
    api.files.getDownloadUrl,
    selectedFile ? { fileId: selectedFile._id as any } : "skip"
  );

  const { mutate: deleteFile } = useMutation(api.files.remove);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <IconPhoto size={16} />;
    } else if (fileType.includes("pdf")) {
      return <IconFileText size={16} />;
    } else if (fileType.includes("spreadsheet") || fileType.includes("excel")) {
      return <IconFileSpreadsheet size={16} />;
    } else if (fileType.includes("word") || fileType.includes("document")) {
      return <IconFileDescription size={16} />;
    } else {
      return <IconFile size={16} />;
    }
  };

  const getFileTypeColor = (fileType: string): string => {
    if (fileType.startsWith("image/")) return "green";
    if (fileType.includes("pdf")) return "red";
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "green";
    if (fileType.includes("word") || fileType.includes("document")) return "blue";
    return "gray";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePreview = (file: FileItem) => {
    setSelectedFile(file);
    setPreviewModalOpen(true);
    // Get download URL for preview
    getDownloadUrl();
  };

  const handleDownload = async (file: FileItem) => {
    try {
      setDownloadingFileId(file._id);
      const result = await getDownloadUrl({ fileId: file._id as any });

      if (result?.downloadUrl) {
        const link = document.createElement("a");
        link.href = result.downloadUrl;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        notifications.show({
          title: "Download Berhasil",
          message: `File ${file.filename} berhasil diunduh`,
          color: "green",
        });
      }
    } catch (error) {
      console.error("Download error:", error);
      notifications.show({
        title: "Download Gagal",
        message: error instanceof Error ? error.message : "Terjadi kesalahan",
        color: "red",
      });
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus file ${file.filename}?`)) {
      return;
    }

    try {
      await deleteFile({ fileId: file._id as any });

      notifications.show({
        title: "File Dihapus",
        message: `File ${file.filename} berhasil dihapus`,
        color: "green",
      });

      onFileDeleted?.();
    } catch (error) {
      console.error("Delete error:", error);
      notifications.show({
        title: "Hapus Gagal",
        message: error instanceof Error ? error.message : "Terjadi kesalahan",
        color: "red",
      });
    }
  };

  const renderFilePreview = () => {
    if (!selectedFile || !downloadData?.downloadUrl) {
      return (
        <Container size="sm" py="xl">
          <LoadingOverlay visible={true} />
        </Container>
      );
    }

    const fileType = selectedFile.fileType;

    if (fileType.startsWith("image/")) {
      return (
        <img
          src={downloadData.downloadUrl}
          alt={selectedFile.filename}
          style={{
            maxWidth: "100%",
            maxHeight: "70vh",
            objectFit: "contain",
          }}
        />
      );
    }

    if (fileType.includes("pdf")) {
      return (
        <iframe
          src={downloadData.downloadUrl}
          style={{
            width: "100%",
            height: "70vh",
            border: "none",
          }}
          title={selectedFile.filename}
        />
      );
    }

    // For other file types, show download button
    return (
      <Container size="sm" py="xl">
        <Stack align="center" gap="md">
          <ThemeIcon size={64} color="blue" variant="light">
            {getFileIcon(fileType)}
          </ThemeIcon>
          <Title order={3}>{selectedFile.filename}</Title>
          <Text color="dimmed">
            Tipe file: {selectedFile.fileType}<br />
            Ukuran: {formatFileSize(selectedFile.fileSize)}
          </Text>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={() => handleDownload(selectedFile)}
            loading={downloadingFileId === selectedFile._id}
          >
            Download File
          </Button>
        </Stack>
      </Container>
    );
  };

  const isFinalized = npdStatus === "final";

  if (!npdId) {
    return (
      <Alert icon={<IconAlertTriangle size={16} />} color="yellow">
        NPD ID tidak valid
      </Alert>
    );
  }

  return (
    <>
      <Card withBorder padding="md">
        <Card.Section withBorder inheritPadding py="sm">
          <Group justify="space-between">
            <Group>
              <ThemeIcon color="blue" variant="light">
                <IconFile size={16} />
              </ThemeIcon>
              <Text fw={600}>📎 Lampiran File</Text>
            </Group>
            <Badge size="sm">
              {files?.length || 0} File
            </Badge>
          </Group>
        </Card.Section>

        <Box pos="relative">
          <LoadingOverlay visible={isLoading} />

          {files && files.length > 0 ? (
            <Stack gap="sm" py="md">
              {files.map((file) => (
                <Card key={file._id} withBorder padding="sm" radius="md">
                  <Group justify="space-between">
                    <Group gap="md" style={{ flex: 1 }}>
                      <ThemeIcon
                        color={getFileTypeColor(file.fileType)}
                        variant="light"
                      >
                        {getFileIcon(file.fileType)}
                      </ThemeIcon>

                      <Stack gap={0} style={{ flex: 1 }}>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {file.filename}
                        </Text>
                        <Group gap="xs">
                          <Text size="xs" color="dimmed">
                            {formatFileSize(file.fileSize)}
                          </Text>
                          <Text size="xs" color="dimmed">•</Text>
                          <Badge
                            size="xs"
                            variant="light"
                            color={getFileTypeColor(file.fileType)}
                          >
                            {file.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                          </Badge>
                        </Group>
                        {file.uploadedAt && (
                          <Text size="xs" color="dimmed">
                            Diunggah: {formatDate(file.uploadedAt)}
                          </Text>
                        )}
                      </Stack>
                    </Group>

                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        size="sm"
                        onClick={() => handlePreview(file)}
                        title="Preview"
                      >
                        <IconEye size={16} />
                      </ActionIcon>

                      <ActionIcon
                        variant="subtle"
                        color="green"
                        size="sm"
                        onClick={() => handleDownload(file)}
                        loading={downloadingFileId === file._id}
                        title="Download"
                        disabled={!downloadData?.downloadUrl}
                      >
                        <IconDownload size={16} />
                      </ActionIcon>

                      {!readonly && !isFinalized && (
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={() => handleDelete(file)}
                          title="Hapus"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Stack align="center" py="xl" gap="md">
              <ThemeIcon size={64} color="gray" variant="light">
                <IconFile size={32} />
              </ThemeIcon>
              <Text color="dimmed" ta="center">
                Belum ada file lampiran
              </Text>
              {!readonly && !isFinalized && (
                <Text size="sm" color="dimmed" ta="center">
                  Gunakan fitur upload file untuk menambahkan lampiran
                </Text>
              )}
            </Stack>
          )}

          {isFinalized && files.length === 0 && (
            <Alert icon={<IconFileCheck size={16} />} color="green">
              NPD sudah difinalisasi tanpa lampiran file
            </Alert>
          )}
        </Box>
      </Card>

      {/* File Preview Modal */}
      <Modal
        opened={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setSelectedFile(null);
        }}
        title={
          <Group>
            <ThemeIcon color="blue" variant="light">
              <IconEye size={16} />
            </ThemeIcon>
            <span>📄 Preview File</span>
          </Group>
        }
        size="xl"
        padding={0}
      >
        <Group justify="right" p="md" pos="absolute" top={0} right={0} zIndex={10}>
          <ActionIcon
            variant="subtle"
            onClick={() => {
              setPreviewModalOpen(false);
              setSelectedFile(null);
            }}
          >
            <IconX size={16} />
          </ActionIcon>
        </Group>

        <ScrollArea h="70vh">{renderFilePreview()}</ScrollArea>
      </Modal>
    </>
  );
}