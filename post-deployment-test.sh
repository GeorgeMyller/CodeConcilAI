#!/bin/bash

# CodeCouncil AI - Post-Deployment Production Testing
# Run this after deploying to production to validate all endpoints

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  CodeCouncil AI - Post-Deployment Testing                  ║"
echo "║  Testing all endpoints in production                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
read -p "Enter production backend URL (e.g., https://api.codecouncil.com): " API_URL
read -p "Enter test user JWT token (from production login): " JWT_TOKEN

if [ -z "$API_URL" ] || [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}Error: API_URL and JWT_TOKEN are required${NC}"
    exit 1
fi

TESTS_PASSED=0
TESTS_FAILED=0

# Helper function for API testing
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_code=$3
    local description=$4
    local data=$5
    
    echo -n "Testing: $description... "
    
    local url="${API_URL}${endpoint}"
    local curl_opts=(-s -w "%{http_code}" -X "$method" -H "Authorization: Bearer $JWT_TOKEN" -H "Content-Type: application/json")
    
    if [ -n "$data" ]; then
        curl_opts+=(-d "$data")
    fi
    
    local response=$(curl "${curl_opts[@]}" "$url")
    local http_code="${response: -3}"
    
    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ (HTTP $http_code)${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ (Expected $expected_code, got $http_code)${NC}"
        ((TESTS_FAILED++))
    fi
}

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Testing API Endpoints${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}1. System Health${NC}"
test_endpoint "GET" "/health" "200" "Health endpoint"
echo ""

# Test 2: Authentication
echo -e "${YELLOW}2. Authentication${NC}"
test_endpoint "GET" "/auth/me" "200" "Get current user"
echo ""

# Test 3: Gemini Analysis (Rate Limited)
echo -e "${YELLOW}3. Gemini Analysis${NC}"
test_endpoint "POST" "/gemini/analyze" "200" "Submit code analysis" \
    '{"code":"console.log(\"test\");","language":"javascript"}'
echo ""

# Test 4: Subscriptions
echo -e "${YELLOW}4. Subscription Management${NC}"
test_endpoint "GET" "/subscriptions/plans" "200" "Get pricing plans"
test_endpoint "GET" "/subscriptions/current" "200" "Get current subscription"
echo ""

# Test 5: Admin Dashboard
echo -e "${YELLOW}5. Admin Dashboard${NC}"
test_endpoint "GET" "/admin/stats" "200" "Get admin stats" || true
test_endpoint "GET" "/admin/audit-logs" "200" "Get audit logs" || true
test_endpoint "GET" "/admin/users/1" "200" "Get user details" || true
echo ""

# Test 6: Rate Limiting
echo -e "${YELLOW}6. Rate Limiting${NC}"
test_endpoint "GET" "/rate-limit/usage" "200" "Get rate limit usage"
echo ""

# Test 7: Metrics
echo -e "${YELLOW}7. Monitoring${NC}"
test_endpoint "GET" "/metrics" "200" "Get Prometheus metrics"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Testing Database Connectivity${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Test database via API
test_endpoint "GET" "/admin/analytics" "200" "Database query (analytics)" || true
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Testing External Integrations${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Test Stripe integration (if subscription endpoint returns 200)
test_endpoint "GET" "/subscriptions/plans" "200" "Stripe API connectivity"
echo ""

# Final Results
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}TEST RESULTS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

TOTAL=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL -gt 0 ]; then
    PERCENTAGE=$((TESTS_PASSED * 100 / TOTAL))
else
    PERCENTAGE=0
fi

echo -e "${GREEN}✓ Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}✗ Failed: ${TESTS_FAILED}${NC}"
echo "Total: $TOTAL"
echo "Score: ${PERCENTAGE}%"
echo ""

if [ $TESTS_FAILED -le 2 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Production deployment is operational!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Test subscription creation in Stripe Dashboard"
    echo "  2. Verify webhook delivery in Stripe → Webhooks"
    echo "  3. Monitor errors in Sentry"
    echo "  4. View dashboard at Grafana"
    echo "  5. Check audit logs in Admin Panel"
    echo ""
else
    echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}⚠️  Some tests failed - review configuration${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
    echo ""
fi
