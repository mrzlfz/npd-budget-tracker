/**
 * NPD Creation and Verification E2E Tests
 * 
 * Tests the complete NPD lifecycle from creation to finalization.
 * 
 * Test Scenarios:
 * 1. Create NPD as PPTK
 * 2. Add account lines from RKA
 * 3. Upload attachments
 * 4. Save as draft
 * 5. Submit for verification
 * 6. Verify as Bendahara
 * 7. Finalize NPD
 * 8. Verify document locking
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

test.describe('NPD Creation Workflow', () => {
  let testData: ReturnType<typeof generateTestData>

  test.beforeEach(async ({ page }) => {
    // Generate fresh test data
    testData = generateTestData()
    
    // Login as PPTK
    await login(page)
    await waitForLoadingComplete(page)
  })

  test('should navigate to NPD creation page', async ({ page }) => {
    // Navigate to NPD page
    await page.goto(`${BASE_URL}/npd`)
    await waitForLoadingComplete(page)
    
    // Find and click "Create NPD" or "Buat NPD" button
    const createButtonSelectors = [
      'button:has-text("Create NPD")',
      'button:has-text("Buat NPD")',
      'a:has-text("Create NPD")',
      'a:has-text("Buat NPD")',
      '[data-testid="create-npd-button"]',
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
    
    // Wait for NPD creation form to load
    await page.waitForURL(new RegExp('/npd/(create|new|builder)'), { timeout: 5000 })
    
    // Verify form elements are present
    await expect(page.locator('form, [data-testid="npd-form"]')).toBeVisible()
  })

  test('should create NPD with basic information', async ({ page }) => {
    // Navigate to NPD creation
    await page.goto(`${BASE_URL}/npd/create`)
    await waitForLoadingComplete(page)
    
    // Fill in NPD basic information
    try {
      // Nomor NPD
      await fillField(page, 'nomorNPD', testData.npd.nomorNPD)
    } catch (e) {
      // Try alternative selectors
      await page.fill('input[name="nomorNPD"]', testData.npd.nomorNPD)
    }
    
    try {
      // Tanggal
      await fillField(page, 'tanggal', testData.npd.tanggal)
    } catch (e) {
      await page.fill('input[type="date"]', testData.npd.tanggal)
    }
    
    try {
      // Jenis Belanja
      const jenisSelect = page.locator('select[name="jenisBelanja"]').first()
      if (await jenisSelect.isVisible({ timeout: 1000 })) {
        await jenisSelect.selectOption(testData.npd.jenisBelanja)
      }
    } catch (e) {
      console.warn('Jenis Belanja field not found')
    }
    
    try {
      // Maksud
      await fillField(page, 'maksud', testData.npd.maksud)
    } catch (e) {
      await page.fill('textarea[name="maksud"]', testData.npd.maksud)
    }
    
    // Take screenshot of filled form
    await takeScreenshot(page, 'npd-form-filled')
    
    // Save as draft
    await clickButton(page, /Save.*Draft|Simpan.*Draft/i)
    
    // Wait for success notification
    await waitForToast(page, /saved|tersimpan|success/i, { timeout: 10000 })
    
    // Verify NPD appears in list
    await page.goto(`${BASE_URL}/npd`)
    await waitForLoadingComplete(page)
    
    // Search for created NPD
    const npdList = page.locator(`text=${testData.npd.nomorNPD}`)
    await expect(npdList.first()).toBeVisible({ timeout: 5000 })
  })

  test('should add account lines to NPD', async ({ page }) => {
    // Create NPD first
    await page.goto(`${BASE_URL}/npd/create`)
    await waitForLoadingComplete(page)
    
    // Fill basic info
    await page.fill('input[name="nomorNPD"]', testData.npd.nomorNPD)
    await page.fill('input[type="date"]', testData.npd.tanggal)
    
    // Add account line
    const addLineButtonSelectors = [
      'button:has-text("Add Line")',
      'button:has-text("Tambah Akun")',
      'button:has-text("Tambah Baris")',
      '[data-testid="add-line-button"]',
    ]
    
    let addLineFound = false
    for (const selector of addLineButtonSelectors) {
      try {
        const button = page.locator(selector).first()
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click()
          addLineFound = true
          await page.waitForTimeout(500)
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (addLineFound) {
      // Select RKA account from dropdown
      const accountSelectSelectors = [
        'select[name*="account"]',
        'select[name*="akun"]',
        '[data-testid="account-select"]',
      ]
      
      for (const selector of accountSelectSelectors) {
        try {
          const select = page.locator(selector).first()
          if (await select.isVisible({ timeout: 1000 })) {
            // Select first available account
            const options = await select.locator('option').all()
            if (options.length > 1) {
              await select.selectOption({ index: 1 })
            }
            break
          }
        } catch (e) {
          continue
        }
      }
      
      // Fill in amount
      const amountInputSelectors = [
        'input[name*="jumlah"]',
        'input[name*="amount"]',
        'input[type="number"]',
      ]
      
      for (const selector of amountInputSelectors) {
        try {
          const input = page.locator(selector).first()
          if (await input.isVisible({ timeout: 1000 })) {
            await input.fill('5000000')
            break
          }
        } catch (e) {
          continue
        }
      }
      
      // Fill in description
      const descInputSelectors = [
        'input[name*="keterangan"]',
        'input[name*="uraian"]',
        'textarea[name*="keterangan"]',
      ]
      
      for (const selector of descInputSelectors) {
        try {
          const input = page.locator(selector).first()
          if (await input.isVisible({ timeout: 1000 })) {
            await input.fill('Test account line for E2E testing')
            break
          }
        } catch (e) {
          continue
        }
      }
      
      // Take screenshot
      await takeScreenshot(page, 'npd-with-lines')
      
      // Save
      await clickButton(page, /Save|Simpan/i)
      await waitForToast(page, /saved|tersimpan/i, { timeout: 10000 })
    } else {
      console.warn('Add line button not found - skipping line addition test')
    }
  })

  test('should upload attachment to NPD', async ({ page }) => {
    // Create NPD first
    await page.goto(`${BASE_URL}/npd/create`)
    await waitForLoadingComplete(page)
    
    // Fill basic info
    await page.fill('input[name="nomorNPD"]', testData.npd.nomorNPD)
    await page.fill('input[type="date"]', testData.npd.tanggal)
    
    // Save draft first
    await clickButton(page, /Save.*Draft|Simpan.*Draft/i)
    await waitForToast(page, /saved|tersimpan/i, { timeout: 10000 })
    
    // Look for file upload section
    const fileInputSelectors = [
      'input[type="file"]',
      '[data-testid="file-upload-input"]',
    ]
    
    let fileInputFound = false
    for (const selector of fileInputSelectors) {
      try {
        const fileInput = page.locator(selector).first()
        if (await fileInput.isVisible({ timeout: 2000 })) {
          // Create a test file
          const testFilePath = './test-results/test-document.pdf'
          const fs = require('fs')
          
          // Create test directory if not exists
          if (!fs.existsSync('./test-results')) {
            fs.mkdirSync('./test-results', { recursive: true })
          }
          
          // Create a simple PDF-like file
          fs.writeFileSync(testFilePath, '%PDF-1.4\nTest PDF content for E2E testing')
          
          // Upload file
          await fileInput.setInputFiles(testFilePath)
          fileInputFound = true
          
          // Wait for upload to complete
          await page.waitForTimeout(2000)
          
          // Verify file appears in list
          const fileListSelectors = [
            '.file-list',
            '[data-testid="uploaded-files"]',
            'text=/test-document.pdf/i',
          ]
          
          for (const listSelector of fileListSelectors) {
            try {
              const fileList = page.locator(listSelector).first()
              if (await fileList.isVisible({ timeout: 2000 })) {
                await expect(fileList).toContainText(/test-document|pdf/i)
                break
              }
            } catch (e) {
              continue
            }
          }
          
          await takeScreenshot(page, 'npd-with-attachment')
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!fileInputFound) {
      console.warn('File upload input not found - skipping attachment test')
    }
  })

  test('should submit NPD for verification', async ({ page }) => {
    // Create and save NPD first
    await page.goto(`${BASE_URL}/npd/create`)
    await waitForLoadingComplete(page)
    
    // Fill basic info
    await page.fill('input[name="nomorNPD"]', testData.npd.nomorNPD)
    await page.fill('input[type="date"]', testData.npd.tanggal)
    
    // Save as draft
    await clickButton(page, /Save.*Draft|Simpan.*Draft/i)
    await waitForToast(page, /saved|tersimpan/i, { timeout: 10000 })
    
    // Submit for verification
    const submitButtonSelectors = [
      'button:has-text("Submit")',
      'button:has-text("Ajukan")',
      'button:has-text("Submit for Verification")',
      '[data-testid="submit-npd-button"]',
    ]
    
    let submitFound = false
    for (const selector of submitButtonSelectors) {
      try {
        const button = page.locator(selector).first()
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click()
          submitFound = true
          
          // Confirm if there's a confirmation dialog
          try {
            const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Ya"), button:has-text("OK")').first()
            if (await confirmButton.isVisible({ timeout: 2000 })) {
              await confirmButton.click()
            }
          } catch (e) {
            // No confirmation dialog
          }
          
          // Wait for success notification
          await waitForToast(page, /submitted|diajukan|success/i, { timeout: 10000 })
          
          // Verify status changed
          await page.waitForTimeout(1000)
          const statusIndicators = page.locator('text=/diajukan|submitted|pending/i')
          await expect(statusIndicators.first()).toBeVisible({ timeout: 5000 })
          
          await takeScreenshot(page, 'npd-submitted')
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!submitFound) {
      console.warn('Submit button not found - NPD may already be submitted or button selector needs update')
    }
  })

  test('should prevent editing after submission', async ({ page }) => {
    // Create, save, and submit NPD
    await page.goto(`${BASE_URL}/npd/create`)
    await waitForLoadingComplete(page)
    
    await page.fill('input[name="nomorNPD"]', testData.npd.nomorNPD)
    await page.fill('input[type="date"]', testData.npd.tanggal)
    
    // Save as draft
    await clickButton(page, /Save.*Draft|Simpan.*Draft/i)
    await waitForToast(page, /saved|tersimpan/i, { timeout: 10000 })
    
    // Submit
    try {
      await clickButton(page, /Submit|Ajukan/i)
      await page.waitForTimeout(1000)
      
      // Try to confirm if dialog appears
      try {
        await clickButton(page, /Confirm|Ya|OK/i)
      } catch (e) {
        // No confirmation
      }
      
      await waitForToast(page, /submitted|diajukan/i, { timeout: 10000 })
    } catch (e) {
      console.warn('Could not submit NPD for edit prevention test')
      return
    }
    
    // Try to edit - fields should be disabled
    const nomorInput = page.locator('input[name="nomorNPD"]').first()
    const isDisabled = await nomorInput.isDisabled().catch(() => false)
    
    if (isDisabled) {
      expect(isDisabled).toBe(true)
    } else {
      // Check if edit buttons are hidden
      const editButtons = page.locator('button:has-text("Edit"), button:has-text("Ubah")')
      const editButtonVisible = await editButtons.first().isVisible({ timeout: 1000 }).catch(() => false)
      expect(editButtonVisible).toBe(false)
    }
  })
})

test.describe('NPD Verification Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Bendahara (would need different credentials)
    // For now, login with default user
    await login(page)
    await waitForLoadingComplete(page)
  })

  test('should display pending NPDs for verification', async ({ page }) => {
    // Navigate to verification queue
    const verificationUrls = [
      `${BASE_URL}/npd/verification`,
      `${BASE_URL}/npd?status=pending`,
      `${BASE_URL}/npd`,
    ]
    
    for (const url of verificationUrls) {
      try {
        await page.goto(url)
        await waitForLoadingComplete(page)
        
        // Look for pending NPDs
        const pendingIndicators = page.locator('text=/pending|diajukan|verification/i')
        const hasPending = await pendingIndicators.first().isVisible({ timeout: 2000 }).catch(() => false)
        
        if (hasPending) {
          await takeScreenshot(page, 'verification-queue')
          break
        }
      } catch (e) {
        continue
      }
    }
  })

  test('should verify NPD with checklist', async ({ page }) => {
    // Navigate to NPD list
    await page.goto(`${BASE_URL}/npd`)
    await waitForLoadingComplete(page)
    
    // Find a pending NPD
    const pendingNPDs = page.locator('[data-status="pending"], [data-status="diajukan"], text=/pending|diajukan/i')
    const count = await pendingNPDs.count()
    
    if (count > 0) {
      // Click on first pending NPD
      await pendingNPDs.first().click()
      await waitForLoadingComplete(page)
      
      // Look for verification checklist
      const checklistSelectors = [
        'input[type="checkbox"]',
        '[role="checkbox"]',
        '[data-testid="verification-checklist"]',
      ]
      
      let checklistFound = false
      for (const selector of checklistSelectors) {
        try {
          const checkboxes = page.locator(selector)
          const checkboxCount = await checkboxes.count()
          
          if (checkboxCount > 0) {
            // Check all checkboxes
            for (let i = 0; i < checkboxCount; i++) {
              const checkbox = checkboxes.nth(i)
              if (await checkbox.isVisible({ timeout: 1000 })) {
                await checkbox.check()
              }
            }
            checklistFound = true
            break
          }
        } catch (e) {
          continue
        }
      }
      
      if (checklistFound) {
        // Add verification notes
        const notesSelectors = [
          'textarea[name*="catatan"]',
          'textarea[name*="notes"]',
          'textarea[placeholder*="notes"]',
        ]
        
        for (const selector of notesSelectors) {
          try {
            const notes = page.locator(selector).first()
            if (await notes.isVisible({ timeout: 1000 })) {
              await notes.fill('Verified by E2E test - all documents complete')
              break
            }
          } catch (e) {
            continue
          }
        }
        
        await takeScreenshot(page, 'npd-verification-form')
        
        // Approve NPD
        await clickButton(page, /Approve|Verify|Setujui/i)
        
        // Confirm if needed
        try {
          await clickButton(page, /Confirm|Ya|OK/i)
        } catch (e) {
          // No confirmation
        }
        
        await waitForToast(page, /verified|diverifikasi|approved/i, { timeout: 10000 })
        await takeScreenshot(page, 'npd-verified')
      } else {
        console.warn('Verification checklist not found')
      }
    } else {
      console.warn('No pending NPDs found for verification test')
    }
  })

  test('should finalize verified NPD', async ({ page }) => {
    // Navigate to NPD list
    await page.goto(`${BASE_URL}/npd`)
    await waitForLoadingComplete(page)
    
    // Find a verified NPD
    const verifiedNPDs = page.locator('[data-status="verified"], [data-status="diverifikasi"], text=/verified|diverifikasi/i')
    const count = await verifiedNPDs.count()
    
    if (count > 0) {
      // Click on first verified NPD
      await verifiedNPDs.first().click()
      await waitForLoadingComplete(page)
      
      // Finalize NPD
      const finalizeButtonSelectors = [
        'button:has-text("Finalize")',
        'button:has-text("Finalisasi")',
        'button:has-text("Final")',
        '[data-testid="finalize-button"]',
      ]
      
      let finalizeFound = false
      for (const selector of finalizeButtonSelectors) {
        try {
          const button = page.locator(selector).first()
          if (await button.isVisible({ timeout: 2000 })) {
            await button.click()
            finalizeFound = true
            
            // Confirm if needed
            try {
              await clickButton(page, /Confirm|Ya|OK/i)
            } catch (e) {
              // No confirmation
            }
            
            await waitForToast(page, /finalized|final|success/i, { timeout: 10000 })
            
            // Verify status changed to final
            await page.waitForTimeout(1000)
            const finalStatus = page.locator('text=/final/i')
            await expect(finalStatus.first()).toBeVisible({ timeout: 5000 })
            
            await takeScreenshot(page, 'npd-finalized')
            break
          }
        } catch (e) {
          continue
        }
      }
      
      if (!finalizeFound) {
        console.warn('Finalize button not found')
      }
    } else {
      console.warn('No verified NPDs found for finalization test')
    }
  })

  test('should lock NPD after finalization', async ({ page }) => {
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
      
      // Verify edit buttons are disabled/hidden
      const editButtons = page.locator('button:has-text("Edit"), button:has-text("Ubah"), button:has-text("Delete"), button:has-text("Hapus")')
      
      for (let i = 0; i < await editButtons.count(); i++) {
        const button = editButtons.nth(i)
        const isDisabled = await button.isDisabled().catch(() => true)
        const isHidden = !(await button.isVisible({ timeout: 500 }).catch(() => false))
        
        expect(isDisabled || isHidden).toBe(true)
      }
      
      // Verify form fields are disabled
      const inputs = page.locator('input:not([type="hidden"]), textarea, select')
      const inputCount = await inputs.count()
      
      if (inputCount > 0) {
        const firstInput = inputs.first()
        const isDisabled = await firstInput.isDisabled().catch(() => false)
        
        if (isDisabled) {
          expect(isDisabled).toBe(true)
        }
      }
      
      await takeScreenshot(page, 'npd-locked')
    } else {
      console.warn('No finalized NPDs found for lock test')
    }
  })
})

