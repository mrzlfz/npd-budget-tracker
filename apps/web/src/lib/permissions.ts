export type UserRole = 'admin' | 'pptk' | 'bendahara' | 'verifikator' | 'viewer'

export interface Permission {
  action: string
  resource: string
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Full system access
    { action: '*', resource: '*' },
  ],

  pptk: [
    // RKA management
    { action: 'create', resource: 'rka' },
    { action: 'read', resource: 'rka' },
    { action: 'update', resource: 'rka' },
    { action: 'delete', resource: 'rka' },

    // NPD creation and management
    { action: 'create', resource: 'npd' },
    { action: 'read', resource: 'npd' },
    { action: 'update', resource: 'npd' },

    // Performance logging
    { action: 'create', resource: 'performance' },
    { action: 'read', resource: 'performance' },
    { action: 'update', resource: 'performance' },

    // Report generation
    { action: 'read', resource: 'reports' },

    // Profile management
    { action: 'read', resource: 'profile' },
    { action: 'update', resource: 'profile' },
  ],

  bendahara: [
    // NPD management and verification
    { action: 'create', resource: 'npd' },
    { action: 'read', resource: 'npd' },
    { action: 'update', resource: 'npd' },
    { action: 'verify', resource: 'npd' },

    // SP2D management
    { action: 'create', resource: 'sp2d' },
    { action: 'read', resource: 'sp2d' },
    { action: 'update', resource: 'sp2d' },

    // Budget realization
    { action: 'create', resource: 'realisasi' },
    { action: 'read', resource: 'realisasi' },
    { action: 'update', resource: 'realisasi' },

    // RKA read access
    { action: 'read', resource: 'rka' },

    // Report generation
    { action: 'read', resource: 'reports' },

    // Profile management
    { action: 'read', resource: 'profile' },
    { action: 'update', resource: 'profile' },
  ],

  verifikator: [
    // NPD verification and approval
    { action: 'read', resource: 'npd' },
    { action: 'verify', resource: 'npd' },
    { action: 'approve', resource: 'npd' },

    // SP2D verification
    { action: 'read', resource: 'sp2d' },
    { action: 'verify', resource: 'sp2d' },

    // Budget realization read access
    { action: 'read', resource: 'realisasi' },

    // RKA read access
    { action: 'read', resource: 'rka' },

    // Report generation
    { action: 'read', resource: 'reports' },

    // Profile management
    { action: 'read', resource: 'profile' },
    { action: 'update', resource: 'profile' },
  ],

  viewer: [
    // Read-only access to most resources
    { action: 'read', resource: 'rka' },
    { action: 'read', resource: 'npd' },
    { action: 'read', resource: 'sp2d' },
    { action: 'read', resource: 'realisasi' },
    { action: 'read', resource: 'performance' },
    { action: 'read', resource: 'reports' },

    // Profile management
    { action: 'read', resource: 'profile' },
    { action: 'update', resource: 'profile' },
  ],
}

// Permission checking functions
export function hasPermission(
  role: UserRole,
  action: string,
  resource: string
): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []

  return permissions.some(permission =>
    (permission.action === '*' || permission.action === action) &&
    (permission.resource === '*' || permission.resource === resource)
  )
}

export function canCreateRKA(role: UserRole): boolean {
  return hasPermission(role, 'create', 'rka')
}

export function canUpdateRKA(role: UserRole): boolean {
  return hasPermission(role, 'update', 'rka')
}

export function canDeleteRKA(role: UserRole): boolean {
  return hasPermission(role, 'delete', 'rka')
}

export function canCreateNPD(role: UserRole): boolean {
  return hasPermission(role, 'create', 'npd')
}

export function canVerifyNPD(role: UserRole): boolean {
  return hasPermission(role, 'verify', 'npd')
}

export function canApproveNPD(role: UserRole): boolean {
  return hasPermission(role, 'approve', 'npd')
}

export function canCreateSP2D(role: UserRole): boolean {
  return hasPermission(role, 'create', 'sp2d')
}

export function canVerifySP2D(role: UserRole): boolean {
  return hasPermission(role, 'verify', 'sp2d')
}

export function canLogPerformance(role: UserRole): boolean {
  return hasPermission(role, 'create', 'performance')
}

export function canManageRealisasi(role: UserRole): boolean {
  return hasPermission(role, 'update', 'realisasi')
}

export function canViewReports(role: UserRole): boolean {
  return hasPermission(role, 'read', 'reports')
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin'
}

export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: 'Admin OPD',
    pptk: 'PPTK/PPK',
    bendahara: 'Bendahara Pengeluaran',
    verifikator: 'Verifikator Internal',
    viewer: 'Auditor/Viewer',
  }

  return roleNames[role] || role
}

// Menu items based on role
export interface MenuItem {
  key: string
  label: string
  href: string
  icon?: string
  roles: UserRole[]
  children?: MenuItem[]
}

export const ROLE_BASED_MENU_ITEMS: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'Home',
    roles: ['admin', 'pptk', 'bendahara', 'verifikator', 'viewer'],
  },
  {
    key: 'rka',
    label: 'RKA',
    href: '/rka',
    icon: 'FileText',
    roles: ['admin', 'pptk', 'bendahara', 'verifikator', 'viewer'],
  },
  {
    key: 'npd',
    label: 'NPD',
    href: '/npd',
    icon: 'Document',
    roles: ['admin', 'pptk', 'bendahara', 'verifikator', 'viewer'],
  },
  {
    key: 'performance',
    label: 'Performance',
    href: '/performance',
    icon: 'BarChart',
    roles: ['admin', 'pptk', 'bendahara', 'verifikator', 'viewer'],
  },
  {
    key: 'sp2d',
    label: 'SP2D',
    href: '/sp2d',
    icon: 'FileText',
    roles: ['admin', 'bendahara', 'verifikator', 'viewer'],
  },
  {
    key: 'reports',
    label: 'Laporan',
    href: '/reports',
    icon: 'ChartPie',
    roles: ['admin', 'pptk', 'bendahara', 'verifikator', 'viewer'],
  },
  {
    key: 'admin',
    label: 'Admin',
    href: '/admin',
    icon: 'Settings',
    roles: ['admin'],
    children: [
      {
        key: 'users',
        label: 'Pengguna',
        href: '/admin/users',
        roles: ['admin'],
      },
      {
        key: 'organizations',
        label: 'Organisasi',
        href: '/admin/organizations',
        roles: ['admin'],
      },
      {
        key: 'system-settings',
        label: 'Pengaturan',
        href: '/admin/settings',
        roles: ['admin'],
      },
    ],
  },
]

export function getMenuItemsForRole(role: UserRole): MenuItem[] {
  return ROLE_BASED_MENU_ITEMS.filter(item =>
    item.roles.includes(role) || role === 'admin'
  )
}

// Utility to check if user can access a route
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const menuItems = getMenuItemsForRole(role)

  // Check if the path matches any accessible menu item
  return menuItems.some(item => {
    if (pathname.startsWith(item.href)) {
      return true
    }

    // Check children
    if (item.children) {
      return item.children.some(child =>
        pathname.startsWith(child.href)
      )
    }

    return false
  })
}