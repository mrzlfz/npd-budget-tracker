'use client'

import React from 'react'
import { useAppSelector } from '@/lib/store'
import type { UserRole } from '@/lib/permissions'
import {
  hasPermission,
  canCreateRKA,
  canUpdateRKA,
  canDeleteRKA,
  canCreateNPD,
  canVerifyNPD,
  canApproveNPD,
  canCreateSP2D,
  canVerifySP2D,
  canLogPerformance,
  canManageRealisasi,
  canViewReports,
  canManageUsers,
} from '@/lib/permissions'

export function usePermissions() {
  const { currentUser } = useAppSelector(state => state.auth)
  const role = currentUser?.role

  return {
    role,
    isAdmin: role === 'admin',
    isPPTK: role === 'pptk',
    isBendahara: role === 'bendahara',
    isVerifikator: role === 'verifikator',
    isViewer: role === 'viewer',

    // Permission checks
    canCreateRKA: role ? canCreateRKA(role) : false,
    canUpdateRKA: role ? canUpdateRKA(role) : false,
    canDeleteRKA: role ? canDeleteRKA(role) : false,
    canCreateNPD: role ? canCreateNPD(role) : false,
    canVerifyNPD: role ? canVerifyNPD(role) : false,
    canApproveNPD: role ? canApproveNPD(role) : false,
    canCreateSP2D: role ? canCreateSP2D(role) : false,
    canVerifySP2D: role ? canVerifySP2D(role) : false,
    canLogPerformance: role ? canLogPerformance(role) : false,
    canManageRealisasi: role ? canManageRealisasi(role) : false,
    canViewReports: role ? canViewReports(role) : false,
    canManageUsers: role ? canManageUsers(role) : false,

    // Generic permission check
    hasPermission: (action: string, resource: string) =>
      role ? hasPermission(role, action, resource) : false,
  }
}

// Component to conditionally render based on permissions
interface PermissionGuardProps {
  role?: UserRole
  permission?: { action: string; resource: string }
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({ role, permission, fallback = null, children }: PermissionGuardProps) {
  const { currentUser } = useAppSelector(state => state.auth)
  const userRole = currentUser?.role

  if (!userRole) {
    return fallback as React.ReactElement
  }

  // Check specific role
  if (role && userRole !== role) {
    return fallback as React.ReactElement
  }

  // Check specific permission
  if (permission && !hasPermission(userRole, permission.action, permission.resource)) {
    return fallback as React.ReactElement
  }

  return children as React.ReactElement
}

// Higher-order component for permission-based rendering
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: { action: string; resource: string }
) {
  const WithPermissionComponent: React.FC<P> = (props: P) => {
    return React.createElement(
      PermissionGuard,
      { permission: requiredPermission },
      React.createElement(WrappedComponent, props)
    )
  }
  return WithPermissionComponent
}

// Higher-order component for role-based rendering
export function withRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole: UserRole
) {
  const WithRoleComponent: React.FC<P> = (props: P) => {
    return React.createElement(
      PermissionGuard,
      { role: requiredRole },
      React.createElement(WrappedComponent, props)
    )
  }
  return WithRoleComponent
}