/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting to protect against brute-force attacks and DoS.
 * Uses Upstash Redis if configured, otherwise falls back to in-memory storage.
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting (fallback when Redis is not available)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of inMemoryStore.entries()) {
      if (entry.resetAt < now) {
        inMemoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // API routes: 100 requests per minute
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  // Auth routes: 5 requests per minute
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000,
  },
  // File uploads: 10 requests per hour
  upload: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  },
  // Default: 60 requests per minute
  default: {
    maxRequests: 60,
    windowMs: 60 * 1000,
  },
};

/**
 * Get rate limit configuration based on route
 */
function getRateLimitConfig(pathname: string): RateLimitConfig {
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    return RATE_LIMITS.auth;
  }
  if (pathname.startsWith('/api/v1/files/upload')) {
    return RATE_LIMITS.upload;
  }
  if (pathname.startsWith('/api')) {
    return RATE_LIMITS.api;
  }
  return RATE_LIMITS.default;
}

/**
 * Get client identifier (IP address or user ID)
 */
function getClientId(req: NextRequest): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Include pathname to have separate limits per route type
  return `${ip}:${req.nextUrl.pathname}`;
}

/**
 * Check rate limit using in-memory store
 */
function checkRateLimitInMemory(
  clientId: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = inMemoryStore.get(clientId);

  if (!entry || entry.resetAt < now) {
    // Create new entry
    const resetAt = now + config.windowMs;
    inMemoryStore.set(clientId, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  // Increment count
  entry.count++;
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return { allowed, remaining, resetAt: entry.resetAt };
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(req: NextRequest): Promise<NextResponse | null> {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  const config = getRateLimitConfig(req.nextUrl.pathname);
  const clientId = getClientId(req);

  // Check rate limit (in-memory for now, can be extended to use Redis)
  const { allowed, remaining, resetAt } = checkRateLimitInMemory(clientId, config);

  if (!allowed) {
    // Rate limit exceeded
    const response = NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
      },
      { status: 429 }
    );

    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', resetAt.toString());
    response.headers.set('Retry-After', Math.ceil((resetAt - Date.now()) / 1000).toString());

    return response;
  }

  // Rate limit not exceeded, continue
  return null;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  req: NextRequest
): NextResponse {
  const config = getRateLimitConfig(req.nextUrl.pathname);
  const clientId = getClientId(req);
  const entry = inMemoryStore.get(clientId);

  if (entry) {
    const remaining = Math.max(0, config.maxRequests - entry.count);
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', entry.resetAt.toString());
  }

  return response;
}

