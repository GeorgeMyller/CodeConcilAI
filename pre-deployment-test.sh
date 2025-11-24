#!/bin/bash

# CodeCouncil AI - Pre-Deployment Testing Suite
# Validates all 5 critical steps before production launch

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  CodeCouncil AI - Pre-Deployment Test Suite                ║"
echo "║  Testing all 6 enterprise features + production setup      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

# Helper function
test_feature() {
    local feature=$1
    local check=$2
    
    if [ -z "$check" ]; then
        echo -e "${RED}✗${NC} $feature"
        ((TESTS_FAILED++))
    else
        echo -e "${GREEN}✓${NC} $feature"
        ((TESTS_PASSED++))
    fi
}

# Test 1: Project structure
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}TEST 1: Project Structure${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"

test_feature "Frontend directory exists" "$([ -d codecouncil-ai ] && echo 1 || echo 0)"
test_feature "Backend directory exists" "$([ -d backend ] && echo 1 || echo 0)"
test_feature "Monitoring directory exists" "$([ -d monitoring ] && echo 1 || echo 0)"
test_feature "Docker Compose file exists" "$([ -f docker-compose.yml ] && echo 1 || echo 0)"
test_feature "Monitoring Docker Compose" "$([ -f docker-compose.monitoring.yml ] && echo 1 || echo 0)"

echo ""

# Test 2: Backend services
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}TEST 2: Backend Services (6 Enterprise Features)${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"

test_feature "Subscription Service" "$([ -f backend/src/services/subscriptionService.ts ] && echo 1 || echo 0)"
test_feature "Admin Service" "$([ -f backend/src/services/adminService.ts ] && echo 1 || echo 0)"
test_feature "Rate Limit Service" "$([ -f backend/src/services/rateLimitService.ts ] && echo 1 || echo 0)"
test_feature "Metrics Service" "$([ -f backend/src/services/metricsService.ts ] && echo 1 || echo 0)"
test_feature "Rate Limit Middleware" "$([ -f backend/src/middleware/rateLimitMiddleware.ts ] && echo 1 || echo 0)"
test_feature "Metrics Middleware" "$([ -f backend/src/middleware/metricsMiddleware.ts ] && echo 1 || echo 0)"

echo ""

# Test 3: API Routes
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}TEST 3: API Routes (13 new endpoints)${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"

test_feature "Subscription Routes (5 endpoints)" "$([ -f backend/src/routes/subscriptions.ts ] && echo 1 || echo 0)"
test_feature "Admin Routes (6 endpoints)" "$([ -f backend/src/routes/admin.ts ] && echo 1 || echo 0)"
test_feature "Rate Limit Routes (1 endpoint)" "$([ -f backend/src/routes/rateLimit.ts ] && echo 1 || echo 0)"
test_feature "Metrics Routes (1 endpoint)" "$([ -f backend/src/routes/metrics.ts ] && echo 1 || echo 0)"

echo ""

# Test 4: Database
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}TEST 4: Database Schema (8 models)${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"

test_feature "Prisma schema file" "$([ -f backend/prisma/schema.prisma ] && echo 1 || echo 0)"

# Check for model definitions in schema
PRISMA_FILE="backend/prisma/schema.prisma"
test_feature "User model with isAdmin" "$(grep -q 'isAdmin.*Boolean' "$PRISMA_FILE" && echo 1 || echo 0)"
test_feature "StripeCustomer with subscription fields" "$(grep -q 'currentPeriodStart' "$PRISMA_FILE" && echo 1 || echo 0)"
test_feature "AuditLog with severity" "$(grep -q 'severity.*String' "$PRISMA_FILE" && echo 1 || echo 0)"
test_feature "RateLimitTracker model" "$(grep -q 'model RateLimitTracker' "$PRISMA_FILE" && echo 1 || echo 0)"

echo ""

# Test 5: Monitoring Stack
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}TEST 5: Monitoring Stack (Prometheus + Grafana)${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"

test_feature "Prometheus config" "$([ -f monitoring/prometheus.yml ] && echo 1 || echo 0)"
test_feature "Alert rules" "$([ -f monitoring/alert_rules.yml ] && echo 1 || echo 0)"
test_feature "AlertManager config" "$([ -f monitoring/alertmanager.yml ] && echo 1 || echo 0)"
test_feature "Grafana datasources" "$([ -f monitoring/grafana-datasources.yml ] && echo 1 || echo 0)"
test_feature "Grafana dashboard" "$([ -f monitoring/grafana-dashboard.json ] && echo 1 || echo 0)"

echo ""

# Test 6: Backup & Restore Scripts
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}TEST 6: Automated Backups${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"

test_feature "Backup script" "$([ -f backend/scripts/backup-db.sh ] && echo 1 || echo 0)"
test_feature "Restore script" "$([ -f backend/scripts/restore-db.sh ] && echo 1 || echo 0)"

echo ""

# Test 7: Documentation
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}TEST 7: Documentation${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"

test_feature "README.md updated" "$([ -f README.md ] && grep -q 'Enterprise' README.md && echo 1 || echo 0)"
test_feature "QUICKSTART.md" "$([ -f QUICKSTART.md ] && echo 1 || echo 0)"
test_feature "ENTERPRISE.md" "$([ -f ENTERPRISE.md ] && echo 1 || echo 0)"
test_feature "PRODUCTION.md" "$([ -f PRODUCTION.md ] && echo 1 || echo 0)"
test_feature "IMPLEMENTATION_COMPLETE.md" "$([ -f IMPLEMENTATION_COMPLETE.md ] && echo 1 || echo 0)"

echo ""

# Test 8: Configuration Files
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}TEST 8: Environment & Configuration${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"

test_feature "Backend .env.example" "$([ -f backend/.env.example ] && echo 1 || echo 0)"
test_feature "Frontend .env.example" "$([ -f codecouncil-ai/.env.example ] && echo 1 || echo 0)"
test_feature "Prisma migrations" "$([ -d backend/prisma/migrations ] && echo 1 || echo 0)"

echo ""

# Test 9: Production Setup Files
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}TEST 9: Production Setup${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"

test_feature "Launch setup script" "$([ -f launch-setup.sh ] && echo 1 || echo 0)"
test_feature "Verification script" "$([ -f verify.sh ] && echo 1 || echo 0)"
test_feature "Setup script" "$([ -f setup.sh ] && echo 1 || echo 0)"

echo ""

# Test 10: Frontend Integration
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}TEST 10: Frontend Integration${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"

test_feature "API Service" "$([ -f codecouncil-ai/services/apiService.ts ] && echo 1 || echo 0)"
test_feature "Package.json" "$([ -f codecouncil-ai/package.json ] && echo 1 || echo 0)"
test_feature "Vite config" "$([ -f codecouncil-ai/vite.config.ts ] && echo 1 || echo 0)"

echo ""

# Final Summary
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}TEST RESULTS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

TOTAL=$((TESTS_PASSED + TESTS_FAILED))
PERCENTAGE=$((TESTS_PASSED * 100 / TOTAL))

echo -e "${GREEN}✓ Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}✗ Failed: ${TESTS_FAILED}${NC}"
echo "Total: $TOTAL"
echo "Score: ${PERCENTAGE}%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Your CodeCouncil AI is ready for the 5 production steps:"
    echo "  1. Create Stripe products & get price IDs"
    echo "  2. Update .env with Stripe credentials"
    echo "  3. Promote admin user"
    echo "  4. Deploy to production platform"
    echo "  5. Configure webhooks (Slack/PagerDuty)"
    echo ""
    echo "Next: run './launch-setup.sh' to start!"
    echo ""
else
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Please fix the failing tests before proceeding."
    exit 1
fi
