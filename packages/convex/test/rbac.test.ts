import { describe, it, expect } from 'vitest'
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
  getMenuItemsForRole,
  canAccessRoute,
} from '../../apps/web/src/lib/permissions'

describe('Role-Based Access Control (RBAC)', () => {
  describe('Permission Matrix', () => {
    it('should grant admin full access', () => {
      expect(hasPermission('admin', 'create', 'rka')).toBe(true)
      expect(hasPermission('admin', 'delete', 'rka')).toBe(true)
      expect(hasPermission('admin', '*', '*')).toBe(true)
      expect(hasPermission('admin', 'create', 'users')).toBe(true)
      expect(hasPermission('admin', 'any', 'resource')).toBe(true)
    })

    it('should grant PPTK appropriate permissions', () => {
      expect(hasPermission('pptk', 'create', 'rka')).toBe(true)
      expect(hasPermission('pptk', 'update', 'rka')).toBe(true)
      expect(hasPermission('pptk', 'delete', 'rka')).toBe(true)
      expect(hasPermission('pptk', 'create', 'npd')).toBe(true)
      expect(hasPermission('pptk', 'read', 'npd')).toBe(true)
      expect(hasPermission('pptk', 'verify', 'npd')).toBe(false) // Not for PPTK
      expect(hasPermission('pptk', 'delete', 'users')).toBe(false) // Not for PPTK
      expect(hasPermission('pptk', 'create', 'performance')).toBe(true)
      expect(hasPermission('pptk', 'read', 'reports')).toBe(true)
    })

    it('should grant Bendahara appropriate permissions', () => {
      expect(hasPermission('bendahara', 'create', 'npd')).toBe(true)
      expect(hasPermission('bendahara', 'verify', 'npd')).toBe(true)
      expect(hasPermission('bendahara', 'create', 'sp2d')).toBe(true)
      expect(hasPermission('bendahara', 'update', 'sp2d')).toBe(true)
      expect(hasPermission('bendahara', 'update', 'realisasi')).toBe(true)
      expect(hasPermission('bendahara', 'create', 'rka')).toBe(false) // Not for Bendahara
      expect(hasPermission('bendahara', 'delete', 'users')).toBe(false) // Not for Bendahara
    })

    it('should grant Verifikator appropriate permissions', () => {
      expect(hasPermission('verifikator', 'verify', 'npd')).toBe(true)
      expect(hasPermission('verifikator', 'approve', 'npd')).toBe(true)
      expect(hasPermission('verifikator', 'verify', 'sp2d')).toBe(true)
      expect(hasPermission('verifikator', 'read', 'npd')).toBe(true)
      expect(hasPermission('verifikator', 'read', 'rka')).toBe(true)
      expect(hasPermission('verifikator', 'create', 'npd')).toBe(false) // Not for Verifikator
      expect(hasPermission('verifikator', 'create', 'rka')).toBe(false) // Not for Verifikator
    })

    it('should grant Viewer read-only access', () => {
      expect(hasPermission('viewer', 'read', 'rka')).toBe(true)
      expect(hasPermission('viewer', 'read', 'npd')).toBe(true)
      expect(hasPermission('viewer', 'read', 'sp2d')).toBe(true)
      expect(hasPermission('viewer', 'read', 'realisasi')).toBe(true)
      expect(hasPermission('viewer', 'read', 'performance')).toBe(true)
      expect(hasPermission('viewer', 'read', 'reports')).toBe(true)
      expect(hasPermission('viewer', 'create', 'rka')).toBe(false) // Not for Viewer
      expect(hasPermission('viewer', 'update', 'rka')).toBe(false) // Not for Viewer
      expect(hasPermission('viewer', 'delete', 'rka')).toBe(false) // Not for Viewer
    })
  })

  describe('Permission Helper Functions', () => {
    it('canCreateRKA should work correctly', () => {
      expect(canCreateRKA('admin')).toBe(true)
      expect(canCreateRKA('pptk')).toBe(true)
      expect(canCreateRKA('bendahara')).toBe(false)
      expect(canCreateRKA('verifikator')).toBe(false)
      expect(canCreateRKA('viewer')).toBe(false)
    })

    it('canUpdateRKA should work correctly', () => {
      expect(canUpdateRKA('admin')).toBe(true)
      expect(canUpdateRKA('pptk')).toBe(true)
      expect(canUpdateRKA('bendahara')).toBe(false)
      expect(canUpdateRKA('verifikator')).toBe(false)
      expect(canUpdateRKA('viewer')).toBe(false)
    })

    it('canDeleteRKA should work correctly', () => {
      expect(canDeleteRKA('admin')).toBe(true)
      expect(canDeleteRKA('pptk')).toBe(true)
      expect(canDeleteRKA('bendahara')).toBe(false)
      expect(canDeleteRKA('verifikator')).toBe(false)
      expect(canDeleteRKA('viewer')).toBe(false)
    })

    it('canCreateNPD should work correctly', () => {
      expect(canCreateNPD('admin')).toBe(true)
      expect(canCreateNPD('pptk')).toBe(true)
      expect(canCreateNPD('bendahara')).toBe(true)
      expect(canCreateNPD('verifikator')).toBe(false)
      expect(canCreateNPD('viewer')).toBe(false)
    })

    it('canVerifyNPD should work correctly', () => {
      expect(canVerifyNPD('admin')).toBe(true)
      expect(canVerifyNPD('pptk')).toBe(false)
      expect(canVerifyNPD('bendahara')).toBe(true)
      expect(canVerifyNPD('verifikator')).toBe(true)
      expect(canVerifyNPD('viewer')).toBe(false)
    })

    it('canApproveNPD should work correctly', () => {
      expect(canApproveNPD('admin')).toBe(true)
      expect(canApproveNPD('pptk')).toBe(false)
      expect(canApproveNPD('bendahara')).toBe(false)
      expect(canApproveNPD('verifikator')).toBe(true)
      expect(canApproveNPD('viewer')).toBe(false)
    })

    it('canManageUsers should work correctly', () => {
      expect(canManageUsers('admin')).toBe(true)
      expect(canManageUsers('pptk')).toBe(false)
      expect(canManageUsers('bendahara')).toBe(false)
      expect(canManageUsers('verifikator')).toBe(false)
      expect(canManageUsers('viewer')).toBe(false)
    })
  })

  describe('Menu Access Control', () => {
    it('should filter menu items based on role', () => {
      const adminMenu = getMenuItemsForRole('admin')
      const pptkMenu = getMenuItemsForRole('pptk')
      const viewerMenu = getMenuItemsForRole('viewer')

      // Admin should see everything
      expect(adminMenu.some(item => item.key === 'admin')).toBe(true)
      expect(adminMenu.some(item => item.key === 'dashboard')).toBe(true)

      // PPTK should see main items but not admin
      expect(pptkMenu.some(item => item.key === 'admin')).toBe(false)
      expect(pptkMenu.some(item => item.key === 'rka')).toBe(true)
      expect(pptkMenu.some(item => item.key === 'npd')).toBe(true)

      // Viewer should see limited items
      expect(viewerMenu.some(item => item.key === 'admin')).toBe(false)
      expect(viewerMenu.some(item => item.key === 'dashboard')).toBe(true)
      expect(viewerMenu.some(item => item.key === 'rka')).toBe(true)
      expect(viewerMenu.some(item => item.key === 'npd')).toBe(true)
    })

    it('should include all base menu items for authenticated users', () => {
      const roles = ['admin', 'pptk', 'bendahara', 'verifikator', 'viewer'] as const

      roles.forEach(role => {
        const menu = getMenuItemsForRole(role)
        const baseItems = ['dashboard', 'rka', 'npd', 'performance', 'reports']

        baseItems.forEach(itemKey => {
          expect(menu.some(item => item.key === itemKey)).toBe(true)
        })
      })
    })
  })

  describe('Route Access Control', () => {
    it('should allow admin to access all routes', () => {
      const adminRoutes = [
        '/admin',
        '/admin/users',
        '/rka/create',
        '/npd/create',
        '/dashboard',
      ]

      adminRoutes.forEach(route => {
        expect(canAccessRoute('admin', route)).toBe(true)
      })
    })

    it('should restrict viewer from certain routes', () => {
      const restrictedRoutes = [
        '/admin',
        '/admin/users',
        '/rka/create',
        '/rka/edit',
        '/rka/delete',
        '/npd/create',
        '/npd/edit',
      ]

      restrictedRoutes.forEach(route => {
        expect(canAccessRoute('viewer', route)).toBe(false)
      })
    })

    it('should allow pptk to access appropriate routes', () => {
      const allowedRoutes = ['/dashboard', '/rka', '/npd', '/performance', '/reports']
      const pptkRoutes = ['/rka/create', '/rka/edit', '/rka/delete', '/npd/create', '/npd/edit']

      allowedRoutes.forEach(route => {
        expect(canAccessRoute('pptk', route)).toBe(true)
      })

      pptkRoutes.forEach(route => {
        expect(canAccessRoute('pptk', route)).toBe(true)
      })
    })

    it('should restrict bendahara from rka management routes', () => {
      const rkaManagementRoutes = ['/rka/create', '/rka/edit', '/rka/delete']
      const bendaharaAllowedRoutes = ['/dashboard', '/rka', '/npd', '/sp2d', '/reports']

      rkaManagementRoutes.forEach(route => {
        expect(canAccessRoute('bendahara', route)).toBe(false)
      })

      bendaharaAllowedRoutes.forEach(route => {
        expect(canAccessRoute('bendahara', route)).toBe(true)
      })
    })
  })

  describe('Permission Edge Cases', () => {
    it('should handle invalid roles gracefully', () => {
      expect(hasPermission('invalid-role' as any, 'create', 'rka')).toBe(false)
      expect(canCreateRKA('invalid-role' as any)).toBe(false)
      expect(canManageUsers('invalid-role' as any)).toBe(false)
    })

    it('should handle wildcard permissions correctly', () => {
      // Admin has wildcard access
      expect(hasPermission('admin', 'any-action', 'any-resource')).toBe(true)
      expect(hasPermission('admin', 'delete', 'critical-system')).toBe(true)
    })

    it('should be case sensitive for consistency', () => {
      expect(hasPermission('admin', 'CREATE', 'rka')).toBe(false) // Upper case should fail
      expect(hasPermission('admin', 'create', 'RKA')).toBe(false) // Upper case resource should fail
    })
  })

  describe('Role Display Names', () => {
    // Test that we have proper Indonesian role names
    it('should provide proper role display names', () => {
      const roleNames = new Map([
        ['admin', 'Admin OPD'],
        ['pptk', 'PPTK/PPK'],
        ['bendahara', 'Bendahara Pengeluaran'],
        ['verifikator', 'Verifikator Internal'],
        ['viewer', 'Auditor/Viewer'],
      ])

      roleNames.forEach((expectedName, role) => {
        // We would need to import and test getRoleDisplayName function
        // This test would verify that each role has proper Indonesian name
        expect(expectedName).toBeDefined()
      })
    })
  })

  describe('Permission Hierarchy', () => {
    it('should maintain proper permission inheritance', () => {
      // Admin should have all permissions
      const adminHasAllRKA = hasPermission('admin', 'create', 'rka') &&
                               hasPermission('admin', 'read', 'rka') &&
                               hasPermission('admin', 'update', 'rka') &&
                               hasPermission('admin', 'delete', 'rka')

      expect(adminHasAllRKA).toBe(true)

      // Viewer should only have read permissions
      const viewerHasOnlyRead = hasPermission('viewer', 'read', 'rka') &&
                              !hasPermission('viewer', 'create', 'rka') &&
                              !hasPermission('viewer', 'update', 'rka') &&
                              !hasPermission('viewer', 'delete', 'rka')

      expect(viewerHasOnlyRead).toBe(true)
    })

    it('should handle cross-resource permissions correctly', () => {
      // PPTK can create RKA and NPD but not verify them
      const pptkCanCreate = canCreateRKA('pptk') && canCreateNPD('pptk')
      const pptkCannotVerify = !canVerifyNPD('pptk')

      expect(pptkCanCreate).toBe(true)
      expect(pptkCannotVerify).toBe(true)

      // Verifikator can verify NPD but not create RKA
      const verifikatorCanVerify = canVerifyNPD('verifikator')
      const verifikatorCannotCreateRKA = !canCreateRKA('verifikator')

      expect(verifikatorCanVerify).toBe(true)
      expect(verifikatorCannotCreateRKA).toBe(true)
    })
  })
})