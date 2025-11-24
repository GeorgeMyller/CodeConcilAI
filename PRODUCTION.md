# Production Setup Guide

Complete guide to set up CodeCouncil AI with PostgreSQL, Stripe, Sentry, and SendGrid for production.

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local dev)
- PostgreSQL 15+ (or use Docker)

## Step 1: Get Credentials

### Google OAuth 2.0
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Identity Services API
4. Create OAuth 2.0 Web application credentials:
   - **Authorized JavaScript origins:** `https://your-domain.com`
   - **Authorized redirect URIs:** `https://api.your-domain.com/api/auth/google/callback`
5. Copy Client ID and Secret

**Local Dev:**
- Origins: `http://localhost:3000`
- Redirect URI: `http://localhost:5000/api/auth/google/callback`

### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get **Secret Key** from [API Keys](https://dashboard.stripe.com/apikeys)
3. Get **Webhook Signing Secret** from [Webhooks](https://dashboard.stripe.com/webhooks)
4. Create products & prices:
   - Startup Audit: $49/month
   - Enterprise Deep Dive: $149/month

### Sentry
1. Go to [sentry.io](https://sentry.io/)
2. Create a new project (Node.js)
3. Copy the **DSN**
4. Sentry will automatically track errors and send alerts

### SendGrid
1. Go to [SendGrid App](https://app.sendgrid.com/)
2. Create an API key in [Settings > API Keys](https://app.sendgrid.com/settings/api_keys)
3. Create a **Sender Identity** (verified email)

### Gemini API
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Copy your API key

## Step 2: Setup Database

### Option A: Docker (Recommended for Dev)

```bash
docker-compose up db
```

This creates a PostgreSQL container on `localhost:5432`.

### Option B: Hosted PostgreSQL

Services like **Heroku Postgres**, **AWS RDS**, **Railway**, or **Neon**:

```env
DATABASE_URL=postgresql://user:password@host:5432/codecouncil_ai
```

## Step 3: Configure Environment

```bash
cd backend
cp .env.example .env.local
```

Edit `backend/.env.local`:

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://codecouncil:codecouncil_dev_password@localhost:5432/codecouncil_ai

# JWT
JWT_SECRET=$(openssl rand -base64 32)

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Gemini
GEMINI_API_KEY=your-gemini-api-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret

# Sentry
SENTRY_DSN=https://your-key@sentry.io/project-id

# SendGrid
SENDGRID_API_KEY=SG.your-key
SENDGRID_FROM_EMAIL=noreply@codecouncil.ai

# Features
ENABLE_STRIPE=true
ENABLE_EMAIL=true
```

Do the same for frontend `.env.local`:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-client-id
```

## Step 4: Initialize Database

```bash
cd backend

# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed

# Type check
npm run typecheck
```

## Step 5: Run Locally

### With Docker Compose (Full Stack)

```bash
# From project root
docker-compose up
```

This runs:
- PostgreSQL: `localhost:5432`
- Backend: `localhost:5000`
- Frontend: `localhost:3000`

### Manual (Local Dev)

Terminal 1:
```bash
cd backend
npm run dev
```

Terminal 2:
```bash
cd codecouncil-ai
npm install
npm run dev
```

## Step 6: Test Integrations

### Stripe Webhook Testing
```bash
npm install -g stripe

stripe listen --forward-to localhost:5000/api/billing/stripe/webhook
```

Then in another terminal:
```bash
stripe trigger charge.succeeded
```

### SendGrid Email Testing
Email service is mocked by default in dev. To enable:

```env
ENABLE_EMAIL=true
```

Watch for emails in your SendGrid Dashboard.

### Sentry Error Testing
```bash
curl -X POST http://localhost:5000/api/test/error \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Step 7: Deploy to Production

See [DEPLOY.md](../DEPLOY.md) for complete guides on:
- Railway
- Render
- Vercel + AWS
- DigitalOcean
- Heroku

### Quick Railway Deploy

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add environment variables
railway variables set \
  DATABASE_URL="postgresql://..." \
  STRIPE_SECRET_KEY="sk_live_..." \
  SENTRY_DSN="https://..."

# Deploy
railway up
```

## Production Checklist

- [ ] All env vars set securely (use secrets manager)
- [ ] HTTPS enforced on all endpoints
- [ ] Database backups enabled & tested
- [ ] Stripe live mode enabled
- [ ] Sentry alerts configured
- [ ] SendGrid verified sender identity
- [ ] Rate limiting active
- [ ] CORS restricted to your domain
- [ ] Security headers (CSP, HSTS) enabled
- [ ] Logs aggregated & monitored
- [ ] Monitoring alerts set up
- [ ] Error tracking dashboard reviewed
- [ ] Email templates finalized
- [ ] Privacy policy & ToS published
- [ ] Support contact live

## Troubleshooting

### "Connection refused" on DB
- Ensure `docker-compose up db` is running
- Or provide correct `DATABASE_URL`

### "Invalid Stripe webhook signature"
- Verify `STRIPE_WEBHOOK_SECRET` is correct (not public key)
- Make sure webhook is pointed to correct endpoint

### "Sentry not capturing errors"
- Confirm `SENTRY_DSN` is set
- Check Sentry dashboard for rate limiting

### "Emails not sending"
- Set `ENABLE_EMAIL=true`
- Verify `SENDGRID_API_KEY` is correct
- Check sender email is verified in SendGrid

### "Migrations failed"
- Check `DATABASE_URL` is valid
- Run `npm run db:push` if using Prisma studio
- Check database has write permissions

## Next Steps

1. **Payment Webhooks** – Set up Stripe webhook integration in Dashboard
2. **Email Templates** – Customize SendGrid templates
3. **Analytics** – Add tracking/analytics service
4. **Backups** – Set up automated database backups
5. **CDN** – Add CloudFlare for static assets
6. **Monitoring** – Set up uptime/performance monitoring
7. **Logging** – Aggregate logs with ELK, Datadog, or CloudWatch
8. **Security** – Add WAF, DDoS protection, 2FA

Good luck! 🚀
