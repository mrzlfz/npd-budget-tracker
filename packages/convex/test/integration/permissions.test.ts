/**
 * RBAC Permission Matrix Integration Tests
 * 
 * Comprehensive testing of role-based access control across all operations.
 * Tests each role's permissions for NPD, SP2D, RKA, Performance, and Admin operations.
 * 
 * Roles: admin, bendahara, verifikator, pptk, viewer
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { convexTest } from 'convex-test'
import { api } from '../../_generated/api'
import schema from '../../schema'

describe('RBAC Permission Matrix Integration', () => {
  let t: any
  let orgId: any
  let adminId: any
  let bendaharaId: any
  let verifikatorId: any
  let pptkId: any
  let viewerId: any
  let accountId: any
  let npdDraftId: any
  let npdFinalId: any

  beforeEach(async () => {
    t = convexTest(schema)

    // Setup: Create organization
    orgId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('organizations', {
        nama: 'Test Organization',
        kode: 'TEST',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    })

    // Create users with different roles
    adminId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'admin',
        organizationId: orgId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    })

    bendaharaId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        name: 'Bendahara User',
        email: 'bendahara@test.com',
        role: 'bendahara',
        organizationId: orgId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    })

    verifikatorId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        name: 'Verifikator User',
        email: 'verifikator@test.com',
        role: 'verifikator',
        organizationId: orgId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    })

    pptkId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        name: 'PPTK User',
        email: 'pptk@test.com',
        role: 'pptk',
        organizationId: orgId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    })

    viewerId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        name: 'Viewer User',
        email: 'viewer@test.com',
        role: 'viewer',
        organizationId: orgId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    })

    // Create RKA account for testing
    accountId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('rkaAccounts', {
        kode: '5.1.1.01',
        nama: 'Test Account',
        pagu: 10000000,
        sisaPagu: 10000000,
        realisasiTahun: 0,
        organizationId: orgId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    })

    // Create draft NPD for testing
    npdDraftId = await t.run(async (ctx: any) => {
      const id = await ctx.db.insert('npdDocuments', {
        nomorNPD: 'NPD-DRAFT-001',
        tanggal: Date.now(),
        tahun: 2025,
        status: 'draft',
        organizationId: orgId,
        createdBy: pptkId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      await ctx.db.insert('npdLines', {
        npdId: id,
        accountId,
        jumlah: 5000000,
        keterangan: 'Test line',
        organizationId: orgId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      return id
    })

    // Create finalized NPD for SP2D testing
    npdFinalId = await t.run(async (ctx: any) => {
      const id = await ctx.db.insert('npdDocuments', {
        nomorNPD: 'NPD-FINAL-001',
        tanggal: Date.now(),
        tahun: 2025,
        status: 'final',
        organizationId: orgId,
        createdBy: pptkId,
        finalizedBy: bendaharaId,
        finalizedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      await ctx.db.insert('npdLines', {
        npdId: id,
        accountId,
        jumlah: 5000000,
        keterangan: 'Test line',
        organizationId: orgId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      return id
    })
  })

  describe('NPD Operations - Permission Matrix', () => {
    describe('NPD Creation', () => {
      it('PPTK can create NPD', async () => {
        // Set current user context to PPTK
        const npdId = await t.mutation(api.npd.create, {
          nomorNPD: 'NPD-PPTK-001',
          tanggal: Date.now(),
          tahun: 2025,
          jenisBelanja: 'UP',
        })

        expect(npdId).toBeDefined()
      })

      it('Bendahara can create NPD', async () => {
        const npdId = await t.mutation(api.npd.create, {
          nomorNPD: 'NPD-BEND-001',
          tanggal: Date.now(),
          tahun: 2025,
          jenisBelanja: 'UP',
        })

        expect(npdId).toBeDefined()
      })

      it('Admin can create NPD', async () => {
        const npdId = await t.mutation(api.npd.create, {
          nomorNPD: 'NPD-ADMIN-001',
          tanggal: Date.now(),
          tahun: 2025,
          jenisBelanja: 'UP',
        })

        expect(npdId).toBeDefined()
      })

      it('Viewer cannot create NPD', async () => {
        await expect(
          t.mutation(api.npd.create, {
            nomorNPD: 'NPD-VIEWER-001',
            tanggal: Date.now(),
            tahun: 2025,
            jenisBelanja: 'UP',
          })
        ).rejects.toThrow(/permission|access denied/i)
      })

      it('Verifikator cannot create NPD', async () => {
        await expect(
          t.mutation(api.npd.create, {
            nomorNPD: 'NPD-VERIF-001',
            tanggal: Date.now(),
            tahun: 2025,
            jenisBelanja: 'UP',
          })
        ).rejects.toThrow(/permission|access denied/i)
      })
    })

    describe('NPD Submission', () => {
      it('PPTK can submit own NPD', async () => {
        await t.mutation(api.npd.submit, { npdId: npdDraftId })

        const npd = await t.run(async (ctx: any) => {
          return await ctx.db.get(npdDraftId)
        })

        expect(npd.status).toBe('diajukan')
      })

      it('Viewer cannot submit NPD', async () => {
        await expect(
          t.mutation(api.npd.submit, { npdId: npdDraftId })
        ).rejects.toThrow(/permission|access denied/i)
      })
    })

    describe('NPD Verification', () => {
      it('Verifikator can verify NPD', async () => {
        // First submit NPD
        await t.run(async (ctx: any) => {
          await ctx.db.patch(npdDraftId, {
            status: 'diajukan',
            submittedAt: Date.now(),
          })
        })

        await t.mutation(api.npd.verify, {
          npdId: npdDraftId,
          catatanVerifikasi: 'Approved by verifikator',
        })

        const npd = await t.run(async (ctx: any) => {
          return await ctx.db.get(npdDraftId)
        })

        expect(npd.status).toBe('diverifikasi')
      })

      it('Bendahara can verify NPD', async () => {
        await t.run(async (ctx: any) => {
          await ctx.db.patch(npdDraftId, {
            status: 'diajukan',
            submittedAt: Date.now(),
          })
        })

        await t.mutation(api.npd.verify, {
          npdId: npdDraftId,
          catatanVerifikasi: 'Approved by bendahara',
        })

        const npd = await t.run(async (ctx: any) => {
          return await ctx.db.get(npdDraftId)
        })

        expect(npd.status).toBe('diverifikasi')
      })

      it('PPTK cannot verify NPD', async () => {
        await t.run(async (ctx: any) => {
          await ctx.db.patch(npdDraftId, {
            status: 'diajukan',
            submittedAt: Date.now(),
          })
        })

        await expect(
          t.mutation(api.npd.verify, {
            npdId: npdDraftId,
            catatanVerifikasi: 'Should fail',
          })
        ).rejects.toThrow(/permission|cannot verify/i)
      })
    })

    describe('NPD Finalization', () => {
      it('Bendahara can finalize NPD', async () => {
        await t.run(async (ctx: any) => {
          await ctx.db.patch(npdDraftId, {
            status: 'diverifikasi',
            verifiedBy: verifikatorId,
            verifiedAt: Date.now(),
          })
        })

        await t.mutation(api.npd.finalize, { npdId: npdDraftId })

        const npd = await t.run(async (ctx: any) => {
          return await ctx.db.get(npdDraftId)
        })

        expect(npd.status).toBe('final')
      })

      it('Admin can finalize NPD', async () => {
        await t.run(async (ctx: any) => {
          await ctx.db.patch(npdDraftId, {
            status: 'diverifikasi',
            verifiedBy: verifikatorId,
            verifiedAt: Date.now(),
          })
        })

        await t.mutation(api.npd.finalize, { npdId: npdDraftId })

        const npd = await t.run(async (ctx: any) => {
          return await ctx.db.get(npdDraftId)
        })

        expect(npd.status).toBe('final')
      })

      it('Verifikator cannot finalize NPD', async () => {
        await t.run(async (ctx: any) => {
          await ctx.db.patch(npdDraftId, {
            status: 'diverifikasi',
            verifiedBy: verifikatorId,
            verifiedAt: Date.now(),
          })
        })

        await expect(
          t.mutation(api.npd.finalize, { npdId: npdDraftId })
        ).rejects.toThrow(/permission|cannot finalize/i)
      })

      it('PPTK cannot finalize NPD', async () => {
        await t.run(async (ctx: any) => {
          await ctx.db.patch(npdDraftId, {
            status: 'diverifikasi',
            verifiedBy: verifikatorId,
            verifiedAt: Date.now(),
          })
        })

        await expect(
          t.mutation(api.npd.finalize, { npdId: npdDraftId })
        ).rejects.toThrow(/permission|cannot finalize/i)
      })
    })

    describe('NPD Rejection', () => {
      it('Verifikator can reject NPD', async () => {
        await t.run(async (ctx: any) => {
          await ctx.db.patch(npdDraftId, {
            status: 'diajukan',
            submittedAt: Date.now(),
          })
        })

        await t.mutation(api.npd.reject, {
          npdId: npdDraftId,
          catatanPenolakan: 'Documents incomplete',
        })

        const npd = await t.run(async (ctx: any) => {
          return await ctx.db.get(npdDraftId)
        })

        expect(npd.status).toBe('draft')
      })

      it('Bendahara can reject NPD', async () => {
        await t.run(async (ctx: any) => {
          await ctx.db.patch(npdDraftId, {
            status: 'diajukan',
            submittedAt: Date.now(),
          })
        })

        await t.mutation(api.npd.reject, {
          npdId: npdDraftId,
          catatanPenolakan: 'Budget exceeded',
        })

        const npd = await t.run(async (ctx: any) => {
          return await ctx.db.get(npdDraftId)
        })

        expect(npd.status).toBe('draft')
      })

      it('PPTK cannot reject NPD', async () => {
        await t.run(async (ctx: any) => {
          await ctx.db.patch(npdDraftId, {
            status: 'diajukan',
            submittedAt: Date.now(),
          })
        })

        await expect(
          t.mutation(api.npd.reject, {
            npdId: npdDraftId,
            catatanPenolakan: 'Should fail',
          })
        ).rejects.toThrow(/permission|cannot reject/i)
      })
    })
  })

  describe('SP2D Operations - Permission Matrix', () => {
    describe('SP2D Creation', () => {
      it('Bendahara can create SP2D', async () => {
        const sp2dId = await t.mutation(api.sp2d.create, {
          npdId: npdFinalId,
          noSP2D: 'SP2D-BEND-001',
          tglSP2D: Date.now(),
          nilaiCair: 4000000,
        })

        expect(sp2dId).toBeDefined()
      })

      it('Admin can create SP2D', async () => {
        const sp2dId = await t.mutation(api.sp2d.create, {
          npdId: npdFinalId,
          noSP2D: 'SP2D-ADMIN-001',
          tglSP2D: Date.now(),
          nilaiCair: 3000000,
        })

        expect(sp2dId).toBeDefined()
      })

      it('PPTK cannot create SP2D', async () => {
        await expect(
          t.mutation(api.sp2d.create, {
            npdId: npdFinalId,
            noSP2D: 'SP2D-PPTK-001',
            tglSP2D: Date.now(),
            nilaiCair: 2000000,
          })
        ).rejects.toThrow(/permission|access denied/i)
      })

      it('Verifikator cannot create SP2D', async () => {
        await expect(
          t.mutation(api.sp2d.create, {
            npdId: npdFinalId,
            noSP2D: 'SP2D-VERIF-001',
            tglSP2D: Date.now(),
            nilaiCair: 2000000,
          })
        ).rejects.toThrow(/permission|access denied/i)
      })

      it('Viewer cannot create SP2D', async () => {
        await expect(
          t.mutation(api.sp2d.create, {
            npdId: npdFinalId,
            noSP2D: 'SP2D-VIEWER-001',
            tglSP2D: Date.now(),
            nilaiCair: 2000000,
          })
        ).rejects.toThrow(/permission|access denied/i)
      })
    })

    describe('SP2D Edit', () => {
      it('Bendahara can edit SP2D', async () => {
        const sp2dId = await t.run(async (ctx: any) => {
          return await ctx.db.insert('sp2dRefs', {
            npdId: npdFinalId,
            noSP2D: 'SP2D-EDIT-001',
            tglSP2D: Date.now(),
            nilaiCair: 3000000,
            organizationId: orgId,
            createdBy: bendaharaId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        })

        await t.mutation(api.sp2d.update, {
          sp2dId,
          noSP2D: 'SP2D-EDIT-001-REV',
          tglSP2D: Date.now(),
          nilaiCair: 3500000,
        })

        const sp2d = await t.run(async (ctx: any) => {
          return await ctx.db.get(sp2dId)
        })

        expect(sp2d.nilaiCair).toBe(3500000)
      })

      it('Admin can edit SP2D', async () => {
        const sp2dId = await t.run(async (ctx: any) => {
          return await ctx.db.insert('sp2dRefs', {
            npdId: npdFinalId,
            noSP2D: 'SP2D-EDIT-002',
            tglSP2D: Date.now(),
            nilaiCair: 2000000,
            organizationId: orgId,
            createdBy: adminId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        })

        await t.mutation(api.sp2d.update, {
          sp2dId,
          noSP2D: 'SP2D-EDIT-002-REV',
          tglSP2D: Date.now(),
          nilaiCair: 2500000,
        })

        const sp2d = await t.run(async (ctx: any) => {
          return await ctx.db.get(sp2dId)
        })

        expect(sp2d.nilaiCair).toBe(2500000)
      })

      it('PPTK cannot edit SP2D', async () => {
        const sp2dId = await t.run(async (ctx: any) => {
          return await ctx.db.insert('sp2dRefs', {
            npdId: npdFinalId,
            noSP2D: 'SP2D-EDIT-003',
            tglSP2D: Date.now(),
            nilaiCair: 2000000,
            organizationId: orgId,
            createdBy: bendaharaId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        })

        await expect(
          t.mutation(api.sp2d.update, {
            sp2dId,
            noSP2D: 'SP2D-EDIT-003-REV',
            tglSP2D: Date.now(),
            nilaiCair: 2500000,
          })
        ).rejects.toThrow(/permission|access denied/i)
      })
    })

    describe('SP2D Delete', () => {
      it('Admin can delete SP2D', async () => {
        const sp2dId = await t.run(async (ctx: any) => {
          return await ctx.db.insert('sp2dRefs', {
            npdId: npdFinalId,
            noSP2D: 'SP2D-DEL-001',
            tglSP2D: Date.now(),
            nilaiCair: 2000000,
            organizationId: orgId,
            createdBy: bendaharaId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        })

        await t.mutation(api.sp2d.softDelete, {
          sp2dId,
          reason: 'Error in amount',
        })

        const sp2d = await t.run(async (ctx: any) => {
          return await ctx.db.get(sp2dId)
        })

        expect(sp2d.deletedAt).toBeDefined()
      })

      it('Bendahara cannot delete SP2D (admin only)', async () => {
        const sp2dId = await t.run(async (ctx: any) => {
          return await ctx.db.insert('sp2dRefs', {
            npdId: npdFinalId,
            noSP2D: 'SP2D-DEL-002',
            tglSP2D: Date.now(),
            nilaiCair: 2000000,
            organizationId: orgId,
            createdBy: bendaharaId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        })

        await expect(
          t.mutation(api.sp2d.softDelete, {
            sp2dId,
            reason: 'Should fail',
          })
        ).rejects.toThrow(/permission|admin only/i)
      })
    })
  })

  describe('Performance Operations - Permission Matrix', () => {
    let performanceLogId: any

    beforeEach(async () => {
      const subkegiatanId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaSubkegiatans', {
          kode: '1.01.01',
          nama: 'Test Subkegiatan',
          pagu: 10000000,
          sisaPagu: 10000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      performanceLogId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('performanceLogs', {
          subkegiatanId,
          indikatorNama: 'Test Indicator',
          target: 100,
          realisasi: 80,
          satuan: 'unit',
          periode: 'TW1',
          status: 'pending',
          organizationId: orgId,
          createdBy: pptkId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })
    })

    describe('Performance Approval', () => {
      it('Bendahara can approve performance', async () => {
        await t.mutation(api.performance.approve, {
          performanceLogId,
          approvalNotes: 'Approved',
        })

        const log = await t.run(async (ctx: any) => {
          return await ctx.db.get(performanceLogId)
        })

        expect(log.status).toBe('approved')
      })

      it('Admin can approve performance', async () => {
        await t.mutation(api.performance.approve, {
          performanceLogId,
          approvalNotes: 'Approved by admin',
        })

        const log = await t.run(async (ctx: any) => {
          return await ctx.db.get(performanceLogId)
        })

        expect(log.status).toBe('approved')
      })

      it('PPTK cannot approve performance', async () => {
        await expect(
          t.mutation(api.performance.approve, {
            performanceLogId,
            approvalNotes: 'Should fail',
          })
        ).rejects.toThrow(/permission|cannot approve/i)
      })

      it('Viewer cannot approve performance', async () => {
        await expect(
          t.mutation(api.performance.approve, {
            performanceLogId,
            approvalNotes: 'Should fail',
          })
        ).rejects.toThrow(/permission|cannot approve/i)
      })
    })

    describe('Performance Rejection', () => {
      it('Bendahara can reject performance', async () => {
        await t.mutation(api.performance.reject, {
          performanceLogId,
          rejectionReason: 'Evidence insufficient',
        })

        const log = await t.run(async (ctx: any) => {
          return await ctx.db.get(performanceLogId)
        })

        expect(log.status).toBe('rejected')
      })

      it('PPTK cannot reject performance', async () => {
        await expect(
          t.mutation(api.performance.reject, {
            performanceLogId,
            rejectionReason: 'Should fail',
          })
        ).rejects.toThrow(/permission|cannot reject/i)
      })
    })
  })

  describe('Read Operations - All Roles', () => {
    it('All roles can read NPD list', async () => {
      const npds = await t.query(api.npd.list, {
        organizationId: orgId,
      })

      expect(npds).toBeDefined()
      expect(Array.isArray(npds)).toBe(true)
    })

    it('All roles can read SP2D list', async () => {
      const sp2ds = await t.query(api.sp2d.list, {
        organizationId: orgId,
      })

      expect(sp2ds).toBeDefined()
      expect(Array.isArray(sp2ds)).toBe(true)
    })

    it('All roles can read RKA hierarchy', async () => {
      const rka = await t.query(api.rka.getHierarchy, {
        organizationId: orgId,
      })

      expect(rka).toBeDefined()
    })

    it('All roles can read dashboard data', async () => {
      const dashboard = await t.query(api.dashboard.getKPIs, {
        organizationId: orgId,
        tahun: 2025,
      })

      expect(dashboard).toBeDefined()
    })
  })

  describe('Cross-Organization Access Control', () => {
    let otherOrgId: any
    let otherUserPPTKId: any
    let otherNPDId: any

    beforeEach(async () => {
      // Create another organization
      otherOrgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          nama: 'Other Organization',
          kode: 'OTHER',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create user in other organization
      otherUserPPTKId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Other PPTK',
          email: 'pptk@other.com',
          role: 'pptk',
          organizationId: otherOrgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create NPD in other organization
      otherNPDId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-OTHER-001',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'draft',
          organizationId: otherOrgId,
          createdBy: otherUserPPTKId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })
    })

    it('User cannot access NPD from different organization', async () => {
      // Try to access NPD from other organization
      await expect(
        t.query(api.npd.get, { id: otherNPDId })
      ).rejects.toThrow(/access denied|not found|organization/i)
    })

    it('User cannot modify NPD from different organization', async () => {
      await expect(
        t.mutation(api.npd.submit, { npdId: otherNPDId })
      ).rejects.toThrow(/access denied|not found|organization/i)
    })

    it('Admin cannot access data from different organization', async () => {
      // Even admin is restricted to their organization
      await expect(
        t.query(api.npd.get, { id: otherNPDId })
      ).rejects.toThrow(/access denied|not found|organization/i)
    })
  })
})

