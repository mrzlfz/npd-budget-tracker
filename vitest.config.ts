import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/convex/test/**/*.test.ts',
      'apps/web/src/test/**/*.test.ts',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
    ],
    setupFiles: [
      'packages/convex/test/setup.ts',
    ],
  },
  resolve: {
    alias: {
      '@': './apps/web/src',
      '@/lib': './apps/web/src/lib',
      '@/components': './apps/web/src/components',
      '@/hooks': './apps/web/src/hooks',
      '@/app': './apps/web/src/app',
    },
  },
})