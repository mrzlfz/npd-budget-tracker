/**
 * SP2D Distribution Logic Unit Tests
 * 
 * Tests proportional distribution calculation, rounding, validation,
 * and realization updates for SP2D (Surat Perintah Pencairan Dana).
 * 
 * Target Coverage: 80%+
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { convexTest } from 'convex-test'
import { api } from '../_generated/api'
import schema from '../schema'

describe('SP2D Distribution Logic', () => {
  let t: any

  beforeEach(async () => {
    t = convexTest(schema)
  })

  describe('Proportional Distribution Calculation', () => {
    it('should calculate proportional distribution correctly for single line NPD', async () => {
      // Setup: Create organization, user, RKA, NPD with single line
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST001',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test Bendahara',
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
          nama: 'Belanja Pegawai',
          pagu: 10000000,
          sisaPagu: 10000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const npdId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-001',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const lineId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdLines', {
          npdId,
          accountId,
          jumlah: 5000000,
          keterangan: 'Test line',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Create SP2D with 100% of NPD amount
      const sp2dId = await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-001',
        tglSP2D: Date.now(),
        nilaiCair: 5000000,
      })

      // Verify: Single line gets 100% of distribution
      const realizations = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('realizations')
          .filter((q: any) => q.eq(q.field('sp2dId'), sp2dId))
          .collect()
      })

      expect(realizations).toHaveLength(1)
      expect(realizations[0].jumlah).toBe(5000000)
      expect(realizations[0].accountId).toBe(accountId)
    })

    it('should calculate proportional distribution correctly for multiple lines', async () => {
      // Setup: NPD with 3 lines (50%, 30%, 20% distribution)
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST002',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test Bendahara',
          email: 'bendahara@test.com',
          role: 'bendahara',
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
          kode: '5.1.1.02',
          nama: 'Account 2',
          pagu: 10000000,
          sisaPagu: 10000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const account3Id = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.03',
          nama: 'Account 3',
          pagu: 10000000,
          sisaPagu: 10000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const npdId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-002',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Line 1: 5M (50% of 10M total)
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdLines', {
          npdId,
          accountId: account1Id,
          jumlah: 5000000,
          keterangan: 'Line 1',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Line 2: 3M (30% of 10M total)
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdLines', {
          npdId,
          accountId: account2Id,
          jumlah: 3000000,
          keterangan: 'Line 2',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Line 3: 2M (20% of 10M total)
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdLines', {
          npdId,
          accountId: account3Id,
          jumlah: 2000000,
          keterangan: 'Line 3',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Create SP2D with 8M (80% of NPD)
      const sp2dId = await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-002',
        tglSP2D: Date.now(),
        nilaiCair: 8000000,
      })

      // Verify: Distribution is proportional
      const realizations = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('realizations')
          .filter((q: any) => q.eq(q.field('sp2dId'), sp2dId))
          .collect()
      })

      expect(realizations).toHaveLength(3)

      // Find realization for each account
      const real1 = realizations.find((r: any) => r.accountId === account1Id)
      const real2 = realizations.find((r: any) => r.accountId === account2Id)
      const real3 = realizations.find((r: any) => r.accountId === account3Id)

      // Account 1: 50% of 8M = 4M
      expect(real1?.jumlah).toBe(4000000)
      // Account 2: 30% of 8M = 2.4M
      expect(real2?.jumlah).toBe(2400000)
      // Account 3: 20% of 8M = 1.6M
      expect(real3?.jumlah).toBe(1600000)

      // Verify sum equals nilaiCair
      const totalDistributed = realizations.reduce((sum: number, r: any) => sum + r.jumlah, 0)
      expect(totalDistributed).toBe(8000000)
    })

    it('should handle rounding errors correctly (sum must equal nilaiCair)', async () => {
      // Setup: NPD with 3 lines that would cause rounding issues
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST003',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test Bendahara',
          email: 'bendahara@test.com',
          role: 'bendahara',
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
          kode: '5.1.1.02',
          nama: 'Account 2',
          pagu: 10000000,
          sisaPagu: 10000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const account3Id = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.03',
          nama: 'Account 3',
          pagu: 10000000,
          sisaPagu: 10000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const npdId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-003',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Lines with amounts that cause rounding: 3333333, 3333333, 3333334
      await t.run(async (ctx: any) => {
        await ctx.db.insert('npdLines', {
          npdId,
          accountId: account1Id,
          jumlah: 3333333,
          keterangan: 'Line 1',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        await ctx.db.insert('npdLines', {
          npdId,
          accountId: account2Id,
          jumlah: 3333333,
          keterangan: 'Line 2',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        await ctx.db.insert('npdLines', {
          npdId,
          accountId: account3Id,
          jumlah: 3333334,
          keterangan: 'Line 3',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Create SP2D with amount that would cause rounding issues
      const sp2dId = await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-003',
        tglSP2D: Date.now(),
        nilaiCair: 7777777, // Not evenly divisible
      })

      // Verify: Sum equals exactly nilaiCair (no rounding error)
      const realizations = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('realizations')
          .filter((q: any) => q.eq(q.field('sp2dId'), sp2dId))
          .collect()
      })

      const totalDistributed = realizations.reduce((sum: number, r: any) => sum + r.jumlah, 0)
      expect(totalDistributed).toBe(7777777) // Exact match, no rounding error
    })
  })

  describe('Validation', () => {
    it('should reject SP2D amount exceeding NPD total', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST004',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test Bendahara',
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
        return await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-004',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdLines', {
          npdId,
          accountId,
          jumlah: 5000000, // NPD total: 5M
          keterangan: 'Line',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Try to create SP2D with 6M (exceeds 5M NPD total)
      await expect(
        t.mutation(api.sp2d.create, {
          npdId,
          noSP2D: 'SP2D-004',
          tglSP2D: Date.now(),
          nilaiCair: 6000000, // Exceeds NPD total
        })
      ).rejects.toThrow(/cannot exceed total NPD amount/)
    })

    it('should reject SP2D for non-finalized NPD', async () => {
      // Setup: NPD in draft status
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST005',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test Bendahara',
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
        return await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-005',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'draft', // Not finalized
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdLines', {
          npdId,
          accountId,
          jumlah: 5000000,
          keterangan: 'Line',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Try to create SP2D for draft NPD
      await expect(
        t.mutation(api.sp2d.create, {
          npdId,
          noSP2D: 'SP2D-005',
          tglSP2D: Date.now(),
          nilaiCair: 3000000,
        })
      ).rejects.toThrow(/finalized NPDs/)
    })

    it('should reject duplicate SP2D number', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST006',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test Bendahara',
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
        return await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-006',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdLines', {
          npdId,
          accountId,
          jumlah: 5000000,
          keterangan: 'Line',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create first SP2D
      await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-DUPLICATE',
        tglSP2D: Date.now(),
        nilaiCair: 2000000,
      })

      // Test: Try to create second SP2D with same number
      await expect(
        t.mutation(api.sp2d.create, {
          npdId,
          noSP2D: 'SP2D-DUPLICATE', // Duplicate
          tglSP2D: Date.now(),
          nilaiCair: 1000000,
        })
      ).rejects.toThrow(/sudah ada/)
    })
  })

  describe('Realization Updates', () => {
    it('should update sisaPagu correctly after SP2D creation', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST007',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test Bendahara',
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
          sisaPagu: 10000000, // Initial: 10M
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const npdId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-007',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdLines', {
          npdId,
          accountId,
          jumlah: 5000000,
          keterangan: 'Line',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Create SP2D with 3M
      await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-007',
        tglSP2D: Date.now(),
        nilaiCair: 3000000,
      })

      // Verify: sisaPagu reduced by 3M (10M - 3M = 7M)
      const account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.sisaPagu).toBe(7000000)
      expect(account.realisasiTahun).toBe(3000000)
    })

    it('should handle cumulative realizations for multiple SP2D', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST008',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test Bendahara',
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
        return await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-008',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdLines', {
          npdId,
          accountId,
          jumlah: 8000000,
          keterangan: 'Line',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Create first SP2D with 3M
      await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-008-1',
        tglSP2D: Date.now(),
        nilaiCair: 3000000,
      })

      // Create second SP2D with 2M
      await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-008-2',
        tglSP2D: Date.now(),
        nilaiCair: 2000000,
      })

      // Create third SP2D with 1M
      await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-008-3',
        tglSP2D: Date.now(),
        nilaiCair: 1000000,
      })

      // Verify: Cumulative realization = 6M, sisaPagu = 4M
      const account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.realisasiTahun).toBe(6000000) // 3M + 2M + 1M
      expect(account.sisaPagu).toBe(4000000) // 10M - 6M
    })
  })

  describe('SP2D Edit and Delete', () => {
    it('should recalculate distribution when SP2D is updated', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST009',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test Bendahara',
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
        return await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-009',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdLines', {
          npdId,
          accountId,
          jumlah: 5000000,
          keterangan: 'Line',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create SP2D with 2M
      const sp2dId = await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-009',
        tglSP2D: Date.now(),
        nilaiCair: 2000000,
      })

      // Verify initial state
      let account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })
      expect(account.sisaPagu).toBe(8000000) // 10M - 2M
      expect(account.realisasiTahun).toBe(2000000)

      // Test: Update SP2D to 3M
      await t.mutation(api.sp2d.update, {
        sp2dId,
        noSP2D: 'SP2D-009',
        tglSP2D: Date.now(),
        nilaiCair: 3000000, // Changed from 2M to 3M
      })

      // Verify: sisaPagu and realisasiTahun updated correctly
      account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })
      expect(account.sisaPagu).toBe(7000000) // 10M - 3M
      expect(account.realisasiTahun).toBe(3000000)
    })

    it('should revert realizations when SP2D is deleted', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST010',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test Admin',
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
        return await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-010',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final',
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdLines', {
          npdId,
          accountId,
          jumlah: 5000000,
          keterangan: 'Line',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create SP2D
      const sp2dId = await t.mutation(api.sp2d.create, {
        npdId,
        noSP2D: 'SP2D-010',
        tglSP2D: Date.now(),
        nilaiCair: 3000000,
      })

      // Verify SP2D created
      let account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })
      expect(account.sisaPagu).toBe(7000000)
      expect(account.realisasiTahun).toBe(3000000)

      // Test: Delete SP2D
      await t.mutation(api.sp2d.softDelete, {
        sp2dId,
        reason: 'Test deletion',
      })

      // Verify: Realizations reverted
      account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })
      expect(account.sisaPagu).toBe(10000000) // Restored to original
      expect(account.realisasiTahun).toBe(0) // Reverted to 0
    })
  })
})

