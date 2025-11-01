'use client'

import { useState } from 'react'
import {
  AppShell,
  Text,
  Group,
  ThemeIcon,
  UnstyledButton,
  Avatar,
  Menu,
  Divider,
  ScrollArea,
  Collapse,
  Tooltip,
  Badge,
  Stack,
} from '@mantine/core'

const Navbar = AppShell.Navbar
import {
  IconHome,
  IconFileText,
  IconChartBar,
  IconChartPie,
  IconSettings,
  IconUsers,
  IconBuilding,
  IconAdjustments,
  IconLogout,
  IconChevronDown,
  IconChevronRight,
  IconUser,
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/lib/store'
import { setActiveNav, setSidebarOpen, toggleSidebar } from '@/lib/uiSlice'
import { getMenuItemsForRole, getRoleDisplayName } from '@/lib/permissions'
import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency } from '@/lib/utils/format'

interface NavItemProps {
  item: any
  active?: boolean
  onClick?: () => void
  level?: number
}

function NavItem({ item, active = false, onClick, level = 0 }: NavItemProps) {
  const [opened, setOpened] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const router = useRouter()

  const handleClick = () => {
    if (hasChildren) {
      setOpened(!opened)
    } else {
      router.push(item.href)
      onClick?.()
    }
  }

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Home: IconHome,
      FileText: IconFileText,
      Document: IconFileText,
      BarChart: IconChartBar,
      ChartPie: IconChartPie,
      Settings: IconSettings,
      Users: IconUsers,
      Building: IconBuilding,
      Adjustments: IconAdjustments,
      User: IconUser,
    }
    return icons[iconName] || IconFileText
  }

  return (
    <>
      <UnstyledButton
        onClick={handleClick}
        w="100%"
        py="sm"
        px={`${level * 16 + 16}px`}
        style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: '4px',
          backgroundColor: active ? '#e3f2fd' : 'transparent',
          color: active ? '#1976d2' : '#64748b',
          '&:hover': {
            backgroundColor: active ? '#e3f2fd' : '#f8fafc',
            color: '#1976d2',
          },
        }}
      >
        <Group gap="sm" justify="space-between" w="100%">
          <Group gap="sm">
            <ThemeIcon variant="transparent" size={level > 0 ? 16 : 20}>
              {getIcon(item.icon)}
            </ThemeIcon>
            <Text size={level > 0 ? 'sm' : 'md'} fw={active ? 600 : 400}>
              {item.label}
            </Text>
          </Group>

          {hasChildren && (
            <ThemeIcon variant="transparent" size={14}>
              {opened ? <IconChevronDown /> : <IconChevronRight />}
            </ThemeIcon>
          )}
        </Group>
      </UnstyledButton>

      {hasChildren && (
        <Collapse in={opened}>
          <Group gap="xs" p="sm">
            {item.children.map((child: any) => (
              <UnstyledButton
                key={child.key}
                onClick={() => router.push(child.href)}
                w="100%"
                py="xs"
                px={`${(level + 1) * 16 + 16}px`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                  backgroundColor: child.href === window.location.pathname ? '#e3f2fd' : 'transparent',
                  color: child.href === window.location.pathname ? '#1976d2' : '#64748b',
                  '&:hover': {
                    backgroundColor: child.href === window.location.pathname ? '#e3f2fd' : '#f8fafc',
                    color: '#1976d2',
                  },
                }}
              >
                <Group gap="sm">
                  <ThemeIcon variant="transparent" size={14}>
                    {getIcon(child.icon)}
                  </ThemeIcon>
                  <Text size="sm" fw={child.href === window.location.pathname ? 600 : 400}>
                    {child.label}
                  </Text>
                </Group>
              </UnstyledButton>
            ))}
          </Group>
        </Collapse>
      )}
    </>
  )
}

interface UserMenuProps {
  user: any
  onLogout: () => void
}

function UserMenu({ user, onLogout }: UserMenuProps) {
  const { role } = usePermissions()

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <UnstyledButton>
          <Group gap="sm">
            <Avatar size="sm" radius="xl">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <div>
              <Text size="sm" fw={600}>{user.name || 'User'}</Text>
              <Text size="xs" c="dimmed">{getRoleDisplayName(role!)}</Text>
            </div>
            <ThemeIcon variant="transparent" size={14}>
              <IconChevronDown />
            </ThemeIcon>
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconUser size={14} />}
          onClick={() => {
            // Navigate to profile
            window.location.href = '/profile'
          }}
        >
          Profil Saya
        </Menu.Item>

        <Menu.Item
          leftSection={<IconSettings size={14} />}
          onClick={() => {
            // Navigate to settings
            window.location.href = '/settings'
          }}
        >
          Pengaturan
        </Menu.Item>

        <Divider />

        <Menu.Item
          leftSection={<IconLogout size={14} />}
          color="red"
          onClick={onLogout}
        >
          Keluar
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

interface NavigationProps {
  onLogout: () => void
}

export function Navigation({ onLogout }: NavigationProps) {
  const dispatch = useAppDispatch()
  const { sidebarOpen, activeNav } = useAppSelector(state => state.ui)
  const { currentUser } = useAppSelector(state => state.auth)
  const { role } = usePermissions()
  const router = useRouter()

  const menuItems = role ? getMenuItemsForRole(role) : []

  const handleNavClick = (item: any) => {
    dispatch(setActiveNav(item.key))
    router.push(item.href)
  }

  return (
    <Navbar p="md" hiddenBreakpoint="sm" width={{ sm: 250, lg: 280 }}>
      <Navbar.Section>
        {/* User Profile */}
        {currentUser && (
          <UserMenu
            user={currentUser}
            onLogout={onLogout}
          />
        )}

        <Divider my="md" />

        {/* Organization Info */}
        {currentUser.organizationName && (
          <Group mb="md">
            <ThemeIcon variant="light" color="blue" size={20}>
              <IconBuilding />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">Organisasi</Text>
              <Text size="sm" fw={600}>{currentUser.organizationName}</Text>
            </div>
          </Group>
        )}
      </Navbar.Section>

      <Navbar.Section grow>
        <ScrollArea h="calc(100vh - 200px)" offsetScrollbars>
          <Stack gap={4}>
            {menuItems.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                active={activeNav === item.key}
                onClick={() => handleNavClick(item)}
              />
            ))}
          </Stack>
        </ScrollArea>
      </Navbar.Section>

      <Navbar.Section>
        {/* Sidebar Toggle for Desktop */}
        <Group justify="center" p="sm">
          <Tooltip label="Toggle Sidebar" withArrow>
            <UnstyledButton
              onClick={() => dispatch(toggleSidebar())}
              p="xs"
            >
              <ThemeIcon variant="transparent" size={16}>
                <IconAdjustments />
              </ThemeIcon>
            </UnstyledButton>
          </Tooltip>
        </Group>
      </Navbar.Section>
    </Navbar>
  )
}