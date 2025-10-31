'use client';

import { useState } from 'react';
import {
  Card,
  Stack,
  Group,
  Title,
  Text,
  Badge,
  Timeline,
  Button,
  ActionIcon,
  Alert,
  Modal,
} from '@mantine/core';
import {
  IconClock,
  IconCheck,
  IconX,
  IconUser,
  IconLock,
  IconLockOpen,
} from '@tabler/icons-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from 'convex/values';

interface WorkflowEvent {
  id: string;
  action: string;
  actor: string;
  timestamp: number;
  description: string;
  status?: string;
}

interface WorkflowManagerProps {
  npdId: Id<'npdDocuments'>;
  onClose: () => void;
}

interface TimelineItem {
  title: string;
  description: string;
  timestamp: number;
  color: string;
  icon: React.ReactNode;
  status: 'pending' | 'completed' | 'rejected';
}

export function WorkflowManager({ npdId, onClose }: WorkflowManagerProps) {
  const [selectedEvent, setSelectedEvent] = useState<WorkflowEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get NPD details
  const { data: npd } = useQuery(api.npd.getById, { npdId });

  // Get audit logs for workflow
  const { data: auditLogs } = useQuery(api.auditLogs.getByEntity, {
    entityTable: 'npdDocuments',
    entityId: npdId,
  });

  // Get verification status
  const { data: verificationChecklist } = useQuery(api.verifications.getChecklistByNPD, { npdId });

  const getWorkflowStatus = () => {
    if (!npd) return 'unknown';

    switch (npd.status) {
      case 'draft':
        return 'draft';
      case 'diajukan':
        return 'submitted';
      case 'diverifikasi':
        return 'verified';
      case 'final':
        return 'completed';
      default:
        return 'unknown';
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'gray',
      submitted: 'blue',
      verified: 'yellow',
      completed: 'green',
      rejected: 'red',
      unknown: 'gray',
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      draft: <IconClock size={16} />,
      submitted: <IconUser size={16} />,
      verified: <IconCheck size={16} />,
      completed: <IconCheck size={16} />,
      rejected: <IconX size={16} />,
      unknown: <IconClock size={16} />,
    };
    return icons[status as keyof typeof icons] || <IconClock size={16} />;
  };

  const isDocumentLocked = () => {
    return npd?.status === 'diverifikasi' || npd?.status === 'final';
  };

  const getTimelineItems = (): TimelineItem[] => {
    if (!npd) return [];

    const items: TimelineItem[] = [];

    // Created
    items.push({
      title: 'Dibuat',
      description: `NPD dibuat oleh ${npd.createdBy || 'User'}`,
      timestamp: npd.createdAt,
      color: 'blue',
      icon: <IconUser size={16} />,
      status: 'completed',
    });

    // Submitted (if applicable)
    if (npd.updatedAt && npd.updatedAt > npd.createdAt) {
      items.push({
        title: 'Diajukan',
        description: 'NPD diajukan untuk verifikasi',
        timestamp: npd.updatedAt,
        color: 'yellow',
        icon: <IconUser size={16} />,
        status: 'completed',
      });
    }

    // Verification (if applicable)
    if (verificationChecklist && verificationChecklist.verifiedAt) {
      items.push({
        title: 'Diverifikasi',
        description: `NPD diverifikasi oleh verifikator pada ${new Date(verificationChecklist.verifiedAt).toLocaleString('id-ID')}`,
        timestamp: verificationChecklist.verifiedAt,
        color: 'green',
        icon: <IconCheck size={16} />,
        status: 'completed',
      });
    }

    // Finalized (if applicable)
    if (npd.finalizedAt && npd.finalizedAt > (verificationChecklist?.verifiedAt || 0)) {
      items.push({
        title: 'Difinalisasi',
        description: `NPD difinalisasi oleh bendahara pada ${new Date(npd.finalizedAt).toLocaleString('id-ID')}`,
        timestamp: npd.finalizedAt,
        color: 'green',
        icon: <IconCheck size={16} />,
        status: 'completed',
      });
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
  };

  const handleEventClick = (event: WorkflowEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const getWorkflowStatusBadge = () => {
    const status = getWorkflowStatus();
    const labels = {
      draft: { label: 'Draft', color: 'gray' },
      submitted: { label: 'Diajukan', color: 'blue' },
      verified: { label: 'Diverifikasi', color: 'yellow' },
      completed: { label: 'Final', color: 'green' },
      rejected: { label: 'Ditolak', color: 'red' },
      unknown: { label: 'Unknown', color: 'gray' },
    };

    const badgeInfo = labels[status as keyof typeof labels] || labels.unknown;
    return (
      <Badge
        color={badgeInfo.color}
        variant="light"
        size="lg"
      >
        {badgeInfo.label}
      </Badge>
    );
  };

  return (
    <Card p="md" withBorder h="600px">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" mb="md">
          <Title order={3}>Workflow Status</Title>
          <Group>
            {getWorkflowStatusBadge()}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Tutup
            </Button>
          </Group>
        </Group>

        {/* Document Lock Status */}
        {isDocumentLocked() && (
          <Alert icon={<IconLock size={16} />} color="yellow">
            <Text>
              <strong>Dokumen Terkunci:</strong> Dokumen ini sedang dalam proses verifikasi
              atau sudah finalisasi. Edit tidak dapat dilakukan.
            </Text>
          </Alert>
        )}

        {/* Workflow Timeline */}
        <Card.Section inheritPadding={false}>
          <Group mb="md">
            <Text fw={600}>Riwayat Workflow</Text>
            <Group>
              <ActionIcon
                variant="light"
                color={isDocumentLocked() ? 'orange' : 'green'}
              >
                {isDocumentLocked() ? <IconLock size={14} /> : <IconLockOpen size={14} />}
              </ActionIcon>
              <Text size="sm" color="dimmed">
                {isDocumentLocked() ? 'Dokumen Terkunci' : 'Dokumen Dapat Diedit'}
              </Text>
            </Group>
          </Group>
          </Group>

          <Timeline
            bulletSize={24}
            lineWidth={2}
            active={-1}
          >
            {getTimelineItems().map((item, index) => (
              <Timeline.Item
                key={item.title}
                bullet={<div style={{ color: item.color }}>{getStatusIcon(item.status)}</div>}
                title={item.title}
              >
                <Text size="sm" fw={500}>{item.title}</Text>
                <Text size="xs" color="dimmed">{item.description}</Text>
                <Text size="xs" color="gray">
                  {new Date(item.timestamp).toLocaleString('id-ID')}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card.Section>

        {/* Audit Logs */}
        <Card.Section inheritPadding={false}>
          <Group mb="md">
            <Text fw={600}>Log Aktivitas</Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/audit-log/${npdId}`, '_blank')}
            >
              Lihat Detail
            </Button>
          </Group>
          </Group>

          <Stack gap="sm">
            {auditLogs?.slice(0, 5).map((log, index) => (
              <Card key={index} p="xs" withBorder>
                <Group justify="space-between">
                  <Text size="xs" fw={500}>
                    {log.action}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {new Date(log.createdAt).toLocaleString('id-ID')}
                  </Text>
                </Group>
                <Text size="xs" color="gray">
                  {log.actorUserId?.toString()} - {log.keterangan}
                </Text>
              </Card>
            ))}

            {auditLogs && auditLogs.length > 5 && (
              <Text size="xs" color="dimmed" ta="center">
                ...dan {auditLogs.length - 5} aktivitas lainnya
              </Text>
            )}
          </Stack>
        </Card.Section>
      </Stack>

      {/* Event Detail Modal */}
      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
        title="Detail Aktivitas"
      >
        {selectedEvent && (
          <Stack gap="md">
            <div>
              <Text fw={600}>Aktivitas:</Text>
              <Text>{selectedEvent.action}</Text>
            </div>
            <div>
              <Text fw={600}>Pelaku:</Text>
              <Text>{selectedEvent.actor}</Text>
            </div>
            <div>
              <Text fw={600}>Waktu:</Text>
              <Text>{new Date(selectedEvent.timestamp).toLocaleString('id-ID')}</Text>
            </div>
            <div>
              <Text fw={600}>Deskripsi:</Text>
              <Text>{selectedEvent.description}</Text>
            </div>
            {selectedEvent.status && (
              <div>
                <Text fw={600}>Status:</Text>
                <Badge color={getStatusColor(selectedEvent.status)} variant="light">
                  {selectedEvent.status}
                </Badge>
              </div>
            )}
          </Stack>
        )}
      </Modal>
    </Card>
  );
}