# CodeCouncil AI - Enterprise Features Setup Guide

This guide covers the setup and configuration of 6 enterprise-grade features for production deployment.

## Table of Contents
1. [Stripe Subscriptions](#stripe-subscriptions)
2. [Admin Dashboard](#admin-dashboard)
3. [Per-User Rate Limiting](#per-user-rate-limiting)
4. [Audit Logging Dashboard](#audit-logging-dashboard)
5. [Automated Database Backups](#automated-database-backups)
6. [Monitoring with Grafana & Prometheus](#monitoring)

---

## 1. Stripe Subscriptions

### Monthly & Annual Plans

Two tier levels with monthly and annual billing options:

#### Startup Plan
- **Monthly**: $49/month → 300 credits/month
- **Annual**: $499/year → 350 credits/month (17% discount)

#### Enterprise Plan
- **Monthly**: $149/month → 1000 credits/month
- **Annual**: $1499/year → 1200 credits/month (20% discount)

### Setup Steps

1. **Create Stripe Products & Prices**
```bash
# Login to Stripe Dashboard → https://dashboard.stripe.com

# Create Products:
# 1. "Startup Audit" (monthly)
#    Price: $49/month (recurring)
#    Price ID: price_startup_monthly
#
# 2. "Startup Audit Annual" (annual)
#    Price: $499/year (recurring)
#    Price ID: price_startup_annual
#
# 3. "Enterprise Deep Dive" (monthly)
#    Price: $149/month (recurring)
#    Price ID: price_enterprise_monthly
#
# 4. "Enterprise Deep Dive Annual" (annual)
#    Price: $1499/year (recurring)
#    Price ID: price_enterprise_annual
```

2. **Update .env with Price IDs**
```bash
STRIPE_PRICE_STARTUP_MONTHLY=price_startup_monthly
STRIPE_PRICE_STARTUP_ANNUAL=price_startup_annual
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_enterprise_monthly
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_enterprise_annual
```

3. **API Endpoints**

Get all subscription plans:
```bash
GET /api/subscriptions/plans
# Response:
# [
#   { id: "startup_monthly", name: "Startup Audit - Monthly", priceId: "...", creditsPerMonth: 300 },
#   { id: "startup_annual", name: "Startup Audit - Annual", priceId: "...", creditsPerMonth: 350 },
#   { id: "enterprise_monthly", name: "Enterprise Deep Dive - Monthly", priceId: "...", creditsPerMonth: 1000 },
#   { id: "enterprise_annual", name: "Enterprise Deep Dive - Annual", priceId: "...", creditsPerMonth: 1200 }
# ]
```

Get user's current subscription:
```bash
GET /api/subscriptions/current
Authorization: Bearer <JWT_TOKEN>
# Response:
# {
#   "plan": "startup_monthly",
#   "status": "active",
#   "currentPeriodStart": "2025-01-15T00:00:00Z",
#   "currentPeriodEnd": "2025-02-15T00:00:00Z",
#   "cancelAtPeriodEnd": false,
#   "plan_details": {...}
# }
```

Create subscription:
```bash
POST /api/subscriptions/create
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{ "planId": "startup_monthly" }
```

Cancel subscription:
```bash
POST /api/subscriptions/cancel
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{ "atPeriodEnd": true }  # true = cancel at renewal, false = cancel immediately
```

Change plan (upgrade/downgrade):
```bash
POST /api/subscriptions/change-plan
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{ "newPlanId": "enterprise_monthly" }
```

### Webhook Events

The backend automatically handles these Stripe events:
- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Plan changed, payment method updated
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Payment processed
- `invoice.payment_failed` - Payment declined

All events update the database and trigger email notifications.

---

## 2. Admin Dashboard

### Features
- View all users with signup date and subscription status
- Real-time analytics (total users, active subscriptions, revenue)
- User suspension/reactivation
- Audit log filtering and search

### Setup

1. **Promote User to Admin**
```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'you@example.com';
```

2. **API Endpoints**

Get dashboard statistics:
```bash
GET /api/admin/stats
Authorization: Bearer <JWT_TOKEN>
# Requires: isAdmin = true
# Response:
# {
#   "metrics": {
#     "totalUsers": 150,
#     "activeSubscriptions": 42,
#     "totalTransactions": 523,
#     "totalCreditsDebitedOrSpent": 45230
#   },
#   "recentUsers": [...],
#   "recentAudits": [...]
# }
```

Get audit logs with filters:
```bash
GET /api/admin/audit-logs?userId=xxx&action=payment&severity=critical&limit=50&offset=0
Authorization: Bearer <JWT_TOKEN>
# Requires: isAdmin = true
```

Get user details:
```bash
GET /api/admin/users/:userId
Authorization: Bearer <JWT_TOKEN>
# Requires: isAdmin = true
# Response includes: user profile, transactions, audit logs
```

Suspend user:
```bash
POST /api/admin/users/:userId/suspend
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{ "reason": "Payment fraud" }
```

Reactivate user:
```bash
POST /api/admin/users/:userId/reactivate
Authorization: Bearer <JWT_TOKEN>
```

Get usage analytics:
```bash
GET /api/admin/analytics
Authorization: Bearer <JWT_TOKEN>
# Requires: isAdmin = true
# Response: top users, audits by tier, transaction stats
```

---

## 3. Per-User Rate Limiting

### Limits by Tier

| Tier | Requests/Day | Requests/Month | Analysis Runs/Day | Analysis Runs/Month |
|------|-------------|----------------|------------------|-------------------|
| Startup | 1,000 | 20,000 | 20 | 200 |
| Enterprise | 10,000 | 200,000 | 500 | 5,000 |
| Unlimited | ∞ | ∞ | ∞ | ∞ |

### Implementation

Rate limiting is **database-backed** (not in-memory) to support distributed deployments.

The `RateLimitTracker` table stores per-user counters that reset daily and monthly.

**Endpoints affected:**
- `POST /api/gemini/analyze` - Tracks analysis runs
- All endpoints in `/api/*` - Tracks HTTP requests

**Response Headers:**
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 18
X-RateLimit-Reset: 2025-01-16T00:00:00Z
```

**When limit exceeded (HTTP 429):**
```json
{
  "error": "Daily analysis limit exceeded: 20/day. Upgrade your plan for more.",
  "retryAfter": 86400
}
```

### Check User Limits

```bash
GET /api/rate-limit/usage
Authorization: Bearer <JWT_TOKEN>
# Response:
# {
#   "tier": "startup",
#   "requests": 1000,
#   "requestsRemaining": 987,
#   "analysisRuns": 20,
#   "analysisRunsRemaining": 19
# }
```

---

## 4. Audit Logging Dashboard

### Audit Events

All significant actions are logged to the `AuditLog` table with:
- **Severity**: info | warning | error | critical
- **Resource Type**: user | subscription | payment | analysis
- **Resource ID**: Link to affected resource

### Example Events

```
action: "user_signup"
severity: "info"
resourceType: "user"
resourceId: "user_123"
```

```
action: "subscription_created"
severity: "info"
resourceType: "subscription"
resourceId: "sub_456"
```

```
action: "payment_failed"
severity: "error"
resourceType: "payment"
resourceId: "ch_789"
```

```
action: "rate_limit_exceeded"
severity: "warning"
resourceType: "analysis"
resourceId: "null"
```

### Query Audit Logs

```bash
GET /api/admin/audit-logs?severity=critical&action=payment_failed
Authorization: Bearer <JWT_TOKEN>

# Query Options:
# ?userId=xxx           - Filter by user
# ?action=payment       - Filter by action
# ?severity=critical    - Filter by severity (info/warning/error/critical)
# ?limit=50             - Items per page
# ?offset=0             - Pagination offset
```

### Alert on Critical Events

The monitoring system automatically alerts when:
- Severity = "critical" (e.g., payment failures, security issues)
- Rate limit exceeded for multiple users
- Database connection pool exhausted

Alerts sent to Slack (configurable in alertmanager.yml).

---

## 5. Automated Database Backups

### Backup Scripts

Two helper scripts are provided:

**Create backup:**
```bash
chmod +x backend/scripts/backup-db.sh
./backend/scripts/backup-db.sh [environment]
# Example: ./backend/scripts/backup-db.sh production
# Creates: /var/backups/codecouncil-ai/codecouncil-ai_production_20250115_020000.sql.gz
```

**Restore backup:**
```bash
chmod +x backend/scripts/restore-db.sh
./backend/scripts/restore-db.sh [backup-file] [environment]
# Example: ./backend/scripts/restore-db.sh codecouncil-ai_production_20250115_020000.sql.gz production
```

### Automated Daily Backups (Cron)

Add to `/etc/crontab` for **2 AM daily backup**:
```bash
0 2 * * * /path/to/backend/scripts/backup-db.sh production
```

Or use Docker:
```yaml
backup-service:
  image: mcr.microsoft.com/mssql/server:latest
  environment:
    - BACKUP_SCHEDULE=0 2 * * *  # 2 AM daily
  volumes:
    - ./backend/scripts/backup-db.sh:/backup-db.sh
  command: /backup-db.sh production
```

### Backup Retention

By default, backups older than 30 days are automatically deleted.
Modify `RETENTION_DAYS` in `backup-db.sh` to change.

### S3 Backup Upload (Optional)

Enable S3 upload for long-term storage:
```bash
export AWS_S3_BACKUP_BUCKET=my-backup-bucket
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
./backend/scripts/backup-db.sh production
```

Backups are stored with GLACIER storage class (cost-effective).

### Backup Verification

Periodically restore backups to verify integrity:
```bash
# In staging environment
./backend/scripts/restore-db.sh codecouncil-ai_production_20250115_020000.sql.gz staging
npm run db:push  # Verify migrations
```

---

## 6. Monitoring with Grafana & Prometheus

### Components

- **Prometheus**: Metrics database (scrapes every 15 seconds)
- **Grafana**: Visualization dashboards
- **AlertManager**: Alert routing & notifications
- **Node Exporter**: Server metrics (CPU, memory, disk)
- **Postgres Exporter**: Database metrics

### Startup

Start the full monitoring stack:
```bash
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

Services:
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **AlertManager**: http://localhost:9093

### Custom Metrics Collected

| Metric | Labels | Description |
|--------|--------|-------------|
| `http_request_duration_seconds` | method, route, status | API response time |
| `http_requests_total` | method, route, status | API request count |
| `subscription_created_total` | plan | Subscription creation events |
| `stripe_payment_succeeded_total` | amount_tier | Successful payments |
| `stripe_payment_failed_total` | error_code | Failed payments |
| `analysis_run_total` | tier | Analysis runs by tier |
| `rate_limit_exceeded_total` | tier, limit_type | Rate limit violations |
| `db_connection_pool_used` | | Active DB connections |

### Grafana Dashboards

Pre-configured dashboards include:
1. **Request Rate** - API requests/second by endpoint
2. **Error Rate** - 5xx errors per minute (with alert trigger)
3. **API Latency** - P95 response time by endpoint
4. **Database** - Connection pool, query times
5. **Subscriptions** - New/canceled subscriptions
6. **Payments** - Success rate, failed payments
7. **Resource Usage** - CPU, memory, disk

### Alerts

Alert rules defined in `monitoring/alert_rules.yml`:

| Alert | Condition | Action |
|-------|-----------|--------|
| High Error Rate | >5% of requests return 5xx | Slack #critical-alerts, PagerDuty |
| High Latency | P95 >1 second | Slack #warnings |
| Database Pool Exhausted | 0 available connections | Slack #critical-alerts, PagerDuty |
| High Memory Usage | >512MB | Slack #warnings |
| Low Disk Space | <10% remaining | Slack #critical-alerts |
| Payment Failures | >10% failure rate | Slack #critical-alerts |

### Slack Integration

Add to `.env`:
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
PAGERDUTY_SERVICE_KEY=xxx  # For critical alerts
```

### Query Examples

```promql
# API request rate (last 5 minutes)
rate(http_requests_total[5m])

# Error rate percentage
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100

# P95 API latency by endpoint
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Database connections in use
db_connection_pool_used / (db_connection_pool_used + db_connection_pool_available)

# Monthly recurring revenue (from Stripe)
rate(stripe_payment_succeeded_total[30d]) * subscription_mrr_amount

# Subscription churn rate
(rate(subscription_canceled_total[30d]) / subscription_count) * 100
```

---

## Production Deployment Checklist

- [ ] Stripe products & price IDs configured
- [ ] Admin user promoted (`UPDATE User SET isAdmin = true`)
- [ ] Backup script tested and scheduled (cron)
- [ ] Monitoring stack deployed (Prometheus, Grafana)
- [ ] Slack/PagerDuty integration configured
- [ ] SSL/TLS certificates enabled
- [ ] Rate limiting tested by tier
- [ ] Audit logging verified in database
- [ ] Database connection pool tuned for load
- [ ] Error tracking alerts tested
- [ ] Subscription webhooks tested
- [ ] Admin dashboard tested in production

---

## Troubleshooting

### Stripe Webhooks Not Processing

```bash
# Verify webhook endpoint is registered
# Stripe Dashboard → Webhooks → http://yourdomain.com/api/billing/stripe/webhook

# Test webhook manually
curl -X POST http://localhost:5000/api/billing/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=xxx,v1=yyy" \
  -d '{"type": "charge.succeeded", ...}'
```

### Rate Limiting Not Working

```bash
# Check tracker table
SELECT * FROM "RateLimitTracker" WHERE "userId" = 'user_id';

# Reset counters manually
UPDATE "RateLimitTracker" SET "requestsToday" = 0 WHERE "userId" = 'user_id';
```

### Prometheus Not Scraping

```bash
# Check targets
curl http://localhost:9090/api/v1/targets

# Check metrics endpoint
curl http://localhost:5000/metrics
```

### Backup Restore Failed

```bash
# Check backup integrity
gunzip -t /var/backups/codecouncil-ai/backup.sql.gz

# Restore with verbose output
./backend/scripts/restore-db.sh backup.sql.gz staging
```

---

## Support

For issues or questions, refer to:
- Stripe API Docs: https://stripe.com/docs/api
- Prisma Docs: https://www.prisma.io/docs
- Prometheus Docs: https://prometheus.io/docs
- Grafana Docs: https://grafana.com/docs

