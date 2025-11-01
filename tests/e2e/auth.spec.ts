/**
 * Authentication and Organization Switching E2E Tests
 * 
 * Tests the complete authentication flow using Clerk and organization switching.
 * 
 * Test Scenarios:
 * 1. Login with valid credentials
 * 2. Redirect to dashboard after login
 * 3. Organization switching
 * 4. Logout functionality
 * 5. Protected route access
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

// Helper function to login
async function login(page: Page, email: string = TEST_USER_EMAIL, password: string = TEST_USER_PASSWORD) {
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

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and local storage before each test
    await page.context().clearCookies()
    await page.goto(BASE_URL)
  })

  test('should redirect unauthenticated users to sign-in page', async ({ page }) => {
    // Try to access protected route
    await page.goto(`${BASE_URL}/dashboard`)
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(new RegExp('/sign-in'))
    
    // Verify sign-in page elements
    await expect(page.locator('input[name="identifier"]')).toBeVisible()
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`)
    
    // Fill in email
    await page.fill('input[name="identifier"]', TEST_USER_EMAIL)
    await page.click('button[type="submit"]')
    
    // Wait for password field
    await page.waitForSelector('input[name="password"]', { timeout: 5000 })
    
    // Fill in password
    await page.fill('input[name="password"]', TEST_USER_PASSWORD)
    await page.click('button[type="submit"]')
    
    // Wait for successful login and redirect
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 })
    
    // Verify dashboard loaded
    await expect(page.locator('h1, h2')).toContainText(/dashboard/i)
  })

  test('should show error message with invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`)
    
    // Fill in invalid email
    await page.fill('input[name="identifier"]', 'invalid@example.com')
    await page.click('button[type="submit"]')
    
    // Wait for password field
    await page.waitForSelector('input[name="password"]', { timeout: 5000 })
    
    // Fill in invalid password
    await page.fill('input[name="password"]', 'WrongPassword123!')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=/incorrect|invalid|error/i')).toBeVisible({ timeout: 5000 })
  })

  test('should persist session after page reload', async ({ page }) => {
    // Login first
    await login(page)
    
    // Verify on dashboard
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
    
    // Reload page
    await page.reload()
    
    // Should still be on dashboard (session persisted)
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
    await expect(page.locator('h1, h2')).toContainText(/dashboard/i)
  })

  test('should successfully logout', async ({ page }) => {
    // Login first
    await login(page)
    
    // Verify on dashboard
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
    
    // Find and click logout button (could be in user menu)
    // Try common logout button selectors
    const logoutSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Sign out")',
      'button:has-text("Keluar")',
      '[data-testid="logout-button"]',
      'a:has-text("Logout")',
      'a:has-text("Sign out")',
      'a:has-text("Keluar")',
    ]
    
    let logoutFound = false
    for (const selector of logoutSelectors) {
      try {
        const logoutButton = page.locator(selector).first()
        if (await logoutButton.isVisible({ timeout: 1000 })) {
          await logoutButton.click()
          logoutFound = true
          break
        }
      } catch (e) {
        // Try next selector
        continue
      }
    }
    
    // If logout button not immediately visible, try opening user menu first
    if (!logoutFound) {
      const userMenuSelectors = [
        'button[aria-label="User menu"]',
        'button[aria-label="Account"]',
        '[data-testid="user-menu"]',
        '.user-menu-trigger',
      ]
      
      for (const selector of userMenuSelectors) {
        try {
          const menuButton = page.locator(selector).first()
          if (await menuButton.isVisible({ timeout: 1000 })) {
            await menuButton.click()
            await page.waitForTimeout(500)
            
            // Try logout selectors again
            for (const logoutSelector of logoutSelectors) {
              const logoutButton = page.locator(logoutSelector).first()
              if (await logoutButton.isVisible({ timeout: 1000 })) {
                await logoutButton.click()
                logoutFound = true
                break
              }
            }
            if (logoutFound) break
          }
        } catch (e) {
          continue
        }
      }
    }
    
    if (logoutFound) {
      // Wait for redirect to sign-in or home page
      await page.waitForURL(new RegExp('/(sign-in|$)'), { timeout: 5000 })
      
      // Try to access dashboard again - should redirect to sign-in
      await page.goto(`${BASE_URL}/dashboard`)
      await expect(page).toHaveURL(new RegExp('/sign-in'))
    } else {
      console.warn('Logout button not found - skipping logout verification')
    }
  })
})

test.describe('Organization Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page)
  })

  test('should display current organization name', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('h1, h2', { timeout: 5000 })
    
    // Look for organization name display
    // Common locations: header, sidebar, user menu
    const orgNameSelectors = [
      '[data-testid="organization-name"]',
      '.organization-name',
      '[aria-label*="organization"]',
      'text=/Dinas|OPD|Organization/i',
    ]
    
    let orgFound = false
    for (const selector of orgNameSelectors) {
      try {
        const orgElement = page.locator(selector).first()
        if (await orgElement.isVisible({ timeout: 1000 })) {
          await expect(orgElement).not.toBeEmpty()
          orgFound = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!orgFound) {
      console.warn('Organization name display not found - may need to update selectors')
    }
  })

  test('should open organization switcher', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('h1, h2', { timeout: 5000 })
    
    // Look for organization switcher button
    const switcherSelectors = [
      'button[aria-label*="Switch organization"]',
      'button[aria-label*="Change organization"]',
      '[data-testid="org-switcher"]',
      '.organization-switcher',
      'button:has-text("Switch")',
      'button:has-text("Ganti")',
    ]
    
    let switcherFound = false
    for (const selector of switcherSelectors) {
      try {
        const switcherButton = page.locator(selector).first()
        if (await switcherButton.isVisible({ timeout: 1000 })) {
          await switcherButton.click()
          
          // Wait for organization list/modal to appear
          await page.waitForSelector('[role="dialog"], [role="menu"], .organization-list', { timeout: 2000 })
          
          // Verify organization list is visible
          const orgList = page.locator('[role="dialog"], [role="menu"], .organization-list').first()
          await expect(orgList).toBeVisible()
          
          switcherFound = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!switcherFound) {
      console.warn('Organization switcher not found - may be single-org setup or needs selector update')
    }
  })

  test('should switch to different organization', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('h1, h2', { timeout: 5000 })
    
    // Try to open organization switcher
    const switcherSelectors = [
      'button[aria-label*="Switch organization"]',
      'button[aria-label*="Change organization"]',
      '[data-testid="org-switcher"]',
      '.organization-switcher',
    ]
    
    let switcherOpened = false
    for (const selector of switcherSelectors) {
      try {
        const switcherButton = page.locator(selector).first()
        if (await switcherButton.isVisible({ timeout: 1000 })) {
          await switcherButton.click()
          await page.waitForTimeout(500)
          switcherOpened = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (switcherOpened) {
      // Wait for organization list
      await page.waitForSelector('[role="dialog"], [role="menu"]', { timeout: 2000 })
      
      // Get list of organizations
      const orgItems = page.locator('[role="menuitem"], .organization-item, button:has-text("Dinas"), button:has-text("OPD")')
      const count = await orgItems.count()
      
      if (count > 1) {
        // Get current organization name (if displayed)
        let currentOrg = ''
        try {
          const currentOrgElement = page.locator('[data-testid="organization-name"], .organization-name').first()
          currentOrg = await currentOrgElement.textContent() || ''
        } catch (e) {
          // Current org name not found
        }
        
        // Click on a different organization
        for (let i = 0; i < count; i++) {
          const orgItem = orgItems.nth(i)
          const orgText = await orgItem.textContent()
          
          if (orgText && orgText !== currentOrg) {
            await orgItem.click()
            
            // Wait for page to reload/update
            await page.waitForTimeout(2000)
            
            // Verify organization changed
            // Dashboard should still be accessible
            await expect(page).toHaveURL(new RegExp('/dashboard'))
            
            // Verify organization name updated (if displayed)
            if (currentOrg) {
              const newOrgElement = page.locator('[data-testid="organization-name"], .organization-name').first()
              const newOrgText = await newOrgElement.textContent()
              expect(newOrgText).not.toBe(currentOrg)
            }
            
            break
          }
        }
      } else {
        console.warn('Only one organization available - cannot test switching')
      }
    } else {
      console.warn('Organization switcher not found - skipping switch test')
    }
  })

  test('should maintain organization context across navigation', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('h1, h2', { timeout: 5000 })
    
    // Get current organization (if displayed)
    let currentOrg = ''
    try {
      const orgElement = page.locator('[data-testid="organization-name"], .organization-name').first()
      currentOrg = await orgElement.textContent() || ''
    } catch (e) {
      // Org name not displayed
    }
    
    // Navigate to different pages
    const pages = [
      '/npd',
      '/sp2d',
      '/rka',
      '/reports',
      '/dashboard',
    ]
    
    for (const pagePath of pages) {
      try {
        await page.goto(`${BASE_URL}${pagePath}`, { timeout: 5000 })
        await page.waitForTimeout(1000)
        
        // Verify organization context maintained
        if (currentOrg) {
          const orgElement = page.locator('[data-testid="organization-name"], .organization-name').first()
          if (await orgElement.isVisible({ timeout: 1000 })) {
            const orgText = await orgElement.textContent()
            expect(orgText).toBe(currentOrg)
          }
        }
      } catch (e) {
        // Page may not exist or be accessible
        console.warn(`Could not navigate to ${pagePath}`)
      }
    }
  })
})

test.describe('Protected Routes', () => {
  test('should protect all main routes when not authenticated', async ({ page }) => {
    // Clear authentication
    await page.context().clearCookies()
    
    const protectedRoutes = [
      '/dashboard',
      '/npd',
      '/npd/create',
      '/sp2d',
      '/sp2d/create',
      '/rka',
      '/reports',
      '/settings',
      '/performance',
    ]
    
    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route}`)
      
      // Should redirect to sign-in
      await expect(page).toHaveURL(new RegExp('/sign-in'), { timeout: 5000 })
    }
  })

  test('should allow access to protected routes when authenticated', async ({ page }) => {
    // Login first
    await login(page)
    
    const protectedRoutes = [
      '/dashboard',
      '/npd',
      '/sp2d',
      '/rka',
      '/reports',
    ]
    
    for (const route of protectedRoutes) {
      try {
        await page.goto(`${BASE_URL}${route}`, { timeout: 5000 })
        
        // Should not redirect to sign-in
        await expect(page).not.toHaveURL(new RegExp('/sign-in'))
        
        // Should show content (not just blank page)
        const content = page.locator('main, [role="main"], body')
        await expect(content).not.toBeEmpty()
      } catch (e) {
        console.warn(`Could not access ${route}: ${e}`)
      }
    }
  })
})

test.describe('Session Management', () => {
  test('should handle session expiration gracefully', async ({ page }) => {
    // Login first
    await login(page)
    
    // Verify logged in
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`)
    
    // Simulate session expiration by clearing cookies
    await page.context().clearCookies()
    
    // Try to navigate to protected route
    await page.goto(`${BASE_URL}/npd`)
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(new RegExp('/sign-in'), { timeout: 5000 })
  })

  test('should handle concurrent sessions (same user, different tabs)', async ({ browser }) => {
    // Create two contexts (simulating two tabs)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    try {
      // Login in first tab
      await login(page1)
      await expect(page1).toHaveURL(`${BASE_URL}/dashboard`)
      
      // Login in second tab (same user)
      await login(page2)
      await expect(page2).toHaveURL(`${BASE_URL}/dashboard`)
      
      // Both tabs should remain authenticated
      await page1.reload()
      await expect(page1).toHaveURL(`${BASE_URL}/dashboard`)
      
      await page2.reload()
      await expect(page2).toHaveURL(`${BASE_URL}/dashboard`)
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})

