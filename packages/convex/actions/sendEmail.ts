/**
 * Convex Actions for Email Sending
 * 
 * These actions handle email sending from the Convex backend,
 * including queueing, retry logic, and logging.
 */

import { action } from '../_generated/server'
import { v } from 'convex/values'
import { api } from '../_generated/api'

// Email sending is handled via API routes since Resend requires Node.js runtime
// This action will call the Next.js API route to send emails

interface EmailPayload {
  to: string | string[]
  subject: string
  templateName: string
  templateData: Record<string, any>
  organizationId: string
}

/**
 * Queue email for sending
 * 
 * Creates a notification record and triggers email sending via API
 */
export const queueEmail = action({
  args: {
    to: v.union(v.string(), v.array(v.string())),
    subject: v.string(),
    templateName: v.string(),
    templateData: v.any(),
    organizationId: v.id('organizations'),
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    try {
      // Create notification record
      const notificationId = await ctx.runMutation(api.notifications.create, {
        type: 'email',
        recipient: Array.isArray(args.to) ? args.to[0] : args.to,
        subject: args.subject,
        status: 'pending',
        organizationId: args.organizationId,
        userId: args.userId,
        metadata: {
          templateName: args.templateName,
          templateData: args.templateData,
        },
      })

      // Call API route to send email
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CONVEX_API_KEY}`,
        },
        body: JSON.stringify({
          to: args.to,
          subject: args.subject,
          templateName: args.templateName,
          templateData: args.templateData,
          notificationId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Mark notification as sent
        await ctx.runMutation(api.notifications.updateStatus, {
          id: notificationId,
          status: 'sent',
          sentAt: Date.now(),
          metadata: {
            messageId: result.messageId,
            attempts: result.attempts,
          },
        })

        return {
          success: true,
          notificationId,
          messageId: result.messageId,
        }
      } else {
        // Mark notification as failed
        await ctx.runMutation(api.notifications.updateStatus, {
          id: notificationId,
          status: 'failed',
          metadata: {
            error: result.error,
            attempts: result.attempts,
          },
        })

        return {
          success: false,
          error: result.error,
          notificationId,
        }
      }
    } catch (error) {
      console.error('Email queue error:', error)
      throw new Error(`Failed to queue email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
})

/**
 * Send NPD notification emails
 */
export const sendNPDNotification = action({
  args: {
    npdId: v.id('npdDocuments'),
    eventType: v.union(
      v.literal('submitted'),
      v.literal('verified'),
      v.literal('rejected'),
      v.literal('finalized')
    ),
    recipients: v.array(v.string()),
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    // Fetch NPD data
    const npd = await ctx.runQuery(api.npd.getById, { id: args.npdId })
    
    if (!npd) {
      throw new Error('NPD not found')
    }

    // Fetch organization
    const organization = await ctx.runQuery(api.organizations.getById, {
      id: args.organizationId,
    })

    // Determine template and subject
    let templateName: string
    let subject: string

    switch (args.eventType) {
      case 'submitted':
        templateName = 'NPDSubmitted'
        subject = `NPD ${npd.documentNumber} Menunggu Verifikasi`
        break
      case 'verified':
        templateName = 'NPDVerified'
        subject = `NPD ${npd.documentNumber} Telah Diverifikasi`
        break
      case 'rejected':
        templateName = 'NPDRejected'
        subject = `NPD ${npd.documentNumber} Ditolak`
        break
      case 'finalized':
        templateName = 'NPDFinalized'
        subject = `NPD ${npd.documentNumber} Telah Difinalisasi`
        break
      default:
        throw new Error('Invalid event type')
    }

    // Queue emails for all recipients
    const results = await Promise.all(
      args.recipients.map(recipient =>
        ctx.runAction(api.actions.sendEmail.queueEmail, {
          to: recipient,
          subject,
          templateName,
          templateData: {
            npd,
            organization,
            eventType: args.eventType,
          },
          organizationId: args.organizationId,
        })
      )
    )

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return {
      success: failCount === 0,
      sent: successCount,
      failed: failCount,
      results,
    }
  },
})

/**
 * Send SP2D notification email
 */
export const sendSP2DNotification = action({
  args: {
    sp2dId: v.string(),
    recipients: v.array(v.string()),
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    // Fetch SP2D data
    const sp2d = await ctx.runQuery(api.sp2d.getById, { id: args.sp2dId })
    
    if (!sp2d) {
      throw new Error('SP2D not found')
    }

    // Fetch organization
    const organization = await ctx.runQuery(api.organizations.getById, {
      id: args.organizationId,
    })

    // Queue emails
    const results = await Promise.all(
      args.recipients.map(recipient =>
        ctx.runAction(api.actions.sendEmail.queueEmail, {
          to: recipient,
          subject: `SP2D ${sp2d.noSP2D} Telah Dibuat`,
          templateName: 'SP2DCreated',
          templateData: {
            sp2d,
            organization,
          },
          organizationId: args.organizationId,
        })
      )
    )

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return {
      success: failCount === 0,
      sent: successCount,
      failed: failCount,
    }
  },
})

/**
 * Send budget alert email
 */
export const sendBudgetAlert = action({
  args: {
    accountId: v.id('rkaAccounts'),
    percentage: v.number(),
    recipients: v.array(v.string()),
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    // Fetch account data
    const account = await ctx.runQuery(api.rkaAccounts.getById, { id: args.accountId })
    
    if (!account) {
      throw new Error('Account not found')
    }

    // Fetch organization
    const organization = await ctx.runQuery(api.organizations.getById, {
      id: args.organizationId,
    })

    // Queue emails
    const results = await Promise.all(
      args.recipients.map(recipient =>
        ctx.runAction(api.actions.sendEmail.queueEmail, {
          to: recipient,
          subject: `⚠️ Peringatan Anggaran: ${account.kode} (${args.percentage.toFixed(0)}%)`,
          templateName: 'BudgetAlert',
          templateData: {
            account,
            percentage: args.percentage,
            organization,
          },
          organizationId: args.organizationId,
        })
      )
    )

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return {
      success: failCount === 0,
      sent: successCount,
      failed: failCount,
    }
  },
})

/**
 * Retry failed email notifications
 */
export const retryFailedEmails = action({
  args: {
    organizationId: v.id('organizations'),
    maxAge: v.optional(v.number()), // Max age in milliseconds (default: 24 hours)
  },
  handler: async (ctx, args) => {
    const maxAge = args.maxAge || 24 * 60 * 60 * 1000 // 24 hours
    const cutoffTime = Date.now() - maxAge

    // Fetch failed notifications
    const failedNotifications = await ctx.runQuery(api.notifications.getFailedByOrganization, {
      organizationId: args.organizationId,
      since: cutoffTime,
    })

    console.log(`Retrying ${failedNotifications.length} failed emails`)

    // Retry each failed email
    const results = await Promise.all(
      failedNotifications.map(async notification => {
        try {
          const metadata = notification.metadata as any
          
          return await ctx.runAction(api.actions.sendEmail.queueEmail, {
            to: notification.recipient,
            subject: notification.subject,
            templateName: metadata.templateName,
            templateData: metadata.templateData,
            organizationId: args.organizationId,
            userId: notification.userId,
          })
        } catch (error) {
          console.error(`Failed to retry notification ${notification._id}:`, error)
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      })
    )

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return {
      totalAttempted: failedNotifications.length,
      successful: successCount,
      failed: failCount,
    }
  },
})

