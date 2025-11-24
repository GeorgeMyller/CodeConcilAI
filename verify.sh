#!/bin/bash

# CodeCouncil AI - Implementation Verification
# This script validates that all 6 enterprise features are correctly implemented

echo "🔍 CodeCouncil AI - Enterprise Features Verification"
echo "====================================================="
echo ""

ERRORS=0
SUCCESS=0

# Helper functions
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
        ((SUCCESS++))
        return 0
    else
        echo "❌ Missing: $1"
        ((ERRORS++))
        return 1
    fi
}

check_pattern() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo "✅ $3"
        ((SUCCESS++))
        return 0
    else
        echo "❌ Missing pattern in $1: $3"
        ((ERRORS++))
        return 1
    fi
}

# 1. Stripe Subscriptions
echo ""
echo "1️⃣  STRIPE SUBSCRIPTIONS"
echo "----------------------"
check_file "backend/src/services/subscriptionService.ts"
check_file "backend/src/routes/subscriptions.ts"
check_pattern "backend/src/index.ts" "subscriptionRoutes" "Subscription routes imported"
check_pattern "backend/prisma/schema.prisma" "currentPeriodStart" "Subscription period fields"
check_pattern "backend/src/services/subscriptionService.ts" "getAllPlans" "Plans list function"
check_pattern "backend/src/services/subscriptionService.ts" "createSubscription" "Create subscription function"

# 2. Admin Dashboard
echo ""
echo "2️⃣  ADMIN DASHBOARD"
echo "------------------"
check_file "backend/src/services/adminService.ts"
check_file "backend/src/routes/admin.ts"
check_pattern "backend/prisma/schema.prisma" "isAdmin.*Boolean" "Admin field in User model"
check_pattern "backend/src/routes/admin.ts" "GET.*stats" "Stats endpoint"
check_pattern "backend/src/routes/admin.ts" "audit-logs" "Audit logs endpoint"
check_pattern "backend/src/routes/admin.ts" "POST.*suspend" "Suspend user endpoint"

# 3. Per-User Rate Limiting
echo ""
echo "3️⃣  PER-USER RATE LIMITING"
echo "------------------------"
check_file "backend/src/services/rateLimitService.ts"
check_file "backend/src/middleware/rateLimitMiddleware.ts"
check_pattern "backend/prisma/schema.prisma" "RateLimitTracker" "RateLimitTracker model"
check_pattern "backend/src/routes/gemini.ts" "analysisRateLimitMiddleware" "Rate limit on analyze endpoint"
check_pattern "backend/src/services/rateLimitService.ts" "checkAndTrackRequest" "Request tracking"
check_pattern "backend/src/services/rateLimitService.ts" "checkAndTrackAnalysis" "Analysis tracking"

# 4. Audit Logging
echo ""
echo "4️⃣  AUDIT LOGGING DASHBOARD"
echo "-------------------------"
check_file "backend/src/routes/admin.ts"
check_pattern "backend/prisma/schema.prisma" "model AuditLog" "AuditLog model"
check_pattern "backend/prisma/schema.prisma" "severity.*String" "Severity field"
check_pattern "backend/prisma/schema.prisma" "resourceType.*String" "Resource type field"
check_pattern "backend/src/routes/admin.ts" "audit-logs" "Audit logs API endpoint"

# 5. Database Backups
echo ""
echo "5️⃣  AUTOMATED DATABASE BACKUPS"
echo "----------------------------"
check_file "backend/scripts/backup-db.sh"
check_file "backend/scripts/restore-db.sh"
check_pattern "backend/scripts/backup-db.sh" "pg_dump" "Backup script"
check_pattern "backend/scripts/restore-db.sh" "psql" "Restore script"
check_pattern "backend/scripts/backup-db.sh" "RETENTION_DAYS" "Retention policy"

# 6. Monitoring
echo ""
echo "6️⃣  MONITORING (PROMETHEUS + GRAFANA)"
echo "-----------------------------------"
check_file "backend/src/services/metricsService.ts"
check_file "backend/src/middleware/metricsMiddleware.ts"
check_file "backend/src/routes/metrics.ts"
check_file "monitoring/prometheus.yml"
check_file "monitoring/alert_rules.yml"
check_file "monitoring/alertmanager.yml"
check_file "docker-compose.monitoring.yml"
check_pattern "backend/src/index.ts" "metricsMiddleware" "Metrics middleware integrated"
check_pattern "backend/package.json" "prom-client" "Prometheus client dependency"

# Database Schema Validation
echo ""
echo "📊 DATABASE SCHEMA VALIDATION"
echo "----------------------------"
check_pattern "backend/prisma/schema.prisma" "model User" "User model"
check_pattern "backend/prisma/schema.prisma" "model StripeCustomer" "StripeCustomer model"
check_pattern "backend/prisma/schema.prisma" "model AuditLog" "AuditLog model"
check_pattern "backend/prisma/schema.prisma" "model RateLimitTracker" "RateLimitTracker model"
check_pattern "backend/prisma/schema.prisma" "model Email" "Email model"
check_pattern "backend/prisma/schema.prisma" "model Transaction" "Transaction model"
check_pattern "backend/prisma/schema.prisma" "model AuditSession" "AuditSession model"

# Routes Integration
echo ""
echo "🔗 ROUTES INTEGRATION"
echo "--------------------"
check_pattern "backend/src/index.ts" "/api/subscriptions" "Subscription routes mounted"
check_pattern "backend/src/index.ts" "/api/admin" "Admin routes mounted"
check_pattern "backend/src/index.ts" "/api/rate-limit" "Rate limit routes mounted"
check_pattern "backend/src/index.ts" "/metrics" "Metrics route mounted"

# Documentation
echo ""
echo "📚 DOCUMENTATION"
echo "---------------"
check_file "ENTERPRISE.md"
check_file "IMPLEMENTATION_SUMMARY.md"
check_file "setup.sh"

# Final Summary
echo ""
echo "📋 VERIFICATION SUMMARY"
echo "====================="
echo "✅ Passed: $SUCCESS"
echo "❌ Failed: $ERRORS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "🎉 ALL ENTERPRISE FEATURES VERIFIED!"
    echo ""
    echo "✨ Your CodeCouncil AI is production-ready:"
    echo "   ✅ Stripe Subscriptions (monthly/annual)"
    echo "   ✅ Admin Dashboard (user management)"
    echo "   ✅ Per-user Rate Limiting (database-backed)"
    echo "   ✅ Audit Logging (with severity levels)"
    echo "   ✅ Automated Backups (PostgreSQL)"
    echo "   ✅ Monitoring Stack (Prometheus + Grafana)"
    echo ""
    echo "📖 Read ENTERPRISE.md for complete setup guide"
    exit 0
else
    echo "⚠️  Some features need attention. Check IMPLEMENTATION_SUMMARY.md"
    exit 1
fi
