#!/bin/bash

# ============================================================================
# NPD Tracker - Smoke Tests for Staging/Production Deployment
# ============================================================================
# 
# This script performs automated smoke tests to verify basic functionality
# after deployment to staging or production environments.
#
# Usage:
#   ./scripts/smoke-tests.sh [environment-url]
#
# Example:
#   ./scripts/smoke-tests.sh https://npd-tracker-staging.vercel.app
#
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to staging if no URL provided
TARGET_URL="${1:-https://npd-tracker-staging.vercel.app}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🧪 NPD Tracker Smoke Tests${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Target: ${YELLOW}$TARGET_URL${NC}"
echo -e "Date: $(date)"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=10

# ============================================================================
# Test Functions
# ============================================================================

run_test() {
  local test_name="$1"
  local test_command="$2"
  
  echo -n "Testing: $test_name... "
  
  if eval "$test_command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
    return 1
  fi
}

# ============================================================================
# Test 1: Homepage Accessibility
# ============================================================================

test_homepage() {
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL")
  [ "$HTTP_CODE" -eq 200 ]
}

run_test "Homepage accessibility (200)" "test_homepage"

# ============================================================================
# Test 2: API Health Check
# ============================================================================

test_health_check() {
  HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/api/health")
  [ "$HEALTH_CODE" -eq 200 ] || [ "$HEALTH_CODE" -eq 404 ]  # 404 is OK if health endpoint not implemented
}

run_test "API health check" "test_health_check"

# ============================================================================
# Test 3: Static Assets Load
# ============================================================================

test_favicon() {
  FAVICON_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/favicon.ico")
  [ "$FAVICON_CODE" -eq 200 ]
}

run_test "Favicon loads" "test_favicon"

# ============================================================================
# Test 4: Check for Critical JavaScript Errors
# ============================================================================

test_no_js_errors() {
  RESPONSE=$(curl -s "$TARGET_URL")
  ! echo "$RESPONSE" | grep -q "SyntaxError"
}

run_test "No JavaScript syntax errors" "test_no_js_errors"

# ============================================================================
# Test 5: Response Time Check
# ============================================================================

test_response_time() {
  RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$TARGET_URL")
  # Response time should be less than 5 seconds
  [ "$(echo "$RESPONSE_TIME < 5.0" | bc)" -eq 1 ]
}

run_test "Response time < 5s" "test_response_time"

# ============================================================================
# Test 6: SSL Certificate Valid
# ============================================================================

test_ssl_cert() {
  if [[ "$TARGET_URL" == https://* ]]; then
    DOMAIN=$(echo "$TARGET_URL" | sed -e 's|https://||' -e 's|/.*||')
    echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | grep -q "Verify return code: 0 (ok)"
  else
    # Skip SSL check for non-HTTPS URLs
    return 0
  fi
}

run_test "SSL certificate valid" "test_ssl_cert"

# ============================================================================
# Test 7: Security Headers Present
# ============================================================================

test_security_headers() {
  HEADERS=$(curl -sI "$TARGET_URL")
  echo "$HEADERS" | grep -q "X-Frame-Options" || echo "$HEADERS" | grep -q "Content-Security-Policy"
}

run_test "Security headers present" "test_security_headers"

# ============================================================================
# Test 8: No 500 Errors on Main Pages
# ============================================================================

test_no_500_errors() {
  local pages=("/" "/dashboard" "/npd" "/sp2d" "/reports")
  for page in "${pages[@]}"; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL$page")
    # Accept 200, 302 (redirect), 401 (auth required), 404 (page not found)
    # Reject 500, 502, 503 (server errors)
    if [ "$CODE" -ge 500 ]; then
      return 1
    fi
  done
  return 0
}

run_test "No 500 errors on main pages" "test_no_500_errors"

# ============================================================================
# Test 9: Content Delivery Network (CDN) Working
# ============================================================================

test_cdn_assets() {
  # Check if Next.js static assets are accessible
  RESPONSE=$(curl -s "$TARGET_URL")
  echo "$RESPONSE" | grep -q "_next/static" || echo "$RESPONSE" | grep -q "static"
}

run_test "Static assets loading" "test_cdn_assets"

# ============================================================================
# Test 10: Robots.txt Accessible
# ============================================================================

test_robots() {
  ROBOTS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL/robots.txt")
  [ "$ROBOTS_CODE" -eq 200 ] || [ "$ROBOTS_CODE" -eq 404 ]  # Both OK
}

run_test "Robots.txt accessible" "test_robots"

# ============================================================================
# Summary
# ============================================================================

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All smoke tests passed!${NC}"
  echo -e "${GREEN}Deployment appears to be healthy.${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some smoke tests failed.${NC}"
  echo -e "${YELLOW}Please investigate failures before proceeding.${NC}"
  exit 1
fi

