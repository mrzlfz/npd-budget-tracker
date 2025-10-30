import { Context, Next } from 'hono'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

const cleanupStore = () => {
  const now = Date.now()
  for (const key in store) {
    if (store[key].resetTime <= now) {
      delete store[key]
    }
  }
}

setInterval(cleanupStore, 60000) // Cleanup every minute

export const rateLimiter = async (c: Context, next: Next) => {
  const ip = c.req.header('x-forwarded-for') ||
            c.req.header('x-real-ip') ||
            'unknown'

  const key = `${ip}:${c.req.path}`
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window
  const maxRequests = 60 // 60 requests per minute

  // Initialize or get current rate limit
  if (!store[key] || store[key].resetTime <= now) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs
    }
  } else {
    store[key].count++
  }

  // Check rate limit
  if (store[key].count > maxRequests) {
    return c.json({
      error: 'Too many requests',
      retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
    }, 429)
  }

  // Add rate limit headers
  c.header('X-RateLimit-Limit', maxRequests.toString())
  c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - store[key].count).toString())
  c.header('X-RateLimit-Reset', store[key].resetTime.toString())

  await next()
}

// Special rate limiter for PDF generation (more restrictive)
export const pdfRateLimiter = async (c: Context, next: Next) => {
  const auth = c.get('auth')
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const key = `pdf:${auth.userId}`
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window
  const maxRequests = 5 // 5 PDF requests per minute

  if (!store[key] || store[key].resetTime <= now) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs
    }
  } else {
    store[key].count++
  }

  if (store[key].count > maxRequests) {
    return c.json({
      error: 'Too many PDF generation requests',
      retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
    }, 429)
  }

  await next()
}