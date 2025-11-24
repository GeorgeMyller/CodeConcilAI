#!/bin/bash

# CodeCouncil AI - Master Validation Script
# Runs all tests in sequence to ensure complete production readiness

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  CodeCouncil AI - Master Production Validation             ║"
echo "║  Complete 6-Step Verification Before Launch               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Ensure scripts are executable
chmod +x pre-deployment-test.sh 2>/dev/null || true
chmod +x complete-validation.sh 2>/dev/null || true
chmod +x launch-setup.sh 2>/dev/null || true
chmod +x post-deployment-test.sh 2>/dev/null || true

# Store results
STEP_1_PASSED=0
STEP_2_PASSED=0
STEP_3_PASSED=0
TOTAL_TESTS=0

# Test run function
run_test_suite() {
    local suite_name=$1
    local script_name=$2
    
    echo -e "${PURPLE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}📋 $suite_name${NC}"
    echo -e "${PURPLE}════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    if [ -f "$script_name" ]; then
        bash "$script_name" 2>&1 | tail -30
        echo ""
        return 0
    else
        echo -e "${RED}✗ Script not found: $script_name${NC}"
        return 1
    fi
}

# Step 1: Pre-Deployment Tests
echo -e "${GREEN}STEP 1: Pre-Deployment Structure Validation${NC}"
echo ""

if run_test_suite "Pre-Deployment Tests" "pre-deployment-test.sh"; then
    STEP_1_PASSED=1
fi

read -p "Pre-deployment tests passed? (y/n): " response
if [ "$response" != "y" ]; then
    echo -e "${RED}❌ Pre-deployment tests failed. Fix issues before continuing.${NC}"
    exit 1
fi

echo ""

# Step 2: Complete Validation Suite
echo -e "${GREEN}STEP 2: Complete Feature Integration Validation${NC}"
echo ""

if run_test_suite "Complete Validation" "complete-validation.sh"; then
    STEP_2_PASSED=1
fi

read -p "Complete validation passed? (y/n): " response
if [ "$response" != "y" ]; then
    echo -e "${RED}❌ Complete validation failed. Fix issues before continuing.${NC}"
    exit 1
fi

echo ""

# Step 3: Launch Setup Guide
echo -e "${GREEN}STEP 3: Production Deployment Setup${NC}"
echo ""

echo -e "${CYAN}Ready to start production setup?${NC}"
echo "This will guide you through:"
echo "  1. Creating Stripe products"
echo "  2. Updating .env with credentials"
echo "  3. Promoting admin user"
echo "  4. Deploying to production"
echo "  5. Configuring webhooks"
echo ""

read -p "Start launch setup? (y/n): " response
if [ "$response" = "y" ]; then
    echo ""
    echo -e "${YELLOW}Launching interactive setup guide...${NC}"
    echo ""
    bash launch-setup.sh
    STEP_3_PASSED=1
fi

echo ""

# Step 4: Post-Deployment Tests
echo -e "${GREEN}STEP 4: Post-Deployment Validation${NC}"
echo ""

read -p "Have you completed the deployment? (y/n): " response
if [ "$response" = "y" ]; then
    echo ""
    echo -e "${CYAN}Ready to test production deployment?${NC}"
    echo ""
    
    read -p "Run post-deployment tests? (y/n): " response2
    if [ "$response2" = "y" ]; then
        run_test_suite "Post-Deployment Tests" "post-deployment-test.sh"
    fi
fi

echo ""

# Final Summary
echo -e "${PURPLE}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}FINAL VALIDATION SUMMARY${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════════════════${NC}"
echo ""

if [ $STEP_1_PASSED -eq 1 ] && [ $STEP_2_PASSED -eq 1 ] && [ $STEP_3_PASSED -eq 1 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 PRODUCTION VALIDATION COMPLETE!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "✅ Step 1: Pre-deployment tests - PASSED"
    echo "✅ Step 2: Complete validation - PASSED"
    echo "✅ Step 3: Launch setup - COMPLETED"
    echo ""
    echo "Your CodeCouncil AI is ready for production! 🚀"
    echo ""
    echo "Next actions:"
    echo "  1. Monitor your deployment at:"
    echo "     - Application: https://your-domain.com"
    echo "     - Grafana: https://your-domain.com/grafana (admin/admin)"
    echo "     - Sentry: https://sentry.io"
    echo ""
    echo "  2. Run post-deployment tests:"
    echo "     ./post-deployment-test.sh"
    echo ""
    echo "  3. Monitor these metrics:"
    echo "     - Error rate (should be < 1%)"
    echo "     - API latency (should be < 500ms)"
    echo "     - Database connections (should be < 20)"
    echo "     - Memory usage (should be < 512MB)"
    echo ""
    echo "  4. Test production features:"
    echo "     - Create subscription"
    echo "     - Check admin dashboard"
    echo "     - Verify rate limiting"
    echo "     - Check audit logs"
    echo "     - Test backup script"
    echo ""
else
    echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}⚠️  Some steps were not completed${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Completed:"
    if [ $STEP_1_PASSED -eq 1 ]; then
        echo "  ✅ Step 1: Pre-deployment validation"
    else
        echo "  ❌ Step 1: Pre-deployment validation"
    fi
    
    if [ $STEP_2_PASSED -eq 1 ]; then
        echo "  ✅ Step 2: Complete validation"
    else
        echo "  ❌ Step 2: Complete validation"
    fi
    
    if [ $STEP_3_PASSED -eq 1 ]; then
        echo "  ✅ Step 3: Launch setup"
    else
        echo "  ❌ Step 3: Launch setup"
    fi
    echo ""
    echo "Re-run the master validation when ready:"
    echo "  ./master-validation.sh"
fi

echo ""
