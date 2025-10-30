import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ConvexHttpClient } from 'convex/browser'
import { pdfRateLimiter } from '@/lib/api/middleware/rateLimit'
import { generatePDF } from '@/lib/services/pdfGenerator'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const app = new Hono()

// Generate PDF for NPD
app.post(
  '/:id',
  pdfRateLimiter,
  zValidator('json', z.object({
    format: z.enum(['A4', 'Legal']).default('A4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    includeWatermark: z.boolean().default(true),
    includeSignatures: z.boolean().default(true),
    copyCount: z.number().min(1).max(10).default(1)
  })),
  async (c) => {
    try {
      const { id } = c.req.param()
      const auth = c.get('auth')
      const options = c.req.valid('json')

      // Get NPD data
      const npd = await convex.query(api.npd.getById, {
        npdId: id,
        organizationId: auth.organizationId
      })

      if (!npd) {
        return c.json({ error: 'NPD not found' }, 404)
      }

      // Get organization template config
      const organization = await convex.query(api.organizations.getById, {
        organizationId: auth.organizationId
      })

      // Generate PDF
      const pdfBuffer = await generatePDF({
        npd,
        organization,
        options
      })

      // Return PDF
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="NPD-${npd.documentNumber}.pdf"`,
          'Content-Length': pdfBuffer.length.toString()
        }
      })
    } catch (error) {
      console.error('PDF generation error:', error)
      return c.json({
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  }
)

// Get PDF templates
app.get('/templates', async (c) => {
  try {
    const auth = c.get('auth')

    // Get organization template config
    const organization = await convex.query(api.organizations.getById, {
      organizationId: auth.organizationId
    })

    if (!organization?.pdfTemplateConfig) {
      return c.json({
        template: null,
        message: 'No custom template configured'
      })
    }

    return c.json({
      template: organization.pdfTemplateConfig
    })
  } catch (error) {
    console.error('Get template error:', error)
    return c.json({
      error: 'Failed to get template',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Update PDF template
app.put(
  '/templates',
  zValidator('json', z.object({
    kopSurat: z.string().optional(),
    footerText: z.string().optional(),
    signatures: z.array(z.object({
      name: z.string(),
      title: z.string(),
      position: z.string().optional()
    })).optional(),
    customStyles: z.object({
      headerColor: z.string().optional(),
      headerFont: z.string().optional(),
      bodyFont: z.string().optional(),
      watermark: z.string().optional()
    }).optional()
  })),
  async (c) => {
    try {
      const auth = c.get('auth')
      const templateData = c.req.valid('json')

      // Check admin permissions
      if (auth.userRole !== 'admin') {
        return c.json({ error: 'Insufficient permissions' }, 403)
      }

      // Update organization template
      await convex.mutation(api.organizations.updatePdfTemplate, {
        organizationId: auth.organizationId,
        templateConfig: templateData
      })

      return c.json({
        success: true,
        message: 'PDF template updated successfully'
      })
    } catch (error) {
      console.error('Update template error:', error)
      return c.json({
        error: 'Failed to update template',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  }
)

export default app