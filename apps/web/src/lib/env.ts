/**
 * Environment Variable Validation
 * 
 * This module validates all required environment variables at runtime
 * to ensure the application has all necessary configuration before starting.
 */

import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Convex
  CONVEX_DEPLOYMENT: z.string().min(1, 'CONVEX_DEPLOYMENT is required'),
  NEXT_PUBLIC_CONVEX_URL: z.string().url('NEXT_PUBLIC_CONVEX_URL must be a valid URL'),
  
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  
  // Resend Email (optional in development)
  RESEND_API_KEY: z.string().optional(),
  
  // Application
  NEXT_PUBLIC_BASE_URL: z.string().url('NEXT_PUBLIC_BASE_URL must be a valid URL').optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Sentry (optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  
  // Rate Limiting (optional - uses in-memory if not provided)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

// Type for validated environment variables
export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * Throws an error if validation fails
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `  - ${err.path.join('.')}: ${err.message}`).join('\n');
      throw new Error(
        `❌ Invalid environment variables:\n${missingVars}\n\nPlease check your .env.local file and ensure all required variables are set.`
      );
    }
    throw error;
  }
}

// Validate environment variables on module load
export const env = validateEnv();

// Export individual variables for convenience
export const {
  CONVEX_DEPLOYMENT,
  NEXT_PUBLIC_CONVEX_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY,
  RESEND_API_KEY,
  NEXT_PUBLIC_BASE_URL,
  NODE_ENV,
  NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_AUTH_TOKEN,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
} = env;

// Helper to check if we're in production
export const isProduction = NODE_ENV === 'production';
export const isDevelopment = NODE_ENV === 'development';
export const isTest = NODE_ENV === 'test';

// Helper to check if optional features are enabled
export const isEmailEnabled = !!RESEND_API_KEY;
export const isSentryEnabled = !!NEXT_PUBLIC_SENTRY_DSN;
export const isRedisEnabled = !!UPSTASH_REDIS_REST_URL && !!UPSTASH_REDIS_REST_TOKEN;

