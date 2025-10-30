import { beforeAll, afterAll } from 'vitest'

// Test suite setup and teardown
beforeAll(async () => {
  // Global test setup
  // Mock any external services
  // Set up test database state
  console.log('Starting test suite...')
})

afterAll(async () => {
  // Global test cleanup
  console.log('Test suite completed')
})

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.SKIP_ENV_VALIDATION = 'true'

// Mock console methods to reduce noise in tests
const originalConsole = global.console

global.console = {
  ...originalConsole,
  log: process.env.NODE_ENV === 'test' ? () => {} : originalConsole.log,
  warn: process.env.NODE_ENV === 'test' ? () => {} : originalConsole.warn,
  error: originalConsole.error, // Keep errors for debugging
}