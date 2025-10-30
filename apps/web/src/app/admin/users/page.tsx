'use client';

import React, { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Table,
  Group,
  Button,
  Badge,
  Select,
  TextInput,
  Stack,
  Modal,
  ActionIcon,
  Pagination,
  Avatar
} from '@mantine/core';
import { IconUsers, IconPlus, IconSearch, IconEdit, IconTrash, IconDots } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName?: string;
  isActive: boolean;
  createdAt: number;
  lastLogin?: number;
}

const ROLES = {
  admin: 'Admin OPD',
  pptk: 'PPTK/PPK',
  bendahara: 'Bendahara Pengeluaran',
  verifikator: 'Verifikator Internal',
  viewer: 'Auditor/Viewer',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState({
    role: '',
    status: '',
    search: '',
  });

  // Mock data - replace with real Convex calls
  const mockUsers: User[] = [
    {
      _id: '1',
      name: 'Ahmad Wijaya',
      email: 'ahmad.wijaya@opd.go.id',
      role: 'admin',
      organizationId: 'org-1',
      organizationName: 'Dinas Pendidikan',
      isActive: true,
      createdAt: Date.now() - 86400000 * 30,
      lastLogin: Date.now() - 86400000,
    },
    {
      _id: '2',
      name: 'Siti Nurhaliza',
      email: 'siti.nurhaliza@opd.go.id',
      role: 'pptk',
      organizationId: 'org-1',
      organizationName: 'Dinas Pendidikan',
      isActive: true,
      createdAt: Date.now() - 86400000 * 15,
      lastLogin: Date.now() - 86400000 * 2,
    },
  ];

  React.useEffect(() => {
    // Filter users based on selected filters
    let filteredUsers = mockUsers.filter(user => {
      if (filter.role && user.role !== filter.role) return false;
      if (filter.status) {
        if (filter.status === 'active' && !user.isActive) return false;
        if (filter.status === 'inactive' && user.isActive) return false;
      }
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        return (
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm)
        );
      }
      return true;
    });
    setUsers(filteredUsers);
  }, [filter, mockUsers]);

  const handleCreateUser = async (userData: Partial<User>) => {
    setIsLoading(true);
    try {
      // API call to Convex would go here
      notifications.show({
        title: 'Berhasil',
        message: `Pengguna ${userData.name} berhasil ditambahkan`,
        color: 'green',
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Gagal menambah pengguna',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      // API call to Convex would go here
      notifications.show({
        title: 'Berhasil',
        message: `Role pengguna berhasil diperbarui menjadi ${ROLES[newRole as keyof typeof ROLES]}`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Gagal memperbarui role pengguna',
        color: 'red',
      });
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      // API call to Convex would go here
      notifications.show({
        title: 'Berhasil',
        message: 'Pengguna berhasil dinonaktifkan',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Gagal menonaktifkan pengguna',
        color: 'red',
      });
    }
  };

  const handleResendInvitation = async (email: string) => {
    try {
      // API call would go here
      notifications.show({
        title: 'Berhasil',
        message: `Undangan dikirim ulang ke ${email}`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Gagal mengirim ulang undangan',
        color: 'red',
      });
    }
  };

  const activeUsersCount = users.filter(u => u.isActive).length;
  const inactiveUsersCount = users.filter(u => !u.isActive).length;

  return (
    <Container size="xl" px="xs">
      <Title order={2}>Manajemen Pengguna</Title>
      <Text c="dimmed" mb="lg">
        Kelola pengguna, peran roles, dan akses ke sistem NPD Tracker.
      </Text>

      {/* Statistics Cards */}
      <Group mb="xl">
        <Card shadow="sm" padding="lg" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">Total Pengguna Aktif</Text>
              <Text size="xl" fw="bold">{activeUsersCount}</Text>
            </div>
            <IconUsers size={48} color="green" />
          </Group>
        </Card>

        <Card shadow="sm" padding="lg" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="sm" c="dimmed">Total Pengguna Non-Aktif</Text>
              <Text size="xl" fw="bold">{inactiveUsersCount}</Text>
            </div>
            <IconUsers size={48} color="gray" />
          </Group>
        </Card>
      </Group>

      {/* Controls */}
      <Card shadow="sm" padding="lg" withBorder mb="xl">
        <Group justify="space-between" mb="lg">
          <Text fw="bold">Filter dan Pencarian</Text>
          <Group>
            <Select
              placeholder="Semua Role"
              data={[
                { value: '', label: 'Semua Role' },
                { value: 'admin', label: 'Admin OPD' },
                { value: 'pptk', label: 'PPTK/PPK' },
                { value: 'bendahara', label: 'Bendahara' },
                { value: 'verifikator', label: 'Verifikator' },
                { value: 'viewer', label: 'Auditor/Viewer' },
              ]}
              value={filter.role}
              onChange={(value: string | null) => setFilter(prev => ({ ...prev, role: value || '' }))}
            />

            <Select
              placeholder="Semua Status"
              data={[
                { value: '', label: 'Semua Status' },
                { value: 'active', label: 'Aktif' },
                { value: 'inactive', label: 'Non-Aktif' },
              ]}
              value={filter.status}
              onChange={(value: string | null) => setFilter(prev => ({ ...prev, status: value || '' }))}
            />

            <TextInput
              placeholder="Cari pengguna..."
              leftSection={<IconSearch size={16} />}
              value={filter.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(prev => ({ ...prev, search: e.currentTarget.value }))}
            />
          </Group>

          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Tambah Pengguna
          </Button>
        </Group>
      </Card>

      {/* Users Table */}
      <Card shadow="sm" padding="lg" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nama</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Terakhir Login</Table.Th>
              <Table.Th>Aksi</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user._id}>
                <Table.Td>
                  <Group>
                    <Avatar size="sm" radius="xl">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </Avatar>
                    <div>
                      <Text fw="bold">{user.name}</Text>
                      <Text size="sm" c="dimmed">{user.email}</Text>
                    </div>
                  </Group>
                </Table.Td>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      user.role === 'admin' ? 'red' :
                      user.role === 'bendahara' ? 'orange' :
                      user.role === 'pptk' ? 'blue' :
                      user.role === 'verifikator' ? 'green' : 'gray'
                    }
                    variant="light"
                  >
                    {ROLES[user.role as keyof typeof ROLES]}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={user.isActive ? 'green' : 'red'}
                    variant="light"
                  >
                    {user.isActive ? 'Aktif' : 'Non-Aktif'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString('id-ID')
                    : '-'
                  }
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="transparent"
                      color="blue"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                    >
                      <IconEdit size={14} />
                    </ActionIcon>

                    <ActionIcon
                      variant="transparent"
                      color="red"
                      size="sm"
                      onClick={() => handleDeactivateUser(user._id)}
                      disabled={user.role === 'admin'} // Can't deactivate admin
                    >
                      <IconTrash size={14} />
                    </ActionIcon>

                    <ActionIcon
                      variant="transparent"
                      color="green"
                      size="sm"
                      onClick={() => handleResendInvitation(user.email)}
                      disabled={user.isActive}
                    >
                      <IconDots size={14} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Pagination */}
      <Group justify="center" mt="xl">
        <Pagination total={100} siblings={3} defaultValue={1} />
      </Group>

      {/* Create User Modal */}
      <Modal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tambah Pengguna Baru"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Nama Lengkap"
            placeholder="Masukkan nama pengguna"
            required
          />
          <TextInput
            label="Email"
            type="email"
            placeholder="email@example.com"
            required
          />
          <Select
            label="Role"
            data={[
              { value: 'pptk', label: 'PPTK/PPK' },
              { value: 'bendahara', label: 'Bendahara Pengeluaran' },
              { value: 'verifikator', label: 'Verifikator Internal' },
              { value: 'viewer', label: 'Auditor/Viewer' },
            ]}
            required
          />

          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={() => handleCreateUser({ name: '', email: '', role: 'pptk' })}>
              Tambah
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}