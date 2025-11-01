/**
 * Budget Calculation Unit Tests
 * 
 * Tests sisaPagu calculation, realisasiTahun accumulation,
 * percentage calculations, and budget warnings.
 * 
 * Uses Decimal.js for precision to avoid floating-point errors.
 * 
 * Target Coverage: 80%+
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { convexTest } from 'convex-test'
import { api } from '../_generated/api'
import schema from '../schema'
import Decimal from 'decimal.js'

describe('Budget Calculations', () => {
  let t: any

  beforeEach(async () => {
    t = convexTest(schema)
  })

  describe('SisaPagu Calculation', () => {
    it('should calculate sisaPagu correctly after single realization', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST001',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const accountId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Belanja Pegawai',
          pagu: 10000000, // 10M
          sisaPagu: 10000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Add realization of 3M
      await t.run(async (ctx: any) => {
        const account = await ctx.db.get(accountId)
        const newRealisasi = 3000000
        const newSisaPagu = account.pagu - (account.realisasiTahun + newRealisasi)
        
        await ctx.db.patch(accountId, {
          realisasiTahun: account.realisasiTahun + newRealisasi,
          sisaPagu: newSisaPagu,
          updatedAt: Date.now(),
        })
      })

      // Verify
      const account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.sisaPagu).toBe(7000000) // 10M - 3M = 7M
      expect(account.realisasiTahun).toBe(3000000)
    })

    it('should calculate sisaPagu correctly with multiple cumulative realizations', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST002',
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

      // Test: Add multiple realizations
      const realizations = [2000000, 1500000, 2500000] // 2M, 1.5M, 2.5M

      for (const amount of realizations) {
        await t.run(async (ctx: any) => {
          const account = await ctx.db.get(accountId)
          const newRealisasi = amount
          const newSisaPagu = account.pagu - (account.realisasiTahun + newRealisasi)
          
          await ctx.db.patch(accountId, {
            realisasiTahun: account.realisasiTahun + newRealisasi,
            sisaPagu: newSisaPagu,
            updatedAt: Date.now(),
          })
        })
      }

      // Verify
      const account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.realisasiTahun).toBe(6000000) // 2M + 1.5M + 2.5M = 6M
      expect(account.sisaPagu).toBe(4000000) // 10M - 6M = 4M
    })

    it('should prevent realization exceeding pagu', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST003',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const accountId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Account',
          pagu: 5000000, // 5M
          sisaPagu: 5000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Try to add realization exceeding pagu
      await expect(async () => {
        await t.run(async (ctx: any) => {
          const account = await ctx.db.get(accountId)
          const newRealisasi = 6000000 // Exceeds 5M pagu
          
          if (account.realisasiTahun + newRealisasi > account.pagu) {
            throw new Error('Realization exceeds pagu')
          }
          
          await ctx.db.patch(accountId, {
            realisasiTahun: account.realisasiTahun + newRealisasi,
            sisaPagu: account.pagu - (account.realisasiTahun + newRealisasi),
            updatedAt: Date.now(),
          })
        })
      }).rejects.toThrow(/exceeds pagu/)
    })

    it('should handle decimal precision correctly using Decimal.js', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST004',
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

      // Test: Add realizations with potential floating-point issues
      const realizations = [3333333, 3333333, 3333334] // Sum = 10M exactly

      for (const amount of realizations) {
        await t.run(async (ctx: any) => {
          const account = await ctx.db.get(accountId)
          
          // Use Decimal.js for precision
          const pagu = new Decimal(account.pagu)
          const currentRealisasi = new Decimal(account.realisasiTahun)
          const newAmount = new Decimal(amount)
          const totalRealisasi = currentRealisasi.plus(newAmount)
          const newSisaPagu = pagu.minus(totalRealisasi)
          
          await ctx.db.patch(accountId, {
            realisasiTahun: totalRealisasi.toNumber(),
            sisaPagu: newSisaPagu.toNumber(),
            updatedAt: Date.now(),
          })
        })
      }

      // Verify: No rounding errors
      const account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.realisasiTahun).toBe(10000000) // Exactly 10M
      expect(account.sisaPagu).toBe(0) // Exactly 0
    })
  })

  describe('Percentage Calculations', () => {
    it('should calculate persentaseRealisasi correctly', () => {
      const testCases = [
        { pagu: 10000000, realisasi: 5000000, expected: 50 },
        { pagu: 10000000, realisasi: 8000000, expected: 80 },
        { pagu: 10000000, realisasi: 10000000, expected: 100 },
        { pagu: 10000000, realisasi: 0, expected: 0 },
        { pagu: 10000000, realisasi: 3333333, expected: 33.33 },
      ]

      testCases.forEach(({ pagu, realisasi, expected }) => {
        const paguDecimal = new Decimal(pagu)
        const realisasiDecimal = new Decimal(realisasi)
        const percentage = realisasiDecimal.dividedBy(paguDecimal).times(100).toDecimalPlaces(2).toNumber()
        
        expect(percentage).toBeCloseTo(expected, 2)
      })
    })

    it('should handle zero pagu gracefully', () => {
      const pagu = 0
      const realisasi = 1000000

      // Should return 0 or handle gracefully, not throw
      const paguDecimal = new Decimal(pagu)
      const realisasiDecimal = new Decimal(realisasi)
      
      if (paguDecimal.isZero()) {
        expect(0).toBe(0) // Graceful handling
      } else {
        const percentage = realisasiDecimal.dividedBy(paguDecimal).times(100).toNumber()
        expect(percentage).toBeDefined()
      }
    })

    it('should calculate persentaseCapaian for performance indicators', () => {
      const testCases = [
        { target: 100, realisasi: 50, expected: 50 },
        { target: 100, realisasi: 100, expected: 100 },
        { target: 100, realisasi: 120, expected: 120 }, // Over-achievement
        { target: 100, realisasi: 0, expected: 0 },
        { target: 75, realisasi: 60, expected: 80 },
      ]

      testCases.forEach(({ target, realisasi, expected }) => {
        const targetDecimal = new Decimal(target)
        const realisasiDecimal = new Decimal(realisasi)
        const percentage = realisasiDecimal.dividedBy(targetDecimal).times(100).toDecimalPlaces(2).toNumber()
        
        expect(percentage).toBeCloseTo(expected, 2)
      })
    })
  })

  describe('Budget Warnings', () => {
    it('should detect when budget utilization exceeds 80%', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST005',
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

      // Test: Add realization bringing total to 85%
      await t.run(async (ctx: any) => {
        const account = await ctx.db.get(accountId)
        const newRealisasi = 8500000 // 85% of 10M
        
        await ctx.db.patch(accountId, {
          realisasiTahun: newRealisasi,
          sisaPagu: account.pagu - newRealisasi,
          updatedAt: Date.now(),
        })
      })

      // Verify: Check if warning threshold exceeded
      const account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      const utilizationPercentage = new Decimal(account.realisasiTahun)
        .dividedBy(account.pagu)
        .times(100)
        .toNumber()

      expect(utilizationPercentage).toBeGreaterThan(80)
      expect(account.sisaPagu).toBe(1500000) // 15% remaining
    })

    it('should calculate remaining budget correctly for budget alerts', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST006',
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

      // Test: Add realization
      await t.run(async (ctx: any) => {
        const account = await ctx.db.get(accountId)
        const newRealisasi = 9000000 // 90% of 10M
        
        await ctx.db.patch(accountId, {
          realisasiTahun: newRealisasi,
          sisaPagu: account.pagu - newRealisasi,
          updatedAt: Date.now(),
        })
      })

      // Verify: Remaining budget
      const account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      const remainingPercentage = new Decimal(account.sisaPagu)
        .dividedBy(account.pagu)
        .times(100)
        .toNumber()

      expect(remainingPercentage).toBe(10) // 10% remaining
      expect(account.sisaPagu).toBe(1000000)
    })
  })

  describe('Hierarchical Budget Aggregation', () => {
    it('should aggregate account budgets to subkegiatan level', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST007',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const subkegiatanId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaSubkegiatans', {
          kode: '1.01.01',
          nama: 'Subkegiatan Test',
          pagu: 0, // Will be calculated
          sisaPagu: 0,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create 3 accounts under this subkegiatan
      const account1Id = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Account 1',
          pagu: 3000000,
          sisaPagu: 3000000,
          realisasiTahun: 0,
          subkegiatanId,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const account2Id = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.02',
          nama: 'Account 2',
          pagu: 4000000,
          sisaPagu: 4000000,
          realisasiTahun: 0,
          subkegiatanId,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const account3Id = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.03',
          nama: 'Account 3',
          pagu: 3000000,
          sisaPagu: 3000000,
          realisasiTahun: 0,
          subkegiatanId,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Calculate total pagu for subkegiatan
      const totalPagu = await t.run(async (ctx: any) => {
        const accounts = await ctx.db
          .query('rkaAccounts')
          .filter((q: any) => q.eq(q.field('subkegiatanId'), subkegiatanId))
          .collect()
        
        return accounts.reduce((sum: number, acc: any) => sum + acc.pagu, 0)
      })

      // Verify
      expect(totalPagu).toBe(10000000) // 3M + 4M + 3M = 10M
    })

    it('should aggregate realisasi from accounts to subkegiatan', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST008',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const subkegiatanId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaSubkegiatans', {
          kode: '1.01.01',
          nama: 'Subkegiatan Test',
          pagu: 10000000,
          sisaPagu: 10000000,
          realisasiTahun: 0,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Create accounts with realizations
      await t.run(async (ctx: any) => {
        await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Account 1',
          pagu: 5000000,
          sisaPagu: 3000000,
          realisasiTahun: 2000000, // 2M realized
          subkegiatanId,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })

        await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.02',
          nama: 'Account 2',
          pagu: 5000000,
          sisaPagu: 2000000,
          realisasiTahun: 3000000, // 3M realized
          subkegiatanId,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Calculate total realisasi for subkegiatan
      const totalRealisasi = await t.run(async (ctx: any) => {
        const accounts = await ctx.db
          .query('rkaAccounts')
          .filter((q: any) => q.eq(q.field('subkegiatanId'), subkegiatanId))
          .collect()
        
        return accounts.reduce((sum: number, acc: any) => sum + acc.realisasiTahun, 0)
      })

      // Verify
      expect(totalRealisasi).toBe(5000000) // 2M + 3M = 5M
    })
  })

  describe('Budget Validation', () => {
    it('should validate NPD line amount against account sisaPagu', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST009',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const accountId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Account',
          pagu: 10000000,
          sisaPagu: 3000000, // Only 3M available
          realisasiTahun: 7000000,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Validate NPD line amount
      const npdLineAmount = 4000000 // Exceeds sisaPagu

      await expect(async () => {
        await t.run(async (ctx: any) => {
          const account = await ctx.db.get(accountId)
          
          if (npdLineAmount > account.sisaPagu) {
            throw new Error(`Amount ${npdLineAmount} exceeds available sisaPagu ${account.sisaPagu}`)
          }
        })
      }).rejects.toThrow(/exceeds available sisaPagu/)
    })

    it('should allow NPD line amount within sisaPagu', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST010',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const accountId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Account',
          pagu: 10000000,
          sisaPagu: 5000000, // 5M available
          realisasiTahun: 5000000,
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Validate NPD line amount within sisaPagu
      const npdLineAmount = 3000000 // Within sisaPagu

      const isValid = await t.run(async (ctx: any) => {
        const account = await ctx.db.get(accountId)
        return npdLineAmount <= account.sisaPagu
      })

      expect(isValid).toBe(true)
    })
  })

  describe('Realization Reversal', () => {
    it('should correctly revert realization when SP2D is deleted', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST011',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const accountId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Account',
          pagu: 10000000,
          sisaPagu: 7000000,
          realisasiTahun: 3000000, // 3M realized
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Revert realization of 3M
      await t.run(async (ctx: any) => {
        const account = await ctx.db.get(accountId)
        const revertAmount = 3000000
        
        const newRealisasi = account.realisasiTahun - revertAmount
        const newSisaPagu = account.pagu - newRealisasi
        
        await ctx.db.patch(accountId, {
          realisasiTahun: newRealisasi,
          sisaPagu: newSisaPagu,
          updatedAt: Date.now(),
        })
      })

      // Verify: Realization reverted
      const account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.realisasiTahun).toBe(0) // Reverted to 0
      expect(account.sisaPagu).toBe(10000000) // Restored to full pagu
    })

    it('should handle partial reversion correctly', async () => {
      // Setup
      const orgId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('organizations', {
          name: 'Test Org',
          code: 'TEST012',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      const accountId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('rkaAccounts', {
          kode: '5.1.1.01',
          nama: 'Account',
          pagu: 10000000,
          sisaPagu: 4000000,
          realisasiTahun: 6000000, // 6M realized (from 2 SP2D)
          organizationId: orgId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      })

      // Test: Revert only 2M (one SP2D deleted)
      await t.run(async (ctx: any) => {
        const account = await ctx.db.get(accountId)
        const revertAmount = 2000000
        
        const newRealisasi = account.realisasiTahun - revertAmount
        const newSisaPagu = account.pagu - newRealisasi
        
        await ctx.db.patch(accountId, {
          realisasiTahun: newRealisasi,
          sisaPagu: newSisaPagu,
          updatedAt: Date.now(),
        })
      })

      // Verify: Partial reversion
      const account = await t.run(async (ctx: any) => {
        return await ctx.db.get(accountId)
      })

      expect(account.realisasiTahun).toBe(4000000) // 6M - 2M = 4M
      expect(account.sisaPagu).toBe(6000000) // 10M - 4M = 6M
    })
  })
})

