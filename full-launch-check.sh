#!/bin/bash

# CodeCouncil AI - Complete Launch Verification Script
# Executa todos os testes pré-lançamento de uma vez

set -e

echo "🚀 CodeCouncil AI - Complete Launch Verification"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
total=0
passed=0
failed=0

log_test() {
    local status=$1
    local message=$2
    ((total++))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $message"
        ((passed++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗${NC} $message"
        ((failed++))
    else
        echo -e "${YELLOW}⚠${NC} $message"
    fi
}

# Phase 1: Environment Check
echo -e "${BLUE}PHASE 1: Environment Check${NC}"
echo "==============================="
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    node_version=$(node --version)
    log_test "PASS" "Node.js installed: $node_version"
else
    log_test "FAIL" "Node.js not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    npm_version=$(npm --version)
    log_test "PASS" "npm installed: $npm_version"
else
    log_test "FAIL" "npm not installed"
fi

# Check psql
if command -v psql &> /dev/null; then
    psql_version=$(psql --version)
    log_test "PASS" "PostgreSQL client installed"
else
    log_test "WARN" "PostgreSQL client not found (needed for DB operations)"
fi

# Check Docker
if command -v docker &> /dev/null; then
    log_test "PASS" "Docker installed"
else
    log_test "WARN" "Docker not found (needed for monitoring stack)"
fi

echo ""

# Phase 2: Project Structure Check
echo -e "${BLUE}PHASE 2: Project Structure Check${NC}"
echo "==================================="
echo ""

# Check backend
if [ -d "backend" ]; then
    log_test "PASS" "Backend directory exists"
else
    log_test "FAIL" "Backend directory not found"
    exit 1
fi

# Check frontend
if [ -d "codecouncil-ai" ]; then
    log_test "PASS" "Frontend directory exists"
else
    log_test "FAIL" "Frontend directory not found"
fi

# Check package.json
if [ -f "backend/package.json" ]; then
    log_test "PASS" "Backend package.json exists"
else
    log_test "FAIL" "Backend package.json not found"
fi

# Check Prisma schema
if [ -f "backend/prisma/schema.prisma" ]; then
    log_test "PASS" "Prisma schema exists"
else
    log_test "FAIL" "Prisma schema not found"
fi

# Check monitoring config
if [ -f "monitoring/prometheus.yml" ]; then
    log_test "PASS" "Prometheus config exists"
else
    log_test "FAIL" "Prometheus config not found"
fi

echo ""

# Phase 3: Dependencies Check
echo -e "${BLUE}PHASE 3: Dependencies Check${NC}"
echo "=============================="
echo ""

cd backend

# Check if node_modules exists
if [ -d "node_modules" ]; then
    log_test "PASS" "Backend dependencies installed"
    
    # Check critical dependencies
    if [ -d "node_modules/express" ]; then
        log_test "PASS" "Express installed"
    else
        log_test "FAIL" "Express not installed"
    fi
    
    if [ -d "node_modules/@prisma/client" ]; then
        log_test "PASS" "Prisma client installed"
    else
        log_test "FAIL" "Prisma client not installed"
    fi
    
    if [ -d "node_modules/stripe" ]; then
        log_test "PASS" "Stripe SDK installed"
    else
        log_test "FAIL" "Stripe SDK not installed"
    fi
else
    log_test "FAIL" "Backend dependencies not installed"
    echo ""
    echo "Run: npm install (in backend directory)"
fi

cd ..

echo ""

# Phase 4: Environment Variables Check
echo -e "${BLUE}PHASE 4: Environment Variables Check${NC}"
echo "======================================="
echo ""

env_file="backend/.env.local"

if [ -f "$env_file" ]; then
    log_test "PASS" "Environment file exists: $env_file"
    
    # Check critical variables
    if grep -q "DATABASE_URL" "$env_file"; then
        log_test "PASS" "DATABASE_URL configured"
    else
        log_test "FAIL" "DATABASE_URL not configured"
    fi
    
    if grep -q "GOOGLE_CLIENT_ID" "$env_file"; then
        log_test "PASS" "Google OAuth configured"
    else
        log_test "WARN" "Google OAuth not configured"
    fi
    
    if grep -q "STRIPE_SECRET_KEY" "$env_file"; then
        log_test "PASS" "Stripe Secret Key configured"
    else
        log_test "WARN" "Stripe Secret Key not configured"
    fi
    
    if grep -q "STRIPE_PRICE_STARTUP_MONTHLY" "$env_file"; then
        log_test "PASS" "Stripe Price IDs configured"
    else
        log_test "WARN" "Stripe Price IDs not configured"
    fi
else
    log_test "WARN" "Environment file not found: $env_file"
    echo "   Copy from backend/.env.example and fill in values"
fi

echo ""

# Phase 5: Code Quality Check
echo -e "${BLUE}PHASE 5: Code Quality Check${NC}"
echo "============================="
echo ""

# Check TypeScript compilation
echo -n "Checking TypeScript compilation... "
if cd backend && npm run typecheck &> /dev/null 2>&1; then
    log_test "PASS" "TypeScript compilation successful"
else
    log_test "FAIL" "TypeScript compilation failed"
fi
cd ..

# Check for common issues
if grep -r "console.log" backend/src/index.ts 2>/dev/null; then
    log_test "WARN" "Found console.log in production code"
else
    log_test "PASS" "No console.log in main index file"
fi

echo ""

# Phase 6: Critical Features Check
echo -e "${BLUE}PHASE 6: Critical Features Check${NC}"
echo "=================================="
echo ""

# Check subscription service
if [ -f "backend/src/services/subscriptionService.ts" ]; then
    log_test "PASS" "Subscription service exists"
else
    log_test "FAIL" "Subscription service missing"
fi

# Check admin service
if [ -f "backend/src/services/adminService.ts" ]; then
    log_test "PASS" "Admin service exists"
else
    log_test "FAIL" "Admin service missing"
fi

# Check rate limit service
if [ -f "backend/src/services/rateLimitService.ts" ]; then
    log_test "PASS" "Rate limit service exists"
else
    log_test "FAIL" "Rate limit service missing"
fi

# Check metrics service
if [ -f "backend/src/services/metricsService.ts" ]; then
    log_test "PASS" "Metrics service exists"
else
    log_test "FAIL" "Metrics service missing"
fi

# Check backup script
if [ -f "backend/scripts/backup-db.sh" ]; then
    log_test "PASS" "Backup script exists"
else
    log_test "FAIL" "Backup script missing"
fi

echo ""

# Phase 7: Documentation Check
echo -e "${BLUE}PHASE 7: Documentation Check${NC}"
echo "=============================="
echo ""

docs=(
    "README.md"
    "ENTERPRISE.md"
    "QUICKSTART.md"
    "LAUNCH_CHECKLIST.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        log_test "PASS" "Documentation: $doc"
    else
        log_test "FAIL" "Documentation missing: $doc"
    fi
done

echo ""
echo "════════════════════════════════════════"
echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
echo "════════════════════════════════════════"
echo ""
echo -e "Total Checks: $total"
echo -e "Passed: ${GREEN}$passed${NC}"
echo -e "Failed: ${RED}$failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "🎉 System is ready for launch!"
    echo ""
    echo "Next steps:"
    echo "  1. Review LAUNCH_CHECKLIST.md for detailed steps"
    echo "  2. Run: ./pre-launch.sh (to configure environment)"
    echo "  3. Start backend: cd backend && npm run dev"
    echo "  4. Start frontend: cd codecouncil-ai && npm run dev"
    echo "  5. Run: ./test-deployment.sh (to validate running services)"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed!${NC}"
    echo ""
    echo "⚠️  Please fix the issues above before launching."
    echo ""
    if [ ! -f "backend/.env.local" ]; then
        echo "Quick fix:"
        echo "  cp backend/.env.example backend/.env.local"
        echo "  # Edit backend/.env.local with your credentials"
    fi
    echo ""
    exit 1
fi
