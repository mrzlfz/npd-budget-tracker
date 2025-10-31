'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Stack,
  Group,
  Title,
  Text,
  Checkbox,
  Textarea,
  Button,
  Badge,
  Alert,
  Divider,
  SimpleGrid,
  ScrollArea,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconSave,
  IconEye,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from 'convex/values';

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  checked?: boolean;
  notes?: string;
}

interface VerificationTemplate {
  title: string;
  items: ChecklistItem[];
}

interface VerificationChecklistProps {
  npdId: Id<'npdDocuments'>;
  onVerificationComplete?: (checklistId: Id<'verificationChecklists'>) => void;
  onClose?: () => void;
}

export function VerificationChecklist({
  npdId,
  onVerificationComplete,
  onClose,
}: VerificationChecklistProps) {
  const [checklistData, setChecklistData] = useState<VerificationTemplate | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'in_progress' | 'completed' | 'rejected'>('draft');
  const [overallNotes, setOverallNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get NPD details
  const { data: npd, isLoading: npdLoading } = useQuery(api.npd.getById, { npdId });

  // Get existing checklist
  const { data: existingChecklist, isLoading: checklistLoading } = useQuery(
    api.verifications.getChecklistByNPD,
    { npdId }
  );

  // Get verification template based on NPD type
  const { data: template } = useQuery(api.verifications.getVerificationTemplate, {
    npdType: npd?.jenis || 'UP',
  });

  // Save checklist mutation
  const saveChecklist = useMutation(api.verifications.saveChecklist);
  const validateChecklist = useQuery(api.verifications.validateChecklist);

  // Initialize checklist data when template is loaded
  useEffect(() => {
    if (template && existingChecklist) {
      const results: ChecklistItem[] = template.items.map(item => ({
        ...item,
        checked: existingChecklist.results.find(r => r.itemId === item.id)?.checked || false,
        notes: existingChecklist.results.find(r => r.itemId === item.id)?.notes || '',
      }));

      setChecklistData({
        ...template,
        items: results,
      });
      setCurrentStatus(existingChecklist.status || 'draft');
      setOverallNotes(existingChecklist.overallNotes || '');
    } else if (template && !existingChecklist) {
      // Create new checklist
      const results: ChecklistItem[] = template.items.map(item => ({
        ...item,
        checked: false,
        notes: '',
      }));

      setChecklistData({
        ...template,
        items: results,
      });
      setCurrentStatus('draft');
    }
  }, [template, existingChecklist]);

  const handleItemChange = (itemId: string, field: 'checked' | 'notes', value: any) => {
    if (!checklistData) return;

    const updatedItems = checklistData.items.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );

    setChecklistData({
      ...checklistData,
      items: updatedItems,
    });
  };

  const handleSave = async (status: 'in_progress' | 'completed' | 'rejected') => {
    if (!checklistData) return;

    // Validate checklist before saving
    const validationResult = await validateChecklist({
      results: checklistData.items.map(item => ({
        itemId: item.id,
        checked: item.checked || false,
        notes: item.notes || '',
        required: item.required,
      })),
      checklistType: npd?.jenis || 'UP',
    });

    if (!validationResult.isValid) {
      setValidationErrors(validationResult.errors);
      return;
    }

    setIsLoading(true);
    setValidationErrors([]);

    try {
      await saveChecklist({
        npdId,
        checklistType: npd?.jenis || 'UP',
        results: checklistData.items.map(item => ({
          itemId: item.id,
          checked: item.checked || false,
          notes: item.notes || '',
          required: item.required,
        })),
        status,
        overallNotes,
      });

      setCurrentStatus(status);
      setIsLoading(false);

      notifications.show({
        title: 'Berhasil',
        message: `Checklist berhasil disimpan sebagai ${status}`,
        color: 'green',
      });

      onVerificationComplete?.(existingChecklist?._id || 'new-checklist');
    } catch (error) {
      console.error('Save checklist error:', error);
      setIsLoading(false);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Gagal menyimpan checklist',
        color: 'red',
      });
    }
  };

  const getRequiredItemsChecked = () => {
    if (!checklistData) return 0;
    return checklistData.items.filter(item => item.required && item.checked).length;
  };

  const getTotalItemsChecked = () => {
    if (!checklistData) return 0;
    return checklistData.items.filter(item => item.checked).length;
  };

  const isSaveDisabled = () => {
    if (currentStatus === 'completed' || currentStatus === 'rejected') return true;
    if (!checklistData) return true;
    return getTotalItemsChecked() === 0;
  };

  if (npdLoading || checklistLoading) {
    return (
      <Card p="md" withBorder h="400px">
        <LoadingOverlay visible />
        <Text align="center" color="dimmed">
          Memuat data verifikasi...
        </Text>
      </Card>
    );
  }

  if (!checklistData) {
    return (
      <Card p="md" withBorder h="400px">
        <Text align="center" color="dimmed">
          Template verifikasi tidak ditemukan.
        </Text>
      </Card>
    );
  }

  return (
    <Card p="md" withBorder h="600px">
      <Card.Section withBorder inheritPadding={false}>
        <Group justify="space-between" mb="md">
          <Title order={4}>{checklistData.title}</Title>
          <Group>
            <Badge
              color={
                currentStatus === 'completed' ? 'green' :
                currentStatus === 'rejected' ? 'red' :
                currentStatus === 'in_progress' ? 'yellow' : 'gray'
              }
              variant="light"
            >
              Status: {currentStatus}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Tutup
            </Button>
          </Group>
        </Group>
      </Card.Section>

      <ScrollArea h="400px" offsetScrollbars="y">
        <Stack gap="md">
          {validationErrors.length > 0 && (
            <Alert color="red" mb="md">
              <Text size="sm">
                <strong>Validasi gagal:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Text>
            </Alert>
          )}

          {checklistData.items.map((item, index) => (
            <Card key={item.id} p="sm" withBorder>
              <SimpleGrid cols={{ base: 1, sm: 24 }} spacing="md" align="center">
                <div style={{ gridColumn: 'span 20' }}>
                  <Text size="sm" fw={600}>
                    {item.required && (
                      <Text color="red" span="inline">* </Text>
                    )}
                    {index + 1}. {item.label}
                  </Text>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <Checkbox
                    checked={item.checked || false}
                    onChange={(checked) => handleItemChange(item.id, 'checked', checked)}
                    label=""
                    size="sm"
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <Textarea
                    placeholder="Catatan..."
                    value={item.notes || ''}
                    onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                    minRows={2}
                    maxRows={4}
                    size="sm"
                  />
                </div>
              </SimpleGrid>
            </Card>
          ))}

          <Divider label="Catatan Umum" />

          <Textarea
            placeholder="Masukkan catatan umum untuk proses verifikasi..."
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            minRows={3}
            maxRows={5}
          />
        </Stack>
      </ScrollArea>

      <Card.Section withBorder inheritPadding={false}>
        <Group justify="space-between" align="center">
          <div>
            <Text size="sm" color="dimmed">
              Item required: {getRequiredItemsChecked()}/{checklistData.items.filter(item => item.required).length}
            </Text>
            <Text size="sm" color="dimmed" ml="md">
              Total checked: {getTotalItemsChecked()}/{checklistData.items.length}
            </Text>
          </div>

          <Group>
            <Button
              variant="outline"
              color="gray"
              leftSection={<IconEye size={16} />}
              onClick={() => window.open(`/npd/${npdId}`, '_blank')}
            >
              Lihat NPD
            </Button>

            {currentStatus !== 'completed' && currentStatus !== 'rejected' && (
              <Button
                variant="outline"
                color="blue"
                leftSection={<IconSave size={16} />}
                onClick={() => handleSave('in_progress')}
                loading={isLoading}
                disabled={isSaveDisabled()}
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Draft'}
              </Button>
            )}

            <Button
              variant="filled"
              color="green"
              leftSection={<IconCheck size={16} />}
              onClick={() => handleSave('completed')}
              loading={isLoading}
              disabled={isSaveDisabled()}
            >
              {isLoading ? 'Menyimpan...' : 'Setujui & Selesai'}
            </Button>

            <Button
              variant="filled"
              color="red"
              leftSection={<IconX size={16} />}
              onClick={() => handleSave('rejected')}
              loading={isLoading}
              disabled={isSaveDisabled()}
            >
              {isLoading ? 'Menyimpan...' : 'Tolak'}
            </Button>
          </Group>
        </Group>
      </Card.Section>
    </Card>
  );
}