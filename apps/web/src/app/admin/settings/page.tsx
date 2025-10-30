'use client';

import React, { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Group,
  Button,
  Select,
  TextInput,
  Textarea,
  Switch,
  Tabs,
  Table,
  Modal,
  ActionIcon,
  Badge
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPdf, IconDownload, IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';

interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  headerContent: string;
  footerContent: string;
  isActive: boolean;
  organizationId?: string;
  createdAt: number;
  updatedAt: number;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'templates' | 'notifications'>('general');
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate | null>(null);
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    npdSubmitted: true,
    npdVerified: true,
    sp2dCreated: true,
    npdRejected: true,
  });

  // Mock data - replace with real Convex calls
  const mockTemplates: PDFTemplate[] = [
    {
      id: '1',
      name: 'Template Default OPD',
      description: 'Template standar untuk Nota Pencairan Dana',
      headerContent: '{{organization.name}}<br/>PEMERINTAH KABUPATEN {{organization.kode}}<br/>Jl. {{organization.alamat}}<br/>Tahun Anggaran {{fiscalYear}}',
      footerContent: 'Mengetahui,<br/>Bendahara Pengeluaran<br/>{{user.name}}<br/>NIP. {{user.nip}}',
      isActive: true,
      organizationId: 'org-1',
      createdAt: Date.now() - 86400000 * 60,
      updatedAt: Date.now() - 86400000 * 7,
    },
    {
      id: '2',
      name: 'Template Custom 1',
      description: 'Template kustom untuk NPD dengan header khusus',
      headerContent: '{{organization.name}} - DIVISI {{organization.divisi}}<br/>Tahun Anggaran {{fiscalYear}}',
      footerContent: 'Dikeluarkan oleh<br/>{{user.name}}<br/>Divisi {{organization.divisi}}',
      isActive: true,
      organizationId: 'org-1',
      createdAt: Date.now() - 86400000 * 45,
      updatedAt: Date.now() - 86400000 * 10,
    },
  ];

  React.useEffect(() => {
    setTemplates(mockTemplates);
  }, []);

  const handleCreateTemplate = async (templateData: Partial<PDFTemplate>) => {
    setIsLoading(true);
    try {
      // API call to Convex would go here
      notifications.show({
        title: 'Berhasil',
        message: `Template "${templateData.name}" berhasil dibuat`,
        color: 'green',
      });
      setIsCreateModalOpen(false);
      setSelectedTemplate(null);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Gagal membuat template',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTemplate = async (templateData: Partial<PDFTemplate>) => {
    setIsLoading(true);
    try {
      // API call to Convex would go here
      notifications.show({
        title: 'Berhasil',
        message: `Template "${templateData.name}" berhasil diperbarui`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Gagal memperbarui template',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      // API call to Convex would go here
      notifications.show({
        title: 'Berhasil',
        message: 'Template berhasil dihapus',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Gagal menghapus template',
        color: 'red',
      });
    }
  };

  const handleToggleTemplate = async (templateId: string) => {
    try {
      // API call to Convex would go here
      notifications.show({
        title: 'Berhasil',
        message: `Status template berhasil diubah`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Gagal mengubah status template',
        color: 'red',
      });
    }
  };

  const handlePreviewTemplate = (template: PDFTemplate) => {
    setSelectedTemplate(template);
  };

  const renderTemplateTab = () => (
    <Stack gap="md">
      <Group justify="space-between" mb="lg">
        <Text fw="bold">Template PDF</Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Template Baru
        </Button>
      </Group>

      <Card shadow="sm" padding="lg" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nama Template</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Dibuat</Table.Th>
              <Table.Th>Diubah</Table.Th>
              <Table.Th>Aksi</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {templates.map((template) => (
              <Table.Tr key={template.id}>
                <Table.Td>
                  <Group>
                    <div>
                      <Text fw="bold">{template.name}</Text>
                      <Text size="sm" c="dimmed">{template.description}</Text>
                    </div>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={template.isActive ? 'green' : 'gray'}
                    variant="light"
                  >
                    {template.isActive ? 'Aktif' : 'Non-Aktif'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {new Date(template.createdAt).toLocaleDateString('id-ID')}
                </Table.Td>
                <Table.Td>
                  {new Date(template.updatedAt).toLocaleDateString('id-ID')}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      variant="transparent"
                      color="blue"
                      size="sm"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      <IconPdf size={14} />
                    </Button>

                    <Button
                      variant="transparent"
                      color="orange"
                      size="sm"
                      onClick={() => handleUpdateTemplate(template)}
                    >
                      <IconEdit size={14} />
                    </Button>

                    <Button
                      variant="transparent"
                      color="red"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={template.isActive}
                    >
                      <IconTrash size={14} />
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );

  const renderNotificationTab = () => (
    <Stack gap="md">
      <Text fw="bold" mb="lg">Pengaturan Notifikasi Email</Text>

      <Card shadow="sm" padding="lg" withBorder>
        <Stack gap="lg">
          {/* NPD Notifications */}
          <Group mb="md">
            <Text fw="bold" mb="sm">Notifikasi NPD</Text>
            <Switch
              label="NPD Diajukan"
              checked={emailSettings.npdSubmitted}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmailSettings(prev => ({ ...prev, npdSubmitted: event.currentTarget.checked }))}
            />
            <Text size="sm" c="dimmed">Kirim email notifikasi saat NPD diajukan untuk verifikasi</Text>
          </Group>

          <Group>
            <Text fw="bold" mb="sm">Notifikasi NPD Diverifikasi</Text>
            <Switch
              label="NPD Diverifikasi"
              checked={emailSettings.npdVerified}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmailSettings(prev => ({ ...prev, npdVerified: event.currentTarget.checked }))}
            />
            <Text size="sm" c="dimmed">Kirim email notifikasi saat NPD berhasil diverifikasi</Text>
          </Group>

          <Group>
            <Text fw="bold" mb="sm">Notifikasi NPD Ditolak</Text>
            <Switch
              label="NPD Ditolak"
              checked={emailSettings.npdRejected}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmailSettings(prev => ({ ...prev, npdRejected: event.currentTarget.checked }))}
            />
            <Text size="sm" c="dimmed">Kirim email notifikasi saat NPD ditolak</Text>
          </Group>
        </Stack>

        {/* SP2D Notifications */}
        <Stack gap="lg">
          <Group mb="md">
            <Text fw="bold" mb="sm">Notifikasi SP2D</Text>
            <Switch
              label="SP2D Dibuat"
              checked={emailSettings.sp2dCreated}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmailSettings(prev => ({ ...prev, sp2dCreated: event.currentTarget.checked }))}
            />
            <Text size="sm" c="dimmed">Kirim email notifikasi saat SP2D dibuat untuk NPD</Text>
          </Group>
        </Stack>

        <Button
          variant="outline"
          onClick={() => {
            notifications.show({
              title: 'Berhasil',
              message: 'Pengaturan notifikasi telah disimpan',
              color: 'green',
            });
          }}
        >
          Simpan Pengaturan
        </Button>
      </Card>
    </Stack>
  );

  return (
    <Container size="xl" px="xs">
      <Title order={2}>Pengaturan Sistem</Title>
      <Text c="dimmed" mb="lg">
        Konfigurasi sistem NPD Tracker termasuk template PDF dan pengaturan notifikasi.
      </Text>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as typeof activeTab)}>
        <Tabs.List>
          <Tabs.Tab value="general">Umum</Tabs.Tab>
          <Tabs.Tab value="templates">Template PDF</Tabs.Tab>
          <Tabs.Tab value="notifications">Notifikasi</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general">
          <Card padding="lg" withBorder mt="md">
            <Text fw="bold" mb="md">Pengaturan Umum</Text>
            <Text c="dimmed">Fitur pengaturan umum sistem akan datang.</Text>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="templates">
          {renderTemplateTab()}
        </Tabs.Panel>

        <Tabs.Panel value="notifications">
          {renderNotificationTab()}
        </Tabs.Panel>
      </Tabs>

      {/* Create/Edit Template Modal */}
      {isCreateModalOpen && (
        <Modal
          opened={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={selectedTemplate ? 'Edit Template' : 'Template Baru'}
          size="md"
        >
          <Stack gap="md">
            <TextInput
              label="Nama Template"
              placeholder="Masukkan nama template"
              defaultValue={selectedTemplate?.name || ''}
              required
            />
            <Textarea
              label="Deskripsi"
              placeholder="Deskripsi template"
              defaultValue={selectedTemplate?.description || ''}
              rows={3}
            />
            <Textarea
              label="Header Content"
              placeholder="Header template (boleh menggunakan variabel: {{organization.name}}, {{organization.kode}}, dll.)"
              defaultValue={selectedTemplate?.headerContent || ''}
              rows={4}
            />
            <Textarea
              label="Footer Content"
              placeholder="Footer template (tanda tangan, dll.)"
              defaultValue={selectedTemplate?.footerContent || ''}
              rows={3}
            />

            <Group justify="flex-end" mt="xl">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                onClick={() => handleCreateTemplate(selectedTemplate || {
                  name: '',
                  description: '',
                  headerContent: '',
                  footerContent: '',
                })}
                loading={isLoading}
              >
                {selectedTemplate ? 'Perbarui' : 'Buat'}
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}

      {/* Template Preview Modal */}
      {selectedTemplate && !isCreateModalOpen && (
        <Modal
          opened={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          title="Preview Template"
          size="lg"
        >
          <Stack gap="md">
            <Card padding="lg" withBorder>
              <Text fw="bold" mb="md">{selectedTemplate.name}</Text>
              <Text c="dimmed" mb="lg">{selectedTemplate.description}</Text>
            </Card>

            <Card padding="lg" withBorder>
              <Text fw="bold" mb="sm">Preview Header</Text>
              <div
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                }}
              >
                <Text>{selectedTemplate.headerContent}</Text>
              </div>

              <Text fw="bold" mb="sm" mt="md">Preview Footer</Text>
              <div
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                }}
              >
                <Text>{selectedTemplate.footerContent}</Text>
              </div>
            </Card>

            <Group justify="flex-end" mt="xl">
              <Button
                variant="outline"
                leftSection={<IconDownload size={16} />}
                onClick={() => {
                  notifications.show({
                    title: 'Info',
                    message: 'Fungsi download template akan datang',
                    color: 'blue',
                  });
                }}
              >
                Download Contoh
              </Button>

              <Button
                onClick={() => setSelectedTemplate(null)}
              >
                Tutup
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </Container>
  );
}