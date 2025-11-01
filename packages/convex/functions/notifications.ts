/**
 * Notifications Management
 * 
 * Handles creating, updating, and querying notification records
 * for email, in-app, and other notification types.
 */

import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

/**
 * Create a new notification
 */
export const create = mutation({
  args: {
    type: v.union(v.literal('email'), v.literal('in_app'), v.literal('push')),
    recipient: v.string(),
    subject: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('sent'),
      v.literal('failed'),
      v.literal('read')
    ),
    organizationId: v.id('organizations'),
    userId: v.optional(v.id('users')),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert('notifications', {
      type: args.type,
      recipient: args.recipient,
      subject: args.subject,
      message: '', // Will be set later if needed
      status: args.status,
      organizationId: args.organizationId,
      userId: args.userId,
      metadata: args.metadata,
      createdAt: Date.now(),
    })

    return notificationId
  },
})

/**
 * Update notification status
 */
export const updateStatus = mutation({
  args: {
    id: v.id('notifications'),
    status: v.union(
      v.literal('pending'),
      v.literal('sent'),
      v.literal('failed'),
      v.literal('read')
    ),
    sentAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      sentAt: args.sentAt,
      metadata: args.metadata,
    })

    return { success: true }
  },
})

/**
 * Get failed notifications by organization
 */
export const getFailedByOrganization = query({
  args: {
    organizationId: v.id('organizations'),
    since: v.number(),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field('status'), 'failed'),
          q.gte(q.field('createdAt'), args.since)
        )
      )
      .collect()

    return notifications
  },
})

/**
 * Get user notifications (for in-app display)
 */
export const getUserNotifications = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId || userId !== args.userId) {
      throw new Error('Unauthorized')
    }

    let query = ctx.db
      .query('notifications')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .order('desc')

    if (args.unreadOnly) {
      query = query.filter((q) => q.neq(q.field('status'), 'read'))
    }

    const notifications = await query
      .take(args.limit || 50)

    return notifications
  },
})

/**
 * Mark notification as read
 */
export const markAsRead = mutation({
  args: {
    id: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const notification = await ctx.db.get(args.id)
    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found or access denied')
    }

    await ctx.db.patch(args.id, {
      status: 'read',
    })

    return { success: true }
  },
})

/**
 * Get notification statistics
 */
export const getStats = query({
  args: {
    organizationId: v.id('organizations'),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const user = await ctx.db.get(userId)
    if (!user || user.organizationId !== args.organizationId) {
      throw new Error('Access denied')
    }

    const days = args.days || 30
    const since = Date.now() - days * 24 * 60 * 60 * 1000

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId)
      )
      .filter((q) => q.gte(q.field('createdAt'), since))
      .collect()

    const total = notifications.length
    const sent = notifications.filter((n) => n.status === 'sent').length
    const failed = notifications.filter((n) => n.status === 'failed').length
    const pending = notifications.filter((n) => n.status === 'pending').length

    return {
      total,
      sent,
      failed,
      pending,
      successRate: total > 0 ? (sent / total) * 100 : 0,
    }
  },
})
