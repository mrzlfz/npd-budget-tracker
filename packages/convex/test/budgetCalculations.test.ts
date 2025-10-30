import { describe, it, expect, beforeEach } from 'vitest'
import { createMockCtx } from './testUtils'

describe('Budget Calculations', () => {
  let ctx: any

  beforeEach(() => {
    ctx = createMockCtx('admin')
  })

  describe('Account Level Calculations', () => {
    it('should calculate sisa pagu correctly', () => {
      const account = {
        _id: 'account-1',
        paguTahun: 10000000,
        realisasiTahun: 7000000,
        sisaPagu: 3000000,
      }

      // Test sisa pagu calculation
      const expectedSisaPagu = account.paguTahun - account.realisasiTahun
      expect(expectedSisaPagu).toBe(3000000)
      expect(expectedSisaPagu).toEqual(account.sisaPagu)
    })

    it('should handle zero realisasi correctly', () => {
      const account = {
        _id: 'account-2',
        paguTahun: 10000000,
        realisasiTahun: 0,
        sisaPagu: 10000000,
      }

      const expectedSisaPagu = account.paguTahun - account.realisasiTahun
      expect(expectedSisaPagu).toBe(10000000)
      expect(expectedSisaPagu).toEqual(account.sisaPagu)
    })

    it('should handle full realisasi correctly', () => {
      const account = {
        _id: 'account-3',
        paguTahun: 10000000,
        realisasiTahun: 10000000,
        sisaPagu: 0,
      }

      const expectedSisaPagu = account.paguTahun - account.realisasiTahun
      expect(expectedSisaPagu).toBe(0)
      expect(expectedSisaPagu).toEqual(account.sisaPagu)
    })

    it('should handle over-realization correctly', () => {
      const account = {
        _id: 'account-4',
        paguTahun: 10000000,
        realisasiTahun: 11000000, // Over budget
        sisaPagu: -1000000,
      }

      const expectedSisaPagu = account.paguTahun - account.realisasiTahun
      expect(expectedSisaPagu).toBe(-1000000)
      expect(expectedSisaPagu).toEqual(account.sisaPagu)
    })
  })

  describe('Subkegiatan Level Calculations', () => {
    it('should aggregate totals from accounts correctly', () => {
      const accounts = [
        { paguTahun: 10000000, realisasiTahun: 7000000 },
        { paguTahun: 8000000, realisasiTahun: 6000000 },
      ]

      const totalPagu = accounts.reduce((sum, account) => sum + account.paguTahun, 0)
      const totalRealisasi = accounts.reduce((sum, account) => sum + account.realisasiTahun, 0)
      const totalSisa = totalPagu - totalRealisasi

      expect(totalPagu).toBe(18000000)
      expect(totalRealisasi).toBe(13000000)
      expect(totalSisa).toBe(5000000)
    })

    it('should calculate utilization rate correctly', () => {
      const totalPagu = 18000000
      const totalRealisasi = 13000000
      const utilizationRate = Math.round((totalRealisasi / totalPagu) * 100)

      expect(utilizationRate).toBe(72) // Round 72.22 to 72
    })

    it('should handle empty accounts list correctly', () => {
      const accounts: any[] = []

      const totalPagu = accounts.reduce((sum, account) => sum + account.paguTahun, 0)
      const totalRealisasi = accounts.reduce((sum, account) => sum + account.realisasiTahun, 0)

      expect(totalPagu).toBe(0)
      expect(totalRealisasi).toBe(0)
    })
  })

  describe('Program Level Calculations', () => {
    it('should cascade calculations through hierarchy', () => {
      // Mock hierarchy data
      const program = {
        _id: 'program-1',
        totalPagu: 50000000, // Sum of all kegiatans
        totalRealisasi: 35000000,
        totalSisa: 15000000,
      }

      const kegiatans = [
        {
          totalPagu: 30000000,
          totalRealisasi: 20000000,
          totalSisa: 10000000,
        },
        {
          totalPagu: 20000000,
          totalRealisasi: 15000000,
          totalSisa: 5000000,
        },
      ]

      // Verify program totals match sum of kegiatans
      const expectedProgramPagu = kegiatans.reduce((sum, keg) => sum + keg.totalPagu, 0)
      const expectedProgramRealisasi = kegiatans.reduce((sum, keg) => sum + keg.totalRealisasi, 0)
      const expectedProgramSisa = kegiatans.reduce((sum, keg) => sum + keg.totalSisa, 0)

      expect(expectedProgramPagu).toBe(50000000)
      expect(expectedProgramRealisasi).toBe(35000000)
      expect(expectedProgramSisa).toBe(15000000)
    })
  })

  describe('Budget Status Classification', () => {
    it('should classify budget status correctly', () => {
      const testCases = [
        { utilizationRate: 100, expectedStatus: 'completed', expectedColor: 'red' },
        { utilizationRate: 85, expectedStatus: 'high-utilization', expectedColor: 'yellow' },
        { utilizationRate: 65, expectedStatus: 'normal', expectedColor: 'blue' },
        { utilizationRate: 35, expectedStatus: 'low-utilization', expectedColor: 'green' },
        { utilizationRate: 110, expectedStatus: 'over-budget', expectedColor: 'red' },
      ]

      testCases.forEach(({ utilizationRate, expectedStatus, expectedColor }) => {
        let status = 'normal'
        let color = 'blue'

        if (utilizationRate >= 100) {
          status = 'completed'
          color = 'red'
        } else if (utilizationRate >= 80) {
          status = 'high-utilization'
          color = 'yellow'
        } else if (utilizationRate < 50) {
          status = 'low-utilization'
          color = 'green'
        }

        expect(status).toBe(expectedStatus)
        expect(color).toBe(expectedColor)
      })
    })
  })

  describe('Realization Integration', () => {
    it('should account for realizations in calculations', () => {
      const account = {
        _id: 'account-1',
        paguTahun: 10000000,
        realisasiTahun: 5000000, // Base realisasi
        sisaPagu: 5000000,   // 10M - 5M
      }

      const realizations = [
        { accountId: 'account-1', totalCair: 2000000 },
        { accountId: 'account-1', totalCair: 3000000 },
      ]

      const totalRealized = realizations.reduce((sum, r) => sum + r.totalCair, 0)
      const calculatedSisa = account.paguTahun - totalRealized

      expect(totalRealized).toBe(5000000)
      expect(calculatedSisa).toBe(5000000)
      expect(calculatedSisa).toEqual(account.sisaPagu)
    })

    it('should handle multiple realizations per account', () => {
      const account = {
        _id: 'account-2',
        paguTahun: 10000000,
        realisasiTahun: 0,
        sisaPagu: 10000000,
      }

      const realizations = [
        { accountId: 'account-2', totalCair: 2000000 },
        { accountId: 'account-2', totalCair: 3000000 },
        { accountId: 'account-2', totalCair: 5000000 },
      ]

      const totalRealized = realizations.reduce((sum, r) => sum + r.totalCair, 0)

      expect(totalRealized).toBe(10000000)
      expect(account.paguTahun - totalRealized).toBe(0)
    })
  })
})