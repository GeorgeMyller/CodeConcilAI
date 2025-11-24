# CodeCouncil AI – Backend Setup & Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- Stripe account (for testing)
- Google OAuth credentials
- Gemini API key

### Quick Start

1. **Copy and configure environment:**
```bash
cd backend
cp .env.example .env.local
# Edit .env.local with your credentials
```

2. **Install dependencies and build:**
```bash
npm install
npm run build
```

3. **Run backend in development:**
```bash
npm run dev
```

The backend will start on `http://localhost:5000`.

4. **Run frontend (in another terminal):**
```bash
cd codecouncil-ai
npm install
npm run dev
```

Frontend will run on `http://localhost:3000`.

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Identity Services API
4. Create OAuth 2.0 credentials (Web application):
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
5. Copy `Client ID` and `Client Secret` to `.env.local`

---

## Stripe Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Copy your **Secret Key** and **Publishable Key** to `.env.local`
3. For testing, use Stripe test cards: `4242 4242 4242 4242`

---

## Docker Deployment

### Build and Run with Docker Compose

```bash
# In project root
docker-compose up
```

This will start:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

### Production Deployment

#### Option 1: Railway (Recommended for Beginners)

1. Push code to GitHub
2. Go to [Railway.app](https://railway.app/)
3. Create new project, select GitHub repo
4. Add environment variables in dashboard
5. Deploy automatically on push

#### Option 2: Vercel (Frontend) + Render (Backend)

**Frontend (Vercel):**
```bash
npm install -g vercel
vercel
```

Set environment variable: `VITE_API_URL=https://your-api.com`

**Backend (Render):**
1. Push code to GitHub
2. Go to [Render.com](https://render.com/)
3. New Web Service → Connect GitHub
4. Set environment variables
5. Deploy

#### Option 3: AWS ECS + CloudFront

Use CloudFormation or AWS console to deploy Docker container.

#### Option 4: DigitalOcean App Platform

1. Connect GitHub repo
2. Set environment variables
3. Auto-deploy on push

---

## Environment Variables Reference

| Variable | Required | Example |
|----------|----------|---------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | `5000` |
| `FRONTEND_URL` | Yes | `https://app.codecouncil.ai` |
| `JWT_SECRET` | Yes | (use `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Yes | From Google Cloud |
| `GOOGLE_CLIENT_SECRET` | Yes | From Google Cloud |
| `GOOGLE_CALLBACK_URL` | Yes | `https://api.codecouncil.ai/api/auth/google/callback` |
| `GEMINI_API_KEY` | Yes | From Google AI Studio |
| `STRIPE_SECRET_KEY` | Yes | From Stripe Dashboard |

---

## API Endpoints

### Authentication
- `POST /api/auth/google` – Sign in with Google ID token
- `POST /api/auth/refresh` – Refresh JWT token
- `GET /api/auth/me` – Get current user info

### Billing
- `GET /api/billing/plans` – List available plans
- `GET /api/billing/usage` – Get user credits
- `POST /api/billing/process-transaction` – Deduct credits
- `POST /api/billing/upgrade-to-unlimited` – Enable BYOK mode

### Gemini Proxy
- `POST /api/gemini/analyze` – Proxy request to Gemini API
- `GET /api/gemini/models` – List available models

---

## Scaling & Monitoring

1. **Rate Limiting:** Use `express-rate-limit` on API routes
2. **Error Tracking:** Integrate Sentry for production errors
3. **Monitoring:** Use CloudWatch / Datadog for logs
4. **Database:** Migrate from mock store to PostgreSQL + Prisma
5. **Caching:** Add Redis for session/token caching
6. **CDN:** CloudFront for frontend assets

---

## Production Checklist

- [ ] All environment variables set securely
- [ ] JWT_SECRET is strong and unique
- [ ] CORS is limited to your domain
- [ ] HTTPS enforced (all endpoints)
- [ ] Error logging to external service
- [ ] Rate limits in place
- [ ] Database backups enabled
- [ ] API keys rotated periodically
- [ ] Webhooks for Stripe/Google validated
- [ ] GDPR/LGPD privacy policy live
- [ ] Terms of Service published

---

## Troubleshooting

**500 Error on /api/auth/google:**
- Check GOOGLE_CLIENT_ID matches frontend
- Verify JWT_SECRET is set

**Gemini API errors:**
- Confirm GEMINI_API_KEY is valid
- Check API quota in Google AI Studio

**CORS errors:**
- Ensure FRONTEND_URL in .env matches your frontend domain
- Verify Origin header is allowed

---

## Next Steps

1. Replace mock billing with Stripe integration (webhooks, invoicing)
2. Add PostgreSQL database for persistent storage
3. Implement email notifications (SendGrid/Mailgun)
4. Add admin dashboard for user management
5. Set up CI/CD pipeline (GitHub Actions)
6. Implement two-factor authentication

Good luck with launch! 🚀
