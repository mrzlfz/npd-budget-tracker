/**
 * SP2D Workflow Integration Tests
 * 
 * Full end-to-end workflow testing for SP2D creation, distribution calculation,
 * realization updates, and edit/delete operations.
 * 
 * Tests:
 * - SP2D creation with proportional distribution
 * - Realization and sisaPagu updates
 * - Cumulative SP2D handling
 * - Edit operations with recalculation
 * - Soft delete with reversion
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { convexTest } from 'convex-test'
import { api } from '../../_generated/api'
import schema from '../../schema'

describe('SP2D Workflow Integration', () => {
  let t: any

  beforeEach(async () => {
    t = convexTest(schema)
  })

  describe('Complete SP2D Creation Workflow', () => {
    it('should create SP2D with correct proportional distribution and update realizations', async () => {
      // Setup: Create organization, user, RKA accounts, and finalized NPD
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          nama: 'Dinas Kesehatan',
          kode: 'DINKES',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const bendaharaId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Bendahara DINKES',
          email: 'bendahara@dinkes.go.id',
          role: 'bendahara',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create 3 RKA accounts with different pagu amounts
      const account1Id = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Belanja Honorarium',
          pagu: 10000000, // 10M
          sisaPagu: 10000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const account2Id = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.2.01',
          nama: 'Belanja Bahan',
          pagu: 6000000, // 6M
          sisaPagu: 6000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const account3Id = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.2.1.01',
          nama: 'Belanja Perjalanan',
          pagu: 4000000, // 4M
          sisaPagu: 4000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create finalized NPD with 3 lines
      // Total NPD: 20M (10M + 6M + 4M)
      // Proportions: 50%, 30%, 20%
      const npdId = await t.run(async (ctx: any) => {
        const id = await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-SP2D-001',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: bendaharaId,
          finalizedBy: bendaharaId,
          finalizedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId: account1Id,
          jumlah: 10000000,
          keterangan: 'Honorarium',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId: account2Id,
          jumlah: 6000000,
          keterangan: 'Bahan',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId: account3Id,
          jumlah: 4000000,
          keterangan: 'Perjalanan',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        return id
      })

      // Create SP2D for 80% of NPD amount (16M out of 20M)
      const sp2dId = await t.mutation(api.sp2d.create, {
        npdId,
        noSPM: 'SPM-001/2025',
        noSP2D: 'SP2D-001/2025',
        tglSP2D: Date.now(),
        nilaiCair: 16000000, // 80% of 20M
        catatan: 'Pencairan tahap 1',
      })

      expect(sp2dId).toBeDefined()

      // Verify SP2D created
      const sp2d = await t.run(async (ctx: any) => {
        return await ctx.db.get(sp2dId)
      })

      expect(sp2d.nilaiCair).toBe(16000000)
      expect(sp2d.npdId).toBe(npdId)

      // Verify proportional distribution calculated correctly
      // Account 1: 50% of 16M = 8M
      // Account 2: 30% of 16M = 4.8M
      // Account 3: 20% of 16M = 3.2M
      const realizations = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('realizations')
          .filter((q: any) => q.eq(q.field('sp2dId'), sp2dId))
          .collect()
      })

      expect(realizations).toHaveLength(3)

      const real1 = realizations.find((r: any) => r.accountId === account1Id)
      const real2 = realizations.find((r: any) => r.accountId === account2Id)
      const real3 = realizations.find((r: any) => r.accountId === account3Id)

      expect(real1?.jumlah).toBe(8000000) // 50% of 16M
      expect(real2?.jumlah).toBe(4800000) // 30% of 16M
      expect(real3?.jumlah).toBe(3200000) // 20% of 16M

      // Verify sum equals nilaiCair (no rounding error)
      const totalDistributed = realizations.reduce((sum: number, r: any) => sum + r.jumlah, 0)
      expect(totalDistributed).toBe(16000000)

      // Verify rkaAccounts sisaPagu and realisasiTahun updated
      const account1 = await t.run(async (ctx: any) => {
        return await ctx.db.get(account1Id)
      })
      const account2 = await t.run(async (ctx: any) => {
        return await ctx.db.get(account2Id)
      })
      const account3 = await t.run(async (ctx: any) => {
        return await ctx.db.get(account3Id)
      })

      expect(account1.realisasiTahun).toBe(8000000)
      expect(account1.sisaPagu).toBe(2000000) // 10M - 8M

      expect(account2.realisasiTahun).toBe(4800000)
      expect(account2.sisaPagu).toBe(1200000) // 6M - 4.8M

      expect(account3.realisasiTahun).toBe(3200000)
      expect(account3.sisaPagu).toBe(800000) // 4M - 3.2M

      // Verify audit log created
      const auditLog = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('auditLogs')
          .filter((q: any) =>
            q.and(
              q.eq(q.field('entityTable'), 'sp2dRefs'),
              q.eq(q.field('entityId'), sp2dId),
              q.eq(q.field('action'), 'created')
            )
          )
          .first()
      })

      expect(auditLog).toBeDefined()
      expect(auditLog.actorUserId).toBe(bendaharaId)
    })

    it('should handle cumulative SP2D correctly', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          nama: 'Test Org',
          kode: 'TEST',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Bendahara',
          email: 'bendahara@test.com',
          role: 'bendahara',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const accountId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Account',
          pagu: 10000000,
          sisaPagu: 10000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create finalized NPD with 10M
      const npdId = await t.run(async (ctx: any) => {
        const id = await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-CUM-001',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: userId,
          finalizedBy: userId,
          finalizedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId,
          jumlah: 10000000,
          keterangan: 'Line',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        return id
      })

      // Create first SP2D for 4M (40%)
      const sp2d1Id = await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-CUM-001',
        tglSP2D: Date.now(),
        nilaiCair: 4000000,
      })

      // Verify first realization
      let account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.realisasiTahun).toBe(4000000)
      expect(account.sisaPagu).toBe(6000000)

      // Create second SP2D for 3M (30%)
      const sp2d2Id = await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-CUM-002',
        tglSP2D: Date.now(),
        nilaiCair: 3000000,
      })

      // Verify cumulative realization
      account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.realisasiTahun).toBe(7000000) // 4M + 3M
      expect(account.sisaPagu).toBe(3000000) // 10M - 7M

      // Create third SP2D for 2M (20%)
      const sp2d3Id = await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-CUM-003',
        tglSP2D: Date.now(),
        nilaiCair: 2000000,
      })

      // Verify final cumulative realization
      account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.realisasiTahun).toBe(9000000) // 4M + 3M + 2M
      expect(account.sisaPagu).toBe(1000000) // 10M - 9M

      // Verify all SP2D records exist
      const allSp2d = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('sp2dRefs')
          .filter((q: any) => q.eq(q.field('npdId'), npdId))
          .collect()
      })

      expect(allSp2d).toHaveLength(3)
    })
  })

  describe('SP2D Edit Operations', () => {
    it('should recalculate distribution when SP2D is edited', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          nama: 'Test Org',
          kode: 'TEST',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Bendahara',
          email: 'bendahara@test.com',
          role: 'bendahara',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const accountId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Account',
          pagu: 10000000,
          sisaPagu: 10000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const npdId = await t.run(async (ctx: any) => {
        const id = await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-EDIT-001',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: userId,
          finalizedBy: userId,
          finalizedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId,
          jumlah: 10000000,
          keterangan: 'Line',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        return id
      })

      // Create SP2D with 5M
      const sp2dId = await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-EDIT-001',
        tglSP2D: Date.now(),
        nilaiCair: 5000000,
      })

      // Verify initial state
      let account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.realisasiTahun).toBe(5000000)
      expect(account.sisaPagu).toBe(5000000)

      // Edit SP2D to 7M
      await t.mutation(api.sp2d.update, {
        sp2dId,
        noSP2D: 'SP2D-EDIT-001-REV',
        tglSP2D: Date.now(),
        nilaiCair: 7000000, // Changed from 5M to 7M
        catatan: 'Revised amount',
      })

      // Verify updated state
      account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.realisasiTahun).toBe(7000000) // Updated to 7M
      expect(account.sisaPagu).toBe(3000000) // 10M - 7M

      // Verify SP2D updated
      const sp2d = await t.run(async (ctx: any) => {
        return await ctx.db.get(sp2dId)
      })

      expect(sp2d.nilaiCair).toBe(7000000)
      expect(sp2d.noSP2D).toBe('SP2D-EDIT-001-REV')

      // Verify audit log
      const updateLog = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('auditLogs')
          .filter((q: any) =>
            q.and(
              q.eq(q.field('entityTable'), 'sp2dRefs'),
              q.eq(q.field('entityId'), sp2dId),
              q.eq(q.field('action'), 'updated')
            )
          )
          .first()
      })

      expect(updateLog).toBeDefined()
    })
  })

  describe('SP2D Soft Delete Operations', () => {
    it('should revert realizations when SP2D is soft deleted', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          nama: 'Test Org',
          kode: 'TEST',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const adminId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Admin',
          email: 'admin@test.com',
          role: 'admin',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const account1Id = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Account 1',
          pagu: 10000000,
          sisaPagu: 10000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const account2Id = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.2.01',
          nama: 'Account 2',
          pagu: 5000000,
          sisaPagu: 5000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const npdId = await t.run(async (ctx: any) => {
        const id = await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-DEL-001',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: adminId,
          finalizedBy: adminId,
          finalizedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId: account1Id,
          jumlah: 10000000,
          keterangan: 'Line 1',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId: account2Id,
          jumlah: 5000000,
          keterangan: 'Line 2',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        return id
      })

      // Create SP2D for 12M (80% of 15M)
      // Distribution: Account1 = 8M (66.67%), Account2 = 4M (33.33%)
      const sp2dId = await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-DEL-001',
        tglSP2D: Date.now(),
        nilaiCair: 12000000,
      })

      // Verify realizations created
      let account1 = await t.run(async (ctx: any) => {
        return await ctx.db.get(account1Id)
      })
      let account2 = await t.run(async (ctx: any) => {
        return await ctx.db.get(account2Id)
      })

      expect(account1.realisasiTahun).toBe(8000000)
      expect(account1.sisaPagu).toBe(2000000)
      expect(account2.realisasiTahun).toBe(4000000)
      expect(account2.sisaPagu).toBe(1000000)

      // Soft delete SP2D
      await t.mutation(api.sp2d.softDelete, {
        sp2dId,
        reason: 'Error in SP2D, need to recreate',
      })

      // Verify SP2D marked as deleted
      const sp2d = await t.run(async (ctx: any) => {
        return await ctx.db.get(sp2dId)
      })

      expect(sp2d.deletedAt).toBeDefined()
      expect(sp2d.deletedBy).toBe(adminId)

      // Verify realizations reverted
      account1 = await t.run(async (ctx: any) => {
        return await ctx.db.get(account1Id)
      })
      account2 = await t.run(async (ctx: any) => {
        return await ctx.db.get(account2Id)
      })

      expect(account1.realisasiTahun).toBe(0) // Reverted
      expect(account1.sisaPagu).toBe(10000000) // Restored
      expect(account2.realisasiTahun).toBe(0) // Reverted
      expect(account2.sisaPagu).toBe(5000000) // Restored

      // Verify audit log
      const deleteLog = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('auditLogs')
          .filter((q: any) =>
            q.and(
              q.eq(q.field('entityTable'), 'sp2dRefs'),
              q.eq(q.field('entityId'), sp2dId),
              q.eq(q.field('action'), 'soft_deleted')
            )
          )
          .first()
      })

      expect(deleteLog).toBeDefined()
      expect(deleteLog.entityData).toMatchObject({
        reason: 'Error in SP2D, need to recreate',
      })
    })

    it('should restore SP2D and re-apply realizations', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          nama: 'Test Org',
          kode: 'TEST',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const adminId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Admin',
          email: 'admin@test.com',
          role: 'admin',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const accountId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Account',
          pagu: 10000000,
          sisaPagu: 10000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const npdId = await t.run(async (ctx: any) => {
        const id = await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-RESTORE-001',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: adminId,
          finalizedBy: adminId,
          finalizedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId,
          jumlah: 10000000,
          keterangan: 'Line',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        return id
      })

      // Create and delete SP2D
      const sp2dId = await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-RESTORE-001',
        tglSP2D: Date.now(),
        nilaiCair: 6000000,
      })

      await t.mutation(api.sp2d.softDelete, {
        sp2dId,
        reason: 'Test deletion',
      })

      // Verify deleted state
      let account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.realisasiTahun).toBe(0)
      expect(account.sisaPagu).toBe(10000000)

      // Restore SP2D
      await t.mutation(api.sp2d.restore, { sp2dId })

      // Verify SP2D restored
      const sp2d = await t.run(async (ctx: any) => {
        return await ctx.db.get(sp2dId)
      })

      expect(sp2d.deletedAt).toBeUndefined()
      expect(sp2d.deletedBy).toBeUndefined()

      // Verify realizations re-applied
      account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.realisasiTahun).toBe(6000000) // Restored
      expect(account.sisaPagu).toBe(4000000) // Recalculated

      // Verify audit log
      const restoreLog = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('auditLogs')
          .filter((q: any) =>
            q.and(
              q.eq(q.field('entityTable'), 'sp2dRefs'),
              q.eq(q.field('entityId'), sp2dId),
              q.eq(q.field('action'), 'restored')
            )
          )
          .first()
      })

      expect(restoreLog).toBeDefined()
    })
  })

  describe('Data Integrity', () => {
    it('should maintain data integrity throughout SP2D lifecycle', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          nama: 'Test Org',
          kode: 'TEST',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Bendahara',
          email: 'bendahara@test.com',
          role: 'bendahara',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const accountId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Account',
          pagu: 10000000,
          sisaPagu: 10000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const npdId = await t.run(async (ctx: any) => {
        const id = await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-INT-001',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: userId,
          finalizedBy: userId,
          finalizedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId,
          jumlah: 10000000,
          keterangan: 'Line',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        return id
      })

      // Create SP2D
      const sp2dId = await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-INT-001',
        tglSP2D: Date.now(),
        nilaiCair: 7000000,
      })

      // Verify sisaPagu + realisasiTahun = pagu (invariant)
      const account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.sisaPagu + account.realisasiTahun).toBe(account.pagu)

      // Verify realization sum = SP2D nilaiCair
      const realizations = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('realizations')
          .filter((q: any) => q.eq(q.field('sp2dId'), sp2dId))
          .collect()
      })

      const totalRealized = realizations.reduce((sum: number, r: any) => sum + r.jumlah, 0)
      const sp2d = await t.run(async (ctx: any) => {
        return await ctx.db.get(sp2dId)
      })

      expect(totalRealized).toBe(sp2d.nilaiCair)

      // Verify organizationId consistency
      expect(sp2d.organizationId).toBe(orgId)
      realizations.forEach((r: any) => {
        expect(r.organizationId).toBe(orgId)
      })
    })
  })
})

