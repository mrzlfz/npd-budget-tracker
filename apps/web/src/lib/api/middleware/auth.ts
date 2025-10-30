import { Context, Next } from 'hono'
import { getAuth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

interface AuthContext {
  userId: string
  organizationId: string
  userRole: string
}

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    // Get Clerk auth
    const { userId } = getAuth(c.req)
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Get user from Convex
    const user = await convex.query(api.users.getByClerkId, {
      clerkUserId: userId
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Add auth context
    const authContext: AuthContext = {
      userId: user._id,
      organizationId: user.organizationId,
      userRole: user.role
    }

    c.set('auth', authContext)
    await next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
}

// Helper function to check permissions
export const requireRole = (roles: string[]) => {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth') as AuthContext
    if (!auth || !roles.includes(auth.userRole)) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }
    await next()
  }
}

// Request notification permission (for browser notifications)
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}