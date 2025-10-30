import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { ConvexHttpClient } from 'convex/browser'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const app = new Hono()

// Get user notifications
app.get('/', async (c) => {
  try {
    const auth = c.get('auth')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = parseInt(c.req.query('offset') || '0')

    // Get notifications
    const notifications = await convex.query(api.notifications.list, {
      userId: auth.userId,
      limit,
      offset
    })

    // Get unread count
    const unreadCount = await convex.query(api.notifications.unreadCount, {
      userId: auth.userId
    })

    return c.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === limit
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return c.json({
      error: 'Failed to get notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Mark notifications as read
app.put(
  '/read',
  zValidator('json', z.object({
    notificationIds: z.array(z.string())
  })),
  async (c) => {
    try {
      const auth = c.get('auth')
      const { notificationIds } = c.req.valid('json')

      await convex.mutation(api.notifications.markAsRead, {
        userId: auth.userId,
        notificationIds
      })

      return c.json({
        success: true,
        message: 'Notifications marked as read'
      })
    } catch (error) {
      console.error('Mark as read error:', error)
      return c.json({
        error: 'Failed to mark notifications as read',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  }
)

// Mark all notifications as read
app.put('/read-all', async (c) => {
  try {
    const auth = c.get('auth')

    await convex.mutation(api.notifications.markAllAsRead, {
      userId: auth.userId
    })

    return c.json({
      success: true,
      message: 'All notifications marked as read'
    })
  } catch (error) {
    console.error('Mark all as read error:', error)
    return c.json({
      error: 'Failed to mark all notifications as read',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Create notification (for system/automated notifications)
app.post(
  '/',
  zValidator('json', z.object({
    type: z.string(),
    title: z.string(),
    message: z.string(),
    userId: z.string().optional(),
    entityId: z.string().optional(),
    entityType: z.string().optional()
  })),
  async (c) => {
    try {
      const auth = c.get('auth')
      const notificationData = c.req.valid('json')

      // Check admin permissions for creating notifications
      if (auth.userRole !== 'admin') {
        return c.json({ error: 'Insufficient permissions' }, 403)
      }

      await convex.mutation(api.notifications.create, {
        organizationId: auth.organizationId,
        createdBy: auth.userId,
        ...notificationData
      })

      return c.json({
        success: true,
        message: 'Notification created successfully'
      })
    } catch (error) {
      console.error('Create notification error:', error)
      return c.json({
        error: 'Failed to create notification',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  }
)

// Get notification settings
app.get('/settings', async (c) => {
  try {
    const auth = c.get('auth')

    const settings = await convex.query(api.notifications.getSettings, {
      userId: auth.userId
    })

    return c.json({ settings })
  } catch (error) {
    console.error('Get notification settings error:', error)
    return c.json({
      error: 'Failed to get notification settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Update notification settings
app.put(
  '/settings',
  zValidator('json', z.object({
    emailEnabled: z.boolean().default(true),
    browserEnabled: z.boolean().default(true),
    types: z.array(z.string()).default([]), // Array of notification types
    frequency: z.enum(['immediate', 'hourly', 'daily']).default('immediate')
  })),
  async (c) => {
    try {
      const auth = c.get('auth')
      const settings = c.req.valid('json')

      await convex.mutation(api.notifications.updateSettings, {
        userId: auth.userId,
        settings
      })

      return c.json({
        success: true,
        message: 'Notification settings updated successfully'
      })
    } catch (error) {
      console.error('Update notification settings error:', error)
      return c.json({
        error: 'Failed to update notification settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  }
)

export default app