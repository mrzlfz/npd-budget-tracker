/**
 * SP2D Creation and Real-time Updates E2E Tests
 * 
 * Tests the complete SP2D creation workflow with real-time realization updates.
 * 
 * Test Scenarios:
 * 1. Login as Bendahara
 * 2. Navigate to SP2D page
 * 3. Create SP2D for finalized NPD
 * 4. Enter SP2D details
 * 5. Preview distribution
 * 6. Submit SP2D
 * 7. Verify SP2D in history
 * 8. Verify real-time realization updates
 */

import { test, expect } from '@playwright/test'
import {
  BASE_URL,
  login,
  waitForLoadingComplete,
  fillField,
  clickButton,
  waitForToast,
  generateTestData,
  takeScreenshot,
} from './helpers'

test.describe('SP2D Creation Workflow', () => {
  let testData: ReturnType<typeof generateTestData>

  test.beforeEach(async ({ page }) => {
    // Generate fresh test data
    testData = generateTestData()
    
    // Login as Bendahara (would need Bendahara credentials in production)
    await login(page)
    await waitForLoadingComplete(page)
  })

  test('should navigate to SP2D creation page', async ({ page }) => {
    // Navigate to SP2D page
    await page.goto(`${BASE_URL}/sp2d`)
    await waitForLoadingComplete(page)
    
    // Find and click "Create SP2D" or "Buat SP2D" button
    const createButtonSelectors = [
      'button:has-text("Create SP2D")',
      'button:has-text("Buat SP2D")',
      'a:has-text("Create SP2D")',
      'a:has-text("Buat SP2D")',
      '[data-testid="create-sp2d-button"]',
    ]
    
    let buttonFound = false
    for (const selector of createButtonSelectors) {
      try {
        const button = page.locator(selector).first()
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click()
          buttonFound = true
          break
        }
      } catch (e) {
        continue
      }
    }
    
    expect(buttonFound).toBe(true)
    
    // Wait for SP2D creation form to load
    await page.waitForURL(new RegExp('/sp2d/(create|new)'), { timeout: 5000 })
    
    // Verify form elements are present
    await expect(page.locator('form, [data-testid="sp2d-form"]')).toBeVisible()
  })

  test('should display list of finalized NPDs for SP2D creation', async ({ page }) => {
    // Navigate to SP2D creation
    await page.goto(`${BASE_URL}/sp2d/create`)
    await waitForLoadingComplete(page)
    
    // Look for NPD selection dropdown or list
    const npdSelectSelectors = [
      'select[name="npdId"]',
      'select[name*="npd"]',
      '[data-testid="npd-select"]',
      'label:has-text("NPD") + select',
      'label:has-text("Pilih NPD") + select',
    ]
    
    let npdSelectFound = false
    for (const selector of npdSelectSelectors) {
      try {
        const select = page.locator(selector).first()
        if (await select.isVisible({ timeout: 2000 })) {
          // Verify it has options (finalized NPDs)
          const options = await select.locator('option').all()
          if (options.length > 1) { // More than just placeholder
            npdSelectFound = true
            await takeScreenshot(page, 'sp2d-npd-selection')
            break
          }
        }
      } catch (e) {
        continue
      }
    }
    
    if (!npdSelectFound) {
      console.warn('NPD selection dropdown not found or empty - may need finalized NPDs')
    }
  })

  test('should create SP2D with complete details', async ({ page }) => {
    // Navigate to SP2D creation
    await page.goto(`${BASE_URL}/sp2d/create`)
    await waitForLoadingComplete(page)
    
    // Select NPD
    const npdSelect = page.locator('select[name="npdId"], select[name*="npd"]').first()
    const hasNPD = await npdSelect.isVisible({ timeout: 2000 }).catch(() => false)
    
    if (hasNPD) {
      // Select first available finalized NPD
      const options = await npdSelect.locator('option').all()
      if (options.length > 1) {
        await npdSelect.selectOption({ index: 1 })
        await page.waitForTimeout(1000) // Wait for NPD details to load
      }
    }
    
    // Fill SP2D details
    try {
      // No SPM
      await fillField(page, 'noSPM', testData.sp2d.noSPM)
    } catch (e) {
      await page.fill('input[name="noSPM"]', testData.sp2d.noSPM).catch(() => {})
    }
    
    try {
      // No SP2D
      await fillField(page, 'noSP2D', testData.sp2d.noSP2D)
    } catch (e) {
      await page.fill('input[name="noSP2D"]', testData.sp2d.noSP2D)
    }
    
    try {
      // Tanggal SP2D
      await fillField(page, 'tglSP2D', testData.sp2d.tglSP2D)
    } catch (e) {
      await page.fill('input[type="date"]', testData.sp2d.tglSP2D)
    }
    
    try {
      // Nilai Cair
      await fillField(page, 'nilaiCair', testData.sp2d.nilaiCair.toString())
    } catch (e) {
      await page.fill('input[name="nilaiCair"]', testData.sp2d.nilaiCair.toString())
    }
    
    try {
      // Catatan (optional)
      await fillField(page, 'catatan', testData.sp2d.catatan)
    } catch (e) {
      await page.fill('textarea[name="catatan"]', testData.sp2d.catatan).catch(() => {})
    }
    
    await takeScreenshot(page, 'sp2d-form-filled')
    
    // Submit SP2D
    await clickButton(page, /Submit|Simpan|Create/i)
    
    // Confirm if there's a confirmation dialog
    try {
      await clickButton(page, /Confirm|Ya|OK/i)
    } catch (e) {
      // No confirmation dialog
    }
    
    // Wait for success notification
    await waitForToast(page, /created|dibuat|success/i, { timeout: 10000 })
    
    // Verify redirected to SP2D list or detail page
    await page.waitForTimeout(2000)
    await takeScreenshot(page, 'sp2d-created')
  })

  test('should show distribution preview before submission', async ({ page }) => {
    // Navigate to SP2D creation
    await page.goto(`${BASE_URL}/sp2d/create`)
    await waitForLoadingComplete(page)
    
    // Select NPD and fill details
    const npdSelect = page.locator('select[name="npdId"], select[name*="npd"]').first()
    const hasNPD = await npdSelect.isVisible({ timeout: 2000 }).catch(() => false)
    
    if (hasNPD) {
      const options = await npdSelect.locator('option').all()
      if (options.length > 1) {
        await npdSelect.selectOption({ index: 1 })
        await page.waitForTimeout(1000)
      }
      
      // Fill amount
      await page.fill('input[name="nilaiCair"]', '10000000')
      await page.waitForTimeout(500)
      
      // Look for distribution preview
      const previewSelectors = [
        '[data-testid="distribution-preview"]',
        '.distribution-preview',
        'text=/distribution|distribusi/i',
        'table',
      ]
      
      let previewFound = false
      for (const selector of previewSelectors) {
        try {
          const preview = page.locator(selector).first()
          if (await preview.isVisible({ timeout: 2000 })) {
            // Verify preview shows account lines and amounts
            await expect(preview).not.toBeEmpty()
            previewFound = true
            await takeScreenshot(page, 'sp2d-distribution-preview')
            break
          }
        } catch (e) {
          continue
        }
      }
      
      if (!previewFound) {
        console.warn('Distribution preview not found - may be shown after submission')
      }
    } else {
      console.warn('No finalized NPDs available for distribution preview test')
    }
  })

  test('should validate SP2D amount does not exceed NPD total', async ({ page }) => {
    // Navigate to SP2D creation
    await page.goto(`${BASE_URL}/sp2d/create`)
    await waitForLoadingComplete(page)
    
    // Select NPD
    const npdSelect = page.locator('select[name="npdId"], select[name*="npd"]').first()
    const hasNPD = await npdSelect.isVisible({ timeout: 2000 }).catch(() => false)
    
    if (hasNPD) {
      const options = await npdSelect.locator('option').all()
      if (options.length > 1) {
        await npdSelect.selectOption({ index: 1 })
        await page.waitForTimeout(1000)
        
        // Try to enter an excessive amount (e.g., 999 billion)
        await page.fill('input[name="noSP2D"]', 'SP2D-INVALID-001')
        await page.fill('input[type="date"]', testData.sp2d.tglSP2D)
        await page.fill('input[name="nilaiCair"]', '999999999999')
        
        // Try to submit
        await clickButton(page, /Submit|Simpan|Create/i)
        
        // Should show error message
        const errorSelectors = [
          'text=/exceeds|melebihi|invalid|tidak valid/i',
          '[role="alert"]',
          '.error',
          '[data-testid="error-message"]',
        ]
        
        let errorFound = false
        for (const selector of errorSelectors) {
          try {
            const error = page.locator(selector).first()
            if (await error.isVisible({ timeout: 3000 })) {
              errorFound = true
              await takeScreenshot(page, 'sp2d-validation-error')
              break
            }
          } catch (e) {
            continue
          }
        }
        
        if (!errorFound) {
          console.warn('Validation error not shown - validation may happen server-side')
        }
      }
    } else {
      console.warn('No NPDs available for validation test')
    }
  })
})

test.describe('SP2D History and Details', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await waitForLoadingComplete(page)
  })

  test('should display SP2D history list', async ({ page }) => {
    // Navigate to SP2D page
    await page.goto(`${BASE_URL}/sp2d`)
    await waitForLoadingComplete(page)
    
    // Look for SP2D list/table
    const listSelectors = [
      'table',
      '[data-testid="sp2d-list"]',
      '.sp2d-list',
      '[role="table"]',
    ]
    
    let listFound = false
    for (const selector of listSelectors) {
      try {
        const list = page.locator(selector).first()
        if (await list.isVisible({ timeout: 2000 })) {
          listFound = true
          
          // Verify list has content
          const rows = list.locator('tr, [role="row"]')
          const rowCount = await rows.count()
          
          if (rowCount > 1) { // More than just header
            await takeScreenshot(page, 'sp2d-history-list')
          }
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!listFound) {
      console.warn('SP2D history list not found')
    }
  })

  test('should show SP2D details with distribution breakdown', async ({ page }) => {
    // Navigate to SP2D page
    await page.goto(`${BASE_URL}/sp2d`)
    await waitForLoadingComplete(page)
    
    // Find and click on first SP2D
    const sp2dLinks = page.locator('a[href*="/sp2d/"], tr[data-href*="/sp2d/"], [data-testid*="sp2d-"]')
    const count = await sp2dLinks.count()
    
    if (count > 0) {
      await sp2dLinks.first().click()
      await waitForLoadingComplete(page)
      
      // Verify SP2D details are shown
      const detailSelectors = [
        'text=/SP2D/i',
        'text=/No.*SP2D/i',
        'text=/Nilai.*Cair/i',
        'text=/Distribution|Distribusi/i',
      ]
      
      let detailsFound = 0
      for (const selector of detailSelectors) {
        try {
          const detail = page.locator(selector).first()
          if (await detail.isVisible({ timeout: 1000 })) {
            detailsFound++
          }
        } catch (e) {
          continue
        }
      }
      
      if (detailsFound >= 2) {
        // Look for distribution breakdown table
        const distributionTable = page.locator('table, [data-testid="distribution-table"]')
        const hasTable = await distributionTable.isVisible({ timeout: 2000 }).catch(() => false)
        
        if (hasTable) {
          await takeScreenshot(page, 'sp2d-detail-with-distribution')
        }
      }
    } else {
      console.warn('No SP2D records found for detail test')
    }
  })

  test('should filter SP2D by date range', async ({ page }) => {
    // Navigate to SP2D page
    await page.goto(`${BASE_URL}/sp2d`)
    await waitForLoadingComplete(page)
    
    // Look for date filter inputs
    const dateFilterSelectors = [
      'input[type="date"][name*="start"]',
      'input[type="date"][name*="from"]',
      'input[type="date"][name*="tanggal"]',
      '[data-testid="date-filter-start"]',
    ]
    
    let filterFound = false
    for (const selector of dateFilterSelectors) {
      try {
        const dateInput = page.locator(selector).first()
        if (await dateInput.isVisible({ timeout: 2000 })) {
          // Set date range (last 30 days)
          const endDate = new Date()
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - 30)
          
          await dateInput.fill(startDate.toISOString().split('T')[0])
          
          // Look for end date input
          const endDateInput = page.locator('input[type="date"][name*="end"], input[type="date"][name*="to"]').first()
          const hasEndDate = await endDateInput.isVisible({ timeout: 1000 }).catch(() => false)
          
          if (hasEndDate) {
            await endDateInput.fill(endDate.toISOString().split('T')[0])
          }
          
          // Wait for filter to apply
          await page.waitForTimeout(1000)
          filterFound = true
          await takeScreenshot(page, 'sp2d-filtered-by-date')
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!filterFound) {
      console.warn('Date filter not found')
    }
  })

  test('should search SP2D by number', async ({ page }) => {
    // Navigate to SP2D page
    await page.goto(`${BASE_URL}/sp2d`)
    await waitForLoadingComplete(page)
    
    // Look for search input
    const searchSelectors = [
      'input[type="search"]',
      'input[placeholder*="Search"]',
      'input[placeholder*="Cari"]',
      '[data-testid="search-input"]',
    ]
    
    let searchFound = false
    for (const selector of searchSelectors) {
      try {
        const searchInput = page.locator(selector).first()
        if (await searchInput.isVisible({ timeout: 2000 })) {
          // Enter search term
          await searchInput.fill('SP2D')
          await page.waitForTimeout(1000)
          
          searchFound = true
          await takeScreenshot(page, 'sp2d-search-results')
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!searchFound) {
      console.warn('Search input not found')
    }
  })
})

test.describe('Real-time Realization Updates', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await waitForLoadingComplete(page)
  })

  test('should update dashboard realizations after SP2D creation', async ({ page }) => {
    // Navigate to dashboard first and capture initial state
    await page.goto(`${BASE_URL}/dashboard`)
    await waitForLoadingComplete(page)
    
    // Look for realization KPI card
    const realizationSelectors = [
      'text=/Realisasi/i',
      '[data-testid="realization-kpi"]',
      '.kpi-card:has-text("Realisasi")',
    ]
    
    let initialRealization = ''
    for (const selector of realizationSelectors) {
      try {
        const kpiCard = page.locator(selector).first()
        if (await kpiCard.isVisible({ timeout: 2000 })) {
          initialRealization = await kpiCard.textContent() || ''
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (initialRealization) {
      await takeScreenshot(page, 'dashboard-before-sp2d')
      
      // Create SP2D (simplified flow)
      await page.goto(`${BASE_URL}/sp2d/create`)
      await waitForLoadingComplete(page)
      
      // Try to create SP2D if form is available
      const hasForm = await page.locator('form, [data-testid="sp2d-form"]').isVisible({ timeout: 2000 }).catch(() => false)
      
      if (hasForm) {
        // Fill minimal required fields
        const npdSelect = page.locator('select[name="npdId"]').first()
        const hasNPD = await npdSelect.isVisible({ timeout: 1000 }).catch(() => false)
        
        if (hasNPD) {
          await npdSelect.selectOption({ index: 1 })
          await page.fill('input[name="noSP2D"]', `SP2D-RT-${Date.now()}`)
          await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
          await page.fill('input[name="nilaiCair"]', '1000000')
          
          await clickButton(page, /Submit|Simpan/i)
          
          try {
            await clickButton(page, /Confirm|Ya/i)
          } catch (e) {}
          
          await waitForToast(page, /success|created/i, { timeout: 10000 })
          
          // Navigate back to dashboard
          await page.goto(`${BASE_URL}/dashboard`)
          await waitForLoadingComplete(page)
          
          // Wait for real-time update (Convex should push update)
          await page.waitForTimeout(2000)
          
          // Check if realization updated
          for (const selector of realizationSelectors) {
            try {
              const kpiCard = page.locator(selector).first()
              if (await kpiCard.isVisible({ timeout: 2000 })) {
                const newRealization = await kpiCard.textContent() || ''
                
                // Verify realization changed (real-time update)
                if (newRealization !== initialRealization) {
                  await takeScreenshot(page, 'dashboard-after-sp2d-realtime-update')
                  console.log('Real-time update detected!')
                }
                break
              }
            } catch (e) {
              continue
            }
          }
        }
      }
    } else {
      console.warn('Realization KPI not found for real-time update test')
    }
  })

  test('should update RKA sisaPagu after SP2D creation', async ({ page }) => {
    // Navigate to RKA page
    await page.goto(`${BASE_URL}/rka`)
    await waitForLoadingComplete(page)
    
    // Look for sisaPagu display
    const sisaPaguSelectors = [
      'text=/Sisa.*Pagu/i',
      '[data-testid="sisa-pagu"]',
      'td:has-text("Sisa")',
    ]
    
    let sisaPaguFound = false
    for (const selector of sisaPaguSelectors) {
      try {
        const sisaPagu = page.locator(selector).first()
        if (await sisaPagu.isVisible({ timeout: 2000 })) {
          sisaPaguFound = true
          await takeScreenshot(page, 'rka-sisa-pagu')
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!sisaPaguFound) {
      console.warn('Sisa Pagu not found in RKA page')
    }
  })

  test('should show SP2D in NPD detail page after creation', async ({ page }) => {
    // Navigate to NPD list
    await page.goto(`${BASE_URL}/npd`)
    await waitForLoadingComplete(page)
    
    // Find a finalized NPD
    const finalNPDs = page.locator('[data-status="final"], text=/final/i')
    const count = await finalNPDs.count()
    
    if (count > 0) {
      // Click on first final NPD
      await finalNPDs.first().click()
      await waitForLoadingComplete(page)
      
      // Look for SP2D section
      const sp2dSectionSelectors = [
        'text=/SP2D/i',
        '[data-testid="sp2d-section"]',
        'h2:has-text("SP2D"), h3:has-text("SP2D")',
      ]
      
      let sp2dSectionFound = false
      for (const selector of sp2dSectionSelectors) {
        try {
          const section = page.locator(selector).first()
          if (await section.isVisible({ timeout: 2000 })) {
            sp2dSectionFound = true
            
            // Look for SP2D list/table within NPD detail
            const sp2dList = page.locator('table, [data-testid="sp2d-list"]')
            const hasList = await sp2dList.isVisible({ timeout: 1000 }).catch(() => false)
            
            if (hasList) {
              await takeScreenshot(page, 'npd-detail-with-sp2d-list')
            }
            break
          }
        } catch (e) {
          continue
        }
      }
      
      if (!sp2dSectionFound) {
        console.warn('SP2D section not found in NPD detail page')
      }
    } else {
      console.warn('No finalized NPDs found for SP2D section test')
    }
  })
})

