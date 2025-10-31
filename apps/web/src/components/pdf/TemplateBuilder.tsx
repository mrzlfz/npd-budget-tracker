'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  Title,
  Text,
  Divider,
  Select,
  ColorInput,
  SimpleGrid,
  NumberInput,
  FileInput,
  Badge,
  Alert,
  Modal,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconPlus, IconTrash, IconEye, IconUpload, IconDownload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from 'convex/values';

interface Signature {
  id: string;
  name: string;
  title: string;
  position?: string;
}

interface TemplateConfig {
  logoUrl?: string;
  kopSurat?: string;
  footerText?: string;
  signatures?: Signature[];
  customStyles?: {
    headerColor?: string;
    headerFont?: string;
    bodyFont?: string;
    watermark?: string;
  };
}

interface TemplateBuilderProps {
  organizationId: Id<'organizations'>;
  onSave?: (config: TemplateConfig) => void;
  onPreview?: (config: TemplateConfig) => void;
}

const FONT_OPTIONS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Georgia', label: 'Georgia' },
];

export function TemplateBuilder({ organizationId, onSave, onPreview }: TemplateBuilderProps) {
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>({});
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get current template config
  const { data: currentConfig } = useQuery(api.pdfTemplates.getTemplateConfig, {
    organizationId,
  });

  // Update template config mutation
  const updateConfig = useMutation(api.pdfTemplates.updateTemplateConfig);
  const uploadLogo = useMutation(api.pdfTemplates.uploadLogo);

  // Initialize form with current config
  useState(() => {
    if (currentConfig) {
      setTemplateConfig({
        logoUrl: currentConfig.logoUrl,
        kopSurat: currentConfig.kopSurat,
        footerText: currentConfig.footerText,
        signatures: currentConfig.signatures || [],
        customStyles: currentConfig.customStyles || {},
      });
    }
  });

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateConfig({
        organizationId,
        templateConfig,
      });

      notifications.show({
        title: 'Berhasil',
        message: 'Template berhasil disimpan',
        color: 'green',
      });

      onSave?.(templateConfig);
    } catch (error) {
      console.error('Save template error:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Gagal menyimpan template',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setIsLoading(true);

      // Convert file to base64 for now (in production, use proper file upload)
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;

        // Mock upload - in production, use actual file upload
        const mockUrl = `/api/preview/logo/${file.name}`;

        await uploadLogo({
          organizationId,
          fileUrl: mockUrl,
          fileName: file.name,
          fileSize: file.size,
        });

        setTemplateConfig(prev => ({
          ...prev,
          logoUrl: mockUrl,
        }));

        notifications.show({
          title: 'Berhasil',
          message: 'Logo berhasil diupload',
          color: 'green',
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Logo upload error:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal mengupload logo',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addSignature = () => {
    const newSignature: Signature = {
      id: Date.now().toString(),
      name: '',
      title: '',
      position: '',
    };

    setTemplateConfig(prev => ({
      ...prev,
      signatures: [...(prev.signatures || []), newSignature],
    }));
  };

  const updateSignature = (id: string, updates: Partial<Signature>) => {
    setTemplateConfig(prev => ({
      ...prev,
      signatures: prev.signatures?.map(sig =>
        sig.id === id ? { ...sig, ...updates } : sig
      ) || [],
    }));
  };

  const removeSignature = (id: string) => {
    setTemplateConfig(prev => ({
      ...prev,
      signatures: prev.signatures?.filter(sig => sig.id !== id) || [],
    }));
  };

  const removeLogo = async () => {
    try {
      setIsLoading(true);

      // await removeLogo({ organizationId }); // Implement this in backend

      setTemplateConfig(prev => ({
        ...prev,
        logoUrl: undefined,
      }));

      notifications.show({
        title: 'Berhasil',
        message: 'Logo berhasil dihapus',
        color: 'green',
      });
    } catch (error) {
      console.error('Logo removal error:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal menghapus logo',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    onPreview?.(templateConfig);
    setIsPreviewModalOpen(true);
  };

  return (
    <Card p="md" withBorder>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={3}>Template Builder</Title>
          <Group>
            <Button
              variant="outline"
              leftSection={<IconEye size={16} />}
              onClick={handlePreview}
            >
              Preview
            </Button>
            <Button
              loading={isLoading}
              leftSection={<IconDownload size={16} />}
              onClick={handleSave}
            >
              Simpan Template
            </Button>
          </Group>
        </Group>

        {/* Logo Upload */}
        <Card p="sm" withBorder>
          <Text fw={600} mb="sm">Logo Organisasi</Text>
          {templateConfig.logoUrl ? (
            <Group align="center" gap="md">
              <img
                src={templateConfig.logoUrl}
                alt="Logo"
                style={{
                  maxWidth: '120px',
                  maxHeight: '80px',
                  objectFit: 'contain',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                }}
              />
              <Button
                variant="outline"
                color="red"
                size="sm"
                onClick={removeLogo}
                leftSection={<IconTrash size={14} />}
              >
                Hapus
              </Button>
            </Group>
          ) : (
            <FileInput
              accept="image/*"
              placeholder="Upload logo organisasi"
              leftSection={<IconUpload size={16} />}
              onChange={handleLogoUpload}
              disabled={isLoading}
            />
          )}
        </Card>

        {/* Kop Surat */}
        <TextInput
          label="Kop Surat"
          placeholder="Masukkan kop surat organisasi"
          value={templateConfig.kopSurat || ''}
          onChange={(e) => setTemplateConfig(prev => ({
            ...prev,
            kopSurat: e.target.value,
          }))}
        />

        {/* Footer Text */}
        <Textarea
          label="Footer Text"
          placeholder="Masukkan teks footer"
          value={templateConfig.footerText || ''}
          onChange={(e) => setTemplateConfig(prev => ({
            ...prev,
            footerText: e.target.value,
          }))}
          minRows={2}
        />

        <Divider label="Custom Styles" />

        {/* Custom Styles */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <ColorInput
            label="Header Color"
            format="hex"
            value={templateConfig.customStyles?.headerColor || '#000000'}
            onChange={(value) => setTemplateConfig(prev => ({
              ...prev,
              customStyles: {
                ...prev.customStyles,
                headerColor: value,
              },
            }))}
          />

          <Select
            label="Header Font"
            data={FONT_OPTIONS}
            value={templateConfig.customStyles?.headerFont || 'Arial'}
            onChange={(value) => setTemplateConfig(prev => ({
              ...prev,
              customStyles: {
                ...prev.customStyles,
                headerFont: value || undefined,
              },
            }))}
          />

          <Select
            label="Body Font"
            data={FONT_OPTIONS}
            value={templateConfig.customStyles?.bodyFont || 'Arial'}
            onChange={(value) => setTemplateConfig(prev => ({
              ...prev,
              customStyles: {
                ...prev.customStyles,
                bodyFont: value || undefined,
              },
            }))}
          />

          <TextInput
            label="Watermark"
            placeholder="Masukkan watermark text"
            value={templateConfig.customStyles?.watermark || ''}
            onChange={(e) => setTemplateConfig(prev => ({
              ...prev,
              customStyles: {
                ...prev.customStyles,
                watermark: e.target.value,
              },
            }))}
          />
        </SimpleGrid>

        <Divider label="Tanda Tangan" />

        {/* Signatures */}
        <Card p="sm" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={600}>Tanda Tangan</Text>
            <Button
              size="sm"
              leftSection={<IconPlus size={14} />}
              onClick={addSignature}
            >
              Tambah Tanda Tangan
            </Button>
          </Group>

          <Stack gap="md">
            {templateConfig.signatures?.map((signature, index) => (
              <Card key={signature.id} p="sm" withBorder>
                <Group justify="space-between" mb="xs">
                  <Badge variant="light">Tanda Tangan {index + 1}</Badge>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => removeSignature(signature.id)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                  <TextInput
                    label="Nama"
                    placeholder="Nama lengkap"
                    value={signature.name}
                    onChange={(e) => updateSignature(signature.id, {
                      name: e.target.value,
                    })}
                  />
                  <TextInput
                    label="Jabatan"
                    placeholder="Jabatan"
                    value={signature.title}
                    onChange={(e) => updateSignature(signature.id, {
                      title: e.target.value,
                    })}
                  />
                  <TextInput
                    label="Posisi"
                    placeholder="Posisi/Jabatan Lengkap"
                    value={signature.position || ''}
                    onChange={(e) => updateSignature(signature.id, {
                      position: e.target.value,
                    })}
                  />
                </SimpleGrid>
              </Card>
            )) || (
              <Text color="dimmed" size="sm" ta="center">
                Belum ada tanda tangan. Klik "Tambah Tanda Tangan" untuk menambahkan.
              </Text>
            )}
          </Stack>
        </Card>

        {/* Instructions */}
        <Alert icon={<IconEye size={16} />} color="blue">
          <Text size="sm">
            <strong>Tips:</strong> Gunakan tombol "Preview" untuk melihat hasil template sebelum menyimpan.
            Template yang disimpan akan digunakan untuk generate PDF NPD otomatis.
          </Text>
        </Alert>
      </Stack>

      {/* Preview Modal */}
      <Modal
        opened={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        size="90%"
        title="Template Preview"
      >
        <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
          {/* Preview component will be implemented here */}
          <Text color="dimmed" ta="center">
            Preview will be implemented with actual PDF rendering
          </Text>
        </div>
      </Modal>
    </Card>
  );
}