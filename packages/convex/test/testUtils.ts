import type { DataModel } from '../_generated/api'
import { mutation, query } from '../_generated/server'
import { v } from 'convex/values'

// Mock test data
export const mockUsers = [
  {
    _id: 'test-user-1',
    clerkUserId: 'clerk-user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    organizationId: 'test-org-1',
    role: 'admin',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: 'test-user-2',
    clerkUserId: 'clerk-user-2',
    email: 'pptk@example.com',
    name: 'PPTK User',
    organizationId: 'test-org-1',
    role: 'pptk',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: 'test-user-3',
    clerkUserId: 'clerk-user-3',
    email: 'bendahara@example.com',
    name: 'Bendahara User',
    organizationId: 'test-org-1',
    role: 'bendahara',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
] as const

export const mockOrganizations = [
  {
    _id: 'test-org-1',
    name: 'Test Organization',
    description: 'Test organization for unit tests',
    clerkOrganizationId: 'clerk-org-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
] as const

export const mockRKAPrograms = [
  {
    _id: 'program-1',
    kode: '1.01.01.01',
    nama: 'Program A',
    uraian: 'Test Program A',
    organizationId: 'test-org-1',
    fiscalYear: 2024,
    totalPagu: 1000000000,
    status: 'active',
    createdBy: 'test-user-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: 'program-2',
    kode: '1.01.01.02',
    nama: 'Program B',
    uraian: 'Test Program B',
    organizationId: 'test-org-1',
    fiscalYear: 2024,
    totalPagu: 2000000000,
    status: 'active',
    createdBy: 'test-user-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
] as const

export const mockRKAKegiatans = [
  {
    _id: 'kegiatan-1',
    programId: 'program-1',
    kode: '1.01.01.01.01',
    nama: 'Kegiatan A1',
    uraian: 'Test Kegiatan A1',
    organizationId: 'test-org-1',
    fiscalYear: 2024,
    totalPagu: 500000000,
    status: 'active',
    createdBy: 'test-user-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
] as const

export const mockRKASubkegiatans = [
  {
    _id: 'subkegiatan-1',
    kegiatanId: 'kegiatan-1',
    programId: 'program-1',
    kode: '1.01.01.01.01.01',
    nama: 'Sub Kegiatan A1.1',
    uraian: 'Test Sub Kegiatan A1.1',
    organizationId: 'test-org-1',
    fiscalYear: 2024,
    totalPagu: 250000000,
    status: 'active',
    indikatorOutput: 'Output indikator',
    targetOutput: 100,
    satuanOutput: 'unit',
    indikatorHasil: 'Hasil indikator',
    targetHasil: 90,
    satuanHasil: '%',
    createdBy: 'test-user-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
] as const

export const mockRKAAccounts = [
  {
    _id: 'account-1',
    subkegiatanId: 'subkegiatan-1',
    kegiatanId: 'kegiatan-1',
    programId: 'program-1',
    kode: '5.1.01.01.01.001',
    uraian: 'Belanja Barang Test',
    satuan: 'unit',
    volume: 10,
    hargaSatuan: 1000000,
    paguTahun: 10000000,
    realisasiTahun: 7000000,
    sisaPagu: 3000000,
    status: 'active',
    organizationId: 'test-org-1',
    fiscalYear: 2024,
    createdBy: 'test-user-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: 'account-2',
    subkegiatanId: 'subkegiatan-1',
    kegiatanId: 'kegiatan-1',
    programId: 'program-1',
    kode: '5.1.02.01.01.002',
    uraian: 'Belanja Jasa Test',
    satuan: 'unit',
    volume: 5,
    hargaSatuan: 2000000,
    paguTahun: 10000000,
    realisasiTahun: 5000000,
    sisaPagu: 5000000,
    status: 'active',
    organizationId: 'test-org-1',
    fiscalYear: 2024,
    createdBy: 'test-user-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
] as const

export const mockRealizations = [
  {
    _id: 'realization-1',
    accountId: 'account-1',
    npdId: 'npd-1',
    totalCair: 7000000,
    catatan: 'Realization test',
    organizationId: 'test-org-1',
    createdBy: 'test-user-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
] as const

// Test database setup
export async function setupTestDatabase(ctx: any) {
  // Insert organization
  await ctx.db.insert('organizations', mockOrganizations[0])

  // Insert users
  for (const user of mockUsers) {
    await ctx.db.insert('users', user)
  }

  // Insert RKA hierarchy
  for (const program of mockRKAPrograms) {
    await ctx.db.insert('rkaPrograms', program)
  }

  for (const kegiatan of mockRKAKegiatans) {
    await ctx.db.insert('rkaKegiatans', kegiatan)
  }

  for (const subkegiatan of mockRKASubkegiatans) {
    await ctx.db.insert('rkaSubkegiatans', subkegiatan)
  }

  for (const account of mockRKAAccounts) {
    await ctx.db.insert('rkaAccounts', account)
  }

  for (const realization of mockRealizations) {
    await ctx.db.insert('realizations', realization)
  }
}

// Mock auth context
export function createMockAuthContext(userId: string, role: string) {
  return {
    auth: {
      userId,
      sessionClaims: {
        iat: Date.now() / 1000,
        exp: (Date.now() / 1000) + 3600,
        sub: userId,
      },
    },
    getAuthUserId: () => Promise.resolve(userId as any),
  }
}

// Helper functions for testing
export function createMockCtx(userRole: string, userId: string = mockUsers[0]._id) {
  const db = {
    get: async (id: string) => {
      // Mock data retrieval based on table and ID
      if (id.startsWith('test-')) {
        const allData = [
          ...mockUsers,
          ...mockOrganizations,
          ...mockRKAPrograms,
          ...mockRKAKegiatans,
          ...mockRKASubkegiatans,
          ...mockRKAAccounts,
          ...mockRealizations,
        ]
        return allData.find(item => item._id === id)
      }
      return null
    },
    query: (table: string) => ({
      withIndex: () => ({
        eq: () => ({
          first: () => {
            // Return first matching item from mock data
            switch (table) {
              case 'users':
                return mockUsers.find(u => u.role === userRole)
              case 'organizations':
                return mockOrganizations[0]
              default:
                return null
            }
          },
          collect: () => {
            // Return all matching items from mock data
            switch (table) {
              case 'rkaPrograms':
                return mockRKAPrograms
              case 'rkaAccounts':
                return mockRKAAccounts
              default:
                return []
            }
          },
        }),
      }),
    }),
    insert: async (table: string, data: any) => {
      return 'mock-id-' + Date.now()
    },
    patch: async (id: string, data: any) => {
      return id
    },
    delete: async (id: string) => {
      return id
    },
  }

  return {
    db,
    auth: createMockAuthContext(userId, userRole),
  }
}