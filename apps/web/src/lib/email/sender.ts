/**
 * Email Sender Service
 * 
 * Provides email sending functionality using Resend API with retry logic,
 * rate limiting, and comprehensive error handling.
 */

import { Resend } from 'resend'
import { render } from '@react-email/components'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  react: React.ReactElement
  from?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  attempts: number
}

/**
 * Send email with retry logic
 * 
 * @param options Email configuration
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param retryDelay Initial delay between retries in ms (default: 1000)
 */
export async function sendEmail(
  options: EmailOptions,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<EmailResult> {
  const { react, from = 'NPD Tracker <noreply@npdtracker.id>', ...restOptions } = options

  let lastError: Error | null = null
  let attempts = 0

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    attempts++

    try {
      // Render React component to HTML
      const html = render(react)

      // Send email via Resend
      const { data, error } = await resend.emails.send({
        from,
        html,
        ...restOptions,
      })

      if (error) {
        throw new Error(error.message || 'Failed to send email')
      }

      // Success
      return {
        success: true,
        messageId: data?.id,
        attempts,
      }
    } catch (error) {
      lastError = error as Error
      console.error(`Email send attempt ${attempt + 1} failed:`, error)

      // Don't retry on last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt)
        console.log(`Retrying in ${delay}ms...`)
        await sleep(delay)
      }
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    attempts,
  }
}

/**
 * Send email batch with rate limiting
 * 
 * @param emails Array of email options
 * @param batchSize Number of emails to send per batch (default: 10)
 * @param batchDelay Delay between batches in ms (default: 1000)
 */
export async function sendEmailBatch(
  emails: EmailOptions[],
  batchSize: number = 10,
  batchDelay: number = 1000
): Promise<EmailResult[]> {
  const results: EmailResult[] = []

  // Process emails in batches
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    
    console.log(`Sending batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(emails.length / batchSize)}`)
    
    // Send batch in parallel
    const batchResults = await Promise.all(
      batch.map(email => sendEmail(email))
    )
    
    results.push(...batchResults)

    // Wait before next batch (rate limiting)
    if (i + batchSize < emails.length) {
      await sleep(batchDelay)
    }
  }

  return results
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate multiple email addresses
 */
export function validateEmails(emails: string | string[]): { valid: boolean; invalid: string[] } {
  const emailArray = Array.isArray(emails) ? emails : [emails]
  const invalid = emailArray.filter(email => !isValidEmail(email))
  
  return {
    valid: invalid.length === 0,
    invalid,
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get default sender email based on organization
 */
export function getDefaultSender(organizationName?: string): string {
  if (organizationName) {
    return `${organizationName} <noreply@npdtracker.id>`
  }
  return 'NPD Tracker <noreply@npdtracker.id>'
}

/**
 * Format email recipients list for display
 */
export function formatRecipients(recipients: string | string[]): string {
  const recipientArray = Array.isArray(recipients) ? recipients : [recipients]
  
  if (recipientArray.length === 0) return 'None'
  if (recipientArray.length === 1) return recipientArray[0]
  if (recipientArray.length === 2) return recipientArray.join(' and ')
  
  return `${recipientArray.slice(0, -1).join(', ')}, and ${recipientArray[recipientArray.length - 1]}`
}

/**
 * Email sending statistics
 */
export interface EmailStats {
  sent: number
  failed: number
  totalAttempts: number
  successRate: number
}

/**
 * Calculate email sending statistics from results
 */
export function calculateEmailStats(results: EmailResult[]): EmailStats {
  const sent = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const totalAttempts = results.reduce((sum, r) => sum + r.attempts, 0)
  const successRate = results.length > 0 ? (sent / results.length) * 100 : 0

  return {
    sent,
    failed,
    totalAttempts,
    successRate,
  }
}

