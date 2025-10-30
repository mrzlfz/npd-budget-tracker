import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Create notification for user
export const createNotification = mutation({
  args: {
    userId: v.id('users'),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    entityId: v.optional(v.id('npdDocuments')),
    entityType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert('notifications', {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      entityId: args.entityId,
      entityType: args.entityType,
      isRead: false,
      createdAt: Date.now(),
    });

    // Create audit log for notification
    await ctx.db.insert('auditLogs', {
      action: 'created',
      entityTable: 'notifications',
      entityId: notificationId,
      entityData: { type: args.type, title: args.title },
      actorUserId: args.userId,
      organizationId: (await ctx.db.get(args.userId)).organizationId,
      keterangan: `Notification created: ${args.title}`,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Real-time subscription for notifications
export const subscribe = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user's notifications, ordered by creation date (newest first)
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20)
      .collect();

    return notifications;
  },
});

// Get unread notification count
export const unreadCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

// Get notification settings for a user
export const getSettings = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // For now, return default settings
    // In a real implementation, you'd store this in a separate table
    return {
      emailEnabled: true,
      browserEnabled: true,
      types: ["npd_submitted", "npd_verified", "npd_rejected", "sp2d_created"],
      frequency: "immediate"
    };
  },
});

// Update notification settings
export const updateSettings = mutation({
  args: {
    userId: v.string(),
    settings: v.object({
      emailEnabled: v.boolean(),
      browserEnabled: v.boolean(),
      types: v.array(v.string()),
      frequency: v.enum(["immediate", "hourly", "daily"]),
    }),
  },
  handler: async (ctx, args) => {
    // For now, just log the change
    // In a real implementation, you'd store this in a separate table
    await ctx.db.insert('auditLogs', {
      action: 'updated',
      entityTable: 'notification_settings',
      entityId: args.userId,
      entityData: args.settings,
      actorUserId: args.userId,
      organizationId: 'organization', // This would need to be properly fetched
      keterangan: 'Notification settings updated',
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Mark notification as read
export const markNotificationRead = mutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    // Get notification
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    // Update notification as read
    await ctx.db.patch(args.notificationId, {
      isRead: true,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      action: 'updated',
      entityTable: 'notifications',
      entityId: args.notificationId,
      entityData: { before: { isRead: notification.isRead }, after: { isRead: true } },
      actorUserId: args.userId,
      organizationId: (await ctx.db.get(args.userId)).organizationId,
      keterangan: `Notification marked as read: ${notification.title}`,
      createdAt: Date.now(),
    });

    return args.notificationId;
  },
});

// Get user notifications
export const getUserNotifications = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user')
      .order('desc')
      .limit(args.limit || 50)
      .filter(q => q.eq('userId', args.userId))
      .collect();

    return notifications.map(notification => ({
      ...notification,
      // Format entity reference if available
      relatedEntity: notification.entityId && notification.entityType ? {
        id: notification.entityId,
        type: notification.entityType,
      } : undefined,
    }));
  },
});

// Get unread notification count
export const getUnreadNotificationCount = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const unreadCount = await ctx.db
      .query('notifications')
      .withIndex('by_user')
      .filter(q =>
        q.eq('userId', args.userId)
        .and(q.eq('isRead', false))
      )
      .collect()
      .length;

    return unreadCount;
  },
});

// Send NPD submitted notification
export const sendNPDSubmittedNotification = mutation({
  args: {
    npdId: v.id('npdDocuments'),
    submittedBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get NPD details
    const npd = await ctx.db.get(args.npdId);

    if (!npd) {
      throw new Error('NPD not found');
    }

    // Get submitter details
    const submitter = await ctx.db.get(args.submittedBy);

    // Create notification
    const notificationId = await ctx.db.insert('notifications', {
      userId: npd.createdBy, // Send to NPD creator
      type: 'npd_submitted',
      title: 'NPD Diajukan',
      message: `NPD ${npd.documentNumber} telah diajukan oleh ${submitter.name} untuk diverifikasi`,
      entityId: args.npdId,
      entityType: 'npd',
      isRead: false,
      createdAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      action: 'created',
      entityTable: 'notifications',
      entityId: notificationId,
      entityData: { npdId: args.npdId, documentNumber: npd.documentNumber },
      actorUserId: args.submittedBy,
      organizationId: npd.organizationId,
      keterangan: `NPD submitted notification sent to ${npd.createdBy}`,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Real-time subscription for notifications
export const subscribe = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user's notifications, ordered by creation date (newest first)
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20)
      .collect();

    return notifications;
  },
});

// Get unread notification count
export const unreadCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

// Get notification settings for a user
export const getSettings = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // For now, return default settings
    // In a real implementation, you'd store this in a separate table
    return {
      emailEnabled: true,
      browserEnabled: true,
      types: ["npd_submitted", "npd_verified", "npd_rejected", "sp2d_created"],
      frequency: "immediate"
    };
  },
});

// Update notification settings
export const updateSettings = mutation({
  args: {
    userId: v.string(),
    settings: v.object({
      emailEnabled: v.boolean(),
      browserEnabled: v.boolean(),
      types: v.array(v.string()),
      frequency: v.enum(["immediate", "hourly", "daily"]),
    }),
  },
  handler: async (ctx, args) => {
    // For now, just log the change
    // In a real implementation, you'd store this in a separate table
    await ctx.db.insert('auditLogs', {
      action: 'updated',
      entityTable: 'notification_settings',
      entityId: args.userId,
      entityData: args.settings,
      actorUserId: args.userId,
      organizationId: 'organization', // This would need to be properly fetched
      keterangan: 'Notification settings updated',
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Send NPD verified notification
export const sendNPDVerifiedNotification = mutation({
  args: {
    npdId: v.id('npdDocuments'),
    verifiedBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get NPD details
    const npd = await ctx.db.get(args.npdId);

    if (!npd) {
      throw new Error('NPD not found');
    }

    // Get verifier details
    const verifier = await ctx.db.get(args.verifiedBy);

    // Create notification
    const notificationId = await ctx.db.insert('notifications', {
      userId: npd.createdBy, // Send to NPD creator
      type: 'npd_verified',
      title: 'NPD Diverifikasi',
      message: `NPD ${npd.documentNumber} telah diverifikasi oleh ${verifier.name}`,
      entityId: args.npdId,
      entityType: 'npd',
      isRead: false,
      createdAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      action: 'created',
      entityTable: 'notifications',
      entityId: notificationId,
      entityData: { npdId: args.npdId, documentNumber: npd.documentNumber, verifiedBy: args.verifiedBy },
      actorUserId: args.verifiedBy,
      organizationId: npd.organizationId,
      keterangan: `NPD verified notification sent to ${npd.createdBy}`,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Real-time subscription for notifications
export const subscribe = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user's notifications, ordered by creation date (newest first)
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20)
      .collect();

    return notifications;
  },
});

// Get unread notification count
export const unreadCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

// Get notification settings for a user
export const getSettings = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // For now, return default settings
    // In a real implementation, you'd store this in a separate table
    return {
      emailEnabled: true,
      browserEnabled: true,
      types: ["npd_submitted", "npd_verified", "npd_rejected", "sp2d_created"],
      frequency: "immediate"
    };
  },
});

// Update notification settings
export const updateSettings = mutation({
  args: {
    userId: v.string(),
    settings: v.object({
      emailEnabled: v.boolean(),
      browserEnabled: v.boolean(),
      types: v.array(v.string()),
      frequency: v.enum(["immediate", "hourly", "daily"]),
    }),
  },
  handler: async (ctx, args) => {
    // For now, just log the change
    // In a real implementation, you'd store this in a separate table
    await ctx.db.insert('auditLogs', {
      action: 'updated',
      entityTable: 'notification_settings',
      entityId: args.userId,
      entityData: args.settings,
      actorUserId: args.userId,
      organizationId: 'organization', // This would need to be properly fetched
      keterangan: 'Notification settings updated',
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Send NPD rejected notification
export const sendNPDRejectedNotification = mutation({
  args: {
    npdId: v.id('npdDocuments'),
    rejectedBy: v.id('users'),
    rejectionReason: v.string(),
  },
  handler: async (ctx, args) => {
    // Get NPD details
    const npd = await ctx.db.get(args.npdId);

    if (!npd) {
      throw new Error('NPD not found');
    }

    // Get rejecter details
    const rejecter = await ctx.db.get(args.rejectedBy);

    // Create notification
    const notificationId = await ctx.db.insert('notifications', {
      userId: npd.createdBy, // Send to NPD creator
      type: 'npd_rejected',
      title: 'NPD Ditolak',
      message: `NPD ${npd.documentNumber} ditolak oleh ${rejecter.name}. Alasan: ${args.rejectionReason}`,
      entityId: args.npdId,
      entityType: 'npd',
      isRead: false,
      createdAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      action: 'created',
      entityTable: 'notifications',
      entityId: notificationId,
      entityData: { npdId: args.npdId, documentNumber: npd.documentNumber, rejectedBy: args.rejectedBy, rejectionReason: args.rejectionReason },
      actorUserId: args.rejectedBy,
      organizationId: npd.organizationId,
      keterangan: `NPD rejected notification sent to ${npd.createdBy}`,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Real-time subscription for notifications
export const subscribe = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user's notifications, ordered by creation date (newest first)
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20)
      .collect();

    return notifications;
  },
});

// Get unread notification count
export const unreadCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

// Get notification settings for a user
export const getSettings = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // For now, return default settings
    // In a real implementation, you'd store this in a separate table
    return {
      emailEnabled: true,
      browserEnabled: true,
      types: ["npd_submitted", "npd_verified", "npd_rejected", "sp2d_created"],
      frequency: "immediate"
    };
  },
});

// Update notification settings
export const updateSettings = mutation({
  args: {
    userId: v.string(),
    settings: v.object({
      emailEnabled: v.boolean(),
      browserEnabled: v.boolean(),
      types: v.array(v.string()),
      frequency: v.enum(["immediate", "hourly", "daily"]),
    }),
  },
  handler: async (ctx, args) => {
    // For now, just log the change
    // In a real implementation, you'd store this in a separate table
    await ctx.db.insert('auditLogs', {
      action: 'updated',
      entityTable: 'notification_settings',
      entityId: args.userId,
      entityData: args.settings,
      actorUserId: args.userId,
      organizationId: 'organization', // This would need to be properly fetched
      keterangan: 'Notification settings updated',
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Send SP2D created notification
export const sendSP2DCreatedNotification = mutation({
  args: {
    sp2dId: v.id('sp2dRefs'),
    createdBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get SP2D details
    const sp2d = await ctx.db.get(args.sp2dId);

    if (!sp2d) {
      throw new Error('SP2D not found');
    }

    // Get creator details
    const creator = await ctx.db.get(args.createdBy);

    // Get NPD details
    const npd = sp2d.npdId ? await ctx.db.get(sp2d.npdId) : null;

    // Create notification
    const notificationId = await ctx.db.insert('notifications', {
      userId: npd.createdBy, // Send to SP2D creator
      type: 'sp2d_created',
      title: 'SP2D Dibuat',
      message: `SP2D ${sp2d.noSP2D} telah dibuat untuk NPD ${npd?.documentNumber || 'N/A'}`,
      entityId: args.sp2dId,
      entityType: 'sp2d',
      isRead: false,
      createdAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      action: 'created',
      entityTable: 'notifications',
      entityId: notificationId,
      entityData: { sp2dId: args.sp2dId, noSP2D: sp2d.noSP2D, npdId: sp2d.npdId, createdBy: args.createdBy },
      actorUserId: args.createdBy,
      organizationId: sp2d.organizationId,
      keterangan: `SP2D created notification sent to ${sp2d.createdBy}`,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Real-time subscription for notifications
export const subscribe = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user's notifications, ordered by creation date (newest first)
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20)
      .collect();

    return notifications;
  },
});

// Get unread notification count
export const unreadCount = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

// Get notification settings for a user
export const getSettings = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // For now, return default settings
    // In a real implementation, you'd store this in a separate table
    return {
      emailEnabled: true,
      browserEnabled: true,
      types: ["npd_submitted", "npd_verified", "npd_rejected", "sp2d_created"],
      frequency: "immediate"
    };
  },
});

// Update notification settings
export const updateSettings = mutation({
  args: {
    userId: v.string(),
    settings: v.object({
      emailEnabled: v.boolean(),
      browserEnabled: v.boolean(),
      types: v.array(v.string()),
      frequency: v.enum(["immediate", "hourly", "daily"]),
    }),
  },
  handler: async (ctx, args) => {
    // For now, just log the change
    // In a real implementation, you'd store this in a separate table
    await ctx.db.insert('auditLogs', {
      action: 'updated',
      entityTable: 'notification_settings',
      entityId: args.userId,
      entityData: args.settings,
      actorUserId: args.userId,
      organizationId: 'organization', // This would need to be properly fetched
      keterangan: 'Notification settings updated',
      createdAt: Date.now(),
    });

    return { success: true };
  },
});