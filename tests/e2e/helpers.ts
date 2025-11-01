/**
 * E2E Test Helpers
 * 
 * Common utilities and helper functions for Playwright E2E tests.
 */

import { Page, expect } from '@playwright/test'

// Configuration
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
export const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
export const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

/**
 * Login helper function
 */
export async function login(
  page: Page,
  email: string = TEST_USER_EMAIL,
  password: string = TEST_USER_PASSWORD
) {
  await page.goto(`${BASE_URL}/sign-in`)
  
  // Wait for Clerk sign-in form to load
  await page.waitForSelector('input[name="identifier"]', { timeout: 10000 })
  
  // Fill in email
  await page.fill('input[name="identifier"]', email)
  await page.click('button[type="submit"]')
  
  // Wait for password field
  await page.waitForSelector('input[name="password"]', { timeout: 5000 })
  
  // Fill in password
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 })
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  const logoutSelectors = [
    'button:has-text("Logout")',
    'button:has-text("Sign out")',
    'button:has-text("Keluar")',
    '[data-testid="logout-button"]',
  ]
  
  for (const selector of logoutSelectors) {
    try {
      const logoutButton = page.locator(selector).first()
      if (await logoutButton.isVisible({ timeout: 1000 })) {
        await logoutButton.click()
        return
      }
    } catch (e) {
      continue
    }
  }
  
  throw new Error('Logout button not found')
}

/**
 * Wait for element with multiple possible selectors
 */
export async function waitForAnySelector(
  page: Page,
  selectors: string[],
  options?: { timeout?: number }
): Promise<string | null> {
  const timeout = options?.timeout || 5000
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    for (const selector of selectors) {
      try {
        const element = page.locator(selector).first()
        if (await element.isVisible({ timeout: 100 })) {
          return selector
        }
      } catch (e) {
        continue
      }
    }
    await page.waitForTimeout(100)
  }
  
  return null
}

/**
 * Fill form field with label or placeholder
 */
export async function fillField(
  page: Page,
  label: string,
  value: string
) {
  const selectors = [
    `input[name="${label}"]`,
    `input[placeholder*="${label}"]`,
    `input[aria-label*="${label}"]`,
    `label:has-text("${label}") + input`,
    `label:has-text("${label}") input`,
  ]
  
  for (const selector of selectors) {
    try {
      const field = page.locator(selector).first()
      if (await field.isVisible({ timeout: 1000 })) {
        await field.fill(value)
        return
      }
    } catch (e) {
      continue
    }
  }
  
  throw new Error(`Field with label "${label}" not found`)
}

/**
 * Select dropdown option
 */
export async function selectOption(
  page: Page,
  label: string,
  value: string
) {
  const selectors = [
    `select[name="${label}"]`,
    `select[aria-label*="${label}"]`,
    `label:has-text("${label}") + select`,
    `label:has-text("${label}") select`,
  ]
  
  for (const selector of selectors) {
    try {
      const select = page.locator(selector).first()
      if (await select.isVisible({ timeout: 1000 })) {
        await select.selectOption(value)
        return
      }
    } catch (e) {
      continue
    }
  }
  
  throw new Error(`Select with label "${label}" not found`)
}

/**
 * Click button with text
 */
export async function clickButton(
  page: Page,
  text: string | RegExp
) {
  const textPattern = typeof text === 'string' ? text : text.source
  const selectors = [
    `button:has-text("${textPattern}")`,
    `[role="button"]:has-text("${textPattern}")`,
    `a:has-text("${textPattern}")`,
  ]
  
  for (const selector of selectors) {
    try {
      const button = page.locator(selector).first()
      if (await button.isVisible({ timeout: 1000 })) {
        await button.click()
        return
      }
    } catch (e) {
      continue
    }
  }
  
  throw new Error(`Button with text "${textPattern}" not found`)
}

/**
 * Upload file
 */
export async function uploadFile(
  page: Page,
  inputSelector: string,
  filePath: string
) {
  const fileInput = page.locator(inputSelector)
  await fileInput.setInputFiles(filePath)
}

/**
 * Wait for toast/notification message
 */
export async function waitForToast(
  page: Page,
  message?: string | RegExp,
  options?: { timeout?: number }
) {
  const timeout = options?.timeout || 5000
  
  const toastSelectors = [
    '[role="alert"]',
    '.toast',
    '.notification',
    '[data-testid="toast"]',
    '.Toaster',
  ]
  
  for (const selector of toastSelectors) {
    try {
      const toast = page.locator(selector).first()
      if (await toast.isVisible({ timeout: 1000 })) {
        if (message) {
          await expect(toast).toContainText(message, { timeout })
        }
        return
      }
    } catch (e) {
      continue
    }
  }
  
  if (message) {
    throw new Error(`Toast with message "${message}" not found`)
  }
}

/**
 * Wait for loading to complete
 */
export async function waitForLoadingComplete(page: Page) {
  const loadingSelectors = [
    '.loading',
    '.spinner',
    '[data-testid="loading"]',
    '[aria-busy="true"]',
  ]
  
  for (const selector of loadingSelectors) {
    try {
      await page.waitForSelector(selector, { state: 'hidden', timeout: 10000 })
    } catch (e) {
      // Loading indicator may not exist
    }
  }
  
  // Wait for network idle
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = Date.now()
  const path = `./test-results/screenshots/${name}-${timestamp}.png`
  await page.screenshot({ path, fullPage: true })
  console.log(`Screenshot saved: ${path}`)
}

/**
 * Format currency for Indonesian locale
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format date for Indonesian locale
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * Generate test data
 */
export function generateTestData() {
  const timestamp = Date.now()
  
  return {
    npd: {
      nomorNPD: `NPD-TEST-${timestamp}`,
      tanggal: new Date().toISOString().split('T')[0],
      tahun: new Date().getFullYear(),
      jenisBelanja: 'UP',
      maksud: `Test NPD untuk E2E testing - ${timestamp}`,
      catatan: 'Generated by automated E2E test',
    },
    sp2d: {
      noSPM: `SPM-TEST-${timestamp}`,
      noSP2D: `SP2D-TEST-${timestamp}`,
      tglSP2D: new Date().toISOString().split('T')[0],
      nilaiCair: 5000000,
      catatan: 'Generated by automated E2E test',
    },
    performance: {
      indikatorNama: `Test Indicator ${timestamp}`,
      target: 100,
      realisasi: 80,
      satuan: 'unit',
      periode: 'TW1',
      keterangan: 'Generated by automated E2E test',
    },
  }
}

/**
 * Clean up test data (if cleanup API exists)
 */
export async function cleanupTestData(page: Page, testId: string) {
  // This would call a cleanup API endpoint if available
  // For now, just log
  console.log(`Cleanup test data for: ${testId}`)
}

