'use client';

import React, { useState } from 'react';
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Button,
  ActionIcon,
  List,
  UnstyledButton,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconBell,
  IconBellRinging,
  IconCheck,
  IconX,
  IconAdjustmentsHorizontal,
  IconSettings,
  IconArchive,
  IconMail
} from '@tabler/icons-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
  relatedEntity?: {
    id: string;
    type: string;
    name?: string;
  };
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Mock notifications data - replace with real Convex calls
  const mockNotifications: NotificationItem[] = [
    {
      id: '1',
      type: 'npd_submitted',
      title: 'NPD Diajukan',
      message: 'NPD-2025-001 telah diajukan untuk verifikasi',
      isRead: false,
      createdAt: Date.now() - 86400000 * 2,
      relatedEntity: {
        id: 'npd-1',
        type: 'npd',
        name: 'NPD-2025-001'
      }
    },
    {
      id: '2',
      type: 'npd_verified',
      title: 'NPD Diverifikasi',
      message: 'NPD-2025-001 telah diverifikasi dan disetujui',
      isRead: false,
      createdAt: Date.now() - 86400000,
      relatedEntity: {
        id: 'npd-1',
        type: 'npd',
        name: 'NPD-2025-001'
      }
    },
    {
      id: '3',
      type: 'sp2d_created',
      title: 'SP2D Dibuat',
      message: 'SP2D-001 telah dibuat untuk NPD-2025-001',
      isRead: true,
      createdAt: Date.now() - 86400000 * 1,
      relatedEntity: {
        id: 'sp2d-1',
        type: 'sp2d',
        name: 'SP2D-001'
      }
    },
    {
      id: '4',
      type: 'npd_rejected',
      title: 'NPD Ditolak',
      message: 'NPD-2025-002 ditolak dengan alasan: kelengkapan dokumen',
      isRead: false,
      createdAt: Date.now() - 86400000 * 3,
      relatedEntity: {
        id: 'npd-2',
        type: 'npd',
        name: 'NPD-2025-002'
      }
    },
  ];

  // Filter notifications
  const filteredNotifications = mockNotifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    return true;
  });

  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Call Convex mutation to mark as read
      notifications.show({
        title: 'Berhasil',
        message: 'Notifikasi ditandai sebagai sudah dibaca',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Gagal menandai notifikasi',
        color: 'red',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Call Convex mutation to mark all as read
      notifications.show({
        title: 'Berhasil',
        message: 'Semua notifikasi ditandai sebagai sudah dibaca',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Gagal menandai semua notifikasi',
        color: 'red',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'npd_submitted': return <IconBellRinging size={16} color="blue" />;
      case 'npd_verified': return <IconCheck size={16} color="green" />;
      case 'npd_rejected': return <IconX size={16} color="red" />;
      case 'sp2d_created': return <IconMail size={16} color="orange" />;
      default: return <IconBell size={16} color="gray" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'npd_submitted': return 'blue';
      case 'npd_verified': return 'green';
      case 'npd_rejected': return 'red';
      case 'sp2d_created': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <>
      {/* Notification Button */}
      <UnstyledButton
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
        }}
      >
        <Group gap="xs">
          <IconBell size={20} />
          <Text size="bold">Notifikasi</Text>
          {unreadCount > 0 && (
            <Badge
              size="xs"
              color="red"
              variant="filled"
              circle
            >
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Badge>
          )}
        </Group>
      </UnstyledButton>

      {/* Notification Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '60px',
            right: '20px',
            width: '400px',
            maxHeight: '80vh',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
          }}
        >
          <Card padding="md" shadow="lg">
            {/* Header */}
            <Group justify="space-between" mb="md">
              <Text fw="bold">Pusat Notifikasi</Text>
              <ActionIcon
                variant="transparent"
                color="gray"
                onClick={() => setIsOpen(false)}
              >
                <IconX size={20} />
              </ActionIcon>
            </Group>

            {/* Filter Tabs */}
            <Group mb="md">
              <Button
                variant={filter === 'all' ? 'filled' : 'light'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Semua
              </Button>
              <Button
                variant={filter === 'unread' ? 'filled' : 'light'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Belum Dibaca ({unreadCount})
              </Button>
            </Group>

            <Divider />

            {/* Notification List */}
            <List spacing="xs" size="sm" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredNotifications.map((notification) => (
                <List.Item key={notification.id}>
                  <Group
                    gap="sm"
                    mb="xs"
                    p="sm"
                    style={{
                      backgroundColor: notification.isRead ? 'transparent' : '#f8f9fa',
                      borderRadius: '8px',
                      border: notification.isRead ? 'none' : '1px solid #e9ecef',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ flex: '0 0 auto' }}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div>
                          <Group gap="xs" mb="xs">
                            <Text
                              size="sm"
                              fw={notification.isRead ? 'normal' : 'bold'}
                              c={notification.isRead ? 'dimmed' : getNotificationColor(notification.type)}
                            >
                              {notification.title}
                            </Text>
                            <Text
                              size="xs"
                              c="dimmed"
                              lineClamp={2}
                            >
                              {notification.message}
                            </Text>
                          </Group>

                          {!notification.isRead && (
                            <Badge
                              size="xs"
                              color="blue"
                              variant="light"
                            >
                              Baru
                            </Badge>
                          )}
                        </div>

                        <div>
                          <Text size="xs" c="dimmed">
                            {new Date(notification.createdAt).toLocaleDateString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </div>
                      </div>
                    </div>

                    {/* Related Entity Link */}
                    {notification.relatedEntity && (
                      <Group gap="xs" mt="xs">
                        <ActionIcon
                          variant="transparent"
                          color="gray"
                          size="xs"
                        >
                          <IconAdjustmentsHorizontal size={12} />
                        </ActionIcon>
                        <Text size="xs" c="dimmed">
                          {notification.relatedEntity.name}
                        </Text>
                      </Group>
                    )}
                  </Group>
                </List.Item>
              ))}
            </List>

            {/* Actions */}
            <Group justify="space-between" mt="md">
              <Button
                variant="outline"
                size="sm"
                leftSection={<IconArchive size={14} />}
                onClick={() => handleMarkAllAsRead()}
                disabled={unreadCount === 0}
              >
                Tandai Semua Dibaca
              </Button>

              <Button
                variant="subtle"
                size="sm"
                leftSection={<IconSettings size={14} />}
              >
                Pengaturan
              </Button>
            </Group>
          </Card>
        </div>
      )}
    </>
  );
}