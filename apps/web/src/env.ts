import { createEnv } from '@t3-oss/env-nextjs'

export const env = createEnv({
  // Server-side
  CLERK_SECRET_KEY: {
    description: 'Clerk secret key for authentication',
    sensitive: true,
  },
  CONVEX_DEPLOYMENT: {
    description: 'Convex deployment URL',
    sensitive: true,
  },
  RESEND_API_KEY: {
    description: 'Resend API key for email sending',
    sensitive: true,
  },

  // Client-side
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {
    description: 'Clerk publishable key for client-side authentication',
    sensitive: false,
  },
  NEXT_PUBLIC_CONVEX_URL: {
    description: 'Convex URL for client connection',
    sensitive: false,
  },
  NEXT_PUBLIC_APP_URL: {
    description: 'Base URL for the application',
    sensitive: false,
    default: 'http://localhost:3000',
  },
  NODE_ENV: {
    description: 'Node environment (development/production)',
    default: 'development',
  },

  // Feature flags
  ENABLE_EMAIL_NOTIFICATIONS: {
    description: 'Enable email notifications',
    default: true,
  },
  ENABLE_PDF_WATERMARK: {
    description: 'Enable PDF watermark by default',
    default: true,
  },
  ENABLE_CSV_IMPORT: {
    description: 'Enable CSV import functionality',
    default: true,
  },

  // Rate limiting
  PDF_RATE_LIMIT_PER_MINUTE: {
    description: 'PDF generation rate limit per minute',
    default: 5,
  },
  GENERAL_RATE_LIMIT_PER_MINUTE: {
    description: 'General API rate limit per minute',
    default: 60,
  },

  // File upload
  UPLOAD_DIR: {
    description: 'Directory for file uploads',
    default: './uploads',
  },
  MAX_FILE_SIZE: {
    description: 'Maximum file size in bytes (10MB)',
    default: 10485760,
  },

  // Email
  FROM_EMAIL: {
    description: 'Default from email address',
    default: 'noreply@npd-tracker.go.id',
  },
  FROM_NAME: {
    description: 'Default from email name',
    default: 'NPD Tracker',
  },
})