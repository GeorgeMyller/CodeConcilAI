#!/bin/bash

# CodeCouncil AI - Post-Deployment Testing Script
# Validates that all services are working correctly

set -e

echo "🧪 CodeCouncil AI - Post-Deployment Validation"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

passed=0
failed=0

# Helper function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_code=$3
    local description=$4

    echo -n "Testing $description... "

    response=$(curl -s -w "\n%{http_code}" -X $method "$BACKEND_URL$endpoint" \
        -H "Content-Type: application/json" 2>/dev/null || echo "0")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓${NC} ($http_code)"
        ((passed++))
    else
        echo -e "${RED}✗${NC} (got $http_code, expected $expected_code)"
        ((failed++))
    fi
}

# Test backend health
echo "🔍 BACKEND HEALTH CHECKS"
echo "========================"
echo ""

test_endpoint "GET" "/health" "200" "Backend health"
test_endpoint "GET" "/metrics" "200" "Prometheus metrics endpoint"

echo ""
echo "🔍 API ENDPOINTS"
echo "================"
echo ""

test_endpoint "GET" "/api/subscriptions/plans" "200" "Subscription plans"
test_endpoint "GET" "/api/rate-limit/usage" "401" "Rate limit (should be 401 without auth)"
test_endpoint "GET" "/api/admin/stats" "401" "Admin stats (should be 401 without auth)"

echo ""
echo "🔍 DATABASE"
echo "==========="
echo ""

if [ -f "backend/.env.local" ]; then
    echo -n "Checking DATABASE_URL... "
    if grep -q "DATABASE_URL" backend/.env.local; then
        echo -e "${GREEN}✓${NC}"
        ((passed++))
    else
        echo -e "${RED}✗${NC} (not configured)"
        ((failed++))
    fi
else
    echo -e "${YELLOW}⚠${NC} backend/.env.local not found"
fi

# Check database connection
echo -n "Testing database connection... "
if cd backend && npx prisma db execute --stdin < /dev/null 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
    ((passed++))
else
    echo -e "${RED}✗${NC} (connection failed)"
    ((failed++))
fi
cd ..

echo ""
echo "🔍 STRIPE CONFIGURATION"
echo "======================="
echo ""

if grep -q "STRIPE_SECRET_KEY" backend/.env.local 2>/dev/null; then
    echo -n "Stripe Secret Key... "
    echo -e "${GREEN}✓${NC}"
    ((passed++))
else
    echo -n "Stripe Secret Key... "
    echo -e "${RED}✗${NC} (not configured)"
    ((failed++))
fi

if grep -q "STRIPE_PRICE_STARTUP_MONTHLY" backend/.env.local 2>/dev/null; then
    echo -n "Stripe Price IDs... "
    echo -e "${GREEN}✓${NC}"
    ((passed++))
else
    echo -n "Stripe Price IDs... "
    echo -e "${RED}✗${NC} (not configured)"
    ((failed++))
fi

echo ""
echo "🔍 MONITORING SETUP"
echo "==================="
echo ""

if [ -f "docker-compose.monitoring.yml" ]; then
    echo -n "Monitoring stack file... "
    echo -e "${GREEN}✓${NC}"
    ((passed++))
else
    echo -n "Monitoring stack file... "
    echo -e "${RED}✗${NC} (not found)"
    ((failed++))
fi

if [ -f "monitoring/prometheus.yml" ]; then
    echo -n "Prometheus config... "
    echo -e "${GREEN}✓${NC}"
    ((passed++))
else
    echo -n "Prometheus config... "
    echo -e "${RED}✗${NC} (not found)"
    ((failed++))
fi

echo ""
echo "════════════════════════════════════════"
echo "📊 TEST RESULTS"
echo "════════════════════════════════════════"
echo ""
echo -e "Passed: ${GREEN}$passed${NC}"
echo -e "Failed: ${RED}$failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! System is ready.${NC}"
    echo ""
    echo "🎉 Deployment Verification Complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Test Stripe webhook"
    echo "  2. Create test subscription"
    echo "  3. Monitor metrics in Grafana"
    echo "  4. Launch to users!"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the errors above.${NC}"
    echo ""
    echo "Common issues:"
    echo "  - Backend not running: npm run dev (in backend directory)"
    echo "  - Database not configured: Check backend/.env.local"
    echo "  - Missing dependencies: npm install"
    echo ""
    exit 1
fi
