'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, Check, X } from '@tabler/icons-react'
import {
  ActionIcon,
  Text,
  Group,
  Badge,
  UnstyledButton,
  ScrollArea,
  Card,
  Divider,
  Avatar,
  Stack,
  Title,
  Flex,
  Tooltip,
  Notification,
  Loader,
} from '@mantine/core'
import { useQuery, useMutation, useSubscription } from 'convex/react'
import { api } from '@/convex/_generated/api'

interface NotificationItem {
  _id: string
  type: string
  title: string
  message: string
  entityId?: string
  entityType?: string
  isRead: boolean
  createdAt: number
}

export function NotificationCenter() {
  const [expanded, setExpanded] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Real-time subscription for notifications
  const { data: notifications, isLoading } = useSubscription(
    api.notifications.subscribe,
    {},
    { enabled: true }
  )

  // Get unread count for badge
  const { data: unreadCount } = useQuery(
    api.notifications.unreadCount,
    {},
    { enabled: true }
  )

  // Mark notifications as read mutation
  const markAsRead = useMutation(api.notifications.markAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)

  // Handle notification click
  const handleNotificationClick = useCallback(async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead.mutate({
        notificationIds: [notificationId]
      })
    }
    setShowNotifications(false)
    setExpanded(false)
  }, [markAsRead])

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead.mutate({})
  }, [markAllAsRead])

  // Show browser notification for new notifications
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const latestNotification = notifications[0]
      if (!latestNotification.isRead && 'Notification' in window) {
        const browserNotification = new Notification(latestNotification.title, {
          body: latestNotification.message,
          icon: '/favicon.ico',
          tag: latestNotification._id
        })

        browserNotification.onclick = () => {
          handleNotificationClick(latestNotification._id, latestNotification.isRead)
          browserNotification.close()
        }

        // Auto-close after 5 seconds
        setTimeout(() => {
          browserNotification.close()
        }, 5000)
      }
    }
  }, [notifications, handleNotificationClick])

  if (isLoading) {
    return (
      <Card p="md" withBorder>
        <Flex align="center" justify="center" h={200}>
          <Loader size="md" />
        </Flex>
      </Card>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Notification Bell with Badge */}
      <Tooltip label={`Notifikasi ${unreadCount > 0 ? `(${unreadCount})` : ''}`}>
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={() => {
            setShowNotifications(!showNotifications)
            setExpanded(!expanded)
          }}
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <Badge
              size="xs"
              color="red"
              variant="filled"
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                minWidth: 18,
                height: 18,
                fontSize: 10,
                fontWeight: 'bold'
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </ActionIcon>
      </Tooltip>

      {/* Notifications Dropdown */}
      {expanded && (
        <Card
          withBorder
          shadow="lg"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 400,
            maxHeight: 500,
            zIndex: 1000
          }}
        >
          <Group justify="space-between" mb="md">
            <Group>
              <Bell size={16} />
              <Title order={4}>Notifikasi</Title>
            </Group>
            <Group gap="sm">
              {unreadCount > 0 && (
                <UnstyledButton
                  size="sm"
                  variant="subtle"
                  onClick={handleMarkAllAsRead}
                  loading={markAllAsRead.isLoading}
                >
                  <Check size={12} />
                </UnstyledButton>
              )}
              <Tooltip label="Tutup">
                <UnstyledButton size="sm" variant="subtle">
                  <X size={12} />
                </UnstyledButton>
              </Tooltip>
            </Group>
          </Group>

          <Divider />

          <ScrollArea h={400} offsetScrollbars={true}>
            {notifications?.length === 0 ? (
              <Flex align="center" justify="center" h="100%">
                <BellOff size={48} style={{ opacity: 0.5 }} />
                <Text color="dimmed" size="sm" mt="md">
                  Belum ada notifikasi
                </Text>
              </Flex>
            ) : (
              <Stack gap="sm">
                {notifications?.map((notification: NotificationItem) => (
              <Card
                key={notification._id}
                p="sm"
                withBorder
                mb="xs"
                onClick={() => handleNotificationClick(notification._id, notification.isRead)}
                style={{
                  opacity: notification.isRead ? 0.7 : 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Group justify="space-between" mb="xs">
                  <Group align="center" gap="sm">
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: getNotificationColor(notification.type),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <Text size="sm" weight={500} lineClamp={2}>
                      {notification.title}
                    </Text>
                  </Group>

                  <Badge
                    size="xs"
                    color={notification.isRead ? 'gray' : 'blue'}
                    variant="light"
                  >
                    {getNotificationTypeLabel(notification.type)}
                  </Badge>
                </Group>

                <Tooltip label="Tandai waktu">
                  <Text size="xs" color="dimmed">
                    {formatDate(notification.createdAt)}
                  </Text>
                </Tooltip>
              </Card>
            ))}
          </Stack>
        )}
      </ScrollArea>
        </Card>
      )}
    </div>
  )
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'npd_submitted':
      return <ActionIcon size={16} color="blue" />
    case 'npd_verified':
      return <Check size={16} color="green" />
    case 'npd_rejected':
      return <X size={16} color="red" />
    case 'sp2d_created':
      return <ActionIcon size={16} color="cyan" />
    default:
      return <Bell size={16} color="gray" />
  }
}

function getNotificationColor(type: string): string {
  switch (type) {
    case 'npd_submitted':
      return '#3b82f6'
    case 'npd_verified':
      return '#52c41a'
    case 'npd_rejected':
      return '#ef4444'
    case 'sp2d_created':
      return '#06b6d4'
    default:
      return '#6c757d'
  }
}

function getNotificationTypeLabel(type: string): string {
  switch (type) {
    case 'npd_submitted':
      return 'NPD'
    case 'npd_verified':
      return 'Verifikasi'
    case 'npd_rejected':
      return 'Ditolak'
    case 'sp2d_created':
      return 'SP2D'
    default:
      return 'Info'
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) {
    return 'Baru saja'
  } else if (diffMins < 60) {
    return `${diffMins} menit yang lalu`
  } else if (diffHours < 24) {
    return `${diffHours} jam yang lalu`
  } else if (diffDays < 7) {
    return `${diffDays} hari yang lalu`
  } else {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }
}