import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ConvexHttpClient } from 'convex/browser'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const app = new Hono()

// Validate CSV structure
app.post(
  '/rka/validate',
  zValidator('json', z.object({
    headers: z.array(z.string()),
    sampleRow: z.array(z.string()),
  })),
  async (c) => {
    try {
      const auth = c.get('auth')
      const { headers, sampleRow } = c.req.valid('json')

      const result = await convex.mutation(api.csvImport.validateCSVStructure, {
        headers,
        sampleRow
      })

      return c.json(result)
    } catch (error) {
      console.error('CSV validation error:', error)
      return c.json({
        error: 'Validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  }
)

// Import RKA from CSV
app.post(
  '/rka/import',
  zValidator('json', z.object({
    fiscalYear: z.coerce.number(),
    hasHeaders: z.boolean().default(true),
    delimiter: z.string().default(','),
    encoding: z.string().default('utf-8'),
  })),
  async (c) => {
    try {
      const auth = c.get('auth')
      const { fiscalYear, hasHeaders, delimiter, encoding } = c.req.valid('json')

      // Get CSV data from request
      const body = await c.req.text()
      if (!body.trim()) {
        return c.json({ error: 'Empty file' }, 400)
      }

      // Parse CSV
      const records = parse(body, {
        columns: false,
        delimiter,
        encoding,
        from_line: hasHeaders ? 2 : 1, // Skip header row if hasHeaders
        cast: true,
        cast_date: false,
      })

      // Map to expected structure
      const csvData = records.map((record: string[]) => ({
        programKode: record[0] || '',
        programNama: record[1] || '',
        kegiatanKode: record[2] || '',
        kegiatanNama: record[3] || '',
        subkegiatanKode: record[4] || '',
        subkegiatanNama: record[5] || '',
        akunKode: record[6] || '',
        akunUraian: record[7] || '',
        satuan: record[8] || '',
        volume: record[9] ? parseFloat(record[9]) : undefined,
        hargaSatuan: record[10] ? parseFloat(record[10]) : undefined,
        paguTahun: parseFloat(record[11]) || 0,
      }))

      // Validate structure first
      const headers = hasHeaders ? records[0] : []
      const sampleRow = hasHeaders ? records[1] || [] : records[0] || []

      const validation = await convex.mutation(api.csvImport.validateCSVStructure, {
        headers,
        sampleRow
      })

      if (!validation.valid) {
        return c.json({
          error: 'Invalid CSV structure',
          details: validation.errors
        }, 400)
      }

      // Import data
      const result = await convex.mutation(api.csvImport.importRKA, {
        organizationId: auth.organizationId,
        fiscalYear,
        csvData
      })

      return c.json({
        success: true,
        message: 'RKA imported successfully',
        data: result
      })
    } catch (error) {
      console.error('CSV import error:', error)
      return c.json({
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  }
)

// Get import history
app.get('/rka/history', async (c) => {
  try {
    const auth = c.get('auth')
    const limit = parseInt(c.req.query('limit') || '10')
    const offset = parseInt(c.req.query('offset') || '0')

    // Get import history from audit logs
    const imports = await convex.query(api.audit.list, {
      organizationId: auth.organizationId,
      action: 'imported_rka',
      limit,
      offset
    })

    return c.json({
      imports,
      pagination: {
        limit,
        offset,
        hasMore: imports.length === limit
      }
    })
  } catch (error) {
    console.error('Get import history error:', error)
    return c.json({
      error: 'Failed to get import history',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Download CSV template
app.get('/rka/template', async (c) => {
  const template = [
    'programKode,programNama,kegiatanKode,kegiatanNama,subkegiatanKode,subkegiatanNama,akunKode,akunUraian,satuan,volume,hargaSatuan,paguTahun',
    '1.01.01,Program Contoh,Kegiatan Contoh,1.01.01.01,Sub Kegiatan Contoh,5.1.01.01.001,Honor Staff,orang,12,50000000,600000000',
    '1.01.01,Program Contoh,Kegiatan Contoh,1.01.01.02,Sub Kegiatan Lain,5.1.02.01.001,Belanja Modalitas,unit,1,150000000,150000000',
  ]

  const csvContent = template.join('\n')

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="template_rka.csv"'
    }
  })
})

export default app