import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mutation } from '../_generated/server'
import { createMockCtx, setupTestDatabase, mockUsers } from './testUtils'

describe('Authentication Integration Tests', () => {
  let ctx: any

  beforeEach(async () => {
    ctx = createMockCtx(mockUsers[0]._id, 'admin')
    await setupTestDatabase(ctx)
  })

  describe('User Creation and Sync', () => {
    it('should create new user on first sign-in', async () => {
      const newUserData = {
        clerkUserId: 'clerk-new-user',
        email: 'newuser@example.com',
        name: 'New User',
        clerkOrganizationId: 'clerk-new-org',
        organizationName: 'New Organization',
        organizationDescription: 'Test organization',
      }

      // Call the createOrUpdate mutation
      const result = await mutation.users.createOrUpdate(ctx, newUserData)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string') // Should return user ID

      // Verify user was created
      const createdUser = await ctx.db.get(result)
      expect(createdUser?.clerkUserId).toBe(newUserData.clerkUserId)
      expect(createdUser?.email).toBe(newUserData.email)
      expect(createdUser?.name).toBe(newUserData.name)
      expect(createdUser?.role).toBe('viewer') // Default role
    })

    it('should update existing user on subsequent sign-in', async () => {
      // First, create a user
      const initialData = {
        clerkUserId: 'clerk-existing-user',
        email: 'existing@example.com',
        name: 'Existing User',
        clerkOrganizationId: 'clerk-existing-org',
        organizationName: 'Existing Organization',
      }

      const userId = await mutation.users.createOrUpdate(ctx, initialData)
      expect(userId).toBeDefined()

      // Now update the user
      const updatedData = {
        clerkUserId: 'clerk-existing-user',
        email: 'updated@example.com',
        name: 'Updated User Name',
        clerkOrganizationId: 'clerk-existing-org',
        organizationName: 'Updated Organization',
      }

      const updatedUserId = await mutation.users.createOrUpdate(ctx, updatedData)
      expect(updatedUserId).toBe(userId) // Should return same user ID

      // Verify user was updated
      const updatedUser = await ctx.db.get(updatedUserId)
      expect(updatedUser?.email).toBe(updatedData.email)
      expect(updatedUser?.name).toBe(updatedData.name)
    })

    it('should create organization if it does not exist', async () => {
      const newOrgData = {
        clerkUserId: 'clerk-new-org-user',
        email: 'neworg@example.com',
        name: 'New Org User',
        clerkOrganizationId: 'clerk-totally-new-org',
        organizationName: 'Completely New Organization',
      }

      const userId = await mutation.users.createOrUpdate(ctx, newOrgData)

      // Get the user to find their organization
      const user = await ctx.db.get(userId)
      expect(user).toBeDefined()

      const organization = await ctx.db.get(user.organizationId)
      expect(organization?.name).toBe(newOrgData.organizationName)
      expect(organization?.clerkOrganizationId).toBe(newOrgData.clerkOrganizationId)
    })

    it('should reuse existing organization', async () => {
      // Create first user with organization
      const firstUserData = {
        clerkUserId: 'clerk-first-user',
        email: 'first@example.com',
        name: 'First User',
        clerkOrganizationId: 'clerk-shared-org',
        organizationName: 'Shared Organization',
      }

      const firstUserId = await mutation.users.createOrUpdate(ctx, firstUserData)
      const firstUser = await ctx.db.get(firstUserId)
      const organizationId = firstUser.organizationId

      // Create second user with same organization
      const secondUserData = {
        clerkUserId: 'clerk-second-user',
        email: 'second@example.com',
        name: 'Second User',
        clerkOrganizationId: 'clerk-shared-org',
        organizationName: 'Different Name', // Should be ignored
      }

      const secondUserId = await mutation.users.createOrUpdate(ctx, secondUserData)
      const secondUser = await ctx.db.get(secondUserId)

      // Both users should be in the same organization
      expect(secondUser.organizationId).toBe(organizationId)
      expect(secondUser.organizationId).toBe(firstUser.organizationId)
    })
  })

  describe('User Role Management', () => {
    it('should allow admin to update user roles', async () => {
      // Test with admin user
      const adminCtx = createMockCtx(mockUsers[0]._id, 'admin')

      const targetUser = {
        userId: mockUsers[1]._id, // PPTK user
        role: 'bendahara',
      }

      const result = await mutation.users.updateRole(adminCtx, targetUser)
      expect(result).toBeDefined()

      // Verify role was updated
      const updatedUser = await adminCtx.db.get(mockUsers[1]._id)
      expect(updatedUser?.role).toBe('bendahara')
    })

    it('should reject non-admin from updating user roles', async () => {
      // Test with PPTK user
      const pptkCtx = createMockCtx(mockUsers[1]._id, 'pptk')

      const targetUser = {
        userId: mockUsers[2]._id, // Bendahara user
        role: 'admin',
      }

      await expect(
        mutation.users.updateRole(pptkCtx, targetUser)
      ).rejects.toThrow('Access denied')
    })

    it('should prevent self-role modification', async () => {
      const adminCtx = createMockCtx(mockUsers[0]._id, 'admin')

      const targetUser = {
        userId: mockUsers[0]._id, // Try to modify own role
        role: 'pptk',
      }

      // Even admin shouldn't be able to modify their own role through this endpoint
      // (This would be implemented at the application level)
      const result = await mutation.users.updateRole(adminCtx, targetUser)
      expect(result).toBeDefined()

      const updatedUser = await adminCtx.db.get(mockUsers[0]._id)
      expect(updatedUser?.role).toBe('admin') // Should remain unchanged
    })
  })

  describe('Multi-tenant Data Isolation', () => {
    it('should only return users from same organization', async () => {
      const adminCtx = createMockCtx(mockUsers[0]._id, 'admin')

      const users = await mutation.users.list(adminCtx, {})

      // Should only return users from test-org-1
      expect(users.length).toBeGreaterThan(0)
      users.forEach(user => {
        expect(user.organizationId).toBe('test-org-1')
      })
    })

    it('should prevent cross-organization data access', async () => {
      // Create a user in a different organization
      const diffOrgCtx = createMockCtx('diff-user', 'pptk')
      await mutation.users.createOrUpdate(diffOrgCtx, {
        clerkUserId: 'clerk-diff-user',
        email: 'diff@example.com',
        name: 'Different User',
        clerkOrganizationId: 'clerk-diff-org',
        organizationName: 'Different Organization',
      })

      const adminCtx = createMockCtx(mockUsers[0]._id, 'admin')

      // Try to access data from different organization
      await expect(
        adminCtx.db.query('users').withIndex('by_organization', q =>
          q.eq('organizationId', 'diff-org-id')
        ).first()
      ).rejects.toThrow() // Should fail due to auth checks
    })
  })

  describe('Session Management', () => {
    it('should handle invalid session gracefully', async () => {
      // Create context without authentication
      const unauthenticatedCtx = {
        auth: { userId: null },
        db: ctx.db,
      }

      await expect(
        mutation.users.me(unauthenticatedCtx, {})
      ).rejects.toThrow('Not authenticated')
    })

    it('should handle expired session gracefully', async () => {
      // Create context with invalid user ID
      const invalidCtx = createMockCtx('invalid-user-id', 'admin')

      await expect(
        mutation.users.me(invalidCtx, {})
      ).rejects.toThrow('User not found')
    })

    it('should maintain user session context', async () => {
      const adminCtx = createMockCtx(mockUsers[0]._id, 'admin')

      const user = await mutation.users.me(adminCtx, {})

      expect(user).toBeDefined()
      expect(user?._id).toBe(mockUsers[0]._id)
      expect(user?.email).toBe(mockUsers[0].email)
      expect(user?.role).toBe('admin')
      expect(user?.organization).toBeDefined()
    })
  })

  describe('Authentication Edge Cases', () => {
    it('should handle missing user data gracefully', async () => {
      const incompleteData = {
        clerkUserId: 'clerk-incomplete',
        // Missing email, name, etc.
      }

      await expect(
        mutation.users.createOrUpdate(ctx, incompleteData)
      ).rejects.toThrow() // Should validate required fields
    })

    it('should handle duplicate clerk user IDs', async () => {
      // Try to create user with existing clerk ID but different email
      const duplicateData = {
        clerkUserId: mockUsers[0].clerkUserId, // Same clerk ID as existing user
        email: 'different@example.com',
        name: 'Different User',
        clerkOrganizationId: 'clerk-new-org',
        organizationName: 'New Org',
      }

      await expect(
        mutation.users.createOrUpdate(ctx, duplicateData)
      ).resolves.toBeDefined() // Should update existing user
    })

    it('should validate role values', async () => {
      const adminCtx = createMockCtx(mockUsers[0]._id, 'admin')

      await expect(
        mutation.users.updateRole(adminCtx, {
          userId: mockUsers[1]._id,
          role: 'invalid-role', // Invalid role
        })
      ).rejects.toThrow() // Should validate role enum
    })
  })

  describe('Authentication Flow Integration', () => {
    it('should complete full authentication flow', async () => {
      // Simulate complete authentication flow
      const authFlowData = {
        clerkUserId: 'clerk-flow-user',
        email: 'flow@example.com',
        name: 'Flow User',
        clerkOrganizationId: 'clerk-flow-org',
        organizationName: 'Flow Organization',
      }

      // Step 1: Create user and organization
      const userId = await mutation.users.createOrUpdate(ctx, authFlowData)
      expect(userId).toBeDefined()

      // Step 2: Verify user profile
      const user = await mutation.users.me(createMockCtx(userId, 'admin'), {})
      expect(user?.email).toBe(authFlowData.email)
      expect(user?.role).toBe('viewer') // Default role

      // Step 3: Admin updates role
      const adminCtx = createMockCtx(mockUsers[0]._id, 'admin')
      await mutation.users.updateRole(adminCtx, {
        userId: userId,
        role: 'pptk',
      })

      // Step 4: Verify role update
      const updatedUser = await ctx.db.get(userId)
      expect(updatedUser?.role).toBe('pptk')
    })

    it('should handle concurrent sign-in attempts', async () => {
      // Simulate multiple concurrent sign-ins for same user
      const userData = {
        clerkUserId: 'clerk-concurrent-user',
        email: 'concurrent@example.com',
        name: 'Concurrent User',
        clerkOrganizationId: 'clerk-concurrent-org',
        organizationName: 'Concurrent Organization',
      }

      // Create multiple concurrent requests
      const promises = [
        mutation.users.createOrUpdate(ctx, userData),
        mutation.users.createOrUpdate(ctx, userData),
        mutation.users.createOrUpdate(ctx, userData),
      ]

      const results = await Promise.all(promises)

      // All should return the same user ID (idempotent operation)
      const uniqueIds = new Set(results)
      expect(uniqueIds.size).toBe(1)
    })
  })
})