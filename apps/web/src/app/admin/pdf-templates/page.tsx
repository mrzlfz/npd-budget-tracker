'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Group,
  Card,
  Stack,
  Text,
  TextInput,
  Textarea,
  Button,
  FileInput,
  Image,
  Divider,
  Grid,
  Col,
  Select,
  NumberInput,
  Switch,
  Badge,
  Alert,
  LoadingOverlay,
} from '@mantine/core'
import { IconUpload, IconTrash, IconEye, IconDownload, IconSave } from '@tabler/icons-react'
import { useForm } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useFileUpload } from '@/hooks/useFileUpload'

interface PDFTemplateConfig {
  kopSurat?: string
  footerText?: string
  headerColor?: string
  headerFont?: string
  bodyFont?: string
  watermark?: string
  signatures?: Array<{
    name: string
    title: string
    position?: string
  }>
}

export default function PDFTemplatePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const { uploadFile } = useFileUpload()
  const updateTemplate = useMutation(api.organizations.updatePdfTemplate)

  const { data: organization } = useQuery(api.organizations.getCurrent, {})

  const form = useForm<PDFTemplateConfig>({
    initialValues: {
      kopSurat: organization?.pdfTemplateConfig?.kopSurat || '',
      footerText: organization?.pdfTemplateConfig?.footerText || '',
      headerColor: organization?.pdfTemplateConfig?.customStyles?.headerColor || '#000000',
      headerFont: organization?.pdfTemplateConfig?.customStyles?.headerFont || 'Arial',
      bodyFont: organization?.pdfTemplateConfig?.customStyles?.bodyFont || 'Arial',
      watermark: organization?.pdfTemplateConfig?.customStyles?.watermark || '',
      signatures: organization?.pdfTemplateConfig?.signatures || []
    }
  })

  const handleLogoUpload = async (file: File) => {
    if (!file) return

    setIsLoading(true)
    try {
      const result = await uploadFile(file, 'organization-logos')
      if (result.success) {
        form.setFieldValue('logoUrl', result.fileUrl)
        notifications.show({
          title: 'Logo berhasil diupload',
          message: 'Logo organisasi telah diperbarui',
          color: 'green'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Upload gagal',
        message: 'Gagal mengupload logo',
        color: 'red'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (values: PDFTemplateConfig) => {
    setIsLoading(true)
    try {
      await updateTemplate.mutateAsync({
        organizationId: organization!._id,
        templateConfig: {
          logoUrl: organization?.pdfTemplateConfig?.logoUrl,
          kopSurat: values.kopSurat || undefined,
          footerText: values.footerText || undefined,
          signatures: values.signatures || undefined,
          customStyles: {
            headerColor: values.headerColor || undefined,
            headerFont: values.headerFont || undefined,
            bodyFont: values.bodyFont || undefined,
            watermark: values.watermark || undefined
          }
        }
      })

      notifications.show({
        title: 'Template berhasil diperbarui',
        message: 'Konfigurasi PDF template telah disimpan',
        color: 'green'
      })
    } catch (error) {
      notifications.show({
        title: 'Gagal menyimpan',
        message: 'Terjadi kesalahan saat menyimpan template',
        color: 'red'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addSignature = () => {
    const currentSignatures = form.values.signatures || []
    form.setFieldValue('signatures', [
      ...currentSignatures,
      { name: '', title: '', position: '' }
    ])
  }

  const removeSignature = (index: number) => {
    const currentSignatures = form.values.signatures || []
    form.setFieldValue('signatures', currentSignatures.filter((_, i) => i !== index))
  }

  const updateSignature = (index: number, field: string, value: string) => {
    const currentSignatures = form.values.signatures || []
    const updatedSignatures = [...currentSignatures]
    updatedSignatures[index] = { ...updatedSignatures[index], [field]: value }
    form.setFieldValue('signatures', updatedSignatures)
  }

  if (!organization) {
    return <LoadingOverlay visible={true} />
  }

  return (
    <Container size="lg" py="md">
      <LoadingOverlay visible={isLoading} />

      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Title order={2}>Template PDF NPD</Title>
          <Group>
            <Button
              variant="outline"
              leftSection={<IconEye size={16} />}
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </Button>
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={() => window.print()}
            >
              Download Sample
            </Button>
          </Group>
        </Group>

        <Grid>
          <Col span={previewMode ? 12 : 6}>
            {/* Form Section */}
            {!previewMode && (
              <Card withBorder p="lg">
                <Stack gap="md">
                  <Title order={4}>Konfigurasi Template</Title>

                  {/* Logo Upload */}
                  <Stack gap="sm">
                    <Text weight={500}>Logo Organisasi</Text>
                    {organization?.pdfTemplateConfig?.logoUrl ? (
                      <Group>
                        <Image
                          src={organization.pdfTemplateConfig.logoUrl}
                          alt="Logo"
                          width={80}
                          height={80}
                          fit="contain"
                          style={{ border: '1px solid #e0e0e0' }}
                        />
                        <Button
                          color="red"
                          variant="outline"
                          size="sm"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => form.setFieldValue('logoUrl', undefined)}
                        >
                          Hapus
                        </Button>
                      </Group>
                    ) : (
                      <FileInput
                        accept="image/*"
                        placeholder="Upload logo organisasi"
                        onChange={handleLogoUpload}
                        leftSection={<IconUpload size={16} />}
                      />
                    )}
                  </Stack>

                  <Divider />

                  {/* Kop Surat */}
                  <Textarea
                    label="Kop Surat"
                    placeholder="Masukkan kop surat organisasi..."
                    description="Format kop surat yang akan muncul di header PDF"
                    minRows={3}
                    maxRows={6}
                    {...form.getInputProps('kopSurat')}
                  />

                  {/* Footer Text */}
                  <TextInput
                    label="Footer Text"
                    placeholder="Masukkan teks footer..."
                    description="Teks yang akan muncul di bagian bawah PDF"
                    {...form.getInputProps('footerText')}
                  />

                  <Divider />

                  {/* Typography Settings */}
                  <Title order={5}>Tipografi</Title>

                  <Grid>
                    <Col span={6}>
                      <TextInput
                        label="Warna Header"
                        placeholder="#000000"
                        {...form.getInputProps('headerColor')}
                      />
                    </Col>
                    <Col span={6}>
                      <Select
                        label="Font Header"
                        placeholder="Pilih font"
                        data={[
                          { value: 'Arial', label: 'Arial' },
                          { value: 'Times New Roman', label: 'Times New Roman' },
                          { value: 'Georgia', label: 'Georgia' },
                          { value: 'Verdana', label: 'Verdana' },
                        ]}
                        {...form.getInputProps('headerFont')}
                      />
                    </Col>
                    <Col span={6}>
                      <Select
                        label="Font Body"
                        placeholder="Pilih font"
                        data={[
                          { value: 'Arial', label: 'Arial' },
                          { value: 'Times New Roman', label: 'Times New Roman' },
                          { value: 'Georgia', label: 'Georgia' },
                          { value: 'Verdana', label: 'Verdana' },
                        ]}
                        {...form.getInputProps('bodyFont')}
                      />
                    </Col>
                    <Col span={6}>
                      <TextInput
                        label="Watermark"
                        placeholder="Masukkan watermark text..."
                        {...form.getInputProps('watermark')}
                      />
                    </Col>
                  </Grid>

                  <Divider />

                  {/* Signatures */}
                  <Group justify="space-between" mb="md">
                    <Title order={5}>Tanda Tangan</Title>
                    <Button
                      variant="outline"
                      size="sm"
                      leftSection={<IconUpload size={14} />}
                      onClick={addSignature}
                    >
                      Tambah Tanda Tangan
                    </Button>
                  </Group>

                  <Stack gap="sm">
                    {(form.values.signatures || []).map((signature, index) => (
                      <Card key={index} withBorder p="sm" mb="xs">
                        <Grid>
                          <Col span={6}>
                            <TextInput
                              label="Nama"
                              placeholder="Nama lengkap"
                              value={signature.name}
                              onChange={(e) => updateSignature(index, 'name', e.target.value)}
                            />
                          </Col>
                          <Col span={6}>
                            <TextInput
                              label="Jabatan"
                              placeholder="Jabatan/Title"
                              value={signature.title}
                              onChange={(e) => updateSignature(index, 'title', e.target.value)}
                            />
                          </Col>
                          <Col span={12}>
                            <TextInput
                              label="Posisi"
                              placeholder="Posisi (opsional)"
                              value={signature.position || ''}
                              onChange={(e) => updateSignature(index, 'position', e.target.value)}
                            />
                          </Col>
                        </Grid>
                        <Group justify="flex-end" mt="sm">
                          <Button
                            color="red"
                            variant="outline"
                            size="sm"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => removeSignature(index)}
                          >
                            Hapus
                          </Button>
                        </Group>
                      </Card>
                    ))}
                  </Stack>

                  <Divider />

                  {/* Save Button */}
                  <Group justify="flex-end">
                    <Button
                      size="lg"
                      leftSection={<IconSave size={16} />}
                      onClick={form.onSubmit(handleSubmit)}
                      loading={updateTemplate.isLoading}
                    >
                      Simpan Template
                    </Button>
                  </Group>
                </Stack>
              </Card>
            )}

            {/* Preview Section */}
            {previewMode && (
              <Card withBorder p="lg">
                <Stack gap="md">
                  <Title order={4}>Preview Template</Title>

                  <Alert color="blue" title="Preview Mode">
                    Ini adalah preview dari template PDF yang akan digunakan.
                    Kembali ke edit mode untuk melakukan perubahan.
                  </Alert>

                  <div
                    style={{
                      border: '1px solid #e0e0e0',
                      padding: '20px',
                      backgroundColor: '#fff',
                      minHeight: '600px'
                    }}
                  >
                    {/* Mock PDF Preview */}
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                      {form.values.logoUrl && (
                        <img
                          src={form.values.logoUrl}
                          alt="Logo"
                          style={{ maxWidth: '80px', maxHeight: '80px' }}
                        />
                      )}
                      {form.values.kopSurat && (
                        <div style={{
                          whiteSpace: 'pre-line',
                          fontFamily: form.values.headerFont,
                          color: form.values.headerColor,
                          fontWeight: 'bold',
                          marginTop: '10px'
                        }}>
                          {form.values.kopSurat}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                      <h3>Nota Pencairan Dana</h3>
                    </div>

                    {form.values.watermark && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                        fontSize: '72px',
                        color: 'rgba(0, 0, 0, 0.1)',
                        fontWeight: 'bold',
                        zIndex: -1
                      }}>
                        {form.values.watermark}
                      </div>
                    )}

                    <div style={{ fontFamily: form.values.bodyFont }}>
                      <p><strong>Contoh dokumen NPD akan muncul di sini dengan format sesuai template.</strong></p>
                    </div>

                    {form.values.signatures && form.values.signatures.length > 0 && (
                      <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between' }}>
                        {form.values.signatures.map((signature, index) => (
                          <div key={index} style={{ textAlign: 'center' }}>
                            <div style={{ marginBottom: '60px' }}>{signature.name}</div>
                            <div style={{ fontSize: '12px' }}>{signature.title}</div>
                            {signature.position && <div style={{ fontSize: '10px' }}>{signature.position}</div>}
                            <div style={{ borderTop: '1px solid #000', marginTop: '10px', width: '150px' }}></div>
                          </div>
                        ))}
                      </div>
                    )}

                    {form.values.footerText && (
                      <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        fontSize: '10px',
                        color: '#666'
                      }}>
                        {form.values.footerText}
                      </div>
                    )}
                  </div>
                </Stack>
              </Card>
            )}
          </Col>
        </Grid>
      </Stack>
    </Container>
  )
}