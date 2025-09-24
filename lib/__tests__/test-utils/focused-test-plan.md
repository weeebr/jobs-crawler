# 🎯 Focused Test Strategy: Critical Paths Only

## Core User Scenarios (Must Test)
1. **Single Job Analysis** - User submits one job URL → Gets analysis
2. **Search Results** - User submits search URL → Gets multiple job analyses
3. **Raw HTML Analysis** - User pastes job HTML → Gets analysis
4. **Invalid Input** - User submits bad data → Gets proper error

## Critical Backend Functionality (Must Test)
1. **Data Storage** - Save/retrieve/update analysis records
2. **Job Parsing** - Extract structured data from job posts
3. **CV Matching** - Compare CV against job requirements
4. **Error Resilience** - Handle network timeouts, parsing failures

## Test Structure: Keep It Lean

### ✅ Essential Test Files (Keep)
- `api-analyze.test.ts` - Core API happy path
- `api-analyze-schema-validation.test.ts` - Input validation
- `analysisStore.test.ts` - Storage operations
- `parseJobAd.test.ts` - Job parsing logic
- `compareCv.test.ts` - CV matching logic

### ❌ Overkill Test Files (Simplify/Remove)
- `api-analyze-errors.test.ts` - Too much mocking, not testing real errors
- `error-handling/` - 5+ files for error scenarios (overkill)
- `streaming/` - 3+ files for internal streaming logic
- `workflow/` - Complex workflow testing

### 🧹 Test Utilities (Consolidate)
**Keep:**
- `mocks.ts` - Simple dependency mocking
- `test-data.ts` - Valid/invalid test data factories

**Remove/Consolidate:**
- `errorScenarioHelpers.ts` (200+ lines)
- `streamingTestUtils.ts`
- `twoStageErrorTestUtils.ts`
- `assertionHelpers.ts`

## 📊 Current vs. Proposed Coverage

| Scenario | Current | Proposed | Rationale |
|----------|---------|----------|-----------|
| Single Job | ✅ Complex mocks | ✅ Simple real validation | Test real API behavior |
| Search Results | ✅ Multiple test files | ✅ One focused test | User-facing functionality |
| Error Handling | ❌ 5+ files, 200+ lines each | ✅ 2-3 integration tests | Test real failures, not mocks |
| Storage | ✅ 158 lines | ✅ Keep as-is | Core functionality |
| Parsing | ✅ Keep | ✅ Keep | Core functionality |
| Streaming | ❌ Over-testing internals | ❌ Remove | Implementation detail |

## 🎯 Recommended Actions

1. **Delete Over-Engineered Tests**
   - Remove `error-handling/` directory (5 files)
   - Remove `streaming/` test directory (3 files)
   - Remove `workflow/` test directory (3 files)
   - Simplify `api-analyze-errors.test.ts` to 1-2 real error scenarios

2. **Consolidate Test Utilities**
   - Merge helper files into 2-3 focused utilities
   - Remove 200+ line test helper files
   - Keep only essential mocking and data factories

3. **Focus on User Scenarios**
   - Test: "User submits job URL → Gets analysis"
   - Test: "User submits search URL → Gets multiple analyses"
   - Test: "User submits invalid data → Gets helpful error"

4. **Test Real Failures**
   - Use real network errors (timeout, 404)
   - Use real parsing failures (malformed HTML)
   - Use real validation errors (invalid schemas)

## ✅ Result: Streamlined Yet Robust

**Before:** 40+ test files, extensive mocking, questionable coverage
**After:** 8-10 focused test files, real validation, critical path coverage

This approach gives you **confidence in core functionality** while eliminating **testing theater** that doesn't add value.
