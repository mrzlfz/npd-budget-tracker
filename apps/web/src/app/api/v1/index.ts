import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authMiddleware } from '@/lib/api/middleware/auth'
import { rateLimiter } from '@/lib/api/middleware/rateLimit'

// Import routes
import pdfRoutes from './pdf/routes'
import reportsRoutes from './reports/routes'
import notificationsRoutes from './notifications/routes'
import importRoutes from './import/routes'

const app = new Hono()

// Global middleware
app.use('*', cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.NEXT_PUBLIC_APP_URL!]
    : ['http://localhost:3000'],
  credentials: true,
}))

app.use('*', logger())
app.use('*', rateLimiter)

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Protected routes
app.use('/pdf/*', authMiddleware)
app.use('/reports/*', authMiddleware)
app.use('/notifications/*', authMiddleware)

// Route registration
app.route('/pdf', pdfRoutes)
app.route('/reports', reportsRoutes)
app.route('/notifications', notificationsRoutes)
app.route('/import', importRoutes)

// Error handling
app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json(
    {
      error: 'Internal Server Error',
      message: c.env.NODE_ENV === 'development' ? err.message : undefined
    },
    500
  )
})

// 404 handling
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

export default app