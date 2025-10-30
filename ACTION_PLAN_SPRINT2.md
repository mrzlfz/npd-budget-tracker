# Action Plan: Sprint 2 - SP2D & Testing

**Duration:** 2 weeks  
**Start Date:** 30 Oktober 2025  
**Target Completion:** 13 November 2025  
**Priority:** 🔴 CRITICAL

---

## 🎯 Sprint Goals

1. ✅ **Complete SP2D Distribution Logic** (Blocking)
2. ✅ **Establish Testing Infrastructure** (Quality Assurance)
3. ✅ **Fix Type Errors** (Code Quality)
4. ✅ **Connect Real-time Data to Dashboard** (User Value)

---

## 📋 Tasks Breakdown

### Week 1: SP2D Core Implementation

#### Day 1-2: SP2D Distribution Logic

**File:** `packages/convex/functions/sp2d.ts`

```typescript
// TODO: Implement proportional distribution
// 
// 1. Mutation: createSP2D
//    - Input: npdId, noSPM, noSP2D, tglSP2D, nilaiCair
//    - Validation: nilaiCair <= total NPD lines
//    - Get all npdLines for this NPD
//    - Calculate proportion: nilaiCair * (line.jumlah / totalNPD)
//    - Create sp2dRef record
//    - Create/update realizations for each account
//    - Update rkaAccounts: realisasiTahun += amount, sisaPagu -= amount
//    - Audit log
//
// 2. Mutation: updateSP2D
//    - Similar logic with revert old values first
//
// 3. Query: getSP2DWithDistribution
//    - Return SP2D with breakdown per account
```

**Tasks:**
- [ ] Create `createSP2D` mutation with validation
- [ ] Implement proportional distribution formula
- [ ] Update `realizations` table (aggregate by accountId)
- [ ] Update `rkaAccounts` realisasiTahun & sisaPagu
- [ ] Add transaction-like behavior (all or nothing)
- [ ] Add comprehensive error handling
- [ ] Create audit log entry
- [ ] Test with sample data

**Acceptance Criteria:**
- ✅ SP2D creation distributes amount to all NPD line accounts
- ✅ realisasiTahun and sisaPagu updated correctly
- ✅ Validation prevents SP2D > NPD total
- ✅ Audit log records distribution details

#### Day 3: Dashboard Integration

**File:** `apps/web/src/app/dashboard/page.tsx`

```typescript
// TODO: Replace mock data with real Convex queries
//
// 1. Use useDashboardData hook to fetch:
//    - Total pagu from rkaAccounts (sum paguTahun)
//    - Total realisasi from rkaAccounts (sum realisasiTahun)
//    - NPD counts by status
//    - SP2D total
//
// 2. Real-time subscription for updates
//
// 3. Charts data dari actual realizations
```

**Tasks:**
- [ ] Create `getDashboardStats` query in Convex
- [ ] Fetch real pagu & realisasi totals
- [ ] Connect charts to real data
- [ ] Add loading states
- [ ] Test real-time updates (create SP2D → see dashboard update)
- [ ] Performance optimization (caching if needed)

**Acceptance Criteria:**
- ✅ Dashboard shows actual data from database
- ✅ Updates within 1 second after SP2D creation
- ✅ Charts render correctly with real data
- ✅ No mock data remaining

#### Day 4: SP2D History & Filters

**File:** `apps/web/src/app/sp2d/page.tsx`

```typescript
// TODO: Enhance SP2D list page
//
// 1. Add filters:
//    - Date range (tglSP2D)
//    - NPD jenis (UP/GU/TU/LS)
//    - Created by user
//
// 2. Show distribution details in expandable row
//
// 3. Add search by SP2D number
```

**Tasks:**
- [ ] Create filter UI components
- [ ] Implement `getSP2DsWithFilters` query
- [ ] Add search functionality
- [ ] Show per-account distribution in detail view
- [ ] Add export to CSV button
- [ ] Pagination for large datasets

#### Day 5: Testing - Unit Tests

**File:** `packages/convex/test/sp2d.test.ts` (NEW)

```typescript
// TODO: Create unit tests for SP2D
//
// Test cases:
// 1. Distribution calculation correctness
// 2. Validation: SP2D > NPD total should fail
// 3. Multiple SP2D for same NPD (accumulation)
// 4. Edge cases: zero amounts, single line NPD
```

**Tasks:**
- [ ] Setup test file for sp2d.ts
- [ ] Test: proportional distribution formula
- [ ] Test: validation logic
- [ ] Test: realisasi accumulation
- [ ] Test: sisaPagu calculation
- [ ] Test: audit log creation
- [ ] Coverage > 80% for sp2d functions

**Tools:** Vitest (already configured)

---

### Week 2: Testing & Bug Fixes

#### Day 6-7: Integration Tests

**File:** `apps/web/src/__tests__/integration/npd-workflow.test.tsx` (NEW)

```typescript
// TODO: Integration test for full NPD workflow
//
// Test scenario:
// 1. Create RKA (program → kegiatan → subkegiatan → accounts)
// 2. Create NPD with lines from accounts
// 3. Submit NPD (Draft → Diajukan)
// 4. Verify NPD (Diajukan → Diverifikasi)
// 5. Finalize NPD (Diverifikasi → Final)
// 6. Create SP2D for NPD
// 7. Verify realisasi updated
// 8. Check sisaPagu reduced
// 9. Verify audit log entries
```

**Tasks:**
- [ ] Setup integration test environment
- [ ] Mock Convex client for tests
- [ ] Test full workflow: RKA → NPD → SP2D
- [ ] Test permissions at each stage
- [ ] Test rejection workflow
- [ ] Test budget validation (exceeding sisa pagu)
- [ ] Verify audit trail completeness

#### Day 8: Unit Tests - Utilities

**Files to Test:**
- `apps/web/src/lib/utils/format.ts` - formatCurrency, formatNumber
- `apps/web/src/lib/utils/date.ts` - date formatting with Asia/Jakarta
- `apps/web/src/lib/utils/budget.ts` - budget calculation helpers

**Tasks:**
- [ ] Test formatCurrency with IDR
- [ ] Test formatNumber edge cases
- [ ] Test date formatting (Asia/Jakarta timezone)
- [ ] Test budget calculation accuracy
- [ ] Test sisaPagu calculation
- [ ] Test percentage calculations
- [ ] Coverage > 90% for utils

#### Day 9: E2E Tests Setup

**File:** `tests/e2e/npd-creation.spec.ts` (NEW)

```typescript
// TODO: E2E test with Playwright
//
// Test flow:
// 1. Login with test user (PPTK role)
// 2. Navigate to NPD Builder
// 3. Select RKA subkegiatan
// 4. Add line items
// 5. Upload attachment
// 6. Save as draft
// 7. Submit for verification
// 8. Logout, login as Bendahara
// 9. Verify NPD
// 10. Finalize NPD
```

**Tasks:**
- [ ] Setup Playwright test environment
- [ ] Create test fixtures (test org, users, RKA)
- [ ] Write E2E test for NPD creation
- [ ] Write E2E test for verification workflow
- [ ] Write E2E test for SP2D creation
- [ ] Take screenshots on failure
- [ ] Run tests in CI pipeline

**Config File:** `playwright.config.ts` (already exists)

#### Day 10: Bug Fixes & Cleanup

**Type Errors to Fix:**

1. **useFileUpload.ts**
```typescript
// Current issue: Icon components in notifications
// Fix: Properly import and use Tabler icons
```

2. **usePermissions.ts**
```typescript
// Current issue: JSX syntax errors in PermissionGuard
// Fix: Correct JSX syntax for React components
```

**Other Issues:**

3. **Redundant Tables**
```typescript
// Issue: attachments vs npdFiles
// Decision: Choose one, migrate data, drop other
// Recommendation: Keep 'attachments' (more metadata)
```

**Tasks:**
- [ ] Fix type error in useFileUpload.ts
- [ ] Fix type error in usePermissions.ts
- [ ] Decide on attachments vs npdFiles
- [ ] Migrate data if needed
- [ ] Remove unused code
- [ ] Update schema documentation
- [ ] Run full type check (`pnpm type-check`)

---

## 🧪 Testing Checklist

### Unit Tests (Target: 70% coverage)
- [ ] SP2D distribution calculation
- [ ] Budget validation logic
- [ ] Currency formatting
- [ ] Date formatting (Asia/Jakarta)
- [ ] Percentage calculations
- [ ] Nomor NPD generation

### Integration Tests
- [ ] NPD workflow: Draft → Final
- [ ] SP2D creation → Realisasi update
- [ ] Budget constraint enforcement
- [ ] Role-based permissions
- [ ] Audit log creation

### E2E Tests
- [ ] User login & organization switch
- [ ] Create NPD from RKA
- [ ] Submit & verify workflow
- [ ] Create SP2D
- [ ] Dashboard data accuracy

### Manual Testing
- [ ] SP2D distribusi dengan multiple lines
- [ ] Dashboard real-time update
- [ ] File upload & download
- [ ] PDF generation
- [ ] Mobile responsiveness

---

## 📊 Success Metrics

### Performance
- ✅ Dashboard load time < 2s
- ✅ SP2D creation < 1s
- ✅ Real-time update latency < 1s
- ✅ Page rendering < 200ms

### Quality
- ✅ Type errors: 0
- ✅ Unit test coverage > 70%
- ✅ Integration tests: 5+ scenarios
- ✅ E2E tests: 3+ critical paths
- ✅ No console errors

### Functionality
- ✅ SP2D distributes correctly
- ✅ Dashboard shows real data
- ✅ Realisasi updates automatically
- ✅ sisaPagu accurate
- ✅ Audit trail complete

---

## 🚨 Blockers & Dependencies

### Potential Blockers
1. **Playwright Setup** - Might need Docker for CI
2. **Test Data** - Need seed script for test fixtures
3. **Convex Mocking** - Might be complex for integration tests

### Mitigation
- Setup local Playwright first, CI later
- Create seed script early (Day 6)
- Use Convex test environment if available

---

## 📝 Daily Standup Template

```markdown
### Day X - [Date]

**Completed Yesterday:**
- [ ] Task 1
- [ ] Task 2

**Today's Plan:**
- [ ] Task 3
- [ ] Task 4

**Blockers:**
- None / [Describe blocker]

**Notes:**
- [Any observations or learnings]
```

---

## 🎯 Definition of Done

Sprint 2 is complete when:

- ✅ All SP2D distribution logic implemented & tested
- ✅ Dashboard shows real-time data from database
- ✅ Unit tests coverage > 70% for critical functions
- ✅ Integration tests cover main workflows
- ✅ E2E tests setup & running (3+ scenarios)
- ✅ Type errors fixed (0 errors)
- ✅ Manual testing passed for all new features
- ✅ Documentation updated (API docs, user guide)
- ✅ Code reviewed & merged to main
- ✅ Deployed to staging environment

---

## 🔄 Rollout Plan

### Testing Environment
1. Run all tests locally: `pnpm test`
2. Run E2E tests: `pnpm test:e2e`
3. Manual testing on dev environment

### Staging Deployment
1. Deploy to staging: `pnpm deploy:staging`
2. Run smoke tests
3. Invite stakeholders for UAT

### Production (if approved)
1. Create release branch: `release/sprint-2`
2. Final QA on staging
3. Deploy to production: `pnpm deploy:prod`
4. Monitor for 24 hours

---

## 📚 Resources

### Documentation
- PRD: `PRD.md`
- API Docs: `API_DOCS.md`
- Sprint 1: `SPRINT1_IMPLEMENTATION.md`
- Analysis: `ANALYSIS_PRD_VS_IMPLEMENTATION.md`

### Tools
- Vitest: `https://vitest.dev/`
- Playwright: `https://playwright.dev/`
- Convex Testing: `https://docs.convex.dev/testing`

### Code References
- SP2D Schema: `packages/convex/schema.ts:233-247`
- NPD Functions: `packages/convex/functions/npd.ts`
- Dashboard: `apps/web/src/app/dashboard/page.tsx`

---

## ✅ Pre-Sprint Checklist

Before starting Sprint 2:
- [ ] Review this action plan with team
- [ ] Ensure all dependencies installed
- [ ] Create feature branch: `feature/sprint-2-sp2d-testing`
- [ ] Setup test environment
- [ ] Create test fixtures/seed data
- [ ] Assign tasks (if team > 1)
- [ ] Setup daily standup schedule

---

**Ready to start? Let's build! 🚀**

*Last Updated: 30 Oktober 2025*

