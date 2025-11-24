# CodeCouncil AI – Enterprise SaaS Platform 🚀

Your on-demand AI engineering workforce. Architecture reviews, security audits, and product analysis—delivered instantly.

**Status**: ✅ **PRODUCTION READY** with 6 Enterprise Features (51/51 tests passing)

## 🎯 What's Implemented

### ✅ Core Features
- **OAuth 2.0 Authentication** – Google login with JWT tokens (7-day expiration)
- **Stripe Subscriptions** – 4 tiers (Startup/Enterprise × Monthly/Annual)
- **Credit-Based Billing** – Tiered plans with automatic allocation (300-1200 credits/month)
- **BYOK Support** – Users bring their own Gemini key for unlimited access
- **Admin Dashboard** – User management, analytics, suspension, reactivation
- **Per-User Rate Limiting** – Database-backed by subscription tier
- **Audit Logging** – Compliance-ready with severity levels
- **PostgreSQL Backups** – Automated daily with 30-day retention
- **Monitoring Stack** – Prometheus + Grafana + AlertManager (11 metrics, 6 alerts)
- **Email Service** – SendGrid integration for transactional emails
- **Error Tracking** – Sentry for real-time error monitoring

## 📚 Documentation

Start here for your use case:

| Document | Purpose | Time |
|----------|---------|------|
| **[GETTING_STARTED.md](./GETTING_STARTED.md)** | 10-step launch guide | 5 min |
| **[LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)** | Pre-launch verification | 5 min |
| **[QUICKSTART.md](./QUICKSTART.md)** | Quick reference (5 commands) | 2 min |
| **[ENTERPRISE.md](./ENTERPRISE.md)** | Complete feature guide | 30 min |
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | Technical architecture | 20 min |
| **[LAUNCH_STATUS_REPORT.md](./LAUNCH_STATUS_REPORT.md)** | Full implementation status | 10 min |

## 🚀 Quick Start (5 minutes)

### Option 1: Automated Setup
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup
```bash
# 1. Copy environment template
cp backend/.env.example backend/.env.local

# 2. Fill in your credentials (see GETTING_STARTED.md)
# STRIPE_SECRET_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DATABASE_URL

# 3. Install dependencies
cd backend && npm install && cd ..
cd codecouncil-ai && npm install && cd ..

# 4. Setup database
cd backend && npm run db:migrate && npm run db:seed && cd ..

# 5. Start services
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd codecouncil-ai && npm run dev
```

## 🏗️ Project Structure

```
CodeConcilAI/
├── codecouncil-ai/           # Frontend (React 19 + Vite 6)
│   ├── components/           # UI components
│   └── services/             # API, Gemini, GitHub services
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── routes/           # 13 API endpoints
│   │   ├── services/         # 8 business logic services
│   │   ├── middleware/       # Auth, rate limit, metrics
│   │   └── prisma/          # Database schema & migrations
│   └── scripts/             # Backup, restore, setup
├── monitoring/              # Prometheus + Grafana configs
├── docker-compose.yml       # Full stack (local)
└── docker-compose.monitoring.yml  # Monitoring stack
```

## 💳 Billing Plans

| Plan | Price | Credits/mo | Requests/day | Analyses/day | Support |
|------|-------|-----------|--------------|--------------|---------|
| **Startup Monthly** | $49/mo | 300 | 1,000 | 20 | Basic |
| **Startup Annual** | $499/yr | 350 | 1,000 | 20 | Basic |
| **Enterprise Monthly** | $149/mo | 1,000 | 10,000 | 500 | Priority |
| **Enterprise Annual** | $1,499/yr | 1,200 | 10,000 | 500 | Priority |
| **Trial** | Free | 400 | – | – | Community |

## 🔌 API Endpoints (13 New)

### Subscriptions (5)
```
GET    /api/subscriptions/plans               List all plans
GET    /api/subscriptions/current             Get user's subscription
POST   /api/subscriptions/create              Create subscription
POST   /api/subscriptions/cancel              Cancel subscription
POST   /api/subscriptions/change-plan        Upgrade/downgrade
```

### Admin Dashboard (6)
```
GET    /api/admin/stats                       Dashboard metrics
GET    /api/admin/audit-logs                  Query audit logs
GET    /api/admin/users/:userId              User details
POST   /api/admin/users/:userId/suspend      Suspend user
POST   /api/admin/users/:userId/reactivate   Reactivate user
GET    /api/admin/analytics                   Usage analytics
```

### Monitoring (2)
```
GET    /metrics                               Prometheus metrics
GET    /api/rate-limit/usage                 User rate limits
```

## 🔐 Security Features

✅ **Authentication & Authorization**
- OAuth 2.0 with PKCE
- JWT tokens (7-day expiration)
- Role-based access (admin flag)
- Refresh token rotation

✅ **API & Data Protection**
- Per-user rate limiting (database-backed)
- Request validation & sanitization
- CORS restricted to allowed domains
- CSP headers in frontend
- Stripe webhook signature verification
- PostgreSQL with encrypted connections
- API keys stored only in backend

✅ **Compliance & Monitoring**
- Audit logging with severity levels
- Real-time error tracking (Sentry)
- Security event alerts
- GDPR-ready (user data export)
- PII protection in logs
- Automated daily backups

## 📊 Monitoring (11 Metrics)

```
HTTP:                    Request duration, total requests, error rate
Business:                Subscriptions created/canceled, payment success
System:                  DB pool, memory, rate limit events
Alerts:                  6 rules (errors, latency, pool, memory, disk, payments)
```

View dashboards: `http://localhost:3001/grafana` (admin/admin)

## ✅ Verify Installation

```bash
chmod +x verify.sh
./verify.sh
```

Should show **51/51 tests PASSING** ✓

## 🚀 Deployment Options

### Railway (Recommended)
```bash
railway login && railway init
railway variables set STRIPE_SECRET_KEY=...
railway up
```

### Render
Connect GitHub → Create Web Service → Auto-deploy

### Heroku
```bash
heroku create codecouncil-ai
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

### Docker Local
```bash
docker-compose up -d
```

See **[GETTING_STARTED.md](./GETTING_STARTED.md)** for platform-specific instructions.

## 📋 Pre-Launch Checklist

**Before going live** (1 hour):

- [ ] Create 4 Stripe products with price IDs
- [ ] Setup Google OAuth credentials
- [ ] Configure PostgreSQL database
- [ ] Fill `backend/.env.local` with all credentials
- [ ] Run `./pre-launch.sh` (interactive setup)
- [ ] Run `./verify.sh` (confirm 51/51 tests pass)
- [ ] Test locally with `npm run dev` (backend + frontend)
- [ ] Deploy to chosen platform
- [ ] Configure Stripe webhook: `https://your-app.com/api/webhooks/stripe`
- [ ] Promote admin user to access dashboard
- [ ] Setup Slack/PagerDuty alerts (optional)

**Full checklist**: [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't start | Check Node.js >= 18, `npm install`, database connection |
| OAuth fails | Verify GOOGLE_CLIENT_ID matches frontend & backend |
| Stripe not working | Confirm credentials and webhook registered |
| Database error | Run `npm run db:migrate`, check DATABASE_URL |
| Rate limit issues | Check user tier with `GET /api/rate-limit/usage` |

**Full troubleshooting**: See [ENTERPRISE.md](./ENTERPRISE.md)

## 📞 Need Help?

- 📖 **Docs**: [ENTERPRISE.md](./ENTERPRISE.md) – Complete guide
- 🚀 **Launch**: [GETTING_STARTED.md](./GETTING_STARTED.md) – 10-step guide
- ✅ **Verify**: Run `./verify.sh` to test all features
- 📊 **Status**: [LAUNCH_STATUS_REPORT.md](./LAUNCH_STATUS_REPORT.md)

## 🎯 Key Metrics

Production readiness verified:

```
✓ 51/51 verification tests PASSING
✓ TypeScript compiles cleanly
✓ All migrations ready to deploy
✓ 13 API endpoints working
✓ 8 database models with 7 indexes
✓ 11 Prometheus metrics collecting
✓ 6 alert rules configured
✓ Daily backup automation ready
```

## 📦 Tech Stack

**Frontend**: React 19.2 + Vite 6.2 + TypeScript 5.8  
**Backend**: Node.js + Express 4.18 + TypeScript 5.8  
**Database**: PostgreSQL 15 + Prisma ORM 5.7  
**Billing**: Stripe 14.8 (subscriptions, webhooks)  
**Monitoring**: Prometheus + Grafana + AlertManager  
**Email**: SendGrid  
**Error Tracking**: Sentry  
**Authentication**: Google OAuth 2.0 + JWT  
**Containerization**: Docker + Docker Compose  

## 🎉 Ready?

1. **First time?** → Read [GETTING_STARTED.md](./GETTING_STARTED.md)
2. **Ready to launch?** → Follow [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)
3. **Need details?** → Check [ENTERPRISE.md](./ENTERPRISE.md)
4. **Verify setup?** → Run `./verify.sh`

---

**Status**: ✅ Production-Ready  
**Version**: 1.0.0  
**Last Updated**: 2025  

🚀 Good luck with your launch!
