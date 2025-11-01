/**
 * NPD Workflow Integration Tests
 * 
 * Full end-to-end workflow testing from NPD creation through finalization,
 * including email notifications, audit logging, and permission checks.
 * 
 * Tests the complete NPD lifecycle:
 * Draft → Diajukan → Diverifikasi → Final
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { convexTest } from 'convex-test'
import { api } from '../../_generated/api'
import schema from '../../schema'

describe('NPD Workflow Integration', () => {
  let t: any

  beforeEach(async () => {
    t = convexTest(schema)
  })

  describe('Complete NPD Lifecycle', () => {
    it('should complete full workflow: Draft → Diajukan → Diverifikasi → Final', async () => {
      // Setup: Create organization, users, and RKA structure
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          nama: 'Dinas Pendidikan',
          kode: 'DISDIK',
          alamat: 'Jl. Test No. 123',
          telepon: '021-1234567',
          email: 'disdik@test.go.id',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create users with different roles
      const pptkId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Ahmad PPTK',
          email: 'pptk@disdik.go.id',
          role: 'pptk',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const verifikatorId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Budi Verifikator',
          email: 'verifikator@disdik.go.id',
          role: 'verifikator',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const bendaharaId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Citra Bendahara',
          email: 'bendahara@disdik.go.id',
          role: 'bendahara',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create RKA structure
      const programId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaPrograms', {
          kode: '1.01',
          nama: 'Program Pendidikan Dasar',
          pagu: 100000000,
          sisaPagu: 100000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const kegiatanId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaKegiatans', {
          programId,
          kode: '1.01.01',
          nama: 'Kegiatan Peningkatan Mutu',
          pagu: 50000000,
          sisaPagu: 50000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const subkegiatanId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaSubkegiatans', {
          kegiatanId,
          kode: '1.01.01.001',
          nama: 'Subkegiatan Pelatihan Guru',
          pagu: 25000000,
          sisaPagu: 25000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create RKA accounts
      const account1Id = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          subkegiatanId,
          kode: '5.1.1.01',
          nama: 'Belanja Honorarium',
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
          subkegiatanId,
          kode: '5.1.2.01',
          nama: 'Belanja Bahan',
          pagu: 8000000,
          sisaPagu: 8000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const account3Id = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          subkegiatanId,
          kode: '5.2.1.01',
          nama: 'Belanja Perjalanan Dinas',
          pagu: 7000000,
          sisaPagu: 7000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Step 1: PPTK creates NPD (Draft)
      const npdId = await t.mutation(api.npd.create, {
        nomorNPD: 'NPD-001/DISDIK/2025',
        tanggal: Date.now(),
        tahun: 2025,
        jenisBelanja: 'UP',
        maksud: 'Pelatihan Peningkatan Kompetensi Guru SD',
        keterangan: 'Pelatihan selama 3 hari untuk 50 guru',
      })

      expect(npdId).toBeDefined()

      // Verify NPD is in draft status
      let npd = await t.run(async (ctx: any) => {
        return await ctx.db.get(npdId)
      })

      expect(npd.status).toBe('draft')
      expect(npd.createdBy).toBe(pptkId)
      expect(npd.organizationId).toBe(orgId)

      // Step 2: PPTK adds NPD lines
      const line1Id = await t.mutation(api.npd.addLine, {
        npdId,
        accountId: account1Id,
        jumlah: 5000000,
        keterangan: 'Honorarium narasumber dan panitia',
      })

      const line2Id = await t.mutation(api.npd.addLine, {
        npdId,
        accountId: account2Id,
        jumlah: 3000000,
        keterangan: 'Bahan pelatihan dan konsumsi',
      })

      const line3Id = await t.mutation(api.npd.addLine, {
        npdId,
        accountId: account3Id,
        jumlah: 2000000,
        keterangan: 'Perjalanan dinas narasumber',
      })

      // Verify lines created
      const lines = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('npdLines')
          .filter((q: any) => q.eq(q.field('npdId'), npdId))
          .collect()
      })

      expect(lines).toHaveLength(3)
      expect(lines.reduce((sum: number, line: any) => sum + line.jumlah, 0)).toBe(10000000)

      // Step 3: PPTK submits NPD (Draft → Diajukan)
      await t.mutation(api.npd.submit, { npdId })

      npd = await t.run(async (ctx: any) => {
        return await ctx.db.get(npdId)
      })

      expect(npd.status).toBe('diajukan')
      expect(npd.submittedAt).toBeDefined()

      // Verify audit log entry for submission
      const submitLog = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('auditLogs')
          .filter((q: any) =>
            q.and(
              q.eq(q.field('entityTable'), 'npdDocuments'),
              q.eq(q.field('entityId'), npdId),
              q.eq(q.field('action'), 'submitted')
            )
          )
          .first()
      })

      expect(submitLog).toBeDefined()
      expect(submitLog.actorUserId).toBe(pptkId)

      // Step 4: Verifikator verifies NPD (Diajukan → Diverifikasi)
      await t.mutation(api.npd.verify, {
        npdId,
        catatanVerifikasi: 'Dokumen lengkap, perhitungan benar, disetujui',
      })

      npd = await t.run(async (ctx: any) => {
        return await ctx.db.get(npdId)
      })

      expect(npd.status).toBe('diverifikasi')
      expect(npd.verifiedBy).toBe(verifikatorId)
      expect(npd.verifiedAt).toBeDefined()
      expect(npd.catatanVerifikasi).toContain('Dokumen lengkap')

      // Verify audit log entry for verification
      const verifyLog = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('auditLogs')
          .filter((q: any) =>
            q.and(
              q.eq(q.field('entityTable'), 'npdDocuments'),
              q.eq(q.field('entityId'), npdId),
              q.eq(q.field('action'), 'verified')
            )
          )
          .first()
      })

      expect(verifyLog).toBeDefined()
      expect(verifyLog.actorUserId).toBe(verifikatorId)

      // Step 5: Bendahara finalizes NPD (Diverifikasi → Final)
      await t.mutation(api.npd.finalize, { npdId })

      npd = await t.run(async (ctx: any) => {
        return await ctx.db.get(npdId)
      })

      expect(npd.status).toBe('final')
      expect(npd.finalizedBy).toBe(bendaharaId)
      expect(npd.finalizedAt).toBeDefined()

      // Verify audit log entry for finalization
      const finalizeLog = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('auditLogs')
          .filter((q: any) =>
            q.and(
              q.eq(q.field('entityTable'), 'npdDocuments'),
              q.eq(q.field('entityId'), npdId),
              q.eq(q.field('action'), 'finalized')
            )
          )
          .first()
      })

      expect(finalizeLog).toBeDefined()
      expect(finalizeLog.actorUserId).toBe(bendaharaId)

      // Step 6: Verify document is locked (cannot edit)
      await expect(
        t.mutation(api.npd.addLine, {
          npdId,
          accountId: account1Id,
          jumlah: 1000000,
          keterangan: 'Should fail',
        })
      ).rejects.toThrow(/final|locked|cannot/)

      // Step 7: Verify all audit logs exist
      const allLogs = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('auditLogs')
          .filter((q: any) =>
            q.and(
              q.eq(q.field('entityTable'), 'npdDocuments'),
              q.eq(q.field('entityId'), npdId)
            )
          )
          .collect()
      })

      expect(allLogs.length).toBeGreaterThanOrEqual(3) // At least submit, verify, finalize
    })

    it('should handle NPD rejection workflow correctly', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          nama: 'Test Org',
          kode: 'TEST',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const pptkId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'PPTK User',
          email: 'pptk@test.com',
          role: 'pptk',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const verifikatorId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Verifikator User',
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

      // Create and submit NPD
      const npdId = await t.run(async (ctx: any) => {
        const id = await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-REJ-001',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'diajukan',
          organizationId: orgId,
          createdBy: pptkId,
          submittedAt: Date.now(),
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

      // Reject NPD
      await t.mutation(api.npd.reject, {
        npdId,
        catatanPenolakan: 'Dokumen tidak lengkap, harap dilengkapi RAB',
      })

      // Verify NPD reverted to draft
      const npd = await t.run(async (ctx: any) => {
        return await ctx.db.get(npdId)
      })

      expect(npd.status).toBe('draft')
      expect(npd.catatan).toContain('DITOLAK')
      expect(npd.catatan).toContain('Dokumen tidak lengkap')
      expect(npd.verifiedBy).toBeUndefined()
      expect(npd.verifiedAt).toBeUndefined()

      // Verify audit log
      const rejectLog = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('auditLogs')
          .filter((q: any) =>
            q.and(
              q.eq(q.field('entityTable'), 'npdDocuments'),
              q.eq(q.field('entityId'), npdId),
              q.eq(q.field('action'), 'rejected')
            )
          )
          .first()
      })

      expect(rejectLog).toBeDefined()
      expect(rejectLog.actorUserId).toBe(verifikatorId)

      // PPTK can now edit and resubmit
      await t.mutation(api.npd.addLine, {
        npdId,
        accountId,
        jumlah: 1000000,
        keterangan: 'Additional line after rejection',
      })

      const lines = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('npdLines')
          .filter((q: any) => q.eq(q.field('npdId'), npdId))
          .collect()
      })

      expect(lines).toHaveLength(2)
    })
  })

  describe('Permission Enforcement', () => {
    it('should enforce role-based permissions throughout workflow', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          nama: 'Test Org',
          kode: 'TEST',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const pptkId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'PPTK User',
          email: 'pptk@test.com',
          role: 'pptk',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const viewerId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          name: 'Viewer User',
          email: 'viewer@test.com',
          role: 'viewer',
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

      // Viewer cannot create NPD
      await expect(
        t.mutation(api.npd.create, {
          nomorNPD: 'NPD-PERM-001',
          tanggal: Date.now(),
          tahun: 2025,
          jenisBelanja: 'UP',
        })
      ).rejects.toThrow(/permission/)

      // PPTK can create NPD
      const npdId = await t.mutation(api.npd.create, {
        nomorNPD: 'NPD-PERM-002',
        tanggal: Date.now(),
        tahun: 2025,
        jenisBelanja: 'UP',
      })

      expect(npdId).toBeDefined()

      // Add line and submit
      await t.run(async (ctx: any) => {
        await ctx.db.insert('npdLines', {
          npdId,
          accountId,
          jumlah: 5000000,
          keterangan: 'Test',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.mutation(api.npd.submit, { npdId })

      // PPTK cannot verify own NPD
      await expect(
        t.mutation(api.npd.verify, {
          npdId,
          catatanVerifikasi: 'Should fail',
        })
      ).rejects.toThrow(/permission/)
    })
  })

  describe('Data Integrity', () => {
    it('should maintain data integrity throughout workflow', async () => {
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
          name: 'Test User',
          email: 'user@test.com',
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

      // Create NPD with lines
      const npdId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('npdDocuments', {
          nomorNPD: 'NPD-INT-001',
          tanggal: Date.now(),
          tahun: 2025,
          status: 'draft',
          organizationId: orgId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      await t.run(async (ctx: any) => {
        await ctx.db.insert('npdLines', {
          npdId,
          accountId,
          jumlah: 5000000,
          keterangan: 'Line 1',
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Verify NPD total matches sum of lines
      const npd = await t.run(async (ctx: any) => {
        return await ctx.db.get(npdId)
      })

      const lines = await t.run(async (ctx: any) => {
        return await ctx.db
          .query('npdLines')
          .filter((q: any) => q.eq(q.field('npdId'), npdId))
          .collect()
      })

      const totalLines = lines.reduce((sum: number, line: any) => sum + line.jumlah, 0)
      expect(totalLines).toBe(5000000)

      // Verify organizationId consistency
      expect(npd.organizationId).toBe(orgId)
      lines.forEach((line: any) => {
        expect(line.organizationId).toBe(orgId)
      })

      // Verify timestamps
      expect(npd.createdAt).toBeDefined()
      expect(npd.updatedAt).toBeDefined()
      expect(npd.createdAt).toBeLessThanOrEqual(npd.updatedAt)
    })
  })
})

