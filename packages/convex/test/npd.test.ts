/**
 * NPD Workflow and Validation Unit Tests
 * 
 * Tests NPD creation, status transitions, validation rules,
 * document locking, and workflow enforcement.
 * 
 * Target Coverage: 80%+
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { convexTest } from 'convex-test'
import { api } from '../_generated/api'
import schema from '../schema'

describe('NPD Workflow and Validation', () => {
  let t: any

  beforeEach(async () => {
    t = convexTest(schema)
  })

  describe('NPD Creation', () => {
    it('should create NPD with valid data', async () => {
      // Setup
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
          name: 'Test PPTK',
          email: 'pptk@test.com',
          role: 'pptk',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Create NPD
      const npdId = await t.mutation(api.npd.create, {
        nomorNPD: 'NPD-001-2025',
        tanggal: Date.now(),
        tahun: 2025,
        jenisBelanja: 'UP',
        keterangan: 'Test NPD',
      })

      // Verify
      const npd = await t.run(async (ctx: any) => {
        return await ctx.db.get(npdId)
      })

      expect(npd).toBeDefined()
      expect(npd.nomorNPD).toBe('NPD-001-2025')
      expect(npd.status).toBe('draft')
      expect(npd.createdBy).toBe(userId)
    })

    it('should reject NPD with duplicate number', async () => {
      // Setup
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
          name: 'Test PPTK',
          email: 'pptk@test.com',
          role: 'pptk',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create first NPD
      await t.mutation(api.npd.create, {
        nomorNPD: 'NPD-DUPLICATE',
        tanggal: Date.now(),
        tahun: 2025,
        jenisBelanja: 'UP',
      })

      // Test: Try to create second NPD with same number
      await expect(
        t.mutation(api.npd.create, {
          nomorNPD: 'NPD-DUPLICATE',
          tanggal: Date.now(),
          tahun: 2025,
          jenisBelanja: 'UP',
        })
      ).rejects.toThrow(/already exists|sudah ada/)
    })

    it('should validate NPD line budget against RKA account pagu', async () => {
      // Setup
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
          name: 'Test PPTK',
          email: 'pptk@test.com',
          role: 'pptk',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const accountId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Account',
          pagu: 5000000, // Pagu: 5M
          sisaPagu: 5000000,
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
          status: 'draft',
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Try to add line with amount exceeding pagu
      await expect(
        t.mutation(api.npd.addLine, {
          npdId,
          accountId,
          jumlah: 6000000, // Exceeds 5M pagu
          keterangan: 'Test line',
        })
      ).rejects.toThrow(/exceeds|melebihi/)
    })
  })

  describe('NPD Status Transitions', () => {
    it('should transition from Draft to Diajukan when submitted', async () => {
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
          name: 'Test PPTK',
          email: 'pptk@test.com',
          role: 'pptk',
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
          status: 'draft',
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Add at least one line (required for submission)
      await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdLines', {
          npdId,
          accountId,
          jumlah: 3000000,
          keterangan: 'Line 1',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Submit NPD
      await t.mutation(api.npd.submit, { npdId })

      // Verify: Status changed to 'diajukan'
      const npd = await t.run(async (ctx: any) => {
        return await ctx.db.get(npdId)
      })

      expect(npd.status).toBe('diajukan')
    })

    it('should reject submission of NPD without lines', async () => {
      // Setup
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
          name: 'Test PPTK',
          email: 'pptk@test.com',
          role: 'pptk',
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
          status: 'draft',
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Try to submit NPD without lines
      await expect(
        t.mutation(api.npd.submit, { npdId })
      ).rejects.toThrow(/at least one line/)
    })

    it('should transition from Diajukan to Diverifikasi when verified', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST006',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const verifierId = await t.run(async (ctx: any) => {
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
        const id = await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-006',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'diajukan', // Already submitted
          organizationId: orgId,
          createdBy: verifierId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId,
          jumlah: 3000000,
          keterangan: 'Line 1',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        return id
      })

      // Test: Verify NPD
      await t.mutation(api.npd.verify, {
        npdId,
        catatanVerifikasi: 'Verified successfully',
      })

      // Verify: Status changed to 'diverifikasi'
      const npd = await t.run(async (ctx: any) => {
        return await ctx.db.get(npdId)
      })

      expect(npd.status).toBe('diverifikasi')
      expect(npd.verifiedBy).toBe(verifierId)
      expect(npd.verifiedAt).toBeDefined()
    })

    it('should transition from Diverifikasi to Final when finalized', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST007',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const bendaharaId = await t.run(async (ctx: any) => {
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
        const id = await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-007',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'diverifikasi', // Already verified
          organizationId: orgId,
          createdBy: bendaharaId,
          verifiedBy: bendaharaId,
          verifiedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId,
          jumlah: 3000000,
          keterangan: 'Line 1',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        return id
      })

      // Test: Finalize NPD
      await t.mutation(api.npd.finalize, { npdId })

      // Verify: Status changed to 'final'
      const npd = await t.run(async (ctx: any) => {
        return await ctx.db.get(npdId)
      })

      expect(npd.status).toBe('final')
      expect(npd.finalizedBy).toBe(bendaharaId)
      expect(npd.finalizedAt).toBeDefined()
    })

    it('should reject invalid status transitions', async () => {
      // Setup: NPD in draft status
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
        const id = await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-008',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'draft', // Still in draft
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId,
          jumlah: 3000000,
          keterangan: 'Line 1',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        return id
      })

      // Test: Try to verify draft NPD (should fail - must be submitted first)
      await expect(
        t.mutation(api.npd.verify, { npdId })
      ).rejects.toThrow(/submitted|diajukan/)
    })
  })

  describe('NPD Rejection Workflow', () => {
    it('should revert NPD from Diajukan to Draft when rejected', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST009',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const verifierId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test Verifikator',
          email: 'verifikator@test.com',
          role: 'verifikator',
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
          nomorNPD: 'NPD-009',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'diajukan',
          organizationId: orgId,
          createdBy: verifierId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId,
          jumlah: 3000000,
          keterangan: 'Line 1',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        return id
      })

      // Test: Reject NPD
      await t.mutation(api.npd.reject, {
        npdId,
        catatanPenolakan: 'Incomplete documentation',
      })

      // Verify: Status reverted to 'draft'
      const npd = await t.run(async (ctx: any) => {
        return await ctx.db.get(npdId)
      })

      expect(npd.status).toBe('draft')
      expect(npd.catatan).toContain('DITOLAK')
      expect(npd.catatan).toContain('Incomplete documentation')
    })

    it('should clear verification data when NPD is rejected', async () => {
      // Setup: Verified NPD
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST010',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const verifierId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test Verifikator',
          email: 'verifikator@test.com',
          role: 'verifikator',
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
          nomorNPD: 'NPD-010',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'diverifikasi',
          verifiedBy: verifierId,
          verifiedAt: Date.now(),
          organizationId: orgId,
          createdBy: verifierId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId,
          jumlah: 3000000,
          keterangan: 'Line 1',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        return id
      })

      // Test: Reject verified NPD
      await t.mutation(api.npd.reject, {
        npdId,
        catatanPenolakan: 'Need revisions',
      })

      // Verify: Verification data cleared
      const npd = await t.run(async (ctx: any) => {
        return await ctx.db.get(npdId)
      })

      expect(npd.status).toBe('draft')
      expect(npd.verifiedBy).toBeUndefined()
      expect(npd.verifiedAt).toBeUndefined()
    })
  })

  describe('Document Locking', () => {
    it('should prevent editing finalized NPD', async () => {
      // Setup: Finalized NPD
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST011',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test User',
          email: 'user@test.com',
          role: 'pptk',
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
          nomorNPD: 'NPD-011',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'final', // Finalized
          organizationId: orgId,
          createdBy: userId,
          finalizedBy: userId,
          finalizedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Try to add line to finalized NPD
      await expect(
        t.mutation(api.npd.addLine, {
          npdId,
          accountId,
          jumlah: 1000000,
          keterangan: 'New line',
        })
      ).rejects.toThrow(/final|locked|cannot edit/)
    })

    it('should prevent deleting lines from finalized NPD', async () => {
      // Setup: Finalized NPD with line
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST012',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test User',
          email: 'user@test.com',
          role: 'pptk',
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

      const { npdId, lineId } = await t.run(async (ctx: any) => {
        const nId = await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-012',
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

        const lId = await ctx.db.insert('npdLines', {
          npdId: nId,
          accountId,
          jumlah: 3000000,
          keterangan: 'Line 1',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        return { npdId: nId, lineId: lId }
      })

      // Test: Try to delete line from finalized NPD
      await expect(
        t.mutation(api.npd.deleteLine, { lineId })
      ).rejects.toThrow(/final|locked|cannot delete/)
    })
  })

  describe('Permission Checks', () => {
    it('should allow PPTK to create and submit NPD', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST013',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const pptkId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test PPTK',
          email: 'pptk@test.com',
          role: 'pptk',
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

      // Test: PPTK creates NPD
      const npdId = await t.mutation(api.npd.create, {
        nomorNPD: 'NPD-013',
        tanggal: Date.now(),
        tahun: 2025,
        jenisBelanja: 'UP',
      })

      await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdLines', {
          npdId,
          accountId,
          jumlah: 3000000,
          keterangan: 'Line 1',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // PPTK submits NPD
      await t.mutation(api.npd.submit, { npdId })

      const npd = await t.run(async (ctx: any) => {
        return await ctx.db.get(npdId)
      })

      expect(npd.status).toBe('diajukan')
    })

    it('should prevent PPTK from verifying NPD', async () => {
      // Setup: Submitted NPD
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST014',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const pptkId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test PPTK',
          email: 'pptk@test.com',
          role: 'pptk',
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
          nomorNPD: 'NPD-014',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'diajukan',
          organizationId: orgId,
          createdBy: pptkId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId,
          jumlah: 3000000,
          keterangan: 'Line 1',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        return id
      })

      // Test: PPTK tries to verify (should fail)
      await expect(
        t.mutation(api.npd.verify, { npdId })
      ).rejects.toThrow(/permission|tidak memiliki/)
    })

    it('should prevent Viewer from creating NPD', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST015',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test Viewer',
          email: 'viewer@test.com',
          role: 'viewer',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Viewer tries to create NPD (should fail)
      await expect(
        t.mutation(api.npd.create, {
          nomorNPD: 'NPD-015',
          tanggal: Date.now(),
          tahun: 2025,
          jenisBelanja: 'UP',
        })
      ).rejects.toThrow(/permission|tidak memiliki/)
    })
  })

  describe('Audit Logging', () => {
    it('should create audit log entry when NPD is submitted', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST016',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Test PPTK',
          email: 'pptk@test.com',
          role: 'pptk',
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
          nomorNPD: 'NPD-016',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'draft',
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('npdLines', {
          npdId: id,
          accountId,
          jumlah: 3000000,
          keterangan: 'Line 1',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        return id
      })

      // Test: Submit NPD
      await t.mutation(api.npd.submit, { npdId })

      // Verify: Audit log created
      const auditLogs = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('auditLogs')
          .filter((q: any) =>
            q.and(
              q.eq(q.field('entityTable'), 'npdDocuments'),
              q.eq(q.field('entityId'), npdId),
              q.eq(q.field('action'), 'submitted')
            )
          )
          .collect()
      })

      expect(auditLogs).toHaveLength(1)
      expect(auditLogs[0].actorUserId).toBe(userId)
    })
  })
})

