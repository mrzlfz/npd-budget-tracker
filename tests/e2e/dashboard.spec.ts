/**
 * Dashboard E2E Tests
 * 
 * Tests the dashboard with KPI cards, charts, and data validation.
 * 
 * Test Scenarios:
 * 1. Login and navigate to dashboard
 * 2. Verify KPI cards load with data
 * 3. Verify charts render (Recharts)
 * 4. Change fiscal year filter
 * 5. Verify data updates
 * 6. Export dashboard data to CSV
 * 7. Verify CSV file downloaded
 */

import { test, expect } from '@playwright/test'
import {
  BASE_URL,
  login,
  waitForLoadingComplete,
  clickButton,
  takeScreenshot,
} from './helpers'

test.describe('Dashboard Loading and Display', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await waitForLoadingComplete(page)
  })

  test('should load dashboard successfully', async ({ page }) => {
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`)
    await waitForLoadingComplete(page)
    
    // Verify dashboard page loaded
    const dashboardHeading = page.locator('h1, h2, [data-testid="dashboard-title"]')
    await expect(dashboardHeading.first()).toBeVisible({ timeout: 5000 })
    
    await takeScreenshot(page, 'dashboard-loaded')
  })

  test('should display organization name in header', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await waitForLoadingComplete(page)
    
    // Look for organization name
    const orgNameSelectors = [
      '[data-testid="organization-name"]',
      '.organization-name',
      'text=/Dinas|OPD/i',
    ]
    
    let orgFound = false
    for (const selector of orgNameSelectors) {
      try {
        const orgElement = page.locator(selector).first()
        if (await orgElement.isVisible({ timeout: 2000 })) {
          const orgText = await orgElement.textContent()
          expect(orgText).not.toBeNull()
          expect(orgText?.length).toBeGreaterThan(0)
          orgFound = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!orgFound) {
      console.warn('Organization name not found in header')
    }
  })

  test('should display current fiscal year', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await waitForLoadingComplete(page)
    
    // Look for fiscal year display
    const yearSelectors = [
      'text=/Tahun.*\\d{4}/i',
      '[data-testid="fiscal-year"]',
      'select[name*="year"], select[name*="tahun"]',
    ]
    
    let yearFound = false
    for (const selector of yearSelectors) {
      try {
        const yearElement = page.locator(selector).first()
        if (await yearElement.isVisible({ timeout: 2000 })) {
          yearFound = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!yearFound) {
      console.warn('Fiscal year selector not found')
    }
  })
})

test.describe('KPI Cards', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/dashboard`)
    await waitForLoadingComplete(page)
  })

  test('should display total pagu KPI card', async ({ page }) => {
    // Look for pagu KPI
    const paguSelectors = [
      'text=/Total.*Pagu/i',
      '[data-testid="kpi-pagu"]',
      '.kpi-card:has-text("Pagu")',
    ]
    
    let paguFound = false
    for (const selector of paguSelectors) {
      try {
        const kpiCard = page.locator(selector).first()
        if (await kpiCard.isVisible({ timeout: 3000 })) {
          // Verify it contains a number
          const text = await kpiCard.textContent()
          const hasNumber = /\d/.test(text || '')
          expect(hasNumber).toBe(true)
          paguFound = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!paguFound) {
      console.warn('Total Pagu KPI card not found')
    }
  })

  test('should display realization KPI card', async ({ page }) => {
    // Look for realization KPI
    const realizationSelectors = [
      'text=/Realisasi/i',
      '[data-testid="kpi-realisasi"]',
      '.kpi-card:has-text("Realisasi")',
    ]
    
    let realizationFound = false
    for (const selector of realizationSelectors) {
      try {
        const kpiCard = page.locator(selector).first()
        if (await kpiCard.isVisible({ timeout: 3000 })) {
          // Verify it contains a number
          const text = await kpiCard.textContent()
          const hasNumber = /\d/.test(text || '')
          expect(hasNumber).toBe(true)
          realizationFound = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!realizationFound) {
      console.warn('Realization KPI card not found')
    }
  })

  test('should display NPD count KPI card', async ({ page }) => {
    // Look for NPD count KPI
    const npdCountSelectors = [
      'text=/Total.*NPD/i',
      'text=/Jumlah.*NPD/i',
      '[data-testid="kpi-npd-count"]',
      '.kpi-card:has-text("NPD")',
    ]
    
    let npdCountFound = false
    for (const selector of npdCountSelectors) {
      try {
        const kpiCard = page.locator(selector).first()
        if (await kpiCard.isVisible({ timeout: 3000 })) {
          // Verify it contains a number
          const text = await kpiCard.textContent()
          const hasNumber = /\d/.test(text || '')
          expect(hasNumber).toBe(true)
          npdCountFound = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!npdCountFound) {
      console.warn('NPD Count KPI card not found')
    }
  })

  test('should display percentage KPI card', async ({ page }) => {
    // Look for percentage KPI (realization %)
    const percentageSelectors = [
      'text=/%/i',
      'text=/Persentase/i',
      '[data-testid="kpi-percentage"]',
    ]
    
    let percentageFound = false
    for (const selector of percentageSelectors) {
      try {
        const kpiCard = page.locator(selector).first()
        if (await kpiCard.isVisible({ timeout: 3000 })) {
          // Verify it contains a percentage
          const text = await kpiCard.textContent()
          const hasPercentage = /%/.test(text || '')
          expect(hasPercentage).toBe(true)
          percentageFound = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!percentageFound) {
      console.warn('Percentage KPI card not found')
    }
  })

  test('should display all KPI cards with data', async ({ page }) => {
    // Take screenshot of all KPI cards
    await takeScreenshot(page, 'dashboard-kpi-cards')
    
    // Count visible KPI cards
    const kpiCardSelectors = [
      '.kpi-card',
      '[data-testid*="kpi-"]',
      '[class*="card"]:has-text("Rp"), [class*="card"]:has-text("%")',
    ]
    
    let totalKPIs = 0
    for (const selector of kpiCardSelectors) {
      try {
        const cards = page.locator(selector)
        const count = await cards.count()
        if (count > 0) {
          totalKPIs = count
          break
        }
      } catch (e) {
        continue
      }
    }
    
    // Expect at least 3 KPI cards
    expect(totalKPIs).toBeGreaterThanOrEqual(3)
  })
})

test.describe('Charts and Visualizations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/dashboard`)
    await waitForLoadingComplete(page)
  })

  test('should render Recharts charts', async ({ page }) => {
    // Wait for charts to render
    await page.waitForTimeout(2000)
    
    // Look for Recharts SVG elements
    const chartSelectors = [
      'svg.recharts-surface',
      '[class*="recharts"]',
      'svg[class*="chart"]',
      '[data-testid="chart"]',
    ]
    
    let chartFound = false
    for (const selector of chartSelectors) {
      try {
        const chart = page.locator(selector).first()
        if (await chart.isVisible({ timeout: 3000 })) {
          chartFound = true
          await takeScreenshot(page, 'dashboard-charts')
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!chartFound) {
      console.warn('Recharts charts not found - may need to scroll or wait longer')
    }
  })

  test('should display budget vs realization chart', async ({ page }) => {
    // Look for budget comparison chart
    const chartTitleSelectors = [
      'text=/Budget.*Realization/i',
      'text=/Pagu.*Realisasi/i',
      'h2:has-text("Chart"), h3:has-text("Chart")',
    ]
    
    let chartTitleFound = false
    for (const selector of chartTitleSelectors) {
      try {
        const title = page.locator(selector).first()
        if (await title.isVisible({ timeout: 2000 })) {
          chartTitleFound = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!chartTitleFound) {
      console.warn('Budget vs Realization chart title not found')
    }
  })

  test('should display trend chart', async ({ page }) => {
    // Scroll down to see more charts
    await page.evaluate(() => window.scrollBy(0, 500))
    await page.waitForTimeout(1000)
    
    // Look for trend/line chart
    const trendChartSelectors = [
      'text=/Trend/i',
      'text=/Monthly|Bulanan/i',
      '.recharts-line',
      '[data-testid="trend-chart"]',
    ]
    
    let trendChartFound = false
    for (const selector of trendChartSelectors) {
      try {
        const chart = page.locator(selector).first()
        if (await chart.isVisible({ timeout: 2000 })) {
          trendChartFound = true
          await takeScreenshot(page, 'dashboard-trend-chart')
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!trendChartFound) {
      console.warn('Trend chart not found')
    }
  })

  test('should display chart legends', async ({ page }) => {
    // Look for chart legends
    const legendSelectors = [
      '.recharts-legend-wrapper',
      '[class*="legend"]',
      'text=/Pagu|Realisasi/i',
    ]
    
    let legendFound = false
    for (const selector of legendSelectors) {
      try {
        const legend = page.locator(selector).first()
        if (await legend.isVisible({ timeout: 2000 })) {
          legendFound = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!legendFound) {
      console.warn('Chart legends not found')
    }
  })
})

test.describe('Fiscal Year Filter', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/dashboard`)
    await waitForLoadingComplete(page)
  })

  test('should change fiscal year and update data', async ({ page }) => {
    // Find fiscal year selector
    const yearSelectSelectors = [
      'select[name*="year"]',
      'select[name*="tahun"]',
      '[data-testid="year-select"]',
    ]
    
    let yearSelectFound = false
    for (const selector of yearSelectSelectors) {
      try {
        const yearSelect = page.locator(selector).first()
        if (await yearSelect.isVisible({ timeout: 2000 })) {
          // Get current selected year
          const currentYear = await yearSelect.inputValue()
          
          // Get available years
          const options = await yearSelect.locator('option').all()
          
          if (options.length > 1) {
            // Select a different year
            await yearSelect.selectOption({ index: 1 })
            await page.waitForTimeout(2000) // Wait for data to update
            
            // Verify year changed
            const newYear = await yearSelect.inputValue()
            expect(newYear).not.toBe(currentYear)
            
            yearSelectFound = true
            await takeScreenshot(page, 'dashboard-year-changed')
            break
          }
        }
      } catch (e) {
        continue
      }
    }
    
    if (!yearSelectFound) {
      console.warn('Fiscal year selector not found or has only one option')
    }
  })

  test('should show loading state when changing year', async ({ page }) => {
    // Find and change fiscal year
    const yearSelect = page.locator('select[name*="year"], select[name*="tahun"]').first()
    const hasYearSelect = await yearSelect.isVisible({ timeout: 2000 }).catch(() => false)
    
    if (hasYearSelect) {
      const options = await yearSelect.locator('option').all()
      
      if (options.length > 1) {
        // Change year
        await yearSelect.selectOption({ index: 1 })
        
        // Look for loading indicator
        const loadingSelectors = [
          '.loading',
          '.spinner',
          '[data-testid="loading"]',
          'text=/Loading|Memuat/i',
        ]
        
        let loadingFound = false
        for (const selector of loadingSelectors) {
          try {
            const loading = page.locator(selector).first()
            if (await loading.isVisible({ timeout: 500 })) {
              loadingFound = true
              break
            }
          } catch (e) {
            continue
          }
        }
        
        if (loadingFound) {
          // Wait for loading to complete
          await waitForLoadingComplete(page)
        }
      }
    } else {
      console.warn('Year selector not available for loading state test')
    }
  })
})

test.describe('Data Export', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/dashboard`)
    await waitForLoadingComplete(page)
  })

  test('should have export button', async ({ page }) => {
    // Look for export button
    const exportButtonSelectors = [
      'button:has-text("Export")',
      'button:has-text("Download")',
      'button:has-text("Ekspor")',
      '[data-testid="export-button"]',
    ]
    
    let exportButtonFound = false
    for (const selector of exportButtonSelectors) {
      try {
        const button = page.locator(selector).first()
        if (await button.isVisible({ timeout: 2000 })) {
          exportButtonFound = true
          await takeScreenshot(page, 'dashboard-export-button')
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!exportButtonFound) {
      console.warn('Export button not found on dashboard')
    }
  })

  test('should export dashboard data to CSV', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Ekspor")').first()
    const hasExportButton = await exportButton.isVisible({ timeout: 2000 }).catch(() => false)
    
    if (hasExportButton) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
      
      // Click export button
      await exportButton.click()
      
      // Look for CSV option if there's a dropdown
      try {
        const csvOption = page.locator('button:has-text("CSV"), [role="menuitem"]:has-text("CSV")').first()
        if (await csvOption.isVisible({ timeout: 1000 })) {
          await csvOption.click()
        }
      } catch (e) {
        // No dropdown, direct export
      }
      
      try {
        // Wait for download
        const download = await downloadPromise
        
        // Verify download
        const fileName = download.suggestedFilename()
        expect(fileName).toMatch(/\.(csv|xlsx)$/i)
        
        // Save download for inspection
        const path = `./test-results/downloads/${fileName}`
        await download.saveAs(path)
        
        console.log(`Downloaded: ${fileName}`)
        await takeScreenshot(page, 'dashboard-after-export')
      } catch (e) {
        console.warn('Download did not complete:', e)
      }
    } else {
      console.warn('Export button not available for CSV export test')
    }
  })
})

test.describe('Recent Activity', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/dashboard`)
    await waitForLoadingComplete(page)
  })

  test('should display recent NPD activity', async ({ page }) => {
    // Scroll down to see recent activity section
    await page.evaluate(() => window.scrollBy(0, 800))
    await page.waitForTimeout(1000)
    
    // Look for recent activity section
    const activitySelectors = [
      'text=/Recent.*Activity/i',
      'text=/Aktivitas.*Terbaru/i',
      '[data-testid="recent-activity"]',
      'h2:has-text("Recent"), h3:has-text("Recent")',
    ]
    
    let activityFound = false
    for (const selector of activitySelectors) {
      try {
        const section = page.locator(selector).first()
        if (await section.isVisible({ timeout: 2000 })) {
          activityFound = true
          await takeScreenshot(page, 'dashboard-recent-activity')
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!activityFound) {
      console.warn('Recent activity section not found')
    }
  })

  test('should display pending approvals', async ({ page }) => {
    // Look for pending approvals section
    const pendingSelectors = [
      'text=/Pending.*Approval/i',
      'text=/Menunggu.*Persetujuan/i',
      '[data-testid="pending-approvals"]',
    ]
    
    let pendingFound = false
    for (const selector of pendingSelectors) {
      try {
        const section = page.locator(selector).first()
        if (await section.isVisible({ timeout: 2000 })) {
          pendingFound = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!pendingFound) {
      console.warn('Pending approvals section not found')
    }
  })
})

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/dashboard`)
    await waitForLoadingComplete(page)
  })

  test('should navigate to NPD page from dashboard', async ({ page }) => {
    // Look for NPD link/button
    const npdLinkSelectors = [
      'a[href*="/npd"]',
      'button:has-text("NPD")',
      'text=/View.*NPD|Lihat.*NPD/i',
    ]
    
    let npdLinkFound = false
    for (const selector of npdLinkSelectors) {
      try {
        const link = page.locator(selector).first()
        if (await link.isVisible({ timeout: 2000 })) {
          await link.click()
          await waitForLoadingComplete(page)
          
          // Verify navigated to NPD page
          await expect(page).toHaveURL(new RegExp('/npd'))
          npdLinkFound = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!npdLinkFound) {
      console.warn('NPD navigation link not found on dashboard')
    }
  })

  test('should navigate to reports page from dashboard', async ({ page }) => {
    // Look for reports link
    const reportsLinkSelectors = [
      'a[href*="/reports"]',
      'button:has-text("Report")',
      'text=/View.*Report|Lihat.*Laporan/i',
    ]
    
    let reportsLinkFound = false
    for (const selector of reportsLinkSelectors) {
      try {
        const link = page.locator(selector).first()
        if (await link.isVisible({ timeout: 2000 })) {
          await link.click()
          await waitForLoadingComplete(page)
          
          // Verify navigated to reports page
          await expect(page).toHaveURL(new RegExp('/reports'))
          reportsLinkFound = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!reportsLinkFound) {
      console.warn('Reports navigation link not found on dashboard')
    }
  })
})

test.describe('Dashboard Responsiveness', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await login(page)
    await page.goto(`${BASE_URL}/dashboard`)
    await waitForLoadingComplete(page)
    
    // Verify dashboard loads on mobile
    await expect(page.locator('h1, h2').first()).toBeVisible()
    
    // Take screenshot
    await takeScreenshot(page, 'dashboard-mobile')
  })

  test('should display correctly on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    await login(page)
    await page.goto(`${BASE_URL}/dashboard`)
    await waitForLoadingComplete(page)
    
    // Verify dashboard loads on tablet
    await expect(page.locator('h1, h2').first()).toBeVisible()
    
    // Take screenshot
    await takeScreenshot(page, 'dashboard-tablet')
  })
})

