import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ConvexHttpClient } from 'convex/browser'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const app = new Hono()

// Budget realization report
app.get(
  '/realisasi',
  zValidator('query', z.object({
    tahun: z.coerce.number().optional(),
    bulan: z.coerce.number().min(1).max(12).optional(),
    format: z.enum(['json', 'csv']).default('json')
  })),
  async (c) => {
    try {
      const auth = c.get('auth')
      const { tahun, bulan, format } = c.req.valid('query')

      // Get realization data
      const data = await convex.query(api.reports.realisasi, {
        organizationId: auth.organizationId,
        tahun: tahun || new Date().getFullYear(),
        bulan
      })

      if (format === 'csv') {
        // Convert to CSV
        const csv = convertToCSV(data)
        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="realisasi.csv"'
          }
        })
      }

      return c.json({ data })
    } catch (error) {
      console.error('Realization report error:', error)
      return c.json({
        error: 'Failed to generate realization report',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  }
)

// Performance indicator report
app.get(
  '/performance',
  zValidator('query', z.object({
    tahun: z.coerce.number().optional(),
    periode: z.enum(['TW1', 'TW2', 'TW3', 'TW4', 'semua']).default('semua'),
    format: z.enum(['json', 'csv']).default('json')
  })),
  async (c) => {
    try {
      const auth = c.get('auth')
      const { tahun, periode, format } = c.req.valid('query')

      // Get performance data
      const data = await convex.query(api.reports.performance, {
        organizationId: auth.organizationId,
        tahun: tahun || new Date().getFullYear(),
        periode
      })

      if (format === 'csv') {
        const csv = convertToCSV(data)
        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="performance.csv"'
          }
        })
      }

      return c.json({ data })
    } catch (error) {
      console.error('Performance report error:', error)
      return c.json({
        error: 'Failed to generate performance report',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  }
)

// Audit trail report
app.get(
  '/audit',
  zValidator('query', z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    userId: z.string().optional(),
    action: z.string().optional(),
    format: z.enum(['json', 'csv']).default('json')
  })),
  async (c) => {
    try {
      const auth = c.get('auth')
      const { startDate, endDate, userId, action, format } = c.req.valid('query')

      // Check admin permissions for audit reports
      if (auth.userRole !== 'admin' && auth.userRole !== 'verifikator') {
        return c.json({ error: 'Insufficient permissions' }, 403)
      }

      // Get audit data
      const data = await convex.query(api.reports.audit, {
        organizationId: auth.organizationId,
        startDate: startDate ? new Date(startDate).getTime() : undefined,
        endDate: endDate ? new Date(endDate).getTime() : undefined,
        userId,
        action
      })

      if (format === 'csv') {
        const csv = convertToCSV(data)
        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="audit.csv"'
          }
        })
      }

      return c.json({ data })
    } catch (error) {
      console.error('Audit report error:', error)
      return c.json({
        error: 'Failed to generate audit report',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  }
)

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return 'No data available'
  }

  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header]
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value ?? ''
    })
    csvRows.push(values.join(','))
  }

  return csvRows.join('\n')
}

export default app