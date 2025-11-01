"use client";

import React from "react";
import {
  Stack,
  Group,
  Text,
  Badge,
  Divider,
  Card,
  Code,
  ScrollArea,
  ActionIcon,
  Tooltip,
  Title,
  Grid,
} from "@mantine/core";
import {
  IconCopy,
  IconUser,
  IconCalendar,
  IconFileDescription,
  IconInfoCircle,
  IconBrowser,
  IconWorld,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery as useConvexQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AuditLogDetailsProps {
  log: any;
  onClose: () => void;
}

export function AuditLogDetails({ log, onClose }: AuditLogDetailsProps) {
  // Get user details
  const { data: actor } = useConvexQuery(
    api.users.getUser,
    log.actorUserId ? { userId: log.actorUserId } : "skip"
  );

  // Get organization details
  const { data: organization } = useConvexQuery(
    api.organizations.getOrganization,
    { organizationId: log.organizationId }
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getActionColor = (action: string): string => {
    const colorMap: Record<string, string> = {
      created: "green",
      updated: "blue",
      submitted: "orange",
      verified: "yellow",
      finalized: "indigo",
      deleted: "red",
      approved: "green",
      rejected: "red",
      uploaded: "cyan",
      downloaded: "grape",
    };
    return colorMap[action] || "gray";
  };

  const formatJson = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Title order={3}>📋 Audit Log Details</Title>
      </Group>

      {/* Basic Information */}
      <Card withBorder padding="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600}>Basic Information</Text>
          </Group>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Group gap="xs" mb="xs">
                <IconCalendar size={16} color="gray" />
                <Text size="sm" fw={500}>Timestamp</Text>
              </Group>
              <Text size="sm" color="dimmed">
                {format(new Date(log.createdAt), "EEEE, dd MMMM yyyy HH:mm:ss", {
                  locale: id,
                })}
              </Text>
              <Text size="xs" color="dimmed">
                {format(new Date(log.createdAt), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Group gap="xs" mb="xs">
                <IconFileDescription size={16} color="gray" />
                <Text size="sm" fw={500}>Action</Text>
              </Group>
              <Badge
                size="lg"
                variant="light"
                color={getActionColor(log.action)}
              >
                {log.action.toUpperCase()}
              </Badge>
            </Grid.Col>
          </Grid>

          <Divider />

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Group gap="xs" mb="xs">
                <IconFileDescription size={16} color="gray" />
                <Text size="sm" fw={500}>Entity</Text>
              </Group>
              <Text size="sm" fw={500}>{log.entityTable}</Text>
              <Group gap="xs">
                <Text size="sm" color="dimmed">ID: </Text>
                <Code size="sm">{log.entityId}</Code>
                <Tooltip label="Copy ID">
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    onClick={() => copyToClipboard(log.entityId)}
                  >
                    <IconCopy size={12} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Group gap="xs" mb="xs">
                <IconInfoCircle size={16} color="gray" />
                <Text size="sm" fw={500}>Organization</Text>
              </Group>
              <Text size="sm">{organization?.name || "Unknown"}</Text>
              <Text size="xs" color="dimmed">{organization?.description}</Text>
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      {/* Actor Information */}
      {actor && (
        <Card withBorder padding="md">
          <Stack gap="md">
            <Group gap="xs">
              <IconUser size={16} color="gray" />
              <Text size="sm" fw={500}>Actor Information</Text>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text size="xs" color="dimmed">Name</Text>
                <Text size="sm">{actor.name || "Unknown"}</Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text size="xs" color="dimmed">Email</Text>
                <Text size="sm">{actor.email}</Text>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text size="xs" color="dimmed">Role</Text>
                <Badge size="sm" variant="light">
                  {actor.role}
                </Badge>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text size="xs" color="dimmed">User ID</Text>
                <Code size="xs">{log.actorUserId}</Code>
              </Grid.Col>
            </Grid>
          </Stack>
        </Card>
      )}

      {/* Technical Details */}
      <Card withBorder padding="md">
        <Stack gap="md">
          <Text size="sm" fw={500}>Technical Details</Text>
          <Grid>
            {log.ipAddress && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Group gap="xs" mb="xs">
                  <IconWorld size={16} color="gray" />
                  <Text size="sm">IP Address</Text>
                </Group>
                <Code size="sm">{log.ipAddress}</Code>
              </Grid.Col>
            )}
            {log.userAgent && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Group gap="xs" mb="xs">
                  <IconBrowser size={16} color="gray" />
                  <Text size="sm">User Agent</Text>
                </Group>
                <Text size="xs" lineClamp={3} title={log.userAgent}>
                  {log.userAgent}
                </Text>
              </Grid.Col>
            )}
          </Grid>
        </Stack>
      </Card>

      {/* Description */}
      {log.keterangan && (
        <Card withBorder padding="md">
          <Stack gap="md">
            <Text size="sm" fw={500}>Description</Text>
            <Text size="sm">{log.keterangan}</Text>
          </Stack>
        </Card>
      )}

      {/* Entity Data */}
      {log.entityData && (
        <Card withBorder padding="md">
          <Stack gap="md">
            <Text size="sm" fw={500}>Entity Data</Text>
            <ScrollArea.Autosize mah={300}>
              <Code block>
                {formatJson(log.entityData)}
              </Code>
            </ScrollArea.Autosize>
            <Group justify="right">
              <Tooltip label="Copy JSON">
                <ActionIcon
                  variant="subtle"
                  onClick={() => copyToClipboard(formatJson(log.entityData))}
                >
                  <IconCopy size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Stack>
        </Card>
      )}

      {/* Raw Data */}
      <Card withBorder padding="md">
        <Stack gap="md">
          <Text size="sm" fw={500}>Raw Data</Text>
          <ScrollArea.Autosize mah={200}>
            <Code block size="xs">
              {formatJson(log)}
            </Code>
          </ScrollArea.Autosize>
          <Group justify="right">
            <Tooltip label="Copy JSON">
              <ActionIcon
                variant="subtle"
                onClick={() => copyToClipboard(formatJson(log))}
              >
                <IconCopy size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}