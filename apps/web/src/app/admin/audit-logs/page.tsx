"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Container,
  Title,
  Group,
  Stack,
  TextInput,
  Select,
  Button,
  Table,
  Badge,
  Text,
  Pagination,
  Card,
  Grid,
  ActionIcon,
  Drawer,
  Box,
  Divider,
  ScrollArea,
  LoadingOverlay,
} from "@mantine/core";
import {
  IconSearch,
  IconFilter,
  IconDownload,
  IconEye,
  IconCalendar,
  IconUser,
  IconFileDescription,
} from "@tabler/icons-react";
import { usePagination } from "@mantine/hooks";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { api } from "@/convex/_generated/api";
import { useQuery as useConvexQuery } from "convex/react";
import { AuditLogDetails } from "@/components/admin/audit-logs/AuditLogDetails";

interface AuditLogFilters {
  action?: string;
  entityTable?: string;
  actorUserId?: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  search?: string;
}

interface AuditLogStats {
  totalLogs: number;
  actionCounts: Record<string, number>;
  entityCounts: Record<string, number>;
  actorCounts: Record<string, number>;
  dailyActivity: Record<string, number>;
}

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const pagination = usePagination({ total: 100, page: currentPage, onChange: setCurrentPage });

  // Get current organization (you may need to adjust this based on your auth context)
  const { data: organization } = useQuery({
    queryKey: ["current-organization"],
    queryFn: async () => {
      // This should get the current organization from your auth context
      // For now, return a placeholder
      return { id: "organization_id_placeholder" };
    },
  });

  // TODO: Implement audit logs API functions in Convex
  // Get available actions for filter dropdown
  const availableActions: string[] = []; // Mock data until API is implemented

  // Get available entity tables for filter dropdown
  const availableEntityTables: string[] = []; // Mock data until API is implemented

  // Get audit log statistics
  const stats = null;
  const statsLoading = false;

  // Get audit logs
  const logsData: any[] = []; // Mock empty array
  const logsLoading = false;

  // Export audit logs
  const exportData = null;
  const exportLogs = () => {}; // Mock function

  const handleExport = async () => {
    try {
      const result = await exportLogs();
      if (result) {
        // Create download link
        const blob = new Blob([result.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename || "audit-logs.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const resetFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const applyFilters = (newFilters: AuditLogFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const viewLogDetails = (log: any) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  if (!organization) {
    return (
      <Container size="lg" py="md">
        <Text>Loading...</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>📋 Audit Logs</Title>
          <Group>
            <Button
              variant="outline"
              leftSection={<IconDownload size={16} />}
              onClick={handleExport}
              loading={!exportData}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              leftSection={<IconFilter size={16} />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </Group>
        </Group>

        {/* Statistics Cards */}
        {!showFilters && stats && (
          <Grid>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card padding="lg" radius="md" withBorder>
                <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
                  Total Logs
                </Text>
                <Text size="xl" fw={700}>
                  {stats.totalLogs.toLocaleString()}
                </Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card padding="lg" radius="md" withBorder>
                <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
                  Actions
                </Text>
                <Text size="xl" fw={700}>
                  {Object.keys(stats.actionCounts).length}
                </Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card padding="lg" radius="md" withBorder>
                <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
                  Entities
                </Text>
                <Text size="xl" fw={700}>
                  {Object.keys(stats.entityCounts).length}
                </Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card padding="lg" radius="md" withBorder>
                <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
                  Actors
                </Text>
                <Text size="xl" fw={700}>
                  {Object.keys(stats.actorCounts).length}
                </Text>
              </Card>
            </Grid.Col>
          </Grid>
        )}

        {/* Filters */}
        {showFilters && (
          <Card padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600}>🔍 Filters</Text>
                <Button variant="subtle" size="sm" onClick={resetFilters}>
                  Reset
                </Button>
              </Group>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    leftSection={<IconSearch size={16} />}
                    placeholder="Search logs..."
                    value={filters.search || ""}
                    onChange={(e) =>
                      applyFilters({ ...filters, search: e.target.value })
                    }
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    leftSection={<IconFileDescription size={16} />}
                    placeholder="Action"
                    data={availableActions?.map((action) => ({
                      value: action,
                      label: action,
                    }))}
                    value={filters.action || ""}
                    onChange={(value) =>
                      applyFilters({ ...filters, action: value || undefined })
                    }
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    leftSection={<IconFileDescription size={16} />}
                    placeholder="Entity"
                    data={availableEntityTables?.map((table) => ({
                      value: table,
                      label: table,
                    }))}
                    value={filters.entityTable || ""}
                    onChange={(value) =>
                      applyFilters({ ...filters, entityTable: value || undefined })
                    }
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>
        )}

        {/* Audit Logs Table */}
        <Card padding="lg" radius="md" withBorder>
          <Card.Section withBorder inheritPadding py="sm">
            <Text fw={600}>📝 Audit Logs</Text>
          </Card.Section>

          <Box pos="relative">
            <LoadingOverlay visible={logsLoading} />
            <ScrollArea>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Timestamp</Table.Th>
                    <Table.Th>Action</Table.Th>
                    <Table.Th>Entity</Table.Th>
                    <Table.Th>Actor</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {logsData && Array.isArray(logsData) && logsData.map((log: any) => (
                    <Table.Tr key={log._id}>
                      <Table.Td>
                        <Text size="sm">
                          {format(new Date(log.createdAt), "dd MMM yyyy HH:mm:ss", {
                            locale: id,
                          })}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          variant="light"
                          color={getActionColor(log.action)}
                        >
                          {log.action}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{log.entityTable}</Text>
                        <Text size="xs" color="dimmed">
                          ID: {log.entityId.slice(0, 8)}...
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconUser size={16} color="gray" />
                          <Text size="sm">{log.actorUserId.slice(0, 8)}...</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          size="sm"
                          lineClamp={1}
                          title={log.keterangan}
                        >
                          {log.keterangan || "-"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          size="sm"
                          onClick={() => viewLogDetails(log)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {(!logsData || (Array.isArray(logsData) && logsData.length === 0)) && !logsLoading && (
                <Box py="xl" ta="center">
                  <Text color="dimmed">No audit logs found</Text>
                </Box>
              )}
            </ScrollArea>
          </Box>

          {/* Pagination */}
          {logsData && Array.isArray(logsData) && logsData.length > 0 && (
            <Box pt="md">
              <Group justify="center">
                <Pagination
                  total={Math.ceil(
                    (Array.isArray(logsData) ? logsData.length : 0) /
                      itemsPerPage
                  )}
                  page={currentPage}
                  onChange={setCurrentPage}
                />
              </Group>
            </Box>
          )}
        </Card>
      </Stack>

      {/* Audit Log Details Drawer */}
      <Drawer
        opened={showDetails}
        onClose={() => setShowDetails(false)}
        title="📋 Audit Log Details"
        size="lg"
        padding="lg"
      >
        {selectedLog && (
          <AuditLogDetails log={selectedLog} onClose={() => setShowDetails(false)} />
        )}
      </Drawer>
    </Container>
  );
}

// Helper function to get action color
function getActionColor(action: string): string {
  const colorMap: Record<string, string> = {
    created: "green",
    updated: "blue",
    submitted: "orange",
    verified: "yellow",
    finalized: "indigo",
    deleted: "red",
    approved: "green",
    rejected: "red",
  };
  return colorMap[action] || "gray";
}