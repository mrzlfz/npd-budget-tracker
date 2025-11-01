/**
 * Email Sending API Route
 * 
 * This route handles email sending requests from Convex actions.
 * It renders React Email templates and sends them via Resend API.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/sender'

// Import all email templates
import NPDSubmittedEmail from '@/lib/email/templates/NPDSubmitted'
import NPDVerifiedEmail from '@/lib/email/templates/NPDVerified'
import NPDRejectedEmail from '@/lib/email/templates/NPDRejected'
import NPDFinalizedEmail from '@/lib/email/templates/NPDFinalized'
import SP2DCreatedEmail from '@/lib/email/templates/SP2DCreated'
import PerformanceApprovedEmail from '@/lib/email/templates/PerformanceApproved'
import BudgetAlertEmail from '@/lib/email/templates/BudgetAlert'

// Template mapping
const templates = {
  NPDSubmitted: NPDSubmittedEmail,
  NPDVerified: NPDVerifiedEmail,
  NPDRejected: NPDRejectedEmail,
  NPDFinalized: NPDFinalizedEmail,
  SP2DCreated: SP2DCreatedEmail,
  PerformanceApproved: PerformanceApprovedEmail,
  BudgetAlert: BudgetAlertEmail,
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization (check API key from Convex)
    const authHeader = request.headers.get('authorization')
    const expectedToken = `Bearer ${process.env.CONVEX_API_KEY}`
    
    if (authHeader !== expectedToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { to, subject, templateName, templateData, notificationId } = body

    // Validate required fields
    if (!to || !subject || !templateName || !templateData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get template component
    const TemplateComponent = templates[templateName as keyof typeof templates]
    
    if (!TemplateComponent) {
      return NextResponse.json(
        { success: false, error: `Template '${templateName}' not found` },
        { status: 400 }
      )
    }

    // Render template with data
    const emailElement = TemplateComponent(templateData)

    // Send email
    const result = await sendEmail({
      to,
      subject,
      react: emailElement,
      from: templateData.organization?.name 
        ? `${templateData.organization.name} <noreply@npdtracker.id>`
        : 'NPD Tracker <noreply@npdtracker.id>',
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        attempts: result.attempts,
        notificationId,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        attempts: result.attempts,
        notificationId,
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Email send API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

